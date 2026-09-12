import { randomUUID } from 'node:crypto';

import { PrismaPg } from '@prisma/adapter-pg';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaScriptGenerationRepository } from '../src/story-generation/prisma-repository.js';
import { ScriptGenerationError } from '../src/story-generation/domain.js';
import { parseVideoReferenceUrl, VideoAnalysisError } from '../src/video-analysis/domain.js';
import { PrismaVideoAnalysisRepository } from '../src/video-analysis/prisma-repository.js';

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const describeIntegration = process.env.RUN_DATABASE_INTEGRATION_TESTS === 'true' && testDatabaseUrl
  ? describe
  : describe.skip;

let controlClient: PrismaClient;
let firstClient: PrismaClient;
let secondClient: PrismaClient;
const testOwners: string[] = [];

function createClient() {
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: testDatabaseUrl! }) });
}

async function createCompletedAnalysis(ownerId: string) {
  const referenceId = randomUUID();
  const jobId = randomUUID();
  await controlClient.videoReference.create({ data: {
    id: referenceId,
    narrialUserId: ownerId,
    provider: 'YOUTUBE',
    providerVideoId: 'dQw4w9WgXcQ',
    canonicalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    title: 'Test video',
    thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    expiresAt: new Date(Date.now() + 60 * 60 * 1_000),
  } });
  await controlClient.videoAnalysisJob.create({ data: {
    id: jobId,
    narrialUserId: ownerId,
    referenceId,
    status: 'COMPLETE',
    progress: 100,
    stage: 'Analysis complete',
  } });
  return jobId;
}

describeIntegration('PostgreSQL AI-generation quota reservations', () => {
  beforeAll(async () => {
    controlClient = createClient();
    firstClient = createClient();
    secondClient = createClient();
    await controlClient.$queryRaw`SELECT 1`;
  });

  afterEach(async () => {
    await Promise.all(testOwners.splice(0).map((ownerId) =>
      controlClient.videoReference.deleteMany({ where: { narrialUserId: ownerId } }),
    ));
  });

  afterAll(async () => {
    await Promise.all([controlClient.$disconnect(), firstClient.$disconnect(), secondClient.$disconnect()]);
  });

  it('allows only one concurrent script reservation for an owner', async () => {
    const ownerId = `quota-integration-${randomUUID()}`;
    testOwners.push(ownerId);
    const analysisJobId = await createCompletedAnalysis(ownerId);
    const quota = { maxJobsPerHour: 1, globalMaxJobsPerHour: 100, createdAfter: new Date(Date.now() - 60 * 60 * 1_000) };
    const input = (idempotencyKey: string) => ({
      ownerId,
      analysisJobId,
      idempotencyKey,
      requestFingerprint: 'a'.repeat(64),
      brief: { prompt: 'Create a test story.', questionAnswers: [] },
    });
    const first = new PrismaScriptGenerationRepository(firstClient);
    const second = new PrismaScriptGenerationRepository(secondClient);

    const results = await Promise.allSettled([
      first.create(input(randomUUID()), quota),
      second.create(input(randomUUID()), quota),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.find((result): result is PromiseRejectedResult => result.status === 'rejected');
    expect(rejected?.reason).toBeInstanceOf(ScriptGenerationError);
    expect((rejected?.reason as ScriptGenerationError).code).toBe('SCRIPT_GENERATION_RATE_LIMITED');
  });

  it('allows only one concurrent video-analysis reservation for an owner', async () => {
    const ownerId = `quota-integration-${randomUUID()}`;
    testOwners.push(ownerId);
    const quota = { maxJobsPerHour: 1, globalMaxJobsPerHour: 100, createdAfter: new Date(Date.now() - 60 * 60 * 1_000) };
    const first = new PrismaVideoAnalysisRepository(firstClient);
    const second = new PrismaVideoAnalysisRepository(secondClient);

    const results = await Promise.allSettled([
      first.create(ownerId, parseVideoReferenceUrl('https://youtu.be/dQw4w9WgXcQ'), quota),
      second.create(ownerId, parseVideoReferenceUrl('https://youtu.be/9bZkp7q19f0'), quota),
    ]);

    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.find((result): result is PromiseRejectedResult => result.status === 'rejected');
    expect(rejected?.reason).toBeInstanceOf(VideoAnalysisError);
    expect((rejected?.reason as VideoAnalysisError).code).toBe('VIDEO_ANALYSIS_RATE_LIMITED');
  });
});
