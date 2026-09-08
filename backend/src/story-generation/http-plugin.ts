import type { FastifyInstance } from 'fastify';
import type { AuthenticationVerifier } from '../auth/authentication-verifier.js';
import { VideoAnalysisError } from '../video-analysis/domain.js';
import { parseStoryRequest } from './domain.js';
import type { StoryPlanner } from './gemini-story-planner.js';

export async function registerStoryGenerationModule(app: FastifyInstance, dependencies: { authenticationVerifier: AuthenticationVerifier; storyPlanner: StoryPlanner }) {
  const bodySchema = {
    type: 'object', additionalProperties: false,
    required: ['analysis', 'prompt', 'questionAnswers'],
    properties: {
      analysis: { type: 'object' },
      prompt: { type: 'string', minLength: 1, maxLength: 2_000 },
      questionAnswers: { type: 'array', maxItems: 12, items: {
        type: 'object', additionalProperties: false, required: ['question', 'answer'],
        properties: { question: { type: 'string', minLength: 1, maxLength: 300 }, answer: { type: 'string', minLength: 1, maxLength: 1_000 } },
      } },
    },
  } as const;
  app.post('/api/v1/stories/generate', { schema: { body: bodySchema } }, async (request, reply) => {
    const headers = new Headers(); if (request.headers.authorization) headers.set('authorization', request.headers.authorization);
    const user = await dependencies.authenticationVerifier.verify(new Request(`http://backend.invalid${request.url}`, { method: request.method, headers }));
    if (!user) return reply.code(401).send({ error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' }, requestId: request.id });
    try { return reply.send({ data: await dependencies.storyPlanner.generate(parseStoryRequest(request.body)), requestId: request.id }); }
    catch (error) { if (error instanceof VideoAnalysisError) return reply.code(error.code.startsWith('INVALID') ? 422 : 503).send({ error: { code: error.code, message: error.message }, requestId: request.id }); throw error; }
  });
}
