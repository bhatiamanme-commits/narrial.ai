import { randomUUID } from 'node:crypto';

import type { ParsedVideoReference, VideoAnalysis } from './domain.js';
import type { VideoAnalysisJobRecord, VideoAnalysisRepository, VideoReferenceRecord } from './ports.js';

export class InMemoryVideoAnalysisRepository implements VideoAnalysisRepository {
  private readonly references = new Map<string, VideoReferenceRecord>();
  private readonly jobs = new Map<string, VideoAnalysisJobRecord>();

  create(ownerId: string, input: ParsedVideoReference): Promise<{ reference: VideoReferenceRecord; job: VideoAnalysisJobRecord }> {
    const now = new Date();
    const reference = { ...input, id: randomUUID(), ownerId, createdAt: now };
    const job: VideoAnalysisJobRecord = {
      id: randomUUID(), ownerId, referenceId: reference.id, status: 'QUEUED', progress: 0,
      stage: 'Queued for analysis', attemptCount: 0, createdAt: now, updatedAt: now,
    };
    this.references.set(reference.id, reference);
    this.jobs.set(job.id, job);
    return Promise.resolve({ reference, job });
  }

  findJobForUser(jobId: string, ownerId: string) {
    const job = this.jobs.get(jobId);
    return Promise.resolve(job?.ownerId === ownerId ? structuredClone(job) : null);
  }

  claim(jobId: string, ownerId: string) {
    const job = this.jobs.get(jobId);
    if (!job || job.ownerId !== ownerId || job.status !== 'QUEUED') return Promise.resolve(null);
    Object.assign(job, { status: 'ANALYZING', progress: 30, stage: 'Understanding scenes and audio', attemptCount: job.attemptCount + 1, updatedAt: new Date() });
    return Promise.resolve(structuredClone(job));
  }

  complete(jobId: string, ownerId: string, analysis: VideoAnalysis) {
    const job = this.jobs.get(jobId);
    if (job?.ownerId === ownerId) Object.assign(job, { status: 'COMPLETE', progress: 100, stage: 'Analysis complete', analysis, updatedAt: new Date() });
    return Promise.resolve();
  }

  fail(jobId: string, ownerId: string, errorCode: string) {
    const job = this.jobs.get(jobId);
    if (job?.ownerId === ownerId) Object.assign(job, { status: 'FAILED', progress: 100, stage: 'Analysis failed', errorCode, updatedAt: new Date() });
    return Promise.resolve();
  }

  retry(jobId: string, ownerId: string) {
    const job = this.jobs.get(jobId);
    if (!job || job.ownerId !== ownerId || job.status !== 'FAILED' || job.attemptCount >= 3) return Promise.resolve(null);
    delete job.errorCode;
    Object.assign(job, { status: 'QUEUED', progress: 0, stage: 'Queued for analysis', updatedAt: new Date() });
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
    return Promise.resolve(reference?.ownerId === ownerId ? structuredClone(reference) : null);
  }
}
