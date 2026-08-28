# YouTube Connection Module — Decision Register, Glossary, and Source of Truth

## Document Control

| Field | Value |
|---|---|
| Document number | 03 |
| Filename | `03-decision-register-glossary-and-source-of-truth.md` |
| Module | YouTube Connection only |
| Stage | Stage 1 — Governance approval gate |
| Status | Approved governance baseline — registered decisions remain individually gated |
| Version | 1.0.3 |
| Created/updated | 2026-08-26 |
| Prerequisites | Documents 00–02 |
| Next document | `04-user-journeys-screens-and-interface-states.md` |
| Maintainer | Documentation maintainer — requires named assignment |
| Approval authority | User/product owner for product decisions; named specialist owners where identified below |
| Source-of-truth role | Central terminology, decision, conflict, approval, and documentation-governance register |
| Implementation authorized | No |

---

## 1. Purpose and Authority

This living document prevents undocumented decisions and naming drift throughout the YouTube Connection module. Every human and AI agent working on the module must use it to determine:

- Which terms and identifiers are canonical.
- Which sources control a question.
- Which decisions are proposed, approved, blocked, implemented, verified, or superseded.
- Who may recommend or approve a decision.
- Which work a decision blocks.
- How conflicts and later changes preserve history.

This document governs Documents 00–30, YouTube-related implementation, interfaces, data models, tests, logs, evidence, deployment, and operations. It does not replace the detailed specification owned by each document.

Approval of this governance structure does not approve any decision whose row remains `REQUIRES_USER_APPROVAL`, `REQUIRES_RESEARCH`, `BLOCKED`, or `REQUIRES_ASSIGNMENT`.

## 2. Governance Scope and Module Boundary

Governed areas:

- Product, user-journey, OAuth, token, channel, upload, publication, scheduling, synchronization, error, security, quota, environment, API, database, test, evidence, and release terminology.
- Document and decision status.
- Stable identifier formats.
- Ownership, approval, supersession, and conflict resolution.
- Consistency between documentation and repository behavior.

Excluded:

- Decisions for Instagram, TikTok, Facebook, X, LinkedIn, Vimeo, Twitch, or any other platform.
- Governance of unrelated Narrial features.
- Real secrets, credentials, token values, personal information, or restricted provider responses.

Generic existing social-account code may be mentioned only to govern its replacement or safe reuse for the YouTube module.

## 3. Relationship to Documents 00–02

| Document | Controlling role | Current status | Extractable authority | Open issue |
|---|---|---|---|---|
| 00 | Repository evidence baseline | Completed; formal user approval not separately recorded | Observable current-state evidence | Approval gate remains open |
| 01 | Product vision and final outcome | Approved v1.0.0 | `PV-CAP-*`, `PV-SYS-*`, `PV-DEC-*`, `PV-RISK-*`, `PV-AC-*` | Fourteen product decisions remain open |
| 02 | Scope and release boundaries | Approved v1.0.0 | `SCOPE-IN-*`, `SCOPE-COND-*`, `SCOPE-DEF-*`, `SCOPE-OUT-*`, gates and risks | Proposed R1/R2 choices remain conditional |

If an earlier document changes, this register and all affected later documents must be reconciled before dependent work proceeds.

## 4. Core Governance Rules

1. An undocumented assumption cannot become product or implementation behavior.
2. A recommendation or proposal is not approval.
3. File existence, code presence, or a checked task is not proof of approval or verification.
4. Existing code does not override approved product requirements.
5. Mock behavior is not production behavior.
6. An AI agent may record evidence and recommendations but cannot self-approve on behalf of the user or a named human authority.
7. Conflicts follow Section 5 and must be registered.
8. Accepted decisions are superseded, never silently rewritten to erase history.
9. Canonical terminology applies across documents, code, APIs, database concepts, tests, logs, UI, and support material.
10. Secrets never enter this register.
11. Only YouTube-module decisions belong here.
12. Implementation and release status require evidence separate from documentation approval.

## 5. Source-of-Truth Hierarchy

The most specific applicable approved source wins within this order:

| Priority | Source | Authority | Conflict rule |
|---:|---|---|---|
| 1 | Explicit current user/authorized-owner instruction | May approve or change an in-scope decision | Must be recorded here and in affected documents; does not silently authorize unrelated implementation |
| 2 | Approved decision record in this register | Controls the exact registered question | Supersede through a new/updated historical record with approval evidence |
| 3 | Approved product vision and scope: Documents 01–02 | Controls outcomes and boundaries | Technical documents cannot silently weaken or expand them |
| 4 | Approved specialist document designated as controller | Controls its assigned detail, such as security, API, database, or UX | Must conform to levels 1–3 and update this register for material decisions |
| 5 | Approved shared contracts and migrations | Control implemented interfaces and persisted shapes | Changes require compatibility/migration review and governing-document update |
| 6 | Verified implementation and tests | Prove behavior against approved specifications | Implementation mismatch is a defect, not an automatic decision change |
| 7 | Current unverified repository code/configuration | Evidence of current state only | Cannot override approved intent |
| 8 | Mocks, fixtures, generated output, older plans, reference designs | Non-authoritative context | Must be labeled and reconciled before reuse |
| 9 | AI preference or unstated convention | No authority | Must never resolve ambiguity |

A later date alone does not grant higher authority. A source must be applicable, approved, and recorded.

## 6. Source Status Definitions

| Status | Meaning | Who assigns | May implementation rely on it? | Normal next status |
|---|---|---|---|---|
| `STRUCTURE_ONLY` | Headings/placeholders without complete content | Maintainer | No | `DRAFT` |
| `GENERATION_PROMPT` | Instructions for generating a future document | Maintainer | No | `DRAFT` |
| `DRAFT` | Complete enough for review but not approved | Author/maintainer | No | `IN_REVIEW` |
| `IN_REVIEW` | Awaiting named review/decision | Maintainer | No | `APPROVED` or `DRAFT` |
| `APPROVED` | Authorized source-of-truth content | Authorized approver | Yes, within its gates |
| `IMPLEMENTATION_ACTIVE` | Approved specification is being implemented | Delivery owner | Yes | `VERIFIED` or `BLOCKED` |
| `VERIFIED` | Acceptance evidence passed against an identified candidate | Test/release authority | Yes | `SUPERSEDED` or maintained |
| `BLOCKED` | Required dependency/decision/evidence is unavailable | Maintainer/owner | No for affected work | Prior active status after resolution |
| `SUPERSEDED` | Replaced by a named later source while retained historically | Authorized approver | No for new work | `ARCHIVED` |
| `DEPRECATED` | Still present but scheduled for removal | Authorized owner | Limited, per migration plan | `ARCHIVED` |
| `ARCHIVED` | Historical only | Maintainer | No | None |

## 7. Decision Lifecycle

```text
PROPOSED → REQUIRES_RESEARCH → REQUIRES_USER_APPROVAL → APPROVED
    └──────────────────────────────→ REJECTED
APPROVED → IMPLEMENTED → VERIFIED
APPROVED / IMPLEMENTED / VERIFIED → SUPERSEDED or DEPRECATED
Any non-terminal state → BLOCKED → previous applicable state after resolution
```

| Status | Meaning | Implementation authority | Required evidence |
|---|---|---|---|
| `PROPOSED` | An option or recommendation exists | None | Context and options |
| `REQUIRES_RESEARCH` | Evidence is insufficient | Research only | Cited findings/test evidence |
| `REQUIRES_USER_APPROVAL` | Product/scope choice awaits user | None | Explicit approval and date |
| `REQUIRES_ASSIGNMENT` | Accountable owner is unnamed | None for owner-gated action | Named primary/backup |
| `APPROVED` | Authorized decision | Work allowed only after all other gates | Approver, date, rationale |
| `REJECTED` | Option was explicitly declined | Prohibited | Decision evidence |
| `BLOCKED` | Dependency prevents decision/action | None | Blocker and resolution evidence |
| `IMPLEMENTED` | Code/configuration reflects decision | Not proof of correctness | Candidate and change reference |
| `VERIFIED` | Acceptance evidence passes | Eligible for next gate | Test/reviewer evidence |
| `SUPERSEDED` | Replaced by a named decision | No new reliance | Superseding ID |
| `DEPRECATED` | Being retired under a plan | Limited | Migration/removal plan |

No decision may jump from proposed directly to implemented or verified.

## 8. Authorities and Owner Roles

| Role | Responsibility | Recommendation authority | Approval authority | Current assignment |
|---|---|---|---|---|
| User/product owner | Product outcome, scope, release boundary | Yes | Product/scope decisions | User; named organizational owner required later |
| UX owner | Journeys, accessibility, interaction semantics | Yes | UX detail within approved scope | Requires assignment |
| Frontend owner | Client architecture and delivery | Yes | Frontend implementation detail | Requires assignment |
| Backend owner | API/services/workers | Yes | Backend implementation detail | Requires assignment |
| Data owner | Schema, migrations, retention execution | Yes | Data design with security/product concurrence | Requires assignment |
| Security/privacy owner | Threats, credentials, privacy, deletion | Yes | Security gate; joint approval where product behavior changes | User assigned only for the B04 local-tooling exception on 2026-08-27; broader assignment still required |
| Google Cloud/OAuth owner | Console, consent, clients, provider verification | Yes | External configuration within approved scope | Requires assignment |
| QA/verification owner | Test strategy and evidence integrity | Yes | Test gate | Requires assignment |
| Deployment/release owner | Environments, rollout, rollback | Yes | Deployment gate | Requires assignment |
| Operations/support owner | Monitoring, incidents, quota, runbooks | Yes | Operational readiness | Requires assignment |
| Documentation maintainer | Consistency, IDs, links, history | Yes | Editorial changes only | Requires assignment |

Unassigned roles block the action that requires their approval. They do not block unrelated documentation drafting.

## 9. Required Decision Record Format

Every material decision must record:

- Stable decision ID and title.
- Category and exact question.
- Context and evidence.
- Available options.
- Recommendation and rationale.
- Trade-offs and product, UX, security, privacy, quota, frontend, backend, data, test, deployment, and operational impact where applicable.
- Blocking stage and affected scope/documents/code.
- Owner, approver, status, approval date, and evidence.
- Supersedes/superseded-by links.
- Review trigger/date and notes.

New cross-cutting decisions use `YT-DEC-NNN`. Existing `PV-DEC-*` and `SCOPE-DEC-*` IDs must not be renamed. Secret values are prohibited.

## 10. Master Decision Register

### 10.1 Product and scope decisions

| ID | Title | Owner/approver | Blocks | Affected documents | Status |
|---|---|---|---|---|---|
| `PV-DEC-001` | Channels per Narrial user | Product owner | UX, domain, data | 02, 04, 08, 12, 17, 18 | `REQUIRES_USER_APPROVAL` |
| `PV-DEC-002` | Same channel across Narrial users | Product/security | Architecture, ownership | 02, 05, 08, 12, 13, 17 | `REQUIRES_USER_APPROVAL` |
| `PV-DEC-003` | Brand Account support | Product/Google owner | Google setup, channel UX/tests | 02, 11, 17, 26 | `REQUIRES_RESEARCH` then approval |
| `PV-DEC-004` | R1 publishing modes | Product owner | Release scope | 02, 05, 20, 21, 26 | `REQUIRES_USER_APPROVAL` |
| `PV-DEC-005` | Supported video sources | Product/technical | Requirements, storage, upload | 02, 05, 19 | `REQUIRES_USER_APPROVAL` |
| `PV-DEC-006` | Required metadata | Product owner | UX, requirements, publishing | 04, 05, 20 | `REQUIRES_USER_APPROVAL` |
| `PV-DEC-007` | Privacy selection/default | Product/security | UX, publishing, privacy | 02, 05, 20, 24 | `REQUIRES_USER_APPROVAL` |
| `PV-DEC-008` | Custom thumbnails | Product owner | Release/upload scope | 02, 19, 20 | `REQUIRES_USER_APPROVAL` |
| `PV-DEC-009` | Playlist placement | Product owner | Channel/publish scope | 02, 17, 20 | `REQUIRES_USER_APPROVAL` |
| `PV-DEC-010` | Pending schedules after disconnect | Product/security/operations | Business rules, workers | 05, 12, 21, 23 | `REQUIRES_USER_APPROVAL` |
| `PV-DEC-011` | History after disconnect | Product/privacy | Retention/data | 02, 06, 12, 17, 24 | `REQUIRES_USER_APPROVAL` |
| `PV-DEC-012` | Supported R1 clients | Product/frontend | UX, URLs, tests | 02, 04, 10, 18, 26 | `REQUIRES_USER_APPROVAL` |
| `PV-DEC-013` | Geographic/age restrictions | Product/legal/privacy | Scope, compliance | 02, 06, 24 | `REQUIRES_USER_APPROVAL` |
| `PV-DEC-014` | Google/operations ownership | Product/release | External setup/release | 03, 10, 11, 24, 25, 27 | `REQUIRES_ASSIGNMENT` |
| `SCOPE-DEC-001` | Audience designation policy | Product/legal | UX, requirements, metadata | 04, 05, 20, 24 | `REQUIRES_USER_APPROVAL` |
| `SCOPE-DEC-002` | Maximum supported video size/duration | Product/technical/operations | NFR, upload, cost/tests | 06, 19, 24, 26 | `REQUIRES_RESEARCH` then approval |

Recommendations remain those recorded in Documents 01–02; this register does not convert them to approvals.

### 10.2 Technical decisions to be resolved later

| ID | Question | Controlling stage/documents | Owner | Status |
|---|---|---|---|---|
| `YT-DEC-101` | Confirm backend framework and module boundary | 07, 09, 14 | Backend owner | `PROPOSED` from existing Fastify foundation |
| `YT-DEC-102` | Select database engine and access/migration tooling | 07, 09, 12 | User-approved for B04; durable data ownership remains unassigned | `APPROVED` for disposable local development only — PostgreSQL 18.6 and Prisma 7.9.1 set, 2026-08-27; hosted selection remains gated |
| `YT-DEC-103` | Select database/backend hosts and regions | 10, 12, 27 | User-approved for B04; platform/data/security ownership remains unassigned | `APPROVED` for local database on `127.0.0.1` only, 2026-08-27; hosted regions remain gated |
| `YT-DEC-104` | Select background-job technology | 07, 09, 21, 27 | Backend/operations | `REQUIRES_USER_APPROVAL` |
| `YT-DEC-105` | Select video source storage and transfer topology | 07, 09, 12, 19 | Technical/security | `REQUIRES_USER_APPROVAL` |
| `YT-DEC-106` | Confirm Narrial backend authentication authority | 07, 08, 10, 14 | User-approved for B03; security/backend ownership remains unassigned | `APPROVED` — Clerk backend verification for the YouTube boundary, 2026-08-27 |
| `YT-DEC-107` | Select token encryption and production key management | 10, 13, 27 | Security | `REQUIRES_USER_APPROVAL` |
| `YT-DEC-108` | Approve OAuth callback ownership and exact environment URLs | 10, 11, 16, 27 | Google/platform/security | `BLOCKED` by environment decisions |
| `YT-DEC-109` | Approve app-return/deep-link strategy | 04, 08, 10, 16, 18 | Frontend/security | `REQUIRES_USER_APPROVAL` |
| `YT-DEC-110` | Approve Google Cloud project/client isolation | 10, 11, 27 | Google/security | `REQUIRES_USER_APPROVAL` |
| `YT-DEC-111` | Approve API style, versioning, and compatibility policy | 07, 08, 15 | Backend/frontend | `REQUIRES_USER_APPROVAL` |
| `YT-DEC-112` | Approve idempotency ownership and persistence | 08, 12, 15, 19, 21, 23 | Backend/data | `REQUIRES_USER_APPROVAL` |
| `YT-DEC-113` | Approve synchronization mechanism and freshness policy | 07, 08, 22, 25 | Backend/operations/product | `REQUIRES_USER_APPROVAL` |
| `YT-DEC-114` | Select logging, metrics, tracing, and alerting platform | 09, 10, 25, 27 | Operations/security | `REQUIRES_USER_APPROVAL` |
| `YT-DEC-115` | Select secret-management and feature-flag systems | 09, 10, 13, 27 | Security/platform | `REQUIRES_USER_APPROVAL` |
| `YT-DEC-116` | Approve backup, restoration, retention, and deletion ownership | 06, 10, 12, 24, 27 | User-approved for disposable B04 data; durable data/privacy/operations ownership remains unassigned | `APPROVED` only for synthetic disposable local B04 data with no backup requirement, 2026-08-27; durable/staging/production policy remains gated |

## 11. Conditional Scope Mapping

| Scope condition | Governing decision/status |
|---|---|
| `SCOPE-COND-001` | `PV-DEC-001` |
| `SCOPE-COND-002` | `PV-DEC-002` |
| `SCOPE-COND-003` | `PV-DEC-003` |
| `SCOPE-COND-004`–`005` | `PV-DEC-004` |
| `SCOPE-COND-006` | `PV-DEC-005` |
| `SCOPE-COND-007` | `PV-DEC-006` |
| `SCOPE-COND-008` | `PV-DEC-007` |
| `SCOPE-COND-009` | `PV-DEC-008` |
| `SCOPE-COND-010` | `PV-DEC-009` |
| `SCOPE-COND-011` | `PV-DEC-010` |
| `SCOPE-COND-012` | `PV-DEC-011` |
| `SCOPE-COND-013` | `PV-DEC-012` |
| `SCOPE-COND-014` | `PV-DEC-013` |
| `SCOPE-COND-015` | `PV-DEC-014` |
| `SCOPE-COND-016` | New product decision required for captions/subtitles |
| `SCOPE-COND-017` | `SCOPE-DEC-001` |
| `SCOPE-COND-018` | `SCOPE-DEC-002` |
| `SCOPE-COND-019` | New product decision required for notifications |
| `SCOPE-COND-020` | New product/security decision required for remote deletion |
| `SCOPE-COND-021` | New product/API decision required for post-publication editing |

When a new decision is created for conditions 016 or 019–021, append an ID; do not repurpose an existing ID.

## 12. Blocking Decision Matrix

| Stage/work | Minimum decisions required | Current condition |
|---|---|---|
| Document 04 UX | `PV-DEC-001`, `003`, `004`, `006`, `007`, `010`, `012`; `SCOPE-DEC-001` | May draft all branches; cannot finalize affected journeys until approved |
| Documents 05–06 requirements | Product/scope decisions affecting behavior, limits, privacy, retention, clients | Drafting allowed; measurable final requirements blocked |
| Documents 07–08 architecture/contracts | `PV-DEC-001`–`005`, `010`–`012`; `YT-DEC-101`, `102`, `104`–`106`, `111`–`113` | Blocked for final approval |
| Document 09 installation | Approved architecture and technical stack decisions | No new installation authorized |
| Documents 10–11 Google setup | `PV-DEC-003`, `012`, `014`; `YT-DEC-103`, `108`–`110`, `115` | External setup blocked |
| Document 12/database creation | `YT-DEC-102`–`105`, `107`, `112`, `116` plus ownership/retention decisions | Database creation blocked |
| OAuth implementation | Auth, callbacks, scopes, Google environment, database, encryption decisions | Blocked |
| Upload/publishing | Sources, metadata, privacy, audience, size limits, storage, API contracts | Blocked |
| Scheduling | Release placement, disconnect behavior, workers, timezone requirements | Blocked |
| Staging/production | All applicable decisions, named owners, security/test/release gates | Blocked |

## 13. Decisions Required Before Document 04

Document 04 may be drafted with explicit branches, but it cannot be declared final while these user-visible choices remain unresolved:

- `PV-DEC-001`: one or multiple channel experiences.
- `PV-DEC-003`: Brand Account expectations, subject first to provider research.
- `PV-DEC-004`: immediate and scheduled release placement.
- `PV-DEC-006`: metadata fields presented to the user.
- `PV-DEC-007`: privacy selection/default behavior.
- `PV-DEC-010`: pending schedule behavior after disconnect.
- `PV-DEC-012`: supported client platforms.
- `SCOPE-DEC-001`: audience designation behavior.

Infrastructure decisions that do not change user-visible journeys must not unnecessarily block the Document 04 draft.

## 14. Canonical Terminology Principles

- Use one canonical term per concept.
- Qualify whether a state belongs to Narrial, Google OAuth, or YouTube.
- Never use account and channel interchangeably.
- Distinguish authentication from authorization.
- Distinguish upload transfer from YouTube processing and publication.
- Distinguish a schedule from execution and remote publication.
- Distinguish expired access from revoked authorization and intentional disconnection.
- Distinguish frontend return navigation from backend-verified connection success.
- Use provider IDs only as identifiers, never as authorization proof.
- Preserve exact casing: `YouTube`, `Google OAuth 2.0`, `Narrial`.

## 15. Canonical Glossary

| Canonical term | Definition | Do not use as synonym |
|---|---|---|
| Narrial user | Authenticated person represented by backend-verified Narrial identity | Google user, channel owner unless proven |
| Google account | Identity authenticated by Google during consent | YouTube channel |
| YouTube channel | Provider resource returned through an authorized YouTube API call | Google account, social account |
| YouTube connection | Narrial record linking one authenticated user to verified channel authorization and protected credentials | Login, channel alone |
| Google OAuth authorization | User grant allowing approved Google/YouTube access | Narrial authentication |
| Narrial authentication | Proof of the current Narrial user | Google consent |
| Authorization transaction | Short-lived backend record binding OAuth initiation and callback | Connection record |
| Authorization code | One-time confidential value exchanged by the backend | Access token |
| Access token | Short-lived provider credential used by the backend | Session token, refresh token |
| Refresh token | Long-lived provider credential used to obtain new access tokens | Access token |
| Granted permissions | Provider authorization available to the connection | App roles |
| Connection health | Normalized ability to perform approved provider operations | Token expiry alone |
| Reconnect | New user authorization used to restore/replace unusable authority | Refresh |
| Refresh connection | Recheck safe channel/permission state | Refresh access token unless explicitly stated |
| Disconnect | Intentional Narrial action making provider credentials unusable for new work | Expire, revoke |
| Revoke | Google/provider invalidation of authorization | Narrial disconnect unless Narrial also requests revocation |
| Video source | Approved media object Narrial may submit | YouTube video |
| Upload operation | Durable Narrial record controlling video transfer | Published video |
| Resumable upload session | Provider-supported transfer session capable of continuing | Schedule |
| Upload completed | Required bytes transferred/accepted for processing | Published |
| YouTube processing | Provider-side preparation after transfer | Upload progress |
| Publication | Provider state/action making a video available under approved privacy/timing | File transfer |
| Publication schedule | Durable instruction for future publication | Client timer |
| Reconciliation | Comparison/correction of Narrial state using provider evidence | Blind retry |
| Idempotency | Repetition produces no unintended duplicate side effect | Deduplication guess |
| Provider error | Safe normalized error originating from Google/YouTube behavior | Raw provider response |
| Reconnection required | Normalized state in which user authorization is necessary | Generic failure |
| Release candidate | Identified build/configuration set under acceptance testing | Latest code |
| Verification evidence | Reproducible artifact proving an acceptance criterion | Completion claim |

## 16. Prohibited or Ambiguous Terminology

| Avoid | Required replacement/reason |
|---|---|
| “YouTube account” when channel is meant | Use `Google account` or `YouTube channel` precisely |
| “Connected” from a deep link alone | Use `returning` or `verifying connection` until backend confirmation |
| “Token” without qualifier | Use `Narrial session token`, `Google access token`, or `Google refresh token` |
| “Uploaded” to mean public | Use `upload completed`, `YouTube processing`, or `published` |
| “Scheduled” for a client timer | Use only for a durable backend schedule |
| “Expired account” | Identify expired access token, revoked authorization, or reconnect-required connection |
| “Success” without authority | Name the confirmed state and evidence |
| “Social account” in new YouTube domain contracts | Use `YouTube connection` unless referring to legacy generic code |
| “Done” | Use documented status plus verification evidence |

## 17. Identifier and Naming Conventions

| Artifact | Format | Example |
|---|---|---|
| Product capability | `PV-CAP-NNN` | `PV-CAP-005` |
| Product system outcome | `PV-SYS-NNN` | `PV-SYS-011` |
| Product decision | `PV-DEC-NNN` | `PV-DEC-004` |
| Scope item | `SCOPE-IN/COND/DEF/OUT-NNN` | `SCOPE-COND-005` |
| Scope decision | `SCOPE-DEC-NNN` | `SCOPE-DEC-001` |
| Cross-cutting decision | `YT-DEC-NNN` | `YT-DEC-111` |
| Governance conflict | `GOV-CONFLICT-NNN` | `GOV-CONFLICT-001` |
| Governance risk | `GOV-RISK-NNN` | `GOV-RISK-004` |
| Acceptance criterion | `<DOC>-AC-NNN` | `GOV-AC-001` |
| Tracker evidence | `YT-EVID-YYYYMMDD-NNN` | `YT-EVID-20260826-005` |
| Blocker | `YT-BLOCK-NNN` | `YT-BLOCK-003` |
| Gate | Document-defined stable prefix | `SCOPE-GATE-03` |

IDs are immutable. Removed items are marked rejected, deprecated, or superseded; their IDs are never reused.

## 18. Domain and Lifecycle Naming Rules

- Domain types use singular nouns such as `YouTubeConnection`, `YouTubeChannel`, `OAuthTransaction`, `VideoUpload`, `Publication`, and `PublicationSchedule` after contract approval.
- Collections/tables, fields, API paths, and enums are not finalized here; Document 08 establishes shared contract names and Document 12 establishes persistence names.
- Status names must identify their owner and meaning; one status cannot combine connection, transfer, processing, and publication lifecycles.
- Renaming a persisted or public state requires compatibility and migration review.
- Frontend display labels may be friendly, but must map to one canonical backend state.

## 19. API and Error Naming Rules

- Resource names must describe YouTube-specific domain resources, not generic provider guesses.
- Request/response names must not expose database or Google credential models.
- Error names/codes must be stable, actionable, non-secret, and separated from localized UI copy.
- Authentication, ownership, validation, conflict, quota, temporary provider failure, and reconnect-required errors remain distinguishable.
- Exact paths, payloads, and codes are frozen in Documents 08 and 15, not here.

## 20. Database Naming Rules

- Persistence names must map unambiguously to approved domain concepts.
- Google account identity, YouTube channel identity, Narrial user identity, connection, and credentials remain separate concepts.
- Encrypted credential fields must never be returned through public models.
- Provider identifiers are not proof of ownership.
- Exact schema names are deferred to Document 12 and require migration history after approval.

## 21. Environment and Secret Naming Rules

- Canonical environments are `local`, `development`, `staging`, and `production` unless Document 10 approves otherwise.
- Every secret has a server-side owner, environment boundary, rotation policy, and documentation-safe variable name.
- `EXPO_PUBLIC_*` variables are public client configuration and must never contain secrets.
- Documentation may record variable names and purpose, never values.
- Exact URLs and variable names become authoritative only in Documents 10 and 27.

## 22. Test, Evidence, Gate, and Blocker Naming

- Test names state capability, condition, and expected outcome.
- Evidence IDs are unique, append-only, and identify date/candidate/environment/result.
- A failed or partial run remains recorded; later success does not erase it.
- Gates have explicit entry, exit, approver, and evidence requirements.
- Blockers identify impact, owner, resolution evidence, and status.
- `implemented`, `verified`, `deployed`, and `released` are never synonyms.

## 23. Documentation File and Link Rules

- YouTube module documents remain numbered `00`–`30` in `docs/youtube-connection/`.
- Each document states status, version, prerequisite, next document, approval effect, and change log.
- Relative repository links are preferred inside documentation.
- Section references use stable IDs when possible rather than fragile line numbers.
- A document must update Document 28 after approval or material status change.
- Cross-document conflicts are registered before dependent work continues.

## 24. Conflict Register

| ID | Source A | Source B | Conflict | Impact | Owner | Status/resolution direction |
|---|---|---|---|---|---|---|
| `GOV-CONFLICT-001` | Older connection plan | Documents 01–02 | Older material is multi-platform/connection-oriented; approved scope is YouTube-only and includes publishing lifecycle | Scope drift | Product/documentation | Documents 01–03 control; historical plan remains non-authoritative |
| `GOV-CONFLICT-002` | Generic multi-platform frontend mocks | YouTube-only domain | Existing labels/types include unrelated platforms | API/domain leakage | Frontend/product | Isolate or replace during Document 18 implementation |
| `GOV-CONFLICT-003` | Mock connected state | Backend-verified truth | Hardcoded success appears connected without provider evidence | False completion | Frontend/backend | Replace with authenticated backend state |
| `GOV-CONFLICT-004` | In-memory scheduling | Durable scheduling vision | Client process owns temporary schedules | Missed/lost work | Backend/data/operations | Replace under Documents 12 and 21 |
| `GOV-CONFLICT-005` | Installed OAuth/media utilities | No production integration | Package presence may be mistaken for capability | False progress | Technical/QA | Only verified usage counts |
| `GOV-CONFLICT-006` | Later detailed Documents 11–30 | Prompt-era Documents 03–10 | Later baselines may contain unapproved inherited choices | Architectural inconsistency | Documentation/technical | Reconcile after Documents 03–10 are finalized |
| `GOV-CONFLICT-007` | Proposed R1 in Document 02 | Unresolved `PV-DEC-004` | Immediate-first release is recommended, not approved | Release ambiguity | Product owner | Keep conditional until explicit decision |
| `GOV-CONFLICT-008` | Frontend `.env.local` variable name `CLERK_SECRET_KEY` | Client-secret boundary | A server secret may be located in client project | Credential exposure | Security owner | Inspect safely, remove/rotate if populated; never record value |

## 25. Conflict Resolution Procedure

1. Create or update a `GOV-CONFLICT-*` record.
2. Identify applicable sources and their authority.
3. Collect repository, provider, policy, or test evidence without secrets.
4. Identify affected decisions, scope, code, data, tests, and release gates.
5. Obtain the correct approval.
6. Create/update the authoritative decision record.
7. Mark obsolete sources superseded or historical; do not erase them.
8. Reconcile all affected documents and Document 28.
9. Verify implementation/migration consequences separately.

## 26. Decision Change and Supersession

An approved decision changes only through an explicit record containing the reason, old and new choice, impact, migration/compatibility needs, security/privacy/quota consequences, affected documents, approver, date, and supersession links.

Material reversals should receive a new `YT-DEC-*` record referencing the old ID. Minor clarifications may version the existing record only when they do not alter behavior or scope.

## 27. Documentation Synchronization Rules

When a decision changes, update in this order:

1. This register and its evidence.
2. Documents 01–02 if vision/scope changes.
3. The specialist controlling document.
4. Dependent downstream documents.
5. Document 28 tracker.
6. Implementation contracts, migrations, code, tests, operations, and release evidence after authorization.

If synchronization is incomplete, mark the affected work `BLOCKED` and list the stale artifacts.

## 28. Governance for Humans and AI Agents

- Read prerequisites before editing a dependent document.
- Preserve stable terms and IDs.
- Ask for or record approval instead of selecting product choices silently.
- Label assumptions, recommendations, and verified facts separately.
- Do not infer external configuration from placeholders.
- Do not expose secrets in commands, logs, screenshots, diffs, or documentation.
- Do not claim implementation or verification from documentation approval.
- Update the tracker after every approved document/checkpoint.
- Stop dependent implementation when a blocking decision is unresolved.

## 29. Governance Risks

| ID | Risk | Impact | Prevention/detection | Owner |
|---|---|---|---|---|
| `GOV-RISK-001` | Terminology drift | Incompatible UI/API/data/tests | Glossary review and contract checks | Documentation/technical |
| `GOV-RISK-002` | Proposal treated as approval | Unauthorized scope/implementation | Status model and approval evidence | Product owner |
| `GOV-RISK-003` | Stale document controls work | Wrong implementation | Version/dependency reconciliation | Maintainer |
| `GOV-RISK-004` | Secrets enter docs/evidence | Credential incident | Redaction and secret scanning | Security |
| `GOV-RISK-005` | Mocks treated as production | False release readiness | Evidence-based verification | QA/product |
| `GOV-RISK-006` | API/database vocabulary diverges | Mapping errors/migrations | Documents 08/12 traceability | Backend/data |
| `GOV-RISK-007` | State renamed without migration | Broken clients/data | Compatibility and migration gate | Backend/data/frontend |
| `GOV-RISK-008` | Approval evidence is lost | Decisions cannot be trusted | Append-only register/tracker | Maintainer |
| `GOV-RISK-009` | Old plan overrides approved scope | Scope leakage | Source hierarchy/conflict register | Product/maintainer |
| `GOV-RISK-010` | Other platforms enter contracts | Delay and unwanted coupling | YouTube-only review | All owners |
| `GOV-RISK-011` | Unnamed owners persist | External/release work stalls | Assignment gate | Product/release |

## 30. Governance Acceptance Criteria

- [x] `GOV-AC-001` — Source authority and conflict behavior are explicit.
- [x] `GOV-AC-002` — Source and decision statuses are distinct.
- [x] `GOV-AC-003` — Approval roles are defined without inventing people.
- [x] `GOV-AC-004` — Product, scope, and technical decisions are registered.
- [x] `GOV-AC-005` — Scope-condition mappings preserve existing IDs.
- [x] `GOV-AC-006` — Blocking decisions are visible by stage.
- [x] `GOV-AC-007` — Canonical terminology and prohibited ambiguity are recorded.
- [x] `GOV-AC-008` — Naming rules cover documents, domain, APIs, data, environments, tests, evidence, and gates.
- [x] `GOV-AC-009` — Conflicts and resolution procedures are recorded.
- [x] `GOV-AC-010` — Change and supersession preserve history.
- [x] `GOV-AC-011` — Human and AI governance rules are explicit.
- [x] `GOV-AC-012` — YouTube-only governance is preserved.
- [x] `GOV-AC-013` — Prerequisite and next-document guidance exists.
- [x] `GOV-AC-014` — The user approved building and adding this governance baseline.
- [ ] `GOV-AC-015` — Named owners and backups are assigned.
- [ ] `GOV-AC-016` — Blocking product decisions are individually approved.
- [ ] `GOV-AC-017` — Document 00 formal approval is recorded.

## 31. Maintenance Checklist

For every approved document, decision, implementation checkpoint, or release:

- [ ] Register new decisions and preserve existing IDs.
- [ ] Update status, owner, approver, date, rationale, and evidence.
- [ ] Review glossary and naming impact.
- [ ] Review conflicts and supersession.
- [ ] Update affected downstream documents.
- [ ] Compare implementation/contracts to approved terminology.
- [ ] Check for secrets and unsafe evidence.
- [ ] Update release-gate/blocker impact.
- [ ] Update Document 28 and this change log.

## 32. Prerequisites

- Document 00 provides the completed evidence baseline and still awaits separately recorded formal approval.
- Document 01 provides the approved product vision.
- Document 02 provides the approved scope framework while conditional release decisions remain open.

This governance baseline may be approved independently, but dependent implementation remains blocked until applicable decisions, owners, and specialist documents are approved.

## 33. Next Document

Continue with:

- `04-user-journeys-screens-and-interface-states.md`

Document 04 may draft explicit variants for unresolved decisions. Before it becomes a final approved UX contract, the user-visible decisions listed in Section 13 must be approved or explicitly deferred with a selected branch.

## 34. Change Log

| Version | Date | Change | Author or role | Approval |
|---|---|---|---|---|
| 1.0.0 | 2026-08-26 | Replaced the generation prompt with the complete governance, source hierarchy, decision register, glossary, naming, conflict, and change-control baseline | AI documentation agent | User approved build and addition; individual decisions remain gated |
| 1.0.1 | 2026-08-27 | Recorded the user-approved `YT-DEC-106` Clerk backend authentication choice for `YT-TASK-B03`; no other decision or owner assignment changed | AI-assisted implementation record | User approved the exact `YT-INSTALL-01` Clerk dependency after authorizing B03 |
| 1.0.2 | 2026-08-27 | Recorded the user-approved B04 local-only database/tooling, loopback host, ownership, and synthetic/disposable retention decisions; hosted and durable-data choices remain gated | AI-assisted implementation record | User approved the exact B04 proposal and instructed completion |
| 1.0.3 | 2026-08-27 | Recorded the user's B04-only security-approver role and time-bounded acceptance of the repository-controlled Prisma CLI advisory; broader security ownership remains unassigned | AI-assisted implementation record | User explicitly approved the recommended B04 exception |
