import { describe, expect, it } from 'vitest';

import { GoogleOAuthProvider } from '../src/youtube/infrastructure/google/google-oauth-provider.js';

describe('GoogleOAuthProvider', () => {
  it('exchanges an authorization code once and normalizes the token response', async () => {
    const requests: Array<{ url: string; init: RequestInit | undefined }> = [];
    const provider = new GoogleOAuthProvider(
      { clientId: 'client-id', clientSecret: 'client-secret', timeoutMs: 5_000 },
      (url, init) => {
        const requestUrl = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
        requests.push({ url: requestUrl, init });
        return Promise.resolve(new Response(JSON.stringify({
          access_token: 'access-secret',
          refresh_token: 'refresh-secret',
          expires_in: 3600,
          scope: 'scope.read scope.write',
          token_type: 'Bearer',
        }), { status: 200, headers: { 'content-type': 'application/json' } }));
      },
    );

    await expect(provider.exchangeCode({
      code: 'authorization-secret',
      redirectUri: 'https://api.narial.in/api/v1/youtube/oauth/callback',
    })).resolves.toEqual({
      accessToken: 'access-secret',
      refreshToken: 'refresh-secret',
      expiresIn: 3600,
      grantedScopes: ['scope.read', 'scope.write'],
      tokenType: 'Bearer',
    });
    expect(requests).toHaveLength(1);
    expect(requests[0]?.url).toBe('https://oauth2.googleapis.com/token');
    const rawBody = requests[0]?.init?.body;
    expect(typeof rawBody).toBe('string');
    const body = new URLSearchParams(typeof rawBody === 'string' ? rawBody : '');
    expect(body.get('grant_type')).toBe('authorization_code');
    expect(body.get('code')).toBe('authorization-secret');
    expect(body.get('client_id')).toBe('client-id');
    expect(body.get('client_secret')).toBe('client-secret');
    expect(body.get('redirect_uri')).toBe('https://api.narial.in/api/v1/youtube/oauth/callback');
  });

  it.each([
    [{ access_token: '', expires_in: 3600, token_type: 'Bearer', scope: 'scope.read' }],
    [{ access_token: 'token', expires_in: 0, token_type: 'Bearer', scope: 'scope.read' }],
    [{ access_token: 'token', expires_in: 3600, token_type: 'MAC', scope: 'scope.read' }],
    [{ access_token: 'token', expires_in: 3600, token_type: 'Bearer', scope: 42 }],
  ])('rejects malformed token responses without exposing their contents', async (payload) => {
    const provider = new GoogleOAuthProvider(
      { clientId: 'client-id', clientSecret: 'client-secret', timeoutMs: 5_000 },
      () => Promise.resolve(new Response(JSON.stringify(payload), { status: 200 })),
    );

    await expect(provider.exchangeCode({ code: 'code', redirectUri: 'https://callback.example' }))
      .rejects.toMatchObject({ code: 'OAUTH_CODE_EXCHANGE_FAILED' });
  });

  it('normalizes provider rejection and does not retry the authorization code', async () => {
    let attempts = 0;
    const provider = new GoogleOAuthProvider(
      { clientId: 'client-id', clientSecret: 'client-secret', timeoutMs: 5_000 },
      () => {
        attempts += 1;
        return Promise.resolve(new Response(JSON.stringify({ error: 'invalid_grant', error_description: 'secret detail' }), { status: 400 }));
      },
    );

    const error = await provider.exchangeCode({ code: 'code', redirectUri: 'https://callback.example' })
      .catch((caught: unknown) => caught);
    expect(error).toMatchObject({ code: 'OAUTH_CODE_EXCHANGE_FAILED' });
    expect(String(error)).not.toContain('invalid_grant');
    expect(String(error)).not.toContain('secret detail');
    expect(attempts).toBe(1);
  });
});
