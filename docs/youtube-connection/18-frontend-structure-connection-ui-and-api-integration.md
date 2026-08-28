# YouTube Connection Module — Frontend Structure, Connection UI, and API Integration

## Document Control

| Field | Value |
|---|---|
| Document number | 18 |
| Filename | `18-frontend-structure-connection-ui-and-api-integration.md` |
| Module | YouTube Connection |
| Stage | Stage 8 — Frontend connection implementation |
| Status | Approved documentation baseline — frontend implementation not authorized |
| Version | 1.0.0 |
| Last updated | 2026-08-26 |
| Prerequisites | Documents 00, 04, 08, and 15–17 |
| Next document | `19-video-source-validation-and-upload-workflow.md` |
| Source-of-truth role | Maps the existing Expo UI and mocks to production YouTube connection components, hooks, API calls, browser return, and reconnection behavior |
| Implementation authorization | None |

## 1. Purpose

This document defines how the existing Expo application will consume the production YouTube connection backend. It maps current screens, cards, mocks, Clerk authentication, Expo Router, browser launch, native intent handling, loading/error/empty states, reconnection, disconnection, publishing-target selection, tests, and migration checkpoints.

It does not modify the Expo app, install dependencies, register deep links, call the backend, launch OAuth, remove mocks, or implement another platform.

## 2. YouTube-Only Boundary

Production work under this document applies only to YouTube. Existing Instagram, TikTok, Facebook, X, and LinkedIn mock entries remain unrelated existing UI and must not receive production connections, API calls, credentials, or undocumented behavior through this work.

The new production module uses YouTube-specific types and endpoints. It must not perpetuate a generic multi-platform credential model.

## 3. Prerequisite Readiness

| Document | Required contribution | Consequence |
|---|---|---|
| 00 | Existing-work audit | Structure-only; repository inspection in this document supplies current evidence |
| 04 | Approved screens and states | Prompt-only; final copy/state UX remains provisional |
| 08 | Approved entities/states/contracts | Prompt-only; final status names remain provisional |
| 15 | Backend endpoint/error contract | Approved baseline; routes not implemented |
| 16 | OAuth/token lifecycle | Approved baseline; OAuth gate closed |
| 17 | Channel discovery/permissions | Approved baseline; channel gate closed |

Frontend connection work begins only after the relevant backend connection/channel endpoints pass contract tests and a reachable non-production API is approved.

## 4. Detected Frontend Stack

| Technology | Repository version/state |
|---|---|
| Expo | `~57.0.13` |
| Expo Router | `~57.0.13`; typed routes enabled |
| React | `19.2.3` |
| React Native | `0.86.2` |
| Clerk Expo | `^4.3.0` |
| Expo WebBrowser | `~57.0.2` |
| Expo Linking | `~57.0.6` |
| Safe area | `~5.7.0` |
| App scheme | `narrial` |
| Web output | Static |
| Server-state library | None installed |

Current official guidance supports `WebBrowser.openAuthSessionAsync` for browser authentication sessions; Expo Router supports native deep-link routing and `+native-intent.tsx`; Clerk's `useAuth().getToken()` supplies the session token for authenticated cross-origin API requests. Sources:

- [Expo WebBrowser](https://docs.expo.dev/versions/latest/sdk/webbrowser/)
- [Expo Router deep links](https://docs.expo.dev/router/basics/navigation/#deep-links)
- [Expo native intent handling](https://docs.expo.dev/router/advanced/native-intent/)
- [Clerk Expo `useAuth`](https://clerk.com/docs/expo/reference/hooks/use-auth)
- [Clerk authenticated requests](https://clerk.com/docs/guides/development/making-requests)

## 5. Existing Frontend Inventory

### Existing routes

- `src/app/onboarding.tsx` — “Connect Social Accounts”; loads mock accounts, simulates connection, includes “Disconnect all,” announcements, and continue navigation.
- `src/app/choose-accounts.tsx` — loads mock connected accounts, selects publishing targets, redirects to onboarding when none are valid, and proceeds to scheduling.
- `src/app/+native-intent.tsx` — normalizes native URLs and Expo `/--/` paths; currently has no YouTube-specific allowlist/refetch route.
- `src/app/_layout.tsx` — Clerk provider, token cache, dark theme, root stack.
- `src/app/schedule-post.tsx`, `publishing.tsx`, and related routes — downstream mock publishing flows, outside connection implementation except safe target handoff.

### Existing feature files

- `features/social-accounts/social-accounts.ts` — module-level in-memory maps and fabricated multi-platform accounts.
- `social-account-card.tsx` — platform connection card with connecting/connected state.
- `choose-account-card.tsx` — selectable account card with expired/reconnect display.
- `social-accounts.test.mjs` — tests current mock behavior.

### Existing strengths to preserve

- Responsive width/height handling.
- Safe-area layout.
- Explicit accessibility roles/labels/states.
- Polite live-region announcements.
- Loading indicators and list skeletons.
- Empty/error/retry states.
- Back-navigation fallback.
- Disabled/busy states.
- Existing black/lime visual system.

### Existing behavior to replace

- Client-supplied `user.id` as service authority.
- In-memory account maps.
- Artificial delays and fabricated YouTube identity.
- Immediate “connected” result without browser consent/server verification.
- Local selected-target authority.
- Generic “disconnect all” mutation for YouTube.
- Platform-level connected booleans that cannot represent multiple YouTube channels or reconnection states.

## 6. Frontend Authority Model

The backend is authoritative for connections, channel identity, permissions, credential status, and disconnection. The client owns only temporary presentation state such as open menus, currently pressed buttons, selected local draft targets, and non-authoritative OAuth-return hints.

The client never stores access/refresh tokens, OAuth code/state, Google client secret, encrypted credential data, resumable upload URL, or raw provider responses. Clerk session tokens are requested just in time and passed in the authorization header; they are not copied into feature state or logs.

## 7. Target Feature Structure

```text
narrial/src/features/youtube-connection/
├─ api/
│  ├─ youtube-api-client.ts
│  ├─ youtube-api-schemas.ts
│  ├─ youtube-api-errors.ts
│  └─ youtube-api-types.ts
├─ hooks/
│  ├─ use-youtube-connections.ts
│  ├─ use-youtube-authorization.ts
│  ├─ use-youtube-connection.ts
│  ├─ use-youtube-verification.ts
│  ├─ use-youtube-reauthorization.ts
│  └─ use-youtube-disconnection.ts
├─ components/
│  ├─ youtube-connect-card.tsx
│  ├─ youtube-channel-card.tsx
│  ├─ youtube-connection-list.tsx
│  ├─ youtube-connection-state.tsx
│  ├─ youtube-permission-state.tsx
│  ├─ youtube-reconnect-action.tsx
│  └─ youtube-disconnect-dialog.tsx
├─ navigation/
│  ├─ youtube-auth-return.ts
│  └─ youtube-return-destinations.ts
├─ models/
│  ├─ youtube-connection.ts
│  └─ youtube-connection-state.ts
├─ testing/
│  ├─ youtube-api-fakes.ts
│  └─ youtube-fixtures.ts
└─ index.ts
```

Create files only in their approved implementation slice. Do not add empty directories or generic abstractions for other platforms.

## 8. Component Responsibilities

- `YouTubeConnectCard`: disconnected/connecting/connected/reconnect states and connect action.
- `YouTubeChannelCard`: safe title, optional handle/custom URL, thumbnail fallback, permission/status text, management actions.
- `YouTubeConnectionList`: loading, empty, error, one/multiple channels, stable keys.
- `YouTubeConnectionState`: semantic status label/icon/copy; color is not sole signal.
- `YouTubePermissionState`: sufficient, partial, missing, revoked, unknown behavior.
- `YouTubeReconnectAction`: explains why and starts explicit reauthorization.
- `YouTubeDisconnectDialog`: identifies the exact channel, explains consequences, and requires confirmation.

Presentation components receive safe models/callbacks and never fetch, authenticate, launch browsers, or interpret raw backend/provider responses.

## 9. API Client

`youtube-api-client.ts` is the only network boundary for this feature. It receives the approved API base URL and an async Clerk token supplier, applies `Authorization: Bearer`, JSON headers, request IDs/idempotency keys where required, timeouts/cancellation, and response-schema validation.

It must:

- Await `useAuth().getToken()` through an injected function.
- Treat missing token as signed-out/session-unavailable.
- Never accept `userId` as authority.
- Parse every success/error envelope.
- Reject unexpected/malformed response shapes.
- Map Document 15 codes to stable frontend errors.
- Avoid logging headers, bodies, authorization URLs, or raw responses.
- Support aborting stale screen requests.
- Retry safe reads only under an approved bounded policy.
- Never automatically retry OAuth start, reconnect, or disconnect mutations without idempotency semantics.

## 10. Frontend Models

Use YouTube-specific safe DTOs aligned with Document 15: connection ID, channel ID/title/optional handle/custom URL/thumbnail, connection/credential/permission statuses, approved scopes, timestamps, and version.

Do not reuse current `SocialAccount` fields such as `tokenStatus: valid` as the production contract. Credentials are represented only through safe backend status. Provider/database fields never enter models.

Final enum names wait for Document 08; runtime schemas must reject unknown values safely while allowing a generic unsupported-status fallback for display and telemetry.

## 11. Server-State Strategy

Server state includes connection lists/details and verification results. Local component state includes dialog/menu/opening-browser flags and temporary target selection.

Proposed baseline: use an approved server-state library such as TanStack Query for caching, focus/app-resume refetch, mutation invalidation, cancellation, and stale-data handling. It is not installed and requires Documents 09/14 approval. If rejected, implement a small YouTube-only hook/cache rather than duplicating fetch state in screens.

Never place backend connection authority in React Context, AsyncStorage, module-level maps, or a global client store.

## 12. Screen Mapping

### `onboarding.tsx`

Retain layout/navigation/accessibility, but replace generic mock mutation with YouTube hooks. The YouTube section displays loading skeleton, disconnected connect action, connected channel cards, reconnect-required state, permission problem, temporary error/retry, and disconnect management.

Other platform mock cards must be clearly unavailable or remain explicitly separate; they cannot count as production-connected accounts.

Remove “Disconnect all” as the YouTube action. Each YouTube channel requires explicit confirmation. A future bulk action needs its own contract.

### `choose-accounts.tsx`

Load only backend-confirmed usable YouTube connections for the YouTube module. Invalid channels display reconnect/manage actions and cannot be selected. Selection uses internal `connectionId`, not platform name or channel title. Do not automatically select the first channel unless Document 05 approves that rule.

Publishing-target persistence must eventually use an approved backend contract. Until it exists, connection work must not silently treat local target selection as durable authority.

### New return route

Proposed route:

```text
/youtube-connection-return
```

It displays a brief verifying state, ignores return claims as authority, refetches backend connections, then navigates to the stored/allowlisted product destination. It supports cold start, warm foreground, signed-out return, offline return, cancellation, expiry, and failure.

Exact route/path requires Document 10 and API/OAuth approval.

## 13. Connect Interaction

1. User presses “Connect YouTube.”
2. Confirm Clerk is loaded/signed in.
3. Disable only the relevant connect action and announce progress.
4. Generate one idempotency key for this intent.
5. Call `POST /api/v1/youtube/oauth/authorizations` with allowlisted return destination.
6. Validate authorization URL/expiry response.
7. Immediately open the system authentication browser.
8. Handle success, cancel, dismiss, browser error, or app interruption.
9. On return, refetch backend state.
10. Show connected only after the backend returns a valid connected channel.

Expo documents `WebBrowser.openAuthSessionAsync(url, redirectUrl)` for Android/iOS/web auth sessions. On iOS, manual `Linking.addEventListener` is unnecessary for this method and can cause side effects. [Expo WebBrowser](https://docs.expo.dev/versions/latest/sdk/webbrowser/)

The frontend must not build Google URLs, scopes, callback URLs, state, PKCE, or prompt parameters.

## 14. Browser Result Handling

- `success`: treat as refetch signal only.
- `cancel`/`dismiss`: announce cancellation and refetch; do not mark failure if backend state later completed.
- Browser error: show safe retry while preserving existing connection state.
- App killed/backgrounded: cold-return route performs refetch.
- Timeout: return to manageable state; backend transaction expiry remains authoritative.

Do not parse Google code/state or provider error descriptions in the client.

## 15. Deep-Link and Native Intent Handling

The app already has scheme `narrial` and `src/app/+native-intent.tsx`. Extend it narrowly only after exact return paths are approved.

Requirements:

- Allowlist scheme, host, and path.
- Normalize Expo `/--/` development paths safely.
- Route approved OAuth returns to the return screen.
- Preserve no arbitrary `returnTo` URL.
- Catch malformed inputs and navigate to a safe fallback.
- Never use deep-link content to mark connected or identify a channel.
- Perform auth/session checks inside app context, not `redirectSystemPath`, because Expo notes native-intent handling lacks application context.
- Cover initial cold link and warm link.
- Web uses approved server/client routing because `+native-intent` is native-only. [Expo native intent handling](https://docs.expo.dev/router/advanced/native-intent/)

## 16. Return Reconciliation

On the return screen:

1. Wait for Clerk state.
2. If signed out, show “Sign in to finish checking your YouTube connection”; never expose whether connection succeeded.
3. If offline, show retry and preserve no false status.
4. Fetch `/connections` or approved connection detail.
5. Match only safe backend records owned by the current session.
6. Render connected, reconnect-required, cancelled/no-change, pending, or failed.
7. Invalidate/refetch all connection consumers.
8. Navigate only to an allowlisted destination.

OAuth transaction ID in a return signal may correlate a refetch but grants no authority.

## 17. Reconnection UI

Show reconnect when backend reports missing scope, revoked/invalid/missing credential, or reauthorization required. Copy states what changed and which functionality is paused. The action calls the connection-bound reauthorization endpoint, opens the system browser, and refetches on return.

If the backend returns `OAUTH_CHANNEL_MISMATCH`, keep the original channel unchanged and explain that a different channel was selected. Never visually replace the old channel before server confirmation.

## 18. Disconnection UI

Channel-specific confirmation must show safe channel identity and explain that Narrial will lose access, pending work may pause/cancel, and remote YouTube channel/videos are not deleted. The confirm action is busy/disabled, calls the backend once with approved idempotency behavior, invalidates/refetches, clears invalid local target selections, and announces success/failure.

Temporary revocation uncertainty must not restore an active UI state after the backend has locally disconnected.

## 19. UI State Matrix

| State | UI behavior |
|---|---|
| Auth loading | Stable skeleton; no connect action |
| Signed out | Sign-in recovery action |
| Loading connections | Accessible card skeletons |
| Empty | Connect YouTube explanation/action |
| Starting authorization | Button busy/disabled; other navigation remains safe |
| Browser open | Progress message; no false connected state |
| Browser cancelled | Neutral cancellation message and refetch |
| Callback pending | “Verifying connection” and bounded polling/refetch |
| Connected/sufficient | Channel card and manage action |
| Partial/missing permission | Clear capability-specific reconnect action |
| Reauthorization required/revoked | Channel remains visible but unusable; reconnect |
| Temporary API/offline failure | Preserve last safe data with stale indicator/retry |
| Unknown backend status | Generic unavailable state; telemetry; no privileged action |
| Disconnecting | Confirm action busy; target temporarily unavailable |
| Disconnected | Removed from active target list; optional safe history management |

## 20. Loading, Refetch, and Race Rules

- Abort/ignore stale requests on unmount, user switch, and newer load generation.
- Query keys include authenticated session boundary, never raw tokens.
- Clear cached user-owned data immediately on sign-out/user change.
- Refetch on screen focus, app foreground after browser return, successful mutation, and explicit retry.
- Coalesce simultaneous connection-list requests.
- Do not render empty while initial load is pending.
- Preserve last safe data on temporary refresh failure with a visible stale/error cue.
- Do not optimistically mark connect/reconnect/disconnect success before backend confirmation.

## 21. Error Mapping

Map stable Document 15 codes to actions:

- Authentication errors → sign-in/session recovery.
- OAuth expired/used/invalid → start again.
- Access denied → neutral cancellation.
- Missing permission/reauthorization → reconnect.
- Channel unavailable → explain usable channel requirement.
- Channel mismatch → keep original and offer correct-account retry.
- Rate/quota/provider unavailable → retry later.
- Network/offline → retry without losing safe cached state.
- Concurrency/idempotency conflict → refetch and show current state.
- Unknown/internal → generic message plus request ID; no internal detail.

Do not render raw backend/provider messages automatically.

## 22. Accessibility

Preserve existing accessible roles/labels/live regions and add:

- Meaningful channel-card labels including status.
- `busy`, `disabled`, `checked`, and `expanded` states.
- Polite announcements for connect, verify, reconnect, disconnect, and error outcomes.
- Focus/accessibility focus movement to errors/dialog titles/return result where practical.
- Minimum touch targets and readable Dynamic Type behavior.
- Status text/icons in addition to color.
- Labeled thumbnail with fallback semantics.
- Screen-reader-friendly confirmation dialogs.
- Reduced-motion behavior; no required information conveyed only through animation.

Target WCAG 2.1 AA principles and equivalent native accessibility behavior. Test VoiceOver, TalkBack, keyboard/web, and large text.

## 23. Responsive and Visual Requirements

Reuse the existing Narrial black/lime palette, typography hierarchy, spacing, safe-area behavior, maximum content width, and pressed/disabled language. Do not redesign into generic gradients/card grids. Test compact phones, normal phones, tablets, web widths, landscape where supported, long channel titles, missing thumbnails, and large accessibility text.

## 24. Dependency Plan

Existing Expo Router, WebBrowser, Linking, and Clerk packages cover the baseline browser/auth/navigation mechanics. No package installation is authorized here.

Decision required: install an approved server-state/runtime-schema solution or implement minimal YouTube-only equivalents. Any addition follows Document 09: exact version, package/lockfile review, scripts/provenance/license/audit, tests, typecheck, lint, and build.

Do not install a Google OAuth client SDK in Expo; Google authorization parameters and token exchange are backend responsibilities.

## 25. Mock Migration

Migration order:

1. Add production YouTube DTOs/API client behind a feature flag.
2. Add deterministic API fakes matching Document 15.
3. Convert onboarding YouTube card to the new hook while other mocks remain isolated.
4. Implement browser/return reconciliation.
5. Convert choose-accounts YouTube targets to backend connection IDs.
6. Pass component/integration/device staging tests.
7. Remove only YouTube authority from `social-accounts.ts`.
8. Remove fabricated `youtube-primary`/`Narrial AI` identity and YouTube mock tests.
9. Retain unrelated mock platforms without treating them as production.

Do not delete all `social-accounts.ts` behavior until every consumer has been inventoried and equivalent approved behavior exists.

## 26. Implementation Slices

1. Safe models, runtime schemas, fake API, error mapper.
2. Authenticated API client and connection query hooks.
3. YouTube card/list/loading/error/reconnect components.
4. Onboarding integration without live browser.
5. OAuth start and system-browser session.
6. Deep-link/native-intent return and server refetch.
7. Reconnection/disconnection UI.
8. Choose-accounts integration with connection IDs.
9. Remove YouTube mock authority.
10. Real-device staging verification and leakage/accessibility review.

Each slice keeps tests, typecheck, lint, build, and existing navigation passing. Incomplete functionality remains feature-flagged off.

## 27. Testing

Unit-test response/error parsing, URL allowlists, return mapping, selection eligibility, stale-request protection, and unknown statuses. Component-test every state, accessible labels/states, confirmation, reconnect/mismatch, and long/missing metadata. Integration-test Clerk loading/sign-out/token request, authenticated headers without leakage, API malformed data, idempotency reuse, browser success/cancel/dismiss/error, cold/warm/offline return, user switch/cache clearing, refetch, disconnect and target invalidation.

Device/browser-test iOS `ASWebAuthenticationSession`, Android custom tabs, cold/warm app, browser cancellation, Google account selection, deep link, background/foreground, offline return, VoiceOver/TalkBack, large text, and staging channel connect/reconnect/revoke/disconnect. Inspect logs, screenshots, state, storage, analytics, crashes, and network debugging for secrets.

## 28. Decisions Requiring Approval

| ID | Decision | Recommendation | Status |
|---|---|---|---|
| YT-FE-DEC-001 | Feature location | `features/youtube-connection` | Requires approval |
| YT-FE-DEC-002 | Authenticated API token | Clerk `useAuth().getToken()` | Requires backend-auth confirmation |
| YT-FE-DEC-003 | Server state | Approved TanStack Query or minimal YouTube-only cache | Requires approval |
| YT-FE-DEC-004 | Runtime schema | One approved validation solution | Requires approval |
| YT-FE-DEC-005 | Browser | `WebBrowser.openAuthSessionAsync` | Requires approval |
| YT-FE-DEC-006 | Return route | `/youtube-connection-return` | Requires Document 10 approval |
| YT-FE-DEC-007 | Native return | Allowlisted `+native-intent` rewrite and refetch | Requires approval |
| YT-FE-DEC-008 | Web return | Approved server/client redirect for static output | Blocked |
| YT-FE-DEC-009 | Multiple channels | Explicit connection cards/IDs; no default | Depends on Document 05 |
| YT-FE-DEC-010 | Disconnect all | Exclude from YouTube baseline | Requires approval |
| YT-FE-DEC-011 | Publishing target persistence | Backend-owned future contract | Blocked |
| YT-FE-DEC-012 | Other platform mocks | Keep isolated/unavailable | Requires approval |

## 29. Implementation Gate

- [ ] Documents 04/08 finalize UI states/contracts.
- [ ] Backend connection/channel endpoints pass contract/security tests.
- [ ] Non-production API URL and CORS/native access are approved.
- [ ] Clerk backend verification is available.
- [ ] OAuth callback/return URLs and app scheme are approved.
- [ ] Server-state/schema dependency decision is approved.
- [ ] Feature flag and staging credentials/channel are available.
- [ ] Explicit frontend implementation authorization is given.

Current status: **Blocked.**

## 30. Acceptance Criteria

- [x] Existing screens, mocks, auth, router, browser, and native-intent files are mapped.
- [x] Backend authority and secret-free client boundaries are defined.
- [x] Target files, components, hooks, API client, models, and migration order are defined.
- [x] Connect/browser/return/refetch/reconnect/disconnect behavior is defined.
- [x] Loading, empty, error, offline, stale, race, accessibility, responsive, and security states are defined.
- [x] Dependency decisions and implementation/testing slices are gated.
- [x] Only YouTube production integration is in scope.
- [x] No frontend implementation or package installation occurred.
- [ ] Frontend implementation gate is open.

## 31. Approval Record

- [x] User requested generation and addition in one step on 2026-08-26.
- [x] Approval adds documentation only.
- [x] No frontend, backend, dependency, OAuth, deep-link configuration, or external state was changed.
- [ ] Frontend implementation gate is open.

## 32. Prerequisites

- `00-existing-work-and-current-state-audit.md`
- `04-user-journeys-screens-and-interface-states.md`
- `08-domain-model-state-machines-and-api-contracts.md`
- `15-backend-api-endpoints-and-error-contract.md`
- `16-oauth-connection-callback-and-token-lifecycle.md`
- `17-youtube-channel-discovery-permissions-and-management.md`

Prompt-only prerequisites keep dependent decisions provisional.

## 33. Next Document

Proceed to `19-video-source-validation-and-upload-workflow.md`, defining video ownership, supported formats, source validation, resumable YouTube upload sessions, progress, cancellation, retries, and recovery.

Frontend implementation begins only after Section 29 opens.

## 34. Change Log

| Version | Date | Change | Approval |
|---|---|---|---|
| 1.0.0 | 2026-08-26 | Source-verified frontend structure and connection integration baseline generated and added at user request | User approved |
