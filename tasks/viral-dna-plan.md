# Implementation Plan: Create from Viral DNA

## Existing architecture

The Expo Router client already submits and polls authenticated video-analysis jobs, renders reference media with `expo-video`, and hands completed video IDs to the publishing flow. The Fastify/Prisma backend persists reference videos and validated analysis results. Generation is currently represented by an isolated deterministic client service; no clip-generation, voice, storage, or render provider is configured.

## Architecture decisions

- Derive a versioned `ViralDNA` report from the existing validated `VideoAnalysis`; never re-analyze a completed reference.
- Keep creative-project contracts and deterministic development orchestration in a feature service so UI components do not own business logic.
- Persist the active workflow through a platform storage adapter (web local storage, Expo SecureStore elsewhere).
- Use one connected creation route with explicit DNA, questions, brief, production, and editor phases. Each scene is independently versioned and retryable.
- Preserve the existing generated-video/publishing path as the final handoff. Media generation remains behind a replaceable service boundary until real providers are configured.

## Dependency flow

`VideoAnalysis -> ViralDNA -> ClarificationSession -> CreativeBrief -> VideoProject -> Scene[] -> Timeline -> QualityReport -> Publishing`

## Delivery slices

1. Contracts and DNA derivation, with boundary tests.
2. Adaptive questions, brief construction, production planning, scene retry/versioning, and persistence.
3. Responsive Viral DNA, clarification, progress, and editing workspace UI.
4. Connect completed existing analysis to the workflow and connect final approval to publishing.
5. Typecheck, lint, automated tests, and browser/runtime validation where the environment permits.

## Risks and mitigations

- Real render providers are absent: expose honest development output and keep provider calls isolated.
- Existing worktree is dirty: touch only feature-specific/new files and the narrow completion handoff.
- Native and web persistence differ: hide them behind one async adapter.

## Verification commands

- `node --test src/features/viral-dna/*.test.mjs src/features/video-creation/*.test.mjs`
- `npx tsc --noEmit`
- `npm run lint`
- `npx expo export --platform web`
