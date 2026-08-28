# YouTube Connection Module — User Journeys, Screens, and Interface States

## Document Control

| Field | Value |
|---|---|
| Document number | 04 |
| Filename | `04-user-journeys-screens-and-interface-states.md` |
| Module | YouTube Connection only |
| Stage | Stage 2 — Experience design |
| Status | Approved UX baseline — decision-dependent branches remain gated |
| Version | 1.0.0 |
| Last updated | 2026-08-26 |
| Prerequisites | Documents 00–03 |
| Next document | `05-functional-requirements-and-business-rules.md` |
| Intended audience | Product, UX, frontend, backend, QA, accessibility, security, support, and future AI agents |
| Source-of-truth role | Controls user journeys, screens, navigation, components, and user-visible states |
| Implementation authorized | No |

---

## 1. Purpose and Experience Authority

This document defines how an authenticated Narrial user experiences the YouTube Connection module from initial connection through upload, publication, scheduling, monitoring, reconnection, and disconnection.

It controls user-visible behavior, navigation intent, state meaning, allowed actions, completion conditions, recovery, and accessibility. It does not define exact routes, API payloads, database fields, backend enums, styling values, or implementation code.

Later documents may refine technical contracts but cannot silently change these user outcomes. Approval of this document does not approve its unresolved branches or authorize implementation.

## 2. Relationship to Documents 00–03

| Source | UX input | Current implication |
|---|---|---|
| Document 00 | Existing Expo routes, mocks, tests, and quality findings | Existing screens are design inputs, not provider truth |
| Document 01 | Final journey, capabilities, system outcomes, states | User outcomes are binding |
| Document 02 | Complete scope, proposed releases, conditional work | Conditional capabilities need explicit branches |
| Document 03 | Canonical terms, IDs, decision status, blockers | Terminology and approval rules are binding |

Document 04 may describe all branches but cannot call a decision-dependent journey final until the governing decision is approved.

## 3. Experience Goals

| ID | Goal |
|---|---|
| `YT-UX-GOAL-001` | Make connecting a YouTube channel understandable and low-friction. |
| `YT-UX-GOAL-002` | Make the transition to and from Google authorization transparent. |
| `YT-UX-GOAL-003` | Display success only after backend verification. |
| `YT-UX-GOAL-004` | Show the verified channel identity and connection health. |
| `YT-UX-GOAL-005` | Keep upload, YouTube processing, scheduling, and publication states distinct. |
| `YT-UX-GOAL-006` | Give every recoverable failure one clear safe next action. |
| `YT-UX-GOAL-007` | Prevent repeated taps or retries from implying or causing duplicates. |
| `YT-UX-GOAL-008` | Reconstruct persistent truth after restart, return, or session refresh. |
| `YT-UX-GOAL-009` | Meet accessible interaction and communication expectations. |
| `YT-UX-GOAL-010` | Keep the experience exclusively focused on YouTube. |

## 4. Experience Principles

1. The backend is authoritative for connection and operation state.
2. Google authorization is an explicit external-browser transition.
3. An app return or deep link is only a refetch signal.
4. No UI claims upload, processing, schedule, or publication success without authoritative evidence.
5. Each state has one clear primary action where action is possible.
6. Retry, reconnect, and cancellation explain consequences and safety.
7. Loading states prevent duplicates without trapping the user indefinitely.
8. Persistent state is reconstructed from the backend, not trusted from memory.
9. Sensitive provider data stays invisible.
10. Accessibility is required, not deferred.

## 5. Users and Preconditions

| User condition | Preconditions | Goal | Allowed actions | Blocked actions |
|---|---|---|---|---|
| Signed out | No valid Narrial session | Authenticate | Sign in | All YouTube mutations |
| Authenticated, no connection | Valid Narrial session | Connect YouTube | Start connection | Upload/publish/schedule |
| Authorizing | Valid authorization transaction | Complete or cancel Google consent | Continue/cancel externally | Duplicate start while request is active |
| Healthy connection | Backend confirms usable permission | Manage/publish | Refresh, disconnect, prepare video | None beyond scope/permission restrictions |
| Insufficient permission | Channel known, required grant absent | Restore access | Reconnect | Provider mutations |
| Reconnection required | Credential unusable/revoked | Reauthorize | Reconnect, view allowed history | New provider mutations |
| Uploading | Durable upload exists | Monitor/cancel if eligible | View progress, navigate safely | Duplicate submit |
| Scheduled | Durable future publication exists | Monitor/change if eligible | View, reschedule, cancel | Invalid concurrent changes |
| Monitoring | Operation history exists | Understand provider outcome | Refresh, retry eligible failure | Unsafe replay |

Organization, team, agency, shared-channel, and administrator behavior is not approved.

## 6. Information Architecture

| Area | Purpose | Entry | Primary exit | Presentation status |
|---|---|---|---|---|
| Connection hub | Show connection status and management actions | Onboarding/settings/publishing prerequisite | Channel details or OAuth | Existing route may be modified |
| Authorization transition | Explain and launch Google | Connect/reconnect | External browser | Embedded step or modal; exact presentation pending |
| Authorization verification | Safely handle return | App/deep-link return | Connected or recovery | New state/screen required |
| Channel details | Show verified identity, health, permissions | Connection hub | Publish/manage | Page or embedded card pending |
| Publishing target | Choose eligible channel | Video publishing workflow | Metadata preparation | Existing route may be modified |
| Video preparation | Validate source and metadata | Generated/local video flow | Review/submit | Exact source branch pending |
| Upload/publication | Show durable operation lifecycle | Submit confirmation | Status detail | New/modified experience |
| Schedule management | Create/view/change schedule | Video preparation/status | Schedule detail | Conditional release placement |
| Status center | List and inspect operations | Publishing area | Status detail/recovery | Existing publishing route may be modified |

## 7. Existing Screen Audit and Reuse

| Repository screen | Current behavior | Classification | Required treatment |
|---|---|---|---|
| `src/app/onboarding.tsx` | Mock platform connect/disconnect | Reuse with modification | YouTube-only backend state; remove mock authority |
| `src/app/choose-accounts.tsx` | Mock account loading/selection/reconnect | Reuse with modification | Verified channel data and eligibility |
| `src/app/generated-video.tsx` | Video review prerequisite | Reuse after verification | Connect to approved source and publishing flow |
| `src/app/publishing.tsx` | Hardcoded scheduled/published data | Replace data authority; reuse layout concepts | Backend/provider-derived records |
| `src/app/schedule-post.tsx` | In-memory schedule creation | Reuse interaction concepts | Durable backend schedule and approved timezone rules |
| `src/app/video-library.tsx` | Mock local library | Conditional reuse | Only if selected as an approved source |
| `src/components/reference-input.tsx` | Local selection input | Conditional reuse | Ownership, availability, and upload contract required |

Existing route names are evidence of current code, not approved final route contracts.

## 8. Proposed Screen Inventory

| ID | Canonical screen/state surface | Existing route/status | Purpose | Required data | Primary action | Decision dependency |
|---|---|---|---|---|---|---|
| `YT-SCREEN-001` | YouTube Connection Hub | Modify onboarding or later settings route | Show authoritative connection state | Safe connection summary | Connect/manage/reconnect | Entry location requires UX approval |
| `YT-SCREEN-002` | Authorization Preparation | New embedded/modal state | Explain Google transition | Safe authorization-start state | Continue to Google | Presentation form pending |
| `YT-SCREEN-003` | Authorization Return Verification | New | Refetch after app return | Operation/correlation status only | Wait/retry status | Client/deep-link strategy |
| `YT-SCREEN-004` | Connected Channel Details | New/embedded | Show channel identity and health | Safe channel fields | Publish/refresh/disconnect | Channel-count branch |
| `YT-SCREEN-005` | Reconnection Required | New shared state | Explain permission loss | Safe health reason | Reconnect | Pending-work policy |
| `YT-SCREEN-006` | Disconnect Confirmation | Modal/sheet/dialog | Explain consequences | Connection and affected-work summary | Confirm disconnect | `PV-DEC-010`–`011` |
| `YT-SCREEN-007` | Publishing Channel Selection | Modify `choose-accounts` | Select eligible channel | Healthy connection list/record | Continue | `PV-DEC-001` |
| `YT-SCREEN-008` | Video and Metadata Preparation | New/modify publishing flow | Validate source and input | Video summary and approved fields | Review publication | `PV-DEC-005`–`009`, `SCOPE-DEC-001` |
| `YT-SCREEN-009` | Upload Progress | New | Show queue/transfer/recovery | Normalized upload status/progress | Monitor/cancel | Cancellation rules |
| `YT-SCREEN-010` | Immediate Publication Review | New | Confirm channel, metadata, privacy | Safe final summary | Publish | `PV-DEC-004`, `006`–`007` |
| `YT-SCREEN-011` | Schedule Creation | Modify `schedule-post` | Create durable schedule | Date/time/timezone and summary | Schedule | `PV-DEC-004`, `010`, `012` |
| `YT-SCREEN-012` | Scheduled Publication Details | New | Inspect/change future work | Schedule and concurrency state | Reschedule/cancel | Release placement |
| `YT-SCREEN-013` | Publication Status List | Modify `publishing` | Show persisted operations | Normalized summaries | Open detail | Supported statuses |
| `YT-SCREEN-014` | Publication Status Detail | New | Explain lifecycle and recovery | Status history/safe provider identity | Retry/reconnect/view | Provider exposure |
| `YT-SCREEN-015` | Shared Error and Recovery Surface | Shared component/screen | Provide actionable recovery | Safe normalized error | Retry/reconnect/contact support | Support model pending |

## 9. Component Inventory

| ID | Component | Purpose and authority | Required states/accessibility |
|---|---|---|---|
| `YT-COMP-001` | Connection card | Backend-derived channel/health summary | Loading, empty, healthy, reconnect, error; labelled group |
| `YT-COMP-002` | Connect/reconnect action | Starts one guarded authorization request | Busy/disabled; clear external transition |
| `YT-COMP-003` | Channel identity | Safe name, handle/thumbnail when available, channel ID as secondary detail | Fallbacks and meaningful image label |
| `YT-COMP-004` | Connection-health indicator | Normalized health, never token detail | Text/icon plus color; status announcement |
| `YT-COMP-005` | Permission notice | Explains missing/revoked access | Reconnect action and associated message |
| `YT-COMP-006` | Publishing-target selector | Selects only eligible backend-confirmed channel | Selected, unavailable, reconnect; accessible selection semantics |
| `YT-COMP-007` | Metadata form | Collects approved fields | Labels, helper/errors, draft state, keyboard flow |
| `YT-COMP-008` | Privacy/audience controls | Captures approved explicit choices | Never relies on color; consequences explained |
| `YT-COMP-009` | Upload progress | Shows determinate/indeterminate progress and stage | Accessible progress label/value; interruption state |
| `YT-COMP-010` | Schedule controls | Date/time/timezone input | Past/invalid/ambiguous-time errors |
| `YT-COMP-011` | Status badge | Maps normalized state to readable label | Icon/text/color, not color alone |
| `YT-COMP-012` | Recovery panel | One primary safe recovery action | Focusable heading and announced error |
| `YT-COMP-013` | Confirmation dialog | Confirms consequential/destructive action | Focus trap/restore, labelled buttons, consequence text |
| `YT-COMP-014` | Content skeleton | Prevents blank initial data surfaces | `aria-busy`/equivalent; reduced motion |
| `YT-COMP-015` | Empty state | Explains absence and valid next action | Status semantics without false error |
| `YT-COMP-016` | Offline notice | Separates stale display from current truth | Persistent text and refresh action |

Component prop types and file structure belong to Document 18.

## 10. Navigation Model

| ID | Origin → destination | Trigger/precondition | Safe carried data | Authority/back/cancel behavior |
|---|---|---|---|---|
| `YT-NAV-001` | Connection hub → preparation | Connect; authenticated | No provider secret | Backend creates transaction; back cancels before launch |
| `YT-NAV-002` | Preparation → Google | Continue; valid authorization URL | URL supplied by backend | External browser; Narrial shows waiting state |
| `YT-NAV-003` | Google → verification | App/deep-link return | Non-secret correlation signal only | Refetch backend; return never proves success |
| `YT-NAV-004` | Verification → channel details | Backend confirms connection | Connection identifier or refetch key | Replace transient screen to prevent replay |
| `YT-NAV-005` | Verification → recovery | Denied/cancelled/failed/timeout | Safe error category | Retry creates a new transaction |
| `YT-NAV-006` | Channel details → disconnect confirmation | Disconnect selected | Safe channel summary | Cancel restores focus; confirm calls backend |
| `YT-NAV-007` | Publishing prerequisite → target selection | Video eligible | Narrial video reference | Backend revalidates selection later |
| `YT-NAV-008` | Target selection → metadata | Healthy channel selected | Safe connection/video references | Back preserves allowed draft only |
| `YT-NAV-009` | Metadata → publish review/upload | Validated draft | Durable draft/operation reference | Duplicate submit disabled |
| `YT-NAV-010` | Metadata → schedule creation | Scheduling in approved release | Safe draft reference | Back preserves allowed draft |
| `YT-NAV-011` | Upload/schedule → status detail | Durable operation created | Operation ID only | Backend ownership checked on every fetch |
| `YT-NAV-012` | Any protected screen → authentication | Session missing/expired | Safe return intent only | No user/provider IDs trusted from client |

No token, authorization code, raw OAuth state, secret, or credential-bearing provider response may enter navigation state.

## 11. Journey `YT-JOURNEY-001` — First Connection

1. Authenticated user sees `not connected` on `YT-SCREEN-001`.
2. User activates `YT-COMP-002`; repeated activation is disabled while the request is active.
3. Backend authorization-start failure shows `YT-SCREEN-015` without leaving Narrial.
4. Narrial explains the Google transition on `YT-SCREEN-002` and launches only the backend-provided URL.
5. Google handles account selection, authentication, consent, denial, or cancellation.
6. After return, `YT-SCREEN-003` announces verification and refetches authoritative state.
7. Invalid/replayed/expired transactions lead to recovery, not success.
8. Backend-confirmed channel data leads to `YT-SCREEN-004` and an accessible success announcement.
9. Restart or reauthentication refetches and displays the same persisted connection.

Completion condition: the authenticated backend returns a verified connection containing safe YouTube channel identity. Browser launch or return is not completion.

## 12. Journey `YT-JOURNEY-002` — Denied, Cancelled, or Interrupted Authorization

- Denial/cancellation returns to the connection hub or recovery surface with no new connection.
- Browser closure or lost return leaves an honest waiting/unknown state that can safely refetch or restart.
- Retry starts a new authorization transaction.
- An existing healthy connection is not overwritten merely because a reconnect attempt is cancelled.
- Messages never expose raw Google error text or imply fault.

## 13. Journey `YT-JOURNEY-003` — Returning with a Healthy Connection

The client first displays a skeleton, fetches backend state, then shows verified channel data and permitted actions. A refresh failure displays the last known state only if an offline/stale-data policy is later approved, clearly labelled with last-updated information. Otherwise it shows an unavailable state rather than fabricated health.

## 14. Journey `YT-JOURNEY-004` — Permission Loss and Reconnection

- Refreshable access-token expiry is normally recovered without alarming the user.
- Missing refresh authority, revoked grant, insufficient scope, or inaccessible channel produces a distinct reconnect-required state.
- Provider mutations are disabled while reconnection is required.
- Reconnect uses the first-connection safeguards and upserts only after backend verification.
- Pending upload/schedule treatment follows `PV-DEC-010`; history follows `PV-DEC-011`.

## 15. Journey `YT-JOURNEY-005` — Intentional Disconnection

The user opens `YT-SCREEN-006`, sees the connected channel and approved consequences, and confirms or cancels. Confirmation is single-submit and backend-authoritative. Success shows disconnected state; temporary failure preserves the last authoritative state with retry guidance. Provider revocation uncertainty is stated honestly. Pending schedules, history, and remote videos are not silently deleted.

## 16. Journey `YT-JOURNEY-006` — Publishing-Channel Selection

Only healthy eligible connections can be selected. No eligible channel shows a connection/reconnect action. Selection is provisional until the backend rechecks ownership and permission when creating the upload/publication operation. If the connection becomes invalid, the user returns to recovery without losing permitted draft data.

## 17. Journey `YT-JOURNEY-007` — Video and Metadata Preparation

The user selects an approved source, then Narrial validates ownership, availability, compatibility, and limits. The form collects only approved fields and explains validation next to the relevant control. Optional thumbnail, playlist, captions, privacy default, and exact metadata remain conditional. Leaving with unsaved data requires confirmation unless durable draft behavior is approved.

## 18. Journey `YT-JOURNEY-008` — Immediate Upload and Publication

1. User reviews channel, video, metadata, privacy, and audience choices.
2. One confirm action creates a durable idempotent operation.
3. UI shows queued and uploading states with safe navigation guidance.
4. Cancellation is offered only when its consequence is defined.
5. Interruption shows resume/retry eligibility without creating another remote video.
6. Transfer completion changes to `received by YouTube` or `processing`, never directly to published without evidence.
7. Provider-confirmed publication shows the safe YouTube identity/link when available.
8. Failure shows preserved data and the correct retry, edit, reconnect, or support action.

## 19. Journey `YT-JOURNEY-009` — Scheduled Publication

This journey belongs to the complete module and proposed R2 unless `PV-DEC-004` changes placement. The user selects an eligible channel/video, enters an unambiguous future time and timezone, reviews the schedule, and submits once. A durable backend schedule survives client closure. Worker execution, lateness, provider processing, publication, and failure appear in the status experience.

Past times are rejected. Ambiguous or nonexistent local times require clarification; no silent timezone correction is allowed.

## 20. Journey `YT-JOURNEY-010` — Reschedule or Cancel

Only eligible pending states show change actions. The backend rechecks current state and version before mutation. If execution has started, the UI explains that change/cancellation may no longer be possible and refetches. Success announces the new schedule or cancellation; concurrency conflicts refresh authoritative state.

## 21. Journey `YT-JOURNEY-011` — Status Monitoring

The status list and detail surfaces show normalized state, last updated time, channel/video context, and available action. Supported categories include queued, uploading, interrupted, received, processing, scheduled, published, failed, restricted/rejected, private, deleted, reconnect required, and stale/unknown. The UI never promises provider details unavailable through approved APIs.

## 22. Offline and Interrupted Sessions

| Moment | Required behavior | Preserved information | Safe action |
|---|---|---|---|
| Before connection | Do not launch authorization | Local navigation only | Retry when online |
| During Google flow | Google/browser controls availability | Existing connection unaffected | Return/refetch or restart |
| After return | Do not infer success | Correlation signal only | Refetch when online |
| During status refresh | Mark information unavailable/stale per approved policy | Last confirmed display only if permitted | Retry |
| Before upload creation | Do not claim operation exists | Approved local/durable draft | Retry submit |
| During upload | Show interruption; do not create duplicate | Durable operation/session | Resume/retry if backend allows |
| During scheduling | Success only from backend | Draft until confirmation | Refetch before retry |
| During monitoring | Do not mutate displayed last-known state into success | Last confirmed status | Refresh later |

## 23. Authentication and Cross-User Protection

- Signed-out users are redirected to Narrial authentication with only a safe return intent.
- Session loading is distinct from “no connection.”
- Session expiry during OAuth/upload/schedule produces reauthentication and authoritative refetch.
- If a different Narrial user is active after return, the client must not display or attach the prior user’s operation.
- Sign-out clears user-scoped client cache; durable backend work follows approved policy.
- Client-supplied user IDs never establish ownership.

## 24. Interface State Model

These are UI concepts, not final backend enum values.

### 24.1 Connection states

| ID | State | Authority/meaning | Visible primary action |
|---|---|---|---|
| `YT-UI-STATE-001` | Connection unknown | Backend not yet queried | None; skeleton |
| `YT-UI-STATE-002` | Loading connection | Query active | None; retry after timeout/failure |
| `YT-UI-STATE-003` | Not connected | Backend confirms no usable connection | Connect |
| `YT-UI-STATE-004` | Authorization starting | Backend transaction creation active | Wait/cancel if safe |
| `YT-UI-STATE-005` | Waiting for Google | External flow active | Complete/cancel externally |
| `YT-UI-STATE-006` | Returned | App received return signal | None; begin refetch |
| `YT-UI-STATE-007` | Verifying connection | Backend validates/retrieves channel | Wait |
| `YT-UI-STATE-008` | Connected healthy | Backend confirms usable channel | Publish/manage |
| `YT-UI-STATE-009` | Insufficient permission | Required grant absent | Reconnect |
| `YT-UI-STATE-010` | Refreshing credentials | Transparent server recovery active | Wait |
| `YT-UI-STATE-011` | Reconnection required | Authority cannot be recovered automatically | Reconnect |
| `YT-UI-STATE-012` | Disconnecting | Backend mutation active | Wait |
| `YT-UI-STATE-013` | Disconnected | Backend confirms credentials unusable for new work | Reconnect |
| `YT-UI-STATE-014` | Connection unavailable | Temporary server/provider failure | Retry |
| `YT-UI-STATE-015` | Offline | Backend unreachable | Retry when online |

### 24.2 Upload states

| ID | State | Meaning/action |
|---|---|---|
| `YT-UI-STATE-101` | Draft | Input incomplete; continue editing |
| `YT-UI-STATE-102` | Validating | Ownership/compatibility check active |
| `YT-UI-STATE-103` | Ready | Valid and eligible for confirmation |
| `YT-UI-STATE-104` | Queued | Durable operation created; waiting to transfer |
| `YT-UI-STATE-105` | Uploading | Transfer active; display progress when known |
| `YT-UI-STATE-106` | Interrupted | Transfer stopped; show resume/retry eligibility |
| `YT-UI-STATE-107` | Cancelling | Cancellation request active |
| `YT-UI-STATE-108` | Cancelled | Backend confirms cancellation outcome |
| `YT-UI-STATE-109` | Received | YouTube accepted transferred video |
| `YT-UI-STATE-110` | Processing | YouTube processing active |
| `YT-UI-STATE-111` | Upload failed, retryable | Safe retry available |
| `YT-UI-STATE-112` | Upload failed, terminal | Edit/reconnect/support action instead of retry |

### 24.3 Publication and schedule states

| ID | State | Meaning/action |
|---|---|---|
| `YT-UI-STATE-201` | Not submitted | No durable publication operation |
| `YT-UI-STATE-202` | Publishing | Publication request active |
| `YT-UI-STATE-203` | Scheduled | Durable future publication exists |
| `YT-UI-STATE-204` | Rescheduling | Schedule mutation active |
| `YT-UI-STATE-205` | Cancelling schedule | Cancellation active |
| `YT-UI-STATE-206` | Schedule cancelled | Backend confirms no scheduled execution under that record |
| `YT-UI-STATE-207` | Published | Provider confirms approved published state |
| `YT-UI-STATE-208` | Publication failed | Recovery depends on error category |
| `YT-UI-STATE-209` | Restricted/rejected | Provider prevents intended outcome |
| `YT-UI-STATE-210` | Private | Provider confirms private state |
| `YT-UI-STATE-211` | Deleted | Provider indicates video no longer exists/accessible |
| `YT-UI-STATE-212` | Stale/unknown | Narrial cannot confirm current remote truth |

## 25. Loading, Empty, Permission, Success, and Failure Rules

### Loading

- Content fetches use contextual skeletons where structure is known.
- Mutations show the affected control as busy and prevent duplicate activation.
- Long operations show stage and background-continuation guidance.
- Dynamic changes are announced without excessive repetition.
- A timeout changes to a recoverable state; no indefinite unexplained spinner.

### Empty

No channel, eligible channel, selected video, uploads, schedules, publications, history, or available retry each receives a specific explanation and valid next action. Empty is not displayed as failure.

### Permission

Required grant missing, refresh-token unavailable, revoked grant, inaccessible channel, insufficient channel authority, Google verification restriction, and YouTube feature restriction remain distinct safe categories. Blocked actions explain why and how to recover.

### Success

Authorization started, channel verified, connection refreshed, reconnection completed, disconnection completed, operation created, transfer completed, processing completed, publication confirmed, schedule created/changed/cancelled each use precise language. “Success” alone is prohibited.

### Failure

Failures cover authentication, authorization start, denial, invalid/replayed callback, channel lookup, permission, refresh, validation, unavailable video, upload interruption/rejection, processing, scheduling conflict/miss, outage, rate limit/quota, internal error, and offline state. Each identifies retry eligibility, preserved data, reconnect eligibility, and support path without exposing internals.

## 26. Error Message Principles

- State what failed in user language and what remains safe.
- Give one primary next action.
- Say whether retry is safe and whether data/progress is preserved.
- Avoid blame, false certainty, and ambiguous “Something went wrong” when a safe category is known.
- Never show tokens, codes, raw OAuth state, stack traces, database IDs, internal URLs, or unredacted provider errors.
- Associate validation errors with fields and announce page-level failures.

Exact copy and error codes belong to Documents 15, 18, and 23.

## 27. Confirmations and Destructive Actions

Confirmation is required for disconnecting, cancelling an active upload when cancellation has consequences, cancelling a schedule, leaving with an unsaved draft, retrying an uncertain remote side effect, and any later-approved deletion.

Dialogs identify the object, consequence, reversibility, pending-work impact, and safe alternative. Initial focus goes to the least destructive appropriate action; focus returns to the trigger on cancellation/close.

## 28. Accessibility Requirements

- Target WCAG 2.1 AA at minimum; a different formal target requires approval in Document 06.
- Logical heading structure, reading order, focus order, and focus restoration.
- Screen-reader labels for icon-only controls and channel images.
- Status/progress announcements using non-disruptive live regions or platform equivalents.
- Field instructions and errors programmatically associated with inputs.
- Full keyboard support on web and switch/screen-reader operability on supported mobile clients.
- Touch targets meet the project/platform minimum defined in implementation requirements.
- Text scaling does not hide actions or truncate critical state.
- Normal text contrast at least 4.5:1 and large text/UI indicators at least 3:1.
- Color is never the only state signal.
- Reduced-motion preference is respected.
- Disabled controls expose disabled semantics and nearby explanation.
- Dialogs are labelled, focus-contained, dismissible where safe, and restore focus.
- Timezone and date/time values are readable and unambiguous.

## 29. Responsive and Platform Behavior

The design is mobile-first and must remain usable at narrow phone widths, tablets, and any approved web surface. Validate at representative widths including 320, 768, 1024, and 1440 CSS pixels where web applies.

iOS and Android behavior must account for external browsers, app links, system back behavior, safe areas, keyboard obstruction, backgrounding, and process restoration. Web behavior remains conditional on `PV-DEC-012` and must address browser callback routes, refresh, history, and keyboard navigation. Orientation support follows the approved app policy.

## 30. Privacy and Sensitive-Data Presentation

Allowed UI data is limited to approved safe channel identity, normalized permissions/health, video metadata the user is authorized to see, normalized operation state, safe provider video identity/link, and timestamps.

Google client secrets, authorization codes, access/refresh tokens, encrypted credential payloads, raw OAuth state, credential-bearing URLs, and sensitive raw provider payloads are prohibited from UI state, navigation, screenshots, analytics, and support output.

## 31. Analytics and Telemetry Boundary

Safe event categories may cover connection start, browser launch, app return, verification result category, denial/cancellation, reconnection, disconnection, upload stage, schedule stage, publication state, and recovery action.

Events must exclude tokens, codes, OAuth state, raw provider payloads, unnecessary channel/user identifiers, private titles/descriptions, file contents, and secret-bearing URLs. Exact schema, consent, retention, and vendors require later approval.

## 32. Decisions Requiring Approval

| Decision | UX branch/options | Recommendation | Affected screens | Status |
|---|---|---|---|---|
| `PV-DEC-001` | Single connection vs list/selector | Single R1 | 001, 004, 007 | Requires approval |
| `PV-DEC-003` | Brand Account behavior | Research/verify before promise | 002–005 | Requires research/approval |
| `PV-DEC-004` | Immediate only vs immediate+scheduled R1 | Immediate R1, scheduling R2 | 008–014 | Requires approval |
| `PV-DEC-005` | Narrial-managed/local/URL sources | Narrial-managed R1 | 008 | Requires approval |
| `PV-DEC-006` | Minimum vs expanded metadata | Minimum valid R1 set | 008, 010–012 | Requires approval |
| `PV-DEC-007` | Explicit privacy choice/default | Explicit choice; private fallback if approved | 008, 010–012 | Requires approval |
| `PV-DEC-008` | Thumbnail UI | Defer | 008 | Requires approval |
| `PV-DEC-009` | Playlist UI | Defer | 008 | Requires approval |
| `PV-DEC-010` | Pending schedule after disconnect | Pause/block | 005–006, 012 | Requires approval |
| `PV-DEC-011` | History after disconnect | Retain non-secret history | 006, 013–014 | Requires approval |
| `PV-DEC-012` | iOS/Android/web support | Match actual release targets | All/navigation | Requires approval |
| `SCOPE-DEC-001` | Explicit audience designation vs approved default | Explicit user input | 008, 010–012 | Requires approval |
| `YT-UX-DEC-001` | Connection hub location | Onboarding, settings, publishing prerequisite, or combination | Provide settings/home management plus publishing shortcut | 001 | Requires approval |
| `YT-UX-DEC-002` | Page, modal, or sheet for transition/confirmation surfaces | Per platform/design system | Use page for verification; accessible dialog/sheet for confirmation | 002–003, 006 | Requires approval |
| `YT-UX-DEC-003` | Draft preservation | None, local safe draft, durable backend draft | Durable non-sensitive draft where practical | 008 | Requires approval |
| `YT-UX-DEC-004` | Offline last-known display | Hide, show stale, partial | Show explicitly stale safe data only if privacy policy approves | 001, 004, 013–014 | Requires approval |
| `YT-UX-DEC-005` | Support presentation | Retry only, diagnostic ID, help link/contact | Safe diagnostic ID plus approved help route | 015 | Requires approval |

## 33. Experience Risks

| ID | Risk | Impact | Prevention/detection | Controller |
|---|---|---|---|---|
| `YT-UX-RISK-001` | App return shown as connection success | False authorization | Verifying state and E2E tests | 08, 15, 16, 26 |
| `YT-UX-RISK-002` | Google account/channel confused | Wrong user expectation | Canonical glossary and provider-derived channel display | 03, 17 |
| `YT-UX-RISK-003` | Repeated actions create duplicates | Duplicate uploads/publications | Busy state plus backend idempotency | 15, 19, 21, 23 |
| `YT-UX-RISK-004` | Draft/progress lost | User rework | Approved persistence and interruption flows | 12, 18, 19 |
| `YT-UX-RISK-005` | OAuth return is interrupted | Stuck/uncertain connection | Refetch/restart recovery | 16, 18 |
| `YT-UX-RISK-006` | Progress appears frozen | Duplicate retries/abandonment | Stage, last update, delayed messaging | 19, 22, 25 |
| `YT-UX-RISK-007` | Timezone misunderstood | Wrong publication time | Explicit zone and ambiguity validation | 21, 26 |
| `YT-UX-RISK-008` | Permission fails late | Lost publishing flow | Eligibility check plus creation-time revalidation | 15, 17, 19 |
| `YT-UX-RISK-009` | Disconnect consequences unclear | Unexpected pending work/history | Confirmation and approved policy | 17, 21, 24 |
| `YT-UX-RISK-010` | Inaccessible dynamic status | Users cannot operate module | Accessibility tests/manual review | 06, 18, 26 |
| `YT-UX-RISK-011` | Raw provider errors leak | Security/confusion | Normalized error contract | 13, 15, 23 |
| `YT-UX-RISK-012` | Other platform UI leaks into module | Scope confusion | YouTube-only review | 02, 03, 18 |
| `YT-UX-RISK-013` | Mock UI treated as finished | Unsafe release | Runtime provider evidence | 00, 26, 28, 29 |

## 34. Journey Traceability

| Journey | Screens | Components | Main UI states | Product capability | Later controllers |
|---|---|---|---|---|---|
| `YT-JOURNEY-001` first connection | 001–004, 015 | 001–005, 012–014 | 001–008, 014–015 | `PV-CAP-001`–`006` | 05, 08, 15–18, 26 |
| `YT-JOURNEY-002` denial/interruption | 001–003, 015 | 002, 012 | 003–007, 014–015 | `PV-CAP-003`–`005`, `021` | 05, 16, 18, 23, 26 |
| `YT-JOURNEY-003` healthy return | 001, 004 | 001, 003–004, 014 | 001–002, 008, 014–015 | `PV-CAP-006`–`008`, `023`–`024` | 05, 17–18, 22 |
| `YT-JOURNEY-004` reconnect | 004–005, 001–003 | 002, 004–005, 012 | 009–011 | `PV-CAP-007`–`009` | 16–18, 23 |
| `YT-JOURNEY-005` disconnect | 004, 006, 001 | 001, 013 | 012–013 | `PV-CAP-010`, `025` | 05, 17, 23–24 |
| `YT-JOURNEY-006` target selection | 007, 005 | 003–006, 015 | 008–011 | `PV-CAP-011` | 05, 15, 17–18 |
| `YT-JOURNEY-007` preparation | 008 | 006–008, 012 | 101–103 | `PV-CAP-012`–`013` | 05, 18–20 |
| `YT-JOURNEY-008` immediate publish | 010, 009, 014–015 | 009, 011–013 | 104–112, 201–202, 207–212 | `PV-CAP-014`–`016`, `020`–`022` | 05, 15, 19–20, 22–23 |
| `YT-JOURNEY-009` schedule | 011–014 | 010–013 | 203, 207–212 | `PV-CAP-017`, `020` | 05, 15, 21–23 |
| `YT-JOURNEY-010` change schedule | 012, 015 | 010–013 | 203–206, 208, 212 | `PV-CAP-018`–`019` | 05, 15, 21, 23 |
| `YT-JOURNEY-011` monitor | 013–015 | 011–012, 014–016 | All operation states | `PV-CAP-020`–`022` | 15, 18, 22–23, 25–26 |

Document 05 must create functional requirement IDs and add them to this matrix rather than inventing them here.

## 35. Experience-Level Acceptance Criteria

- [x] `YT-UX-AC-001` — Every complete-module journey has an entry, progress, success/failure, and exit.
- [x] `YT-UX-AC-002` — Existing screens are separated from proposed final screens.
- [x] `YT-UX-AC-003` — Navigation carries no provider credentials.
- [x] `YT-UX-AC-004` — OAuth return is not treated as verified success.
- [x] `YT-UX-AC-005` — Channel identity and connection health are visible.
- [x] `YT-UX-AC-006` — Upload transfer, processing, scheduling, and publication are distinct.
- [x] `YT-UX-AC-007` — Loading, empty, permission, success, failure, offline, and recovery behavior is defined.
- [x] `YT-UX-AC-008` — Restart, interruption, session expiry, and cross-user behavior is addressed.
- [x] `YT-UX-AC-009` — Destructive actions require consequence-aware confirmation.
- [x] `YT-UX-AC-010` — Accessibility requirements cover focus, announcements, input, contrast, scaling, motion, and dialogs.
- [x] `YT-UX-AC-011` — Sensitive data and telemetry boundaries are explicit.
- [x] `YT-UX-AC-012` — YouTube-only scope and canonical terminology are preserved.
- [x] `YT-UX-AC-013` — Unresolved decisions are visible as branches.
- [x] `YT-UX-AC-014` — Journeys trace to screens, states, product capabilities, and later controllers.
- [x] `YT-UX-AC-015` — The user approved building and adding this UX baseline.
- [ ] `YT-UX-AC-016` — User-visible blocking decisions are individually approved.
- [ ] `YT-UX-AC-017` — Runtime accessibility and device/browser evidence passes.

## 36. Manual Experience Review Checklist

The following remain unchecked until real implementation evidence exists:

- [ ] First connection through real Google consent.
- [ ] Denial, cancellation, and browser interruption.
- [ ] Backend-verified return and persistence after restart.
- [ ] Healthy connection refresh and reconnect-required recovery.
- [ ] Intentional disconnect with approved consequences.
- [ ] No eligible channel and invalidated selection.
- [ ] Video/metadata validation and draft behavior.
- [ ] Upload progress, interruption, cancellation, resume/retry.
- [ ] Transfer completion versus YouTube processing.
- [ ] Immediate publication and provider failure.
- [ ] Scheduling, timezone edge cases, reschedule, and cancellation when in release scope.
- [ ] Offline, quota, outage, stale-state, and support behavior.
- [ ] Screen reader, keyboard/switch, focus, scaling, contrast, and reduced-motion behavior.
- [ ] Cross-user isolation and session-expiry behavior.
- [ ] Navigation, UI, analytics, logs, and screenshots contain no credential material.

## 37. Prerequisites

- Document 01 defines the approved final product outcome.
- Document 02 defines approved scope structure and conditional release boundaries.
- Document 03 defines canonical terminology, decision authority, and user-visible blockers.

This UX baseline is approved as a complete branched specification. Its affected branches cannot be frozen for implementation until Section 32 decisions are approved or explicitly deferred. Document 00 formal approval also remains open.

## 38. Next Document

Continue with:

- `05-functional-requirements-and-business-rules.md`

Document 05 will translate these journeys, screens, actions, state transitions, validation outcomes, and recovery paths into stable testable requirements and business rules. It must preserve unresolved branches rather than silently choosing them.

## 39. Change Log

| Version | Date | Change | Author or role | Approval |
|---|---|---|---|---|
| 1.0.0 | 2026-08-26 | Replaced the generation prompt with the complete YouTube-only journeys, screens, components, navigation, interface states, accessibility, risk, and traceability baseline | AI documentation agent | User approved build and addition; decision-dependent branches remain gated |
