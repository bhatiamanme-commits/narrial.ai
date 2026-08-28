# YouTube Connection Module — Scheduled Publishing, Workers, and Timezones

## Document Control

| Field | Value |
|---|---|
| Document number | 21 |
| Filename | `21-scheduled-publishing-workers-and-timezones.md` |
| Module | YouTube Connection only |
| Stage | Stage 10 — Scheduling implementation |
| Status | Approved documentation baseline — implementation not authorized |
| Version | 1.0.0 |
| Date | 2026-08-26 |
| Purpose | Define schedule creation, persistence, timezone conversion, worker execution, locking, idempotency, rescheduling, cancellation, missed jobs, and retries |
| Earlier dependencies | Documents 12–15 and 19–20 |
| Operational prerequisite | Immediate publishing is implemented and verified |
| Next document | `22-video-status-synchronization-and-display.md` |

## 1. Purpose

This document defines the complete production contract for scheduling an owned, uploaded YouTube video to become public at a future instant. It covers user-entered local date/time and timezone, canonical UTC persistence, provider scheduling, durable worker behavior, concurrency, idempotency, rescheduling, cancellation, missed deadlines, recovery, and observable user-facing state.

This is documentation only. It does not create scheduling tables, install a queue or timezone package, start workers, change OAuth scopes, or call YouTube.

## 2. Scope

Included:

- One-time scheduled publication of a private, never-published YouTube video.
- Explicit IANA timezone selection, daylight-saving validation, UTC conversion, and display rules.
- Durable schedule records, jobs, outbox dispatch, worker leases, fencing/version checks, retries, dead-letter handling, and reconciliation.
- Schedule creation, listing/detail, rescheduling, cancellation, manual retry, missed-job policy, disconnection behavior, and safe status history.
- Coordination with uploads, processing, credentials, quota, and provider restrictions.

Excluded:

- Recurring schedules, bulk calendars, best-time recommendations, cross-platform scheduling, Premieres, live streams, playlist scheduling, automatic timezone guessing as authority, and editing videos already published.
- Operating-system cron as the source of truth.
- A final queue/worker vendor choice before Document 09 and Section 29 approval.

## 3. Prerequisite and Implementation Gate

Database scheduling records and worker dependencies may be created only after:

1. Documents 12–15 are reconciled and approved for the final schedule schema, worker boundary, endpoint/error contract, authentication, authorization, and idempotency model.
2. Document 19 upload reliably produces one owned `youtubeVideoId` and recovers from interruption without duplicates.
3. Document 20 immediate private/public publication and provider reconciliation pass staging tests.
4. The database supports transactional state changes, unique constraints, conditional updates, outbox delivery, and worker lease/fencing semantics.
5. The worker runtime, queue/job mechanism, clock/timezone library, deployment topology, and operational owner are approved.
6. Broader YouTube OAuth permission for `videos.update` is explicitly approved and affected connections can reauthorize.
7. All blocking decisions in Section 29 are approved and recorded in Document 03.

Current implementation status: **Blocked.**

## 4. Authoritative YouTube Rules

Re-verify these official sources during implementation and release review:

- [YouTube video resource](https://developers.google.com/youtube/v3/docs/videos): `status.publishAt` is an ISO 8601 datetime; it can be set only while `privacyStatus` is `private` and the video has never been published. Setting a past time publishes immediately.
- [`videos.update`](https://developers.google.com/youtube/v3/docs/videos/update): scheduling requires `status.publishAt` together with `status.privacyStatus: private`; the method uses replacement semantics for included parts and requires broader OAuth scopes such as `youtube` or `youtube.force-ssl`.
- [YouTube Help — scheduled publishing](https://support.google.com/youtube/answer/1270709): scheduled publishing applies to a private video; Community Guidelines penalties can prevent publication and leave the video private; the displayed watch-page publication date uses Pacific time and may differ from the creator-selected local date.
- [YouTube upload guidance](https://support.google.com/youtube/answer/57407): a video can publish only after required processing completes; upload and publication are distinct.

YouTube can perform the final timed transition after `publishAt` is accepted. Narrial still requires durable local workers for readiness checks, applying/rescheduling/cancelling provider schedules, reconciliation, retries, and user-visible truth. A worker must not implement its own public-at-time toggle when provider scheduling is available and approved, unless a separate fallback is explicitly designed.

## 5. Critical OAuth Scope Gate

Documents 16–17 currently propose `youtube.readonly` and `youtube.upload`. Official `videos.update` documentation does not list `youtube.upload`; it lists broader permissions including `youtube` and `youtube.force-ssl`. Therefore scheduled publishing is disabled until:

1. The user approves the narrowest adequate broader scope after security/privacy review.
2. Documents 11, 13, 16, 17, and 20 are updated.
3. Google OAuth consent configuration includes the approved scope.
4. Existing connections use explicit incremental reauthorization and the UI explains the new permission.
5. The backend verifies the granted scope before schedule creation/execution.

No worker may attempt `videos.update` under an assumed permission.

## 6. Core Invariants

| ID | Invariant |
|---|---|
| `YT-SCH-INV-001` | Every schedule belongs to one authenticated owner, publication, connection, and YouTube video ID. |
| `YT-SCH-INV-002` | The user selects a future civil time and IANA timezone; the backend derives the canonical UTC instant. |
| `YT-SCH-INV-003` | One active schedule exists per publication/video under an enforced database constraint. |
| `YT-SCH-INV-004` | Only a private, never-published, owned, provider-confirmed video may be scheduled. |
| `YT-SCH-INV-005` | Schedule commands and worker execution are idempotent and safe under at-least-once delivery. |
| `YT-SCH-INV-006` | Database state is authoritative for Narrial intent; YouTube is authoritative for remote `publishAt` and visibility. |
| `YT-SCH-INV-007` | A lease alone is insufficient; every write/effect is guarded by schedule version or fencing token. |
| `YT-SCH-INV-008` | Reschedule/cancel racing with a worker cannot apply a stale time or publish unintentionally. |
| `YT-SCH-INV-009` | Past-time input never reaches YouTube because the provider would publish immediately. |
| `YT-SCH-INV-010` | Unknown provider outcomes are reconciled before repeating an update. |
| `YT-SCH-INV-011` | Client closure, backend restart, worker restart, queue redelivery, and clock change do not lose durable intent. |
| `YT-SCH-INV-012` | Tokens, raw provider data, queue payload secrets, and internal lease details never appear publicly or in logs. |

## 7. Schedule Resource

Proposed safe `YouTubeSchedule` fields:

- `scheduleId`, `publicationId`, `uploadId`, `connectionId`, `youtubeVideoId`.
- `status`, `scheduledForUtc`, `timeZone`, `localDate`, `localTime`, optional `utcOffsetAtCreation` for display/audit only.
- `desiredPrivacyStatus` fixed to `PUBLIC` for provider `publishAt` scheduling unless YouTube later supports another verified behavior.
- `providerScheduleStatus`, `lastSynchronizedAt`, optional safe `publishedAt`.
- `attemptCount`, `isRetryable`, optional `nextAttemptAt`, safe failure/recovery action.
- `createdAt`, `updatedAt`, `cancelledAt`, `version`.

Never expose credentials, raw Google errors, worker IDs, lock/lease tokens, queue IDs, internal job payloads, ETags, or full provider resources.

## 8. Schedule Eligibility

Schedule creation requires:

- Valid Narrial authentication and stable `Idempotency-Key`.
- Owned active connection with verified channel identity, usable credentials, and approved update scope.
- Owned publication/upload with exactly one confirmed `youtubeVideoId` bound to that connection/channel.
- Video is private, never previously published, not deleted/rejected/restricted, and at or approaching the approved processing readiness threshold.
- Metadata and mandatory audience/content declarations from Document 20 are complete.
- No active conflicting schedule and no immediate-publication operation in progress.
- Requested instant meets approved minimum lead time and maximum scheduling horizon.
- Environment, quota, worker, and database health permit durable acceptance.

The backend rechecks provider eligibility during execution because state may change after creation.

## 9. User Time Input Contract

The client submits:

- `localDate` in `YYYY-MM-DD`.
- `localTime` with approved minute precision.
- Explicit IANA timezone identifier such as `Asia/Kolkata`; fixed labels such as `IST`, raw offsets, or device locale alone are not accepted as authority.
- Optional client-observed offset for diagnostics only.

The UI may prefill the device timezone, but the user sees and can change it. The review screen shows local date/time, named timezone, computed offset, and an unambiguous UTC equivalent. The confirmation action says `Schedule on YouTube`, not a generic `Save`.

The API does not accept only an epoch or UTC value from the client because that loses the user's civil-time intent and makes daylight-saving disputes unauditable.

## 10. Timezone Conversion and Validation

The backend uses an approved, pinned timezone-data implementation:

1. Parse date/time strictly; reject normalization such as February 30 rolling into March.
2. Validate the timezone against the supported IANA database.
3. Resolve the local civil time in that zone.
4. If the time is nonexistent during a daylight-saving spring transition, reject it and ask the user to choose another time.
5. If the time is ambiguous during a fall transition, require explicit choice of the earlier/later offset; never guess silently.
6. Convert the chosen instant to UTC and store it with the original local fields, timezone, selected offset, and timezone-data version if available.
7. Validate against trusted server time, minimum lead time, maximum horizon, and allowed precision.
8. Return normalized values for final confirmation.

Changing timezone rules after creation does not silently change the approved instant. Display both stored civil intent and canonical instant, flag material rule changes, and require explicit rescheduling if product policy chooses to preserve civil time instead.

All internal comparisons and worker due times use UTC. UI display uses the schedule's saved timezone by default, with optional device-time display clearly labeled.

## 11. Clock and Time Authority

Backend/worker time comes from synchronized infrastructure clocks. Client time cannot authorize due/late state. Configure and monitor clock synchronization; define a maximum acceptable clock skew.

Inject a clock interface into schedule logic and tests. Database time may arbitrate lease expiry and due-row selection when approved; do not mix unsynchronized application and database clocks in one locking algorithm.

## 12. Schedule Lifecycle

Proposed states:

`DRAFT → SCHEDULED → APPLYING_TO_YOUTUBE → PROVIDER_SCHEDULED → DUE → VERIFYING → PUBLISHED`

Additional states:

- `WAITING_FOR_UPLOAD` or `WAITING_FOR_PROCESSING` when early schedule creation is approved.
- `RESCHEDULING`.
- `CANCELLING`.
- `CANCELLED` before confirmed publication.
- `REAUTHORIZATION_REQUIRED`.
- `MISSED` when the deadline policy prevents automatic action.
- `OUTCOME_UNKNOWN`.
- `FAILED_RETRYABLE`.
- `FAILED_TERMINAL`.
- `PROVIDER_BLOCKED` when policy/strike/restriction keeps the video private.

Final names/transitions require Document 08 approval. Status transitions use compare-and-swap/version conditions, append a safe event, and enqueue follow-up via the transactional outbox.

## 13. Creation Transaction

`POST /schedules` performs, in one database transaction:

1. Authenticate and derive owner.
2. Validate request and canonical timezone conversion.
3. Authorize publication/upload/connection ownership and lock the target publication row or equivalent aggregate.
4. Recheck eligibility and active-operation conflicts.
5. Atomically claim the idempotency key with canonical request hash.
6. Insert the schedule with canonical UTC instant, original civil-time intent, timezone data, immutable target IDs, and version.
7. Enforce a unique active schedule constraint.
8. Insert status/audit events and an outbox command.
9. Commit before returning `201` or `202` with the schedule/status URL.

No Google call or queue publish occurs inside the database transaction. An outbox dispatcher publishes only committed work.

## 14. Provider Scheduling Strategy

Recommended strategy: apply YouTube `status.publishAt` soon after schedule creation once the private video is eligible, rather than waiting until the target instant. YouTube then owns the final timed transition and Narrial verifies it.

The worker:

1. Claims an eligible schedule with version/fencing token.
2. Revalidates owner binding, connection, approved scope, credentials, private status, never-published condition, metadata, processing, and future target time.
3. Refreshes credentials under Document 16 single-flight rules.
4. Reads current video `status` and validates it.
5. Builds a safe `videos.update` request containing video ID and a complete approved `status` representation with `privacyStatus: private` and ISO 8601 `publishAt`.
6. Calls the fixed YouTube endpoint outside a transaction with bounded timeout.
7. Re-reads/reconciles remote state and persists `PROVIDER_SCHEDULED` only when confirmed.
8. Schedules local verification near/after the target instant.

Because included-part update semantics can clear omitted writable values, use the read/merge/validate/write rules from Document 20. Do not include `snippet` unless intentionally updating it.

## 15. Worker Architecture

Worker responsibilities are separated conceptually:

- Outbox dispatcher: delivers committed schedule commands.
- Schedule applier: applies or changes provider `publishAt`.
- Due verifier: checks expected publication near/after target.
- Reconciler: resolves unknown outcomes and provider/local drift.
- Retry/dead-letter handler: schedules bounded retries and escalates terminal work.

They may initially run in one deployable service if isolation, scaling, and failure tests approve it. The database schedule remains authoritative; the queue is delivery acceleration, not the sole record.

Workers process at-least-once. Each message contains only internal resource ID, command type, expected version/generation, correlation ID, and safe trace context—never Google tokens, refresh tokens, metadata bodies, or session URLs.

## 16. Due-Work Selection and Locking

The implementation must use an atomic database-supported claim, not `SELECT` followed by `UPDATE`:

- Select eligible due rows under a transactional row-lock/skip-locked mechanism or atomic conditional update supported by the approved database.
- Set lease owner, lease expiry, attempt ID, and monotonically increasing fencing token/version in the same claim.
- Limit each batch and order by due time plus stable ID for fairness.
- A worker renews a lease only while it owns the current fencing token.
- Every state write verifies the current token/version; a stale worker cannot commit after lease expiry or reschedule/cancel.
- External effects are protected by durable operation identity and reconciliation, because database locks cannot cover YouTube.
- Lease duration exceeds normal single-step time with heartbeat/renewal and a defined upper bound.

No process-local mutex, timer, or singleton assumption is a correctness boundary.

## 17. Idempotency and Exactly-Once Effect Strategy

The system promises at-least-once execution with idempotent/reconciled effects, not magical exactly-once delivery.

- Create, reschedule, cancel, and manual retry each require a stable idempotency key and canonical request hash.
- Worker commands have deterministic operation keys such as schedule ID + generation + action.
- One unique operation record is atomically claimed before a provider write.
- Duplicate/in-flight commands replay status or return the approved conflict behavior.
- After timeouts or crashes, read YouTube state before repeating `videos.update`.
- A schedule generation changes on reschedule/cancel so stale queued commands fail version checks.
- Idempotency records outlive API, queue, retry, dead-letter, manual replay, and reconciliation windows.

## 18. Rescheduling

`PATCH /schedules/:scheduleId` is authenticated, owner-scoped, idempotent, and concurrency-controlled with expected version/ETag if approved.

Rescheduling:

1. Accepts a new local date/time, IANA timezone, and ambiguity choice.
2. Performs full conversion/lead-time/horizon validation.
3. Locks the schedule/publication aggregate and rejects already published, terminal, or irreversible states.
4. Increments generation/version, invalidates stale jobs, records old/new safe times, and dispatches a reschedule command.
5. Rechecks the provider video remains private and never published.
6. Applies the new `publishAt` with `privacyStatus: private`, then re-reads for confirmation.

If the previous time becomes due during the race, the provider may already publish. The API must reconcile and return `SCHEDULE_ALREADY_PUBLISHED` rather than claim a successful reschedule. Define a minimum reschedule cutoff window and show it to users.

## 19. Cancellation

`POST /schedules/:scheduleId/cancellations` records an idempotent durable cancellation request. Cancellation means removing the scheduled-publication intent while keeping the video private; it does not delete the video.

The worker:

- Acquires current generation/fencing authority.
- Re-reads provider state.
- If already public, records irreversible publication and returns a conflict/safe result.
- If private and scheduled, applies the approved provider update that removes/clears `publishAt` while preserving a complete safe `status` part and private visibility.
- Re-reads to confirm no active provider schedule.
- Marks `CANCELLED`, invalidates jobs, and audits only after confirmation.

Unknown cancellation outcome becomes `OUTCOME_UNKNOWN`. Do not tell the user the schedule is cancelled until provider state is verified. The exact safe method for clearing `publishAt` must be integration-tested against current YouTube behavior before production.

## 20. Missed Schedules

A schedule is late when server time exceeds `scheduledForUtc` plus the approved grace threshold and the expected visibility is not confirmed. Reasons include worker outage, upload/processing delay, revoked credentials, quota exhaustion, provider outage, policy strike, invalid provider state, or clock fault.

Missed policy must be explicit:

- Recommended default: within a short approved grace window, reconcile first and apply the original provider schedule only if doing so cannot trigger an unintended past-time immediate publication; otherwise require user confirmation.
- Outside the grace window, mark `MISSED`, keep the video private, notify the user, and offer `Publish now` or `Reschedule`.
- Never send a past `publishAt` automatically, because YouTube documents that it publishes immediately.
- A strike/restriction that leaves the video private becomes `PROVIDER_BLOCKED`, not success; the user must resolve it and reschedule.

This policy is a blocking product decision and must be tested with controlled clock/failure scenarios.

## 21. Retry and Backoff

Automatic retry is limited to transient, classified, safe-to-reconcile failures:

- Respect valid `Retry-After`; otherwise exponential backoff with full jitter.
- Configure maximum attempts, elapsed time, delay, and dead-letter threshold per operation.
- Retry temporary provider 5xx/network/rate errors only after reconciling unknown effects.
- Credential expiry permits controlled refresh; revoked/invalid grant becomes `REAUTHORIZATION_REQUIRED`.
- Quota exhaustion waits for an approved recovery/reset time and triggers operational visibility.
- Invalid time, published video, ownership mismatch, missing scope, permanent provider rejection, and policy restriction are not blind retries.
- Manual retry creates a command idempotency key but retains the same schedule/generation unless rescheduling creates a new generation.

Retries never move the requested UTC instant. They may change attempt timestamps and next recovery time only.

## 22. Disconnection and Reconnection

Before disconnect, Document 16 must identify active schedules and apply the approved user-confirmed policy. Recommended behavior:

- Block new schedule/reschedule operations immediately.
- Attempt to cancel provider schedules while credentials are still usable if the user chose cancellation.
- Otherwise preserve the already-applied YouTube schedule and clearly state that YouTube may still publish it even after Narrial access is removed.
- Never claim Narrial can cancel a provider schedule after credentials are destroyed.
- Mark remaining local schedules disconnected/externally managed and retain safe history under policy.

Reconnection does not silently recreate or alter a schedule. Verify channel identity, provider video ownership, visibility, and `publishAt`, then reconcile or require user action.

## 23. API Contract Alignment

Document 15 remains authoritative and must include/reconcile:

- `POST /schedules` — create an owner-scoped schedule with idempotency.
- `GET /schedules` — cursor-paginated, owner-scoped list with safe filters.
- `GET /schedules/:scheduleId` — schedule detail/status.
- `PATCH /schedules/:scheduleId` — reschedule with idempotency and concurrency/version control.
- `POST /schedules/:scheduleId/cancellations` — durable cancellation.
- `POST /schedules/:scheduleId/retry-attempts` — controlled manual retry.
- `GET /schedules/:scheduleId/status-events` — safe paginated history.

Mutation responses use `201`/`202` plus the resource/status URL; idempotent replay returns the approved original response. Errors use Document 15's stable envelope and do not reveal cross-owner existence.

Proposed schedule errors to reconcile: `SCHEDULE_TIME_INVALID`, `SCHEDULE_TIME_NONEXISTENT`, `SCHEDULE_TIME_AMBIGUOUS`, `SCHEDULE_TOO_SOON`, `SCHEDULE_TOO_FAR`, `SCHEDULE_CONFLICT`, `SCHEDULE_NOT_CANCELLABLE`, `SCHEDULE_NOT_RESCHEDULABLE`, `SCHEDULE_ALREADY_PUBLISHED`, `SCHEDULE_MISSED`, `YOUTUBE_VIDEO_NOT_SCHEDULABLE`, `YOUTUBE_SCHEDULE_PERMISSION_REQUIRED`, and `YOUTUBE_SCHEDULE_OUTCOME_UNKNOWN`.

## 24. Persistence Requirements

Document 12 must support:

- `youtube_schedules`: owner/publication/upload/connection/video binding; local date/time/timezone/offset; canonical UTC instant; state; generation/version; provider-confirmed schedule/visibility; retry/failure; cancellation/published timestamps; retention.
- `schedule_operations` or shared operation records: deterministic key, request hash, action, generation, success/failure/unknown, provider reconciliation evidence.
- Worker leases/attempts with fencing token, lease expiry, heartbeat, result, next attempt.
- Idempotency, status events, outbox/jobs, dead-letter/escalation, notifications, and secret-free audits.

Required constraints/indexes:

- Owner-consistent foreign keys or equivalent enforced aggregate checks.
- Unique active schedule per publication/video.
- Unique idempotency claim and operation key.
- Indexed due/eligible states by `nextAttemptAt`/`scheduledForUtc` with bounded query plan.
- Valid UTC/timezone fields, nonnegative attempts, monotonic generation/version, and state-dependent null/check constraints.
- Lease/fencing updates use conditional affected-row verification.

Database migrations are created and applied in development only after this document and database changes are approved.

## 25. Frontend States

The UI supports:

- Loading eligibility/timezone/categories and signed-out/offline states.
- Date, time, timezone, DST nonexistent/ambiguous validation, lead-time and horizon errors.
- Review/confirmation showing exact channel, video, local time, timezone, UTC equivalent, and private-until-public behavior.
- Creating/applying/provider-scheduled/waiting/processing/due/verifying/published states.
- Reauthorization, blocked, retrying, missed, unknown, cancelling/cancelled, rescheduling, and partial failure.
- Accessible countdown/relative time supplemented by an absolute time; relative time is never the only representation.
- Focus/announcement of state changes without excessive polling announcements.

The frontend does not run a publication timer or background task as the authority. It refetches backend state after foregrounding and around due time.

## 26. Observability and Operations

On-call questions:

1. Are schedules being applied to YouTube before their deadlines?
2. What fraction publish within the approved lateness SLO, and why are any late?
3. Are workers/queues/leases/retries healthy, or are stale generations executing?
4. Are quota, credential, processing, policy, or provider failures blocking users?

Required signals:

- Structured events for schedule created/applied/rescheduled/cancelled/due/published/missed/blocked/retry/dead-letter/reconciled, with request/correlation/trace IDs and safe bounded fields.
- Metrics for creation/result rate, provider operation RED signals, queue depth/oldest age, due backlog, claim latency, lease expiry/loss, attempts, lateness histogram, success by bounded failure category, missed schedules, unknown outcomes, reauthorization, quota/rate events.
- Traces across API → database/outbox → queue → worker → credential service → YouTube → reconciliation, propagating safe context.
- Alerts on user-visible missed/late rate, oldest due work, sustained provider failure, unknown outcomes, dead-letter growth, clock skew, and dispatcher/worker unavailability. Each alert has severity, threshold justified by SLO/data, runbook, owner, and test evidence.

Never use user ID, schedule ID, video ID, title, timezone string with uncontrolled values, raw URL/error, or tokens as metric labels. Sensitive IDs belong only in access-controlled structured logs when necessary and retention-approved.

## 27. Security, Privacy, and Abuse Controls

- Authenticate every user route and authorize every resource before revealing timing or touching credentials.
- Workers use least-privilege identities and cannot accept public arbitrary job payloads.
- Queue/database transport is authenticated/encrypted; job payloads contain no Google credentials.
- Validate all IDs, dates, timezone names, state/version, and provider responses.
- Rate-limit create/reschedule/cancel/retry and bound active schedules per owner/channel.
- Prevent schedule spam, far-future storage abuse, rapid reschedule churn, and retry storms with configurable limits.
- Audit target channel/video, action, old/new UTC time, timezone, actor category, and outcome without metadata/tokens/raw provider bodies.
- Define retention/export/deletion for schedule civil-time data, history, logs, notifications, idempotency, attempts, and backups.
- Operational override/replay requires privileged authentication, reason, audit, fencing, dry-run/reconciliation, and never accepts raw provider credentials.

## 28. Failure Matrix

| Failure | Required behavior |
|---|---|
| Client closes after create | Durable schedule continues; refetch restores state |
| API commits but queue publish fails | Outbox dispatcher delivers later |
| Duplicate queue delivery | Operation/idempotency record replays safely |
| Worker crashes before provider call | Lease expires; another worker resumes |
| Worker times out after provider call | Mark unknown; read provider before retry |
| Lease expires during call | Stale worker cannot persist due to fencing; reconciler resolves effect |
| Reschedule races old worker | Generation mismatch blocks stale operation; provider state reconciled |
| Cancel races due time | Verify actual visibility; never claim cancellation after publish |
| Credential expires | Single-flight refresh and retry |
| Grant revoked/missing scope | Reauthorization required; no blind retries |
| Upload/processing not ready | Wait within approved policy or mark missed; never publish invalid content |
| Provider 5xx/rate limit | Bounded backoff with `Retry-After` and reconciliation |
| Quota exhausted | Defer/alert according to recovery policy |
| Community Guidelines restriction | Keep private, mark provider-blocked, require resolution/reschedule |
| Database/queue/worker outage | Restore from database/outbox; measure lateness and apply missed policy |
| Timezone rules change | Preserve approved UTC instant unless explicit reschedule policy applies |

## 29. Decisions Requiring User Approval

| Decision ID | Decision | Recommendation | Blocks |
|---|---|---|---|
| `YT-SCH-DEC-001` | Scheduling release scope | One-time public scheduling only | Product/API |
| `YT-SCH-DEC-002` | Broader OAuth scope | Approve narrowest verified `videos.update` scope after security review | Entire feature |
| `YT-SCH-DEC-003` | Provider-first vs worker-time publication | Apply YouTube `publishAt` early; worker verifies | Architecture |
| `YT-SCH-DEC-004` | Worker/queue technology | Select after Document 09 comparison and existing-stack audit | Dependencies/deployment |
| `YT-SCH-DEC-005` | Timezone library/data update policy | IANA-capable pinned library with planned tzdata updates | Validation |
| `YT-SCH-DEC-006` | DST ambiguous-time UX | Require earlier/later offset selection; reject nonexistent times | UI/API |
| `YT-SCH-DEC-007` | Minimum lead time and maximum horizon | Configure from measured operational/provider needs | Validation |
| `YT-SCH-DEC-008` | Reschedule/cancel cutoff | Define user-visible safety window before due time | Race behavior |
| `YT-SCH-DEC-009` | Missed schedule grace/action | Short grace with reconcile; otherwise keep private and ask user | Worker behavior |
| `YT-SCH-DEC-010` | Processing-readiness deadline policy | Wait until cutoff, then missed/private | Orchestration |
| `YT-SCH-DEC-011` | Retry/backoff/dead-letter limits | Bounded per-operation configuration with jitter | Recovery |
| `YT-SCH-DEC-012` | Lease duration/heartbeat/batch size | Measure under load; fence every result | Concurrency |
| `YT-SCH-DEC-013` | Clock authority/skew threshold | Synchronized infrastructure plus database-time consistency | Reliability |
| `YT-SCH-DEC-014` | Disconnection behavior | User chooses cancel provider schedules or leave them externally active | Disconnect UX |
| `YT-SCH-DEC-015` | Schedule/history/idempotency retention | Outlive retry/reconciliation and meet privacy policy | Database/cleanup |
| `YT-SCH-DEC-016` | Lateness SLO and alert thresholds | Define before staging load/failure tests | Operations gate |

Recommendations are not approvals. Record accepted choices in Document 03 and update all affected prerequisite documents.

## 30. Implementation Order

After immediate publishing is verified and the gate opens:

1. Approve Section 29; update OAuth consent/security and reauthorization UX.
2. Freeze schedule states, DTOs, errors, endpoints, database fields, constraints, and indexes in Documents 08, 12, and 15.
3. Select/pin timezone and worker/queue dependencies through Document 09 supply-chain review.
4. Apply scheduling/outbox/operation/lease migrations in development.
5. Implement pure timezone parsing/conversion and fake-clock tests.
6. Implement schedule API, ownership, eligibility, idempotency, concurrency, and contract tests.
7. Implement outbox dispatcher and worker claim/lease/fencing primitives.
8. Implement provider schedule apply/read/reconcile with current official contract.
9. Implement reschedule, cancellation, missed-job, retry, dead-letter, and disconnection behavior.
10. Add frontend scheduling/review/status/recovery UI.
11. Add structured telemetry, dashboards, runbooks, and test-fired alerts.
12. Run staging time-compressed, DST, crash, race, outage, quota, restore, and real-provider tests before production approval.

No database, dependency, worker, queue, or OAuth change is authorized by this document alone.

## 31. Testing Strategy

### Unit and property tests

- Strict civil date/time parsing, IANA validation, UTC conversion, offset storage, leap days/year boundaries.
- DST nonexistent/ambiguous times in multiple zones and timezone-rule-change fixtures.
- Lead/horizon/cutoff/grace calculations using injected clocks.
- State transition, generation/fencing, eligibility, retry classification/backoff/jitter, request hashes.

### Database and concurrency tests

- Unique active schedule/idempotency/operation constraints.
- Atomic due claim, skip-locked/conditional behavior, lease renewal/expiry, stale fencing rejection.
- Concurrent create/reschedule/cancel/due workers and outbox redelivery.
- Query plans for large due backlogs and owner-scoped pagination.

### Contract and integration tests

- Authentication, cross-owner isolation, stable errors, idempotent replay/mismatch/in-flight result.
- Provider private/never-published eligibility, `publishAt`/privacy request, full status preservation, response validation.
- Missing broader scope, refresh/revocation, provider timeout-before/after-effect, invalid past time, quota/rate/5xx/4xx, policy block.
- Cancellation clears schedule while keeping private; reschedule replaces time; all unknown outcomes reconcile first.

### Worker failure injection

- Crash before/after claim, before/after provider write, before/after persistence, during heartbeat.
- Database unavailable, queue unavailable, outbox lag, duplicate/out-of-order message, stale generation, clock skew.
- Upload/processing completes late, credentials revoked at due time, outage beyond grace, dead-letter replay.

### End-to-end and accessibility tests

- Schedule a private processed test video in multiple timezones; verify one remote schedule and publication near the target.
- Reschedule and cancel from multiple devices; restore state after app/backend/worker restart.
- Show exact absolute local/UTC time, DST correction, late/missed/blocked/reconnect states, accessible announcements/actions.
- Confirm secrets/raw errors/cross-owner timing are absent from APIs, UI, logs, traces, metrics, and queue payloads.

## 32. Acceptance Criteria

- [ ] Scheduling is unavailable until immediate publishing is verified and broader update scope is approved/granted.
- [ ] Only owned private never-published videos with complete metadata can be scheduled.
- [ ] User civil time, IANA timezone, chosen DST offset, and canonical UTC instant are validated and persisted.
- [ ] Nonexistent times are rejected and ambiguous times require explicit resolution.
- [ ] Creation is transactional, idempotent, durable, and independent of client uptime.
- [ ] At-least-once workers use atomic claims, leases, fencing, generation checks, outbox recovery, and bounded batches.
- [ ] YouTube `publishAt` is applied with private status and then provider-verified.
- [ ] Stale workers and racing reschedule/cancel operations cannot overwrite current intent.
- [ ] Past times are never submitted automatically; missed schedules follow the approved safe policy.
- [ ] Timeout/unknown effects are reconciled before any repeated provider update.
- [ ] Cancellation never deletes a video or falsely claims success after publication.
- [ ] Retry, quota, credential, processing, restriction, outage, and dead-letter behavior pass failure tests.
- [ ] User-visible state distinguishes scheduled, applying, provider-scheduled, published, missed, blocked, unknown, and cancelled.
- [ ] Telemetry answers the stated on-call questions without secrets, PII, or unbounded metric labels.
- [ ] All decisions and cross-document contracts are approved and consistent.
- [ ] No other social-platform functionality was added.

## 33. Approval Record

Approval to add this document approves only its documentation baseline. It does not approve expanded OAuth scopes, worker/queue/timezone dependencies, database migrations, infrastructure, background execution, provider calls, or implementation.

## 34. Prerequisites and Next Document

Prerequisites:

- `12-database-design-collections-relations-and-migrations.md`
- `13-security-model-token-encryption-and-threat-controls.md`
- `14-backend-foundation-and-implementation-structure.md`
- `15-backend-api-endpoints-and-error-contract.md`
- `19-video-source-validation-and-upload-workflow.md`
- `20-immediate-publishing-and-youtube-metadata.md`

Next: `22-video-status-synchronization-and-display.md`, defining authoritative state retrieval, polling/reconciliation, processing/publication/restriction mapping, quota-aware synchronization, stale data, and user-visible lifecycle display.

## 35. Change Log

| Version | Date | Change | Approval |
|---|---|---|---|
| 1.0.0 | 2026-08-26 | Source-verified scheduled publishing, worker, and timezone baseline generated and added at user request | User approved document creation only |
