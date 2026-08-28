# YouTube Connection Module — Immediate Publishing and YouTube Metadata

## Document Control

| Field | Value |
|---|---|
| Document number | 20 |
| Filename | `20-immediate-publishing-and-youtube-metadata.md` |
| Module | YouTube Connection only |
| Stage | Stage 9 — Immediate publishing vertical slice |
| Status | Approved documentation baseline — implementation not authorized |
| Version | 1.0.0 |
| Date | 2026-08-26 |
| Purpose | Define metadata, audience/privacy settings, optional thumbnail and playlist actions, confirmation, publication, and resulting YouTube identifiers |
| Earlier dependencies | Documents 17 and 19 |
| Operational prerequisite | A securely selected connected channel and a successful resumable upload |
| Next document | `21-scheduled-publishing-workers-and-timezones.md` |

## 1. Purpose

This document defines the production contract for preparing YouTube metadata, obtaining explicit user confirmation, making an uploaded video immediately available under the selected privacy status, optionally setting a custom thumbnail, optionally adding the video to approved playlists, and persisting the resulting YouTube identifiers and outcomes.

It is a specification only. It does not install packages, change OAuth scopes, create database migrations, call YouTube, or implement frontend/backend code.

## 2. Scope

Included:

- Title, description, tags, category, privacy status, audience declaration, synthetic-media disclosure, subscriber-notification preference, and approved defaults.
- Custom video thumbnail validation and upload.
- Selection of existing channel-owned playlists and post-upload playlist placement, if separately approved.
- Review and confirmation immediately before a visibility-changing action.
- Durable publication intent, idempotency, retry/reconciliation, provider identifiers, and user-visible outcomes.
- Processing-aware behavior: uploaded, processing, ready, published, restricted, rejected, failed, and unknown.

Excluded:

- Scheduled publishing, recurring schedules, captions, translations/localizations, playlist creation/editing/deletion, monetization, paid-product-placement workflows, licensing changes, embedding/statistics settings, Shorts classification, live streaming, premieres, brand-partner access, Content Manager, and remote deletion.
- Other social platforms.
- Editing an already published video's metadata after the initial workflow; this requires a later approved contract.

## 3. Prerequisite and Implementation Gate

The immediate-publishing slice begins only after:

1. Document 17 can securely resolve an owned, active YouTube connection and required permissions.
2. Document 19 produces exactly one validated `youtubeVideoId` for an owned upload and distinguishes transfer completion from YouTube processing readiness.
3. Documents 03, 05, 08, 12, 13, and 15 are reconciled with the final metadata, publication, thumbnail, playlist, status, error, and persistence decisions in this document.
4. Google staging credentials and project audit/visibility restrictions are understood and testable.
5. All blocking decisions in Section 27 are explicitly approved.

Current implementation status: **Blocked.**

## 4. Authoritative External Rules

Re-verify these official sources at implementation time:

- [`videos.insert`](https://developers.google.com/youtube/v3/docs/videos/insert) accepts mutable upload fields including title, description, tags, category, privacy, `selfDeclaredMadeForKids`, and `containsSyntheticMedia`; `notifySubscribers` is a request parameter whose documented default is true. Projects subject to YouTube's unverified-project restriction can upload only as private until audit approval.
- [YouTube video resource](https://developers.google.com/youtube/v3/docs/videos) currently limits titles to 100 characters, descriptions to 5000 bytes, and the serialized tags value to 500 characters; privacy values are `private`, `unlisted`, and `public`; it distinguishes upload/processing status and provider rejection/failure.
- [`videos.update`](https://developers.google.com/youtube/v3/docs/videos/update) replaces mutable properties in every included `part`; omitted mutable fields in an included part can be deleted. Updates must use a read/merge/validate/write contract rather than partial-looking payloads.
- [`videoCategories.list`](https://developers.google.com/youtube/v3/docs/videoCategories/list) provides region-specific categories and whether each is assignable.
- [`thumbnails.set`](https://developers.google.com/youtube/v3/docs/thumbnails/set) sets a custom video thumbnail, accepts JPEG/PNG or octet-stream up to 2 MB, supports `youtube.upload`, and can fail if the channel lacks custom-thumbnail permission.
- [`playlistItems.insert`](https://developers.google.com/youtube/v3/docs/playlistItems/insert) adds a video to an existing playlist, requires the playlist/video resource identifiers, cannot add to unsupported system playlists, and requires broader scopes such as `youtube` or `youtube.force-ssl` rather than the currently proposed `youtube.upload` scope.

Provider limits and behaviors may change. Store configurable product rules and verify provider documentation during release review.

## 5. Core Invariants

| ID | Invariant |
|---|---|
| `YT-PUB-INV-001` | Every publication belongs to the authenticated owner, one upload, one connection, and one YouTube video ID. |
| `YT-PUB-INV-002` | The backend derives owner/channel authority; client-provided IDs never authorize a write. |
| `YT-PUB-INV-003` | A publication command is durable and idempotent before any visibility-changing provider call. |
| `YT-PUB-INV-004` | Public or unlisted visibility requires explicit confirmation showing the exact channel and visibility. |
| `YT-PUB-INV-005` | The user must explicitly answer required audience and synthetic-media declarations; Narrial does not infer legal/policy declarations. |
| `YT-PUB-INV-006` | Upload completion, processing completion, publication request, and confirmed remote visibility are distinct states. |
| `YT-PUB-INV-007` | Unknown provider outcomes are reconciled before retrying a visibility-changing action. |
| `YT-PUB-INV-008` | Thumbnail or playlist failure cannot erase a confirmed video publication result. |
| `YT-PUB-INV-009` | Broader playlist scopes are never requested merely because a playlist field appears in the UI. |
| `YT-PUB-INV-010` | Public APIs/logs never expose tokens, raw provider payloads, internal playlist data, or sensitive storage URLs. |

## 6. Workflow Ownership

The frontend owns temporary form state and confirmation presentation. The backend owns validation, authenticated ownership, canonical publication state, idempotency, credentials, provider calls, and safe errors. YouTube owns the final remote video metadata, processing state, visibility, thumbnail, playlist membership, restrictions, and identifiers.

The client may optimistically validate lengths for usability, but only backend validation can authorize work. Provider responses are untrusted and schema-validated before persistence or display.

## 7. Publication Resource

Proposed safe `YouTubePublication` fields:

- `publicationId`, `uploadId`, `connectionId`, `youtubeVideoId`.
- `title`, `description`, `tags`, `categoryId`, `privacyStatus`.
- `audienceSelection`, `containsSyntheticMedia`, `notifySubscribers`.
- Thumbnail status and safe thumbnail URL when confirmed.
- Requested playlist IDs plus per-playlist normalized outcome and safe `playlistItemId` when confirmed.
- Publication status, processing summary, safe failure/recovery action, `publishedAt`, `lastSynchronizedAt`, timestamps, and `version`.

Credentials, raw Google responses/errors, ETags unless privately required, request headers, provider session URI, storage keys, signed thumbnail URLs, worker/lease data, and internal audit records are excluded from public DTOs.

## 8. Metadata Draft and Freeze

Metadata may be edited locally before submission. On `POST /publications`, the backend validates and freezes a canonical snapshot bound to the publication request hash. The upload worker uses this snapshot when initializing `videos.insert`, or an approved metadata worker applies it before visibility changes.

Changing frozen metadata creates an explicit versioned command before publication; it never silently changes an in-flight request. Once publication becomes externally visible, later edits are outside this document.

Canonicalization is conservative:

- Preserve meaningful Unicode and line breaks.
- Normalize line endings and reject prohibited control characters.
- Trim accidental leading/trailing whitespace where approved, but do not rewrite user meaning.
- Count title by Unicode characters and description by UTF-8 bytes according to the provider rule.
- Preserve tag order after normalization; do not silently truncate any field.
- Reject invalid input with field-level stable errors and show the applicable limit.

## 9. Title

Title is required, non-empty after approved trimming, valid UTF-8, free of `<` and `>`, and at most the current YouTube limit of 100 characters. Narrial must not silently derive the production title from a filename or AI output unless the user sees and confirms it.

Client and server use the same documented counting test fixtures, including emoji, combining characters, whitespace-only values, and boundary cases. The provider remains final authority.

## 10. Description

Description is optional and defaults to an empty string only after the user sees the field. It must be valid UTF-8, exclude `<` and `>`, and remain within the current 5000-byte limit after canonical encoding.

URLs, hashtags, mentions, and line breaks are stored as user-authored text. Narrial does not inject undisclosed tracking links, credentials, internal URLs, or generated disclosure text. If policy requires a disclosure, the user must see its exact final form before confirmation.

## 11. Tags

Tags are optional. The UI presents separate tags; the backend trims each approved value, removes empty entries, applies a documented duplicate/case policy, and computes YouTube's combined limit, including separators and quotation treatment for tags containing spaces. The current combined limit is 500 characters.

An empty tag list omits `snippet.tags`; it must not send an empty string. Narrial never silently drops excess tags. It returns a validation error showing the aggregate limit.

## 12. Category

Category is required if the final provider request sets `snippet`. The backend maintains an environment/region-aware cache populated from `videoCategories.list`, storing only assignable categories and their provider IDs. The client submits a category ID from the current backend list; the backend revalidates assignability at submission.

Do not hardcode category `22` as a permanent default. If a product default is approved, display it, allow changing it, and revalidate it by region. Category cache freshness and fallback behavior require approval.

## 13. Audience and Content Declarations

The user must explicitly select one of:

- `MADE_FOR_KIDS`
- `NOT_MADE_FOR_KIDS`

No preselected value is allowed unless legal/product approval explicitly authorizes it. Map the choice to `status.selfDeclaredMadeForKids`. `status.madeForKids` is provider-owned current status and is not written as the user's declaration.

The user must also explicitly answer whether the video contains realistic altered or synthetic media requiring disclosure. Map the answer to `status.containsSyntheticMedia`. Narrial may explain the YouTube definition but must not make the declaration automatically based on AI involvement.

Paid product placement, age restriction, and other policy declarations are not silently inferred or implemented. If required for release, add separate explicit fields and provider contracts through change control.

## 14. Privacy Status and Immediate Publishing

Supported provider values are `private`, `unlisted`, and `public`:

- `PRIVATE`: only authorized viewers/channel management can access it; it is not an immediate public release.
- `UNLISTED`: anyone with the link may access it; treat this as an external visibility change requiring confirmation.
- `PUBLIC`: publicly discoverable subject to YouTube behavior; requires the strongest confirmation.

Recommended safety baseline: create/upload as `private`, wait for required processing checks, then perform a distinct confirmed `videos.update` to `unlisted` or `public`. This reduces accidental exposure and makes the irreversible boundary explicit, but it remains a blocking approval decision. Official `videos.update` documentation requires a broader scope such as `youtube` or `youtube.force-ssl`; the currently proposed `youtube.upload` scope is insufficient, so this step is blocked until explicit scope approval and reauthorization.

If the Google API project is subject to the unverified-project restriction, Narrial must show that public/unlisted publication is unavailable rather than reporting false success.

`publishAt` is excluded here and belongs to Document 21. Immediate publishing must not send a scheduled time.

## 15. Subscriber Notifications

`notifySubscribers` is a `videos.insert` request parameter, and its official default is true. Narrial must never rely on that implicit default. The UI and backend must use an explicitly approved value and show it before confirmation.

If publication uses the recommended private-first and later `videos.update` flow, verify from current official behavior whether subscriber notification can be controlled at the actual visibility transition. Until verified, do not promise notifications. Record the result as a blocking decision and test with a designated channel.

## 16. Custom Thumbnail

Custom thumbnail is optional and is a separate provider operation after a valid `youtubeVideoId` exists.

Validation requirements:

- Source belongs to the authenticated publication owner.
- Actual content is JPEG or PNG; extension/client MIME are hints only.
- Authoritative size is nonzero and no more than the current 2 MB provider maximum; Narrial may approve a smaller product limit.
- Decode safely with resource limits; reject corrupt, polyglot, executable, animated, or unsupported content.
- Recommended dimensions/aspect ratio are presented as guidance, not invented provider acceptance guarantees.

The backend calls the fixed `thumbnails.set` endpoint using the credential service and `youtubeVideoId`. It validates the response, records safe thumbnail URLs/status, and never exposes upload credentials or storage URLs.

Thumbnail outcomes are independent:

- Success marks `THUMBNAIL_SET`.
- Permission/eligibility failure shows a specific safe action and preserves the video/publication.
- Rate limit/transient errors may be retried idempotently after reconciliation.
- Failure does not roll back or duplicate a confirmed publication.

## 17. Playlist Handling and Scope Gate

Playlist placement is optional and occurs after YouTube returns a video ID. The client may list only playlists verified as owned/manageable through backend APIs. Special system playlists that do not accept insertion are excluded.

Critical scope constraint: `playlistItems.insert` does not list `youtube.upload`; it requires broader permission such as `youtube` or `youtube.force-ssl`. Document 17 currently proposes `youtube.readonly` plus `youtube.upload`. Therefore playlist insertion is **blocked and disabled by default** until the user approves broader scope, Document 11/16 consent configuration is updated, existing connections are reauthorized, Document 13 reviews least privilege, and contract tests pass.

When approved:

- Validate playlist ownership and target connection on the backend.
- Submit `snippet.playlistId` and `snippet.resourceId` with kind `youtube#video` and the confirmed `youtubeVideoId`.
- Create one durable placement record per playlist with idempotency and reconciliation.
- Store returned `playlistItemId`; do not infer success from request completion alone.
- Treat already-present membership as an approved idempotent success only after verification.
- A playlist failure is partial success and never reverses publication.

Creating playlists, changing order/position, and removing membership are excluded.

## 18. Confirmation Experience

Immediately before any provider-side publication command, show a review screen containing:

- Selected YouTube channel title and safe identity.
- Video title and a reviewable description/tags summary.
- Category.
- Audience and synthetic-media declarations.
- Exact privacy choice with plain-language consequences.
- Subscriber-notification choice and any uncertainty limitation.
- Optional thumbnail preview/status.
- Optional playlist names and explicit note if additional permission is required.
- A warning that provider processing/restrictions may delay or prevent visibility.

The primary action label is explicit, such as `Publish publicly on YouTube`, `Publish as unlisted`, or `Keep private`; never generic `Continue`. Public/unlisted confirmation is not prechecked, double taps are disabled, accessibility focus moves to errors/status, and the user can return to edit before submission.

After submission, the form snapshot is frozen. Closing the app does not cancel durable work.

## 19. Immediate Publication Lifecycle

Proposed states:

`DRAFT → VALIDATED → AWAITING_CONFIRMATION → CONFIRMED → PROCESSING → PUBLISHING → PUBLISHED`

Additional states:

- `PRIVATE_READY`: uploaded/processed and intentionally private.
- `PARTIALLY_COMPLETED`: core visibility confirmed but thumbnail or playlist actions failed/pending.
- `REAUTHORIZATION_REQUIRED`.
- `OUTCOME_UNKNOWN`.
- `FAILED_RETRYABLE`.
- `FAILED_TERMINAL`.
- `CANCELLED` only before an irreversible provider visibility change begins.

Final enum names require Document 08 approval. `PUBLISHED` requires provider-confirmed requested privacy/visibility; a successful HTTP request without validated state is insufficient.

## 20. Provider Operation Order

Recommended private-first sequence:

1. Persist validated publication intent, metadata snapshot, declarations, desired privacy, and idempotency record.
2. Upload via Document 19 as private with required metadata/declarations where supported.
3. Persist and verify the returned `youtubeVideoId` and target channel.
4. Synchronize until minimum approved YouTube processing eligibility is met.
5. Set custom thumbnail if supplied; record independent outcome.
6. Re-read the current video resource and construct a complete `videos.update` body for every included part so required/previous fields are not deleted.
7. Apply the confirmed immediate privacy status.
8. Re-read/reconcile provider state and persist confirmed visibility/time.
9. If broader scope is approved, add playlist memberships independently and persist each `playlistItemId`.
10. Return/show the normalized publication plus any partial-success actions.

Provider calls occur outside database transactions. Each step is durable, lease-protected, restart-safe, and independently reconcilable.

## 21. Update Safety

YouTube update semantics are replacement-oriented for included parts. Before `videos.update`:

- Fetch current authorized resource parts required for the update.
- Validate provider response.
- Merge only approved user changes into a complete writable representation.
- Include required fields such as title and category when updating `snippet`.
- Include only parts intentionally being updated.
- Use version/concurrency controls locally and reconcile after timeouts.

Never send a partial `snippet` expecting omitted description/tags to remain unchanged. Never accept arbitrary provider parts or fields from the client.

## 22. Idempotency, Retries, and Unknown Outcomes

`POST /publications` uses one client-generated idempotency key per logical publication intent, atomically claimed with owner and canonical request hash. Same key/same hash replays the safe result; same key/different payload fails loudly.

The publish command and each thumbnail/playlist placement have distinct durable operation identities. Retry rules:

- Network timeout after `videos.update`, `thumbnails.set`, or `playlistItems.insert` yields unknown outcome until a read verifies current provider state.
- Reconcile privacy, thumbnail status, or playlist membership before repeating the write.
- Retry transient provider/storage/credential failures with bounded backoff, jitter, `Retry-After`, and attempt limits.
- Revoked credentials require reauthorization; validation and permission failures are terminal until user correction.
- Never re-run `videos.insert` for publication; reuse the confirmed video created by Document 19.
- Partial auxiliary failure must not cause a second video or visibility toggle.

## 23. Resulting Identifiers and Public Contract

Persist privately with owner/connection binding:

- Internal `publicationId`, `uploadId`, `connectionId`.
- Canonical `youtubeVideoId` returned/verified from the upload.
- Optional `youtubePlaylistItemId` per successful placement.
- Provider timestamps and safe synchronization evidence.

The public response may return the internal IDs, `youtubeVideoId`, normalized metadata/status, safe thumbnail URL, playlist-placement summaries, visibility, timestamps, and a backend-generated/validated YouTube watch or Studio navigation URL if approved.

Never accept an arbitrary watch URL as authority. Construct URLs from a validated video ID and fixed allowlisted YouTube origin, or return the ID only. Do not expose raw ETags, channel credentials, scopes beyond safe status, or provider payloads.

## 24. Error and Partial-Success Contract

Use Document 15's stable error envelope and add/reconcile codes before implementation:

| Category | Example stable code/behavior |
|---|---|
| Metadata | `YOUTUBE_TITLE_INVALID`, `YOUTUBE_DESCRIPTION_INVALID`, `YOUTUBE_TAGS_INVALID`, `YOUTUBE_CATEGORY_INVALID` |
| Declaration | `YOUTUBE_AUDIENCE_REQUIRED`, `YOUTUBE_SYNTHETIC_MEDIA_DECLARATION_REQUIRED` |
| Privacy | `YOUTUBE_PRIVACY_INVALID`, `YOUTUBE_PUBLICATION_NOT_ALLOWED`, project-audit restriction message |
| Processing | `YOUTUBE_VIDEO_NOT_READY`, processing/rejection safe status |
| Thumbnail | `YOUTUBE_THUMBNAIL_INVALID`, `YOUTUBE_THUMBNAIL_NOT_ALLOWED`, retryable rate-limit outcome |
| Playlist | `YOUTUBE_PLAYLIST_PERMISSION_REQUIRED`, `YOUTUBE_PLAYLIST_NOT_FOUND`, `YOUTUBE_PLAYLIST_INSERT_NOT_ALLOWED` |
| Concurrency | Existing idempotency/active-operation conflict codes |
| Provider | Safe rate, quota, temporary, malformed-response, reauthorization, or unknown-outcome code |

If core publication succeeds but auxiliary actions fail, return `PARTIALLY_COMPLETED` with per-action status and recovery controls. Never present the whole action as failed in a way that encourages another video upload.

## 25. Persistence and Audit Requirements

Document 12 must support:

- Publication metadata snapshot, desired/confirmed privacy, audience/synthetic declarations, notification choice, provider video identity, state/failure/retry, timestamps, version.
- Optional thumbnail source/reference, validation/status/attempts, safe confirmed URL, cleanup.
- Optional playlist placement records with playlist ID, returned playlist-item ID, status/attempts/failure, and uniqueness for publication/playlist.
- Idempotency, status events, outbox/jobs, reconciliation evidence, and secret-free audit events.

Audit creation, confirmation, target channel, privacy choice, declaration presence (not sensitive raw content), provider transition, partial failure, retry, and final outcome. Do not log descriptions, tags, thumbnail bytes/URLs, tokens, raw errors, or unnecessary personal data.

## 26. Security and Privacy Controls

- Authenticate and authorize every publication, upload, thumbnail, playlist, and status resource before provider calls.
- Revalidate connection ownership and credential/scope health immediately before each privileged operation.
- Bound every string/list/image, validate Unicode/bytes/enums/IDs, encode UI output, and treat provider content as untrusted.
- Rate-limit publication, retry, thumbnail, playlist, category refresh, and status polling independently.
- Keep thumbnail storage private with short-lived access and cleanup/retention rules.
- Do not send metadata or thumbnail content to analytics, AI, or unrelated services without explicit approved purpose and consent.
- Require fresh confirmation when the target channel or visibility changes after review.
- Protect against confused-deputy actions by binding provider video/channel identity to the original connection and authenticated owner.
- Never broaden OAuth scopes without explicit approval and incremental-consent/reconnection UX.

## 27. Decisions Requiring User Approval

| Decision ID | Decision | Recommendation | Blocks |
|---|---|---|---|
| `YT-PUB-DEC-001` | Upload/publish privacy strategy | Private-first, then confirmed visibility update | Provider operation order |
| `YT-PUB-DEC-002` | Supported immediate privacy values | Private, unlisted, public with explicit consequences | UI/API |
| `YT-PUB-DEC-003` | Default privacy | Private; no public/unlisted default | Form behavior |
| `YT-PUB-DEC-004` | Audience default | None; require explicit choice | Submission |
| `YT-PUB-DEC-005` | Synthetic-media default | None; require explicit choice | Submission |
| `YT-PUB-DEC-006` | Subscriber notification | Explicit choice; default off until behavior is provider-tested | Upload contract |
| `YT-PUB-DEC-007` | Category default/cache region and TTL | No permanent hardcoded category; cache assignable regional list | Category UI/service |
| `YT-PUB-DEC-008` | Custom thumbnail in first release | Include only with validated storage/permission UX | Thumbnail implementation |
| `YT-PUB-DEC-009` | Thumbnail product dimensions/size | Follow current provider max, recommend 16:9, validate actual JPEG/PNG | Validation |
| `YT-PUB-DEC-010` | Playlist placement in first release | Defer unless broader scope is explicitly accepted | OAuth/API/UI |
| `YT-PUB-DEC-011` | If playlists enabled, broader OAuth scope | Prefer narrowest verified scope; security review required | Reauthorization |
| `YT-PUB-DEC-012` | Minimum processing state before visibility | Wait for provider-confirmed processing eligibility | Worker/tests |
| `YT-PUB-DEC-013` | Auxiliary-operation ordering | Thumbnail before visibility; playlists after video ID/visibility reconciliation | Orchestration |
| `YT-PUB-DEC-014` | Metadata editing after publication | Defer to separate change-controlled feature | Scope |
| `YT-PUB-DEC-015` | Publication/metadata/thumbnail retention | Define privacy/export/delete rules before production | Database/cleanup |

Recommendations are not approvals. Record every accepted decision in Document 03 and update Documents 05, 08, 11–13, 15–17, and 19 where affected.

## 28. Implementation Order

After the gate opens:

1. Approve Section 27 and freeze models, states, fields, errors, and scopes.
2. Update database/API contracts and apply approved development migrations.
3. Implement shared metadata schemas and provider-verified category service.
4. Implement durable publication intent, confirmation snapshot, idempotency, and ownership checks.
5. Integrate private-first metadata with Document 19 upload initialization.
6. Implement processing gate and safe full-part `videos.update` publication adapter.
7. Implement reconciliation before retry and result/status endpoints.
8. If approved, implement thumbnail validation/storage and `thumbnails.set` independently.
9. If approved, expand OAuth consent and implement playlist discovery/placement independently.
10. Add frontend form, validation, review, confirmation, progress, partial-success, and recovery states.
11. Add audit, metrics, alerts, retention, and cleanup.
12. Run staged private/unlisted/public tests using a designated channel and complete security/acceptance review.

Dependency installation remains governed by Document 09. This document authorizes none.

## 29. Testing Strategy

### Unit tests

- Unicode title counting; UTF-8 description byte counting; `<`/`>` and control-character rejection.
- Tag normalization and YouTube aggregate-count rules, including spaces/quotes/commas.
- Category assignability/cache behavior and unknown IDs.
- Required audience/synthetic declarations; privacy enum; notification explicitness.
- Request canonicalization/hash, state transitions, safe URL construction, response/error redaction.
- Full-part update merge that preserves description/tags/category and excludes unapproved fields.

### Contract and integration tests

- Authentication/ownership, cross-owner IDs, connection/video binding, reauthorization, stable errors.
- Idempotency replay/mismatch/concurrency and worker redelivery.
- Private-first insert snapshot, processing gate, public/unlisted/private update and verification.
- Provider timeout before/after effect; reconcile before retry; malformed response; quota/rate/5xx/4xx.
- Unverified-project forced-private behavior.
- Thumbnail valid/invalid type, corrupt/polyglot/over-limit, no permission, rate limit, timeout-after-effect, success.
- Playlist disabled under `youtube.upload`; scope upgrade/reconnect when approved; ownership, unsupported system playlist, duplicate membership, partial failure.

### End-to-end tests

- Upload succeeds → metadata review → explicit declarations → confirm private/unlisted/public → one video ID → provider-confirmed outcome.
- App closes after confirmation and later restores accurate state.
- Public/unlisted confirmation clearly shows channel and consequence.
- Core publication succeeds while thumbnail/playlist fails; UI shows partial success without offering duplicate upload.
- No credentials, raw provider payloads, internal IDs beyond contract, or sensitive URLs appear in network/UI/logs.

### Accessibility and nonfunctional tests

- Labels, help/error association, keyboard/focus order, screen-reader announcements, contrast, reduced motion, and non-color status cues.
- Long Unicode/RTL metadata, slow/offline states, double tap, concurrent device submission, retry storm, and provider degradation.
- Quota-call accounting and polling/category cache behavior.

## 30. Acceptance Criteria

- [ ] Title, description, tags, and category enforce current provider rules on client and backend without silent truncation.
- [ ] Audience and synthetic-media declarations require explicit user answers and map to the correct writable fields.
- [ ] Privacy consequences and target channel are shown immediately before confirmation.
- [ ] Immediate publication is durable/idempotent and cannot create another video.
- [ ] Upload, processing, publication, and visibility states are distinct and provider-confirmed.
- [ ] Unknown visibility outcomes reconcile before retry.
- [ ] `videos.update` preserves required/unchanged fields through safe full-part semantics.
- [ ] Custom thumbnail is separately validated, authorized, persisted, retried, and cannot roll back publication.
- [ ] Playlist placement remains disabled without approved broader OAuth permission.
- [ ] Approved playlist placement verifies ownership, records `playlistItemId`, and reports partial failures safely.
- [ ] Result includes the canonical `youtubeVideoId` and only approved safe identifiers/URLs.
- [ ] Authentication, ownership, scope, rate-limit, redaction, audit, privacy, retention, and accessibility tests pass.
- [ ] All blocking decisions are recorded in Document 03 and aligned across prerequisite documents.
- [ ] No other-platform functionality was introduced.

## 31. Approval Record

Approval to add this file approves only the documentation baseline. It does not approve broader OAuth scopes, playlist access, publication defaults, Google API calls, dependency installation, migrations, infrastructure, or implementation.

## 32. Prerequisites and Next Document

Direct prerequisites:

- `17-youtube-channel-discovery-permissions-and-management.md`
- `19-video-source-validation-and-upload-workflow.md`

Inherited prerequisites include Documents 03, 05, 08, and 11–16 wherever this document changes decisions, storage, security, database, OAuth, and API contracts.

Next: `21-scheduled-publishing-workers-and-timezones.md`, defining timezone-safe schedules, private-video prerequisites, durable jobs, rescheduling/cancellation, worker execution, missed schedules, retries, reconciliation, and user-visible outcomes.

## 33. Change Log

| Version | Date | Change | Approval |
|---|---|---|---|
| 1.0.0 | 2026-08-26 | Source-verified immediate publishing and YouTube metadata baseline generated and added at user request | User approved document creation only |
