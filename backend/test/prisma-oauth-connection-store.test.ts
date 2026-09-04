import { describe, expect, it } from 'vitest';

import { PrismaOAuthConnectionStore } from '../src/youtube/infrastructure/database/prisma-oauth-connection-store.js';
import { CredentialVault, LocalCredentialKeyAdapter } from '../src/youtube/infrastructure/security/credential-vault.js';

describe('PrismaOAuthConnectionStore', () => {
  it('passes only encrypted credentials into the atomic persistence boundary', async () => {
    const writes: unknown[] = [];
    const persistence = {
      completeInitialOAuthConnection(input: unknown) {
        writes.push(input);
        return Promise.resolve();
      },
    };
    const vault = new CredentialVault(new LocalCredentialKeyAdapter({
      activeKeyVersion: 'test-v1',
      keys: new Map([['test-v1', Buffer.alloc(32, 0x44)]]),
    }));
    const store = new PrismaOAuthConnectionStore(persistence, vault, 'test', {
      randomId: () => '00000000-0000-4000-8000-000000000002',
      now: () => new Date('2026-09-04T12:00:00.000Z'),
    });

    await store.completeInitial({
      ownerId: 'owner-id',
      channel: { id: 'channel-id', title: 'Safe channel' },
      credential: {
        credentialSchemaVersion: 1,
        accessToken: 'plaintext-access-canary',
        refreshToken: 'plaintext-refresh-canary',
        tokenType: 'Bearer',
        grantedScopes: ['scope.read'],
        issuedAt: '2026-09-04T12:00:00.000Z',
        accessTokenExpiresAt: '2026-09-04T13:00:00.000Z',
      },
    });

    expect(writes).toHaveLength(1);
    const serialized = JSON.stringify(writes);
    expect(serialized).not.toContain('plaintext-access-canary');
    expect(serialized).not.toContain('plaintext-refresh-canary');
    expect(writes[0]).toMatchObject({
      connectionId: '00000000-0000-4000-8000-000000000002',
      ownerId: 'owner-id',
      youtubeChannelId: 'channel-id',
      channelTitle: 'Safe channel',
      grantedScopes: ['scope.read'],
      hasRefreshToken: true,
    });
  });
});
