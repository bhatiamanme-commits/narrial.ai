# Narrial AI Social Account Connection — Validated Build Guide

**Status:** Proposed for implementation  
**Last validated:** 2026-08-22  
**Scope:** Connect, inspect, refresh, and disconnect a creator's social account  
**Out of scope:** Video publishing, scheduling workers, analytics ingestion, and support for every provider

## 1. Purpose

This document is the implementation contract for replacing Narrial AI's mock social-account connection behavior with a secure, backend-owned OAuth integration.

The first deliverable is complete only when a signed-in Narrial user can connect one real provider account, close and reopen the app, still see that connection, and disconnect it safely.

Build one provider end to end before adding another. The recommended first provider is YouTube. Instagram and TikTok follow only after the shared connection architecture passes its quality gate.

## 2. Why a backend is required now

The current Expo frontend can render account cards and simulate connection state. It must not perform production OAuth token exchange or store provider credentials.

A backend is required to:

- Verify the signed-in Narrial user.
- Generate and validate OAuth state.
- Exchange authorization codes using provider secrets.
- Encrypt provider access and refresh tokens.
- Refresh expired access tokens.
- Fetch authoritative provider account details.
- Revoke or remove connections.
- Enforce ownership so one user cannot access another user's accounts.
- Provide an API boundary that later publishing workers can reuse.

## 3. Validated product flow

```text
User signs in to Narrial with Clerk
        ↓
User opens Connect Social Accounts
        ↓
Expo requests an authorization URL from Narrial backend
        ↓
Backend verifies Clerk session and creates one-time OAuth state
        ↓
Expo opens provider authorization in the system browser
        ↓
User approves or denies requested permissions
        ↓
Provider redirects to Narrial backend callback
        ↓
Backend validates state and exchanges the authorization code
        ↓
Backend fetches the provider profile/channel
        ↓
Backend encrypts credentials and stores the connection
        ↓
Backend redirects to the Narrial app deep link
        ↓
Expo reloads the connection list from the backend
```

The mobile app receives connection metadata, never provider tokens.

## 4. Trust boundaries and threat model

### Assets to protect

- Provider access and refresh tokens
- OAuth client secrets
- Clerk user identity
- Provider account identity
- Permission scopes
- Connection and revocation audit history

### Untrusted boundaries

- Every Expo API request
- OAuth query parameters and authorization codes
- Provider API responses
- Deep-link parameters
- Connection IDs supplied by the client
- Error messages returned by providers

### Primary abuse cases

| Abuse case | Required control |
| --- | --- |
| Attacker substitutes their callback for another user's flow | Signed, random, short-lived, single-use OAuth state bound to the Clerk user and provider |
| User reads or deletes another user's connection | Authenticate every endpoint and include `user_id` in every database lookup |
| Authorization code is replayed | Consume state atomically and reject second use |
| Provider token leaks to the mobile app or logs | Response allowlists, structured log redaction, and tests that forbid credential fields |
| Stolen database reveals usable tokens | Application-level authenticated encryption with a key stored outside the database |
| Malicious redirect sends users to an attacker | Exact allowlist of backend callback and app return URLs |
| Endpoint is flooded | Per-IP and per-user rate limits plus provider timeouts |
| Revoked provider grant still appears healthy | Token validation/refresh and explicit `expired` or `revoked` state |

## 5. Architectural boundary

```text
┌──────────────────────────┐
│ Expo / React Native app  │
│ UI, browser launch,      │
│ safe connection metadata │
└─────────────┬────────────┘
              │ Clerk session token
              ▼
┌──────────────────────────┐
│ Narrial API              │
│ Auth, OAuth state,       │
│ provider adapters,       │
│ ownership, token crypto  │
└─────────────┬────────────┘
              │
              ▼
┌──────────────────────────┐
│ PostgreSQL               │
│ Connections, OAuth state,│
│ audit events             │
└─────────────┬────────────┘
              │
              ▼
┌──────────────────────────┐
│ Google / Meta / TikTok   │
│ OAuth and provider APIs  │
└──────────────────────────┘
```

### Recommended backend baseline

- Node.js and TypeScript, matching the frontend language.
- A small REST API using a maintained framework such as Fastify or NestJS.
- PostgreSQL for durable multi-user connection state.
- A migration-based ORM such as Prisma or Drizzle.
- Clerk Backend SDK for request authentication.
- A managed encryption key or secrets service in production.

These are recommendations, not yet accepted dependency choices. Select hosting, API framework, ORM, and key-management provider before implementation and record the final choices in an ADR.

Do not add Redis or a job queue during the account-connection milestone. Those belong to scheduled publishing.

## 6. Domain model

### `social_connections`

| Field | Purpose |
| --- | --- |
| `id` | Narrial-generated opaque ID |
| `user_id` | Clerk user ID that owns the connection |
| `provider` | `youtube`, later `instagram`, `tiktok`, etc. |
| `provider_account_id` | Stable account/channel ID returned by provider |
| `display_name` | Safe account name shown in UI |
| `username` | Optional provider handle |
| `avatar_url` | Optional provider-hosted avatar URL |
| `encrypted_access_token` | Encrypted credential; never returned to frontend |
| `encrypted_refresh_token` | Nullable encrypted credential |
| `token_expires_at` | Nullable provider expiry timestamp |
| `granted_scopes` | Exact granted scope list |
| `status` | Connection health state |
| `last_verified_at` | Last successful provider verification |
| `created_at` / `updated_at` | Audit timestamps |

Required uniqueness:

```text
(user_id, provider, provider_account_id)
```

### Connection states

```ts
type ConnectionStatus =
  | 'active'
  | 'missing-scope'
  | 'expired'
  | 'revoked'
  | 'error'
  | 'disconnected';
```

`active` means authentication works and required connection scopes are present. It does not automatically mean the provider has approved Narrial for public publishing.

### `oauth_transactions`

Persist or store server-side:

- Hashed state value
- Clerk user ID
- Provider
- PKCE verifier when applicable
- Approved post-auth return path
- Expiry time, recommended maximum 10 minutes
- Consumed timestamp

Delete or expire transactions promptly. Never accept state supplied only by the mobile app without server-side verification.

### `social_connection_events`

Record security-relevant events without credentials:

- Authorization started
- Authorization completed
- Authorization denied
- Refresh succeeded or failed
- Connection revoked or disconnected

Include actor user ID, connection ID, provider, outcome, timestamp, and a request/correlation ID. Do not log tokens, authorization codes, raw state, or complete provider responses.

## 7. Safe public API contract

All protected routes require a valid Clerk session token and derive `user_id` from that verified token. Never accept `user_id` from request bodies or query strings.

### Start authorization

```http
POST /v1/social-connections/youtube/authorize
Authorization: Bearer <clerk-session-token>
Content-Type: application/json

{
  "returnPath": "/onboarding"
}
```

```json
{
  "authorizationUrl": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "expiresAt": "2026-08-22T12:10:00.000Z"
}
```

The backend creates the URL. The client must not send arbitrary scopes, callback URLs, or provider endpoints.

### OAuth callback

```http
GET /v1/oauth/youtube/callback?code=...&state=...
```

The backend validates state, exchanges the code, stores the connection, and redirects to an allowlisted app link such as:

```text
narrial://social-connect/result?provider=youtube&result=success
```

The deep link contains no tokens, authorization codes, internal errors, or user PII.

### List connections

```http
GET /v1/social-connections
Authorization: Bearer <clerk-session-token>
```

```json
{
  "connections": [
    {
      "id": "conn_01J...",
      "provider": "youtube",
      "providerAccountId": "UC...",
      "displayName": "Narrial Studio",
      "username": "@narrialstudio",
      "avatarUrl": "https://...",
      "status": "active",
      "grantedScopes": ["youtube.readonly", "youtube.upload"],
      "connectedAt": "2026-08-22T12:00:00.000Z",
      "lastVerifiedAt": "2026-08-22T12:00:02.000Z"
    }
  ]
}
```

### Refresh/recheck

```http
POST /v1/social-connections/:connectionId/refresh
Authorization: Bearer <clerk-session-token>
```

This verifies ownership before touching provider credentials. It is idempotent from the client's perspective.

### Disconnect

```http
DELETE /v1/social-connections/:connectionId
Authorization: Bearer <clerk-session-token>
```

Disconnect should attempt provider revocation when supported, then make the local credential unusable. Define and test behavior when remote revocation fails; do not leave the UI falsely connected.

### Error envelope

```json
{
  "error": {
    "code": "OAUTH_PERMISSION_DENIED",
    "message": "You did not grant the permissions Narrial needs.",
    "requestId": "req_01J..."
  }
}
```

Return safe stable codes. Do not expose stack traces, provider secrets, raw responses, database details, or cryptographic failures.

## 8. Provider adapter contract

Keep provider-specific behavior behind one interface:

```ts
interface SocialProviderAdapter {
  createAuthorizationUrl(input: AuthorizationInput): Promise<AuthorizationRequest>;
  exchangeAuthorizationCode(input: CodeExchangeInput): Promise<ProviderCredentials>;
  refreshCredentials(input: RefreshInput): Promise<ProviderCredentials>;
  getAccountProfile(accessToken: string): Promise<ProviderAccountProfile>;
  revokeCredentials(input: RevokeInput): Promise<void>;
}
```

Rules:

- API routes call an application service, not provider SDKs directly.
- UI code never imports provider SDKs.
- Provider response types never become the public Narrial API contract.
- Normalize provider errors into stable internal categories.
- Add provider scopes through server configuration, not client input.

## 9. YouTube-first scope

### Initial scopes

Request the smallest scopes needed by the approved product behavior:

- Read the connected channel identity.
- Upload videos when publishing work begins.

Google documents `https://www.googleapis.com/auth/youtube.upload` for managing uploads and requires OAuth authorization for modifications. Confirm the exact final scope list during implementation; do not request broad channel-management permissions without a product need.

### YouTube acceptance criteria

- A signed-in user can connect one YouTube channel.
- The backend obtains and stores the stable channel ID and display metadata.
- Credentials are encrypted and never returned by an API.
- Closing and reopening the Expo app preserves the connection.
- A cancelled or denied consent screen returns a clear recoverable UI state.
- Duplicate callbacks do not create duplicate records.
- Reconnecting the same channel updates the existing connection safely.
- Disconnecting makes stored credentials unusable and updates the UI.
- Missing required scopes creates `missing-scope`, not `active`.
- Every database read/update/delete is scoped by authenticated `user_id`.

### Provider approval warning

OAuth working in development does not prove production publishing eligibility. Google may require consent-screen verification, and uploads from some unverified projects can be restricted. Provider review must begin early and be tracked separately from code completion.

## 10. Frontend integration requirements

Preserve the existing onboarding and account-selection screens. Replace only the mock data boundary.

### Frontend service responsibilities

- Obtain the current Clerk session token.
- Call Narrial's API using `Authorization: Bearer <token>`.
- Request an authorization URL.
- Open it using Expo's supported browser-auth flow.
- Handle the allowlisted deep-link result.
- Refetch the authoritative connection list.
- Display safe user-facing errors.

### Required UI states

- Initial loading
- No connected accounts
- Opening provider
- Awaiting authorization
- Connected
- Permission denied
- OAuth cancelled
- Network failure with retry
- Expired or revoked connection
- Disconnect confirmation
- Disconnecting

The frontend must refetch after returning from OAuth. A `success` deep-link parameter is only a signal to refetch; it is not proof that the connection exists.

## 11. Step-by-step implementation plan

### Task 0 — Approve foundational decisions

Decide and record:

- API framework
- PostgreSQL host
- ORM/migration tool
- backend deployment host
- encryption/key-management approach
- production API domain
- production deep-link/universal-link strategy

**Exit condition:** An accepted ADR records these decisions and local/staging/production environments.

### Task 1 — Create the backend skeleton

Build:

- TypeScript service
- Environment validation at startup
- `GET /health`
- Request IDs and redacted structured logs
- Restricted CORS
- Security headers where applicable
- Central error mapping
- Graceful shutdown

**Verify:** Service starts with valid environment, refuses missing secrets, and returns no stack traces in production mode.

### Task 2 — Authenticate Narrial API requests

Build Clerk session verification using the Backend SDK. For cross-origin mobile requests, send the session token in the Authorization header. Configure allowed audiences/authorized parties where applicable.

**Verify:** Missing, expired, malformed, and wrong-environment tokens return `401`; valid tokens expose a server-derived user ID.

### Task 3 — Add connection persistence and encryption

Create migrations for connections, OAuth transactions, and audit events. Add a credential encryption service with key versioning so keys can rotate later.

**Verify:** Database output does not contain plaintext credentials; decryption is possible only through the service; ownership constraints and uniqueness tests pass.

### Checkpoint A — Security foundation

- Authentication tests pass.
- Cross-user access tests pass.
- No credentials appear in logs, errors, snapshots, or API responses.
- Database migration applies to an empty database and rolls back safely in development.

### Task 4 — Implement the provider-neutral connection API

Build list, start-authorization, refresh, and disconnect application services and routes. Use a fake provider adapter in contract tests.

**Verify:** API contract tests cover success and every public error code without requiring Google.

### Task 5 — Implement YouTube OAuth

Register development credentials, configure exact redirects, generate state/PKCE material, exchange codes, fetch channel metadata, store encrypted credentials, refresh access, and revoke on disconnect.

**Verify:** Unit tests use mocked provider HTTP responses; staging smoke test uses a dedicated test channel.

### Task 6 — Replace the Expo mock boundary

Add an API client behind the existing social-account service interface. Connect browser authorization, deep-link handling, refetching, errors, and disconnect confirmation.

**Verify:** Existing UI tests continue passing; the app never receives provider credentials; cancelled OAuth remains recoverable.

### Checkpoint B — End-to-end connection

- Connect a staging YouTube channel.
- Restart the app and confirm persistence.
- Reconnect without duplication.
- Revoke access at Google and confirm Narrial detects it.
- Disconnect from Narrial and confirm the account disappears.
- Repeat with a second Narrial user and verify tenant isolation.

### Task 7 — Production readiness

Add rate limits, dashboards/alerts for OAuth failures, retention/deletion procedures, backup handling, secret rotation procedure, and provider review tracking.

**Exit condition:** Security review passes and a rollback plan exists.

## 12. What not to do

### Never

- Store provider access or refresh tokens in AsyncStorage, SecureStore, browser storage, frontend state, analytics, or crash reports.
- Put OAuth client secrets in `EXPO_PUBLIC_*` environment variables.
- Exchange authorization codes in the Expo app.
- Trust a client-supplied user ID, provider account ID, scope list, redirect URI, or connection status.
- Mark a connection successful solely because a deep link says `success`.
- Log authorization codes, tokens, raw OAuth state, or complete provider responses.
- Use wildcard callback URLs or unrestricted CORS.
- Build publishing logic into account cards or route components.
- Claim all platforms are supported because their cards exist.
- Treat account authentication as proof of publishing approval.
- Build a custom password system; Clerk remains Narrial's user identity provider.
- Add scheduling workers before the connection milestone passes.

### Avoid

- Connecting multiple providers in parallel before the shared contract stabilizes.
- Requesting permissions before the user reaches a feature that needs them.
- Provider-specific columns for every token or profile field.
- Deleting audit records without a documented retention policy.
- Returning raw provider error messages to users.
- Retrying OAuth code exchange automatically; authorization codes are short-lived and generally single-use.

## 13. Environment and secret inventory

Exact names may change after backend selection, but separate these classes:

```text
CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY or CLERK_JWT_KEY
DATABASE_URL
CREDENTIAL_ENCRYPTION_KEY
GOOGLE_OAUTH_CLIENT_ID
GOOGLE_OAUTH_CLIENT_SECRET
GOOGLE_OAUTH_REDIRECT_URI
ALLOWED_APP_RETURN_URLS
ALLOWED_WEB_ORIGINS
```

Rules:

- Commit only a `.env.example` containing names and safe descriptions.
- Use different OAuth applications and secrets for local/staging/production where practical.
- Production secrets belong in the deployment secret manager.
- Rotate any credential that appears in source, terminal output, chat, logs, or screenshots.

## 14. Test matrix

### Unit tests

- OAuth state creation, expiry, binding, and consumption
- Credential encryption/decryption and key versioning
- Provider error normalization
- Required-scope evaluation
- Safe response mapping

### API/integration tests

- Authentication required on every protected endpoint
- Resource ownership enforced on list/refresh/delete
- Replayed callback rejected
- Expired state rejected
- Provider mismatch rejected
- Duplicate connection upserted safely
- Provider timeout mapped to recoverable error
- Secret fields absent from serialized responses

### End-to-end tests

- Successful connection
- User cancellation
- Permission denial
- App restart and persistence
- Token expiry and refresh
- Provider-side revocation
- Narrial-side disconnect
- Two-user isolation
- Offline return from browser

### Release verification

```text
[ ] TypeScript checks pass
[ ] Unit and integration tests pass
[ ] Database migrations validated
[ ] Dependency audit reviewed
[ ] No secrets detected in repository or build output
[ ] HTTPS and exact redirects verified
[ ] CORS allowlist verified
[ ] Rate limiting verified
[ ] Logs inspected for credential leakage
[ ] Provider staging smoke test passes
[ ] Rollback procedure exercised
```

## 15. Definition of done

The social-account connection foundation is done only when:

- One real YouTube connection works end to end in staging.
- Clerk authentication and per-user authorization protect every endpoint.
- Tokens remain backend-only and encrypted at rest.
- OAuth state is random, short-lived, single-use, and user-bound.
- The existing Expo account UI uses backend data and covers all required states.
- Connection survives app restart.
- Reauthorization, revocation, and disconnect behave predictably.
- Automated tests cover replay, ownership, token leakage, and failure states.
- Provider review requirements and production restrictions are documented.
- No publishing or scheduling code depends on frontend-owned credentials.

Only after this gate passes should Narrial begin the scheduled publishing worker.

## 16. Official sources validated for this plan

- Clerk — authenticated frontend-to-backend requests and Authorization headers: https://clerk.com/docs/guides/development/making-requests
- Clerk — backend `authenticateRequest()` and `authorizedParties`: https://clerk.com/docs/reference/backend/authenticate-request
- Clerk — session-token verification: https://clerk.com/docs/guides/sessions/manual-jwt-verification
- Expo SDK 57 — AuthSession and production redirect configuration: https://docs.expo.dev/versions/latest/sdk/auth-session/
- Expo — OAuth/browser authentication rules: https://docs.expo.dev/guides/authentication/
- Google — YouTube OAuth server flow, state, HTTPS, refresh tokens, and scopes: https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps
- Google — YouTube API authorization: https://developers.google.com/youtube/v3/guides/authentication
- Google — YouTube video upload behavior: https://developers.google.com/youtube/v3/docs/videos/insert
- TikTok — Direct Post prerequisites, `video.publish`, status checks, and audit limitation: https://developers.tiktok.com/docs/en/content-posting-api-get-started
- Meta — Instagram professional-account and content-publishing requirements: https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api

## 17. Known decisions still requiring approval

This guide intentionally does not pretend the following choices are already settled:

1. Backend framework: Fastify versus NestJS.
2. ORM: Prisma versus Drizzle.
3. PostgreSQL hosting and deployment region.
4. Backend deployment provider.
5. Encryption key-management provider.
6. Whether YouTube or Instagram has higher product priority if provider review timing differs.
7. Data-retention period for disconnected connections and audit events.

Resolve Task 0 before writing production backend code. Everything after Task 0 is ordered so each checkpoint leaves a testable, working system.
