import { randomUUID } from 'node:crypto';

import { Prisma, type PrismaClient } from '../generated/prisma/client.js';
import { parseVideoAnalysis, VideoAnalysisError, type ParsedVideoReference, type VideoAnalysis } from './domain.js';
import type { VideoAnalysisJobRecord, VideoAnalysisQuota, VideoAnalysisRepository } from './ports.js';

const RETENTION_MS = 30 * 24 * 60 * 60 * 1_000;

export class PrismaVideoAnalysisRepository implements VideoAnalysisRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(ownerId: string, input: ParsedVideoReference, quota: VideoAnalysisQuota) {
    const now = new Date();
    const reservation = await this.prisma.$transaction(async (tx) => {
      // The global lock bounds total provider cost; the owner lock preserves a fair per-user limit.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${'video-analysis-global-quota'}))`;
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${ownerId}))`;
      const existingReference = await tx.videoReference.findFirst({
        where: {
          narrialUserId: ownerId,
          provider: input.provider,
          providerVideoId: input.providerVideoId,
          expiresAt: { gt: now },
        },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });
      if (existingReference) {
        const existingJob = await tx.videoAnalysisJob.findFirst({
          where: { referenceId: existingReference.id, narrialUserId: ownerId },
          orderBy: { createdAt: 'desc' },
          select: { id: true, status: true, attemptCount: true },
        });
        const retryBudgetExhausted = existingJob?.status === 'FAILED' && existingJob.attemptCount >= 3;
        if (existingJob && !retryBudgetExhausted) {
          return { referenceId: existingReference.id, jobId: existingJob.id, created: false };
        }
      }
      const recentlyCreated = await tx.videoAnalysisJob.count({
        where: { narrialUserId: ownerId, createdAt: { gte: quota.createdAfter } },
      });
      if (recentlyCreated >= quota.maxJobsPerHour) {
        throw new VideoAnalysisError('VIDEO_ANALYSIS_RATE_LIMITED', 'The hourly video analysis limit has been reached. Please try again later.');
      }
      const globalRecentJobCount = await tx.videoAnalysisJob.count({
        where: { createdAt: { gte: quota.createdAfter } },
      });
      if (globalRecentJobCount >= quota.globalMaxJobsPerHour) {
        throw new VideoAnalysisError('VIDEO_ANALYSIS_CAPACITY_LIMITED', 'Video analysis is temporarily at capacity. Please try again later.');
      }
      const referenceId = existingReference?.id ?? randomUUID();
      const jobId = randomUUID();
      if (!existingReference) {
        await tx.videoReference.create({ data: {
          id: referenceId, narrialUserId: ownerId, provider: input.provider,
          providerVideoId: input.providerVideoId, canonicalUrl: input.canonicalUrl,
          title: input.title, thumbnailUrl: input.thumbnailUrl,
          expiresAt: new Date(now.getTime() + RETENTION_MS),
        } });
      }
      await tx.videoAnalysisJob.create({ data: {
        id: jobId, narrialUserId: ownerId, referenceId, status: 'QUEUED', progress: 0,
        stage: 'Queued for analysis', createdAt: now, updatedAt: now,
      } });
      return { referenceId, jobId, created: true };
    }, { maxWait: 5_000, timeout: 10_000 });
    const [reference, job] = await Promise.all([
      this.findReferenceForUser(reservation.referenceId, ownerId),
      this.findJobForUser(reservation.jobId, ownerId),
    ]);
    if (!reference || !job) throw new Error('VIDEO_ANALYSIS_RESERVATION_NOT_FOUND');
    return { reference, job, created: reservation.created };
  }

  async findReferenceForUser(referenceId: string, ownerId: string) {
    const record = await this.prisma.videoReference.findFirst({
      where: { id: referenceId, narrialUserId: ownerId, expiresAt: { gt: new Date() } },
    });
    return record ? {
      id: record.id, ownerId: record.narrialUserId, provider: record.provider,
      providerVideoId: record.providerVideoId, canonicalUrl: record.canonicalUrl,
      title: record.title, thumbnailUrl: record.thumbnailUrl, createdAt: record.createdAt, expiresAt: record.expiresAt,
    } : null;
  }

  async findJobForUser(jobId: string, ownerId: string) {
    const record = await this.prisma.videoAnalysisJob.findFirst({
      where: { id: jobId, narrialUserId: ownerId, reference: { expiresAt: { gt: new Date() } } }, include: { result: true },
    });
    if (!record) return null;
    return this.toJob(record);
  }

  async claim(jobId: string, ownerId: string, staleBefore: Date) {
    const now = new Date();
    const claimToken = randomUUID();
    const result = await this.prisma.videoAnalysisJob.updateMany({
      where: {
        id: jobId,
        narrialUserId: ownerId,
        reference: { expiresAt: { gt: now } },
        attemptCount: { lt: 3 },
        OR: [
          { status: 'QUEUED' },
          { status: 'ANALYZING', claimedAt: { lt: staleBefore } },
        ],
      },
      data: { status: 'ANALYZING', progress: 30, stage: 'Understanding scenes and audio', claimedAt: now, claimToken, attemptCount: { increment: 1 } },
    });
    return result.count === 1 ? this.findJobForUser(jobId, ownerId) : null;
  }

  async complete(jobId: string, ownerId: string, claimToken: string, analysis: VideoAnalysis) {
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.videoAnalysisJob.updateMany({
        where: { id: jobId, narrialUserId: ownerId, status: 'ANALYZING', claimToken, reference: { expiresAt: { gt: now } } },
        data: { status: 'COMPLETE', progress: 100, stage: 'Analysis complete', errorCode: null, claimToken: null },
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

  async fail(jobId: string, ownerId: string, claimToken: string, errorCode: string) {
    await this.prisma.videoAnalysisJob.updateMany({
      where: { id: jobId, narrialUserId: ownerId, status: 'ANALYZING', claimToken },
      data: { status: 'FAILED', progress: 100, stage: 'Analysis failed', errorCode, claimToken: null },
    });
  }

  async retry(jobId: string, ownerId: string) {
    const updated = await this.prisma.videoAnalysisJob.updateMany({
      where: { id: jobId, narrialUserId: ownerId, status: 'FAILED', attemptCount: { lt: 3 }, reference: { expiresAt: { gt: new Date() } } },
      data: { status: 'QUEUED', progress: 0, stage: 'Queued for analysis', errorCode: null, claimedAt: null, claimToken: null },
    });
    return updated.count === 1 ? this.findJobForUser(jobId, ownerId) : null;
  }

  async deleteReference(referenceId: string, ownerId: string) {
    const result = await this.prisma.videoReference.deleteMany({ where: { id: referenceId, narrialUserId: ownerId } });
    return result.count === 1;
  }

  async findRecoverable(staleBefore: Date, limit: number) {
    const records = await this.prisma.videoAnalysisJob.findMany({
      where: {
        attemptCount: { lt: 3 },
        reference: { expiresAt: { gt: new Date() } },
        OR: [{ status: 'QUEUED' }, { status: 'ANALYZING', claimedAt: { lt: staleBefore } }],
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
      select: { id: true, narrialUserId: true },
    });
    return records.map(({ id, narrialUserId }) => ({ id, ownerId: narrialUserId }));
  }

  async purgeExpired(now: Date) {
    const deleted = await this.prisma.videoReference.deleteMany({ where: { expiresAt: { lte: now } } });
    return deleted.count;
  }

  private toJob(record: NonNullable<Awaited<ReturnType<PrismaClient['videoAnalysisJob']['findFirst']>>> & { result?: { analysis: Prisma.JsonValue } | null }): VideoAnalysisJobRecord {
    const job: VideoAnalysisJobRecord = {
      id: record.id, ownerId: record.narrialUserId, referenceId: record.referenceId,
      status: record.status, progress: record.progress, stage: record.stage,
      attemptCount: record.attemptCount, createdAt: record.createdAt, updatedAt: record.updatedAt,
    };
    if (record.errorCode) job.errorCode = record.errorCode;
    if (record.claimedAt) job.claimedAt = record.claimedAt;
    if (record.claimToken) job.claimToken = record.claimToken;
    if (record.result) job.analysis = parseVideoAnalysis(record.result.analysis);
    return job;
  }
}
