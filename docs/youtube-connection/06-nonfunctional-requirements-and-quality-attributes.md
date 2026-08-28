# YouTube Connection Module — Nonfunctional Requirements and Quality Attributes

## Document Control

| Field | Value |
|---|---|
| Document number | 06 |
| Stage | Stage 2 — Requirements definition |
| Status | Approved quality baseline — numerical targets and owners remain gated |
| Version/date | 1.0.0 / 2026-08-26 |
| Prerequisites | Documents 01–05 |
| Next | `07-system-architecture-and-service-boundaries.md` |
| Implementation authorized | No |

## 1. Purpose and Conventions

This document defines technology-neutral quality requirements that architecture and implementation MUST satisfy. `MUST`/`MUST NOT` are mandatory; `SHOULD` requires an approved exception; `MAY` is optional. Every unknown numerical threshold is `Requires approval`; no traffic, latency, uptime, capacity, retention, recovery, or quota value is invented.

Each requirement is verified by measurement, automated test, security test, load/fault test, accessibility review, restore exercise, or operational evidence against an identified environment/candidate.

## 2. Quality Priority

Security, privacy, correctness, ownership isolation, and duplicate prevention take precedence over convenience and throughput. Honest state takes precedence over apparent responsiveness. Accessibility is release-required. Performance, availability, freshness, cost, and retention trade-offs require recorded decisions in Document 03.

## 3. Security and Privacy

| ID | Normative requirement | Measurement/evidence |
|---|---|---|
| `YT-NFR-SEC-001` | Every protected action MUST authenticate and authorize resource ownership server-side. | Cross-user/IDOR tests: zero unauthorized access |
| `YT-NFR-SEC-002` | OAuth transactions MUST be high-entropy, expiring, tamper-resistant, user/environment-bound, and atomically single-use. | Replay, tamper, expiry, login-CSRF tests |
| `YT-NFR-SEC-003` | Credentials MUST remain backend-only, protected with authenticated encryption, versioned keys, unique nonce/equivalent, and restricted decrypt access. | Threat review, tamper test, access review |
| `YT-NFR-SEC-004` | TLS/certificate validation, strict origin/redirect allowlists, input limits, timeouts, safe headers, output allowlists, and bounded abuse controls MUST apply. | Configuration and penetration tests |
| `YT-NFR-SEC-005` | Secrets MUST NOT enter source, client bundles, URLs, logs, traces, analytics, screenshots, errors, or support artifacts. | Automated secret/leak scans: zero findings |
| `YT-NFR-SEC-006` | Dependencies and lockfiles MUST receive vulnerability/license review before release; unresolved critical/high risk blocks release. | Audit report and approved exceptions |
| `YT-NFR-PRIV-001` | Data collection MUST be limited to approved connection, channel, operation, audit, and support purposes. | Field-purpose inventory review |
| `YT-NFR-PRIV-002` | Consent, disconnection, deletion, retention, backup aging, and remote-content boundaries MUST be transparent and policy-reviewed. | Privacy review and scenario tests |
| `YT-NFR-PRIV-003` | Support/telemetry MUST use minimum safe identifiers and role-restricted access. | Access audit and payload inspection |

## 4. Reliability, Availability, and Resilience

| ID | Normative requirement | Target/evidence |
|---|---|---|
| `YT-NFR-REL-001` | OAuth consumption, credential replacement, idempotency, schedule claiming, and state transitions MUST remain correct under concurrency/retry. | Deterministic race/fault tests |
| `YT-NFR-REL-002` | Acknowledged connection, upload, publication, and schedule state MUST survive process/client restart. | Restart/recovery E2E tests |
| `YT-NFR-REL-003` | Uncertain remote effects MUST reconcile before repetition; duplicate unintended videos/schedules MUST be zero in the acceptance suite. | Failure-injection evidence |
| `YT-NFR-REL-004` | Partial Google/YouTube/database failure MUST preserve last confirmed truth and a recoverable state. | Dependency-failure matrix |
| `YT-NFR-AVAIL-001` | Connection/status APIs, mutation APIs, and workers require separate availability SLIs/SLOs. | Threshold/window: Requires approval |
| `YT-NFR-AVAIL-002` | Narrial availability MUST be measured separately from Google/YouTube availability. | Dashboard/error attribution review |
| `YT-NFR-RES-001` | Retries MUST be bounded, classified, idempotent, jittered/backed off conceptually, and stop at terminal/manual recovery. | Policy values require approval; fault tests |
| `YT-NFR-RES-002` | Provider/quota outage MUST degrade honestly without false success or data loss. | Outage/quota simulations |

## 5. Performance and Scalability

| ID | Normative requirement | Target/evidence |
|---|---|---|
| `YT-NFR-PERF-001` | Connection, authorization-start, channel, schedule, status, refresh, and disconnect latency MUST have p50/p95/p99 SLIs. | Thresholds/load profile: Requires approval |
| `YT-NFR-PERF-002` | UI MUST acknowledge user actions promptly with busy/progress state; exact threshold requires approval. | Device timing/accessibility tests |
| `YT-NFR-PERF-003` | Narrial processing time MUST be measured separately from network transfer and Google/YouTube processing time. | Trace/timing decomposition |
| `YT-NFR-PERF-004` | Upload handling MUST avoid whole-file memory buffering, support backpressure/resumption, and enforce approved resource limits. | Memory/network interruption load tests |
| `YT-NFR-PERF-005` | Progress cadence MUST be useful without excessive client, database, or quota load. | Cadence/budget threshold: Requires approval |
| `YT-NFR-SCALE-001` | Capacity assumptions MUST cover users, connections, OAuth attempts, upload bytes/concurrency, schedules, workers, sync volume, audit growth, and quota. | Approved capacity model required |
| `YT-NFR-SCALE-002` | Overload MUST apply bounded queues/backpressure/rate controls and protect OAuth, credential, and schedule correctness. | Stress/soak tests |

## 6. Accessibility and Usability

| ID | Normative requirement | Target/evidence |
|---|---|---|
| `YT-NFR-A11Y-001` | Supported interfaces MUST meet WCAG 2.1 AA at minimum unless Document 06 is amended. | Automated plus manual assistive-technology audit |
| `YT-NFR-A11Y-002` | Semantics, labels, focus order/restoration, keyboard/switch access, announcements, errors, dialogs, progress, and disabled states MUST be operable. | Zero release-blocking violations |
| `YT-NFR-A11Y-003` | Normal text contrast MUST be at least 4.5:1; large text and UI indicators at least 3:1; color MUST NOT be the only signal. | Contrast audit |
| `YT-NFR-A11Y-004` | Text scaling, reduced motion, touch targets, timezone clarity, and external-browser return MUST be tested on approved clients. | Client matrix; touch target standard requires approval |
| `YT-NFR-USE-001` | Users MUST distinguish Google transition, channel identity, upload vs processing, schedule timezone, reconnect, retry safety, and disconnect consequences. | Task/usability study targets require approval |

## 7. Integrity, Auditability, and Observability

| ID | Normative requirement | Target/evidence |
|---|---|---|
| `YT-NFR-DATA-001` | Ownership, connection uniqueness, OAuth atomicity, credential version, provider identity, schedules, idempotency, valid transitions, clocks, and timezones MUST preserve integrity. | Constraint/transaction/concurrency tests |
| `YT-NFR-DATA-002` | YouTube authority and Narrial normalized state precedence MUST be explicit; contradictions trigger reconciliation. | State-machine/reconciliation tests |
| `YT-NFR-AUDIT-001` | Security and lifecycle events MUST record time, actor category, safe target, outcome, correlation, and reason without secrets/private metadata. | Audit-schema and leakage tests |
| `YT-NFR-OBS-001` | Redacted structured logs, request IDs, bounded-cardinality metrics, approved traces, health/readiness, dashboards, and alerts MUST cover critical workflows. | Staging observability review |
| `YT-NFR-OBS-002` | Metrics MUST cover OAuth conversion, refresh failure, uploads, schedule execution/lateness, sync lag, retries, provider errors, and quota. | Thresholds/owners: Requires approval |

## 8. Maintainability and Testability

| ID | Normative requirement | Evidence |
|---|---|---|
| `YT-NFR-MAINT-001` | YouTube provider logic MUST be isolated behind approved boundaries and MUST NOT require other-platform behavior. | Architecture/code review |
| `YT-NFR-MAINT-002` | Public contracts, migrations, configuration, deprecation, decisions, ownership, and documentation MUST change compatibly and remain synchronized. | Change/release review |
| `YT-NFR-TEST-001` | Critical tests MUST use deterministic provider fakes, controlled clocks/retries, and failure injection without live Google access. | Test-suite review |
| `YT-NFR-TEST-002` | Staging MUST verify real OAuth/channel/upload behavior; production side effects require controlled test accounts and approval. | Staging evidence |

## 9. Recovery, Backup, Retention, and Deletion

| ID | Normative requirement | Target/evidence |
|---|---|---|
| `YT-NFR-REC-001` | RPO/RTO MUST be approved for database, credentials/key compatibility, workers, schedules, uploads, migration rollback/forward-fix, and resynchronization. | Values require approval; restore exercise |
| `YT-NFR-REC-002` | Backups MUST be encrypted, access-restricted, environment-isolated, monitored, and regularly restored in tests. | Frequency/retention require approval |
| `YT-NFR-RET-001` | OAuth transactions, credentials, channel metadata, uploads/artifacts, publications, schedules, status history, audits, logs, metrics, backups, and test data MUST each have purpose, sensitivity, retention, deletion trigger, and owner. | Retention matrix approval required |
| `YT-NFR-RET-002` | Disconnect, Narrial account deletion, local record deletion, credential invalidation, backup aging, provider revocation, and remote video deletion MUST remain distinct. | Privacy/data tests |
| `YT-NFR-RET-003` | Deletion MUST be auditable without retaining deleted secrets/content; legal/policy exceptions require qualified review. | Deletion/restore tests |

## 10. Quota, Abuse, Compatibility, and Deployment

| ID | Normative requirement | Target/evidence |
|---|---|---|
| `YT-NFR-QUOTA-001` | Official operation costs MUST be inventoried; environment/release budgets, alerts, caching, pacing, and exhaustion behavior require approval. | Document 24 official-source verification |
| `YT-NFR-QUOTA-002` | Runaway polling/retry MUST be prevented and quota exhaustion MUST not corrupt state. | Quota/fault tests |
| `YT-NFR-OPS-001` | Authorization start, callback, refresh, upload creation, retry, schedule, status, and disconnect require abuse controls. | Thresholds require approval; load/security tests |
| `YT-NFR-DEPLOY-001` | Builds MUST be reproducible with locked dependencies, validated config, compatible migrations/workers, feature controls, health/smoke tests, and rollback/forward-fix evidence. | Staging release rehearsal |
| `YT-NFR-DEPLOY-002` | Local/development/staging/production secrets, data, OAuth clients, and callbacks MUST be isolated; unsafe defaults/wildcards MUST fail closed. | Environment review |
| `YT-NFR-OPS-002` | Named primary/backup owners, incident severity, escalation, quota/key/provider runbooks, and safe support diagnostics MUST exist before production. | Ownership/runbook sign-off |
| `YT-NFR-MAINT-003` | Supported Node/Expo/iOS/Android/web/provider/API/timezone compatibility MUST be explicit in Documents 09–10. | Compatibility matrix |

## 11. Quality Scenarios

Acceptance scenarios MUST cover OAuth replay/tamper, expired/revoked credentials, cross-user probing, interrupted upload, duplicate submit/worker delivery, ambiguous timezone, provider/quota/database outage, backend/worker restart, traffic increase, assistive technology, backup restore, migration failure, and deployment rollback. Each records stimulus, environment, response, metric, threshold, owner, and evidence.

## 12. Approval-Required Targets

| Decision group | Required values/owners | Blocks |
|---|---|---|
| Availability/performance | SLO windows, latency percentiles, UI feedback, worker lateness | Architecture/release |
| Capacity/upload | Users, concurrency, sizes/duration, throughput, memory, queue depth | Architecture/upload |
| Recovery/data | RPO, RTO, backup frequency, restore cadence, retention/deletion periods | Database/production |
| Security/operations | Rate/retry limits, review/penetration scope, support/alert coverage | Security/release |
| Quota/sync | Budget, reserve, alert thresholds, polling/freshness | Sync/production |
| Compatibility/accessibility | Clients, versions, touch target/device/AT matrix | UX/test/release |
| Ownership | Security, privacy, data, Google, QA, platform, operations | All approval gates |

## 13. Architecture Constraints

Document 07 MUST provide backend-only secrets, atomic OAuth consumption, encrypted/versioned credentials, persistent state, idempotent remote effects, streaming/backpressured upload, durable observable workers, explicit environment isolation, quota-aware reconciliation, compatible migrations, and tested restoration. Technology selection remains open.

## 14. Verification and Traceability

Every `YT-NFR-*` MUST map to applicable `YT-FR-*`, scope item, journey/state, architecture component, Document 26 test, environment, gate, owner, and evidence ID. Security/privacy/accessibility/integrity failures are release-blocking. Missing approved numerical targets block architecture capacity decisions and production acceptance, not documentation drafting.

## 15. Acceptance Criteria

- [x] `YT-NFR-AC-001` — All requested quality families are covered with stable IDs.
- [x] `YT-NFR-AC-002` — Requirements are measurable or explicitly approval-gated.
- [x] `YT-NFR-AC-003` — Security, privacy, accessibility, integrity, quota, recovery, and deployment safety are mandatory.
- [x] `YT-NFR-AC-004` — Narrial timing/availability is separated from provider behavior.
- [x] `YT-NFR-AC-005` — Technology-neutral architecture constraints and verification expectations are defined.
- [x] `YT-NFR-AC-006` — No threshold, owner, secret, platform scope, or implementation technology was invented.
- [x] `YT-NFR-AC-007` — User approved building/adding this baseline.
- [ ] `YT-NFR-AC-008` — Numerical targets, retention, recovery, quota, capacity, clients, and owners are approved.
- [ ] `YT-NFR-AC-009` — Measured implementation evidence passes.

## 16. Prerequisites and Next Document

Documents 01–05 control outcome, scope, terminology, UX, and functional behavior. Pending decisions remain gated. Next: `07-system-architecture-and-service-boundaries.md`, which must demonstrate how each approved `YT-FR-*` and `YT-NFR-*` is satisfied without weakening them.

## 17. Change Log

| Version | Date | Change | Author/role | Approval |
|---|---|---|---|---|
| 1.0.0 | 2026-08-26 | Replaced generation prompt with approved security, privacy, reliability, availability, performance, scalability, accessibility, integrity, recovery, retention, quota, operations, and deployment-quality baseline | AI documentation agent | User approved build/add; targets and owners remain gated |
