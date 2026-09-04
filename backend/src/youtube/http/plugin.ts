import type { FastifyInstance, FastifyRequest } from 'fastify';

import type { AuthenticationVerifier } from '../../auth/authentication-verifier.js';
import { YouTubeConnectionService } from '../application/connection-service.js';
import { OAuthRequestError, type YouTubeOAuthService } from '../application/oauth-service.js';
import type { YouTubeConnectionRepository } from '../application/ports.js';

export interface YouTubeModuleDependencies {
  authenticationVerifier: AuthenticationVerifier;
  connectionRepository: YouTubeConnectionRepository;
  oauthService?: YouTubeOAuthService;
}

const connectionIdSchema = { type: 'string', minLength: 1, maxLength: 128, pattern: '^[A-Za-z0-9_-]+$' } as const;

const errorSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['error', 'requestId'],
  properties: {
    error: {
      type: 'object',
      additionalProperties: false,
      required: ['code', 'message'],
      properties: { code: { type: 'string' }, message: { type: 'string' } },
    },
    requestId: { type: 'string' },
  },
} as const;

const connectionDataSchema = {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'platform', 'channel', 'status'],
      properties: {
        id: { type: 'string' },
        platform: { const: 'YOUTUBE' },
        channel: {
          type: 'object',
          additionalProperties: false,
          required: ['id', 'title'],
          properties: { id: { type: 'string' }, title: { type: 'string' } },
        },
        status: { enum: ['CONNECTED', 'RECONNECT_REQUIRED', 'DISCONNECTED'] },
      },
} as const;

const connectionResponseSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['data', 'requestId'],
  properties: {
    data: connectionDataSchema,
    requestId: { type: 'string' },
  },
} as const;

const connectionListResponseSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['data', 'requestId'],
  properties: {
    data: { type: 'array', items: connectionDataSchema },
    requestId: { type: 'string' },
  },
} as const;

const authorizationResponseSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['data', 'requestId'],
  properties: {
    data: {
      type: 'object',
      additionalProperties: false,
      required: ['authorizationUrl', 'expiresAt'],
      properties: {
        authorizationUrl: { type: 'string' },
        expiresAt: { type: 'string', format: 'date-time' },
      },
    },
    requestId: { type: 'string' },
  },
} as const;

function toWebRequest(request: FastifyRequest): Request {
  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    if (Array.isArray(value)) value.forEach((item) => headers.append(name, item));
    else if (value !== undefined) headers.set(name, String(value));
  }
  return new Request(`http://backend.invalid${request.url}`, { method: request.method, headers });
}

export async function registerYouTubeModule(
  app: FastifyInstance,
  dependencies: YouTubeModuleDependencies,
): Promise<void> {
  const service = new YouTubeConnectionService(dependencies.connectionRepository);

  await app.register((youtube) => {
    if (dependencies.oauthService) {
      youtube.post<{ Body: { returnDestination: string } }>(
        '/api/v1/youtube/oauth/authorizations',
        {
          schema: {
            body: {
              type: 'object',
              additionalProperties: false,
              required: ['returnDestination'],
              properties: { returnDestination: { type: 'string', minLength: 1, maxLength: 255 } },
            },
            response: {
              201: authorizationResponseSchema,
              400: errorSchema,
              401: errorSchema,
              500: errorSchema,
            },
          },
        },
        async (request, reply) => {
          const user = await dependencies.authenticationVerifier.verify(toWebRequest(request));
          if (!user) {
            return reply.code(401).send({
              error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
              requestId: request.id,
            });
          }
          try {
            const authorization = await dependencies.oauthService!.start(
              user.userId,
              request.body.returnDestination,
            );
            return reply.code(201).send({
              data: {
                authorizationUrl: authorization.authorizationUrl,
                expiresAt: authorization.expiresAt.toISOString(),
              },
              requestId: request.id,
            });
          } catch (error) {
            if (error instanceof OAuthRequestError) {
              return reply.code(400).send({
                error: { code: error.code, message: error.message },
                requestId: request.id,
              });
            }
            throw error;
          }
        },
      );

      youtube.get<{ Querystring: { state?: string; code?: string; error?: string } }>(
        '/api/v1/youtube/oauth/callback',
        {
          schema: {
            querystring: {
              type: 'object',
              additionalProperties: false,
              properties: {
                state: { type: 'string' },
                code: { type: 'string' },
                error: { type: 'string' },
              },
            },
            response: { 400: errorSchema, 500: errorSchema },
          },
        },
        async (request, reply) => {
          try {
            const destination = await dependencies.oauthService!.callback(request.query);
            return reply.code(303).redirect(destination);
          } catch (error) {
            if (error instanceof OAuthRequestError) {
              return reply.code(400).send({
                error: { code: error.code, message: error.message },
                requestId: request.id,
              });
            }
            throw error;
          }
        },
      );
    }

    youtube.get(
      '/api/v1/youtube/connections',
      {
        schema: { response: { 200: connectionListResponseSchema, 401: errorSchema, 500: errorSchema } },
      },
      async (request, reply) => {
        const user = await dependencies.authenticationVerifier.verify(toWebRequest(request));
        if (!user) {
          return reply.code(401).send({
            error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
            requestId: request.id,
          });
        }
        const connections = await service.listForUser(user.userId);
        return {
          data: connections.map((connection) => ({
            id: connection.id,
            platform: connection.platform,
            channel: connection.channel,
            status: connection.status,
          })),
          requestId: request.id,
        };
      },
    );

    youtube.get<{ Params: { connectionId: string } }>(
      '/api/v1/youtube/connections/:connectionId',
      {
        schema: {
          params: {
            type: 'object',
            additionalProperties: false,
            required: ['connectionId'],
            properties: { connectionId: connectionIdSchema },
          },
          response: {
            200: connectionResponseSchema,
            400: errorSchema,
            401: errorSchema,
            404: errorSchema,
            500: errorSchema,
          },
        },
      },
      async (request, reply) => {
        const user = await dependencies.authenticationVerifier.verify(toWebRequest(request));
        if (!user) {
          return reply.code(401).send({
            error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
            requestId: request.id,
          });
        }

        const connection = await service.getForUser(request.params.connectionId, user.userId);
        if (!connection) {
          return reply.code(404).send({
            error: {
              code: 'YOUTUBE_CONNECTION_NOT_FOUND',
              message: 'YouTube connection not found',
            },
            requestId: request.id,
          });
        }

        return {
          data: {
            id: connection.id,
            platform: connection.platform,
            channel: connection.channel,
            status: connection.status,
          },
          requestId: request.id,
        };
      },
    );

    youtube.setErrorHandler((error, request, reply) => {
      const handledError = error as { code?: unknown; validation?: unknown };
      if (handledError.validation) {
        return reply.code(400).send({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'The request could not be processed.',
          },
          requestId: request.id,
        });
      }

      const errorName = error instanceof Error ? error.name : 'Error';
      const errorCode =
        typeof handledError.code === 'string' ? handledError.code : undefined;
      request.log.error(
        { errorName, errorCode, statusCode: 500 },
        'YouTube request failed',
      );
      return reply.code(500).send({
        error: { code: 'INTERNAL_ERROR', message: 'Internal server error' },
        requestId: request.id,
      });
    });
  });
}
