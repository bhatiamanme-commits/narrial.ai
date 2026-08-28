# YouTube Connection Module — Testing Strategy, Fixtures, and Verification Matrix

## Document Control

| Field | Value |
|---|---|
| Document number | 26 |
| Filename | `26-testing-strategy-fixtures-and-verification-matrix.md` |
| Module | YouTube Connection only |
| Stage | Stage 12 — Continuous verification |
| Status | Approved documentation baseline — test implementation and execution evidence remain pending |
| Version | 1.0.0 |
| Date | 2026-08-26 |
| Purpose | Define unit, contract, integration, database, OAuth, upload, worker, security, quota, UI, device, staging, failure-injection, and end-to-end tests |
| Earlier dependencies | Documents 04–25 |
| Full-suite gate | The complete matrix runs after resilience and observability are implemented and verified |
| Next document | `27-deployment-environment-variables-and-release-runbook.md` |

## 1. Purpose

This document is the test and verification contract for the YouTube Connection module. It explains what must be tested, at which layer, with which controlled fixtures, in which environment, against which requirement, and what evidence is required before the feature can advance.

Testing is continuous: each behavior is designed test-first with its feature document, implemented through a failing test followed by the smallest passing implementation, and kept as a regression test. Stage 12 is when the complete cross-feature matrix, real-device checks, controlled Google/YouTube staging verification, resilience exercises, security tests, and end-to-end acceptance flows are run together.

This document creates no test code, test data, external accounts, credentials, infrastructure, dependencies, or production changes.

## 2. Scope and Non-Scope

Included:

- User journeys and all interface states from Document 04.
- Functional, nonfunctional, architectural, domain, API, persistence, security, and operational requirements from Documents 05–25.
- Unit, component, contract, integration, database/migration, OAuth, channel, upload, publication, schedule, worker, synchronization, recovery, security, privacy, quota, observability, UI, accessibility, device, performance, staging, failure-injection, and end-to-end verification.
- Test ownership, deterministic fixtures, provider fakes, environment isolation, traceability, CI gates, evidence, defect handling, flake policy, and release blocking.

Excluded:

- Other social platforms.
- Tests of Google/YouTube’s internal implementation; Narrial tests its own adapter assumptions and observed contracts.
- Live production mutation tests, production uploads, destructive tests against real user channels, or use of personal Google accounts.
- Installing tools before the approvals in Sections 8 and 38.
- Treating mocked tests as proof that real OAuth consent, upload, scheduling, quota, or device deep linking works.

## 3. Prerequisite and Entry Gate

Before the complete Stage 12 matrix runs:

1. Documents 04–25 are approved baselines and their unresolved blocking decisions are recorded in Document 03.
2. The implementation under test has passed its feature-level tests from Documents 14–24.
3. Database migrations, encryption, OAuth, upload, scheduling, synchronization, recovery, and observability exist in the isolated test/staging environments.
4. Document 25’s instrumentation gate passes so failures can be diagnosed without exposing credentials.
5. Test accounts, channels, Google projects, credentials, databases, storage, queues, keys, and telemetry are isolated by environment under Documents 10–13.
6. The exact repository commands and test-tool versions are verified from current manifests and CI configuration; this document does not invent commands.
7. A safe cleanup plan exists before creating remote videos or other provider-side artifacts.

No failing, skipped, muted, quarantined-without-expiry, or unexecuted required test may be represented as passing.

## 4. Testing Principles

- Test observable behavior and persisted outcomes, not private method-call sequences.
- Follow RED → GREEN → REFACTOR for new behavior. A new test must fail for the expected reason before implementation makes it pass.
- Every bug fix begins with a regression test that reproduces the defect.
- Prefer real implementation → deterministic fake → stub → interaction mock, in that order.
- Keep most tests small and fast; use fewer medium integration tests and a deliberately small set of critical large E2E tests.
- Use fixed clocks, deterministic IDs/randomness, controlled queues, and explicit time zones. Never solve timing flakiness with arbitrary sleeps.
- Each test owns its data and cleans it safely. Tests pass independently, in random order, and under parallel execution where supported.
- Assert stable public/domain contracts, status transitions, side effects, idempotency, authorization, and telemetry—not SDK internals.
- Test both success and denial/failure paths. “Happy path passes” is insufficient for external, asynchronous, or privileged behavior.
- Production code must not contain test-only bypasses, hardcoded test identities, disabled security, or provider emulation branches reachable in production.

## 5. Test Levels and Resource Classes

| Level | Resource class | Purpose | External network |
|---|---|---|---|
| Unit | Small | Pure validation, state transitions, mapping, policy, time, quota, redaction | Prohibited |
| Component | Small/medium | UI/component behavior or one module with controlled dependencies | Prohibited |
| Contract | Small/medium | Public API, internal ports, jobs, provider adapter fixtures, schemas | Prohibited |
| Integration | Medium | Real application modules with test database/storage/queue/fakes | Local/isolated only |
| Migration/database | Medium | Schema, constraints, transactions, concurrency, migration safety | Test database only |
| System/E2E fake-provider | Medium/large | Full frontend/backend/worker flow with controlled provider | Local/isolated only |
| Staging provider verification | Large | Selected workflows against approved Google/YouTube test assets | Approved staging network only |
| Device/browser | Large | Expo/web navigation, browser handoff, deep links, accessibility/runtime | Approved local/staging targets |
| Performance/resilience/security | Medium/large | Capacity, fault, abuse, recovery, and control verification | Isolated target only |

Small tests run on every relevant change. Medium tests run on pull requests and protected integration branches according to approved CI capacity. Large/provider tests run on controlled gates, never on untrusted contributions with secrets.

## 6. Test Case Specification

Every required test records:

- Stable ID: `YT-TEST-<AREA>-NNN`.
- Requirement/document references and risk addressed.
- Test level/resource class and environment.
- Preconditions, fixture IDs, actor/owner identity, clock/timezone, and feature flags.
- Arrange, action, expected public response/UI, persisted state, remote effect, emitted job/event/audit, and safe telemetry.
- Negative assertions: no cross-owner access, duplicate effect, token exposure, invalid transition, or forbidden retry.
- Cleanup requirements and remote-artifact ledger entry where applicable.
- Automation status, owner, last result, evidence link, and defect reference.

A test without traceability or deterministic expected results is exploratory evidence, not an automated gate.

## 7. Traceability Model

Maintain a machine-readable or consistently structured verification matrix linking:

`Product acceptance criterion → requirement/business rule → API/domain/database contract → threat/control → test IDs → execution evidence → defect/exception`

Rules:

- Every `MUST`, invariant, state transition, error code, privileged action, and acceptance criterion in Documents 04–25 maps to at least one test or an explicitly approved manual verification.
- Every test maps back to at least one requirement or documented risk.
- Coverage by requirement is the primary completeness measure; line/branch coverage is supporting evidence only.
- Removed or changed requirements trigger matrix review and obsolete-test cleanup through version control.
- Unresolved requirements stay visible as `BLOCKED`, never silently omitted.

## 8. Existing and Proposed Test Tooling

Repository evidence currently identifies backend Vitest `3.2.7` in Document 14. The following remain decisions, not approved installations:

| Capability | Current status | Rule |
|---|---|---|
| Backend unit/integration runner | Vitest `3.2.7` documented as existing | Reverify manifest/lockfile/config before use |
| Frontend component testing | TBD | Prefer framework-compatible accessible-query tooling after stack audit |
| HTTP/provider interception | TBD | Select one deterministic tool compatible with Node/runtime boundaries |
| Database isolation | TBD | Use real selected database engine in disposable schema/database/container |
| Browser/web E2E | TBD | Select only if the approved frontend includes a web flow |
| Native device E2E | TBD | Compare approved Expo-compatible options and required CI/device infrastructure |
| Accessibility automation | TBD | Combine automated checks with manual screen-reader/device checks |
| Load/fault testing | TBD | Select after capacity/topology decisions |
| Secret/security scanning | TBD | Integrate approved repository/dependency/runtime controls |

Dependency order:

1. Audit existing manifests, lockfiles, test configs, scripts, runtime versions, and CI.
2. Approve test runner/tool decisions in Document 03 and record them in Document 09.
3. Install only Stage 8 test/deployment tooling from Document 09 after ownership, privacy, licensing, compatibility, and maintenance review.
4. Commit lockfile/config changes with a minimal proving test.
5. Pin CI runtime and cache policy; verify local and CI commands match.

No package is installed by approving this document.

## 9. Test Environment Matrix

| Environment | Data/provider | Permitted tests | Prohibited |
|---|---|---|---|
| Unit process | Synthetic, in-memory | Pure/unit/component/contract | Network, real secrets |
| Local integration | Disposable DB/storage/queue and provider fake | API, repository, worker, migration, fake E2E | Personal accounts, production data |
| CI | Ephemeral isolated resources; no secrets for untrusted changes | Small/medium suites, security scans | Live provider mutation on untrusted code |
| Staging | Dedicated Google project, OAuth client, test users/channels and isolated infrastructure | Approved real-provider, device, E2E, resilience, telemetry verification | Production users/data/credentials |
| Production | Real service | Non-mutating approved smoke/health only | Upload/delete/fault/load/security experiments |

Each environment has distinct database, storage, queue, encryption keys, Google project/client, callback URLs, telemetry, feature flags, and cleanup ownership.

## 10. Fixture Architecture

Fixture layers:

- **Builders:** valid entities by default with explicit overrides; no real personal data.
- **Scenario fixtures:** named cross-entity graphs for connected channel, upload, publication, schedule, sync, recovery, and deletion flows.
- **Provider response fixtures:** sanitized, minimal representations of documented Google/YouTube responses and errors with recorded provenance/date.
- **Infrastructure fixtures:** disposable database/schema, storage objects, queues, clocks, key references, and telemetry sinks.
- **Staging asset registry:** approved test users, channels, videos, playlists if in scope, expected permissions, ownership, cleanup status, and expiry—never secret values.

Fixture requirements:

- Synthetic stable identities such as `user_test_owner_a` and `user_test_owner_b` prove tenant separation.
- Secrets are injected through approved secret storage; fixture files contain placeholders only.
- Video fixtures are organization-owned, license-safe, small enough for routine testing, and include boundary/error cases.
- Provider fixtures exclude real tokens, authorization codes, resumable session URLs, user metadata, and raw production payloads.
- Fixture schema changes are reviewed with contract changes; stale fixtures must fail visibly.

## 11. Canonical Fixture Catalogue

| Fixture ID | Purpose |
|---|---|
| `YT-FIX-USER-A/B` | Two independent owners for authorization/isolation tests |
| `YT-FIX-CONN-HEALTHY` | Active connection with approved scope set |
| `YT-FIX-CONN-REAUTH` | Expired/revoked/unrefreshable permission state |
| `YT-FIX-OAUTH-TXN` | Unused, expired, replayed, mismatched, and consumed state variants |
| `YT-FIX-VIDEO-VALID-SMALL` | Supported owned video with deterministic checksum/metadata |
| `YT-FIX-VIDEO-BOUNDARY` | Size, duration, container, codec, metadata, and filename boundaries |
| `YT-FIX-UPLOAD-PARTIAL` | Persisted resumable progress and restart state |
| `YT-FIX-PUBLICATION` | Uploaded video eligible for immediate publication |
| `YT-FIX-SCHEDULE-DST` | Gap/fold timezone scenarios with fixed tzdb expectation |
| `YT-FIX-SCHEDULE-DUE` | Due, late, missed, cancelled, rescheduled, and stale-generation jobs |
| `YT-FIX-SYNC-STATES` | Processing, published, private, rejected, failed, missing, deleted-candidate states |
| `YT-FIX-PROVIDER-ERRORS` | Normalized 4xx/5xx/timeout/rate/quota/malformed/unknown-outcome cases |
| `YT-FIX-QUOTA` | Warning, reserve, exhausted, reset, and accounting-drift scenarios |
| `YT-FIX-CANARY-SECRETS` | Synthetic token/code/header/URL values for redaction tests |

Exact media files and provider payload shapes require current official-contract verification before fixture approval.

## 12. Provider Fake Contract

The fake implements only the approved provider adapter ports from Documents 08 and 14–22. It must:

- Model OAuth exchange/refresh/revoke and channel/video operations used by Narrial.
- Support deterministic latency, disconnect, timeout-before/after-effect, partial response, malformed response, unknown enum, 401, 403, 404, 409-like conflict where applicable, 429/rate limit, quota exhaustion, and 5xx.
- Model resumable upload session creation, byte-range acknowledgement, expired session, probe/recovery, completion, and unknown outcome.
- Record safe operation/count/input categories for assertions without retaining secrets or content.
- Enforce expected scopes/channel ownership in test scenarios.
- Never be available through production configuration or silently replace staging provider verification.

Contract fixtures are updated only after official documentation review or a sanitized staging observation. A fake matching the implementation but not the provider contract is a false positive.

## 13. Unit Test Matrix

Required unit coverage includes:

- Input normalization and bounds for titles, descriptions, tags, categories, privacy, audience, thumbnails, schedules, IDs, pagination, and idempotency keys.
- Every domain state machine transition, forbidden transition, terminal state, precedence rule, version/fencing check, and invariant.
- OAuth state digest/expiry/single use/return-target allowlist and PKCE parameter construction without logging secrets.
- Scope comparison and permission-health classification.
- Token expiry/skew decision, refresh coordination, preservation of an existing refresh token when omitted, and refresh error classification.
- Provider-to-domain mapping, including unknown enum/field and malformed response behavior.
- Upload chunk/range/progress, checksum, retry eligibility, backoff/jitter bounds, cancellation, and unknown-outcome decisions.
- Publication metadata mapping and policy constraints.
- UTC/timezone conversion, DST gap/fold, clock skew, missed-job policy, reschedule generation, and lateness calculations.
- Sync freshness, missing/deleted candidate rules, terminal polling, and status precedence.
- Quota cost accounting, reserve allocation, forecast, prioritization, and exhaustion decisions.
- Error-to-public-contract mapping and redaction.
- Telemetry field allowlists, bounded labels, audit schema, and canary-secret rejection.

Use fake clocks and deterministic randomness. Assert outcomes, not internal call sequences.

## 14. API and Contract Test Matrix

For every endpoint in Document 15 and later additions, test:

- Valid request/response schema, status, headers, pagination, idempotency, and `supportReferenceId` behavior.
- Missing/invalid authentication; wrong owner; changed/deleted resource; role/scope denial.
- Required/optional/nullable/unknown fields, boundary lengths, Unicode, invalid enums, malformed JSON, media type, and payload-size limits.
- Stable public error code, retryability, recovery action, and absence of raw provider/stack/token data.
- Duplicate request and concurrent mutation behavior.
- Rate limits and abuse controls without cross-user interference.
- Response allowlists: no credential envelope, provider session URI, storage path, queue/lease data, internal audit, or foreign resource.
- Backward-compatible additions and rejection/handling of unsupported contract versions.

Consumer/provider contract tests run for frontend ↔ backend, route ↔ application service, worker message producers ↔ consumers, and service ↔ provider adapter.

## 15. Database and Migration Tests

- Apply all migrations from empty database to current schema using the selected production engine/version.
- Upgrade from each supported deployed version; verify data transforms and defaults.
- Verify constraints, unique/partial indexes, foreign keys, ownership, enum/check rules, timestamps, and cascade/restrict semantics.
- Prove atomic OAuth state consumption, connection upsert, credential replacement, idempotency claim, state/event/outbox commit, schedule claim/reschedule/cancel, and deletion workflow.
- Race concurrent refresh, upload creation, schedule claim, sync, cancel/reschedule, and cleanup transactions.
- Verify optimistic version/fencing prevents stale workers and duplicate remote effects.
- Test rollback only where genuinely supported; otherwise test backup/restore and forward-fix plan.
- Test encryption version compatibility without real keys/tokens and confirm plaintext never persists.
- Test retention/deletion queries, audit restrictions, pagination/index query plans, and backup restoration.
- Prove migrations are compatible with rolling backend/worker versions at the approved deployment boundary.

Each database test uses a disposable isolated database/schema and fails if cleanup escapes its validated target.

## 16. OAuth and Connection Tests

Test end to end with the fake, then selected cases in staging:

- Start from authenticated UI, generate state/PKCE, open browser, consent, callback, backend exchange, channel discovery, encrypted persistence, deep-link/app return, and refreshed UI.
- Consent denied, browser cancelled, callback opened on another device/session, invalid/missing/expired/replayed state, mismatched PKCE, duplicate callbacks, code already used, and callback tampering.
- Exchange timeout before/after provider effect, malformed response, missing refresh token, scope reduction, token expiry, concurrent refresh, revoked grant, password/security change, and clock skew.
- Reconnect same channel, changed Google identity, multiple-channel policy, no eligible channel, permission loss, disconnected local account, Google-side revoke, and account deletion.
- Confirm authorization code/access/refresh/ID tokens, raw state, client secret, and OAuth query values never appear in frontend storage, API response, logs, traces, audits, alerts, or support output.
- Verify redirect/callback/return allowlists and no open redirect.

Real staging tests use organization-controlled accounts and never automate collection of human credentials or bypass Google consent/security challenges.

## 17. Channel and Permission Tests

- Retrieve canonical channel identity and allowed fields; reject no-channel and malformed/multiple unexpected results safely.
- Verify connection/channel owner binding and cross-tenant denial at route, service, repository, and support layers.
- Detect granted, missing, reduced, revoked, and stale scope/permission states.
- Refresh channel data under freshness/30-day policy without excessive quota.
- Reconnect/upsert without duplicate active connections or credential regression.
- Disconnect cancels/blocks eligible work, revokes/deletes credentials, preserves/deletes metadata according to policy, and explains remote YouTube non-deletion.
- Unknown provider fields/states fall back safely and alert without exposing payloads.

## 18. Video Source and Upload Tests

- Ownership, source availability, supported container/codec/type, size/duration, checksum, metadata, thumbnail, corrupt/truncated file, and content-type mismatch.
- Direct/proxy/storage transfer authorization, expiry, resume, cancellation, cleanup, and cross-owner object access.
- Resumable session initiation, chunk acknowledgement, partial progress, restart recovery, session probe, expired session, transient failure, rate/quota failure, permanent rejection, and unknown outcome.
- Cancellation races with chunk completion; duplicate initiate/complete; worker crash before/after remote acknowledgement; database failure after remote video creation.
- Progress is monotonic except an explicit safe reset; UI never claims completion before confirmed YouTube video ID.
- Memory/disk remain bounded and video bytes never enter logs/traces/audits.
- Remote artifact ledger and cleanup handle test videos even when the test aborts.

## 19. Immediate Publication and Metadata Tests

- Valid title/description/tags/category/thumbnail/audience/privacy/playlist combinations and all documented boundaries.
- Explicit made-for-kids and synthetic-media decisions where required; no inferred legal declaration.
- Private/unlisted/public behavior, unverified-project private restriction, notification choice, and playlist permission/error handling.
- Upload succeeds but metadata/thumbnail/playlist step fails; partial result is accurately persisted and recoverable.
- Provider processing delay/rejection, permission loss, unknown outcome, duplicate submission, and reconciliation.
- Persist exact resulting YouTube identifiers once, preserve owner binding, and never fabricate public visibility.
- UI confirmation and status distinguish uploaded, processing, published, restricted, and failed.

## 20. Scheduled Publishing and Worker Tests

- Future-time validation, UTC persistence, IANA timezone, DST gap/fold, leap-day, year boundary, client/server clock skew, and YouTube display-date caveat.
- Create, list, detail, reschedule, cancel, and authorization/error contracts.
- At-least-once delivery, duplicate messages, concurrent workers, lease acquisition/renewal/expiry, fencing, heartbeat loss, crash/restart, stale generation, and outbox replay.
- Worker crash before provider call, during timeout, after provider effect/before database commit, and after commit/before acknowledgement.
- Due, early, late, missed, cancelled, blocked, retrying, exhausted, dead-letter, reconciled, and completed paths.
- Provider scheduling/private prerequisites, permission loss, quota reserve, provider outage, database/queue outage, and deployment version skew.
- Exactly one intended remote publication effect despite retries; cancellation/reschedule wins according to approved concurrency rules.
- Lateness/backlog metrics, audit events, alert, and user-visible recovery are correct.

## 21. Status Synchronization Tests

- Manual, periodic, post-upload, post-schedule, reconnect, and recovery triggers coalesce correctly.
- Map upload processing, scheduled, published, private, rejected, failed, deleted-candidate, confirmed-deleted, and unknown provider states.
- One missing/404 observation never proves deletion; credential/binding/request checks and repeated evidence prevent false positives.
- Stale responses cannot overwrite newer authoritative state; terminal-state precedence and version controls hold.
- Batch partial failure, unknown enum, malformed response, quota pause, provider outage, worker restart, and long downtime recovery.
- Polling slows/stops for terminal states, respects quota priority, and resumes for approved triggers.
- UI/API show last checked time, staleness, safe explanation, retry/reconnect action, and meaningful event history.

## 22. Error, Retry, Reconnection, and Recovery Tests

- Every Document 23 normalized error category maps to correct HTTP/UI code, retry class, backoff, attempt cap, and recovery action.
- Retryable, non-retryable, reauthorization, quota-deferred, cancelled, unknown-outcome, dead-letter, and operator-review paths.
- Exponential backoff boundaries and jitter use deterministic seeded tests; retry-after is bounded/validated.
- Idempotency survives API retries, process crash, queue redelivery, database reconnect, and provider ambiguity.
- Circuit/bulkhead/rate controls prevent retry storms and preserve critical quota/capacity.
- Reconnection preserves safe work where valid and blocks or explains work requiring new consent.
- Manual replay/reconciliation requires privileged authorization, reason, audit, current-state check, and fencing.
- Recovery updates domain state, events, telemetry, and UI consistently without erasing failure history.

## 23. Security Test Matrix

At minimum:

- Authentication bypass, IDOR/cross-tenant access, role escalation, forged actor IDs, mass assignment, and support-tool enumeration.
- OAuth CSRF/state replay, PKCE mismatch, open redirect, deep-link spoofing, callback confusion, code/token leakage, and login CSRF.
- SQL/command/path/header/log injection, SSRF through URLs/storage/media references, malicious filenames/metadata, oversized/decompression/resource-exhaustion inputs.
- Credential encryption/decryption authorization, key-version rotation, plaintext scans, secret scanning, backups, telemetry redaction, and error-response leakage.
- Rate-limit bypass, concurrent abuse, upload/schedule spam, quota exhaustion, and tenant fairness.
- Dependency/SBOM/license/vulnerability and build artifact scans under approved policy.
- Security headers/CORS/cookie/session/TLS configuration where applicable.
- Revocation, disconnect, deletion, retention expiry, backup aging, and least-privilege access.

Automated scanners supplement but do not replace manual threat-model review and authorized penetration testing. Destructive security testing is limited to isolated environments.

## 24. Privacy and Compliance Tests

- Consent UI accurately identifies YouTube access, purpose, scopes, terms/privacy links, disconnect, revocation, and deletion.
- Data minimization: APIs, database, telemetry, support, exports, and UI contain only approved fields.
- App-initiated revocation and user/account deletion complete and produce evidence within Document 24’s applicable seven-day maximum.
- Google-side revocation/unrefreshable data and other refresh/delete rules meet Document 24’s applicable 30-day limits.
- Local deletion does not falsely claim deletion of YouTube-hosted content.
- Retention jobs, vendors, caches, telemetry, diagnostic bundles, and backups expire/propagate as approved.
- Export/correction and privacy-request ownership/authorization prevent disclosure to another user.
- Scope increases and purpose changes block release until consent/policy documentation is updated.

Use accelerated test clocks but also verify actual timestamp/deadline calculations; never wait days in a test.

## 25. Quota and Abuse Tests

- Account every approved YouTube operation using currently verified cost configuration; detect unknown/unaccounted operation.
- Warning, reserve, exhausted, reset, forecast, drift, and operator override behavior.
- Priority ordering preserves callback/channel verification, scheduled deadlines, reconciliation, and deletion/revocation according to Document 24.
- Noncritical polling/upload attempts defer gracefully and show safe user state.
- Per-user/connection/project limits prevent one actor from consuming shared capacity.
- Retry, batch, field selection, caching/freshness, coalescing, and terminal polling reduce calls as designed.
- Concurrent workers cannot overspend a reservation due to stale counters.
- Midnight Pacific quota reset or current provider rule is verified against authoritative configuration; clock/timezone tests prevent local-time assumptions.
- Dashboard/alerts/accounting reconcile with fake/provider observations within approved tolerance.

Tests must not intentionally exhaust a shared real project. Exhaustion is simulated except in an explicitly approved isolated quota exercise.

## 26. Observability and Audit Tests

- Every principal workflow is locatable from `supportReferenceId` through request/correlation/trace and safe domain/audit events.
- Logs are structured; metric labels are bounded; traces connect across outbox/queue/worker boundaries.
- Canary secrets, OAuth values, content metadata, raw errors, and PII never reach any telemetry sink or alert.
- Dashboard queries match authoritative synthetic state within documented lag.
- Test-fire each alert, verify ownership/deduplication/recovery/backup channel/runbook.
- Liveness/readiness/startup/worker health are minimal, correct under dependency failures, and consume no YouTube quota.
- Audit append/integrity/access/export behavior and failure coupling pass.
- Exporter/collector/storage/alert-delivery outage is detected and application degradation remains bounded.

## 27. Frontend Component and UI-State Tests

For each Document 04 state, verify visible content, enabled actions, accessibility, API interaction, and recovery:

- Loading, empty/not connected, consent explanation, browser handoff, callback pending, connected, multiple/unsupported channel result, permission missing, reconnect required, disconnect confirmation, and failure.
- Source selection/validation, metadata form validation, upload preparation/progress/pause/cancel/retry, processing, immediate publish confirmation, schedule editor/timezone/DST, scheduled list/detail, status freshness, and terminal failures.
- Slow/offline/reconnected network, background/foreground, cold start, stale cache, duplicate tap, navigation back, app killed during browser/upload, and expired session.
- Screen-reader names/roles/states, focus order/return, keyboard use where applicable, touch target, text scaling, contrast, reduced motion, orientation, and error association.
- No access/refresh token, authorization code, resumable URI, storage secret, raw provider error, or foreign resource in UI state, device storage, console, analytics, screenshots, or network response.

Prefer accessible role/name queries and behavior assertions. Use small reviewed snapshots only for stable structures; do not use snapshots as the main correctness proof.

## 28. Device, Browser, and Deep-Link Matrix

Exact supported versions/devices require product approval. Minimum categories:

| Category | Required verification |
|---|---|
| iOS physical device | System browser OAuth, app return/universal link, cancel, cold start, background/kill, permissions, upload interruption |
| Android physical device | Custom tab/browser OAuth, app link, back/cancel, process recreation, upload interruption |
| iOS/Android emulator | Repeatable navigation/UI/error tests where provider policy allows |
| Web browser, if supported | Redirect callback, history/back, popup/tab behavior, storage isolation, CORS/CSP, responsive/accessibility |
| Network profiles | Offline, high latency, packet loss, transition Wi-Fi/cellular, reconnect |

Test at least one small and one approved boundary media fixture on relevant physical devices. Device automation complements, not replaces, manual OAuth and accessibility checks.

## 29. Performance, Capacity, and Reliability Tests

Targets remain **TBD — Requires approved NFRs and capacity assumptions**. Measure:

- API p50/p95/p99 latency and error rate by route class.
- OAuth callback throughput and refresh concurrency.
- Upload throughput, memory/disk, resumability, concurrent users, storage/network saturation.
- Queue depth/oldest age, schedule claim and execution lateness, worker throughput, sync backlog/freshness.
- Database pool/query/lock behavior, index plans, migration duration, cleanup/deletion throughput.
- Provider/quota call volume and telemetry overhead/cardinality/cost.

Run baseline, expected load, approved peak, soak, burst, and recovery tests in isolated infrastructure. Never infer production capacity from a laptop or provider fake alone. Results record topology, dataset, build, flags, sampling, duration, and limitations.

## 30. Failure-Injection Matrix

Inject one and combined failures at safe boundaries:

| Boundary | Failures |
|---|---|
| API/runtime | crash, restart, timeout, partial shutdown, version skew |
| Database | unavailable, slow, deadlock/serialization failure, commit ambiguity, pool exhaustion |
| Queue/worker | delayed/duplicate/out-of-order/lost-visible message, lease loss, worker crash, dead letter |
| Storage/source | expired authorization, partial transfer, missing object, corrupt bytes, cleanup failure |
| Google OAuth | deny, invalid grant, timeout, malformed token response, revoked permission |
| YouTube API | latency, 401/403/404/429/5xx, quota exhausted, malformed/unknown response, effect-before-timeout |
| Keys/secrets | unavailable key version, rotation overlap, denied secret access |
| Network/time | disconnect, DNS/TLS failure, clock skew, timezone database edge |
| Observability | exporter/collector/storage/alert outage, redaction rejection, ingestion delay |

For every injection assert user impact, safe state, retry/reconciliation, idempotency, no duplicate remote effect, telemetry/audit, alert/runbook, and eventual recovery.

## 31. End-to-End Critical Journeys

Minimum release-blocking journeys:

1. New user connects an approved YouTube channel and sees verified channel identity.
2. User denies consent and returns safely with a recoverable explanation.
3. Connected user uploads a valid video, observes progress/processing, publishes with approved metadata, and sees the YouTube identifier/status.
4. User schedules a private uploaded video across an approved timezone case; worker publishes once and status synchronizes.
5. User cancels/reschedules while work is pending; stale job cannot publish.
6. Token expires and refresh succeeds without user interruption.
7. Permission is revoked; work stops safely, UI requests reconnection, reconnect restores eligible operation.
8. Provider timeout after possible remote effect reconciles without duplicate upload/publication.
9. Quota reserve/exhaustion defers noncritical work and protects approved critical work.
10. User disconnects; credentials are revoked/deleted, future work stops, and remote YouTube content is accurately explained.
11. User/account deletion propagates through active data, telemetry/support views, vendors, and backup policy with audit evidence.
12. Support diagnoses a synthetic failure by reference without seeing secrets or another tenant’s data.

Fake-provider E2E runs routinely. A risk-selected subset runs with approved real staging accounts before release.

## 32. Real Google/YouTube Staging Verification

Real-provider tests require:

- Organization-owned staging Google Cloud project/OAuth client and named owner.
- Test-user allowlisting/verification status appropriate to the consent configuration.
- Dedicated channels containing no personal or production content.
- Approved scopes, quota budget, daily execution cap, test schedule, and cleanup ledger.
- Secure secret injection and trusted-branch/manual approval; no credentials in CI logs/artifacts.
- Unique test marker in allowed metadata only when it will not expose internal secrets; remove remote artifacts after evidence capture.

Verify at minimum consent/callback, channel discovery, refresh-token continuity, one small resumable upload, allowed metadata/privacy, selected scheduling behavior, status retrieval, revocation/reconnect, and cleanup. Google’s variable processing time is handled with bounded polling and explicit inconclusive status, not arbitrary pass/fail sleep.

## 33. Test Data Cleanup and Remote Artifact Ledger

Every mutating large/staging test records:

- Test run ID, environment, owner, local resource IDs, safe remote identifier, creation time, intended privacy, cleanup action, deadline, attempts, result, and exception owner.
- Cleanup runs in `finally`/post-run and through a scheduled sweeper for aborted runs.
- Cleanup validates environment/project/channel before remote or recursive deletion.
- Failed cleanup alerts an owner and blocks further mutating tests if accumulation risks quota/privacy/cost.
- Evidence retention never requires keeping a remote test video; retain safe IDs/results instead.

Test databases/storage are deleted only through explicit validated targets. Production and personal resources are never cleanup targets.

## 34. CI and Execution Gates

| Gate | Required execution |
|---|---|
| Local focused loop | New/changed small test: observe expected RED, implement GREEN, refactor, rerun focused suite |
| Pull request | Lint/type/build as applicable; affected unit/component/contract/integration/migration/security tests; no live secrets |
| Protected integration | Full small/medium suite, fresh database migrations, fake-provider E2E, coverage/traceability check |
| Staging candidate | Full matrix plus device/accessibility, real-provider selected cases, load/fault/observability/security exercises |
| Release approval | Re-run risk-affected tests on immutable candidate; review evidence, defects, exceptions, rollback/smoke plan |
| Post-deploy | Non-destructive smoke, health/readiness, dashboards/alerts; no test upload to real user channel |

Exact commands are populated only after re-reading current repository scripts and CI. Parallel/shard execution must preserve isolation and combine results reliably.

## 35. Coverage and Mutation Policy

- Requirement, state-transition, error, permission, and threat coverage are mandatory.
- Line/branch/function thresholds are **TBD — Requires baseline and owner approval**; thresholds may not be lowered merely to pass a change.
- Changed-code coverage should not regress and critical security/idempotency/state-machine logic requires explicit branch coverage.
- Mutation testing is recommended for state machines, retry/idempotency, permission, quota, and time calculations after tool approval.
- Generated code and third-party SDK internals may be excluded with documented rationale; application adapters are not excluded.
- Coverage from unit and integration levels is reported separately so E2E does not hide untested logic.

## 36. Flaky Test and Quarantine Policy

- A failure is investigated, not rerun until green and ignored.
- Automatic retries may collect diagnostic evidence but the initial failure remains visible.
- Quarantine requires defect ID, owner, reason, risk assessment, compensating test, expiry, and approval.
- Release-blocking security, ownership, idempotency, deletion, migration, or critical E2E tests cannot be silently quarantined.
- Fix nondeterminism with clocks, events, polling with deadlines, isolation, controlled randomness, and provider fakes—not long sleeps.
- Track flake rate, top offenders, quarantine age, and time to repair. Expired quarantine fails the gate.

## 37. Defect Severity and Exit Rules

| Severity | Example | Release effect |
|---|---|---|
| Critical | Credential exposure, cross-tenant access, unintended public publish, deletion failure/deadline breach | Always blocks |
| High | OAuth/upload/schedule core journey broken, duplicate remote effect, migration/data loss, observability blindness | Blocks |
| Medium | Recoverable secondary behavior or accessibility defect with bounded workaround | Requires explicit risk approval and expiry |
| Low | Cosmetic/non-blocking issue outside acceptance promise | May defer with owner and target |

Severity is based on impact and exploitability, not implementation effort. Fixed defects require a regression test and full affected-suite pass.

## 38. Decisions Requiring Approval

| ID | Decision | Recommended direction | Blocks |
|---|---|---|---|
| `YT-TEST-DEC-001` | Frontend component test runner/library | Match approved Expo/React stack and accessible-query support | UI automation |
| `YT-TEST-DEC-002` | HTTP/provider fake tooling | One deterministic Node-compatible boundary tool | Provider integration tests |
| `YT-TEST-DEC-003` | Disposable database strategy | Real production engine/version in isolated DB/schema/container | Migration/integration gate |
| `YT-TEST-DEC-004` | Browser/native E2E tools and supported device matrix | Small critical suite on physical iOS/Android plus applicable web | Device gate |
| `YT-TEST-DEC-005` | Accessibility automation/manual standard | Automated checks plus screen reader/manual WCAG review | UX acceptance |
| `YT-TEST-DEC-006` | Load/fault/security toolchain | Select after topology, capacity, and CI review | Nonfunctional gate |
| `YT-TEST-DEC-007` | Coverage/mutation thresholds | Baseline first; protect critical changed code | CI gate |
| `YT-TEST-DEC-008` | CI stages, trusted-secret workflow, and runtime budget | No provider secrets on untrusted changes | Automation |
| `YT-TEST-DEC-009` | Staging Google accounts/channels and cleanup owner | Organization-controlled isolated assets | Real-provider gate |
| `YT-TEST-DEC-010` | Real-provider test frequency/quota budget | Risk-selected/manual or scheduled, not every PR | Staging operations |
| `YT-TEST-DEC-011` | Performance targets/capacity dataset | Derive from approved NFR/product promise | Load acceptance |
| `YT-TEST-DEC-012` | Flake/quarantine SLA and approver | Short expiry, visible failure, named owner | Release gate |
| `YT-TEST-DEC-013` | Test evidence retention and access | Minimized, environment-specific, privacy-approved | Compliance evidence |
| `YT-TEST-DEC-014` | Authorized penetration-test scope/vendor | Isolated staging with written rules of engagement | Security approval |

Record approvals and rejected alternatives in Document 03 and package changes in Document 09. No AI agent may approve these decisions.

## 39. Full Verification Matrix

| Area | Unit | Contract | Integration/DB | UI/device | Staging/E2E | Failure/security |
|---|---:|---:|---:|---:|---:|---:|
| Connection/OAuth | Required | Required | Required | Required | Required | Required |
| Channel/permissions | Required | Required | Required | Required | Required | Required |
| Source/upload | Required | Required | Required | Required | Required | Required |
| Immediate publication | Required | Required | Required | Required | Required | Required |
| Scheduling/workers | Required | Required | Required | Required | Required | Required |
| Status synchronization | Required | Required | Required | Required | Required | Required |
| Retry/recovery | Required | Required | Required | As applicable | Required | Required |
| Security/privacy/deletion | Required | Required | Required | Required | Required | Required |
| Quota/abuse | Required | Required | Required | Required states | Selected | Required |
| Observability/audit/support | Required | Required | Required | Safe reference UI | Required | Required |
| Migration/deployment compatibility | As applicable | Required | Required | Smoke | Required | Required |

“Required” means at least one test and usually a family of tests traced to all applicable rules; it does not mean one superficial test satisfies the area.

## 40. Acceptance Criteria

Document 26’s verification gate passes only when:

- [ ] Every requirement, invariant, transition, public error, threat control, and acceptance criterion in Documents 04–25 is mapped to passing evidence or an explicitly blocked decision.
- [ ] New behavior and defect fixes demonstrate RED → GREEN evidence where practicable.
- [ ] Existing and newly approved tools, commands, versions, and CI stages are documented and reproducible.
- [ ] Unit, component, contract, integration, database/migration, fake-provider, UI/device, security, privacy, quota, observability, resilience, and critical E2E suites pass on the immutable candidate.
- [ ] Selected real Google/YouTube staging workflows pass with approved isolated assets and cleanup evidence.
- [ ] Authentication, ownership, encryption, token/redaction, idempotency, unknown-outcome, deletion, and unintended-publication tests have zero unresolved failures.
- [ ] No required tests are skipped, focused-only, silently retried, or expired in quarantine.
- [ ] Coverage and performance/capacity targets meet approved thresholds without unexplained regression.
- [ ] Failure injection proves bounded degradation, correct recovery, no duplicate remote effect, and actionable telemetry.
- [ ] Accessibility and supported physical-device/browser checks pass.
- [ ] Test artifacts contain no secrets, production data, raw provider payloads, or unapproved personal data.
- [ ] Remote/local fixture cleanup is complete or tracked as a blocking exception.
- [ ] All critical/high defects are closed with regression tests; remaining exceptions have owner, mitigation, approver, and expiry.
- [ ] Evidence package is complete, reviewable, and linked from the progress tracker.

Any failure in security, tenant isolation, token handling, idempotency, data integrity, deletion/compliance, or unintended publication blocks release and cannot be waived informally.

## 41. Evidence Package and Test Report

The final report records:

- Candidate commit/build/release, environment/topology, migration version, feature flags, dependency lock hash, and test-tool versions.
- Suite commands, start/end times, counts passed/failed/skipped/quarantined, duration, coverage, and artifact links.
- Requirement traceability summary and uncovered/blocked items.
- Device/browser/OS matrix and manual accessibility results.
- Real-provider account/channel aliases, quota consumed, remote artifact cleanup, and provider limitations—never secrets.
- Performance/load/fault configuration and results.
- Security/privacy/redaction/deletion and observability evidence.
- Defects, flaky tests, exceptions, residual risk, approvals, and final gate decision.

Evidence is immutable or integrity-protected, access-controlled, retention-approved, and contains synthetic/minimized data.

## 42. Implementation Checkpoints

1. Build requirement-to-test traceability while each feature is specified.
2. Add failing unit/contract tests before each implementation behavior.
3. Add database/integration tests with each persistence boundary and migration.
4. Add fake-provider and worker failure tests before enabling external side effects.
5. Add UI/component/device-state tests with frontend implementation.
6. Add security, quota, recovery, and observability tests with Documents 23–25.
7. Provision approved isolated staging fixtures and tooling only after decisions/credentials are authorized.
8. Run the complete matrix, repair defects/flakes, and rerun only after relevant changes.
9. Produce the evidence package and obtain the sign-offs in Section 43.

## 43. Sign-Off Record

| Approval | Named owner | Evidence | Decision/date | Status |
|---|---|---|---|---|
| Product/requirements coverage | Unassigned | Required | Required | Blocked |
| Backend/API/database verification | Unassigned | Required | Required | Blocked |
| Frontend/device/accessibility verification | Unassigned | Required | Required | Blocked |
| Google/YouTube staging verification | Unassigned | Required | Required | Blocked |
| Security/privacy/compliance verification | Unassigned | Required | Required | Blocked |
| Performance/resilience/observability verification | Unassigned | Required | Required | Blocked |
| Test infrastructure/CI approval | Unassigned | Required | Required | Blocked |
| Stage 12 completion | Unassigned | Required | Required | Blocked |

No AI agent may self-approve a gate or claim tests passed without actual execution evidence.

## 44. Approval Record

Approval to add this document approves only the documentation baseline. It does not approve test dependencies, CI changes, database creation, external credentials/accounts, test data, remote uploads, penetration testing, staging execution, production access, or implementation.

## 45. Prerequisites and Next Document

Prerequisites:

- `04-user-journeys-screens-and-interface-states.md`
- `05-functional-requirements-and-business-rules.md`
- `06-nonfunctional-requirements-and-quality-attributes.md`
- `07-system-architecture-and-service-boundaries.md`
- `08-domain-model-state-machines-and-api-contracts.md`
- `09-technology-stack-dependencies-and-installation-order.md`
- `10-environments-hosting-urls-and-secret-ownership.md`
- `11-google-cloud-console-and-youtube-api-setup.md`
- `12-database-design-collections-relations-and-migrations.md`
- `13-security-model-token-encryption-and-threat-controls.md`
- `14-backend-foundation-and-implementation-structure.md`
- `15-backend-api-endpoints-and-error-contract.md`
- `16-oauth-connection-callback-and-token-lifecycle.md`
- `17-youtube-channel-discovery-permissions-and-management.md`
- `18-frontend-structure-connection-ui-and-api-integration.md`
- `19-video-source-validation-and-upload-workflow.md`
- `20-immediate-publishing-and-youtube-metadata.md`
- `21-scheduled-publishing-workers-and-timezones.md`
- `22-video-status-synchronization-and-display.md`
- `23-errors-retries-reconnection-and-recovery.md`
- `24-security-privacy-quota-and-compliance-operations.md`
- `25-observability-auditing-monitoring-and-support.md`

Next: `27-deployment-environment-variables-and-release-runbook.md`, defining environment configuration, secret injection, migrations, workers, staging/production deployment, flags, rollback, backup/restore, and credential promotion.

## 46. Change Log

| Version | Date | Change | Approval |
|---|---|---|---|
| 1.0.0 | 2026-08-26 | Initial testing strategy, fixtures, and complete verification matrix generated and added at user request | User approved document creation only |
