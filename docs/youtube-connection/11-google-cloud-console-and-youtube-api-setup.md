# YouTube Connection Module — Google Cloud Console and YouTube API Setup

## Document Control

| Field | Value |
|---|---|
| Document number | 11 |
| Filename | `11-google-cloud-console-and-youtube-api-setup.md` |
| Module | YouTube Connection |
| Stage | Stage 4 — External-service setup |
| Status | Approved documentation baseline — external setup not authorized |
| Version | 0.1.0 |
| Last updated | 2026-08-26 |
| Prerequisites | Documents 05, 06, and 10 |
| Next document | `12-database-design-collections-relations-and-migrations.md` |
| Intended audience | Product owner, backend engineer, security reviewer, Google Cloud owner, operations owner, future AI agents |
| Source-of-truth role | Controls Google Cloud, Google OAuth, and YouTube Data API configuration for this module |
| Contains secret values | No |

## 1. Purpose

This document defines how Narrial must configure Google Cloud, Google Auth Platform, OAuth 2.0 credentials, the YouTube Data API, application scopes, test users, callback URLs, quota monitoring, verification evidence, and production-readiness controls.

It defines the setup procedure and approval gates. It does not create a Google Cloud project, enable an API, create OAuth credentials, store a client secret, install a Google SDK, implement OAuth, approve production access, or authorize an external configuration change.

Real setup may begin only after the prerequisite documents and the relevant setup gate in this document are approved.

## 2. Module Boundary

This document applies only to the YouTube Connection module. It must not configure OAuth scopes, APIs, credentials, or consent-screen behavior for another provider. Only Google services directly required for approved YouTube functionality may be enabled.

## 3. Prerequisite Readiness

| Document | Required contribution | Current repository content | Readiness |
|---|---|---|---|
| Document 05 | Approved functional requirements and business rules | Generation prompt rather than completed requirements | Blocked |
| Document 06 | Approved security, reliability, privacy, quota, and quality requirements | Generation prompt rather than completed NFRs | Blocked |
| Document 10 | Exact environments, callbacks, return links, owners, regions, and secret boundaries | Generation prompt rather than completed infrastructure decisions | Blocked |

Consequently, no callback URL, Google Cloud owner, production domain, support contact, policy URL, final OAuth scope set, project identifier, or secret-management destination is approved. This document can define the procedure, but Google Cloud configuration remains blocked.

## 4. Official Platform Facts

The following facts were verified against current official documentation on 2026-08-26:

1. The YouTube Data API requires a Google Cloud project, enabled YouTube Data API v3 service, and OAuth 2.0 for private user data. [YouTube Data API overview](https://developers.google.com/youtube/v3/getting-started)
2. A backend web-server OAuth flow is appropriate when the application securely retains confidential credentials and accesses APIs after the user leaves. [YouTube server-side OAuth guide](https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps)
3. The OAuth redirect URI must exactly match a registered URI, including scheme, case, path, and trailing slash. [Google web-server OAuth guide](https://developers.google.com/identity/protocols/oauth2/web-server)
4. Google recommends separate testing and production projects; production clients must not contain developer-only or pre-release redirects. [Google OAuth production-readiness guidance](https://developers.google.com/identity/protocols/oauth2/production-readiness/policy-compliance)
5. Testing applications are restricted to configured test users, and testing authorizations may expire seven days after consent. [Google Auth Platform audience guidance](https://support.google.com/cloud/answer/15549945)
6. Public production applications requesting sensitive or restricted scopes may require verification. [Google OAuth policy compliance](https://developers.google.com/identity/protocols/oauth2/production-readiness/policy-compliance)
7. A production OAuth application requires a public home page on a verified owned domain. [Google app-homepage guidance](https://support.google.com/cloud/answer/13807376)
8. Ordinary creator channels generally require user OAuth rather than a normal service account. [YouTube OAuth authorization guide](https://developers.google.com/youtube/v3/guides/authentication)
9. Offline access is required when access must continue while the user is absent; refresh tokens are not necessarily returned on every exchange. [Google web-server OAuth guide](https://developers.google.com/identity/protocols/oauth2/web-server)
10. Google recommends unique OAuth state, secure token storage, encryption at rest, and handling refresh-token invalidation or revocation. [Google OAuth best practices](https://developers.google.com/identity/protocols/oauth2/resources/best-practices)
11. `channels.list` with `mine=true` retrieves the authorized user’s channel. [YouTube channel implementation guide](https://developers.google.com/youtube/v3/guides/implementation/channels)
12. `videos.insert` supports `https://www.googleapis.com/auth/youtube.upload`; qualifying unverified projects may be restricted to private uploads pending audit. [YouTube `videos.insert` reference](https://developers.google.com/youtube/v3/docs/videos/insert)
13. Quotas and operation costs are project-controlled and subject to change. [YouTube quota overview](https://developers.google.com/youtube/v3/getting-started)

## 5. Environment Strategy

### 5.1 Required Google Cloud tiers

| Tier | Purpose | Google project | OAuth client | Audience |
|---|---|---|---|---|
| Local/automated tests | Deterministic development and tests | None by default | None | Provider fakes |
| Development | Optional controlled real-provider development | Separate non-production project if approved | Development web client | Approved developers/testers |
| Staging | Production-like OAuth and YouTube verification | Dedicated staging project | Staging web client | Approved staging test users |
| Production | Real users | Dedicated production project | Production web client | Approved production audience |

This model requires approval in Document 10.

### 5.2 Mandatory isolation

- Production and non-production OAuth clients must be separate.
- Production secrets must not enter lower environments.
- Staging must use a dedicated test channel.
- Automated tests must not use production credentials.
- Quota usage must be observable per environment.
- Production consent configuration must not include developer-only URLs.
- The backend selects environment-specific credentials.
- Tokens issued for one environment must not authorize another.

## 6. Required Owners

| Owner ID | Role | Responsibility | Current status |
|---|---|---|---|
| YT-GCP-OWNER-001 | Google Cloud project owner | Project creation and IAM | Requires assignment |
| YT-GCP-OWNER-002 | OAuth configuration owner | Branding, audience, data access, and clients | Requires assignment |
| YT-GCP-OWNER-003 | Domain-verification owner | Authorized-domain verification | Requires assignment |
| YT-GCP-OWNER-004 | Privacy/compliance owner | Disclosures and policy statements | Requires assignment |
| YT-GCP-OWNER-005 | Quota owner | Usage monitoring and quota requests | Requires assignment |
| YT-GCP-OWNER-006 | Secret custodian | OAuth secret storage and rotation | Requires assignment |
| YT-GCP-OWNER-007 | Deployment owner | Runtime environment integration | Requires assignment |
| YT-GCP-OWNER-008 | Incident owner | Credential and provider incidents | Requires assignment |

Names must be supplied by the user or project owner. An AI agent must not assign people.

## 7. Google Cloud Project Creation

Create or select projects only after approval.

### 7.1 Proposed names

- `Narrial YouTube Development`
- `Narrial YouTube Staging`
- `Narrial YouTube Production`

Actual project IDs must be unique, identify the environment, contain no credentials, and be recorded only as sanitized evidence.

### 7.2 Procedure

1. Sign in using an organization-controlled Google account.
2. Create or select the approved project.
3. Confirm the project name, environment, organization, and billing association.
4. Assign minimum IAM roles to named owners.
5. Remove unnecessary owners or editors.
6. Add relevant technical and operational contacts.
7. Record the sanitized project identifier, date, operator, reviewer, and approval reference.

### 7.3 IAM rules

- Prefer organization-controlled accounts.
- Avoid personal accounts as sole owners.
- Apply least privilege.
- Do not use shared passwords.
- Review access before production and after ownership changes.
- Record reviews without publishing sensitive account details.

## 8. Enable YouTube Data API v3

For each approved project:

1. Select the correct project.
2. Open the API Library.
3. Find and enable `YouTube Data API v3`.
4. Confirm it appears under enabled APIs.
5. Open the quota view.
6. Record sanitized quota availability.
7. Configure alerts only after quota policy approval.
8. Record configuration evidence.

Do not enable unrelated Google APIs speculatively.

## 9. Google Auth Platform Configuration

Google Auth Platform currently organizes OAuth configuration through Branding, Audience, Data Access, and Clients. Console labels may change; follow current official documentation and record material changes.

## 10. Branding Configuration

| Field | Required value | Current status |
|---|---|---|
| App name | Narrial-approved name | Requires approval |
| User support email | Organization-controlled support address | Requires approval |
| App logo | Approved Narrial logo | Requires approval |
| Application homepage | Public HTTPS page on an owned domain | Requires approval |
| Privacy-policy URL | Public HTTPS privacy policy | Requires approval |
| Terms-of-service URL | Public HTTPS terms page if provided | Requires approval |
| Authorized domains | Domains owned and verified by Narrial | Requires approval |
| Developer contact email | Monitored organization-controlled address | Requires approval |

Branding must accurately represent Narrial, avoid implying Google or YouTube ownership, use approved owned domains, and explain the application’s use of Google data. Branding changes may require renewed verification. See [Google OAuth branding guidance](https://support.google.com/cloud/answer/15549049).

## 11. Audience Configuration

### 11.1 Internal

Use only when the project belongs to a Google Workspace or Cloud Identity organization and all intended users belong to it. This must not be selected silently for a public creator product.

### 11.2 External

Use when Narrial supports ordinary external Google accounts.

For non-production Testing status:

- Add only approved test users.
- Expect Google testing restrictions and temporary authorization behavior.
- Do not represent the environment as production-ready.

For production, switch to In Production only after branding, data access, domains, disclosures, verification, security, and release approval are complete.

| Decision ID | Question | Proposed answer | Status |
|---|---|---|---|
| YT-GCP-DEC-001 | Who may authorize Narrial? | External Google-account users | Requires user approval |

## 12. Test Users and Test Channels

- Add only approved accounts as test users.
- Use a dedicated test channel.
- Do not use production creator channels for destructive tests.
- Keep test-user email addresses out of public evidence.
- Review and remove access regularly.
- Treat Testing authorizations as temporary.
- Document the seven-day Testing limitation in staging runbooks.

Staging must cover success, denial, cancellation, replay, missing channel/scope, refresh, revocation, reconnect, disconnect, upload, and applicable private-upload restrictions.

## 13. OAuth Scope Strategy

| Scope ID | Capability | Proposed Google scope | Status |
|---|---|---|---|
| YT-SCOPE-001 | Retrieve authorized channel identity | `https://www.googleapis.com/auth/youtube.readonly` | Proposed; requires approval |
| YT-SCOPE-002 | Upload videos | `https://www.googleapis.com/auth/youtube.upload` | Proposed; requires approval |
| YT-SCOPE-003 | Broader channel/video management | `https://www.googleapis.com/auth/youtube` | Not approved |
| YT-SCOPE-004 | Edit/delete videos, ratings, comments, and captions | `https://www.googleapis.com/auth/youtube.force-ssl` | Not approved |
| YT-SCOPE-005 | YouTube partner operations | Partner scopes | Out of scope |

Rules:

- Scopes are backend-owned configuration.
- The frontend cannot submit arbitrary scopes.
- Every scope requires a capability justification.
- Speculative scopes are prohibited.
- Granted scopes are checked after token exchange.
- Missing mandatory scopes prevent healthy connection status.
- Scope additions require decision, consent-impact, and verification review.
- Production consent configuration and authorization requests must agree.

## 14. OAuth Client Type

Proposed configuration:

- Application type: Web application.
- Flow: Backend web-server authorization code.
- Callback owner: Narrial backend.
- Secret owner: Backend secret boundary.
- Client secret in Expo: Prohibited.

Final approval depends on Documents 07, 09, and 10.

## 15. Create the OAuth Client

After approval:

1. Select the environment’s project.
2. Open Google Auth Platform → Clients.
3. Select Create Client.
4. Choose Web application.
5. Enter the approved environment-specific name.
6. Add only the exact backend callback.
7. Add JavaScript origins only for an approved web client.
8. Review project and environment.
9. Create the client.
10. Transfer the secret directly to the approved secret manager.
11. Do not paste it into docs, chat, issues, screenshots, or code.
12. Record sanitized metadata, owner, and rotation date.
13. Check all evidence for leakage.

## 16. Redirect URI Register

| Callback ID | Environment | Required form | Exact value | Status |
|---|---|---|---|---|
| YT-OAUTH-URL-LOCAL-001 | Local | Approved local or secured tunnel backend callback | TBD | Blocked by Document 10 |
| YT-OAUTH-URL-DEV-001 | Development | Exact HTTPS backend callback | TBD | Blocked by Document 10 |
| YT-OAUTH-URL-STAGE-001 | Staging | Exact HTTPS backend callback | TBD | Blocked by Document 10 |
| YT-OAUTH-URL-PROD-001 | Production | Exact HTTPS backend callback on owned domain | TBD | Blocked by Document 10 |

Conceptual pattern only:

```text
https://<approved-api-domain>/<approved-versioned-path>/youtube/oauth/callback
```

Scheme, host, path, case, port, and trailing slash must match. Wildcards and open redirects are prohibited. Callbacks terminate at the backend; authorization codes are never forwarded to the app.

## 17. Application Return Links

Backend return redirects must contain no access token, refresh token, authorization code, raw state, client secret, email address, raw provider error, or authoritative success claim. They trigger a frontend refetch. Exact destinations remain blocked by Document 10.

## 18. OAuth Authorization Parameters

| Parameter | Required behavior |
|---|---|
| `client_id` | Current backend environment |
| `redirect_uri` | Exact registered backend callback |
| `response_type` | Authorization-code flow |
| `scope` | Approved server-owned minimum set |
| `state` | Unique, non-guessable, transaction-bound value |
| `access_type` | `offline` when background refresh is required |
| `include_granted_scopes` | Proposed enabled; requires contract approval |
| `prompt` | Approved first-connect/reconnect strategy |
| `login_hint` | Optional; never identity authority |

`prompt=consent` must not be added blindly to every request.

## 19. Offline Access and Refresh Tokens

- Request offline access only after user intent for a feature needing it.
- Store refresh tokens only in the backend security boundary.
- Encrypt refresh tokens at rest.
- Preserve an existing valid refresh token when later exchanges omit one.
- Never expose tokens to the frontend.
- Handle invalid, expired, and revoked refresh tokens.
- Require reconnect when refresh authority is unavailable.
- Avoid repeated forced-consent prompts without user intent.
- Test refresh behavior without recording credentials.

## 20. Channel Verification Configuration

Proposed behavior:

- Method: `channels.list`.
- Authentication: OAuth access token.
- Selector: `mine=true`.
- Parts: minimum approved fields.
- Response: untrusted and validated.
- Required identity: stable YouTube channel ID.
- Optional metadata: title, handle when available, and safe thumbnail URL.

Callback or frontend data cannot establish channel identity. Empty, ambiguous, or malformed results must fail safely, and raw responses must not be stored wholesale.

## 21. Upload Configuration

When approved:

- Use `videos.insert`.
- Request only approved upload access.
- Use resumable uploads for production video transfer.
- Validate metadata before upload.
- Record quota usage.
- Keep transfer and processing success distinct.
- Do not assume an unverified project may publish publicly.
- Test with non-sensitive content and a dedicated channel.

Private-only restrictions for qualifying unverified projects are a release blocker for public or unlisted publication.

## 22. YouTube Upload Audit Requirement

Before non-private production publishing:

1. Determine whether the production project is restricted.
2. Review current YouTube API terms and policies.
3. Prepare the application for review.
4. Ensure implemented behavior matches declared use.
5. Submit the required audit or compliance request.
6. Retain sanitized evidence.
7. Do not claim public-publishing readiness until restrictions are confirmed lifted.
8. Revalidate after material changes.

## 23. OAuth Verification Readiness

Prepare accurate branding, verified domains, public home/privacy/terms pages, support and developer contacts, exact scopes and justifications, a working verification flow, reviewer instructions, restricted test-account handling, demonstration material if requested, data-use/deletion explanations, and proof that requested data supports disclosed features.

OAuth verification and the YouTube upload audit are separate gates.

## 24. Domain Verification

- Narrial must own domains used for home, privacy, terms, callback, and web origins.
- Ownership must be verified through the current approved Google mechanism.
- Prefer Narrial-owned production domains over shared provider domains.
- Restrict DNS access.
- Keep unrelated DNS secrets out of evidence.
- Domain changes trigger OAuth review.

## 25. Quota Configuration

For every project:

1. Open YouTube Data API quota settings.
2. Record current limits and upload limits.
3. Verify method costs from official documentation.
4. Map operations to user journeys.
5. Estimate usage from approved capacity assumptions.
6. Configure approved alerts.
7. Define warning and blocking thresholds.
8. Define graceful exhaustion behavior.
9. Assign an owner.
10. Record the quota-increase process.

Invalid calls may consume quota. Reverify exact costs and limits before implementation and release.

## 26. Quota Budget Register

| Operation | Purpose | Current official cost | Expected frequency | Daily estimate | Status |
|---|---|---:|---:|---:|---|
| `channels.list` | Verify channel identity | Requires final official verification | TBD | TBD | Requires capacity decision |
| `videos.insert` | Upload video | Requires final official verification | TBD | TBD | Requires upload approval |
| `videos.list` | Synchronize video state | Requires final official verification | TBD | TBD | Requires sync design |
| Token refresh | Refresh Google access | OAuth rather than YouTube quota | TBD | TBD | Requires connection volume |
| Other operation | Not authorized until documented | TBD | TBD | TBD | Blocked |

## 27. Secret Handling

| Secret ID | Secret | Environment | Storage | Owner | Status |
|---|---|---|---|---|---|
| YT-GCP-SECRET-001 | Development OAuth client secret | Development | Approved backend secret store | Unassigned | Blocked |
| YT-GCP-SECRET-002 | Staging OAuth client secret | Staging | Approved backend secret store | Unassigned | Blocked |
| YT-GCP-SECRET-003 | Production OAuth client secret | Production | Approved production secret store | Unassigned | Blocked |

Mandatory rules:

- Do not commit credential JSON.
- Do not store secrets in Expo or `EXPO_PUBLIC_*` variables.
- Do not place secrets in screenshots, issues, or AI conversations.
- Do not log secrets.
- Do not reuse secrets across environments.
- Rotate exposed secrets immediately.
- Record only sanitized secret metadata.

## 28. Proposed Environment Variables

Names remain proposed until Documents 09, 10, and 13 approve them.

| Variable | Classification | Consumer | Contains secret |
|---|---|---|---|
| `GOOGLE_OAUTH_CLIENT_ID` | Sensitive identifier | Backend | No, but restrict unnecessary disclosure |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Secret | Backend | Yes |
| `GOOGLE_OAUTH_CALLBACK_URL` | Non-secret environment configuration | Backend | No |
| `GOOGLE_OAUTH_REQUIRED_SCOPES` | Security-sensitive configuration | Backend | No |
| `GOOGLE_OAUTH_APP_RETURN_ALLOWLIST` | Security-sensitive configuration | Backend | No |
| `GOOGLE_OAUTH_ACCESS_TYPE` | Backend configuration | Backend | No |
| `YOUTUBE_API_ENABLED` | Feature control | Backend | No |
| `YOUTUBE_UPLOADS_ENABLED` | Feature control | Backend/worker | No |
| `YOUTUBE_SCHEDULING_ENABLED` | Feature control | Backend/worker | No |

Example files may contain placeholders only.

## 29. Configuration Evidence

Retain sanitized environment, project, OAuth client, callback, return, audience, publishing status, test-user status, enabled API, scopes, quota, branding, verification, upload-audit, owner, reviewer, date, and approval metadata. Review evidence for secret and personal-data leakage.

## 30. Setup Procedure

### Phase A — Approval preparation

- [ ] Complete and approve Documents 05, 06, and 10.
- [ ] Approve environment separation, owners, domains, callbacks, returns, scopes, secret storage, branding, policies, test users, and test channels.

### Phase B — Non-production project

- [ ] Create approved project and review IAM.
- [ ] Enable YouTube Data API v3.
- [ ] Configure branding, audience, testers, and Data Access.
- [ ] Create Web application OAuth client.
- [ ] Register exact staging callback.
- [ ] Store secret safely.
- [ ] Record sanitized evidence.

### Phase C — Staging verification

- [ ] Verify authorization URL, callback, consent, denial, cancellation, backend completion, channel discovery, refresh, revocation, reconnect, disconnect, leakage protections, Testing expiration behavior, and quota observation.

### Phase D — Production preparation

- [ ] Create separate production project.
- [ ] Enable only approved APIs.
- [ ] Configure branding and verified domains.
- [ ] Register production-only callbacks and scopes.
- [ ] Configure production secrets and quota monitoring.
- [ ] Prepare OAuth verification and upload audit.
- [ ] Deploy with sensitive feature flags disabled.
- [ ] Run controlled production smoke tests.
- [ ] Obtain go/no-go approval.

## 31. Verification Matrix

| Verification ID | Check | Required evidence |
|---|---|---|
| YT-GCP-VERIFY-001 | Correct project selected | Sanitized project record |
| YT-GCP-VERIFY-002 | YouTube API enabled | Sanitized API status |
| YT-GCP-VERIFY-003 | Audience configured | Sanitized status |
| YT-GCP-VERIFY-004 | Test users restricted | Restricted operational record |
| YT-GCP-VERIFY-005 | Scopes match approval | Scope comparison |
| YT-GCP-VERIFY-006 | Callback exact | Console/backend comparison |
| YT-GCP-VERIFY-007 | Web application client | Sanitized metadata |
| YT-GCP-VERIFY-008 | Secret outside repository | Secret-store metadata only |
| YT-GCP-VERIFY-009 | Authorization works | Staging result |
| YT-GCP-VERIFY-010 | Denial/cancellation work | Test result |
| YT-GCP-VERIFY-011 | State replay fails | Security result |
| YT-GCP-VERIFY-012 | Channel identity authoritative | Safe channel evidence |
| YT-GCP-VERIFY-013 | Refresh works | Redacted result |
| YT-GCP-VERIFY-014 | Disconnect removes local authority | Redacted result |
| YT-GCP-VERIFY-015 | Quota visible | Sanitized evidence |
| YT-GCP-VERIFY-016 | No credential leakage | Artifact scan |
| YT-GCP-VERIFY-017 | Domains verified | Sanitized evidence |
| YT-GCP-VERIFY-018 | OAuth verification complete | Provider status |
| YT-GCP-VERIFY-019 | Upload audit complete if required | Provider status |

## 32. Failure and Recovery

| Failure | Required response |
|---|---|
| Wrong project | Stop and review resources |
| Wrong callback | Correct console and backend before testing |
| `redirect_uri_mismatch` | Compare exact scheme, host, port, path, case, and slash |
| Test user blocked | Verify audience and membership |
| Testing authorization expires | Reauthorize; do not misclassify as production behavior |
| Missing refresh token | Preserve an existing one or require approved reconnect |
| Missing scope | Mark connection insufficient; block publishing |
| Unverified warning | Confirm expected Testing status or complete verification |
| Upload remains private | Track project audit restriction |
| Quota exhausted | Stop unsafe retries and follow quota runbook |
| Secret exposed | Revoke/rotate and record an incident |
| Domain ownership lost | Disable authorization starts until corrected |
| Google outage | Preserve state and use bounded safe retries |

## 33. Prohibited Actions

- Adding real secrets to documentation.
- Committing OAuth credential JSON.
- Embedding client secrets in Expo.
- Using API keys for private user operations.
- Using ordinary service accounts for creator channels.
- Trusting the frontend as callback authority.
- Forwarding authorization codes to the app.
- Wildcard callbacks or arbitrary return URLs.
- Speculative broad scopes.
- Production credentials in staging.
- Production channels for destructive tests.
- Public publishing while private-only restrictions remain.
- Claiming provider verification without evidence.
- Automatically retrying authorization-code exchange.
- Logging raw token responses.

## 34. Decisions Requiring Approval

| Decision ID | Decision | Recommended direction | Blocking effect |
|---|---|---|---|
| YT-GCP-DEC-001 | Audience type | External for a public creator product | Consent configuration |
| YT-GCP-DEC-002 | Project separation | Separate staging and production | Project creation |
| YT-GCP-DEC-003 | Development live access | Prefer fakes plus staging | Development client |
| YT-GCP-DEC-004 | Exact callback URLs | Backend HTTPS callbacks | OAuth clients |
| YT-GCP-DEC-005 | Mobile return | Deep/app link used only for refetch | Return flow |
| YT-GCP-DEC-006 | Connection scope | Proposed `youtube.readonly` | Data Access |
| YT-GCP-DEC-007 | Upload scope | Proposed `youtube.upload` | Publishing |
| YT-GCP-DEC-008 | Broader scopes | Do not request initially | Broader operations |
| YT-GCP-DEC-009 | Offline access | Required for background work | Refresh strategy |
| YT-GCP-DEC-010 | Branding and contacts | Organization-owned public resources | Verification |
| YT-GCP-DEC-011 | Google owner | Must be assigned | All setup |
| YT-GCP-DEC-012 | Secret store | Select in Documents 10/13 | Credential creation |
| YT-GCP-DEC-013 | Staging testers/channel | Dedicated resources | Staging |
| YT-GCP-DEC-014 | Quota thresholds | Requires capacity assumptions | Alerts/rollout |
| YT-GCP-DEC-015 | Verification timing | Before public rollout | General availability |
| YT-GCP-DEC-016 | Upload audit | Before non-private publishing | Public/unlisted uploads |

## 35. Risks

| Risk ID | Risk | Impact | Required mitigation |
|---|---|---|---|
| YT-GCP-RISK-001 | Environment/client mismatch | Failed or unsafe authorization | Isolation and validation |
| YT-GCP-RISK-002 | Callback drift | OAuth failure | Exact URI register and tests |
| YT-GCP-RISK-003 | Scope creep | Verification/privacy risk | Minimum server-owned scopes |
| YT-GCP-RISK-004 | Testing tokens expire | Misleading failures | Document seven-day behavior |
| YT-GCP-RISK-005 | Refresh token omitted | Lost background authority | Preserve existing token |
| YT-GCP-RISK-006 | Secret leakage | Account/data compromise | Secret store, redaction, rotation |
| YT-GCP-RISK-007 | Upload restriction | Public publishing unavailable | Complete YouTube audit |
| YT-GCP-RISK-008 | Quota exhaustion | Feature outage | Budget, monitoring, backoff |
| YT-GCP-RISK-009 | Unowned domains | Verification failure | Owned verified domains |
| YT-GCP-RISK-010 | Environment mixing | Data/credential exposure | Strict isolation |
| YT-GCP-RISK-011 | Service-account misuse | No linked channel | User OAuth |
| YT-GCP-RISK-012 | Return spoofing | False connected UI | Backend refetch authority |

## 36. Acceptance Criteria

- [ ] `YT-GCP-AC-001` — Prerequisite statuses are accurate.
- [ ] `YT-GCP-AC-002` — Environment strategy is approved.
- [ ] `YT-GCP-AC-003` — Owners are assigned.
- [ ] `YT-GCP-AC-004` — Exact callbacks are approved.
- [ ] `YT-GCP-AC-005` — Return destinations are approved and allowlisted.
- [ ] `YT-GCP-AC-006` — Branding and policy values are approved.
- [ ] `YT-GCP-AC-007` — Minimum scopes are approved and justified.
- [ ] `YT-GCP-AC-008` — Offline access is approved.
- [ ] `YT-GCP-AC-009` — Test users and staging channel are approved.
- [ ] `YT-GCP-AC-010` — Secret storage and rotation are approved.
- [ ] `YT-GCP-AC-011` — Quota ownership is approved.
- [ ] `YT-GCP-AC-012` — OAuth verification requirements are recorded.
- [ ] `YT-GCP-AC-013` — Upload-audit restrictions are recorded.
- [ ] `YT-GCP-AC-014` — Evidence contains no secrets.
- [ ] `YT-GCP-AC-015` — No non-YouTube integration was introduced.
- [ ] `YT-GCP-AC-016` — External setup is explicitly authorized.

These criteria approve this setup specification, not Google Cloud configuration.

## 37. Setup Authorization Gate

Current status: **BLOCKED**

External setup may begin only when Documents 05, 06, and 10 contain approved final content; Section 34 blockers are resolved; owners, callbacks, returns, and secret storage are approved; and the user explicitly authorizes configuration.

Until then, do not create projects, enable APIs, create clients, add test users, register callbacks, or generate real secrets.

## 38. Document Completion Checklist

- [x] YouTube-only boundary defined.
- [x] Current prerequisite status documented.
- [x] Official facts sourced.
- [x] Environment separation proposed.
- [x] Project/API procedures documented.
- [x] Branding, audience, scopes, callbacks, refresh, channel verification, upload restrictions, verification, quota, secrets, failure recovery, and approvals documented.
- [ ] Prerequisite specifications approved.
- [ ] Exact environment values approved.
- [ ] Owners assigned.
- [ ] External setup authorized.
- [x] User approval recorded.

## 39. Prerequisites

Before this document becomes an approved setup authority, complete and approve:

- `05-functional-requirements-and-business-rules.md`
- `06-nonfunctional-requirements-and-quality-attributes.md`
- `10-environments-hosting-urls-and-secret-ownership.md`

## 40. Next Document

Continue with `12-database-design-collections-relations-and-migrations.md`, which defines persistence, relationships, constraints, indexes, encryption references, migrations, retention, and the development-database creation gate.

Approval of Document 11 does not automatically authorize Google Cloud setup or database creation.

## 41. Change Log

| Version | Date | Change | Author | Approval |
|---|---|---|---|---|
| 0.1.0 | 2026-08-26 | Initial complete document added as the approved documentation baseline; external setup remains blocked | AI documentation agent | Approved by user |
