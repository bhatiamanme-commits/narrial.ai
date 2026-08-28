# YouTube Connection Module — OAuth Connection, Callback, and Token Lifecycle

## Document Control

| Field | Value |
|---|---|
| Document number | 16 |
| Filename | `16-oauth-connection-callback-and-token-lifecycle.md` |
| Module | YouTube Connection |
| Stage | Stage 7 — First vertical backend feature |
| Status | Approved documentation baseline — OAuth implementation and Google calls not authorized |
| Version | 1.0.0 |
| Last updated | 2026-08-26 |
| Prerequisites | Documents 11–15 |
| Next document | `17-youtube-channel-discovery-permissions-and-management.md` |
| Source-of-truth role | Defines authorization, callback, refresh, reconnection, revocation, and token lifecycle |
| Implementation authorization | None |
| Staging authorization | Blocked |

## 1. Purpose

This document defines the first complete backend vertical feature for connecting a Narrial user to YouTube: authorization initiation, Google consent/denial, state and callback validation, code exchange, offline access, channel resolution, scope checks, encrypted persistence, access-token expiry, refresh-token preservation, refresh concurrency, reauthorization, revocation, disconnection, recovery, and verification.

It creates no routes, dependencies, credentials, keys, records, or live Google requests.

## 2. YouTube-Only Boundary

Request only approved YouTube scopes. Do not use Google authorization as Narrial authentication, request unrelated Google data, introduce other social platforms/generic tokens, or assume a Google account is the same as a usable YouTube channel.

```text
Narrial authentication → who is using Narrial
Google authorization   → which YouTube permissions that user grants
```

## 3. Verified Google Requirements

Use the backend web-server authorization-code flow because Narrial stores refresh tokens and performs work without the user present. The flow uses `response_type=code`; requires an exactly registered redirect URI; uses `access_type=offline` for refresh tokens; can use `include_granted_scopes=true`; requires protected `state`; and must handle refresh-token invalidation. Tokens must be protected, revoked when unnecessary, and deleted afterward. [`channels.list` with `mine=true` identifies channels owned by the authorized user.](https://developers.google.com/youtube/v3/docs/channels/list)

Authoritative references:

- [Google web-server OAuth guide](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google OAuth best practices](https://developers.google.com/identity/protocols/oauth2/resources/best-practices)
- [Google OAuth policies](https://developers.google.com/identity/protocols/oauth2/policies)
- [Google authorization-model guide](https://developers.google.com/identity/oauth2/web/guides/choose-authorization-model)
- [YouTube channel guide](https://developers.google.com/youtube/v3/guides/implementation/channels)

Google projects in Testing status can expire applicable test-user authorizations and offline refresh tokens after seven days; staging must expect this. [Google Auth Platform audience guidance](https://support.google.com/cloud/answer/15549945)

## 4. Readiness

Documents 11–16 are approved documentation baselines, but Google setup, database creation, security implementation, backend foundation, and API route gates remain closed. Implementation requires passing Fastify tests, verified Narrial auth, approved migrations/encryption/keys, staging credentials/callback/scopes, and explicit authorization.

## 5. Components

The Narrial user/client, Narrial authentication, OAuth application service, OAuth transaction/state services, Google OAuth adapter, YouTube adapter, credential service, repositories, and audit service cooperate. Google authenticates/collects consent; YouTube resolves channel identity. Each component remains inside its Document 14 boundary.

## 6. End-to-End Sequence

```text
User → POST /oauth/authorizations
Backend → authenticate, create protected transaction, return Google URL
Browser → Google consent
Google → backend callback with code+state or error+state
Backend → consume state, exchange code, validate scopes/channel
Backend → encrypt tokens, persist connection/scopes/audit atomically
Backend → allowlisted secret-free app return
Client → refetch authoritative connection state
```

Deep/app links never prove connection success.

## 7. Authorization Initiation

`POST /api/v1/youtube/oauth/authorizations` accepts only an allowlisted `returnDestination`. The backend authenticates the Narrial user, rate-limits, resolves environment callback/scopes, generates secure state, stores only its keyed digest, binds user/environment/scopes/return/flow, optionally encrypts PKCE verifier, applies expiry, persists before returning, audits safely, and returns URL/expiry.

The backend owns all Google parameters:

| Parameter | Rule |
|---|---|
| `client_id` | Environment-specific backend client |
| `redirect_uri` | Exact registered backend callback |
| `response_type` | `code` |
| `scope` | Approved YouTube scopes only |
| `access_type` | `offline` |
| `state` | Fresh protected value |
| `include_granted_scopes` | Proposed `true` |
| `prompt` | Omitted normally; `consent` for approved recovery only |
| PKCE fields | `S256` when PKCE is approved |

The client cannot override parameters. The state-bearing URL is not logged or retained in analytics/client long-term storage.

## 8. Consent and Reconsent

Narrial explains capabilities, offline access, disconnection, Google-controlled consent, and that it never requests a Google password. Verify actual granted scopes and disable denied capabilities. Cancellation is normal.

Standard authorization proposes `access_type=offline`, `include_granted_scopes=true`, and no `prompt`. Use `prompt=consent` only after explicit user action for missing refresh token, missing scope, revoked access, or documented recovery. It must not be added to every request. `select_account` is deferred until the product explicitly offers another account.

## 9. OAuth Transaction

Store internal ID, owner, state digest, `PENDING`, `CONNECT`/`REAUTHORIZE`, optional existing connection, requested scopes, return destination, environment, optional encrypted PKCE verifier, expiry, and timestamps. Never store raw state, code, tokens, client secret, or arbitrary return URLs. Proposed lifetime: ten minutes. Consume exactly once.

## 10. Callback Validation and State Consumption

`GET /api/v1/youtube/oauth/callback` accepts either `code+state` or `error+state`. Reject missing/conflicting/oversized/multi-valued parameters, expired/replayed/invalid state, wrong environment/flow, and missing required PKCE data. Never log callback URLs/query strings.

Atomically transition `PENDING → CONSUMED` only for matching digest, unexpired status, null consumption time, and matching environment. Once consumed, it remains consumed even if exchange/persistence later fails; the user starts a fresh attempt.

On consent denial, consume state, skip token exchange, preserve any existing connection, record a safe denial, and return `cancelled` through the stored destination without provider descriptions.

## 11. Authorization-Code Exchange

Exchange directly from the backend over HTTPS using approved endpoint, environment client credentials, exact redirect, code, and approved PKCE verifier. Use bounded timeout and no automatic retry. Code exists only in memory and is never logged/persisted. Validate the token response, positive expiry, supported token type, and scopes.

A timeout has unknown outcome; never automatically exchange the same code again.

Normalize only access token, optional refresh token, token type, granted scopes, and expiry. Ignore ID tokens unless separately approved. Compute stored expiry as server receipt time plus validated `expires_in`; the refresh skew is separate.

## 12. Refresh-Token Rules

The complete module needs offline access for schedules/background monitoring.

For an initial connection with no refresh token: do not activate; revoke new access where possible; record safely; require explicit reconsent.

During same-channel reauthorization, preserve an existing refresh token only when channel, Google client/environment, valid encrypted credential, sufficient scopes, integrity, and active connection all match. Otherwise remain incomplete.

An explicit valid replacement token atomically replaces the old token in a complete new envelope. Google does not guarantee a refresh token on every exchange; omission means no replacement, not deletion. [Google web-server OAuth guide](https://developers.google.com/identity/protocols/oauth2/web-server)

## 13. Scopes and Channel Resolution

Normalize/validate granted scopes, compare required/optional sets, store verified effective grants, disable optional missing capabilities, and require reauthorization for mandatory missing scopes. Broader grants do not authorize undocumented features.

Call `channels.list(mine=true)` with only approved parts. Validate response, item count, ID, safe title/handle/thumbnail, and ownership semantics. No usable channel means no connection and best-effort token revocation. Do not silently select among multiple returned channels. Reauthorization resolving another channel must preserve the old connection, revoke new credentials when possible, and return `OAUTH_CHANNEL_MISMATCH`.

## 14. Connection Persistence

After provider validation, construct/encrypt a versioned payload, then transactionally create/update connection, replace credential envelope/scopes, mark connected/available, set verification timestamps, write safe events, and create outbox work. No Google call occurs inside the database transaction.

If persistence fails after issuance, do not report success or overwrite a previous valid envelope; revoke the new token best-effort, record reconciliation evidence, and require a new authorization without reusing the code.

Uniqueness is `(narrial_user_id, youtube_channel_id)`. Same-user/channel reconnect updates the existing record; disconnected history requires a new authorization/envelope. Cross-user global uniqueness remains a Document 12 decision.

## 15. Safe Client Return

Redirect only to the stored allowlisted destination with `connected`, `cancelled`, `expired`, or `failed` plus optional safe correlation. Never include tokens, code, raw state, provider text, channel ID, ownership proof, stack trace, or arbitrary path. The client refetches connection state before showing success.

## 16. Access-Token Use and Expiry

Before YouTube calls: verify authority and usable connection, inspect expiry metadata, decrypt only for the immediate operation, refresh when within the proposed five-minute window, attach token only to the fixed Google request, never expose/log it, and discard plaintext promptly. Store actual expiry; do not subtract the refresh window.

## 17. Concurrent Refresh

One connection permits one refresh. Atomically acquire a connection lease, reread state/credential version, refresh only if still required, atomically store the new envelope, release, then waiting callers reread. Use lease expiry, bounded wait, optimistic versions, and secret-free lock/job metadata.

Refresh over HTTPS using refresh token, client ID/secret, and `grant_type=refresh_token`. Validate response; preserve the old refresh token when omitted; use valid replacement when present; update expiry/scopes; reset failures; and audit safely.

| Outcome | Behavior |
|---|---|
| Network/5xx/rate limit | Bounded retry/backoff and quota guidance |
| `invalid_grant` | Stop; require reauthorization |
| Missing stored refresh token | Require reauthorization |
| Invalid response | Preserve envelope; alert |
| Decryption/integrity failure | Stop credential use; security alert |
| Database failure | Preserve old envelope; reconcile |
| Unknown timeout | Reread/reconcile before retry |
| Disconnected during refresh | Never commit refreshed token |

Use bounded exponential backoff, jitter, attempts, deduplication, and provider delay. Never retry permanent failures. Exact values require Document 06 approval.

## 18. Testing-Mode Expiration

Staging must test refresh before expiry, `invalid_grant` after simulated expiry/revocation, safe pause/reconnect, no infinite retry, and recovery after consent. Seven-day testing expiration is expected provider behavior, not automatically an encryption/database defect.

## 19. Reauthorization

Verify auth/ownership, create a connection-bound `REAUTHORIZE` transaction, request offline access, use consent prompt only for approved recovery, follow the same callback/exchange, enforce channel match/scopes, preserve-or-replace refresh token under Section 12, atomically replace credentials, mark connected, restart work only under approved rules, audit, and return a refetch signal.

## 20. Revocation and Disconnection

Provider revocation may be detected by `invalid_grant`, YouTube authorization failure, or explicit verification. Stop operations, mark invalid/reauthorization-required, pause/cancel work, destroy confirmed-invalid credentials, audit, and never loop permanent retries. Cross-Account Protection is deferred unless approved.

For `DELETE /connections/:connectionId`: verify ownership; acquire lifecycle lock; block new work; pause/cancel pending work; decrypt only inside credential service; call Google's revocation endpoint; classify confirmed/already invalid/temporary/unknown; destroy local credentials; remove scopes; mark disconnected; audit; reconcile unknown remote outcome; return idempotently.

Google revocation can invalidate the project grant and associated tokens and may not take effect instantly. [Google web-server OAuth guide](https://developers.google.com/identity/protocols/oauth2/web-server) Local destruction does not wait indefinitely.

Disconnection wins refresh races: no refresh begins after disconnect starts; an in-flight refresh cannot commit after disconnected; any resulting token is revoked best-effort; final local state has no usable credential.

## 21. Unknown Outcomes

- Code exchange unknown: never retry same code; fail attempt and require fresh authorization.
- Refresh unknown: lock, reread, and reconcile before retry.
- Revocation unknown: destroy local credential and reconcile remotely; never restore access.
- Channel lookup unknown: do not persist connected state.

External effects always distinguish confirmed success, confirmed failure, and unknown.

## 22. Stable Error Mapping

| Condition | Result |
|---|---|
| Invalid/expired/replayed state | `OAUTH_TRANSACTION_INVALID/EXPIRED/ALREADY_USED` |
| Consent denied | `OAUTH_ACCESS_DENIED` / `cancelled` |
| Exchange rejected | `OAUTH_CODE_EXCHANGE_FAILED` |
| Redirect/config mismatch | `OAUTH_CONFIGURATION_UNAVAILABLE` plus alert |
| Missing scope | `YOUTUBE_PERMISSION_REQUIRED` |
| No channel | `YOUTUBE_CHANNEL_UNAVAILABLE` |
| Reauth channel mismatch | `OAUTH_CHANNEL_MISMATCH` |
| Missing/invalid refresh | `YOUTUBE_REAUTHORIZATION_REQUIRED` |
| Credential tamper | `CREDENTIAL_INTEGRITY_FAILURE` |
| Temporary provider/timeout | Stable provider unavailable/timeout error |
| Disconnected | `YOUTUBE_CONNECTION_DISCONNECTED` |
| Cross-user resource | `YOUTUBE_CONNECTION_NOT_FOUND` |

Raw provider descriptions remain restricted diagnostics.

## 23. Logging, Audit, and Metrics

Never log authorization URL, callback query, state, code, tokens, secret, PKCE verifier, raw token response, revocation body, or envelope. Safe events cover OAuth start/deny/expire/replay/exchange failure, connection create/reauthorize/mismatch, refresh success/failure, reauthorization required, revocation requested, and disconnect. Metrics use outcome/latency counts without secrets or raw user/channel identifiers as labels.

## 24. Transaction Boundaries

Database transactions may consume state, persist connection/envelope/scopes/events, and create outbox work. Never hold them during Google exchange, refresh, revocation, channel lookup, or client redirect. Coordinate through durable intent, locks, versions, and reconciliation.

## 25. Recovery Matrix

| Failure | Persisted result | Recovery |
|---|---|---|
| Before transaction | None | Retry start |
| Consent cancelled | Consumed failed transaction | Start again |
| Invalid/replayed callback | No connection change | Start again if legitimate |
| Exchange failure | Consumed failed transaction | Start again |
| Scope/channel failure | No usable update | Reauthorize/correct account |
| Channel mismatch | Existing connection unchanged | Correct account/new approved flow |
| Encryption failure | No credential persisted | Operational recovery/new flow |
| DB failure after exchange | Old state preserved; revoke new token | New flow |
| Temporary refresh failure | Old envelope preserved | Automatic bounded retry |
| Permanent refresh failure | Reauthorization required | User reconnects |
| Revocation timeout | Local credential destroyed; reconciliation pending | No local restoration |

## 26. Implementation Slices

1. Contracts and fake OAuth adapter.
2. Persistent transactions and atomic consumption.
3. Credential envelope/key integration.
4. Initial exchange, scopes, channel, persistence, and safe return.
5. Expiry, refresh lease, preservation, and failure handling.
6. Reauthorization, mismatch, revocation, disconnection, and race handling.
7. Explicitly authorized staging browser proof with sanitized evidence.

Each slice passes focused/full tests, typecheck, lint, build, and leakage inspection.

## 27. Tests

Test authentication, return allowlist, state generation/digest-only persistence, correct parameters, offline access, idempotency, URL redaction; callback success/denial/malformed/expiry/replay/concurrency/environment/exchange timeout/no retry/safe return; scope/channel/malformed response/duplicate/mismatch/database failure/encrypted storage; expiry threshold/single concurrent refresh/preservation/replacement/temporary and permanent failure/lease/commit/disconnect race; revocation success/already-invalid/temporary/unknown/local destruction/repeat/pending work/no leakage.

## 28. Staging Verification

After authorization, use dedicated staging project/client/user/channel; inspect consent/scopes; connect and confirm channel; verify ciphertext-only persistence; restart; test one refresh and token preservation; externally revoke and reconnect; reject a different channel; disconnect; verify local destruction; and inspect all artifacts for leakage. Account for testing-mode expiry.

## 29. Decisions Requiring Approval

| ID | Decision | Recommendation | Status |
|---|---|---|---|
| YT-OAUTH-DEC-001 | Flow | Backend authorization-code flow | Requires approval |
| YT-OAUTH-DEC-002 | Offline | `access_type=offline` | Requires approval |
| YT-OAUTH-DEC-003 | Incremental grants | `include_granted_scopes=true` | Requires approval |
| YT-OAUTH-DEC-004 | Normal prompt | Omit | Requires approval |
| YT-OAUTH-DEC-005 | Reconsent | `prompt=consent` only after explicit recovery | Requires approval |
| YT-OAUTH-DEC-006 | State lifetime | 10 minutes | Requires approval |
| YT-OAUTH-DEC-007 | PKCE | `S256` if approved/compatible | Requires approval |
| YT-OAUTH-DEC-008 | Initial missing refresh | Do not activate; reconsent | Requires approval |
| YT-OAUTH-DEC-009 | Reauth token omission | Strictly preserve valid existing refresh token | Requires approval |
| YT-OAUTH-DEC-010 | Refresh threshold | Five minutes | Requires approval |
| YT-OAUTH-DEC-011 | Refresh concurrency | Connection lease + version | Requires approval |
| YT-OAUTH-DEC-012 | Multiple channels | Never choose silently; verify behavior | Blocked |
| YT-OAUTH-DEC-013 | Callback return | `303 See Other` | Requires approval |
| YT-OAUTH-DEC-014 | Cross-Account Protection | Defer baseline | Requires approval |

## 30. Implementation Gate

- [ ] Staging Google project/client/tester/scopes/callback approved and configured.
- [ ] Client secret in approved storage.
- [ ] Fastify foundation passes.
- [ ] Narrial authentication, PostgreSQL/Prisma, migrations, encryption/keys available.
- [ ] State/API decisions approved and fake contracts pass.
- [ ] Owners/runbooks assigned.
- [ ] Explicit implementation authorization given.

Current status: **Blocked.**

## 31. Acceptance Criteria

- [x] Authenticated initiation and backend-owned parameters are defined.
- [x] State is protected, bound, expiring, and atomically single-use.
- [x] Callback/code exchange, consent denial, scope/channel validation, encrypted persistence, and safe return are defined.
- [x] Initial/reconnect refresh-token omission rules are defined.
- [x] Refresh is concurrency-safe and preserves tokens.
- [x] Invalid grants, reauthorization, mismatch, revocation, disconnect, races, and unknown outcomes are defined.
- [x] Test and staging plans are defined from current official Google documentation.
- [x] Document 15 now references this exact filename.
- [x] No OAuth implementation or live Google action occurred.
- [ ] Implementation gate is open.

## 32. Approval Record

- [x] User approved adding this documentation baseline on 2026-08-26.
- [x] User approved correcting Document 15's reference.
- [x] Approval does not authorize OAuth, Google setup, credentials, database work, or packages.
- [ ] OAuth implementation gate is open.

## 33. Prerequisites

- `11-google-cloud-console-and-youtube-api-setup.md`
- `12-database-design-collections-relations-and-migrations.md`
- `13-security-model-token-encryption-and-threat-controls.md`
- `14-backend-foundation-and-implementation-structure.md`
- `15-backend-api-endpoints-and-error-contract.md`

Their implementation and external-service gates remain authoritative.

## 34. Next Document

Proceed to `17-youtube-channel-discovery-permissions-and-management.md`, defining retrieved/displayed channel fields, scope sufficiency, verification, mismatch, metadata sync, availability, and reconnect states.

OAuth implementation begins only after Section 30 opens.

## 35. Change Log

| Version | Date | Change | Approval |
|---|---|---|---|
| 0.1.0 | 2026-08-26 | Initial source-verified draft | Superseded by approved baseline |
| 1.0.0 | 2026-08-26 | Approved baseline added; Document 15 reference corrected | User approved |
