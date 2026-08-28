import { afterEach, describe, expect, it } from 'vitest';

import { buildApp } from '../src/app.js';
import { testConfig } from './fixtures/config.js';

const apps: Array<ReturnType<typeof buildApp>> = [];

afterEach(async () => {
  await Promise.all(apps.splice(0).map((app) => app.close()));
});

describe('GET /health', () => {
  it('returns a non-sensitive readiness response', async () => {
    const app = buildApp({ config: testConfig });
    apps.push(app);

    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: 'ok' });
    expect(response.headers['content-type']).toContain('application/json');
  });
});
