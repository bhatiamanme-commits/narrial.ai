import type { ParsedVideoReference, VideoAnalysis, VideoAnalysisJobStatus } from './domain.js';

export interface VideoReferenceRecord extends ParsedVideoReference {
  id: string;
  ownerId: string;
  createdAt: Date;
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
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoAnalysisRepository {
  create(ownerId: string, reference: ParsedVideoReference): Promise<{ reference: VideoReferenceRecord; job: VideoAnalysisJobRecord }>;
  findReferenceForUser(referenceId: string, ownerId: string): Promise<VideoReferenceRecord | null>;
  findJobForUser(jobId: string, ownerId: string): Promise<VideoAnalysisJobRecord | null>;
  claim(jobId: string, ownerId: string): Promise<VideoAnalysisJobRecord | null>;
  complete(jobId: string, ownerId: string, analysis: VideoAnalysis): Promise<void>;
  fail(jobId: string, ownerId: string, errorCode: string): Promise<void>;
  retry(jobId: string, ownerId: string): Promise<VideoAnalysisJobRecord | null>;
  deleteReference(referenceId: string, ownerId: string): Promise<boolean>;
}

export interface VideoAnalyzer {
  analyze(reference: ParsedVideoReference): Promise<VideoAnalysis>;
}
