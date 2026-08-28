import { describe, expect, it } from 'vitest';

import { ConfigError, loadConfig } from '../src/config/env.js';

const validEnvironment = {
  NODE_ENV: 'test',
  HOST: '127.0.0.1',
  PORT: '3000',
  LOG_LEVEL: 'silent',
  ALLOWED_WEB_ORIGINS: 'http://localhost:8081,https://staging.narrial.com',
  CLERK_PUBLISHABLE_KEY: 'pk_test_documentation_fixture',
  CLERK_SECRET_KEY: 'sk_test_documentation_fixture',
  REQUEST_TIMEOUT_MS: '10000',
  HANDLER_TIMEOUT_MS: '5000',
  KEEP_ALIVE_TIMEOUT_MS: '5000',
  SHUTDOWN_GRACE_PERIOD_MS: '10000',
} satisfies NodeJS.ProcessEnv;

describe('loadConfig', () => {
  it('parses a valid environment into typed configuration', () => {
    expect(loadConfig(validEnvironment)).toEqual({
      nodeEnv: 'test',
      host: '127.0.0.1',
      port: 3000,
      logLevel: 'silent',
      allowedWebOrigins: ['http://localhost:8081', 'https://staging.narrial.com'],
      clerkPublishableKey: 'pk_test_documentation_fixture',
      clerkSecretKey: 'sk_test_documentation_fixture',
      requestTimeoutMs: 10_000,
      handlerTimeoutMs: 5_000,
      keepAliveTimeoutMs: 5_000,
      shutdownGracePeriodMs: 10_000,
    });
  });

  it('fails closed when Clerk backend authentication is not configured', () => {
    expect(() =>
      loadConfig({ ...validEnvironment, CLERK_SECRET_KEY: undefined }),
    ).toThrow('Invalid configuration fields: CLERK_SECRET_KEY');
  });

  it('names invalid fields without including their values', () => {
    const invalidEnvironment = {
      ...validEnvironment,
      PORT: 'not-a-port-secret-value',
      REQUEST_TIMEOUT_MS: undefined,
    };

    expect(() => loadConfig(invalidEnvironment)).toThrow(ConfigError);
    expect(() => loadConfig(invalidEnvironment)).toThrow(
      'Invalid configuration fields: PORT, REQUEST_TIMEOUT_MS',
    );

    try {
      loadConfig(invalidEnvironment);
    } catch (error) {
      expect(String(error)).not.toContain('not-a-port-secret-value');
    }
  });

  it.each([
    '*',
    'https://*.narrial.com',
    'narrial://oauth-return',
    'https://app.narrial.com/path',
  ])('rejects unsafe CORS origin %s', (origin) => {
    expect(() => loadConfig({ ...validEnvironment, ALLOWED_WEB_ORIGINS: origin })).toThrow(
      'Invalid configuration fields: ALLOWED_WEB_ORIGINS',
    );
  });
});
