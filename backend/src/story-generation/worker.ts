import { VideoAnalysisError } from '../video-analysis/domain.js';
import type { VideoAnalysisRepository } from '../video-analysis/ports.js';
import { BoundedJobScheduler } from '../lifecycle/bounded-job-scheduler.js';
import { parseGeneratedStory } from './domain.js';
import type { StoryPlanner } from './gemini-story-planner.js';
import type { ScriptGenerationRepository } from './ports.js';

const DEFAULT_CLAIM_LEASE_MS = 20 * 60 * 1_000;
const DEFAULT_RECOVERY_INTERVAL_MS = 5_000;

interface WorkerOptions {
  maxConcurrentJobs?: number;
  claimLeaseMs?: number;
  recoveryIntervalMs?: number;
}

interface ActiveClaim {
  jobId: string;
  ownerId: string;
  claimToken: string;
}

function safeFailureCode(error: unknown) {
  if (error instanceof VideoAnalysisError) {
    if (error.code === 'STORY_GENERATOR_UNAVAILABLE') return 'SCRIPT_PROVIDER_UNAVAILABLE';
    if (error.code === 'INVALID_STORY') return 'INVALID_SCRIPT_OUTPUT';
  }
  return 'SCRIPT_GENERATION_FAILED';
}

export class ScriptGenerationWorker {
  private readonly scheduler: BoundedJobScheduler;
  private readonly claimLeaseMs: number;
  private readonly recoveryIntervalMs: number;
  private readonly recoveryBatchSize: number;
  private readonly activeClaims = new Map<string, ActiveClaim>();
  private recoveryTimer?: NodeJS.Timeout;

  constructor(
    private readonly scripts: ScriptGenerationRepository,
    private readonly videos: VideoAnalysisRepository,
    private readonly planner: StoryPlanner,
    private readonly onUnexpectedError: (error: unknown) => void = () => undefined,
    options: WorkerOptions = {},
  ) {
    const maxConcurrentJobs = options.maxConcurrentJobs ?? 2;
    this.claimLeaseMs = options.claimLeaseMs ?? DEFAULT_CLAIM_LEASE_MS;
    this.recoveryIntervalMs = options.recoveryIntervalMs ?? DEFAULT_RECOVERY_INTERVAL_MS;
    if (!Number.isSafeInteger(this.claimLeaseMs) || this.claimLeaseMs < 1_000) throw new Error('SCRIPT_GENERATION_CLAIM_LEASE_INVALID');
    if (!Number.isSafeInteger(this.recoveryIntervalMs) || this.recoveryIntervalMs < 1_000) throw new Error('SCRIPT_GENERATION_RECOVERY_INTERVAL_INVALID');
    this.recoveryBatchSize = maxConcurrentJobs * 3;
    this.scheduler = new BoundedJobScheduler(
      maxConcurrentJobs,
      ({ jobId, ownerId }, signal) => this.run(jobId, ownerId, signal),
      onUnexpectedError,
    );
  }

  runSoon(jobId: string, ownerId: string): void {
    this.scheduler.enqueue({ jobId, ownerId });
  }

  async recover(limit = this.recoveryBatchSize): Promise<number> {
    const jobs = await this.scripts.findRecoverable(new Date(Date.now() - this.claimLeaseMs), limit);
    jobs.forEach(({ id, ownerId }) => this.runSoon(id, ownerId));
    return jobs.length;
  }

  startRecovery(): void {
    if (this.recoveryTimer) return;
    this.recoveryTimer = setInterval(() => {
      void this.recover().catch(this.onUnexpectedError);
    }, this.recoveryIntervalMs);
    this.recoveryTimer.unref();
  }

  async stop(): Promise<void> {
    if (this.recoveryTimer) {
      clearInterval(this.recoveryTimer);
      delete this.recoveryTimer;
    }
    const schedulerStop = this.scheduler.stop();
    const claimFailures = [...this.activeClaims.values()].map(({ jobId, ownerId, claimToken }) =>
      this.scripts.fail(jobId, ownerId, claimToken, 'WORKER_SHUTDOWN'),
    );
    await Promise.allSettled([schedulerStop, ...claimFailures]);
  }

  async run(jobId: string, ownerId: string, signal?: AbortSignal): Promise<void> {
    const job = await this.scripts.claim(jobId, ownerId, new Date(Date.now() - this.claimLeaseMs));
    if (!job) return;
    if (!job.claimToken) throw new Error('SCRIPT_GENERATION_CLAIM_TOKEN_MISSING');
    const activeKey = `${ownerId}:${jobId}`;
    const activeClaim = { jobId, ownerId, claimToken: job.claimToken };
    this.activeClaims.set(activeKey, activeClaim);
    try {
      if (signal?.aborted) {
        await this.scripts.fail(jobId, ownerId, job.claimToken, 'WORKER_SHUTDOWN');
        return;
      }
      const analysisJob = await this.videos.findJobForUser(job.analysisJobId, ownerId);
      if (!analysisJob?.analysis || analysisJob.status !== 'COMPLETE') {
        await this.scripts.fail(jobId, ownerId, job.claimToken, 'VIDEO_ANALYSIS_UNAVAILABLE');
        return;
      }
      const story = parseGeneratedStory(await this.planner.generate({ analysis: analysisJob.analysis, ...job.brief }, signal), analysisJob.analysis.durationSeconds);
      await this.scripts.complete(jobId, ownerId, job.claimToken, story, analysisJob.analysis.durationSeconds);
    } catch (error) {
      await this.scripts.fail(jobId, ownerId, job.claimToken, safeFailureCode(error));
    } finally {
      if (this.activeClaims.get(activeKey)?.claimToken === job.claimToken) this.activeClaims.delete(activeKey);
    }
  }
}
