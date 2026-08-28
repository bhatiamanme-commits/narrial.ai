import type { PrismaYouTubePersistence } from '../database/youtube-persistence.js';
import {
  CredentialVault,
  type CredentialPayload,
} from './credential-vault.js';

const CONTEXT_VERSION = 1;

export class PrismaCredentialVault {
  constructor(
    private readonly persistence: PrismaYouTubePersistence,
    private readonly vault: CredentialVault,
    private readonly environment: 'local' | 'test',
  ) {}

  async store(input: {
    connectionId: string;
    ownerId: string;
    credential: CredentialPayload;
  }) {
    const context = {
      module: 'youtube' as const,
      environment: this.environment,
      ownerId: input.ownerId,
      recordId: input.connectionId,
      credentialSchemaVersion: input.credential.credentialSchemaVersion,
      encryptionContextVersion: CONTEXT_VERSION,
    };
    const envelope = await this.vault.encrypt(input.credential, context);
    await this.persistence.saveCredentialRecord({
      connectionId: input.connectionId,
      ownerId: input.ownerId,
      ciphertext: envelope.ciphertext,
      initializationVector: envelope.initializationVector,
      authenticationTag: envelope.authenticationTag,
      keyVersion: envelope.keyVersion,
      credentialSchemaVersion: envelope.payloadSchemaVersion,
      hasRefreshToken: input.credential.refreshToken !== undefined,
    });
  }

  async use<T>(
    connectionId: string,
    ownerId: string,
    operation: (credential: CredentialPayload) => T | Promise<T>,
  ): Promise<T> {
    const record = await this.persistence.findCredentialRecord(connectionId, ownerId);
    if (record?.authenticationTag === null || record === null) {
      throw new Error('CREDENTIAL_UNAVAILABLE');
    }
    const context = {
      module: 'youtube' as const,
      environment: this.environment,
      ownerId,
      recordId: connectionId,
      credentialSchemaVersion: record.credentialSchemaVersion,
      encryptionContextVersion: CONTEXT_VERSION,
    };
    const credential = await this.vault.decrypt({
      algorithm: 'AES-256-GCM',
      ciphertext: record.ciphertext,
      initializationVector: record.initializationVector,
      authenticationTag: record.authenticationTag,
      keyVersion: record.keyVersion,
      payloadSchemaVersion: record.credentialSchemaVersion,
      encryptionContextVersion: CONTEXT_VERSION,
    }, context);
    return operation(credential);
  }
}
