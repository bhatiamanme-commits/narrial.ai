import { createHmac, randomBytes, randomUUID } from 'node:crypto';

export interface OAuthTransaction {
  id: string;
  ownerId: string;
  stateHash: string;
  returnDestination: string;
  requestedScopes: string[];
  expiresAt: Date;
  consumedAt: Date | null;
}

export interface OAuthTransactionRepository {
  create(transaction: OAuthTransaction): Promise<void>;
  consume(stateHash: string, now: Date): Promise<OAuthTransaction | null>;
  finish(transactionId: string, outcome: 'COMPLETED' | 'DENIED' | 'FAILED'): Promise<void>;
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  tokenType: 'Bearer';
  expiresIn: number;
  grantedScopes: string[];
}

export interface OAuthProvider {
  exchangeCode(input: { code: string; redirectUri: string }): Promise<OAuthTokens>;
}

export interface OAuthCompletion {
  complete(input: { ownerId: string; tokens: OAuthTokens; requestedScopes: string[] }): Promise<void>;
}

interface OAuthConfig {
  clientId: string;
  redirectUri: string;
  allowedReturnDestinations: string[];
  scopes: string[];
  transactionTtlMs: number;
  stateHashKey: Uint8Array;
}

interface OAuthRuntime {
  now(): Date;
  randomState(): string;
  randomId(): string;
}

export class OAuthRequestError extends Error {
  readonly statusCode = 400;

  constructor(readonly code: string, message: string) {
    super(message);
    this.name = 'OAuthRequestError';
  }
}

const defaultRuntime: OAuthRuntime = {
  now: () => new Date(),
  randomState: () => randomBytes(32).toString('base64url'),
  randomId: () => randomUUID(),
};

function safeReturn(destination: string, result: 'connected' | 'cancelled' | 'failed') {
  const url = new URL(destination);
  url.search = '';
  url.searchParams.set('result', result);
  return url.toString();
}

export class YouTubeOAuthService {
  constructor(
    private readonly config: OAuthConfig,
    private readonly transactions: OAuthTransactionRepository,
    private readonly provider: OAuthProvider,
    private readonly completion: OAuthCompletion,
    private readonly runtime: OAuthRuntime = defaultRuntime,
  ) {}

  private digestState(state: string) {
    return createHmac('sha256', this.config.stateHashKey).update(state, 'utf8').digest('base64url');
  }

  async start(ownerId: string, returnDestination: string) {
    if (!this.config.allowedReturnDestinations.includes(returnDestination)) {
      throw new OAuthRequestError(
        'OAUTH_RETURN_DESTINATION_INVALID',
        'Return destination is not allowed',
      );
    }

    const createdAt = this.runtime.now();
    const expiresAt = new Date(createdAt.getTime() + this.config.transactionTtlMs);
    const state = this.runtime.randomState();
    await this.transactions.create({
      id: this.runtime.randomId(),
      ownerId,
      stateHash: this.digestState(state),
      returnDestination,
      requestedScopes: [...this.config.scopes],
      expiresAt,
      consumedAt: null,
    });

    const authorizationUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authorizationUrl.searchParams.set('client_id', this.config.clientId);
    authorizationUrl.searchParams.set('redirect_uri', this.config.redirectUri);
    authorizationUrl.searchParams.set('response_type', 'code');
    authorizationUrl.searchParams.set('scope', this.config.scopes.join(' '));
    authorizationUrl.searchParams.set('access_type', 'offline');
    authorizationUrl.searchParams.set('prompt', 'consent');
    authorizationUrl.searchParams.set('include_granted_scopes', 'true');
    authorizationUrl.searchParams.set('state', state);

    return { authorizationUrl: authorizationUrl.toString(), expiresAt };
  }

  async callback(input: { state?: string; code?: string; error?: string }) {
    if (
      !input.state || input.state.length > 512 ||
      (input.code === undefined) === (input.error === undefined) ||
      (input.code !== undefined && (input.code.length === 0 || input.code.length > 4096)) ||
      (input.error !== undefined && (input.error.length === 0 || input.error.length > 128))
    ) {
      throw new OAuthRequestError('OAUTH_CALLBACK_INVALID', 'OAuth callback is invalid');
    }

    const transaction = await this.transactions.consume(
      this.digestState(input.state),
      this.runtime.now(),
    );
    if (!transaction) {
      throw new OAuthRequestError('OAUTH_TRANSACTION_INVALID', 'OAuth transaction is invalid');
    }

    if (input.error !== undefined) {
      await this.transactions.finish(transaction.id, 'DENIED');
      return safeReturn(
        transaction.returnDestination,
        input.error === 'access_denied' ? 'cancelled' : 'failed',
      );
    }

    try {
      const tokens = await this.provider.exchangeCode({
        code: input.code!,
        redirectUri: this.config.redirectUri,
      });
      await this.completion.complete({
        ownerId: transaction.ownerId,
        tokens,
        requestedScopes: transaction.requestedScopes,
      });
      await this.transactions.finish(transaction.id, 'COMPLETED');
      return safeReturn(transaction.returnDestination, 'connected');
    } catch {
      await this.transactions.finish(transaction.id, 'FAILED');
      return safeReturn(transaction.returnDestination, 'failed');
    }
  }
}
