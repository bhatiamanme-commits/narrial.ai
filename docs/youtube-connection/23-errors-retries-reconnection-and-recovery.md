# YouTube Connection Module — Errors, Retries, Reconnection, and Recovery

## Document Control

| Field | Value |
|---|---|
| Document number | 23 |
| Filename | `23-errors-retries-reconnection-and-recovery.md` |
| Module | YouTube Connection only |
| Stage | Stage 11 — Resilience hardening |
| Status | Approved documentation baseline — implementation not authorized |
| Version | 1.0.0 |
| Date | 2026-08-26 |
| Purpose | Define error taxonomy, retry eligibility, backoff, idempotency, dead-letter handling, expired permissions, reconnection, and user recovery |
| Earlier dependencies | Documents 15–22 |
| Operational prerequisite | Principal connection, upload, publication, scheduling, and synchronization workflows exist |
| Next document | `24-security-privacy-quota-and-compliance-operations.md` |

## 1. Purpose

This document establishes one production-wide resilience contract for every YouTube Connection workflow. It defines how failures are classified, exposed, retried, reconciled, dead-lettered, recovered after restart, and explained to users. It also defines how expired/revoked credentials and insufficient permissions pause work and resume safely after reconnection.

This is documentation only. It does not implement retry loops, create queues, change database schemas, install dependencies, change OAuth scopes, reconnect accounts, or call external services.

## 2. Scope

Included:

- Narrial authentication, authorization, validation, ownership, concurrency, idempotency, database, storage, worker, network, OAuth, YouTube, quota/rate, processing, scheduling, cancellation, deletion, and internal failures.
- Stable public error envelopes/codes and private diagnostic categories.
- Retryability, exponential backoff with jitter, `Retry-After`, attempt/elapsed limits, circuit/budget controls, unknown outcomes, and reconciliation.
- Dead-letter quarantine, replay authorization, runbooks, audit, metrics, alerts, and incident evidence.
- Account states requiring reconnect, incremental permission, or a fresh OAuth connection.
- Preservation/resumption of eligible uploads, publications, schedules, and synchronization work after recovery.

Excluded:

- Platform-generic social errors, automated remote video deletion, compensation that changes YouTube without explicit authorization, customer-support tooling implementation, and a specific queue/observability vendor.
- Hiding failures behind endless retries or automatically broadening OAuth permissions.

## 3. Prerequisite and Implementation Gate

Resilience hardening begins only after principal happy paths exist in development and their contracts are frozen:

1. Document 15 defines the stable API envelope, HTTP mapping, endpoint idempotency, and error codes.
2. Documents 16–18 implement and test authentication, OAuth lifecycle, connection/channel management, and reconnection UI boundaries.
3. Documents 19–22 implement durable upload, immediate publication, scheduling, and status synchronization identities/state.
4. Document 12 supports attempts, operations, idempotency, outbox, dead-letter, events, audits, and conditional version/fencing updates.
5. Document 13 controls tokens, sensitive errors, logs, operator access, and threat mitigations.
6. Section 32 decisions are approved and reconciled across Documents 03, 08, 12, and 15–22.

Current implementation status: **Blocked.**

## 4. Authoritative External Rules

Re-verify these official sources during implementation and release review:

- [Google OAuth web-server guidance](https://developers.google.com/identity/protocols/oauth2/web-server) states that a refresh-token `invalid_grant` can require fresh user authentication/consent; authorization-code `invalid_grant` requires restarting authorization; granted scopes must be checked because users may grant only a subset.
- [Google OAuth overview](https://developers.google.com/identity/protocols/oauth2) lists refresh-token invalidation/expiry causes, including revoked access, inactivity, token-count limits, time-based grants, admin policy, and session-control expiry; session-control failures may include `invalid_rapt` and require a new authentication session.
- [Google OAuth error guidance](https://developers.google.com/identity/oauth2/web/guides/error) distinguishes user denial such as `access_denied` from configuration and browser-flow errors.
- [YouTube resumable uploads](https://developers.google.com/youtube/v3/guides/using_resumable_upload_protocol) requires status probing/resume after interruption, exponential backoff for `500`, `502`, `503`, and `504`, respect for `Retry-After`, and new-session handling after an expired-session `404`.
- [YouTube Data API errors](https://developers.google.com/youtube/v3/docs/errors) defines general categories including `quotaExceeded`, `insufficientPermissions`, authorization, validation, and method-specific failures.
- [YouTube quota guidance](https://developers.google.com/youtube/v3/getting-started#quota) notes that invalid requests also consume quota, so local validation and retry control are required.

Provider reason strings are diagnostic input, not stable Narrial contracts. Unknown provider codes fail safely and are surfaced operationally.

## 5. Resilience Principles

| ID | Principle |
|---|---|
| `YT-RES-INV-001` | Every error is classified by layer, effect certainty, retryability, user action, and security sensitivity. |
| `YT-RES-INV-002` | A timeout is not proof of failure; every external mutation has success, failure, and unknown outcomes. |
| `YT-RES-INV-003` | Unknown effects are reconciled before repeating a provider mutation. |
| `YT-RES-INV-004` | Retry belongs to the operation owner; nested layers do not independently multiply attempts. |
| `YT-RES-INV-005` | State-changing retries require durable intent and idempotency before the first effect. |
| `YT-RES-INV-006` | Automatic retry is bounded by attempts, elapsed time, deadline, quota, and safety. |
| `YT-RES-INV-007` | Reconnection restores authority; it does not silently repeat, cancel, publish, or delete work. |
| `YT-RES-INV-008` | Terminal failure preserves evidence and safe user history under retention policy. |
| `YT-RES-INV-009` | Dead-letter replay is privileged, audited, fenced, and reconciliation-first. |
| `YT-RES-INV-010` | Public errors reveal no credentials, raw provider payload, cross-owner existence, internals, or stack traces. |
| `YT-RES-INV-011` | Users always receive an honest state, safe next action, and support reference when action is unavailable. |
| `YT-RES-INV-012` | Retry storms cannot consume all workers, storage, bandwidth, database capacity, or YouTube quota. |

## 6. Error Dimensions

Every internal error record carries bounded values for:

- `layer`: client, API, auth, authorization, validation, database, storage, queue, worker, OAuth, YouTube upload, YouTube Data API, quota/rate, configuration, internal.
- `operation`: connect, callback, refresh, channel discovery, disconnect, source, upload, publish, thumbnail, playlist, schedule, synchronization.
- `effectCertainty`: `NO_EFFECT_CONFIRMED`, `EFFECT_CONFIRMED`, `EFFECT_UNKNOWN`, `NOT_APPLICABLE`.
- `retryClass`: `NO_RETRY`, `AUTOMATIC_RETRY`, `RECONCILE_THEN_RETRY`, `USER_ACTION_REQUIRED`, `OPERATOR_ACTION_REQUIRED`.
- `severity`: user-correctable, transient degradation, terminal operation, security event, service incident.
- `safeCode`, `httpStatus`, `isRetryable`, optional `retryAfter`, `recoveryAction`, attempt/deadline data, correlation/reference ID.
- Private diagnostic category/cause chain stored only where approved and redacted.

HTTP status alone never determines retryability. For example, some `403` responses mean quota exhaustion, missing permission, or permanent policy rejection and require different behavior.

## 7. Public Error Envelope

All APIs use Document 15's stable envelope:

```json
{
  "error": {
    "code": "YOUTUBE_REAUTHORIZATION_REQUIRED",
    "message": "Reconnect this YouTube channel to continue.",
    "details": {
      "recoveryAction": "RECONNECT_ACCOUNT"
    },
    "requestId": "safe-correlation-reference"
  }
}
```

Rules:

- `code` is stable, documented, and machine-readable.
- `message` is concise, user-safe, localizable, and never relied on programmatically.
- `details` uses a per-code allowlisted schema; no arbitrary objects/provider responses.
- `requestId` is safe for support correlation and does not encode user/resource data.
- Long-running resources also expose normalized status, `isRetryable`, next retry time, and recovery action.
- Unknown/unmapped internal errors return `INTERNAL_ERROR` with no internals and generate an operational event.

## 8. HTTP Mapping

| HTTP | Meaning in this module |
|---|---|
| `400` | Malformed syntax/unsupported request shape |
| `401` | Narrial authentication absent/expired/invalid |
| `403` | Authenticated but not permitted, missing Google permission, or policy restriction with a stable distinguishing code |
| `404` | Owner-scoped resource unavailable; never confirms another owner's resource |
| `409` | Active operation, lifecycle, version, or in-flight idempotency conflict |
| `422` | Semantically invalid metadata/source/time/idempotency-key reuse |
| `429` | Narrial/provider rate limit with safe retry guidance when known |
| `500` | Unexpected internal invariant/error; no stack trace |
| `502` | Invalid/unavailable upstream response where proxy semantics apply |
| `503` | Temporary dependency/worker/quota-capacity unavailability |
| `504` | Bounded upstream timeout; effect certainty remains in resource state |

Asynchronous mutation acceptance uses `202` and a status URL. A later operation failure is represented on that resource, not retroactively as an HTTP failure.

## 9. Complete Error Taxonomy

### 9.1 Authentication and ownership

- `AUTHENTICATION_REQUIRED`, `AUTHENTICATION_INVALID`, `AUTHENTICATION_EXPIRED`.
- `FORBIDDEN`, `RESOURCE_NOT_FOUND`, `OWNERSHIP_MISMATCH`, `CHANNEL_TARGET_MISMATCH`.
- Cross-owner probes return the approved non-enumerating response and produce a security audit event.

### 9.2 Input and lifecycle validation

- `VALIDATION_ERROR`, `INVALID_STATE_TRANSITION`, `CONCURRENCY_CONFLICT`, `ACTIVE_OPERATION_CONFLICT`.
- Document 15 source/metadata/time/schedule codes remain canonical.
- User-correctable validation is never automatically retried.

### 9.3 Idempotency

- `IDEMPOTENCY_KEY_REQUIRED`, `IDEMPOTENCY_KEY_INVALID`, `IDEMPOTENCY_KEY_REUSED`, `IDEMPOTENT_REQUEST_IN_PROGRESS`.
- Same key/different canonical body is terminal caller error; never replay a different effect.

### 9.4 OAuth and credentials

- `OAUTH_ACCESS_DENIED`: user declined; no automatic browser restart.
- `OAUTH_STATE_INVALID`, `OAUTH_TRANSACTION_EXPIRED`, `OAUTH_CALLBACK_REPLAYED`: security/lifecycle failures; start a new explicit attempt.
- `OAUTH_CONFIGURATION_ERROR`, `OAUTH_REDIRECT_MISMATCH`, `OAUTH_CLIENT_INVALID`: operator/configuration action; do not tell user to retry endlessly.
- `OAUTH_CODE_INVALID`: consumed/invalid code; new authorization attempt required.
- `YOUTUBE_TOKEN_REFRESH_TEMPORARY_FAILURE`: preserve credentials and retry within bounds.
- `YOUTUBE_REAUTHORIZATION_REQUIRED`: refresh token invalid/revoked/expired/session-controlled; pause privileged work.
- `YOUTUBE_PERMISSION_REQUIRED`: credential valid but a required approved scope was not granted.
- `YOUTUBE_CONNECTION_DISCONNECTED`: no credential use permitted.

### 9.5 Storage and upload

- Existing source/file errors from Documents 15/19.
- `YOUTUBE_UPLOAD_SESSION_EXPIRED`, `YOUTUBE_UPLOAD_INTERRUPTED`, `YOUTUBE_UPLOAD_OUTCOME_UNKNOWN`, `YOUTUBE_UPLOAD_NOT_RETRYABLE`, `YOUTUBE_UPLOAD_REJECTED`.
- An expired resumable URI can require a new session and byte-zero restart only after duplicate-risk reconciliation.

### 9.6 Publication, schedule, and synchronization

- Metadata, thumbnail, playlist, privacy, schedule, missed, processing, provider-state, stale, deletion-candidate, and synchronization errors defined in Documents 20–22.
- Provider policy/processing/rejection failures are distinct from transport failures.

### 9.7 Rate, quota, dependency, and internal

- `RATE_LIMITED`, `YOUTUBE_RATE_LIMITED`, `YOUTUBE_QUOTA_EXHAUSTED`, `DEPENDENCY_UNAVAILABLE`, `DATABASE_UNAVAILABLE`, `STORAGE_UNAVAILABLE`, `QUEUE_UNAVAILABLE`, `WORKER_CAPACITY_EXCEEDED`, `INTERNAL_ERROR`, `CONFIGURATION_ERROR`.
- Quota exhaustion is not a rapid retry; use the approved reset/escalation policy.

## 10. Retry Classification Matrix

| Condition | Automatic? | Required action before next attempt |
|---|---:|---|
| Client offline before request | No backend retry | Preserve draft; user/app retries when online |
| Narrial `401` | No | Refresh Narrial session/sign in |
| Validation/ownership/permanent policy error | No | Correct input/authority or stop |
| Optimistic version/active-operation conflict | Limited client refetch | Fetch latest state; do not blindly resubmit |
| DB/storage/queue transient failure before effect | Yes | Bounded retry/circuit capacity check |
| Provider read timeout/5xx | Yes | Bounded retry; reads are repeatable but quota-aware |
| Provider mutation timeout | Not directly | Reconcile effect, then retry only if no effect confirmed |
| Google token endpoint temporary failure | Yes | Single-flight refresh, bounded backoff |
| Refresh `invalid_grant`/revocation/session control | No | Reauthorize user |
| Missing approved scope | No | Explicit incremental permission/reconnect |
| OAuth user denial | No | Return to safe UI; user may start again |
| Resumable upload `500/502/503/504` | Yes | Probe committed range; backoff; resume next byte |
| Resumable session `404` | Conditional | Reconcile duplicate risk; new session if safe |
| YouTube `429`/valid `Retry-After` | Yes, bounded | Respect header and shared rate budget |
| YouTube quota exhausted | No immediate retry | Wait known recovery window/operations action |
| Processing/rejection/invalid media | No blind retry | Show remediation; new user-confirmed intent if allowed |
| Schedule past/missed | No automatic provider write | Apply approved missed policy/user decision |
| Unknown provider enum/malformed response | No mutation | Safe state, alert, parser/contract update |

## 11. Retry Ownership and Budgets

Exactly one layer owns retries for an operation:

- HTTP client adapters perform no hidden mutation retries.
- Service orchestration classifies effect certainty.
- Durable workers own background retry scheduling.
- Frontend retries only safe reads or explicit user commands and reuses the logical idempotency key.
- Infrastructure proxy/load balancer mutation retries are disabled unless proven safe and documented.

Each operation has one shared budget: maximum attempts, maximum elapsed time, deadline, maximum delay, quota allowance, and concurrency allowance. Nested storage/database/provider retries consume that budget and are visible. Attempt counters never reset merely because work moves between queue, worker, or manual recovery.

## 12. Exponential Backoff and Jitter

Recommended algorithm is full jitter:

`delay = random(0, min(maxDelay, baseDelay × 2^attemptIndex))`

Rules:

- Cap exponent/overflow and validate configuration.
- If a trustworthy `Retry-After` is present, respect it subject to security validation and the operation deadline; do not schedule in the past.
- Use distinct configuration by dependency/operation; never one universal retry loop.
- Persist `nextAttemptAt` for durable work; do not block a worker with long sleeps.
- Add random jitter to polling and bulk recovery to prevent thundering herds.
- Stop when attempt, elapsed-time, deadline, cancellation, generation, quota, or safety limits are reached.
- Retry configuration is environment-controlled, bounded, observable, and approved; exact numeric values are not guessed here.

## 13. Idempotency Contract

All state-changing API and worker commands identified in Document 15 use durable idempotency:

1. The initiating client/event creates one key per logical intent and reuses it across delivery attempts.
2. Backend canonicalizes security-relevant input and hashes it.
3. Atomically insert `(owner, operationType, key)` under a unique constraint before effects.
4. Same key/same hash replays safe status/result.
5. Same key/different hash returns `IDEMPOTENCY_KEY_REUSED`.
6. In-flight duplicate returns approved conflict/pending response with status URL.
7. Operation stores success, failure, or unknown effect plus reconciliation state.
8. Retention outlives all API, queue, dead-letter, manual replay, provider uncertainty, and support-recovery paths.

Upload creation, publication, schedule/reschedule/cancel, disconnect/revoke, thumbnail, playlist, retry commands, and worker provider writes receive separate operation identities. A retry command never creates a new upload/video/publication intent accidentally.

## 14. Unknown Outcome Protocol

For any external mutation that times out, loses connection, returns malformed success, or crashes before persistence:

1. Persist/retain `OUTCOME_UNKNOWN`; never mark failed automatically.
2. Stop duplicate mutations for the resource/generation.
3. Record safe attempt/correlation evidence before losing the lease.
4. Read provider state using the strongest stable identifiers available.
5. If effect is confirmed, persist success exactly once.
6. If no effect is confirmed and retry remains safe, retry under the same operation identity.
7. If evidence is insufficient, continue bounded reconciliation then dead-letter/escalate; never guess.

Examples: probe upload session/range; look up confirmed video ID; read actual privacy/`publishAt`; check thumbnail status; verify playlist membership; read revocation/connection state where possible.

## 15. Worker Attempt Lifecycle

Proposed attempt states:

`READY → CLAIMED → RUNNING → SUCCEEDED`

Branches:

- `RETRY_SCHEDULED`, `WAITING_FOR_REAUTHORIZATION`, `WAITING_FOR_QUOTA`, `OUTCOME_UNKNOWN`, `DEAD_LETTERED`, `CANCELLED`, `TERMINAL_FAILED`.

Workers use atomic claims, bounded batches, lease/heartbeat, monotonically increasing fencing token, expected resource generation/version, and conditional writes from Document 21. A stale worker cannot persist or dispatch follow-up after lease expiry/reschedule/cancel.

Provider calls remain outside database transactions. State/event/outbox changes commit atomically. At-least-once queue delivery is assumed and tested.

## 16. Dead-Letter Handling

Dead-letter is durable quarantine, not deletion and not an automatic retry queue. Move work there when:

- Attempts/elapsed deadline are exhausted.
- The same unknown outcome cannot be reconciled within policy.
- Provider response is unsupported/malformed repeatedly.
- A poison message or invariant violation recurs.
- Required configuration/infrastructure remains unavailable past threshold.

Dead-letter record contains internal resource/operation IDs, generation, bounded category/code, attempt/timing summary, safe evidence references, next recommended action, first/last occurrence, and version. It contains no tokens, session URI, raw provider response, video bytes, metadata body, or queue secrets.

Replay requirements:

1. Privileged operator authentication and authorization.
2. Linked incident/ticket and recorded reason.
3. Current ownership/resource/generation/credential checks.
4. Reconciliation/dry-run first for provider mutations.
5. Fresh fencing/operation attempt without changing logical idempotency.
6. Rate/quota/concurrency limits and staged batch size.
7. Full audit and post-replay verification.

Bulk replay requires separate approval and a stop condition. Editing a dead-letter payload by hand is prohibited.

## 17. Credential Health Model

Maintain safe credential status separately from connection and operation state:

- `VALID`: access usable or refreshable.
- `REFRESHING`: one backend refresh in progress.
- `TEMPORARILY_UNAVAILABLE`: transient token endpoint/network failure; preserve envelope.
- `REAUTHORIZATION_REQUIRED`: `invalid_grant`, revocation, expiry, session-control requirement, missing refresh token, or confirmed invalid credential.
- `PERMISSION_REQUIRED`: credential works but required approved scope absent.
- `DISCONNECTED`: credentials destroyed/disabled; no privileged work.
- `UNKNOWN`: health cannot be established; block unsafe mutations.

Do not expose token expiry, refresh-token presence, raw OAuth errors, or encryption details publicly. Return only safe status and action.

## 18. Refresh Failure Handling

- Refresh is backend-only, single-flight per connection, with row/advisory lock and version checks from Document 16.
- Proactively refresh within the approved skew, but treat access-token expiry during a call as recoverable once.
- Temporary network/5xx/token-service failure preserves encrypted credentials and schedules bounded retry.
- `invalid_grant` is not retried repeatedly. Classify reauthorization required, stop privileged provider work, preserve safe pending intent/history, and notify once with deduplication.
- `invalid_rapt` or other session-control indication requires a fresh interactive authentication session.
- Missing scopes become permission required; do not request unapproved broader scopes automatically.
- A successful refresh atomically replaces encrypted access material while preserving refresh token if Google omits a new one.

## 19. Reconnection Flow

Reconnection uses the Document 16 connection-bound reauthorization flow:

1. User selects `Reconnect YouTube` or `Grant permission` on the affected channel.
2. Backend authenticates Narrial user, verifies connection ownership, state, environment, and approved requested scopes.
3. Backend creates a fresh one-time OAuth transaction with state/PKCE and returns an allowlisted authorization URL.
4. System browser obtains explicit Google authentication/consent; denial/cancel returns safely without destroying existing recoverable state.
5. Callback validates/consumes the transaction, exchanges once, validates scopes/tokens, retrieves canonical channel identity, and prevents different-channel takeover.
6. Credentials are encrypted and connection status updated transactionally; prior envelope is rotated/destroyed under Document 13.
7. Backend enqueues channel/status reconciliation and eligible pending-operation recovery.
8. Client treats return as a refetch signal and displays backend-confirmed outcome.

If Google returns a different YouTube channel, do not overwrite the existing connection or resume its work. Show mismatch and require explicit connect-as-new behavior if allowed.

## 20. Recovery of Pending Work After Reconnection

Reconnection does not itself retry effects. For each pending resource:

- Reauthorize current owner and verify the connection still maps to the same YouTube channel.
- Verify newly granted scopes cover the operation.
- Reload current generation/state and ensure it was not cancelled, superseded, expired, or completed elsewhere.
- Reconcile provider state before resuming any unknown mutation.
- Revalidate source availability, upload session, metadata, processing state, schedule deadline/missed policy, and quota.
- Resume only automatically eligible operations under their original durable intent and attempt budget.
- Operations requiring changed privacy, missed schedule choice, new upload after rejection/session expiry uncertainty, or broader permission require explicit user confirmation.
- Record recovery event and notify state transition without duplicating earlier notifications.

## 21. Disconnected Account Behavior

When disconnected:

- Block new provider operations immediately.
- Stop using/decrypting credentials and cancel/park queued work safely.
- Preserve source, upload, publication, schedule, and status history according to approved retention.
- Clearly identify which local work is paused/cancelled and whether an already-applied YouTube schedule may still run externally.
- Never claim remote video/schedule deletion unless provider-confirmed before credential destruction.
- Offer connect/reconnect only through a new explicit OAuth flow.

Reconnecting after deliberate disconnection is a new grant and must not silently resume previously cancelled work unless the user explicitly confirms the approved policy.

## 22. Workflow-Specific Recovery Matrix

| Workflow | Recoverable state | Recovery |
|---|---|---|
| OAuth callback | Denied/expired/replayed | Start a fresh explicit transaction; never reuse code/state |
| Channel discovery | Temporary provider failure | Retry read; on missing permission reconnect |
| Source transfer | Interrupted/expired grant | Resume/reissue narrowly scoped storage grant after ownership check |
| Resumable upload | Interrupted/5xx | Probe range, refresh credential, resume next confirmed byte |
| Expired upload session | Session `404` | Reconcile duplicate risk; new session/byte-zero only if safe |
| Upload unknown | Timeout/crash | Probe/reconcile; block new `videos.insert` until resolved |
| Processing | Stale/provider outage | Adaptive status retry; retain last-known state |
| Immediate publish | Update timeout | Read privacy before repeating; require scope/reauth if needed |
| Thumbnail | Rate/timeout | Read/reconcile thumbnail then bounded retry; publication remains |
| Playlist | Permission/partial failure | Reauthorize approved scope or retry one placement; video remains |
| Scheduled publish | Credentials/outage before apply | Recover within approved deadline/missed policy |
| Missed schedule | Target passed | Keep private; user chooses publish now/reschedule unless grace policy approves |
| Status sync | Quota/provider/credential failure | Show stale timestamp; prioritize/retry/reconnect safely |
| Suspected deletion | Missing item | Repeat authorized checks; never restore/delete automatically |

## 23. Frontend Recovery Experience

Every error presentation includes:

- What happened in plain language.
- What is known versus unknown.
- Whether existing upload/video/schedule state is preserved.
- One primary safe action (`Try again`, `Reconnect YouTube`, `Grant permission`, `Refresh status`, `Reschedule`, `Contact support`).
- Optional secondary cancel/back action.
- `Last checked`/next retry when relevant and a support reference ID.

Rules:

- Validation appears inline and focuses the first invalid field.
- Background retry keeps last known data visible; do not replace the whole screen with a spinner.
- Disable duplicate actions while in flight and reuse idempotency keys.
- Do not show retry for terminal policy/rejection/ownership errors.
- Reconnect copy names the channel and paused capabilities; permission copy explains only the approved additional access.
- Browser denial/cancel is not a scary failure; return to the previous safe screen.
- Unknown outcome copy prevents users from creating duplicates while Narrial verifies YouTube.
- Accessibility uses semantic alerts/live regions, text plus icons, focus management, readable countdown/absolute retry time, and no rapid retry announcements.

## 24. API and State Contract Alignment

Documents 08 and 15 must freeze:

- Public error enum, HTTP status, detail schema, recovery action enum, and localization keys.
- Operation effect certainty/retry status and resource-level failure fields.
- Reauthorization/permission/connection statuses.
- Retry/cancel/manual-recovery endpoints from Documents 15 and 19–22.
- Status event history and support reference behavior.

GET/list responses may return stale resources plus safe sync/connection failure. Mutations fail before effects when authentication/ownership/permission is invalid. `Retry-After` is exposed only when trustworthy and useful; client backoff must still be bounded.

Unknown server codes render a generic safe fallback, are captured operationally, and never enable a privileged action.

## 25. Persistence Requirements

Document 12 must support:

- Operation identity, owner/resource/generation, request hash, effect certainty, status, first/last attempt, next attempt, deadline, result/failure category, reconciliation evidence, retention.
- Attempt records with layer/operation/retry class, start/end, safe outcome, lease/fencing and correlation reference.
- Dead-letter records and privileged replay audit.
- Connection credential/permission status and reauthorization transitions.
- Deduplicated user notifications and safe status/audit events.
- Outbox commands and recovery scans after restart.

Constraints include unique idempotency/operation keys, valid state-dependent fields, nonnegative bounded attempts, monotonic versions/generations, owner-consistent references, and indexed retry/dead-letter/reconnection queries.

## 26. Circuit Breakers, Load Shedding, and Bulkheads

- Use separate concurrency/rate budgets for OAuth, YouTube reads, uploads, writes, storage, database, and user-triggered refresh.
- Circuit breakers are dependency/operation specific and transition through closed/open/half-open using approved thresholds.
- Opening a circuit fails fast or parks durable work with retry time; it never discards intent.
- Half-open probes are tightly limited and read-only where possible.
- Prioritize imminent schedules, unknown effects, active uploads, and credential recovery above low-priority historical synchronization.
- Apply per-user/per-connection fairness so one account cannot monopolize workers/quota.
- Load shedding returns safe `503`/`429` for new low-priority work while preserving accepted durable work.

Circuit state is not a security bypass and does not convert terminal errors into retryable ones.

## 27. Notifications

Notify users only for actionable or meaningful transitions: reauthorization/permission required, upload terminal failure, publication outcome, schedule missed/blocked/published, dead-letter requiring support, or recovered operation.

- Deduplicate by resource + transition/generation.
- Do not send on every retry/poll.
- Use approved in-app/email/push channels only after preference/privacy decisions.
- Never include tokens, raw provider reasons, private metadata, signed URLs, or unnecessary video/channel details.
- Recovery notification must reflect provider-confirmed state.

Exact channels, timing, templates, and retention require approval.

## 28. Observability and Runbooks

On-call questions:

1. Which operations fail, where, and with what effect certainty?
2. Are retries recovering users or amplifying a dependency incident?
3. How many connections require reauthorization and how much work is paused?
4. What is in dead letter, how old is it, and can it be replayed safely?

Required telemetry:

- Structured events for error classified, retry scheduled/exhausted/recovered, unknown outcome/reconciled, circuit transition, dead-letter/replay, credential invalid/reauthorized, work resumed/blocked.
- RED metrics for endpoints/dependencies; retry rate/success/exhaustion and delay histograms; attempts per operation; unknown-outcome age; dead-letter count/oldest age; reauthorization count/age; paused-work count; circuit/load-shed/quota events.
- Traces from API/browser return through database/outbox/worker/credential/provider/reconciliation with safe propagated context.
- Symptom alerts for user-visible failure/recovery SLO, retry storms, unknown-effect backlog, imminent schedule blocks, dead-letter growth, widespread reauthorization, and circuit-open duration. Every alert has an owner, tested runbook, justified threshold, and page/ticket severity.

Runbooks include evidence queries, affected workflows, safety checks, reconciliation method, replay/rollback boundary, escalation owner, user-communication trigger, and verification. Telemetry never contains secrets, raw bodies, user/video IDs as metric labels, or unbounded error text.

## 29. Security and Abuse Controls

- Authenticate/authorize retry, cancel, reconnect, recovery, status, and operator replay independently.
- Rate-limit user retries/reconnect starts/manual refresh; coalesce repeated triggers.
- Bind OAuth transaction/return to owner, connection, environment, state digest, PKCE, expiry, and one-time consumption.
- Never accept provider error text as executable instruction, URL, redirect, or UI HTML.
- Redact authorization codes, access/refresh tokens, resumable URIs, signed storage URLs, cookies, raw request/response bodies, encryption material, and sensitive identifiers.
- Protect support/admin tooling with least privilege, step-up authentication where approved, reason/audit, no direct secret viewing, and bounded replay.
- Detect cross-owner retries/reconnects, idempotency abuse, retry flooding, poisoned jobs, and malformed provider responses as security events.
- Retain only necessary failure evidence and support privacy export/deletion across logs, attempts, dead letters, notifications, and backups.

## 30. Diagnostic and Incident Process

When an unexpected failure appears:

1. Stop risky rollout/replay or feature expansion.
2. Preserve redacted evidence: request/reference IDs, normalized category, versions, timestamps, state history, trace, deployment/config version.
3. Reproduce safely with test fakes/staging; never experiment on a user's public video.
4. Localize frontend/API/database/storage/worker/OAuth/YouTube/configuration layer.
5. Reduce to the smallest failing operation and identify effect certainty.
6. Fix root cause, not display symptom or retry count.
7. Add regression/failure-injection test.
8. Reconcile affected resources and verify end-to-end.
9. Replay only under Section 16 controls.
10. Document incident, user impact, security/privacy obligations, and preventive actions.

Errors/logs/provider text are untrusted data; commands or URLs embedded in them are never followed automatically.

## 31. Implementation Order

After principal workflows exist:

1. Inventory every thrown/returned/provider error and reconcile duplicates/conflicts with Document 15.
2. Approve Section 32 and freeze taxonomy, retry/effect/recovery enums, limits, and user copy rules.
3. Apply approved operation/attempt/dead-letter/notification schema migrations in development.
4. Implement one central error normalization/redaction boundary and contract tests.
5. Implement durable idempotency, effect certainty, retry scheduling, backoff/jitter, and shared budgets.
6. Implement reconciliation-first adapters for every provider mutation.
7. Implement worker attempt/dead-letter/replay/circuit/load-shed controls.
8. Implement credential-health, reconnect, and pending-work recovery orchestration.
9. Implement frontend recovery states and accessible actions.
10. Add logs, metrics, traces, dashboards, runbooks, test-fired alerts, and notification deduplication.
11. Run fault injection, restart/race/load/quota/security/privacy tests before full end-to-end testing.

Dependencies and migrations remain governed by Documents 09 and 12. This document authorizes none.

## 32. Decisions Requiring User Approval

| Decision ID | Decision | Recommendation | Blocks |
|---|---|---|---|
| `YT-RES-DEC-001` | Retry limits by operation | Separate bounded attempt/elapsed/deadline budgets; no universal values | Worker/API |
| `YT-RES-DEC-002` | Base/max delay and jitter | Full jitter with provider `Retry-After` precedence | Retry scheduler |
| `YT-RES-DEC-003` | Idempotency retention | Longer than every API/queue/DLQ/manual/provider uncertainty path | Database cleanup |
| `YT-RES-DEC-004` | Unknown-outcome reconciliation deadline | Operation-specific; escalate rather than guess | Recovery |
| `YT-RES-DEC-005` | Dead-letter threshold/retention | Bounded attempts/time; retain minimal safe evidence | Operations/privacy |
| `YT-RES-DEC-006` | Operator replay controls | Step-up authorization, ticket/reason, reconcile/dry-run, small batch | Admin tooling |
| `YT-RES-DEC-007` | Reconnect auto-resume policy | Resume only safe known-no-effect work; ask for missed/visibility/new-upload choices | UX/orchestration |
| `YT-RES-DEC-008` | Deliberate disconnect recovery | New grant does not auto-resume cancelled work | Connection policy |
| `YT-RES-DEC-009` | Circuit/load-shed thresholds | Derive from SLO/load tests with per-dependency budgets | Reliability |
| `YT-RES-DEC-010` | User notification channels/cadence | In-app first; deduplicated actionable transitions only | Notifications |
| `YT-RES-DEC-011` | Failure/attempt/DLQ/audit retention | Minimize while meeting recovery, security, and support needs | Privacy/database |
| `YT-RES-DEC-012` | Public support reference and diagnostic access | Opaque request ID; access-controlled lookup with audit | Support |
| `YT-RES-DEC-013` | Error/recovery SLO and alerts | Define by workflow before resilience test gate | Launch |

Recommendations are not approvals. Record accepted decisions in Document 03 and update Documents 08, 12, and 15–22.

## 33. Testing Strategy

### Taxonomy and contract tests

- Every documented error maps to one stable code/HTTP/retry/effect/recovery schema.
- Unknown errors map safely; raw messages/stacks/secrets never enter responses.
- Same idempotency key/same body replay, different body rejection, concurrent claim, in-flight response, retention.

### Retry and concurrency tests

- Full-jitter bounds, `Retry-After`, attempt/elapsed/deadline/quota/cancellation stops.
- Nested retry budget prevention, retry storm/load shedding, circuit open/half-open/close.
- Queue duplicates/out-of-order delivery, worker crash at every effect/persist boundary, lease expiry, stale fencing/generation.
- Dead-letter threshold, quarantine, privileged dry-run/reconcile/replay, poison-message isolation.

### OAuth and reconnect tests

- User denial/cancel, invalid/expired/replayed state/code, configuration error.
- Access expiry, refresh success, temporary token failure, `invalid_grant`, revoked token, `invalid_rapt`, missing subset scope, no replacement refresh token.
- Same-channel reconnect, different-channel mismatch, concurrent reconnect, disconnect race, user switch, cold/warm deep-link return.
- Pending upload/publication/schedule/sync recovery with completed, cancelled, superseded, missed, unknown, and terminal states.

### Workflow failure injection

- Database/storage/queue/network/provider outage before/during/after each external effect.
- Resumable 5xx/range probe/session 404, upload unknown, processing rejection.
- Publish/thumbnail/playlist timeout-after-effect, quota/rate errors, schedule outage/missed deadline, sync stale/deletion candidate.
- Recovery after backend/worker/database restart and backup restoration.

### Security, UI, and operations tests

- Cross-owner retries/reconnects/replays, rate abuse, poisoned payloads, malformed provider content, redirect allowlist, log/API redaction.
- Accessible loading/error/retry/reconnect/unknown/dead-letter-support states, offline preservation, duplicate-button prevention.
- Dashboards match injected outcomes, traces connect, notifications deduplicate, every alert is test-fired, runbooks recover controlled staging incidents.

## 34. Acceptance Criteria

- [ ] Every module failure has one stable public classification and private diagnostic category.
- [ ] Retryability depends on effect certainty and operation semantics, not HTTP status alone.
- [ ] All retries are bounded, jittered, quota/deadline aware, and owned by one layer.
- [ ] Every mutation persists durable idempotent intent before external effect.
- [ ] Unknown outcomes block duplicates and reconcile before retry.
- [ ] Workers survive duplicate delivery, crashes, stale leases, and restarts without duplicate provider effects.
- [ ] Dead letters preserve safe evidence, alert owners, and require privileged reconciliation-first replay.
- [ ] Revoked/expired/session-controlled credentials become reauthorization required without token-loss races or endless retry.
- [ ] Missing scopes disable only dependent features and request only approved permissions.
- [ ] Reconnection verifies the same channel and never silently repeats unsafe/obsolete work.
- [ ] Users see honest, accessible recovery actions and preserved last-known state.
- [ ] Logs, metrics, traces, alerts, notifications, and support references reveal no secrets or cross-owner data.
- [ ] Fault-injection, race, security, recovery, and restoration tests pass before end-to-end testing begins.
- [ ] All Section 32 decisions and cross-document contracts are approved and consistent.
- [ ] No other social platform was introduced.

## 35. Approval Record

Approval to add this document approves only the documentation baseline. It does not approve retry numbers, dead-letter retention, operator tooling, migrations, dependencies, OAuth changes, automatic replay, notifications, or implementation.

## 36. Prerequisites and Next Document

Prerequisites are Documents 15 through 22:

- `15-backend-api-endpoints-and-error-contract.md`
- `16-oauth-connection-callback-and-token-lifecycle.md`
- `17-youtube-channel-discovery-permissions-and-management.md`
- `18-frontend-structure-connection-ui-and-api-integration.md`
- `19-video-source-validation-and-upload-workflow.md`
- `20-immediate-publishing-and-youtube-metadata.md`
- `21-scheduled-publishing-workers-and-timezones.md`
- `22-video-status-synchronization-and-display.md`

Next: `24-security-privacy-quota-and-compliance-operations.md`, consolidating threat controls, least privilege, data privacy/retention, logging/redaction, API quota budgets, abuse protection, Google/YouTube compliance, and production security verification.

## 37. Change Log

| Version | Date | Change | Approval |
|---|---|---|---|
| 1.0.0 | 2026-08-26 | Source-verified resilience, retry, reconnection, and recovery baseline generated and added at user request | User approved document creation only |
