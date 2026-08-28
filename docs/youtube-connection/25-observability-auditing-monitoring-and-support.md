# YouTube Connection Module — Observability, Auditing, Monitoring, and Support

## Document Control

| Field | Value |
|---|---|
| Document number | 25 |
| Filename | `25-observability-auditing-monitoring-and-support.md` |
| Module | YouTube Connection only |
| Stage | Stage 11 — Operational readiness |
| Status | Approved documentation baseline — instrumentation implementation and staging gate remain pending |
| Version | 1.0.0 |
| Date | 2026-08-26 |
| Purpose | Define safe logs, metrics, traces, audit events, dashboards, alerts, health checks, incident evidence, and support diagnostics without exposing credentials |
| Earlier dependencies | Documents 06–08, 13, and 19–24 |
| Readiness gate | Instrumentation must be implemented and verified before staging acceptance testing begins |
| Next document | `26-testing-strategy-fixtures-and-verification-matrix.md` |

## 1. Purpose

This document is the single operational-observability contract for the YouTube Connection module. It defines what operators must be able to determine, which safe signals provide that evidence, how signals correlate across HTTP and asynchronous work, which actions require immutable security audits, how alerts and support workflows operate, and what must be proven before staging acceptance testing.

This document does not select or install an observability vendor, create dashboards, configure alerts, change runtime code, authorize production access, or permit sensitive data in telemetry. Those actions begin only after the decisions and implementation checkpoint in this document are approved.

## 2. Scope and Non-Scope

Included:

- YouTube-connection API, OAuth, credential lifecycle, channel management, source validation, upload, publication, scheduling, synchronization, retry/recovery, quota, deletion, and administrative operations.
- Structured application and worker logs, metrics, distributed traces, immutable audit events, health/readiness checks, dashboards, alerts, incident evidence, and support diagnostics.
- Correlation, redaction, access control, retention, integrity, sampling, cardinality, ownership, runbooks, testing, and staging-readiness evidence.

Excluded:

- Instagram, TikTok, Facebook, or any other social integration.
- Product analytics, advertising attribution, user profiling, or surveillance.
- Recording video content, thumbnails, titles, descriptions, tags, comments, OAuth consent pages, or raw Google/YouTube payloads for observability.
- Choosing a telemetry vendor or inventing production thresholds, retention periods, regions, costs, or on-call owners without approval.
- Replacing business records or domain status events with telemetry. Logs and traces are diagnostic evidence, not authoritative state.

## 3. Prerequisite Gate

Before instrumentation implementation begins:

1. Documents 06–08 define quality requirements, boundaries, canonical entities, states, contracts, error codes, and correlation semantics.
2. Document 13 defines token encryption, redaction, access control, and threat controls.
3. Documents 19–22 define upload, publication, scheduling, and synchronization signals and lifecycles.
4. Document 23 defines error categories, retry eligibility, recovery, and reconnection.
5. Document 24 defines privacy, retention, quota, compliance, incident, and production controls.
6. Document 03 records approvals for the unresolved decisions in Section 31 of this document.
7. The existing stack and dependency inventory in Documents 00 and 09 is rechecked before adding any package.

If canonical names conflict, Document 03 and the latest approved contract document control. Record the correction; do not silently create an alias.

## 4. Operational Questions

Every signal must answer at least one of these questions:

| ID | On-call or support question |
|---|---|
| `YT-OBS-Q-001` | Can authenticated users start and complete YouTube connection now? |
| `YT-OBS-Q-002` | Is failure inside Narrial, its database/job system, Google OAuth, YouTube Data API, storage, or the user’s permission state? |
| `YT-OBS-Q-003` | Are tokens refreshing safely, and are reauthorization-required connections increasing? |
| `YT-OBS-Q-004` | Are uploads progressing, stalled, resumed, duplicated, cancelled, or failing permanently? |
| `YT-OBS-Q-005` | Are immediate and scheduled publications completing within the approved promise? |
| `YT-OBS-Q-006` | Are due jobs late, leased correctly, retrying safely, or accumulating in dead-letter/manual-review state? |
| `YT-OBS-Q-007` | Are displayed YouTube states fresh, and is synchronization lag growing? |
| `YT-OBS-Q-008` | Is quota consumption normal, abusive, unexpectedly expensive, or likely to block time-critical work? |
| `YT-OBS-Q-009` | Did a privileged, security-sensitive, consent, disconnect, deletion, or support action occur; who initiated it; and what was the safe outcome? |
| `YT-OBS-Q-010` | Can a support operator diagnose one user-reported operation without viewing credentials, content, or another user’s data? |
| `YT-OBS-Q-011` | Did telemetry itself stop, leak prohibited data, break correlation, or exceed approved storage/cardinality budgets? |

Signals that answer none of these questions are not collected unless separately justified and approved.

## 5. Signal Responsibilities

| Signal | Primary use | Must not be used as |
|---|---|---|
| Structured log | Explain a specific execution or failure | Authoritative business history or secret storage |
| Metric | Detect aggregate rate, error, latency, saturation, lag, and budget changes | Per-user/resource lookup or exact forensic narrative |
| Trace | Locate latency/failure across API, database, queue, worker, and provider boundaries | Unsampled compliance ledger |
| Audit event | Prove a security/privacy/administrative action and outcome | Debug dump or provider-payload archive |
| Domain status event | Explain meaningful user-visible lifecycle transitions | Internal operator activity log |
| Dashboard | Present current service health and trends | Substitute for actionable alerts or runbooks |
| Alert | Notify an owner of actionable user impact or imminent breach | General-purpose reporting or expected transient noise |

## 6. Canonical Correlation Model

The following identifiers are distinct:

- `requestId`: one inbound API request; generated at trusted ingress or accepted only from an approved trusted proxy. Returned in `X-Request-Id` and safe error responses as `supportReferenceId` when appropriate.
- `correlationId`: one logical workflow across multiple requests, jobs, retries, and reconciliation attempts. Generated server-side and propagated through durable messages.
- `traceId` and `spanId`: observability-system identifiers. They are not authorization evidence and are exposed to clients only if explicitly approved.
- `jobId`: internal durable work identifier; never accepted as proof of ownership.
- Domain identifiers such as `connectionId`, `uploadId`, `publicationId`, and `scheduleId`: stored only in controlled logs/audits when required for diagnosis; never metric labels.
- `supportReferenceId`: opaque, non-secret reference safe for a user to provide to support. It maps server-side to approved diagnostic context and expires according to approved retention.

Requirements:

1. API ingress creates a trusted `requestId` and root trace context.
2. Application services preserve `requestId`, `correlationId`, and trace context.
3. Outbox records and job messages contain safe correlation and trace context, never tokens or metadata bodies.
4. Workers create a new execution span and link to the originating trace when direct parentage is no longer valid.
5. Outbound Google/YouTube requests receive trace context only where provider policy and implementation permit; internal IDs are not placed in OAuth parameters or public metadata.
6. Retried attempts share `correlationId` but receive new attempt/span identifiers.
7. Client-supplied correlation values are validated, length-limited, and never trusted for authorization or audit actor identity.

## 7. Structured Logging Contract

Production logs are machine-readable structured events, preferably JSON, with stable event names. Free-form messages may summarize the event but must not carry the only queryable information.

Common allowlisted fields:

| Field | Rule |
|---|---|
| `timestamp` | UTC, RFC 3339, generated by the emitting service |
| `level` | `error`, `warn`, `info`, or `debug` under Section 8 |
| `eventName` | Stable `youtube.<area>.<action>.<outcome>` name |
| `service`, `component`, `environment`, `releaseVersion` | Bounded deployment identity; no secrets |
| `requestId`, `correlationId`, `traceId` | Approved correlation values |
| `operation` | Bounded canonical operation name |
| `outcome` | Bounded value such as `success`, `failure`, `deferred`, `cancelled`, `unknown` |
| `errorCode`, `errorCategory`, `retryClass` | Narrial-normalized values from Documents 15 and 23 |
| `attempt`, `durationMs`, `bytesBucket` | Numeric diagnostic values; exact bytes only where approved |
| `provider` | Fixed value `youtube` or `google_oauth`; never a user-controlled label |
| `quotaOperation`, `quotaCost` | Verified operation name and accounted units |

Logging rules:

- Emit lifecycle boundaries and meaningful outcomes, not every loop iteration or unchanged poll.
- Do not log complete HTTP headers, query strings, request/response bodies, database rows, SDK objects, exceptions, or environment objects.
- Normalize provider errors before logging; preserve a safe bounded provider reason only if Document 23 permits it.
- Stack traces are restricted to access-controlled server diagnostics, redacted before export, and excluded from client responses and routine support bundles.
- Production `debug` logging is off by default, time-bounded when enabled, scoped to a component, approved, audited, automatically disabled, and subject to the same redaction.
- Log failures in the telemetry exporter locally only through bounded, rate-limited fallback events to avoid recursive failure storms.

## 8. Log-Level Policy

| Level | Meaning | Example |
|---|---|---|
| `error` | Invariant broken, permanent workflow failure, unknown remote outcome requiring reconciliation, or service inability requiring action | durable job cannot be persisted; deletion deadline at risk |
| `warn` | Degraded but contained behavior requiring trend review | retry scheduled; credential needs reauthorization; quota reserve entered |
| `info` | Significant safe business/operational boundary | OAuth callback accepted; upload completed; schedule cancelled |
| `debug` | Temporary diagnostic detail | sanitized branch/adapter details; disabled in production by default |

Expected user validation errors, unauthenticated probes, unchanged sync polls, and routine health requests must not flood `error` logs. Security-abuse signals are sampled/rate-limited without hiding aggregate attack metrics.

## 9. Prohibited Telemetry Data and Redaction

Never emit into logs, metrics, traces, alerts, dashboards, audit details, analytics, crash reports, support bundles, or health responses:

- Google client secrets; access, refresh, ID, session, bearer, storage, observability, or database credentials.
- OAuth authorization codes, raw `state`, PKCE verifier/challenge linkage, cookies, authorization headers, signed URLs, resumable upload session URLs, encryption keys, plaintext credential envelopes, or decrypted token material.
- Raw Google/YouTube request or response bodies and raw SDK error objects.
- Video bytes, thumbnails, captions, titles, descriptions, tags, filenames, local paths, playlist names, or arbitrary user text.
- Email addresses, full user profiles, IP addresses, device identifiers, or precise location unless a separately approved security purpose, notice, access policy, and retention exist.
- Raw database connection strings, stack locals, process environments, or cross-tenant identifiers.

Controls:

1. Use allowlist serializers at emission boundaries; redaction after ingestion is not sufficient.
2. Configure logger/framework automatic redaction as defense in depth.
3. Hashing a secret does not make it safe. Stable user hashes are still personal/pseudonymous data and must not become metric labels.
4. Sanitization tests use synthetic canary secrets and fail builds or staging gates when any canary reaches a sink.
5. Telemetry access and export are audited; suspected leakage invokes Document 24 incident and credential-rotation procedures.

## 10. Canonical Event Catalogue

The implementation may add events only through documented change control. Minimum event families:

| Area | Required event names or family |
|---|---|
| API | `youtube.api.request.completed`, `youtube.api.request.rejected` |
| OAuth | `youtube.oauth.started`, `.callback.accepted`, `.callback.rejected`, `.exchange.succeeded`, `.exchange.failed`, `.state.replay_detected` |
| Credentials | `youtube.credential.refresh.succeeded`, `.refresh.failed`, `.reauthorization.required`, `.revocation.completed` |
| Connection/channel | `youtube.connection.created`, `.reconnected`, `.disconnected`, `youtube.channel.refresh.completed`, `.permission.changed` |
| Source/upload | `youtube.source.validation.completed`, `youtube.upload.started`, `.progress.checkpoint`, `.resumed`, `.completed`, `.failed`, `.cancelled`, `.unknown_outcome` |
| Publication | `youtube.publication.started`, `.completed`, `.failed`, `.reconciliation.required` |
| Scheduling | `youtube.schedule.created`, `.rescheduled`, `.cancelled`, `.due`, `.executed`, `.late`, `.missed` |
| Synchronization | `youtube.sync.started`, `.completed`, `.state_changed`, `.stale`, `.failed`, `.quota_paused` |
| Retry/recovery | `youtube.retry.scheduled`, `.exhausted`, `youtube.dead_letter.created`, `youtube.recovery.completed` |
| Quota | `youtube.quota.operation.accounted`, `.budget.warning`, `.reserve.entered`, `.exhausted`, `.reset_observed` |
| Privacy/security | Audit-owned events listed in Section 17; operational logs contain only a safe reference |
| Telemetry | `youtube.telemetry.export.failed`, `.redaction.violation_detected`, `.pipeline.recovered` |

Event names describe facts, not guessed causes. A provider timeout is not logged as “YouTube outage” without evidence.

## 11. Metrics Design Rules

- Use RED signals—rate, errors, duration—for every API route template and external dependency operation.
- Use USE signals—utilization, saturation, errors—for database pools, job queues, workers, storage transfer capacity, and telemetry exporters.
- Duration and lateness use histograms so p50, p95, and p99 can be calculated; averages alone are prohibited.
- Counters are monotonic. Current queue depth, active work, and connection health use gauges with documented source/refresh behavior.
- Metric units appear in names (`_seconds`, `_bytes`, `_total`) and descriptions.
- Labels are bounded enumerations: environment, service, route template, method, status class, operation, normalized outcome/error category, worker type, privacy status, and quota class where approved.
- Never label by user, channel, video, upload, publication, schedule, job, request, trace, support reference, raw URL, raw status text, error message, title, or filename.
- New labels require a cardinality estimate, owner, dashboard/alert use, privacy review, and staging verification.
- Exact names must match the repository’s approved metric convention; conceptual names below become canonical only when recorded in Document 03.

## 12. Required Metric Families

| Family | Minimum measurements |
|---|---|
| API | request count, error count, duration histogram by route template/method/status class |
| OAuth funnel | starts, callbacks, valid callbacks, exchange outcomes, completed connections, abandonment calculated from bounded stages |
| Credential health | refresh attempts/outcomes/duration, reauthorization-required connections as an aggregate gauge, revocations |
| Upload | starts/outcomes, active count, queued age, duration, throughput, resume/session-expiry/unknown-outcome counts |
| Publication | attempts/outcomes/duration, processing and visibility latency, provider restriction categories |
| Scheduling | created/cancelled/rescheduled/executed/missed counts, due backlog, oldest due age, claim latency, lease loss, execution lateness |
| Synchronization | attempts/outcomes/duration, oldest unsynchronized age, stale resources, unknown states, reconciliation backlog |
| Jobs/workers | queue depth, oldest age, processing duration, retry count, dead-letter count, worker heartbeat/readiness |
| Provider | request count/errors/duration by approved operation and normalized category, rate-limit signals |
| Quota | estimated/confirmed units by operation, budget percentage, reserve state, blocked/deferred operations, forecast exhaustion time if defensible |
| Database/storage | pool utilization/wait, query error/duration at safe operation class, storage transfer/cleanup failures and backlog |
| Security/privacy | aggregate denied actions, state replay, ownership denials, deletion queue age/deadline risk; no sensitive dimensions |
| Telemetry pipeline | export success/failure, dropped signals, queue depth, ingestion lag, sampled trace rate, log volume, series cardinality and cost budget |

Business-state gauges must be computed from authoritative storage with a documented query and freshness; do not infer them only from potentially dropped logs.

## 13. Distributed Tracing

Use a vendor-neutral propagation model; OpenTelemetry is the recommended default, but package/vendor selection requires Document 03 approval and installation through Document 09’s staged process.

Required trace paths:

- Client request → authenticated API → application service → database/outbox.
- OAuth callback → state consumption → code exchange → credential encryption → channel discovery → connection persistence.
- Upload command → queue → worker → token refresh → resumable YouTube request(s) → database/status event.
- Scheduled due scan → claim/lease → worker → publish call → reconciliation → user-visible state.
- Synchronization trigger → queue → worker → `videos.list` → normalized transition → persistence.

Rules:

- Auto-instrument HTTP, supported database clients, and queue boundaries only after privacy review of default attributes.
- Add manual spans around meaningful application operations, not every function.
- Span names and attributes are bounded and do not include raw URLs, query values, SQL values, resource IDs, metadata, or credentials.
- Propagate context across outbox and queues; verify no broken trace at asynchronous boundaries.
- Head sampling may reduce routine success volume. Error and rare-critical workflows should use approved tail/priority sampling where supported, but audit evidence never depends on sampling.
- Sampling policy, rate, cost, retention, and regional storage require approval and must not silently change during an incident.

## 14. Health, Readiness, Liveness, and Startup

| Probe | Purpose | Behavior |
|---|---|---|
| Liveness | Detect a wedged process | Checks local event loop/process only; no provider call or database dependency |
| Readiness | Decide whether instance can accept work | Checks required local config shape, database connectivity, migration compatibility, and essential job dependencies with short timeouts |
| Startup | Protect slow initialization | Validates boot completion and required adapters before liveness enforcement |
| Worker readiness | Decide whether work can be claimed | Confirms database/job access, compatible schema/release, clock sanity, and required key references |
| Deep synthetic check | Validate a workflow from outside the request path | Runs separately on a schedule with dedicated non-production/staging fixtures; never inside public health endpoints |

Health endpoints:

- Return only overall state, bounded component categories, release version if approved, and timestamp.
- Never expose environment variables, secrets, Google project/client IDs, scopes, tokens, database details, queue contents, hostnames, user data, provider bodies, or stack traces.
- Are authenticated/network-restricted where detail exceeds a simple public liveness result.
- Do not call Google/YouTube on every probe, which would add latency, quota consumption, and cascading failure.
- Distinguish `healthy`, `degraded`, and `unready`; dependency degradation does not automatically restart healthy processes.

## 15. Service-Level Indicators and Objectives

Required candidate indicators:

| SLI | Measurement |
|---|---|
| Connection completion | valid OAuth starts that produce an owned active connection within an approved window |
| API availability | eligible authenticated requests returning non-server-failure responses |
| API latency | endpoint duration distribution by route class |
| Upload success | valid upload intents reaching confirmed YouTube ID, excluding approved user cancellations |
| Schedule punctuality | eligible due schedules reaching intended provider state within approved lateness |
| Sync freshness | active nonterminal resources observed within approved freshness window |
| Credential refresh reliability | eligible refresh attempts succeeding without reauthorization |
| Recovery reliability | retryable workflows recovering before exhaustion/deadline |
| Deletion timeliness | eligible deletion requests completing within Document 24’s applicable deadline |
| Quota safety | time spent outside reserve/exhausted state without deadline-impacting deferral |

Exact objectives, windows, exclusions, error budgets, and owners are **TBD — Requires approval**. They must be derived from the product promise, measured staging behavior, Google dependencies, capacity assumptions, and policy deadlines. Provider-caused unavailability is reported separately but is not hidden from user-impact dashboards.

## 16. Audit Event Contract

Audit events are append-only, access-controlled security/privacy records. At minimum they contain:

- `auditEventId`, `occurredAt`, `eventType`, `outcome`, and `environment`.
- Actor category (`user`, `service`, `worker`, `support`, `administrator`, `system`) and a protected internal actor reference when required.
- Safe target type and protected internal target reference.
- `requestId`, `correlationId`, and `supportReferenceId` where present.
- Authentication/authorization result, normalized reason code, and approved policy/control reference.
- For privileged actions: case/ticket reference, stated reason, approval reference, and before/after state category without sensitive values.
- Integrity/version metadata sufficient to detect unauthorized alteration according to the approved storage design.

Audit records never contain credentials, raw OAuth values, content metadata, provider payloads, or decrypted values. Audit success is transactionally coupled to the protected state change where required; if mandatory audit persistence fails, the privileged mutation fails safely or enters a documented reconciliation state.

## 17. Audited Actions

At minimum, audit:

- OAuth initiation outcome category, callback/state validation, connection creation/reconnect, scope or permission change, refresh failure requiring action, revocation, and disconnect.
- Upload/publication/schedule creation, cancellation, reschedule, retry exhaustion, unknown-outcome resolution, manual retry/replay, and administrative reconciliation.
- Ownership/access denials that indicate cross-tenant or privilege abuse, subject to aggregation controls.
- Credential/key rotation, secret access/change where platform support permits, feature/kill-switch changes, and production configuration changes.
- Support case access, diagnostic lookup, impersonation if ever approved, export, and manual state correction.
- Data export, deletion request, deletion completion/failure/deadline risk, backup exception, and vendor deletion evidence.
- Quota override/reserve change, quota extension submission, and project/credential changes.
- Telemetry export, retention, access-policy, redaction, or sampling changes.

Routine reads are audited only when required by sensitivity, policy, or risk; otherwise access logs and aggregate metrics prevent an unusable audit flood.

## 18. Audit Integrity, Access, and Retention

- Application roles may append through a narrow interface; they cannot update/delete audit rows directly.
- Read access is least-privilege and separated among support, operations, security, privacy, and compliance roles.
- Audit searches and exports are themselves audited.
- Integrity controls may use immutable/WORM storage, cryptographic chaining/signatures, restricted database permissions, or a managed audit service; selection requires threat and operational review.
- Clock synchronization and UTC timestamps are mandatory; provider time is stored only as a separately labeled observation.
- Audit, log, trace, metric, incident-evidence, and support-reference retention periods remain **TBD — Requires privacy, security, support, cost, and policy approval**. Each class has a deletion owner and verified expiration.
- Legal hold, if applicable, requires authorized legal approval, scope, start/end dates, access control, and audit; it must not become indefinite default retention.

## 19. Dashboard Set

Minimum dashboards:

1. **Executive/module health:** active feature state, SLI/error-budget summary, current incidents, provider/quota status, and user-impact trends.
2. **OAuth and connections:** funnel, callbacks by safe outcome, exchange/refresh latency and failures, reauthorization rate, disconnect/revocation outcomes.
3. **Uploads and publication:** queued/active/completed/failed, throughput, duration percentiles, resumes, unknown outcomes, processing/visibility latency.
4. **Scheduling and workers:** due backlog, oldest age, claim latency, execution lateness, missed jobs, retries, lease loss, dead letters, worker availability.
5. **Synchronization:** freshness distribution, stale/unknown resources, provider outcomes, reconciliation backlog and age.
6. **Provider and quota:** Google/YouTube RED signals, operation cost, daily budget/reserve, forecast, throttling, deferred work, rate-limit/error categories.
7. **Security and privacy:** aggregate replay/ownership denials, privileged activity, deletion deadline risk, telemetry redaction alarms; accessible only to approved roles.
8. **Telemetry pipeline:** exporter failures, dropped data, ingestion lag, cardinality, sampling, storage/cost trend, alert delivery health.

Every panel documents its query, data source, unit, freshness, filters, owner, interpretation, known exclusions, and linked runbook. Dashboards use environment filters and cannot combine production with non-production by default.

## 20. Alert Design

Alerts prioritize user-visible symptoms and policy/security deadlines. Two severities are used:

- `PAGE`: substantial current user impact, data/security incident, missed/near-missed policy deadline, or imminent irreversible publication/deletion harm; respond immediately under approved coverage.
- `TICKET`: sustained degradation, capacity trend, cost/cardinality issue, or preventive maintenance that can wait for normal support hours.

Every alert must have:

- Unique ID and name; owner and backup escalation; severity.
- Exact signal/query, threshold, evaluation window, required sample size, and environment.
- Justification tied to an approved SLO, policy deadline, measured baseline, or capacity model.
- Runbook URL, dashboard link, recent-deployment link, and safe diagnostic query.
- Deduplication/grouping, cooldown, maintenance behavior, and recovery notification.
- Staging test-fire evidence and periodic delivery-test date.

Thresholds are not invented here. They are **TBD — Requires measured staging baseline and owner approval**.

## 21. Minimum Alert Catalogue

| ID | Condition | Default severity decision |
|---|---|---|
| `YT-ALERT-001` | User-facing connection completion/availability SLO breach | PAGE after approved burn-rate/window |
| `YT-ALERT-002` | OAuth state replay or cross-owner authorization anomaly | PAGE or security escalation per incident policy |
| `YT-ALERT-003` | Sustained token refresh failure/reconnect surge | PAGE if broad impact; otherwise TICKET |
| `YT-ALERT-004` | Upload failure/unknown-outcome surge or stalled active uploads | PAGE when users are blocked |
| `YT-ALERT-005` | Due schedule backlog/lateness threatens or breaches promise | PAGE |
| `YT-ALERT-006` | Synchronization freshness breach or unknown-state backlog | PAGE if user truth is materially stale; otherwise TICKET |
| `YT-ALERT-007` | Dead-letter/manual-review backlog exceeds approved age/count | PAGE if deadlines at risk; otherwise TICKET |
| `YT-ALERT-008` | Quota reserve/exhaustion threatens critical operations | PAGE; warning forecast is TICKET |
| `YT-ALERT-009` | Deletion/revocation completion approaches policy deadline | PAGE before breach |
| `YT-ALERT-010` | Credential/key decryption, secret access, or rotation anomaly | Security PAGE |
| `YT-ALERT-011` | Telemetry redaction canary or suspected secret detected | Security PAGE and contain exporter |
| `YT-ALERT-012` | Telemetry export/delivery gap makes critical paths blind | PAGE after approved blind-window |
| `YT-ALERT-013` | Metric cardinality/log volume/cost budget trend | TICKET unless it threatens service |
| `YT-ALERT-014` | Readiness failure across sufficient capacity | PAGE |
| `YT-ALERT-015` | Alert delivery heartbeat missing | PAGE to backup channel |

Expected Google maintenance/transient errors may change routing but cannot suppress actual user impact. Alerts must avoid one page per user/resource.

## 22. Runbook Standard

Each runbook contains:

1. Symptom and user impact.
2. Alert meaning, thresholds, exclusions, and false-positive history.
3. Preconditions and required role.
4. First safe dashboard/query and correlation path.
5. Decision tree separating Narrial, Google OAuth, YouTube, database, jobs, storage, quota, permissions, and telemetry failures.
6. Containment actions, including approved feature/worker kill switches.
7. Safe retry/reconcile/reconnect procedure from Document 23; never blind replay.
8. Verification of recovery and data/state consistency.
9. Escalation, communications, incident classification, and evidence preservation.
10. Rollback/forward-fix constraints and actions that require two-person approval.
11. Post-incident follow-up and runbook owner/review date.

Runbooks never include pasted secrets, permanent privileged commands, or instructions to bypass Google restrictions, idempotency, ownership, or audit controls.

## 23. Support Diagnostic Workflow

1. User supplies `supportReferenceId`, approximate time, operation type, and visible safe error code—not tokens, screenshots of OAuth parameters, or video content.
2. Support authenticates the user and case under the approved support system.
3. The diagnostic service resolves only owner-scoped, retention-valid context and returns a minimized summary: normalized state, last safe event time, retry/reconnect action, provider availability category, and escalation need.
4. Tier 1 cannot view tokens, raw provider payloads, encrypted blobs, full metadata, or cross-user records.
5. Elevated access is time-limited, reason-bound, approved where required, least-privilege, and audited.
6. Manual replay, state correction, disconnect, revocation, deletion, quota override, or visibility change requires the specific privileged workflow and idempotency/reconciliation safeguards.
7. The case records diagnosis category and resolution without copying sensitive telemetry.

Support tooling must prevent enumeration, enforce tenant ownership, paginate/bound queries, rate-limit access, and show telemetry freshness. “No event found” is not proof that no action occurred because sampling/export failures may exist.

## 24. Safe Diagnostic Bundle

If bundles are approved, they contain only:

- Application/release/environment identifiers.
- `supportReferenceId`, bounded operation/state/error categories, timestamps, and safe recent lifecycle summaries.
- Health/readiness categories, retry eligibility, quota/dependency category, and redaction version.

Bundles exclude all prohibited data in Section 9. Generation requires authenticated owner or privileged support authorization, is audited, has short approved expiry, encrypted transport/storage, download limits, and verified deletion. Client-generated bundles cannot be treated as authoritative server evidence.

## 25. Incident Evidence and Forensics

- On incident declaration, record incident ID, severity, commander, timeline, impacted environments/workflows, initial evidence, containment, communications, and decisions.
- Preserve only relevant logs/traces/audits/config versions/deployment manifests and integrity metadata under approved access and retention; never indiscriminately copy databases or token stores.
- Snapshot dashboard queries and alert payloads with timestamps and query definitions so results are reproducible.
- Record clock/source uncertainty and distinguish fact, hypothesis, and inference.
- Use chain-of-custody and legal/privacy approval where required.
- Credential exposure triggers immediate containment, rotation/revocation analysis, telemetry-sink review, and Google/user notification assessment under Document 24.
- Post-incident review produces corrective actions with owner/deadline and updates tests, alerts, runbooks, threat model, and relevant documentation.

## 26. Telemetry Pipeline Reliability and Failure Behavior

- Application correctness must not normally depend on an external telemetry vendor being available.
- Mandatory audit persistence for protected actions follows Section 16 and may fail the action safely.
- Export is asynchronous, bounded, backpressured, and cannot exhaust application memory/disk.
- When exporter failure occurs, count dropped signals, emit a rate-limited local event, alert through an independent path, and preserve critical audits through the approved durable mechanism.
- Telemetry retry uses capped backoff/jitter and does not compete with critical publication/deletion work for quota or worker capacity.
- Collector/storage outage, schema rejection, clock skew, ingestion delay, sampling change, and alert-delivery failure each have detection and recovery tests.
- The module remains diagnosably degraded: health distinguishes feature readiness from observability impairment without revealing internals.

## 27. Access Control, Environment Isolation, and Privacy

- Local, development, staging, and production telemetry use distinct projects/datasets/credentials and visible environment identity.
- Production access uses SSO/MFA where available, role-based least privilege, periodic review, immediate offboarding, and audited exports.
- Developers do not receive routine production log/trace access merely because they can deploy code.
- Support sees only the minimized support view; security/privacy roles receive separately justified access.
- Telemetry egress regions, subprocessors, encryption, deletion, backup, breach notification, and contractual controls require Document 24 review.
- Non-production uses synthetic data and dedicated test Google accounts/channels; production data is not copied into test systems.
- Public dashboards, status pages, alert messages, chat notifications, and email never expose internal identifiers or user data.

## 28. Schema Governance and Change Control

- Maintain version-controlled registries for event names/fields, metric names/labels, span names/attributes, audit event types, dashboards, alerts, and runbooks.
- Each change records purpose, operational question, owner, privacy/security review, cardinality/cost impact, compatibility, rollout, verification, and rollback.
- Additive changes are preferred. Renames use a bounded dual-emission/migration window and dashboard/alert updates.
- Removing a signal requires proof that no alert, dashboard, runbook, audit obligation, test, or support workflow depends on it.
- Provider/API/library upgrades require telemetry contract regression tests because default instrumentation attributes can change.
- Dashboard and alert configuration should be version-controlled/infrastructure-as-code where the approved vendor supports it.

## 29. Implementation and Dependency Order

No package is installed merely because this document exists.

1. Approve Section 31 decisions and update Documents 03, 09, and 10.
2. Select structured logger/redaction, metrics, tracing/collector/backend, audit storage, alert delivery, dashboard, and error-reporting approach after compatibility/privacy/security/cost review.
3. Install backend/runtime dependencies only at Document 09’s approved Stage 7 observability checkpoint; update lockfiles and dependency inventory.
4. Add validated non-secret configuration and secret references per Document 10. Never place vendor keys in frontend bundles.
5. Implement correlation context and redaction first, then common logging/metric/trace/audit interfaces.
6. Instrument API ingress, database/outbox, workers/queues, provider adapters, and each workflow in dependency order: OAuth/channel → upload/publication → scheduling → synchronization → recovery/quota/deletion.
7. Add health probes and telemetry-pipeline self-monitoring.
8. Create dashboards, then alerts tied to measured staging baselines and approved SLOs.
9. Create and review runbooks/support diagnostics before alert activation.
10. Run Section 32 tests, test-fire alerts, capture evidence, and pass Section 34 before staging acceptance testing begins.

Frontend error/crash reporting is optional and separately approved; it must not capture screens, text inputs, network bodies, OAuth browser contents, or metadata by default.

## 30. Ownership and Review Cadence

Required roles, with named people still **TBD — Requires approval**:

| Role | Responsibility |
|---|---|
| Module owner | Health definitions, workflow signals, acceptance evidence |
| Operations/on-call owner | Dashboards, alerts, runbooks, escalation, exercises |
| Security owner | redaction, access, threat signals, incident evidence |
| Privacy/compliance owner | data inventory, retention, deletion, vendor/policy review |
| Support owner | safe diagnostic workflow, training, access review |
| Platform owner | collectors, storage, availability, cost/cardinality, upgrades |
| Product owner | user-impact definition and SLO approval |

Review monthly initially and after every incident/release: alert noise, missed incidents, SLOs, redaction scans, access, retention/deletion, cardinality/cost, runbooks, ownership, provider policy/API changes, and stale signals. Final cadence requires approval.

## 31. Decisions Requiring Approval

| ID | Decision | Recommended direction | Blocks |
|---|---|---|---|
| `YT-OBS-DEC-001` | Telemetry vendor/backend and deployment topology | Prefer vendor-neutral OpenTelemetry interfaces and environment isolation | Packages/configuration |
| `YT-OBS-DEC-002` | Structured logger and redaction implementation | Reuse verified existing logger if compliant; centralized allowlists | Runtime instrumentation |
| `YT-OBS-DEC-003` | Audit storage/integrity design | Append-only narrow writer plus protected read/export | Privileged mutations |
| `YT-OBS-DEC-004` | Log, metric, trace, audit, evidence, and support-reference retention | Minimize by purpose; legal/privacy/security approval | Production storage |
| `YT-OBS-DEC-005` | Telemetry regions and subprocessors | Match approved residency and contractual controls | Vendor provisioning |
| `YT-OBS-DEC-006` | SLO targets/windows/error budgets | Derive from product promise and staging baseline | Alerts/acceptance |
| `YT-OBS-DEC-007` | Alert thresholds, coverage, owners, and escalation channels | Symptom-based, two severities, tested backup route | Alert activation |
| `YT-OBS-DEC-008` | Trace sampling and error retention | Low routine sample; retain critical/error traces where safe | Cost/evidence |
| `YT-OBS-DEC-009` | Approved identifiers in controlled logs/audits | Minimum protected internal IDs; never metric labels | Support diagnostics |
| `YT-OBS-DEC-010` | Production debug procedure | Off by default; scoped, time-bound, audited | Incident runbooks |
| `YT-OBS-DEC-011` | Health endpoint exposure/authentication | Public minimal liveness; restricted detail | Deployment probes |
| `YT-OBS-DEC-012` | Support tool roles and privileged-action approvals | Minimized Tier 1, just-in-time elevation | Support launch |
| `YT-OBS-DEC-013` | Diagnostic bundles | Disable unless a proven support need exists | Bundle implementation |
| `YT-OBS-DEC-014` | Frontend crash/error reporting | Opt-in after privacy review and capture suppression | Frontend SDK |
| `YT-OBS-DEC-015` | Telemetry/cardinality/cost budgets | Baseline in staging and set owner-approved caps | Production capacity |

All approvals and rejected alternatives are recorded in Document 03. “Use defaults” is not an approval.

## 32. Verification Strategy

### 32.1 Unit and schema tests

- Validate every event/metric/span/audit schema, enum, unit, required field, and unknown-field behavior.
- Test allowlist serializers and redaction against tokens, OAuth values, headers, URLs, user metadata, provider payloads, stack locals, and synthetic canaries.
- Prove metric labels remain bounded and route templates replace raw URLs.
- Test correlation creation, validation, propagation, retry behavior, and support-reference mapping.
- Test audit append/integrity/access rules and privileged-action behavior when audit persistence fails.

### 32.2 Integration tests

- Follow one synthetic request through API, database/outbox, queue, worker, provider fake, and persistence with connected trace/correlation.
- Force Google timeout, 401/403, rate limit, quota exhaustion, malformed response, database failure, worker crash, lease loss, and exporter outage.
- Confirm normalized logs/metrics/traces/audits and absence of raw errors/secrets.
- Verify liveness stays independent, readiness changes correctly, and probes do not consume YouTube quota.
- Verify tenant separation and support access boundaries.

### 32.3 Staging operational tests

- Generate known traffic and compare authoritative database counts with dashboard values within documented lag/tolerance.
- Locate an induced failure using telemetry and `supportReferenceId` without reading source code or sensitive fields.
- Verify p50/p95/p99 queries, queue age, schedule lateness, sync freshness, quota accounting, and deletion deadline signals.
- Test-fire every alert end to end; verify primary/backup delivery, deduplication, recovery, ownership, and runbook links.
- Run redaction scans on actual sink output and export paths.
- Break telemetry export and alert delivery separately; prove self-monitoring and bounded degradation.
- Exercise at least OAuth failure, stalled upload, late schedule, stale sync, quota reserve, reauthorization, deletion deadline, and suspected telemetry leak runbooks.

### 32.4 Resilience, load, and cost tests

- Load test at approved capacity with tracing/log sampling enabled; measure overhead and dropped signals.
- Produce retry storms/high invalid-request traffic and confirm rate limits, aggregation, bounded logs, and no paging flood.
- Confirm metric series/cardinality and daily ingest/storage forecast remain inside approved budgets.
- Verify telemetry outages cannot exhaust memory/disk or delay time-critical publication/deletion work.

## 33. Evidence Package

The staging-readiness reviewer receives:

- Approved decision records and named ownership.
- Signal-schema registry and redaction/prohibited-field test results.
- Dashboard links/screenshots with query definitions and known freshness.
- Alert catalogue, thresholds/SLO rationale, test-fire timestamps, delivery evidence, and runbook links.
- End-to-end correlation trace for each principal workflow using synthetic identifiers.
- Audit integrity/access/failure test results.
- Health/readiness and telemetry-outage test results.
- Cardinality, ingestion, retention, region, access, and cost review.
- Support workflow/access test and synthetic incident exercise report.
- Open risks/exceptions with owner, expiry, mitigation, and approver.

Evidence contains no real credentials, raw provider payloads, production content, or unnecessary user data.

## 34. Acceptance Criteria and Staging Gate

Instrumentation is complete and staging acceptance testing may begin only when:

- [ ] All prerequisite documents and Section 31 blocking decisions are approved and recorded.
- [ ] Every operational question in Section 4 maps to a tested log, metric, trace, audit, dashboard, or support query.
- [ ] Structured events use stable names, UTC time, required correlation, normalized outcomes, and allowlisted fields.
- [ ] Actual sink inspection and automated canary tests find no credential, OAuth value, content metadata, raw payload, or unapproved PII leakage.
- [ ] RED/USE metrics, histogram percentiles, workflow lag/backlog, provider/quota, and telemetry self-health signals exist with bounded cardinality.
- [ ] Principal synchronous and asynchronous traces are connected and privacy-safe.
- [ ] Mandatory audited actions are append-only, protected, queryable by authorized roles, and resilient to failure as specified.
- [ ] Health/readiness/liveness behavior is correct, minimal, quota-free, and verified under dependency failures.
- [ ] Dashboards have owners, documented queries/units/freshness, environment isolation, and measured staging data.
- [ ] Every active alert is actionable, symptom/policy based, SLO/baseline justified, owned, linked to a reviewed runbook, deduplicated, and test-fired.
- [ ] Support can diagnose synthetic cases with `supportReferenceId` while tenant isolation and least privilege remain intact.
- [ ] Telemetry export/storage/alert outages degrade safely and are themselves detected.
- [ ] Retention, access, region, vendor, sampling, cardinality, and cost controls are approved and verified.
- [ ] Incident evidence and runbook exercises pass for all critical scenarios.
- [ ] No production credentials, production user access, or other-platform telemetry was introduced by this stage.

Failure of any required item blocks staging acceptance testing. Exceptions require written risk, compensating control, owner, expiry, and approval in Document 03; security/privacy credential-leak controls cannot be waived informally.

## 35. Sign-Off Record

| Approval | Named owner | Evidence | Decision/date | Status |
|---|---|---|---|---|
| Module/product SLI approval | Unassigned | Required | Required | Blocked |
| Operations/on-call readiness | Unassigned | Required | Required | Blocked |
| Security/redaction/audit review | Unassigned | Required | Required | Blocked |
| Privacy/retention/vendor review | Unassigned | Required | Required | Blocked |
| Support diagnostics/access review | Unassigned | Required | Required | Blocked |
| Platform/capacity/cost review | Unassigned | Required | Required | Blocked |
| Staging acceptance-test authorization | Unassigned | Required | Required | Blocked |

No AI agent may self-approve a gate or substitute planned work for observed evidence.

## 36. Approval Record

Approval to add this document approves only the documentation baseline. It does not approve a telemetry vendor, package installation, infrastructure, secrets, data processing terms, retention, regions, SLOs, alert thresholds, support access, staging acceptance testing, production credentials, or implementation.

## 37. Prerequisites and Next Document

Prerequisites:

- `06-nonfunctional-requirements-and-quality-attributes.md`
- `07-system-architecture-and-service-boundaries.md`
- `08-domain-model-state-machines-and-api-contracts.md`
- `13-security-model-token-encryption-and-threat-controls.md`
- `19-video-source-validation-and-upload-workflow.md`
- `20-immediate-publishing-and-youtube-metadata.md`
- `21-scheduled-publishing-workers-and-timezones.md`
- `22-video-status-synchronization-and-display.md`
- `23-errors-retries-reconnection-and-recovery.md`
- `24-security-privacy-quota-and-compliance-operations.md`

Next: `26-testing-strategy-fixtures-and-verification-matrix.md`, defining the complete automated and manual verification strategy, test fixtures, environment boundaries, failure injection, traceability, and quality gates.

## 38. Change Log

| Version | Date | Change | Approval |
|---|---|---|---|
| 1.0.0 | 2026-08-26 | Initial observability, auditing, monitoring, and support baseline generated and added at user request | User approved document creation only |
