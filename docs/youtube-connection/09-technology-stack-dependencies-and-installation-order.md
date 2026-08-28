# YouTube Connection Module — Technology Stack, Dependencies, and Installation Order

## Document Control

| Field | Value |
|---|---|
| Document number | 09 |
| Filename | `09-technology-stack-dependencies-and-installation-order.md` |
| Module | YouTube Connection only |
| Stage | Stage 3 — technical planning |
| Status | Approved dependency-planning baseline — installation and unresolved selections remain approval-gated |
| Version | 1.0.3 |
| Created / last updated | 2026-08-26 |
| Repository verification date | 2026-08-26 |
| Official-source verification date | 2026-08-26 |
| Prerequisites | Documents 00, 07, and 08; governed by Document 03 |
| Next document | `10-environments-hosting-urls-and-secret-ownership.md` |
| Owners / reviewers | Backend, frontend, data, security, operations, and approver: unassigned |
| Source-of-truth role | Authoritative inventory, selection policy, installation order, and package-installation gate for this module |

Approval of this document approves the plan and ordering only. It does **not** authorize an install, update, removal, audit fix, manifest edit, lockfile edit, database creation, external-service configuration, or implementation change.

## 1. Purpose

This document defines the verified technology already present, the capabilities still missing, the candidate dependencies that may satisfy them, and the exact gates controlling when each dependency may be installed. Its goals are to:

- preserve the existing Expo and Fastify foundations where they meet approved requirements;
- prevent premature, duplicate, incompatible, unsafe, or non-YouTube dependencies;
- keep frontend and backend installation roots independent;
- ensure every new package traces to an approved architecture boundary and contract;
- require exact versions, official compatibility evidence, security/license review, rollback steps, and verification before installation;
- make a package listing distinguishable from permission to install it.

This document does not freeze database, host, queue, storage, KMS, observability, or deployment vendors. Those choices require their registered decisions and owning documents.

## 2. Prerequisite Readiness

| Prerequisite | Verified input | Current effect |
|---|---|---|
| Document 00 | Repository-backed audit; formal approval remains separately pending | Existing versions and usage may be inventoried; its failing quality gates remain blockers |
| Document 03 | Approved decision/governance baseline | Unresolved decisions retain their registered status; this document cannot silently approve them |
| Document 07 | Approved technology-neutral boundaries | Dependencies must preserve backend-owned OAuth, adapters, repositories, workers, and secret-free public contracts |
| Document 08 | Approved conceptual contracts | Packages may support the contracts but must not expose SDK/ORM types through public APIs |

No new dependency is authorized now. Document 10 must next define environments, runtime placement, hosts, URLs, regions, and secret ownership. Later install gates additionally require Documents 11–27 as specified below.

## 3. Repository Package Structure

| Concern | Frontend | Backend |
|---|---|---|
| Root | `narrial/` | `backend/` |
| Manifest | `narrial/package.json` | `backend/package.json` |
| Lockfile | `narrial/package-lock.json` | `backend/package-lock.json` |
| Package manager | npm, inferred from committed lockfile | npm, inferred from committed lockfile |
| Runtime | Expo SDK 57 / React Native | Node.js ESM |
| TypeScript | `~6.0.3` | `5.9.2` |
| Quality command | `npm run lint`; no standardized package test script | `npm run typecheck`, `npm run lint`, `npm test`, `npm run build` |
| Install behavior | Run only from `narrial/`; use Expo compatibility tooling for Expo/native packages | Run only from `backend/`; install runtime and development packages separately |

There is no verified root npm workspace. No command may install from the repository root or create a root `package.json`/lockfile without a separately approved repository-structure decision.

## 4. Dependency Status Vocabulary

| Status | Meaning | Authority |
|---|---|---|
| `EXISTING_USED` | Direct dependency with verified runtime/config/test use | Retain unless a later approved removal replaces it safely |
| `EXISTING_PARTIAL` | Present and used, but not yet for a complete production YouTube workflow | No completion claim |
| `EXISTING_UNUSED` | Direct dependency with no verified relevant import/config use | Review later; do not remove here |
| `EXISTING_TRANSITIVE` | Available only through another package | Must not be imported as if direct; add explicitly if direct use is approved |
| `REQUIRED_PROPOSED` | Capability is required; named package remains proposed until its gate | Explicit approval required |
| `OPTIONAL_PROPOSED` | Convenience or operational enhancement | Install only when measurable benefit and owner are approved |
| `CONDITIONAL` | Needed only if a provider/architecture option is selected | Blocked by owning decision |
| `DEFERRED` | Not needed at the current build stage | No installation |
| `REJECTED` | Evaluated and unsuitable for the stated use | Do not install unless decision is reopened with new evidence |
| `REPLACE` / `REMOVE_LATER` | Candidate change to existing dependency | Requires migration, rollback, and regression proof |
| `REQUIRES_VERIFICATION` | Version, compatibility, license, or security evidence is incomplete | Cannot enter `APPROVED_TO_INSTALL` |
| `REQUIRES_APPROVAL` | Complete proposal awaiting authorized approval | Cannot install |

## 5. Verified Existing Frontend Stack

Versions below come from `narrial/package.json`; “used” is supported by imports/config found on 2026-08-26. A version range is recorded exactly as declared and is not treated as a locked resolved version.

| ID | Package / version | Status and evidence | YouTube-module role | Decision |
|---|---|---|---|---|
| `YT-DEP-FE-001` | `expo ~57.0.13` | `EXISTING_USED`; scripts and Expo config | Managed app runtime and dependency compatibility | Retain |
| `YT-DEP-FE-002` | `react 19.2.3`, `react-native 0.86.2` | `EXISTING_USED` | UI runtime | Retain; Expo compatibility controls upgrades |
| `YT-DEP-FE-003` | `expo-router ~57.0.13` | `EXISTING_USED`; entry/config and app routes | YouTube screens and return navigation | Retain |
| `YT-DEP-FE-004` | `@clerk/expo ^4.3.0` | `EXISTING_USED`; provider, hooks, hosted auth, token cache | Narrial client authentication only | Retain; not Google OAuth authority |
| `YT-DEP-FE-005` | `expo-secure-store ~57.0.1` | `EXISTING_USED` through Clerk token cache/config | Narrial client-session storage | Retain; Google tokens remain forbidden in client storage |
| `YT-DEP-FE-006` | `expo-web-browser ~57.0.2` | `EXISTING_PARTIAL`; installed/configured for auth stack | Open backend-provided Google authorization URL | Retain; exact YouTube use verified in Document 18 |
| `YT-DEP-FE-007` | `expo-linking ~57.0.6` | `EXISTING_PARTIAL` | App-return/deep-link handling | Retain; strategy blocked by `YT-DEC-109`/Document 10 |
| `YT-DEP-FE-008` | `expo-auth-session ~57.0.7`, `expo-crypto ~57.0.1` | `EXISTING_PARTIAL`; Clerk prerequisites | May support browser/session mechanics | Do not use for client-side Google code exchange |
| `YT-DEP-FE-009` | `expo-document-picker ~57.0.1` | `EXISTING_USED`; reference input | Potential local video source selection | Conditional on `PV-DEC-005` and Document 19 |
| `YT-DEP-FE-010` | `expo-video ~57.0.2` | `EXISTING_USED`; video views | Preview/playback only | Retain |
| `YT-DEP-FE-011` | `expo-video-thumbnails ~57.0.1` | `EXISTING_USED`; reference input | Local preview thumbnail | Retain; not YouTube thumbnail upload logic |
| `YT-DEP-FE-012` | `expo-image ~57.0.3` | `EXISTING_USED` | Channel/video thumbnails | Retain |
| `YT-DEP-FE-013` | `typescript ~6.0.3`, `eslint ^9.0.0`, `eslint-config-expo ~57.0.1` | `EXISTING_USED` | Static quality gates | Retain; current lint failures must be resolved before feature completion |

Other existing Expo/UI packages remain application dependencies but are not selected by this YouTube module. Their presence neither expands module scope nor proves YouTube capability.

### Frontend conclusion

No new frontend dependency is currently required for the connection vertical slice. Existing Clerk and Expo browser/linking capabilities should be evaluated first. A server-state/cache library, form library, mobile test stack, error-reporting SDK, or custom native package may be proposed later only when Document 18, 25, or 26 establishes a concrete unmet need.

## 6. Verified Existing Backend Stack

| ID | Package / version | Status and evidence | YouTube-module role | Decision |
|---|---|---|---|---|
| `YT-DEP-BE-001` | Node engine `>=22` | `EXISTING_USED`; manifest/runtime foundation | Backend/API/worker runtime | Keep family provisionally; exact supported patch/LTS policy must be frozen before deployment |
| `YT-DEP-BE-002` | `fastify 5.12.1` | `EXISTING_USED`; `src/app.ts` | HTTP server, hooks, JSON Schema validation/serialization, plugin boundaries | Recommended retain; `YT-DEC-101` approval and passing foundation tests required |
| `YT-DEP-BE-003` | `@fastify/cors 11.3.0` | `EXISTING_USED`; `src/app.ts` | Allowlisted cross-origin behavior | Retain and configure per environment |
| `YT-DEP-BE-004` | `@fastify/helmet 13.1.1` | `EXISTING_USED`; `src/app.ts` | HTTP security headers | Retain |
| `YT-DEP-TEST-001` | `vitest 3.2.7` | `EXISTING_USED`; backend tests | Unit/service/contract tests | Retain; two existing timeouts must be diagnosed |
| `YT-DEP-BE-005` | `typescript 5.9.2`, `tsx 4.20.5` | `EXISTING_USED` | Build/typecheck/development execution | Retain |
| `YT-DEP-BE-006` | ESLint 9 stack | `EXISTING_USED` | Static quality gate | Retain |

Missing backend capabilities are: verified Narrial authentication, durable database/migrations, token encryption/key access, Google OAuth/YouTube adapter, durable upload source access, background jobs, scheduling, synchronization persistence, rate/quota controls, and production observability.

## 7. Approved Stack Direction and Open Selections

“Recommendation” means the default to evaluate; it is not approval to install.

| ID | Layer | Existing choice | Recommendation | Status / blocker |
|---|---|---|---|---|
| `YT-STACK-001` | Mobile/client | Expo 57, React Native 0.86, React 19 | Extend existing app | Baseline accepted; runtime changes still tested at their stage |
| `YT-STACK-002` | Routing | Expo Router | Retain | Existing |
| `YT-STACK-003` | Narrial client auth | Clerk Expo | Retain | Backend Clerk verifier and `YT-DEC-106` verified for B03; later environment/credential operations remain gated |
| `YT-STACK-004` | Backend runtime/framework | Node 22 family + Fastify 5 | Extend existing ESM Fastify service | Proposed through `YT-DEC-101`; existing tests not fully passing |
| `YT-STACK-005` | API schema validation | Fastify JSON Schema and response schemas | Prefer built-in capability; add a type provider only if Document 15 proves value | Exact schema authoring strategy pending |
| `YT-STACK-006` | Database | None | PostgreSQL relational store | Requires `YT-DEC-102`, Document 10 and 12 |
| `YT-STACK-007` | Data access/migrations | None | Evaluate Prisma against direct PostgreSQL tooling | Requires `YT-DEC-102`; current Prisma major must be checked at install time |
| `YT-STACK-008` | Google OAuth/YouTube | None | Narrow backend adapter around Google’s official Node client, unless direct HTTP review is superior | Requires Documents 11, 13, 15, 16 |
| `YT-STACK-009` | Token encryption | None | Node built-in authenticated cryptography behind a vault interface; managed KMS for production keys | Provider/algorithm blocked by `YT-DEC-107`/`115` and Document 13 |
| `YT-STACK-010` | Video source/storage | Client-local mock/selection utilities only | Stream from an approved durable authorized source | Blocked by `PV-DEC-005`, `YT-DEC-105`, Document 19 |
| `YT-STACK-011` | Jobs/scheduler | None | Prefer database-backed durable jobs first; compare Redis/managed queue only against measured needs | Blocked by `YT-DEC-104`, Document 21 |
| `YT-STACK-012` | Synchronization | None | Quota-aware worker reconciliation plus manual refresh | Blocked by `YT-DEC-113`, Document 22 |
| `YT-STACK-013` | Observability | Fastify logging capability only | Structured redacted logs first; OpenTelemetry/vendor SDKs only after provider/privacy decision | Blocked by `YT-DEC-114`, Document 25 |
| `YT-STACK-014` | Deployment/secrets | None selected | Environment-injected secrets and managed provider in staging/production | Blocked by `YT-DEC-103`, `115`, Documents 10/27 |

## 8. Capability-to-Dependency Matrix

| Capability | Preferred mechanism | Package consequence |
|---|---|---|
| Request/response validation | Fastify JSON Schema | No new package initially |
| Narrial session verification | Clerk backend SDK or verified standards-based JWT path | `@clerk/backend` proposed; exact approach requires approval |
| Environment validation | Small typed startup parser or one approved schema system | Do not install a duplicate validator by default |
| OAuth authorization/code exchange/refresh/revoke | Backend Google adapter | `googleapis` proposed for evaluation |
| YouTube channel/video operations | Same narrow adapter | Use the same approved Google client; no second YouTube SDK |
| HTTP transport | Node built-in `fetch` where adapter requirements permit | No generic HTTP client by default |
| Cryptography | `node:crypto` authenticated encryption | No general crypto package |
| Database transactions/constraints | PostgreSQL plus approved client/ORM | Conditional Prisma/PostgreSQL packages |
| Idempotency/outbox/jobs | Database constraints and durable records | No package until Document 12/21 design proves need |
| Delayed queue | Database worker, Redis/BullMQ, or managed service | Conditional on `YT-DEC-104` |
| Timezone identifiers | IANA zones and runtime `Intl` | Add one time library only if Document 21 tests show a gap |
| Resumable byte streaming | Node streams plus Google upload transport | No whole-file buffering library |
| Storage | Approved provider SDK | Conditional on `YT-DEC-105` |
| Rate limiting | Fastify plugin or approved infrastructure | `@fastify/rate-limit` proposed at security gate |
| Logging | Fastify/Pino capabilities | No additional logger initially |
| Traces/metrics | OpenTelemetry or selected platform SDK | Conditional at Document 25 |
| Provider tests | Adapter fakes + Fastify inject + Vitest | Existing stack first; HTTP interceptor only if needed |
| Mobile E2E/accessibility | Selected in Document 26 | Deferred |

## 9. Proposed Dependency Register

All proposed versions are recorded as **“exact version selected at gate”**. This is deliberate: installing an unverified `latest` now would contradict Expo compatibility, Node LTS, security, and lockfile controls. The gate record must replace the placeholder with an exact version before a command becomes executable.

| ID | Package | Root/category | Capability and rationale | Version rule | Gate/status |
|---|---|---|---|---|---|
| `YT-DEP-BE-101` | `@clerk/backend` `3.16.4` | `backend/`, runtime | Verify Narrial sessions and derive backend user context using Clerk-supported server behavior | Exact version; Node `>=20.9.0` supported by Clerk and compatible with the backend Node `>=22` declaration | `YT-INSTALL-GATE-101`; `VERIFIED` for B03 by `YT-EVID-20260827-004` |
| `YT-DEP-BE-102` | `googleapis` | `backend/`, runtime | Official Google OAuth and YouTube API client behind narrow adapters; supports auth and media operations | Exact stable version compatible with selected Node patch | `YT-INSTALL-GATE-104`; `REQUIRED_PROPOSED` pending adapter review |
| `YT-DEP-BE-103` | `@fastify/rate-limit` | `backend/`, runtime | Per-user/IP/route protection when infrastructure controls alone are insufficient | Exact Fastify-5-compatible version | `YT-INSTALL-GATE-107`; `CONDITIONAL` |
| `YT-DEP-BE-104` | `@fastify/swagger`, `@fastify/swagger-ui` | `backend/`; runtime/dev exposure by environment | Generate/review API schema if Document 15 chooses served OpenAPI docs | Same compatible release family; UI disabled outside approved environments | `YT-INSTALL-GATE-101`; `OPTIONAL_PROPOSED` |
| `YT-DEP-BE-105` | One Fastify type provider/schema authoring package | `backend/`, runtime | Reduce drift between TS and JSON Schema only if one source-of-truth approach is approved | Exact Fastify-5/TS-compatible version | `YT-INSTALL-GATE-101`; `CONDITIONAL`; do not install alongside competing schema systems |
| `YT-DEP-DB-101` | `prisma` `7.9.1`; `@types/pg` `8.23.1` | `backend/`, development | Migration/schema tooling and PostgreSQL driver types | Exact versions | `YT-INSTALL-GATE-102`; Verified for local B04 under user/security-approver exception for repository-controlled Prisma CLI configuration through 2026-09-26/next patched stable Prisma; no staging/production acceptance |
| `YT-DEP-DB-102` | `@prisma/client` `7.9.1` | `backend/`, runtime | Generated typed data access | Same exact version as `prisma` | `YT-INSTALL-GATE-102`; installed and local schema/client checks pass |
| `YT-DEP-DB-103` | `@prisma/adapter-pg` `7.9.1`; `pg` `8.23.0` | `backend/`, runtime | Prisma 7 PostgreSQL direct connection transport | Exact versions verified together | `YT-INSTALL-GATE-102`; installed and local PostgreSQL 18.6 migration checks pass |
| `YT-DEP-JOB-101` | `bullmq` plus direct Redis client only if required | `backend/`, runtime | Durable delayed jobs if Redis topology is approved over database-backed jobs | Exact mutually compatible versions | `YT-INSTALL-GATE-106`; `CONDITIONAL` on `YT-DEC-104` and Redis ownership |
| `YT-DEP-TIME-101` | One approved timezone/Temporal library | Shared only where required | DST-safe construction if supported runtime APIs and tested domain helpers are insufficient | One exact version; no overlapping date libraries | `YT-INSTALL-GATE-106`; `CONDITIONAL` |
| `YT-DEP-OPS-101` | OpenTelemetry API/Node SDK/instrumentations/exporter set | `backend/`, runtime | Traces/metrics after telemetry backend and privacy controls are approved | Versions selected as a compatible set | `YT-INSTALL-GATE-107`; `CONDITIONAL` |
| `YT-DEP-OPS-102` | Selected error-reporting/vendor SDK | Backend and/or frontend only where approved | Production diagnosis when redaction, retention, residency, and cost are accepted | Exact provider-supported version | `YT-INSTALL-GATE-107`; `CONDITIONAL` |
| `YT-DEP-STORAGE-101` | Selected object-storage SDK | `backend/`, runtime | Authorized durable video source access if object storage is selected | Exact provider-supported version | `YT-INSTALL-GATE-105`; `CONDITIONAL` |
| `YT-DEP-SEC-101` | Selected cloud KMS/secret-manager SDK | `backend/`, runtime | Production wrapping-key operations or runtime secret retrieval | Exact provider-supported modular client | `YT-INSTALL-GATE-103`; `CONDITIONAL` |
| `YT-DEP-TEST-101` | One HTTP/provider mocking tool | `backend/`, development | Only if adapter dependency injection and deterministic fakes cannot cover transport behavior | Exact Node/Vitest-compatible version | `YT-INSTALL-GATE-108`; `OPTIONAL_PROPOSED` |
| `YT-DEP-TEST-102` | Mobile component/E2E/accessibility tools selected by Document 26 | `narrial/`, development | Verified UI/device coverage | Expo-57-compatible versions chosen through Expo guidance | `YT-INSTALL-GATE-108`; `DEFERRED` |

### 9.1 Dependencies deliberately not selected now

- No frontend Google OAuth SDK or client secret: Google authorization is backend-owned.
- No second backend web framework, generic multi-platform connector SDK, or social-provider abstraction.
- No Axios-style HTTP client unless the approved Google/provider adapter demonstrates a concrete gap in Node’s supported transport.
- No standalone JWT verifier alongside an approved Clerk server SDK without a documented reason.
- No general-purpose cryptography library where audited Node primitives meet Document 13.
- No storage SDK before storage provider/topology approval.
- No Redis client or queue package before Redis infrastructure, ownership, and delivery semantics are approved.
- No second date library, test runner, logger, validation system, ORM, or telemetry vendor for convenience.
- No package that buffers complete videos in application memory.

## 10. Google Client Selection Rule

The preferred candidate is a narrow Narrial adapter over Google’s official Node.js client because the official library provides Google API authorization support and media-upload capability. The adapter must:

- export Narrial-owned interfaces from Document 08, not `googleapis` types;
- validate and normalize every provider response;
- preserve refresh tokens when Google does not return a replacement;
- expose resumable session identifiers only inside protected backend/storage boundaries;
- allow deterministic fake implementations without network access;
- classify success, failure, quota, authorization, retryable, and unknown outcomes;
- avoid importing the broad client outside `infrastructure/google/` or the final equivalent boundary.

Direct HTTP remains an allowed alternative only if Document 16/19 proves that it reduces surface area without reimplementing OAuth, retries, upload semantics, validation, or maintenance unsafely. `googleapis` is not installable until that comparison is approved.

## 11. Database and Migration Selection Rule

PostgreSQL is the architecture recommendation because the domain requires transactions, unique idempotency claims, concurrency guards, durable schedules, relationships, and queryable audit/status state. Prisma is a candidate, not an approved choice.

Before installation, Document 12 must freeze schema and transaction requirements and the data owner must compare:

1. current stable Prisma with its required PostgreSQL adapter/driver;
2. a direct typed PostgreSQL client plus a dedicated migration tool;
3. the selected hosting runtime’s connection and pooling constraints.

If Prisma is approved, `prisma` and `@prisma/client` must use the same exact version. The current official Prisma documentation states that recent releases require supported LTS Node versions and that Prisma 7+ direct connections use a driver adapter; the installation review must verify the exact current major rather than copy an older two-package recipe.

The database and first migration are created only after Document 12 is approved, `YT-DEC-102/103/116` are resolved, Document 13’s credential fields are safe, and the user explicitly authorizes `YT-DB-02/03`.

## 12. Credential Security Dependency Rule

Application-layer encryption should first use Node’s built-in `node:crypto` through the `CredentialVault` interface. No custom cipher design or unauthenticated encryption is allowed. Document 13 must choose algorithm, nonce/tag format, key versioning, rotation, failure behavior, and envelope-key ownership.

A KMS/secret-manager SDK is installed only when Document 10 names the environment/provider and Document 13 approves key operations. The client never receives Google access tokens, Google refresh tokens, OAuth codes, client secrets, encryption keys, or resumable upload session URIs.

## 13. Upload, Storage, Job, and Time Rules

### Upload and storage

Use Node streams/backpressure and the approved Google upload transport. Source ownership must be revalidated immediately before reading. Object-storage packages wait for `PV-DEC-005`, `YT-DEC-105`, and Document 19. A storage URL is never treated as proof of access; temporary credentials/URLs are sensitive and bounded.

### Jobs

The default evaluation order is:

1. PostgreSQL-backed job/outbox records with atomic claims and a dedicated worker;
2. a managed task/queue supported by the selected host;
3. BullMQ/Redis when delay, throughput, or operational needs justify another stateful service.

Every option must prove at-least-once safety, lease/fencing, idempotency, cancellation/reschedule races, recovery after deploy/outage, bounded retry, dead-letter/manual repair, monitoring, and local testability. A package cannot substitute for these domain controls.

### Timezones

Persist the canonical execution instant plus original IANA timezone and ambiguity choice. Use a controlled server clock. Do not add a date library merely for formatting; add one only if Document 21 tests demonstrate that supported runtime APIs cannot safely construct/validate required DST behavior.

## 14. Version and Compatibility Policy

1. Existing manifest versions remain unchanged until a separate upgrade is approved.
2. New backend direct dependencies are saved at an exact version; no `latest`, wildcard, Git URL, or unreviewed prerelease.
3. Expo-managed/native dependencies are installed with `npx expo install` so Expo selects/checks compatible versions. The resulting manifest and lockfile version must then be recorded.
4. Security-related patch updates still require lockfile review, focused tests, and release evidence; `npm audit fix --force` is prohibited.
5. Runtime and dev dependencies are separated. Build/runtime-required packages must not be hidden in `devDependencies`.
6. Peer dependencies and optional native configuration are reviewed before installation.
7. One direct version per package/root is preferred. Duplicate majors require an explicit exception.
8. `package-lock.json` is committed with its owning manifest. Hand-edited lockfiles are prohibited.
9. CI uses `npm ci`; developer installation changes use an approved `npm install --save-exact ...` or Expo command.
10. Exact Node and npm versions must be recorded in Document 10/27 and CI. The current backend declaration `>=22` is too broad for reproducible deployment.
11. Node 22 was in Maintenance LTS at verification time; production must use an officially supported, patched LTS line and must plan migration before EOL.
12. License and provenance are verified from package metadata and official repositories at the install gate. This document does not provide legal approval.

## 15. Compatibility Baseline

| ID | Compatibility requirement | Current result / action |
|---|---|---|
| `YT-COMPAT-001` | Expo/native packages must match Expo SDK 57 and React Native 0.86 | Use `npx expo install --check`; do not auto-fix without approval |
| `YT-COMPAT-002` | Frontend packages must support React 19.2 and target iOS/Android; web only if retained in scope | Verify official platform matrix and device build |
| `YT-COMPAT-003` | Backend packages must support ESM, Fastify 5.12, TypeScript 5.9, and the selected Node patch | Verify official docs/engines/peer metadata before install |
| `YT-COMPAT-004` | Prisma/client/adapter/driver versions must form one documented supported set | Blocked until database selection |
| `YT-COMPAT-005` | Google client must support selected LTS Node and required OAuth/media operations | Verify package engine/support and contract tests at Gate 104 |
| `YT-COMPAT-006` | Worker package must match approved Redis/managed-service versions and deployment model | Blocked until job selection |
| `YT-COMPAT-007` | Telemetry SDK/instrumentations/exporter must form one compatible set; ESM startup must be proven | Blocked until Document 25 |
| `YT-COMPAT-008` | No package may require exposing server credentials or provider tokens to Expo | Hard failure/rejection |

## 16. Installation Authorization Lifecycle

```text
DOCUMENTED_ONLY → BLOCKED → APPROVED_TO_INSTALL → INSTALLED → VERIFIED
                         ↘ REJECTED                ↘ ROLLED_BACK
```

| State | Meaning |
|---|---|
| `DOCUMENTED_ONLY` | Candidate is recorded; no command is authorized |
| `BLOCKED` | One or more prerequisite decisions/documents/evidence are missing |
| `APPROVED_TO_INSTALL` | Named approver authorized an exact package/version/command/root and expected diff |
| `INSTALLED` | Manifest and lockfile changed; verification is incomplete |
| `VERIFIED` | Required clean install, quality, focused, security, license, and runtime checks passed with evidence |
| `ROLLED_BACK` | Package/config/import changes were safely removed and baseline reverified |
| `REJECTED` | Selection was declined with reason/evidence |

Only explicit user/owner authorization can move a command into `APPROVED_TO_INSTALL`. An AI-generated recommendation cannot self-approve it.

## 17. Exact Ordered Installation Checkpoints

| Gate | When it is used | Allowed dependency group | Entry criteria | Exit evidence |
|---|---|---|---|---|
| `YT-INSTALL-GATE-100` | Stages 0–4, through Documents 09–10 | None | Documentation work only | No manifest/lockfile diff |
| `YT-INSTALL-GATE-101` | Stage 6 backend foundation | Backend auth and one approved schema/config/rate-doc foundation item | Docs 07–10/14–15 approved; `YT-DEC-101/106/111` resolved; existing backend tests diagnosed; exact command approved | Manifest/lockfile diff, clean install, build/type/lint/test, auth/contract tests |
| `YT-INSTALL-GATE-102` | Stage 5 persistence / Stage 6 foundation | Database client/ORM/migration packages | Docs 09–10/12–13 approved; engine/host/region/owner/retention decided; DB creation authorized | Connection/migration/rollback/concurrency/ownership proof |
| `YT-INSTALL-GATE-103` | Stage 5 security | KMS/secret SDK only if provider selected | Docs 10/13 approved; key provider/access/rotation decided; threat review passed | Encryption/tamper/rotation/redaction tests |
| `YT-INSTALL-GATE-104` | Stage 7 OAuth/channel | Clerk backend verifier and Google OAuth/YouTube client | Staging Google setup approved in 11; auth, DB, encryption, callbacks, scopes, contracts ready; exact versions approved | Fake contract tests plus controlled staging OAuth/channel evidence |
| `YT-INSTALL-GATE-105` | Stage 9 upload | Storage/file-inspection additions only if required | Source/storage decision and Doc 19 approved; connected channel works; size/resource/security limits set | Large-file streaming/resume/cancel/cleanup tests |
| `YT-INSTALL-GATE-106` | Stage 10 scheduling | Queue/worker/time dependency selected | Immediate publication verified; Docs 12/21 approved; topology/ownership/idempotency/clock decided | Redelivery/lock/DST/missed-job/deploy recovery tests |
| `YT-INSTALL-GATE-107` | Stage 11 operations | Rate-limit, telemetry, error-reporting additions | Docs 22–25 approved; privacy/vendor/retention/cardinality/cost decisions made | Redaction, failure-isolation, quota and dashboard/alert evidence |
| `YT-INSTALL-GATE-108` | Stage 12–13 verification/deployment | Minimal test/E2E/load/deploy tools | Docs 26–27 approved; target matrix and CI/hosting owners assigned | CI/device/E2E/load/security/staging evidence |

The development database is not created at Gate 100 or 101. It is created immediately before/with Gate 102 only after the dedicated database authorization in Document 12 and tracker checkpoint `YT-DB-02`.

## 18. Installation Command Register

Every command below is a non-executable template marked **DO NOT RUN**. `<approved-version>` must be replaced by a recorded exact version, and conditional packages must be removed from the command unless their decision is approved.

| Command ID | Root | Proposed command template | Gate | Expected changes |
|---|---|---|---|---|
| `YT-INSTALL-CMD-101` | `backend/` | `npm install --save-exact @clerk/backend@3.16.4` | 101 | Backend manifest and lockfile only; approved and observed installed for B03 on 2026-08-27 |
| `YT-INSTALL-CMD-102` | `backend/` | `npm install --save-exact googleapis@<approved-version>` | 104 | Backend manifest and lockfile only |
| `YT-INSTALL-CMD-103` | `backend/` | `npm install --save-exact @fastify/rate-limit@<approved-version>` | 107 | Backend manifest and lockfile only |
| `YT-INSTALL-CMD-104` | `backend/` | `npm install --save-exact @fastify/swagger@<approved-version> @fastify/swagger-ui@<approved-version>` | 101 | Backend manifest and lockfile only; optional |
| `YT-INSTALL-CMD-105` | `backend/` | `npm install --save-exact @prisma/client@<approved-version> <approved-postgres-adapter>@<approved-version> <approved-postgres-driver>@<approved-version>` | 102 | Backend runtime dependencies/lockfile |
| `YT-INSTALL-CMD-106` | `backend/` | `npm install --save-dev --save-exact prisma@<same-approved-version>` | 102 | Backend dev dependency/lockfile |
| `YT-INSTALL-CMD-107` | `backend/` | `npm install --save-exact bullmq@<approved-version> <approved-redis-client>@<approved-version>` | 106 | Backend manifest/lockfile; conditional |
| `YT-INSTALL-CMD-108` | `backend/` | `npm install --save-exact <approved-kms-or-storage-or-observability-packages>` | 103/105/107 | Backend manifest/lockfile; provider-specific |
| `YT-INSTALL-CMD-109` | `narrial/` | `npx expo install <approved-expo-or-native-package>` | 108 or owning frontend gate | Frontend manifest/lockfile and possibly app config/native project files |
| `YT-INSTALL-CMD-110` | Either owning root | `npm install --save-dev --save-exact <approved-test-package>@<approved-version>` | 108 | Owning manifest/lockfile only |

Before approval, each command record must add requester, approver, reason, official source, exact versions, compatible peers/engines, expected transitive changes/install scripts, license result, known advisories, rollback command, and linked test IDs.

## 19. Required Post-Installation Verification

For each approved install:

1. Capture clean pre-change `git status --short`; preserve unrelated user changes.
2. Record `node --version` and `npm --version` in the owning root.
3. Execute only the approved command from the approved root.
4. Review `package.json` and `package-lock.json`; reject unexpected roots, packages, major changes, Git dependencies, or install scripts.
5. Run `npm ci` in a clean disposable checkout/environment when available.
6. Run typecheck, lint, focused tests, full tests, and production build appropriate to the root.
7. For frontend/native additions, run `npx expo install --check`, Expo diagnostics, and supported-device development builds.
8. Inspect the dependency tree (`npm ls <package>`) and confirm one intended direct version.
9. Run the approved vulnerability/provenance/license checks; review findings rather than auto-fixing them.
10. Test the capability through the owning interface using fakes before live staging.
11. Measure relevant backend startup/memory or frontend bundle/native-build impact.
12. Record command, exit code, versions, test counts, environment, diff, and evidence ID in Document 28.

A successful installation is not `VERIFIED` when unrelated baseline tests still fail. Existing backend test timeouts and frontend lint failures must remain visible until separately resolved.

## 20. Rollback Procedure

Rollback is performed with targeted package-manager operations or `apply_patch`, never destructive Git reset/checkout commands:

1. Stop using the new capability/feature flag without deleting durable user state.
2. Remove or revert only the package’s imports, config, scripts, generated artifacts, and direct manifest entry.
3. Regenerate the owning lockfile through the package manager if an approved uninstall is used; do not hand-edit it.
4. Remove provider resources only under the relevant external-resource runbook and explicit authorization.
5. Re-run the pre-install quality and build commands.
6. Confirm existing behavior and data compatibility.
7. Record why rollback occurred, remaining transitive/config/data effects, and evidence; mark `ROLLED_BACK`.

For a Prisma/queue/storage/KMS change, rollback must protect applied migrations, durable jobs, encrypted credentials, and stored media. Package removal never implies destructive data rollback.

## 21. Security, Provenance, and License Controls

Each new direct dependency must pass:

- official owner/repository and registry provenance review;
- exact package-name/namespace check against typosquatting;
- maintenance, release, deprecation, and security-policy review;
- engine, peer, native-platform, ESM, and TypeScript compatibility review;
- manifest/lockfile and lifecycle/install-script inspection;
- known-vulnerability and transitive-dependency review with exploitability context;
- license identification, project compatibility, attribution/redistribution review, and legal escalation when uncertain;
- secret scan and confirmation that examples/config do not place secrets in client bundles, logs, jobs, tests, or documentation;
- least-privilege review for any SDK that contacts cloud/provider services.

No dependency may send telemetry by default without disclosure and approval. No package may execute provider side effects during import, migration generation, tests, or build.

## 22. Dependency Risks

| ID | Risk | Prevention / detection | Gate owner |
|---|---|---|---|
| `YT-DEP-RISK-001` | Premature install creates architectural lock-in | Authorization lifecycle and exact gates | Technical approver |
| `YT-DEP-RISK-002` | Expo/native incompatibility breaks builds | `npx expo install`, official matrix, device builds | Frontend |
| `YT-DEP-RISK-003` | Broad Google SDK leaks types across layers | Narrow adapter and import-boundary tests | Backend |
| `YT-DEP-RISK-004` | OAuth or Google secrets move into client | Secret boundary checks/scans | Security |
| `YT-DEP-RISK-005` | ORM/driver/runtime versions mismatch | Install as one verified compatibility set | Data |
| `YT-DEP-RISK-006` | Queue is installed without durable infrastructure/ownership | `YT-DEC-104` and Document 21 gate | Operations |
| `YT-DEP-RISK-007` | Duplicate validation/date/test/logging stacks drift | One-system policy and dependency review | Technical |
| `YT-DEP-RISK-008` | Lockfile drift/nonreproducible builds | Per-root lockfiles, exact direct versions, `npm ci` | Release |
| `YT-DEP-RISK-009` | Transitive vulnerability/install script causes compromise | Lockfile/provenance/script/security review | Security |
| `YT-DEP-RISK-010` | Node 22 reaches EOL during module lifetime | LTS calendar owner and planned runtime upgrade | Operations |
| `YT-DEP-RISK-011` | Telemetry captures tokens, metadata, or session URLs | Data classification/redaction/canary tests | Security/operations |
| `YT-DEP-RISK-012` | Test-only package or mock reaches production behavior | Dependency category and build inspection | QA/release |
| `YT-DEP-RISK-013` | Other-platform SDK enters YouTube module | YouTube-only dependency review | All reviewers |

## 23. Decisions Requiring Explicit Approval

| Decision | Recommendation / alternatives | Dependency impact |
|---|---|---|
| `YT-DEC-101` backend framework | Retain Fastify 5 after foundation tests pass | Avoids framework replacement |
| `YT-DEC-102` database/tooling | PostgreSQL; compare current Prisma set with direct driver/migrations | Controls `YT-DEP-DB-101..103` |
| `YT-DEC-104` jobs | Database-backed first; compare managed queue and BullMQ/Redis | Controls `YT-DEP-JOB-101` |
| `YT-DEC-105` video source/storage | Durable authorized streaming source; provider TBD | Controls `YT-DEP-STORAGE-101` |
| `YT-DEC-106` backend auth | Clerk-supported backend verification | Controls `YT-DEP-BE-101` |
| `YT-DEC-107/115` encryption, keys, secrets | Node authenticated crypto plus managed production key boundary | Controls `YT-DEP-SEC-101` |
| `YT-DEC-111` API/schema style | Fastify JSON Schema; optional single type provider/OpenAPI tool | Controls `YT-DEP-BE-104/105` |
| Google adapter implementation | Narrow `googleapis` adapter versus reviewed direct HTTP | Controls `YT-DEP-BE-102` |
| Rate limiting | Approved Fastify plugin versus infrastructure-only/hybrid | Controls `YT-DEP-BE-103` |
| Time library | Runtime standards/domain helper versus one library | Controls `YT-DEP-TIME-101` |
| `YT-DEC-114` observability | OpenTelemetry/vendor selection after privacy/hosting decisions | Controls `YT-DEP-OPS-101/102` |
| Testing toolchain | Minimal additions selected by Document 26 | Controls `YT-DEP-TEST-101/102` |

Until resolved in Document 03 with owner, rationale, evidence, approver, and date, these remain proposals.

## 24. Architecture Traceability

| Dependency group | Architecture boundary / contract | Earliest owning implementation document |
|---|---|---|
| Clerk backend verification | Authentication verifier; `YT-CONTRACT-INT-001` | 14–16 |
| Google client | Google OAuth/YouTube adapters; `YT-CONTRACT-INT-002/003/004/005/007/008` | 16–20, 22 |
| Database/ORM | Repository/transaction boundaries and all durable domain entities | 12, 14 |
| KMS/crypto | Credential vault; `YT-CONTRACT-INT-008` | 13–16 |
| Storage/upload | Video reader/upload service; `YT-CONTRACT-INT-004` | 19 |
| Queue/time | Job dispatcher/schedule/synchronizer; `YT-CONTRACT-JOB-001` | 21–22 |
| Rate/observability | Quota/audit/correlation seams; `YT-CONTRACT-INT-009` | 23–25 |
| Test tools | Every public/internal/provider/job contract | 26 |

Every installed package must additionally link to its exact `YT-FR-*`, `YT-NFR-*`, test IDs, and evidence entry when those mappings are finalized.

## 25. Installation Gate Acceptance Criteria

- [ ] `YT-INSTALL-AC-001` — Owning architecture, contract, environment, and specialist documents are approved.
- [ ] `YT-INSTALL-AC-002` — Blocking decision has a named owner, approver, rationale, and date.
- [ ] `YT-INSTALL-AC-003` — Capability cannot be safely satisfied by the existing stack or a standard runtime feature.
- [ ] `YT-INSTALL-AC-004` — Exact package, version, root, dependency category, and command are recorded.
- [ ] `YT-INSTALL-AC-005` — Official compatibility, maintenance, provenance, security, and license evidence is current.
- [ ] `YT-INSTALL-AC-006` — Expected manifest, lockfile, config, native, and generated-file changes are listed.
- [ ] `YT-INSTALL-AC-007` — Focused/full verification and rollback procedures are executable and safe.
- [ ] `YT-INSTALL-AC-008` — No duplicate package/system or non-YouTube scope is introduced.
- [ ] `YT-INSTALL-AC-009` — No credential/provider token can enter the frontend, job payloads, logs, tests, or docs.
- [ ] `YT-INSTALL-AC-010` — User or authorized owner explicitly approved the install action.

## 26. Document Acceptance Criteria

- [x] `YT-DEP-AC-001` — Both package roots, manifests, lockfiles, package manager, scripts, and independent install behavior are identified.
- [x] `YT-DEP-AC-002` — Relevant existing frontend/backend versions and observed usage are inventoried.
- [x] `YT-DEP-AC-003` — Existing, proposed, conditional, optional, deferred, and rejected meanings are distinct.
- [x] `YT-DEP-AC-004` — Required capabilities are mapped to existing/runtime/custom/package options.
- [x] `YT-DEP-AC-005` — Database, Google, security, upload, job, time, observability, and testing groups remain correctly gated.
- [x] `YT-DEP-AC-006` — Version, Expo compatibility, Node LTS, lockfile, security, provenance, license, verification, and rollback policies are defined.
- [x] `YT-DEP-AC-007` — Ordered installation checkpoints and non-executable command templates are defined.
- [x] `YT-DEP-AC-008` — Database creation timing is explicit.
- [x] `YT-DEP-AC-009` — Frontend Google-token/client-secret dependencies are prohibited.
- [x] `YT-DEP-AC-010` — No package, infrastructure, database, or code change was performed while producing this document.
- [ ] `YT-DEP-AC-011` — Open technology decisions and owners are approved — pending.
- [ ] `YT-DEP-AC-012` — Exact proposed versions and executable commands are approved at their future gates — pending.

## 27. Official References

These sources were checked on 2026-08-26. Recheck the relevant page at every install/upgrade gate because versions and support policies change.

- Expo, using libraries and `npx expo install`: https://docs.expo.dev/workflow/using-libraries/
- Expo CLI dependency validation: https://docs.expo.dev/more/expo-cli/#install
- Clerk Expo setup and required Expo packages: https://clerk.com/docs/expo/getting-started/quickstart
- Clerk backend request/session verification: https://clerk.com/docs/guides/sessions/manual-jwt-verification
- Fastify 5 validation and serialization: https://fastify.dev/docs/v5.12.x/Reference/Validation-and-Serialization/
- Fastify 5 reference/plugin architecture: https://fastify.dev/docs/v5.12.x/Reference/
- Google APIs Node.js client, OAuth, TypeScript, and media uploads: https://github.com/googleapis/google-api-nodejs-client
- Prisma current overview and driver-adapter requirement: https://www.prisma.io/docs/orm/v7
- Prisma system requirements: https://docs.prisma.io/docs/orm/reference/system-requirements
- Prisma supported databases: https://docs.prisma.io/docs/orm/reference/supported-databases
- Node.js release/LTS schedule: https://nodejs.org/en/about/previous-releases
- OpenTelemetry JavaScript support/status: https://opentelemetry.io/docs/languages/js/
- OpenTelemetry Node.js setup and ESM note: https://opentelemetry.io/docs/languages/js/getting-started/nodejs/

No external source was treated as authority to install or configure anything.

## 28. Handoff and Next Document

Prerequisites consumed: Documents 00, 03, 07, and 08. Before any install, also read the owning specialist document and the latest Document 28 tracker.

Next: `10-environments-hosting-urls-and-secret-ownership.md`. It must define local/development/staging/production runtime placement, domains, callback/app-return URLs, regions, database/worker/storage placement, and secret owners. Until Document 10 is approved, every new dependency remains `DOCUMENTED_ONLY` or `BLOCKED`.

## 29. Approval Record

The user authorized building and adding Document 09 on 2026-08-26. This approval establishes the dependency-planning baseline and installation order. It does not resolve the decisions in Section 23 or approve any command in Section 18.

## 30. Change Log

| Version | Date | Change | Approval |
|---|---|---|---|
| 1.0.0 | 2026-08-26 | Replaced the generation prompt with the verified stack inventory, candidate dependency register, policies, ordered gates, command templates, risks, traceability, and acceptance criteria | User approved build and addition; installation remains unauthorized |
| 1.0.1 | 2026-08-27 | Recorded exact `@clerk/backend@3.16.4` approval and verified B03 installation evidence; no other dependency selection changed | User approved `YT-INSTALL-01` / `YT-DEP-BE-101` for B03 only |
| 1.0.2 | 2026-08-27 | Recorded the exact B04 PostgreSQL/Prisma dependency set, local migration evidence, and unresolved Prisma CLI transitive security advisory | User approved B04 persistence installation only; no security-risk acceptance or later install authorized |
| 1.0.3 | 2026-08-27 | Recorded the approved, local-tooling-only, time-bounded Prisma CLI advisory exception and B04 verification evidence | User/security approver accepted the exception for B04 only; staging/production and later installs remain gated |
