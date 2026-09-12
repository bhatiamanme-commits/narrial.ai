import { describe, expect, it, vi } from 'vitest';

import { parseVideoReferenceUrl } from '../src/video-analysis/domain.js';
import { InMemoryVideoAnalysisRepository } from '../src/video-analysis/in-memory-repository.js';
import { VideoAnalysisRetentionWorker } from '../src/video-analysis/retention-worker.js';

describe('VideoAnalysisRetentionWorker', () => {
  it('hides expired data immediately and purges it with its related job', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
    try {
      const repository = new InMemoryVideoAnalysisRepository();
      const created = await repository.create(
        'owner-a',
        parseVideoReferenceUrl('https://youtu.be/dQw4w9WgXcQ'),
        { maxJobsPerHour: 10, globalMaxJobsPerHour: 100, createdAfter: new Date(0) },
      );
      vi.setSystemTime(new Date(created.reference.expiresAt.getTime() + 1));

      expect(await repository.findReferenceForUser(created.reference.id, 'owner-a')).toBeNull();
      expect(await repository.findJobForUser(created.job.id, 'owner-a')).toBeNull();
      const worker = new VideoAnalysisRetentionWorker(repository);
      expect(await worker.run()).toBe(1);
      expect(await repository.findRecoverable(new Date(0), 10)).toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });
});
