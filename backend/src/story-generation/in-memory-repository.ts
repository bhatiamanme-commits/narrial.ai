import { randomUUID } from 'node:crypto';

import { ScriptGenerationError, type GeneratedStory } from './domain.js';
import type { CreateScriptGenerationJobInput, ScriptGenerationJobRecord, ScriptGenerationRepository, ScriptGenerationQuota } from './ports.js';

export class InMemoryScriptGenerationRepository implements ScriptGenerationRepository {
  private readonly jobs = new Map<string, ScriptGenerationJobRecord>();
  private readonly idempotencyIndex = new Map<string, string>();

  create(input: CreateScriptGenerationJobInput, quota: ScriptGenerationQuota): Promise<{ job: ScriptGenerationJobRecord; created: boolean }> {
    const indexKey = `${input.ownerId}:${input.idempotencyKey}`;
    const existingId = this.idempotencyIndex.get(indexKey);
    const existing = existingId ? this.jobs.get(existingId) : undefined;
    if (existing) {
      if (existing.requestFingerprint !== input.requestFingerprint) {
        throw new ScriptGenerationError('IDEMPOTENCY_KEY_REUSED', 'The idempotency key was already used for different input.');
      }
      return Promise.resolve({ job: structuredClone(existing), created: false });
    }

    const recentlyCreated = [...this.jobs.values()].filter(
      (job) => job.ownerId === input.ownerId && job.createdAt >= quota.createdAfter,
    ).length;
    if (recentlyCreated >= quota.maxJobsPerHour) {
      throw new ScriptGenerationError('SCRIPT_GENERATION_RATE_LIMITED', 'The hourly script generation limit has been reached. Please try again later.');
    }
    const globalRecentJobCount = [...this.jobs.values()].filter(
      (job) => job.createdAt >= quota.createdAfter,
    ).length;
    if (globalRecentJobCount >= quota.globalMaxJobsPerHour) {
      throw new ScriptGenerationError('SCRIPT_GENERATION_CAPACITY_LIMITED', 'Script generation is temporarily at capacity. Please try again later.');
    }

    const now = new Date();
    const job: ScriptGenerationJobRecord = {
      id: randomUUID(), ownerId: input.ownerId, analysisJobId: input.analysisJobId,
      brief: structuredClone(input.brief), idempotencyKey: input.idempotencyKey,
      requestFingerprint: input.requestFingerprint, status: 'QUEUED', progress: 0,
      stage: 'Queued for script generation', attemptCount: 0, createdAt: now, updatedAt: now,
    };
    this.jobs.set(job.id, job);
    this.idempotencyIndex.set(indexKey, job.id);
    return Promise.resolve({ job: structuredClone(job), created: true });
  }

  findJobForUser(jobId: string, ownerId: string) {
    const job = this.jobs.get(jobId);
    return Promise.resolve(job?.ownerId === ownerId ? structuredClone(job) : null);
  }

  findJobByIdempotencyKeyForUser(idempotencyKey: string, ownerId: string) {
    const id = this.idempotencyIndex.get(`${ownerId}:${idempotencyKey}`);
    const job = id ? this.jobs.get(id) : undefined;
    return Promise.resolve(job?.ownerId === ownerId ? structuredClone(job) : null);
  }

  claim(jobId: string, ownerId: string, staleBefore: Date) {
    const job = this.jobs.get(jobId);
    const stale = job?.status === 'GENERATING' && job.claimedAt && job.claimedAt < staleBefore;
    if (!job || job.ownerId !== ownerId || (job.status !== 'QUEUED' && !stale) || job.attemptCount >= 3) return Promise.resolve(null);
    const now = new Date();
    Object.assign(job, {
      status: 'GENERATING', progress: 50, stage: 'Writing scene-by-scene script',
      attemptCount: job.attemptCount + 1, claimedAt: now, claimToken: randomUUID(), updatedAt: now,
    });
    return Promise.resolve(structuredClone(job));
  }

  complete(jobId: string, ownerId: string, claimToken: string, story: GeneratedStory) {
    const job = this.jobs.get(jobId);
    if (!job || job.ownerId !== ownerId || job.status !== 'GENERATING' || job.claimToken !== claimToken) throw new Error('SCRIPT_GENERATION_CONCURRENCY_CONFLICT');
    Object.assign(job, { status: 'COMPLETE', progress: 100, stage: 'Script complete', story: structuredClone(story), claimToken: undefined, updatedAt: new Date() });
    delete job.errorCode;
    return Promise.resolve();
  }

  fail(jobId: string, ownerId: string, claimToken: string, errorCode: string) {
    const job = this.jobs.get(jobId);
    if (job?.ownerId === ownerId && job.status === 'GENERATING' && job.claimToken === claimToken) {
      Object.assign(job, { status: 'FAILED', progress: 100, stage: 'Script generation failed', errorCode, claimToken: undefined, updatedAt: new Date() });
    }
    return Promise.resolve();
  }

  retry(jobId: string, ownerId: string) {
    const job = this.jobs.get(jobId);
    if (!job || job.ownerId !== ownerId || job.status !== 'FAILED' || job.attemptCount >= 3) return Promise.resolve(null);
    Object.assign(job, { status: 'QUEUED', progress: 0, stage: 'Queued for script generation', claimedAt: undefined, claimToken: undefined, updatedAt: new Date() });
    delete job.errorCode;
    return Promise.resolve(structuredClone(job));
  }

  findRecoverable(staleBefore: Date, limit: number) {
    return Promise.resolve([...this.jobs.values()]
      .filter((job) => job.attemptCount < 3 && (job.status === 'QUEUED' || (job.status === 'GENERATING' && Boolean(job.claimedAt && job.claimedAt < staleBefore))))
      .slice(0, limit)
      .map(({ id, ownerId }) => ({ id, ownerId })));
  }
}
