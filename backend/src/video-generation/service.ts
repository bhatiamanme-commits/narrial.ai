import { VideoGenerationError, parseGenerationInput } from './domain.js';
import type { VideoGenerationRepository, VideoGenerator } from './ports.js';

export class VideoGenerationService {
  constructor(private readonly repository: VideoGenerationRepository, private readonly generator: VideoGenerator) {}

  async start(ownerId: string, value: unknown) {
    const input = parseGenerationInput(value);
    const claimed = await this.repository.createStarting(ownerId, input);
    if (!claimed.created) return claimed.job;
    try {
      const operation = await this.generator.start(input);
      return await this.repository.attachOperation(claimed.job.id, ownerId, operation.operationName);
    } catch (error) {
      const code = error instanceof VideoGenerationError ? error.code : 'VIDEO_GENERATION_FAILED';
      return this.repository.fail(claimed.job.id, ownerId, code);
    }
  }

  async get(ownerId: string, jobId: string) {
    const job = await this.repository.findForUser(jobId, ownerId);
    if (!job || job.status !== 'GENERATING' || !job.providerOperationName) return job;
    try {
      const providerJob = await this.generator.get(job.providerOperationName);
      if (providerJob.status === 'COMPLETE') return this.repository.complete(job.id, ownerId, providerJob.videoUri);
      if (providerJob.status === 'FAILED') return this.repository.fail(job.id, ownerId, providerJob.errorCode);
      return job;
    } catch (error) {
      if (error instanceof VideoGenerationError && error.code === 'VIDEO_GENERATION_PROVIDER_UNAVAILABLE') return job;
      const code = error instanceof VideoGenerationError ? error.code : 'VIDEO_GENERATION_FAILED';
      return this.repository.fail(job.id, ownerId, code);
    }
  }

  async download(ownerId: string, jobId: string) {
    const job = await this.repository.findForUser(jobId, ownerId);
    if (!job?.videoUri || job.status !== 'COMPLETE') return null;
    return this.generator.download(job.videoUri);
  }
}
