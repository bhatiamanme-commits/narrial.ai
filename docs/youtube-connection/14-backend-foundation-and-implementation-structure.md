# YouTube Connection Module — Backend Foundation and Implementation Structure

## Document Control

| Field | Value |
|---|---|
| Document number | 14 |
| Filename | `14-backend-foundation-and-implementation-structure.md` |
| Module | YouTube Connection |
| Stage | Stage 6 — Backend foundation implementation begins |
| Status | Approved documentation baseline — `YT-TASK-B01` timeout diagnosis verified; broader backend implementation not authorized |
| Version | 1.0.1 |
| Last updated | 2026-08-27 |
| Prerequisites | Documents 07–10 and 12–13 |
| Next document | `15-backend-api-endpoints-and-error-contract.md` |
| Source-of-truth role | Reconciles the existing Fastify backend with the required YouTube backend structure and implementation order |
| Code authorization | None |
| Dependency-installation authorization | None |

## 1. Purpose

This document defines how the existing Narrial Fastify backend will be extended into the production YouTube Connection backend. It inventories completed and missing work; defines modules, dependency direction, authentication, repositories, provider adapters, workers, dependencies, implementation increments, and verification gates.

It does not modify code, fix current failures, install packages, create a database, generate migrations, implement OAuth, store credentials, call Google/YouTube, run workers, or remove frontend mocks.

## 2. YouTube-Only Boundary

Feature modules created under this plan are YouTube-only. Do not add Instagram, TikTok, Facebook, generic multi-platform credentials, unsupported routes, or premature abstractions for other providers. Existing multi-platform planning is historical evidence, not approval.

## 3. Prerequisite Readiness

| Document | Required contribution | Consequence |
|---|---|---|
| 07 | Service boundaries | Prompt-only; boundaries provisional |
| 08 | Domain states/contracts | Prompt-only; contracts provisional |
| 09 | Dependencies and installation order | Prompt-only; installations blocked |
| 10 | Environment, hosting, URLs, secrets | Prompt-only; production configuration blocked |
| 12 | Database design | Approved baseline; database creation blocked |
| 13 | Encryption/security controls | Approved baseline; key/OAuth implementation blocked |

Approval of this document authorizes documentation only. Each implementation increment requires its own approved prerequisites and authorization.

## 4. Current Backend Technology

| Category | Current value |
|---|---|
| Runtime | Node.js `>=22` |
| Modules | ECMAScript modules |
| Language | TypeScript `5.9.2` |
| HTTP | Fastify `5.12.1` |
| CORS | `@fastify/cors` `11.3.0` |
| Headers | `@fastify/helmet` `13.1.1` |
| Tests | Vitest `3.2.7` |
| Dev runner | `tsx` `4.20.5` |
| Lint | ESLint `9.34.0`, TypeScript ESLint `8.41.0` |
| Package manager evidence | npm lockfile exists |
| ORM/database/auth/Google/queue SDKs | Not installed |

These are repository facts, not upgrade instructions.

## 5. Existing Structure

```text
backend/
├─ package.json
├─ package-lock.json
├─ tsconfig.json
├─ tsconfig.build.json
├─ eslint.config.js
├─ src/
│  ├─ app.ts
│  ├─ server.ts
│  ├─ config/env.ts
│  └─ lifecycle/shutdown.ts
└─ test/
   ├─ config.test.ts
   ├─ health.test.ts
   ├─ http-safety.test.ts
   ├─ shutdown.test.ts
   └─ fixtures/config.ts
```

Generated `dist/` and installed `node_modules/` are not source locations.

## 6. Existing Foundation Inventory

Implemented: Fastify app factory, server entry, configuration parsing/validation, `/health`, restricted CORS, security headers, structured request logs, sensitive-field redaction, stable errors, unknown-route/malformed-JSON handling, production-error hiding, request timeout, graceful/forced shutdown, safety tests, and build/typecheck/lint/test scripts.

Missing: Narrial authentication context; YouTube domain/contracts; PostgreSQL/Prisma; repositories; credential encryption and keys; OAuth transactions; Google/YouTube clients; refresh; connection lifecycle; uploads, publications, schedules, synchronization; idempotency/outbox; workers; YouTube flags, metrics, and alerts.

Frontend in-memory mocks are not persistence or OAuth evidence. Do not import them into the backend or remove them before verified API-backed parity.

## 7. Verification Evidence

An earlier backend verification run on 2026-08-26 reported 3 failed test files, 1 passed; 3 failed tests, 13 passed. The later approved Document 00 audit recorded the controlling pre-`YT-TASK-B01` baseline as 14 passed and 2 timed out: the health response and request-correlated unknown-route response.

Observed timeouts:

- `GET /health` test.
- Unknown-route error test.
- Normal graceful-shutdown test.

Other configuration and HTTP-safety checks passed, including malformed JSON, production error hiding, CORS, headers, request timeout, redaction, and forced close.

`YT-TASK-B01` reproduced one cold-run health timeout, while the unknown-route case passed in isolation. The failing run spent 5.54 seconds collecting modules and 5.36 seconds in the test, crossing Vitest's 5-second Node test deadline. With the candidate unchanged, the health case then passed in 10 consecutive fresh Vitest processes at approximately 0.25–0.27 seconds, the unknown-route case passed, and the complete 16-test backend suite passed. Fastify injection includes plugin boot/readiness, so the proven cause is a cold local startup latency spike exhausting the generic test deadline, not either HTTP behavior. No timeout increase, pre-warm, production change, test weakening, dependency, or feature code was justified. See `YT-EVID-20260827-002` in Document 28.

The two recorded timeout cases are verified passing. `YT-TASK-B02` remains the exact next task for the broader fresh foundation audit; no feature work is authorized.

## 8. Architecture and Dependency Direction

```text
HTTP routes/schemas
       ↓
Application use cases
       ↓
Domain models/policies
       ├─ repository interfaces ─> Prisma repositories ─> PostgreSQL
       ├─ YouTube gateway ───────> Google/YouTube adapter
       └─ credential service ────> encryption/KMS boundary
```

Workers invoke application use cases. Domain code cannot depend on Fastify, Prisma, Google SDKs, or environment variables. Prisma/provider/HTTP types remain inside their boundaries. Plaintext credentials remain inside the credential service.

## 9. Composition Root

`src/app.ts` creates Fastify, registers shared plugins/errors/routes/lifecycle, and composes approved infrastructure and services with test overrides. It must not contain SQL, OAuth exchange, refresh, YouTube calls, encryption, or business rules.

`src/server.ts` loads validated configuration, builds/listens, and registers shutdown. Environment variables are read only through the validated configuration boundary.

## 10. Target Directory Structure

```text
backend/
├─ prisma/{schema.prisma,migrations/}
├─ scripts/
├─ src/
│  ├─ app.ts
│  ├─ server.ts
│  ├─ config/{env.ts,schema.ts,types.ts}
│  ├─ lifecycle/shutdown.ts
│  ├─ shared/{errors,logging,time,ids,pagination}/
│  ├─ auth/{authenticated-user,auth-verifier,auth-plugin,auth-errors}.ts
│  ├─ youtube/
│  │  ├─ domain/{connection,oauth-transaction,video-source,upload,publication,schedule,synchronization,statuses,errors}.ts
│  │  ├─ application/{ports,oauth,connections,uploads,publications,schedules,synchronization}/
│  │  ├─ infrastructure/
│  │  │  ├─ database/{prisma,repositories,transactions}/
│  │  │  ├─ security/{credential-service,envelope-encryption,oauth-state,redaction}.ts
│  │  │  ├─ google/{google-oauth-client,youtube-api-client,response-schemas,error-mapper}.ts
│  │  │  ├─ storage/
│  │  │  ├─ jobs/
│  │  │  └─ observability/
│  │  ├─ http/{routes,schemas,serializers,error-mapper}/
│  │  └─ workers/{upload,schedule,synchronization,credential-refresh,cleanup,outbox}.worker.ts
│  └─ types/fastify.d.ts
└─ test/{fixtures,fakes,unit,integration,contract,security,database,workers}/
```

Create directories only when an approved slice needs them; do not add empty placeholders.

## 11. Module Responsibilities

- `auth`: verify Narrial credentials and attach only a server-derived opaque user ID; it does not manage Google tokens.
- `domain`: entities, values, legal transitions, and errors with no framework/infrastructure dependency.
- `application`: OAuth, connection, upload, publication, schedule, and sync use cases depending on ports.
- `infrastructure/database`: Prisma lifecycle, repositories, transactions, concurrency, OAuth consumption, idempotency, leases, outbox.
- `infrastructure/security`: state protection, credential envelope, key versions, refresh coordination, redaction.
- `infrastructure/google`: Google/YouTube calls, response validation, normalization, and error mapping; provider types do not escape.
- `http`: routes, schemas, authentication requirements, serializers, idempotency, and stable errors; no business logic, SQL, crypto, or provider calls.
- `workers`: independently startable processors invoking the same application services.

## 12. Required Ports

Conceptual interfaces: `AuthenticationVerifier`, all YouTube repositories defined by Document 12, `DatabaseTransactionManager`, `CredentialCipher`, `CredentialService`, `OAuthStateProtector`, `YouTubeGateway`, `VideoObjectStorage`, `JobDispatcher`, `Clock`, `IdentifierGenerator`, `AuditRecorder`, and `MetricsRecorder`.

Inputs/outputs use domain types. Credentials never leave the credential service. State-changing calls carry idempotency context where required; external operations support timeout/cancellation.

## 13. Authentication

Repository plans propose Clerk bearer verification, but it remains subject to approval. If approved, verify signature, issuer, audience/authorized party, expiry, and environment; never decode without verification; attach only verified user ID; ignore client user IDs for authority; use stable `401`; distinguish authorization; and redact bearer tokens.

A different provider may replace the implementation without changing `AuthenticationVerifier`.

## 14. Fastify Plugin Order

1. Validated configuration.
2. Request IDs.
3. Structured logger/redaction.
4. Security headers.
5. Restricted CORS.
6. Size/timeout controls.
7. Authentication.
8. Database/infrastructure decorators.
9. YouTube routes.
10. Not-found handler.
11. Global error handler.
12. Shutdown/resource cleanup.

Test order and encapsulation. Keep plugins narrow; do not combine auth, database, OAuth, and provider operations in one plugin.

## 15. Configuration Expansion

Add validated configuration only when required: authentication, database, Google client credentials/reference, exact callback/scopes, state lifetime/digest key, return allowlist, encryption provider/key/version, storage, workers, jobs, feature flags, provider timeout/quota, and observability.

Parse once, fail before traffic, report field names without values, prohibit production fallbacks and client-visible backend secrets, and share approved definitions between API/workers.

## 16. Dependency Plan

| Stage | Capability | Proposed dependency category | Status |
|---|---|---|---|
| Foundation repair | Existing stack | None expected | No install |
| Authentication | Session verification | Approved auth server SDK | Blocked |
| Validation | Runtime contracts | Fastify schema or one approved library | Decision required |
| Database | ORM/migrations | Prisma Client/CLI and PostgreSQL support | Blocked |
| Google | OAuth/YouTube | Official library or validated native HTTP | Decision required |
| Encryption | AEAD/KMS | Node crypto plus approved KMS SDK | Blocked |
| Storage | Video objects | Approved storage SDK | Blocked |
| Jobs | Scheduling/claims | Approved queue or PostgreSQL implementation | Blocked |
| Observability | Metrics/tracing | Approved existing/new stack | Blocked |
| Testing | Integration support | Minimal approved utilities | Decision required |

For each dependency: confirm root/lockfile and exact version; review ownership, maintenance, license, provenance, scripts, and transitives; install only for the current slice; inspect manifest/lockfile; audit; run typecheck/lint/tests/build; record evidence. Do not batch unrelated dependencies.

## 17. Database Integration

After the Document 12 gate opens, create only approved Prisma schema/migrations, one shared client lifecycle, startup/shutdown integration, transactional repository boundaries, and isolated integration tests. Prisma types do not enter public contracts. Prove empty creation and upgrade. Health output must not reveal database topology or versions.

## 18. Credential Service

After Documents 12–13 gates open, implement the sole plaintext-token boundary. It verifies authority/status, reconstructs authenticated context, decrypts with the approved provider, refreshes under a per-connection lock, preserves omitted refresh tokens, atomically replaces envelopes, maps revocation, and exposes operations rather than token export.

## 19. Google/YouTube Adapter

The `YouTubeGateway` owns authorization URLs, code exchange, refresh, revocation, channel identity/permissions, resumable upload, metadata/publication, status queries, validation, and error normalization.

It uses the exact callback/minimum scopes, HTTPS, fixed hosts, timeout/cancellation, no automatic code-exchange retry, explicit unknown outcomes, and no provider objects outside the adapter. A deterministic fake must pass first.

## 20. Workers

Workers are independently startable/stoppable and use validated config, dedicated identity, bounded concurrency, atomic claims, expiring leases, optional heartbeat, idempotency, bounded backoff with jitter, retry/permanent classification, terminal handling, graceful shutdown, safe telemetry, and identifier-only payloads.

Do not create a single all-purpose worker without evidence and approval.

## 21. HTTP Rules

Document 15 freezes exact APIs. Routes use stable resource naming/versioning, boundary validation, one safe error envelope, correct `401/403/404/409/422/429/500` semantics, asynchronous status resources for long work, and honored idempotency on retryable state changes. Never return Prisma or Google objects directly.

## 22. Tests

- Unit: transitions, policies, retry rules, crypto context, serializers, time.
- HTTP: auth, validation, ownership, errors, CORS/headers, request IDs, idempotency, plugin order.
- Database: migrations, constraints, transactions, atomic state/idempotency, concurrency, leases, credential exclusion.
- Provider contracts: OAuth success/denial/replay/expiry, refresh/revocation/scopes/timeouts/malformed responses, upload interruption/retry/unknown outcomes, publication/sync.
- Security: cross-user denial, redaction, tamper/key errors, redirect/SSRF/rate limits, artifact inspection.
- Workers: controlled-clock claims, leases, retries, duplicate delivery, shutdown, terminal states.

## 23. Incremental Implementation

0. Restore foundation health; no feature code.
1. Freeze authenticated-user, domain, error, repository, and gateway contracts.
2. Implement approved authentication.
3. Add approved database lifecycle and migrations.
4. Add OAuth-state protection, credential envelope, and owner-scoped repositories.
5. Implement OAuth routes/use cases with a deterministic fake provider.
6. Implement and mock-test the live YouTube adapter; staging only after authorization.
7. Add listing, permission verification, reconnect, and disconnect.
8. Add video storage/upload/resumable sessions/jobs without scheduling.
9. Add publication and scheduling with time, cancellation, idempotency, and recovery tests.
10. Add status synchronization, cleanup, metrics, alerts, quota/outage/recovery controls.

After each increment: focused and full tests, typecheck, lint, production build, leakage review, progress evidence, rollback boundary, and disabled incomplete UI.

## 24. Feature Flags

YouTube defaults disabled until release approval. Consider separate controls for OAuth starts, reading connections, uploading, scheduling, and sync workers. Flags are not authorization controls. Names/provider require Documents 09–10 approval.

## 25. Existing-File Policy

- `app.ts`: composition/registration only.
- `server.ts`: startup and approved resource lifecycle.
- `config/env.ts`: validated additive fields without value leakage.
- `lifecycle/shutdown.ts`: ordered cleanup.
- Existing tests: extend; never weaken safety assertions.
- Package files: approved dependencies only through npm.
- TypeScript/ESLint configs: only demonstrated needs.
- `dist/`: rebuild; never hand-edit.

## 26. Prohibited Patterns

No OAuth logic in routes; Prisma in domain/HTTP; raw database/provider objects in responses; plaintext-token export; full header/query logging; credentials in jobs; client IDs as authority; deep links as proof; automatic code-exchange retry; raw state/code persistence; workers without leases/idempotency; unrelated platforms; premature mock removal; monolithic implementation; or weakened tests.

## 27. Foundation Verification Gate

- [x] Diagnose the recorded timeout contradiction and the two controlling Document 00 timeout cases (`YT-EVID-20260827-002`).
- [x] All backend tests pass for the `YT-TASK-B01` candidate: 16 passed, 0 failed/skipped.
- [x] Typecheck, lint, and production build pass for the `YT-TASK-B01` candidate.
- [ ] Health output remains non-sensitive.
- [ ] Unknown routes use stable errors.
- [ ] Shutdown completes within its bound.
- [ ] Redaction, CORS, and headers remain verified.
- [ ] Package boundary/lockfile are confirmed.
- [ ] No unrelated changes are made.

Current status: **`YT-TASK-B01` verified; broader foundation verification remains assigned to `YT-TASK-B02` and no feature implementation is authorized.**

## 28. Implementation Gate

- [ ] Foundation gate passes.
- [ ] Documents 07–10 are finalized for the increment.
- [x] Documents 12–14 are approved documentation baselines.
- [ ] Authentication provider and exact dependencies are approved.
- [ ] Database/security gates open.
- [ ] Environment/secrets owners are assigned.
- [ ] The increment has explicit authorization, tests, and rollback plan.

## 29. Decisions Requiring Approval

| ID | Decision | Recommendation | Status |
|---|---|---|---|
| YT-BE-DEC-001 | Authentication | Planned Clerk integration after confirmation | Requires approval |
| YT-BE-DEC-002 | Runtime validation | One Fastify-integrated schema system | Requires approval |
| YT-BE-DEC-003 | ORM/database | Prisma/PostgreSQL per Document 12 | Requires approval |
| YT-BE-DEC-004 | Google transport | Official library or validated native HTTP | Requires approval |
| YT-BE-DEC-005 | Encryption | Node crypto plus approved KMS SDK | Requires approval |
| YT-BE-DEC-006 | Jobs | PostgreSQL claims or approved queue | Blocked |
| YT-BE-DEC-007 | Video storage | Approved infrastructure decision | Blocked |
| YT-BE-DEC-008 | Observability | Approved platform/minimal dependency | Blocked |
| YT-BE-DEC-009 | Feature flags | Environment or approved service | Requires approval |
| YT-BE-DEC-010 | Worker model | Independent processes/shared use cases | Requires approval |
| YT-BE-DEC-011 | API version/base path | Finalize in Document 15 | Requires approval |
| YT-BE-DEC-012 | Current timeouts | Diagnose before feature work | Blocked |

## 30. Progress Record

Every increment records its stable number/name, exact scope/files, prerequisites, dependencies/versions, migrations, tests, verification outputs, security evidence, limitations, rollback, reviewer, and date. File existence alone never means completion.

## 31. Acceptance Criteria

- [x] Existing and missing backend work are separated.
- [x] Current test failures are recorded without invented diagnosis.
- [x] Further work is blocked until the foundation passes.
- [x] Target structure, responsibilities, ports, dependency direction, and plugin order are defined.
- [x] Authentication is server-derived and credentials stay inside their service.
- [x] Database/provider/storage/workers stay behind interfaces.
- [x] Dependency stages and incremental implementation are defined.
- [x] Workers require claims, leases, idempotency, and shutdown.
- [x] Existing mocks remain until verified replacement.
- [x] YouTube-only scope is enforced.
- [x] No implementation or dependencies changed while creating this baseline.
- [ ] Foundation and implementation gates pass.

## 32. Approval Record

- [x] User approved adding this documentation baseline on 2026-08-26.
- [x] Approval does not authorize code, dependencies, database, OAuth, Google, or workers.
- [ ] Foundation verification gate is open.
- [ ] Backend implementation gate is open.

## 33. Prerequisites

- `07-system-architecture-and-service-boundaries.md`
- `08-domain-model-state-machines-and-api-contracts.md`
- `09-technology-stack-dependencies-and-installation-order.md`
- `10-environments-hosting-urls-and-secret-ownership.md`
- `12-database-design-collections-relations-and-migrations.md`
- `13-security-model-token-encryption-and-threat-controls.md`

Prompt-only prerequisites keep dependent implementation choices provisional.

## 34. Next Document

Proceed to `15-backend-api-endpoints-and-error-contract.md`, which must define exact YouTube REST endpoints, authentication, request/response schemas, pagination, idempotency, redirects, statuses, and public errors before route implementation.

No feature code begins until Section 27 passes and the relevant increment receives explicit authorization.

## 35. Change Log

| Version | Date | Change | Approval |
|---|---|---|---|
| 0.1.0 | 2026-08-26 | Initial draft after repository verification | Superseded by approved baseline |
| 1.0.0 | 2026-08-26 | Approved documentation baseline added; implementation remains blocked | User approved |
| 1.0.1 | 2026-08-27 | Reconciled the earlier three-timeout snapshot with Document 00's controlling two-timeout baseline; recorded `YT-TASK-B01` cold-start diagnosis and passing focused/full backend evidence without changing behavior | User authorized `YT-TASK-B01`; no feature work authorized |
