# YouTube Connection Module — Backend API Endpoints and Error Contract

## Document Control

| Field | Value |
|---|---|
| Document number | 15 |
| Filename | `15-backend-api-endpoints-and-error-contract.md` |
| Module | YouTube Connection |
| Stage | Stage 6 — Backend contract implementation |
| Status | Approved documentation baseline — route implementation not authorized |
| Version | 1.0.0 |
| Last updated | 2026-08-26 |
| Prerequisites | Documents 08 and 12–14 |
| Next document | `16-oauth-connection-callback-and-token-lifecycle.md` |
| Source-of-truth role | Defines the public backend API contract for the YouTube Connection module |
| Route implementation authorization | None |
| External Google calls authorized | No |

## 1. Purpose

This document specifies public endpoints for YouTube authorization, connections, channel verification, video sources, uploads, publications, schedules, retries, synchronization, status history, and disconnection. It defines authentication, ownership, validation, idempotency, concurrency, responses, statuses, errors, and security behavior.

It does not register routes, install libraries, change Fastify, create records, call Google, or implement workers.

## 2. YouTube-Only Boundary

Canonical proposed base path:

```text
/api/v1/youtube
```

Do not add `/social` routes, provider parameters, multi-platform unions, unrelated platform resources, generic credential routes, or credential-bearing responses.

## 3. Readiness

Document 08 remains prompt-only, so final status values are provisional. Documents 12–14 are approved documentation baselines, but their database, security, and backend foundation gates remain closed. Route work starts only after those gates, authentication, validation approach, and the relevant implementation slice are approved.

## 4. API Principles

1. Paths use nouns/subresources and fields use `camelCase`.
2. Status values use `UPPER_SNAKE_CASE`.
3. Database and Google objects never cross the public boundary.
4. Validate inputs at HTTP boundaries and provider data at provider boundaries.
5. Every user resource is owner-scoped.
6. Long operations return `202` and a status resource.
7. Retryable mutations honor `Idempotency-Key`.
8. Collection endpoints use stable cursor pagination.
9. Unknown request fields are rejected.
10. Errors use one safe envelope.
11. Tokens, codes, raw state, ciphertext, upload-session URLs, and provider bodies never appear publicly.

## 5. Authentication and Ownership

Every endpoint requires a verified Narrial session except `GET /api/v1/youtube/oauth/callback`, which is authorized by its protected single-use OAuth transaction.

User identity comes only from verified server context. Request bodies never accept `userId`. Queries should match both resource ID and authenticated owner. Cross-user resource identifiers normally return `404` to prevent enumeration.

## 6. Headers and Idempotency

| Header | Rule |
|---|---|
| `Authorization` | Required on authenticated routes |
| `Content-Type` | `application/json` for JSON bodies |
| `Accept` | Prefer `application/json` |
| `Idempotency-Key` | Required on designated mutations |
| `If-Match` | Proposed optimistic-concurrency version for updates |
| `X-Request-Id` | Optional bounded value; otherwise server generated |

Proposed idempotency-key length is 16–128 characters with letters, digits, `.`, `_`, and `-`. Store only its digest. A reused key with a different normalized body returns `422`; an in-progress duplicate returns the approved conflict/status result; a completed duplicate replays its original safe response.

## 7. Response Envelopes

Single resource:

```json
{"data":{"id":"resource-id"},"requestId":"request-id"}
```

Collection:

```json
{"data":[],"pagination":{"nextCursor":null,"hasMore":false},"requestId":"request-id"}
```

Asynchronous operation:

```json
{"data":{"resourceId":"resource-id","status":"QUEUED","statusUrl":"/api/v1/youtube/uploads/resource-id"},"requestId":"request-id"}
```

## 8. Error Envelope

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request could not be processed.",
    "details": [],
    "recoveryAction": null,
    "isRetryable": false
  },
  "requestId": "request-id"
}
```

Codes and meanings are stable. Details are allowlisted and never echo sensitive values. Provider bodies, stack traces, SQL, internal hosts, credentials, ciphertext, and OAuth values are prohibited.

## 9. HTTP Statuses

- `200`: successful read/update/verification or completed idempotent replay.
- `201`: synchronously created resource.
- `202`: accepted long-running work.
- `204`: successful idempotent deletion without body.
- `303`: proposed safe OAuth return redirect.
- `400`: malformed protocol/request.
- `401`: missing/invalid authentication.
- `403`: authenticated but forbidden where existence may be disclosed.
- `404`: absent or invisible resource.
- `409`: state/concurrency/in-progress conflict.
- `410`: expired/consumed OAuth transaction where safe.
- `413`: size limit.
- `415`: unsupported media type.
- `422`: semantic validation or idempotency-payload mismatch.
- `429`: rate/quota control.
- `500`: safe unexpected failure.
- `502`, `503`, `504`: provider invalidity, outage, or timeout.

## 10. Safe Public Models

`YouTubeConnection` contains internal ID, safe channel identity/display metadata, connection/credential/permission status, approved scopes, verification/reconnection/disconnection timestamps, creation/update timestamps, and version—never credential material.

`YouTubeUpload` contains IDs, optional YouTube video ID, status, byte progress, attempt count, safe failure, timestamps, and version—never resumable URL.

`YouTubePublication` contains IDs, safe metadata, privacy/audience declarations, status, publication time, safe failure, timestamps, and version.

`YouTubeSchedule` contains IDs, UTC schedule time, display timezone, status, attempt count, execution/cancellation times, safe failure, timestamps, and version.

Safe failures contain stable code/message, retryability, and optional retry time, never raw provider text.

## 11. OAuth and Connection Endpoints

### Start authorization

`POST /oauth/authorizations` — authenticated; idempotency required. Accepts only allowlisted `returnDestination`. Clients cannot submit callbacks, scopes, user IDs, or channel IDs. Returns `201` with authorization ID, Google URL, and expiry. The URL must be redacted from logs.

### Google callback

`GET /oauth/callback` — validates bounded Google `state` and either `code` or `error`; atomically consumes state; never stores/logs code/state; never auto-retries code exchange; validates token/channel responses; transactionally stores connection/encrypted credentials/scopes; and redirects only to the stored allowlisted destination. The redirect contains only safe result category/correlation data. Client refetch is authoritative.

### Connections

- `GET /connections` — owner-scoped cursor-paginated list; optional approved status filter.
- `GET /connections/:connectionId` — safe connection details.
- `GET /connections/:connectionId/channel` — persisted safe channel/permission state; no live call by default.
- `POST /connections/:connectionId/verifications` — idempotent live identity/scope verification; returns `200` or `202`; ownership precedes decryption.
- `POST /connections/:connectionId/reauthorizations` — idempotent new authorization transaction; never reactivates old ciphertext or silently replaces a mismatched channel.
- `DELETE /connections/:connectionId` — proposed idempotent `204`; blocks work, attempts revocation, destroys credentials, removes scopes, preserves approved history, audits, and reconciles unknown outcomes.

## 12. Video Source Endpoints

- `POST /video-sources` — authenticated/idempotent. Accepts validated filename, MIME type, positive byte size, and SHA-256 checksum. Returns safe source metadata and an approved short-lived storage instruction when applicable. Object keys are server-generated; extension/MIME declarations alone are untrusted.
- `POST /video-sources/:videoSourceId/completions` — authenticated/idempotent. Server verifies object existence, size, checksum, and media rules; returns `200` or async `202`. Client claims cannot mark a source available.
- `GET /video-sources/:videoSourceId` — owner-scoped safe metadata/status; no permanent paths or credentials.

Proxying large binary video through Fastify requires a separate decision; object-storage transfer is proposed.

## 13. Upload Endpoints

- `POST /uploads` — authenticated/idempotent; accepts `connectionId` and `videoSourceId`; validates shared ownership, usable permissions, source readiness, and active-intent conflicts; returns `202` with upload status.
- `GET /uploads` — owner-scoped list with optional connection/status/date filters and cursor pagination.
- `GET /uploads/:uploadId` — status, safe progress/failure, and optional safe `Retry-After`; never returns session URL.
- `POST /uploads/:uploadId/cancellations` — authenticated/idempotent; `202` for cleanup, `200` if already cancelled, `409` if irreversible.
- `POST /uploads/:uploadId/retry-attempts` — authenticated/idempotent; only retryable state, no duplicate confirmed upload, reconcile unknown outcomes first, enforce retry limits/backoff; returns `202`.

## 14. Publication Endpoints

- `POST /publications` — authenticated/idempotent. Accepts connection/upload IDs, title, description, bounded tags, category, privacy, made-for-kids, and approved synthetic-media declaration. Validates ownership, upload readiness, metadata limits, enum values, and required declarations. Returns `201`; creation alone does not publish.
- `GET /publications` — owner-scoped filtered cursor list.
- `GET /publications/:publicationId` — safe metadata, status, schedule summary, sync time, and failure.
- `PATCH /publications/:publicationId` — authenticated with approved concurrency condition; partial allowlisted metadata edits only in legal states. Omission differs from explicit null. Stale version returns `409`.
- `POST /publications/:publicationId/publish-attempts` — authenticated/idempotent; validates readiness, permissions, declarations, schedule conflicts, and already-published state; returns `202`; unknown outcomes synchronize before retry.
- `POST /publications/:publicationId/retry-attempts` — authenticated/idempotent and retryable states only; returns `202`.

## 15. Schedule Endpoints

- `POST /publications/:publicationId/schedules` — authenticated/idempotent. Accepts explicit-offset/UTC `scheduledAt`, valid IANA `displayTimezone`, and expected publication version. Validates lead time/horizon, readiness, one active schedule, connection, and permissions. Returns `201`.
- `GET /schedules/:scheduleId` — safe owner-scoped schedule/status.
- `PATCH /schedules/:scheduleId` — authenticated/concurrency-protected; updates time/timezone only while legally editable. Claimed or stale state returns `409`.
- `DELETE /schedules/:scheduleId` — idempotent cancellation; atomically prevents future claims; `409` if irreversible.
- `POST /schedules/:scheduleId/retry-attempts` — authenticated/idempotent and retryable state only; prevents duplicate publication; returns `202`.

Lead time and maximum scheduling horizon require approval.

## 16. Synchronization and Status

- `POST /publications/:publicationId/synchronizations` — authenticated/idempotent, quota-limited request for provider refresh; returns `202`; client cannot submit desired provider state.
- `GET /publications/:publicationId/synchronization` — normalized sync status, last success, next sync, failure count, and safe failure; no raw provider state.
- Explicit `GET /connections/:id/status-events`, `/uploads/:id/status-events`, `/publications/:id/status-events`, and `/schedules/:id/status-events` routes are preferred over a generic resource-type path. They return paginated safe user-visible transitions, not internal audits, worker identities, or provider data.

## 17. Retry Contract

Retry requires ownership, explicitly retryable state, remaining limit, current permissions/source, no equivalent active operation, resolved provider outcome, and matching idempotency intent. It creates an attempt without deleting failure history.

## 18. Pagination

Use opaque `cursor` and proposed default `limit=20`, maximum `100`. Stable ordering includes an ID tie-breaker. Cursors contain no plaintext user data/secrets and are server-validated or integrity-protected. Invalid/expired cursors return `INVALID_CURSOR`. Mutable operational lists do not use offsets.

## 19. Concurrency

Use one mechanism consistently. Proposed: `If-Match: "<version>"` for publication/schedule updates. Stale versions return `409 CONCURRENCY_CONFLICT` with `REFETCH_RESOURCE`. Do not mix header- and body-based versions without an approved exception.

## 20. Idempotency Matrix

Required for authorization, verification, reauthorization, source create/complete, upload create/cancel/retry, publication create/publish/retry, schedule create/update/retry, and synchronization. Disconnect requires it if external revocation is coupled. Idempotent HTTP deletion may omit it under the final contract. GET never requires it.

## 21. Stable Errors

Authentication/authorization: `AUTHENTICATION_REQUIRED`, `AUTHENTICATION_INVALID`, `FORBIDDEN`, `RESOURCE_NOT_FOUND`.

Validation: `VALIDATION_ERROR`, `MALFORMED_JSON`, `UNSUPPORTED_MEDIA_TYPE`, `REQUEST_TOO_LARGE`, `INVALID_CURSOR`, `INVALID_RETURN_DESTINATION`, `INVALID_TIMEZONE`, `INVALID_SCHEDULE_TIME`, `UNKNOWN_FIELD`.

Idempotency/concurrency: `IDEMPOTENCY_KEY_REQUIRED`, `IDEMPOTENCY_KEY_INVALID`, `IDEMPOTENCY_KEY_REUSED`, `IDEMPOTENT_REQUEST_IN_PROGRESS`, `CONCURRENCY_CONFLICT`, `ACTIVE_OPERATION_CONFLICT`.

OAuth: `OAUTH_TRANSACTION_INVALID`, `OAUTH_TRANSACTION_EXPIRED`, `OAUTH_TRANSACTION_ALREADY_USED`, `OAUTH_ACCESS_DENIED`, `OAUTH_CODE_EXCHANGE_FAILED`, `OAUTH_CHANNEL_MISMATCH`, `OAUTH_CONFIGURATION_UNAVAILABLE`.

Connection: `YOUTUBE_CONNECTION_NOT_FOUND`, `YOUTUBE_CONNECTION_LIMIT_REACHED`, `YOUTUBE_CONNECTION_DISCONNECTED`, `YOUTUBE_REAUTHORIZATION_REQUIRED`, `YOUTUBE_PERMISSION_REQUIRED`, `YOUTUBE_CHANNEL_UNAVAILABLE`, `YOUTUBE_CHANNEL_ALREADY_CONNECTED`.

Source/upload: `VIDEO_SOURCE_NOT_FOUND`, `VIDEO_SOURCE_NOT_READY`, `VIDEO_SOURCE_INVALID`, `VIDEO_SOURCE_DELETED`, `VIDEO_TOO_LARGE`, `VIDEO_TYPE_UNSUPPORTED`, `VIDEO_CHECKSUM_MISMATCH`, `YOUTUBE_UPLOAD_NOT_FOUND`, `YOUTUBE_UPLOAD_NOT_CANCELLABLE`, `YOUTUBE_UPLOAD_NOT_RETRYABLE`, `YOUTUBE_UPLOAD_OUTCOME_UNKNOWN`.

Publication/schedule: `YOUTUBE_PUBLICATION_NOT_FOUND`, `YOUTUBE_PUBLICATION_NOT_EDITABLE`, `YOUTUBE_PUBLICATION_NOT_READY`, `YOUTUBE_PUBLICATION_ALREADY_PUBLISHED`, `YOUTUBE_PUBLICATION_NOT_RETRYABLE`, `YOUTUBE_SCHEDULE_NOT_FOUND`, `YOUTUBE_SCHEDULE_ALREADY_EXISTS`, `YOUTUBE_SCHEDULE_NOT_EDITABLE`, `YOUTUBE_SCHEDULE_ALREADY_CLAIMED`, `YOUTUBE_SCHEDULE_NOT_RETRYABLE`.

Provider/infrastructure: `CREDENTIAL_UNAVAILABLE`, `CREDENTIAL_INTEGRITY_FAILURE`, `YOUTUBE_PROVIDER_REJECTED_REQUEST`, `YOUTUBE_PROVIDER_TEMPORARILY_UNAVAILABLE`, `YOUTUBE_PROVIDER_TIMEOUT`, `YOUTUBE_QUOTA_EXCEEDED`, `DATABASE_UNAVAILABLE`, `STORAGE_UNAVAILABLE`, `JOB_SYSTEM_UNAVAILABLE`, `RATE_LIMITED`, `INTERNAL_ERROR`.

Codes are additive; removals or meaning changes require compatibility review.

## 22. Provider Error Mapping

Invalid/revoked grants map to reauthorization; missing scopes to permission required; quota/rate limits to quota/rate codes; provider 5xx to temporary unavailability; confirmed-no-effect timeout may be retried; unknown-effect timeout enters reconciliation; invalid provider data triggers a safe provider/internal error and alert; permanent video rejection maps to a safe operation failure. Raw Google reason strings are not public contracts.

## 23. Validation

Every route specifies path/query/body allowlists, unknown-field rejection, trimmed string limits, array limits, timestamps, numeric ranges, enums, URL/content-type/size rules, cross-field rules, ownership, legal states, idempotency, and concurrency. Exact YouTube metadata, file, category, and schedule limits must come from approved authoritative-source documentation rather than being invented here.

## 24. Loading and Polling

Long-running resources expose status, safe progress, updated time, retryability, recovery action, and status URL. Clients use bounded-backoff polling and stop on terminal states. The backend may return `Retry-After`. Missing updates do not prove failure. WebSockets/SSE are deferred unless approved.

## 25. Security and Audit

Authenticate before lookup, authorize before decryption, validate all boundaries, fix external hosts in configuration, apply rate limits, exact CORS, HTTPS, safe redirects, and redaction. Audit OAuth, connection, source, upload, publication, schedule, synchronization, retry, ownership failures, and security-relevant rate limits using allowlisted secret-free metadata.

## 26. Contract Tests

For each route test valid schemas, missing/invalid auth, cross-user access, malformed/missing/unknown/boundary inputs, invalid state, idempotency reuse/body mismatch/in-progress behavior, concurrency, provider failures, safe errors, request IDs, rollback, and credential leakage. Callback tests add denial, state replay/expiry, malformed code, mismatch, provider validation, safe return, and absence of code/state in artifacts.

## 27. Implementation Order

1. Restore Fastify foundation health.
2. Add shared response/error schemas.
3. Add authentication/ownership helpers.
4. Add connection reads against fakes.
5. Add OAuth contracts/use cases with fake provider.
6. Add verify, reconnect, and disconnect.
7. Add video-source contracts.
8. Add upload routes.
9. Add publication routes.
10. Add schedule routes.
11. Add synchronization/status history.
12. Pass contract/security suite.
13. Connect approved database/provider implementations.
14. Perform staging only after authorization.

Each step keeps tests, typecheck, lint, and build passing.

## 28. Decisions Requiring Approval

| ID | Decision | Recommendation | Status |
|---|---|---|---|
| YT-API-DEC-001 | Base path | `/api/v1/youtube` | Requires approval |
| YT-API-DEC-002 | Callback redirect | `303 See Other` | Requires approval |
| YT-API-DEC-003 | Pagination | Cursor, default 20/max 100 | Requires approval |
| YT-API-DEC-004 | Concurrency | Consistent `If-Match` | Requires approval |
| YT-API-DEC-005 | In-progress duplicate | `409` plus status URL | Requires approval |
| YT-API-DEC-006 | Disconnect | Idempotent `204` | Requires approval |
| YT-API-DEC-007 | Video transfer | Object storage rather than API proxy | Requires approval |
| YT-API-DEC-008 | Source validation | Async when inspection is long | Requires approval |
| YT-API-DEC-009 | Retry design | Explicit `retry-attempts` resources | Requires approval |
| YT-API-DEC-010 | Status history | Explicit per-resource routes | Requires approval |
| YT-API-DEC-011 | Schedule lead/horizon | Finalize in business rules | Blocked |
| YT-API-DEC-012 | YouTube limits | Confirm from authoritative source | Blocked |
| YT-API-DEC-013 | Realtime updates | Defer; polling baseline | Requires approval |

## 29. Route Summary

| Method | Relative path | Purpose |
|---|---|---|
| POST | `/oauth/authorizations` | Start OAuth |
| GET | `/oauth/callback` | Complete callback |
| GET | `/connections` | List connections |
| GET | `/connections/:connectionId` | Get connection |
| GET | `/connections/:connectionId/channel` | Get channel state |
| POST | `/connections/:connectionId/verifications` | Verify channel/scopes |
| POST | `/connections/:connectionId/reauthorizations` | Reconnect |
| DELETE | `/connections/:connectionId` | Disconnect |
| POST | `/video-sources` | Create source |
| POST | `/video-sources/:videoSourceId/completions` | Complete/validate transfer |
| GET | `/video-sources/:videoSourceId` | Get source |
| POST/GET | `/uploads` | Create/list uploads |
| GET | `/uploads/:uploadId` | Get progress |
| POST | `/uploads/:uploadId/cancellations` | Cancel upload |
| POST | `/uploads/:uploadId/retry-attempts` | Retry upload |
| POST/GET | `/publications` | Create/list publications |
| GET/PATCH | `/publications/:publicationId` | Get/edit publication |
| POST | `/publications/:publicationId/publish-attempts` | Publish now |
| POST | `/publications/:publicationId/retry-attempts` | Retry publish |
| POST | `/publications/:publicationId/schedules` | Create schedule |
| GET/PATCH/DELETE | `/schedules/:scheduleId` | Get/update/cancel schedule |
| POST | `/schedules/:scheduleId/retry-attempts` | Retry schedule |
| POST | `/publications/:publicationId/synchronizations` | Request sync |
| GET | `/publications/:publicationId/synchronization` | Get sync state |
| GET | Explicit `/:resourceId/status-events` routes | Safe history |

## 30. Acceptance Criteria

- [x] Every required YouTube operation has a proposed endpoint.
- [x] Authentication, ownership, callback protection, validation, responses, statuses, and errors are defined.
- [x] Long operations use status resources; mutations define idempotency/concurrency.
- [x] Collections paginate stably.
- [x] Provider/database/credential data cannot leak publicly.
- [x] Upload, publication, schedule, sync, retry, and disconnect are covered.
- [x] Contract/security tests and incremental route order are defined.
- [x] YouTube-only scope is enforced.
- [x] Document 14 now references the exact filename.
- [x] No route or implementation code was created.
- [ ] Route implementation gate is open.

## 31. Approval Record

- [x] User approved adding this documentation baseline on 2026-08-26.
- [x] User approved the exact filename and corresponding Document 14 reference correction.
- [x] Approval does not authorize routes, packages, database work, or Google calls.
- [ ] API implementation gate is open.

## 32. Prerequisites

- `08-domain-model-state-machines-and-api-contracts.md`
- `12-database-design-collections-relations-and-migrations.md`
- `13-security-model-token-encryption-and-threat-controls.md`
- `14-backend-foundation-and-implementation-structure.md`

Document 08 remains prompt-only, so dependent state names remain provisional.

## 33. Next Document

Proceed to `16-oauth-connection-callback-and-token-lifecycle.md`, which must define browser launch, callback, token exchange, channel retrieval, encrypted persistence, safe client return, reconnection, revocation, disconnection, and recovery using these endpoints.

Routes remain blocked until the Document 14 foundation gate and this contract's prerequisites are satisfied.

## 34. Change Log

| Version | Date | Change | Approval |
|---|---|---|---|
| 0.1.0 | 2026-08-26 | Initial complete contract draft | Superseded by approved baseline |
| 1.0.0 | 2026-08-26 | Approved baseline added; Document 14 reference corrected | User approved |
