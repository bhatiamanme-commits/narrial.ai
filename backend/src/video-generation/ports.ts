import type { VideoAspectRatio, VideoGenerationJob } from './domain.js';

export interface VideoGenerator {
  start(input: { prompt: string; aspectRatio: VideoAspectRatio }): Promise<{ operationName: string }>;
  get(operationName: string): Promise<{ status: 'GENERATING' } | { status: 'COMPLETE'; videoUri: string } | { status: 'FAILED'; errorCode: string }>;
  download(videoUri: string): Promise<Response>;
}

export interface VideoGenerationRepository {
  createStarting(ownerId: string, input: { projectId: string; prompt: string; aspectRatio: VideoAspectRatio }): Promise<{ job: VideoGenerationJob; created: boolean }>;
  attachOperation(jobId: string, ownerId: string, operationName: string): Promise<VideoGenerationJob>;
  findForUser(jobId: string, ownerId: string): Promise<VideoGenerationJob | null>;
  complete(jobId: string, ownerId: string, videoUri: string): Promise<VideoGenerationJob>;
  fail(jobId: string, ownerId: string, errorCode: string): Promise<VideoGenerationJob>;
}
