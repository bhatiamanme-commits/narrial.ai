import type { OAuthProvider, OAuthTokens } from '../../application/oauth-service.js';

const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

export class OAuthCodeExchangeError extends Error {
  readonly code = 'OAUTH_CODE_EXCHANGE_FAILED';

  constructor() {
    super('Google authorization could not be completed');
    this.name = 'OAuthCodeExchangeError';
  }
}

type FetchImplementation = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export class GoogleOAuthProvider implements OAuthProvider {
  constructor(
    private readonly config: { clientId: string; clientSecret: string; timeoutMs: number },
    private readonly fetchImplementation: FetchImplementation = fetch,
  ) {}

  async exchangeCode(input: { code: string; redirectUri: string }): Promise<OAuthTokens> {
    try {
      const response = await this.fetchImplementation(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code: input.code,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          redirect_uri: input.redirectUri,
          grant_type: 'authorization_code',
        }).toString(),
        redirect: 'error',
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
      if (!response.ok) throw new OAuthCodeExchangeError();

      const value: unknown = await response.json();
      if (typeof value !== 'object' || value === null) throw new OAuthCodeExchangeError();
      const token = value as Record<string, unknown>;
      if (
        typeof token.access_token !== 'string' || token.access_token.length === 0 ||
        typeof token.expires_in !== 'number' || !Number.isSafeInteger(token.expires_in) || token.expires_in <= 0 ||
        token.token_type !== 'Bearer' ||
        typeof token.scope !== 'string'
      ) throw new OAuthCodeExchangeError();
      if (token.refresh_token !== undefined && (
        typeof token.refresh_token !== 'string' || token.refresh_token.length === 0
      )) throw new OAuthCodeExchangeError();

      return {
        accessToken: token.access_token,
        ...(token.refresh_token === undefined ? {} : { refreshToken: token.refresh_token }),
        tokenType: 'Bearer',
        expiresIn: token.expires_in,
        grantedScopes: [...new Set(token.scope.split(/\s+/).filter(Boolean))],
      };
    } catch {
      throw new OAuthCodeExchangeError();
    }
  }
}
