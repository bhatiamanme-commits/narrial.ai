# YouTube Connection Module — Scope, Non-Scope, and Release Boundaries

## Document Control

| Field | Value |
|---|---|
| Document number | 02 |
| Filename | `02-scope-non-scope-and-release-boundaries.md` |
| Module | YouTube Connection only |
| Stage | Stage 1 — Product definition |
| Status | Approved scope baseline — conditional release decisions remain gated |
| Version | 1.0.0 |
| Last updated | 2026-08-26 |
| Prerequisites | Documents 00–01 |
| Next document | `03-decision-register-glossary-and-source-of-truth.md` |
| Intended audience | Product, design, frontend, backend, data, security, QA, platform, operations, support, and future AI agents |
| Source-of-truth role | Defines YouTube-only inclusion, exclusion, deferral, ownership, and release boundaries |
| Implementation authorized | No |

---

## 1. Purpose and Authority

This document converts the approved product vision into controlled scope boundaries. It identifies what belongs to the complete YouTube Connection module, what is proposed for the first production release, what is conditional, what is deferred, and what is explicitly excluded.

It prevents:

- Mock behavior being mistaken for production functionality.
- A connection-only implementation being mistaken for the complete module.
- Hidden frontend, backend, database, worker, security, testing, deployment, or operational work.
- Expansion into other social platforms.
- Unapproved release commitments.
- Silent addition or removal of capabilities.

After approval, this document controls product scope. It does not authorize implementation, dependency installation, database creation, Google Cloud configuration, or deployment. A scope item becomes implementation-ready only after its prerequisite decisions and later technical documents are approved.

## 2. Relationship to Earlier Documents

### 2.1 Document 00

`00-existing-work-and-current-state-audit.md` is the evidence baseline. It confirms that the existing Expo experience is largely mock-driven and the Fastify backend is only a partial safety foundation. It also confirms that production OAuth, token persistence, channel discovery, uploads, scheduling workers, synchronization, and deployment are not implemented.

Document 00 is complete but still awaits separately recorded formal approval. This does not permit its repository evidence to be ignored; it does prevent downstream documents from claiming that its conclusions were formally signed off.

### 2.2 Document 01

`01-product-vision-and-final-result.md` is the approved product vision. Its `PV-CAP-*`, `PV-SYS-*`, `PV-DEC-*`, `PV-RISK-*`, and `PV-AC-*` identifiers are controlling inputs.

### 2.3 Dependency readiness

| Dependency | Condition | Effect on this document |
|---|---|---|
| Document 00 | Audit complete; formal approval pending | Current-state classifications may be used as evidence but remain reviewable |
| Document 01 | Approved | Product outcome is binding |
| `PV-DEC-001`–`PV-DEC-014` | Unresolved unless explicitly stated otherwise | Affected release commitments remain `CONDITIONAL` or proposed |
| Documents 03–10 | Not finalized | Governance, UX, requirements, architecture, contracts, stack, and environment execution remain blocked |

## 3. Scope Principles

1. **YouTube only:** this module designs and implements only Google authorization and YouTube channel/video workflows.
2. **Connection before publishing:** a backend-verified healthy connection is required before provider mutations.
3. **Backend-owned provider operations:** OAuth code exchange, tokens, provider calls, schedules, and authoritative state are not frontend responsibilities.
4. **Mocks are not authority:** existing mock state must be replaced or isolated before production.
5. **Vertical completion:** a feature is not complete until UI, API, persistence, provider behavior, recovery, security, tests, deployment, and operations work together where applicable.
6. **No hidden infrastructure:** databases, storage, workers, secrets, monitoring, quotas, backups, and release controls are part of scope when required.
7. **Explicit deferral:** deferred work must record why, impact, dependencies, and approval path.
8. **Least privilege:** only permissions required by approved capabilities may be requested.
9. **Evidence before release:** filenames, mocks, and code presence do not pass release gates.
10. **No silent scope changes:** changes follow Section 30.

## 4. Scope Classification System

| Classification | Meaning | Implementation authority | Release effect | Change authority | Required evidence |
|---|---|---|---|---|---|
| `RELEASE_REQUIRED` | Mandatory for the approved first production release | Only after prerequisite gates | Blocks first release | User/product approval | End-to-end test and gate evidence |
| `COMPLETE_MODULE` | Required for the final module vision, possibly after first release | Only in its approved release | Blocks module completion, not necessarily R1 | User/product approval | Feature acceptance evidence |
| `CONDITIONAL` | Inclusion or release placement needs a decision | None until decided | Blocks affected planning | Explicit user approval | Decision record |
| `DEFERRED` | Intentionally postponed YouTube-only capability | None for current release | Does not block current release | Approved scope change | Future plan and acceptance evidence |
| `OUT_OF_SCOPE` | Excluded from this module | Prohibited | Must not delay release | Explicit scope amendment | Updated Documents 02, 03, and 28 |
| `EXTERNAL_DEPENDENCY` | Controlled by Google, YouTube, hosting, or another approved external system | Narrial may configure/integrate only | Can block release | Named owner/approver | External configuration/runtime evidence |
| `EXISTING_REUSABLE` | Current work can be retained after verification | Modification only when authorized | May reduce implementation effort | Technical review | Current tests and contract fit |
| `EXISTING_REPLACE` | Mock, unsafe, conflicting, or incomplete authority must be replaced | Replacement only after design approval | Blocks production | Technical/product approval | Production integration tests |
| `REQUIRES_VERIFICATION` | Status cannot be established locally or from current evidence | Read-only verification allowed when authorized | May block a gate | Evidence owner | Reproducible evidence |
| `REQUIRES_APPROVAL` | A human decision is required | None until approved | Blocks dependent work | Named approver | Decision record and date |

“Proposed R1” means a recommended boundary, not an approved release commitment.

## 5. Complete-Module Capabilities

| Scope ID | Capability | Classification | Proposed release | User-visible result | Main dependencies | Approval status |
|---|---|---|---|---|---|---|
| `SCOPE-IN-001` | Start Google OAuth from an authenticated Narrial session | `COMPLETE_MODULE`; proposed `RELEASE_REQUIRED` | R1 | User can begin connection safely | Auth, Google setup, OAuth backend | Proposed |
| `SCOPE-IN-002` | Handle consent success, cancellation, denial, invalid state, and callback replay | `COMPLETE_MODULE`; proposed `RELEASE_REQUIRED` | R1 | Honest connection outcome | 03, 05, 08, 11, 13, 16 | Proposed |
| `SCOPE-IN-003` | Retrieve and persist the authorized YouTube channel | `COMPLETE_MODULE`; proposed `RELEASE_REQUIRED` | R1 | Verified channel identity | OAuth, database, YouTube API | Proposed |
| `SCOPE-IN-004` | Display health, permissions, and reconnect-required status | `COMPLETE_MODULE`; proposed `RELEASE_REQUIRED` | R1 | Trustworthy connection state | Token lifecycle, channel sync | Proposed |
| `SCOPE-IN-005` | Refresh/recheck, reconnect, and disconnect | `COMPLETE_MODULE`; proposed `RELEASE_REQUIRED` | R1 | User controls authorization | Business and retention rules | Proposed |
| `SCOPE-IN-006` | Persist connection state across restart and supported devices | `COMPLETE_MODULE`; proposed `RELEASE_REQUIRED` | R1 | Connection does not disappear | Authenticated backend/database | Proposed |
| `SCOPE-IN-007` | Select and validate an eligible video source | `COMPLETE_MODULE`; proposed `RELEASE_REQUIRED` | R1 | Only publishable owned media proceeds | `PV-DEC-005`, Document 19 | Conditional source types |
| `SCOPE-IN-008` | Collect and validate approved YouTube metadata | `COMPLETE_MODULE`; proposed `RELEASE_REQUIRED` | R1 | Actionable validation | `PV-DEC-006`–`007`, Document 20 | Conditional field/default details |
| `SCOPE-IN-009` | Create and perform a durable resumable upload | `COMPLETE_MODULE`; proposed `RELEASE_REQUIRED` | R1 | Upload progresses and recovers safely | Storage/source, API, persistence | Proposed |
| `SCOPE-IN-010` | Report transfer and YouTube processing separately | `COMPLETE_MODULE`; proposed `RELEASE_REQUIRED` | R1 | Honest lifecycle status | Upload IDs and synchronization | Proposed |
| `SCOPE-IN-011` | Publish immediately | `COMPLETE_MODULE` | Proposed R1 | User can publish without scheduling | `PV-DEC-004`, metadata and upload | Requires approval for R1 |
| `SCOPE-IN-012` | Schedule future publication | `COMPLETE_MODULE` | Proposed R2 | Durable timezone-aware publishing | `PV-DEC-004`, workers, persistence | Requires approval for release placement |
| `SCOPE-IN-013` | Reschedule and cancel eligible schedules | `COMPLETE_MODULE` | Proposed R2 | User controls pending schedules | Scheduling business rules | Requires approval |
| `SCOPE-IN-014` | Synchronize remote video state | `COMPLETE_MODULE`; proposed `RELEASE_REQUIRED` | R1 minimum; expanded R2 | Narrial reflects YouTube | Remote identifiers, workers | Proposed |
| `SCOPE-IN-015` | Provide safe retries, recovery, and reconnection | `COMPLETE_MODULE`; proposed `RELEASE_REQUIRED` | R1 | Failures have safe next actions | Error contract, idempotency | Proposed |
| `SCOPE-IN-016` | Enforce security, privacy, ownership, and token protection | `COMPLETE_MODULE`; proposed `RELEASE_REQUIRED` | R1 | Credentials and users are protected | 06, 10, 13, 24 | Proposed |
| `SCOPE-IN-017` | Monitor quota, health, errors, and audit events | `COMPLETE_MODULE`; proposed `RELEASE_REQUIRED` | R1 | Operations are supportable | 24–25 | Proposed |
| `SCOPE-IN-018` | Test, stage, deploy, rollback, restore, and verify | `COMPLETE_MODULE`; proposed `RELEASE_REQUIRED` | R1 | Release has evidence and recovery | 26–29 | Proposed |

## 6. Proposed First Production Release

### 6.1 Proposed R1 outcome

The recommended first production release is the smallest secure vertical slice that lets an authenticated Narrial creator:

1. Connect one YouTube channel through backend-verified Google OAuth.
2. See persisted channel identity, health, and permission state.
3. Refresh, reconnect, and disconnect.
4. Select an approved Narrial-managed video.
5. Enter the minimum approved YouTube metadata.
6. Upload through a durable, resumable workflow.
7. Publish immediately using an explicitly selected or safely approved privacy state.
8. See transfer, YouTube processing, published, failed, restricted, and reconnect-required states.
9. Retry eligible failures without duplicate publication.
10. Receive the same persisted state after restarting or signing in again on a supported client.

This proposal intentionally places scheduled publication after the immediate-publishing slice to reduce first-release worker, timezone, missed-job, and deployment risk. `PV-DEC-004` must approve or change that placement.

### 6.2 Proposed R1 inclusions

- `SCOPE-IN-001` through `SCOPE-IN-011`.
- Minimum synchronization required to show accurate R1 status under `SCOPE-IN-014`.
- `SCOPE-IN-015` through `SCOPE-IN-018`.
- One connection per Narrial user as the proposed R1 limit.
- Narrial-managed/generated video sources as the proposed R1 input.
- Immediate publishing as the proposed R1 publishing mode.
- User-confirmed privacy with private as the proposed safe default if a default is approved.

### 6.3 Proposed R1 exclusions

- Scheduled publication, rescheduling, and schedule cancellation unless `PV-DEC-004` places them in R1.
- Multiple connected channels.
- Shared channel/workspace ownership.
- Custom thumbnails.
- Playlist placement.
- Captions/subtitles.
- Remote deletion or post-publication metadata editing.
- Historical analytics beyond the status required for the submitted video.

### 6.4 R1 cannot remain mocked

The following must be real and verified before R1:

- Narrial authentication enforced by the backend.
- Google authorization and callback verification.
- YouTube channel retrieval.
- Encrypted token persistence and refresh behavior.
- Database-backed connection and operation state.
- YouTube upload and publication.
- Provider-status reconciliation.
- Safe retry and duplicate prevention.
- Monitoring, quota handling, deployment, and rollback.

## 7. Future Release Boundaries

### 7.1 Proposed R2 — Scheduled publishing

R2 completes `SCOPE-IN-012` and `SCOPE-IN-013` with durable timezone-aware schedules, independent worker execution, locking, idempotency, retry policy, missed-job behavior, rescheduling, cancellation, and status synchronization.

R2 may be merged into R1 only by resolving `PV-DEC-004` and accepting the additional worker, operational, security, and test gates.

### 7.2 Proposed R3 — YouTube publishing enhancements

R3 may include approved thumbnails, playlists, captions, post-publication metadata changes, additional video sources, multiple channels, or notifications. These are not committed work until individually approved.

## 8. Conditional Capabilities

| ID | Capability | Options | Proposed placement | Blocking decision |
|---|---|---|---|---|
| `SCOPE-COND-001` | Multiple channels per Narrial user | One; multiple | Defer beyond R1 | `PV-DEC-001` |
| `SCOPE-COND-002` | Same channel connected by multiple Narrial users | Prohibit; independent; workspace-owned | Out of R1 | `PV-DEC-002` |
| `SCOPE-COND-003` | Brand Account support | Required; deferred; unsupported | Verify in staging before commitment | `PV-DEC-003` |
| `SCOPE-COND-004` | Immediate publishing in R1 | Include; defer | Include | `PV-DEC-004` |
| `SCOPE-COND-005` | Scheduled publishing in R1 | Include; R2; exclude | R2 | `PV-DEC-004` |
| `SCOPE-COND-006` | Supported video sources | Narrial-managed; local; hosted URL; combination | Narrial-managed in R1 | `PV-DEC-005` |
| `SCOPE-COND-007` | Metadata set | Minimum; expanded | Minimum approved set in R1 | `PV-DEC-006` |
| `SCOPE-COND-008` | Default privacy | Private; unlisted; public; no default | Private or explicit choice | `PV-DEC-007` |
| `SCOPE-COND-009` | Custom thumbnails | R1; later; excluded | Later | `PV-DEC-008` |
| `SCOPE-COND-010` | Playlist placement | R1; later; excluded | Later | `PV-DEC-009` |
| `SCOPE-COND-011` | Pending work after disconnect | Cancel; pause; retain blocked; case-based | Pause/block | `PV-DEC-010` |
| `SCOPE-COND-012` | History after disconnect | Retain; delete; user-selectable | Retain non-secret history under policy | `PV-DEC-011` |
| `SCOPE-COND-013` | Supported clients | iOS; Android; web; combination | Match approved Narrial targets | `PV-DEC-012` |
| `SCOPE-COND-014` | Geographic or age restrictions | Provider-only; Narrial-specific | Provider-only unless required | `PV-DEC-013` |
| `SCOPE-COND-015` | Operational ownership | Named internal; platform team; vendor | Named primary and backup | `PV-DEC-014` |
| `SCOPE-COND-016` | Captions/subtitles | R1; later; excluded | Later | New decision required |
| `SCOPE-COND-017` | Made-for-kids/audience input policy | Required explicit input; allowed default where lawful | Explicit user input proposed | Product/legal review required |
| `SCOPE-COND-018` | Very large video limits | Provider maximum; lower Narrial limit | Define after capacity design | 06, 19 approval |
| `SCOPE-COND-019` | Notifications | In-app; push; email; none | Later | Product approval required |
| `SCOPE-COND-020` | Remote video deletion | Include; later; exclude | Later or exclude | Product/security approval required |
| `SCOPE-COND-021` | Edit metadata after publication | Include; later; exclude | Later | Product/API approval required |

## 9. Deferred YouTube-Only Improvements

| ID | Improvement | Reason for deferral | Dependency | User value | Risk | Future inclusion |
|---|---|---|---|---|---|---|
| `SCOPE-DEF-001` | Multiple connected channels | Adds selection, ownership, uniqueness, and token complexity | Single-channel R1 evidence | Multi-channel creators | Medium | Requires scope amendment |
| `SCOPE-DEF-002` | Shared/workspace channel ownership | No approved team model | Identity/authorization redesign | Teams and agencies | High | Requires new product model |
| `SCOPE-DEF-003` | Custom thumbnails | Adds media validation and partial failure | Stable upload/publish | Better presentation | Medium | Conditional approval |
| `SCOPE-DEF-004` | Playlist placement | Adds lookup, permission, quota, and partial failure | Stable publication | Organization | Medium | Conditional approval |
| `SCOPE-DEF-005` | Captions/subtitles | Adds file formats and lifecycle | Stable upload | Accessibility/reach | Medium | Conditional approval |
| `SCOPE-DEF-006` | Notifications | Adds channels and preferences | Stable status model | Less manual checking | Low | Conditional approval |
| `SCOPE-DEF-007` | Post-publication editing | Expands mutation/reconciliation surface | Stable sync | Corrections | Medium | Conditional approval |
| `SCOPE-DEF-008` | Historical analytics | Not required to publish reliably | Analytics requirements/quota | Performance insight | Medium | Separate approved scope |

Deferred work is neither promised nor release-blocking.

## 10. Explicit Non-Scope

| ID | Excluded item | Reason | Future path |
|---|---|---|---|
| `SCOPE-OUT-001` | Instagram, TikTok, Facebook, X, LinkedIn, Vimeo, Twitch, or any other provider | YouTube-only module | Separate approved module |
| `SCOPE-OUT-002` | General-purpose multi-platform publishing abstraction | Would expand requirements and weaken YouTube delivery focus | Separate architecture proposal |
| `SCOPE-OUT-003` | Unrelated video generation or editing | Owned by other Narrial features | Separate feature scope |
| `SCOPE-OUT-004` | YouTube advertising or monetization management | Not needed for connection/publishing | Separate approved product |
| `SCOPE-OUT-005` | Revenue analytics | Not needed for reliable publishing | Separate approved analytics module |
| `SCOPE-OUT-006` | Comment moderation | Separate provider domain | Separate approved module |
| `SCOPE-OUT-007` | Community posts | Separate provider domain | Separate approved module |
| `SCOPE-OUT-008` | Livestream creation or management | Materially different lifecycle | Separate approval/specification |
| `SCOPE-OUT-009` | Shorts-specific optimization | Not required for base upload/publication | Future YouTube-only proposal |
| `SCOPE-OUT-010` | Subscriber management | Unrelated to publication workflow | Separate approval |
| `SCOPE-OUT-011` | Channel branding management | Unrelated mutation surface | Separate approval |
| `SCOPE-OUT-012` | Copyright disputes, claims, or Content ID management | Legal/provider-specialized domain | Not part of this module |
| `SCOPE-OUT-013` | Collecting or handling Google passwords | Prohibited security boundary | Never included |
| `SCOPE-OUT-014` | Frontend storage of Google credentials | Prohibited security boundary | Never included |
| `SCOPE-OUT-015` | Scraping YouTube pages | Unsupported and policy-risky | Use approved APIs only |
| `SCOPE-OUT-016` | Bypassing Google consent, verification, policy, or quota | Prohibited | Never included |
| `SCOPE-OUT-017` | Unrelated account, billing, subscription, or AI changes | Prevents scope leakage | Separate feature scope |
| `SCOPE-OUT-018` | Refactoring unrelated Narrial modules | Not required for this vertical feature | Separate authorized task |

## 11. Frontend Responsibility Boundary

### Included

- Show YouTube connection and lifecycle states.
- Request authorization initiation from the authenticated backend.
- Open the backend-provided authorization URL.
- Treat a return/deep link only as a signal to refetch authoritative state.
- Display backend-confirmed channel information.
- Select a healthy authorized channel.
- Collect approved metadata and schedule input.
- Display upload, processing, schedule, publication, and recovery states.
- Provide accessible loading, cancellation, retry, reconnect, and disconnect interactions.
- Use authenticated Narrial APIs.

### Excluded

- Google client secrets, token exchange, access tokens, or refresh tokens.
- Authoritative connection, channel-ownership, upload, schedule, or publication claims.
- Persistent schedule execution.
- Provider calls that require confidential credentials.
- Trusting client-supplied user or channel ownership.

## 12. Backend Responsibility Boundary

### Included

- Narrial authentication and authorization.
- OAuth transaction creation, validation, consumption, and expiry.
- Secure code exchange and token lifecycle.
- Credential encryption and persistence.
- Channel retrieval, normalization, and ownership enforcement.
- Upload, publication, schedule, synchronization, and disconnect orchestration.
- Validation, stable contracts, idempotency, safe retries, audits, and observability.
- Safe responses that exclude credential material.

### Excluded or prohibited

- Trusting frontend success or ownership claims.
- Returning Google tokens to clients.
- Logging secrets, codes, token-bearing URLs, or raw sensitive provider responses.
- Automatically retrying one-time authorization-code exchange.
- Requiring the mobile app to remain open for durable work.

## 13. Database and Persistence Boundary

Conceptual persistence is in scope for:

- OAuth transactions.
- YouTube connections and safe channel identity.
- Encrypted credentials and permission metadata.
- Upload and publication operations.
- Schedules and execution state.
- Status transitions and provider identifiers.
- Idempotency, retry, reconciliation, and safe audit information.

Exact database technology, tables/collections, fields, constraints, indexes, migrations, and retention periods are deferred to Document 12. No database may be created from this document alone.

## 14. Google Cloud and YouTube Configuration Boundary

In scope:

- Environment-separated Google configuration.
- YouTube Data API enablement.
- OAuth consent configuration.
- Approved redirect URIs.
- Staging test users.
- Minimum approved scopes.
- Separate staging and production client handling.
- Verification/audit readiness when required.
- Quota configuration and observation.
- Credential ownership, storage, rotation, and incident response.

Google Cloud projects, values, and secrets require external verification. Real secrets must never be written in documentation.

## 15. OAuth and Credential Boundary

The complete module includes secure authorization initiation, callback validation, code exchange, token storage, access-token refresh, refresh-token preservation, permission loss, revocation, reconnection, disconnection, and concurrency controls.

The frontend receives only safe connection state. Exact scopes, cryptography, key management, callback URLs, and retention are decided in Documents 10, 11, 13, and 16.

## 16. Video Upload Boundary

Upload scope includes source ownership, compatibility validation, durable operation creation, approved resumable transfer, progress, cancellation rules, safe retry/recovery, provider identity capture, and distinction between transfer and processing.

Direct client-to-YouTube upload, backend-streamed upload, staged-object upload, size limits, formats, and storage lifetime remain technical/requirements decisions for Documents 05, 07, 09, 12, and 19.

## 17. Immediate Publishing Boundary

Complete-module scope includes title, description, approved tags/category behavior, audience designation, privacy status, upload confirmation, provider identity, and accurate final state.

R1 placement, exact metadata, default privacy, thumbnails, and playlists remain conditional under `PV-DEC-004`, `PV-DEC-006`–`009`.

## 18. Scheduled Publishing and Worker Boundary

Complete-module scope includes future time and timezone, durable persistence, independent worker execution, locking, idempotency, rescheduling, cancellation, missed-job behavior, retries, reconciliation, and user-visible state.

The proposed boundary places this in R2. If approved for R1, every worker, deployment, fault, timezone, observability, and recovery gate becomes an R1 blocker.

## 19. Video-Status Synchronization Boundary

In scope are upload, received, processing, scheduled, published, failed, private, rejected/restricted, and deleted states when the approved API exposes them. Narrial must store normalized state and retain enough provider evidence for reconciliation without exposing unsafe raw data.

Polling, event mechanisms, intervals, terminal-state policy, and data retention belong to Documents 08, 22, and 25.

## 20. Security, Privacy, and Quota Boundary

Release scope includes authenticated ownership enforcement, OAuth state protection, encrypted backend-only credentials, redaction, safe errors, least privilege, disconnect/deletion behavior, audit events, abuse controls, dependency/security review, quota budgeting, quota-aware degradation, and incident response.

None may be deferred merely because the primary UI flow works.

## 21. Testing Boundary

Required evidence includes applicable unit, contract, authentication, authorization, OAuth, encryption, refresh, database, migration, adapter, upload, publication, schedule, worker, synchronization, idempotency, failure-injection, security, secret-leakage, frontend, device/browser, staging, end-to-end, deployment, rollback, backup, and restoration tests.

Only tests for capabilities included in a release block that release, but foundational security, recovery, and operational tests always apply.

## 22. Deployment and Operational Boundary

In scope are local/development/staging/production isolation, safe environment variables, secret injection, database migration, backend and worker deployment, client callback configuration, feature flags, monitoring, alerts, quota dashboards, backup, restore, rollback, key rotation, incident response, support diagnostics, staged rollout, and acceptance evidence.

Production credentials and users remain disabled until all applicable release gates pass.

## 23. Existing Work Boundary

| Existing area | Classification | Allowed treatment | Production requirement |
|---|---|---|---|
| Expo routes and screen structure | `EXISTING_REUSABLE` after verification/modification | Preserve useful navigation and accessible states | Must use authenticated APIs and authoritative state |
| In-memory social account service | `EXISTING_REPLACE` | Retain only as isolated test fixture if clearly named | Replace with persistent backend integration |
| Hardcoded YouTube channel | `EXISTING_REPLACE` | Test-only fixture | Never shown as a real connection |
| In-memory scheduling service | `EXISTING_REPLACE` | Unit-test ideas may be reused | Replace with durable backend scheduling |
| Hardcoded publishing/status data | `EXISTING_REPLACE` | Explicit fixtures only | Replace with backend/provider-derived data |
| Clerk frontend shell | `EXISTING_REUSABLE` after verification | Integrate with authenticated API client | Backend must verify identity |
| Fastify safety foundation | `EXISTING_REUSABLE` with failing gate | Diagnose two timeouts and extend modularly | All foundation checks must pass |
| Existing multi-platform plan | Historical reference only | Mine relevant YouTube context | Cannot override YouTube-only documents |
| Unrelated Narrial features | Protected/outside scope | Avoid changes unless a direct dependency is approved | Must not be refactored under this module |

## 24. External-Service Responsibility Boundary

### Google and YouTube control

- Google account authentication and consent.
- Authorization grants, token issuance, and revocation.
- YouTube channel identity.
- Video receipt, processing, restrictions, deletion, and remote status.
- API availability, policy, verification, and quota allocation.

### Narrial controls

- Correct and policy-compliant integration.
- Credential protection.
- User authentication, ownership, and isolation.
- Durable application state.
- Honest user communication.
- Retry and duplicate safety.
- Monitoring, quota use, support, and incident response.
- Timely reconciliation with provider authority.

## 25. First-Release Entry and Exit Criteria

### Entry criteria

- Documents 00–10 are approved and reconciled.
- R1 conditional decisions are approved.
- Named product, security, Google Cloud, data, test, release, and operations owners exist.
- Staging Google configuration is available without exposing secrets.
- Database, encryption, storage, and deployment plans are approved.
- Existing failing quality gates have approved resolution evidence.

### Exit criteria

- Every `RELEASE_REQUIRED` capability works end to end in staging.
- No production authority depends on mocks or client claims.
- Security/privacy/quota reviews pass.
- Applicable Document 26 test matrix passes.
- Rollback, backup, restoration, monitoring, and incident procedures are verified.
- Document 29 acceptance passes with recorded evidence and human sign-off.

## 26. Ordered Release Gates

| Gate | Entry criteria | Exit evidence | Approver | Blocks |
|---|---|---|---|---|
| `SCOPE-GATE-00` Baseline | Documents 00–02 prepared | Formal baseline approvals and evidence links | User/product owner | All planning truth |
| `SCOPE-GATE-01` Product decisions | Gate 00 | Required `PV-DEC-*` and `SCOPE-COND-*` decisions recorded | Product owner | UX/requirements |
| `SCOPE-GATE-02` Architecture | Documents 03–10 | Approved boundaries, contracts, stack, environments, threat review | Technical/security owners | Setup/implementation |
| `SCOPE-GATE-03` Connection | Google staging, DB, auth, encryption | Real OAuth/channel/reconnect/disconnect evidence | Product/security/QA | Upload UI and release |
| `SCOPE-GATE-04` Upload | Gate 03 and source validation | Resumable upload, progress, recovery, idempotency evidence | Technical/QA | Publishing |
| `SCOPE-GATE-05` Publishing | Gate 04 | Metadata and immediate-publication evidence | Product/QA | R1 candidate |
| `SCOPE-GATE-06` Scheduling | Gate 05 and worker platform | Timezone, locking, retry, missed-job, cancel/reschedule evidence | Product/operations/QA | Scheduled release |
| `SCOPE-GATE-07` Synchronization | Remote IDs persisted | Reconciliation and lifecycle-display evidence | Technical/QA | Acceptance |
| `SCOPE-GATE-08` Hardening | Principal release workflows complete | Security, privacy, quota, recovery, observability evidence | Security/operations | Production deployment |
| `SCOPE-GATE-09` Release | Staging candidate and full tests | Document 29 sign-off, rollback readiness, controlled enablement | Release owner/user | Production users |

No gate passes from documentation or implementation presence alone.

## 27. Decisions Requiring Approval

| Decision | Scope IDs | Proposed answer | Consequence if changed | Status |
|---|---|---|---|---|
| `PV-DEC-001` connection count | `SCOPE-COND-001` | One in R1 | Multiple-channel schema and UX become R1 work | Requires approval |
| `PV-DEC-002` shared channel | `SCOPE-COND-002` | Prohibit in R1 | Requires team ownership model | Requires approval |
| `PV-DEC-003` Brand Accounts | `SCOPE-COND-003` | Verify before commitment | Test and support matrix changes | Requires approval |
| `PV-DEC-004` publishing modes | `SCOPE-COND-004`–`005` | Immediate R1; scheduling R2 | Worker/timezone scope moves between releases | Requires approval |
| `PV-DEC-005` video sources | `SCOPE-COND-006` | Narrial-managed R1 | Storage and upload architecture changes | Requires approval |
| `PV-DEC-006` metadata | `SCOPE-COND-007` | Minimum valid set | UI and validation expand/contract | Requires approval |
| `PV-DEC-007` privacy | `SCOPE-COND-008` | Explicit choice; private fallback if allowed | Exposure risk and UX change | Requires approval |
| `PV-DEC-008` thumbnails | `SCOPE-COND-009` | Later | Additional media flow if R1 | Requires approval |
| `PV-DEC-009` playlists | `SCOPE-COND-010` | Later | Lookup/quota/partial failures if R1 | Requires approval |
| `PV-DEC-010` disconnect schedules | `SCOPE-COND-011` | Pause/block | Cancellation and audit behavior changes | Requires approval |
| `PV-DEC-011` disconnect history | `SCOPE-COND-012` | Retain non-secret history | Privacy/retention behavior changes | Requires approval |
| `PV-DEC-012` clients | `SCOPE-COND-013` | Match actual Narrial targets | OAuth URLs and test matrix change | Requires approval |
| `PV-DEC-013` restrictions | `SCOPE-COND-014` | Provider rules only | Eligibility/compliance logic expands | Requires approval |
| `PV-DEC-014` ownership | `SCOPE-COND-015` | Named primary and backup | External setup/release remains blocked | Requires approval |
| `SCOPE-DEC-001` audience designation | `SCOPE-COND-017` | Require explicit user input | Metadata UX/business rules change | Requires approval |
| `SCOPE-DEC-002` maximum supported size/duration | `SCOPE-COND-018` | Set after capacity evidence | Storage, timeout, and cost controls change | Requires approval |

Document 03 must preserve these IDs and record owners, decisions, dates, and supersession.

## 28. Scope Traceability Matrix

| Scope area | Scope IDs | Product vision | Classification | Main controlling documents | Approval condition |
|---|---|---|---|---|---|
| OAuth connection | `SCOPE-IN-001`–`003` | `PV-CAP-001`–`006`; `PV-SYS-001`–`009` | Complete module; proposed R1 | 04, 05, 08, 11, 13, 15, 16 | R1 decisions and architecture approved |
| Channel management | `SCOPE-IN-003`–`006` | `PV-CAP-006`–`011` | Complete module; proposed R1 | 05, 08, 12, 15, 17, 18 | Connection gate passes |
| Video preparation | `SCOPE-IN-007`–`008` | `PV-CAP-012`–`013` | Conditional details; proposed R1 | 04, 05, 19, 20 | Sources/metadata/privacy approved |
| Upload | `SCOPE-IN-009`–`010` | `PV-CAP-014`–`015`; `PV-SYS-010`–`011` | Complete module; proposed R1 | 08, 12, 15, 19 | Upload gate passes |
| Immediate publishing | `SCOPE-IN-011` | `PV-CAP-016` | Complete module; conditional R1 | 20 | `PV-DEC-004` approved |
| Scheduling | `SCOPE-IN-012`–`013` | `PV-CAP-017`–`019`; `PV-SYS-017` | Complete module; proposed R2 | 12, 15, 21 | Release placement approved |
| Synchronization | `SCOPE-IN-014` | `PV-CAP-020`; `PV-SYS-012`, `018` | Complete module; R1 minimum | 22 | Lifecycle contract approved |
| Recovery | `SCOPE-IN-015` | `PV-CAP-009`, `015`, `021`–`022` | Complete module; proposed R1 | 16, 19, 21, 23 | Failure policies approved |
| Security/operations | `SCOPE-IN-016`–`018` | `PV-SYS-002`–`004`, `013`–`016` | Release required | 06, 10, 13, 24–29 | Human gates pass |

## 29. Scope-Change Control

Every scope change must:

1. Record the proposed change and reason.
2. Identify affected scope and vision IDs.
3. Assess product, UX, security, architecture, database, frontend, backend, testing, deployment, quota, cost, and schedule impact.
4. Identify invalidated decisions, documentation, implementation, tests, and evidence.
5. Obtain explicit user/product approval.
6. Update this document’s classification and release boundary.
7. Update Document 03 and Document 28.
8. Update every affected downstream document before implementation continues.
9. Append a change-log entry without deleting historical decisions.

No human or AI agent may silently expand, reduce, or reclassify scope.

## 30. Prohibited Shortcuts

- Treating mock UI as a real connection.
- Treating a deep link as proof of OAuth success.
- Storing provider credentials in ordinary frontend state.
- Calling scheduling complete without durable backend execution.
- Calling upload or publication complete without provider evidence.
- Omitting loading, error, reconnection, cancellation, and recovery states.
- Omitting security, quota, monitoring, deployment, rollback, or support work.
- Installing dependencies before Document 09’s approved checkpoint.
- Creating database structures before Document 12 approval.
- Adding another provider for hypothetical reuse.
- Modifying unrelated application areas.
- Passing a release gate without reproducible evidence.
- Moving deferred work into a release through code alone.

## 31. Scope Risks

| ID | Scope failure | Consequence | Prevention | Detection | Controller |
|---|---|---|---|---|---|
| `SCOPE-RISK-001` | Build connection only | Product vision remains incomplete | Trace every release to upload/publication outcomes | Acceptance matrix | 01, 05, 29 |
| `SCOPE-RISK-002` | UI claims success without backend authority | False/unsafe state | Backend-verified contracts | Contract/E2E tests | 08, 15, 16, 18 |
| `SCOPE-RISK-003` | Scheduling depends on client | Missed publications | Durable workers | Restart/outage tests | 21, 26 |
| `SCOPE-RISK-004` | Other platforms leak into scope | Delay and inconsistent contracts | Explicit non-scope | Review and file-diff audit | 02, 03, 28 |
| `SCOPE-RISK-005` | Google policy work begins late | Release blocked externally | Stage 4 configuration gate | Console evidence review | 11, 24, 27 |
| `SCOPE-RISK-006` | Quota is treated as an afterthought | Operations stall | Budget and monitoring | Quota dashboards/tests | 24, 25, 26 |
| `SCOPE-RISK-007` | Security is deferred | Credential/user harm | Security is release-required | Threat review/leak tests | 13, 24, 26 |
| `SCOPE-RISK-008` | In-memory mocks are treated as persistence | State loss and false completion | Replace/isolate mocks | Restart/cross-device tests | 00, 12, 18, 26 |
| `SCOPE-RISK-009` | Deferred work becomes hidden R1 work | Uncontrolled release growth | Conditional/deferred registers | Scope-review gate | 02, 03, 28 |
| `SCOPE-RISK-010` | R1 includes too many verticals | Quality and launch risk | Immediate-first proposal | Milestone/gate evidence | 02, 28 |

## 32. Scope-Level Acceptance Criteria

- [x] `SCOPE-AC-001` — YouTube-only scope is explicit.
- [x] `SCOPE-AC-002` — Complete-module work is identifiable.
- [x] `SCOPE-AC-003` — Proposed R1, future releases, conditional work, deferred work, and non-scope are separated.
- [x] `SCOPE-AC-004` — Frontend and backend authority boundaries are explicit.
- [x] `SCOPE-AC-005` — Database, Google configuration, OAuth, upload, worker, synchronization, security, test, deployment, and operational work are visible.
- [x] `SCOPE-AC-006` — Existing mocks are not confused with production behavior.
- [x] `SCOPE-AC-007` — Provider and Narrial responsibilities are separated.
- [x] `SCOPE-AC-008` — Release gates and evidence requirements exist.
- [x] `SCOPE-AC-009` — Scope changes require explicit approval and reconciliation.
- [x] `SCOPE-AC-010` — Conditional decisions remain visible.
- [x] `SCOPE-AC-011` — Scope items trace to Document 01 and later controlling documents.
- [x] `SCOPE-AC-012` — Prohibited shortcuts are recorded.
- [x] `SCOPE-AC-013` — The user approved adding this scope baseline.
- [ ] `SCOPE-AC-014` — Every R1 conditional decision is explicitly approved.
- [ ] `SCOPE-AC-015` — Named release and operational owners are assigned.

These criteria approve the scope framework, not implementation or the unresolved proposed release boundary.

## 33. Document Completion Checklist

- [x] Documents 00 and 01 were reviewed.
- [x] Scope classifications are defined.
- [x] A proposed first-release vertical slice is documented.
- [x] Complete-module and future boundaries are documented.
- [x] Conditional and excluded work is explicit.
- [x] Frontend, backend, database, worker, provider, security, testing, deployment, and operations boundaries are covered.
- [x] Existing work is accurately classified from Document 00.
- [x] Release gates and scope-change controls are defined.
- [x] YouTube-only scope is preserved.
- [x] No implementation technology was silently selected.
- [x] Traceability is present.
- [x] The user approved adding Document 02.
- [ ] Document 00 has formal user approval recorded.
- [ ] R1 conditional decisions are resolved.
- [ ] Named approvers and owners are recorded.

## 34. Prerequisites

- `00-existing-work-and-current-state-audit.md` supplies current-state evidence and still requires formal approval to close its gate.
- `01-product-vision-and-final-result.md` supplies the approved product outcome and stable traceability identifiers.

Before implementation, the relevant decisions in Section 27 and the downstream Documents 03–13 must be approved at their defined gates.

## 35. Next Document

Continue with:

- `03-decision-register-glossary-and-source-of-truth.md`

Document 03 will define authoritative terminology, register the unresolved decisions in this document, assign owners and approvers, record approval dates and rationale, prevent identifier drift, and govern how later documents supersede earlier decisions.

## 36. Change Log

| Version | Date | Change | Author or role | Approval |
|---|---|---|---|---|
| 1.0.0 | 2026-08-26 | Replaced the generation prompt with the complete YouTube-only scope, non-scope, conditional, deferred, release-boundary, gate, and traceability baseline | AI documentation agent | User approved build and addition; conditional decisions remain unresolved |
