import { createHash } from 'node:crypto';

import type { VideoAnalysisRepository } from '../video-analysis/ports.js';
import { ScriptGenerationError, type StoryBrief } from './domain.js';
import type { ScriptGenerationRepository } from './ports.js';
import type { ScriptGenerationWorker } from './worker.js';

function fingerprint(analysisJobId: string, brief: StoryBrief) {
  return createHash('sha256').update(JSON.stringify({ analysisJobId, brief })).digest('hex');
}

export class ScriptGenerationService {
  constructor(
    private readonly scripts: ScriptGenerationRepository,
    private readonly videos: VideoAnalysisRepository,
    private readonly worker: ScriptGenerationWorker,
    private readonly maxJobsPerHour: number,
    private readonly globalMaxJobsPerHour: number,
    private readonly enabled: boolean,
  ) {}

  async submit(ownerId: string, analysisJobId: string, brief: StoryBrief, idempotencyKey: string) {
    if (!this.enabled) throw new ScriptGenerationError('SCRIPT_GENERATION_DISABLED', 'Script generation is temporarily unavailable.');
    const analysisJob = await this.videos.findJobForUser(analysisJobId, ownerId);
    if (!analysisJob) throw new ScriptGenerationError('VIDEO_ANALYSIS_JOB_NOT_FOUND', 'Video analysis job not found.');
    if (analysisJob.status !== 'COMPLETE' || !analysisJob.analysis) {
      throw new ScriptGenerationError('VIDEO_ANALYSIS_NOT_READY', 'Video analysis must complete before script generation.');
    }
    const requestFingerprint = fingerprint(analysisJobId, brief);
    const existing = await this.scripts.findJobByIdempotencyKeyForUser(idempotencyKey, ownerId);
    if (existing) {
      if (existing.requestFingerprint !== requestFingerprint) {
        throw new ScriptGenerationError('IDEMPOTENCY_KEY_REUSED', 'The idempotency key was already used for different input.');
      }
      return existing;
    }
    const created = await this.scripts.create({
      ownerId, analysisJobId, brief, idempotencyKey,
      requestFingerprint,
    }, {
      maxJobsPerHour: this.maxJobsPerHour,
      globalMaxJobsPerHour: this.globalMaxJobsPerHour,
      createdAfter: new Date(Date.now() - 60 * 60 * 1_000),
    });
    if (created.created) this.worker.runSoon(created.job.id, ownerId);
    return created.job;
  }

  async getJob(ownerId: string, jobId: string) {
    const job = await this.scripts.findJobForUser(jobId, ownerId);
    if (!job) return null;
    return await this.videos.findJobForUser(job.analysisJobId, ownerId) ? job : null;
  }

  async retry(ownerId: string, jobId: string) {
    if (!this.enabled) throw new ScriptGenerationError('SCRIPT_GENERATION_DISABLED', 'Script generation is temporarily unavailable.');
    const existing = await this.scripts.findJobForUser(jobId, ownerId);
    if (!existing || !await this.videos.findJobForUser(existing.analysisJobId, ownerId)) return null;
    const job = await this.scripts.retry(jobId, ownerId);
    if (job) this.worker.runSoon(job.id, ownerId);
    return job;
  }
}
