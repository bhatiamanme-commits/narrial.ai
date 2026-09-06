import { parseVideoAnalysis, VideoAnalysisError } from './domain.js';
import type { VideoAnalysisRepository, VideoAnalyzer } from './ports.js';

export class VideoAnalysisWorker {
  constructor(
    private readonly repository: VideoAnalysisRepository,
    private readonly analyzer: VideoAnalyzer,
  ) {}

  runSoon(jobId: string, ownerId: string): void {
    setTimeout(() => void this.run(jobId, ownerId), 0);
  }

  async run(jobId: string, ownerId: string): Promise<void> {
    const job = await this.repository.claim(jobId, ownerId);
    if (!job) return;
    const reference = await this.repository.findReferenceForUser(job.referenceId, ownerId);
    if (!reference) {
      await this.repository.fail(jobId, ownerId, 'VIDEO_REFERENCE_NOT_FOUND');
      return;
    }

    try {
      const analysis = parseVideoAnalysis(await this.analyzer.analyze(reference));
      await this.repository.complete(jobId, ownerId, analysis);
    } catch (error) {
      const code = error instanceof VideoAnalysisError ? error.code : 'VIDEO_ANALYSIS_FAILED';
      await this.repository.fail(jobId, ownerId, code);
    }
  }
}
