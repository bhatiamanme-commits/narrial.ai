# YouTube Connection Module — Environments, Hosting, URLs, and Secret Ownership

## Document Control

| Field | Value |
|---|---|
| Document number | 10 |
| Filename | `10-environments-hosting-urls-and-secret-ownership.md` |
| Module | YouTube Connection only |
| Stage | Stage 4 — infrastructure decisions and approval gate |
| Status | Approved environment-planning baseline — provisioning, external configuration, and unresolved values remain unauthorized |
| Version | 1.0.0 |
| Created / last updated | 2026-08-26 |
| Repository verification date | 2026-08-26 |
| Official-source verification date | 2026-08-26 |
| Prerequisites | Documents 03 and 07–09 |
| Next document | `11-google-cloud-console-and-youtube-api-setup.md` |
| Required owners | Infrastructure, security, Google Cloud, backend, frontend/mobile, data, DNS, operations, privacy, and release owners — unassigned |
| Audience | Product, engineering, security, operations, QA, release reviewers, and future AI sessions |
| Source-of-truth role | Authoritative environment taxonomy, URL registry, hosting constraints, configuration classification, secret ownership model, and infrastructure gates for this module |

Approval of this document approves its environment model and control framework only. It does **not** create or modify hosting, DNS, certificates, databases, Google Cloud projects, OAuth clients, storage, queues, KMS keys, secrets, environment files, deployments, or application code.

## 1. Purpose

This document establishes where every YouTube Connection component may run, how environments remain isolated, which public and private URLs are allowed, who must own each secret or resource, and which decisions must be complete before setup begins.

Exact OAuth callback URLs are security controls, not cosmetic configuration: Google requires the authorization request’s redirect URI to exactly match an authorized redirect URI, including scheme, case, path, and trailing-slash behavior. Exact app-return destinations and CORS origins likewise prevent callback confusion, open redirects, and cross-environment access.

Unknown domains, providers, regions, people, and credentials are deliberately recorded as `TBD — REQUIRES_APPROVAL`. Example domains use the reserved `.invalid` suffix and must never be registered as real Google redirect URIs.

## 2. Readiness and Authority

| Input | Approved contribution | Still unresolved | Effect |
|---|---|---|---|
| Document 03 | Terminology, decision IDs, approval lifecycle, ownership rules | Named owners and technical decisions | No actor may self-approve infrastructure |
| Document 07 | Backend-owned OAuth, database/worker/storage boundaries, environment isolation | Providers, hosts, regions | Hosting must preserve these boundaries |
| Document 08 | Secret-free public contracts, environment-bound OAuth transaction, app return as refetch | Exact routes and wire details | URLs cannot carry credentials or provider authority |
| Document 09 | Existing stack, package roots, dependency/install gates | Exact conditional packages and providers | No install occurs during environment planning |

No infrastructure or external service creation is authorized. Document 11 may configure a non-production Google environment only after the required callback, ownership, scope, isolation, and secret-storage decisions in this document are explicitly approved.

## 3. Environment Taxonomy

| ID | Canonical name | Purpose | Live Google/YouTube calls | Data policy | Current status |
|---|---|---|---|---|---|
| `YT-ENV-001` | `LOCAL` | Individual developer work on loopback/device | Fake by default; controlled non-production integration only after approval | Synthetic/non-production only | Defined; live integration blocked |
| `YT-ENV-002` | `AUTOMATED_TEST` | Deterministic unit, contract, integration, and failure tests | Prohibited in normal test suites | Generated fixtures; ephemeral isolated database | Defined |
| `YT-ENV-003` | `DEVELOPMENT` | Shared integration before staging | Dedicated development Google project/client only if approved | Synthetic/non-production users and test channels | Defined; resources absent/TBD |
| `YT-ENV-004` | `STAGING` | Production-like acceptance and controlled real-provider testing | Dedicated staging Google project/client and organization-controlled test channels | Sanitized non-production data only | Defined; resources absent/TBD |
| `YT-ENV-005` | `PRODUCTION` | Real users and production publication | Dedicated production Google project/client after policy/release gates | Approved production data | Defined; completely blocked |

Preview/ephemeral deployments are disabled for Google OAuth by default. Enabling one requires `YT-ENV-DEC-014`, a stable exact callback, isolated credentials/data, automatic expiry, owner, cost/abuse controls, and cleanup evidence. No wildcard callback or shared production client may make previews convenient.

### 3.1 Isolation invariants

Each environment has a distinct application identity, API base URL, callback, app return, Google project/client, database, encryption-key boundary, storage namespace, job namespace, telemetry dataset, feature flags, test channel set, access list, and retention/reset policy where the capability exists.

Credentials and encrypted records are not copied upward or downward. Configuration is promoted by reviewed templates; secret values are created directly in the destination boundary. Production credentials, data, backups, and tokens never enter local, test, development, or staging.

## 4. Environment Matrix

| Concern | Local | Automated test | Development | Staging | Production |
|---|---|---|---|---|---|
| Client | Expo development build; Expo Go not authoritative for stable returns | No real device unless a designated test job | Dedicated dev build/variant | Staging build/variant | Store/release build |
| API | Proposed `http://127.0.0.1:3000` for same-machine use | In-process Fastify injection or loopback ephemeral port | `https://api-dev.example.invalid` | `https://api-staging.example.invalid` | `https://api.example.invalid` |
| OAuth callback | Fake by default; approved loopback/stable dev endpoint only | None | Exact dedicated dev callback | Exact dedicated staging callback | Exact production callback |
| App return | Dev variant scheme/verified link; TBD | Synthetic allowlist value | Dev variant destination | Staging variant destination | Verified HTTPS Universal/App Link preferred; custom-scheme fallback only if approved |
| Google project/client | None by default | None | Dedicated; TBD | Dedicated; TBD | Dedicated; blocked |
| Database | Disposable local instance after DB gate | Isolated ephemeral instance/schema | Dedicated dev | Dedicated staging | Dedicated production |
| Storage/jobs | Local fake/emulator after approval | In-memory or isolated deterministic adapters | Dedicated namespace/services | Dedicated production-like services | Dedicated production services |
| Encryption keys | Disposable non-production key | Fixed non-secret test key material only | Dedicated non-production key | Dedicated staging key | Dedicated managed production key |
| Telemetry | Console/redacted local | Captured test sink; no vendor export by default | Dedicated dev dataset | Dedicated staging dataset/alerts | Production dataset/alerts |
| Users/channels | Developer-owned test identity/channel only if approved | Fake identities | Authorized team test identities/channels | Restricted acceptance testers and org-controlled test channels | Approved users/channels |
| Reset/retention | Resettable | Deleted after run | Scheduled reset and bounded retention | Production-like retention test, no production data | Document 24/27 policies |
| Owner | Unassigned | QA/backend owner unassigned | Unassigned | Unassigned | Unassigned |

All `.invalid` URLs are placeholders, not approved real values. Their purpose is to make accidental use fail safely.

## 5. Local and Physical-Device Rules

Repository evidence provides a backend test fixture at `127.0.0.1:3000` and a frontend development origin at `http://localhost:8081`; these are fixture values, not approved shared or production endpoints.

Local rules:

- Bind to loopback by default. Binding `0.0.0.0` or a LAN address requires an explicit device-testing reason and local firewall review.
- A simulator may access host loopback differently by platform; a physical device cannot treat its own `127.0.0.1` as the developer machine.
- Normal OAuth tests use a deterministic fake adapter. A real Google flow requires a dedicated development/staging client and organization-controlled test channel.
- Google documents localhost redirect URIs for web-server development, but the exact URI must still be registered and match. A device browser cannot reach a developer-machine localhost without an approved topology.
- A tunnel is conditional, short-lived, TLS-only, access-controlled where possible, and registered as one exact callback. Random callback churn, wildcard registration, production credentials, and unattended tunnels are prohibited.
- Tunnel/provider request logs are treated as sensitive because callbacks may contain short-lived authorization codes and state values. Query strings must not be retained or shared.
- Local database/storage/jobs are created only after their respective gates and must contain no production copy.
- Local secrets live in ignored local files or an approved developer secret store. They never appear in shell history, screenshots, docs, tickets, or committed fixtures.

## 6. Automated-Test Rules

`AUTOMATED_TEST` is hermetic by default:

- no Google, YouTube, Clerk production, production database, public callback, production telemetry, or production secret;
- deterministic OAuth/provider fakes, controlled clock, seeded random/ID sources, bounded fake video streams, and scripted provider errors;
- isolated database per suite/worker or transaction strategy approved by Document 12;
- test-only encryption keys that are clearly non-production and never decrypt another environment;
- fake job delivery capable of redelivery, concurrency, delay, cancellation, and dead-letter scenarios;
- fixtures contain no copied tokens, channel data, OAuth codes, resumable session URLs, user data, or secrets;
- cleanup is repeatable and verified after success, failure, or timeout;
- any live-provider suite is a separate manually/CI-approved staging test job, never part of the default test command.

## 7. Development, Staging, and Production Rules

### Development

Development is a shared non-production integration environment, not a synonym for local or staging. It requires dedicated backend, database, key, Google client, test users/channels, storage/job namespace, telemetry, and feature flags before live provider calls are enabled. It may be reset under a documented policy. Access is limited to authorized developers/testers.

### Staging

Staging mirrors production topology closely enough to prove TLS, exact callbacks, app returns, database migrations, workers, upload streaming, schedules, monitoring, backup/restore, key rotation, revocation, rollback, and device behavior. It uses its own organization-controlled Google project/client and test channels. It contains no production credentials, refresh tokens, channel data, or database copies.

### Production

Production requires approved domains, region/residency, Google consent/verification status, least-privilege scopes, managed secret/key storage, encrypted database/storage/backups, monitored workers, quotas/alerts, tested restore, feature flags defaulted safely, rollback, incident ownership, and human release approval. Production credentials are created directly within production and are unavailable to developer devices.

## 8. Hosting Requirements

| ID | Component | Mandatory requirements | Provider/status |
|---|---|---|---|
| `YT-HOST-001` | Backend API | Supported Node LTS, ESM/Fastify compatibility, public HTTPS, exact callback reachability, trusted-proxy policy, health/readiness, graceful shutdown, timeouts/body limits, horizontal-safe state, secret injection, logs/metrics, rollback | `TBD — REQUIRES_APPROVAL` via `YT-DEC-103` |
| `YT-HOST-002` | PostgreSQL/database | Approved engine/version, private connectivity, TLS, encryption, transactions/constraints, connection limits/pooling, migrations, backups/PITR if approved, restore evidence, region/owner | `TBD — REQUIRES_APPROVAL` via `YT-DEC-102/103/116` |
| `YT-HOST-003` | Workers | Same compatible application version, private service access, durable job source, controlled concurrency, long-running upload support if applicable, graceful drain, retry/dead-letter, clock, telemetry | `TBD — REQUIRES_APPROVAL` via `YT-DEC-104` |
| `YT-HOST-004` | Video source/storage | Large-object streaming, private-by-default access, short-lived authorization, encryption, lifecycle/cleanup, region, auditability, no public guessable URLs | `TBD — REQUIRES_APPROVAL` via `YT-DEC-105` |
| `YT-HOST-005` | Job/queue service | Durable delayed delivery, at-least-once semantics, leases/fencing, retention, dead-letter/manual recovery, namespace isolation, monitoring, backup/recovery expectation | `TBD — REQUIRES_APPROVAL` |
| `YT-HOST-006` | Key/secret service | Managed identity where possible, audit log, least privilege, key versions, rotation/revocation, regional availability, backup/restore dependency | `TBD — REQUIRES_APPROVAL` via `YT-DEC-107/115` |
| `YT-HOST-007` | Observability | Redaction, access control, bounded cardinality, environment isolation, approved residency/retention, alert delivery independent of app where possible | `TBD — REQUIRES_APPROVAL` via `YT-DEC-114` |

Provider selection must compare verified runtime limits, regions, networking, security controls, operational ownership, failure recovery, cost model, and exit/rollback path. Popularity alone is not evidence.

## 9. Region and Data-Residency Strategy

| ID | Decision | Required rule | Status |
|---|---|---|---|
| `YT-REGION-001` | Primary production region | Chosen from actual user/data/legal/latency requirements | `TBD — REQUIRES_APPROVAL` |
| `YT-REGION-002` | Backend/database/worker/job colocation | Prefer one primary region to reduce latency and consistency risk unless resilience requires otherwise | Proposed |
| `YT-REGION-003` | Video storage region | Align with backend/upload path, residency, and egress/cost constraints | `TBD — REQUIRES_APPROVAL` |
| `YT-REGION-004` | Key/secret region | Must be available to runtime without weakening residency or recovery | `TBD — REQUIRES_APPROVAL` |
| `YT-REGION-005` | Observability region | Must meet metadata/privacy retention requirements | `TBD — REQUIRES_APPROVAL` |
| `YT-REGION-006` | Backup/DR region | Requires approved RPO/RTO, transfer legality, encryption, and restore tests | `TBD — REQUIRES_APPROVAL` |

Do not infer the user population or governing law. Before production, the privacy/data owner must document data categories, allowed regions/transfers, deletion/backup behavior, RPO/RTO, and disaster-recovery ownership.

## 10. Canonical Public URL Registry

The versioned callback path is aligned with the approved later API baseline: `/api/v1/youtube/oauth/callback`. Domain placeholders remain invalid until replaced and approved. Trailing slash policy: no trailing slash for base URLs or callback paths.

| ID | Environment | Purpose | Proposed value | Visibility | Status |
|---|---|---|---|---|---|
| `YT-URL-001` | Local | API base, same machine | `http://127.0.0.1:3000` | Local only | Proposed/fixture-aligned |
| `YT-URL-002` | Development | API base | `https://api-dev.example.invalid` | Public HTTPS | Placeholder |
| `YT-URL-003` | Staging | API base | `https://api-staging.example.invalid` | Public HTTPS; restricted application access | Placeholder |
| `YT-URL-004` | Production | API base | `https://api.example.invalid` | Public HTTPS | Placeholder |
| `YT-OAUTH-URL-001` | Local integration | Google callback | `http://127.0.0.1:3000/api/v1/youtube/oauth/callback` | Local browser only | Conditional; exact registration required |
| `YT-OAUTH-URL-002` | Development | Google callback | `https://api-dev.example.invalid/api/v1/youtube/oauth/callback` | Public HTTPS | Placeholder |
| `YT-OAUTH-URL-003` | Staging | Google callback | `https://api-staging.example.invalid/api/v1/youtube/oauth/callback` | Public HTTPS | Placeholder |
| `YT-OAUTH-URL-004` | Production | Google callback | `https://api.example.invalid/api/v1/youtube/oauth/callback` | Public HTTPS | Placeholder; blocked |

DNS owner, certificate owner, deployment owner, and Google owner must jointly approve each non-local value. No DNS or Google registration occurs while a value contains `example.invalid`.

## 11. Google OAuth Callback Contract

Each Google OAuth client has only the exact callbacks for its environment. The backend callback:

- is `GET /api/v1/youtube/oauth/callback` and accepts bounded `code + state` or `error + state` as specified by Documents 15–16;
- is the only YouTube route allowed without a normal Narrial session, because the protected single-use OAuth transaction authorizes completion;
- validates and atomically consumes state before code exchange;
- rejects environment, client, callback, flow, expiry, replay, multiplicity, and shape mismatches;
- never forwards the authorization code, state, tokens, or raw provider error to the app;
- never logs query strings or full callback URLs;
- redirects only to the allowlisted destination captured by the transaction after a safe outcome is persisted;
- returns a generic safe failure if the app return is unavailable; it never accepts a caller-supplied arbitrary return host;
- treats success as backend state only; the app must refetch the connection API.

Wildcards, fragments, embedded credentials, query-based environment switching, protocol-relative URLs, HTTP outside approved loopback development, and one OAuth client shared across staging/production are prohibited.

## 12. App Return and Deep-Link Strategy

Repository evidence: `narrial/app.json` currently declares the custom scheme `narrial`; Expo Router and `expo-linking` are present. iOS bundle identifier, Android package, associated domains, intent filters, and EAS build variants are not defined, so production Universal Links/App Links are not ready.

Expo recommends development builds for stable auth/deep-link testing; Expo Go URLs are not stable enough to serve as production authorization-return contracts. Expo also recommends HTTPS Universal Links/App Links for most production apps because domain association verifies control.

| ID | Environment | Destination | Allowed path | Status |
|---|---|---|---|---|
| `YT-RETURN-001` | Local/development fallback | `narrial-dev://youtube/connection-return` | Exact path only | Proposed; requires dev build variant and `YT-DEC-109` |
| `YT-RETURN-002` | Staging fallback | `narrial-staging://youtube/connection-return` | Exact path only | Proposed; requires staging build variant |
| `YT-RETURN-003` | Production primary | `https://app.example.invalid/youtube/connection-return` | Exact path only | Preferred placeholder; requires owned domain plus iOS/Android association |
| `YT-RETURN-004` | Production fallback | `narrial://youtube/connection-return` | Exact path only | Existing scheme candidate; collision/UX/security review required |
| `YT-RETURN-005` | Web client | `https://app.example.invalid/youtube/connection-return` | Exact path only | Deferred until web release is approved |

Permitted return data should be absent or limited to a generic result category and opaque correlation/flow reference when Document 15 requires it. It must never contain Google codes/tokens, state, channel/user identity, error details, resumable URLs, secrets, or an arbitrary `next` URL.

Cold-start, warm/background, duplicate, expired, malformed, wrong-environment, and wrong-user returns all navigate to a safe YouTube connection screen and trigger authenticated refetch. No return URL proves connection success.

## 13. Return Allowlist and Open-Redirect Controls

`ALLOWED_APP_RETURN_URLS` is a backend exact-value allowlist by environment. Matching is performed on parsed scheme, host, port, and normalized path—not prefixes or substring checks.

- Allow only IDs from Section 12 approved for the current environment.
- Reject wildcards, userinfo, fragments, protocol-relative forms, unexpected ports, encoded path traversal, duplicate/conflicting parameters, and unapproved schemes/hosts/paths.
- Do not accept a full return URL from the client when a stable return-destination ID can be used.
- Persist the selected destination with the OAuth transaction; callback handling does not trust a new request parameter.
- Fall back to a fixed safe backend completion page or connection screen, not the request’s `Referer`.
- Changes require security review and regression tests for open redirect/deep-link spoofing.

## 14. Web and CORS Policy

The Expo config currently permits static web output, but a production web release for this module is not thereby approved. Native mobile requests are not governed by browser CORS; an `Origin` header is not user authentication. If web is enabled:

- configure `ALLOWED_WEB_ORIGINS` as exact origins only (`scheme://host[:port]`), without paths or wildcards;
- use separate values per environment and no production fallback;
- allow only required methods and headers; bound preflight caching;
- decide cookie versus bearer-token credential behavior in Document 15/18, with CSRF/SameSite controls where cookies are used;
- keep authentication and resource ownership checks on every protected endpoint regardless of CORS;
- reject `null`, file, custom-scheme, path-bearing, wildcard, and malformed origins;
- add browser tests for allowed/disallowed origins, credentials, preflights, errors, and cache behavior.

The current backend parser already rejects wildcards, non-HTTP(S) schemes, and path-bearing origins and reports invalid field names without values. This is verified foundation behavior, not complete environment configuration.

## 15. TLS, DNS, and Certificate Rules

- Development, staging, and production public endpoints use HTTPS with valid trusted certificates; local loopback HTTP is the only proposed exception.
- Provider, database, storage, queue, secret/KMS, observability, and administrative traffic uses authenticated TLS where supported/required.
- Certificate verification is never disabled. Private keys and certificate bundles never enter documentation, repositories, client bundles, or evidence.
- HSTS is enabled only after domain/subdomain readiness and rollback impact are reviewed; include-subdomains/preload require separate approval.
- DNS changes require least privilege, MFA, auditable access, two-person review for production, rollback values, and stale-record cleanup.
- Certificate owner monitors issuance, renewal, expiry, and failed challenge/validation.
- Google domain-verification records are managed by the DNS/Google owners and recorded without secret material.

## 16. Network and Trust Boundaries

| Flow | Rule |
|---|---|
| Internet → API/callback | HTTPS through approved ingress; body/query/header/time/rate limits; trusted-proxy configuration matches actual hop count |
| API/worker → Google/YouTube | HTTPS to approved Google endpoints through narrow adapters; timeouts, bounded retries, quota accounting |
| API/worker → database | Private/restricted network where possible, TLS, least-privilege identities, no client access |
| API/worker → storage/jobs/KMS | Workload identity or scoped short-lived credentials preferred; environment namespace enforced |
| Operations → infrastructure | SSO/MFA, least privilege, just-in-time access where possible, audited break-glass |
| Telemetry export | Egress only to approved endpoint; redacted fields and environment-specific credentials |

Never trust client URLs, queue messages, deep links, proxy headers, DNS answers, storage URLs, or provider responses. Server-side fetching of a user-influenced URL requires an allowlist, HTTPS, redirect policy, DNS/private-address defense, size/time limits, and ownership proof. Direct arbitrary URL import remains outside this document’s authorization.

## 17. Configuration Classification

| Class | Examples | Storage/exposure rule |
|---|---|---|
| Public client configuration | `EXPO_PUBLIC_API_BASE_URL`, Clerk publishable key, client environment label, safe feature flag | Readable by every app user; no security decision may depend on secrecy |
| Backend non-secret configuration | environment label, host/port, exact callback URI, allowlists, timeouts, log level, key identifier/version | Runtime configuration store; safe to name, but values still validated/redacted as appropriate |
| Confidential identifier | Google OAuth client ID, database host/name, KMS key resource ID | Backend/operations only unless explicitly public; not an authentication secret |
| Secret | OAuth client secret, database credential, Clerk secret key, storage/queue/vendor token | Approved secret store; never client-visible/logged/committed |
| Encryption key material | Data-encryption/wrapping keys | KMS/HSM/approved secret boundary; stronger access and rotation controls |
| Sensitive operational data | Google refresh/access token, auth code/state, resumable session URI | Encrypted application storage or ephemeral memory; never environment variables/docs/logs |

OAuth access/refresh tokens are per-user data, not deployment secrets. They belong in the encrypted credential store defined by Documents 12–13, not the environment-variable system.

## 18. Environment Variable Inventory

No values are recorded here. `Existing` means the name appears in current configuration/example code, not that a safe value exists or the capability is implemented.

| ID | Canonical name | Class | Consumer | Environments / validation | Status/owner |
|---|---|---|---|---|---|
| `YT-CONFIG-001` | `APP_ENV` | Backend non-secret | API/workers | Required: `local`, `test`, `development`, `staging`, `production`; must agree with deployment | Proposed; owner unassigned |
| `YT-CONFIG-002` | `NODE_ENV` | Backend non-secret | Node/runtime | Existing: `development`, `test`, `production`; not sufficient to distinguish staging | Existing |
| `YT-CONFIG-003` | `HOST` | Backend non-secret | API | Existing; non-empty; environment-specific bind policy | Existing |
| `YT-CONFIG-004` | `PORT` | Backend non-secret | API | Existing integer `1..65535`; platform injection allowed | Existing |
| `YT-CONFIG-005` | `BACKEND_PUBLIC_BASE_URL` | Backend non-secret | OAuth/link generation | Required absolute URL; no query/fragment/trailing slash; HTTPS except loopback | Proposed |
| `YT-CONFIG-006` | `EXPO_PUBLIC_API_BASE_URL` | Public client config | Expo client | Required per build; exact allowlisted HTTP loopback or HTTPS base | Proposed |
| `YT-CONFIG-007` | `EXPO_PUBLIC_APP_ENV` | Public client config | Expo client | Must match build variant/backend environment | Proposed |
| `YT-CONFIG-008` | `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Public client config | Expo Clerk | Existing; non-empty; correct Clerk environment | Existing |
| `YT-CONFIG-009` | `CLERK_PUBLISHABLE_KEY` | Backend non-secret identifier | Backend auth | Appears in backend example; necessity to be confirmed with Clerk integration | Planned/existing example |
| `YT-SECRET-001` | `CLERK_SECRET_KEY` | Secret | Backend auth only | Separate per Clerk environment; forbidden in `narrial/` | Existing planned name; security review required |
| `YT-SECRET-002` | `DATABASE_URL` | Secret | API/workers/migrations | Separate DB and least-privilege role per environment; TLS policy | Existing planned name; DB gate |
| `YT-CONFIG-010` | `GOOGLE_OAUTH_CLIENT_ID` | Confidential identifier | Backend Google adapter | Exact environment-specific client | Existing planned name; Google gate |
| `YT-SECRET-003` | `GOOGLE_OAUTH_CLIENT_SECRET` | Secret | Backend callback/token exchange | Environment-specific; never Expo | Existing planned name; Google gate |
| `YT-CONFIG-011` | `GOOGLE_OAUTH_REDIRECT_URI` | Backend non-secret | Backend Google adapter | Must exactly equal Section 10 approved callback | Existing planned name; Google gate |
| `YT-CONFIG-012` | `ALLOWED_APP_RETURN_URLS` | Backend non-secret allowlist | OAuth service | Existing planned name; parsed exact destinations; no wildcards | Planned; `YT-DEC-109` |
| `YT-CONFIG-013` | `ALLOWED_WEB_ORIGINS` | Backend non-secret allowlist | CORS | Existing; exact HTTP(S) origins only; no wildcard/path | Existing |
| `YT-CONFIG-014` | `LOG_LEVEL` | Operational config | API/workers | Existing allowlisted enum; production debug/trace prohibited by default | Existing |
| `YT-CONFIG-015` | `REQUEST_TIMEOUT_MS` | Operational config | API | Existing bounded integer; approved per upload/non-upload route design | Existing |
| `YT-CONFIG-016` | `HANDLER_TIMEOUT_MS` | Operational config | API | Existing bounded integer; background work cannot rely on request lifetime | Existing |
| `YT-CONFIG-017` | `KEEP_ALIVE_TIMEOUT_MS` | Operational config | API/ingress | Existing bounded integer; coordinated with proxy | Existing |
| `YT-CONFIG-018` | `SHUTDOWN_GRACE_PERIOD_MS` | Operational config | API/workers | Existing bounded integer; must support drain behavior | Existing |
| `YT-CONFIG-019` | `CREDENTIAL_KEY_PROVIDER` | Backend non-secret | Credential vault | Required after Document 13: local/test/managed variants | Proposed |
| `YT-CONFIG-020` | `CREDENTIAL_KEY_VERSION` | Backend non-secret | Credential vault | Required approved key version; no implicit fallback | Proposed |
| `YT-SECRET-004` | `CREDENTIAL_ENCRYPTION_KEY` | Encryption key material | Local/dev credential vault only if Document 13 permits | Existing planned name; forbidden as production plaintext env secret | Security gate |
| `YT-CONFIG-021` | `CREDENTIAL_KMS_KEY_ID` | Confidential identifier | Credential vault | Conditional managed key resource identifier | Proposed; provider TBD |
| `YT-SECRET-005` | Storage credentials | Secret/workload identity | API/workers | Conditional; prefer scoped workload identity | Name/provider TBD |
| `YT-SECRET-006` | Queue credentials | Secret/workload identity | API/workers | Conditional; separate namespaces/roles | Name/provider TBD |
| `YT-CONFIG-022` | `YOUTUBE_CONNECTION_ENABLED` | Backend operational flag | API/workers | Server-authoritative; default false outside approved environments | Proposed |
| `YT-CONFIG-023` | `EXPO_PUBLIC_YOUTUBE_CONNECTION_ENABLED` | Public client flag | Expo UI | Display-only; backend remains authoritative | Proposed |
| `YT-CONFIG-024` | Quota/sync/worker limits | Operational config | API/workers | Bounded validated values defined by Documents 21–25 | Names TBD |
| `YT-SECRET-007` | Observability exporter credential | Secret | API/workers/build only as approved | Separate environment; privacy review | Provider/name TBD |

Configuration aliases are not added casually. Final names must be reconciled with Documents 13–16, 21, 25, and 27 before implementation.

## 19. Client-Visible Configuration Rules

Expo inlines `EXPO_PUBLIC_*` values into the application bundle; every end user can read them. Therefore:

- only the API base URL, client environment label, Clerk publishable identifier, and safe presentation flags may use `EXPO_PUBLIC_*`;
- Google OAuth client secrets, Google tokens/codes/state, Clerk secret keys, database URLs, encryption keys, storage/queue credentials, private telemetry tokens, deployment credentials, and backend-only allowlists are prohibited;
- frontend builds fail if the environment/API/Clerk public configuration is missing or inconsistent;
- bundle/source-map inspection must verify prohibited names and credential patterns are absent;
- public flags never authorize backend behavior and cannot bypass authentication, ownership, quota, or release gates.

### Current security finding

`narrial/.env.local` contains the **name** `CLERK_SECRET_KEY`. Its value was deliberately not inspected. A security owner must determine whether it is populated. If populated or ever exposed to a client build, logs, source control, or sharing, revoke/rotate it first, remove it from the client project, verify history/build artifacts, and record safe evidence without the value. This remains tracker blocker `YT-BLOCK-007`.

## 20. Secret Inventory and Ownership

| Secret ID | Asset | Creator / business owner | Technical custodian | Runtime consumers | Rotation/revocation requirement | Status |
|---|---|---|---|---|---|---|
| `YT-SECRET-001` | Clerk backend secret | Identity/business owner TBD | Security/platform TBD | Backend API/workers only if required | Rotate on exposure, access change, environment recreation, provider guidance | Unassigned |
| `YT-SECRET-002` | Database credentials | Data owner TBD | Platform/data TBD | API, workers, approved migration job using separate roles | Rotate on exposure/role change; revoke old role after verified cutover | Unassigned |
| `YT-SECRET-003` | Google OAuth client secret | Google Cloud owner TBD | Security/platform TBD | Backend OAuth adapter only | Rotate through overlapping controlled rollout if supported; revoke immediately on exposure | Unassigned |
| `YT-SECRET-004` | Credential encryption/wrapping key material | Security owner TBD | KMS/key custodian TBD | Credential vault only | Versioned rotation, re-encryption plan, tamper/loss response per Document 13 | Unassigned |
| `YT-SECRET-005` | Storage access credential | Storage owner TBD | Platform TBD | Approved API/worker role only | Prefer short-lived identity; revoke leaked role/session | Conditional |
| `YT-SECRET-006` | Queue/job credential | Operations owner TBD | Platform TBD | API dispatcher/worker with separate permissions where practical | Rotate/revoke without losing durable jobs | Conditional |
| `YT-SECRET-007` | Observability exporter/API credential | Operations/privacy owner TBD | Platform TBD | Telemetry exporter only | Rotate on exposure/vendor/access change; verify telemetry continuity | Conditional |
| `YT-SECRET-008` | CI/deployment credential | Release owner TBD | Platform TBD | Approved pipeline only | Prefer short-lived federation; revoke compromised pipeline identity | Unassigned |
| `YT-SECRET-009` | DNS/certificate automation credential | DNS owner TBD | Platform/security TBD | Approved DNS/certificate automation only | Immediate revoke on exposure; audit domain changes | Conditional |
| `YT-SECRET-010` | Backup/restore credential | Data/DR owner TBD | Platform TBD | Backup/restore service and authorized operators | Rotate without making backups unrestorable; test restore | Conditional |

No secret is considered ready until a named human/team fills these roles:

- business/data owner: approves purpose and access;
- technical owner: accountable for integration and availability;
- custodian: controls storage, issuance, and policy;
- runtime consumer: exact workload identity/service;
- rotation approver/operator: authorizes and executes planned rotation;
- incident responder: revokes/contains exposure;
- access reviewer: periodically reviews grants;
- backup/restore owner where the secret is needed for recovery.

One person/team may hold multiple roles only after separation-of-duties risk is accepted.

## 21. Secret Storage, Access, and Evidence Rules

| Environment | Permitted storage | Prohibited |
|---|---|---|
| Local | Ignored `.env.local`/`.env` or approved developer secret store; non-production only | Production secrets, committed files, screenshots, shared chat/tickets |
| Automated test | CI secret only for separately approved staging-live job; otherwise non-secret fixtures | Real tokens/secrets in default tests or snapshots |
| Development | Dedicated managed secret boundary or restricted deployment configuration | Local developer copies of shared production secrets |
| Staging | Managed secret store with workload identity/audit | Production secret reuse or plaintext build artifacts |
| Production | Managed secret/KMS service, least-privilege runtime identity, audited break-glass | Developer-readable env files, client bundles, general CI output |

Required controls:

- `.env.example` contains names and unmistakable placeholders only; `.env`, `.env.*`, key/certificate files are ignored except approved examples.
- CI/CD masks secrets, restricts fork/untrusted jobs, avoids command echo, and uses short-lived federation where available.
- API and workers receive only secrets they consume. Migration, backup, DNS, and deploy identities are separate.
- Logs, metrics, traces, errors, health endpoints, screenshots, test output, support bundles, crash reports, and evidence exclude secret values and sensitive operational data.
- Secret access is authenticated, least-privilege, environment-scoped, auditable, reviewed, and promptly removed on role change.
- Backups of encrypted data retain required key-version access under controlled recovery; keys are not stored beside ciphertext backups.

## 22. Rotation and Revocation Procedure

Planned rotation:

1. Approve scope, owner, maintenance window, compatibility/rollback, and evidence plan.
2. Create a new credential/key version directly in the target environment.
3. Grant only required workload access; deploy consumers capable of using the new version.
4. Verify authentication, OAuth, database, encryption, worker, and monitoring behavior without printing values.
5. Stop new use of the old credential; revoke it after the approved overlap.
6. For data-encryption keys, migrate/re-encrypt through an idempotent audited process and retain only recovery-required versions.
7. Verify old credential rejection, alarms, background workers, restore ability, and no client/bundle exposure.
8. Record dates, resource aliases/key versions, owners, evidence, and next rotation—never values.

Emergency exposure response:

1. Treat the value as compromised immediately; do not merely delete it from a file.
2. Disable/revoke or restrict it using the provider’s safe emergency path.
3. Contain affected workloads and unauthorized access while preserving evidence.
4. Issue a replacement under least privilege and validate service recovery.
5. Search source history, build artifacts, logs, CI, caches, devices, tickets, and backups for exposure without redisclosing the value.
6. Assess user/provider impact, notify required owners, and follow incident/privacy obligations.
7. Document root cause and prevention; rotate dependent credentials when compromise scope is uncertain.

## 23. Encryption-Key Ownership

Document 13 remains authoritative for algorithms and token encryption. Environment requirements are:

- key material is generated by an approved cryptographic/KMS facility, not manually chosen text;
- ciphertext stores a key version/reference, not the key;
- API/workers receive decrypt/encrypt permissions only through the credential-vault boundary;
- local/test keys cannot decrypt staging/production data;
- production keys are separate from database/storage/backup credentials and from the encrypted data;
- rotation supports mixed key versions during migration and concurrency-safe writes;
- restore testing includes key availability and access recovery;
- key loss, disablement, compromise, deletion schedule, and break-glass procedures have named owners;
- deletion of a key that would make required data unrecoverable is destructive and requires explicit authorization.

## 24. Configuration Validation and Safe Startup

The backend must fail before listening or consuming jobs when required configuration is absent, malformed, inconsistent, or unsafe. Validation must detect:

- invalid `APP_ENV`/`NODE_ENV` combinations;
- missing/invalid API base, callback, return, origin, database, auth, key/provider, storage/job, and feature configuration required by enabled capabilities;
- production HTTP, loopback, `.invalid`, wildcard, path-bearing CORS origin, arbitrary return, callback mismatch, or cross-environment resource identifier;
- credentials or key material placed in public/client variables;
- production features enabled with non-production/test clients, keys, databases, namespaces, or telemetry;
- unsafe timeout/rate/quota/concurrency ranges or unknown key versions.

Errors contain stable field names and safe reason codes, never values. There is no production fallback to local/staging defaults, and partial configuration cannot start only part of a mutation path silently.

Client build validation requires an approved environment, HTTPS API URL outside local development, expected app identifier/scheme/link association, safe public flags, and no forbidden server variable names/values in the bundle.

## 25. Promotion and Change Rules

Promotion proceeds `LOCAL/AUTOMATED_TEST → DEVELOPMENT → STAGING → PRODUCTION`, but binaries/code/config templates—not secret values or user data—are promoted.

Every promotion requires:

- immutable candidate/version identity and compatible API/worker/migration versions;
- destination-specific secret creation and access review;
- database migration plan, backup/restore readiness, and rollback/forward-fix;
- exact callback/return/origin/DNS/certificate verification;
- Google project/client/scope/tester/consent review;
- feature flags initially disabled or limited to approved cohort;
- quality, security, quota, device/browser, worker, upload, schedule, and smoke evidence applicable to the stage;
- dashboards/alerts and incident owners active before traffic;
- Document 28 evidence and human release approval.

Configuration/secret change is a deployment. It receives review, staged rollout, observability, and rollback; it is not edited ad hoc in production.

## 26. Infrastructure and External-Service Gates

| Gate | Authorized action only after approval | Entry requirements | Current status |
|---|---|---|---|
| `YT-INFRA-GATE-001` | Approve hosts/regions/owners/domains | `YT-DEC-103/114/115/116`, Section 29 decisions | Blocked |
| `YT-INFRA-GATE-002` | Create isolated local/development database and first migration | Documents 09/12/13, DB engine/host/region/network/backup/secret owner, explicit `YT-DB-02/03` authorization | Blocked |
| `YT-INFRA-GATE-003` | Configure development/staging Google project/client | Exact callback/return, Google owner, scopes/use case, consent/testers/channel, secret storage, Document 11, explicit approval | Blocked |
| `YT-INFRA-GATE-004` | Create storage/job/worker resources | Approved topology/region/identity/retention/monitoring/rollback and Documents 12/19/21 | Blocked |
| `YT-INFRA-GATE-005` | Create KMS/secret resources and persist tokens | Documents 12–13, key/access/rotation/restore decisions, security approval | Blocked |
| `YT-INFRA-GATE-006` | Create observability resources | Document 25 vendor/privacy/retention/residency/cardinality/access decisions | Blocked |
| `YT-INFRA-GATE-007` | Create staging DNS/TLS/deploy | Approved real values/owners, Documents 25–27, staging release plan | Blocked |
| `YT-INFRA-GATE-008` | Create/enable production infrastructure/Google credentials | Security, privacy, quota, test, staging, restore, rollback, final human release gates | Blocked |

Database creation occurs only at Gate 002, after Document 12 approval and the matching Document 09 dependency gate. Google configuration occurs only at Gate 003. Storage/workers are not created as a side effect of selecting a dependency.

## 27. Ownership Register

| Owner ID | Role | Responsibilities | Required before | Assignment |
|---|---|---|---|---|
| `YT-OWNER-001` | Infrastructure/platform | Hosts, network, runtime identity, scaling, service availability | Any provisioning | Unassigned |
| `YT-OWNER-002` | Security/secrets | Threat review, secret store, keys, access, incident response | Any real credential | Unassigned |
| `YT-OWNER-003` | Google Cloud | Projects, billing, API, consent, clients, verification, quota, audit | Document 11 setup | Unassigned |
| `YT-OWNER-004` | Backend | API/callback/config/provider adapters | Backend/OAuth work | Unassigned |
| `YT-OWNER-005` | Frontend/mobile | Build variants, app IDs, schemes, Universal/App Links, public config | Document 18 work | Unassigned |
| `YT-OWNER-006` | Data/database | Engine, schema, roles, migrations, retention, restore | Database creation | Unassigned |
| `YT-OWNER-007` | Storage/upload | Media source, lifecycle, cleanup, access | Upload infrastructure | Unassigned |
| `YT-OWNER-008` | Workers/operations | Queue, schedules, retries, drain, dead letters, SLOs | Worker creation | Unassigned |
| `YT-OWNER-009` | DNS/certificates | Domains, records, TLS issuance/renewal, verification | Public URLs | Unassigned |
| `YT-OWNER-010` | Observability/support | Telemetry, alerts, redaction, incident diagnostics | Staging acceptance | Unassigned |
| `YT-OWNER-011` | Privacy/compliance | Data class, residency, retention, Google disclosures | Production setup | Unassigned |
| `YT-OWNER-012` | Release approver | Environment promotion, production enablement, rollback authority | Staging/production | Unassigned |

Google Cloud roles specifically include project/billing administrator, OAuth consent/config owner, OAuth client-secret custodian, test-user/channel owner, domain-verification owner, quota/policy owner, verification-submission owner, and incident responder. Assignments must use actual team identities outside public documentation where privacy requires.

## 28. Threat and Abuse Register

| ID | Threat / impact | Prevention and detection | Response owner |
|---|---|---|---|
| `YT-ENV-RISK-001` | Production secret in lower environment | Environment isolation, scans, access audit | Security |
| `YT-ENV-RISK-002` | Secret committed/bundled/logged | Ignore rules, public-variable policy, bundle/log canaries | Security/release |
| `YT-ENV-RISK-003` | OAuth callback takeover/mismatch | Exact HTTPS URI, DNS/TLS ownership, environment-bound state | Google/DNS/security |
| `YT-ENV-RISK-004` | Open redirect/deep-link spoofing | Destination IDs/exact allowlist, stored transaction return, refetch authority | Backend/mobile/security |
| `YT-ENV-RISK-005` | Cross-environment client/token/data | Dedicated project/client/database/key/namespaces and startup assertions | Platform/security/data |
| `YT-ENV-RISK-006` | Shared database or encryption key | Hard environment identifiers and access policies | Data/security |
| `YT-ENV-RISK-007` | Untrusted proxy headers change scheme/host/IP | Exact proxy-hop configuration and forwarded-header tests | Platform/backend |
| `YT-ENV-RISK-008` | Expired/misissued TLS or DNS compromise | Renewal/CT/DNS monitoring, MFA, two-person production changes | DNS/security |
| `YT-ENV-RISK-009` | SSRF through media/return/provider URL | Allowlists, DNS/IP/redirect/resource controls | Backend/security |
| `YT-ENV-RISK-010` | Orphaned credentials/resources after previews/staff change | Inventory, expiry, periodic access/resource review | Platform/security |
| `YT-ENV-RISK-011` | Rotation breaks callbacks/workers/decryption | Versioned overlap, staged verification, restore test | Owning service/security |
| `YT-ENV-RISK-012` | Region/residency mismatch | Explicit data map and provider-region approval | Privacy/platform |
| `YT-ENV-RISK-013` | `.invalid`, local, or staging URL reaches production | Build/startup assertions and release smoke test | Release |
| `YT-ENV-RISK-014` | Expo Go behavior mistaken for production linking | Development/store builds and cold/warm device tests | Mobile/QA |

## 29. Decisions Requiring Explicit Approval

| Decision ID | Decision | Recommendation | Blocks |
|---|---|---|---|
| `YT-DEC-103` | Backend/database hosts and regions | Colocate API/database/workers initially; choose from real residency/operations evidence | All provisioning |
| `YT-DEC-108` | Exact OAuth callback ownership/URLs | One backend HTTPS callback per environment using Section 10 path | Google clients/OAuth |
| `YT-DEC-109` | App-return/deep-link strategy | Environment-specific dev schemes; verified HTTPS Universal/App Link for production, optional reviewed scheme fallback | OAuth/frontend |
| `YT-DEC-110` | Google project/client isolation | Dedicated development, staging, and production projects/clients; no production reuse | Google setup |
| `YT-DEC-114` | Observability platform/region | Select after privacy, telemetry, and retention requirements | Staging operations |
| `YT-DEC-115` | Secret-management/feature-flag systems | Managed secret/KMS and server-authoritative flags | Real secrets/tokens |
| `YT-DEC-116` | Backup/restore/retention/deletion ownership | Named owner and tested encrypted restore before staging acceptance | Database/production |
| `YT-ENV-DEC-001` | Exact development API domain | Replace `.invalid` placeholder | Dev OAuth/deploy |
| `YT-ENV-DEC-002` | Exact staging API domain | Replace `.invalid` placeholder | Staging OAuth/deploy |
| `YT-ENV-DEC-003` | Exact production API/app domains | Replace `.invalid` placeholders | Production release |
| `YT-ENV-DEC-004` | iOS bundle IDs/associated domains | Unique per build variant; owned HTTPS association | iOS returns |
| `YT-ENV-DEC-005` | Android application IDs/intent filters | Unique per variant; verified asset association | Android returns |
| `YT-ENV-DEC-006` | Web release | Keep deferred unless product approves supported web UX/security | Web return/CORS |
| `YT-ENV-DEC-007` | Local live OAuth/tunnel | Fake-first; allow exact short-lived tunnel only for approved need | Local provider testing |
| `YT-ENV-DEC-008` | Production primary/DR regions and RPO/RTO | Decide from user/legal/availability evidence | Hosting/backups |
| `YT-ENV-DEC-009` | Named owners in Section 27 | Assign before their first gate | Every external action |
| `YT-ENV-DEC-010` | `APP_ENV` and configuration naming | Add distinct app environment separate from Node mode | Safe staging/production config |
| `YT-ENV-DEC-011` | Production custom-scheme fallback | Prefer verified HTTPS; retain only after hijack/fallback review | Mobile return |
| `YT-ENV-DEC-012` | Workload identity vs long-lived service secrets | Prefer workload identity/short-lived credentials | Cloud access |
| `YT-ENV-DEC-013` | Production HSTS scope | Enable after domain inventory and rollback review | TLS policy |
| `YT-ENV-DEC-014` | OAuth-enabled preview environments | Keep disabled by default | Preview infrastructure |

No decision in this table is silently approved by approving the document framework.

## 30. Environment Verification Matrix

For each enabled environment, evidence must cover:

| Verification | Local/test | Development | Staging | Production |
|---|---:|---:|---:|---:|
| Correct app/API environment identity and no fallback | Pending | Pending | Pending | Pending |
| Exact API URL, DNS, TLS, health/readiness | Local fixture only | Pending | Pending | Pending |
| Exact Google client/callback match | Not configured | Pending | Pending | Pending |
| App return allowlist, cold/warm/invalid return behavior | Pending | Pending | Pending | Pending |
| Narrial authentication and cross-user/environment rejection | Not implemented | Pending | Pending | Pending |
| Isolated database/storage/jobs/key boundary | Not created | Pending | Pending | Pending |
| CORS/browser behavior where web is approved | Foundation tests only | Pending | Pending | Pending |
| No production credentials/data in lower environments | Human/scan evidence pending | Pending | Pending | N/A |
| Secret access/rotation/revocation audit | Pending | Pending | Pending | Pending |
| Redacted logs/metrics/traces/support evidence | Pending | Pending | Pending | Pending |
| Backup/restore and key dependency | N/A/pending design | Pending | Pending exercise | Pending release proof |
| Test channel cleanup and remote-side-effect audit | Fake by default | Pending | Pending | Controlled operation |
| Named owners and sign-offs | Missing | Missing | Missing | Missing |

## 31. Infrastructure Acceptance Criteria

- [x] `YT-ENV-AC-001` — Local, automated-test, development, staging, and production environments are distinct.
- [x] `YT-ENV-AC-002` — Unknown domains, providers, regions, and owners are explicit placeholders/decisions, not assumptions.
- [x] `YT-ENV-AC-003` — Backend-owned exact OAuth callback behavior and prohibition of wildcard/open redirects are defined.
- [x] `YT-ENV-AC-004` — App returns are allowlisted, secret-free, non-authoritative refetch signals.
- [x] `YT-ENV-AC-005` — Native linking, Universal/App Links, Expo Go limitations, and web/CORS boundaries are separated.
- [x] `YT-ENV-AC-006` — Hosting, TLS, DNS, network, region, and residency requirements are defined without choosing a provider.
- [x] `YT-ENV-AC-007` — Configuration classes, current/proposed names, validation, and client/server separation are defined.
- [x] `YT-ENV-AC-008` — Every secret class has lifecycle requirements and ownership roles; no value is documented.
- [x] `YT-ENV-AC-009` — Database, Google, storage/worker, KMS, observability, staging, and production gates are explicit.
- [x] `YT-ENV-AC-010` — Production credentials/data are prohibited in lower environments.
- [x] `YT-ENV-AC-011` — The observed client-project Clerk secret-name risk is registered without reading its value.
- [x] `YT-ENV-AC-012` — YouTube-only scope is preserved.
- [ ] `YT-ENV-AC-013` — Real domains, callbacks, app IDs/links, hosts, regions, and providers are approved — pending.
- [ ] `YT-ENV-AC-014` — Named owners and secret custodians are assigned — pending.
- [ ] `YT-ENV-AC-015` — Runtime, external-console, DNS/TLS, rotation, restore, and device evidence passes — future execution.

## 32. Official References

Verified on 2026-08-26; recheck at setup and release because provider rules change.

- Google OAuth 2.0 for web-server applications and exact redirect matching: https://developers.google.com/identity/protocols/oauth2/web-server
- Google Cloud OAuth client management: https://support.google.com/cloud/answer/15549257
- Expo linking overview, Universal Links, and Android App Links: https://docs.expo.dev/linking/overview/
- Expo linking into an app and development-build requirements: https://docs.expo.dev/linking/into-your-app/
- Expo environment variables and public-value exposure: https://docs.expo.dev/guides/environment-variables/
- Expo EAS environment-variable behavior: https://docs.expo.dev/eas/environment-variables/usage/
- Clerk Expo setup and publishable-key boundary: https://clerk.com/docs/expo/getting-started/quickstart

External documentation is evidence for provider/framework behavior only; it does not authorize resource creation or determine Narrial’s unresolved business/hosting choices.

## 33. Handoff and Next Document

Prerequisites consumed: Documents 03 and 07–09. Before external setup, also read the latest Document 28 tracker and the controlling decisions in Section 29.

Next: `11-google-cloud-console-and-youtube-api-setup.md`. Reconcile it with this final baseline before use. Google configuration may start only after a non-production environment has:

1. a real approved backend domain and exact callback;
2. an approved app-return destination and build identity;
3. named Google, DNS, security, backend, and test-channel owners;
4. approved scopes/use case, consent data, testers, and privacy links;
5. an approved secret store and incident/rotation process;
6. explicit user/owner authorization for `YT-INFRA-GATE-003`.

Until then, no dependency installation, database creation, DNS/TLS operation, Google Cloud action, secret creation, deployment, or implementation is authorized.

## 34. Approval Record

The user authorized building and adding Document 10 on 2026-08-26. This approval establishes the environment, URL, hosting, configuration, secret-lifecycle, ownership-role, and infrastructure-gate baseline. It does not approve any unresolved value/owner in Section 29 or any external action.

## 35. Change Log

| Version | Date | Change | Approval |
|---|---|---|---|
| 1.0.0 | 2026-08-26 | Replaced the generation prompt with the repository-backed environment taxonomy, placeholder URL/callback registry, hosting/region/network requirements, configuration and secret inventories, ownership model, risks, gates, verification matrix, and acceptance criteria | User approved build/add; infrastructure remains unauthorized |
