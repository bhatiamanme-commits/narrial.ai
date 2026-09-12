import { randomUUID } from 'node:crypto';

import { VideoAnalysisError, type ParsedVideoReference, type VideoAnalysis } from './domain.js';
import type { VideoAnalysisJobRecord, VideoAnalysisQuota, VideoAnalysisRepository, VideoReferenceRecord } from './ports.js';

const RETENTION_MS = 30 * 24 * 60 * 60 * 1_000;

export class InMemoryVideoAnalysisRepository implements VideoAnalysisRepository {
  private readonly references = new Map<string, VideoReferenceRecord>();
  private readonly jobs = new Map<string, VideoAnalysisJobRecord>();

  create(ownerId: string, input: ParsedVideoReference, quota: VideoAnalysisQuota): Promise<{ reference: VideoReferenceRecord; job: VideoAnalysisJobRecord; created: boolean }> {
    const now = new Date();
    const existingReference = [...this.references.values()].find((reference) =>
      reference.ownerId === ownerId && reference.provider === input.provider &&
      reference.providerVideoId === input.providerVideoId && reference.expiresAt > now,
    );
    if (existingReference) {
      const existingJob = [...this.jobs.values()].find((job) => job.referenceId === existingReference.id && job.ownerId === ownerId);
      if (existingJob) return Promise.resolve({ reference: structuredClone(existingReference), job: structuredClone(existingJob), created: false });
    }
    const recentJobCount = [...this.jobs.values()].filter(
      (job) => job.ownerId === ownerId && job.createdAt >= quota.createdAfter,
    ).length;
    if (recentJobCount >= quota.maxJobsPerHour) {
      throw new VideoAnalysisError('VIDEO_ANALYSIS_RATE_LIMITED', 'The hourly video analysis limit has been reached. Please try again later.');
    }
    const globalRecentJobCount = [...this.jobs.values()].filter(
      (job) => job.createdAt >= quota.createdAfter,
    ).length;
    if (globalRecentJobCount >= quota.globalMaxJobsPerHour) {
      throw new VideoAnalysisError('VIDEO_ANALYSIS_CAPACITY_LIMITED', 'Video analysis is temporarily at capacity. Please try again later.');
    }
    const reference = { ...input, id: randomUUID(), ownerId, createdAt: now, expiresAt: new Date(now.getTime() + RETENTION_MS) };
    const job: VideoAnalysisJobRecord = {
      id: randomUUID(), ownerId, referenceId: reference.id, status: 'QUEUED', progress: 0,
      stage: 'Queued for analysis', attemptCount: 0, createdAt: now, updatedAt: now,
    };
    this.references.set(reference.id, reference);
    this.jobs.set(job.id, job);
    return Promise.resolve({ reference, job, created: true });
  }

  findJobForUser(jobId: string, ownerId: string) {
    const job = this.jobs.get(jobId);
    const reference = job ? this.references.get(job.referenceId) : undefined;
    return Promise.resolve(job?.ownerId === ownerId && reference?.ownerId === ownerId && reference.expiresAt > new Date() ? structuredClone(job) : null);
  }

  claim(jobId: string, ownerId: string, staleBefore: Date) {
    const job = this.jobs.get(jobId);
    const reference = job ? this.references.get(job.referenceId) : undefined;
    const stale = job?.status === 'ANALYZING' && job.claimedAt && job.claimedAt < staleBefore;
    if (!job || job.ownerId !== ownerId || !reference || reference.ownerId !== ownerId || reference.expiresAt <= new Date() || (job.status !== 'QUEUED' && !stale) || job.attemptCount >= 3) return Promise.resolve(null);
    const now = new Date();
    Object.assign(job, { status: 'ANALYZING', progress: 30, stage: 'Understanding scenes and audio', attemptCount: job.attemptCount + 1, claimedAt: now, claimToken: randomUUID(), updatedAt: now });
    return Promise.resolve(structuredClone(job));
  }

  complete(jobId: string, ownerId: string, claimToken: string, analysis: VideoAnalysis) {
    const job = this.jobs.get(jobId);
    const reference = job ? this.references.get(job.referenceId) : undefined;
    if (!job || job.ownerId !== ownerId || !reference || reference.expiresAt <= new Date() || job.status !== 'ANALYZING' || job.claimToken !== claimToken) throw new Error('VIDEO_ANALYSIS_CONCURRENCY_CONFLICT');
    Object.assign(job, { status: 'COMPLETE', progress: 100, stage: 'Analysis complete', analysis, claimToken: undefined, updatedAt: new Date() });
    return Promise.resolve();
  }

  fail(jobId: string, ownerId: string, claimToken: string, errorCode: string) {
    const job = this.jobs.get(jobId);
    if (job?.ownerId === ownerId && job.status === 'ANALYZING' && job.claimToken === claimToken) Object.assign(job, { status: 'FAILED', progress: 100, stage: 'Analysis failed', errorCode, claimToken: undefined, updatedAt: new Date() });
    return Promise.resolve();
  }

  retry(jobId: string, ownerId: string) {
    const job = this.jobs.get(jobId);
    const reference = job ? this.references.get(job.referenceId) : undefined;
    if (!job || job.ownerId !== ownerId || !reference || reference.expiresAt <= new Date() || job.status !== 'FAILED' || job.attemptCount >= 3) return Promise.resolve(null);
    delete job.errorCode;
    Object.assign(job, { status: 'QUEUED', progress: 0, stage: 'Queued for analysis', claimToken: undefined, updatedAt: new Date() });
    return Promise.resolve(structuredClone(job));
  }

  deleteReference(referenceId: string, ownerId: string) {
    const reference = this.references.get(referenceId);
    if (!reference || reference.ownerId !== ownerId) return Promise.resolve(false);
    this.references.delete(referenceId);
    for (const [id, job] of this.jobs) if (job.referenceId === referenceId && job.ownerId === ownerId) this.jobs.delete(id);
    return Promise.resolve(true);
  }

  findReferenceForUser(referenceId: string, ownerId: string) {
    const reference = this.references.get(referenceId);
    return Promise.resolve(reference?.ownerId === ownerId && reference.expiresAt > new Date() ? structuredClone(reference) : null);
  }

  findRecoverable(staleBefore: Date, limit: number) {
    return Promise.resolve([...this.jobs.values()]
      .filter((job) => {
        const reference = this.references.get(job.referenceId);
        return Boolean(
          reference && reference.expiresAt > new Date() && job.attemptCount < 3 &&
          (job.status === 'QUEUED' || (job.status === 'ANALYZING' && Boolean(job.claimedAt && job.claimedAt < staleBefore))),
        );
      })
      .slice(0, limit)
      .map(({ id, ownerId }) => ({ id, ownerId })));
  }

  purgeExpired(now: Date) {
    const expiredIds = [...this.references.values()]
      .filter((reference) => reference.expiresAt <= now)
      .map((reference) => reference.id);
    for (const referenceId of expiredIds) {
      this.references.delete(referenceId);
      for (const [jobId, job] of this.jobs) {
        if (job.referenceId === referenceId) this.jobs.delete(jobId);
      }
    }
    return Promise.resolve(expiredIds.length);
  }
}
