# YouTube Connection Module — YouTube Channel Discovery, Permissions, and Management

## Document Control

| Field | Value |
|---|---|
| Document number | 17 |
| Filename | `17-youtube-channel-discovery-permissions-and-management.md` |
| Module | YouTube Connection |
| Stage | Stage 7 — Connection completion |
| Status | Approved documentation baseline — channel-management implementation not authorized |
| Version | 1.0.0 |
| Last updated | 2026-08-26 |
| Prerequisites | Documents 05, 08, and 16 |
| Next document | `18-frontend-structure-connection-ui-and-api-integration.md` |
| Source-of-truth role | Defines channel discovery, identity, permission validation, metadata synchronization, reconnection, and disconnection management |
| Implementation authorization | None |
| Live YouTube authorization | No |

## 1. Purpose

This document defines how Narrial discovers the OAuth-authorized YouTube channel, establishes stable identity, validates and stores safe metadata, calculates permissions, handles zero/one/multiple results, prevents channel substitution, upserts without duplication, refreshes metadata, detects unavailable/revoked accounts, and manages reconnection/disconnection.

It creates no YouTube calls, routes, repositories, workers, records, or UI.

## 2. YouTube-Only Boundary

Do not add other platforms, generic social identity, unnecessary Google profile/channel data, analytics/membership/comment/revenue/partner capabilities, or channel-brand management. Google email is not channel identity, OAuth consent does not guarantee a usable channel, and a granted scope does not guarantee every operation succeeds.

## 3. Readiness

Documents 05 and 08 remain prompt-only, so cardinality, business behavior, status names, and transitions remain provisional. Document 16 is an approved baseline, but its implementation gate is closed. This document authorizes no implementation.

## 4. Verified YouTube Facts

Use OAuth-authorized `channels.list` with `mine=true` to retrieve zero or more channels owned by the authorized user. The `part` parameter controls returned field groups. `snippet` includes title, custom URL, and thumbnails; `contentDetails` includes related playlists. Retrieve only required parts. Current official documentation lists a one-unit quota cost, which must be rechecked before implementation/release.

Official references:

- [YouTube `channels.list`](https://developers.google.com/youtube/v3/docs/channels/list)
- [YouTube channel resource](https://developers.google.com/youtube/v3/docs/channels)
- [YouTube channel implementation guide](https://developers.google.com/youtube/v3/guides/implementation/channels)
- [Google OAuth scope catalog](https://developers.google.com/identity/protocols/oauth2/scopes)
- [YouTube OAuth authorization](https://developers.google.com/youtube/v3/guides/authentication)

Proposed scopes are `youtube.readonly` for discovery/refresh and `youtube.upload` for approved uploads. Broader `youtube`, `youtube.force-ssl`, and partner scopes are not approved.

## 5. Discovery Request

After Document 16 validates tokens/scopes, call the fixed HTTPS YouTube endpoint with proposed `mine=true&part=snippet`. Use only the credential service's access token, explicit timeout, response validation, safe quota metrics, and no raw logging. Clients cannot control host, parts, filters, or selector.

Initial connection needs channel ID, title, optional custom URL/handle candidate, and thumbnail. It does not need description, statistics, topics, branding/status/audit/content-owner data, or uploads playlist. Add `contentDetails` only when a later approved video-listing workflow requires it.

## 6. Response Validation

Validate response shape, bounded `items`, resource kind where used, non-empty bounded channel ID, requested snippet, bounded title/custom URL, and valid HTTPS thumbnails. Unknown fields are not persisted automatically. Provider data is untrusted text, never executable instructions or trusted HTML. Malformed/inconsistent responses do not update the connection.

## 7. Canonical Identity

`youtubeChannelId` is the only canonical external channel identity. Title, custom URL, handle-like value, thumbnail, description, Google account identity, and uploads playlist ID are mutable/display metadata. Narrial APIs use internal `connectionId`; provider operations use channel ID only when required.

## 8. Safe Metadata

Proposed fields: channel ID, current title, optional approved handle/custom URL, optional thumbnail URL, and last synchronization time.

- Channel ID is immutable identity.
- Do not derive a handle until an official transformation rule is approved; current channel documentation exposes `snippet.customUrl`, not a guaranteed handle field.
- Prefer `high`, then `medium`, then `default` thumbnail, otherwise none.
- Use returned HTTPS thumbnail URLs without rewriting host/scheme.
- Do not persist description, subscriber/view/video counts, country, topics, branding, audits, content-owner data, Google profile, raw response, or ETag without a later approved purpose.

Any new field requires product purpose, privacy classification, API/quota review, schema/contract change, and retention rule.

## 9. Zero, One, or Multiple Results

Zero: do not create a usable connection/envelope; revoke new credentials best-effort; record `YOUTUBE_CHANNEL_UNAVAILABLE`; provide safe recovery.

One: validate identity/metadata/scopes and complete connection/upsert.

More than one: never choose by order/title/handle or expose raw data/tokens; record ambiguity; stop completion; require staging research and approved selection design. Official API returns zero or more items, so personal/Brand Account behavior must be tested rather than assumed.

## 10. Multiple Connections

Provider multi-result behavior differs from a Narrial user connecting multiple channels via separate grants. Database uniqueness remains `(narrial_user_id, youtube_channel_id)`. Multiple connected channels are allowed only if Document 05 approves them. Each needs a distinct connection/envelope and explicit upload/publication target. No default/unlimited rule is inferred.

## 11. Scope and Permission Model

| Capability | Proposed required scope | Status |
|---|---|---|
| Discover/display channel | `youtube.readonly` | Requires approval |
| Refresh identity/metadata | `youtube.readonly` | Requires approval |
| Upload videos | `youtube.upload` | Requires approval |
| Broader account management | `youtube` | Not approved |
| Edit/delete/comments/captions | `youtube.force-ssl` | Not approved |
| Partner operations | Partner scopes | Out of scope |

Proposed permission states: `SUFFICIENT`, `PARTIALLY_GRANTED`, `MISSING_REQUIRED_SCOPE`, `REAUTHORIZATION_REQUIRED`, `REVOKED`, `UNKNOWN`.

`SUFFICIENT` requires all mandatory scopes, usable credentials, successful discovery, exact identity match, no revocation, and active connection. `PARTIALLY_GRANTED` exists only if optional capabilities are approved. Scopes do not prove channel existence, feature eligibility, project audit, quota, or operation success.

## 12. Permission Validation

Validate after token exchange/reauthorization, before the first stale sensitive operation, after relevant refresh-scope change, on manual verification, after provider authorization failure, and in approved periodic work.

Verify user/worker authority, load state, reject disconnect, refresh token when needed, compare scopes, call `channels.list(mine=true)` when required, confirm channel ID, transactionally update state, audit safely, and return safe data. Never perform destructive actions just to test permissions.

## 13. Completion and Upsert

After validation, encrypt credentials then transactionally insert/update the owner/channel connection, replace envelope and scopes, update metadata/timestamps/status, append events, and create outbox work. Google calls stay outside the database transaction; client refetch confirms success.

Lookup by authenticated owner plus channel ID. New channel creates one record. Existing connected or reauthorization-required channel preserves internal ID and atomically updates metadata/envelope/scopes. Disconnected history may reactivate only through explicit OAuth and a new envelope if approved. Concurrent callbacks rely on database uniqueness; losers reread and safely handle unused new credentials instead of duplicating.

## 14. Reconnection Identity

Reconnection requires exact equality between returned and stored YouTube channel IDs. On mismatch, preserve connection/credentials/history/work; revoke new credentials best-effort; return `OAUTH_CHANNEL_MISMATCH`; and offer a separate flow only if multiple connections are approved. Matching display fields never proves identity.

## 15. Metadata Refresh

`POST /api/v1/youtube/connections/:connectionId/verifications` authenticates/authorizes, rate-limits/idempotently coalesces, refreshes token when required, calls `channels.list(mine=true, part=snippet)`, enforces identity match, updates display metadata/permissions/timestamps/events, and returns safe connection state.

Proposed periodic baseline: no more than once per 24 hours per active connection unless an operation/error requires it. Cache metadata, rate-limit manual refresh, and avoid API calls on every render. Frequency requires approval; quota cost must be rechecked.

## 16. Availability Outcomes

Matching channel updates metadata. Zero channels move to an approved unavailable/reauthorization state. Different channel is mismatch. Missing mandatory scope requires permission recovery. Revoked credential requires reauthorization. Temporary provider/quota/malformed/unknown failures preserve last verified data and do not automatically disconnect. Disconnected records make no provider call.

## 17. Connection States

Proposed connection states: `PENDING`, `CONNECTED`, `REAUTHORIZATION_REQUIRED`, `DISCONNECTED`, `REVOKED`, `ERROR`. Credential states: `AVAILABLE`, `MISSING`, `EXPIRED`, `REVOKED`, `INVALID`. Document 08 must finalize them.

Connected requires stable identity, mandatory permissions, and usable credentials. Disconnected has no usable credential. Revoked/reauthorization-required blocks privileged work. Temporary refresh failure alone does not destroy credentials. Safe metadata may remain visible with clear inactive status.

## 18. Public Connection Management

List/detail/channel endpoints return internal connection ID, channel ID, safe title/handle/custom URL/thumbnail, connection/credential/permission status, approved scopes, timestamps, and version. Never return tokens, envelope details, Google account identity, raw response/error bodies, or worker data.

If multiple connections are approved, uploads/publications require explicit `connectionId`; invalid targets cannot be selected; target identity is persisted; metadata changes do not alter target; no first-channel default is inferred.

## 19. Disconnection and Reconnection

Disconnection authenticates/locks, blocks new work, attempts revocation, destroys envelope, removes active scopes, marks/timestamps disconnect, preserves approved safe history, pauses/cancels work under Document 05, audits, returns idempotently, and removes active-target eligibility. It does not delete YouTube channel or remote videos.

Reconnection requires explicit OAuth, exact channel match, a new envelope, scope revalidation, metadata refresh, resolved-error clearing, preserved history, approved work restart, and audit. Browser return alone never reactivates.

Disconnection differs from privacy deletion. Deletion separately removes/anonymizes metadata and related data under retention rules and does not delete remote YouTube content unless explicitly approved.

## 20. Errors

| Condition | Stable error |
|---|---|
| No channel | `YOUTUBE_CHANNEL_UNAVAILABLE` |
| Ambiguous multiple channels | `YOUTUBE_CHANNEL_SELECTION_REQUIRED` |
| Reconnect mismatch | `OAUTH_CHANNEL_MISMATCH` |
| Missing scope | `YOUTUBE_PERMISSION_REQUIRED` |
| Invalid/revoked credential | `YOUTUBE_REAUTHORIZATION_REQUIRED` |
| Disconnected | `YOUTUBE_CONNECTION_DISCONNECTED` |
| Cross-user | `YOUTUBE_CONNECTION_NOT_FOUND` |
| Temporary/timeout/quota | Stable provider unavailable/timeout/quota error |
| Connection limit | `YOUTUBE_CONNECTION_LIMIT_REACHED` |
| Concurrent upsert | Safe idempotent result or `CONCURRENCY_CONFLICT` |

Add `YOUTUBE_CHANNEL_SELECTION_REQUIRED` to Document 15 only if the state is approved.

## 21. Security, Quota, and Observability

Authorize before decryption, validate/escape all provider fields, never fetch arbitrary returned URLs, minimize stored data, prevent cross-user disclosure, include data in export/deletion, and audit safely.

Count channel calls by safe environment/operation, cache, rate-limit/coalesce verification, delay nonessential refresh under quota pressure, preserve safe cached metadata, and alert on abnormal volume. Metrics/audits cover discovery, zero/multiple/mismatch, scope, metadata, upsert, reconnect/disconnect without credentials, raw payloads, channel titles/IDs, or raw user identifiers as labels.

## 22. Implementation Slices

1. Normalized channel adapter contract and deterministic zero/one/multiple/malformed/failure fixtures.
2. Pure approved scope/capability evaluator.
3. OAuth completion with transactional upsert/concurrency.
4. Verification, token refresh integration, identity check, quota/rate controls, metadata events.
5. Mismatch, historical reconnect, target exclusion, work handling, credential destruction.
6. Explicitly authorized personal/Brand/alternate-channel staging verification with sanitized evidence.

Each slice passes tests, typecheck, lint, build, and leakage inspection.

## 23. Tests

Test zero/one/multiple, missing/malformed identity/snippet/title/thumbnail, hostile URLs/text, provider timeout/quota/auth errors; sufficient/missing/optional/unexpected scopes; new/same/reauth/disconnected/concurrent/cross-user upsert; metadata-only changes/rollback; list/detail ownership; manual/coalesced verification; temporary failures preserving state; idempotent disconnect; invalid target; exact reconnect identity; no token/raw-response/PII leakage.

## 24. Staging Verification

After authorization: connect the approved channel; verify ID/metadata/scopes/ciphertext; reconnect without duplicate; change display metadata and retain internal ID; attempt another channel and confirm mismatch; test zero-channel behavior; research actual Brand/multiple behavior; revoke and reconnect; disconnect and verify destruction/target removal; inspect all artifacts. Results cannot silently change contracts.

## 25. Decisions Requiring Approval

| ID | Decision | Recommendation | Status |
|---|---|---|---|
| YT-CHANNEL-DEC-001 | Discovery | `channels.list(mine=true)` | Requires approval |
| YT-CHANNEL-DEC-002 | Initial parts | `snippet` only | Requires approval |
| YT-CHANNEL-DEC-003 | Identity | YouTube channel ID | Requires approval |
| YT-CHANNEL-DEC-004 | Metadata | ID/title/optional custom URL-handle/thumbnail/sync time | Requires approval |
| YT-CHANNEL-DEC-005 | Handle | Do not derive without official rule | Requires approval |
| YT-CHANNEL-DEC-006 | Zero channels | Fail and revoke new credential best-effort | Requires approval |
| YT-CHANNEL-DEC-007 | Multiple results | Never choose silently | Requires approval |
| YT-CHANNEL-DEC-008 | Multiple connections/user | Decide in Document 05 | Blocked |
| YT-CHANNEL-DEC-009 | Same channel across users | Decide in Document 12 | Blocked |
| YT-CHANNEL-DEC-010 | Scopes | `youtube.readonly` + approved `youtube.upload` | Requires approval |
| YT-CHANNEL-DEC-011 | Periodic verification | Proposed max once/24h unless triggered | Requires approval |
| YT-CHANNEL-DEC-012 | Disconnected retention | Decide in Documents 05–06/12 | Blocked |
| YT-CHANNEL-DEC-013 | Historical reconnect | Reuse only after exact ID match | Requires approval |

## 26. Implementation Gate

- [ ] Documents 05/08 finalize rules/states.
- [x] Documents 16–17 are approved baselines.
- [ ] OAuth works with fake/mocked provider.
- [ ] Auth/database/encryption/repositories are available.
- [ ] Scopes/staging are approved.
- [ ] Multiple-channel baseline is approved.
- [ ] Adapter/permission contracts pass.
- [ ] Explicit implementation authorization is given.

Current status: **Blocked.**

## 27. Acceptance Criteria

- [x] Authorized `mine=true`, minimal parts, canonical identity, safe metadata, and zero/one/multiple behavior are defined.
- [x] Mandatory/optional permissions and operational eligibility are distinct.
- [x] Exact-match reconnect, upsert uniqueness/concurrency, refresh, temporary failure, disconnect, and target management are defined.
- [x] Security, privacy, quota, observability, test, and staging requirements are defined from official sources.
- [x] Document 16 now references this exact filename.
- [x] No implementation or live YouTube action occurred.
- [ ] Implementation gate is open.

## 28. Approval Record

- [x] User approved adding this documentation baseline on 2026-08-26.
- [x] User approved correcting Document 16's reference.
- [x] Approval does not authorize YouTube calls, routes, packages, database, or UI work.
- [ ] Channel-management implementation gate is open.

## 29. Prerequisites

- `05-functional-requirements-and-business-rules.md`
- `08-domain-model-state-machines-and-api-contracts.md`
- `16-oauth-connection-callback-and-token-lifecycle.md`

Documents 05/08 remain prompt-only, so dependent rules remain provisional.

## 30. Next Document

Proceed to `18-frontend-structure-connection-ui-and-api-integration.md`, defining how the existing Expo screens and mock services transition to production YouTube connection components, authenticated API calls, system-browser OAuth, deep-link return handling, and reconnection UI.

Implementation begins only after Section 26 opens.

## 31. Change Log

| Version | Date | Change | Approval |
|---|---|---|---|
| 0.1.0 | 2026-08-26 | Initial source-verified draft | Superseded by approved baseline |
| 1.0.0 | 2026-08-26 | Approved baseline added; Document 16 reference corrected | User approved |
