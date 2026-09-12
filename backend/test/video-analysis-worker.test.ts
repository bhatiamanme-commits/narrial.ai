import { describe, expect, it } from 'vitest';

import { parseVideoReferenceUrl } from '../src/video-analysis/domain.js';
import { InMemoryVideoAnalysisRepository } from '../src/video-analysis/in-memory-repository.js';
import { VideoAnalysisWorker } from '../src/video-analysis/worker.js';

const analysis = {
  schemaVersion: 1 as const, summary: 'Summary', durationSeconds: 10,
  subjects: [], scenes: [{ startSeconds: 0, endSeconds: 10, description: 'A scene' }],
  creativeDNA: { openingHook: 'Question', narrativeStructure: 'Payoff', pacing: 'Fast', visualStyle: [], colorMood: [], editingPatterns: [], audioStyle: 'Voice-over' },
  reusableInsights: [], safetyFlags: [],
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

function delayNextClaim(repository: InMemoryVideoAnalysisRepository) {
  const claimStarted = deferred<void>();
  const allowClaim = deferred<void>();
  const originalClaim = repository.claim.bind(repository);
  repository.claim = ((jobId: string, ownerId: string, staleBefore: Date) => {
    claimStarted.resolve();
    return allowClaim.promise.then(() => originalClaim(jobId, ownerId, staleBefore));
  }) as typeof repository.claim;

  return {
    waitForClaimStart: () => claimStarted.promise,
    releaseClaim: () => allowClaim.resolve(),
  };
}

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

describe('VideoAnalysisWorker', () => {
  it('claims a queued analysis atomically and does not call the analyzer twice', async () => {
    const repository = new InMemoryVideoAnalysisRepository();
    const created = await repository.create('owner-a', parseVideoReferenceUrl('https://youtu.be/dQw4w9WgXcQ'), { maxJobsPerHour: 10, globalMaxJobsPerHour: 100, createdAfter: new Date(0) });
    let calls = 0;
    const worker = new VideoAnalysisWorker(repository, { analyze: () => { calls += 1; return Promise.resolve(analysis); } });

    await Promise.all([worker.run(created.job.id, 'owner-a'), worker.run(created.job.id, 'owner-a')]);

    expect(calls).toBe(1);
    expect(await repository.findJobForUser(created.job.id, 'owner-a')).toMatchObject({ status: 'COMPLETE', analysis });
  });

  it('returns no recoverable work after a job completes', async () => {
    const repository = new InMemoryVideoAnalysisRepository();
    const created = await repository.create('owner-a', parseVideoReferenceUrl('https://youtu.be/dQw4w9WgXcQ'), { maxJobsPerHour: 10, globalMaxJobsPerHour: 100, createdAfter: new Date(0) });
    const worker = new VideoAnalysisWorker(repository, { analyze: () => Promise.resolve(analysis) });
    await worker.run(created.job.id, 'owner-a');

    expect(await worker.recover()).toBe(0);
  });

  it('bounds concurrent provider calls and drains durable work through recovery sweeps', async () => {
    const repository = new InMemoryVideoAnalysisRepository();
    const quota = { maxJobsPerHour: 10, globalMaxJobsPerHour: 100, createdAfter: new Date(0) };
    const jobs = await Promise.all([
      repository.create('owner-a', parseVideoReferenceUrl('https://youtu.be/dQw4w9WgXcQ'), quota),
      repository.create('owner-a', parseVideoReferenceUrl('https://youtu.be/9bZkp7q19f0'), quota),
    ]);
    const first = deferred<typeof analysis>();
    let calls = 0;
    const worker = new VideoAnalysisWorker(repository, {
      analyze: () => {
        calls += 1;
        return calls === 1 ? first.promise : Promise.resolve(analysis);
      },
    }, undefined, { maxConcurrentJobs: 1 });

    worker.runSoon(jobs[0].job.id, 'owner-a');
    worker.runSoon(jobs[1].job.id, 'owner-a');
    await waitFor(() => expect(calls).toBe(1));
    first.resolve(analysis);
    await waitFor(() => expect(calls).toBe(2));

    const recoveredRepository = new InMemoryVideoAnalysisRepository();
    const recoveredJobs = await Promise.all([
      recoveredRepository.create('owner-a', parseVideoReferenceUrl('https://youtu.be/dQw4w9WgXcQ'), quota),
      recoveredRepository.create('owner-a', parseVideoReferenceUrl('https://youtu.be/9bZkp7q19f0'), quota),
      recoveredRepository.create('owner-a', parseVideoReferenceUrl('https://youtu.be/3JZ_D3ELwOQ'), quota),
      recoveredRepository.create('owner-a', parseVideoReferenceUrl('https://youtu.be/L_jWHffIx5E'), quota),
    ]);
    const recoveryWorker = new VideoAnalysisWorker(recoveredRepository, { analyze: () => Promise.resolve(analysis) }, undefined, { maxConcurrentJobs: 1 });
    for (let completed = 1; completed <= recoveredJobs.length; completed += 1) {
      await recoveryWorker.recover(1);
      await waitFor(async () => {
        const statuses = await Promise.all(recoveredJobs.map(({ job }) => recoveredRepository.findJobForUser(job.id, 'owner-a')));
        expect(statuses.filter((job) => job?.status === 'COMPLETE')).toHaveLength(completed);
      });
    }
  });

  it('fails an active job before shutdown aborts its provider request', async () => {
    const repository = new InMemoryVideoAnalysisRepository();
    const created = await repository.create('owner-a', parseVideoReferenceUrl('https://youtu.be/dQw4w9WgXcQ'), { maxJobsPerHour: 10, globalMaxJobsPerHour: 100, createdAfter: new Date(0) });
    const worker = new VideoAnalysisWorker(repository, {
      analyze: (_reference, signal) => new Promise((_, reject) => {
        signal?.addEventListener('abort', () => reject(new Error('aborted')), { once: true });
      }),
    });

    worker.runSoon(created.job.id, 'owner-a');
    await waitFor(async () => {
      expect(await repository.findJobForUser(created.job.id, 'owner-a')).toMatchObject({ status: 'ANALYZING' });
    });
    await worker.stop();

    expect(await repository.findJobForUser(created.job.id, 'owner-a')).toMatchObject({
      status: 'FAILED', errorCode: 'WORKER_SHUTDOWN',
    });
  });

  it('waits for an in-flight claim during shutdown and finalizes the claimed job', async () => {
    const repository = new InMemoryVideoAnalysisRepository();
    const delayedClaim = delayNextClaim(repository);
    const created = await repository.create('owner-a', parseVideoReferenceUrl('https://youtu.be/dQw4w9WgXcQ'), { maxJobsPerHour: 10, globalMaxJobsPerHour: 100, createdAfter: new Date(0) });
    let analyzerCalls = 0;
    const worker = new VideoAnalysisWorker(repository, {
      analyze: () => {
        analyzerCalls += 1;
        return Promise.resolve(analysis);
      },
    });

    worker.runSoon(created.job.id, 'owner-a');
    await delayedClaim.waitForClaimStart();

    const stopping = worker.stop();
    try {
      const outcome = await Promise.race([
        stopping.then(() => 'stopped' as const),
        new Promise<'waiting'>((resolve) => setTimeout(() => resolve('waiting'), 10)),
      ]);
      expect(outcome).toBe('waiting');
    } finally {
      delayedClaim.releaseClaim();
      await stopping;
    }

    expect(analyzerCalls).toBe(0);
    expect(await repository.findJobForUser(created.job.id, 'owner-a')).toMatchObject({
      status: 'FAILED', errorCode: 'WORKER_SHUTDOWN',
    });
  });
});
