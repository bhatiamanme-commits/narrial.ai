import assert from 'node:assert/strict';
import test from 'node:test';
import { generateStory } from './story-generation-client.ts';

const input = { apiUrl: 'https://api.example.test', clerkToken: 'token', analysis: {}, prompt: 'story', questionAnswers: [] };

test('explains that a 404 requires the latest backend without retrying', async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; return new Response(JSON.stringify({ error: { code: 'NOT_FOUND' } }), { status: 404 }); };
  try {
    await assert.rejects(generateStory(input), /not available on this server version/i);
    assert.equal(calls, 1);
  } finally { globalThis.fetch = originalFetch; }
});
