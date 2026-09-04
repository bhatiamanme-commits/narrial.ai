import { describe, expect, it } from 'vitest';

import {
  InitialOAuthCompletion,
  OAuthCompletionError,
} from '../src/youtube/application/oauth-completion.js';

const validTokens = {
  accessToken: 'access-secret',
  refreshToken: 'refresh-secret',
  tokenType: 'Bearer' as const,
  expiresIn: 3600,
  grantedScopes: ['scope.read'],
};

describe('InitialOAuthCompletion', () => {
  it('discovers the authorized channel and passes normalized credentials to secure persistence', async () => {
    const persisted: unknown[] = [];
    const completion = new InitialOAuthCompletion(
      { getOwnChannel: () => Promise.resolve({ id: 'channel-id', title: 'Safe channel' }) },
      { completeInitial: (input) => { persisted.push(input); return Promise.resolve(); } },
      () => new Date('2026-09-04T12:00:00.000Z'),
    );

    await completion.complete({
      ownerId: 'owner-id', tokens: validTokens, requestedScopes: ['scope.read'],
    });

    expect(persisted).toEqual([{
      ownerId: 'owner-id',
      channel: { id: 'channel-id', title: 'Safe channel' },
      credential: {
        credentialSchemaVersion: 1,
        accessToken: 'access-secret',
        refreshToken: 'refresh-secret',
        tokenType: 'Bearer',
        grantedScopes: ['scope.read'],
        issuedAt: '2026-09-04T12:00:00.000Z',
        accessTokenExpiresAt: '2026-09-04T13:00:00.000Z',
      },
    }]);
  });

  it('rejects missing requested permission before channel discovery or persistence', async () => {
    let channelCalls = 0;
    const completion = new InitialOAuthCompletion(
      { getOwnChannel: () => { channelCalls += 1; return Promise.resolve({ id: 'id', title: 'title' }); } },
      { completeInitial: () => Promise.resolve() },
    );

    await expect(completion.complete({
      ownerId: 'owner-id',
      tokens: { ...validTokens, grantedScopes: [] },
      requestedScopes: ['scope.read'],
    })).rejects.toMatchObject({ code: 'YOUTUBE_PERMISSION_REQUIRED' });
    expect(channelCalls).toBe(0);
  });

  it('requires a refresh token for the initial offline connection', async () => {
    const completion = new InitialOAuthCompletion(
      { getOwnChannel: () => Promise.resolve({ id: 'id', title: 'title' }) },
      { completeInitial: () => Promise.resolve() },
    );
    const tokens = {
      accessToken: validTokens.accessToken,
      tokenType: validTokens.tokenType,
      expiresIn: validTokens.expiresIn,
      grantedScopes: validTokens.grantedScopes,
    };

    await expect(completion.complete({ ownerId: 'owner-id', tokens, requestedScopes: ['scope.read'] }))
      .rejects.toBeInstanceOf(OAuthCompletionError);
  });
});
