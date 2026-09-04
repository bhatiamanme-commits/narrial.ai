import { afterEach, describe, expect, it } from 'vitest';

import { buildApp } from '../src/app.js';
import type { AuthenticatedUser, AuthenticationVerifier } from '../src/auth/authentication-verifier.js';
import type {
  YouTubeConnection,
  YouTubeConnectionRepository,
} from '../src/youtube/application/ports.js';
import { testConfig } from './fixtures/config.js';

const apps: Array<ReturnType<typeof buildApp>> = [];

class FakeAuthenticationVerifier implements AuthenticationVerifier {
  constructor(private readonly sessions: ReadonlyMap<string, AuthenticatedUser>) {}

  verify(request: Request): Promise<AuthenticatedUser | null> {
    const authorizationHeader = request.headers.get('authorization');
    return Promise.resolve(
      authorizationHeader ? (this.sessions.get(authorizationHeader) ?? null) : null,
    );
  }
}

class FakeYouTubeConnectionRepository implements YouTubeConnectionRepository {
  constructor(private readonly connections: readonly YouTubeConnection[]) {}

  findByIdForUser(connectionId: string, userId: string): Promise<YouTubeConnection | null> {
    return Promise.resolve(
      this.connections.find(
        (connection) => connection.id === connectionId && connection.ownerId === userId,
      ) ?? null
    );
  }

  listForUser(userId: string): Promise<YouTubeConnection[]> {
    return Promise.resolve(this.connections.filter((connection) => connection.ownerId === userId));
  }
}

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

function createApp() {
  const authenticationVerifier = new FakeAuthenticationVerifier(
    new Map([
      ['Bearer session-owner-a', { userId: 'user_owner_a' }],
      ['Bearer session-owner-b', { userId: 'user_owner_b' }],
    ]),
  );
  const connectionRepository = new FakeYouTubeConnectionRepository([
    {
      id: 'ytc_owner_a_123',
      ownerId: 'user_owner_a',
      platform: 'YOUTUBE',
      channel: { id: 'channel_safe_123', title: 'Owner A channel' },
      status: 'CONNECTED',
      credentialEnvelope: 'must-never-be-serialized',
    },
  ]);
  const app = buildApp({ config: testConfig, authenticationVerifier, connectionRepository });
  apps.push(app);
  return app;
}

describe('authenticated YouTube module boundary', () => {
  it('lists only the authenticated user\'s safe connection fields', async () => {
    const response = await createApp().inject({
      method: 'GET',
      url: '/api/v1/youtube/connections',
      headers: { authorization: 'Bearer session-owner-a' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      data: [{
        id: 'ytc_owner_a_123',
        platform: 'YOUTUBE',
        channel: { id: 'channel_safe_123', title: 'Owner A channel' },
        status: 'CONNECTED',
      }],
    });
    expect(response.body).not.toContain('ownerId');
    expect(response.body).not.toContain('credentialEnvelope');
  });

  it('rejects a missing Narrial session', async () => {
    const response = await createApp().inject({
      method: 'GET',
      url: '/api/v1/youtube/connections/ytc_owner_a_123',
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
    });
  });

  it('rejects an invalid Narrial session', async () => {
    const response = await createApp().inject({
      method: 'GET',
      url: '/api/v1/youtube/connections/ytc_owner_a_123',
      headers: { authorization: 'Bearer forged-session' },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      error: { code: 'AUTHENTICATION_REQUIRED', message: 'Authentication required' },
    });
  });

  it('derives ownership from the verified session and serializes only safe fields', async () => {
    const response = await createApp().inject({
      method: 'GET',
      url: '/api/v1/youtube/connections/ytc_owner_a_123',
      headers: { authorization: 'Bearer session-owner-a' },
    });

    expect(response.statusCode).toBe(200);
    const body: unknown = response.json();
    expect(body).toMatchObject({
      data: {
        id: 'ytc_owner_a_123',
        platform: 'YOUTUBE',
        channel: { id: 'channel_safe_123', title: 'Owner A channel' },
        status: 'CONNECTED',
      },
    });
    expect(typeof (body as { requestId: unknown }).requestId).toBe('string');
    expect(response.body).not.toContain('ownerId');
    expect(response.body).not.toContain('credentialEnvelope');
    expect(response.body).not.toContain('must-never-be-serialized');
  });

  it('hides another user\'s connection as not found', async () => {
    const response = await createApp().inject({
      method: 'GET',
      url: '/api/v1/youtube/connections/ytc_owner_a_123',
      headers: { authorization: 'Bearer session-owner-b' },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toMatchObject({
      error: { code: 'YOUTUBE_CONNECTION_NOT_FOUND', message: 'YouTube connection not found' },
    });
  });

  it('rejects malformed connection identifiers at the HTTP boundary', async () => {
    const response = await createApp().inject({
      method: 'GET',
      url: '/api/v1/youtube/connections/%20',
      headers: { authorization: 'Bearer session-owner-a' },
    });

    expect(response.statusCode).toBe(400);
    const body: unknown = response.json();
    expect(body).toMatchObject({
      error: { code: 'VALIDATION_ERROR', message: 'The request could not be processed.' },
    });
    expect(typeof (body as { requestId: unknown }).requestId).toBe('string');
  });
});
