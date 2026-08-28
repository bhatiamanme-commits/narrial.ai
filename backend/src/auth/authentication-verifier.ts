export interface AuthenticatedUser {
  userId: string;
}

export interface AuthenticationVerifier {
  verify(request: Request): Promise<AuthenticatedUser | null>;
}
