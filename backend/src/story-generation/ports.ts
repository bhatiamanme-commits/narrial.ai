import type { GeneratedStory, ScriptGenerationJobStatus, StoryBrief } from './domain.js';

export interface ScriptGenerationJobRecord {
  id: string;
  ownerId: string;
  analysisJobId: string;
  brief: StoryBrief;
  idempotencyKey: string;
  requestFingerprint: string;
  status: ScriptGenerationJobStatus;
  progress: number;
  stage: string;
  attemptCount: number;
  story?: GeneratedStory;
  errorCode?: string;
  claimedAt?: Date;
  claimToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateScriptGenerationJobInput {
  ownerId: string;
  analysisJobId: string;
  brief: StoryBrief;
  idempotencyKey: string;
  requestFingerprint: string;
}

export interface ScriptGenerationQuota {
  maxJobsPerHour: number;
  globalMaxJobsPerHour: number;
  createdAfter: Date;
}

export interface ScriptGenerationRepository {
  create(input: CreateScriptGenerationJobInput, quota: ScriptGenerationQuota): Promise<{ job: ScriptGenerationJobRecord; created: boolean }>;
  findJobForUser(jobId: string, ownerId: string): Promise<ScriptGenerationJobRecord | null>;
  findJobByIdempotencyKeyForUser(idempotencyKey: string, ownerId: string): Promise<ScriptGenerationJobRecord | null>;
  claim(jobId: string, ownerId: string, staleBefore: Date): Promise<ScriptGenerationJobRecord | null>;
  complete(jobId: string, ownerId: string, claimToken: string, story: GeneratedStory, durationSeconds: number): Promise<void>;
  fail(jobId: string, ownerId: string, claimToken: string, errorCode: string): Promise<void>;
  retry(jobId: string, ownerId: string): Promise<ScriptGenerationJobRecord | null>;
  findRecoverable(staleBefore: Date, limit: number): Promise<Array<{ id: string; ownerId: string }>>;
}
