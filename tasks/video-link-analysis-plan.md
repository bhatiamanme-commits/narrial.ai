# Implementation Plan: Video Link Analysis

## Outcome

A signed-in creator can paste a public YouTube URL, receive a durable asynchronous analysis, see real processing progress, and use the completed visual/audio analysis as generation context.

## Architecture decisions

- The backend owns URL validation, jobs, AI credentials, analysis output validation, and user authorization.
- The mobile app sends stable reference/job IDs rather than treating route parameters as authoritative data.
- Public YouTube URLs are the first production source. Narrial sends the URL directly to a video-capable analyzer and does not download YouTube audiovisual content.
- Analysis providers sit behind `VideoAnalyzer`; Gemini is the first adapter.
- Jobs are durable PostgreSQL records and are idempotently claimed by an in-process worker for the MVP. The repository boundary permits a separate worker process later.
- The API returns a versioned Narrial analysis contract, never raw provider output.

## Dependency path

```text
Contract -> database -> repository/service -> HTTP API -> analyzer/worker -> Expo client -> generation context
```

## Delivery phases

1. Define and test URL, analysis, repository, and API contracts.
2. Add Prisma persistence and an additive migration.
3. Add authenticated submission/status/result/delete endpoints.
4. Add the Gemini adapter and asynchronous job runner.
5. Connect the existing paste-link UI and replace simulated progress.
6. Verify security, ownership, failure recovery, builds, and focused user flow.

## MVP boundaries

- Supported: public `youtube.com` and `youtu.be` video URLs.
- Rejected: credentials in URLs, fragments, non-HTTPS URLs, private/local hosts, malformed IDs, unsupported platforms, private/unlisted/unavailable videos.
- Deferred: direct remote files, local uploads, TikTok, Instagram, Vimeo, multi-video analysis, Redis workers, and push progress.

## Release gate

- Backend tests, lint, typecheck, build, Prisma validation, frontend tests, lint, and TypeScript checks pass.
- Cross-user access returns not found.
- Provider errors are sanitized and retryable where appropriate.
- No API key, raw provider response, or owner ID reaches the client.
- The app can recover an in-progress job after navigation or restart when it retains the job ID.

