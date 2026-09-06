export type VideoGenerationStatus = 'STARTING' | 'GENERATING' | 'COMPLETE' | 'FAILED';
export type VideoAspectRatio = '9:16' | '16:9';

export interface VideoGenerationJob {
  id: string;
  ownerId: string;
  projectId: string;
  prompt: string;
  aspectRatio: VideoAspectRatio;
  status: VideoGenerationStatus;
  progress: number;
  stage: string;
  providerOperationName?: string;
  videoUri?: string;
  errorCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class VideoGenerationError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = 'VideoGenerationError';
  }
}

export function parseGenerationInput(value: unknown): { projectId: string; prompt: string; aspectRatio: VideoAspectRatio } {
  if (!value || typeof value !== 'object') throw new VideoGenerationError('INVALID_VIDEO_GENERATION', 'Video generation input is invalid.');
  const input = value as Record<string, unknown>;
  const projectId = typeof input.projectId === 'string' ? input.projectId.trim() : '';
  const prompt = typeof input.prompt === 'string' ? input.prompt.trim() : '';
  const aspectRatio = input.aspectRatio;
  if (!projectId || projectId.length > 100 || prompt.length < 20 || prompt.length > 8_000 || !['9:16', '16:9'].includes(String(aspectRatio))) {
    throw new VideoGenerationError('INVALID_VIDEO_GENERATION', 'Video generation input is invalid.');
  }
  return { projectId, prompt, aspectRatio: aspectRatio as VideoAspectRatio };
}
