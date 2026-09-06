import { randomUUID } from 'node:crypto';

import type { VideoAspectRatio, VideoGenerationJob } from './domain.js';
import type { VideoGenerationRepository } from './ports.js';

export class InMemoryVideoGenerationRepository implements VideoGenerationRepository {
  private readonly jobs = new Map<string, VideoGenerationJob>();

  createStarting(ownerId: string, input: { projectId: string; prompt: string; aspectRatio: VideoAspectRatio }) {
    const existing = [...this.jobs.values()].find((job) => job.ownerId === ownerId && job.projectId === input.projectId);
    if (existing) return Promise.resolve({ job: existing, created: false });
    const now = new Date();
    const job: VideoGenerationJob = { id: randomUUID(), ownerId, ...input, status: 'STARTING', progress: 5, stage: 'Starting video generation', createdAt: now, updatedAt: now };
    this.jobs.set(job.id, job);
    return Promise.resolve({ job, created: true });
  }

  attachOperation(jobId: string, ownerId: string, operationName: string) { return Promise.resolve(this.update(jobId, ownerId, { providerOperationName: operationName, status: 'GENERATING', progress: 15, stage: 'Generating original video' })); }
  findForUser(jobId: string, ownerId: string) { const job = this.jobs.get(jobId); return Promise.resolve(job?.ownerId === ownerId ? job : null); }
  complete(jobId: string, ownerId: string, videoUri: string) { return Promise.resolve(this.update(jobId, ownerId, { videoUri, status: 'COMPLETE', progress: 100, stage: 'Video ready' })); }
  fail(jobId: string, ownerId: string, errorCode: string) { return Promise.resolve(this.update(jobId, ownerId, { errorCode, status: 'FAILED', progress: 100, stage: 'Video generation failed' })); }

  private update(jobId: string, ownerId: string, value: Partial<VideoGenerationJob>) {
    const current = this.jobs.get(jobId);
    if (!current || current.ownerId !== ownerId) throw new Error('VIDEO_GENERATION_JOB_NOT_FOUND');
    const next = { ...current, ...value, updatedAt: new Date() };
    this.jobs.set(jobId, next);
    return next;
  }
}
