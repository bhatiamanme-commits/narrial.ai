import { afterEach, describe, expect, it } from 'vitest';

import { buildApp } from '../src/app.js';
import type { AuthenticatedUser, AuthenticationVerifier } from '../src/auth/authentication-verifier.js';
import { InMemoryVideoAnalysisRepository } from '../src/video-analysis/in-memory-repository.js';
import type { VideoAnalyzer } from '../src/video-analysis/ports.js';
import { VideoAnalysisWorker } from '../src/video-analysis/worker.js';
import { testConfig } from './fixtures/config.js';

const apps: Array<ReturnType<typeof buildApp>> = [];

class FakeAuthenticationVerifier implements AuthenticationVerifier {
  verify(request: Request): Promise<AuthenticatedUser | null> {
    const value = request.headers.get('authorization');
    return Promise.resolve(value === 'Bearer owner-a' ? { userId: 'owner-a' } : value === 'Bearer owner-b' ? { userId: 'owner-b' } : null);
  }
}

const completedAnalysis = {
  schemaVersion: 1 as const,
  summary: 'A fast product demonstration.',
  durationSeconds: 30,
  subjects: [{ label: 'Creator', description: 'Demonstrates the product.' }],
  scenes: [{ startSeconds: 0, endSeconds: 3, description: 'The result appears immediately.' }],
  creativeDNA: {
    openingHook: 'Show the result first', narrativeStructure: 'Result then explanation', pacing: 'Fast',
    visualStyle: ['Close-up'], colorMood: ['Bright'], editingPatterns: ['Jump cuts'], audioStyle: 'Voice-over',
  },
  reusableInsights: ['Open on the result.'], safetyFlags: [],
};

function createApp() {
  const repository = new InMemoryVideoAnalysisRepository();
  const analyzer: VideoAnalyzer = { analyze: () => Promise.resolve(completedAnalysis) };
  const worker = new VideoAnalysisWorker(repository, analyzer);
  const app = buildApp({
    config: testConfig,
    authenticationVerifier: new FakeAuthenticationVerifier(),
    videoAnalysisRepository: repository,
    videoAnalysisWorker: worker,
  });
  apps.push(app);
  return { app, repository };
}

afterEach(async () => Promise.all(apps.splice(0).map((app) => app.close())));

describe('video analysis API', () => {
  it('submits a reference and returns a safe job resource', async () => {
    const { app } = createApp();
    const response = await app.inject({
      method: 'POST', url: '/api/v1/video-references',
      headers: { authorization: 'Bearer owner-a' },
      payload: { url: 'https://youtu.be/dQw4w9WgXcQ' },
    });

    expect(response.statusCode).toBe(202);
    expect(response.json()).toMatchObject({
      data: {
        reference: { provider: 'YOUTUBE', title: 'YouTube video' },
        analysisJob: { status: 'QUEUED', progress: 0, stage: 'Queued for analysis' },
      },
    });
    expect(response.body).not.toContain('owner-a');
  });

  it('completes asynchronously and exposes validated analysis to its owner', async () => {
    const { app } = createApp();
    const submitted = await app.inject({
      method: 'POST', url: '/api/v1/video-references',
      headers: { authorization: 'Bearer owner-a' },
      payload: { url: 'https://youtu.be/dQw4w9WgXcQ' },
    });
    const submittedBody = JSON.parse(submitted.body) as { data: { analysisJob: { id: string } } };
    const jobId = submittedBody.data.analysisJob.id;

    await new Promise((resolve) => setTimeout(resolve, 10));
    const response = await app.inject({
      method: 'GET', url: `/api/v1/video-analysis-jobs/${jobId}`,
      headers: { authorization: 'Bearer owner-a' },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ data: { status: 'COMPLETE', progress: 100, analysis: completedAnalysis } });
  });

  it('hides another user\'s job and rejects unsupported providers', async () => {
    const { app } = createApp();
    const submitted = await app.inject({
      method: 'POST', url: '/api/v1/video-references', headers: { authorization: 'Bearer owner-a' },
      payload: { url: 'https://youtu.be/dQw4w9WgXcQ' },
    });
    const submittedBody = JSON.parse(submitted.body) as { data: { analysisJob: { id: string } } };
    const jobId = submittedBody.data.analysisJob.id;
    const hidden = await app.inject({
      method: 'GET', url: `/api/v1/video-analysis-jobs/${jobId}`,
      headers: { authorization: 'Bearer owner-b' },
    });
    expect(hidden.statusCode).toBe(404);

    const unsupported = await app.inject({
      method: 'POST', url: '/api/v1/video-references', headers: { authorization: 'Bearer owner-a' },
      payload: { url: 'https://vimeo.com/1234' },
    });
    expect(unsupported.statusCode).toBe(422);
    expect(unsupported.json()).toMatchObject({ error: { code: 'UNSUPPORTED_VIDEO_URL' } });
  });
});
