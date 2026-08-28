# YouTube Connection Module — Maintenance Runbooks, Limitations, and Future Improvements

## Document Control

| Field | Value |
|---|---|
| Document number | 30 |
| Filename | `30-maintenance-runbooks-limitations-and-future-improvements.md` |
| Module | YouTube Connection only |
| Stage | Stage 15 — Post-release operation |
| Status | Approved documentation baseline — post-release operation inactive until Document 29 acceptance |
| Version | 1.0.0 |
| Date | 2026-08-26 |
| Purpose | Document routine maintenance, dependency upgrades, Google policy changes, quota reviews, token-key rotation, incident procedures, known limitations, and YouTube-only future improvements |
| Earlier dependencies | Documents 24–29 |
| Activation gate | Document 29 records a valid human-approved release outcome and Document 28 records the deployed/released state |
| Next document | None predefined — future documents require explicit approval and must update Documents 03, 28, and 30 |

## 1. Purpose

This document is the long-term operating guide for the YouTube Connection module after release. It defines ownership, recurring review schedules, safe maintenance procedures, change management, dependency and provider-policy response, quota/capacity management, token-key rotation, incident handling, support escalation, disaster recovery, known limitations, deprecation, and a governed backlog of YouTube-only improvements.

Before release, use it only to prepare owners, runbooks, tooling, and evidence. It does not imply that the module is implemented, accepted, deployed, or released.

This document does not execute maintenance, upgrade dependencies, rotate keys, revoke credentials, change quotas, modify Google Cloud, access user data, deploy code, or approve future features.

## 2. Scope and Non-Scope

Included:

- Production operation of OAuth connections, channel permissions, uploads, publications, schedules, synchronization, retries, deletion, quota, observability, support, database, storage, queues/workers, secrets/keys, and deployments.
- Google/YouTube policy, API, OAuth, verification/audit, quota, product, and deprecation changes that affect the approved module.
- Security/privacy reviews, dependency/runtime upgrades, capacity/cost reviews, incident exercises, backup/restore drills, operational evidence, and documentation upkeep.
- Known limitations and proposals that remain exclusively about YouTube Connection.

Excluded:

- Instagram, TikTok, Facebook, or shared multi-platform abstractions introduced only for hypothetical reuse.
- Unapproved product expansion, analytics/revenue/comment/moderation features, scraping, downloading YouTube-hosted content, or bypassing Google controls.
- Legal advice or automatic interpretation of changed Google terms.
- Permanent manual workarounds that bypass authentication, authorization, encryption, idempotency, audit, deletion, or provider policy.

## 3. Activation and Operating States

| State | Meaning | Allowed use of this document |
|---|---|---|
| `PRE_RELEASE` | Document 29 is `HOLD`/`NO-GO` or release not completed | Prepare owners/runbooks; no production maintenance actions |
| `CANARY_OPERATION` | Approved limited audience is active | Full monitoring/support/incident duties; changes follow canary gate |
| `GENERAL_OPERATION` | Approved production audience is active | Routine maintenance and controlled improvements |
| `DEGRADED_OPERATION` | Feature partially disabled due to incident/provider/quota issue | Execute applicable runbook and communicate limitations |
| `SUSPENDED` | Security/policy/data-integrity issue requires feature stop | Preserve evidence; disable effects; remediate before reacceptance |
| `SUNSET` | Approved deprecation/removal is underway | Execute user/data/credential/worker migration and deletion plan |

Current state: **`PRE_RELEASE`**. Document 29 currently records `HOLD`.

## 4. Operating Principles

1. Operate from current evidence, not memory.
2. Treat Google/YouTube responses and policy notices as untrusted external inputs requiring validation and review.
3. Keep secrets backend-only, access least-privilege, and data minimized.
4. Prefer preventive, small, reversible maintenance with staged rollout.
5. Never upgrade a dependency, API behavior, scope, key, schema, or worker contract without tests, rollback/forward-fix, and observability.
6. Metrics detect impact, traces locate it, logs explain it, and audits prove privileged/security/privacy actions.
7. User-visible symptoms and policy deadlines drive alerts; noisy cause-only pages are corrected.
8. Preserve idempotency, fencing, and reconciliation through every restart, upgrade, restore, or incident.
9. Google suspension, credential revocation, quota restrictions, or verification requirements are never bypassed with alternate projects/accounts/proxies.
10. Update Documents 03, 24–30 whenever the approved behavior, ownership, policy, operation, limitation, or evidence changes.

## 5. Ownership Model

Named people and backup coverage are required after release:

| Role | Primary responsibility | Backup/escalation |
|---|---|---|
| Module owner | Product behavior, roadmap, acceptance, documentation consistency | Product/engineering lead |
| Technical owner | Architecture, API/domain/data/worker integrity | Senior backend/platform engineer |
| On-call/operations owner | Dashboards, alerts, incidents, runbooks, releases | Secondary on-call |
| Google Cloud owner | Project, OAuth client, API, consent, verification/audit, quota contacts | Organization cloud administrator |
| Security owner | Threat model, secrets/keys, vulnerabilities, incidents, access review | Security incident lead |
| Privacy/compliance owner | Policy changes, retention/deletion, vendors, user rights | Qualified legal/privacy reviewer |
| Database/recovery owner | Migrations, backups, restore, capacity, data integrity | Platform/database backup |
| Support owner | User diagnostics, escalation, communications, access review | Support lead |
| Mobile/frontend owner | App/browser/deep-link compatibility, accessibility | Client engineering backup |
| Release authority | Approves rollout/hold/rollback/sunset | Named executive/engineering delegate |

Unassigned ownership is a maintenance blocker and must remain visible in Document 28.

## 6. Maintenance Work Record

Every maintenance action receives `YT-MAINT-YYYYMMDD-NNN` and records:

- Trigger, purpose, scope, risk, affected environments/users/workflows.
- Owner, executor, reviewer, approval, maintenance/change window.
- Candidate/version/config/migration/key/dependency/provider state before and after.
- Backup/rollback/forward-fix, flags/workers affected, and communications.
- Exact checks and Document 28 evidence IDs.
- Result, incidents/defects, residual risk, cleanup, next review, and closure.

No secret values, tokens, raw provider payloads, video content, or unnecessary personal data are included.

## 7. Routine Operating Cadence

Exact cadence must be approved using traffic, risk, policy deadlines, staffing, cost, and provider behavior. The initial recommendation below is a planning baseline, not an automatic schedule.

| Frequency/trigger | Review | Evidence/outcome |
|---|---|---|
| Continuous | Critical SLOs, OAuth/upload/schedule/sync, workers, quota, security/privacy deadlines, telemetry pipeline | Actionable alerts and incident records |
| Each support/on-call shift where applicable | Active incidents, due schedules, queue/dead-letter age, quota reserve, provider notices | Shift handoff |
| Weekly | Error trends, reconnect rate, upload/publication outcomes, schedule lateness, sync freshness, dead letters, cleanup/deletion backlog, alert noise | Operations review record |
| Monthly initially | Dependency/security advisories, access changes, quota/cost, capacity, retention jobs, support themes, stale flags/runbooks/docs | Maintenance report |
| Quarterly recommended | Access/secret/key/backup/restore, threat model, privacy/vendor, Google policy/API/quota, disaster/incident exercise | Reviewed evidence and actions |
| Every release | Full change risk, tests, migration, security, provider contract, runbooks, rollback, docs | Document 27–29 release evidence |
| On Google notice/API change | Terms/policy/deprecation/scope/quota/verification impact | Change record and launch/feature gate |
| On incident | Contain, investigate, communicate, recover, learn | Incident/post-incident record |

The approved cadence and named owners are recorded in Document 03 and tracked in Document 28.

## 8. Daily/Continuous Health Runbook

Operators determine:

1. Are connection/OAuth completion and token refresh healthy?
2. Are uploads/publications succeeding without unknown or duplicate effects?
3. Are due schedules executing within the approved lateness SLO?
4. Is synchronization fresh and accurately reflecting provider states?
5. Are queue age, leases, retries, dead letters, database/storage capacity, and worker versions normal?
6. Is quota within budget/reserve and forecast safe for deadlines?
7. Are deletion/revocation/retention deadlines safe?
8. Are telemetry export, redaction, dashboards, alert delivery, and support reference lookup healthy?

Use Document 25 dashboards and runbooks. Never diagnose by querying plaintext tokens, copying full database rows, or calling YouTube repeatedly outside the quota policy.

## 9. Weekly Service Review

- Review SLI/SLO/error-budget trends and user/provider-attributed impact separately.
- Inspect OAuth abandonment, callback failures, refresh/reconnect changes, and scope/permission patterns.
- Review upload throughput/failure/resume/unknown outcomes and remote cleanup ledger.
- Review publication restrictions/processing latency, schedule lateness/missed/dead-letter items, and sync staleness/unknown/deleted candidates.
- Reconcile quota accounting with Google console observations and investigate drift.
- Review retry storms, rate/abuse controls, tenant fairness, and operational overrides.
- Inspect deletion/revocation/retention work approaching deadlines.
- Review alert noise, missing alerts, support cases, unresolved incidents, runbook gaps, and telemetry cardinality/cost.
- Assign every action an owner/deadline/evidence ID; update Document 28.

## 10. Monthly Maintenance Review

- Triage dependency/runtime/container/base-image advisories and update backlog.
- Review Google developer communications, OAuth consent/verification/audit/project contacts, API discovery/reference changes, and quota usage.
- Review feature flags, configuration drift, secret age/rotation triggers, key versions, service-account access, and break-glass use.
- Review database/storage/queue/backup growth, indexes, cleanup, retention, restore readiness, and cost.
- Review SLO/alert thresholds against measured behavior without weakening them to hide failures.
- Review supported mobile/web versions, deep links, OS/browser changes, accessibility defects, and API compatibility window.
- Review documentation freshness, decisions, limitations, technical debt, exceptions, and expired quarantines.
- Publish a minimized maintenance report with changes, risks, owners, deadlines, and evidence.

## 11. Quarterly and Annual Reviews

Quarterly recommended:

- Restore an approved backup into an isolated environment; verify RPO/RTO, encryption compatibility, deletion markers, schedules, idempotency, and safe reconciliation.
- Review privileged access and telemetry/support/audit exports; remove unused identities.
- Exercise provider outage, quota exhaustion, key unavailability, worker/backlog, telemetry blindness, and incident communication.
- Re-run threat model and privacy data-flow/vendor/retention/deletion review.
- Revalidate Google Cloud project/client owners, contacts, domains, callbacks, scopes, consent, verification/audit, and quota configuration.

Annual or policy-driven:

- Independent security/penetration review according to approved risk.
- Qualified legal/privacy review of Google/YouTube terms, policies, user disclosures, and applicable law.
- Architecture/capacity/cost/support review and a fresh product-scope confirmation.
- Evaluate whether to continue, improve, restrict, or sunset the module.

Exact schedules require approval and may be shorter for higher risk or active changes.

## 12. Dependency Upgrade Runbook

1. Identify the installation boundary, package manager/version, authoritative lockfile, runtime/build/CI environment, and dependency purpose.
2. Review official release notes, migration/deprecation/security guidance, provenance, ownership, maintenance, license, install scripts, and transitive changes.
3. Determine reachability and exposure for reported vulnerabilities; do not equate audit severity alone with proof of exploitability or safety.
4. Update one coherent dependency group at a time in a branch; never run forced audit remediation blindly.
5. Use frozen/immutable install and approved script policy; inspect new install scripts before execution.
6. Run type/lint/build, unit/contract/integration/migration/security, provider-fake, UI/device, and risk-affected E2E tests.
7. Deploy to staging, verify telemetry/performance/bundle/resource changes and provider behavior.
8. Promote the same artifact through Document 27; keep flags/rollback ready.
9. Record package versions, lockfile/SBOM diff, evidence, residual findings, exception/review date, and rollback.

Emergency security updates may use an expedited window but never skip ownership, compatibility testing, immutable evidence, or rollback.

## 13. Runtime, OS, Database, and Infrastructure Upgrade Runbook

- Read authoritative compatibility/deprecation notes for runtime, framework, database, storage, queue, host, mobile SDK, and observability components.
- Verify current and target versions against dependencies, migration tooling, cipher/KMS clients, worker message formats, and supported mobile builds.
- Rehearse database/infrastructure changes in isolated development then production-like staging with backup/restore.
- Use expand/contract migrations, compatible API/workers, canary capacity, and independent role rollouts.
- Test time, network, TLS/certificate, DNS, proxy, filesystem, memory, concurrency, and shutdown/drain behavior.
- Measure performance, quota, cost, log/metric cardinality, and new default telemetry attributes.
- Roll forward when destructive rollback is unsafe; document the exact recovery plan before change.

## 14. Google/YouTube Policy Change Runbook

1. Capture the official notice/source, publication/effective dates, affected policy/term, and organization/project/client.
2. Have product, technical, security, privacy/legal, and Google Cloud owners independently assess impact.
3. Map changes to scopes, consent copy, privacy/terms, data access/use/sharing/storage, refresh/deletion, user controls, quota, project verification/audit, uploads, and public visibility.
4. Record interpretation as a decision; do not rely on memory or unofficial summaries.
5. If continued operation may violate policy, disable the affected capability before the deadline while preserving safe reads/deletion/revocation.
6. Update documents, implementation, tests, public disclosures, console configuration, support/runbooks, and evidence.
7. Complete required Google verification/audit/change-of-use/quota process through named owners.
8. Re-run affected Document 26/29 gates and staged rollout before reenabling.

Never bypass a suspension/revocation/restriction with a new project, account, credential, proxy, undocumented endpoint, or scraper.

## 15. YouTube API and OAuth Change Runbook

Triggers include API revision, field/enum addition, method behavior, quota cost, scope, OAuth library/endpoint guidance, token behavior, verification rule, error shape, upload protocol, or deprecation.

Procedure:

- Verify against official Google/YouTube documentation and record review date/source.
- Compare provider adapter, schemas, fixtures, fake, normalized errors/states, quota table, telemetry, and user-facing behavior.
- Treat new/unknown fields and enums as untrusted; preserve safe fallback and alerting.
- Add a failing contract/regression test before adapting behavior.
- Test malformed/partial/unknown responses and old/new compatibility.
- Update provider fixtures only with sanitized/minimal evidence; never store real tokens or raw production payloads.
- Deploy behind appropriate controls and monitor provider error/status/quota changes.
- For deprecation, complete replacement before deadline and retain old path only for the approved compatibility window.

## 16. OAuth Scope Change Runbook

Scope changes are product/security/privacy changes, not configuration-only maintenance.

1. State the exact capability and why existing scopes are insufficient.
2. Confirm the scope is current, supported, least privilege, and permitted by Google policy.
3. Update product scope, consent UX, privacy/terms, Google console, threat model, data inventory, API contracts, tests, support, and quota impact.
4. Obtain Document 03 product/security/privacy/legal and Google verification approvals.
5. Request additional scope incrementally/in context where possible; do not silently broaden existing grants.
6. Existing users remain in a safe reduced-capability state until they explicitly consent.
7. Roll back by disabling the new capability; never assume removal from configuration revokes already granted tokens—follow the revocation/data policy.

## 17. Quota Review and Adjustment Runbook

Review:

- Current official per-operation costs and project allocation/reset rules.
- Actual units by operation/outcome/environment, warning/reserve/exhausted time, forecast accuracy, and accounting drift.
- Retry, polling, batching, field selection, caching/freshness, abandoned work, test/staging consumption, and tenant fairness.
- Scheduled deadlines and deletion/revocation work protected by reserve policy.
- Growth forecast using approved capacity/product plans, not invented traffic.

Adjustments:

1. Prefer request elimination/coalescing/batching and lower noncritical polling before asking for more quota.
2. Simulate new budget/reserve/priority behavior and run failure-injection tests.
3. Apply audited bounded configuration change in staging then production.
4. A quota-extension request requires current compliance evidence and approved use case; record submission/outcome/restrictions.
5. Never shift traffic to alternate projects to bypass exhaustion or restriction.

## 18. Token Encryption-Key Rotation Runbook

### Planned rotation

1. Inventory active ciphertext key versions/counts and all decrypting service/worker roles without revealing tokens.
2. Verify backups, KMS availability, least privilege, audit, staging test, and rollback/forward recovery.
3. Create a new environment-specific managed key version; do not export material.
4. Deploy readers that accept approved old/new versions.
5. Switch new encryption to the new active version through audited configuration.
6. Rewrap/re-encrypt existing credentials in bounded, idempotent, resumable batches with ownership/version conditions.
7. Verify counts, decryptability, token refresh, redaction, performance, errors, backup restore, and no plaintext persistence.
8. Observe through the approved compatibility window, remove old decrypt permission, schedule old-version destruction under policy, and update evidence.

### Emergency rotation

- Assume exposure, disable affected privileged actions if needed, restrict access, create/switch/re-encrypt/revoke urgently, review telemetry and access logs, assess Google/client-secret/token revocation, notify required parties, and conduct post-incident review.
- Never destroy the only usable key before affected ciphertext is safely handled or intentionally rendered unrecoverable under an approved revocation/deletion plan.

## 19. Google OAuth Client-Secret Rotation Runbook

1. Confirm Google supports the intended overlap/rotation behavior for the current client configuration.
2. Create/store the new secret directly in the same environment’s approved secret manager.
3. Update backend secret reference; never expose it to frontend, build output, logs, commands, or evidence.
4. Verify callback/code exchange using an organization-controlled account without disrupting existing tokens.
5. Monitor OAuth exchange errors and rollback/reference switch if safe.
6. Revoke/remove old secret after the verified window and audit completion.
7. If exposure is suspected, follow incident response and assess whether broader OAuth grants/tokens require action.

## 20. Secret and Access Review Runbook

- Inventory database, auth, Google, storage, queue, telemetry, deployment, backup, and key identities/references by environment.
- Verify least privilege, consumers, last use where available, owner, rotation/revocation triggers, MFA/SSO, and break-glass history.
- Remove departed/unused human and service access promptly.
- Confirm production secrets cannot enter non-production, CI pull requests, frontend bundles, or support tooling.
- Test emergency revocation and replacement without printing values.
- Audit access/export/config changes and retain minimized evidence.

## 21. Database and Data Maintenance Runbook

- Monitor growth, index effectiveness, query latency/locks, pool saturation, outbox/job/audit/status-event tables, cleanup, and storage cost.
- Run retention/deletion through reviewed application jobs, not ad hoc broad delete commands.
- Migrations follow Document 27 expand/migrate/contract and supported version windows.
- Backfills are bounded, idempotent, resumable, observable, rate-limited, and cancellable.
- Database maintenance must not starve time-critical schedules, token refresh, deletion/revocation, or reconciliation.
- Before material change: validate target/environment, backup, restore evidence, capacity, locks/duration, rollback/forward-fix, owner, and communication.
- After change: verify invariants, ownership, encryption, outbox/jobs, schedules, audits, performance, backups, and user-facing workflows.

## 22. Backup and Restore Drill Runbook

1. Select approved backup/recovery point and isolated restore target; validate exact target.
2. Keep all YouTube-effecting workers/schedules disabled in restored environment.
3. Restore using least-privilege recovery identity and compatible key versions.
4. Verify schema, counts/integrity, ownership, credentials, idempotency, outbox/jobs, schedules, deletion markers, audit, and retention.
5. Reconcile simulated remote state before enabling workers; prove overdue/stale schedules do not publish unexpectedly.
6. Measure actual RPO/RTO and record failures/gaps.
7. Delete the isolated restore safely under its retention policy.
8. Assign corrective actions and block release/operation if recovery objectives cannot be met.

## 23. Incident Classification

| Severity | Typical YouTube-module condition | Response |
|---|---|---|
| `SEV-1` | Token/secret exposure, cross-tenant access, unintended public/duplicate publication, data loss, policy/deletion breach, broad outage | Immediate page, containment, incident command, executive/security/privacy escalation |
| `SEV-2` | Major connection/upload/schedule/sync failure, large backlog, quota exhaustion threatening deadlines, restore failure | Urgent response and controlled degradation |
| `SEV-3` | Limited recoverable degradation, noisy failure category, bounded support impact | Owner investigates within approved support window |
| `SEV-4` | Cosmetic/documentation/low-risk maintenance issue | Prioritized backlog |

Exact severity definitions and response/communication times require organizational approval. User/security/policy impact overrides raw affected-user count.

## 24. General Incident Runbook

1. **Detect and declare:** validate symptom, assign incident ID/severity/commander, open safe timeline/channel.
2. **Protect:** stop rollout, disable affected mutations/workers, preserve deletion/revocation capability and evidence.
3. **Scope:** identify environments, versions, users/workflows, time range, Google/provider state, quota, data/security/privacy impact.
4. **Contain:** use approved kill switches, concurrency limits, credential/key revocation/rotation, or traffic control; never make unreviewed destructive changes.
5. **Diagnose:** use Document 25 correlation/dashboards/audits and Document 23 taxonomy; distinguish fact/hypothesis.
6. **Recover:** prefer idempotent forward fix/reconciliation; validate rollback compatibility and remote side effects.
7. **Verify:** user truth, database/jobs, provider state, schedules, quota, deletion deadlines, telemetry, and support communications.
8. **Communicate:** follow approved internal/user/status/Google/legal notification obligations.
9. **Learn:** blameless review, timeline/root cause/contributing factors, corrective tests/alerts/runbooks/docs/tasks with owners/deadlines.
10. **Update:** append Document 28 evidence/status and this document’s maintenance log.

## 25. Credential or Token Exposure Runbook

- Stop affected flows/exporters and restrict access; do not paste suspected secrets into tickets/chat.
- Identify credential type, environment, scope, exposure sink/time/readers, and affected connections.
- Revoke/rotate Google client secret, access/refresh tokens, key versions, or other credentials in the correct dependency order.
- If token encryption key is affected, follow Section 18 and determine whether all ciphertext should be considered exposed.
- Review logs/traces/audits/artifacts/backups/support bundles and delete/contain under approved evidence/privacy procedures.
- Notify security/privacy/legal/Google/users where required.
- Verify reauthorization UX, pending work safety, deletion/revocation, and no continuing unauthorized access.

## 26. Provider Outage or Degradation Runbook

- Confirm from Narrial signals and authoritative Google status/communications; do not declare a provider outage from one timeout.
- Pause or reduce noncritical polling/retries/uploads while preserving scheduled/deletion/revocation priority and local state.
- Show accurate degraded/stale/retry-later states; never claim provider completion.
- Prevent synchronized retry storms with circuit/bulkhead/backoff/jitter/quotas.
- Track unknown outcomes and reconcile before replay when service recovers.
- Communicate provider attribution as an evidence-based observation, not speculation.
- Resume gradually and inspect backlog, quota, duplicate risk, schedules, sync freshness, and user support.

## 27. Quota Exhaustion Runbook

1. Verify accounting, Google console state, reset timing, and whether cause is legitimate demand, retry/poll storm, cost change, abuse, or drift.
2. Enter reserve/exhausted mode; stop noncritical sync/probes/new work per Document 24.
3. Protect eligible deadlines and deletion/revocation work within approved priority.
4. Rate-limit abusive actors and stop runaway workers without shifting to an alternate project.
5. Show accurate deferred state and avoid promised timing the provider cannot meet.
6. At reset/recovery, resume gradually, reconcile, and update capacity/optimization/quota-extension plan.

## 28. Missed Schedule or Unintended Publication Runbook

- Immediately pause scheduler/publication workers and affected flags if impact may continue.
- Determine intended time/timezone/generation, lease/fencing/idempotency, provider/local event timing, retries, deploys, clock, quota, and permission state.
- For possible duplicate/unknown effect, reconcile YouTube before any replay.
- Do not delete/change remote content without authorized user/product policy and exact target validation.
- Correct user-facing state, preserve audit/evidence, communicate transparently, and provide approved recovery.
- Add regression/failure-injection tests and verify backlog before controlled resume.

## 29. Synchronization Drift or Incorrect Display Runbook

- Compare persisted observation/state/event version with a fresh authorized quota-approved provider read.
- Verify connection ownership, credential health, requested parts/fields, provider ID, response parsing, precedence, and staleness.
- Do not mark deleted from a single missing response; follow Document 22 confirmation rules.
- Quarantine unknown enum/schema changes, retain safe fallback, alert provider-adapter owner, and update fixtures/tests from official evidence.
- Reconcile affected records in bounded idempotent batches and verify UI/history.

## 30. Deletion or Revocation Deadline Runbook

- Page before the applicable deadline based on Document 24; assign privacy/security/operations incident ownership.
- Stop new collection/use and isolate affected connection/user records.
- Retry idempotently with bounded priority; verify tokens, active data, caches, storage, queues, telemetry/support, vendors, and backup policy.
- Revoke provider grants when app-initiated and permitted; do not claim remote YouTube content deletion.
- Record completed/failed stores and evidence without retaining deleted content or credentials.
- Escalate legal/Google/user notification decisions to qualified owners.

## 31. Telemetry or Alerting Failure Runbook

- Confirm whether application health or only visibility/delivery is affected.
- Halt rollout and high-risk maintenance when critical paths are blind.
- Use approved independent health/audit paths; do not enable verbose unredacted logging.
- Bound exporter buffers/retries to protect application resources.
- Restore collector/storage/delivery, verify gaps/dropped data, test-fire alerts, and annotate blind interval.
- Investigate secret/redaction canary detection as a security incident and contain affected sinks.

## 32. Support Escalation Runbook

1. Authenticate user/case and collect support reference, approximate time, operation type, visible safe code, app version, and network category.
2. Use owner-scoped minimized diagnostics; Tier 1 never views tokens, raw payloads, content, or another user’s data.
3. Classify connection/permission/upload/publication/schedule/sync/quota/provider/client issue.
4. Provide approved retry/reconnect/status guidance; never request credentials or authorize blind replay.
5. Elevation is just-in-time, reason-bound, audited, and time-limited.
6. Escalate security/privacy/deletion/unintended publication immediately.
7. Record resolution category and improvement opportunity without copying sensitive evidence.

## 33. Alert and Runbook Maintenance

- Each alert retains owner, severity, symptom/SLO/policy basis, threshold/window, dashboard, runbook, deduplication, escalation, test-fire date, and last incident usefulness.
- Remove or redesign alerts repeatedly acknowledged without action.
- Add detection for incidents users found before operators.
- Review thresholds from evidence; do not loosen merely to reduce pages.
- Test primary and backup delivery periodically and after provider/vendor/config changes.
- Review runbooks after use, staffing change, architecture/dependency/API change, and every exercise.

## 34. Documentation and Decision Maintenance

- Document 03 records new/superseded decisions; never erase historical rationale.
- Document 28 is updated with every maintenance action, evidence, blocker, regression, deployment, incident, and future-improvement state.
- Documents 24–30 receive version/change-log updates for policy, operational, testing, deployment, acceptance, or limitation changes.
- API/schema/state/field/error/flag/environment changes update all dependent documents and contracts together.
- Run a periodic link/filename/terminology/decision/TBD/staleness audit.
- A new AI session reads Document 28 first, then the current owning documents and evidence; it does not infer completion from filenames.

## 35. Known Limitations Register

These are documentation-derived baseline limitations; final values must be reconciled after Documents 00–10 are finalized and implementation is verified.

| ID | Limitation | User/operational effect | Mitigation/status |
|---|---|---|---|
| `YT-LIM-001` | Module is currently pre-release | No production YouTube Connection is accepted or enabled | Complete Documents 00–29 gates |
| `YT-LIM-002` | Documents 00–10 are currently prompts/structures | Foundational decisions may be incomplete | Finalize and reconcile Documents 11–30 |
| `YT-LIM-003` | Google OAuth/YouTube behavior depends on external availability and policy | Connection/upload/status may degrade | Accurate states, retries, reconciliation, runbooks |
| `YT-LIM-004` | YouTube API quota is finite and operation costs/rules may change | Work may defer; schedules/status freshness may be affected | Budget/reserve/optimization/review |
| `YT-LIM-005` | Upload success does not imply processing/public visibility | Users may wait or see provider restrictions | Synchronization and truthful status |
| `YT-LIM-006` | Provider processing/publication timing cannot be guaranteed absolutely | Approved lateness/freshness SLO excludes provider uncertainty transparently | Monitor/reconcile/communicate |
| `YT-LIM-007` | Deleting Narrial data does not automatically delete YouTube-hosted videos | Remote content remains unless separately authorized through YouTube | Explicit UX/privacy disclosure |
| `YT-LIM-008` | One missing video response is insufficient proof of deletion | Deletion display may be delayed | Repeated authorized confirmation |
| `YT-LIM-009` | Mobile app/browser/deep-link behavior varies by OS/version | Manual/device coverage and compatibility windows required | Document 26 device matrix |
| `YT-LIM-010` | Long-lived installed mobile clients constrain backend contract removal | Compatibility code may persist | Additive APIs and deprecation plan |
| `YT-LIM-011` | Exact hosts, SLOs, RPO/RTO, retention, capacities, tools, owners remain approval-dependent | Operations cannot be activated yet | Resolve Document 03 decisions |
| `YT-LIM-012` | YouTube watch-page dates may use provider display conventions different from creator local time | Displayed remote date can differ | Explain and retain selected timezone/UTC intent |

Limitations must be user-visible when they affect decisions or expectations. A limitation cannot excuse a security, privacy, data-integrity, or policy violation.

## 36. Limitation Lifecycle

Each limitation records owner, source/evidence, affected versions/users, severity, workaround, UI/support disclosure, target, and review date.

Status progression:

`DISCOVERED → CONFIRMED → DISCLOSED/MITIGATED → PLANNED → RESOLVED` or `ACCEPTED WITH REVIEW DATE`.

Material new limitations trigger product/support/security review and, when needed, feature hold or Document 29 reacceptance.

## 37. Future Improvement Eligibility

A proposal is eligible only if it:

- Is exclusively about YouTube Connection and fits or deliberately changes the approved YouTube scope.
- States the user/operational problem and measurable outcome.
- Uses supported documented Google/YouTube capabilities.
- Defines scope/non-scope, data/scopes, quota cost, security/privacy/policy impact, architecture/schema/API/UI/worker impact, migrations, observability, tests, rollout, rollback, maintenance, and deletion.
- Does not depend on scraping, downloading YouTube content without authorization, policy/quota bypass, or silently broadened consent.
- Has an owner, priority rationale, dependencies, acceptance criteria, and approval state.

Every accepted proposal updates Documents 01–10, relevant implementation documents, Document 03 decisions, Document 28 tracker, Document 29 acceptance scope, and this backlog.

## 38. YouTube-Only Future Improvement Backlog

All entries are `PROPOSED — Not approved or implemented` unless Document 03 says otherwise.

| ID | Improvement | Value | Key approval/risks |
|---|---|---|---|
| `YT-FUT-001` | Multiple YouTube channels per Narrial user, if current release is single-channel | Manage creators with multiple eligible channels | Identity/UX/ownership/quota/schema |
| `YT-FUT-002` | Bulk upload/publish queue | Reduce repetitive publishing work | Quota, storage, concurrency, safety, UX |
| `YT-FUT-003` | Draft metadata templates | Consistent YouTube metadata | Privacy, validation, template ownership |
| `YT-FUT-004` | Approved playlist selection/management enhancements | Better organization at publish time | Scope/permission/quota/partial failure |
| `YT-FUT-005` | Thumbnail workflow improvements | Better publication control | File safety, YouTube constraints, accessibility |
| `YT-FUT-006` | Smarter quota-aware synchronization | Improve freshness within finite quota | Priority/fairness/forecast accuracy |
| `YT-FUT-007` | Upload bandwidth/adaptive chunk optimization | Improve large-file reliability | Device/network/memory/provider protocol |
| `YT-FUT-008` | Schedule calendar and batch rescheduling | Improve schedule visibility/control | Timezone/DST/concurrency/accidental publication |
| `YT-FUT-009` | Proactive permission/connection health notifications | Reduce failed scheduled work | Notification consent, privacy, noise |
| `YT-FUT-010` | Enhanced YouTube processing/restriction explanations | Improve recovery and transparency | Provider state accuracy, no unsupported claims |
| `YT-FUT-011` | User-visible operational/status history improvements | Better self-service diagnostics | Retention/privacy/cardinality |
| `YT-FUT-012` | YouTube-native feature adoption when officially supported and policy-approved | Reduce custom operational burden | Official capability verification and migration |

This backlog deliberately excludes cross-platform publishing, YouTube analytics/revenue/comments/live-stream management, and content downloading unless separately proposed and approved as a new YouTube scope with full documentation.

## 39. Future Improvement Intake Template

```text
Proposal ID/title:
Problem and affected YouTube users:
Current evidence/limitation:
Desired measurable result:
Included/non-scope:
Official YouTube/Google capability/source:
OAuth scopes and consent impact:
Data/privacy/retention/deletion impact:
Quota/cost/capacity impact:
Security/threat/abuse impact:
Architecture/API/database/worker/UI impact:
Migration/backward compatibility:
Observability/support/runbooks:
Test and staging plan:
Rollout/rollback/kill switch:
Owner/dependencies/decision IDs:
Approval/status:
```

## 40. Change Classification

| Class | Example | Required gate |
|---|---|---|
| Routine operational | Approved alert threshold tuning from evidence | Peer review, staging/test-fire, audited deploy |
| Low-risk maintenance | Patch dependency with no contract change | Focused/full affected tests and staged release |
| Material technical | Runtime/database/queue/provider client upgrade | Architecture/security/migration/resilience review and Document 27 |
| Product behavior | New metadata option or scheduling rule | Product/UX/requirements/contracts and full affected tests |
| Sensitive permission/data | New OAuth scope or retained data | Security/privacy/legal/Google verification and Document 29 reacceptance |
| Emergency | Active exploit/credential exposure/outage | Incident authority, containment, expedited tested change, post-review |
| Breaking/deprecation | API/state/schema/client compatibility removal | Formal deprecation/migration/sunset plan |

## 41. Deprecation and Sunset Runbook

1. State why capability/module is changing or ending, affected users/data/scopes/jobs, alternatives, and timeline.
2. Obtain product, security, privacy/legal, operations, support, Google Cloud, and release approval.
3. Notify users/support with accurate consequences and export/deletion choices.
4. Stop new connections/work in stages; preserve safe reads and deletion/revocation.
5. Cancel/reconcile uploads/publications/schedules without unintended remote actions.
6. Revoke tokens, delete credentials/authorized data within applicable deadlines, expire caches/telemetry/vendors/backups under policy, and explain remote YouTube content remains.
7. Remove OAuth clients/scopes/secrets, queues/workers/storage/routes/flags/alerts after evidence proves no dependency remains.
8. Preserve only approved audit/legal evidence; update documents and close ownership.
9. Never reuse residual credentials/data for another purpose or platform.

## 42. Maintenance Testing Requirements

For every change:

- Add a failing regression/contract test before behavior changes when practicable.
- Run repository-discovered focused tests, then all affected unit/contract/integration/database/UI/worker/security/observability suites.
- Run provider-fake failure cases and selected real staging Google/YouTube verification for provider-affecting changes.
- Test migrations, rollback/forward-fix, worker drain/restart, idempotency, unknown outcome, quota, redaction, and support diagnostics as applicable.
- Test supported devices/deep links/accessibility for frontend/mobile changes.
- Run load/soak/fault/restore tests for capacity/infrastructure changes.
- Retain Document 26 evidence and update Document 28; never claim an unexecuted test passed.

## 43. Maintenance Release Procedure

1. Open maintenance/change record and decisions.
2. Audit current repository/provider/policy state and freeze scope.
3. Implement test-first in small reversible slices.
4. Complete review, security/dependency/migration/test gates.
5. Build one immutable artifact and deploy to staging.
6. Run affected Document 26/29 acceptance and operational exercises.
7. Promote under Document 27 with flags off or bounded canary.
8. Observe approved thresholds, advance/hold/rollback, reconcile and clean up.
9. Update all source-of-truth documents, Document 28 evidence/status, limitations, and change log.

## 44. Maintenance Evidence Register

Document 28 is authoritative. This table provides Stage 15 links:

| Maintenance ID | Date | Type/scope | Candidate/environment | Evidence IDs | Result | Next review |
|---|---|---|---|---|---|---|
| None | — | Post-release operation not active | — | — | PRE_RELEASE | After Document 29 `GO` |

## 45. Operational Readiness Checklist

- [ ] Document 29 records valid human-approved release/canary outcome.
- [ ] Every role in Section 5 has primary/backup owner and access.
- [ ] Cadences, SLOs, severity/response times, maintenance window, and communications are approved.
- [ ] Dashboards, alerts, runbooks, support diagnostics, status communication, and backup/restore work.
- [ ] Google/policy/dependency/security notice sources and owners are configured.
- [ ] Key/client-secret/other-secret rotation and break-glass procedures were exercised safely.
- [ ] Quota review/budget/reserve/extension process and dashboard are operational.
- [ ] Incident, outage, quota, missed publication, sync drift, deletion, and telemetry exercises pass.
- [ ] Limitation register is accurate and material limitations are disclosed.
- [ ] Future improvements use the approval template and cannot bypass scope/gates.
- [ ] Document 28 update responsibility and evidence retention/access are assigned.

## 46. Decisions Requiring Approval

| ID | Decision | Recommended direction | Blocks |
|---|---|---|---|
| `YT-MAINT-DEC-001` | Named maintenance/on-call/support/security/privacy owners | Primary and backup for each critical role | Operations activation |
| `YT-MAINT-DEC-002` | Review cadence and evidence retention | Risk-based cadence with automatic reminders | Routine governance |
| `YT-MAINT-DEC-003` | Incident severities, response times, communication channels | User/security/policy-impact based | Incident operation |
| `YT-MAINT-DEC-004` | Dependency update policy and exception SLA | Small staged groups; no blind forced fixes | Upgrades |
| `YT-MAINT-DEC-005` | Key/client-secret rotation cadence and overlap | Provider/KMS-supported, tested, evidence-based | Credential operations |
| `YT-MAINT-DEC-006` | Backup/restore drill cadence and RPO/RTO | Regular isolated restore with schedule reconciliation | Recovery |
| `YT-MAINT-DEC-007` | Quota review cadence, forecast horizon, reserve policy | Protect critical deadlines and fairness | Capacity |
| `YT-MAINT-DEC-008` | Supported device/client/version lifecycle | Published compatibility/deprecation window | Frontend/API maintenance |
| `YT-MAINT-DEC-009` | Limitation disclosure and review policy | User-visible when expectations/actions are affected | Support/product |
| `YT-MAINT-DEC-010` | Future-improvement prioritization process | Evidence/value/risk/effort review; YouTube only | Roadmap |
| `YT-MAINT-DEC-011` | Sunset triggers and minimum notice | Policy/security/value/maintenance based with safe revocation/deletion | Deprecation |

Record decisions in Document 03 and their execution/evidence in Document 28.

## 47. Definition of Maintained

The module is `Maintained` only when:

- Ownership and coverage are current.
- SLOs, queues, schedules, sync, quota, security/privacy deadlines, and telemetry are healthy or actively managed under an incident.
- Google/YouTube policy/API/OAuth/quota and dependency changes are reviewed before deadlines.
- Secrets/keys/access, backups/restores, retention/deletion, vulnerabilities, alerts/runbooks, and support workflows meet approved cadence.
- Known limitations and user disclosures are accurate.
- Incidents and defects create regression tests and corrective work.
- Every material change passes staged verification/release controls.
- Documents 03 and 24–30 match production and Document 28 evidence is current.

A released feature with stale ownership, unreviewed policy changes, broken restore, expired keys, noisy alerts, or outdated documentation is not considered maintained.

## 48. Sign-Off Record

| Approval | Named owner | Evidence | Decision/date | Status |
|---|---|---|---|---|
| Maintenance ownership/cadence | Unassigned | Required | Required | Blocked |
| Google policy/API/quota operations | Unassigned | Required | Required | Blocked |
| Security/access/key rotation | Unassigned | Required | Required | Blocked |
| Privacy/retention/deletion | Unassigned | Required | Required | Blocked |
| Dependency/platform/database maintenance | Unassigned | Required | Required | Blocked |
| Incident/on-call/support readiness | Unassigned | Required | Required | Blocked |
| Backup/restore/disaster recovery | Unassigned | Required | Required | Blocked |
| Limitations and roadmap governance | Unassigned | Required | Required | Blocked |
| Stage 15 activation | Unassigned | Document 29 `GO` plus all above | Required | Blocked |

No AI agent may assign owners, approve changes, execute privileged maintenance, or claim unobserved evidence.

## 49. Approval Record

Approval to add this document approves only the maintenance/runbook/limitation/future-improvement documentation baseline. It does not approve the module as released, activate maintenance, assign owners, schedule actions, upgrade dependencies, change policy interpretation, rotate/revoke credentials or keys, access user data, alter quota, run incidents, deploy code, or approve future features.

## 50. Prerequisites and Next Document

Prerequisites:

- `24-security-privacy-quota-and-compliance-operations.md`
- `25-observability-auditing-monitoring-and-support.md`
- `26-testing-strategy-fixtures-and-verification-matrix.md`
- `27-deployment-environment-variables-and-release-runbook.md`
- `28-progress-tracker-implementation-checkpoints-and-evidence.md`
- `29-final-verification-acceptance-criteria-and-definition-of-done.md`

Next: none predefined. Any new document, implementation work, maintenance action, incident response, or future improvement must be explicitly authorized and must update Documents 03, 28, and this document as applicable.

## 51. Change Log

| Version | Date | Change | Approval |
|---|---|---|---|
| 1.0.0 | 2026-08-26 | Initial post-release maintenance, operational runbook, limitations, deprecation, and YouTube-only future-improvement baseline generated and added at user request | User approved document creation only |
