# YouTube Connection Module — Video Source Validation and Upload Workflow

## Document Control

| Field | Value |
|---|---|
| Document number | 19 |
| Filename | `19-video-source-validation-and-upload-workflow.md` |
| Module | YouTube Connection only |
| Stage | Stage 9 — Video upload implementation |
| Status | Approved documentation baseline — implementation not authorized |
| Version | 1.0.0 |
| Date | 2026-08-26 |
| Purpose | Define video ownership, validation, resumable YouTube transfer, progress, cancellation, retry, and recovery |
| Earlier dependencies | Documents 05–08 and 12–17 |
| Operational prerequisite | A securely selectable, backend-verified YouTube connection |
| Next document | `20-immediate-publishing-and-youtube-metadata.md` |

## 1. Purpose

This document defines the production contract from selecting or referencing a video through obtaining a confirmed YouTube video ID. It separates source ingestion, source validation, upload intent, byte transfer, YouTube processing, and publication so that each stage is secure, observable, restartable, and testable.

This is a specification. It does not install packages, create storage, add database migrations, implement endpoints, upload a file, or change Google Cloud configuration.

## 2. Scope Boundary

Included:

- User and tenant ownership of every source and upload.
- Device-selected and already-generated video source references.
- File size, declared type, detected type, readability, checksum, and metadata validation.
- Durable source records and upload intents.
- Backend-controlled YouTube resumable sessions.
- Transfer progress, interruption, cancellation, retries, expired sessions, unknown outcomes, and restart recovery.
- Safe client contracts, audit events, cleanup, quota awareness, and verification.

Excluded:

- Instagram, TikTok, Facebook, or generic social upload abstractions.
- Video editing, transcoding, compression, caption generation, thumbnails, playlists, analytics, or remote-video deletion.
- Final public/unlisted/private publishing rules, scheduled publishing, and ongoing status synchronization, except where this workflow hands data to those later stages.
- Selecting an object-storage vendor or approving production limits without a recorded decision.

## 3. Prerequisite Reality and Gate

Documents 05–08 contain planning prompts rather than fully frozen requirements and state machines. Documents 12–17 provide approved design baselines, but their implementation gates remain closed. Therefore names and fields in this document are the proposed canonical upload contract and must be reconciled into Documents 03, 08, 12, and 15 before code begins.

Implementation may start only when:

1. Documents 05–08 are completed and approved.
2. The Document 12 migration for sources, uploads, attempts, idempotency, events, and cleanup exists in development.
3. Document 13 encryption, access-control, logging, and secret-redaction controls pass tests.
4. Documents 14–17 backend authentication, OAuth, token refresh, connection ownership, channel discovery, and permission contracts pass tests.
5. A real non-production channel can be selected by internal `connectionId` and has usable `youtube.upload` permission.
6. Decisions marked blocking in Section 28 are approved.

Current implementation status: **Blocked.**

## 4. Authoritative External Rules

The implementation must be verified against the current official sources at implementation time:

- [YouTube resumable upload protocol](https://developers.google.com/youtube/v3/guides/using_resumable_upload_protocol): initialize with `uploadType=resumable`; save the `Location` URI; transfer with `PUT`; probe interruption with an empty `PUT` and `Content-Range: bytes */TOTAL`; interpret `308` and `Range`; respect `Retry-After`; restart after an expired-session `404`; non-final chunks must be equal-sized multiples of 256 KB.
- [YouTube `videos.insert`](https://developers.google.com/youtube/v3/docs/videos/insert): uploads media and metadata to the authorized channel; accepted media MIME types are `video/*` and `application/octet-stream`; maximum API file size is 256 GB; unverified qualifying API projects may be forced to private visibility.
- [YouTube upload guidance](https://developers.google.com/youtube/v3/guides/uploading_a_video): use resumable transfer and bounded exponential backoff for eligible transient failures.
- [YouTube Help — upload size and duration](https://support.google.com/youtube/answer/71673): the provider maximum is 256 GB or 12 hours, whichever is less; channel verification and eligibility affect longer uploads.
- [YouTube Help — uploading videos](https://support.google.com/youtube/answer/57407): uploading imports bytes; publishing makes the video viewable, so transfer completion must not be presented as publication success.

Official provider maxima are not Narrial product defaults. Narrial may approve smaller limits based on mobile reliability, storage, cost, timeouts, and worker capacity.

## 5. Core Invariants

| ID | Invariant |
|---|---|
| `YT-UP-INV-001` | Every source, upload, attempt, event, and provider video identity belongs to one authenticated Narrial owner. |
| `YT-UP-INV-002` | Client-supplied user IDs, channel IDs, paths, MIME types, byte counts, checksums, and completion claims are never authoritative. |
| `YT-UP-INV-003` | The backend resolves and authorizes `connectionId` before decrypting credentials or initiating provider work. |
| `YT-UP-INV-004` | One upload intent cannot create two confirmed YouTube videos. |
| `YT-UP-INV-005` | Unknown provider outcomes are reconciled before any new provider-side creation attempt. |
| `YT-UP-INV-006` | Google access tokens and resumable-session URIs never reach the frontend, logs, analytics, status events, or public API responses. |
| `YT-UP-INV-007` | Source readiness, byte-transfer completion, YouTube processing, and publication are different states. |
| `YT-UP-INV-008` | Progress is derived from provider-confirmed committed bytes, not bytes merely read or sent. |
| `YT-UP-INV-009` | Cancellation is best effort and never claims to undo a confirmed remote upload. |
| `YT-UP-INV-010` | A worker or server restart cannot erase upload intent, confirmed progress, attempts, or recovery work. |

## 6. Actors and Trust Boundaries

| Actor | Responsibility | Prohibited authority |
|---|---|---|
| Expo client | Select a local file, display draft metadata and backend state, request/cancel/retry | Cannot authorize ownership, hold Google credentials/session URIs, or declare upload success |
| Backend API | Authenticate, validate commands, enforce ownership, create resources, return safe status | Must not buffer unbounded video bodies or trust client completion claims |
| Source storage | Durably hold approved video bytes and expose narrowly scoped reads | Cannot select the target channel or publish |
| Upload worker | Lock work, refresh credentials, initialize/probe/transfer/reconcile, persist progress | Cannot bypass owner/connection/source eligibility |
| Database | Persist authority, state, idempotency, attempts, events, cleanup | Must not store raw tokens/session URIs in plaintext |
| Google OAuth | Issue scoped credentials | Does not prove Narrial resource ownership |
| YouTube upload service | Accept bytes and return provider status/video identity | Provider responses remain untrusted until validated |

Trust boundaries are the device-to-backend/storage transfer, backend-to-storage read, worker-to-credential vault, worker-to-Google/YouTube, and every queue/database boundary.

## 7. Canonical Resources

### 7.1 `VideoSource`

Represents durable, owner-scoped bytes prepared for upload. Proposed safe fields:

- `videoSourceId`, `status`, `sourceKind`, safe original display name, declared/detected media type, `sizeBytes`, checksum algorithm/value or safe verification status, optional duration, creation/update/expiry timestamps, and `version`.
- Storage bucket, object key, signed URLs, filesystem paths, internal scanner output, and credentials are private.

### 7.2 `YouTubeUpload`

Represents one durable intent to transfer one immutable source to one connection. Proposed safe fields:

- `uploadId`, `videoSourceId`, `connectionId`, `status`, `bytesConfirmed`, `totalBytes`, optional integer `progressPercent`, `attemptCount`, `isRetryable`, optional safe `failure`, optional `youtubeVideoId`, timestamps, and `version`.
- Provider session URI, tokens, raw errors, internal jobs, lock owners, and storage coordinates are private.

### 7.3 `UploadAttempt`

Internal record for one execution or recovery episode: attempt number, reason, start/end, byte range, provider outcome category, retry eligibility, next attempt time, and safe diagnostics. Attempts do not create a new user intent.

## 8. File Ownership Contract

All source and upload lookups are constrained by authenticated owner identity derived from the verified Narrial session. A valid identifier belonging to another owner returns the approved non-enumerating response from Document 15. Authorization occurs before source-location retrieval, credential decryption, checksum disclosure, or provider calls.

Source storage keys are server generated and non-semantic. Original filenames are display metadata only: strip path components and control characters, normalize safely, bound length, and never use them as storage paths or content-type authority.

An upload binds immutable `ownerId`, `videoSourceId`, `connectionId`, detected size/type/checksum, and request hash. Changing source or channel creates a new intent; it never mutates an active intent.

## 9. Source Kinds and Intake

Proposed source kinds are:

- `DEVICE_UPLOAD`: bytes selected by the user and transferred through the approved source-ingestion design.
- `GENERATED_ASSET`: an existing Narrial-produced video referenced by an authorized immutable asset ID.

Remote arbitrary URLs are excluded because they create SSRF, mutable-content, credential-leak, and ownership risks. Adding URL import requires a separate approved threat model.

For device intake, the approved architecture should prefer direct-to-object-storage transfer using short-lived, single-object, size/content constraints where supported. A backend proxy may be approved only with streaming, hard request limits, backpressure, timeouts, and no whole-file memory buffering. The storage provider remains an approval decision.

## 10. Source Lifecycle

Proposed states:

`CREATED → TRANSFERRING → RECEIVED → VALIDATING → READY`

Failure/terminal branches:

- `TRANSFER_FAILED`, `INVALID`, `QUARANTINED`, `EXPIRED`, or `DELETED`.
- Cancellation before readiness moves to `CANCELLED` if approved.

Only `READY` is eligible for a YouTube upload. Completion of client-to-storage transfer does not imply readiness. State transitions use conditional updates/version checks, append a safe event, and dispatch follow-up work through the approved transactional/outbox boundary.

## 11. Source Validation Pipeline

Validation occurs server-side or in a trusted worker after durable receipt:

1. Verify authenticated ownership and source state.
2. Confirm the expected storage object exists and is not a symlink/path alias where filesystem storage is used.
3. Read authoritative byte size from storage; reject zero bytes and over-limit content.
4. Compare declared and stored size; mismatch is invalid.
5. Detect container/media type from bounded file signatures and parser output; extension and client MIME are hints only.
6. Require an approved YouTube-supported video container; audio-only files are rejected for this workflow.
7. Compute or verify an approved cryptographic checksum while streaming; mismatch is invalid.
8. Parse only required metadata with a sandboxed, resource-bounded media probe if duration/container validation is approved.
9. Apply approved duration, product-size, and channel-eligibility checks.
10. Store normalized validation results and mark `READY` atomically, or store a safe failure category.

Malware scanning is a blocking security decision, not silently omitted. Media parsers run with least privilege, no outbound network, CPU/memory/time limits, patched dependencies, and untrusted-output validation.

## 12. Supported Formats and Limits

Provider compatibility and Narrial acceptance are separate:

- Provider request MIME may be detected `video/*` or `application/octet-stream`, but Narrial must use an allowlist of verified containers/codecs approved from current YouTube Help documentation.
- The default recommendation is to start with MP4/MOV-compatible video commonly generated by supported Narrial and device workflows, then expand through tests. This is **not approved** until recorded in Document 03.
- Reject extension-only validation, executable/polyglot content, corrupt containers, encrypted/unreadable media, zero-byte files, and content beyond approved limits.
- Narrial must set one configurable maximum smaller than or equal to YouTube's current provider maximum. The exact size and duration are blocking decisions.

Errors use stable codes: `VIDEO_TOO_LARGE`, `VIDEO_TYPE_UNSUPPORTED`, `VIDEO_SOURCE_INVALID`, `VIDEO_CHECKSUM_MISMATCH`, and a separately approved duration/eligibility code. Do not expose parser details.

## 13. Upload Preconditions

`POST /uploads` succeeds only when:

- Narrial authentication is valid.
- The request has a valid, stable `Idempotency-Key`.
- `connectionId` and `videoSourceId` belong to the same authenticated owner.
- The connection is active, channel identity is verified, credentials are usable/refreshable, and `youtube.upload` is granted.
- The source is `READY`, immutable for the intent, readable, unexpired, and checksum-verified.
- No conflicting active intent exists for the approved deduplication key.
- Required upload metadata and declarations are valid under Document 20.
- Product, storage, worker, quota, and channel eligibility permit starting.

The endpoint durably records intent and returns `202`; it never holds the request open for the transfer.

## 14. Idempotency and Duplicate Prevention

The client creates one random idempotency key per logical upload intent and reuses it for transport retries. The backend atomically claims `(ownerId, operationType, idempotencyKey)` under a unique constraint and stores a canonical request hash.

- Same key and same hash replays the original safe resource/result.
- Same key with different source, connection, or metadata returns `IDEMPOTENCY_KEY_REUSED`.
- An in-progress duplicate returns the approved `409`/`202` behavior plus the existing status URL.
- The upload record is committed before queue dispatch/provider calls.
- A uniqueness policy prevents concurrent active intents for the same owner/source/connection/approved metadata fingerprint.
- Idempotency retention must outlive all client, queue, worker, dead-letter, and manual-recovery retry paths.

YouTube does not supply Narrial with an application idempotency key for `videos.insert`; therefore a timeout after provider creation is an unknown outcome, not permission to call `videos.insert` again.

## 15. Upload Lifecycle

Proposed normalized states:

`QUEUED → INITIALIZING → UPLOADING → TRANSFERRED → PROCESSING`

Additional states:

- `PAUSED`: retry is scheduled or waiting on recoverable conditions.
- `CANCELLING`: no new chunks start while cleanup/reconciliation runs.
- `CANCELLED`: cancellation confirmed before irreversible completion.
- `REAUTHORIZATION_REQUIRED`: credentials cannot be refreshed; source/intent remain recoverable.
- `OUTCOME_UNKNOWN`: provider effect cannot yet be proven.
- `FAILED_RETRYABLE`: user/worker may resume under policy.
- `FAILED_TERMINAL`: validation/provider rejection or exhausted policy.
- `READY_FOR_PUBLICATION`: YouTube identity exists and required processing/eligibility checks pass.

Final enum names require Document 08 approval. `TRANSFERRED` means YouTube accepted all bytes; it does not mean processing, publication, or public visibility succeeded.

## 16. Resumable Session Initialization

The worker:

1. Atomically leases the eligible upload and creates an attempt.
2. Rechecks source immutability/readability and connection ownership/status.
3. Obtains a valid access token through the credential service, refreshing under the Document 16 single-flight rule.
4. Sends a bounded-timeout HTTPS `POST` to the fixed `videos.insert` upload endpoint with `uploadType=resumable`, approved `part` values, validated metadata, `X-Upload-Content-Length`, and detected content type.
5. Validates response status, host/scheme, and `Location` header.
6. Encrypts the session URI using the Document 13 envelope/key policy and stores it only in the private upload session record.
7. Moves the upload to `UPLOADING` and begins or queues transfer.

The frontend cannot supply the provider host, query parameters, parts, session URI, token, or byte-range offset.

## 17. Byte Transfer and Chunking

The worker streams bytes from the immutable source with backpressure and bounded memory. For chunked transfer:

- Every non-final chunk uses one approved size that is a multiple of 256 KB.
- Non-final chunk sizes remain equal within the session.
- `Content-Length`, `Content-Type`, and `Content-Range` are calculated from authoritative source data.
- Chunks are contiguous. The next byte is the provider-confirmed last byte plus one.
- Parallel/non-contiguous chunk upload is prohibited.
- A final successful provider response is schema-validated before saving `youtubeVideoId`.

Whole-file transfer may be selected for reliable server-to-provider networks, but mobile selection does not justify direct device-to-YouTube credentials. Exact chunk size is measured and approved per environment.

## 18. Progress Contract

`bytesConfirmed` is updated only from a valid YouTube `308 Range` response or final successful response. If `Range` is absent on a `308`, confirmed bytes are zero. `progressPercent = floor(bytesConfirmed * 100 / totalBytes)` when total is known; it is clamped from 0–100 and cannot regress except after an explicitly recorded expired-session restart.

The public status endpoint returns:

- status, confirmed/total bytes, optional percentage, update time, retryability, safe recovery action, attempt count, and optional `Retry-After`/next attempt time.
- No per-chunk database write requirement; throttle persistence/events by approved time or byte thresholds while ensuring crash recovery is acceptably bounded.
- The client polls with bounded backoff, stops on terminal/reauthorization states, handles app backgrounding, and never infers failure from silence.

Accessibility requires text status plus progress semantics; color alone is insufficient. Unknown progress uses an indeterminate indicator and honest copy.

## 19. Interruption and Resume Algorithm

After a network interruption, timeout, worker crash, or eligible `500`, `502`, `503`, or `504`:

1. Persist an unknown/interrupted attempt outcome; do not assume the last request failed.
2. Wait according to valid `Retry-After` or bounded exponential backoff with jitter.
3. Refresh credentials if needed without replacing the upload intent.
4. Probe the encrypted session URI using empty `PUT`, `Content-Length: 0`, and `Content-Range: bytes */TOTAL`.
5. On `308`, validate `Range`, persist confirmed offset monotonically, and resume at the next byte.
6. If the probe returns a completed resource, validate and persist its YouTube video ID once.
7. On session-expired `404`, follow Section 20.
8. On terminal `4xx`, map the safe reason and stop unless official semantics explicitly permit remediation.

Never blindly resend the previous chunk or create a new resumable session before probing when the effect is unknown.

## 20. Expired Sessions

A provider `404` for an expired resumable URI requires a new session and upload from byte zero. Before doing so, the worker must determine that no confirmed YouTube video was created by the prior attempt using all identifiers and reconciliation evidence available. If duplication cannot be ruled out, transition to `OUTCOME_UNKNOWN` for operator/user-safe reconciliation rather than restart.

After approved restart:

- Destroy the old encrypted URI.
- Record the restart reason and increment the attempt/session generation.
- Reset confirmed progress to zero with an explicit progress-reset event.
- Revalidate source immutability and credentials.
- Enforce the same logical upload/idempotency record and restart limit.

## 21. Retry Policy

Automatic retries are allowed only for classified transient failures with a known-safe recovery path: eligible network failures, specified provider 5xx responses, temporary storage reads, lease loss before effects, and approved rate limits.

Rules:

- Respect provider `Retry-After`; otherwise use exponential backoff with full jitter, maximum delay, attempt cap, elapsed-time cap, and dead-letter/escalation threshold.
- Credential expiry triggers one controlled refresh/retry; revoked/invalid grant becomes `REAUTHORIZATION_REQUIRED`.
- Quota exhaustion waits for the known reset/recovery policy; retry storms are prohibited.
- Validation errors, forbidden ownership, unsupported media, checksum mismatch, channel restrictions, and confirmed permanent provider rejection are not automatic retries.
- Manual retry uses `POST /uploads/:uploadId/retry-attempts` with a new idempotency key for the retry command while retaining the original upload intent.
- Retry configuration requires operations approval and must be observable per error category.

## 22. Cancellation

`POST /uploads/:uploadId/cancellations` records a durable, idempotent cancellation request. The worker checks cancellation before initialization and between chunks, stops opening new requests, releases leases, and destroys the session URI after any required reconciliation.

- `QUEUED`/pre-session work can normally become `CANCELLED`.
- During transfer, cancellation is best effort; an in-flight request may complete.
- If all bytes or a YouTube video ID may have been accepted, reconcile first. Return `409`/irreversible state rather than claiming cancellation.
- Cancellation does not delete a confirmed YouTube video. Remote deletion is out of scope and requires separate explicit user confirmation and permission review.
- Source cleanup follows retention policy; do not delete a source shared by another approved intent.

## 23. Provider Response and Error Mapping

All Google responses, headers, ranges, JSON, and video IDs are untrusted. Validate schema, types, numeric bounds, allowed host/scheme, status/headers, and identifier format before persistence.

| Condition | Normalized handling |
|---|---|
| Invalid/expired Narrial session | `AUTHENTICATION_REQUIRED` |
| Cross-owner or unavailable resource | Approved non-enumerating not-found/forbidden contract |
| Connection unhealthy/revoked | `YOUTUBE_REAUTHORIZATION_REQUIRED` |
| Missing upload scope | `YOUTUBE_PERMISSION_REQUIRED` |
| Source not ready/deleted | `VIDEO_SOURCE_NOT_READY` / `VIDEO_SOURCE_DELETED` |
| Size/type/checksum failure | Existing Document 15 source codes |
| Duplicate active intent | `ACTIVE_OPERATION_CONFLICT` |
| Upload cannot safely resume | `YOUTUBE_UPLOAD_OUTCOME_UNKNOWN` |
| Cancellation/retry invalid | `YOUTUBE_UPLOAD_NOT_CANCELLABLE` / `YOUTUBE_UPLOAD_NOT_RETRYABLE` |
| Rate/daily/quota limit | Safe rate/quota code plus retry guidance when known |
| Provider transient failure | Temporary-unavailable code; retry policy applies |
| Permanent provider rejection | `FAILED_TERMINAL` with allowlisted user-safe reason |
| Malformed provider response | Safe provider/internal error plus alert; no raw payload |

Raw Google reason strings and messages are diagnostic inputs, not stable public contracts.

## 24. Persistence Requirements

Document 12 must contain or be migrated to support:

- `video_sources`: owner, source kind/status, private storage locator, sanitized name, declared/detected type, authoritative size, checksum, optional duration, validation result, expiry, timestamps, version.
- `youtube_uploads`: owner, source/connection foreign keys, state, immutable request hash, bytes confirmed/total, provider video ID, retry/failure summary, timestamps, version.
- `youtube_upload_sessions`: upload ID, generation, encrypted session URI/envelope metadata, provider creation time, last probe, expiry hint if available, destruction time.
- `youtube_upload_attempts`: attempt/generation, cause, ranges, outcome, retry schedule, timestamps.
- Safe status events, idempotency records, outbox/jobs, audit events, and cleanup records.

Required constraints include owner-consistent composite references, unique YouTube video identity where appropriate, unique idempotency claim, one active session generation per upload, monotonic attempt number, nonnegative byte bounds, and conditional state/version updates. Provider calls never occur inside a database transaction.

## 25. Security, Privacy, and Abuse Controls

- Authenticate every route; authorize owner/source/connection before private lookup or decryption.
- Rate-limit source creation/completion, upload creation, cancellation, retry, and polling separately.
- Enforce request/body/storage limits at the earliest boundary and reject archive/executable/polyglot content.
- Use private storage, HTTPS, short-lived write/read grants, server-generated object keys, encryption at rest, and least-privilege service identities.
- Treat the session URI as a bearer credential: encrypt it, redact it, restrict access, rotate/destroy it, and never return it publicly.
- Never log video bytes, tokens, session URIs, signed storage URLs, raw metadata/descriptions, filenames when unnecessary, or raw provider bodies.
- Audit source validation, upload creation, attempt/recovery, cancellation, terminal outcome, ownership failures, and privileged operator actions with allowlisted fields.
- Enforce per-user concurrent-upload, storage, request-rate, and total-bandwidth controls to prevent denial of service and cost abuse.
- Define source/session/attempt/event retention and verified deletion, including abandoned multipart uploads and backups, before production.

## 26. Quota and Operational Behavior

YouTube quota rules can change; implementation must verify current official quota costs and project limits rather than hardcode this document as eternal truth. Track calls by operation and safe outcome, alert before exhaustion, and avoid unnecessary session creation, probes, or status polling.

Operational dashboards require queued age, active uploads, throughput, confirmed bytes, resume count, expired sessions, unknown outcomes, retry exhaustion, validation failures, storage cleanup backlog, provider errors, credential failures, and quota/rate-limit events. Metrics must not contain owner IDs, titles, filenames, tokens, or session URIs as high-cardinality labels.

## 27. API Contract Alignment

Document 15 endpoints remain authoritative:

- `POST /video-sources`
- `POST /video-sources/:videoSourceId/completions`
- `GET /video-sources/:videoSourceId`
- `POST /uploads`
- `GET /uploads`
- `GET /uploads/:uploadId`
- `POST /uploads/:uploadId/cancellations`
- `POST /uploads/:uploadId/retry-attempts`
- `GET /uploads/:uploadId/status-events`

State-changing routes validate input, require authenticated ownership, use the stable error envelope, and honor idempotency as defined in Document 15. Long-running responses return `202` plus resource/status location. Any direct client-to-storage grant endpoint must be added to Document 15 only after the storage decision and threat review are approved.

## 28. Decisions Requiring User Approval

| Decision ID | Required decision | Recommendation | Blocks |
|---|---|---|---|
| `YT-UP-DEC-001` | Source storage provider and environment isolation | Private object storage with short-lived single-object grants | Source implementation |
| `YT-UP-DEC-002` | Supported source kinds | `DEVICE_UPLOAD` and authorized `GENERATED_ASSET` only | Intake UI/API |
| `YT-UP-DEC-003` | Narrial maximum size and duration | Start below provider maximum based on measured infrastructure limits | Validation/configuration |
| `YT-UP-DEC-004` | Container/codec allowlist | Begin with tested MP4/MOV-compatible output; expand deliberately | Validation tests |
| `YT-UP-DEC-005` | Malware/media-probe tools and isolation | Sandboxed, resource-bounded scanning/probing | Security gate |
| `YT-UP-DEC-006` | Checksum algorithm and who computes it | Server/storage-verified SHA-256 while streaming | Source readiness |
| `YT-UP-DEC-007` | Whole-file versus chunked provider transfer and chunk size | Benchmark server-to-Google path; if chunked, use fixed 256 KB multiple | Worker implementation |
| `YT-UP-DEC-008` | Retry/backoff/elapsed-time and restart caps | Environment-configured bounded policy with jitter | Recovery tests |
| `YT-UP-DEC-009` | In-progress idempotent duplicate response | Follow Document 15 recommendation: `409` plus status URL | Contract tests |
| `YT-UP-DEC-010` | Cancellation after possible provider acceptance | Reconcile; never auto-delete remote video | Cancellation tests |
| `YT-UP-DEC-011` | Source, session, attempt, event, and idempotency retention | Define by privacy, recovery, and longest retry path | Migration/cleanup |
| `YT-UP-DEC-012` | Per-user concurrency/storage/bandwidth limits | Conservative configurable limits, load-tested before expansion | Abuse controls |
| `YT-UP-DEC-013` | Initial upload privacy and metadata coupling | Create as private until Document 20 approves publication policy | Provider session creation |

No decision is approved merely because a recommendation appears here. Record approval in Document 03 and update affected documents.

## 29. Implementation Order

After the gate opens:

1. Freeze state/error/DTO names in Documents 03, 08, 12, and 15.
2. Approve storage, formats, limits, scanning, checksum, transfer, retry, and retention decisions.
3. Apply source/upload/session/attempt/idempotency/outbox migrations in development.
4. Implement private storage adapter and source authorization/validation behind test fakes.
5. Implement source endpoints and contract/security tests.
6. Implement upload intent/idempotency/state repositories.
7. Implement the YouTube upload adapter with fixed endpoints and response validation.
8. Implement initialization, streaming, progress, probe/resume, expired-session, and unknown-outcome paths.
9. Implement cancellation, retries, cleanup, audit, metrics, and alerts.
10. Add frontend source selection/progress/recovery UI only after API contract tests pass.
11. Test with a non-production channel and small approved fixtures, then progressively larger fixtures.
12. Complete security, failure-injection, load, quota, restoration, and acceptance verification before staging approval.

Dependency installation is governed by Document 09. No storage SDK, multipart parser, media probe, checksum library, queue package, or Google client library may be installed from this document alone.

## 30. Testing Strategy

### Unit tests

- Filename sanitization; declared/detected type and magic-byte mismatch.
- Size/duration limits; zero/corrupt/audio-only/polyglot sources.
- Checksum streaming/mismatch; immutable source fingerprint.
- State transition guards, request hashes, range parsing, percentage math, monotonic progress.
- Retry classification/backoff/jitter, `Retry-After`, cancellation eligibility, and redaction.

### Contract and integration tests

- Authentication, cross-owner isolation, stable errors, idempotency replay/mismatch/concurrency.
- Storage grant scope/expiry, interrupted intake, missing/changed object, validation completion.
- Provider initialization headers/body, safe session encryption, no public leakage.
- `308` with/without `Range`, exact next byte, partial/final chunks, malformed/overlapping/out-of-bounds ranges.
- Final `201`, duplicate response, timeout-before/after effect, specified 5xx, terminal 4xx, rate/quota errors, expired-session `404`, invalid/revoked token, malformed provider response.
- Worker crash at every persistence/provider boundary, lease expiry, concurrent workers, database restart, queue redelivery, and source-read interruption.
- Cancellation before/during/after transfer and retry command behavior.

### End-to-end tests

- Select valid owned source → validate → select real test channel → upload → receive one YouTube video ID → show processing without claiming publication.
- Cancel queued and active work; recover offline/client restart; reconnect credentials; resume server restart.
- Reject unsupported, corrupt, oversized, unauthorized, expired, and tampered sources.
- Verify no tokens, session URIs, signed URLs, raw errors, or cross-owner metadata in UI/network/logs/audits.

### Nonfunctional tests

- Large-file streaming with bounded memory and backpressure.
- Concurrent-user limits, bandwidth shaping, poll load, retry storm, storage/YouTube degradation.
- Scanner/parser sandbox escape and resource-exhaustion tests.
- Backup/restore of active uploads and cleanup of abandoned sources/sessions.
- Accessibility for progress, errors, cancellation, retry, and indeterminate states.

Real-provider tests use designated private test uploads and cleanup procedures. Provider calls are never run in ordinary unit tests.

## 31. Acceptance Criteria

- [ ] The user can create and validate only an owned source through approved intake paths.
- [ ] Server-side validation enforces approved size, duration, format, checksum, and parser/scanner controls.
- [ ] An upload is bound immutably to one owner, source, and securely verified connection.
- [ ] Duplicate commands and concurrent workers cannot create duplicate confirmed YouTube uploads.
- [ ] Session URI and Google credentials remain encrypted/private and are absent from public output and logs.
- [ ] Resumable initialization, `308` probing, contiguous resume, final success, `Retry-After`, eligible 5xx, and expired-session behavior match current official documentation.
- [ ] Progress reflects provider-confirmed bytes and remains honest across interruption/restart.
- [ ] Unknown outcomes are reconciled before restart; unsafe blind retries are impossible.
- [ ] Cancellation is idempotent, best effort, and never misrepresents remote deletion.
- [ ] Source readiness, transfer completion, YouTube processing, and publication are visibly distinct.
- [ ] Authentication, ownership, rate limits, file safety, redaction, retention, cleanup, audit, and observability controls pass tests.
- [ ] All Section 28 blocking decisions are recorded as approved in Document 03.
- [ ] Documents 08, 12, and 15 match the final states, fields, constraints, and API contracts.
- [ ] No non-YouTube platform behavior was added.

## 32. Approval Record

User approval to add this document means the documentation baseline may be stored. It does not approve unresolved Section 28 decisions, dependency installation, database changes, infrastructure creation, Google/YouTube calls, or implementation.

## 33. Prerequisites and Next Document

Prerequisites:

- `05-functional-requirements-and-business-rules.md`
- `06-nonfunctional-requirements-and-quality-attributes.md`
- `07-system-architecture-and-service-boundaries.md`
- `08-domain-model-state-machines-and-api-contracts.md`
- `12-database-design-collections-relations-and-migrations.md`
- `13-security-model-token-encryption-and-threat-controls.md`
- `14-backend-foundation-and-implementation-structure.md`
- `15-backend-api-endpoints-and-error-contract.md`
- `16-oauth-connection-callback-and-token-lifecycle.md`
- `17-youtube-channel-discovery-permissions-and-management.md`

Next: `20-immediate-publishing-and-youtube-metadata.md`, which defines validated YouTube metadata, audience/privacy declarations, optional thumbnails and playlists, publication confirmation, immediate publication, safe retries, and resulting YouTube identifiers.

## 34. Change Log

| Version | Date | Change | Approval |
|---|---|---|---|
| 1.0.0 | 2026-08-26 | Source-verified video source validation and resumable upload workflow generated and added at user request | User approved document creation only |
