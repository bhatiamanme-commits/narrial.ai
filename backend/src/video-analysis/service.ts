import { parseVideoReferenceUrl, VideoAnalysisError } from './domain.js';
import type { VideoAnalysisRepository } from './ports.js';
import type { VideoAnalysisWorker } from './worker.js';

export class VideoAnalysisService {
  constructor(
    private readonly repository: VideoAnalysisRepository,
    private readonly worker: VideoAnalysisWorker,
    private readonly maxJobsPerHour: number,
    private readonly globalMaxJobsPerHour: number,
    private readonly enabled: boolean,
  ) {}

  async submit(ownerId: string, url: string) {
    if (!this.enabled) throw new VideoAnalysisError('VIDEO_ANALYSIS_DISABLED', 'Video analysis is temporarily unavailable.');
    const parsed = parseVideoReferenceUrl(url);
    const created = await this.repository.create(ownerId, parsed, {
      maxJobsPerHour: this.maxJobsPerHour,
      globalMaxJobsPerHour: this.globalMaxJobsPerHour,
      createdAfter: new Date(Date.now() - 60 * 60 * 1_000),
    });
    if (created.created || created.job.status === 'QUEUED') this.worker.runSoon(created.job.id, ownerId);
    return created;
  }

  getJob(ownerId: string, jobId: string) {
    return this.repository.findJobForUser(jobId, ownerId);
  }

  async retry(ownerId: string, jobId: string) {
    if (!this.enabled) throw new VideoAnalysisError('VIDEO_ANALYSIS_DISABLED', 'Video analysis is temporarily unavailable.');
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
