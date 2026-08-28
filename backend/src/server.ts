import { buildApp } from './app.js';
import { ClerkAuthenticationVerifier } from './auth/clerk-authentication-verifier.js';
import { ConfigError, loadConfig } from './config/env.js';
import { registerShutdownHandlers } from './lifecycle/shutdown.js';
import { EmptyYouTubeConnectionRepository } from './youtube/infrastructure/empty-connection-repository.js';

try {
  const config = loadConfig(process.env);
  const authenticationVerifier = new ClerkAuthenticationVerifier({
    publishableKey: config.clerkPublishableKey,
    secretKey: config.clerkSecretKey,
    authorizedParties: config.allowedWebOrigins,
  });
  const app = buildApp({
    config,
    authenticationVerifier,
    connectionRepository: new EmptyYouTubeConnectionRepository(),
  });
  registerShutdownHandlers(app, config.shutdownGracePeriodMs);
  await app.listen({ host: config.host, port: config.port });
} catch (error) {
  const message = error instanceof ConfigError ? error.message : 'Backend failed to start';
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}
