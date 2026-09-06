import { VideoGenerationError, type VideoAspectRatio } from './domain.js';
import type { VideoGenerator } from './ports.js';

interface GeminiVideoGeneratorConfig { apiKey: string; model: string; timeoutMs: number }
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
function generatedVideoUri(value: unknown): string | null {
  if (!isRecord(value) || !isRecord(value.response) || !isRecord(value.response.generateVideoResponse)) return null;
  const samples = value.response.generateVideoResponse.generatedSamples;
  if (!Array.isArray(samples) || !isRecord(samples[0]) || !isRecord(samples[0].video) || typeof samples[0].video.uri !== 'string') return null;
  try {
    const url = new URL(samples[0].video.uri);
    return url.protocol === 'https:' && (url.hostname === 'generativelanguage.googleapis.com' || url.hostname.endsWith('.googleapis.com')) ? url.toString() : null;
  } catch { return null; }
}

export class GeminiVideoGenerator implements VideoGenerator {
  constructor(private readonly config: GeminiVideoGeneratorConfig, private readonly fetcher: typeof fetch = fetch) {}

  async start(input: { prompt: string; aspectRatio: VideoAspectRatio }) {
    const value = await this.request(`${BASE_URL}/models/${encodeURIComponent(this.config.model)}:predictLongRunning`, {
      method: 'POST', body: JSON.stringify({ instances: [{ prompt: input.prompt }], parameters: { aspectRatio: input.aspectRatio, durationSeconds: 8, numberOfVideos: 1, resolution: '720p', personGeneration: 'allow_adult' } }),
    });
    if (!isRecord(value) || typeof value.name !== 'string' || !/^operations\/[A-Za-z0-9._/-]+$/.test(value.name)) throw new VideoGenerationError('INVALID_VIDEO_GENERATION_RESPONSE', 'The video provider returned an invalid operation.');
    return { operationName: value.name };
  }

  async get(operationName: string) {
    if (!/^operations\/[A-Za-z0-9._/-]+$/.test(operationName)) throw new VideoGenerationError('INVALID_VIDEO_GENERATION_OPERATION', 'The video operation is invalid.');
    const value = await this.request(`${BASE_URL}/${operationName}`, { method: 'GET' });
    if (!isRecord(value)) throw new VideoGenerationError('INVALID_VIDEO_GENERATION_RESPONSE', 'The video provider returned an invalid status.');
    if (value.done !== true) return { status: 'GENERATING' as const };
    if (isRecord(value.error)) return { status: 'FAILED' as const, errorCode: 'VIDEO_GENERATION_PROVIDER_FAILED' };
    const videoUri = generatedVideoUri(value);
    if (!videoUri) throw new VideoGenerationError('INVALID_VIDEO_GENERATION_RESPONSE', 'The completed video response is invalid.');
    return { status: 'COMPLETE' as const, videoUri };
  }

  async download(videoUri: string) {
    const safeUri = generatedVideoUri({ response: { generateVideoResponse: { generatedSamples: [{ video: { uri: videoUri } }] } } });
    if (!safeUri) throw new VideoGenerationError('INVALID_VIDEO_URI', 'The generated video location is invalid.');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
    try {
      const response = await this.fetcher(safeUri, { headers: { 'x-goog-api-key': this.config.apiKey }, redirect: 'follow', signal: controller.signal });
      const contentType = response.headers.get('content-type') ?? '';
      if (!response.ok || (!contentType.startsWith('video/') && !contentType.startsWith('application/octet-stream'))) throw new VideoGenerationError('VIDEO_DOWNLOAD_FAILED', 'The generated video could not be downloaded.');
      return response;
    } finally { clearTimeout(timeout); }
  }

  private async request(url: string, init: RequestInit): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);
    try {
      const response = await this.fetcher(url, { ...init, headers: { 'content-type': 'application/json', 'x-goog-api-key': this.config.apiKey }, signal: controller.signal });
      if (!response.ok) throw new VideoGenerationError('VIDEO_GENERATION_PROVIDER_UNAVAILABLE', 'The video provider is temporarily unavailable.');
      return await response.json() as unknown;
    } catch (error) {
      if (error instanceof VideoGenerationError) throw error;
      throw new VideoGenerationError('VIDEO_GENERATION_PROVIDER_UNAVAILABLE', 'The video provider is temporarily unavailable.');
    } finally { clearTimeout(timeout); }
  }
}
