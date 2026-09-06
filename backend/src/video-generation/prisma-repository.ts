import { randomUUID } from 'node:crypto';

import { Prisma, type PrismaClient } from '../generated/prisma/client.js';
import type { VideoAspectRatio, VideoGenerationJob } from './domain.js';
import type { VideoGenerationRepository } from './ports.js';

const RETENTION_MS = 48 * 60 * 60 * 1_000;

export class PrismaVideoGenerationRepository implements VideoGenerationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async createStarting(ownerId: string, input: { projectId: string; prompt: string; aspectRatio: VideoAspectRatio }) {
    const now = new Date();
    try {
      const record = await this.prisma.videoGenerationJob.create({ data: { id: randomUUID(), narrialUserId: ownerId, ...input, stage: 'Starting video generation', expiresAt: new Date(now.getTime() + RETENTION_MS) } });
      return { job: this.toJob(record), created: true };
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') throw error;
      const existing = await this.prisma.videoGenerationJob.findUnique({ where: { narrialUserId_projectId: { narrialUserId: ownerId, projectId: input.projectId } } });
      if (!existing) throw error;
      return { job: this.toJob(existing), created: false };
    }
  }

  async attachOperation(jobId: string, ownerId: string, operationName: string) { return this.update(jobId, ownerId, { providerOperationName: operationName, status: 'GENERATING', progress: 15, stage: 'Generating original video' }); }
  async findForUser(jobId: string, ownerId: string) { const record = await this.prisma.videoGenerationJob.findFirst({ where: { id: jobId, narrialUserId: ownerId } }); return record ? this.toJob(record) : null; }
  async complete(jobId: string, ownerId: string, videoUri: string) { return this.update(jobId, ownerId, { videoUri, status: 'COMPLETE', progress: 100, stage: 'Video ready', errorCode: null }); }
  async fail(jobId: string, ownerId: string, errorCode: string) { return this.update(jobId, ownerId, { errorCode, status: 'FAILED', progress: 100, stage: 'Video generation failed' }); }

  private async update(jobId: string, ownerId: string, data: Parameters<PrismaClient['videoGenerationJob']['updateMany']>[0]['data']) {
    const updated = await this.prisma.videoGenerationJob.updateMany({ where: { id: jobId, narrialUserId: ownerId }, data });
    if (updated.count !== 1) throw new Error('VIDEO_GENERATION_JOB_NOT_FOUND');
    const record = await this.prisma.videoGenerationJob.findUniqueOrThrow({ where: { id: jobId } });
    return this.toJob(record);
  }

  private toJob(record: NonNullable<Awaited<ReturnType<PrismaClient['videoGenerationJob']['findFirst']>>>): VideoGenerationJob {
    return { id: record.id, ownerId: record.narrialUserId, projectId: record.projectId, prompt: record.prompt, aspectRatio: record.aspectRatio as VideoAspectRatio, status: record.status, progress: record.progress, stage: record.stage, ...(record.providerOperationName ? { providerOperationName: record.providerOperationName } : {}), ...(record.videoUri ? { videoUri: record.videoUri } : {}), ...(record.errorCode ? { errorCode: record.errorCode } : {}), createdAt: record.createdAt, updatedAt: record.updatedAt };
  }
}
