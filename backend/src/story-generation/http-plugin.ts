import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import type { AuthenticationVerifier } from '../auth/authentication-verifier.js';
import { VideoAnalysisError } from '../video-analysis/domain.js';
import type { VideoAnalysisRepository } from '../video-analysis/ports.js';
import { parseStoryBrief, ScriptGenerationError } from './domain.js';
import type { ScriptGenerationJobRecord, ScriptGenerationRepository } from './ports.js';
import { ScriptGenerationService } from './service.js';
import type { ScriptGenerationWorker } from './worker.js';

export interface StoryGenerationModuleDependencies {
  authenticationVerifier: AuthenticationVerifier;
  videoAnalysisRepository: VideoAnalysisRepository;
  scriptGenerationRepository: ScriptGenerationRepository;
  scriptGenerationWorker: ScriptGenerationWorker;
  maxJobsPerHour: number;
  globalMaxJobsPerHour: number;
  enabled: boolean;
}

const identifierSchema = { type: 'string', format: 'uuid' } as const;
const questionAnswersSchema = {
  type: 'array', maxItems: 12, items: {
    type: 'object', additionalProperties: false, required: ['question', 'answer'],
    properties: {
      question: { type: 'string', minLength: 1, maxLength: 300 },
      answer: { type: 'string', minLength: 1, maxLength: 1_000 },
    },
  },
} as const;

function toWebRequest(request: FastifyRequest): Request {
  const headers = new Headers();
  if (request.headers.authorization) headers.set('authorization', request.headers.authorization);
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

function serializeJob(job: ScriptGenerationJobRecord) {
  return {
    id: job.id,
    analysisJobId: job.analysisJobId,
    status: job.status,
    progress: job.progress,
    stage: job.stage,
    attemptCount: job.attemptCount,
    ...(job.story ? { story: job.story } : {}),
    ...(job.errorCode ? { errorCode: job.errorCode } : {}),
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };
}

export async function registerStoryGenerationModule(app: FastifyInstance, dependencies: StoryGenerationModuleDependencies) {
  const service = new ScriptGenerationService(
    dependencies.scriptGenerationRepository,
    dependencies.videoAnalysisRepository,
    dependencies.scriptGenerationWorker,
    dependencies.maxJobsPerHour,
    dependencies.globalMaxJobsPerHour,
    dependencies.enabled,
  );

  await app.register((module, _options, done) => {
    module.post<{ Body: { idempotencyKey: string; analysisJobId: string; brief: unknown } }>('/api/v1/script-generation-jobs', {
      schema: { body: {
        type: 'object', additionalProperties: false, required: ['idempotencyKey', 'analysisJobId', 'brief'],
        properties: {
          idempotencyKey: identifierSchema,
          analysisJobId: identifierSchema,
          brief: {
            type: 'object', additionalProperties: false, required: ['prompt', 'questionAnswers'],
            properties: {
              prompt: { type: 'string', minLength: 1, maxLength: 2_000 },
              questionAnswers: questionAnswersSchema,
            },
          },
        },
      } },
    }, async (request, reply) => {
      const user = await authenticate(request, reply, dependencies.authenticationVerifier);
      if (!user) return;
      try {
        const job = await service.submit(
          user.userId,
          request.body.analysisJobId,
          parseStoryBrief(request.body.brief),
          request.body.idempotencyKey,
        );
        return reply.code(202).send({ data: serializeJob(job), requestId: request.id });
      } catch (error) {
        if (error instanceof ScriptGenerationError) {
          const status = error.code === 'VIDEO_ANALYSIS_JOB_NOT_FOUND' ? 404 : error.code === 'SCRIPT_GENERATION_RATE_LIMITED' || error.code === 'SCRIPT_GENERATION_CAPACITY_LIMITED' ? 429 : error.code === 'SCRIPT_GENERATION_DISABLED' ? 503 : 409;
          return reply.code(status).send({ error: { code: error.code, message: error.message }, requestId: request.id });
        }
        if (error instanceof VideoAnalysisError) {
          return reply.code(422).send({ error: { code: error.code, message: error.message }, requestId: request.id });
        }
        throw error;
      }
    });

    module.get<{ Params: { jobId: string } }>('/api/v1/script-generation-jobs/:jobId', {
      schema: { params: { type: 'object', additionalProperties: false, required: ['jobId'], properties: { jobId: identifierSchema } } },
    }, async (request, reply) => {
      const user = await authenticate(request, reply, dependencies.authenticationVerifier);
      if (!user) return;
      const job = await service.getJob(user.userId, request.params.jobId);
      if (!job) return reply.code(404).send({ error: { code: 'SCRIPT_GENERATION_JOB_NOT_FOUND', message: 'Script generation job not found' }, requestId: request.id });
      return { data: serializeJob(job), requestId: request.id };
    });

    module.post<{ Params: { jobId: string } }>('/api/v1/script-generation-jobs/:jobId/retry', {
      schema: { params: { type: 'object', additionalProperties: false, required: ['jobId'], properties: { jobId: identifierSchema } } },
    }, async (request, reply) => {
      const user = await authenticate(request, reply, dependencies.authenticationVerifier);
      if (!user) return;
      try {
        const job = await service.retry(user.userId, request.params.jobId);
        if (!job) return reply.code(409).send({ error: { code: 'SCRIPT_GENERATION_NOT_RETRYABLE', message: 'Script generation cannot be retried' }, requestId: request.id });
        return reply.code(202).send({ data: serializeJob(job), requestId: request.id });
      } catch (error) {
        if (error instanceof ScriptGenerationError) {
          const statusCode = error.code === 'SCRIPT_GENERATION_DISABLED' ? 503 : 409;
          return reply.code(statusCode).send({ error: { code: error.code, message: error.message }, requestId: request.id });
        }
        if (error instanceof VideoAnalysisError) {
          return reply.code(422).send({ error: { code: error.code, message: error.message }, requestId: request.id });
        }
        throw error;
      }
    });
    done();
  });
}
