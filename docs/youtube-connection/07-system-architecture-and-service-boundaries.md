# YouTube Connection Module — System Architecture and Service Boundaries

## Document Control

| Field | Value |
|---|---|
| Document number | 07 |
| Stage | Stage 3 — Architecture design and approval gate |
| Status | Approved architecture baseline — technology selections and provisioning remain gated |
| Version/date | 1.0.0 / 2026-08-26 |
| Prerequisites | Documents 00–06 |
| Next | `08-domain-model-state-machines-and-api-contracts.md` |
| Implementation authorized | No |

## 1. Purpose

This document defines the YouTube-only system containers, trust boundaries, ownership, data flows, failure domains, and technology-neutral constraints. Documents 08–27 must implement these boundaries without weakening `YT-FR-*` or `YT-NFR-*` requirements.

It installs nothing, creates no database or cloud resource, and does not approve unresolved providers, packages, regions, URLs, scopes, keys, or numerical targets.

## 2. Architecture Goals

Backend-owned OAuth and credentials; verified user/channel ownership; durable normalized state; resumable uploads; immediate and scheduled publication; at-least-once-safe workers; explicit success/failure/unknown outcomes; quota-aware synchronization; secret-free contracts; deterministic provider testing; observable operations; backup/restoration; and isolation from every non-YouTube platform.

## 3. System Context

```text
Narrial user
   │
   ▼
Expo client ── Narrial session ──▶ Backend API ──▶ Narrial auth verifier
   │                                  │
   │ opens Google authorization       ├──▶ Database
   │ and later refetches              ├──▶ Credential/key boundary
   ▼                                  ├──▶ Video source/storage
Google OAuth ◀── callback/code ───────┤
                                      ├──▶ Durable job system ──▶ Workers
                                      │                         ├──▶ Google OAuth
                                      │                         └──▶ YouTube API/upload
                                      └──▶ Logs/metrics/audits (redacted)
```

Google controls grants and token issuance. YouTube controls channel identity and remote video state. Narrial backend/database controls normalized application truth. The client is never authoritative for identity, ownership, OAuth completion, credentials, schedules, or publication success.

## 4. Container Boundaries

| Container | Owns | Must not own |
|---|---|---|
| Expo frontend | Accessible UI, Narrial session use, backend calls, browser launch, return-as-refetch, safe draft/display state | Google secrets/tokens, code exchange, provider authority, durable schedules |
| Backend API | Authentication, validation, ownership, OAuth orchestration, safe contracts, mutation intents, audits | Direct UI state or raw provider leakage |
| Database | Connections, OAuth transactions, encrypted credentials, uploads, publications, schedules, idempotency, status/audit state | Plaintext credentials or public response models |
| Credential/key boundary | Encrypt/decrypt authorization, key version/rotation, tamper failure | General business decisions |
| Video source/storage | Authorized durable byte access and lifecycle | User/channel authorization truth |
| Durable job system | Delayed/retryable intent delivery | Exactly-once claims or business authority |
| Workers | Schedule execution, upload recovery, refresh, reconciliation, retries/dead letters | Trusting message payload ownership without revalidation |
| Google OAuth adapter | Authorization URL, code exchange, refresh/revoke, response validation/error normalization | Public API types or persistence transactions |
| YouTube adapter | Channel retrieval, resumable upload, metadata mutation, remote-status retrieval, quota classification | Narrial ownership or public provider SDK types |
| Observability | Redacted correlation, metrics, traces, health, alerts | Credentials/private metadata/raw payloads |

## 5. Trust Boundaries

All client input, deep links, queue messages, stored encrypted blobs, video bytes/URLs, Google responses, and YouTube responses are untrusted at entry. Each boundary MUST authenticate where applicable, authorize ownership, validate shape/size/state, encrypt in transit, redact output, bound time/resource use, and classify failure. Provider IDs never prove ownership.

## 6. Frontend Architecture

Conceptual modules: authenticated API client, connection queries/actions, browser/app-link coordinator, publishing preparation, upload/status views, schedule views, safe draft handling, and shared state components. Cold start refetches backend truth. Client cache may improve display but must expose staleness and is cleared by user scope. Duplicate actions are disabled locally and protected server-side.

## 7. Backend Layering

```text
HTTP transport → authentication/context → boundary validation
→ application services → domain policies
→ repositories / credential service / job dispatcher / provider adapters
```

Routes MUST NOT call Google/YouTube SDKs directly. External responses are validated inside adapters. Application services own use-case transactions and durable intents. Repositories own persistence mechanics. Public responses are allowlisted and exclude credentials/provider SDK types.

## 8. Internal Interfaces

Required seams: authentication verifier, OAuth transaction repository, connection repository, credential vault, Google OAuth adapter, YouTube channel/upload/video adapter, video reader, upload/publication service, schedule repository, job dispatcher, status synchronizer, idempotency repository, quota tracker, audit recorder, clock, and transaction coordinator. Documents 08 and 12 freeze their contracts and persistence assumptions.

## 9. OAuth and Credential Flow

1. Authenticated backend creates an expiring, user/environment-bound, single-use transaction.
2. Client opens the backend-provided Google authorization URL.
3. Google returns an authorization code to the approved backend callback.
4. Backend atomically validates/consumes state before exchange.
5. Backend exchanges the code, retrieves the authorized channel, validates required permission, encrypts credentials, and atomically upserts normalized connection state.
6. Backend redirects/returns only a safe app signal; client refetches.
7. Refresh is concurrency-safe and preserves an existing refresh token when no replacement is returned.
8. Reconnect replaces credentials only after full success; disconnect makes them unusable.

Official Google guidance supports server-side code exchange, state validation, and offline access when the app must act while the user is absent. Exact scopes and consent parameters remain Documents 11 and 16 decisions.

## 10. Upload and Publication Flow

1. Validate identity, ownership, connection, source, metadata, and intent key.
2. Atomically claim idempotency and persist intent before remote effects.
3. Start a YouTube resumable session and protect its URI as sensitive operational data.
4. Stream bytes with backpressure; persist confirmed progress/session state.
5. On timeout/crash, query/resume provider state rather than assuming all-or-none transfer.
6. Persist YouTube video identity and transition separately through received, processing, scheduled/private/published, failed/restricted/deleted states.
7. Unknown remote outcome triggers reconciliation before any repeated mutation.

Google’s official resumable-upload protocol supports saved session URIs, status queries, `308 Resume Incomplete`, and recovery after interruption. Exact transport/storage topology remains open.

## 11. Scheduling and Workers

Scheduling is complete-module scope and proposed R2. Options are Narrial-controlled workers, verified YouTube-native scheduling, or an approved hybrid. The final choice requires official capability verification.

All job delivery is treated as at-least-once. Durable jobs require stable identity, normalized execution instant/timezone, atomic claim, lease/lock where needed, idempotency, credential/permission revalidation, bounded retry, cancellation/reschedule concurrency, dead-letter/manual recovery, deployment compatibility, and observable lateness. The client remaining open is irrelevant.

## 12. Idempotency and Transactions

State-changing intents use a stable key tied to intent, an atomic unique claim, and a request hash. Reuse with a different payload fails. In-flight duplicates receive an explicit pending/conflict result. Records represent success, failure, and unknown and outlive the longest retry/redelivery path.

Atomic database boundaries include OAuth consumption, connection/credential replacement, idempotency claim, schedule create/claim/change/cancel, and durable worker outcome. External calls cannot share a database transaction; durable intent plus reconciliation closes that gap.

## 13. State Ownership

| State | Authority | Consistency/recovery |
|---|---|---|
| Narrial identity | Auth verifier/backend context | Per request/job |
| OAuth transaction | Database | Strong/atomic consume |
| Google grant/tokens | Google; protected backend copy | Refresh/reconnect |
| Channel identity/video state | YouTube | Validated synchronization |
| Connection/upload/publication/schedule | Narrial database | Durable normalized state |
| Job delivery | Job system | At-least-once; idempotent consumer |
| UI draft/cache | Client | Non-authoritative/refetchable |

## 14. Failure Domains

Frontend failure preserves durable work; API failure returns correlated safe errors; auth failure blocks access; database failure blocks acknowledgement/mutation; key failure blocks credential use and alerts; storage/upload failure preserves resumable intent; job/worker failure redelivers safely; Google/YouTube outage or quota degrades to honest pending/stale state; observability failure must not break core work but must alert through an independent path where available.

## 15. Deployment and Environment Topology

Local, development, staging, and production require isolated databases, OAuth clients/callbacks, app links, keys, storage, queues, telemetry, test channels, and flags. Production credentials never enter development/tests. API and workers deploy compatibly with expand/migrate/contract sequencing, readiness checks, disabled-by-default feature controls, smoke tests, rollback/forward-fix, backup, and restore evidence. Hosts, regions, DNS, and vendors remain Document 10/27 decisions.

## 16. Security, Privacy, Observability, and Quota

Architecture MUST provide least privilege, backend-only encrypted credentials, redirect/origin allowlists, provider validation, rate/resource limits, safe errors, secret-free audits, lifecycle deletion, encrypted backups, request/job correlation, bounded-cardinality metrics, health/readiness, OAuth/upload/schedule/sync dashboards, quota accounting, request minimization, terminal-state polling reduction, prioritization, and graceful exhaustion.

## 17. Testing and Migration

Provider adapters MUST support deterministic no-network fakes. Clock, retries, concurrency, OAuth replay, refresh races, interrupted upload, unknown outcome, worker redelivery, quota, cross-user access, leakage, migrations, restore, and reconciliation must be testable. Staging alone uses approved real Google/YouTube accounts for end-to-end evidence.

Existing Expo routes and Fastify safety foundation are retained/extended after verification. In-memory accounts, hardcoded channel/status data, and in-memory schedules are replaced or isolated as explicit fixtures. Unrelated Narrial code is protected.

## 18. Architecture Decisions

| ID | Decision | Recommendation | Status/block |
|---|---|---|---|
| `YT-ARCH-DEC-001` | Backend framework | Extend existing Fastify foundation | Requires `YT-DEC-101` approval and passing tests |
| `YT-ARCH-DEC-002` | Database/ORM | Relational transactional store; evaluate PostgreSQL/Prisma | Requires `YT-DEC-102` |
| `YT-ARCH-DEC-003` | Narrial authentication | Verify existing Clerk sessions on backend | Requires `YT-DEC-106` |
| `YT-ARCH-DEC-004` | Video source/transfer | Durable authorized source plus streaming/resumable transfer | Requires `PV-DEC-005`, `YT-DEC-105` |
| `YT-ARCH-DEC-005` | Job system | Durable delayed delivery with at-least-once consumers | Requires `YT-DEC-104` |
| `YT-ARCH-DEC-006` | Scheduling model | Compare Narrial worker/native/hybrid using official evidence | Requires `PV-DEC-004`, research |
| `YT-ARCH-DEC-007` | Synchronization | Manual plus quota-aware periodic reconciliation | Requires `YT-DEC-113` |
| `YT-ARCH-DEC-008` | Encryption/keys/secrets | Envelope/versioned authenticated encryption and managed secret boundary | Requires `YT-DEC-107`, `115` |
| `YT-ARCH-DEC-009` | Hosting/regions/observability | Select after targets and ownership | Requires `YT-DEC-103`, `114`, `116` |

## 19. Authorization Gate

Before dependencies: approve Documents 08–10 and stack decisions. Before database/storage/jobs: approve Documents 09, 10, 12, and 13 plus owners. Before Google setup: approve URLs, environments, scopes, owners, and Document 11. Before backend/frontend implementation: freeze contracts and applicable product decisions. This document alone authorizes none of those actions.

## 20. Traceability and Acceptance

Documents 08–27 MUST map each component/interface to applicable `YT-FR-*`, `YT-NFR-*`, decisions, threats, tests, and evidence. Architecture is acceptable because it defines all containers/trust boundaries, backend-only credentials, atomic OAuth state, untrusted provider validation, durable/resumable uploads, at-least-once-safe workers, unknown-outcome reconciliation, state authority, isolation, quota, observability, backup/restore, migration, and YouTube-only scope. It is not implementation-complete until Document 29 evidence passes.

## 21. Official References

- [Google OAuth 2.0 for web server applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google OAuth 2.0 best practices](https://developers.google.com/identity/protocols/oauth2/resources/best-practices)
- [YouTube resumable uploads](https://developers.google.com/youtube/v3/guides/using_resumable_upload_protocol)
- [YouTube Channels: list](https://developers.google.com/youtube/v3/docs/channels/list)
- [YouTube video resources](https://developers.google.com/youtube/v3/docs/videos)

## 22. Next Document and Change Log

Next: `08-domain-model-state-machines-and-api-contracts.md`, which freezes entities, lifecycle transitions, internal interfaces, public models, idempotency semantics, and data-flow contracts.

| Version | Date | Change | Approval |
|---|---|---|---|
| 1.0.0 | 2026-08-26 | Replaced generation prompt with approved system/container/trust/data-flow/failure/deployment architecture baseline | User approved build/add; technology/provisioning decisions remain gated |
