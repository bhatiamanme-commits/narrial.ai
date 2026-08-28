# YouTube Connection — Codex Implementation Context and Copyable Prompts

## Purpose

This is the permanent entry point for implementing the YouTube Connection module across new Codex conversations. It converts the source-of-truth documents `00`–`30` into one-task-at-a-time execution prompts.

Do not regenerate Documents `00`–`30`. Document 28 is the authoritative live tracker. Before starting any task, confirm its current status there; if this file and Document 28 disagree, Document 28 wins and this file must be corrected.

## How to use this file

1. Open Codex in the repository workspace.
2. In every new conversation, paste **Session Rules** once.
3. Paste only the next incomplete task prompt shown as authorized by Document 28.
4. Wait for Codex to finish and update Document 28.
5. Continue only when the task status is `Verified`:
   - `Verified` → paste the next task.
   - `Blocked` → answer the requested decision and continue the same task.
   - `Failed/Regressed` → continue the same task until fixed.
   - `Implemented, unverified` → do not advance.
6. Paste the phase checkpoint after all tasks in that phase are verified.
7. Never paste all task prompts at once.
8. If Codex has workspace access, provide paths only. If it does not, attach Document 28 and only the controlling documents listed in the selected prompt.

## Session Rules — paste first in every new conversation

```text
We are implementing the Narrial YouTube Connection module using the source-of-truth documents in:

docs/youtube-connection/

Operating rules:

1. Read Document 28 first, then read only the controlling documents named in the task prompt.
2. Work on exactly one YT-TASK ID. Do not start the next task.
3. Work only on the YouTube Connection module. Do not add Instagram, TikTok, Facebook, or generic multi-platform functionality.
4. Inspect existing repository code before modifying anything.
5. Preserve unrelated files and existing user changes.
6. Do not regenerate or broadly rewrite Documents 00–30.
7. Update an owning document only if implementation discovers a genuine contradiction or approved decision change.
8. Do not make undocumented product, security, infrastructure, or provider assumptions.
9. If an approval-gated dependency, database, external service, credential, migration, deployment, or destructive action is required, stop before performing it and request the exact approval needed.
10. Never print, inspect unnecessarily, commit, log, or place secrets in evidence.
11. Use official documentation for version-sensitive framework, Google, YouTube, Clerk, Expo, Fastify, database, and deployment decisions.
12. Implement incrementally and test-first where behavior changes.
13. Run focused tests first, followed by the complete applicable typecheck, lint, test, and build gates.
14. A task is not complete merely because code exists. It must meet its acceptance criteria with reproducible evidence.
15. Update Document 28 in the same change with task status, files changed, commands executed, test/build results, evidence ID, decisions made, remaining blockers, and exact next task.
16. Do not mark a task Verified when required tests fail or were not executed.
17. End with a concise report containing outcome, changed files, verification results, evidence ID, unresolved blockers, and whether the next task is authorized.

Do not perform any work until I provide one YT-TASK prompt.
```

## First approval — use only if Document 00 is still awaiting approval

Review Document 00 yourself. If you agree with it, paste:

```text
I formally approve:

docs/youtube-connection/00-existing-work-and-current-state-audit.md

as the current repository audit baseline.

This approval does not authorize dependency installation, database creation, Google Cloud configuration, credentials, deployment, or production release.

Update Document 28 to record this approval, then stop. Do not begin implementation in this task.
```

# Phase B — Foundation and Persistence

## B01 — Diagnose backend test failures

```text
Execute YT-TASK-B01.

Read Documents 00, 14, 26, and 28.

Reproduce and diagnose the two recorded backend Vitest timeouts. Determine the root cause before changing behavior. Do not implement YouTube features or unrelated refactors. If the root cause has a narrow, safe correction within the existing backend foundation, implement it with a regression test. Otherwise document the proven cause and exact required fix without guessing.

Run the affected tests and complete backend test suite. Update Document 28 with evidence. Completion requires the previously timed-out cases to pass or the task to be explicitly marked Blocked with proven evidence.
```

## B02 — Verify the Fastify foundation

```text
Execute YT-TASK-B02 only after B01 is Verified.

Read Documents 00, 06–09, 14, 26, and 28.

Re-audit the Fastify safety foundation. Verify configuration validation, safe errors, CORS, security headers, request correlation, health and unknown-route behavior, timeouts, shutdown, logging/redaction, ESM, and TypeScript compatibility.

Fix only verified foundation defects. Do not add YouTube workflows. Run focused tests and complete backend typecheck, lint, test, and build commands. Update Document 28. Completion requires a clean backend foundation gate.
```

## B03 — Authentication and YouTube module boundary

```text
Execute YT-TASK-B03 only after B02 is Verified.

Read Documents 03, 07–10, 13–15, 26, and 28.

Implement the authenticated backend YouTube module boundary test-first: verify Narrial/Clerk sessions on the backend; derive user identity from verified authentication; create the YouTube module/plugin boundary; add boundary validation and safe response serialization; reject unauthenticated and cross-user access; establish domain/service/repository/provider interfaces without Google calls; and add deterministic fakes and contract tests.

Before installing anything, verify YT-INSTALL-01. If the exact dependency is unapproved, present one recommendation with official evidence and wait. Do not implement Google OAuth or database persistence. Update Document 28. Completion requires authenticated contract tests and all backend gates to pass.
```

## B04 — Development database and first migration

```text
Execute YT-TASK-B04 only after B03 is Verified.

Read Documents 03, 07–10, 12–14, 26, and 28.

Prepare and implement the approved development persistence foundation. Before installation or database creation, verify YT-INSTALL-02 and YT-DB-01; confirm the database engine, migration tooling, local/development host, ownership, region policy, and retention; present exact packages, versions, commands, expected files, rollback, and verification; and request explicit YT-DB-02/YT-DB-03 authorization.

After approval, install only approved packages, create only the isolated local/development database, implement the approved schema, create/apply the first migration, document rollback/forward recovery, and test clean creation/migration. Never connect to staging or production. Update Document 28 with evidence.
```

## B05 — Repositories, transactions, and idempotency

```text
Execute YT-TASK-B05 only after B04 is Verified.

Read Documents 05–08, 12, 14–15, 23, 26, and 28.

Implement the YouTube persistence layer test-first: user-scoped repositories; atomic single-use OAuth transactions; connection/channel persistence; credential-record boundary without plaintext; required upload/publication/schedule/status foundations; ownership constraints; concurrency guards; idempotency claim, payload-hash validation, stored outcomes, and mismatch handling; approved transactional outbox/durable intent; audit persistence; and migration/concurrency tests.

Do not call Google or store real credentials. Update Document 28. Completion requires isolation, transaction, idempotency, migration, and concurrency tests to pass.
```

## B06 — Credential encryption vault

```text
Execute YT-TASK-B06 only after B05 is Verified.

Read Documents 06, 08, 10, 12–14, 16, 24–26, and 28.

Implement the credential-vault and key-adapter boundary test-first. Confirm the approved local/test encryption design and key-version format from Document 13. Do not select a production KMS provider without approval.

Implement authenticated encryption, key-version storage/lookup, vault-only encrypt/decrypt operations, tamper/wrong-key failure, rotation compatibility, no plaintext persistence, and no token/key leakage in logs, APIs, tests, snapshots, or evidence. Use only fake credentials. Update Document 28. Completion requires encryption, tamper, redaction, database, and backend tests to pass.
```

## Checkpoint B

```text
Evaluate Checkpoint B from Document 28.

Read Documents 12–15, 26, and 28.

Verify with fresh evidence that B01–B06 are Verified; backend gates are clean; authenticated routes reject invalid/cross-user access; database/migrations are reproducible; repositories/idempotency work under concurrency; the credential vault never persists/exposes plaintext; and tests require no Google calls.

Do not begin Phase C if anything is missing. Update Document 28 with the checkpoint result and stop.
```

# Phase C — Real YouTube Connection

## C01 — Staging Google configuration

```text
Execute YT-TASK-C01 only after Checkpoint B passes.

Read Documents 03, 10–11, 13, 16, 24, 27, and 28.

Before external action, confirm the organization-owned Google account/owner, staging project alias, exact callback and app return, scopes/use case, privacy/terms domains, test users/channel, secret storage, and rotation ownership. Request explicit YT-INFRA-GATE-003 authorization.

After approval, configure only staging: create/configure the project, enable only required YouTube API, configure consent/test users/OAuth client/exact callback, store the client secret only in the approved backend secret boundary, and record safe evidence. Do not create production credentials. Update Document 28 and stop after verification.
```

## C02 — OAuth initiation and callback

```text
Execute YT-TASK-C02 only after C01 and Checkpoint B are Verified.

Read Documents 05–08, 10–11, 13–16, 23, 26, and 28.

Implement OAuth initiation, protected state, callback, code exchange, and connection completion test-first: authenticated initiation; expiring environment/user-bound single-use transaction; approved PKCE; exact callback; strict code/error/state validation; atomic consume/replay rejection; no blind code-exchange retry; validated token response; encrypted persistence; safe allowlisted app return; authoritative client refetch; and deterministic fake tests before staging.

Never log/return codes, state, tokens, or raw provider responses. Update Document 28. Completion requires contract/security tests and one approved staging callback flow.
```

## C03 — Token lifecycle

```text
Execute YT-TASK-C03 only after C02 is Verified.

Read Documents 05–06, 08, 13, 16, 23–24, 26, and 28.

Implement access-token expiry, concurrency-safe refresh, refresh-token preservation, failure classification, invalid_grant/revoked-permission handling, reconnect-required state, atomic reconnect credential replacement, revocation/local invalidation, encrypted persistence, and redacted diagnostics. Add race, expiry, revocation, and failure-injection tests.

Use staging credentials only for separately approved verification. Update Document 28. Completion requires lifecycle and concurrency tests to pass.
```

## C04 — Channel discovery and management

```text
Execute YT-TASK-C04 only after C03 is Verified.

Read Documents 05, 08, 12, 15–17, 23, 26, and 28.

Implement channel discovery, permission validation, connection management, and disconnection test-first: retrieve the authorized channel; validate responses; store normalized safe identity/metadata; verify permissions; enforce approved cardinality/shared-channel rules; idempotent reconnect/upsert; refresh channel info; list safe health; disconnect/revoke per approved rules; and block mutations from unusable connections.

Update Document 28. Completion requires provider contract tests and approved staging channel verification.
```

## C05 — Real frontend connection

```text
Execute YT-TASK-C05 only after C04 backend contract tests pass.

Read Documents 04–05, 08, 10, 15–18, 23, 26, and 28.

Replace the frontend YouTube connection mock with the authenticated backend flow: typed API client; Clerk token; connection query/refetch; backend authorization URL; secure browser; cold/warm app return; return as refetch signal; connected, permission-limited, reconnect, disconnected, loading, empty, cancellation, offline, and error states; accessible controls; and no Google credentials/tokens in the client.

Do not remove unrelated mocks. Run frontend tests, typecheck, lint, build, and device verification. Update Document 28.
```

## Checkpoint C

```text
Evaluate Checkpoint C from Document 28.

Read Documents 15–18, 23, 26, and 28.

Using an organization-controlled staging user/channel, verify connect, callback, encrypted token storage, refresh, discovery, reconnect, disconnect/revocation, cold/warm mobile return, cross-user/environment rejection, and absence of secrets in logs/UI/storage/network/screenshots. Clean only approved artifacts.

Do not begin Phase D unless the complete connection checkpoint is Verified.
```

# Phase D — Upload and Immediate Publication

## D01 — Video source ownership and validation

```text
Execute YT-TASK-D01 only after Checkpoint C passes.

Read Documents 05–08, 10, 12–15, 19, 23–24, 26, and 28.

Implement the approved video-source ownership, storage, validation, and cleanup slice test-first: verify ownership/authorization; implement the approved source adapter; validate size, format, MIME/magic bytes, duration, readability, and lifecycle; prevent path traversal, SSRF, cross-user access, and stale temporary authorization; stream instead of whole-file buffering; persist safe source state; and implement expiration/cleanup with bounded synthetic fixtures.

If storage dependencies/resources are required, stop at YT-INSTALL-05/YT-INFRA-GATE-004 and request exact approval. Update Document 28.
```

## D02 — Resumable YouTube upload

```text
Execute YT-TASK-D02 only after D01 is Verified.

Read Documents 05–06, 08, 12–15, 19, 23, 25–26, and 28.

Implement resumable upload test-first: validate user/source/connection/channel/metadata/idempotency; persist intent before remote effects; create/protect the resumable session; stream with backpressure; persist confirmed progress; query/resume interruptions; cancel; classify retryable, terminal, credential, quota, and unknown outcomes; and reconcile uncertainty before repeating mutations.

Keep session URLs out of APIs, jobs, logs, and evidence. Complete deterministic interruption/retry/concurrency tests before staging. Update Document 28.
```

## D03 — Metadata and immediate publishing

```text
Execute YT-TASK-D03 only after D02 is Verified.

Read Documents 02, 04–05, 08, 12, 15, 17, 19–20, 23–24, 26, and 28.

Implement metadata validation and immediate publication test-first: title, description, tags, category, thumbnail, audience, privacy, playlist, approved optional fields, server validation, audience policy, privacy confirmation, thumbnail ownership/format, idempotent publication intent, safe YouTube ID/URL persistence, distinct transfer/processing/publication states, quota/error classification, confirmation, and audit.

Do not claim published from upload completion. Update Document 28.
```

## D04 — Frontend upload and publication

```text
Execute YT-TASK-D04 only after D03 backend contracts pass.

Read Documents 04–05, 08, 15, 18–20, 22–23, 26, and 28.

Implement the frontend source, metadata, upload, processing, and publication workflow: validation feedback; metadata/audience/privacy form; selected-channel confirmation; progress/cancellation; interruption/resume; processing; success/video link; restricted, rejected, reconnect, quota, retryable, unknown, and terminal states; duplicate-submit prevention; lifecycle/network recovery; accessibility; and responsive behavior.

Use backend truth for durable states. Update Document 28 after frontend verification.
```

## D05 — Staging upload/publication E2E

```text
Execute YT-TASK-D05 only after D01–D04 are Verified.

Read Documents 19–20, 23–26, and 28.

Before live upload, confirm the exact staging project/user/channel, harmless test video, privacy, quota budget, cleanup authority, and evidence redaction. Run fake and staging E2E for normal upload, interruption/resume, cancellation, duplicate request, processing, publication, provider error, quota, expired permission, and unknown-outcome reconciliation.

Remove or retain remote artifacts only under explicit cleanup approval. Record safe evidence in Document 28.
```

## Checkpoint D

```text
Evaluate Checkpoint D from Document 28.

Verify that one owned staging video is validated, uploaded resumably, safely resumed, protected from duplicate publication, published with approved metadata/audience/privacy, accurately represented through processing/publication, free of token/source/session leakage, and cleaned up according to authorization.

Do not begin Phase E unless Checkpoint D is Verified.
```

# Phase E — Scheduling and Synchronization

## E01 — Schedule persistence and APIs

```text
Execute YT-TASK-E01 only after Checkpoint D passes.

Read Documents 04–08, 12, 15, 20–21, 23, 26, and 28.

Implement schedule persistence, timezone validation, durable intent/outbox, and APIs test-first: canonical UTC instant; original IANA timezone and ambiguity choice; server clock; past/lead/horizon validation; create/get/list/change/cancel; ownership/connection eligibility; concurrency guards; idempotency; durable job intent; and disconnect/publication-conflict rules.

Add DST gap/overlap, clock, duplicate, cancellation, and concurrency tests. Update Document 28.
```

## E02 — Dispatcher and workers

```text
Execute YT-TASK-E02 only after E01 is Verified.

Read Documents 06–09, 12–15, 21, 23, 25–26, and 28.

Implement the approved dispatcher/workers test-first. Before installing queue/time packages or creating infrastructure, verify YT-INSTALL-06 and YT-INFRA-GATE-004 and request exact approval.

Implement durable delayed delivery, claim/lease/fencing, at-least-once-safe execution, idempotent publication, cancellation/reschedule races, missed-job policy, bounded retry/backoff, dead-letter/manual recovery, graceful drain, secret-free versioned payloads, and lateness/failure metrics. Update Document 28 after restart/redelivery/concurrency tests pass.
```

## E03 — Video status synchronization

```text
Execute YT-TASK-E03 only after E02 is Verified.

Read Documents 05–08, 12, 15, 17, 19–23, 25–26, and 28.

Implement status synchronization/reconciliation test-first: quota-aware manual/periodic sync; provider validation/normalization; upload, processing, privacy, publication, restriction, rejection, and deletion dimensions; freshness/staleness; terminal polling reduction; missing/deleted confirmation; reconnect behavior; unknown-outcome reconciliation; concurrency-safe persistence; bounded pagination; and quota accounting.

Update Document 28 after mapping, staleness, quota, and reconciliation tests pass.
```

## E04 — Schedule and status frontend

```text
Execute YT-TASK-E04 only after E01–E03 backend contracts pass.

Read Documents 04–05, 08, 15, 18, 21–23, 26, and 28.

Implement scheduled-publication, video-status, and history UI: create/edit/cancel schedule; timezone/DST confirmation; queued, claimed, executing, late, cancelled, failed, dead-letter, published, processing, private, restricted, rejected, deleted, and stale states; manual refresh; quota feedback; reconnect/retry; bounded history; lifecycle refetch; and accessible status/action descriptions.

The UI must not invent success or use local timers as durable truth. Update Document 28.
```

## E05 — Scheduling and synchronization E2E

```text
Execute YT-TASK-E05 only after E01–E04 are Verified.

Read Documents 21–26 and 28.

Run the schedule/synchronization matrix: correct instant/timezone; DST gap/overlap; restart/redelivery; duplicate prevention; cancellation/reschedule races; deployment drain; late/missed jobs; Google outage/recovery; token refresh/reconnect; quota exhaustion; staleness/reconciliation; and approved staging scheduled publication.

Use a harmless private/unlisted test video unless another status is explicitly approved. Record cleanup and evidence in Document 28.
```

## Checkpoint E

```text
Evaluate Checkpoint E from Document 28.

Verify that a scheduled publication persists durably, executes once at the approved instant, survives restart/redelivery, handles cancellation/rescheduling, reports lateness/failure honestly, reconciles authoritative YouTube state, appears correctly in the frontend, and remains quota-aware and secret-free.

Do not begin Phase F until Checkpoint E is Verified.
```

# Phase F — Hardening and Operations

## F01 — Error, retry, reconnection, and recovery

```text
Execute YT-TASK-F01 only after Checkpoint E passes.

Read Documents 05–06, 08, 15–23, 26, and 28.

Apply the full error/retry/reconnection/recovery taxonomy: stable safe codes/statuses; retry eligibility/backoff; Retry-After; credential-refresh retry; reconciliation-required and never-retry outcomes; idempotency mismatch/in-flight handling; dead-letter/manual recovery; reconnect actions; safe frontend guidance; and correlation without provider leakage.

Add cross-workflow failure-injection tests and update Document 28.
```

## F02 — Security, privacy, deletion, quota, and abuse

```text
Execute YT-TASK-F02 only after F01 is Verified.

Read Documents 02, 05–06, 10, 13, 16–24, 26–28.

Implement/verify least privilege/scopes, token/key/access reviews, rate/resource limits, OAuth/upload/schedule abuse controls, quota budgeting/prioritization/exhaustion, privacy export/deletion/disconnect, token revocation/credential deletion, media/session cleanup, retention, audits, redaction, and cross-user/environment isolation.

Do not change legal/policy decisions without approval. Update Document 28.
```

## F03 — Observability and support

```text
Execute YT-TASK-F03 only after F02 is Verified.

Read Documents 06–08, 10, 13, 19–25, 27–28.

Implement safe observability/support. Before installing/configuring a vendor, verify YT-INSTALL-07 and YT-INFRA-GATE-006 and request approval.

Implement structured redacted logs, request/OAuth/upload/schedule/job correlation, bounded metrics, approved traces, audits, health/readiness, dashboards, alerts, safe support diagnostics/runbooks, and telemetry failure isolation. Run secret/PII/content leakage tests. Update Document 28.
```

## F04 — Security and operational exercises

```text
Execute YT-TASK-F04 only after F01–F03 are Verified.

Read Documents 06, 10, 12–13, 16, 19, 21, 23–28.

Execute approved authentication/authorization, callback replay/open redirect/deep-link, key rotation/tamper, upload exhaustion, worker concurrency/dead-letter, deletion/retention, quota, provider outage/unknown outcome, telemetry leakage, dependency/security, backup/restore, and incident exercises.

Do not perform destructive staging actions without exact authorization and recovery confirmation. Record defects/evidence in Document 28. Unresolved critical/high findings block completion.
```

## Checkpoint F

```text
Evaluate Checkpoint F from Document 28.

Require F01–F04 Verified; no unmitigated critical/high defect; no token, secret, PII, private metadata/content, or session URL in telemetry/evidence; active quota/abuse controls; proven deletion/revocation; and dashboard, alert, runbook, backup, and restore evidence.

Do not begin release work if Checkpoint F fails.
```

# Phase G — Full Verification and Release

## G01 — Complete verification matrix

```text
Execute YT-TASK-G01 only after Checkpoints B–F pass.

Read Documents 01–29, using Document 26 as test authority and Document 28 as evidence tracker.

Complete requirements-to-test traceability and run every applicable unit, contract, database/migration, OAuth/provider, upload/publication, schedule/worker, synchronization, security/privacy/quota, accessibility, device/browser, performance/resource, failure-injection, staging E2E, and backup/restore test.

Record pass/fail/blocked/skipped, environment, candidate, command, and evidence. A skipped required test blocks completion.
```

## G02 — Defect closure and immutable candidate

```text
Execute YT-TASK-G02 only after G01 produces a complete result.

Read Documents 23–29.

Triage every failed, blocked, flaky, quarantined, or expired test. Fix release blockers test-first; close critical/high security/data-integrity findings; remove or renew quarantines with owner/expiry; rerun focused/regression suites; create the immutable candidate identity; and record source revision, lockfiles, migrations, artifacts, configuration schema, and evidence.

Do not hide failures or weaken tests. Update Document 28.
```

## G03 — Staging deployment and acceptance

```text
Execute YT-TASK-G03 only after G02 is Verified.

Read Documents 10–13, 21, 24–28.

Before deployment, request explicit YT-GATE-13-STAGING authorization. Then execute Document 27 staging deployment: verify configuration/secrets, backup/migration readiness, deploy compatible API/workers, apply approved migrations, keep access restricted, run health/smoke/device/provider/fault/restore acceptance, verify dashboards/alerts and rollback/forward-fix, and reconcile remote artifacts/jobs.

Record deployment and acceptance evidence in Document 28.
```

## G04 — Production disabled deployment

```text
Execute YT-TASK-G04 only after staging acceptance passes.

Read Documents 10–11, 13, 24–29.

Collect required human security, privacy, Google-policy, data, operations, QA, and release approvals. Before production changes, request explicit YT-GATE-13-PRODUCTION authorization.

After approval, use only approved production resources/credentials; verify backups, keys, migrations, quotas, monitoring, and contacts; deploy the immutable candidate with YouTube feature flags and mutation workers disabled; apply approved expand migrations; and verify health/compatibility/no unintended effects.

Do not enable users or publication. Update Document 28.
```

## G05 — Canary rollout

```text
Execute YT-TASK-G05 only after G04 is Verified and canary authorization is granted.

Read Documents 23–30, especially 25 and 27–29.

Execute only the approved canary stage. Confirm cohort, duration, success/abort thresholds, quota budget, and rollback owner; enable the smallest cohort; monitor authentication, OAuth, upload, publication, schedules, workers, synchronization, errors, latency, quota, security, and support; reconcile provider/local state; and advance, hold, or roll back only from approved thresholds.

Do not automatically advance. Request human approval for every canary stage and update Document 28.
```

## G06 — Final acceptance and handoff

```text
Execute YT-TASK-G06 only after approved canary stages pass.

Read Documents 01 and 28–30, using Document 29 as final acceptance authority.

Prove every required connection, upload, publication, scheduling, synchronization, recovery, security, privacy, quota, observability, deployment, and maintenance criterion; confirm no blocker/expired approval; record production status/limitations; assign operational and maintenance owners; complete support/incident/rotation/upgrade handoff; approve the feature-flag cleanup plan; and record final evidence/human release decision.

Do not mark complete unless Document 29’s definition of done passes.
```

## Final Checkpoint G

```text
Evaluate Checkpoint G and the complete YouTube Connection definition of done.

Read Documents 28–30.

Report exactly one result: GO, HOLD, ROLLBACK, or DEPLOYED DISABLED. Support it with evidence and human approvals.

If GO, activate Document 30 maintenance and record owners, reviews, rotations, quota/dependency reviews, and limitations. Otherwise keep the feature safe and record blockers, owner, recovery action, and next review. Do not claim completion without Document 29 acceptance evidence.
```

# Ordered Prompt Index

Use this exact order and never skip a failed/blocked task:

```text
Session Rules
→ Document 00 approval if still pending
→ B01 → B02 → B03 → B04 → B05 → B06 → Checkpoint B
→ C01 → C02 → C03 → C04 → C05 → Checkpoint C
→ D01 → D02 → D03 → D04 → D05 → Checkpoint D
→ E01 → E02 → E03 → E04 → E05 → Checkpoint E
→ F01 → F02 → F03 → F04 → Checkpoint F
→ G01 → G02 → G03 → G04 → G05 → G06 → Final Checkpoint G
```

## Handoff rule

At the start of a new conversation, Codex must derive the current task from Document 28 rather than conversation memory. At the end of every task, Document 28 must contain the evidence and exact next action. This file supplies prompts; it does not override approvals or mark work complete.

## Change Log

| Version | Date | Change |
|---|---|---|
| 1.0.0 | 2026-08-27 | Replaced the obsolete proposed-document list with the complete one-task-at-a-time Codex execution guide and copyable prompts for B01–G06 and every phase checkpoint. |
