import { type Writable } from 'node:stream';

import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import Fastify from 'fastify';

import type { AppConfig } from './config/env.js';
import { registerYouTubeModule, type YouTubeModuleDependencies } from './youtube/http/plugin.js';

interface BuildAppOptions {
  config: AppConfig;
  logStream?: Writable;
  authenticationVerifier?: YouTubeModuleDependencies['authenticationVerifier'];
  connectionRepository?: YouTubeModuleDependencies['connectionRepository'];
}

interface HandledError extends Error {
  code?: string;
  statusCode?: number;
  validation?: unknown;
}

const redactedLogPaths = [
  'authorization',
  'cookie',
  'access_token',
  'refresh_token',
  'client_secret',
  'credential',
  'credentials',
  'secret',
  'token',
  'code',
  'state',
  'code_verifier',
  'ciphertext',
  'authentication_tag',
  'initialization_vector',
  'wrapped_data_key',
  'req.headers.authorization',
  'req.headers.cookie',
  'req.body.authorization',
  'req.body.access_token',
  'req.body.refresh_token',
  'req.body.client_secret',
  'req.body.credential',
  'req.body.credentials',
  'req.body.secret',
  'req.body.token',
  'req.body.code',
  'req.body.state',
  'req.body.code_verifier',
];

function publicError(code: string, message: string, requestId: string) {
  return { error: { code, message, requestId } };
}

function mapError(error: HandledError) {
  if (error.code === 'FST_ERR_HANDLER_TIMEOUT') {
    return { statusCode: 503, code: 'REQUEST_TIMEOUT', message: 'Request timed out' };
  }

  const statusCode = error.statusCode && error.statusCode >= 400 ? error.statusCode : 500;
  if (statusCode === 400 || error.validation) {
    return { statusCode: 400, code: 'INVALID_REQUEST', message: 'Invalid request' };
  }
  if (statusCode === 401) {
    return { statusCode, code: 'UNAUTHORIZED', message: 'Authentication required' };
  }
  if (statusCode === 403) {
    return { statusCode, code: 'FORBIDDEN', message: 'Request forbidden' };
  }
  if (statusCode === 404) {
    return { statusCode, code: 'NOT_FOUND', message: 'Resource not found' };
  }
  if (statusCode === 409) {
    return { statusCode, code: 'CONFLICT', message: 'Request conflict' };
  }
  if (statusCode === 422) {
    return {
      statusCode,
      code: 'UNPROCESSABLE_ENTITY',
      message: 'Request could not be processed',
    };
  }
  if (statusCode === 429) {
    return { statusCode, code: 'RATE_LIMITED', message: 'Too many requests' };
  }
  if (statusCode === 413) {
    return { statusCode, code: 'PAYLOAD_TOO_LARGE', message: 'Payload too large' };
  }
  if (statusCode === 415) {
    return { statusCode, code: 'UNSUPPORTED_MEDIA_TYPE', message: 'Unsupported media type' };
  }

  return { statusCode: 500, code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' };
}

export function buildApp({
  config,
  logStream,
  authenticationVerifier,
  connectionRepository,
}: BuildAppOptions) {
  const logger =
    config.logLevel === 'silent'
      ? false
      : {
          level: config.logLevel,
          redact: { paths: redactedLogPaths, censor: '[Redacted]' },
          ...(logStream ? { stream: logStream } : {}),
        };
  const app = Fastify({
    logger,
    requestTimeout: config.requestTimeoutMs,
    handlerTimeout: config.handlerTimeoutMs,
    keepAliveTimeout: config.keepAliveTimeoutMs,
    requestIdHeader: false,
  });

  void app.register(cors, {
    origin: config.allowedWebOrigins,
    credentials: false,
  });
  void app.register(helmet);

  app.addHook('onRequest', (request, reply, done) => {
    void reply.header('x-request-id', request.id);
    done();
  });

  app.setNotFoundHandler((request, reply) => {
    void reply.code(404).send(publicError('NOT_FOUND', 'Route not found', request.id));
  });

  app.setErrorHandler((error: HandledError, request, reply) => {
    const mapped = mapError(error);
    if (mapped.statusCode >= 500) {
      request.log.error(
        { errorName: error.name, errorCode: error.code, statusCode: mapped.statusCode },
        'request failed',
      );
    } else {
      request.log.warn(
        { errorName: error.name, errorCode: error.code, statusCode: mapped.statusCode },
        'request rejected',
      );
    }
    void reply
      .code(mapped.statusCode)
      .type('application/json')
      .send(publicError(mapped.code, mapped.message, request.id));
  });

  app.get('/health', () => ({ status: 'ok' as const }));

  if (authenticationVerifier && connectionRepository) {
    void registerYouTubeModule(app, { authenticationVerifier, connectionRepository });
  }

  return app;
}
