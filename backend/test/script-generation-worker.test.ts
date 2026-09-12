import { describe, expect, it } from 'vitest';

import { InMemoryScriptGenerationRepository } from '../src/story-generation/in-memory-repository.js';
import { ScriptGenerationWorker } from '../src/story-generation/worker.js';
import { InMemoryVideoAnalysisRepository } from '../src/video-analysis/in-memory-repository.js';
import { parseVideoReferenceUrl } from '../src/video-analysis/domain.js';

const analysis = {
  schemaVersion: 1 as const, summary: 'Summary', durationSeconds: 10,
  subjects: [], scenes: [{ startSeconds: 0, endSeconds: 10, description: 'A scene' }],
  creativeDNA: { openingHook: 'Question', narrativeStructure: 'Payoff', pacing: 'Fast', visualStyle: [], colorMood: [], editingPatterns: [], audioStyle: 'Voice-over' },
  reusableInsights: [], safetyFlags: [],
};
const story = {
  schemaVersion: 1 as const, title: 'Title', hook: 'Hook', story: 'Story',
  scenes: [
    { startSeconds: 0, endSeconds: 5, purpose: 'Hook', narration: 'One', visual: 'One', emotion: 'Tension' },
    { startSeconds: 5, endSeconds: 10, purpose: 'Payoff', narration: 'Two', visual: 'Two', emotion: 'Relief' },
  ], ending: 'End', originalityNote: 'Original',
};

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

describe('ScriptGenerationWorker', () => {
  it('uses only an owner-scoped completed analysis and persists a validated result', async () => {
    const videos = new InMemoryVideoAnalysisRepository();
    const video = await videos.create('owner-a', parseVideoReferenceUrl('https://youtu.be/dQw4w9WgXcQ'), { maxJobsPerHour: 10, globalMaxJobsPerHour: 100, createdAfter: new Date(0) });
    const claimed = await videos.claim(video.job.id, 'owner-a', new Date(Date.now() - 20 * 60 * 1_000));
    await videos.complete(video.job.id, 'owner-a', claimed!.claimToken!, analysis);
    const scripts = new InMemoryScriptGenerationRepository();
    const created = await scripts.create({
      ownerId: 'owner-a', analysisJobId: video.job.id, idempotencyKey: 'key', requestFingerprint: 'fingerprint',
      brief: { prompt: 'New story', questionAnswers: [] },
    }, { maxJobsPerHour: 10, globalMaxJobsPerHour: 100, createdAfter: new Date(0) });
    const received: unknown[] = [];
    const worker = new ScriptGenerationWorker(scripts, videos, { generate: (input) => { received.push(input); return Promise.resolve(story); } });

    await worker.run(created.job.id, 'owner-a');

    expect(received).toEqual([{ analysis, prompt: 'New story', questionAnswers: [] }]);
    expect(await scripts.findJobForUser(created.job.id, 'owner-a')).toMatchObject({ status: 'COMPLETE', progress: 100, story });
    expect(await scripts.findJobForUser(created.job.id, 'owner-b')).toBeNull();
  });

  it('does not run an already claimed job twice', async () => {
    const videos = new InMemoryVideoAnalysisRepository();
    const scripts = new InMemoryScriptGenerationRepository();
    const created = await scripts.create({
      ownerId: 'owner-a', analysisJobId: 'missing', idempotencyKey: 'key', requestFingerprint: 'fingerprint',
      brief: { prompt: 'New story', questionAnswers: [] },
    }, { maxJobsPerHour: 10, globalMaxJobsPerHour: 100, createdAfter: new Date(0) });
    let calls = 0;
    const worker = new ScriptGenerationWorker(scripts, videos, { generate: () => { calls += 1; return Promise.resolve(story); } });
    await Promise.all([worker.run(created.job.id, 'owner-a'), worker.run(created.job.id, 'owner-a')]);
    expect(calls).toBe(0);
    expect(await scripts.findJobForUser(created.job.id, 'owner-a')).toMatchObject({ status: 'FAILED', errorCode: 'VIDEO_ANALYSIS_UNAVAILABLE' });
  });

  it('fails an active script before shutdown aborts its provider request', async () => {
    const videos = new InMemoryVideoAnalysisRepository();
    const video = await videos.create('owner-a', parseVideoReferenceUrl('https://youtu.be/dQw4w9WgXcQ'), { maxJobsPerHour: 10, globalMaxJobsPerHour: 100, createdAfter: new Date(0) });
    const claimed = await videos.claim(video.job.id, 'owner-a', new Date(Date.now() - 20 * 60 * 1_000));
    await videos.complete(video.job.id, 'owner-a', claimed!.claimToken!, analysis);
    const scripts = new InMemoryScriptGenerationRepository();
    const created = await scripts.create({
      ownerId: 'owner-a', analysisJobId: video.job.id, idempotencyKey: 'key', requestFingerprint: 'fingerprint',
      brief: { prompt: 'New story', questionAnswers: [] },
    }, { maxJobsPerHour: 10, globalMaxJobsPerHour: 100, createdAfter: new Date(0) });
    const worker = new ScriptGenerationWorker(scripts, videos, {
      generate: (_input, signal) => new Promise((_, reject) => {
        signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
      }),
    });

    worker.runSoon(created.job.id, 'owner-a');
    await waitFor(async () => {
      expect(await scripts.findJobForUser(created.job.id, 'owner-a')).toMatchObject({ status: 'GENERATING' });
    });
    await worker.stop();

    expect(await scripts.findJobForUser(created.job.id, 'owner-a')).toMatchObject({
      status: 'FAILED', errorCode: 'WORKER_SHUTDOWN',
    });
  });
});
