# Durable Script Generation API

## Product flow

1. The authenticated client creates a public YouTube reference with `POST /api/v1/video-references`. Concurrent repeats of the same active YouTube video for the same user return the existing analysis job rather than paying for another analysis.
2. The client polls `GET /api/v1/video-analysis-jobs/:jobId` until analysis is complete.
3. The user supplies a creative prompt, guided answers, and optional free-form direction.
4. The client creates a script job. The backend reads the completed analysis through the authenticated owner boundary, returns immediately, and generates the script in a recoverable worker.
5. The client polls the script job and renders its validated `story.scenes` when complete.

The model uses the reference only for abstract structure such as pacing, hook function, and narrative progression. The story prompt explicitly rejects copying dialogue, identities, brands, characters, music, and distinctive shots.

## HTTP contract

All endpoints require a Clerk bearer token. UUID path and body fields use canonical JSON strings, request objects reject unknown fields, and every response includes `requestId`.

### Create

`POST /api/v1/script-generation-jobs`

```json
{
  "idempotencyKey": "d20eadf8-fec1-47bc-ac1b-79fb5506e202",
  "analysisJobId": "d066786f-f447-4aef-a54d-69fd255ad122",
  "brief": {
    "prompt": "Create an original hopeful story about taking a first step.",
    "questionAnswers": [
      { "question": "Tone?", "answer": "Hopeful" },
      { "question": "Additional creative direction", "answer": "Use a quiet opening." }
    ]
  }
}
```

Returns `202` with a job in `QUEUED`, `GENERATING`, `COMPLETE`, or `FAILED`. Reusing the same idempotency key and identical input returns the original job. Reusing it with different input returns `409 IDEMPOTENCY_KEY_REUSED`.

### Read and retry

- `GET /api/v1/script-generation-jobs/:jobId`
- `POST /api/v1/script-generation-jobs/:jobId/retry`

Reads are owner-scoped and return `404` for another user. Retry is allowed only for a failed job below the three-attempt limit. A complete job contains the validated scene-by-scene `story`; failed jobs contain only a stable safe `errorCode`.

The removed `/api/v1/stories/generate` and `/api/v1/scripts/generate` endpoints must not be restored: the first trusted client-supplied analysis, and the second held an HTTP request open across two model calls.

## Persistence and worker behavior

- `script_generation_jobs` stores ownership, the source analysis job, normalized brief, idempotency fingerprint, progress, attempts, and the current claim lease.
- `script_generation_results` stores validated model output separately with retention metadata.
- Atomic claims, owner-scoped video-reference deduplication, and unique script idempotency keys prevent duplicate paid work.
- Owner-scoped hourly creation limits (`VIDEO_ANALYSIS_MAX_JOBS_PER_HOUR` and `SCRIPT_GENERATION_MAX_JOBS_PER_HOUR`, both default `10`) and system-wide hourly cost ceilings (`VIDEO_ANALYSIS_GLOBAL_MAX_JOBS_PER_HOUR` and `SCRIPT_GENERATION_GLOBAL_MAX_JOBS_PER_HOUR`, both default `100`) are acquired atomically in PostgreSQL. Identical video replays and script idempotency replays do not consume either limit.
- Per-process concurrency caps (`VIDEO_ANALYSIS_MAX_CONCURRENT_JOBS` and `SCRIPT_GENERATION_MAX_CONCURRENT_JOBS`, both default `2`) bound provider fan-out. Queue overflow remains durable and is recovered by periodic database sweeps.
- A claim lease is derived from the provider timeout plus a one-minute grace period, so stale recovery cannot normally reclaim an in-flight provider call.
- On shutdown, active provider requests are aborted and their jobs are marked failed before persistence disconnects; users can use the bounded retry endpoint.
- `VIDEO_ANALYSIS_ENABLED=false` or `SCRIPT_GENERATION_ENABLED=false` is an operational kill switch that returns `503` for new work and prevents startup recovery for that stage.
- Raw provider errors and owner IDs are never serialized to the client.
- Before it calls the create endpoint, the client stores the normalized idempotent request in platform secure storage. If an accepted create response is lost, the client replays that exact request after sign-in to recover the durable job ID; a stored job is never resumed over a different incoming reference or a new generator session.

## Retention

Reference records, analysis data, user prompt/Q&A, and generated scripts share a 30-day retention window. Reads, claims, retries, and recovery exclude an expired reference immediately. A startup sweep plus an hourly retention worker deletes expired reference rows; database cascades remove their analysis and script children. This does not replace a separate account-deletion workflow or a backup-retention policy.

## Computer-upload boundary

Device paths such as `file://...` are local to the phone/browser and cannot safely be opened by the backend. Production upload support therefore requires an object-storage adapter with this sequence:

1. Authenticated backend creates an owner-scoped upload session and randomized object key.
2. Client uploads directly with a short-lived signed request and strict size/content-type limits.
3. Backend verifies object size, media signature, checksum, and completion before creating an analysis job.
4. Worker resolves a short-lived read URL/object URI by owner at analysis time.
5. Object and metadata expire together and deletion is auditable.

No storage vendor or credentials are configured in this repository, so local-file selection stays explicitly unavailable instead of sending an unusable or unsafe device URI. Cloudflare R2, S3, or GCS can implement the adapter after the product owner chooses the deployment provider, retention, maximum upload size/duration, and regional/privacy policy.

## Verification

From `backend/`, run lint, typecheck, build, Prisma validate/generate, and all tests. Database migration tests additionally require an isolated PostgreSQL test database. From the app root, run Expo lint, TypeScript, and the `*.test.mjs` suite; verify the final interaction in a real browser and target mobile devices before release.
