import { Prisma, type PrismaClient } from '../../../generated/prisma/client.js';

const toPrismaBytes = (value: Uint8Array): Uint8Array<ArrayBuffer> => Uint8Array.from(value);

export class IdempotencyPayloadMismatchError extends Error {
  readonly code = 'IDEMPOTENCY_KEY_REUSED';
}

type ConnectionInput = {
  id: string;
  ownerId: string;
  youtubeChannelId: string;
  channelTitle: string;
};

type OAuthInput = {
  id: string;
  ownerId: string;
  stateHash: Uint8Array;
  returnDestination: string;
  requestedScopes: string[];
  expiresAt: Date;
};

type IdempotencyClaimInput = {
  id: string;
  ownerId: string;
  operationType: string;
  keyHash: Uint8Array;
  requestHash: Uint8Array;
  expiresAt: Date;
};

export class PrismaYouTubePersistence {
  constructor(private readonly prisma: PrismaClient) {}

  async findOAuthConnectionId(ownerId: string, youtubeChannelId: string): Promise<string | null> {
    const connection = await this.prisma.youTubeConnection.findUnique({
      where: { narrialUserId_youtubeChannelId: { narrialUserId: ownerId, youtubeChannelId } },
      select: { id: true },
    });
    return connection?.id ?? null;
  }

  async saveConnection(input: ConnectionInput) {
    return this.prisma.youTubeConnection.create({
      data: {
        id: input.id,
        narrialUserId: input.ownerId,
        youtubeChannelId: input.youtubeChannelId,
        channelTitle: input.channelTitle,
        status: 'CONNECTED',
      },
      select: { id: true },
    });
  }

  async completeInitialOAuthConnection(input: {
    connectionId: string;
    auditEventId: string;
    ownerId: string;
    youtubeChannelId: string;
    channelTitle: string;
    channelThumbnailUrl?: string;
    ciphertext: Uint8Array;
    initializationVector: Uint8Array;
    authenticationTag: Uint8Array;
    keyVersion: string;
    credentialSchemaVersion: number;
    accessTokenExpiresAt: Date;
    hasRefreshToken: boolean;
    grantedScopes: string[];
    verifiedAt: Date;
  }): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      await transaction.youTubeConnection.upsert({
        where: {
          narrialUserId_youtubeChannelId: {
            narrialUserId: input.ownerId,
            youtubeChannelId: input.youtubeChannelId,
          },
        },
        create: {
          id: input.connectionId,
          narrialUserId: input.ownerId,
          youtubeChannelId: input.youtubeChannelId,
          channelTitle: input.channelTitle,
          ...(input.channelThumbnailUrl ? { channelThumbnailUrl: input.channelThumbnailUrl } : {}),
          status: 'CONNECTED',
          credentialStatus: 'AVAILABLE',
          lastVerifiedAt: input.verifiedAt,
        },
        update: {
          channelTitle: input.channelTitle,
          ...(input.channelThumbnailUrl ? { channelThumbnailUrl: input.channelThumbnailUrl } : {}),
          status: 'CONNECTED',
          credentialStatus: 'AVAILABLE',
          lastVerifiedAt: input.verifiedAt,
          reauthorizationRequiredAt: null,
          disconnectedAt: null,
          version: { increment: 1 },
        },
      });
      await transaction.youTubeConnectionCredential.upsert({
        where: { connectionId: input.connectionId },
        create: {
          connectionId: input.connectionId,
          ciphertext: toPrismaBytes(input.ciphertext),
          initializationVector: toPrismaBytes(input.initializationVector),
          authenticationTag: toPrismaBytes(input.authenticationTag),
          keyVersion: input.keyVersion,
          credentialSchemaVersion: input.credentialSchemaVersion,
          accessTokenExpiresAt: input.accessTokenExpiresAt,
          hasRefreshToken: input.hasRefreshToken,
        },
        update: {
          ciphertext: toPrismaBytes(input.ciphertext),
          initializationVector: toPrismaBytes(input.initializationVector),
          authenticationTag: toPrismaBytes(input.authenticationTag),
          keyVersion: input.keyVersion,
          credentialSchemaVersion: input.credentialSchemaVersion,
          accessTokenExpiresAt: input.accessTokenExpiresAt,
          hasRefreshToken: input.hasRefreshToken,
          lastRefreshedAt: input.verifiedAt,
          refreshFailureCount: 0,
        },
      });
      await transaction.youTubeConnectionScope.deleteMany({
        where: { connectionId: input.connectionId },
      });
      await transaction.youTubeConnectionScope.createMany({
        data: input.grantedScopes.map((scope) => ({
          connectionId: input.connectionId,
          scope,
          grantedAt: input.verifiedAt,
          lastVerifiedAt: input.verifiedAt,
        })),
      });
      await transaction.youTubeAuditEvent.create({
        data: {
          id: input.auditEventId,
          narrialUserId: input.ownerId,
          actorType: 'NARRIAL_USER',
          eventType: 'YOUTUBE_CONNECTION_CREATED',
          targetType: 'YOUTUBE_CONNECTION',
          targetId: input.connectionId,
          outcome: 'SUCCEEDED',
        },
      });
    });
  }

  async findConnectionForUser(id: string, ownerId: string) {
    const record = await this.prisma.youTubeConnection.findFirst({
      where: { id, narrialUserId: ownerId },
      select: {
        id: true,
        narrialUserId: true,
        youtubeChannelId: true,
        channelTitle: true,
        channelThumbnailUrl: true,
        status: true,
        credentialStatus: true,
        version: true,
      },
    });
    return record === null ? null : {
      id: record.id,
      ownerId: record.narrialUserId,
      youtubeChannelId: record.youtubeChannelId,
      channelTitle: record.channelTitle,
      channelThumbnailUrl: record.channelThumbnailUrl,
      status: record.status,
      credentialStatus: record.credentialStatus,
      version: record.version,
    };
  }

  async listConnectionsForUser(ownerId: string) {
    return this.prisma.youTubeConnection.findMany({
      where: { narrialUserId: ownerId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        narrialUserId: true,
        youtubeChannelId: true,
        channelTitle: true,
        channelThumbnailUrl: true,
        status: true,
      },
    });
  }

  async saveCredentialRecord(input: {
    connectionId: string;
    ownerId: string;
    ciphertext: Uint8Array;
    initializationVector: Uint8Array;
    authenticationTag: Uint8Array;
    keyVersion: string;
    credentialSchemaVersion: number;
    hasRefreshToken: boolean;
  }) {
    const connection = await this.prisma.youTubeConnection.findFirst({
      where: { id: input.connectionId, narrialUserId: input.ownerId }, select: { id: true },
    });
    if (connection === null) throw new Error('YOUTUBE_CONNECTION_NOT_FOUND');
    return this.prisma.youTubeConnectionCredential.upsert({
      where: { connectionId: input.connectionId },
      create: {
        connectionId: input.connectionId, ciphertext: toPrismaBytes(input.ciphertext),
        initializationVector: toPrismaBytes(input.initializationVector), authenticationTag: toPrismaBytes(input.authenticationTag),
        keyVersion: input.keyVersion, credentialSchemaVersion: input.credentialSchemaVersion,
        hasRefreshToken: input.hasRefreshToken,
      },
      update: {
        ciphertext: toPrismaBytes(input.ciphertext), initializationVector: toPrismaBytes(input.initializationVector),
        authenticationTag: toPrismaBytes(input.authenticationTag), keyVersion: input.keyVersion,
        credentialSchemaVersion: input.credentialSchemaVersion, hasRefreshToken: input.hasRefreshToken,
      },
      select: { connectionId: true },
    });
  }

  findCredentialRecord(connectionId: string, ownerId: string) {
    return this.prisma.youTubeConnectionCredential.findFirst({
      where: { connectionId, connection: { narrialUserId: ownerId } },
      select: {
        connectionId: true, ciphertext: true, initializationVector: true, authenticationTag: true,
        keyVersion: true, credentialSchemaVersion: true, hasRefreshToken: true,
        accessTokenExpiresAt: true, lastRefreshedAt: true, refreshFailureCount: true,
      },
    });
  }

  saveVideoSource(input: {
    id: string; ownerId: string; storageObjectKey: string; originalFilename: string;
    mimeType: string; byteSize: bigint; checksumSha256: Uint8Array;
  }) {
    return this.prisma.youTubeVideoSource.create({
      data: {
        id: input.id, narrialUserId: input.ownerId, storageObjectKey: input.storageObjectKey,
        originalFilename: input.originalFilename, mimeType: input.mimeType, byteSize: input.byteSize,
        checksumSha256: toPrismaBytes(input.checksumSha256), status: 'AVAILABLE',
      },
      select: { id: true },
    });
  }

  createUploadIntent(input: {
    id: string; ownerId: string; connectionId: string; videoSourceId: string; totalBytes: bigint;
    outboxId: string; statusEventId: string; auditEventId: string;
  }) {
    return this.prisma.$transaction(async (transaction) => {
      const upload = await transaction.youTubeUpload.create({
        data: {
          id: input.id, narrialUserId: input.ownerId, connectionId: input.connectionId,
          videoSourceId: input.videoSourceId, totalBytes: input.totalBytes, status: 'QUEUED',
        },
        select: { id: true, version: true },
      });
      await transaction.youTubeOutboxEvent.create({
        data: {
          id: input.outboxId, narrialUserId: input.ownerId, eventType: 'YOUTUBE_UPLOAD_QUEUED',
          aggregateType: 'YOUTUBE_UPLOAD', aggregateId: input.id, payloadVersion: 1,
          safePayload: { uploadId: input.id },
        },
      });
      await transaction.youTubeStatusEvent.create({
        data: {
          id: input.statusEventId, narrialUserId: input.ownerId, aggregateType: 'YOUTUBE_UPLOAD',
          aggregateId: input.id, toStatus: 'QUEUED', source: 'APPLICATION',
        },
      });
      await transaction.youTubeAuditEvent.create({
        data: {
          id: input.auditEventId, narrialUserId: input.ownerId, actorType: 'NARRIAL_USER',
          eventType: 'YOUTUBE_UPLOAD_CREATED', targetType: 'YOUTUBE_UPLOAD', targetId: input.id,
          outcome: 'SUCCEEDED',
        },
      });
      return upload;
    });
  }

  async transitionUpload(input: {
    id: string; ownerId: string; expectedVersion: number; status: 'UPLOADING' | 'TRANSFERRED' | 'FAILED';
  }) {
    const result = await this.prisma.youTubeUpload.updateMany({
      where: { id: input.id, narrialUserId: input.ownerId, version: input.expectedVersion },
      data: { status: input.status, version: { increment: 1 } },
    });
    return result.count === 1;
  }

  createOAuthTransaction(input: OAuthInput) {
    return this.prisma.youTubeOAuthTransaction.create({
      data: {
        id: input.id,
        narrialUserId: input.ownerId,
        stateHash: toPrismaBytes(input.stateHash),
        status: 'AUTHORIZATION_PENDING',
        returnDestination: input.returnDestination,
        requestedScopes: input.requestedScopes,
        expiresAt: input.expiresAt,
      },
      select: { id: true },
    });
  }

  async consumeOAuthTransaction(input: { ownerId: string; stateHash: Uint8Array; now: Date }) {
    return this.prisma.$transaction(async (transaction) => {
      const consumed = await transaction.youTubeOAuthTransaction.updateMany({
        where: {
          narrialUserId: input.ownerId,
          stateHash: toPrismaBytes(input.stateHash),
          status: 'AUTHORIZATION_PENDING',
          consumedAt: null,
          expiresAt: { gt: input.now },
        },
        data: { status: 'CONSUMING', consumedAt: input.now },
      });
      if (consumed.count !== 1) return null;
      return transaction.youTubeOAuthTransaction.findFirst({
        where: { narrialUserId: input.ownerId, stateHash: toPrismaBytes(input.stateHash) },
        select: { id: true, returnDestination: true, requestedScopes: true },
      });
    });
  }

  async consumeOAuthTransactionByState(input: { stateHash: Uint8Array; now: Date }) {
    return this.prisma.$transaction(async (transaction) => {
      const consumed = await transaction.youTubeOAuthTransaction.updateMany({
        where: {
          stateHash: toPrismaBytes(input.stateHash),
          status: 'AUTHORIZATION_PENDING',
          consumedAt: null,
          expiresAt: { gt: input.now },
        },
        data: { status: 'CONSUMING', consumedAt: input.now },
      });
      if (consumed.count !== 1) return null;
      const record = await transaction.youTubeOAuthTransaction.findUnique({
        where: { stateHash: toPrismaBytes(input.stateHash) },
        select: {
          id: true,
          narrialUserId: true,
          returnDestination: true,
          requestedScopes: true,
          expiresAt: true,
          consumedAt: true,
        },
      });
      return record === null ? null : {
        id: record.id,
        ownerId: record.narrialUserId,
        returnDestination: record.returnDestination,
        requestedScopes: record.requestedScopes,
        expiresAt: record.expiresAt,
        consumedAt: record.consumedAt,
      };
    });
  }

  async finishOAuthTransaction(input: {
    id: string;
    status: 'COMPLETED' | 'DENIED' | 'FAILED';
    failureCategory?: string;
  }): Promise<void> {
    const updated = await this.prisma.youTubeOAuthTransaction.updateMany({
      where: { id: input.id, status: 'CONSUMING', consumedAt: { not: null } },
      data: {
        status: input.status,
        failureCategory: input.failureCategory ?? null,
      },
    });
    if (updated.count !== 1) throw new Error('OAUTH_TRANSACTION_INVALID');
  }

  async claimIdempotency(input: IdempotencyClaimInput): Promise<
    | { kind: 'CLAIMED'; recordId: string }
    | { kind: 'IN_PROGRESS'; recordId: string }
    | { kind: 'REPLAY'; recordId: string; safeResponse: Prisma.JsonValue | null }
  > {
    try {
      const created = await this.prisma.youTubeIdempotencyRecord.create({
        data: {
          id: input.id,
          narrialUserId: input.ownerId,
          operationType: input.operationType,
          idempotencyKeyHash: toPrismaBytes(input.keyHash),
          requestHash: toPrismaBytes(input.requestHash),
          status: 'IN_PROGRESS',
          expiresAt: input.expiresAt,
        },
        select: { id: true },
      });
      return { kind: 'CLAIMED', recordId: created.id };
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') throw error;
    }

    const existing = await this.prisma.youTubeIdempotencyRecord.findUniqueOrThrow({
      where: {
        narrialUserId_operationType_idempotencyKeyHash: {
          narrialUserId: input.ownerId,
          operationType: input.operationType,
          idempotencyKeyHash: toPrismaBytes(input.keyHash),
        },
      },
      select: { id: true, requestHash: true, status: true, safeResponse: true },
    });
    if (!Buffer.from(existing.requestHash).equals(Buffer.from(input.requestHash))) {
      throw new IdempotencyPayloadMismatchError('Idempotency key was reused with another payload.');
    }
    if (existing.status === 'SUCCEEDED' || existing.status === 'FAILED_TERMINAL') {
      return { kind: 'REPLAY', recordId: existing.id, safeResponse: existing.safeResponse };
    }
    return { kind: 'IN_PROGRESS', recordId: existing.id };
  }

  async storeIdempotencyOutcome(input: {
    recordId: string;
    ownerId: string;
    status: 'SUCCEEDED' | 'FAILED_RETRYABLE' | 'FAILED_TERMINAL' | 'OUTCOME_UNKNOWN';
    resourceType?: string;
    resourceId?: string;
    safeResponse?: Prisma.InputJsonValue;
  }) {
    const updated = await this.prisma.youTubeIdempotencyRecord.updateMany({
      where: { id: input.recordId, narrialUserId: input.ownerId, status: 'IN_PROGRESS' },
      data: {
        status: input.status,
        ...(input.resourceType === undefined ? {} : { resourceType: input.resourceType }),
        ...(input.resourceId === undefined ? {} : { resourceId: input.resourceId }),
        ...(input.safeResponse === undefined ? {} : { safeResponse: input.safeResponse }),
      },
    });
    if (updated.count !== 1) throw new Error('IDEMPOTENCY_CONCURRENCY_CONFLICT');
  }
}
