import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import type { AuthenticationVerifier } from '../auth/authentication-verifier.js';
import { VideoAnalysisError } from './domain.js';
import type { VideoAnalysisRepository } from './ports.js';
import { VideoAnalysisService } from './service.js';
import type { VideoAnalysisWorker } from './worker.js';

export interface VideoAnalysisModuleDependencies {
  authenticationVerifier: AuthenticationVerifier;
  videoAnalysisRepository: VideoAnalysisRepository;
  videoAnalysisWorker: VideoAnalysisWorker;
}

const identifierSchema = { type: 'string', format: 'uuid' } as const;

function toWebRequest(request: FastifyRequest): Request {
  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) value.forEach((item) => headers.append(name, item));
    else if (value !== undefined) headers.set(name, String(value));
  }
  return new Request(`http://backend.invalid${request.url}`, { method: request.method, headers });
}

async function authenticate(request: FastifyRequest, reply: FastifyReply, verifier: AuthenticationVerifier) {
  const user = await verifier.verify(toWebRequest(request));
  if (!user) {
    await reply.code(401).send({ error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' }, requestId: request.id });
    return null;
  }
  return user;
}

function serializeJob(job: Awaited<ReturnType<VideoAnalysisService['getJob']>> & {}) {
  return {
    id: job.id, referenceId: job.referenceId, status: job.status, progress: job.progress,
    stage: job.stage, ...(job.analysis ? { analysis: job.analysis } : {}),
    ...(job.errorCode ? { errorCode: job.errorCode } : {}), updatedAt: job.updatedAt.toISOString(),
  };
}

export async function registerVideoAnalysisModule(app: FastifyInstance, dependencies: VideoAnalysisModuleDependencies) {
  const service = new VideoAnalysisService(dependencies.videoAnalysisRepository, dependencies.videoAnalysisWorker);

  await app.register((module, _options, done) => {
    module.post<{ Body: { url: string } }>('/api/v1/video-references', {
      schema: { body: { type: 'object', additionalProperties: false, required: ['url'], properties: { url: { type: 'string', minLength: 1, maxLength: 2_048 } } } },
    }, async (request, reply) => {
      const user = await authenticate(request, reply, dependencies.authenticationVerifier);
      if (!user) return;
      try {
        const created = await service.submit(user.userId, request.body.url);
        return reply.code(202).send({ data: {
          reference: {
            id: created.reference.id, provider: created.reference.provider, title: created.reference.title,
            thumbnailUrl: created.reference.thumbnailUrl,
          },
          analysisJob: serializeJob(created.job),
        }, requestId: request.id });
      } catch (error) {
        if (error instanceof VideoAnalysisError) {
          return reply.code(422).send({ error: { code: error.code, message: error.message }, requestId: request.id });
        }
        throw error;
      }
    });

    module.get<{ Params: { jobId: string } }>('/api/v1/video-analysis-jobs/:jobId', {
      schema: { params: { type: 'object', required: ['jobId'], properties: { jobId: identifierSchema } } },
    }, async (request, reply) => {
      const user = await authenticate(request, reply, dependencies.authenticationVerifier);
      if (!user) return;
      const job = await service.getJob(user.userId, request.params.jobId);
      if (!job) return reply.code(404).send({ error: { code: 'VIDEO_ANALYSIS_JOB_NOT_FOUND', message: 'Video analysis job not found' }, requestId: request.id });
      return { data: serializeJob(job), requestId: request.id };
    });

    module.post<{ Params: { jobId: string } }>('/api/v1/video-analysis-jobs/:jobId/retry', {
      schema: { params: { type: 'object', required: ['jobId'], properties: { jobId: identifierSchema } } },
    }, async (request, reply) => {
      const user = await authenticate(request, reply, dependencies.authenticationVerifier);
      if (!user) return;
      const job = await service.retry(user.userId, request.params.jobId);
      if (!job) return reply.code(409).send({ error: { code: 'VIDEO_ANALYSIS_NOT_RETRYABLE', message: 'Video analysis cannot be retried' }, requestId: request.id });
      return reply.code(202).send({ data: serializeJob(job), requestId: request.id });
    });

    module.delete<{ Params: { referenceId: string } }>('/api/v1/video-references/:referenceId', {
      schema: { params: { type: 'object', required: ['referenceId'], properties: { referenceId: identifierSchema } } },
    }, async (request, reply) => {
      const user = await authenticate(request, reply, dependencies.authenticationVerifier);
      if (!user) return;
      const deleted = await service.deleteReference(user.userId, request.params.referenceId);
      if (!deleted) return reply.code(404).send({ error: { code: 'VIDEO_REFERENCE_NOT_FOUND', message: 'Video reference not found' }, requestId: request.id });
      return reply.code(204).send();
    });
    done();
  });
}
