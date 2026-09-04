import { describe, expect, it } from 'vitest';

import type { OAuthTransaction } from '../src/youtube/application/oauth-service.js';
import { PrismaOAuthTransactionRepository } from '../src/youtube/infrastructure/database/prisma-oauth-transaction-repository.js';

describe('PrismaOAuthTransactionRepository', () => {
  it('stores a binary state digest and restores the owner-bound transaction on atomic consumption', async () => {
    let storedState: Uint8Array | undefined;
    const persistence = {
      createOAuthTransaction(input: { stateHash: Uint8Array }) {
        storedState = input.stateHash;
        return Promise.resolve({ id: 'transaction-id' });
      },
      consumeOAuthTransactionByState(input: { stateHash: Uint8Array; now: Date }) {
        expect(Buffer.from(input.stateHash).toString('base64url')).toBe('YWJj');
        return Promise.resolve({
          id: 'transaction-id',
          ownerId: 'owner-id',
          returnDestination: 'narrial://youtube/connection-return',
          requestedScopes: ['scope.read'],
          expiresAt: new Date('2026-09-04T12:10:00.000Z'),
          consumedAt: input.now,
        });
      },
      finishOAuthTransaction: () => Promise.resolve(),
    };
    const repository = new PrismaOAuthTransactionRepository(persistence);
    const transaction: OAuthTransaction = {
      id: 'transaction-id',
      ownerId: 'owner-id',
      stateHash: 'YWJj',
      returnDestination: 'narrial://youtube/connection-return',
      requestedScopes: ['scope.read'],
      expiresAt: new Date('2026-09-04T12:10:00.000Z'),
      consumedAt: null,
    };

    await repository.create(transaction);
    expect(Buffer.from(storedState!).toString('base64url')).toBe('YWJj');
    await expect(repository.consume('YWJj', new Date('2026-09-04T12:01:00.000Z')))
      .resolves.toMatchObject({ ownerId: 'owner-id', requestedScopes: ['scope.read'] });
  });

  it('fails closed when persisted scopes are malformed', async () => {
    const repository = new PrismaOAuthTransactionRepository({
      createOAuthTransaction: () => Promise.resolve({ id: 'transaction-id' }),
      consumeOAuthTransactionByState: () => Promise.resolve({
        id: 'transaction-id', ownerId: 'owner-id',
        returnDestination: 'narrial://youtube/connection-return',
        requestedScopes: { unsafe: true },
        expiresAt: new Date('2026-09-04T12:10:00.000Z'),
        consumedAt: new Date('2026-09-04T12:01:00.000Z'),
      }),
      finishOAuthTransaction: () => Promise.resolve(),
    });

    await expect(repository.consume('YWJj', new Date())).rejects.toThrow('OAUTH_TRANSACTION_INVALID');
  });
});
