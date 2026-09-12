import { randomUUID } from 'node:crypto';

import { Prisma, type PrismaClient } from '../generated/prisma/client.js';
import { parseGeneratedStory, parseStoryBrief, ScriptGenerationError, type GeneratedStory } from './domain.js';
import type { CreateScriptGenerationJobInput, ScriptGenerationJobRecord, ScriptGenerationQuota, ScriptGenerationRepository } from './ports.js';

const RETENTION_MS = 30 * 24 * 60 * 60 * 1_000;

type JobWithResult = Prisma.ScriptGenerationJobGetPayload<{ include: { result: true } }>;

export class PrismaScriptGenerationRepository implements ScriptGenerationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: CreateScriptGenerationJobInput, quota: ScriptGenerationQuota) {
    return this.prisma.$transaction(async (transaction) => {
      // The global lock bounds total provider cost; the owner lock preserves a fair per-user limit.
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'script-generation-global-quota'}))`;
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${input.ownerId}))`;

      const existing = await transaction.scriptGenerationJob.findFirst({
        where: {
          narrialUserId: input.ownerId,
          idempotencyKey: input.idempotencyKey,
          analysisJob: { reference: { expiresAt: { gt: new Date() } } },
        },
        include: { result: true },
      });
      if (existing) {
        if (existing.requestFingerprint !== input.requestFingerprint) {
          throw new ScriptGenerationError('IDEMPOTENCY_KEY_REUSED', 'The idempotency key was already used for different input.');
        }
        return { job: this.toJob(existing), created: false };
      }

      const recentlyCreated = await transaction.scriptGenerationJob.count({
        where: { narrialUserId: input.ownerId, createdAt: { gte: quota.createdAfter } },
      });
      if (recentlyCreated >= quota.maxJobsPerHour) {
        throw new ScriptGenerationError('SCRIPT_GENERATION_RATE_LIMITED', 'The hourly script generation limit has been reached. Please try again later.');
      }
      const globalRecentJobCount = await transaction.scriptGenerationJob.count({
        where: { createdAt: { gte: quota.createdAfter } },
      });
      if (globalRecentJobCount >= quota.globalMaxJobsPerHour) {
        throw new ScriptGenerationError('SCRIPT_GENERATION_CAPACITY_LIMITED', 'Script generation is temporarily at capacity. Please try again later.');
      }

      const now = new Date();
      const record = await transaction.scriptGenerationJob.create({
        data: {
          id: randomUUID(), narrialUserId: input.ownerId, analysisJobId: input.analysisJobId,
          idempotencyKey: input.idempotencyKey, requestFingerprint: input.requestFingerprint,
          prompt: input.brief.prompt, questionAnswers: input.brief.questionAnswers as unknown as Prisma.InputJsonValue,
          status: 'QUEUED', progress: 0, stage: 'Queued for script generation', createdAt: now, updatedAt: now,
        },
        include: { result: true },
      });
      return { job: this.toJob(record), created: true };
    }, { maxWait: 5_000, timeout: 10_000 });
  }

  async findJobForUser(jobId: string, ownerId: string) {
    const record = await this.prisma.scriptGenerationJob.findFirst({
      where: { id: jobId, narrialUserId: ownerId, analysisJob: { reference: { expiresAt: { gt: new Date() } } } },
      include: { result: true },
    });
    return record ? this.toJob(record) : null;
  }

  async findJobByIdempotencyKeyForUser(idempotencyKey: string, ownerId: string) {
    const record = await this.prisma.scriptGenerationJob.findFirst({
      where: {
        narrialUserId: ownerId,
        idempotencyKey,
        analysisJob: { reference: { expiresAt: { gt: new Date() } } },
      },
      include: { result: true },
    });
    return record ? this.toJob(record) : null;
  }

  async claim(jobId: string, ownerId: string, staleBefore: Date) {
    const now = new Date();
    const claimToken = randomUUID();
    const updated = await this.prisma.scriptGenerationJob.updateMany({
      where: {
        id: jobId,
        narrialUserId: ownerId,
        analysisJob: { reference: { expiresAt: { gt: now } } },
        attemptCount: { lt: 3 },
        OR: [
          { status: 'QUEUED' },
          { status: 'GENERATING', claimedAt: { lt: staleBefore } },
        ],
      },
      data: {
        status: 'GENERATING',
        progress: 50,
        stage: 'Writing scene-by-scene script',
        claimedAt: now,
        claimToken,
        attemptCount: { increment: 1 },
      },
    });
    return updated.count === 1 ? this.findJobForUser(jobId, ownerId) : null;
  }

  async complete(jobId: string, ownerId: string, claimToken: string, story: GeneratedStory, durationSeconds: number) {
    const now = new Date();
    await this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.scriptGenerationJob.updateMany({
        where: { id: jobId, narrialUserId: ownerId, status: 'GENERATING', claimToken, analysisJob: { reference: { expiresAt: { gt: now } } } },
        data: { status: 'COMPLETE', progress: 100, stage: 'Script complete', errorCode: null, claimToken: null },
      });
      if (updated.count !== 1) throw new Error('SCRIPT_GENERATION_CONCURRENCY_CONFLICT');
      await transaction.scriptGenerationResult.create({
        data: {
          id: randomUUID(), narrialUserId: ownerId, jobId, schemaVersion: story.schemaVersion,
          promptVersion: 'story-generation-v1', planner: 'gemini', durationSeconds,
          story: story as unknown as Prisma.InputJsonValue,
          expiresAt: new Date(now.getTime() + RETENTION_MS),
        },
      });
    });
  }

  async fail(jobId: string, ownerId: string, claimToken: string, errorCode: string) {
    await this.prisma.scriptGenerationJob.updateMany({
      where: { id: jobId, narrialUserId: ownerId, status: 'GENERATING', claimToken },
      data: { status: 'FAILED', progress: 100, stage: 'Script generation failed', errorCode, claimToken: null },
    });
  }

  async retry(jobId: string, ownerId: string) {
    const updated = await this.prisma.scriptGenerationJob.updateMany({
      where: { id: jobId, narrialUserId: ownerId, status: 'FAILED', attemptCount: { lt: 3 }, analysisJob: { reference: { expiresAt: { gt: new Date() } } } },
      data: {
        status: 'QUEUED', progress: 0, stage: 'Queued for script generation',
        errorCode: null, claimedAt: null, claimToken: null,
      },
    });
    return updated.count === 1 ? this.findJobForUser(jobId, ownerId) : null;
  }

  async findRecoverable(staleBefore: Date, limit: number) {
    const records = await this.prisma.scriptGenerationJob.findMany({
      where: {
        attemptCount: { lt: 3 },
        analysisJob: { reference: { expiresAt: { gt: new Date() } } },
        OR: [{ status: 'QUEUED' }, { status: 'GENERATING', claimedAt: { lt: staleBefore } }],
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
      select: { id: true, narrialUserId: true },
    });
    return records.map(({ id, narrialUserId }) => ({ id, ownerId: narrialUserId }));
  }

  private toJob(record: JobWithResult): ScriptGenerationJobRecord {
    const job: ScriptGenerationJobRecord = {
      id: record.id,
      ownerId: record.narrialUserId,
      analysisJobId: record.analysisJobId,
      brief: parseStoryBrief({ prompt: record.prompt, questionAnswers: record.questionAnswers }),
      idempotencyKey: record.idempotencyKey,
      requestFingerprint: record.requestFingerprint,
      status: record.status,
      progress: record.progress,
      stage: record.stage,
      attemptCount: record.attemptCount,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
    if (record.errorCode) job.errorCode = record.errorCode;
    if (record.claimedAt) job.claimedAt = record.claimedAt;
    if (record.claimToken) job.claimToken = record.claimToken;
    if (record.result) job.story = parseGeneratedStory(record.result.story, record.result.durationSeconds);
    return job;
  }
}
