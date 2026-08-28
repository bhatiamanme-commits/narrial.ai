# YouTube Connection Module — Deployment, Environment Variables, and Release Runbook

## Document Control

| Field | Value |
|---|---|
| Document number | 27 |
| Filename | `27-deployment-environment-variables-and-release-runbook.md` |
| Module | YouTube Connection only |
| Stage | Stage 13 — Deployment preparation |
| Status | Approved documentation baseline — no deployment or release authorized |
| Version | 1.0.0 |
| Date | 2026-08-26 |
| Purpose | Specify environment variables, secret injection, migrations, workers, staging and production deployments, feature flags, rollback, backup, restore, and credential promotion |
| Earlier dependencies | Documents 10–16 and 21–26 |
| Deployment order | Staging first; production requires all security, compliance, observability, test, backup, and approval gates |
| Next document | `28-progress-tracker-implementation-checkpoints-and-evidence.md` |

## 1. Purpose

This document is the deployment and operational release contract for the YouTube Connection module. It defines how an immutable release candidate moves through configuration validation, database migration, API and worker deployment, staging verification, production deployment with the feature disabled, controlled enablement, monitoring, rollback or forward recovery, backup/restore verification, and evidence capture.

This document does not perform a deployment, provision infrastructure, create a database, install dependencies, create Google credentials, inject secrets, run migrations, enable production users, or authorize a release.

## 2. Scope and Non-Scope

Included:

- Local, development, CI, staging, and production configuration boundaries for YouTube Connection.
- Backend, worker, database, job/queue, storage, authentication, Google OAuth/YouTube API, encryption, observability, quota, and feature-control deployment requirements.
- Environment-variable schema, secret references, validation, rotation, and credential promotion.
- Build artifacts, CI/CD quality gates, migrations, backup/restore, rollout, rollback, incident handoff, and post-deployment verification.

Excluded:

- Other social-platform integrations.
- Real secret values, selected vendor consoles, final domains, regions, hosting providers, or commands not already approved in Documents 03, 09, and 10.
- Big-bang enablement, automatic destructive database rollback, production data seeding, or live tests that upload to users’ channels.
- Treating deployment success as feature-release success.

## 3. Release Principles

1. **Build once, promote the same immutable artifact.** Environment-specific configuration is injected at runtime, not baked into rebuilt source bundles.
2. **Separate deployment from release.** Code may be deployed with YouTube Connection disabled; feature flags control exposure only after verification.
3. **Staging precedes production.** The full staging gate must pass on the release candidate before production deployment approval.
4. **Production starts disabled.** API mutations, OAuth initiation, upload, scheduling, and workers remain gated until smoke and operational checks pass.
5. **Migrations are expand/contract.** Backward-compatible schema changes land before code depends on them; destructive cleanup waits until all old code/jobs are gone and rollback windows close.
6. **Secrets never travel with artifacts.** Runtime identities fetch environment-specific secrets through approved stores.
7. **Workers are first-class deployment units.** Version compatibility, leases, draining, schedules, retries, and rollback are planned explicitly.
8. **Every release is observable and reversible.** Dashboards, alerts, runbooks, kill switches, and a validated rollback/forward-fix path exist before enablement.
9. **No evidence, no promotion.** A green pipeline without retained test, migration, security, and staging evidence does not authorize production.

## 4. Prerequisite Gates

### 4.1 Before staging deployment

- Documents 10–16 and 21–27 have no unresolved staging-blocking decisions.
- Approved staging hosting, regions, URLs, database, jobs, storage, keys, telemetry, and Google project/client exist under named organizational ownership.
- Document 12 migration is reviewed, tested from empty/current supported versions, and paired with backup/restore evidence.
- Document 13 security/token controls and Document 25 observability gate pass in the deployment candidate.
- Document 26’s required local/CI suites pass for the exact immutable artifact.
- Staging OAuth callback and app-return URLs exactly match Document 10 and Google Cloud configuration in Document 11.
- Staging has synthetic users, organization-controlled YouTube test channels, quota budget, cleanup owner, and no production data.

### 4.2 Before production deployment

- Staging deployment and complete Stage 12 matrix pass on the candidate.
- Documents 24–26 security, privacy, compliance, quota, observability, support, and verification sign-offs are complete.
- Production Google project/OAuth verification/audit status supports the approved release behavior.
- Backup was created and restore tested within the approved recency; encryption key compatibility is proven.
- Production environment/configuration/secret references are reviewed by two authorized people without exposing values.
- Rollback, forward-fix, credential-revocation, quota-exhaustion, provider-outage, and unintended-publication runbooks are ready.
- Release commander, migration owner, operations observer, security contact, support contact, and rollback authority are named.

### 4.3 Before production user enablement

- Production deployment is healthy with the feature and mutation workers disabled.
- Migrations, API/worker versions, queues, telemetry, alerts, backups, OAuth URLs, quotas, and policy pages pass the non-destructive verification in Sections 31–32.
- Canary audience, observation duration, advance/hold/rollback thresholds, and user communication are explicitly approved.

## 5. Environment Isolation Matrix

| Environment | Purpose | Google identity | Data | Release behavior |
|---|---|---|---|---|
| Local | Developer implementation | Fake by default; approved developer OAuth only when necessary | Synthetic/disposable | No production access |
| CI | Automated verification | Provider fake; staging secrets only in trusted gated jobs | Ephemeral synthetic | Never deploys production directly from untrusted code |
| Development | Shared integration | Dedicated development project/client | Synthetic/test | Unstable; no real users |
| Staging | Release-candidate validation | Dedicated staging project/client and test users/channels | Synthetic organization-controlled | Mirrors production topology; deploy first |
| Production | Approved user service | Dedicated production project/client | Real approved user data | Deploy disabled, then controlled rollout |

Every environment uses distinct database, storage, queue/job namespace, runtime identity, encryption keys, Google project/client, callback URLs, telemetry dataset, feature flags, quotas/budgets, and backups. Production secrets cannot be copied downward; staging data cannot be promoted as production data.

## 6. Configuration Classification

| Class | Examples | Storage/exposure rule |
|---|---|---|
| Public client configuration | Public API base URL, approved app scheme, non-secret feature-display values | May enter client bundle only after review |
| Backend non-secret configuration | Environment name, port, bounded timeouts, safe route paths, feature defaults | Runtime environment/config service; may be logged only through allowlist |
| Sensitive configuration | Internal service URLs, project/tenant identifiers, quota budgets, storage bucket names | Restricted configuration store; do not expose to clients |
| Secret | Client secret, database credential, auth verification secret, storage/job/telemetry credential | Approved secret manager; runtime injection only |
| Cryptographic key reference | KMS key resource/version map, digest-key reference | Configuration may contain opaque reference; key material never in environment text |
| Operational control | Kill switches, rollout audience, worker concurrency, quota reserve | Audited flag/config service with validation and owner |

An environment variable name does not make a value safe. Values are classified by content and impact.

## 7. Environment Variable Naming and Schema Rules

- Use uppercase `YOUTUBE_` names for module-specific settings and established project-wide names for shared infrastructure.
- One canonical name per setting; aliases and fallback chains require a migration plan.
- Parse and validate configuration once at process startup through a typed schema. Reject unknown critical combinations and fail closed.
- Requiredness may depend on role and feature state: API, worker, migration job, and frontend do not receive the same variables.
- Boolean values accept explicit canonical strings only; durations include a documented unit; URLs require HTTPS outside approved local development.
- Lists are parsed from a documented format, trimmed, deduplicated, and bounded.
- Secrets are references or runtime-mounted values; never committed examples with realistic data.
- `.env.example` contains names, safe placeholders, classification, role, and comments—never values or production identifiers.
- Configuration dumps, startup errors, health endpoints, build logs, crash reports, and telemetry must redact secret/sensitive values.

## 8. Canonical Shared Runtime Variables

Final names must be reconciled with existing repository conventions before implementation.

| Proposed name | Class | Consumer | Purpose/validation |
|---|---|---|---|
| `NODE_ENV` | Non-secret | API/worker/jobs | Approved runtime mode; never sole authorization boundary |
| `APP_ENV` | Non-secret | All server roles | Exact environment identity: local/development/ci/staging/production |
| `APP_RELEASE_VERSION` | Non-secret | All | Immutable artifact/version for telemetry and compatibility |
| `API_HOST` | Non-secret | API | Bind address approved by hosting topology |
| `API_PORT` | Non-secret | API | Integer within valid port range |
| `PUBLIC_API_BASE_URL` | Public/sensitive by environment | Frontend/server | Absolute approved HTTPS URL outside local |
| `CORS_ALLOWED_ORIGINS` | Sensitive config | API | Exact allowlist; wildcard prohibited for authenticated production APIs |
| `TRUSTED_PROXY_HOPS` | Sensitive config | API | Matches deployed proxy topology; prevents spoofed client context |
| `DATABASE_URL_SECRET_REF` | Secret reference | API/worker/migration | Reference to environment-specific database credential, not raw URL where platform supports references |
| `AUTH_VERIFIER_SECRET_REF` | Secret reference | API | Approved Narrial authentication verifier material/reference |
| `CLOCK_SKEW_SECONDS` | Non-secret | API/worker | Approved bounded OAuth/token time tolerance |

Raw names already mandated by selected providers may replace proposed names only after Document 03 records the decision.

## 9. Google OAuth and YouTube Variables

| Proposed name | Class | Consumer | Rule |
|---|---|---|---|
| `YOUTUBE_GOOGLE_PROJECT_ID` | Sensitive config | API/ops | Environment-specific project identity; never used as authorization proof |
| `YOUTUBE_OAUTH_CLIENT_ID` | Public/sensitive config | Backend; frontend only if approved flow needs it | Must match exact environment client |
| `YOUTUBE_OAUTH_CLIENT_SECRET_REF` | Secret reference | API only | Backend-only; absent from frontend/worker unless explicitly required |
| `YOUTUBE_OAUTH_CALLBACK_URL` | Sensitive config | API | Exact absolute HTTPS callback registered in Google Cloud |
| `YOUTUBE_APP_RETURN_ALLOWLIST` | Sensitive config | API | Exact approved app/web return targets; no arbitrary client URL |
| `YOUTUBE_OAUTH_SCOPES` | Sensitive config | API | Exact approved ordered/canonical scope set; startup checks against release manifest |
| `YOUTUBE_OAUTH_STATE_TTL_SECONDS` | Non-secret | API | Approved bounded state lifetime |
| `YOUTUBE_OAUTH_STATE_DIGEST_KEY_REF` | Secret/key reference | API | Separate per environment; raw key never logged/stored in source |
| `YOUTUBE_PROVIDER_TIMEOUT_MS` | Non-secret | API/worker | Bounded by operation class; exact values approved from tests |
| `YOUTUBE_PROVIDER_USER_AGENT` | Non-secret | API/worker | Accurate application/release identification where supported |
| `YOUTUBE_QUOTA_DAILY_BUDGET` | Sensitive operational config | API/worker/quota tracker | Does not exceed verified project allocation |
| `YOUTUBE_QUOTA_RESERVE_UNITS` | Sensitive operational config | API/worker | Protects approved critical work; audited changes |
| `YOUTUBE_QUOTA_TIMEZONE` | Non-secret | quota tracker | Current authoritative provider reset convention; do not infer local timezone |

Startup must verify that callback URL, client ID/project, scopes, feature flags, public URLs, and `APP_ENV` form an approved environment tuple. Mismatch makes OAuth initiation unready.

## 10. Credential Encryption and Key Variables

| Proposed name | Class | Consumer | Rule |
|---|---|---|---|
| `YOUTUBE_TOKEN_KEY_PROVIDER` | Non-secret | API/authorized worker | Approved KMS/HSM/envelope provider identifier |
| `YOUTUBE_TOKEN_ACTIVE_KEY_VERSION` | Sensitive config/reference | Token service | Version used for new encryption |
| `YOUTUBE_TOKEN_DECRYPT_KEY_VERSIONS` | Sensitive references | Token service | Bounded approved compatibility set during rotation |
| `YOUTUBE_TOKEN_AAD_CONTEXT` | Non-secret | Token service | Stable versioned context, never user input |
| `YOUTUBE_TOKEN_REFRESH_LOCK_TTL_MS` | Non-secret | API/worker | Approved refresh concurrency/fencing duration |

Only the narrow token service/runtime identity receives decrypt permission. Migration, frontend, general support, build, and unrelated workers do not. Key material is never exported into ordinary variables when managed cryptography can operate by reference.

## 11. Storage, Upload, Job, and Worker Variables

| Proposed name | Class | Consumer | Rule |
|---|---|---|---|
| `YOUTUBE_SOURCE_STORAGE_BUCKET` | Sensitive config | API/upload worker/cleanup | Dedicated environment bucket/container |
| `YOUTUBE_SOURCE_STORAGE_REGION` | Sensitive config | Ops/runtime | Matches approved residency/topology |
| `YOUTUBE_SOURCE_MAX_BYTES` | Non-secret | API/frontend/worker | One approved server-authoritative limit; frontend mirrors only for UX |
| `YOUTUBE_UPLOAD_CHUNK_BYTES` | Non-secret | Upload worker | Provider-valid and performance-tested |
| `YOUTUBE_UPLOAD_MAX_CONCURRENCY` | Operational config | Upload worker | Capacity/quota tested; bounded |
| `YOUTUBE_JOB_QUEUE_NAME` | Sensitive config | API/workers | Environment-prefixed immutable namespace |
| `YOUTUBE_WORKER_ROLE` | Non-secret | Worker | Allowlisted worker capability set |
| `YOUTUBE_WORKER_CONCURRENCY` | Operational config | Worker | Approved per role; never unbounded |
| `YOUTUBE_JOB_LEASE_SECONDS` | Non-secret | Worker | Longer than safe unit with heartbeat/fencing design |
| `YOUTUBE_JOB_HEARTBEAT_SECONDS` | Non-secret | Worker | Strictly below lease duration |
| `YOUTUBE_JOB_MAX_ATTEMPTS` | Operational config | Worker | Per approved error/operation policy, not one blind global rule |
| `YOUTUBE_SCHEDULER_ENABLED` | Operational control | Scheduler | Off during initial deployment/rollback until authorized |
| `YOUTUBE_SYNC_ENABLED` | Operational control | Sync worker | Separate from OAuth/upload flags |
| `YOUTUBE_CLEANUP_ENABLED` | Operational control | Cleanup worker | Enable only after dry-run/ownership verification |

Queue payloads contain internal IDs, version/generation, and safe correlation context only—never credentials, metadata bodies, signed URLs, or raw provider responses.

## 12. Observability and Support Variables

| Proposed name | Class | Consumer | Rule |
|---|---|---|---|
| `OTEL_SERVICE_NAME` | Non-secret | API/worker | Bounded role-specific service name |
| `OTEL_EXPORTER_ENDPOINT` | Sensitive config | API/worker/collector | Environment-specific approved endpoint |
| `OTEL_EXPORTER_AUTH_SECRET_REF` | Secret reference | Runtime/collector | Not exposed to frontend or logs |
| `YOUTUBE_LOG_LEVEL` | Operational config | API/worker | Production debug prohibited by default; changes time-bound/audited |
| `YOUTUBE_TRACE_SAMPLE_RATE` | Operational config | API/worker | Validated bounded value; privacy/cost approved |
| `YOUTUBE_SUPPORT_DIAGNOSTICS_ENABLED` | Operational control | API/support service | Off until access/audit gate passes |
| `YOUTUBE_HEALTH_DETAIL_MODE` | Non-secret | API/worker | Public minimal vs restricted detail; no secret output |

Telemetry variables may follow vendor-required names after approval, but the access, redaction, retention, and environment-isolation rules from Document 25 remain mandatory.

## 13. Feature Flags and Kill Switches

Minimum independently controlled flags:

| Flag | Controls | Safe disabled behavior |
|---|---|---|
| `youtubeConnectionRead` | Display/list safe existing connection state | UI shows temporarily unavailable; no mutations |
| `youtubeOAuthConnect` | New OAuth initiation/callback completion | Existing reads remain; clear unavailable message |
| `youtubeUploadCreate` | New upload/source intents | Existing status remains visible |
| `youtubeImmediatePublish` | New immediate publication mutations | Upload/status can continue as approved |
| `youtubeSchedulingCreate` | Create/reschedule schedules | Existing schedules remain visible |
| `youtubeSchedulerExecute` | Execute due publication work | Work remains durable/deferred and alerts on deadlines |
| `youtubeStatusSync` | Background/manual YouTube reconciliation | Show last-checked/stale state |
| `youtubeRetries` | Automatic retry dispatch | Preserve attempt state for manual recovery |
| `youtubeCleanupDeletion` | Approved cleanup/deletion jobs | Disabling requires deadline alert/escalation |
| `youtubeSupportDiagnostics` | Privileged support lookup | Normal user/API flow unaffected |

Rules:

- Server-side flags are authoritative; frontend flags only control presentation.
- Flags are environment-specific, default off on missing/invalid configuration, and evaluated fail-closed for mutations.
- Each flag has owner, purpose, dependencies, rollout audience, creation date, expiry/cleanup date, audit, and tested on/off behavior.
- Avoid nested combinations. Validate forbidden combinations at startup/config change.
- A kill switch stops new effects but does not discard durable work. Runbook defines pause, drain, cancel, reconcile, and user communication.
- Privacy deletion/revocation controls cannot be disabled without incident escalation and a deadline-preserving alternate process.

## 14. Secret Injection and Runtime Identity

1. CI/build uses no staging or production runtime secrets.
2. Deployment platform assigns a least-privilege environment/service identity to API, each worker role, migrations, and operators.
3. Runtime retrieves secrets from the approved environment-specific secret manager through short-lived identity where supported.
4. Secrets are mounted/injected only into consumers that need them; frontend bundles, source maps, build artifacts, images, manifests, previews, test reports, and logs are scanned for leakage.
5. Secret references and versions are validated at startup without logging values.
6. Rotation supports overlap where required, then revokes old material and verifies no consumer still depends on it.
7. Break-glass access is time-limited, MFA-protected, reason-bound, approved, and audited.
8. Suspected exposure invokes immediate containment, rotation/revocation, telemetry review, and incident handling from Documents 13, 24, and 25.

## 15. Configuration Manifest and Preflight

Each release contains a non-secret configuration manifest declaring:

- Release version/image digest/source commit/build provenance and dependency lock hash.
- Supported database schema range and worker/job message versions.
- Required variable names by service role, schema version, classification, and whether secret-reference resolution is mandatory.
- Expected OAuth scopes, callback path, feature-flag schema, provider operation set, encryption key-version compatibility, and migration IDs.
- Health/readiness endpoints, telemetry schema version, and runbook/dashboard references.

Preflight validates presence, types, cross-field constraints, environment isolation, URLs, scope set, key references, database compatibility, queue namespace, storage region, and flag dependencies. It never prints secret values. Failed preflight prevents readiness and deployment promotion.

## 16. Build and Artifact Requirements

- Use the approved lockfile and pinned runtime/toolchain from Document 09.
- CI performs clean install, lint/format policy, type checking, unit/contract/integration/migration/security tests, and production build using repository-defined commands.
- Generate dependency inventory/SBOM and vulnerability/license results under approved tooling.
- Produce immutable, content-addressed, signed/attested artifacts where platform support is approved.
- Build once without environment secrets. Promote the same artifact to staging and production.
- Record source commit, review approvals, CI run, artifact digest, build time, and provenance.
- Protect release branches/tags and deployment workflows; no local-machine production builds.
- Expired/vulnerable artifacts cannot be promoted merely because an older pipeline was green.

## 17. CI/CD Pipeline Stages

1. **Source gate:** branch protection, required review, change-scope detection, secret scan.
2. **Static gate:** formatting/lint, type checks, dependency/config/schema validation.
3. **Test gate:** Document 26 small/medium suites with ephemeral infrastructure.
4. **Build gate:** immutable API/frontend/worker/migration artifacts and provenance.
5. **Security gate:** dependency/container/artifact/config/IaC scans and approved exception check.
6. **Staging deploy:** manual or protected automated promotion using staging identity.
7. **Staging verify:** migrations, probes, fake and selected real-provider tests, observability, backup/restore, device checks.
8. **Production approval:** named human approvals and evidence review.
9. **Production deploy disabled:** expand migration, API, workers paused/limited, feature flags off.
10. **Production smoke:** non-destructive verification and telemetry baseline.
11. **Controlled release:** approved internal/canary stages with hold/advance/rollback decisions.
12. **Post-release:** monitor, reconcile, finalize evidence, remove expired flags after stable rollout.

Untrusted pull requests cannot access deployment identities or external-provider secrets. Production requires protected environment approval and cannot be triggered by documentation-only approval.

## 18. Database Migration Strategy

Use expand/migrate/contract:

1. **Expand:** add nullable columns/tables/indexes/constraints compatible with current API/workers.
2. **Deploy compatible writers/readers:** dual-read/write only when explicitly designed and tested.
3. **Backfill:** bounded, resumable, observable, rate-limited, idempotent job with checkpoint and cancellation.
4. **Verify:** counts, constraints, ownership, encryption versions, query plans, and application behavior.
5. **Switch:** enable new read/write path behind an audited control.
6. **Contract:** remove old fields/indexes only in a later release after rollback window and old worker/job compatibility end.

Migration requirements:

- One migration owner; advisory/locking behavior prevents concurrent application.
- Preflight confirms exact current schema, expected migration chain, backup recency, free capacity, duration estimate, and application compatibility.
- Migration runs as a dedicated least-privilege job, not independently from every API replica.
- Large indexes/backfills use the selected engine’s safe online/concurrent method where verified.
- Schema migration never calls Google/YouTube or decrypts tokens unless a separately reviewed credential-migration procedure requires it.
- Record start/end, migration ID/checksum, actor, result, row counts/categories, and safe error evidence.
- Destructive down migration is not the default rollback. Prefer application rollback compatible with expanded schema or a tested forward fix.

## 19. Database Creation Timing

- Local/development database creation remains governed by approved Document 12 and occurs before backend persistence implementation.
- Staging database is provisioned only after Documents 10–13 and staging infrastructure/security approval; migrations run during staging deployment preparation.
- Production database is provisioned/configured before the first production deployment, after region, owner, encryption, access, backup, retention, and restoration decisions are approved.
- Production schema is created only by the protected migration identity and reviewed migration artifact—not an interactive developer account.
- Seed only required non-user configuration through idempotent reviewed scripts. Never seed OAuth tokens, real channels, or media.

## 20. Backup and Restore Requirements

- Define and approve RPO, RTO, backup frequency, retention, region, encryption, immutability, access, and deletion behavior before production.
- Back up database, required job state, configuration/flag history, and audit evidence according to approved classification. Do not back up ephemeral source/upload artifacts beyond their approved purpose.
- Token ciphertext may exist in database backups only if approved; key access is separate, version-compatible, and tightly controlled.
- A backup without a tested restore is not accepted evidence.
- Restore drills use isolated infrastructure and synthetic or approved minimized data, validate schema/app/worker/key compatibility, counts/integrity, schedules, idempotency, and deletion obligations.
- Restored stale schedules/workers remain paused until reconciliation prevents unintended publication.
- Account/deletion tombstones or equivalent safeguards prevent restored data from reappearing as active.
- Record restore duration, recovery point, failures, corrective actions, and named approval.

## 21. Worker Deployment and Compatibility

- Version worker messages and payload schemas; consumers tolerate the approved compatibility window.
- Deploy code that can read old/new messages before producers emit new versions.
- Stop claiming new work, drain bounded active work, renew/finish leases safely, then replace workers.
- Long uploads and scheduled publication deadlines require a deployment-specific drain policy; forced termination relies on persisted checkpoints and fencing.
- Worker startup checks database schema range, queue namespace, role, key references, flags, clock, and telemetry.
- Stale workers cannot mutate after lease/generation loss.
- Scheduler, upload, sync, retry, and cleanup workers have independent concurrency and kill switches.
- Rolling back code does not replay acknowledged work or erase dead-letter/reconciliation records.
- Before enablement, inspect due backlog, oldest age, active leases, dead letters, quota reserve, and version distribution.

## 22. Credential Promotion Strategy

Credentials are never copied or “promoted” between environments. Promotion means creating/validating equivalent environment-specific configuration and proving it against the promoted artifact.

### 22.1 Google credentials

- Development, staging, and production use distinct Google Cloud projects and OAuth clients where Documents 10–11 require.
- Production client ID/secret are created and owned in the production project, stored directly in production secret management, and never exposed to developers or staging.
- Authorized redirect URIs, origins, consent configuration, scopes, domains, verification/audit status, support contacts, and quota are validated before enablement.
- Rotating the client secret uses staged update, callback/exchange smoke test, old-secret revocation, and audit evidence. Existing refresh-token impact is evaluated rather than assumed.

### 22.2 Encryption keys and other secrets

- Create environment-specific keys; never export staging key material into production.
- Add new decrypt-compatible version, deploy readers, switch active encryption version, rewrap/re-encrypt through approved bounded process, verify, then retire old version.
- Database, auth, storage, queue, observability, deployment, and backup credentials follow separate rotation runbooks and least-privilege identities.

## 23. Frontend and Mobile Release Considerations

- Public frontend configuration contains no client secret, refresh/access token, private storage/job/telemetry credential, or server key.
- API base URL, app scheme/universal/app links, OAuth browser return, and allowed origins match the environment manifest.
- Mobile binary compatibility is considered before backend contract removal because installed clients update slowly.
- Backend changes remain additive through the approved client-support window.
- Store/test distribution builds point only to their intended environments; debug menus cannot switch production users to privileged endpoints.
- Deep-link association files/domains, TLS, browser return, cold start, backgrounding, and app version behavior pass Document 26’s device matrix.
- Over-the-air updates, if used, obey approved runtime/version compatibility and rollback policy; they cannot change native capabilities incompatibly.

## 24. Staging Deployment Runbook

### 24.1 Prepare

1. Name release commander, migration owner, verifier, and rollback authority.
2. Freeze candidate artifact digest; attach CI/test/security/provenance evidence.
3. Review change set, schema/message versions, flags, configuration diff, secret-reference versions, quota budget, provider/test-asset plan, and known risks.
4. Confirm latest valid backup and isolated restore evidence.
5. Confirm dashboards/alerts/runbooks and maintenance communication.

### 24.2 Deploy

1. Set mutation and execution flags off; pause applicable workers.
2. Run non-secret configuration and secret-reference preflight.
3. Apply approved expand migration once through migration identity.
4. Verify schema/checksum and database health.
5. Deploy API with feature off; verify startup/readiness/build identity.
6. Deploy workers paused or with claiming disabled; verify version/queue/schema compatibility.
7. Enable safe reads, then worker roles and mutations in dependency order.

### 24.3 Verify

1. Run non-destructive smoke and Document 26 staging matrix.
2. Verify OAuth/callback, channel discovery, small resumable upload, publication/scheduling, sync, retry/reconnect, disconnect/revocation, and cleanup using approved test assets.
3. Confirm database/outbox/jobs/state, no duplicate effects, quota accounting, redaction, audit, traces, dashboards, and alerts.
4. Exercise rollback/kill switch and restore/reconciliation procedures as approved.
5. Record results, artifacts, defects, cleanup, and promote/hold decision.

Staging failure blocks production. Fixes create a new immutable candidate and repeat affected plus regression gates.

## 25. Production Deployment Runbook

### 25.1 Authorization

1. Verify all Section 4 production prerequisites and Section 38 sign-offs.
2. Confirm exact candidate digest matches staging evidence.
3. Confirm change window, staffing, support communication, provider/quota status, backups, rollback target, and incident channel.
4. Capture configuration/flag/secret-reference diff without values.

### 25.2 Deploy disabled

1. Keep all new OAuth/mutation/execution flags off.
2. Run production preflight using protected identity.
3. Apply expand-only migration and verify.
4. Deploy API; confirm liveness/readiness, release version, database compatibility, telemetry, and baseline error/latency.
5. Deploy workers with claims disabled; confirm heartbeat, schema/message/key/queue compatibility.
6. Perform non-destructive health, authorization-denial, database, queue, secret-reference, and telemetry smoke tests.

### 25.3 Controlled enablement

1. Enable internal/approved canary reads and connection flow only.
2. Observe for the approved window; compare SLO/error/latency, OAuth completion, refresh, provider, quota, audit, and support signals.
3. Enable upload/immediate publication for the approved audience only after connection evidence passes.
4. Enable scheduling workers only after due-work, leases, clock, quota reserve, and rollback controls pass.
5. Enable synchronization/retries/cleanup in approved order and concurrency.
6. Advance audience stages only on documented human decision; hold or rollback automatically/manually at approved thresholds.
7. Reconcile all workflows and remote effects at each stage.

Exact audience percentages and observation durations are **TBD — Requires approval based on traffic, risk, and support coverage**. Generic example percentages are not production decisions.

## 26. Release Advance, Hold, and Rollback Criteria

Advance only when:

- Required SLOs/error budgets remain within approved thresholds.
- No new critical/high defect, security/privacy signal, data-integrity anomaly, duplicate/unintended publication, or deletion deadline risk exists.
- OAuth, upload, schedule, sync, quota, worker, database, and telemetry indicators match staging/baseline within approved tolerance.
- Support volume and user recovery remain within capacity.

Hold when evidence is incomplete, metrics are inconclusive, provider behavior is unstable, cleanup/backlog grows, or a medium-risk issue needs diagnosis.

Disable flags and/or rollback immediately under approved authority for credential exposure, cross-tenant access, unintended public publication, corrupt/lost state, duplicate remote effects, incompatible migration/message behavior, broad workflow outage, observability blindness, or policy/deletion risk. Exact numeric thresholds require Section 37 approval.

## 27. Rollback Strategy

Rollback layers, from fastest/lowest change to broader:

1. Stop rollout and disable the affected server-authoritative feature flag.
2. Pause the responsible worker/scheduler while preserving durable jobs.
3. Reduce concurrency/disable retries or sync under approved runbook.
4. Route traffic to the previous compatible artifact or redeploy its immutable digest.
5. Apply a tested forward database fix; restore only for confirmed data corruption/loss under incident command.

Rollback rules:

- Never reverse a migration destructively just to match old code unless specifically tested and authorized.
- Confirm previous artifact supports current expanded schema and message versions before deployment.
- Disabling does not cancel or erase schedules automatically; inspect and reconcile pending/possibly completed remote effects.
- Google/YouTube side effects are not rolled back by deploying old code. Reconcile using persisted idempotency and provider identifiers.
- Preserve evidence, audit rollback actor/reason/version/flags, notify stakeholders, and verify health, backlog, quota, security, and user state after rollback.

## 28. Restore and Disaster-Recovery Runbook

1. Declare incident and select approved recovery point/target environment.
2. Quiesce writes and all YouTube-effecting workers; capture pending work and remote-effect uncertainty.
3. Validate exact restore target to prevent overwriting the wrong environment.
4. Restore encrypted backup with least-privilege recovery identity and compatible key versions.
5. Apply only approved forward migrations needed for candidate compatibility.
6. Verify integrity, ownership, counts, idempotency, audit chain, deletion markers, schedules, outbox/jobs, and credential decryptability through synthetic checks.
7. Reconcile Google/YouTube state before enabling publication/upload/sync workers.
8. Resume reads, then narrowly enable writes/workers in dependency order.
9. Measure actual RPO/RTO, record lost/replayed work and user communication, and create corrective actions.

Restore must not resurrect deleted/revoked credentials or execute overdue/stale schedules without the approved missed-job and reconciliation policy.

## 29. Configuration and Secret Rotation Runbook

For every change:

1. Identify owner, reason, affected environments/services, classification, compatibility window, and rollback.
2. Add new secret/key/config version without removing the old compatible one.
3. Validate references and deploy consumers that understand both versions.
4. Switch active producer/use to new version behind audited change control.
5. Verify OAuth, decrypt/encrypt, database, queue, storage, telemetry, or other affected behavior.
6. Revoke/remove old version after all consumers and rollback windows are clear.
7. Audit completion and scan for stale references.

Emergency exposure skips waiting periods but not validation, containment, audit, or post-incident review.

## 30. Deployment Observability

Create a release dashboard annotated with artifact, migration, flag, worker, and configuration changes. Monitor:

- API request/error/duration and readiness by release version.
- OAuth funnel, callback/exchange/refresh/reconnect outcomes.
- Upload/publication/schedule/sync success, latency, unknown outcomes, backlog, lateness, dead letters.
- Database pools/locks/errors, queue age, worker versions/leases/restarts.
- Google/YouTube latency/error categories and quota budget/reserve.
- Token decrypt/refresh failures, security/privacy/deletion alerts.
- Telemetry export/delivery, redaction alarms, support references and incident volume.

Deployment events must be queryable by `APP_RELEASE_VERSION` without using user/resource IDs as metric labels.

## 31. Post-Deployment Smoke Checks

With mutation flags off:

- Artifact/version, configuration schema, migration version, API/worker compatibility, liveness/readiness, database, queue, storage, key references, and telemetry are healthy.
- Public/error/health endpoints reveal no secrets or internals.
- Authentication rejection and ownership boundaries behave correctly using synthetic approved identities.
- Callback URL, OAuth consent metadata, policy/support/deletion pages, TLS, DNS, and deep-link association resolve as configured without completing an unauthorized production flow.
- Dashboards receive release data and every critical alert-delivery path is healthy.
- Backups continue and the newest backup is visible to the authorized owner.

After controlled enablement, run only approved canary journeys with organization-owned production test assets if policy permits. Never use a customer channel for smoke testing.

## 32. Post-Release Monitoring and Handoff

- Release commander stays assigned through the approved observation window.
- Record advance/hold/rollback decision at each rollout stage with dashboard evidence.
- Support receives user-facing status, known issues, recovery steps, and escalation path without credentials/internal payloads.
- Review schedules due during the window, upload/sync backlog, quota forecast, cleanup/deletion deadlines, and remote artifacts.
- Reconcile candidate-created side effects and close staging/production test cleanup ledger.
- After stable full rollout, remove obsolete compatibility code/flags only through a later tested change.
- Conduct release review and update runbooks, thresholds, environment manifest, and decision register.

## 33. Deployment Failure Scenarios

| Failure | Required response |
|---|---|
| Configuration/preflight mismatch | Stop before readiness; correct through reviewed config change |
| Migration fails before commit | Keep old code; inspect engine state; follow migration recovery plan |
| Migration partially/ambiguously applies | Freeze deploy; verify schema/checksum; forward-fix under migration owner |
| New API unhealthy | Keep flags off; route/redeploy previous compatible artifact |
| Worker version mismatch | Disable claiming; preserve queue; deploy compatible consumer |
| OAuth callback mismatch | Disable new connection; preserve existing safe reads; correct console/config together |
| Token decrypt failure | Disable privileged effects; verify key references; never rotate blindly |
| Queue/backlog growth | Pause producers or scale within approved bounds; protect deadlines/quota |
| Provider outage/quota exhaustion | Defer per Documents 23–24; do not redeploy as a guessed fix |
| Telemetry blindness | Halt rollout; use independent health/evidence; restore observability |
| Unintended/duplicate remote effect | Kill affected mutation; preserve evidence; reconcile provider/local state |
| Backup/restore check fails | Block production enablement; repair and retest |

## 34. Security and Privacy Deployment Controls

- Scan source, history as approved, artifacts, frontend bundles/source maps, manifests, logs, test reports, and images for secrets.
- Verify least-privilege identities and network routes for API, migrations, worker roles, support, telemetry, database, storage, and backups.
- Enforce TLS, exact CORS/origins, trusted proxy settings, security headers, upload/file limits, rate limits, and administrative access controls.
- Verify encryption at rest/in transit, key version, token redaction, audit append, retention/deletion jobs, and vendor regions.
- Production debug routes, API explorers containing credentials, verbose body/header logging, public buckets/queues/databases, and default credentials are prohibited.
- Validate public privacy/terms/deletion/support disclosures and Google revocation method before users.
- Run approved dependency, artifact, configuration, and vulnerability gates; unresolved critical/high findings block release.

## 35. Release Evidence Package

Retain an access-controlled, integrity-protected record containing:

- Release ID, source commit, immutable artifact digests, provenance, dependency lock/SBOM, CI results, reviews, and approvals.
- Non-secret environment/configuration schema and diff, feature flags, secret/key reference versions, and owners.
- Database backup reference, restore evidence, migration IDs/checksums/results, schema compatibility, and backfill evidence.
- API/worker deployment versions/times, health/readiness, staging and production smoke results.
- Document 26 test report, security/privacy/compliance reviews, Google project verification/audit status, quota readiness.
- Dashboard/alert/runbook links, rollout stage decisions, incidents/defects/exceptions, rollback evidence if used.
- Remote test-artifact cleanup and final post-release reconciliation.

The package contains no secret values, tokens, raw provider payloads, user content, or unnecessary personal data.

## 36. Environment Variable Verification Checklist

- [ ] Canonical names match repository conventions and the typed configuration schema.
- [ ] Each variable has class, owner, consumer, environment, source, validation, rotation, and redaction rule.
- [ ] Required variables differ correctly by API, worker role, migration, frontend, and CI.
- [ ] Production and staging references/projects/URLs/queues/storage/telemetry cannot cross.
- [ ] Frontend artifact contains public configuration only.
- [ ] Missing/invalid values fail closed with redacted errors.
- [ ] Callback URL, return allowlist, scopes, project/client, environment, and flags form an approved tuple.
- [ ] Key versions support the deployed credential ciphertext.
- [ ] Durations/concurrency/limits/quotas use approved units and bounds.
- [ ] No secret value appears in files, commands, CI output, artifact metadata, health, logs, or evidence.

## 37. Decisions Requiring Approval

| ID | Decision | Recommended direction | Blocks |
|---|---|---|---|
| `YT-DEP-DEC-001` | Staging/production hosts, regions, topology | Match Document 10 approved isolation/residency | Provisioning |
| `YT-DEP-DEC-002` | CI/CD platform and protected environments | Workload identity, immutable promotion, human production approval | Pipeline |
| `YT-DEP-DEC-003` | Secret manager and injection mechanism | Runtime short-lived identity; no build secrets | Configuration |
| `YT-DEP-DEC-004` | Canonical environment-variable names/schema | Reconcile proposed names with existing repo conventions | Implementation |
| `YT-DEP-DEC-005` | Feature-flag service/storage and audience model | Server-authoritative, audited, fail-closed | Controlled release |
| `YT-DEP-DEC-006` | Migration execution/locking/backfill strategy | Dedicated protected job; expand/contract | Production schema |
| `YT-DEP-DEC-007` | Backup RPO/RTO/frequency/retention/region | Evidence-based and restore-tested | Production gate |
| `YT-DEP-DEC-008` | API/worker rollout and drain strategy | Compatible rolling deploy with independent worker controls | Deployment |
| `YT-DEP-DEC-009` | Rollout stages, audience, duration, thresholds | Small internal/canary stages based on SLOs/risk | User enablement |
| `YT-DEP-DEC-010` | Rollback authority and automatic triggers | Named human authority plus immediate safety kill switches | Release |
| `YT-DEP-DEC-011` | Mobile client support/OTA compatibility window | Additive backend until supported clients age out | Contract cleanup |
| `YT-DEP-DEC-012` | Google production credential creation/ownership/rotation | Separate project/client; two-person review | OAuth production |
| `YT-DEP-DEC-013` | Release window/on-call/support coverage | Deploy only with required owners available | Scheduling |
| `YT-DEP-DEC-014` | Evidence/backup/deployment-log retention | Minimized, access-controlled, policy-approved | Operations |

Record approvals and rejected alternatives in Document 03. Record package/tool changes in Document 09 and concrete environment values/owners in Document 10. Never put secret values in those documents.

## 38. Deployment Acceptance Criteria

### Staging deployment accepted only when

- [ ] Immutable artifact passes CI and Document 26 applicable gates.
- [ ] Environment isolation/configuration/secret references validate without leakage.
- [ ] Backup, migration, API, workers, flags, health, telemetry, alerts, and restore/recovery tests pass.
- [ ] Approved real Google/YouTube staging journeys and cleanup pass.
- [ ] Rollback/kill-switch procedure is exercised and evidence retained.

### Production deployment accepted only when

- [ ] All security, privacy, compliance, quota, observability, testing, and production approvals are complete.
- [ ] Exact staging-tested artifact digest is promoted.
- [ ] Backup/restore and expand migration are verified; previous artifact remains schema/message compatible.
- [ ] API and workers deploy healthy with mutation/execution flags off.
- [ ] Non-destructive smoke and deployment telemetry show no blocking regression.

### Production release accepted only when

- [ ] Named authority approves each rollout stage using measured thresholds.
- [ ] Critical journeys, quotas, queues, schedules, sync freshness, security/privacy deadlines, support, and telemetry remain healthy.
- [ ] No critical/high defect, credential leak, cross-tenant access, data corruption, unintended/duplicate publication, or deletion risk exists.
- [ ] Reconciliation and test-artifact cleanup complete.
- [ ] Final evidence, handoff, flag cleanup plan, and sign-offs are recorded.

Failure at any gate triggers hold or rollback; deployment completion alone is never acceptance.

## 39. Sign-Off Record

| Approval | Named owner | Evidence | Decision/date | Status |
|---|---|---|---|---|
| Release candidate/code quality | Unassigned | Required | Required | Blocked |
| Environment/configuration/secrets | Unassigned | Required | Required | Blocked |
| Database migration/backup/restore | Unassigned | Required | Required | Blocked |
| API/worker/platform readiness | Unassigned | Required | Required | Blocked |
| Security/privacy/compliance | Unassigned | Required | Required | Blocked |
| Testing/observability/support | Unassigned | Required | Required | Blocked |
| Google OAuth/YouTube/quota readiness | Unassigned | Required | Required | Blocked |
| Staging deployment | Unassigned | Required | Required | Blocked |
| Production deployment | Unassigned | Required | Required | Blocked |
| Production user enablement | Unassigned | Required | Required | Blocked |

No AI agent may self-approve, inject secrets, run migrations, deploy, enable users, or claim evidence that was not observed.

## 40. Approval Record

Approval to add this document approves only the documentation baseline. It does not approve infrastructure, vendors, domains, regions, environment values, dependencies, credentials, database creation/migration, backups, CI/CD changes, staging or production deployment, feature enablement, remote uploads, or release.

## 41. Prerequisites and Next Document

Prerequisites:

- `10-environments-hosting-urls-and-secret-ownership.md`
- `11-google-cloud-console-and-youtube-api-setup.md`
- `12-database-design-collections-relations-and-migrations.md`
- `13-security-model-token-encryption-and-threat-controls.md`
- `14-backend-foundation-and-implementation-structure.md`
- `15-backend-api-endpoints-and-error-contract.md`
- `16-oauth-connection-callback-and-token-lifecycle.md`
- `21-scheduled-publishing-workers-and-timezones.md`
- `22-video-status-synchronization-and-display.md`
- `23-errors-retries-reconnection-and-recovery.md`
- `24-security-privacy-quota-and-compliance-operations.md`
- `25-observability-auditing-monitoring-and-support.md`
- `26-testing-strategy-fixtures-and-verification-matrix.md`

Next: `28-progress-tracker-implementation-checkpoints-and-evidence.md`, the living record for documentation maturity, approvals, implementation checkpoints, evidence, blockers, and next actions.

## 42. Change Log

| Version | Date | Change | Approval |
|---|---|---|---|
| 1.0.0 | 2026-08-26 | Initial deployment, environment-variable, migration, worker, release, rollback, backup/restore, and credential-promotion runbook generated and added at user request | User approved document creation only |
