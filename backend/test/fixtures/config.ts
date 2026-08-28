import type { AppConfig } from '../../src/config/env.js';

export const testConfig: AppConfig = {
  nodeEnv: 'test',
  host: '127.0.0.1',
  port: 3000,
  logLevel: 'silent',
  allowedWebOrigins: ['http://localhost:8081'],
  clerkPublishableKey: 'pk_test_documentation_fixture',
  clerkSecretKey: 'sk_test_documentation_fixture',
  requestTimeoutMs: 10_000,
  handlerTimeoutMs: 5_000,
  keepAliveTimeoutMs: 5_000,
  shutdownGracePeriodMs: 10_000,
};
