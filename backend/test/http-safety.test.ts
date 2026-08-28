import { Writable } from 'node:stream';
import { setTimeout as delay } from 'node:timers/promises';

import { afterEach, describe, expect, it } from 'vitest';

import { buildApp } from '../src/app.js';
import { testConfig } from './fixtures/config.js';

const apps: Array<ReturnType<typeof buildApp>> = [];

interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    requestId: string;
  };
}

class LogCaptureStream extends Writable {
  logs = '';

  override _write(
    chunk: Buffer,
    _encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ): void {
    this.logs += chunk.toString('utf8');
    callback();
  }
}

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe('HTTP safety middleware', () => {
  it.each([
    [404, 'NOT_FOUND', 'Resource not found'],
    [409, 'CONFLICT', 'Request conflict'],
    [422, 'UNPROCESSABLE_ENTITY', 'Request could not be processed'],
    [429, 'RATE_LIMITED', 'Too many requests'],
  ] as const)(
    'preserves safe HTTP semantics for status %i errors',
    async (statusCode, code, message) => {
      const app = buildApp({ config: testConfig });
      app.get('/handled-error', () => {
        throw Object.assign(new Error('sensitive internal detail'), { statusCode });
      });
      apps.push(app);

      const response = await app.inject({ method: 'GET', url: '/handled-error' });

      expect(response.statusCode).toBe(statusCode);
      expect(response.json()).toMatchObject({ error: { code, message } });
      expect(JSON.stringify(response.json())).not.toContain('sensitive internal detail');
    },
  );

  it('returns stable request-correlated errors for unknown routes', async () => {
    const app = buildApp({ config: testConfig });
    apps.push(app);

    const response = await app.inject({ method: 'GET', url: '/missing' });

    expect(response.statusCode).toBe(404);
    const parsedBody: unknown = response.json();
    const body = parsedBody as ErrorEnvelope;
    expect(body).toMatchObject({
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found',
      },
    });
    expect(typeof body.error.requestId).toBe('string');
    expect(response.headers['x-request-id']).toBe(body.error.requestId);
  });

  it('uses the stable envelope for malformed JSON', async () => {
    const app = buildApp({ config: testConfig });
    app.post('/payload', () => ({ accepted: true }));
    apps.push(app);

    const response = await app.inject({
      method: 'POST',
      url: '/payload',
      headers: { 'content-type': 'application/json' },
      payload: '{"broken":',
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: { code: 'INVALID_REQUEST', message: 'Invalid request' },
    });
    expect(JSON.stringify(response.json())).not.toContain('Unexpected');
  });

  it('hides unexpected production failures', async () => {
    const app = buildApp({ config: { ...testConfig, nodeEnv: 'production' } });
    app.get('/failure', () => {
      throw new Error('database-password-value');
    });
    apps.push(app);

    const response = await app.inject({ method: 'GET', url: '/failure' });
    const body = JSON.stringify(response.json());

    expect(response.statusCode).toBe(500);
    expect(response.json()).toMatchObject({
      error: { code: 'INTERNAL_SERVER_ERROR', message: 'Internal server error' },
    });
    expect(body).not.toContain('database-password-value');
    expect(body).not.toContain('stack');
  });

  it('allows only configured browser origins', async () => {
    const app = buildApp({ config: testConfig });
    apps.push(app);

    const allowed = await app.inject({
      method: 'GET',
      url: '/health',
      headers: { origin: 'http://localhost:8081' },
    });
    const denied = await app.inject({
      method: 'GET',
      url: '/health',
      headers: { origin: 'https://attacker.example' },
    });

    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:8081');
    expect(denied.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('adds security headers', async () => {
    const app = buildApp({ config: testConfig });
    apps.push(app);

    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(response.headers['referrer-policy']).toBe('no-referrer');
  });

  it('returns a stable error when route handling exceeds its timeout', async () => {
    const app = buildApp({ config: { ...testConfig, handlerTimeoutMs: 20 } });
    app.get('/slow', async () => {
      await delay(100);
      return { tooLate: true };
    });
    apps.push(app);

    const response = await app.inject({ method: 'GET', url: '/slow' });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({
      error: { code: 'REQUEST_TIMEOUT', message: 'Request timed out' },
    });
  });

  it('redacts authorization and credential fields from structured logs', async () => {
    const logStream = new LogCaptureStream();
    const app = buildApp({
      config: { ...testConfig, logLevel: 'info' },
      logStream,
    });
    app.post('/log-check', (request) => {
      request.log.info({
        authorization: request.headers.authorization,
        access_token: (request.body as { access_token: string }).access_token,
        ciphertext: 'ciphertext-canary-value',
        authentication_tag: 'authentication-tag-canary-value',
        initialization_vector: 'initialization-vector-canary-value',
        wrapped_data_key: 'wrapped-key-canary-value',
      });
      return { ok: true };
    });
    apps.push(app);

    await app.inject({
      method: 'POST',
      url: '/log-check',
      headers: {
        authorization: 'Bearer bearer-secret-value',
        'content-type': 'application/json',
      },
      payload: { access_token: 'provider-token-value' },
    });

    expect(logStream.logs).toContain('[Redacted]');
    expect(logStream.logs).not.toContain('bearer-secret-value');
    expect(logStream.logs).not.toContain('provider-token-value');
    expect(logStream.logs).not.toContain('ciphertext-canary-value');
    expect(logStream.logs).not.toContain('authentication-tag-canary-value');
    expect(logStream.logs).not.toContain('initialization-vector-canary-value');
    expect(logStream.logs).not.toContain('wrapped-key-canary-value');
  });
});
