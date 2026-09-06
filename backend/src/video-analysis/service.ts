import { parseVideoReferenceUrl, VideoAnalysisError } from './domain.js';
import type { VideoAnalysisRepository } from './ports.js';
import type { VideoAnalysisWorker } from './worker.js';

export class VideoAnalysisService {
  constructor(
    private readonly repository: VideoAnalysisRepository,
    private readonly worker: VideoAnalysisWorker,
  ) {}

  async submit(ownerId: string, url: string) {
    const parsed = parseVideoReferenceUrl(url);
    const created = await this.repository.create(ownerId, parsed);
    this.worker.runSoon(created.job.id, ownerId);
    return created;
  }

  getJob(ownerId: string, jobId: string) {
    return this.repository.findJobForUser(jobId, ownerId);
  }

  async retry(ownerId: string, jobId: string) {
    const job = await this.repository.retry(jobId, ownerId);
    if (job) this.worker.runSoon(job.id, ownerId);
    return job;
  }

  deleteReference(ownerId: string, referenceId: string) {
    return this.repository.deleteReference(referenceId, ownerId);
  }
}

export function publicVideoAnalysisError(error: unknown) {
  if (error instanceof VideoAnalysisError) return error;
  return new VideoAnalysisError('VIDEO_ANALYSIS_FAILED', 'The video could not be analyzed.');
}
