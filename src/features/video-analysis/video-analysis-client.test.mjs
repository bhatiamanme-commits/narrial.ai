import assert from 'node:assert/strict';
import test from 'node:test';

import { getVideoAnalysisJob, retryOrRestartVideoAnalysisJob, retryVideoAnalysisJob, submitVideoReference, VideoAnalysisClientError } from './video-analysis-client.ts';

test('submits an authenticated video URL and parses stable IDs', async () => {
  let request;
  const result = await submitVideoReference({
    apiUrl: 'https://api.narial.in', clerkToken: 'session-token', url: 'https://youtu.be/dQw4w9WgXcQ',
    fetch: async (url, init) => {
      request = { url, init };
      return new Response(JSON.stringify({ data: {
        reference: { id: 'ref-id', provider: 'YOUTUBE', title: 'YouTube video', thumbnailUrl: 'https://i.ytimg.com/thumb.jpg' },
        analysisJob: { id: 'job-id', referenceId: 'ref-id', status: 'QUEUED', progress: 0, stage: 'Queued for analysis', updatedAt: new Date().toISOString() },
      } }), { status: 202 });
    },
  });
  assert.equal(result.analysisJob.id, 'job-id');
  assert.equal(request.init.headers.authorization, 'Bearer session-token');
  assert.deepEqual(JSON.parse(request.init.body), { url: 'https://youtu.be/dQw4w9WgXcQ' });
});

test('parses a completed analysis job and rejects malformed server data', async () => {
  const analysis = {
    schemaVersion: 1, summary: 'A fast demonstration.', durationSeconds: 20, subjects: [], scenes: [],
    creativeDNA: { openingHook: 'Result first', narrativeStructure: 'Hook and demo', pacing: 'Fast', visualStyle: [], colorMood: [], editingPatterns: [], audioStyle: 'Voice-over' },
    reusableInsights: ['Show the result first.'], safetyFlags: [],
  };
  const result = await getVideoAnalysisJob({
    apiUrl: 'https://api.narial.in', clerkToken: 'token', jobId: 'job-id',
    fetch: async () => new Response(JSON.stringify({ data: { id: 'job-id', referenceId: 'ref-id', status: 'COMPLETE', progress: 100, stage: 'Analysis complete', analysis, updatedAt: new Date().toISOString() } })),
  });
  assert.equal(result.analysis?.summary, analysis.summary);

  await assert.rejects(() => getVideoAnalysisJob({
    apiUrl: 'https://api.narial.in', clerkToken: 'token', jobId: 'job-id',
    fetch: async () => new Response(JSON.stringify({ data: { status: 'COMPLETE' } })),
  }), /invalid/);
});

test('preserves retry error status and code so terminal jobs can be restarted', async () => {
  await assert.rejects(() => retryVideoAnalysisJob({
    apiUrl: 'https://api.narial.in', clerkToken: 'token', jobId: 'job-id',
    fetch: async () => new Response(JSON.stringify({
      error: { code: 'VIDEO_ANALYSIS_NOT_RETRYABLE', message: 'Video analysis cannot be retried' },
    }), { status: 409, headers: { 'content-type': 'application/json' } }),
  }), (error) => {
    assert.ok(error instanceof VideoAnalysisClientError);
    assert.equal(error.status, 409);
    assert.equal(error.code, 'VIDEO_ANALYSIS_NOT_RETRYABLE');
    assert.equal(error.message, 'Video analysis cannot be retried');
    return true;
  });
});

test('starts a fresh analysis when the prior job exhausted its retry budget', async () => {
  const requests = [];
  const result = await retryOrRestartVideoAnalysisJob({
    apiUrl: 'https://api.narial.in', clerkToken: 'token', jobId: 'old-job-id', url: 'https://youtu.be/dQw4w9WgXcQ',
    fetch: async (url, init) => {
      requests.push({ url, method: init?.method ?? 'GET' });
      if (String(url).endsWith('/old-job-id/retry')) {
        return new Response(JSON.stringify({ error: { code: 'VIDEO_ANALYSIS_NOT_RETRYABLE', message: 'Video analysis cannot be retried' } }), { status: 409 });
      }
      return new Response(JSON.stringify({ data: {
        reference: { id: 'ref-id', provider: 'YOUTUBE', title: 'YouTube video', thumbnailUrl: 'https://i.ytimg.com/thumb.jpg' },
        analysisJob: { id: 'new-job-id', referenceId: 'ref-id', status: 'QUEUED', progress: 0, stage: 'Queued for analysis', updatedAt: new Date().toISOString() },
      } }), { status: 202 });
    },
  });

  assert.equal(result.restarted, true);
  assert.equal(result.analysisJob.id, 'new-job-id');
  assert.deepEqual(requests, [
    { url: 'https://api.narial.in/api/v1/video-analysis-jobs/old-job-id/retry', method: 'POST' },
    { url: 'https://api.narial.in/api/v1/video-references', method: 'POST' },
  ]);
});
