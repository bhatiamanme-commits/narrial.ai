import { randomUUID } from 'node:crypto';

import type { OAuthConnectionStore } from '../../application/oauth-completion.js';
import {
  CredentialVault,
  type CredentialPayload,
} from '../security/credential-vault.js';

interface AtomicConnectionPersistence {
  findOAuthConnectionId(ownerId: string, youtubeChannelId: string): Promise<string | null>;
  completeInitialOAuthConnection(input: {
    connectionId: string;
    auditEventId: string;
    ownerId: string;
    youtubeChannelId: string;
    channelTitle: string;
    ciphertext: Uint8Array;
    initializationVector: Uint8Array;
    authenticationTag: Uint8Array;
    keyVersion: string;
    credentialSchemaVersion: number;
    accessTokenExpiresAt: Date;
    hasRefreshToken: boolean;
    grantedScopes: string[];
    verifiedAt: Date;
  }): Promise<void>;
}

interface StoreRuntime {
  randomId(): string;
  now(): Date;
}

const defaultRuntime: StoreRuntime = { randomId: () => randomUUID(), now: () => new Date() };

export class PrismaOAuthConnectionStore implements OAuthConnectionStore {
  constructor(
    private readonly persistence: AtomicConnectionPersistence,
    private readonly vault: CredentialVault,
    private readonly environment: 'local' | 'test' | 'production',
    private readonly runtime: StoreRuntime = defaultRuntime,
  ) {}

  async completeInitial(input: {
    ownerId: string;
    channel: { id: string; title: string };
    credential: CredentialPayload;
  }): Promise<void> {
    const connectionId = await this.persistence.findOAuthConnectionId(
      input.ownerId,
      input.channel.id,
    ) ?? this.runtime.randomId();
    const envelope = await this.vault.encrypt(input.credential, {
      module: 'youtube',
      environment: this.environment,
      ownerId: input.ownerId,
      recordId: connectionId,
      credentialSchemaVersion: input.credential.credentialSchemaVersion,
      encryptionContextVersion: 1,
    });
    await this.persistence.completeInitialOAuthConnection({
      connectionId,
      auditEventId: this.runtime.randomId(),
      ownerId: input.ownerId,
      youtubeChannelId: input.channel.id,
      channelTitle: input.channel.title,
      ciphertext: envelope.ciphertext,
      initializationVector: envelope.initializationVector,
      authenticationTag: envelope.authenticationTag,
      keyVersion: envelope.keyVersion,
      credentialSchemaVersion: envelope.payloadSchemaVersion,
      accessTokenExpiresAt: new Date(input.credential.accessTokenExpiresAt),
      hasRefreshToken: input.credential.refreshToken !== undefined,
      grantedScopes: input.credential.grantedScopes,
      verifiedAt: this.runtime.now(),
    });
  }
}
