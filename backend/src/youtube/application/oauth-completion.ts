import type { CredentialPayload } from '../infrastructure/security/credential-vault.js';
import type { OAuthCompletion, OAuthTokens } from './oauth-service.js';

export interface AuthorizedYouTubeChannel {
  id: string;
  title: string;
}

export interface YouTubeChannelProvider {
  getOwnChannel(accessToken: string): Promise<AuthorizedYouTubeChannel>;
}

export interface OAuthConnectionStore {
  completeInitial(input: {
    ownerId: string;
    channel: AuthorizedYouTubeChannel;
    credential: CredentialPayload;
  }): Promise<void>;
}

export class OAuthCompletionError extends Error {
  constructor(readonly code: string) {
    super('YouTube authorization could not be completed');
    this.name = 'OAuthCompletionError';
  }
}

export class InitialOAuthCompletion implements OAuthCompletion {
  constructor(
    private readonly channels: YouTubeChannelProvider,
    private readonly connections: OAuthConnectionStore,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async complete(input: {
    ownerId: string;
    tokens: OAuthTokens;
    requestedScopes: string[];
  }): Promise<void> {
    const grants = new Set(input.tokens.grantedScopes);
    if (input.requestedScopes.some((scope) => !grants.has(scope))) {
      throw new OAuthCompletionError('YOUTUBE_PERMISSION_REQUIRED');
    }
    if (!input.tokens.refreshToken) {
      throw new OAuthCompletionError('YOUTUBE_REAUTHORIZATION_REQUIRED');
    }

    const issuedAt = this.now();
    const accessTokenExpiresAt = new Date(issuedAt.getTime() + input.tokens.expiresIn * 1000);
    if (Number.isNaN(accessTokenExpiresAt.getTime())) {
      throw new OAuthCompletionError('OAUTH_CODE_EXCHANGE_FAILED');
    }
    const channel = await this.channels.getOwnChannel(input.tokens.accessToken);
    await this.connections.completeInitial({
      ownerId: input.ownerId,
      channel,
      credential: {
        credentialSchemaVersion: 1,
        accessToken: input.tokens.accessToken,
        refreshToken: input.tokens.refreshToken,
        tokenType: input.tokens.tokenType,
        grantedScopes: [...grants],
        issuedAt: issuedAt.toISOString(),
        accessTokenExpiresAt: accessTokenExpiresAt.toISOString(),
      },
    });
  }
}
