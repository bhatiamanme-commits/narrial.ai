import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

import type { AuthenticationVerifier } from '../auth/authentication-verifier.js';
import { VideoGenerationError } from './domain.js';
import type { VideoGenerationRepository, VideoGenerator } from './ports.js';
import { VideoGenerationService } from './service.js';

export interface VideoGenerationModuleDependencies { authenticationVerifier: AuthenticationVerifier; videoGenerationRepository: VideoGenerationRepository; videoGenerator: VideoGenerator }
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
  if (!user) { await reply.code(401).send({ error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' }, requestId: request.id }); return null; }
  return user;
}

function serialize(job: NonNullable<Awaited<ReturnType<VideoGenerationService['get']>>>) {
  return { id: job.id, projectId: job.projectId, status: job.status, progress: job.progress, stage: job.stage, ...(job.errorCode ? { errorCode: job.errorCode } : {}), ...(job.status === 'COMPLETE' ? { playbackPath: `/api/v1/video-generation-jobs/${job.id}/content` } : {}), updatedAt: job.updatedAt.toISOString() };
}

export async function registerVideoGenerationModule(app: FastifyInstance, dependencies: VideoGenerationModuleDependencies) {
  const service = new VideoGenerationService(dependencies.videoGenerationRepository, dependencies.videoGenerator);
  await app.register((module, _options, done) => {
    module.post<{ Body: { projectId: string; prompt: string; aspectRatio: '9:16' | '16:9' } }>('/api/v1/video-generation-jobs', {
      schema: { body: { type: 'object', additionalProperties: false, required: ['projectId', 'prompt', 'aspectRatio'], properties: { projectId: { type: 'string', minLength: 1, maxLength: 100 }, prompt: { type: 'string', minLength: 20, maxLength: 8_000 }, aspectRatio: { type: 'string', enum: ['9:16', '16:9'] } } } },
    }, async (request, reply) => {
      const user = await authenticate(request, reply, dependencies.authenticationVerifier); if (!user) return;
      try { const job = await service.start(user.userId, request.body); return reply.code(job.status === 'FAILED' ? 502 : 202).send({ data: serialize(job), requestId: request.id }); }
      catch (error) { if (error instanceof VideoGenerationError) return reply.code(422).send({ error: { code: error.code, message: error.message }, requestId: request.id }); throw error; }
    });

    module.get<{ Params: { jobId: string } }>('/api/v1/video-generation-jobs/:jobId', { schema: { params: { type: 'object', required: ['jobId'], properties: { jobId: identifierSchema } } } }, async (request, reply) => {
      const user = await authenticate(request, reply, dependencies.authenticationVerifier); if (!user) return;
      const job = await service.get(user.userId, request.params.jobId);
      if (!job) return reply.code(404).send({ error: { code: 'VIDEO_GENERATION_JOB_NOT_FOUND', message: 'Video generation job not found' }, requestId: request.id });
      return { data: serialize(job), requestId: request.id };
    });

    module.get<{ Params: { jobId: string } }>('/api/v1/video-generation-jobs/:jobId/content', { schema: { params: { type: 'object', required: ['jobId'], properties: { jobId: identifierSchema } } } }, async (request, reply) => {
      const user = await authenticate(request, reply, dependencies.authenticationVerifier); if (!user) return;
      const response = await service.download(user.userId, request.params.jobId);
      if (!response) return reply.code(404).send({ error: { code: 'VIDEO_GENERATION_NOT_READY', message: 'Generated video is not ready' }, requestId: request.id });
      const bytes = Buffer.from(await response.arrayBuffer());
      return reply.header('content-type', response.headers.get('content-type') ?? 'video/mp4').header('cache-control', 'private, max-age=300').send(bytes);
    });
    done();
  });
}
