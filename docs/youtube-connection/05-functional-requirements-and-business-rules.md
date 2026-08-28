# YouTube Connection Module — Functional Requirements and Business Rules

## Document Control

| Field | Value |
|---|---|
| Document number | 05 |
| Stage | Stage 2 — Requirements definition |
| Status | Approved functional baseline — conditional requirements remain gated |
| Version/date | 1.0.0 / 2026-08-26 |
| Prerequisites | Documents 00–04 |
| Next | `06-nonfunctional-requirements-and-quality-attributes.md` |
| Authority | Testable behavior and business rules for the YouTube Connection module |
| Implementation authorized | No |

## 1. Purpose and Normative Language

This document translates the approved product, scope, governance, and UX baselines into independently testable behavior. `MUST`/`MUST NOT` are mandatory, `SHOULD` is expected unless an approved exception exists, and `MAY` is optional. A conditional requirement becomes mandatory only for a release that approves its governing decision.

It does not select API paths, schemas, packages, hosts, cryptography, worker technology, retry numbers, or provider limits.

## 2. Capability Map and Order

| Capability | Responsibility | Depends on |
|---|---|---|
| `youtube-identity` | Narrial authentication and ownership | Existing Narrial authentication |
| `youtube-oauth` | Authorization, callback, credentials, reconnect | `youtube-identity` |
| `youtube-channel` | Discovery, health, permissions, disconnect | `youtube-oauth` |
| `youtube-video-input` | Source ownership, eligibility, metadata | `youtube-channel` |
| `youtube-upload` | Durable resumable transfer/recovery | `youtube-video-input` |
| `youtube-publish` | Immediate publication and processing | `youtube-upload` |
| `youtube-schedule` | Future publication/change/cancellation | `youtube-publish` |
| `youtube-sync` | Remote reconciliation and display | `youtube-publish`, `youtube-schedule` |
| `youtube-recovery` | Errors, retries, idempotency, reconnection | All prior capabilities |
| `youtube-operations` | Safe audit and operational events | All prior capabilities |

Dependency order follows the table. Scheduling remains proposed R2 until `PV-DEC-004` is approved.

## 3. Requirement Record Rules

Each `YT-FR-*` statement is atomic. Verification codes mean: `U` unit, `C` contract, `I` integration, `E` end-to-end, `M` manual/accessibility, `S` security/fault injection. Release `R1?` is proposed but decision-gated; `CM` means complete module.

## 4. Identity and Ownership

| ID | Normative requirement | Verification | Release |
|---|---|---|---|
| `YT-FR-001` | Backend MUST authenticate the Narrial user before returning or mutating YouTube data. | C/I/S | R1? |
| `YT-FR-002` | Backend MUST derive user identity from verified authentication, never a client-supplied user ID. | C/S | R1? |
| `YT-FR-003` | Every connection, upload, publication, schedule, and status operation MUST enforce ownership. | C/I/S | R1? |
| `YT-FR-004` | A different or expired session MUST NOT receive another user’s OAuth result or records. | I/E/S | R1? |
| `YT-FR-005` | Sign-out MUST clear user-scoped client cache; durable backend work follows approved policy. | U/E | R1? |

## 5. OAuth Connection

| ID | Normative requirement | Verification | Release |
|---|---|---|---|
| `YT-FR-010` | Authenticated connect/reconnect MUST create a short-lived, single-use backend authorization transaction bound to the user and environment. | I/S | R1? |
| `YT-FR-011` | The frontend MUST launch only the backend-provided authorization URL and MUST NOT receive Google credentials. | C/E/S | R1? |
| `YT-FR-012` | Callback processing MUST validate transaction binding, expiry, integrity, redirect context, and prior consumption before code exchange. | U/I/S | R1? |
| `YT-FR-013` | Invalid, expired, replayed, denied, or cancelled authorization MUST NOT create or replace a connection. | I/E/S | R1? |
| `YT-FR-014` | Authorization-code exchange MUST occur on the backend and MUST NOT be automatically retried as an ordinary idempotent request. | I/S | R1? |
| `YT-FR-015` | Connection success MUST require successful exchange plus retrieval of an authorized YouTube channel. | I/E | R1? |
| `YT-FR-016` | App/deep-link return MUST act only as a backend-refetch signal. | C/E/S | R1? |
| `YT-FR-017` | A cancelled reconnect MUST preserve an existing healthy connection. | I/E | R1? |

## 6. Credentials, Channel, and Health

| ID | Normative requirement | Verification | Release |
|---|---|---|---|
| `YT-FR-020` | Google access/refresh tokens and authorization codes MUST remain backend-only and MUST NOT be serialized to public clients. | C/S | R1? |
| `YT-FR-021` | Credential material MUST be protected at rest under Document 13 before persistence. | I/S | R1? |
| `YT-FR-022` | When refresh succeeds without a new refresh token, the existing valid refresh token MUST be preserved. | U/I | R1? |
| `YT-FR-023` | Concurrent refreshes MUST NOT corrupt or incorrectly invalidate usable credentials. | I/S | R1? |
| `YT-FR-024` | Missing/revoked/unusable refresh authority MUST result in `reconnection required`, not repeated hidden refresh. | I/E | R1? |
| `YT-FR-025` | Narrial MUST persist safe provider-derived channel ID, name, handle/thumbnail when available, permission summary, and health. | I/E | R1? |
| `YT-FR-026` | Provider identifiers MUST NOT independently prove Narrial ownership. | C/S | R1? |
| `YT-FR-027` | Healthy status MUST require an owned connection and permission adequate for the requested operation. | U/I | R1? |
| `YT-FR-028` | Channel count, cross-user uniqueness, and different-channel reconnect behavior MUST follow `PV-DEC-001`–`002`. | I | Conditional |

## 7. Reconnection and Disconnection

| ID | Normative requirement | Verification | Release |
|---|---|---|---|
| `YT-FR-030` | Reconnect MUST use a new OAuth transaction and replace credentials only after full backend verification. | I/E/S | R1? |
| `YT-FR-031` | Reconnect failure MUST preserve the last authoritative connection state and provide safe recovery. | I/E | R1? |
| `YT-FR-032` | Disconnect MUST require ownership, consequence confirmation, and duplicate-safe processing. | C/E | R1? |
| `YT-FR-033` | Once disconnect begins successfully, new provider mutations MUST be blocked for that connection. | I/S | R1? |
| `YT-FR-034` | Completion MUST make stored credentials unusable and persist disconnected state; optional provider revocation MUST be reported honestly. | I/E/S | R1? |
| `YT-FR-035` | Pending schedules/history after disconnect MUST follow `PV-DEC-010`–`011`; no implicit deletion or execution is allowed. | I/E | Conditional |
| `YT-FR-036` | A safe audit event MUST record disconnect outcome without secrets. | I/S | R1? |

## 8. Target, Video, and Metadata Eligibility

| ID | Normative requirement | Verification | Release |
|---|---|---|---|
| `YT-FR-040` | Only an owned, healthy, sufficiently permitted connection MAY be selected; eligibility MUST be rechecked before remote effect. | C/I | R1? |
| `YT-FR-041` | An invalidated selection MUST be rejected with reconnect/reselect guidance. | I/E | R1? |
| `YT-FR-042` | Video source MUST exist, be readable, owned/authorized, unchanged, and compatible at validation and operation creation. | U/I | R1? |
| `YT-FR-043` | Supported source types and size/duration constraints MUST follow `PV-DEC-005` and `SCOPE-DEC-002`. | I | Conditional |
| `YT-FR-044` | Metadata MUST be validated before provider submission; errors MUST identify the affected input safely. | U/C/E | R1? |
| `YT-FR-045` | Title, description, tags, category, privacy, audience, thumbnail, playlist, captions, and language MUST be classified by approved `PV-DEC-006`–`009` and `SCOPE-DEC-001`. | C/E | Conditional |
| `YT-FR-046` | A privacy default MUST NOT be silently inferred; user confirmation MUST show the final privacy value. | E/S | R1? |

## 9. Upload and Recovery

| ID | Normative requirement | Verification | Release |
|---|---|---|---|
| `YT-FR-050` | Upload creation MUST validate identity, ownership, channel health, video, metadata, and an idempotency identity before persistence/provider work. | C/I/S | R1? |
| `YT-FR-051` | Acknowledgement MUST return one durable operation identity and initial normalized state. | C/I | R1? |
| `YT-FR-052` | Repeated equivalent creation with the same valid idempotency identity MUST NOT create another unintended upload. | I/S | R1? |
| `YT-FR-053` | Transfer SHOULD use an approved resumable mechanism and persist recovery information securely. | I/S | R1? |
| `YT-FR-054` | Queued, uploading, interrupted, cancelling, cancelled, received, processing, retryable failure, and terminal failure MUST remain distinguishable. | C/E | R1? |
| `YT-FR-055` | Progress MUST be authoritative when known and explicitly indeterminate when not measurable. | C/E/M | R1? |
| `YT-FR-056` | Client disconnect/restart MUST NOT erase the durable operation or create a replacement automatically. | I/E | R1? |
| `YT-FR-057` | Retry/resume MUST reuse eligible operation/session state; expired sessions require controlled replacement without duplicate remote effects. | I/S | R1? |
| `YT-FR-058` | Cancellation MUST be idempotent and disclose whether remote transfer/video effects may remain. | I/E | R1? |

## 10. Processing and Immediate Publication

| ID | Normative requirement | Verification | Release |
|---|---|---|---|
| `YT-FR-060` | Transfer completion MUST NOT be reported as processing or publication completion. | C/E | R1? |
| `YT-FR-061` | Processing pending/success/failure/restriction/rejection/unknown MUST map to distinct normalized states when observable. | C/I | R1? |
| `YT-FR-062` | Immediate publication MUST require eligible upload, healthy connection, approved metadata/privacy/audience, confirmation, and idempotency. | C/I/E | Conditional `PV-DEC-004` |
| `YT-FR-063` | Published status MUST require authoritative provider evidence and store a safe YouTube video identity. | I/E | Conditional R1? |
| `YT-FR-064` | Retry after uncertain provider effect MUST reconcile before repeating the mutation. | I/S | R1? |

## 11. Scheduling

| ID | Normative requirement | Verification | Release |
|---|---|---|---|
| `YT-FR-070` | Schedule creation MUST validate ownership, eligibility, metadata, future instant, explicit timezone, and idempotency before durable persistence. | U/I/E | CM; proposed R2 |
| `YT-FR-071` | Past, nonexistent, or ambiguous local time MUST be rejected or require explicit disambiguation; silent correction is prohibited. | U/E | CM |
| `YT-FR-072` | Execution MUST be backend-controlled and independent of the client remaining open. | I/E | CM |
| `YT-FR-073` | Before execution, worker MUST revalidate schedule state, lock/claim, connection authority, credentials, and publication eligibility. | I/S | CM |
| `YT-FR-074` | Repeated worker delivery MUST NOT duplicate publication. | I/S | CM |
| `YT-FR-075` | Reschedule MUST validate ownership/state/time/version and resolve concurrency without losing authoritative state. | I/E | CM |
| `YT-FR-076` | Cancellation MUST be idempotent; races with execution MUST reconcile and explain the actual result. | I/E/S | CM |
| `YT-FR-077` | Missed/delayed work MUST retain intended time, actual attempt time, reason, retry eligibility, and visible outcome. | I/E | CM |
| `YT-FR-078` | Disconnect effects MUST follow `PV-DEC-010`. | I | Conditional |

## 12. Synchronization and Display

| ID | Normative requirement | Verification | Release |
|---|---|---|---|
| `YT-FR-080` | Records with nonterminal, stale, or disputed remote state MUST be eligible for reconciliation. | U/I | R1? |
| `YT-FR-081` | YouTube is authoritative for remote channel/video state; Narrial is authoritative for normalized persistent application state. | I | R1? |
| `YT-FR-082` | Manual refresh and approved automatic synchronization MUST enforce ownership and quota-aware behavior. | C/I/S | R1? |
| `YT-FR-083` | Provider outage, credential failure, and quota exhaustion MUST preserve last confirmed state and mark freshness honestly. | I/E | R1? |
| `YT-FR-084` | User lists/details MUST be user-scoped and show normalized status, last update, channel/video context, schedule timezone, and only valid state-dependent actions. | C/E | R1? |
| `YT-FR-085` | Loading, empty, offline, stale, failure, and no-retry display MUST follow Document 04. | E/M | R1? |

## 13. Errors, Retry, Concurrency, and Idempotency

| ID | Normative requirement | Verification | Release |
|---|---|---|---|
| `YT-FR-090` | Errors MUST distinguish authentication, ownership, validation, OAuth denial/state, permissions, refresh/revocation, channel, upload, processing, schedule conflict/miss, outage, rate/quota, offline, and internal failure. | C/E | R1? |
| `YT-FR-091` | Public errors MUST state safe recovery/preservation and MUST NOT expose secrets, stack traces, internal URLs, or raw provider payloads. | C/S | R1? |
| `YT-FR-092` | Automatic retries MUST be limited to classified transient/idempotent work; one-time code exchange and uncertain mutations MUST NOT be blindly retried. | U/I/S | R1? |
| `YT-FR-093` | Concurrent callback, refresh, disconnect, upload, schedule, and worker actions MUST have deterministic conflict outcomes. | I/S | R1? |
| `YT-FR-094` | Retry exhaustion MUST produce a terminal or manual-recovery state and safe support correlation. | I/E | R1? |
| `YT-FR-095` | Exact attempt limits, delay formulas, freshness intervals, and support route require later approval. | Review | Conditional |

## 14. Security, Privacy, Audit, and UI Behavior

| ID | Normative requirement | Verification | Release |
|---|---|---|---|
| `YT-FR-100` | OAuth state MUST be expiring, single-use, user/environment bound, tamper-resistant, and replay-protected. | I/S | R1? |
| `YT-FR-101` | Redirect targets MUST be allowlisted; open redirects and secrets in URLs are prohibited. | U/S | R1? |
| `YT-FR-102` | Credentials MUST NOT appear in navigation, UI state, public responses, analytics, logs, screenshots, or support evidence. | C/E/S | R1? |
| `YT-FR-103` | Loading/mutation states MUST prevent duplicate activation and provide accessible progress; empty/offline/recovery states MUST offer a valid next action. | E/M | R1? |
| `YT-FR-104` | Safe audit categories MUST cover authorization, connection, credential failure, disconnect, upload, schedule, publication, reconciliation, and retry exhaustion without private metadata or credentials. | I/S | R1? |
| `YT-FR-105` | Analytics MUST use approved minimal categories and exclude codes, tokens, OAuth state, raw payloads, file content, and private metadata. | S | R1? |

## 15. Business Rules Register

| ID | Rule | Status |
|---|---|---|
| `YT-BR-001` | No unauthenticated or cross-user YouTube operation is allowed. | Approved baseline |
| `YT-BR-002` | A returned client is not connected until backend verification succeeds. | Approved baseline |
| `YT-BR-003` | Only healthy, owned, sufficiently permitted channels are publishing targets. | Approved baseline |
| `YT-BR-004` | Connection count and cross-user uniqueness follow `PV-DEC-001`–`002`. | Requires approval |
| `YT-BR-005` | Reconnect never destroys a healthy connection before replacement succeeds. | Approved baseline |
| `YT-BR-006` | Disconnect blocks new provider mutations and follows approved pending/history rules. | Part approved; `PV-DEC-010`–`011` open |
| `YT-BR-007` | Video ownership, availability, compatibility, and limits are revalidated at operation creation. | Approved baseline; limits open |
| `YT-BR-008` | Final privacy and audience choices are visible before submission. | Approved baseline; exact policy open |
| `YT-BR-009` | Transfer, processing, scheduling, and publication are separate lifecycles. | Approved baseline |
| `YT-BR-010` | Potentially duplicate remote effects require idempotency or reconciliation before repetition. | Approved baseline |
| `YT-BR-011` | Scheduled execution is durable and client-independent. | Complete module |
| `YT-BR-012` | YouTube remote evidence takes precedence for remote state; contradictions trigger reconciliation. | Approved baseline |
| `YT-BR-013` | Quota exhaustion delays/rejects eligible work honestly; it never creates false success. | Approved baseline |
| `YT-BR-014` | No secret or credential material is client-visible or included in evidence. | Approved baseline |

## 16. State-to-Action Matrix

| State | Allowed | Blocked | Recovery/authority |
|---|---|---|---|
| Not connected | Connect, view allowed history | Upload/publish/schedule | Backend connection state |
| Verifying | Refetch/wait | Duplicate connect, provider mutation | Backend OAuth transaction |
| Healthy | Refresh, select, publish, disconnect | None beyond scope | Backend plus YouTube evidence |
| Reconnect required | Reconnect, view allowed history | New provider mutation | New OAuth grant |
| Uploading | Monitor, eligible cancel | Duplicate creation | Upload operation/session |
| Interrupted retryable | Resume/retry | Blind new upload | Backend eligibility/reconciliation |
| Processing | Monitor/refresh | Claim published | YouTube state |
| Scheduled | View, eligible reschedule/cancel | Duplicate execution | Durable schedule/worker |
| Published | View/monitor | Repeat publication | YouTube evidence |
| Stale/unknown | Refresh/support | Claim current success | Reconciliation |

## 17. Priority and Decision Matrix

All `R1?` requirements are proposed `RELEASE_REQUIRED` only after `PV-DEC-001`, `003`–`007`, `012`, `SCOPE-DEC-001`–`002`, and applicable UX decisions are resolved. Scheduling requirements are `COMPLETE_MODULE` and proposed R2. Thumbnails, playlists, captions, notifications, deletion, and post-publication editing remain conditional/deferred per Document 02.

Additional open operational decisions include retry limits, synchronization freshness, pagination, draft preservation, offline cached display, and support presentation. Document 03 must receive stable decision records before these become fixed behavior.

## 18. Traceability Matrix

| Requirement family | Capabilities/scope | Journeys/states | Business rules | Later controllers |
|---|---|---|---|---|
| `YT-FR-001`–`005` | `PV-SYS-001`, `SCOPE-IN-016` | All protected journeys | 001 | 07–08, 14–15, 26 |
| `YT-FR-010`–`017` | `PV-CAP-001`–`005`, `SCOPE-IN-001`–`002` | Journeys 001–002; states 003–007 | 002, 005 | 08, 11, 13, 15–16, 26 |
| `YT-FR-020`–`036` | `PV-CAP-006`–`010`, `SCOPE-IN-003`–`006` | Journeys 003–005; connection states | 003–006, 014 | 12–18, 23–24, 26 |
| `YT-FR-040`–`046` | `PV-CAP-011`–`013`, `SCOPE-IN-007`–`008` | Journeys 006–007; states 101–103 | 003, 007–008 | 18–20, 26 |
| `YT-FR-050`–`064` | `PV-CAP-014`–`016`, `SCOPE-IN-009`–`011` | Journey 008; upload/publication states | 009–010 | 15, 19–20, 22–23, 26 |
| `YT-FR-070`–`078` | `PV-CAP-017`–`019`, `SCOPE-IN-012`–`013` | Journeys 009–010; schedule states | 006, 011 | 12, 15, 21, 23, 26 |
| `YT-FR-080`–`095` | `PV-CAP-020`–`022`, `SCOPE-IN-014`–`015` | Journey 011; all recovery states | 010, 012–013 | 15, 22–23, 25–26 |
| `YT-FR-100`–`105` | `PV-SYS-002`–`004`, `013`–`016` | All journeys | 001, 014 | 13, 15, 18, 24–27 |

## 19. Requirements Risks

| ID | Risk | Control |
|---|---|---|
| `YT-REQ-RISK-001` | Conditional proposal is implemented as approved behavior | Decision/status matrix and gate tests |
| `YT-REQ-RISK-002` | Frontend becomes authoritative | Contract/security tests |
| `YT-REQ-RISK-003` | Duplicate provider effects | Idempotency, locking, reconciliation, fault tests |
| `YT-REQ-RISK-004` | Disconnect has hidden consequences | Approval-gated pending/history rules |
| `YT-REQ-RISK-005` | Timezone or processing states collapse | Dedicated states and edge-case tests |
| `YT-REQ-RISK-006` | Quota/security/operations treated as optional | Release-required controls and gates |
| `YT-REQ-RISK-007` | Mocks or other platforms leak into requirements | Audit, scope, and traceability review |

## 20. Requirements Acceptance Criteria

- [x] `YT-REQ-AC-001` — Normative language and stable requirement IDs are used.
- [x] `YT-REQ-AC-002` — Every approved journey has precondition, success, failure, and verification behavior.
- [x] `YT-REQ-AC-003` — Authentication, OAuth, credentials, channels, reconnect, and disconnect are covered.
- [x] `YT-REQ-AC-004` — Video eligibility, metadata, upload, processing, publication, scheduling, and synchronization are covered.
- [x] `YT-REQ-AC-005` — Retry, idempotency, concurrency, offline, and recovery behavior is covered.
- [x] `YT-REQ-AC-006` — Security-sensitive behavior and safe audit boundaries are functional requirements.
- [x] `YT-REQ-AC-007` — Scope and unresolved decisions remain visible.
- [x] `YT-REQ-AC-008` — Requirements trace to capabilities, scope, journeys, rules, and later controllers.
- [x] `YT-REQ-AC-009` — YouTube-only terminology is preserved.
- [x] `YT-REQ-AC-010` — User approved building and adding this functional baseline.
- [ ] `YT-REQ-AC-011` — Conditional requirements are individually approved for their releases.
- [ ] `YT-REQ-AC-012` — Implementation test evidence exists.

## 21. Completion Checklist

- [x] Documents 00–04 were reviewed.
- [x] Capability map and dependency order are recorded.
- [x] Requirements are atomic, normative, and assigned verification levels.
- [x] Business rules and state/action permissions are recorded.
- [x] No exact API, schema, dependency, or infrastructure choice was invented.
- [x] No secrets or other platform behavior is included.
- [x] User approved Document 05.
- [ ] Document 00 formal approval, named owners, and applicable pending decisions are recorded.
- [ ] Runtime acceptance evidence passes.

## 22. Prerequisites and Next Document

Documents 01–04 control vision, scope, governance, and UX. Until their pending decisions are resolved, this document is an approved branched baseline rather than a frozen implementation contract.

Next: `06-nonfunctional-requirements-and-quality-attributes.md`, which will define measurable security, reliability, performance, accessibility, scalability, availability, auditability, capacity, retention, and recovery targets without changing these functional outcomes.

## 23. Change Log

| Version | Date | Change | Author/role | Approval |
|---|---|---|---|---|
| 1.0.0 | 2026-08-26 | Replaced generation prompt with approved capability map, testable requirements, business rules, permissions, decisions, risks, and traceability | AI documentation agent | User approved build/add; conditional requirements remain gated |
