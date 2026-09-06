import { describe, expect, it } from 'vitest';

import { InMemoryVideoGenerationRepository } from '../src/video-generation/in-memory-repository.js';
import { VideoGenerationService } from '../src/video-generation/service.js';
import type { VideoGenerator } from '../src/video-generation/ports.js';

describe('VideoGenerationService', () => {
  it('creates one billable provider operation per project intent and synchronizes completion', async () => {
    let starts = 0;
    const provider: VideoGenerator = {
      start: () => { starts += 1; return Promise.resolve({ operationName: 'operations/one' }); },
      get: () => Promise.resolve({ status: 'COMPLETE', videoUri: 'https://generativelanguage.googleapis.com/v1beta/files/one:download' }),
      download: () => Promise.resolve(new Response(new Uint8Array([1, 2, 3]), { headers: { 'content-type': 'video/mp4' } })),
    };
    const repository = new InMemoryVideoGenerationRepository();
    const service = new VideoGenerationService(repository, provider);
    const input = { projectId: 'project-1', prompt: 'Create an original product story with a strong visual hook.', aspectRatio: '9:16' as const };

    const first = await service.start('user-1', input);
    const duplicate = await service.start('user-1', input);
    expect(first.id).toBe(duplicate.id);
    expect(starts).toBe(1);
    await expect(service.get('user-1', first.id)).resolves.toMatchObject({ status: 'COMPLETE', progress: 100 });
    await expect(service.get('user-2', first.id)).resolves.toBeNull();
  });
});
