import { createClerkClient } from '@clerk/backend';

import type { AuthenticatedUser, AuthenticationVerifier } from './authentication-verifier.js';

interface ClerkAuthenticationVerifierOptions {
  publishableKey: string;
  secretKey: string;
  authorizedParties: string[];
}

export class ClerkAuthenticationVerifier implements AuthenticationVerifier {
  private readonly client;
  private readonly authorizedParties: string[];

  constructor(options: ClerkAuthenticationVerifierOptions) {
    this.client = createClerkClient({
      publishableKey: options.publishableKey,
      secretKey: options.secretKey,
    });
    this.authorizedParties = options.authorizedParties;
  }

  async verify(request: Request): Promise<AuthenticatedUser | null> {
    const state = await this.client.authenticateRequest(request, {
      acceptsToken: 'session_token',
      authorizedParties: this.authorizedParties,
    });
    if (!state.isAuthenticated) return null;

    const userId = state.toAuth().userId;
    return userId ? { userId } : null;
  }
}
