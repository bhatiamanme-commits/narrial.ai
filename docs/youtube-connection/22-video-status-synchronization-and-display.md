# YouTube Connection Module — Video Status Synchronization and Display

## Document Control

| Field | Value |
|---|---|
| Document number | 22 |
| Filename | `22-video-status-synchronization-and-display.md` |
| Module | YouTube Connection only |
| Stage | Stage 10 — Lifecycle synchronization |
| Status | Approved documentation baseline — implementation not authorized |
| Version | 1.0.0 |
| Date | 2026-08-26 |
| Purpose | Define synchronization and display of upload, processing, scheduled, published, private, failed, rejected, and deleted YouTube states |
| Earlier dependencies | Documents 19–21 |
| Operational prerequisite | Upload, publication, and scheduling identifiers are durably stored |
| Next document | `23-errors-retries-reconnection-and-recovery.md` |

## 1. Purpose

This document defines how Narrial retrieves YouTube video state, validates and normalizes provider responses, reconciles them with durable local upload/publication/schedule records, stores status history, and presents accurate, accessible lifecycle states to users.

This is a specification only. It does not install polling dependencies, start workers, create migrations, call YouTube, or implement UI.

## 2. Scope

Included:

- Synchronization after upload, during YouTube processing, before/after scheduled publication, after immediate publication, after reconnect, and during manual refresh.
- Provider `uploadStatus`, `processingStatus`, privacy, `publishAt`, failure, rejection, and absence/deletion evidence.
- Normalized backend state, precedence, freshness, stale/unknown handling, polling cadence, batching, quota protection, retries, events, audit, metrics, alerts, and UI display.
- Recovery when credentials expire, access is revoked, the provider is unavailable, a schedule is missed, or local/provider state diverges.

Excluded:

- View/like/comment analytics, revenue, copyright-management workflows, remote video editing/deletion, captions, playlists, live streams, webhooks that YouTube does not officially provide for these state changes, and other social platforms.
- Treating the frontend as a synchronization worker or provider response as a public DTO.

## 3. Prerequisite and Implementation Gate

Synchronization workers begin only when:

1. Document 19 durably stores owned `uploadId`, `connectionId`, and confirmed `youtubeVideoId` with resumable-upload outcomes.
2. Document 20 durably stores publication metadata, desired/confirmed privacy, and auxiliary outcomes.
3. Document 21 durably stores schedule IDs, target UTC time, provider scheduling state, worker generation, and retry/reconciliation data.
4. Documents 08, 12, 14, and 15 are updated with final normalized states, persistence, worker boundaries, APIs, and errors.
5. Document 16 credential refresh and Document 17 owner/channel/scope validation pass integration tests.
6. Polling cadence, freshness SLO, quota budget, retention, and deletion-confirmation policy in Section 28 are approved.

Current implementation status: **Blocked.**

## 4. Authoritative YouTube Rules

Re-verify official sources at implementation and release time:

- [`videos.list`](https://developers.google.com/youtube/v3/docs/videos/list) retrieves videos by ID, supports `status` and owner-only `processingDetails`, and currently costs one quota unit per request. Owner authorization is required for processing information.
- [YouTube video resource](https://developers.google.com/youtube/v3/docs/videos) defines `status.uploadStatus` values `deleted`, `failed`, `processed`, `rejected`, and `uploaded`; privacy values `private`, `public`, and `unlisted`; upload failure/rejection reasons; and processing values `failed`, `processing`, `succeeded`, and `terminated`.
- [YouTube processing-status guide](https://developers.google.com/youtube/v3/guides/implementation/videos) directs clients to poll `videos.list(part=processingDetails&id=...)` after upload and check `processingDetails.processingStatus`.
- [YouTube quota guidance](https://developers.google.com/youtube/v3/getting-started#quota) states that even invalid requests consume quota and that requested parts/fields should be minimized.
- [YouTube scheduled publishing help](https://support.google.com/youtube/answer/1270709) notes that a restriction can prevent a scheduled video from publishing and leave it private, so passing the scheduled instant is not proof of publication.

Processing progress is estimated. YouTube documents that `partsTotal` can increase, so a computed processing percentage can decrease. The UI must not promise monotonic provider-processing progress.

## 5. Authority and Truth Model

| State area | Authority | Narrial responsibility |
|---|---|---|
| Source validation and transfer to Narrial storage | Narrial | Persist source/upload state from Document 19 |
| Bytes confirmed by resumable session | YouTube upload protocol + Narrial evidence | Persist confirmed ranges; never replace with processing progress |
| YouTube video identity | YouTube response, backend validated | Bind once to owner/upload/connection and reconcile duplicates |
| YouTube upload/processing result | YouTube `status`/`processingDetails` | Normalize, persist freshness and safe failure |
| Desired privacy and schedule | Narrial intent | Preserve user-confirmed intent and version |
| Actual privacy, `publishAt`, restrictions, deletion | YouTube | Reconcile local intent with provider truth |
| User-visible normalized lifecycle | Narrial backend | Combine independent dimensions without hiding conflicts/staleness |

The database is the source of truth for what Narrial requested and last observed. It is not proof of current remote state after its freshness window expires.

## 6. Separate State Dimensions

Do not collapse the lifecycle into one provider string. Persist at least these dimensions:

- `transferStatus`: queued, uploading, interrupted, transferred, cancelled, failed, unknown.
- `youtubeUploadStatus`: uploaded, processed, failed, rejected, deleted, unknown.
- `processingStatus`: processing, succeeded, failed, terminated, unavailable, unknown.
- `privacyStatus`: private, unlisted, public, unknown.
- `scheduleStatus`: none, local pending, applying, provider scheduled, due, published, missed, cancelled, blocked, unknown.
- `publicationStatus`: draft, private ready, publishing, published, partially completed, failed, unknown.
- `connectionHealth`: healthy, reauthorization required, permission required, disconnected, temporarily unavailable.
- `syncHealth`: fresh, stale, syncing, retrying, blocked, failed, unknown.

A derived display state may summarize these dimensions, but the underlying facts remain separately stored and queryable.

## 7. Canonical Provider Snapshot

For every successful synchronization, store a normalized snapshot containing:

- `youtubeVideoId` and verified target connection/channel binding.
- Observed upload status, processing status, privacy status, optional `publishAt`, optional provider published timestamp, and approved thumbnail identity/URL.
- Safe normalized failure/rejection/processing-failure category when applicable.
- Optional processing `partsProcessed`, `partsTotal`, and `timeLeftMs`, explicitly marked estimates.
- `providerObservedAt`, `lastSuccessfulSyncAt`, request/correlation evidence, schema/parser version, and local record version.

Do not persist entire raw responses by default. If short-lived encrypted diagnostic capture is proposed, it requires separate privacy/security approval, access controls, and deletion policy.

## 8. Synchronization Triggers

Synchronization is requested by:

- Final resumable upload response or upload outcome reconciliation.
- Processing poll while the video remains nonterminal.
- Immediate-publication update/timeout reconciliation.
- Schedule apply, due-time verification, missed schedule, reschedule, or cancellation.
- Credential reconnection or connection recovery.
- User manual refresh with rate limiting and request coalescing.
- App foreground/refetch request to the backend; the client does not call YouTube directly.
- Periodic low-frequency reconciliation of eligible nonterminal or recently terminal records.
- Operator-approved replay after an incident.

All triggers produce one deduplicated sync intent. A burst of triggers must not create parallel provider calls for the same video.

## 9. Retrieval Contract

The synchronizer:

1. Claims eligible work atomically with lease, generation/version, and fencing semantics from Document 21.
2. Loads the owned video/publication/schedule/connection aggregate.
3. Authorizes the internal operation and confirms the stored YouTube video belongs to the expected connection/channel.
4. Obtains a valid access token through Document 16; never places it in the job payload.
5. Calls the fixed HTTPS `videos.list` endpoint with explicit video IDs and only approved parts/fields.
6. Requests `status` and the minimum metadata needed for privacy/scheduling. Request `processingDetails` only for owner-authorized videos still requiring processing reconciliation.
7. Batches IDs only when the selected credentials, owner/channel boundary, requested parts, cadence, and error-isolation behavior match.
8. Uses bounded timeout, no automatic blind duplicate call after ambiguous transport outcome where it could amplify load, and approved backoff.
9. Parses every response as untrusted, maps each requested ID independently, and persists results using conditional version/fencing checks.

Search is not used to synchronize known video IDs. Known IDs use `videos.list(id=...)`.

## 10. Provider Response Validation

Validate:

- Top-level resource/list schema, item collection, identifier format, and uniqueness.
- Returned item ID matches a requested ID; unexpected or duplicate IDs are rejected and alerted.
- Status/privacy/processing enums use known values; unknown future values map to `UNKNOWN_PROVIDER_STATE` without crashing or allowing privileged actions.
- Numeric progress fields are nonnegative and within defensible relationships; malformed progress is ignored safely while status remains available.
- Datetimes are valid ISO 8601 instants and bounded plausibly.
- Thumbnail/provider URLs are HTTPS and on an approved YouTube/Google host before rendering/proxying.
- Provider text is never rendered as HTML or promoted directly to stable public error messages.

A partially malformed item fails that item's synchronization, not unrelated valid items in the same batch.

## 11. Provider-to-Narrial Mapping

| YouTube observation | Normalized result | User meaning |
|---|---|---|
| Resumable transfer active | `UPLOADING` | Video bytes are still transferring |
| `uploadStatus=uploaded` + processing `processing` | `PROCESSING` | Upload complete; YouTube is preparing the video |
| Processing `succeeded` + privacy `private` + future `publishAt` | `SCHEDULED` | Private now; YouTube is scheduled to publish it |
| Processing `succeeded` + privacy `private` + no schedule | `PRIVATE` | Ready on YouTube but private |
| Processing `succeeded` + privacy `unlisted` | `UNLISTED` | Available to people with the link |
| Processing `succeeded` + privacy `public` | `PUBLISHED` | Public on YouTube |
| `uploadStatus=failed` or processing `failed` | `FAILED` | YouTube could not upload/process it; safe reason/action shown |
| `uploadStatus=rejected` | `REJECTED` | YouTube rejected the video; safe category shown |
| Explicit `uploadStatus=deleted` | `DELETED` candidate | Provider reports deletion; apply confirmation policy |
| Processing `terminated` | `PROCESSING_UNKNOWN` or provider-terminal mapping | Processing detail is no longer available; reconcile status/privacy |
| Empty/missing item or `404` | `MISSING_UNCONFIRMED` | Cannot yet prove deletion; investigate credentials/access/history |
| Auth/scope failure | `REAUTHORIZATION_REQUIRED` / `PERMISSION_REQUIRED` | Status is stale until account access is restored |
| Provider/quota/network failure | `STALE` or `SYNC_RETRYING` | Last known state shown with timestamp |
| Unknown enum/malformed response | `UNKNOWN_PROVIDER_STATE` | Actions blocked; safe refresh/support guidance |

Final enum names require Document 08 approval.

## 12. State Precedence

Precedence prevents misleading summaries:

1. Ownership/security mismatch blocks display/action and raises an internal security event.
2. Confirmed deletion/rejection/terminal failure overrides scheduling or expected publication.
3. Reauthorization/permission failure controls recovery but does not erase the last known video state.
4. Active transfer is shown before provider processing.
5. Processing failure overrides desired privacy/schedule.
6. Confirmed actual public/unlisted/private visibility overrides local expected visibility.
7. A future confirmed provider `publishAt` plus private privacy maps to scheduled.
8. A past local scheduled instant without public provider confirmation maps to verifying/missed/blocked, never published.
9. Staleness decorates the last known lifecycle state instead of replacing it with false failure.

Local state may advance only from durable local evidence or a validated provider snapshot. Regressions are permitted when provider truth changes, but they create an explicit reconciliation event.

## 13. Upload and Processing Progress

Transfer and processing progress are presented separately:

- Upload progress uses provider-confirmed bytes from Document 19 and should normally be monotonic within a session generation.
- Processing progress uses `partsProcessed / partsTotal` only when both are valid and total is positive.
- Processing percentage is labeled estimated and may decrease when YouTube revises `partsTotal`.
- `timeLeftMs` is optional provider estimate, not a deadline or SLA.
- Missing progress fields use an indeterminate processing indicator.
- Never combine upload bytes and provider processing parts into one fake 0–100 bar.

On completion/failure/rejection, replace progress with the final state and safe action.

## 14. Scheduled-State Reconciliation

For scheduled records:

- Before target: confirm privacy remains private and provider `publishAt` matches the current schedule generation.
- If `publishAt` differs, record drift and apply the approved conflict policy; never silently overwrite a user's YouTube Studio change.
- Near target: increase cadence within quota/SLO limits.
- After target: require provider-confirmed public privacy before `PUBLISHED`.
- If still private, classify processing delay, policy restriction, provider delay, stale sync, or missed schedule from available evidence.
- If unlisted/public unexpectedly, record external/manual change and reconcile local schedule as superseded/published according to approved policy.
- Cancellation/reschedule succeeds only after provider state matches the new intent.

The watch-page date may be displayed differently by YouTube due to Pacific-time behavior. Narrial shows the user's scheduled timezone and the provider-returned timestamp with clear labels.

## 15. Immediate-Publication Reconciliation

After a visibility update or timeout:

- Read the video by ID with owner authorization.
- Compare actual privacy to the frozen desired privacy and current publication generation.
- Persist `PUBLISHED`, `UNLISTED`, or `PRIVATE` only from confirmed provider state.
- If actual state differs, mark drift/unknown and show a recovery action; do not repeat the update until current state and user intent are reconciled.
- Thumbnail and playlist outcomes remain independent and may yield `PARTIALLY_COMPLETED` without downgrading confirmed visibility.

## 16. Deleted and Missing Videos

Deletion is destructive and must not be inferred from one missing response:

- Explicit validated `status.uploadStatus=deleted` is strong deletion evidence but still records observation time/source.
- An empty item list or `videoNotFound` can also result from an invalid ID, access/authorization change, provider inconsistency, or deletion. First verify credential health, channel binding, request correctness, and repeated observations.
- Use an approved confirmation threshold across separated successful authorized checks before changing to `DELETED` when explicit deleted status is unavailable.
- During confirmation, show `Unavailable on YouTube` or `Unable to verify`, not `Deleted`.
- Confirmed deletion is terminal for publication/schedule actions, cancels local pending work, preserves safe history under retention, and does not delete the source automatically unless policy says so.
- Reappearance after confirmed deletion is an anomaly requiring reconciliation, not a silent state rollback.

Exact threshold and operator escalation are approval decisions.

## 17. Failure and Rejection Reasons

Provider reasons are mapped to stable safe categories, not exposed verbatim:

- Upload failure: codec, conversion, empty/invalid/too-small file, upload aborted, or other.
- Rejection: claim, copyright, duplicate, inappropriate, legal, length, terms, trademark, closed/suspended uploader, or other.
- Processing failure: streaming, transcoding, upload delivery, or other.

Public DTOs include a stable code, short user-safe explanation, `isRetryable`, recovery action, and support/reference ID when appropriate. They do not include raw response bodies, internal parser errors, stack traces, or legal conclusions Narrial cannot make.

Terminal provider rejection is never automatically reuploaded. A new user-confirmed upload intent is required if remediation permits another attempt.

## 18. Polling and Adaptive Cadence

Polling is backend-owned and adaptive:

- Fastest while upload just completed and processing is active.
- Moderate while waiting for processing or an imminent schedule.
- Increased briefly around/after scheduled target for verification.
- Slower for stable private videos, partial auxiliary outcomes, or long provider delays.
- Stop regular polling for confirmed terminal states after a final confirmation window.
- Resume on manual refresh, reconnect, reschedule, explicit recovery, or periodic low-frequency audit.

Use jitter to prevent synchronized bursts, cap concurrent provider calls, coalesce duplicate work, batch compatible IDs, and apply per-connection/project quota budgets. Exact intervals, horizons, batch size, and freshness SLO require measured approval; do not hardcode guesses in this document.

## 19. Quota Management

- Track actual current method cost from official documentation/configuration; `videos.list` currently reports one unit per call.
- Budget quota across upload, publication, schedule, connection, and synchronization operations; synchronization cannot consume all capacity.
- Request only necessary `part` values and response `fields`.
- Batch compatible known IDs within documented API limits and authorization boundaries.
- Invalid requests consume quota, so validate locally first.
- Respect quota/rate errors and `Retry-After`; apply a circuit/budget pause rather than retry storms.
- Prioritize active uploads, imminent schedules, unknown outcomes, and user-requested refresh above stable historical items.
- Show last known state with freshness when polling is paused by quota.

Quota values and priorities are operational configuration with documented owners and review dates.

## 20. Synchronization Worker and Concurrency

Workers reuse Document 21's durable outbox, at-least-once delivery, atomic claim, lease, heartbeat, generation/version, and fencing rules.

- A unique active sync key prevents concurrent sync for the same video/connection/part set.
- Trigger bursts update priority/earliest due time rather than creating unbounded rows.
- Provider calls occur outside database transactions.
- Persist a snapshot only if the claimed version/fencing token remains current; otherwise discard and requeue reconciliation.
- State changes and status events commit atomically with any new outbox work.
- Partial batch results are handled per video; one failure does not poison all items.
- Crashes between provider read and persistence are safe to repeat because reads are side-effect free, while rate/quota costs remain controlled.

## 21. Freshness and Staleness

Every safe lifecycle response contains:

- `lastSuccessfulSyncAt`.
- `syncStatus`.
- Optional `nextSyncAt`.
- `isStale` derived by backend policy.
- Safe failure/recovery action when stale or blocked.

Freshness thresholds vary by lifecycle urgency. The UI does not hide old data: it says `Last checked …` and distinguishes `YouTube reports …` from `Narrial expects …`. Client clock is presentation-only; backend determines staleness.

Manual refresh returns/coalesces a durable sync request and a status URL; it does not hold an API request open until YouTube responds. Rate-limited refresh keeps the last known state visible.

## 22. Status Events and History

Append a user-visible status event only for meaningful transition, recovery, significant drift, or approved freshness incident—not every unchanged poll.

Safe event fields: event ID, resource IDs allowed by contract, normalized previous/new state, occurrence/observation time, source category (`NARRIAL`, `YOUTUBE`, `USER`), safe reason code, and correlation/reference ID.

History is owner-scoped, cursor-paginated, immutable except retention/redaction, chronologically deterministic, and separate from privileged audit logs. Tokens, raw responses, worker identity, lease data, provider request IDs if sensitive, metadata bodies, and internal stack traces are excluded.

## 23. API Contract Alignment

Document 15 endpoints remain authoritative:

- `GET /uploads/:uploadId` and `GET /uploads/:uploadId/status-events`.
- `GET /publications/:publicationId` and `GET /publications/:publicationId/status-events`.
- `GET /schedules/:scheduleId` and `GET /schedules/:scheduleId/status-events`.
- `GET /publications/:publicationId/synchronization`.
- Approved manual synchronization mutation, if retained in Document 15, must be owner-scoped and idempotent.

List/detail responses provide normalized dimensions/summary, safe failure, actions, last/next sync, and version. Unknown future enum values are displayed through a generic fallback but are not accepted for mutations.

Proposed errors to reconcile: `YOUTUBE_VIDEO_NOT_FOUND`, `YOUTUBE_VIDEO_UNAVAILABLE`, `YOUTUBE_STATUS_STALE`, `YOUTUBE_SYNC_IN_PROGRESS`, `YOUTUBE_SYNC_RATE_LIMITED`, `YOUTUBE_SYNC_QUOTA_EXHAUSTED`, `YOUTUBE_SYNC_FAILED`, `YOUTUBE_PROVIDER_STATE_UNKNOWN`, `YOUTUBE_VIDEO_STATE_CONFLICT`, and existing reauthorization/permission codes.

## 24. Frontend Display Model

### Summary priority

Each card/row shows:

- Video title/thumbnail fallback and selected channel.
- One plain-language primary state.
- Supporting absolute/relative time and freshness.
- Progress only when meaningful.
- One recommended recovery action where applicable.
- Safe YouTube link only for validated IDs and approved visibility.

### Required user-facing states

| Display state | Example copy | Primary action |
|---|---|---|
| Uploading | `Uploading to YouTube — 42%` | Cancel if eligible |
| Processing | `Uploaded. YouTube is processing the video.` | Refresh/details |
| Scheduled | `Private until 14 Sep, 6:00 PM IST` | Reschedule/cancel if eligible |
| Private | `Ready on YouTube — Private` | Publish/schedule |
| Unlisted | `Published as unlisted` | Open on YouTube |
| Published | `Published on YouTube` | Open on YouTube |
| Failed | `YouTube could not process this video` | Safe retry/new upload guidance |
| Rejected | `YouTube rejected this video` | Details/support guidance |
| Unavailable | `Unable to verify this video on YouTube` | Reconnect/refresh |
| Deleted | `Deleted from YouTube` | View retained local history |
| Stale | Last known state plus `Last checked …` | Refresh/reconnect |
| Unknown | `YouTube returned a status Narrial does not yet support` | Refresh/support |

Copy never says published, deleted, cancelled, or failed without sufficient evidence.

## 25. Loading, Empty, Offline, and Error States

- Initial load uses a content-shaped skeleton with `aria-busy`/accessible loading label.
- Background refresh preserves last data and shows a subtle syncing indicator; it does not blank the list.
- Empty state distinguishes no uploaded videos from filters hiding results.
- Offline shows cached last-known data with time and disables mutations requiring the network.
- Reauthorization/permission errors keep safe history visible and explain that status may be outdated.
- Provider outage/quota state offers bounded retry information without repeated user-triggered calls.
- Per-item error does not replace the entire list with a global error.

## 26. Accessibility and Responsive Behavior

- State is conveyed by text and icon/shape, never color alone.
- Progress has an accessible name/value; indeterminate processing is announced as indeterminate.
- Do not announce every poll or percentage fluctuation. Announce meaningful transitions and user-triggered outcomes through a polite live region; terminal failures may use assertive messaging sparingly.
- Status history uses semantic lists/tables with readable timestamps.
- Actions are native buttons/links with visible focus, disabled/busy semantics, minimum touch targets, and no duplicate activation.
- Long titles, timezones, error copy, RTL text, text scaling, 320 px mobile width, tablet, desktop, light/dark/high-contrast themes are tested.
- Relative times are supplemented by absolute accessible labels.
- Reduced-motion settings disable nonessential progress animation.

## 27. Observability and Operations

On-call questions:

1. What percentage of uploads reach processed/published state, and how long does each stage take?
2. Which videos/schedules are stale, late, unknown, rejected, or blocked, and why?
3. Is synchronization lag caused by queue/worker health, credentials, quota, provider errors, or parsing changes?
4. Are provider/local state conflicts or deletion false positives increasing?

Signals:

- Structured events: sync requested/started/succeeded/unchanged/transitioned/failed/retrying/quota-paused, unknown enum, drift, missing candidate, deletion confirmed, processing/publication latency, with correlation/trace IDs and allowlisted fields.
- Metrics: sync request/error/duration RED metrics; queue depth/oldest age; snapshot freshness; state-transition counts; upload-to-processing and processing-to-publication histograms; stale/unknown/missed/deleted-candidate counts; provider/credential/quota categories; batch size/partial failures.
- Traces: trigger/API → outbox/queue → worker → credential refresh → `videos.list` → database/event, with context across async boundaries.
- Alerts: user-visible freshness SLO breach, scheduled-publication verification delay, unknown/deletion-candidate backlog, sustained processing/provider failures, quota pause threatening deadlines, malformed/unknown provider schema, and worker/queue unavailability. Every alert has owner, severity, justified threshold, runbook, and test-fire evidence.

Metric labels use bounded enums only; never user/video/schedule IDs, titles, raw URLs, timezones, error text, or tokens.

## 28. Decisions Requiring User Approval

| Decision ID | Decision | Recommendation | Blocks |
|---|---|---|---|
| `YT-SYNC-DEC-001` | Freshness SLO by lifecycle | Strict for processing/imminent schedules; relaxed for stable terminal history | Cadence/UI |
| `YT-SYNC-DEC-002` | Adaptive polling intervals and jitter | Measure in staging against freshness and quota | Worker config |
| `YT-SYNC-DEC-003` | Compatible batch size/part grouping | Batch only same credential/parts/priority; isolate per-item result | Provider adapter |
| `YT-SYNC-DEC-004` | Quota budget and priority allocation | Reserve capacity for uploads, imminent schedules, and unknown outcomes | Operations |
| `YT-SYNC-DEC-005` | Missing-to-deleted confirmation | Multiple separated authorized observations plus credential/binding checks | Deletion display |
| `YT-SYNC-DEC-006` | Provider/local drift policy | Preserve provider truth, show conflict, require confirmation before overwrite | Reconciliation |
| `YT-SYNC-DEC-007` | Processing-progress display | Show estimated percentage with regression-safe UI, or indeterminate only | Frontend |
| `YT-SYNC-DEC-008` | Stable terminal polling window | Confirm terminal state, then low-frequency audit/triggered refresh | Quota/retention |
| `YT-SYNC-DEC-009` | Status-event retention and granularity | Meaningful transitions only; retention aligned with privacy/support | Database |
| `YT-SYNC-DEC-010` | Manual refresh rate/coalescing | One active sync per video; return current status and retry time | API/UI |
| `YT-SYNC-DEC-011` | Unknown provider enum behavior | Safe fallback, block mutations, alert, update mapping through change control | Compatibility |
| `YT-SYNC-DEC-012` | Lateness/processing SLOs and alert thresholds | Define from product promise and measured provider behavior | Launch gate |

Recommendations are not approvals. Record accepted decisions in Document 03 and update Documents 08, 12, 15, and 19–21.

## 29. Implementation Order

After the gate opens:

1. Approve Section 28 and freeze dimensions, mappings, precedence, DTOs, errors, freshness, and retention.
2. Update/apply development migrations for snapshots, sync work/attempts, events, indexes, and reconciliation evidence.
3. Implement provider response schemas and pure normalization/precedence functions with exhaustive tests.
4. Implement owner-scoped status/detail/history APIs and safe manual-sync command.
5. Implement deduplicated triggers, outbox, atomic worker claim, batching, lease/fencing, and adaptive cadence.
6. Implement authenticated `videos.list` adapter with minimal parts/fields and per-item validation.
7. Implement processing, publication, scheduling, missing/deletion, drift, reconnect, and unknown-state reconciliation.
8. Implement frontend list/detail/progress/freshness/history/recovery states.
9. Add quota controls, logs, metrics, traces, dashboards, runbooks, and test-fired alerts.
10. Run staged provider, failure-injection, load, quota, restore, accessibility, and acceptance tests.

All dependency installation remains governed by Document 09. This document authorizes none.

## 30. Testing Strategy

### Unit and mapping tests

- Every documented and unknown upload/processing/privacy state combination.
- Precedence across failed/rejected/deleted/processing/scheduled/private/unlisted/public/stale/reconnect dimensions.
- Provider-processing percentage increase/decrease, missing/zero/malformed totals, and time estimates.
- Safe reason mapping, datetime/URL/ID validation, freshness thresholds, cadence/jitter/priority.

### Contract and integration tests

- Owner authorization, cross-owner non-enumeration, expired/revoked/missing-scope credentials.
- Minimal `videos.list` query parts/fields, ID batching, partial/missing/unexpected/duplicate items, malformed responses, unknown enums.
- Upload → processing → succeeded → private/unlisted/public; failure/rejection/terminated paths.
- Schedule future/matching/drift/due/still-private/public/cancelled/rescheduled paths.
- Timeout, 5xx, rate/quota, worker crash, queue redelivery, lease expiry, stale generation, database failure.
- Missing item repeated confirmation, credential recovery, explicit deleted status, false-positive prevention, reappearance anomaly.

### Frontend and accessibility tests

- Every state in Section 24 plus initial/background loading, empty/filter-empty, offline, stale, partial-item error, unknown.
- No optimistic terminal status; foreground refetch and manual-refresh coalescing.
- Screen reader progress/status/history, focus, keyboard/touch, contrast, text scaling, RTL, reduced motion, responsive sizes.

### Operational tests

- Large active-video population, compatible batching, due-priority fairness, quota exhaustion/recovery, retry storm control.
- Dashboard values match injected events; trace remains connected; secret/PII redaction verified.
- Test-fire every new alert and exercise its runbook.
- Backup/restore reconstructs sync work, snapshots, history, and priorities without duplicate state effects.

## 31. Acceptance Criteria

- [ ] Upload, processing, privacy, schedule, publication, connection, and sync states remain separate and correctly summarized.
- [ ] Known YouTube states map exhaustively; unknown values fail safely without crashing or enabling actions.
- [ ] Processing progress is explicitly estimated and may regress without misleading the user.
- [ ] Scheduled publication is marked published only after provider-confirmed public visibility.
- [ ] One missing/404 observation never becomes confirmed deletion.
- [ ] Last-known state, last sync time, staleness, and recovery action are always clear.
- [ ] Synchronization is durable, deduplicated, owner-authorized, batched safely, lease/fenced, and restartable.
- [ ] Provider calls use known IDs, minimal parts/fields, validated responses, and quota-aware cadence.
- [ ] Failure/rejection reasons are stable, safe, useful, and never raw provider payloads.
- [ ] Status/history APIs and UI prevent cross-owner disclosure and terminal-state optimism.
- [ ] Loading, empty, offline, stale, unknown, partial-error, progress, and terminal states pass accessibility/responsive tests.
- [ ] Telemetry answers on-call questions without secrets, PII, or high-cardinality labels.
- [ ] All Section 28 decisions and cross-document updates are approved.
- [ ] No other-platform synchronization was introduced.

## 32. Approval Record

Approval to add this document approves only the documentation baseline. It does not approve database changes, dependencies, workers, polling intervals, quota allocation, provider calls, deletion policy, or implementation.

## 33. Prerequisites and Next Document

Prerequisites:

- `19-video-source-validation-and-upload-workflow.md`
- `20-immediate-publishing-and-youtube-metadata.md`
- `21-scheduled-publishing-workers-and-timezones.md`

Inherited prerequisites include Documents 08, 12–17 wherever state, persistence, security, credentials, APIs, and worker contracts are affected.

Next: `23-errors-retries-reconnection-and-recovery.md`, defining the shared error taxonomy, retry/recovery policy, dead-letter handling, disconnected/revoked/expired account behavior, user guidance, support diagnostics, and operational escalation.

## 34. Change Log

| Version | Date | Change | Approval |
|---|---|---|---|
| 1.0.0 | 2026-08-26 | Source-verified video status synchronization and display baseline generated and added at user request | User approved document creation only |
