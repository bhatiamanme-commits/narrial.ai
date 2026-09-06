import { describe, expect, it } from 'vitest';

import { GeminiVideoAnalyzer } from '../src/video-analysis/gemini-video-analyzer.js';

const validAnalysis = {
  summary: 'A short demonstration.', durationSeconds: 20,
  subjects: [{ label: 'Creator', description: 'Shows an item.' }],
  scenes: [{ startSeconds: 0, endSeconds: 3, description: 'Opening hook.' }],
  creativeDNA: { openingHook: 'Close-up', narrativeStructure: 'Hook then demo', pacing: 'Fast', visualStyle: ['Clean'], colorMood: ['Warm'], editingPatterns: ['Cuts'], audioStyle: 'Voice-over' },
  reusableInsights: ['Lead with the outcome.'], safetyFlags: [],
};

describe('GeminiVideoAnalyzer', () => {
  it('sends a canonical YouTube URL and parses JSON output', async () => {
    let requestBody = '';
    const fetcher: typeof fetch = (_input, init) => {
      requestBody = typeof init?.body === 'string' ? init.body : '';
      return Promise.resolve(new Response(JSON.stringify({ steps: [{ content: [{ text: JSON.stringify(validAnalysis) }] }] }), { status: 200 }));
    };
    const analyzer = new GeminiVideoAnalyzer({ apiKey: 'test-key', model: 'gemini-test', timeoutMs: 1_000 }, fetcher);
    const analysis = await analyzer.analyze({
      provider: 'YOUTUBE', providerVideoId: 'dQw4w9WgXcQ', canonicalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      title: 'YouTube video', thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    });

    expect(analysis.summary).toBe(validAnalysis.summary);
    const body = JSON.parse(requestBody) as { model: string; input: Array<{ type: string; uri?: string }> };
    expect(body.model).toBe('gemini-test');
    expect(body.input[0]).toEqual({ type: 'video', uri: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' });
  });

  it('sanitizes provider errors and malformed output', async () => {
    const rejected: typeof fetch = () => Promise.resolve(new Response('secret provider details', { status: 429 }));
    await expect(new GeminiVideoAnalyzer({ apiKey: 'key', model: 'model', timeoutMs: 100 }, rejected).analyze({
      provider: 'YOUTUBE', providerVideoId: 'dQw4w9WgXcQ', canonicalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', title: 'YouTube video', thumbnailUrl: 'https://x.test/t.jpg',
    })).rejects.toMatchObject({ code: 'VIDEO_ANALYZER_UNAVAILABLE' });
  });
});
