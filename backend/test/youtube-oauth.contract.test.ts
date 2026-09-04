import { createHmac } from 'node:crypto';
import { afterEach, describe, expect, it } from 'vitest';

import { buildApp } from '../src/app.js';
import type { AuthenticatedUser, AuthenticationVerifier } from '../src/auth/authentication-verifier.js';
import {
  YouTubeOAuthService,
  type OAuthCompletion,
  type OAuthProvider,
  type OAuthTransaction,
  type OAuthTransactionRepository,
} from '../src/youtube/application/oauth-service.js';
import { testConfig } from './fixtures/config.js';

class FakeAuthenticationVerifier implements AuthenticationVerifier {
  verify(request: Request): Promise<AuthenticatedUser | null> {
    return Promise.resolve(
      request.headers.get('authorization') === 'Bearer valid'
        ? { userId: 'user_owner_a' }
        : null,
    );
  }
}

class InMemoryTransactions implements OAuthTransactionRepository {
  readonly records = new Map<string, OAuthTransaction>();
  readonly outcomes: string[] = [];

  create(transaction: OAuthTransaction): Promise<void> {
    this.records.set(transaction.stateHash, transaction);
    return Promise.resolve();
  }

  consume(stateHash: string, now: Date): Promise<OAuthTransaction | null> {
    const transaction = this.records.get(stateHash);
    if (!transaction || transaction.consumedAt || transaction.expiresAt <= now) return Promise.resolve(null);
    transaction.consumedAt = now;
    return Promise.resolve(transaction);
  }

  finish(_transactionId: string, outcome: 'COMPLETED' | 'DENIED' | 'FAILED'): Promise<void> {
    this.outcomes.push(outcome);
    return Promise.resolve();
  }
}

class FakeProvider implements OAuthProvider {
  exchanges = 0;

  exchangeCode(): Promise<{ accessToken: string; refreshToken: string; tokenType: 'Bearer'; expiresIn: number; grantedScopes: string[] }> {
    this.exchanges += 1;
    return Promise.resolve({
      accessToken: 'access-secret',
      refreshToken: 'refresh-secret',
      tokenType: 'Bearer',
      expiresIn: 3600,
      grantedScopes: ['https://www.googleapis.com/auth/youtube.readonly'],
    });
  }
}

class FakeCompletion implements OAuthCompletion {
  complete(): Promise<void> {
    return Promise.resolve();
  }
}

const apps: Array<ReturnType<typeof buildApp>> = [];

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

function createApp() {
  const transactions = new InMemoryTransactions();
  const provider = new FakeProvider();
  const oauthService = new YouTubeOAuthService({
    clientId: 'google-client-id',
    redirectUri: 'https://api.narial.in/api/v1/youtube/oauth/callback',
    allowedReturnDestinations: ['narrial://youtube/connection-return'],
    scopes: ['https://www.googleapis.com/auth/youtube.readonly'],
    transactionTtlMs: 10 * 60 * 1000,
    stateHashKey: Buffer.alloc(32, 0x55),
  }, transactions, provider, new FakeCompletion(), {
    now: () => new Date('2026-09-04T12:00:00.000Z'),
    randomState: () => 'state-with-at-least-32-bytes-of-entropy',
    randomId: () => '00000000-0000-4000-8000-000000000001',
  });
  const app = buildApp({
    config: testConfig,
    authenticationVerifier: new FakeAuthenticationVerifier(),
    connectionRepository: {
      findByIdForUser: () => Promise.resolve(null),
      listForUser: () => Promise.resolve([]),
    },
    oauthService,
  });
  apps.push(app);
  return { app, transactions, provider };
}

describe('YouTube OAuth HTTP contract', () => {
  it('requires authentication before creating an authorization', async () => {
    const { app } = createApp();
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/youtube/oauth/authorizations',
      payload: { returnDestination: 'narrial://youtube/connection-return' },
    });

    expect(response.statusCode).toBe(401);
  });

  it('creates a server-owned Google authorization URL and stores only a state digest', async () => {
    const { app, transactions } = createApp();
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/youtube/oauth/authorizations',
      headers: { authorization: 'Bearer valid' },
      payload: { returnDestination: 'narrial://youtube/connection-return' },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json<{ data: { authorizationUrl: string; expiresAt: string } }>();
    const url = new URL(body.data.authorizationUrl);
    expect(url.origin + url.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');
    expect(url.searchParams.get('client_id')).toBe('google-client-id');
    expect(url.searchParams.get('redirect_uri')).toBe('https://api.narial.in/api/v1/youtube/oauth/callback');
    expect(url.searchParams.get('response_type')).toBe('code');
    expect(url.searchParams.get('access_type')).toBe('offline');
    expect(url.searchParams.get('include_granted_scopes')).toBe('true');
    expect(url.searchParams.get('state')).toBe('state-with-at-least-32-bytes-of-entropy');
    expect([...transactions.records.keys()]).not.toContain('state-with-at-least-32-bytes-of-entropy');
    expect([...transactions.records.keys()]).toEqual([
      createHmac('sha256', Buffer.alloc(32, 0x55))
        .update('state-with-at-least-32-bytes-of-entropy', 'utf8')
        .digest('base64url'),
    ]);
    expect(body.data.expiresAt).toBe('2026-09-04T12:10:00.000Z');
  });

  it('rejects a return destination outside the exact allowlist', async () => {
    const { app } = createApp();
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/youtube/oauth/authorizations',
      headers: { authorization: 'Bearer valid' },
      payload: { returnDestination: 'https://attacker.example/steal' },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({ error: { code: 'OAUTH_RETURN_DESTINATION_INVALID' } });
  });

  it('consumes callback state once, exchanges the code, and redirects without secrets', async () => {
    const { app, provider, transactions } = createApp();
    const started = await app.inject({
      method: 'POST',
      url: '/api/v1/youtube/oauth/authorizations',
      headers: { authorization: 'Bearer valid' },
      payload: { returnDestination: 'narrial://youtube/connection-return' },
    });
    const startedBody = started.json<{ data: { authorizationUrl: string } }>();
    const state = new URL(startedBody.data.authorizationUrl).searchParams.get('state')!;

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/youtube/oauth/callback?code=authorization-secret&state=${encodeURIComponent(state)}`,
    });

    expect(response.statusCode).toBe(303);
    expect(response.headers.location).toBe('narrial://youtube/connection-return?result=connected');
    expect(response.headers.location).not.toContain('authorization-secret');
    expect(response.headers.location).not.toContain(state);
    expect(provider.exchanges).toBe(1);
    expect(transactions.outcomes).toEqual(['COMPLETED']);

    const replay = await app.inject({
      method: 'GET',
      url: `/api/v1/youtube/oauth/callback?code=authorization-secret&state=${encodeURIComponent(state)}`,
    });
    expect(replay.statusCode).toBe(400);
    expect(provider.exchanges).toBe(1);
  });

  it('treats consent denial as cancellation without exchanging a code', async () => {
    const { app, provider, transactions } = createApp();
    const started = await app.inject({
      method: 'POST',
      url: '/api/v1/youtube/oauth/authorizations',
      headers: { authorization: 'Bearer valid' },
      payload: { returnDestination: 'narrial://youtube/connection-return' },
    });
    const startedBody = started.json<{ data: { authorizationUrl: string } }>();
    const state = new URL(startedBody.data.authorizationUrl).searchParams.get('state')!;

    const response = await app.inject({
      method: 'GET',
      url: `/api/v1/youtube/oauth/callback?error=access_denied&state=${encodeURIComponent(state)}`,
    });

    expect(response.statusCode).toBe(303);
    expect(response.headers.location).toBe('narrial://youtube/connection-return?result=cancelled');
    expect(provider.exchanges).toBe(0);
    expect(transactions.outcomes).toEqual(['DENIED']);
  });
});
