# Video Link Analysis Checklist

## Phase 1: Contracts and persistence

- [x] Canonical YouTube URL validation is covered by tests.
- [x] Versioned analysis schema and runtime validation are covered by tests.
- [x] Prisma models and additive migration are present.

## Phase 2: API and processing

- [x] Authenticated submit, status, retry, and delete endpoints pass contract tests; completed results are returned with job status.
- [x] Repository operations are scoped by authenticated user ID.
- [x] Worker claiming and terminal/retry behavior pass tests.
- [x] Gemini response parsing rejects malformed output.

## Phase 3: Expo integration

- [x] Pasted links are submitted to the backend.
- [x] The assistant displays real stages and progress.
- [x] Completed analysis is displayed and its reference/job IDs are retained as generation context.
- [x] Failed jobs expose an accessible retry action.

## Final checkpoint

- [x] Backend unit/contract verification, lint, typecheck, build, and Prisma validation pass.
- [x] Frontend tests and TypeScript checks pass; focused lint has no errors.
- [x] Environment documentation and operational limitations are current.
- [ ] Manual public-YouTube smoke test is recorded when a Gemini key is available.

## Environment-dependent verification

- PostgreSQL integration tests require `backend/.env` and a reachable test database.
- A real Gemini smoke test requires `GEMINI_API_KEY`; neither credential is committed to the repository.
