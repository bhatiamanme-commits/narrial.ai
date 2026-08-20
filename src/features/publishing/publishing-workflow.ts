export type GeneratedVideoState = {
  userId: string;
  videoId: string;
  status: 'ready';
  reviewed: boolean;
};

const generatedVideoByUser = new Map<string, GeneratedVideoState>();

export function beginVideoGeneration(userId: string): void {
  generatedVideoByUser.delete(userId);
}

export function markGeneratedVideoReady(userId: string, videoId: string): void {
  if (!userId || !videoId) throw new Error('A user and generated video are required.');
  generatedVideoByUser.set(userId, { userId, videoId, status: 'ready', reviewed: false });
}

export function markGeneratedVideoReviewed(userId: string, videoId: string): void {
  const video = generatedVideoByUser.get(userId);
  if (!video || video.videoId !== videoId) throw new Error('Review a generated video before publishing.');
  generatedVideoByUser.set(userId, { ...video, reviewed: true });
}

export function getGeneratedVideo(userId: string): GeneratedVideoState | null {
  const video = generatedVideoByUser.get(userId);
  return video ? { ...video } : null;
}

export function getPublishableGeneratedVideo(userId: string): GeneratedVideoState | null {
  const video = getGeneratedVideo(userId);
  return video?.reviewed ? video : null;
}

export function canScheduleGeneratedVideo(userId: string, videoId: string, accountIds: string[]): boolean {
  const video = getPublishableGeneratedVideo(userId);
  return Boolean(video && video.videoId === videoId && accountIds.length);
}

export function clearGeneratedVideoState(userId: string): void {
  generatedVideoByUser.delete(userId);
}
