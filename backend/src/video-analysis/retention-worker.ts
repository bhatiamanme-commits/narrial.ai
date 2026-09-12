import type { VideoAnalysisRepository } from './ports.js';

const DEFAULT_RETENTION_SWEEP_INTERVAL_MS = 60 * 60 * 1_000;

/** Deletes expired reference records and their cascade-related analysis/script data. */
export class VideoAnalysisRetentionWorker {
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly repository: VideoAnalysisRepository,
    private readonly onUnexpectedError: (error: unknown) => void = () => undefined,
    private readonly sweepIntervalMs = DEFAULT_RETENTION_SWEEP_INTERVAL_MS,
  ) {
    if (!Number.isSafeInteger(sweepIntervalMs) || sweepIntervalMs < 1_000) {
      throw new Error('VIDEO_ANALYSIS_RETENTION_INTERVAL_INVALID');
    }
  }

  run(now = new Date()): Promise<number> {
    return this.repository.purgeExpired(now);
  }

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      void this.run().catch(this.onUnexpectedError);
    }, this.sweepIntervalMs);
    this.timer.unref();
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      delete this.timer;
    }
  }
}
