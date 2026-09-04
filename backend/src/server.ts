import { buildApp } from './app.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { ClerkAuthenticationVerifier } from './auth/clerk-authentication-verifier.js';
import { ConfigError, loadConfig } from './config/env.js';
import { PrismaClient } from './generated/prisma/client.js';
import { registerShutdownHandlers } from './lifecycle/shutdown.js';
import { InitialOAuthCompletion } from './youtube/application/oauth-completion.js';
import { YouTubeOAuthService } from './youtube/application/oauth-service.js';
import { PrismaConnectionRepository } from './youtube/infrastructure/database/prisma-connection-repository.js';
import { PrismaOAuthConnectionStore } from './youtube/infrastructure/database/prisma-oauth-connection-store.js';
import { PrismaOAuthTransactionRepository } from './youtube/infrastructure/database/prisma-oauth-transaction-repository.js';
import { PrismaYouTubePersistence } from './youtube/infrastructure/database/youtube-persistence.js';
import { GoogleOAuthProvider } from './youtube/infrastructure/google/google-oauth-provider.js';
import { GoogleYouTubeChannelProvider } from './youtube/infrastructure/google/google-youtube-channel-provider.js';
import { CredentialVault, LocalCredentialKeyAdapter, ProductionCredentialKeyAdapter } from './youtube/infrastructure/security/credential-vault.js';

try {
  const config = loadConfig(process.env);
  const authenticationVerifier = new ClerkAuthenticationVerifier({
    publishableKey: config.clerkPublishableKey,
    secretKey: config.clerkSecretKey,
    authorizedParties: config.allowedWebOrigins,
  });
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: config.databaseUrl }),
  });
  const persistence = new PrismaYouTubePersistence(prisma);
  const environment = config.nodeEnv === 'production' ? 'production' : config.nodeEnv === 'test' ? 'test' : 'local';
  const key = Buffer.from(config.credentialEncryptionKey, 'base64');
  const keyAdapter = config.nodeEnv === 'production'
    ? new ProductionCredentialKeyAdapter({ activeKeyVersion: config.credentialEncryptionKeyVersion, key })
    : new LocalCredentialKeyAdapter({
      activeKeyVersion: config.credentialEncryptionKeyVersion,
      keys: new Map([[config.credentialEncryptionKeyVersion, key]]),
    });
  const credentialVault = new CredentialVault(keyAdapter);
  const connectionStore = new PrismaOAuthConnectionStore(
    persistence,
    credentialVault,
    environment,
  );
  const oauthService = new YouTubeOAuthService({
    clientId: config.googleOAuthClientId,
    redirectUri: config.googleOAuthRedirectUri,
    allowedReturnDestinations: config.allowedAppReturnUrls,
    scopes: [
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/youtube.upload',
    ],
    transactionTtlMs: 10 * 60 * 1000,
    stateHashKey: Buffer.from(config.oauthStateHmacKey, 'base64'),
  }, new PrismaOAuthTransactionRepository(persistence), new GoogleOAuthProvider({
    clientId: config.googleOAuthClientId,
    clientSecret: config.googleOAuthClientSecret,
    timeoutMs: config.handlerTimeoutMs,
  }), new InitialOAuthCompletion(
    new GoogleYouTubeChannelProvider(fetch, config.handlerTimeoutMs),
    connectionStore,
  ));
  const app = buildApp({
    config,
    authenticationVerifier,
    connectionRepository: new PrismaConnectionRepository(persistence),
    oauthService,
  });
  app.addHook('onClose', async () => prisma.$disconnect());
  registerShutdownHandlers(app, config.shutdownGracePeriodMs);
  await app.listen({ host: config.host, port: config.port });
} catch (error) {
  const message = error instanceof ConfigError ? error.message : 'Backend failed to start';
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}
