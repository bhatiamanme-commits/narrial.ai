import type {
  OAuthTransaction,
  OAuthTransactionRepository,
} from '../../application/oauth-service.js';

interface OAuthPersistence {
  createOAuthTransaction(input: {
    id: string;
    ownerId: string;
    stateHash: Uint8Array;
    returnDestination: string;
    requestedScopes: string[];
    expiresAt: Date;
  }): Promise<{ id: string }>;
  consumeOAuthTransactionByState(input: { stateHash: Uint8Array; now: Date }): Promise<{
    id: string;
    ownerId: string;
    returnDestination: string;
    requestedScopes: unknown;
    expiresAt: Date;
    consumedAt: Date | null;
  } | null>;
  finishOAuthTransaction(input: {
    id: string;
    status: 'COMPLETED' | 'DENIED' | 'FAILED';
  }): Promise<void>;
}

const binaryDigest = (digest: string) => Uint8Array.from(Buffer.from(digest, 'base64url'));

export class PrismaOAuthTransactionRepository implements OAuthTransactionRepository {
  constructor(private readonly persistence: OAuthPersistence) {}

  async create(transaction: OAuthTransaction): Promise<void> {
    await this.persistence.createOAuthTransaction({
      id: transaction.id,
      ownerId: transaction.ownerId,
      stateHash: binaryDigest(transaction.stateHash),
      returnDestination: transaction.returnDestination,
      requestedScopes: transaction.requestedScopes,
      expiresAt: transaction.expiresAt,
    });
  }

  async consume(stateHash: string, now: Date): Promise<OAuthTransaction | null> {
    const transaction = await this.persistence.consumeOAuthTransactionByState({
      stateHash: binaryDigest(stateHash),
      now,
    });
    if (transaction === null) return null;
    if (!Array.isArray(transaction.requestedScopes) || transaction.requestedScopes.some(
      (scope) => typeof scope !== 'string',
    )) throw new Error('OAUTH_TRANSACTION_INVALID');
    return {
      ...transaction,
      requestedScopes: transaction.requestedScopes as string[],
      stateHash,
    };
  }

  finish(transactionId: string, outcome: 'COMPLETED' | 'DENIED' | 'FAILED'): Promise<void> {
    return this.persistence.finishOAuthTransaction({ id: transactionId, status: outcome });
  }
}
