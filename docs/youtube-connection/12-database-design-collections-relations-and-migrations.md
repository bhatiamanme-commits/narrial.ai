# YouTube Connection Module — Database Design, Collections, Relations, and Migrations

## Document Control

| Field | Value |
|---|---|
| Document number | 12 |
| Filename | `12-database-design-collections-relations-and-migrations.md` |
| Module | YouTube Connection |
| Stage | Stage 5 — Persistence design |
| Status | Approved documentation baseline — database creation not authorized |
| Version | 1.0.2 |
| Last updated | 2026-08-26 |
| Prerequisites | Documents 06–10 |
| Next document | `13-security-model-token-encryption-and-threat-controls.md` |
| Source-of-truth role | Defines the proposed YouTube persistence model, ownership rules, constraints, indexes, retention requirements, and migration sequence |
| Implementation authorization | None |
| Database creation authorization | Blocked until this document's prerequisite decisions and creation gate are satisfied |

## 1. Purpose

This document defines the persistence model required by the Narrial YouTube Connection module: database technology, tables, fields, relationships, ownership, constraints, indexes, retention, migrations, testing, and the point at which database creation may begin.

It does not create a database, install dependencies, generate or run migrations, configure Google Cloud, store credentials, or implement repositories and APIs.

## 2. YouTube-Only Boundary

All records defined here are exclusively for YouTube. Do not add Instagram, TikTok, Facebook, generic multi-platform credentials, or unrelated provider enums. Shared Narrial authentication, storage, jobs, and infrastructure may be referenced only where they directly support YouTube.

Existing in-memory multi-platform prototypes are not an authoritative database design and must not be migrated automatically.

## 3. Prerequisite Readiness

Documents 06–10 currently contain generation prompts rather than approved final specifications. Therefore, technology, state-machine, hosting, region, retention, and operational decisions below remain provisional where identified.

| Prerequisite | Required contribution | Current consequence |
|---|---|---|
| Document 06 | Security, reliability, retention, auditability, and performance requirements | Final retention and service targets remain blocked |
| Document 07 | Architecture and service boundaries | Database, worker, storage, and queue boundaries remain provisional |
| Document 08 | Entities, state machines, and API contracts | Final statuses and transitions require reconciliation |
| Document 09 | Stack, versions, and installation gates | Database packages must not be installed yet |
| Document 10 | Environments, region, hosting, and secret ownership | Provider, region, credentials, backups, and isolation remain unapproved |

Approval of this document approves the documentation baseline only. It does not authorize provisioning or implementation.

## 4. Current Repository State

The repository has a Fastify/TypeScript backend foundation but no approved PostgreSQL connection, Prisma dependency, Prisma schema, migration history, or production YouTube repository. Existing social-account, publishing, and scheduling data stores are in-memory prototypes.

## 5. Proposed Persistence Technology

### YT-DB-DEC-001 — Database

**Proposed:** PostgreSQL. **Status:** Requires final architecture approval.

It provides transactions, relational integrity, atomic uniqueness for OAuth state and idempotency, row locking for workers, indexed status queries, and structured migrations.

### YT-DB-DEC-002 — ORM

**Proposed:** Prisma ORM. **Status:** Requires Document 09 approval. No version is selected or installed here.

### YT-DB-DEC-003 — Identifiers and naming

- Application-generated UUIDs for internal primary keys.
- Separate string fields for external YouTube identifiers.
- Database tables and columns use `snake_case`.
- Prisma models use `PascalCase`.
- TypeScript/API fields use `camelCase`.
- Status values use `UPPER_SNAKE_CASE`.
- UTC-aware timestamps use `<event>_at` names.

## 6. Ownership and Access Boundary

Only the authenticated backend and approved workers may access the database. Clients never receive database credentials and never write directly to persistence.

Every user-owned query must derive `narrial_user_id` from the verified Narrial session. A client-provided user ID is never an authorization boundary. External Google/YouTube responses are validated before persistence, and all queries are parameterized.

## 7. General Data Rules

1. Internal identifiers are UUIDs; external YouTube IDs remain separate.
2. Timestamps are stored in UTC with timezone awareness.
3. Mutable aggregates have `created_at`, `updated_at`, and positive integer `version` fields.
4. Raw access tokens, refresh tokens, OAuth codes, OAuth state, PKCE verifiers, and resumable upload URLs are never stored in plaintext.
5. Encryption keys are never stored beside ciphertext.
6. Foreign keys enforce relations unless an immutable audit snapshot deliberately avoids one.
7. JSON fields use allowlists and size limits; unbounded client JSON is prohibited.
8. User-visible lists use stable ordering and pagination.
9. Worker claims, OAuth consumption, and idempotency claims are atomic.
10. Database constraints are security and correctness controls, not substitutes for application validation.

## 8. Relationship Overview

```text
Authenticated Narrial user
  ├─ youtube_connections
  │    ├─ youtube_connection_credentials
  │    ├─ youtube_connection_scopes
  │    ├─ youtube_uploads ─ youtube_upload_sessions
  │    └─ youtube_publications
  │           ├─ youtube_scheduled_publications
  │           └─ youtube_video_sync_records
  ├─ youtube_oauth_transactions
  ├─ youtube_video_sources
  ├─ youtube_idempotency_records
  └─ youtube_audit_events

Transactional aggregates
  ├─ youtube_status_events
  ├─ youtube_outbox_events
  └─ youtube_jobs
```

No local Narrial user table is introduced. `narrial_user_id` references the opaque authenticated identity established by Narrial's approved authentication layer.

## 9. Proposed Status Sets

These values must be reconciled with Document 08 before migration generation.

- Connection: `PENDING`, `CONNECTED`, `REAUTHORIZATION_REQUIRED`, `DISCONNECTED`, `REVOKED`, `ERROR`.
- OAuth transaction: `PENDING`, `CONSUMED`, `EXPIRED`, `FAILED`.
- Video source: `PENDING`, `AVAILABLE`, `INVALID`, `QUARANTINED`, `DELETED`.
- Upload: `QUEUED`, `INITIALIZING`, `UPLOADING`, `PROCESSING`, `SUCCEEDED`, `FAILED_RETRYABLE`, `FAILED_PERMANENT`, `CANCELLED`.
- Publication: `DRAFT`, `READY`, `PUBLISHING`, `SCHEDULED`, `PUBLISHED`, `FAILED_RETRYABLE`, `FAILED_PERMANENT`, `CANCELLED`.
- Schedule: `PENDING`, `CLAIMED`, `EXECUTING`, `COMPLETED`, `FAILED_RETRYABLE`, `FAILED_PERMANENT`, `CANCELLED`.
- Synchronization: `PENDING`, `IN_SYNC`, `RETRY_REQUIRED`, `FAILED_PERMANENT`, `STOPPED`.
- Job/outbox: `PENDING`, `CLAIMED`, `SUCCEEDED`, `FAILED_RETRYABLE`, `FAILED_PERMANENT`, `CANCELLED`.

## 10. `youtube_connections`

Stores safe channel metadata, never raw credentials.

| Column | Type | Null | Rules |
|---|---|---:|---|
| `id` | UUID | No | Primary key |
| `narrial_user_id` | VARCHAR | No | Authenticated owner |
| `youtube_channel_id` | VARCHAR | No | Validated external channel ID |
| `channel_title` | VARCHAR | No | Sanitized, non-empty display value |
| `channel_handle` | VARCHAR | Yes | Current provider handle |
| `channel_thumbnail_url` | TEXT | Yes | Validated HTTPS URL |
| `status` | connection status | No | Defaults to `PENDING` |
| `credential_status` | VARCHAR | No | `AVAILABLE`, `MISSING`, `EXPIRED`, `REVOKED`, or `INVALID` |
| `last_verified_at` | TIMESTAMPTZ | Yes | Permission/channel verification |
| `last_provider_sync_at` | TIMESTAMPTZ | Yes | Last successful metadata sync |
| `reauthorization_required_at` | TIMESTAMPTZ | Yes | Permission renewal required |
| `disconnected_at` | TIMESTAMPTZ | Yes | Required for `DISCONNECTED` |
| `created_at`, `updated_at` | TIMESTAMPTZ | No | Audit timestamps |
| `version` | INTEGER | No | Default `1`; must be positive |

Constraints and indexes:

- Unique `(narrial_user_id, youtube_channel_id)`.
- Do not add global channel uniqueness until cross-user policy is approved.
- Index `(narrial_user_id, status, updated_at DESC)`.
- Index `(youtube_channel_id)`.
- Index `(status, last_provider_sync_at)`.
- Index `(credential_status, reauthorization_required_at)`.
- A disconnected connection cannot retain an active credential row.

## 11. `youtube_connection_credentials`

Stores exactly one encrypted credential envelope per connection.

| Column | Type | Null | Rules |
|---|---|---:|---|
| `connection_id` | UUID | No | Primary/foreign key to connection |
| `ciphertext` | BYTEA | No | Authenticated encrypted payload |
| `initialization_vector` | BYTEA | No | Format finalized by Document 13 |
| `authentication_tag` | BYTEA | Yes | Required if stored separately |
| `key_version` | VARCHAR | No | Non-empty encryption-key version |
| `credential_schema_version` | INTEGER | No | Positive payload version |
| `access_token_expires_at` | TIMESTAMPTZ | Yes | Queryable expiry, never token data |
| `has_refresh_token` | BOOLEAN | No | Safe operational indicator |
| `last_refreshed_at` | TIMESTAMPTZ | Yes | Last successful refresh |
| `refresh_failure_count` | INTEGER | No | Default `0`; non-negative |
| `created_at`, `updated_at` | TIMESTAMPTZ | No | Audit timestamps |

Indexes: `(access_token_expires_at)`, `(key_version)`, and `(refresh_failure_count, updated_at)`.

The encrypted payload may contain approved OAuth tokens, token type, granted scopes, expiry metadata, and its schema version. Credentials are deleted or cryptographically rendered unusable immediately after confirmed disconnection or revocation.

## 12. `youtube_connection_scopes`

| Column | Type | Null | Rules |
|---|---|---:|---|
| `connection_id` | UUID | No | Foreign key |
| `scope` | TEXT | No | Exact approved Google scope URI |
| `granted_at` | TIMESTAMPTZ | No | First observed grant |
| `last_verified_at` | TIMESTAMPTZ | No | Latest verification |

Composite primary key: `(connection_id, scope)`. Scopes must belong to the approved YouTube allowlist. Unknown or broader scopes are rejected rather than silently accepted. Index `(scope)` and `(connection_id, last_verified_at)`.

## 13. `youtube_oauth_transactions`

| Column | Type | Null | Rules |
|---|---|---:|---|
| `id` | UUID | No | Primary key |
| `narrial_user_id` | VARCHAR | No | Initiating authenticated user |
| `state_hash` | BYTEA | No | Unique hash; raw state never stored |
| `status` | OAuth status | No | Default `PENDING` |
| `return_destination` | VARCHAR | No | Allowlisted destination ID, not arbitrary URL |
| `requested_scopes` | JSONB | No | Bounded validated scope-array snapshot |
| `pkce_verifier_ciphertext` | BYTEA | Yes | Encrypted if approved flow uses PKCE |
| `pkce_key_version` | VARCHAR | Yes | Required with encrypted verifier |
| `expires_at` | TIMESTAMPTZ | No | Must be after creation |
| `consumed_at` | TIMESTAMPTZ | Yes | Set once during atomic consumption |
| `failure_category` | VARCHAR | Yes | Safe machine-readable category |
| `created_at`, `updated_at` | TIMESTAMPTZ | No | Audit timestamps |

Unique `(state_hash)`. Index `(narrial_user_id, status, created_at DESC)` and `(status, expires_at)`. Consumption succeeds only for a matching owner and hash whose status is pending, consumption is null, and expiry is in the future. Authorization codes are never persisted.

## 14. `youtube_video_sources`

Stores metadata only; video bytes live in approved object storage.

Required fields: `id`, `narrial_user_id`, `storage_object_key`, `original_filename`, `mime_type`, `byte_size`, `checksum_sha256`, optional `duration_ms`, `status`, optional `validated_at` and `deleted_at`, timestamps, and `version`.

Rules:

- Unique `(narrial_user_id, storage_object_key)`.
- `byte_size > 0`; optional duration must be positive.
- Storage keys are server-generated and opaque.
- Signed or credential-bearing storage URLs are never stored.
- A source becomes `AVAILABLE` only after successful validation.
- Index `(narrial_user_id, status, created_at DESC)`, `(status, created_at)`, and `(deleted_at)`.

## 15. `youtube_uploads`

Required fields: `id`, `narrial_user_id`, `connection_id`, `video_source_id`, optional immutable `youtube_video_id`, `status`, `bytes_uploaded`, `total_bytes`, `attempt_count`, optional `next_attempt_at`, `last_attempt_at`, `failure_category`, `started_at`, `uploaded_at`, `completed_at`, `cancelled_at`, timestamps, and `version`.

Rules:

- Connection, source, and upload owner must match.
- `0 <= bytes_uploaded <= total_bytes`; total bytes are positive.
- Attempt count is non-negative.
- Only one active upload for the same approved source/channel/idempotent intent.
- Index `(narrial_user_id, status, created_at DESC)`, `(connection_id, status, created_at DESC)`, `(video_source_id)`, and `(status, next_attempt_at)`.
- Add a partial unique index on non-null `youtube_video_id` only after final ownership policy approval.

## 16. `youtube_upload_sessions`

Stores one encrypted resumable-upload session per upload: `upload_id` primary/foreign key, `session_ciphertext`, `initialization_vector`, optional `authentication_tag`, `key_version`, `last_confirmed_byte`, optional `expires_at`, and timestamps.

The confirmed byte count is non-negative. Session URLs never appear in logs, public responses, audit metadata, or job payloads. The row is removed after terminal completion and the approved recovery period.

## 17. `youtube_publications`

Required fields: `id`, `narrial_user_id`, `connection_id`, unique `upload_id`, optional `youtube_video_id`, validated `title`, `description`, bounded `tags` JSON array, optional `category_id`, `privacy_status`, optional `is_made_for_kids`, optional `contains_synthetic_media`, `status`, optional `published_at`, `last_provider_status`, `failure_category`, timestamps, and `version`.

Rules:

- Connection, upload, and publication owners match.
- Title is non-empty; metadata follows approved YouTube limits.
- `published_at` is required for `PUBLISHED`.
- Metadata never contains tokens, secrets, local paths, or signed storage URLs.
- Index `(narrial_user_id, status, created_at DESC)`, `(connection_id, status, updated_at DESC)`, `(youtube_video_id)`, and `(published_at DESC)`.

## 18. `youtube_scheduled_publications`

Required fields: `id`, `narrial_user_id`, `connection_id`, `publication_id`, `scheduled_at_utc`, valid IANA `display_timezone`, `status`, `attempt_count`, optional `next_attempt_at`, complete worker lease fields (`claimed_at`, `claim_owner`, `claim_expires_at`), optional `executed_at`, `cancelled_at`, `failure_category`, timestamps, and `version`.

Rules:

- Ownership must match across schedule, publication, and connection.
- One non-terminal schedule per publication.
- Complete or null worker leases; atomic claim with locking/conditional update.
- `executed_at` is required for completed schedules and `cancelled_at` for cancelled schedules.
- Schedule changes use optimistic concurrency.
- Index `(status, scheduled_at_utc)`, `(status, next_attempt_at)`, `(claim_expires_at)`, `(narrial_user_id, status, scheduled_at_utc)`, and `(connection_id, status, scheduled_at_utc)`.

## 19. `youtube_video_sync_records`

Required fields: `id`, `narrial_user_id`, unique `publication_id`, `youtube_video_id`, `status`, bounded optional `last_observed_state`, optional `last_attempt_at`, `last_success_at`, `next_sync_at`, non-negative `consecutive_failure_count`, optional `failure_category`, timestamps, and `version`.

Provider snapshots exclude tokens and unnecessary personal data. Successful sync resets failure count. Index `(status, next_sync_at)`, `(narrial_user_id, updated_at DESC)`, `(youtube_video_id)`, and `(consecutive_failure_count, next_sync_at)`.

## 20. Reliability and Operational Tables

### `youtube_idempotency_records`

Fields: `id`, owner, operation type, hashed idempotency key, request hash, status, resource type/ID, allowlisted safe response snapshot, expiry, and timestamps.

Unique `(narrial_user_id, operation_type, idempotency_key_hash)`. Claim atomically. Reusing a key with another request hash fails. Retention exceeds every API, queue, worker, and dead-letter retry route.

### `youtube_jobs`

Fields: ID, job/aggregate type and ID, owner, status, run time, attempt/max-attempt counts, lease fields, payload version, secret-free safe payload, failure category, timestamps, and completion time.

Index `(status, run_at)`, `(claim_expires_at)`, `(aggregate_type, aggregate_id)`, and `(narrial_user_id, status)`.

### `youtube_outbox_events`

Fields: ID, event/aggregate type and ID, owner, payload version, safe payload, status, availability, attempts, lease fields, publication time, failure category, and timestamps.

Aggregate change and outbox insert occur in one transaction. Dispatch is at least once and consumers are idempotent. Payloads never contain credentials, OAuth values, upload-session URLs, or signed storage URLs.

### `youtube_status_events`

Append-only fields: ID, owner, aggregate type/ID, from/to status, reason, source, request/job IDs, bounded safe metadata, and occurrence time. It is written in the same transaction as the transition where possible.

### `youtube_audit_events`

Append-only fields: ID, owner, actor type/opaque ID, event type, target type/ID, outcome, request ID, safe metadata, and occurrence time.

Audit OAuth, connection, permission, refresh, key rotation, disconnect, upload, publication, schedule, authorization failure, and deletion events without tokens or sensitive provider responses.

## 21. Cross-Table Integrity

1. All user access matches authenticated ownership.
2. Connection, source, upload, publication, and schedule owners agree.
3. Uploads cannot start on disconnected or reauthorization-required connections.
4. Uploads require available, validated sources.
5. Publications require a successful upload and remote video identifier before readiness.
6. Schedules cannot execute for disconnected channels.
7. Terminal work cannot be claimed again.
8. Disconnected connections cannot retain usable credentials.
9. OAuth state and idempotency keys are consumed/claimed once.
10. Aggregate mutations and outbox records commit atomically.
11. Worker leases expire so abandoned work can be reclaimed safely.
12. Status transitions follow Document 08.

Rules not expressible as constraints must be enforced transactionally and verified by integration tests.

## 22. Transaction Boundaries

OAuth completion atomically consumes the transaction, upserts connection metadata, replaces encrypted credentials and scopes, appends status/audit events, and creates outbox work after external token exchange has succeeded.

Disconnection atomically marks the connection, removes usable credentials, stops/cancels approved pending work, and records events. Unknown Google revocation outcomes require reconciliation.

Upload creation atomically claims idempotency, validates ownership, creates the upload and work records, appends status, and associates the response with the idempotency record.

Schedule creation/update atomically validates ownership/readiness, enforces one active schedule and concurrency, updates durable work, and records status/audit evidence.

## 23. Retention and Deletion

| Category | Rule |
|---|---|
| OAuth state/code | Never stored raw |
| OAuth transaction | Delete after expiry plus approved diagnostic window |
| Active credentials | Retain only while authorized |
| Disconnected credentials | Immediately delete or cryptographically destroy |
| Upload session | Delete after terminal status plus approved recovery window |
| Source metadata/video bytes | Retain only under approved product/storage lifecycle |
| Upload/publication/schedule history | Retain for approved user/support window |
| Sync snapshots | Retain only necessary allowlisted state |
| Idempotency | Retain longer than maximum redelivery path |
| Jobs/outbox | Purge after approved operational window |
| Status/audit events | Retain under approved product, security, and privacy policy |

Exact durations remain blocked by Documents 06, 10, and 13.

A user-deletion workflow must verify ownership, revoke access where possible, destroy credentials first, cancel work, delete storage objects, delete/anonymize history, and retain only explicitly required audit evidence.

## 24. Decision Register

| ID | Decision | Recommendation | Status |
|---|---|---|---|
| YT-DB-DEC-001 | Database | PostgreSQL | Approved for disposable local B04 development only: PostgreSQL 18.6 on `127.0.0.1`, 2026-08-27; hosted environments remain gated |
| YT-DB-DEC-002 | ORM | Prisma | Verified for local B04: Prisma/Client/adapter 7.9.1 with `pg` 8.23.0 under the approved repository-controlled CLI exception through 2026-09-26/next patched stable release; staging/production remain gated |
| YT-DB-DEC-003 | IDs | Application UUIDs | Requires approval |
| YT-DB-DEC-004 | Host/region | Follow Document 10 | Approved for loopback-only local development; hosted provider/region remains blocked |
| YT-DB-DEC-005 | Maximum channels per user | Do not constrain until product approval | Requires approval |
| YT-DB-DEC-006 | Same channel across users | No global uniqueness yet | Requires approval |
| YT-DB-DEC-007 | Final statuses | Reconcile with Document 08 | Blocked |
| YT-DB-DEC-008 | PKCE storage | Finalize with OAuth/security design | Requires approval |
| YT-DB-DEC-009 | Encryption envelope | Finalize in Document 13 | Blocked |
| YT-DB-DEC-010 | Job system | Select through architecture | Blocked |
| YT-DB-DEC-011 | Object storage | Select through infrastructure | Blocked |
| YT-DB-DEC-012 | Retention durations | Approve through quality/privacy requirements | Synthetic/disposable local B04 data approved for deletion on demand; all durable durations remain blocked |
| YT-DB-DEC-013 | Audit retention/anonymization | Approve security/privacy policy | Blocked |
| YT-DB-DEC-014 | Backup RPO/RTO | Approve with hosting | Blocked |
| YT-DB-DEC-015 | Database row-level security | Evaluate after auth/hosting approval | Requires approval |
| YT-DB-DEC-016 | Synthetic-media field | Confirm against approved YouTube workflow | Requires approval |

## 25. Migration Strategy

Migrations are version-controlled, reviewed, tested on clean and upgraded databases, and accompanied by rollback or forward-fix plans. Existing-data changes use expand–migrate–contract. Destructive changes require separate approval. Secrets and real user/provider data never enter migrations or seeds.

| Migration | Purpose | Earliest execution |
|---|---|---|
| `0001_youtube_connection_foundation` | Connections, credentials, scopes, OAuth and audit/status events | After Documents 06–13 and installation gate approval |
| `0002_youtube_video_sources_and_uploads` | Sources, uploads, encrypted resumable sessions | Before upload implementation |
| `0003_youtube_publications_and_schedules` | Publications and scheduling | Before publishing/scheduler implementation |
| `0004_youtube_reliability_infrastructure` | Idempotency, jobs, outbox, worker leases | Before retryable background work |
| `0005_youtube_status_synchronization` | Video synchronization and indexes | Before status synchronization |

## 26. Database Creation Gate

**Status: BLOCKED.**

Local/development creation requires:

- [ ] Documents 06–10 finalized where they control persistence.
- [x] Document 12 approved as a documentation baseline.
- [ ] PostgreSQL and Prisma implementation choices approved.
- [ ] Document 09 authorizes exact dependency versions.
- [ ] Document 10 approves environment, host, region, credentials, and owners.
- [ ] Document 13 approves encryption boundaries.
- [ ] Authentication ownership is final.
- [ ] Database credentials have approved secret storage.
- [ ] Backup expectations are defined.
- [ ] Baseline migration SQL is reviewed.
- [ ] Explicit implementation authorization is given.

After the gate opens: install approved packages, add validated configuration, create only isolated local/development resources explicitly authorized, generate and review migration SQL, apply to an empty local database, run integration tests, recreate from zero, and record evidence. Staging and production are excluded.

## 27. Dependency Installation Gate

This approval does not authorize package installation. After Document 09 and implementation approval, exact approved versions may include Prisma CLI, Prisma Client, and a required PostgreSQL adapter. Update manifest and lockfile together; verify compatibility, licensing, vulnerabilities, type-checking, tests, and build.

## 28. Seed and Fixture Policy

Local/test data may use synthetic users/channels, undecryptable fake credential bytes, fake video metadata, deterministic timestamps/statuses, and secret-free jobs. Never seed real tokens, OAuth values, upload-session URLs, user video content, production channel data, production snapshots, or secrets.

## 29. Backup and Restore Requirements

Before staging or production, define backup frequency/retention, point-in-time recovery, encryption, region/residency, owners, restore authorization/testing, RPO/RTO, and key-recovery dependencies. Database backups and encryption keys remain separated, while historical key versions required for recovery are governed together with restore procedures.

## 30. Repository Requirements

Create YouTube-specific repositories for connections, OAuth transactions, credentials, sources, uploads, publications, schedules, synchronization, idempotency, jobs/outbox, status, and audit.

Repositories require authenticated ownership, parameterized ORM operations, transaction support, stable domain error mapping, and safe models. Normal queries never eager-load credentials, and decrypted credentials remain inside the approved token service.

## 31. Error Handling

Use stable internal categories: `DATABASE_UNAVAILABLE`, `DATABASE_TIMEOUT`, `DATABASE_CONFLICT`, `DATABASE_CONSTRAINT_VIOLATION`, `DATABASE_CONCURRENCY_CONFLICT`, `DATABASE_MIGRATION_REQUIRED`, `DATABASE_DATA_INTEGRITY_ERROR`, and `DATABASE_UNKNOWN_ERROR`.

Never expose SQL, connection strings, internal hostnames, stack traces, ciphertext, or sensitive request data. Retry transient failures only; validation and constraint failures are not blindly retried.

## 32. Testing and Verification

Schema tests verify keys, relations, constraints, defaults, indexes, and migrations. Repository tests verify ownership isolation, duplicate channels, atomic OAuth consumption, replay/expiry, credential replacement/deletion, idempotency races, payload mismatch, concurrency, worker claims, lease recovery, schedule uniqueness, rollback, and safe projections.

Migration tests prove zero-to-latest creation, earlier-to-latest upgrade, data survival, index existence, failure handling, generated-client alignment, type-checking, tests, and build.

Security tests confirm no raw tokens/state/codes/session URLs, no cross-user access, no sensitive logs/errors, and removal of usable credentials after disconnection.

## 33. Observability

Monitor pool usage, query latency, transaction failures, migration state, deadlocks, worker latency, backlog, retries, cleanup, lease recovery, refresh failures, storage cleanup, and backup/restore tests. Never use tokens, OAuth values, titles, descriptions, session URLs, or high-cardinality raw identifiers as metric labels.

## 34. Acceptance Criteria

- [x] YouTube-only scope and table responsibilities are defined.
- [x] User ownership and credential separation are defined.
- [x] OAuth single-use/expiry and upload/publication/schedule/sync relations are defined.
- [x] Encrypted upload sessions, idempotency, jobs, leases, events, and concurrency are defined.
- [x] Retention categories and migration order are defined.
- [x] Unresolved decisions remain visibly blocked.
- [x] No dependency, database, or migration action was performed.
- [x] No secrets appear in this document.
- [ ] Prerequisite architecture, stack, environment, retention, and security decisions are finalized.
- [ ] Explicit database implementation authorization is granted.

## 35. Approval Record

- [x] User approved adding this documentation baseline on 2026-08-26.
- [x] The file was added only under `docs/youtube-connection/`.
- [x] Approval did not authorize implementation or infrastructure changes.
- [ ] Database creation gate is open.

## 36. Prerequisites

- `06-nonfunctional-requirements-and-quality-attributes.md`
- `07-system-architecture-and-service-boundaries.md`
- `08-domain-model-state-machines-and-api-contracts.md`
- `09-technology-stack-dependencies-and-installation-order.md`
- `10-environments-hosting-urls-and-secret-ownership.md`

Prompt-only or unapproved prerequisites keep their dependent database decisions provisional.

## 37. Next Document

Proceed to `13-security-model-token-encryption-and-threat-controls.md`. It must finalize credential-envelope format, algorithm requirements, key ownership/versioning, token decryption boundaries, refresh-token replacement, rotation, cryptographic deletion, backups, and operational-access threats.

Database creation remains blocked until every condition in Section 26 is satisfied.

## 38. Change Log

| Version | Date | Change | Approval |
|---|---|---|---|
| 0.1.0 | 2026-08-26 | Initial draft generated for review | Superseded by approved baseline |
| 1.0.0 | 2026-08-26 | Approved documentation baseline added; implementation and database creation remain blocked | User approved |
| 1.0.1 | 2026-08-27 | Recorded B04 local-only PostgreSQL/Prisma, host, and disposable-retention decisions plus first-migration implementation status; hosted environments and the Prisma CLI advisory remain gated | User approved the exact B04 proposal and completion only |
| 1.0.2 | 2026-08-27 | Recorded the approved B04-only Prisma CLI advisory exception and final local verification status | User/security approver accepted the time-bounded local-tooling exception; hosted environments remain gated |
