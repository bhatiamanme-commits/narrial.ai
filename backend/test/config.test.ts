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
  DATABASE_URL: 'postgresql://test:test@127.0.0.1:5432/test',
  GOOGLE_OAUTH_CLIENT_ID: 'google-test-client-id',
  GOOGLE_OAUTH_CLIENT_SECRET: 'google-test-client-secret',
  GOOGLE_OAUTH_REDIRECT_URI: 'https://api.narial.in/api/v1/youtube/oauth/callback',
  ALLOWED_APP_RETURN_URLS: 'narrial://youtube/connection-return',
  CREDENTIAL_ENCRYPTION_KEY: Buffer.alloc(32, 0x44).toString('base64'),
  CREDENTIAL_ENCRYPTION_KEY_VERSION: 'test-v1',
  OAUTH_STATE_HMAC_KEY: Buffer.alloc(32, 0x55).toString('base64'),
  GEMINI_API_KEY: 'gemini-test-key',
  GEMINI_VIDEO_MODEL: 'gemini-3.8-flash',
  VIDEO_ANALYSIS_TIMEOUT_MS: '120000',
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
      databaseUrl: 'postgresql://test:test@127.0.0.1:5432/test',
      googleOAuthClientId: 'google-test-client-id',
      googleOAuthClientSecret: 'google-test-client-secret',
      googleOAuthRedirectUri: 'https://api.narial.in/api/v1/youtube/oauth/callback',
      allowedAppReturnUrls: ['narrial://youtube/connection-return'],
      credentialEncryptionKey: Buffer.alloc(32, 0x44).toString('base64'),
      credentialEncryptionKeyVersion: 'test-v1',
      oauthStateHmacKey: Buffer.alloc(32, 0x55).toString('base64'),
      geminiApiKey: 'gemini-test-key',
      geminiVideoModel: 'gemini-3.8-flash',
      geminiGenerationModel: 'veo-3.1-fast-generate-preview',
      videoAnalysisTimeoutMs: 120_000,
      videoGenerationTimeoutMs: 30_000,
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

  it('rejects an OAuth redirect URI with the wrong callback path', () => {
    expect(() => loadConfig({
      ...validEnvironment,
      GOOGLE_OAUTH_REDIRECT_URI: 'https://api.narial.in/youtube/oauth/callback',
    })).toThrow('Invalid configuration fields: GOOGLE_OAUTH_REDIRECT_URI');
  });

  it('allows an HTTP loopback app return for local web OAuth', () => {
    expect(loadConfig({
      ...validEnvironment,
      ALLOWED_APP_RETURN_URLS: 'narrial://youtube/connection-return,http://localhost:8081/youtube/connection-return',
    }).allowedAppReturnUrls).toEqual([
      'narrial://youtube/connection-return',
      'http://localhost:8081/youtube/connection-return',
    ]);
  });

  it('rejects insecure non-loopback app returns', () => {
    expect(() => loadConfig({
      ...validEnvironment,
      ALLOWED_APP_RETURN_URLS: 'http://app.narial.in/youtube/connection-return',
    })).toThrow('Invalid configuration fields: ALLOWED_APP_RETURN_URLS');
  });

  it('accepts only a production-scoped encryption-key version in production', () => {
    expect(loadConfig({
      ...validEnvironment,
      NODE_ENV: 'production',
      CREDENTIAL_ENCRYPTION_KEY_VERSION: 'production-v1',
    }).credentialEncryptionKeyVersion).toBe('production-v1');
    expect(() => loadConfig({
      ...validEnvironment,
      NODE_ENV: 'production',
      CREDENTIAL_ENCRYPTION_KEY_VERSION: 'local-v1',
    })).toThrow('Invalid configuration fields: CREDENTIAL_ENCRYPTION_KEY_VERSION');
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
