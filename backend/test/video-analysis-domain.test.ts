import { describe, expect, it } from 'vitest';

import { parseVideoReferenceUrl, parseVideoAnalysis } from '../src/video-analysis/domain.js';

describe('video reference URL parsing', () => {
  it.each([
    ['https://youtu.be/dQw4w9WgXcQ', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'],
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=12', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'],
    ['https://youtube.com/shorts/dQw4w9WgXcQ', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'],
  ])('canonicalizes %s', (input, canonicalUrl) => {
    expect(parseVideoReferenceUrl(input)).toEqual({
      provider: 'YOUTUBE',
      providerVideoId: 'dQw4w9WgXcQ',
      canonicalUrl,
      title: 'YouTube video',
      thumbnailUrl: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    });
  });

  it.each([
    'http://youtu.be/dQw4w9WgXcQ',
    'https://user:pass@youtu.be/dQw4w9WgXcQ',
    'https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ',
    'https://www.youtube.com/watch?v=bad',
    'https://vimeo.com/1234',
  ])('rejects unsafe or unsupported URL %s', (input) => {
    expect(() => parseVideoReferenceUrl(input)).toThrowError(/supported public YouTube URL/i);
  });
});

describe('video analysis output validation', () => {
  it('accepts a bounded structured analysis', () => {
    const result = parseVideoAnalysis({
      summary: 'A creator demonstrates a compact camera.',
      durationSeconds: 45,
      language: 'en',
      subjects: [{ label: 'Creator', description: 'Presents the product.' }],
      scenes: [{ startSeconds: 0, endSeconds: 4, description: 'Close-up hook.' }],
      creativeDNA: {
        openingHook: 'Immediate product close-up',
        narrativeStructure: 'Hook, demonstration, result',
        pacing: 'Fast',
        visualStyle: ['High contrast'],
        colorMood: ['Warm'],
        editingPatterns: ['Jump cuts'],
        audioStyle: 'Upbeat voice-over',
      },
      reusableInsights: ['Show the result in the opening seconds.'],
      safetyFlags: [],
    });

    expect(result.schemaVersion).toBe(1);
    expect(result.scenes[0]?.startSeconds).toBe(0);
  });

  it('rejects malformed or temporally impossible model output', () => {
    expect(() => parseVideoAnalysis({ summary: 'Incomplete' })).toThrowError(/invalid analysis/i);
    expect(() => parseVideoAnalysis({
      summary: 'Bad scene', durationSeconds: 3, subjects: [],
      scenes: [{ startSeconds: 2, endSeconds: 1, description: 'Impossible' }],
      creativeDNA: { openingHook: '', narrativeStructure: '', pacing: '', visualStyle: [], colorMood: [], editingPatterns: [], audioStyle: '' },
      reusableInsights: [], safetyFlags: [],
    })).toThrowError(/invalid analysis/i);
  });
});
