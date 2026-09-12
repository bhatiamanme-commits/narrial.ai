export interface BackgroundJob {
  jobId: string;
  ownerId: string;
}

function keyFor({ jobId, ownerId }: BackgroundJob) {
  return `${ownerId}:${jobId}`;
}

/**
 * Keeps in-process work bounded. Durable QUEUED jobs that do not fit in this
 * small buffer are picked up by each worker's periodic database recovery.
 */
export class BoundedJobScheduler {
  private readonly pending = new Map<string, BackgroundJob>();
  private readonly active = new Map<string, AbortController>();
  private readonly executions = new Map<string, Promise<void>>();
  private readonly maxPendingJobs: number;
  private drainTimer?: NodeJS.Timeout;
  private stopped = false;

  constructor(
    private readonly maxConcurrentJobs: number,
    private readonly execute: (job: BackgroundJob, signal: AbortSignal) => Promise<void>,
    private readonly onUnexpectedError: (error: unknown) => void,
  ) {
    if (!Number.isSafeInteger(maxConcurrentJobs) || maxConcurrentJobs < 1) {
      throw new Error('BACKGROUND_JOB_CONCURRENCY_INVALID');
    }
    this.maxPendingJobs = maxConcurrentJobs * 2;
  }

  enqueue(job: BackgroundJob): boolean {
    if (this.stopped) return false;
    const key = keyFor(job);
    if (this.pending.has(key) || this.active.has(key)) return true;
    if (this.pending.size >= this.maxPendingJobs) return false;
    this.pending.set(key, job);
    this.scheduleDrain();
    return true;
  }

  async stop(): Promise<void> {
    this.stopped = true;
    this.pending.clear();
    if (this.drainTimer) {
      clearTimeout(this.drainTimer);
      delete this.drainTimer;
    }
    for (const controller of this.active.values()) controller.abort();
    await Promise.allSettled([...this.executions.values()]);
  }

  private scheduleDrain(): void {
    if (this.stopped || this.drainTimer) return;
    this.drainTimer = setTimeout(() => {
      delete this.drainTimer;
      this.drain();
    }, 0);
  }

  private drain(): void {
    if (this.stopped) return;
    while (this.active.size < this.maxConcurrentJobs && this.pending.size > 0) {
      const entry = this.pending.entries().next().value;
      if (!entry) return;
      const [key, job] = entry;
      this.pending.delete(key);
      const controller = new AbortController();
      this.active.set(key, controller);
      const execution = this.execute(job, controller.signal);
      this.executions.set(key, execution);
      void execution
        .catch((error: unknown) => {
          try {
            this.onUnexpectedError(error);
          } catch {
            // An observer must not create an unhandled worker rejection.
          }
        })
        .finally(() => {
          this.active.delete(key);
          this.executions.delete(key);
          this.scheduleDrain();
        });
    }
  }
}
