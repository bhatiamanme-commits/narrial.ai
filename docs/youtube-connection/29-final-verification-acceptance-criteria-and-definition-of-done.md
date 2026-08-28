# YouTube Connection Module — Final Verification, Acceptance Criteria, and Definition of Done

## Document Control

| Field | Value |
|---|---|
| Document number | 29 |
| Filename | `29-final-verification-acceptance-criteria-and-definition-of-done.md` |
| Module | YouTube Connection only |
| Stage | Stage 14 — Final release gate |
| Status | Approved documentation baseline — final gate not executed; production enablement blocked |
| Version | 1.0.0 |
| Date | 2026-08-26 |
| Purpose | Provide the final production acceptance checklist proving connection, upload, publishing, scheduling, synchronization, recovery, security, and operations work end to end |
| Earlier dependencies | Documents 01–28 |
| Execution timing | After staging deployment and before enabling the production feature |
| Next document | `30-maintenance-runbooks-limitations-and-future-improvements.md` |

## 1. Purpose

This document is the final evidence-based decision gate for enabling the YouTube Connection module in production. It defines the exact proof required that the product, architecture, configuration, connection, channel management, upload, immediate publication, scheduling, synchronization, recovery, security, privacy, quota, observability, support, testing, deployment, rollback, backup, and maintenance responsibilities work together as one production system.

The checklist is not considered passed because code exists, documents exist, tests passed at an unknown time, staging once worked, or an AI says the feature is ready. Every required item must reference current evidence for the exact immutable release candidate and approved environments.

This document does not run tests, deploy software, configure Google Cloud, create credentials, enable feature flags, authorize production users, or grant release approval.

## 2. Final Result Being Accepted

The release is acceptable only when an authenticated Narrial user can, safely and accurately:

1. Understand why YouTube access is requested and what data/actions are involved.
2. Connect an eligible YouTube channel through Google OAuth without exposing credentials.
3. See the correct owned channel, permission health, and connection state.
4. Reconnect or disconnect with predictable token, schedule, data, and remote-content behavior.
5. Select or reference an owned supported video and receive clear validation.
6. Upload resumably with accurate progress, cancellation, retry, restart, and unknown-outcome recovery.
7. Publish immediately with approved metadata, audience, privacy, and confirmation behavior.
8. Schedule publication using an explicit timezone and receive durable, idempotent execution despite retries/restarts.
9. See accurate, fresh upload/processing/scheduled/published/private/rejected/failed/deleted states.
10. Recover from provider, permission, quota, network, database, queue, storage, worker, and deployment failures without duplicate or unintended remote effects.
11. Receive safe loading, empty, degraded, failure, stale, reconnect, and support states on supported devices.
12. Trust that credentials, personal data, content, audit evidence, quota, and deletion obligations are securely operated.

Operations must be able to detect, diagnose, contain, recover, roll back, restore, support, and audit the module without reading plaintext tokens or leaking user content.

## 3. Scope and Non-Scope

Included:

- The complete YouTube Connection production release defined by Documents 01–28.
- Final product, technical, security, compliance, accessibility, reliability, operational, deployment, and support acceptance.
- Staging evidence, production-disabled deployment readiness, canary authorization, rollback/restore readiness, and maintenance handoff.

Excluded:

- Other social networks.
- Capabilities outside the approved YouTube release boundary.
- Legal conclusions not reviewed by qualified owners.
- Live destructive tests against customer data/channels.
- Approval of unresolved `TBD`, open blocker, expired exception, skipped test, or undocumented deviation.

## 4. Gate Outcomes

Exactly one outcome is recorded:

| Outcome | Meaning | Permitted action |
|---|---|---|
| `GO` | All mandatory criteria pass with current evidence and human sign-off | Enable only the approved canary stage under Document 27 |
| `CONDITIONAL GO` | Only explicitly waivable noncritical items remain, each with approved risk/owner/expiry/compensating control | Enable only the bounded audience and duration in the approval record |
| `HOLD` | Evidence is incomplete, stale, inconclusive, or a fix/retest is needed | Keep feature disabled; resolve and reassess |
| `NO-GO` | Critical/high risk, failed mandatory control, unsafe migration, policy/security issue, or uncontained impact exists | Stop release; rollback/repair under runbook |

`GO` does not authorize immediate 100% rollout. It authorizes the first approved production rollout stage only.

## 5. Non-Waivable Blockers

Any of these forces `NO-GO` or `HOLD` and cannot be informally waived:

- Credential/token/secret exposure, plaintext token persistence, or unapproved telemetry capture.
- Cross-user/cross-tenant access, broken authentication/authorization, or support impersonation/access failure.
- Unintended public publication, duplicate upload/publication, loss of idempotency, or unresolved remote outcome that could repeat an effect.
- Data corruption/loss, incompatible migration/worker/message version, failed backup restore, or inability to decrypt active credentials safely.
- OAuth state/PKCE/replay/open-redirect/callback integrity failure.
- User deletion/revocation or Google policy deadline control failure.
- Missing required Google verification/audit/consent/privacy/terms/configuration for the approved production use case.
- Critical/high unresolved vulnerability or security finding.
- Missed scheduled publications beyond approved policy without containment, or unsafe restoration of stale schedules.
- Broken rollback/kill switch, critical alert delivery, audit integrity, or observability blindness on a critical workflow.
- Required tests skipped/quarantined/failed, evidence not tied to the candidate, or production/staging environment contamination.
- Open `YT-BLOCK-001` or `YT-BLOCK-002` from Document 28: Documents 00–10 must be finalized and downstream documents reconciled before final acceptance.

## 6. Acceptance Evidence Rules

Every checklist row records:

- Acceptance ID `YT-FINAL-<AREA>-NNN`.
- Exact Documents/requirements/test IDs covered.
- Candidate source commit, artifact digest/version, migration version, configuration schema, and environment.
- Evidence ID from Document 28 using `YT-EVID-YYYYMMDD-NNN`.
- Result: `PASS`, `FAIL`, `BLOCKED`, `NOT RUN`, or `NOT APPLICABLE` with approved rationale.
- Executor, independent reviewer, execution time, and evidence retention/access.
- Defect, exception, residual risk, owner, expiry, and retest reference if applicable.

Rules:

1. Evidence belongs to the exact candidate; code/config/migration changes invalidate affected results.
2. Staging evidence must use production-like topology and approved real Google/YouTube test assets for selected provider flows.
3. Mocks/fakes prove deterministic behavior but do not replace required provider/device/staging verification.
4. Screenshots alone are weak evidence; pair them with test results, persisted state, safe audit/telemetry, and candidate identity.
5. A rerun after failure keeps the original failure and links the fix/retest.
6. `NOT APPLICABLE` requires product and relevant technical/security approval; it cannot hide missing scope.
7. All evidence is minimized and contains no secret values, raw provider payloads, real video content, or unnecessary personal data.

## 7. Entry Criteria

Before the final gate meeting begins:

- [ ] Documents 01–10 are final approved source-of-truth documents, not generation prompts/structures.
- [ ] Documents 11–29 are reconciled with those finalized foundations and versioned for material changes.
- [ ] Document 28 has no unexplained stale status, open critical blocker, or missing implementation evidence.
- [ ] All required decisions in Document 03 have named approvers and final status.
- [ ] Stage 12 full verification passed for the exact candidate under Document 26.
- [ ] Stage 13 staging deployment and acceptance passed under Document 27.
- [ ] Production deployment plan, rollback target, feature flags, backups, owners, communications, and observation window are ready.
- [ ] Google/YouTube production project, OAuth client, API, scopes, quota, verification/audit status, domains, policy pages, and contacts are approved.
- [ ] A final evidence package is available to reviewers before the meeting.

If any entry item fails, record `HOLD`; do not continue merely to fill the checklist.

## 8. Release Candidate Identity

| Field | Required value/evidence | Status |
|---|---|---|
| Release ID/version | TBD at execution | Not recorded |
| Source commit | Immutable full hash | Not recorded |
| API artifact digest | Signed/content-addressed reference | Not recorded |
| Worker artifact digest(s) | Per role | Not recorded |
| Frontend/mobile build/runtime version | Exact supported build(s) | Not recorded |
| Database migration/schema version | Exact migration chain/checksum | Not recorded |
| Job message versions | Supported producer/consumer range | Not recorded |
| Configuration schema version | Exact validated manifest | Not recorded |
| Dependency lock/SBOM digest | Exact candidate | Not recorded |
| Staging deployment ID | Exact tested deployment | Not recorded |
| Production disabled-deployment ID | Added only after approved deployment | Not recorded |

Changing any field triggers impact analysis and reruns all affected criteria.

## 9. Documentation and Decision Acceptance

- [ ] `YT-FINAL-DOC-001`: Documents 00–29 exist, are readable, internally linked, versioned, and limited to YouTube Connection.
- [ ] `YT-FINAL-DOC-002`: Document 00 is a current evidence-backed audit; Documents 01–10 contain final content rather than generation prompts.
- [ ] `YT-FINAL-DOC-003`: Vision, scope, non-scope, final experience, journeys, requirements, architecture, contracts, schema, security, operations, tests, deployment, and maintenance agree.
- [ ] `YT-FINAL-DOC-004`: Document 03 contains every significant decision, owner, approver, status, rationale, alternatives, date, and supersession link.
- [ ] `YT-FINAL-DOC-005`: Exact terminology, filenames, entity fields, statuses, endpoint names, error codes, flags, variables, test IDs, and runbooks are consistent.
- [ ] `YT-FINAL-DOC-006`: All `TBD`, unresolved decision, risk, blocker, exception, and drift item is resolved or explicitly blocks release.
- [ ] `YT-FINAL-DOC-007`: API/user/support/operations/deployment documentation and change log match the candidate.
- [ ] `YT-FINAL-DOC-008`: Document 28 tracker and evidence register reflect current reality.

## 10. Product Scope and User Experience Acceptance

- [ ] `YT-FINAL-UX-001`: Only approved YouTube capabilities are visible; excluded/future features do not appear as functional.
- [ ] `YT-FINAL-UX-002`: All Document 04 navigation and screen states pass on supported platforms.
- [ ] `YT-FINAL-UX-003`: Users understand Google browser handoff, requested permissions, selected channel, and return to Narrial.
- [ ] `YT-FINAL-UX-004`: Loading, empty, offline, slow, cancelled, success, failure, stale, reconnect, retry, and support states are accurate and actionable.
- [ ] `YT-FINAL-UX-005`: UI never claims connected/uploaded/published/deleted until authoritative criteria are met.
- [ ] `YT-FINAL-UX-006`: Destructive actions require clear confirmation and explain local versus YouTube effects.
- [ ] `YT-FINAL-UX-007`: Supported devices, browsers, screen sizes, orientation, text scaling, keyboard, and network transitions pass.
- [ ] `YT-FINAL-UX-008`: Accessibility standard, screen reader, focus, role/name/state, contrast, touch target, reduced-motion, and error-association evidence passes.
- [ ] `YT-FINAL-UX-009`: User-facing errors contain safe stable code/reference and recovery action, never internal/provider secrets.

## 11. Authentication, OAuth, and Connection Acceptance

- [ ] `YT-FINAL-CONN-001`: Only authenticated Narrial users can initiate/manage their connections.
- [ ] `YT-FINAL-CONN-002`: OAuth state is unguessable, short-lived, single-use, atomically consumed, owner/session-bound as approved, and replay-protected.
- [ ] `YT-FINAL-CONN-003`: PKCE, exact redirect URI, return allowlist, callback validation, code exchange, and error handling pass.
- [ ] `YT-FINAL-CONN-004`: Consent denial/cancel, invalid/expired/replayed state, mismatched callback, code reuse, timeout, and provider failure return safely.
- [ ] `YT-FINAL-CONN-005`: Tokens and authorization codes never reach frontend storage, URLs beyond required provider flow, logs, traces, audits, alerts, test reports, or support bundles.
- [ ] `YT-FINAL-CONN-006`: Access expiration, refresh concurrency, refresh-token preservation, rotation, revoked grant, reduced scopes, and reauthorization pass.
- [ ] `YT-FINAL-CONN-007`: Channel identity and ownership are retrieved from YouTube, validated, persisted once, and displayed accurately.
- [ ] `YT-FINAL-CONN-008`: Reconnect/upsert and approved multiple-channel behavior cannot duplicate or rebind another user’s connection.
- [ ] `YT-FINAL-CONN-009`: Disconnect/revoke stops future privileged work and meets local deletion/preservation rules without falsely deleting remote content.
- [ ] `YT-FINAL-CONN-010`: The real staging consent/channel/reconnect/revoke journey passes with organization-controlled accounts.

## 12. API and Backend Acceptance

- [ ] `YT-FINAL-API-001`: Every approved endpoint matches Document 15 request/response/status/header/idempotency contract.
- [ ] `YT-FINAL-API-002`: Authentication, ownership, validation, pagination, rate limits, and stable errors apply consistently.
- [ ] `YT-FINAL-API-003`: Provider SDK/database/internal worker types and raw errors never leak through public contracts.
- [ ] `YT-FINAL-API-004`: Routes remain thin; application/domain/repository/provider boundaries follow Documents 07, 08, and 14.
- [ ] `YT-FINAL-API-005`: Concurrent/duplicate requests preserve invariants and return deterministic state.
- [ ] `YT-FINAL-API-006`: Health/liveness/readiness/startup behavior is minimal, accurate, access-controlled as required, and quota-free.
- [ ] `YT-FINAL-API-007`: Version compatibility supports approved deployed mobile/frontend versions.
- [ ] `YT-FINAL-API-008`: Build, lint, type checks, focused/full tests, dependency/security scans, and code review pass on candidate.

## 13. Database, Integrity, and Credential Storage Acceptance

- [ ] `YT-FINAL-DATA-001`: Production-like migration applies from empty and every supported prior schema with checksum/evidence.
- [ ] `YT-FINAL-DATA-002`: Constraints/indexes/relations/ownership/versioning enforce all Document 12 invariants.
- [ ] `YT-FINAL-DATA-003`: OAuth state consumption, credential replacement, idempotency, state/event/outbox, schedule claims, and deletion transitions are atomic where required.
- [ ] `YT-FINAL-DATA-004`: Concurrency tests prove stale workers/requests cannot overwrite newer state or duplicate provider effects.
- [ ] `YT-FINAL-DATA-005`: Tokens are encrypted using approved authenticated encryption/key provider/AAD/version; plaintext scans pass.
- [ ] `YT-FINAL-DATA-006`: Only narrow runtime identities decrypt; support/developers/frontend/migrations lack unjustified access.
- [ ] `YT-FINAL-DATA-007`: Key rotation and old-ciphertext compatibility pass; emergency revocation runbook is verified.
- [ ] `YT-FINAL-DATA-008`: Retention/deletion/index/query-plan and growth assumptions meet approved targets.
- [ ] `YT-FINAL-DATA-009`: Backup and isolated restore meet approved RPO/RTO and preserve deletion markers, idempotency, audit, key, worker, and schedule safety.

## 14. Video Source and Resumable Upload Acceptance

- [ ] `YT-FINAL-UP-001`: Only authenticated owners can select/reference source video; cross-owner storage/API access fails.
- [ ] `YT-FINAL-UP-002`: Supported format/container/codec/type/size/duration/checksum/metadata rules and boundary errors pass.
- [ ] `YT-FINAL-UP-003`: Malicious/corrupt/truncated/oversized/mismatched inputs fail safely without resource exhaustion or injection.
- [ ] `YT-FINAL-UP-004`: Upload session creation, chunk acknowledgement, progress, resume after restart, expired session, cancellation, and cleanup pass.
- [ ] `YT-FINAL-UP-005`: Timeout before/after provider effect and database failure after remote creation reconcile without duplicate upload.
- [ ] `YT-FINAL-UP-006`: Progress and final state are accurate; success requires confirmed YouTube video ID.
- [ ] `YT-FINAL-UP-007`: Upload memory/disk/network usage, concurrency, throughput, and quota meet approved limits.
- [ ] `YT-FINAL-UP-008`: Video bytes, filenames, metadata, signed/storage/session URLs, and credentials are absent from prohibited outputs.
- [ ] `YT-FINAL-UP-009`: Approved real staging resumable upload passes and the remote test artifact is cleaned/tracked.

## 15. Immediate Publishing and Metadata Acceptance

- [ ] `YT-FINAL-PUB-001`: Title, description, tags, category, thumbnail, audience, privacy, playlist, and notification rules match approved contracts.
- [ ] `YT-FINAL-PUB-002`: Required made-for-kids/synthetic-media choices are explicit and not silently inferred.
- [ ] `YT-FINAL-PUB-003`: Unverified-project/private restrictions and provider processing/restrictions are shown accurately.
- [ ] `YT-FINAL-PUB-004`: Partial thumbnail/playlist/metadata failures preserve truthful remote/local state and recovery.
- [ ] `YT-FINAL-PUB-005`: Duplicate request/retry/concurrency/unknown outcome produces at most one intended upload/publication effect.
- [ ] `YT-FINAL-PUB-006`: Resulting YouTube identifiers, privacy/processing state, confirmation, and status history persist/display correctly.
- [ ] `YT-FINAL-PUB-007`: Approved staging immediate-publication journey passes with cleanup evidence.

## 16. Scheduling and Worker Acceptance

- [ ] `YT-FINAL-SCH-001`: User civil time and IANA timezone persist with canonical UTC; DST gap/fold, clock skew, year/leap boundaries pass.
- [ ] `YT-FINAL-SCH-002`: Create/list/detail/reschedule/cancel authorization, validation, concurrency, and API/UI states pass.
- [ ] `YT-FINAL-SCH-003`: At-least-once delivery, duplicate/out-of-order messages, leases, heartbeats, fencing, stale generations, and crash/restart pass.
- [ ] `YT-FINAL-SCH-004`: Crash before/during/after provider effect and before/after database/queue acknowledgement cannot duplicate publication.
- [ ] `YT-FINAL-SCH-005`: Early/due/late/missed/cancelled/blocked/retrying/exhausted/dead-letter/reconciled states follow approved rules.
- [ ] `YT-FINAL-SCH-006`: Provider outage, permission loss, quota reserve, database/queue outage, deployment drain, and restore preserve durable safe work.
- [ ] `YT-FINAL-SCH-007`: Scheduled publication occurs once within approved lateness and UI reflects YouTube processing/visibility truth.
- [ ] `YT-FINAL-SCH-008`: Queue age, due backlog, leases, lateness, dead letters, alerts, and runbooks pass.
- [ ] `YT-FINAL-SCH-009`: Approved staging scheduled-publication and cancel/reschedule race journeys pass.

## 17. Status Synchronization Acceptance

- [ ] `YT-FINAL-SYNC-001`: Manual, periodic, post-operation, reconnect, and recovery triggers coalesce and respect quota.
- [ ] `YT-FINAL-SYNC-002`: Uploading/processing/scheduled/published/private/rejected/failed/deleted/unknown mappings are correct.
- [ ] `YT-FINAL-SYNC-003`: Stale responses cannot overwrite newer state; status precedence/version checks pass.
- [ ] `YT-FINAL-SYNC-004`: One missing/404 response never becomes confirmed deletion; repeated authorized evidence and credential/binding checks apply.
- [ ] `YT-FINAL-SYNC-005`: Batch partial failures, unknown enums, malformed responses, long outages, quota pause, and restart recover safely.
- [ ] `YT-FINAL-SYNC-006`: Terminal polling reduction, freshness, last-checked/stale indication, event history, and recovery action are correct.
- [ ] `YT-FINAL-SYNC-007`: Approved staging status transitions reconcile with actual YouTube state within the accepted provider-dependent window.

## 18. Error, Retry, Reconnection, and Recovery Acceptance

- [ ] `YT-FINAL-REC-001`: Every approved error category has stable user/API code, retry classification, safe message, and recovery action.
- [ ] `YT-FINAL-REC-002`: Exponential backoff/jitter, attempt caps, retry-after validation, circuit/bulkhead/rate controls, and priority pass.
- [ ] `YT-FINAL-REC-003`: Non-retryable, reauthorization, quota-deferred, cancelled, unknown-outcome, dead-letter, and manual-review paths do not loop.
- [ ] `YT-FINAL-REC-004`: Idempotency survives client retry, process crash, redelivery, database reconnect, deployment, and provider ambiguity.
- [ ] `YT-FINAL-REC-005`: Reconnection preserves only valid eligible work and never applies new scopes without consent.
- [ ] `YT-FINAL-REC-006`: Privileged replay/reconcile requires role, reason, current-state check, fencing, audit, and verification.
- [ ] `YT-FINAL-REC-007`: Failure-injection matrix proves bounded degradation and eventual consistent recovery.

## 19. Security Acceptance

- [ ] `YT-FINAL-SEC-001`: Threat model and controls cover authentication, OAuth, tokens, API, database, storage, workers, support, telemetry, deployment, and provider boundaries.
- [ ] `YT-FINAL-SEC-002`: IDOR/cross-tenant, privilege escalation, CSRF/state replay, PKCE/open redirect/deep-link spoofing, injection, SSRF, path/file abuse, and denial-of-service tests pass.
- [ ] `YT-FINAL-SEC-003`: Secrets are absent from repository/history scope, artifacts, frontend bundles, source maps, manifests, logs, traces, metrics, audits, alerts, evidence, and support diagnostics.
- [ ] `YT-FINAL-SEC-004`: Least privilege, MFA/SSO where supported, service identities, network boundaries, TLS, CORS, trusted proxy, headers, rate limits, and administrative controls pass.
- [ ] `YT-FINAL-SEC-005`: Dependency/SBOM/license/vulnerability/artifact/configuration scans meet approved policy with no unresolved critical/high item.
- [ ] `YT-FINAL-SEC-006`: Independent security review and authorized penetration testing have no blocking finding.
- [ ] `YT-FINAL-SEC-007`: Incident containment, credential rotation/revocation, kill switch, evidence, communication, and recovery exercise passes.

## 20. Privacy, Google Policy, and Compliance Acceptance

- [ ] `YT-FINAL-PRIV-001`: Public homepage, terms, privacy policy, YouTube Terms link, Google Privacy link, support, revocation, and deletion method are accessible and accurate.
- [ ] `YT-FINAL-PRIV-002`: OAuth scopes are least privilege, justified in context, verified, and match console/code/documentation.
- [ ] `YT-FINAL-PRIV-003`: Data inventory, purpose limitation, minimization, sharing, vendors/subprocessors, regions, retention, export, correction, and access decisions are approved.
- [ ] `YT-FINAL-PRIV-004`: User/app-initiated revocation and account/data deletion satisfy Document 24’s applicable seven-day maximum with end-to-end evidence.
- [ ] `YT-FINAL-PRIV-005`: Google-side revocation/unrefreshable data and other YouTube data refresh/delete behavior satisfy applicable 30-day rules.
- [ ] `YT-FINAL-PRIV-006`: Backups, caches, telemetry, support data, test artifacts, and vendors honor deletion/retention and cannot resurrect active data.
- [ ] `YT-FINAL-PRIV-007`: No undocumented/scraped API or unauthorized YouTube audiovisual caching/storage exists.
- [ ] `YT-FINAL-PRIV-008`: Production project audit/verification, use-case, public-upload restriction, quota-extension status, and change-of-use obligations support launch.
- [ ] `YT-FINAL-PRIV-009`: Qualified security/privacy/legal/policy reviewers approve the release; this documentation is not substituted for legal advice.

## 21. Quota and Abuse Acceptance

- [ ] `YT-FINAL-QUOTA-001`: Every YouTube operation and current official cost is inventoried/configured with verification date/source.
- [ ] `YT-FINAL-QUOTA-002`: Capacity model, daily budget, reserve, priority, per-user fairness, and exhaustion forecast are approved.
- [ ] `YT-FINAL-QUOTA-003`: Batching, field selection, caching/freshness, coalescing, terminal polling, backoff, and retry controls minimize requests.
- [ ] `YT-FINAL-QUOTA-004`: Warning/reserve/exhausted/reset/accounting-drift behavior and dashboards/alerts pass.
- [ ] `YT-FINAL-QUOTA-005`: Quota exhaustion protects approved critical work, defers noncritical work, and gives accurate user recovery/timing.
- [ ] `YT-FINAL-QUOTA-006`: Abuse/rate/concurrency/storage/schedule/retry limits prevent one user from harming others.
- [ ] `YT-FINAL-QUOTA-007`: No project/account/proxy bypass of Google restriction, suspension, revocation, or quota policy exists.

## 22. Observability, Audit, and Support Acceptance

- [ ] `YT-FINAL-OPS-001`: Each Document 25 operational question maps to tested safe telemetry or audit/support evidence.
- [ ] `YT-FINAL-OPS-002`: Logs are structured; correlation works end to end; metric labels are bounded; traces cross queue/worker boundaries.
- [ ] `YT-FINAL-OPS-003`: Redaction canary and sink inspection prove no token, OAuth value, content metadata, raw payload, or unapproved PII leakage.
- [ ] `YT-FINAL-OPS-004`: Mandatory audit actions are append-only/integrity-protected, access-controlled, timestamped, and queryable.
- [ ] `YT-FINAL-OPS-005`: Dashboards show OAuth, credentials, upload, publication, scheduling, sync, provider, quota, privacy, and telemetry health with documented freshness.
- [ ] `YT-FINAL-OPS-006`: Every active alert is actionable, threshold/SLO justified, owned, deduplicated, runbook-linked, and test-fired through primary/backup delivery.
- [ ] `YT-FINAL-OPS-007`: Telemetry outage/degradation is detected and cannot exhaust or block critical application work; mandatory audits retain safe behavior.
- [ ] `YT-FINAL-OPS-008`: Support diagnoses synthetic owner-scoped incidents by reference without credentials, content, or cross-user disclosure.
- [ ] `YT-FINAL-OPS-009`: On-call, security, privacy, platform, provider, and support escalation coverage exists for rollout window.

## 23. Testing and Quality Acceptance

- [ ] `YT-FINAL-TEST-001`: Document 26 maps every requirement, invariant, state, error, threat, and acceptance criterion to evidence.
- [ ] `YT-FINAL-TEST-002`: Unit, component, contract, integration, database/migration, fake-provider, UI/device, security, privacy, quota, observability, resilience, load, and critical E2E suites pass.
- [ ] `YT-FINAL-TEST-003`: Selected real Google/YouTube staging journeys pass with isolated organization-controlled accounts/channels and cleanup evidence.
- [ ] `YT-FINAL-TEST-004`: Required supported physical iOS/Android and applicable browser/deep-link/accessibility matrix passes.
- [ ] `YT-FINAL-TEST-005`: Approved performance/capacity/SLO targets pass on production-like staging topology.
- [ ] `YT-FINAL-TEST-006`: No required test is skipped, focused-only, silently retried, or expired in quarantine.
- [ ] `YT-FINAL-TEST-007`: Coverage/mutation policy passes without lowered thresholds or broad unjustified exclusions.
- [ ] `YT-FINAL-TEST-008`: Every fixed critical/high defect has a regression test and affected/full suite evidence.
- [ ] `YT-FINAL-TEST-009`: Test/evidence artifacts contain no secrets, production data, raw provider payloads, or unapproved personal data.

## 24. Deployment, Migration, Backup, and Rollback Acceptance

- [ ] `YT-FINAL-DEP-001`: Candidate was built once, provenance/lock/SBOM recorded, and same artifact passed staging.
- [ ] `YT-FINAL-DEP-002`: Environment variables/configuration/secret references are typed, validated, redacted, least-privilege, and isolated.
- [ ] `YT-FINAL-DEP-003`: Google projects/clients, databases, storage, queues, keys, telemetry, flags, quotas, and backups cannot cross environments.
- [ ] `YT-FINAL-DEP-004`: Expand migration, API, worker message/schema compatibility, drain, leases, and backfill procedures pass.
- [ ] `YT-FINAL-DEP-005`: Backup/restore meets RPO/RTO and restored schedules/credentials/deletions remain safe.
- [ ] `YT-FINAL-DEP-006`: Staging deployment runbook passes with all defects/cleanup resolved.
- [ ] `YT-FINAL-DEP-007`: Production configuration/preflight, migration, API/workers, health, and telemetry are ready for a feature-disabled deployment.
- [ ] `YT-FINAL-DEP-008`: Feature flags and kill switches work independently; disabled behavior preserves durable work and user truth.
- [ ] `YT-FINAL-DEP-009`: Previous compatible artifact and forward-fix/rollback procedure are validated; remote effects are reconciled rather than assumed rolled back.
- [ ] `YT-FINAL-DEP-010`: Release commander, migration owner, observers, incident/support contacts, and rollback authority are named and available.

## 25. Full Staging Acceptance Scenarios

Run on the exact candidate and record evidence for:

1. Connect a new approved channel, close/reopen app, refresh token, and display correct state.
2. Deny/cancel consent, replay/expire state, and recover safely.
3. Upload a valid small video resumably, interrupt/restart, complete, publish with approved metadata, and reconcile processing/visibility.
4. Trigger an ambiguous provider timeout after possible effect and prove no duplicate video/publication.
5. Schedule across an approved timezone/DST case, restart workers, publish once within SLO, and sync state.
6. Cancel/reschedule during concurrency and prove stale worker fencing.
7. Revoke Google permission during pending work, block safely, reconnect, and recover eligible state.
8. Simulate quota warning/reserve/exhaustion and prove prioritization/degraded UX.
9. Simulate database, queue, storage, worker, key, provider, and telemetry outages; verify alerts/runbooks/recovery.
10. Disconnect and execute data/account deletion; verify local/backup/vendor/audit behavior and remote-content explanation.
11. Diagnose failures through support reference with tenant isolation and redacted evidence.
12. Deploy/rollback/restore candidate in staging; reconcile pending schedules/uploads before workers resume.

Remote test artifacts must be private unless the approved scenario requires otherwise, organization-owned, quota-budgeted, and deleted/tracked after verification.

## 26. Production-Disabled Deployment Verification

If organizational policy requires Document 29 before any production deployment, execute these checks as preflight evidence against an identical isolated environment. Otherwise, after the separately approved production deployment with all flags off, verify:

- Artifact digest and configuration/migration versions match approval.
- Liveness/readiness, database, queue, storage, keys, telemetry, alerts, backups, TLS/DNS/callback/deep links, and public policy/support pages are healthy.
- OAuth/mutation/execution flags remain off and unauthorized users cannot invoke hidden routes directly.
- Workers do not claim YouTube-effecting work while disabled; existing data remains safe/readable according to policy.
- No production secrets appear in artifacts, logs, health, telemetry, or evidence.
- Baseline error, latency, resources, quota, queue, security, and support signals are normal.

Do not perform a real production upload/publication merely to fill this checklist unless an organization-owned canary channel and action are separately approved.

## 27. Rollout Authorization Plan

Before `GO`, record:

| Field | Required value |
|---|---|
| First audience | Named internal/canary cohort, not an invented percentage |
| Enabled capabilities | Exact flags/workers to enable in order |
| Start/end/observation window | Approved timestamps and coverage |
| Advance thresholds | Approved SLO/error/quota/backlog/security/support criteria |
| Hold thresholds | Inconclusive/degraded criteria and owner |
| Rollback triggers | Non-waivable plus approved numeric triggers |
| Rollback authority | Named primary and backup |
| Communications | Internal/support/user/status plan |
| Cleanup/reconciliation | Owner and timing |
| Next stage | Requires separate evidence-based decision |

Document 29 acceptance authorizes only this recorded first stage. Each later stage is a new decision recorded in Documents 27–28.

## 28. Exceptions and Residual Risk

An exception includes:

- Stable exception ID and affected acceptance IDs.
- Exact failed/missing condition and why it cannot be completed now.
- User/security/privacy/reliability/compliance/operational impact.
- Compensating control and proof it works.
- Bounded audience/capability/environment.
- Owner, approvers, creation date, expiry, remediation/retest date.
- Rollback/kill trigger and user communication.

Critical security, tenant isolation, credential protection, data integrity, unintended-publication, deletion/compliance, idempotency, backup/restore, and critical observability failures are not eligible for ordinary exceptions.

| Exception ID | Acceptance IDs | Risk/control | Owner/expiry | Approval | Status |
|---|---|---|---|---|---|
| None recorded | — | — | — | — | — |

## 29. Evidence Package Index

| Package | Required contents | Evidence ID/status |
|---|---|---|
| Product/documentation | Approved Documents 00–29, decisions, traceability | Not provided |
| Candidate/provenance | Commit, artifacts, SBOM, lock, build/scan/review | Not provided |
| Test | Document 26 report, devices, provider, load/fault/security | Not provided |
| Data/security/privacy | Migration, encryption, access, deletion, audit/policy reviews | Not provided |
| Provider/quota | Google setup/verification/audit, scopes, staging flows, budget | Not provided |
| Operations | Dashboards, alerts, runbooks, support, incident exercises | Not provided |
| Deployment/recovery | Staging deploy, flags, backup/restore, rollback, cleanup | Not provided |
| Release | Candidate identity, rollout plan, named approvals, decision | Not provided |

Document 28 remains the authoritative evidence register. This table links the final subset used for acceptance.

## 30. Definition of Done

The YouTube Connection module is **Done for production canary release** only when all are true:

- The approved product scope and final user experience are implemented without hidden mocks or placeholder success paths.
- All authoritative documents and decisions match the implementation and deployed configuration.
- Connection, channel management, upload, publication, scheduling, synchronization, reconnection, disconnection, deletion, and support work end to end.
- Security, privacy, Google policy, quota, accessibility, reliability, performance, and operational requirements pass.
- All required automated/manual/provider/device/fault/restore tests pass for the candidate.
- Staging deployment is accepted; production-disabled deployment/preflight is safe; rollback and kill switches are ready.
- No non-waivable blocker, critical/high defect, stale required evidence, or expired exception exists.
- Named humans sign the final decision and own rollout, monitoring, support, incidents, maintenance, and future policy/API changes.

“Done” at this gate means ready for the approved canary—not automatically fully rolled out. Full release is done only after every approved rollout stage passes, reconciliation/cleanup completes, and Document 28 records `Released`.

## 31. Immediate Stop and Rollback Triggers

During final verification or rollout, immediately stop/disable/rollback under Document 27 for:

- Credential/secret exposure or suspicious privileged access.
- Cross-tenant disclosure/mutation.
- Unintended public or duplicate publication/upload.
- Data corruption/loss, unsafe migration, inability to restore/decrypt, or stale schedule execution.
- OAuth callback/state integrity failure.
- Policy/deletion deadline breach or Google suspension/restriction.
- Critical alert/telemetry blindness or inability to reconcile remote effects.
- Broad connection/upload/schedule failure beyond approved threshold.
- Quota exhaustion threatening protected work without a safe degraded path.

Preserve evidence, pause effects, reconcile state, communicate, and update Document 28. Do not delete evidence or blindly replay work.

## 32. Final Decision Record

| Field | Value |
|---|---|
| Candidate/release ID | Not provided |
| Gate meeting date/time | Not scheduled |
| Outcome | `HOLD` — documentation baseline only; no implementation/staging evidence |
| Approved canary audience | None |
| Enabled capabilities | None |
| Conditions/exceptions | Documents 00–10 finalization and all Stage 0–13 evidence required |
| Rollback authority | Unassigned |
| Next review | Unscheduled |

The initial `HOLD` is factual and must not be changed until the entry criteria and evidence package exist.

## 33. Required Human Sign-Off

| Approval | Named person | Evidence reviewed | Decision/date | Status |
|---|---|---|---|---|
| Product scope and UX | Unassigned | Required | Required | Blocked |
| Architecture/API/data | Unassigned | Required | Required | Blocked |
| Backend/workers/provider | Unassigned | Required | Required | Blocked |
| Frontend/device/accessibility | Unassigned | Required | Required | Blocked |
| Security | Unassigned | Required | Required | Blocked |
| Privacy/legal/Google policy | Unassigned | Required | Required | Blocked |
| Quota/capacity/performance | Unassigned | Required | Required | Blocked |
| Testing/quality | Unassigned | Required | Required | Blocked |
| Operations/observability/support | Unassigned | Required | Required | Blocked |
| Database/migration/backup/restore | Unassigned | Required | Required | Blocked |
| Deployment/rollback | Unassigned | Required | Required | Blocked |
| Final release authority | Unassigned | All required | Required | Blocked |

No person self-approves an area requiring independent review. No AI agent can sign, change `HOLD` to `GO`, enable a feature, or claim unobserved evidence.

## 34. Post-Approval Obligations

After a legitimate `GO`:

1. Update Document 28 with decision, evidence, candidate, audience, flags, owners, and observation window.
2. Enable only the approved stage under Document 27.
3. Monitor all advance/hold/rollback signals with staffed coverage.
4. Reconcile remote/local state, quota, schedules, deletions, support cases, and test artifacts.
5. Record each stage decision; do not auto-advance without approval.
6. Close incidents/defects, update documentation/runbooks/tests, and retain safe evidence.
7. After stable full rollout, remove expired flags/compatibility paths through a separate tested release.
8. Transfer ownership to maintenance and periodic review; continue Google policy/API/quota/security/dependency monitoring.

## 35. Acceptance Execution Procedure

1. Freeze the candidate and assemble Section 29 evidence.
2. Verify Section 7 entry criteria; stop with `HOLD` on failure.
3. Assign two reviewers where independence is required.
4. Walk Sections 9–24 by acceptance ID, opening actual evidence rather than relying on summaries.
5. Execute/recheck Section 25 staging journeys and any change-affected tests.
6. Complete Section 26 production-disabled preflight when separately authorized.
7. Review defects, exceptions, residual risk, rollout and rollback plan.
8. Record each human sign-off and the single outcome in Section 32.
9. Update Document 28 in the same change.
10. For `GO`, follow Section 34; for `HOLD`/`NO-GO`, keep flags off and record the exact remediation/retest path.

## 36. Current Acceptance Status

Current result: **HOLD**.

Reason:

- This is a documentation baseline only.
- Documents 00–10 are presently prompts/structures according to Document 28 and require finalization/reconciliation.
- No complete implementation, Stage 12 evidence package, staging deployment acceptance, production-disabled verification, or human sign-off has been provided.

This status is expected and does not imply a failed implementation; it prevents premature release claims.

## 37. Approval Record

Approval to add this document approves only the final-gate structure and current factual `HOLD`. It does not approve Documents 01–28 as implemented, close their decisions/blockers, accept test evidence, authorize staging/production actions, change feature flags, create/use credentials, upload/publish content, or enable users.

## 38. Prerequisites and Next Document

Prerequisites:

- `01-product-vision-and-final-result.md`
- `02-scope-non-scope-and-release-boundaries.md`
- `03-decision-register-glossary-and-source-of-truth.md`
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
- `26-testing-strategy-fixtures-and-verification-matrix.md`
- `27-deployment-environment-variables-and-release-runbook.md`
- `28-progress-tracker-implementation-checkpoints-and-evidence.md`

Next: `30-maintenance-runbooks-limitations-and-future-improvements.md`, defining post-release ownership, recurring maintenance, change/incident runbooks, known limitations, and YouTube-only future improvements. Do not deploy or enable anything automatically.

## 39. Change Log

| Version | Date | Change | Approval |
|---|---|---|---|
| 1.0.0 | 2026-08-26 | Initial final-verification, production acceptance, release decision, and definition-of-done baseline generated and added at user request; factual status set to HOLD | User approved document creation only |
