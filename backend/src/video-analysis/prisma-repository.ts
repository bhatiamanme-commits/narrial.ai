import { randomUUID } from 'node:crypto';

import { Prisma, type PrismaClient } from '../generated/prisma/client.js';
import { parseVideoAnalysis, type ParsedVideoReference, type VideoAnalysis } from './domain.js';
import type { VideoAnalysisJobRecord, VideoAnalysisRepository, VideoReferenceRecord } from './ports.js';

const RETENTION_MS = 30 * 24 * 60 * 60 * 1_000;

export class PrismaVideoAnalysisRepository implements VideoAnalysisRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(ownerId: string, input: ParsedVideoReference) {
    const now = new Date();
    const referenceId = randomUUID();
    const jobId = randomUUID();
    await this.prisma.$transaction(async (tx) => {
      await tx.videoReference.create({ data: {
        id: referenceId, narrialUserId: ownerId, provider: input.provider,
        providerVideoId: input.providerVideoId, canonicalUrl: input.canonicalUrl,
        title: input.title, thumbnailUrl: input.thumbnailUrl,
        expiresAt: new Date(now.getTime() + RETENTION_MS),
      } });
      await tx.videoAnalysisJob.create({ data: {
        id: jobId, narrialUserId: ownerId, referenceId, status: 'QUEUED', progress: 0,
        stage: 'Queued for analysis', createdAt: now, updatedAt: now,
      } });
    });
    const reference: VideoReferenceRecord = { ...input, id: referenceId, ownerId, createdAt: now };
    const job: VideoAnalysisJobRecord = {
      id: jobId, ownerId, referenceId, status: 'QUEUED', progress: 0, stage: 'Queued for analysis',
      attemptCount: 0, createdAt: now, updatedAt: now,
    };
    return { reference, job };
  }

  async findReferenceForUser(referenceId: string, ownerId: string) {
    const record = await this.prisma.videoReference.findFirst({ where: { id: referenceId, narrialUserId: ownerId } });
    return record ? {
      id: record.id, ownerId: record.narrialUserId, provider: record.provider,
      providerVideoId: record.providerVideoId, canonicalUrl: record.canonicalUrl,
      title: record.title, thumbnailUrl: record.thumbnailUrl, createdAt: record.createdAt,
    } : null;
  }

  async findJobForUser(jobId: string, ownerId: string) {
    const record = await this.prisma.videoAnalysisJob.findFirst({
      where: { id: jobId, narrialUserId: ownerId }, include: { result: true },
    });
    if (!record) return null;
    return this.toJob(record);
  }

  async claim(jobId: string, ownerId: string) {
    const now = new Date();
    const result = await this.prisma.videoAnalysisJob.updateMany({
      where: { id: jobId, narrialUserId: ownerId, status: 'QUEUED', attemptCount: { lt: 3 } },
      data: { status: 'ANALYZING', progress: 30, stage: 'Understanding scenes and audio', claimedAt: now, attemptCount: { increment: 1 } },
    });
    return result.count === 1 ? this.findJobForUser(jobId, ownerId) : null;
  }

  async complete(jobId: string, ownerId: string, analysis: VideoAnalysis) {
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.videoAnalysisJob.updateMany({
        where: { id: jobId, narrialUserId: ownerId, status: 'ANALYZING' },
        data: { status: 'COMPLETE', progress: 100, stage: 'Analysis complete', errorCode: null },
      });
      if (updated.count !== 1) throw new Error('VIDEO_ANALYSIS_CONCURRENCY_CONFLICT');
      await tx.videoAnalysisResult.create({ data: {
        id: randomUUID(), narrialUserId: ownerId, jobId, schemaVersion: analysis.schemaVersion,
        promptVersion: 'video-analysis-v1', analyzer: 'gemini',
        analysis: analysis as unknown as Prisma.InputJsonValue,
        expiresAt: new Date(now.getTime() + RETENTION_MS),
      } });
    });
  }

  async fail(jobId: string, ownerId: string, errorCode: string) {
    await this.prisma.videoAnalysisJob.updateMany({
      where: { id: jobId, narrialUserId: ownerId, status: 'ANALYZING' },
      data: { status: 'FAILED', progress: 100, stage: 'Analysis failed', errorCode },
    });
  }

  async retry(jobId: string, ownerId: string) {
    const updated = await this.prisma.videoAnalysisJob.updateMany({
      where: { id: jobId, narrialUserId: ownerId, status: 'FAILED', attemptCount: { lt: 3 } },
      data: { status: 'QUEUED', progress: 0, stage: 'Queued for analysis', errorCode: null, claimedAt: null },
    });
    return updated.count === 1 ? this.findJobForUser(jobId, ownerId) : null;
  }

  async deleteReference(referenceId: string, ownerId: string) {
    const result = await this.prisma.videoReference.deleteMany({ where: { id: referenceId, narrialUserId: ownerId } });
    return result.count === 1;
  }

  private toJob(record: NonNullable<Awaited<ReturnType<PrismaClient['videoAnalysisJob']['findFirst']>>> & { result?: { analysis: Prisma.JsonValue } | null }): VideoAnalysisJobRecord {
    const job: VideoAnalysisJobRecord = {
      id: record.id, ownerId: record.narrialUserId, referenceId: record.referenceId,
      status: record.status, progress: record.progress, stage: record.stage,
      attemptCount: record.attemptCount, createdAt: record.createdAt, updatedAt: record.updatedAt,
    };
    if (record.errorCode) job.errorCode = record.errorCode;
    if (record.result) job.analysis = parseVideoAnalysis(record.result.analysis);
    return job;
  }
}
