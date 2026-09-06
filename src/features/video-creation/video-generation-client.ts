export type RemoteVideoGenerationJob = {
  id: string;
  projectId: string;
  status: 'STARTING' | 'GENERATING' | 'COMPLETE' | 'FAILED';
  progress: number;
  stage: string;
  playbackPath?: string;
  errorCode?: string;
  updatedAt: string;
};

type ApiInput = { apiUrl: string; clerkToken: string; fetch?: typeof fetch };
function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
function requestBase(input: ApiInput) {
  if (!input.apiUrl || !input.clerkToken) throw new Error('Video generation is not configured.');
  return { apiUrl: input.apiUrl.replace(/\/$/, ''), fetcher: input.fetch ?? fetch };
}
async function apiError(response: Response) {
  try { const body = await response.json() as { error?: { message?: unknown } }; if (typeof body.error?.message === 'string') return new Error(body.error.message); } catch { /* stable fallback */ }
  return new Error('Video generation request failed.');
}
function parseJob(value: unknown): RemoteVideoGenerationJob {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.projectId !== 'string' || !['STARTING', 'GENERATING', 'COMPLETE', 'FAILED'].includes(String(value.status)) || typeof value.progress !== 'number' || value.progress < 0 || value.progress > 100 || typeof value.stage !== 'string' || typeof value.updatedAt !== 'string' || (value.playbackPath !== undefined && (typeof value.playbackPath !== 'string' || !value.playbackPath.startsWith('/api/v1/video-generation-jobs/')))) throw new Error('Video generation response is invalid.');
  return value as unknown as RemoteVideoGenerationJob;
}
function headers(token: string) { return { authorization: `Bearer ${token}`, 'content-type': 'application/json' }; }

export async function startVideoGeneration(input: ApiInput & { projectId: string; prompt: string; aspectRatio: '9:16' | '16:9' }) {
  const { apiUrl, fetcher } = requestBase(input);
  const response = await fetcher(`${apiUrl}/api/v1/video-generation-jobs`, { method: 'POST', headers: headers(input.clerkToken), body: JSON.stringify({ projectId: input.projectId, prompt: input.prompt, aspectRatio: input.aspectRatio }) });
  if (!response.ok) throw await apiError(response);
  const body: unknown = await response.json();
  return parseJob(isRecord(body) ? body.data : undefined);
}

export async function getVideoGenerationJob(input: ApiInput & { jobId: string }) {
  const { apiUrl, fetcher } = requestBase(input);
  const response = await fetcher(`${apiUrl}/api/v1/video-generation-jobs/${encodeURIComponent(input.jobId)}`, { headers: headers(input.clerkToken) });
  if (!response.ok) throw await apiError(response);
  const body: unknown = await response.json();
  return parseJob(isRecord(body) ? body.data : undefined);
}

export async function downloadGeneratedVideo(input: ApiInput & { playbackPath: string }): Promise<string> {
  const { apiUrl, fetcher } = requestBase(input);
  if (!input.playbackPath.startsWith('/api/v1/video-generation-jobs/')) throw new Error('Generated video location is invalid.');
  const response = await fetcher(`${apiUrl}${input.playbackPath}`, { headers: { authorization: `Bearer ${input.clerkToken}` } });
  if (!response.ok || !response.headers.get('content-type')?.startsWith('video/')) throw await apiError(response);
  if (typeof URL.createObjectURL !== 'function') throw new Error('Generated video playback is not supported on this device yet.');
  return URL.createObjectURL(await response.blob());
}
