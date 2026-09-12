import { afterEach, describe, expect, it } from 'vitest';

import { buildApp } from '../src/app.js';
import type { AuthenticatedUser, AuthenticationVerifier } from '../src/auth/authentication-verifier.js';
import { InMemoryScriptGenerationRepository } from '../src/story-generation/in-memory-repository.js';
import type { StoryPlanner } from '../src/story-generation/gemini-story-planner.js';
import { ScriptGenerationWorker } from '../src/story-generation/worker.js';
import { InMemoryVideoAnalysisRepository } from '../src/video-analysis/in-memory-repository.js';
import { parseVideoReferenceUrl, VideoAnalysisError } from '../src/video-analysis/domain.js';
import { testConfig } from './fixtures/config.js';

const apps: Array<ReturnType<typeof buildApp>> = [];

function readJobId(body: string) {
  const value = JSON.parse(body) as unknown;
  if (typeof value !== 'object' || value === null || !('data' in value) ||
      typeof value.data !== 'object' || value.data === null || !('id' in value.data) || typeof value.data.id !== 'string') {
    throw new Error('Expected a job response');
  }
  return value.data.id;
}

class FakeAuthenticationVerifier implements AuthenticationVerifier {
  verify(request: Request): Promise<AuthenticatedUser | null> {
    const token = request.headers.get('authorization');
    return Promise.resolve(token === 'Bearer owner-a' ? { userId: 'owner-a' } : token === 'Bearer owner-b' ? { userId: 'owner-b' } : null);
  }
}

class ConcurrentQuotaRepository extends InMemoryScriptGenerationRepository {
  private firstLookupGate?: Promise<void>;
  private releaseFirstLookup?: () => void;

  override async findJobByIdempotencyKeyForUser(idempotencyKey: string, ownerId: string) {
    if (!this.firstLookupGate) {
      this.firstLookupGate = new Promise<void>((resolve) => {
        this.releaseFirstLookup = resolve;
      });
      await this.firstLookupGate;
    } else {
      this.releaseFirstLookup?.();
    }
    return super.findJobByIdempotencyKeyForUser(idempotencyKey, ownerId);
  }
}

const completedAnalysis = {
  schemaVersion: 1 as const,
  summary: 'A short transformation story.',
  durationSeconds: 10,
  subjects: [{ label: 'Creator', description: 'Takes one brave first step.' }],
  scenes: [{ startSeconds: 0, endSeconds: 10, description: 'A closed door opens.' }],
  creativeDNA: {
    openingHook: 'Begin with a mystery', narrativeStructure: 'Question then payoff', pacing: 'Fast',
    visualStyle: ['Close-up'], colorMood: ['Warm'], editingPatterns: ['Hard cut'], audioStyle: 'Voice-over',
  },
  reusableInsights: ['Open with unanswered tension.'], safetyFlags: [],
};

const generatedStory = {
  schemaVersion: 1 as const,
  title: 'A new beginning',
  hook: 'What if one small choice changed everything?',
  story: 'An original story.',
  scenes: [
    { startSeconds: 0, endSeconds: 5, purpose: 'Hook', narration: 'Look closer.', visual: 'A closed door.', emotion: 'Curiosity' },
    { startSeconds: 5, endSeconds: 10, purpose: 'Payoff', narration: 'Take the first step.', visual: 'The door opens.', emotion: 'Hope' },
  ],
  ending: 'Start today.',
  originalityNote: 'Uses only abstract pacing patterns.',
};

async function createApp(
  planner: StoryPlanner = { generate: () => Promise.resolve(generatedStory) },
  maxJobsPerHour = 10,
  scriptRepository: InMemoryScriptGenerationRepository = new InMemoryScriptGenerationRepository(),
  enabled = true,
) {
  const videoRepository = new InMemoryVideoAnalysisRepository();
  const created = await videoRepository.create('owner-a', parseVideoReferenceUrl('https://youtu.be/dQw4w9WgXcQ'), { maxJobsPerHour: 10, globalMaxJobsPerHour: 100, createdAfter: new Date(0) });
  const claimed = await videoRepository.claim(created.job.id, 'owner-a', new Date(Date.now() - 20 * 60 * 1_000));
  await videoRepository.complete(created.job.id, 'owner-a', claimed!.claimToken!, completedAnalysis);
  const scriptWorker = new ScriptGenerationWorker(scriptRepository, videoRepository, planner);
  const app = buildApp({
    config: { ...testConfig, scriptGenerationMaxJobsPerHour: maxJobsPerHour, scriptGenerationEnabled: enabled },
    authenticationVerifier: new FakeAuthenticationVerifier(),
    videoAnalysisRepository: videoRepository,
    scriptGenerationRepository: scriptRepository,
    scriptGenerationWorker: scriptWorker,
  });
  apps.push(app);
  return { app, analysisJobId: created.job.id };
}

afterEach(async () => Promise.all(apps.splice(0).map((app) => app.close())));

describe('script generation job API', () => {
  it('requires authentication and rejects the old client-supplied-analysis boundary', async () => {
    const { app, analysisJobId } = await createApp();
    const unauthorized = await app.inject({ method: 'POST', url: '/api/v1/script-generation-jobs', payload: {
      idempotencyKey: 'd20eadf8-fec1-47bc-ac1b-79fb5506e202', analysisJobId,
      brief: { prompt: 'Create a new story.', questionAnswers: [] },
    } });
    expect(unauthorized.statusCode).toBe(401);
    expect((await app.inject({ method: 'POST', url: '/api/v1/stories/generate', headers: { authorization: 'Bearer owner-a' }, payload: {} })).statusCode).toBe(404);
    expect((await app.inject({ method: 'POST', url: '/api/v1/scripts/generate', headers: { authorization: 'Bearer owner-a' }, payload: {} })).statusCode).toBe(404);
  });

  it('creates a durable job and exposes the generated scene script only to its owner', async () => {
    const { app, analysisJobId } = await createApp();
    const submitted = await app.inject({
      method: 'POST', url: '/api/v1/script-generation-jobs', headers: { authorization: 'Bearer owner-a' },
      payload: {
        idempotencyKey: 'd20eadf8-fec1-47bc-ac1b-79fb5506e202', analysisJobId,
        brief: { prompt: 'Create a new story about courage.', questionAnswers: [{ question: 'Tone?', answer: 'Hopeful' }] },
      },
    });
    expect(submitted.statusCode).toBe(202);
    expect(submitted.json()).toMatchObject({ data: { analysisJobId, status: 'QUEUED', progress: 0 } });
    const jobId = readJobId(submitted.body);

    await new Promise((resolve) => setTimeout(resolve, 10));
    const completed = await app.inject({ method: 'GET', url: `/api/v1/script-generation-jobs/${jobId}`, headers: { authorization: 'Bearer owner-a' } });
    expect(completed.statusCode).toBe(200);
    expect(completed.json()).toMatchObject({ data: { status: 'COMPLETE', progress: 100, story: generatedStory } });
    expect(completed.body).not.toContain('owner-a');

    const hidden = await app.inject({ method: 'GET', url: `/api/v1/script-generation-jobs/${jobId}`, headers: { authorization: 'Bearer owner-b' } });
    expect(hidden.statusCode).toBe(404);
  });

  it('deduplicates repeated creates with the same idempotency key', async () => {
    let calls = 0;
    const { app, analysisJobId } = await createApp({ generate: () => { calls += 1; return Promise.resolve(generatedStory); } });
    const request = {
      method: 'POST' as const, url: '/api/v1/script-generation-jobs', headers: { authorization: 'Bearer owner-a' },
      payload: { idempotencyKey: 'd20eadf8-fec1-47bc-ac1b-79fb5506e202', analysisJobId, brief: { prompt: 'Create an original story.', questionAnswers: [] } },
    };
    const first = await app.inject(request);
    const second = await app.inject(request);
    expect(first.statusCode).toBe(202);
    expect(second.statusCode).toBe(202);
    expect(readJobId(first.body)).toBe(readJobId(second.body));
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(calls).toBe(1);
  });

  it('returns a safe conflict when an idempotency key is reused for different input', async () => {
    const { app, analysisJobId } = await createApp();
    const base = {
      idempotencyKey: 'd20eadf8-fec1-47bc-ac1b-79fb5506e202', analysisJobId,
      brief: { prompt: 'First request.', questionAnswers: [] },
    };
    expect((await app.inject({ method: 'POST', url: '/api/v1/script-generation-jobs', headers: { authorization: 'Bearer owner-a' }, payload: base })).statusCode).toBe(202);
    const mismatch = await app.inject({ method: 'POST', url: '/api/v1/script-generation-jobs', headers: { authorization: 'Bearer owner-a' }, payload: {
      ...base, brief: { prompt: 'Different request.', questionAnswers: [] },
    } });
    expect(mismatch.statusCode).toBe(409);
    expect(mismatch.json()).toMatchObject({ error: { code: 'IDEMPOTENCY_KEY_REUSED' } });
  });

  it('limits unique hourly generation jobs without blocking idempotent replay', async () => {
    const { app, analysisJobId } = await createApp(undefined, 1);
    const firstPayload = {
      idempotencyKey: 'd20eadf8-fec1-47bc-ac1b-79fb5506e202', analysisJobId,
      brief: { prompt: 'First request.', questionAnswers: [] },
    };
    const first = await app.inject({ method: 'POST', url: '/api/v1/script-generation-jobs', headers: { authorization: 'Bearer owner-a' }, payload: firstPayload });
    expect(first.statusCode).toBe(202);
    const replay = await app.inject({ method: 'POST', url: '/api/v1/script-generation-jobs', headers: { authorization: 'Bearer owner-a' }, payload: firstPayload });
    expect(replay.statusCode).toBe(202);
    const limited = await app.inject({ method: 'POST', url: '/api/v1/script-generation-jobs', headers: { authorization: 'Bearer owner-a' }, payload: {
      ...firstPayload, idempotencyKey: 'a228c2b5-273d-49fe-a252-9d10e5e9b864',
    } });
    expect(limited.statusCode).toBe(429);
    expect(limited.json()).toMatchObject({ error: { code: 'SCRIPT_GENERATION_RATE_LIMITED' } });
  });

  it('uses the operational kill switch without creating a script job', async () => {
    const { app, analysisJobId } = await createApp(undefined, 10, undefined, false);
    const response = await app.inject({
      method: 'POST', url: '/api/v1/script-generation-jobs', headers: { authorization: 'Bearer owner-a' },
      payload: {
        idempotencyKey: '1d66ce3c-5d3f-4e0e-bc4d-8f9bc2210e51', analysisJobId,
        brief: { prompt: 'A new story', questionAnswers: [] },
      },
    });
    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({ error: { code: 'SCRIPT_GENERATION_DISABLED' } });
  });

  it('returns service unavailable when a retry is disabled', async () => {
    const { app } = await createApp(undefined, 10, undefined, false);
    const response = await app.inject({
      method: 'POST', url: '/api/v1/script-generation-jobs/d20eadf8-fec1-47bc-ac1b-79fb5506e202/retry',
      headers: { authorization: 'Bearer owner-a' },
    });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({ error: { code: 'SCRIPT_GENERATION_DISABLED' } });
  });

  it('enforces the hourly generation limit when unique requests arrive concurrently', async () => {
    const { app, analysisJobId } = await createApp(undefined, 1, new ConcurrentQuotaRepository());
    const request = (idempotencyKey: string) => app.inject({
      method: 'POST',
      url: '/api/v1/script-generation-jobs',
      headers: { authorization: 'Bearer owner-a' },
      payload: {
        idempotencyKey,
        analysisJobId,
        brief: { prompt: 'Create an original story.', questionAnswers: [] },
      },
    });

    const responses = await Promise.all([
      request('d20eadf8-fec1-47bc-ac1b-79fb5506e202'),
      request('a228c2b5-273d-49fe-a252-9d10e5e9b864'),
    ]);

    expect(responses.map((response) => response.statusCode).sort()).toEqual([202, 429]);
  });

  it('allows a bounded retry after a provider failure', async () => {
    let calls = 0;
    const planner: StoryPlanner = { generate: () => {
      calls += 1;
      return calls === 1 ? Promise.reject(new VideoAnalysisError('STORY_GENERATOR_UNAVAILABLE', 'private provider detail')) : Promise.resolve(generatedStory);
    } };
    const { app, analysisJobId } = await createApp(planner);
    const submitted = await app.inject({ method: 'POST', url: '/api/v1/script-generation-jobs', headers: { authorization: 'Bearer owner-a' }, payload: {
      idempotencyKey: 'd20eadf8-fec1-47bc-ac1b-79fb5506e202', analysisJobId,
      brief: { prompt: 'Create an original story.', questionAnswers: [] },
    } });
    const jobId = readJobId(submitted.body);
    await new Promise((resolve) => setTimeout(resolve, 10));
    const failed = await app.inject({ method: 'GET', url: `/api/v1/script-generation-jobs/${jobId}`, headers: { authorization: 'Bearer owner-a' } });
    expect(failed.json()).toMatchObject({ data: { status: 'FAILED', errorCode: 'SCRIPT_PROVIDER_UNAVAILABLE' } });
    expect(failed.body).not.toContain('private provider detail');

    const retried = await app.inject({ method: 'POST', url: `/api/v1/script-generation-jobs/${jobId}/retry`, headers: { authorization: 'Bearer owner-a' } });
    expect(retried.statusCode).toBe(202);
    await new Promise((resolve) => setTimeout(resolve, 10));
    const completed = await app.inject({ method: 'GET', url: `/api/v1/script-generation-jobs/${jobId}`, headers: { authorization: 'Bearer owner-a' } });
    expect(completed.json()).toMatchObject({ data: { status: 'COMPLETE', story: generatedStory } });
  });
});
