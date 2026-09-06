import { afterEach, describe, expect, it } from 'vitest';

import { buildApp } from '../src/app.js';
import type { AuthenticatedUser, AuthenticationVerifier } from '../src/auth/authentication-verifier.js';
import { InMemoryVideoGenerationRepository } from '../src/video-generation/in-memory-repository.js';
import type { VideoGenerator } from '../src/video-generation/ports.js';
import { testConfig } from './fixtures/config.js';

const apps: ReturnType<typeof buildApp>[] = [];
class FakeAuthenticationVerifier implements AuthenticationVerifier {
  verify(request: Request): Promise<AuthenticatedUser | null> { const token = request.headers.get('authorization'); return Promise.resolve(token === 'Bearer owner-a' ? { userId: 'owner-a' } : token === 'Bearer owner-b' ? { userId: 'owner-b' } : null); }
}

function createApp() {
  const generator: VideoGenerator = {
    start: () => Promise.resolve({ operationName: 'operations/generated-1' }),
    get: () => Promise.resolve({ status: 'COMPLETE', videoUri: 'https://generativelanguage.googleapis.com/v1beta/files/generated-1:download' }),
    download: () => Promise.resolve(new Response(new Uint8Array([0, 1, 2]), { headers: { 'content-type': 'video/mp4' } })),
  };
  const app = buildApp({ config: testConfig, authenticationVerifier: new FakeAuthenticationVerifier(), videoGenerationRepository: new InMemoryVideoGenerationRepository(), videoGenerator: generator });
  apps.push(app);
  return app;
}

afterEach(async () => Promise.all(apps.splice(0).map((app) => app.close())));

describe('video generation API', () => {
  it('creates, polls, and streams an owner-scoped real generation job', async () => {
    const app = createApp();
    const started = await app.inject({ method: 'POST', url: '/api/v1/video-generation-jobs', headers: { authorization: 'Bearer owner-a' }, payload: { projectId: 'project-1', prompt: 'An original cinematic product story with a visual opening hook.', aspectRatio: '9:16' } });
    expect(started.statusCode).toBe(202);
    const startedPayload: unknown = JSON.parse(started.body);
    if (typeof startedPayload !== 'object' || startedPayload === null || !('data' in startedPayload)) throw new Error('Missing response data');
    const responseData = startedPayload.data;
    if (typeof responseData !== 'object' || responseData === null || !('id' in responseData) || typeof responseData.id !== 'string') throw new Error('Missing job id');
    const id = responseData.id;
    const completed = await app.inject({ method: 'GET', url: `/api/v1/video-generation-jobs/${id}`, headers: { authorization: 'Bearer owner-a' } });
    expect(completed.json()).toMatchObject({ data: { status: 'COMPLETE', progress: 100, playbackPath: `/api/v1/video-generation-jobs/${id}/content` } });
    expect(completed.body).not.toContain('googleapis.com');
    const hidden = await app.inject({ method: 'GET', url: `/api/v1/video-generation-jobs/${id}`, headers: { authorization: 'Bearer owner-b' } });
    expect(hidden.statusCode).toBe(404);
    const content = await app.inject({ method: 'GET', url: `/api/v1/video-generation-jobs/${id}/content`, headers: { authorization: 'Bearer owner-a' } });
    expect(content.statusCode).toBe(200);
    expect(content.headers['content-type']).toContain('video/mp4');
  });
});
