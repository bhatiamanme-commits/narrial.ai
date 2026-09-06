import { describe, expect, it, vi } from 'vitest';

import { GeminiVideoGenerator } from '../src/video-generation/gemini-video-generator.js';

describe('GeminiVideoGenerator', () => {
  it('starts an authenticated Veo long-running operation with bounded controls', async () => {
    const fetcher = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      void input;
      void init;
      return Promise.resolve(new Response(JSON.stringify({ name: 'operations/video-123' })));
    });
    const provider = new GeminiVideoGenerator({ apiKey: 'server-secret', model: 'veo-3.1-fast-generate-preview', timeoutMs: 5_000 }, fetcher);

    await expect(provider.start({ prompt: 'An original cinematic product reveal', aspectRatio: '9:16' })).resolves.toEqual({ operationName: 'operations/video-123' });
    expect(fetcher).toHaveBeenCalledOnce();
    expect(fetcher.mock.calls[0]?.[0]).toBe('https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-fast-generate-preview:predictLongRunning');
    expect(fetcher.mock.calls[0]?.[1]?.method).toBe('POST');
    expect(new Headers(fetcher.mock.calls[0]?.[1]?.headers).get('x-goog-api-key')).toBe('server-secret');
    const requestBody: unknown = fetcher.mock.calls[0]?.[1]?.body;
    expect(typeof requestBody).toBe('string');
    const body = JSON.parse(requestBody as string) as { instances: unknown; parameters: unknown };
    expect(body.instances).toEqual([{ prompt: 'An original cinematic product reveal' }]);
    expect(body.parameters).toMatchObject({ aspectRatio: '9:16', durationSeconds: 8, numberOfVideos: 1, resolution: '720p' });
  });

  it('parses pending, completed, and failed provider operations without trusting malformed output', async () => {
    const fetcher = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ name: 'operations/video-123', done: false })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ done: true, response: { generateVideoResponse: { generatedSamples: [{ video: { uri: 'https://generativelanguage.googleapis.com/v1beta/files/video-1:download' } }] } } })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ done: true, error: { code: 13, message: 'provider detail' } })));
    const provider = new GeminiVideoGenerator({ apiKey: 'server-secret', model: 'veo-3.1-fast-generate-preview', timeoutMs: 5_000 }, fetcher);

    await expect(provider.get('operations/video-123')).resolves.toEqual({ status: 'GENERATING' });
    await expect(provider.get('operations/video-123')).resolves.toEqual({ status: 'COMPLETE', videoUri: 'https://generativelanguage.googleapis.com/v1beta/files/video-1:download' });
    await expect(provider.get('operations/video-123')).resolves.toEqual({ status: 'FAILED', errorCode: 'VIDEO_GENERATION_PROVIDER_FAILED' });
  });
});
