# YouTube Connection Module — Security Model, Token Encryption, and Threat Controls

## Document Control

| Field | Value |
|---|---|
| Document number | 13 |
| Filename | `13-security-model-token-encryption-and-threat-controls.md` |
| Module | YouTube Connection |
| Stage | Stage 5 — Security design and approval gate |
| Status | Approved baseline — B06 local/test credential encryption approved; production KMS remains blocked |
| Version | 1.1.0 |
| Last updated | 2026-08-27 |
| Prerequisites | Documents 06–08 and 10–12 |
| Next document | `14-oauth-connection-reconnection-and-disconnection-flow.md` |
| Source-of-truth role | Defines security controls for OAuth, credentials, encryption, keys, authorization, redaction, threats, and incidents |
| Implementation authorization | None |
| Token-storage authorization | Blocked until the security gate is satisfied |

## 1. Purpose

This document defines how Narrial's YouTube Connection module protects Google OAuth client credentials, OAuth transactions, access and refresh tokens, optional PKCE verifiers, resumable-upload session URLs, connected-channel ownership, encryption keys, logs, errors, audit records, and backups.

These controls must be satisfied before real OAuth routes, Google authorization, token storage, credential migrations, or credential-decrypting workers are implemented. This document creates no keys, secrets, routes, dependencies, or infrastructure.

## 2. YouTube-Only Boundary

These controls apply only to YouTube. Do not introduce credentials, scopes, token records, or encryption payloads for Instagram, TikTok, Facebook, or another platform. Shared Narrial security infrastructure may be reused only where it directly protects YouTube.

## 3. Security Objectives

1. Google credentials remain backend-only.
2. Database compromise alone does not reveal usable tokens.
3. Logs, errors, traces, queues, and analytics do not reveal credentials.
4. Users can access only their own channels and videos.
5. OAuth responses cannot be forged, redirected, or replayed.
6. Deep links never prove connection success.
7. Revoked credentials stop privileged work.
8. Concurrent refreshes cannot corrupt or discard refresh tokens.
9. Keys can rotate without disconnecting all users.
10. Disconnection destroys usable stored credentials.
11. Workers and operators receive least privilege.
12. Production credentials and keys never enter lower environments.
13. Security actions create safe audit evidence.

## 4. Prerequisite Readiness

Documents 06–08 and 10 remain prompts rather than final approved specifications. Document 11 is an approved setup baseline, but external Google setup is unauthorized. Document 12 is an approved persistence baseline, but database creation is blocked.

| Document | Required input | Consequence |
|---|---|---|
| 06 | Security, privacy, retention, availability, audit requirements | Final durations and incident targets unresolved |
| 07 | Trust and service boundaries | Runtime and worker permissions provisional |
| 08 | OAuth contracts and state transitions | Route behavior/statuses require reconciliation |
| 10 | Environments, host, region, secret/key ownership | Secret-manager and KMS provider cannot be selected |
| 11 | Google project, OAuth clients, scopes, callbacks | Setup documented but not authorized |
| 12 | Credential tables and envelope fields | Schema baseline approved; migrations blocked |

Approval of this file establishes documentation only. Token storage, key creation, OAuth implementation, and credential migrations remain unauthorized.

## 5. Asset Classification

| Asset | Classification | Storage rule |
|---|---|---|
| Google OAuth client secret | Critical secret | Approved secret manager only |
| Access/refresh tokens | Critical credentials | Encrypted backend storage only |
| Authorization code | Ephemeral critical credential | Memory only; never persisted/logged |
| Raw OAuth state | Ephemeral security secret | Transient only; database stores keyed digest |
| State-digest key | Critical secret | Secret manager/KMS boundary |
| PKCE verifier | Ephemeral critical secret | Encrypted short-lived backend storage if used |
| Resumable-upload URL | Sensitive capability credential | Encrypted backend storage |
| Key-encryption key | Critical cryptographic key | Managed KMS/HSM boundary |
| Data-encryption key | Critical key material | Wrapped at rest; brief plaintext lifetime |
| Channel/user IDs | Personal identifiers | User-scoped storage |
| Channel/video metadata | Personal/user content | Minimized and user-scoped |
| Audit metadata | Security-sensitive operational data | Allowlisted and access-controlled |

## 6. Trust Boundaries

```text
User device
  └─ authenticated HTTPS ─> Narrial backend
                              ├─ authentication verifier
                              ├─ OAuth transaction service
                              ├─ credential service
                              ├─ YouTube operation service
                              ├─ redacted audit/logging boundary
                              ├─ PostgreSQL (ciphertext/metadata/digests)
                              ├─ secret manager/KMS
                              ├─ Google OAuth and YouTube APIs
                              └─ approved least-privilege workers
```

Every boundary requires applicable authentication, authorization, validation, size limits, timeouts, and safe logging.

## 7. Roles

Product, security, Google Cloud, key, backend, database, operations, privacy, and independent-review owners must be assigned before implementation. Runtime services consume keys but do not own them. One person may hold multiple roles only after explicit approval.

## 8. Backend-Only Credential Rule

Credentials must never enter mobile/browser state, client-visible configuration, API responses, deep links, redirect URLs, client storage, cookies accessible to JavaScript, logs, analytics, crash reports, queues, support dashboards, screenshots, fixtures, source control, or documentation.

Frontend-safe data is limited to connection/channel identifiers and display metadata, connection and permission status, safe timestamps, safe error categories, and recovery actions. The frontend never receives token contents or detailed token-presence metadata.

## 9. Authentication and Authorization

All user-facing YouTube endpoints require a verified Narrial session except the Google callback. The callback binds to its initiating user through the protected, single-use OAuth transaction.

Every resource query should include both resource ID and authenticated `narrial_user_id`. Client-supplied user IDs never authorize access. Connection status, credential status, relationships, and requested actions are checked before provider calls.

Workers use approved service identities, may claim only relevant jobs, retrieve only the required connection, and request narrow credential-service operations. They cannot list or export credentials. No administrative API may display plaintext tokens; exceptional operational access is approved, time-bound, least-privilege, and audited.

## 10. OAuth Initiation Protection

Before redirecting to Google, the backend verifies authentication, validates an allowlisted return destination, generates secure random state, stores only its keyed digest, binds the transaction to the user/scopes/return, sets a short expiry, stores an encrypted PKCE verifier if approved, applies rate limits, and creates a safe audit event.

| State property | Proposed requirement | Status |
|---|---|---|
| Entropy | At least 256 random bits | Requires approval |
| Encoding | Base64url without padding | Requires approval |
| Stored representation | HMAC-SHA-256 digest | Requires approval |
| Digest key | Dedicated secret-manager value | Requires approval |
| Lifetime | 10 minutes | Requires approval |
| Use count | Exactly once | Required |
| Binding | User, scopes, environment, allowlisted return | Required |

Predictable IDs, timestamps, user/channel IDs, and database identifiers are invalid OAuth state.

## 11. OAuth Callback Protection

The callback must validate method/path and bounded parameters; compute the state digest; atomically consume one matching pending, unexpired transaction; reject missing, expired, replayed, consumed, or mismatched state; handle provider denial safely; exchange the authorization code on the backend; never persist/log the code; validate token and YouTube channel responses; transactionally store the connection, encrypted credentials, and scopes; and redirect only to an allowlisted destination without secrets.

The client treats its return as an untrusted notification and refetches authoritative connection status.

## 12. PKCE

**Proposed:** Use PKCE with the authorization-code flow as defense in depth, subject to final compatibility approval.

If approved, generate a fresh verifier per transaction, send only its challenge, store the verifier encrypted and bound to state, delete it after terminal callback processing, and never expose it. If not approved, the database PKCE fields remain null and cannot be reused for other data.

## 13. Credential Payload

The versioned plaintext payload contains only `credentialSchemaVersion`, access token, optional refresh token, token type, granted scopes, access-token expiry, and reliable issuance time. It excludes profile/channel/video metadata, OAuth code/state, client secret, database identifiers not required for use, and key material.

Serialization must be deterministic and versioned, with fixed names, validated types/lengths, rejection of unknown security-sensitive fields, and safe handling of an omitted replacement refresh token.

## 14. Authenticated Encryption

### YT-SEC-DEC-001 — Algorithm

**Proposed:** AES-256-GCM with a cryptographically secure unique 96-bit nonce per encryption. **Status:** Requires security approval.

Authentication succeeds before plaintext is accepted. Any ciphertext, nonce, tag, key-version, or context failure stops the operation. Use maintained platform cryptography; custom cryptography is prohibited.

### B06 local/test approval

On 2026-08-27 the user explicitly authorized `YT-TASK-B06` after the security/key-decision blocker was surfaced, then instructed implementation. This approves only the local and automated-test boundary: Node platform AES-256-GCM, a fresh 96-bit nonce, a 128-bit authentication tag, and associated data binding module, environment, owner, record, credential schema version, and encryption-context version. Local/test key identifiers use the non-secret format `local-v<positive integer>` or `test-v<positive integer>`; new writes use the configured active version and reads resolve the version stored with the envelope. Fixed test keys are synthetic non-production material. No production KMS/HSM, production key source, provider, owner, rotation frequency, or production secret storage is selected or approved.

### YT-SEC-DEC-002 — Envelope encryption

**Proposed:** A managed KMS/HSM key-encryption key wraps a data-encryption key used for authenticated encryption.

Persist ciphertext, nonce, tag if separate, wrapped data key, algorithm, key version, payload version, and context version. Plaintext keys and credentials exist only briefly in backend memory.

### Associated authenticated data

Bind ciphertext to:

- Module: `youtube-connection`.
- Record type.
- Internal connection/upload/transaction ID.
- Narrial owner ID.
- Payload schema version.
- Exact environment identifier.

This prevents valid ciphertext from being moved between users, records, or environments.

## 15. Key Hierarchy and Separation

Each environment has an independent KMS/HSM boundary. Production keys are unavailable to local, test, development, and staging. Database administrators do not automatically decrypt data; key administrators do not automatically read the database; backup access does not imply key access; CI cannot export production key material.

Separate credential, PKCE, and upload-session key-encryption keys are preferred when operational cost permits and require approval.

## 16. Envelope Metadata

Encrypted records support `ciphertext`, `initialization_vector`, optional separate `authentication_tag`, `wrapped_data_key`, allowlisted `algorithm`, `key_version`, `payload_schema_version`, `encryption_context_version`, and timestamps. Document 12 receives an additive schema amendment if the approved KMS requires missing fields.

## 17. Key Storage and Runtime Access

Keys live only in an approved KMS/secret manager, never code, committed environment files, database rows, images, clients, CI logs, documentation, or fixtures.

Environment-specific service identities receive only encrypt/decrypt/generate-or-unwrap-data-key access. Application identities cannot delete/disable keys, change policy, disable audit logs, export master keys, or access another environment's keys.

## 18. Key Rotation

Rotation may be scheduled, schema-driven, emergency, or cryptographic deletion. Activate a new version, encrypt all new data with it, retain approved old-version decryption, re-encrypt existing records in bounded idempotent batches, verify each replacement, monitor failures and remaining versions, test restore, and disable old versions only when nothing required depends on them.

Re-encryption uses optimistic concurrency and preserves original ciphertext until replacement commits. Jobs carry identifiers only. Rotation should not force reconnection unless credential integrity is lost. Rotation frequency remains an approval decision.

## 19. Decryption Boundary

Only the credential service decrypts envelopes. Callers request a YouTube operation, not token export. The service verifies authority/status, loads and decrypts the required envelope, refreshes if necessary, performs or authorizes the provider request, and discards plaintext promptly.

Repositories, controllers, serializers, audit services, and general job handlers never receive plaintext tokens. Memory clearing in managed runtimes is best effort, not the primary control.

## 20. Access-Token Expiry

**Proposed refresh threshold:** Refresh when expiry is within five minutes. **Status:** Requires approval.

This accounts for clock difference, latency, upload initialization, and retries. Use synchronized clocks and controllable test clocks. Missing/malformed expiry requires refresh when a refresh token exists; otherwise reauthorization is required.

## 21. Refresh-Token Management

Refresh flow: confirm connection status, acquire a per-connection lock/lease, reread state, decrypt inside the credential service, call Google over HTTPS, validate response, preserve the existing refresh token when Google omits a replacement, replace it only with a valid explicit replacement, encrypt a complete new envelope, transactionally update metadata, audit safely, and release the lock.

Other concurrent callers wait for a bounded period and reread, or return/requeue safely; they never refresh in parallel.

| Failure | Required behavior |
|---|---|
| Temporary provider/network failure | Bounded backoff retry |
| Rate limit | Respect retry guidance and quota controls |
| `invalid_grant`/revocation | Mark reauthorization required; stop privileged work |
| Missing refresh token | Require reauthorization |
| Invalid response | Preserve existing envelope; alert safely |
| Encryption/integrity failure | Stop immediately; security alert |
| Database failure | Preserve previous envelope; reconcile |
| Unknown outcome | Reread and reconcile before retry |

## 22. Atomic Credential Replacement

Replacement matches expected connection/credential version and atomically stores the complete envelope, updates expiry/refresh metadata, increments concurrency version, and records an audit/outbox event. Partial updates to ciphertext, nonce, tag, wrapped key, or key version are prohibited. Failed commits leave the prior complete envelope authoritative.

## 23. Revocation, Disconnection, and Reauthorization

Disconnection verifies ownership and recent authority, blocks new privileged work, stops/cancels pending work per approved rules, attempts Google revocation where supported, reconciles unknown outcomes, destroys stored credentials, removes active scopes, and audits safely.

Provider revocation or `invalid_grant` marks credentials invalid, changes the connection to a reconnection state defined by Document 08, stops uploads/publications/schedules/sync, preserves safe history, and never retries permanently invalid credentials indefinitely.

Reauthorization creates a new OAuth transaction and credential envelope; it never silently reactivates old ciphertext.

## 24. OAuth Scope Security

Request only approved minimum YouTube scopes. Store and verify effective grants, reject missing permissions with a recovery state, do not use broader unexpected scopes for undocumented features, and require product/privacy/security/Google review for additions. Scope logging is limited to an approved allowlist.

## 25. Resumable-Upload Sessions

Treat YouTube resumable-upload URLs as credentials. Encrypt and context-bind them; do not expose them to clients, jobs, logs, traces, errors, or audits; decrypt only within the upload service; delete after terminal completion plus approved recovery time; and replace atomically. User-supplied URLs can never become upload-session URLs.

## 26. Secret Inventory

| Secret | Owner | Consumer | Storage |
|---|---|---|---|
| Google client secret | Google Cloud owner | OAuth backend | Secret manager |
| State-digest key | Security/key owner | OAuth transaction service | Secret manager/KMS |
| Credential KEK | Key owner | Credential service | Managed KMS/HSM |
| PKCE key boundary | Key owner | OAuth service | Managed KMS/HSM |
| Upload-session key boundary | Key owner | Upload service | Managed KMS/HSM |
| Database credential | Database owner | Backend/workers | Secret manager |
| Backend auth secret/key | Authentication owner | Auth verifier | Secret manager |

Actual values never appear in documentation.

## 27. Environment Isolation

Local, test, development, staging, and production use separate Google clients/secrets, databases, key hierarchies, state keys, service identities, storage, jobs, callbacks, and appropriate telemetry boundaries. Tests use deterministic fake credentials and crypto adapters. Cross-environment ciphertext must fail authentication because environment is bound as associated data.

## 28. Logging and Redaction

Always redact access/refresh/ID tokens, authorization headers, client secrets, authorization code, PKCE verifier, raw state, cookies/session tokens, resumable and signed URLs, ciphertext/envelope parts, database URLs, secret-manager bodies, and raw OAuth/token responses.

Safe logs may include request/trace IDs, operation category, safe status/error code, retry count, duration, environment, permitted internal resource ID, non-secret key version, and provider HTTP status without body.

Redaction is enforced before structured logging, exceptions, traces, audits, queues, dead letters, analytics, and crash reporting. Sensitive data should not reach logging systems at all.

## 29. Error Policy

Public errors include a machine code, safe message, optional recovery action, and request ID. They exclude provider bodies, OAuth values, crypto/database details, stack traces, and cross-user existence information.

Safe categories include `AUTHENTICATION_REQUIRED`, `YOUTUBE_CONNECTION_NOT_FOUND`, `YOUTUBE_REAUTHORIZATION_REQUIRED`, `YOUTUBE_PERMISSION_REQUIRED`, `OAUTH_TRANSACTION_INVALID`, `OAUTH_TRANSACTION_EXPIRED`, `OAUTH_TRANSACTION_ALREADY_USED`, `CREDENTIAL_UNAVAILABLE`, `CREDENTIAL_INTEGRITY_FAILURE`, `YOUTUBE_PROVIDER_TEMPORARILY_UNAVAILABLE`, `RATE_LIMITED`, and `FORBIDDEN`.

## 30. Rate Limiting and Abuse Controls

Apply separate controls to OAuth initiation/callback failure, reconnection, refresh, verification, disconnection, upload initialization, schedule mutations, and administration. Consider user, session, source network, connection, and system-wide provider protection without treating IP as identity.

Bound bodies/queries/parameters, use safe `429` responses, avoid attacker-triggered permanent lockout, and monitor without sensitive inputs. Exact thresholds require testing and approval.

## 31. Boundary Validation

Treat client parameters, deep links, OAuth data, provider responses, metadata, queues, database records, and configuration as untrusted. Enforce type, length, format, allowlisted enums/HTTPS hosts, required fields, bounded arrays/JSON, timestamp range, ownership, and environment. Escape provider/user text in UI and never render it as raw HTML.

## 32. CSRF, Redirect, and Deep-Link Controls

OAuth state is short-lived, random, single-use, user/return-bound correlation and CSRF protection. Callbacks are exact and backend-owned; wildcards, arbitrary/protocol-relative returns, and user-controlled hosts are prohibited. Returns use allowlist identifiers. Deep links are secret-free and non-authoritative; clients refetch server state. Browser/native return handling follows approved session, CSRF, scheme, host, path, and parameter rules.

## 33. SSRF and External Requests

The backend calls configuration-controlled approved Google/YouTube/storage HTTPS hosts only. Restrict redirects, timeouts, sizes, proxies, and resolved destinations. Never accept request/database/job overrides for provider endpoints. User-controlled URL import is out of scope until separately designed.

## 34. Supply-Chain Controls

Before cryptographic/OAuth/KMS dependencies: confirm package boundary/lockfile; use exact Document 09 versions; prefer maintained native crypto or official KMS SDKs; review ownership, provenance, licenses, install scripts, and transitives; restrict lifecycle scripts until reviewed; inspect manifest/lockfile diffs; audit; avoid forced major remediation; and run typecheck, tests, and build. Custom crypto is prohibited.

## 35. Threat Model

| Risk ID | Threat | Controls |
|---|---|---|
| YT-SEC-RISK-001 | Database theft reveals tokens | Envelope encryption; keys outside DB |
| YT-SEC-RISK-002 | OAuth replay | Keyed digest, expiry, atomic single use |
| YT-SEC-RISK-003 | Login CSRF | State bound to initiating user/transaction |
| YT-SEC-RISK-004 | Open redirect | Server-side destination allowlist |
| YT-SEC-RISK-005 | Deep-link spoofing | Non-authoritative return and refetch |
| YT-SEC-RISK-006 | Cross-user IDOR | Owner-scoped queries/relations |
| YT-SEC-RISK-007 | Log leakage | Central redaction and canary tests |
| YT-SEC-RISK-008 | Frontend leakage | Safe DTOs and backend credential service |
| YT-SEC-RISK-009 | Ciphertext relocation | Authenticated owner/record/environment context |
| YT-SEC-RISK-010 | GCM nonce reuse | Secure unique nonce generation/tests |
| YT-SEC-RISK-011 | DB and key compromise | Separate custody and identities |
| YT-SEC-RISK-012 | Premature key disablement | Dependency inventory/re-encryption verification |
| YT-SEC-RISK-013 | Concurrent refresh corruption | Per-connection lock and atomic replacement |
| YT-SEC-RISK-014 | Omitted replacement refresh token | Preserve current token |
| YT-SEC-RISK-015 | Infinite revoked-token retry | Permanent classification/reconnection |
| YT-SEC-RISK-016 | Upload URL leak | Encrypted capability handling |
| YT-SEC-RISK-017 | Malicious provider response | Strict validation/output escaping |
| YT-SEC-RISK-018 | Queue/dead-letter leakage | Identifier-only payloads |
| YT-SEC-RISK-019 | Production secret in lower environment | Full environment isolation |
| YT-SEC-RISK-020 | Insider bulk access | No export API, least privilege, audits |
| YT-SEC-RISK-021 | Unrestorable encrypted backup | Coordinated backup/key recovery tests |
| YT-SEC-RISK-022 | Secret committed | Detection, immediate revoke/rotation |
| YT-SEC-RISK-023 | OAuth/token endpoint DoS | Rate limits, bounded input, timeouts |
| YT-SEC-RISK-024 | SSRF | Fixed endpoint allowlists |
| YT-SEC-RISK-025 | Excessive scopes | Minimum allowlist and consent review |

## 36. Security Events and Alerts

Alert on repeated invalid/replayed state, integrity failures, unknown key versions, cross-environment ciphertext, refresh failure spikes, `invalid_grant` spikes, unauthorized/bulk credential access, key-policy changes, key disable/delete attempts, unexpected secret-manager identities, redaction failure, production secrets in lower environments, abusive callbacks/refreshes, and backup/restore failures. Alerts contain no secrets.

## 37. Incident Response

For token exposure, stop disclosure, revoke access, require reconnection where necessary, investigate safe evidence, determine affected users/operations, rotate related secrets when uncertain, and follow privacy notification rules.

Refresh-token exposure is high severity and requires revocation, envelope destruction, reconnection, and investigation of database/log/backup/support/worker access.

For key compromise, block unauthorized access, activate a clean hierarchy, stop new encryption with the compromised key, inventory dependent ciphertext, re-encrypt or revoke credentials, rotate service identities as required, verify recovery, and destroy old versions only after approved containment.

A committed secret is revoked/rotated immediately before history cleanup; deleting the line is insufficient.

## 38. Retention and Cryptographic Deletion

Raw state/code are never retained; state digests and PKCE expire; disconnected credentials are destroyed; wrapped data keys are deleted when cryptographic deletion applies; retired keys remain only while approved ciphertext depends on them; backups have expiry and restore controls; audit evidence is minimized; deletion jobs are observable/retryable; and user deletion covers databases, storage, caches, queues, dead letters, analytics, and backups under approved policy. Exact durations remain blocked.

## 39. Security Testing

Cryptography tests cover round trips, unique ciphertext, tampering, wrong owner/record/environment, unknown algorithm/key, rotation, malformed payload, and absence of plaintext fixtures.

OAuth tests cover secure state, digest-only storage, atomic consumption, replay/expiry/wrong-owner rejection, provider denial, absence of stored/logged code, fixed returns, non-authoritative deep links, and PKCE when enabled.

Authorization tests cover cross-user denial, worker limits, credential-free projections, and audited administration. Refresh tests cover expiry threshold, concurrency, refresh-token preservation/replacement, invalid responses, `invalid_grant`, retries, and unknown outcomes.

Redaction tests inject canary secrets and prove they are absent from responses, logs, traces, metrics, audits, queues, dead letters, snapshots, and crash reports. Rotation/incident tests cover safe re-encryption, failed-record recovery, old-key dependency checks, revocation, backup restore, and emergency runbooks.

## 40. Security Gate

OAuth implementation, credential migrations, and real token storage remain blocked until:

- [ ] Documents 06–08 are approved.
- [ ] Document 10 assigns environments, owners, secret storage, and regions.
- [x] Document 11 defines the Google setup baseline.
- [x] Document 12 defines credential persistence.
- [x] Document 13 is approved as a documentation baseline.
- [ ] Algorithm and envelope design receive security approval.
- [ ] KMS/secret-manager provider is approved.
- [ ] Security and key owners are assigned.
- [ ] State entropy, digest, and lifetime are approved.
- [ ] PKCE decision is approved.
- [ ] Refresh threshold and locking strategy are approved.
- [ ] Redaction and telemetry boundaries are approved.
- [ ] Incident and rotation runbooks have owners.
- [ ] Security tests are scheduled.
- [ ] Explicit implementation authorization is given.

## 41. Decisions Requiring Approval

| ID | Decision | Recommendation | Status |
|---|---|---|---|
| YT-SEC-DEC-001 | Credential encryption | AES-256-GCM | Approved for B06 local/test only; production remains gated |
| YT-SEC-DEC-002 | Key architecture | Managed KMS/HSM envelope encryption | Requires approval |
| YT-SEC-DEC-003 | Data key | Unique per record/encryption event | Local/test direct-key adapter approved for B06 only; production envelope/data-key design remains gated |
| YT-SEC-DEC-004 | Associated data | Module, record, owner, version, environment | Approved for B06 local/test only |
| YT-SEC-DEC-005 | State entropy | At least 256 random bits | Requires approval |
| YT-SEC-DEC-006 | State storage | HMAC-SHA-256 with dedicated key | Requires approval |
| YT-SEC-DEC-007 | OAuth lifetime | 10 minutes | Requires approval |
| YT-SEC-DEC-008 | PKCE | Enable if compatible | Requires approval |
| YT-SEC-DEC-009 | Refresh threshold | Five minutes | Requires approval |
| YT-SEC-DEC-010 | Refresh concurrency | Per-connection distributed lease | Requires approval |
| YT-SEC-DEC-011 | Key separation | Per environment; consider per data class | Requires approval |
| YT-SEC-DEC-012 | Rotation frequency | Set after provider/owner decision | Blocked |
| YT-SEC-DEC-013 | KMS/secret provider | Select through Document 10 | Blocked |
| YT-SEC-DEC-014 | Security/key owners | Assign accountable owners | Blocked |
| YT-SEC-DEC-015 | Retention durations | Approve with Documents 06/12 | Blocked |
| YT-SEC-DEC-016 | Worker boundary | Operation-based service; no token export | Requires approval |
| YT-SEC-DEC-017 | Admin access | No plaintext viewer/export | Requires approval |

## 42. Acceptance Criteria

- [x] Backend-only credential and owner-scoped access rules are defined.
- [x] Proposed authenticated envelope encryption and separate keys are defined.
- [x] OAuth state, callback, redirect, deep-link, and PKCE controls are defined.
- [x] Expiry, refresh concurrency, token preservation, revocation, and disconnection are defined.
- [x] Worker/admin least privilege and redaction boundaries are defined.
- [x] Rotation, incidents, retention, threats, and security tests are defined.
- [x] Unresolved choices remain explicit approval gates.
- [x] No secret, token, route, key, dependency, migration, or infrastructure was created.
- [ ] Prerequisite and implementation gates are satisfied.

## 43. Approval Record

- [x] User approved adding this documentation baseline on 2026-08-26.
- [x] Approval does not authorize implementation, token storage, key creation, or Google setup.
- [x] User approved B06 local/test AES-256-GCM and key-adapter implementation on 2026-08-27 after the exact blocker was surfaced; fake credentials/keys only.
- [ ] Security implementation gate is open.

## 44. Prerequisites

- `06-nonfunctional-requirements-and-quality-attributes.md`
- `07-system-architecture-and-service-boundaries.md`
- `08-domain-model-state-machines-and-api-contracts.md`
- `10-environments-hosting-urls-and-secret-ownership.md`
- `11-google-cloud-console-and-youtube-api-setup.md`
- `12-database-design-collections-relations-and-migrations.md`

Prompt-only or unapproved prerequisites keep dependent security decisions provisional.

## 45. Next Document

Proceed to `14-oauth-connection-reconnection-and-disconnection-flow.md`. It must use these controls for OAuth initiation, callback, exchange, channel retrieval, connection creation, reconnection, revocation, disconnection, frontend return, and recovery.

OAuth implementation and real token storage remain blocked until Section 40 is satisfied.

## 46. Change Log

| Version | Date | Change | Approval |
|---|---|---|---|
| 0.1.0 | 2026-08-26 | Initial security design draft | Superseded by approved baseline |
| 1.0.0 | 2026-08-26 | Approved documentation baseline added; implementation remains blocked | User approved |
| 1.1.0 | 2026-08-27 | Recorded the user-approved B06 local/test AES-256-GCM boundary and `local-vN`/`test-vN` key-version format; production KMS/provider and production key decisions remain blocked | User instructed implementation after exact approval blocker was surfaced |
