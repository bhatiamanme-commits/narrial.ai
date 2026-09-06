import assert from 'node:assert/strict';
import test from 'node:test';

import { getVideoGenerationJob, startVideoGeneration } from './video-generation-client.ts';

test('starts a server-side generation job without exposing provider credentials', async () => {
  let request;
  const job = await startVideoGeneration({ apiUrl: 'https://api.narial.in', clerkToken: 'session-token', projectId: 'project-1', prompt: 'An original visual story with a clear opening hook.', aspectRatio: '9:16', fetch: async (url, init) => {
    request = { url, init };
    return new Response(JSON.stringify({ data: { id: 'job-1', projectId: 'project-1', status: 'GENERATING', progress: 15, stage: 'Generating original video', updatedAt: new Date().toISOString() } }), { status: 202 });
  } });
  assert.equal(job.id, 'job-1');
  assert.equal(request.url, 'https://api.narial.in/api/v1/video-generation-jobs');
  assert.equal(request.init.headers.authorization, 'Bearer session-token');
  assert.ok(!JSON.stringify(request).includes('GEMINI_API_KEY'));
});

test('parses completed generation jobs and rejects malformed provider state', async () => {
  const completed = await getVideoGenerationJob({ apiUrl: 'https://api.narial.in', clerkToken: 'token', jobId: 'job-1', fetch: async () => new Response(JSON.stringify({ data: { id: 'job-1', projectId: 'project-1', status: 'COMPLETE', progress: 100, stage: 'Video ready', playbackPath: '/api/v1/video-generation-jobs/job-1/content', updatedAt: new Date().toISOString() } })) });
  assert.equal(completed.playbackPath, '/api/v1/video-generation-jobs/job-1/content');
  await assert.rejects(() => getVideoGenerationJob({ apiUrl: 'https://api.narial.in', clerkToken: 'token', jobId: 'job-1', fetch: async () => new Response(JSON.stringify({ data: { id: 'job-1' } })) }), /invalid/i);
});
