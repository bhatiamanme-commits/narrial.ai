import { randomUUID } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import {
  CredentialIntegrityError,
  CredentialVault,
  LocalCredentialKeyAdapter,
  ProductionCredentialKeyAdapter,
  type CredentialEnvelope,
} from '../src/youtube/infrastructure/security/credential-vault.js';

const context = {
  module: 'youtube' as const,
  environment: 'test' as const,
  ownerId: 'user_test_owner_a',
  recordId: '00000000-0000-4000-8000-000000000001',
  credentialSchemaVersion: 1,
  encryptionContextVersion: 1,
};

const fakeCredential = () => ({
  credentialSchemaVersion: 1 as const,
  accessToken: randomUUID(),
  refreshToken: randomUUID(),
  tokenType: 'Bearer',
  grantedScopes: ['youtube.upload'],
  accessTokenExpiresAt: '2030-01-01T00:00:00.000Z',
  issuedAt: '2029-12-31T23:00:00.000Z',
});

const keys = () => new LocalCredentialKeyAdapter({
  activeKeyVersion: 'test-v2',
  keys: new Map([
    ['test-v1', Buffer.alloc(32, 0x11)],
    ['test-v2', Buffer.alloc(32, 0x22)],
  ]),
});

describe('CredentialVault', () => {
  it('supports production-scoped keys without accepting local key versions', async () => {
    const adapter = new ProductionCredentialKeyAdapter({
      activeKeyVersion: 'production-v1',
      key: Buffer.alloc(32, 0x66),
    });
    await expect(adapter.keyForVersion('production-v1')).resolves.toHaveLength(32);
    await expect(adapter.keyForVersion('local-v1')).rejects.toBeInstanceOf(CredentialIntegrityError);
    expect(() => new ProductionCredentialKeyAdapter({
      activeKeyVersion: 'local-v1', key: Buffer.alloc(32, 0x66),
    })).toThrow(CredentialIntegrityError);
  });

  it('encrypts with AES-256-GCM and decrypts only with matching authenticated context', async () => {
    const credential = fakeCredential();
    const vault = new CredentialVault(keys());

    const envelope = await vault.encrypt(credential, context);

    expect(envelope).toMatchObject({
      algorithm: 'AES-256-GCM', keyVersion: 'test-v2', payloadSchemaVersion: 1,
      encryptionContextVersion: 1,
    });
    expect(envelope.initializationVector).toHaveLength(12);
    expect(envelope.authenticationTag).toHaveLength(16);
    expect(Buffer.from(envelope.ciphertext).includes(Buffer.from(credential.accessToken))).toBe(false);
    await expect(vault.decrypt(envelope, context)).resolves.toEqual(credential);
    await expect(vault.decrypt(envelope, { ...context, ownerId: 'user_test_owner_b' }))
      .rejects.toBeInstanceOf(CredentialIntegrityError);
  });

  it('fails closed for tampering, unknown keys, and a wrong key under the recorded version', async () => {
    const vault = new CredentialVault(keys());
    const envelope = await vault.encrypt(fakeCredential(), context);
    const tampered: CredentialEnvelope = {
      ...envelope,
      ciphertext: Uint8Array.from(envelope.ciphertext, (byte, index) => index === 0 ? byte ^ 1 : byte),
    };
    const unknown = { ...envelope, keyVersion: 'test-v99' };
    const wrongKeyVault = new CredentialVault(new LocalCredentialKeyAdapter({
      activeKeyVersion: 'test-v2', keys: new Map([['test-v2', Buffer.alloc(32, 0x33)]]),
    }));

    await expect(vault.decrypt(tampered, context)).rejects.toBeInstanceOf(CredentialIntegrityError);
    await expect(vault.decrypt(unknown, context)).rejects.toBeInstanceOf(CredentialIntegrityError);
    await expect(wrongKeyVault.decrypt(envelope, context)).rejects.toBeInstanceOf(CredentialIntegrityError);
  });

  it('writes with the active key and keeps old key versions readable during rotation', async () => {
    const rotatingKeys = keys();
    const oldVault = new CredentialVault(new LocalCredentialKeyAdapter({
      activeKeyVersion: 'test-v1',
      keys: new Map([
        ['test-v1', Buffer.alloc(32, 0x11)],
        ['test-v2', Buffer.alloc(32, 0x22)],
      ]),
    }));
    const credential = fakeCredential();
    const oldEnvelope = await oldVault.encrypt(credential, context);
    const rotatedVault = new CredentialVault(rotatingKeys);
    const newEnvelope = await rotatedVault.encrypt(credential, context);

    expect(oldEnvelope.keyVersion).toBe('test-v1');
    expect(newEnvelope.keyVersion).toBe('test-v2');
    await expect(rotatedVault.decrypt(oldEnvelope, context)).resolves.toEqual(credential);
    await expect(rotatedVault.decrypt(newEnvelope, context)).resolves.toEqual(credential);
  });
});
