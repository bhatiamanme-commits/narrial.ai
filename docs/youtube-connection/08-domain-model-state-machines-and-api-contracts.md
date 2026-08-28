# YouTube Connection Module — Domain Model, State Machines, and API Contracts

## Document Control

| Field | Value |
|---|---|
| Document number | 08 |
| Stage | Stage 3 — Contract design |
| Status | Approved conceptual contract baseline — exact routes, schemas, and open decisions remain gated |
| Version/date | 1.0.0 / 2026-08-26 |
| Prerequisites | Documents 05–07 |
| Next | `09-technology-stack-dependencies-and-installation-order.md` |
| Implementation authorized | No |

## 1. Purpose and Contract Rules

This document freezes shared meanings before database, backend, worker, or frontend implementation. Public contracts expose Narrial concepts, never provider SDK or persistence representations. External inputs/provider responses are untrusted. Identity is backend-derived. State transitions are explicit. Side effects require durable idempotency and success/failure/unknown outcomes. Growing lists are bounded. Additive evolution is preferred.

Exact route paths, JSON schemas, table fields, code types, packages, and technologies remain delegated to Documents 09, 12, and 15.

## 2. Representation Layers

| Layer | Purpose | Allowed | Prohibited |
|---|---|---|---|
| Provider | Google/YouTube boundary | Validated adapter-local types | Direct public/persistence serialization |
| Domain | Canonical business meaning | Entities, invariants, state machines | Transport/ORM/SDK details |
| Persistence | Durable representation | Approved schema and encrypted blobs | Public response reuse |
| Public API | Client contract | Minimal allowlisted safe models | Tokens, raw scopes/errors, storage/session URLs |
| Frontend view | Accessible presentation | Derived labels/actions | Authoritative ownership/provider success |

## 3. Canonical Entities

| ID | Entity | Identity/owner | Public exposure |
|---|---|---|---|
| `YT-DOM-001` | Narrial User Reference | Backend-authenticated user | Never client-authoritative |
| `YT-DOM-002` | OAuth Transaction | Opaque ID; one user/environment | Safe status only |
| `YT-DOM-003` | YouTube Connection | Opaque ID; Narrial user | Allowlisted summary |
| `YT-DOM-004` | YouTube Channel Identity | Provider channel ID; connection-owned | Safe ID/name/optional handle/thumbnail |
| `YT-DOM-005` | Credential Envelope | Connection; key-versioned | Never public |
| `YT-DOM-006` | Granted Permission Set | Connection/provider grant | Normalized capability summary only |
| `YT-DOM-007` | Video Source | Opaque ID; Narrial user | Safe source summary |
| `YT-DOM-008` | YouTube Upload | Opaque ID; user/connection/source | Safe progress/state |
| `YT-DOM-009` | YouTube Video Reference | Provider video ID; upload/publication | Safe ID/link when authorized |
| `YT-DOM-010` | Publication | Opaque ID; upload/connection | Safe lifecycle state |
| `YT-DOM-011` | Scheduled Publication | Opaque ID; publication intent/user | Safe time/state |
| `YT-DOM-012` | Synchronization Record | Target entity | Freshness/status only |
| `YT-DOM-013` | Retry Record | Intent/operation | Eligibility/count category only |
| `YT-DOM-014` | Idempotency Record | User, operation, intent key | Never directly public |
| `YT-DOM-015` | Job Record | Intent/entity | Safe job state only when needed |
| `YT-DOM-016` | Audit Event | Event ID; actor category | Restricted support access |

## 4. Relationships and Invariants

```text
User 1 ── * OAuthTransaction
User 1 ── * YouTubeConnection ── 1 ChannelIdentity
Connection 1 ── 1 CredentialEnvelope / PermissionSet
User 1 ── * VideoSource ── * Upload ── 0..1 YouTubeVideoReference
Upload 1 ── 0..* Publication ── 0..1 ScheduledPublication
Operations ── * SyncRecord / RetryRecord / JobRecord / AuditEvent
Intent 1 ── 1 IdempotencyRecord
```

Connection cardinality remains governed by `PV-DEC-001`; shared-channel behavior by `PV-DEC-002`. Invariants: OAuth state is single-use; credentials never public; verified provider identity precedes connection success; disconnected connections cannot start provider mutations; upload binds owner/source/connection; publication references one durable intent; schedule stores an unambiguous instant plus original timezone; idempotency request hash is immutable; public success requires authoritative evidence.

## 5. State-Machine Conventions

States use `UPPER_SNAKE_CASE`. A transition specifies current state, command/event, guards, next state, side effects, audit, and failure outcome. Domain services own transitions; repositories enforce concurrency. Persistent state renames require migration and compatibility planning. Frontend mapping and tests must be exhaustive.

## 6. Connection, OAuth, and Credential States

| Machine | States | Key transitions/invariants |
|---|---|---|
| `YT-SM-CONN-001` | `UNKNOWN`, `PENDING_AUTHORIZATION`, `VERIFYING`, `CONNECTED`, `INSUFFICIENT_PERMISSION`, `RECONNECT_REQUIRED`, `DISCONNECTING`, `DISCONNECTED`, `ERROR` | Return does not imply connected; verified channel+grant produces `CONNECTED`; unusable authority produces reconnect; disconnect blocks new mutations |
| `YT-SM-OAUTH-001` | `CREATED`, `AUTHORIZATION_PENDING`, `CALLBACK_RECEIVED`, `CONSUMING`, `COMPLETED`, `DENIED`, `EXPIRED`, `FAILED`, `REPLAY_REJECTED` | Consumption is atomic/single-use; denial/expiry/replay terminal; code exchange is not blind-retryable |
| `YT-SM-CRED-001` | `VALID`, `ACCESS_EXPIRED_REFRESHABLE`, `REFRESHING`, `INSUFFICIENT_SCOPE`, `REFRESH_UNAVAILABLE`, `REVOKED`, `INVALID`, `DELETED` | Concurrent refresh controlled; absent replacement preserves valid refresh token; disconnect ends at deleted/unusable |

## 7. Upload, Processing, Publication, and Schedule States

| Machine | States | Key rules |
|---|---|---|
| `YT-SM-UPLOAD-001` | `DRAFT`, `VALIDATING`, `READY`, `QUEUED`, `SESSION_CREATING`, `UPLOADING`, `INTERRUPTED`, `CANCELLING`, `CANCELLED`, `TRANSFERRED`, `FAILED`, `OUTCOME_UNKNOWN` | `TRANSFERRED` is not processing/publication; unknown reconciles before repetition |
| `YT-SM-PROC-001` | `NOT_STARTED`, `PROCESSING`, `SUCCEEDED`, `FAILED`, `REJECTED`, `RESTRICTED`, `UNKNOWN`, `DELETED` | Provider mapping validated; unknown/stale is explicit |
| `YT-SM-PUB-001` | `NOT_REQUESTED`, `PENDING`, `PUBLISHING`, `PUBLISHED`, `FAILED`, `RESTRICTED`, `PRIVATE`, `OUTCOME_UNKNOWN`, `DELETED` | `PUBLISHED` only on approved provider evidence |
| `YT-SM-SCHED-001` | `DRAFT`, `SCHEDULING`, `SCHEDULED`, `RESCHEDULING`, `CANCELLING`, `CANCELLED`, `DUE`, `EXECUTING`, `RETRY_WAIT`, `PUBLISHED`, `FAILED`, `MISSED`, `OUTCOME_UNKNOWN` | Durable/client-independent; version/lock guards; cancel/execute races reconcile |

## 8. Synchronization, Idempotency, and Retry

| Machine | States/rules |
|---|---|
| `YT-SM-SYNC-001` | `NOT_REQUIRED`, `DUE`, `IN_PROGRESS`, `CURRENT`, `STALE`, `RETRY_WAIT`, `BLOCKED_BY_CREDENTIALS`, `BLOCKED_BY_QUOTA`, `FAILED` |
| `YT-SM-IDEM-001` | `CLAIMED`, `IN_PROGRESS`, `SUCCEEDED`, `FAILED_RETRYABLE`, `FAILED_TERMINAL`, `OUTCOME_UNKNOWN`, `EXPIRED` |

Idempotency requires atomic unique claim, immutable request hash, mismatch rejection, deliberate in-flight response, stored result, and retention longer than every retry/redelivery path. Retry classes are: safe automatic, retry after credential refresh, provider-delay retry, user-confirmed retry, reconciliation-required, never automatic, and terminal. OAuth code exchange and uncertain remote mutations are never ordinary automatic retries.

## 9. Public Contract Principles

Public models use opaque internal IDs, ISO/RFC-compatible timestamps as later approved, explicit nullability, `UPPER_SNAKE_CASE` enums, request correlation, backend-derived ownership, additive optional evolution, and bounded pagination. They exclude credentials, authorization codes, raw state/scopes/provider payloads/errors, encryption fields, resumable session URLs, internal hosts, stack traces, ORM models, and job internals.

## 10. Public Models

| Contract | Safe conceptual fields |
|---|---|
| `YT-CONTRACT-PUB-001` Connection | connection ID, platform=`YOUTUBE`, safe channel summary, connection/permission health, publishing eligibility, last verified, reconnect flag, timestamps |
| `YT-CONTRACT-PUB-002` Upload | upload ID, safe source/connection/channel refs, progress when known, separate upload/processing/publication states, retry action, safe error, optional YouTube video ID, timestamps |
| `YT-CONTRACT-PUB-003` Publication | publication ID, upload/video/channel summary, metadata summary, privacy/audience result, publication state, safe error, timestamps |
| `YT-CONTRACT-PUB-004` Schedule | schedule ID, publication intent, scheduled instant, original timezone, schedule/execution state, retry/actions, timestamps |
| `YT-CONTRACT-PUB-005` Video Status | local/provider identity, safe title/thumbnail, separate lifecycle dimensions, last sync/staleness, available actions, safe error |

Field requiredness, exact names, and schemas are finalized in Document 15.

## 11. Public Inputs and Lists

Conceptual inputs exist for authorization start/return signal, refresh, disconnect, target selection, upload creation, metadata, publish, schedule create/reschedule/cancel, manual refresh, and retry. Inputs contain only caller choices; user identity, ownership, credentials, and success are server-derived. Every mutation declares idempotency semantics.

Connections where multi-channel is approved, uploads, publications, schedules, and history use bounded ordered lists. Cursor versus page strategy, page limits, filters, and stable sort require approval. Empty results are successful empty collections.

## 12. Error Contract

`YT-CONTRACT-ERR-001` contains a machine-stable code, safe message, request ID, optional allowlisted field/details, retry hint, reconnect hint, and optional safe retry-after. Categories distinguish invalid request, unauthenticated, forbidden, not found, conflict, semantic validation, idempotency mismatch/in-flight, rate limit, quota, provider unavailable/timeout, reconnect required, and internal failure. Documents 15 and 23 freeze codes/status mappings.

## 13. Internal Interfaces

| ID | Boundary |
|---|---|
| `YT-CONTRACT-INT-001` | Authentication verifier and backend user context |
| `YT-CONTRACT-INT-002` | Authorization start/completion service |
| `YT-CONTRACT-INT-003` | Connection list/refresh/reconnect/disconnect service |
| `YT-CONTRACT-INT-004` | Upload create/resume/cancel service |
| `YT-CONTRACT-INT-005` | Immediate publication service |
| `YT-CONTRACT-INT-006` | Schedule create/change/cancel service |
| `YT-CONTRACT-INT-007` | Synchronization/reconciliation service |
| `YT-CONTRACT-INT-008` | Credential vault and refresh coordinator |
| `YT-CONTRACT-INT-009` | Idempotency, quota, audit, clock, and transaction seams |

Repository interfaces provide user-scoped reads, atomic OAuth consume, connection/credential replacement, idempotency claim, state transition with concurrency guard, schedule claim/change/cancel, job outcome, and append-only audit without ORM-specific contracts.

Provider adapters validate raw responses and normalize authorization, channel, upload, and video operations with retry-safety/quota metadata and deterministic fakes.

## 14. Job and Event Contracts

Versioned secret-free jobs cover scheduled publication, upload recovery/reconciliation, connection health, video synchronization, OAuth cleanup, and approved artifact cleanup. `YT-CONTRACT-JOB-001` includes type, schema version, intent ID, opaque entity references, schedule time, attempt metadata, correlation, idempotency identity, and cancellation/version guard—never credentials or video bytes.

Audit/events contain version, event ID/type/time, actor category, safe target references, outcome, correlation, and safe reason. Private metadata/raw provider payloads are prohibited.

## 15. Time, Validation, and Nullability

Boundary instants use an approved UTC representation; schedules also preserve original IANA timezone and ambiguity choice. Server/controlled clock—not device time—controls validation/execution.

Validation occurs at HTTP, job, environment, provider, persistence-mapping, frontend-response, file metadata, timezone, transition, and idempotency-hash boundaries.

Omitted, optional-not-supplied, known-null, unknown-provider-value, redacted, and not-yet-created are distinct. Empty strings and magic sentinel values are prohibited.

## 16. Versioning and Compatibility

API versioning style remains approval-gated. Job/event schema versions are mandatory. Evolution prefers additive optional fields; enum additions require exhaustive-consumer fallback; removals/type changes require deprecation and migration. Mobile-client lag, database migrations, workers, and adapters must remain compatible across deployments. Prefer one active public version where practical.

## 17. Open Contract Decisions

| Decision | Options/impact | Status |
|---|---|---|
| Connection/shared-channel cardinality | `PV-DEC-001`–`002`; ownership/model impact | Requires approval |
| Canonical state strings/public enum casing | Proposed above; compatibility impact | Requires approval |
| Timestamp/timezone wire format | ISO strings plus IANA zone proposed | Requires approval |
| Pagination | Cursor vs page; mobile/cache impact | Requires approval |
| API version/envelope | Path/header and response envelope | Requires approval |
| Idempotency transport/in-flight result | Header/body; 409 vs 202/status | Requires approval |
| Public retry/action hints | Booleans vs action list | Requires approval |
| Exact error codes/status mappings | Contract compatibility | Document 15 approval |
| Job/event version policy | Consumer/deployment compatibility | Requires approval |
| Idempotency retention | Longest retry/redelivery chain | Requires target approval |

## 18. Invalid Contracts and Tests

Invalid: raw provider/ORM responses; token/code/state/session-URL fields; client-authoritative user/channel/success; one collapsed lifecycle status; mismatched idempotency reuse; unbounded lists; inconsistent errors; credential-bearing jobs; blind code-exchange retry; non-atomic OAuth checks.

Contract tests MUST cover input/output allowlists, errors, all valid/invalid transitions, exhaustive frontend mapping, provider validation/normalization, cross-user isolation, idempotency claim/mismatch/in-flight/unknown outcomes, pagination, nullability, compatibility, job versions, and secret leakage using deterministic fakes before live staging.

## 19. Traceability and Acceptance

Every entity, transition, public/internal/job/error contract MUST map to applicable `YT-FR-*`, `YT-NFR-*`, architecture boundary, database design, endpoint, frontend state, test, and evidence. Acceptance requires canonical ownership/relationships/invariants; distinct lifecycles; secret-free allowlisted models; server-derived authority; consistent errors; bounded lists; versioned jobs/events; explicit time/nullability; durable idempotency; compatibility; and YouTube-only scope.

This approval freezes conceptual semantics only. Open decisions, exact schemas/routes, and implementation evidence remain pending.

## 20. Prerequisites, Next Document, and Change Log

Documents 05–07 provide behavior, quality constraints, and architecture. Next: `09-technology-stack-dependencies-and-installation-order.md`, which may choose and sequence dependencies only when they support these contracts without redefining them.

| Version | Date | Change | Approval |
|---|---|---|---|
| 1.0.0 | 2026-08-26 | Replaced generation prompt with approved entities, invariants, state machines, public/internal/job/error contracts, compatibility, tests, and traceability baseline | User approved build/add; exact contracts and decisions remain gated |
