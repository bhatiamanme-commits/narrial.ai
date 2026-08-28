# YouTube Connection Module — Product Vision and Final Result

## Document Control

| Field | Value |
|---|---|
| Document number | 01 |
| Filename | `01-product-vision-and-final-result.md` |
| Module | YouTube Connection only |
| Stage | Stage 1 — Product definition |
| Status | Approved product-vision baseline — unresolved decisions remain gated |
| Version | 1.0.0 |
| Last updated | 2026-08-26 |
| Prerequisite | `00-existing-work-and-current-state-audit.md` |
| Next document | `02-scope-non-scope-and-release-boundaries.md` |
| Intended audience | Product owners, designers, developers, testers, security reviewers, operations teams, and future AI agents |
| Source-of-truth role | Defines why the module exists and the required final product outcome |
| Implementation authorized | No |

---

## 1. Purpose

This document defines why Narrial is building the YouTube Connection module and what the completed production experience must accomplish.

It establishes:

- The user problem.
- The product value.
- The target users.
- The complete user-facing outcome.
- The required product capabilities.
- The required system outcomes.
- The principles that later design and implementation decisions must preserve.
- The decisions that still require user approval.
- The vision-level acceptance criteria.

This document does not select database technology, hosting providers, API routes, package versions, encryption algorithms, job queues, or detailed interface layouts. Those decisions belong to later documents.

Later documents may explain how the module will be implemented, but they must not silently change the approved product outcome defined here.

## 2. Relationship to the Current-State Audit

This document depends on `00-existing-work-and-current-state-audit.md`, which establishes the current repository reality.

### 2.1 Existing reusable work

The repository already contains:

- An Expo and React Native application.
- Expo Router navigation.
- Clerk-based frontend authentication.
- Interactive account-connection screens.
- Account selection and reconnection states.
- Publishing and scheduling screens.
- Loading, empty, error, expired, and disconnected interface states.
- Service boundaries that can later be connected to authenticated backend APIs.
- A Fastify backend safety foundation.
- Backend request identifiers, security headers, CORS handling, redacted logging, and stable error-response foundations.

These assets may be reused after they are reconciled with the approved YouTube-only requirements.

### 2.2 Existing partial work

The frontend authentication shell exists, but the backend does not currently authenticate or authorize Narrial users for YouTube operations.

The backend provides a health endpoint and HTTP safety features, but it does not provide YouTube connection, channel, upload, publishing, scheduling, or synchronization services.

### 2.3 Existing mocked work

The current frontend simulates:

- Connecting a YouTube account.
- Displaying a hardcoded YouTube channel.
- Selecting publishing destinations.
- Scheduling videos.
- Displaying published and scheduled content.
- Showing locally generated publishing states.

This behavior is useful for interface development but does not represent a real connection to Google or YouTube.

### 2.4 Missing production behavior

The repository does not yet contain a verified production implementation for:

- Google OAuth 2.0 authorization.
- OAuth callback processing.
- YouTube channel discovery.
- Secure Google token storage.
- Access-token refresh.
- Permission validation.
- Persistent account connections.
- YouTube video uploads.
- Immediate publication.
- Scheduled publication workers.
- YouTube processing-status synchronization.
- Reconnection and revocation handling.
- Durable database records.
- Production monitoring and deployment.

### 2.5 Current verification limitations

Document 00 records:

- Backend build, type-check, and lint success.
- Fourteen passing backend tests and two timeout failures.
- Passing frontend TypeScript checks.
- Twenty-nine passing focused frontend tests.
- Six frontend lint errors and two warnings.
- No completed browser, device, Google OAuth, YouTube API, database, staging, or production verification.

The final product vision therefore distinguishes planned production behavior from the current mock and partial implementation.

## 3. Product Problem

Narrial users can create and prepare video content, but they do not currently have a verified, persistent, and secure path for publishing that content directly to YouTube.

The current simulated connected state is insufficient because:

- It does not prove that Google authorized Narrial.
- It does not prove that a real YouTube channel was retrieved.
- It disappears when in-memory application state is lost.
- It cannot securely store or refresh Google credentials.
- It cannot upload videos to YouTube.
- It cannot execute scheduled publishing independently of the user’s device.
- It cannot confirm YouTube processing or publication status.
- It cannot reliably recover from revoked permissions or temporary failures.

Users need a trustworthy workflow that connects Narrial video creation to YouTube publication without requiring manual file transfer and repeated metadata entry.

Users must always be able to understand:

- Whether a YouTube channel is connected.
- Which channel is connected.
- Whether Narrial still has the required permissions.
- Whether a video is waiting, uploading, processing, scheduled, published, or failed.
- Whether retrying an operation is safe.
- Whether reconnection or another user action is required.

## 4. Why Narrial Is Building It

Narrial is building the YouTube Connection module to make YouTube publishing a secure and reliable continuation of the Narrial video workflow.

The module will provide value by:

- Reducing manual downloading and re-uploading of Narrial videos.
- Reducing repeated metadata entry.
- Allowing users to publish without leaving the Narrial workflow.
- Supporting immediate and future publication.
- Giving users reliable visibility into provider-side processing and failures.
- Preserving connection and publishing history across application restarts.
- Protecting OAuth credentials through backend-owned handling.
- Providing recovery when authorization or publication operations fail.
- Establishing an auditable foundation for production YouTube operations.

This document does not define revenue models, pricing, subscriptions, or integrations with other social platforms.

## 5. Target Users

### 5.1 Authenticated Narrial creator

A user who creates or manages video content in Narrial and has authority to connect a YouTube channel.

Expected outcome: securely connect an authorized channel and use it as a publishing destination.

### 5.2 First-time connection user

A user who has never connected a YouTube channel to Narrial.

Expected outcome: understand why Google authorization is required, complete consent, return to Narrial, and see a backend-verified channel.

### 5.3 Returning connected user

A user whose connection remains valid.

Expected outcome: see the same persisted channel after signing in again or restarting the application and continue publishing without reconnecting unnecessarily.

### 5.4 User with invalid authorization

A user whose permissions were revoked, whose refresh token is missing or unusable, or whose granted permissions no longer satisfy the required operation.

Expected outcome: receive a clear explanation and a safe reconnection action without losing unrelated publishing history.

### 5.5 Publishing user

A connected user preparing a video for YouTube.

Expected outcome: select an eligible video, provide valid YouTube metadata, select a connected channel, and publish immediately or schedule publication.

### 5.6 Monitoring user

A user who has already submitted a video.

Expected outcome: see a trustworthy status that distinguishes Narrial upload progress, YouTube processing, scheduling, publication, and failure.

### 5.7 User categories requiring approval

The following user models are not approved by this document:

- Organization-owned YouTube connections.
- Team-managed connections.
- Agency workflows.
- Shared Narrial workspaces.
- Role-based channel publishing.
- Multiple Narrial users administering the same connection.

These require explicit product and ownership decisions.

## 6. Product Vision Statement

The YouTube Connection module will allow an authenticated Narrial creator to securely authorize a YouTube channel, verify and manage that connection, upload Narrial videos, publish immediately or schedule publication, and monitor every important lifecycle state through a simple and recoverable experience.

Google credentials will remain under backend control. Narrial will present a connection as successful only after the backend verifies the OAuth result and retrieves the authorized YouTube channel.

The final experience will remain understandable when operations are delayed, interrupted, rejected, retried, or require renewed authorization.

## 7. Product Principles

### 7.1 Backend-verified truth

A browser redirect or mobile deep link does not prove that a channel was connected. Connection success requires backend verification and retrieval of the authorized YouTube channel.

### 7.2 Credentials remain backend-only

Google client secrets, authorization codes, access tokens, refresh tokens, and encrypted credential material must not appear in frontend state, public API responses, URLs, analytics, screenshots, or logs.

### 7.3 User-controlled authorization

Users must understand when they are leaving Narrial for Google authorization, why permission is needed, and how to cancel, reconnect, or disconnect.

### 7.4 Minimum necessary permission

Narrial must request only the Google and YouTube permissions required by the capabilities approved for the release.

### 7.5 Persistent and recoverable state

Connections, upload operations, schedules, publication records, and important status transitions must survive frontend and backend restarts.

### 7.6 Idempotent user actions

Repeated taps, callbacks, requests, retries, and worker executions must not unintentionally create duplicate connections, uploads, schedules, or publications.

### 7.7 Honest lifecycle status

Narrial must distinguish local preparation, queued work, file transfer, YouTube processing, scheduling, publication, failure, permission loss, and disconnection.

### 7.8 Security and privacy by default

Sensitive information must be protected in transit, at rest, in logs, in error responses, in monitoring systems, and in support workflows.

### 7.9 YouTube-only boundary

This module must not depend upon or design behavior for Instagram, TikTok, Facebook, LinkedIn, X, or another social platform.

### 7.10 Evidence before completion

A capability is complete only after its acceptance criteria have been tested and reproducible evidence has been recorded.

## 8. Complete End-to-End Experience

### 8.1 Entering the connection experience

An authenticated Narrial user opens the YouTube connection area.

Narrial displays either:

- A connect action when no channel is connected.
- Verified channel information when a healthy connection exists.
- A reconnect action when authorization is invalid.
- A temporary loading or service-error state when connection status cannot be retrieved.

### 8.2 Starting authorization

The user selects the connect action. Narrial confirms authentication, requests a backend-created authorization transaction, explains the Google transition, opens Google authorization, and shows a waiting state without assuming success.

### 8.3 Google authorization

Google handles account selection, consent, cancellation, denial, and provider-side authentication. Narrial never asks for or receives the user’s Google password.

### 8.4 Returning to Narrial

After Google redirects the user:

1. The backend validates the authorization transaction.
2. The backend exchanges the authorization code securely.
3. The backend retrieves the authorized YouTube channel.
4. The backend persists the verified connection.
5. The frontend requests the authoritative connection state.
6. The frontend displays success only after confirmation.

A client-supplied channel ID or success flag cannot establish connection success.

### 8.5 Cancellation or denial

If the user cancels or denies authorization, no successful connection is displayed, the temporary transaction closes or expires safely, the user receives a clear message, and retrying does not create duplicate records.

### 8.6 Connected channel management

A connected user can view safe channel information, including channel name, YouTube channel ID, handle and thumbnail when available, connection health, permission status, and whether reconnection is required.

The user can refresh connection status, reconnect, or intentionally disconnect.

### 8.7 Preparing a video

A user with a healthy connection can choose an eligible Narrial video, select the connected channel, provide required metadata, resolve validation errors, and choose immediate or scheduled publication when both modes are included in the approved release.

### 8.8 Uploading

After confirmation, Narrial creates a durable upload or publication operation, displays meaningful progress, supports approved interruption recovery, prevents unintended duplicates, and explains the effect of cancellation.

### 8.9 YouTube processing

Completing file transfer does not automatically mean that the video is ready or public. Narrial distinguishes transfer completion, receipt by YouTube, YouTube processing, scheduling, publication, rejection, restriction, deletion, and failure.

### 8.10 Immediate publication

For immediate publication, Narrial submits the approved video and metadata and displays the resulting YouTube state. Narrial does not claim success until provider evidence confirms the appropriate remote state.

### 8.11 Scheduled publication

For scheduled publication, the user selects a future date, time, and understood timezone. Narrial stores the schedule durably, backend workers execute it independently of the mobile application, and eligible schedules can be viewed, rescheduled, or cancelled under approved rules.

### 8.12 Monitoring and recovery

Users can return to Narrial to see the latest known status. If authorization becomes invalid, Narrial preserves allowed history, prevents unauthorized operations, explains the problem, supports reconnection, and avoids duplicate recovery work.

### 8.13 Intentional disconnection

When a user disconnects, Narrial confirms the consequences, prevents new publishing through that connection, makes stored credentials unusable according to the security policy, and applies approved rules to history and pending schedules.

## 9. Required User Capabilities

| ID | Capability | Requirement |
|---|---|---|
| `PV-CAP-001` | Start a YouTube connection from an authenticated Narrial session | Mandatory |
| `PV-CAP-002` | Understand the transition to Google account selection and consent | Mandatory |
| `PV-CAP-003` | Cancel or deny authorization without creating a connection | Mandatory |
| `PV-CAP-004` | Return to Narrial and see a verifying state while the backend confirms the result | Mandatory |
| `PV-CAP-005` | See connection success only after backend verification | Mandatory |
| `PV-CAP-006` | View the verified YouTube channel identity | Mandatory |
| `PV-CAP-007` | View connection health and permission status | Mandatory |
| `PV-CAP-008` | Refresh the connection status | Mandatory |
| `PV-CAP-009` | Reconnect after permission loss or unusable credentials | Mandatory |
| `PV-CAP-010` | Intentionally disconnect a channel | Mandatory |
| `PV-CAP-011` | Select a healthy connected channel as a publishing destination | Mandatory |
| `PV-CAP-012` | Select or provide an eligible video source | Mandatory; exact sources require approval |
| `PV-CAP-013` | Provide and validate required YouTube metadata | Mandatory; exact metadata requires approval |
| `PV-CAP-014` | Upload a video with understandable progress | Mandatory |
| `PV-CAP-015` | Cancel or recover an interrupted upload under defined rules | Mandatory |
| `PV-CAP-016` | Publish a video immediately | Requires release-boundary approval |
| `PV-CAP-017` | Schedule publication using an understood timezone | Requires release-boundary approval |
| `PV-CAP-018` | Reschedule an eligible scheduled publication | Requires approval |
| `PV-CAP-019` | Cancel an eligible scheduled publication | Requires approval |
| `PV-CAP-020` | Monitor upload, processing, scheduling, publication, and failure states | Mandatory |
| `PV-CAP-021` | Receive actionable errors that identify the appropriate next action | Mandatory |
| `PV-CAP-022` | Retry eligible operations without unintended duplication | Mandatory |
| `PV-CAP-023` | Retain accurate connection and publishing state after an application restart | Mandatory |
| `PV-CAP-024` | Retain accurate state after signing in on another supported device | Mandatory for approved supported clients |
| `PV-CAP-025` | See the effect of disconnection on pending and historical work | Mandatory; exact policy requires approval |

## 10. Required System Outcomes

| ID | Required outcome |
|---|---|
| `PV-SYS-001` | Every YouTube operation is associated with an authenticated Narrial user. |
| `PV-SYS-002` | OAuth authorization transactions resist tampering, replay, and cross-user substitution. |
| `PV-SYS-003` | Google credentials and authorization codes remain backend-only. |
| `PV-SYS-004` | Stored credential material is protected according to the approved security design. |
| `PV-SYS-005` | Existing refresh tokens are preserved when Google does not return a replacement. |
| `PV-SYS-006` | Expired access tokens can be refreshed safely when valid authorization remains. |
| `PV-SYS-007` | Revoked, missing, or unusable credentials result in a recoverable reconnection state. |
| `PV-SYS-008` | A verified connection belongs to the correct Narrial user and authorized YouTube channel. |
| `PV-SYS-009` | Repeated or delayed OAuth callbacks cannot create unintended duplicate connections. |
| `PV-SYS-010` | Upload, publication, and schedule operations are persisted durably. |
| `PV-SYS-011` | Retried API requests and worker executions are idempotent where duplication could cause harm. |
| `PV-SYS-012` | YouTube processing and publication states are synchronized into Narrial. |
| `PV-SYS-013` | Public responses expose only safe connection and publishing information. |
| `PV-SYS-014` | Logs, errors, analytics, and support evidence exclude secrets and credential material. |
| `PV-SYS-015` | YouTube API quota use is measured and managed. |
| `PV-SYS-016` | Operational failures are observable and diagnosable without exposing credentials. |
| `PV-SYS-017` | Scheduled work executes without requiring the user’s frontend application to remain open. |
| `PV-SYS-018` | Connection, upload, schedule, and publication status can be reconciled after service interruption. |

## 11. Final User Experience by State

| State | Meaning | Visible result | Available action |
|---|---|---|---|
| Not connected | No usable YouTube connection exists | Connect YouTube explanation and action | Connect |
| Preparing connection | Backend authorization transaction is being prepared | Loading state | Wait or cancel where safe |
| Waiting for Google | Google authorization is in progress | Authorization guidance | Complete or cancel Google flow |
| Returning | Narrial received navigation back from authorization | Return-in-progress state | Wait |
| Verifying connection | Backend is validating authorization and channel identity | Verification state | Wait or safely retry status |
| Connected and healthy | Authorization and channel identity are valid | Channel identity and healthy status | Publish, refresh, or disconnect |
| Insufficient permissions | Connection exists but required access is unavailable | Permission explanation | Reconnect |
| Access token expired but refreshable | Short-lived access expired but refresh is possible | Usually transparent recovery | Retry if automatic recovery fails |
| Refresh token unusable | Narrial cannot restore authorized access | Reconnection required | Reconnect |
| Permission revoked | Google authorization is no longer valid | Reconnect-required status | Reconnect |
| Disconnecting | Disconnect operation is being processed | Progress state | Wait |
| Disconnected | Credentials are unusable for new operations | Disconnected confirmation | Reconnect |
| Video ready | Video and required metadata are ready | Publication summary | Publish now or schedule |
| Upload queued | Durable operation exists but transfer has not started | Queued status | View or cancel when allowed |
| Uploading | Video bytes are being transferred | Progress and safe navigation guidance | Cancel when allowed |
| Upload interrupted | Transfer did not complete | Recoverable error | Resume or retry when eligible |
| Received by YouTube | Transfer completed and YouTube accepted the upload | Provider-received status | Monitor |
| YouTube processing | YouTube is processing the video | Processing status | Monitor |
| Scheduled | Publication is recorded for a future time | Date, time, timezone, and status | Reschedule or cancel if allowed |
| Rescheduling | A schedule update is being applied | Progress state | Wait |
| Schedule cancelled | Future publication was cancelled | Cancellation confirmation | Create a new schedule |
| Published | YouTube confirms the required published state | Published status and safe link when available | View or monitor |
| Publication failed | Publication could not complete | Actionable error | Retry, edit, or reconnect as applicable |
| Rejected or restricted | YouTube rejected or limited the video | Safe provider-derived explanation | Correct content/metadata or follow YouTube guidance |
| Temporary service failure | Narrial, Google, or YouTube is temporarily unavailable | Temporary error without false success | Retry later |
| Offline | Client cannot reach the backend | Offline state and retained safe local view | Reconnect network and refresh |
| Quota unavailable | Provider quota prevents the requested operation | Delayed or unavailable explanation | Retry when permitted |

Exact visual design and final interface copy will be defined later.

## 12. Final Result by System Area

### 12.1 Frontend

The final frontend will provide a YouTube-only connection entry point, secure transition to Google authorization, neutral verification state, verified channel identity, health and permission display, reconnect/refresh/disconnect actions, publishing selection, video and metadata validation, upload progress, approved publishing controls, persistent lifecycle states, accessible recovery states, and authenticated backend communication.

The frontend will never be authoritative for provider success or store Google credentials.

### 12.2 Backend API

The final backend will authenticate the Narrial user, enforce ownership, coordinate OAuth, retrieve channel information, protect credentials, validate publishing requests, coordinate uploads and schedules, prevent harmful duplicates, synchronize remote status, and return stable safe errors.

Exact endpoints and payloads belong to Documents 08 and 15.

### 12.3 Database

The final persistence layer will durably represent connections, channel identity, OAuth transactions, protected credentials, granted permissions, uploads, publications, schedules, state transitions, retry/reconciliation information, and safe audit events.

Exact collections, fields, indexes, and retention rules belong to Document 12.

### 12.4 Google OAuth

The final OAuth experience will support backend-created authorization, Google consent, callback verification, secure code exchange, access-token expiration, refresh-token preservation, permission validation, revocation detection, reconnection, and intentional disconnection.

Exact scopes and configuration require later approval.

### 12.5 YouTube Data API

Approved YouTube APIs will support authorized channel discovery, channel identity retrieval, resumable video upload, approved metadata submission, immediate or scheduled publication, remote status retrieval, and quota-aware behavior.

### 12.6 Background processing

Backend-controlled workers or equivalent durable processing will handle scheduled execution, recoverable operations, safe retries, token refresh when required, remote status synchronization, interruption reconciliation, and permanently failed work.

The exact worker technology is deferred.

### 12.7 Operations

The final operational result will include safe logs, metrics, alerts, audits, health checks, quota visibility, incident procedures, feature controls, credential/key rotation procedures, backup/restoration procedures, safe support diagnostics, and staging verification before production.

## 13. Trust Boundaries and Ownership

| Information or operation | Authority |
|---|---|
| Narrial user identity | Narrial authentication system and authenticated backend context |
| OAuth authorization decision | Google |
| Google OAuth transaction validation | Narrial backend |
| YouTube channel identity | YouTube |
| Normalized connection record | Narrial backend and database |
| Google access and refresh tokens | Narrial backend only |
| Video source ownership | Narrial, the user, or an approved storage source under later policy |
| Remote upload state | YouTube |
| Normalized upload state | Narrial backend |
| Schedule intent | Authenticated user request persisted by Narrial |
| Schedule execution | Narrial backend worker |
| Remote publication state | YouTube |
| User-facing normalized status | Narrial backend using durable state and provider evidence |

Deep-link parameters, browser-return values received by the client, client-supplied identifiers and ownership claims, client-supplied success states, repeated callbacks, and duplicate requests are untrusted inputs.

## 14. Product Success Measures

| Measure | Desired signal | Target status |
|---|---|---|
| Connection completion | Eligible users complete authorization and receive a verified channel | Numerical target requires approval |
| Persistence | Healthy connection remains available after restart and reauthentication | Required |
| Reconnection | Users can recover from revoked or unusable authorization | Required |
| Upload completion | Eligible videos reach YouTube without unintended duplication | Numerical target requires approval |
| Schedule execution | Approved schedules execute within an acceptable delay | Delay threshold requires approval |
| Synchronization accuracy | Narrial state agrees with authoritative YouTube state | Accuracy target requires approval |
| Duplicate prevention | Repeated requests and retries do not create unintended publications | Required |
| Recoverable failure rate | Eligible temporary failures recover safely | Numerical target requires approval |
| Credential incidents | No Google credential appears in unauthorized locations | Required: zero known leaks |
| Error actionability | User-facing failures provide the correct next step | Required |
| Quota management | Quota consumption is observable and bounded | Threshold requires approval |

Service-level targets, alert thresholds, retention periods, and capacity assumptions belong to later documents.

## 15. User Trust and Transparency Requirements

The final experience must explain:

- Why Google authorization is required.
- That Google handles Google account authentication.
- That Narrial does not receive the user’s Google password.
- Which approved YouTube permissions Narrial requests.
- Which channel is connected.
- Whether the connection is healthy.
- When reconnection is required and why.
- What disconnecting will do.
- Whether a video is queued, uploading, processing, scheduled, published, or failed.
- Whether retrying is safe.
- When YouTube controls the final outcome.
- When quota or provider availability delays an operation.

Narrial must not promise provider availability, guaranteed publication, guaranteed processing time, or immunity from YouTube restrictions.

## 16. Experience Constraints

- A valid authenticated Narrial session is required.
- Internet access is required for Google and YouTube operations.
- Google and YouTube availability are external dependencies.
- YouTube API quota limits apply.
- Google OAuth consent and verification requirements apply.
- The user must have sufficient authority over the selected channel.
- YouTube determines processing, rejection, restriction, and deletion outcomes.
- Mobile browser and deep-link flows may be interrupted.
- Scheduled publication cannot depend on the user keeping Narrial open.
- Provider credentials cannot be stored as ordinary frontend state.
- A completed upload transfer does not necessarily mean the video is processed or published.
- Existing mock behavior must be removed, isolated, or clearly disabled before production release.

## 17. Evidence-Supported Assumptions

| ID | Assumption | Evidence | Impact if false | Confirmation owner | Status |
|---|---|---|---|---|---|
| `PV-ASM-001` | Narrial requires an authenticated user before entering its main workflow | Clerk frontend integration in Document 00 | Authentication journey and API authorization would change | Product/backend owner | Supported; backend enforcement missing |
| `PV-ASM-002` | The primary client is currently an Expo/React Native application | Frontend manifest and routes in Document 00 | Navigation and OAuth-return design would change | Frontend owner | Supported |
| `PV-ASM-003` | Existing account and scheduling screens are design inputs, not production evidence | Mock-service audit in Document 00 | Migration plan would change | Product/frontend owner | Supported |
| `PV-ASM-004` | A backend service will own sensitive provider operations | Existing Fastify project and security requirements | A different trusted runtime would require approval | Technical owner | Supported direction; architecture pending |
| `PV-ASM-005` | Persistent storage is required for connections and publishing operations | Persistence and scheduling outcomes | Cross-restart reliability would be impossible | Product/technical owner | Required by vision |
| `PV-ASM-006` | Real publishing requires external Google/YouTube configuration absent from the repository | Document 00 external-state audit | Setup must reconcile any existing resources | Google Cloud owner | Requires external verification |

## 18. Decisions Requiring User Approval

| ID | Decision | Why it matters | Options | Recommended direction | Affected documents | Blocking stage | Status |
|---|---|---|---|---|---|---|---|
| `PV-DEC-001` | How many YouTube channels may one Narrial user connect? | Changes UX, relationships, selection, and token ownership | One; multiple | One for the first release unless multi-channel is essential | 02, 04, 08, 12, 17, 18 | Requirements | Requires approval |
| `PV-DEC-002` | May multiple Narrial users connect the same channel? | Affects ownership, conflicts, security, and revocation | Prohibit; independent connections; workspace ownership | Prohibit until a team model is designed | 02, 05, 08, 12, 13, 17 | Architecture | Requires approval |
| `PV-DEC-003` | Must Brand Accounts be supported? | Affects account selection, testing, and identity handling | Required; deferred; unsupported | Validate in staging before final scope | 02, 11, 17, 26 | Google setup | Requires approval |
| `PV-DEC-004` | Which publishing modes belong in the first release? | Determines release size and operational risk | Immediate only; scheduled only; both | Immediate first, then scheduled, unless both are mandatory | 02, 05, 20, 21, 26 | Release boundary | Requires approval |
| `PV-DEC-005` | Which video sources are supported? | Controls storage, validation, transfer, and ownership | Narrial-generated; local files; hosted URLs; combination | Narrial-generated videos first | 02, 05, 19 | Requirements | Requires approval |
| `PV-DEC-006` | Which metadata fields are required? | Affects validation and publishing UX | Minimal; expanded | Define after confirming approved capabilities | 04, 05, 20 | Requirements | Requires approval |
| `PV-DEC-007` | What is the default privacy status? | Can unintentionally expose content | Private; unlisted; public; no default | Private is the safest proposed default | 02, 05, 20, 24 | Product/security | Requires approval |
| `PV-DEC-008` | Is custom thumbnail upload included? | Adds validation, permission, quota, and failure states | First release; later; excluded | Defer unless essential | 02, 19, 20 | Release boundary | Requires approval |
| `PV-DEC-009` | Is playlist placement included? | Adds calls, permissions, and partial failures | First release; later; excluded | Defer unless essential | 02, 17, 20 | Release boundary | Requires approval |
| `PV-DEC-010` | What happens to pending schedules after disconnection? | Prevents unexpected publication | Cancel; pause; retain but block; case-dependent | Pause/block execution and require recovery | 05, 12, 21, 23 | Business rules | Requires approval |
| `PV-DEC-011` | What happens to publishing history after disconnection? | Affects history, privacy, retention, and audits | Retain; delete; user-selectable | Retain non-secret history under approved policy | 02, 06, 12, 17, 24 | Data policy | Requires approval |
| `PV-DEC-012` | Which clients are supported at first release? | Determines OAuth returns and testing | iOS; Android; web; combination | Match Narrial’s actual release targets | 02, 04, 10, 18, 26 | Environment design | Requires approval |
| `PV-DEC-013` | Are Narrial-specific geographic or age restrictions required? | Affects eligibility and compliance | None beyond provider policy; additional restrictions | None unless legally/product-required | 02, 06, 24 | Scope | Requires approval |
| `PV-DEC-014` | Who owns Google Cloud configuration and operational support? | Production credentials require accountable humans | Internal owner; platform team; approved vendor | Assign named primary and backup owners | 03, 10, 11, 24, 25, 27 | Infrastructure | Requires approval |

No option is approved merely because it is recommended.

## 19. Explicitly Deferred Technical Decisions

This document does not approve:

- A database provider or data model.
- Exact tables, collections, fields, or indexes.
- API URLs or payloads.
- Encryption algorithms or key-management providers.
- Job-queue or worker-hosting technology.
- Cloud hosting or video storage providers.
- Retry formulas or polling intervals.
- Quota thresholds.
- Package versions.
- Exact layouts or final copy.
- Exact backend error codes.
- Exact OAuth scopes.
- Monitoring vendors or retention periods.

These choices must be documented and approved at their assigned stages.

## 20. Final Result Narrative

An authenticated Narrial creator opens the YouTube connection area and sees that no channel is connected. The user selects Connect YouTube and is informed that Google will handle account selection and authorization.

After completing Google consent, the user returns to Narrial. Narrial displays a verification state while the backend validates the result, securely exchanges the authorization code, retrieves the authorized channel, and persists the connection.

The user then sees the verified channel identity and connection health.

The user selects an eligible Narrial video, completes the required metadata, and chooses immediate or scheduled publication according to the approved release capabilities. Narrial validates the request, creates a durable operation, and displays upload progress without exposing credentials.

When transfer completes, Narrial indicates that YouTube is processing the video. It later displays the authoritative scheduled, published, restricted, or failed result.

The user can restart Narrial without losing the connection or publication record. If authorization becomes invalid, Narrial marks the connection as requiring reconnection, blocks unsafe operations, preserves records according to approved retention rules, and provides a clear recovery action.

Throughout the workflow, Google credentials remain backend-only, retries do not cause unintended duplicate publications, and user-facing status reflects durable Narrial state reconciled with YouTube.

## 21. Vision-Level Acceptance Criteria

- [x] `PV-AC-001` — The module’s purpose and product problem are unambiguous.
- [x] `PV-AC-002` — Target users and their desired outcomes are defined.
- [x] `PV-AC-003` — The complete journey from connection through publication and monitoring is defined.
- [x] `PV-AC-004` — Connection success requires backend verification and channel retrieval.
- [x] `PV-AC-005` — Channel identity, health, and permission status are visible.
- [x] `PV-AC-006` — Cancellation, denial, reconnection, and disconnection outcomes are defined.
- [x] `PV-AC-007` — Immediate and scheduled publication are addressed without silently assigning release scope.
- [x] `PV-AC-008` — Video transfer and YouTube processing are different states.
- [x] `PV-AC-009` — Connection and publication state must persist after restart.
- [x] `PV-AC-010` — Scheduled operations do not depend on the client remaining open.
- [x] `PV-AC-011` — Credentials and provider secrets are backend-only.
- [x] `PV-AC-012` — Retried user and worker actions must not cause unintended duplicates.
- [x] `PV-AC-013` — Errors, interruptions, permission loss, quota failures, and recovery are included.
- [x] `PV-AC-014` — The module remains exclusively focused on YouTube.
- [x] `PV-AC-015` — Existing mocks are not represented as production capability.
- [x] `PV-AC-016` — Unresolved product decisions are visible and approval-gated.
- [x] `PV-AC-017` — Technical implementation choices are deferred appropriately.
- [x] `PV-AC-018` — Later requirements and tests can trace to stable capability and outcome IDs.
- [x] `PV-AC-019` — A new AI conversation can understand the final result using Documents 00 and 01.
- [x] `PV-AC-020` — The user explicitly approved adding this product-vision baseline.

These criteria confirm the completeness of the approved vision, not implementation completion.

## 22. Risks to the Product Vision

| ID | Risk | Product impact | Likelihood | Mitigation direction | Controlling documents |
|---|---|---|---|---|---|
| `PV-RISK-001` | Google OAuth verification takes longer than expected | Launch delay | Unknown | Begin compliant staging setup after approval | 10, 11, 24, 27 |
| `PV-RISK-002` | OAuth scopes are excessive or insufficient | Consent rejection or broken features | Medium | Map every scope to an approved feature | 05, 11, 16, 24 |
| `PV-RISK-003` | Google does not return a usable refresh token | Connection cannot operate reliably | Medium | Define preservation and reconnect behavior | 13, 16, 23, 26 |
| `PV-RISK-004` | User revokes authorization externally | Publishing operations fail | High over product lifetime | Detect and provide reconnection | 16, 17, 23 |
| `PV-RISK-005` | YouTube API quota is exhausted | Operations are delayed | Medium | Budget, monitor, optimize, and degrade safely | 24, 25 |
| `PV-RISK-006` | Upload is interrupted | Progress is lost or retried unsafely | High | Recoverable sessions and durable state | 19, 23 |
| `PV-RISK-007` | Repeated actions create duplicate videos | Unintended publication | Medium | Idempotency and reconciliation | 08, 15, 19, 21, 23 |
| `PV-RISK-008` | Timezone conversion is wrong | Video publishes at the wrong time | Medium | Unambiguous storage and transition tests | 05, 08, 21, 26 |
| `PV-RISK-009` | YouTube processing fails after upload | Misleading success | Medium | Separate upload and processing states | 20, 22, 23 |
| `PV-RISK-010` | Interface states are unclear | Users repeat unsafe actions | Medium | Define states and recovery actions | 04, 18, 23 |
| `PV-RISK-011` | Credentials leak | Account compromise and compliance incident | Low but severe | Backend-only credentials, encryption, redaction, scanning | 13, 24, 25, 27 |
| `PV-RISK-012` | Mock behavior is mistaken for production | False completion and unsafe release | High during development | Evidence-based tracking | 00, 26, 28, 29 |
| `PV-RISK-013` | Older plans conflict with this vision | Scope and architecture drift | Medium | Make approved YouTube documents authoritative | 02, 03, 07, 28 |
| `PV-RISK-014` | Disconnection rules are unclear | Unexpected schedules or retention | Medium | Approve explicit business and retention rules | 02, 05, 12, 17, 21, 24 |

## 23. Traceability Foundation

| Product problem | Capability | System outcome | Important states | Later controlling documents |
|---|---|---|---|---|
| Simulated connection does not prove authorization | `PV-CAP-001`–`PV-CAP-006` | `PV-SYS-001`–`PV-SYS-009` | Preparing, waiting, returning, verifying, connected | 04, 05, 08, 11, 13, 15, 16, 17 |
| Connections disappear with in-memory state | `PV-CAP-023`, `PV-CAP-024` | `PV-SYS-008`, `PV-SYS-010` | Connected, reconnect required | 07, 08, 12, 14, 17 |
| Users lack a direct publishing workflow | `PV-CAP-011`–`PV-CAP-017` | `PV-SYS-010`, `PV-SYS-011`, `PV-SYS-017` | Ready, queued, uploading, processing, scheduled | 04, 05, 19, 20, 21 |
| Users cannot trust publication status | `PV-CAP-020` | `PV-SYS-012`, `PV-SYS-018` | Processing, published, failed, restricted | 08, 15, 22, 25 |
| Authorization can expire or be revoked | `PV-CAP-007`–`PV-CAP-010` | `PV-SYS-005`–`PV-SYS-007` | Insufficient permission, revoked, reconnect required | 13, 16, 17, 23 |
| Retries may create duplicate operations | `PV-CAP-015`, `PV-CAP-022` | `PV-SYS-009`, `PV-SYS-011` | Interrupted, temporary failure | 08, 15, 19, 21, 23 |
| Credentials require secure ownership | All authorization capabilities | `PV-SYS-002`–`PV-SYS-004`, `PV-SYS-013`, `PV-SYS-014` | All connection states | 06, 07, 10, 11, 13, 16, 24, 25, 27 |
| Provider quota or availability blocks work | `PV-CAP-020`, `PV-CAP-021` | `PV-SYS-015`, `PV-SYS-016` | Temporary failure, quota unavailable | 06, 23, 24, 25, 26 |

## 24. Document Completion Checklist

- [x] Document 00 was used as the current-state evidence baseline.
- [x] Existing mock behavior and intended production behavior are separated.
- [x] The product problem is defined.
- [x] Target users and outcomes are defined.
- [x] The final end-to-end experience is described.
- [x] User capabilities and system outcomes have stable identifiers.
- [x] Connection, upload, publishing, scheduling, and recovery states are covered.
- [x] YouTube-only scope is preserved.
- [x] Technical choices are not prematurely locked.
- [x] Unsupported product decisions require approval.
- [x] Risks and traceability are documented.
- [x] Prerequisite and next-document references are included.
- [ ] Document 00 has formal user approval recorded.
- [ ] Decisions in Section 18 have been answered or assigned to later approval gates.
- [x] The user explicitly approved adding Document 01.

## 25. Prerequisites

Required prerequisite:

- `00-existing-work-and-current-state-audit.md`

Document 00 remains the authoritative baseline for what currently exists. If implementation changes before later planning is approved, affected claims in Documents 00, 01, and 28 must be reconciled.

Formal approval of Document 00 has not been silently inferred and must be recorded explicitly.

This product-vision approval does not authorize implementation.

## 26. Next Document

Continue with:

- `02-scope-non-scope-and-release-boundaries.md`

Document 02 will translate this vision into binding boundaries for the first release, later releases, explicit non-scope, supported users and clients, publishing modes, video sources, metadata, connection-count rules, disconnection behavior, retention behavior, and release gates.

Document 02 must resolve or assign every scope-related decision from `PV-DEC-001` through `PV-DEC-014`.

## 27. Change Log

| Version | Date | Change | Author or role | Approval |
|---|---|---|---|---|
| 1.0.0 | 2026-08-26 | Replaced the generation prompt with the complete product-vision and final-result baseline grounded in Document 00 | AI documentation agent | User approved addition |
