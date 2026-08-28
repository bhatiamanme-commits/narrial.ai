import { randomUUID } from 'node:crypto';
import { PrismaPg } from '@prisma/adapter-pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { PrismaClient } from '../src/generated/prisma/client.js';
import {
  IdempotencyPayloadMismatchError,
  PrismaYouTubePersistence,
} from '../src/youtube/infrastructure/database/youtube-persistence.js';
import { PrismaCredentialVault } from '../src/youtube/infrastructure/security/prisma-credential-vault.js';
import {
  CredentialVault,
  LocalCredentialKeyAdapter,
} from '../src/youtube/infrastructure/security/credential-vault.js';

process.loadEnvFile();

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const persistence = new PrismaYouTubePersistence(prisma);
const ownerA = `b05-owner-a-${randomUUID()}`;
const ownerB = `b05-owner-b-${randomUUID()}`;

beforeAll(async () => prisma.$connect());
afterAll(async () => prisma.$disconnect());

describe('YouTube persistence isolation and transactions', () => {
  it('persists only an authenticated envelope and resolves its stored key version through the vault', async () => {
    const connectionId = randomUUID();
    await persistence.saveConnection({
      id: connectionId, ownerId: ownerA, youtubeChannelId: randomUUID(), channelTitle: 'Vault fixture',
    });
    const plaintextCanary = randomUUID();
    const vault = new PrismaCredentialVault(
      persistence,
      new CredentialVault(new LocalCredentialKeyAdapter({
        activeKeyVersion: 'test-v1', keys: new Map([['test-v1', Buffer.alloc(32, 0x44)]]),
      })),
      'test',
    );

    await vault.store({
      connectionId,
      ownerId: ownerA,
      credential: {
        credentialSchemaVersion: 1, accessToken: plaintextCanary, refreshToken: randomUUID(),
        tokenType: 'Bearer', grantedScopes: ['youtube.upload'],
        accessTokenExpiresAt: '2030-01-01T00:00:00.000Z', issuedAt: '2029-12-31T23:00:00.000Z',
      },
    });

    const row = await prisma.youTubeConnectionCredential.findUniqueOrThrow({ where: { connectionId } });
    expect(row.keyVersion).toBe('test-v1');
    expect(JSON.stringify(row)).not.toContain(plaintextCanary);
    await expect(vault.use(connectionId, ownerB, (credential) => credential.tokenType)).rejects.toThrow(
      'CREDENTIAL_UNAVAILABLE',
    );
    await expect(vault.use(connectionId, ownerA, (credential) => credential.accessToken === plaintextCanary))
      .resolves.toBe(true);
  });

  it('keeps connection reads user-scoped and excludes credential bytes', async () => {
    const connectionId = randomUUID();
    await persistence.saveConnection({
      id: connectionId,
      ownerId: ownerA,
      youtubeChannelId: `channel-${randomUUID()}`,
      channelTitle: 'Synthetic channel',
    });

    expect(await persistence.findConnectionForUser(connectionId, ownerB)).toBeNull();
    const owned = await persistence.findConnectionForUser(connectionId, ownerA);
    expect(owned).toMatchObject({ id: connectionId, ownerId: ownerA });
    expect(owned).not.toHaveProperty('credential');
    expect(owned).not.toHaveProperty('ciphertext');

    await persistence.saveCredentialRecord({
      connectionId,
      ownerId: ownerA,
      ciphertext: Buffer.from('synthetic-undecryptable-bytes'),
      initializationVector: Buffer.from('synthetic-iv'),
      authenticationTag: Buffer.from('synthetic-tag'),
      keyVersion: 'test-v1',
      credentialSchemaVersion: 1,
      hasRefreshToken: true,
    });
    expect(await persistence.findCredentialRecord(connectionId, ownerB)).toBeNull();
    expect(await persistence.findCredentialRecord(connectionId, ownerA)).toMatchObject({
      connectionId,
      keyVersion: 'test-v1',
      hasRefreshToken: true,
    });
  });

  it('allows exactly one concurrent OAuth transaction consumption', async () => {
    const id = randomUUID();
    const stateHash = Buffer.from(randomUUID());
    await persistence.createOAuthTransaction({
      id,
      ownerId: ownerA,
      stateHash,
      returnDestination: 'app',
      requestedScopes: ['youtube.upload'],
      expiresAt: new Date(Date.now() + 60_000),
    });

    const results = await Promise.all(
      Array.from({ length: 8 }, () =>
        persistence.consumeOAuthTransaction({ ownerId: ownerA, stateHash, now: new Date() }),
      ),
    );

    expect(results.filter((result) => result !== null)).toHaveLength(1);
    expect(await persistence.consumeOAuthTransaction({ ownerId: ownerB, stateHash, now: new Date() })).toBeNull();
  });

  it('claims idempotency once, returns stored outcomes, and rejects payload mismatch', async () => {
    const keyHash = Buffer.from(randomUUID());
    const requestHash = Buffer.from('request-a');
    const claims = await Promise.all(
      Array.from({ length: 8 }, () => persistence.claimIdempotency({
        id: randomUUID(),
        ownerId: ownerA,
        operationType: 'UPLOAD_CREATE',
        keyHash,
        requestHash,
        expiresAt: new Date(Date.now() + 60_000),
      })),
    );
    expect(claims.filter(({ kind }) => kind === 'CLAIMED')).toHaveLength(1);
    expect(claims.filter(({ kind }) => kind === 'IN_PROGRESS')).toHaveLength(7);

    const recordId = claims[0]!.recordId;
    await persistence.storeIdempotencyOutcome({
      recordId,
      ownerId: ownerA,
      status: 'SUCCEEDED',
      resourceType: 'YOUTUBE_UPLOAD',
      resourceId: randomUUID(),
      safeResponse: { status: 'QUEUED' },
    });
    await expect(persistence.claimIdempotency({
      id: randomUUID(), ownerId: ownerA, operationType: 'UPLOAD_CREATE', keyHash,
      requestHash: Buffer.from('different'), expiresAt: new Date(Date.now() + 60_000),
    })).rejects.toBeInstanceOf(IdempotencyPayloadMismatchError);
    await expect(persistence.claimIdempotency({
      id: randomUUID(), ownerId: ownerA, operationType: 'UPLOAD_CREATE', keyHash,
      requestHash, expiresAt: new Date(Date.now() + 60_000),
    })).resolves.toMatchObject({ kind: 'REPLAY', safeResponse: { status: 'QUEUED' } });
  });

  it('enforces aggregate ownership and commits upload, durable intent, status, and audit atomically', async () => {
    const ownerAConnection = randomUUID();
    const ownerBConnection = randomUUID();
    await persistence.saveConnection({ id: ownerAConnection, ownerId: ownerA, youtubeChannelId: randomUUID(), channelTitle: 'A' });
    await persistence.saveConnection({ id: ownerBConnection, ownerId: ownerB, youtubeChannelId: randomUUID(), channelTitle: 'B' });
    const sourceId = randomUUID();
    await persistence.saveVideoSource({
      id: sourceId, ownerId: ownerA, storageObjectKey: randomUUID(), originalFilename: 'fixture.mp4',
      mimeType: 'video/mp4', byteSize: 10n, checksumSha256: Buffer.alloc(32),
    });

    await expect(persistence.createUploadIntent({
      id: randomUUID(), ownerId: ownerA, connectionId: ownerBConnection, videoSourceId: sourceId,
      totalBytes: 10n, outboxId: randomUUID(), statusEventId: randomUUID(), auditEventId: randomUUID(),
    })).rejects.toBeDefined();

    const uploadId = randomUUID();
    await persistence.createUploadIntent({
      id: uploadId, ownerId: ownerA, connectionId: ownerAConnection, videoSourceId: sourceId,
      totalBytes: 10n, outboxId: randomUUID(), statusEventId: randomUUID(), auditEventId: randomUUID(),
    });
    expect(await prisma.youTubeOutboxEvent.count({ where: { aggregateId: uploadId } })).toBe(1);
    expect(await prisma.youTubeStatusEvent.count({ where: { aggregateId: uploadId } })).toBe(1);
    expect(await prisma.youTubeAuditEvent.count({ where: { targetId: uploadId } })).toBe(1);

    const transitions = await Promise.all(Array.from({ length: 8 }, () =>
      persistence.transitionUpload({ id: uploadId, ownerId: ownerA, expectedVersion: 1, status: 'UPLOADING' }),
    ));
    expect(transitions.filter(Boolean)).toHaveLength(1);
  });
});
