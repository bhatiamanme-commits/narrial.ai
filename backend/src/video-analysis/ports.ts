import type { ParsedVideoReference, VideoAnalysis, VideoAnalysisJobStatus } from './domain.js';

export interface VideoReferenceRecord extends ParsedVideoReference {
  id: string;
  ownerId: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface VideoAnalysisQuota {
  maxJobsPerHour: number;
  globalMaxJobsPerHour: number;
  createdAfter: Date;
}

export interface VideoAnalysisJobRecord {
  id: string;
  ownerId: string;
  referenceId: string;
  status: VideoAnalysisJobStatus;
  progress: number;
  stage: string;
  attemptCount: number;
  analysis?: VideoAnalysis;
  errorCode?: string;
  claimedAt?: Date;
  claimToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoAnalysisRepository {
  create(ownerId: string, reference: ParsedVideoReference, quota: VideoAnalysisQuota): Promise<{ reference: VideoReferenceRecord; job: VideoAnalysisJobRecord; created: boolean }>;
  findReferenceForUser(referenceId: string, ownerId: string): Promise<VideoReferenceRecord | null>;
  findJobForUser(jobId: string, ownerId: string): Promise<VideoAnalysisJobRecord | null>;
  claim(jobId: string, ownerId: string, staleBefore: Date): Promise<VideoAnalysisJobRecord | null>;
  complete(jobId: string, ownerId: string, claimToken: string, analysis: VideoAnalysis): Promise<void>;
  fail(jobId: string, ownerId: string, claimToken: string, errorCode: string): Promise<void>;
  retry(jobId: string, ownerId: string): Promise<VideoAnalysisJobRecord | null>;
  deleteReference(referenceId: string, ownerId: string): Promise<boolean>;
  findRecoverable(staleBefore: Date, limit: number): Promise<Array<{ id: string; ownerId: string }>>;
  purgeExpired(now: Date): Promise<number>;
}

export interface VideoAnalyzer {
  analyze(reference: ParsedVideoReference, signal?: AbortSignal): Promise<VideoAnalysis>;
}
