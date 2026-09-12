import assert from 'node:assert/strict';
import test from 'node:test';

import { createScriptGenerationJob, getScriptGenerationJob, MAX_SCRIPT_ANSWER_LENGTH, retryScriptGenerationJob, ScriptGenerationClientError } from './story-generation-client.ts';

const generatedStory = {
  schemaVersion: 1, title: 'New story', hook: 'A hook', story: 'An original story',
  scenes: [
    { startSeconds: 0, endSeconds: 5, purpose: 'Hook', narration: 'Start', visual: 'A door', emotion: 'Curiosity' },
    { startSeconds: 5, endSeconds: 10, purpose: 'Payoff', narration: 'Finish', visual: 'The door opens', emotion: 'Hope' },
  ],
  ending: 'Begin today', originalityNote: 'Original expression',
};
const queuedJob = {
  id: '1d2809d8-871c-4454-97f4-334217d78093',
  analysisJobId: 'd066786f-f447-4aef-a54d-69fd255ad122',
  status: 'QUEUED', progress: 0, stage: 'Queued for script generation', attemptCount: 0,
  createdAt: '2026-09-11T06:00:00.000Z', updatedAt: '2026-09-11T06:00:00.000Z',
};
const input = {
  apiUrl: 'https://api.example.test', clerkToken: 'token',
  idempotencyKey: 'd20eadf8-fec1-47bc-ac1b-79fb5506e202', analysisJobId: queuedJob.analysisJobId,
  prompt: 'story', questionAnswers: [{ question: 'Additional creative direction', answer: 'Use a quiet opening' }],
};

test('creates a durable generation job from the completed analysis and complete brief', async () => {
  let request;
  const job = await createScriptGenerationJob({ ...input, fetch: async (url, init) => {
    request = { url, init };
    return new Response(JSON.stringify({ data: queuedJob }), { status: 202 });
  } });

  assert.equal(job.status, 'QUEUED');
  assert.equal(request.url, 'https://api.example.test/api/v1/script-generation-jobs');
  assert.deepEqual(JSON.parse(request.init.body), {
    idempotencyKey: input.idempotencyKey,
    analysisJobId: input.analysisJobId,
    brief: { prompt: 'story', questionAnswers: input.questionAnswers },
  });
  assert.equal(request.init.headers.authorization, 'Bearer token');
});

test('polls and validates a complete scene-by-scene story', async () => {
  const job = await getScriptGenerationJob({
    apiUrl: input.apiUrl, clerkToken: input.clerkToken, jobId: queuedJob.id,
    fetch: async () => new Response(JSON.stringify({ data: { ...queuedJob, status: 'COMPLETE', progress: 100, stage: 'Script complete', story: generatedStory } })),
  });
  assert.equal(job.story?.scenes.length, 2);
  assert.equal(job.status, 'COMPLETE');
});

test('retries a failed durable job using the retry endpoint', async () => {
  let requestUrl = '';
  const job = await retryScriptGenerationJob({
    apiUrl: input.apiUrl, clerkToken: input.clerkToken, jobId: queuedJob.id,
    fetch: async (url) => { requestUrl = String(url); return new Response(JSON.stringify({ data: queuedJob }), { status: 202 }); },
  });
  assert.equal(job.status, 'QUEUED');
  assert.equal(requestUrl, `https://api.example.test/api/v1/script-generation-jobs/${queuedJob.id}/retry`);
});

test('explains that a 404 requires the durable-job backend without retrying', async () => {
  let calls = 0;
  await assert.rejects(createScriptGenerationJob({ ...input, fetch: async () => {
    calls += 1;
    return new Response(JSON.stringify({ error: { code: 'NOT_FOUND' } }), { status: 404 });
  } }), /not available on this server version/i);
  assert.equal(calls, 1);
});

test('rejects an oversized brief locally before spending a network request', async () => {
  let calls = 0;
  await assert.rejects(createScriptGenerationJob({
    ...input,
    questionAnswers: [{ question: 'Additional creative direction', answer: 'x'.repeat(MAX_SCRIPT_ANSWER_LENGTH + 1) }],
    fetch: async () => {
      calls += 1;
      return new Response(JSON.stringify({ data: queuedJob }), { status: 202 });
    },
  }), /no more than 1000 characters/i);
  assert.equal(calls, 0);
});

test('preserves a machine-readable backend error for safe retry decisions', async () => {
  await assert.rejects(getScriptGenerationJob({
    apiUrl: input.apiUrl,
    clerkToken: input.clerkToken,
    jobId: queuedJob.id,
    fetch: async () => new Response(JSON.stringify({ error: { code: 'SCRIPT_GENERATION_DISABLED', message: 'Temporarily unavailable' } }), { status: 503 }),
  }), (error) => error instanceof ScriptGenerationClientError && error.status === 503 && error.code === 'SCRIPT_GENERATION_DISABLED');
});

test('rejects malformed job or scene data instead of rendering untrusted output', async () => {
  await assert.rejects(getScriptGenerationJob({
    apiUrl: input.apiUrl, clerkToken: input.clerkToken, jobId: queuedJob.id,
    fetch: async () => new Response(JSON.stringify({ data: { ...queuedJob, status: 'COMPLETE', progress: 100, story: { schemaVersion: 1, title: 'Bad', scenes: [{ narration: '<script>' }] } } })),
  }), /response is invalid/i);
});
