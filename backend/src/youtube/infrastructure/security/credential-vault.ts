import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const PUBLIC_ALGORITHM = 'AES-256-GCM' as const;
const KEY_VERSION = /^(local|test)-v[1-9]\d*$/;

export interface CredentialPayload {
  credentialSchemaVersion: number;
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  grantedScopes: string[];
  accessTokenExpiresAt: string;
  issuedAt: string;
}

export interface CredentialContext {
  module: 'youtube';
  environment: 'local' | 'test';
  ownerId: string;
  recordId: string;
  credentialSchemaVersion: number;
  encryptionContextVersion: number;
}

export interface CredentialEnvelope {
  algorithm: typeof PUBLIC_ALGORITHM;
  ciphertext: Uint8Array;
  initializationVector: Uint8Array;
  authenticationTag: Uint8Array;
  keyVersion: string;
  payloadSchemaVersion: number;
  encryptionContextVersion: number;
}

export interface CredentialKeyAdapter {
  activeVersion(): Promise<string>;
  keyForVersion(version: string): Promise<Uint8Array>;
}

export class CredentialIntegrityError extends Error {
  readonly code = 'CREDENTIAL_INTEGRITY_FAILURE';

  constructor() {
    super('Credential is unavailable.');
    this.name = 'CredentialIntegrityError';
  }
}

export class LocalCredentialKeyAdapter implements CredentialKeyAdapter {
  readonly #activeKeyVersion: string;
  readonly #keys: ReadonlyMap<string, Uint8Array>;

  constructor(input: { activeKeyVersion: string; keys: ReadonlyMap<string, Uint8Array> }) {
    if (!KEY_VERSION.test(input.activeKeyVersion)) throw new CredentialIntegrityError();
    const keys = new Map<string, Uint8Array>();
    for (const [version, key] of input.keys) {
      if (!KEY_VERSION.test(version) || key.byteLength !== 32) throw new CredentialIntegrityError();
      keys.set(version, Uint8Array.from(key));
    }
    if (!keys.has(input.activeKeyVersion)) throw new CredentialIntegrityError();
    this.#activeKeyVersion = input.activeKeyVersion;
    this.#keys = keys;
  }

  activeVersion() {
    return Promise.resolve(this.#activeKeyVersion);
  }

  keyForVersion(version: string) {
    if (!KEY_VERSION.test(version)) return Promise.reject(new CredentialIntegrityError());
    const key = this.#keys.get(version);
    if (!key) return Promise.reject(new CredentialIntegrityError());
    return Promise.resolve(Uint8Array.from(key));
  }
}

const associatedData = (context: CredentialContext) => Buffer.from(JSON.stringify([
  context.module,
  context.environment,
  context.ownerId,
  context.recordId,
  context.credentialSchemaVersion,
  context.encryptionContextVersion,
]));

const parseCredential = (plaintext: Buffer): CredentialPayload => {
  const value: unknown = JSON.parse(plaintext.toString('utf8'));
  if (
    typeof value !== 'object' || value === null ||
    typeof (value as CredentialPayload).credentialSchemaVersion !== 'number' ||
    typeof (value as CredentialPayload).accessToken !== 'string' ||
    typeof (value as CredentialPayload).tokenType !== 'string' ||
    !Array.isArray((value as CredentialPayload).grantedScopes) ||
    typeof (value as CredentialPayload).accessTokenExpiresAt !== 'string' ||
    typeof (value as CredentialPayload).issuedAt !== 'string'
  ) throw new CredentialIntegrityError();
  return value as CredentialPayload;
};

export class CredentialVault {
  constructor(private readonly keys: CredentialKeyAdapter) {}

  async encrypt(payload: CredentialPayload, context: CredentialContext): Promise<CredentialEnvelope> {
    const keyVersion = await this.keys.activeVersion();
    const key = await this.keys.keyForVersion(keyVersion);
    const initializationVector = randomBytes(12);
    const cipher = createCipheriv(ALGORITHM, key, initializationVector, { authTagLength: 16 });
    cipher.setAAD(associatedData(context));
    const ciphertext = Buffer.concat([
      cipher.update(JSON.stringify(payload), 'utf8'),
      cipher.final(),
    ]);
    return {
      algorithm: PUBLIC_ALGORITHM,
      ciphertext,
      initializationVector,
      authenticationTag: cipher.getAuthTag(),
      keyVersion,
      payloadSchemaVersion: payload.credentialSchemaVersion,
      encryptionContextVersion: context.encryptionContextVersion,
    };
  }

  async decrypt(envelope: CredentialEnvelope, context: CredentialContext): Promise<CredentialPayload> {
    try {
      if (
        envelope.algorithm !== PUBLIC_ALGORITHM ||
        envelope.initializationVector.byteLength !== 12 ||
        envelope.authenticationTag.byteLength !== 16 ||
        envelope.payloadSchemaVersion !== context.credentialSchemaVersion ||
        envelope.encryptionContextVersion !== context.encryptionContextVersion
      ) throw new CredentialIntegrityError();
      const key = await this.keys.keyForVersion(envelope.keyVersion);
      const decipher = createDecipheriv(ALGORITHM, key, envelope.initializationVector, { authTagLength: 16 });
      decipher.setAAD(associatedData(context));
      decipher.setAuthTag(envelope.authenticationTag);
      const plaintext = Buffer.concat([decipher.update(envelope.ciphertext), decipher.final()]);
      const payload = parseCredential(plaintext);
      if (payload.credentialSchemaVersion !== envelope.payloadSchemaVersion) {
        throw new CredentialIntegrityError();
      }
      return payload;
    } catch {
      throw new CredentialIntegrityError();
    }
  }
}
