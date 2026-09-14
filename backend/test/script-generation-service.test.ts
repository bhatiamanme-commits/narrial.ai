import { createHash } from 'node:crypto';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { InMemoryScriptGenerationRepository } from '../src/story-generation/in-memory-repository.js';
import { ScriptGenerationService } from '../src/story-generation/service.js';
import { ScriptGenerationWorker } from '../src/story-generation/worker.js';
import { parseVideoReferenceUrl } from '../src/video-analysis/domain.js';
import { InMemoryVideoAnalysisRepository } from '../src/video-analysis/in-memory-repository.js';

const analysis = {
  schemaVersion: 1 as const,
  summary: 'A short transformation story.',
  durationSeconds: 10,
  subjects: [],
  scenes: [{ startSeconds: 0, endSeconds: 10, description: 'A scene.' }],
  creativeDNA: {
    openingHook: 'Begin with a mystery',
    narrativeStructure: 'Question then payoff',
    pacing: 'Fast',
    visualStyle: ['Close-up'],
    colorMood: ['Warm'],
    editingPatterns: ['Hard cut'],
    audioStyle: 'Voice-over',
  },
  reusableInsights: ['Open with unanswered tension.'],
  safetyFlags: [],
};

const story = {
  schemaVersion: 1 as const,
  title: 'A new beginning',
  hook: 'What if one small choice changed everything?',
  story: 'An original story.',
  scenes: [
    { startSeconds: 0, endSeconds: 5, purpose: 'Hook', narration: 'Look closer.', visual: 'A closed door.', emotion: 'Curiosity' },
    { startSeconds: 5, endSeconds: 10, purpose: 'Payoff', narration: 'Take the first step.', visual: 'The door opens.', emotion: 'Hope' },
  ],
  ending: 'Start today.',
  originalityNote: 'Uses only abstract pacing patterns.',
};

const workers: ScriptGenerationWorker[] = [];

afterEach(async () => Promise.all(workers.splice(0).map((worker) => worker.stop())));

async function waitFor(assertion: () => void | Promise<void>, timeoutMs = 250) {
  const deadline = Date.now() + timeoutMs;
  let lastError: unknown;
  while (Date.now() < deadline) {
    try {
      await assertion();
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 1));
    }
  }
  throw lastError;
}

async function setup(repository: InMemoryScriptGenerationRepository = new InMemoryScriptGenerationRepository()) {
  const videos = new InMemoryVideoAnalysisRepository();
  const video = await videos.create(
    'owner-a',
    parseVideoReferenceUrl('https://youtu.be/dQw4w9WgXcQ'),
    { maxJobsPerHour: 10, globalMaxJobsPerHour: 100, createdAfter: new Date(0) },
  );
  const claimed = await videos.claim(video.job.id, 'owner-a', new Date(Date.now() - 20 * 60 * 1_000));
  await videos.complete(video.job.id, 'owner-a', claimed!.claimToken!, analysis);
  const worker = new ScriptGenerationWorker(repository, videos, { generate: () => Promise.resolve(story) });
  workers.push(worker);
  const service = new ScriptGenerationService(repository, videos, worker, 10, 100, true);
  return { analysisJobId: video.job.id, repository, service, videos, worker };
}

function requestFingerprint(analysisJobId: string, brief: { prompt: string; questionAnswers: { question: string; answer: string }[] }) {
  return createHash('sha256').update(JSON.stringify({ analysisJobId, brief })).digest('hex');
}

async function seedQueuedJob(repository: InMemoryScriptGenerationRepository, analysisJobId: string) {
  const brief = { prompt: 'Create an original story.', questionAnswers: [{ question: 'Audience?', answer: 'Consumers' }] };
  const idempotencyKey = 'd20eadf8-fec1-47bc-ac1b-79fb5506e202';
  const created = await repository.create({
    ownerId: 'owner-a',
    analysisJobId,
    brief,
    idempotencyKey,
    requestFingerprint: requestFingerprint(analysisJobId, brief),
  }, { maxJobsPerHour: 10, globalMaxJobsPerHour: 100, createdAfter: new Date(0) });
  return { brief, idempotencyKey, jobId: created.job.id };
}

class CreateRaceRepository extends InMemoryScriptGenerationRepository {
  private skipFirstLookup = true;

  override findJobByIdempotencyKeyForUser(idempotencyKey: string, ownerId: string) {
    if (this.skipFirstLookup) {
      this.skipFirstLookup = false;
      return Promise.resolve(null);
    }
    return super.findJobByIdempotencyKeyForUser(idempotencyKey, ownerId);
  }

}

describe('ScriptGenerationService queue recovery', () => {
  it('wakes an existing queued job when an idempotent submission is replayed', async () => {
    const { analysisJobId, repository, service } = await setup();
    const request = await seedQueuedJob(repository, analysisJobId);

    const replayed = await service.submit('owner-a', analysisJobId, request.brief, request.idempotencyKey);

    expect(replayed.id).toBe(request.jobId);
    await waitFor(async () => {
      expect(await repository.findJobForUser(request.jobId, 'owner-a')).toMatchObject({ status: 'COMPLETE' });
    });
  });

  it('wakes a queued job returned by a concurrent create', async () => {
    const repository = new CreateRaceRepository();
    const { analysisJobId, service } = await setup(repository);
    const request = await seedQueuedJob(repository, analysisJobId);

    const replayed = await service.submit('owner-a', analysisJobId, request.brief, request.idempotencyKey);

    expect(replayed.id).toBe(request.jobId);
    await waitFor(async () => {
      expect(await repository.findJobForUser(request.jobId, 'owner-a')).toMatchObject({ status: 'COMPLETE' });
    });
  });

  it('wakes a queued job while its client polls for status', async () => {
    const { analysisJobId, repository, service } = await setup();
    const request = await seedQueuedJob(repository, analysisJobId);

    expect(await service.getJob('owner-a', request.jobId)).toMatchObject({ status: 'QUEUED' });
    await waitFor(async () => {
      expect(await repository.findJobForUser(request.jobId, 'owner-a')).toMatchObject({ status: 'COMPLETE' });
    });
  });

  it('does not bypass the script-generation kill switch while polling', async () => {
    const { analysisJobId, repository, videos, worker } = await setup();
    const request = await seedQueuedJob(repository, analysisJobId);
    const runSoon = vi.spyOn(worker, 'runSoon');
    const disabledService = new ScriptGenerationService(repository, videos, worker, 10, 100, false);

    expect(await disabledService.getJob('owner-a', request.jobId)).toMatchObject({ status: 'QUEUED' });
    expect(runSoon).not.toHaveBeenCalled();
  });
});
