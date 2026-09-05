import assert from 'node:assert/strict';
import test from 'node:test';

import { connectYouTubeAccount, createYouTubeAuthorization, getYouTubeReturnUrl } from './youtube-oauth-client.ts';

test('uses a same-origin HTTPS return URL on web and the app scheme on native', () => {
  assert.equal(
    getYouTubeReturnUrl('web', 'https://app.narial.in/onboarding'),
    'https://app.narial.in/youtube/connection-return',
  );
  assert.equal(
    getYouTubeReturnUrl('ios'),
    'narrial://youtube/connection-return',
  );
});

test('creates a YouTube authorization without opening a popup', async () => {
  let request;
  const authorizationUrl = await createYouTubeAuthorization({
    apiUrl: 'https://api.narial.in',
    clerkToken: 'clerk-token',
    returnUrl: 'https://app.narial.in/youtube/connection-return',
    fetch: async (url, init) => {
      request = { url, init };
      return new Response(JSON.stringify({ data: { authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth?state=opaque' } }), { status: 201 });
    },
  });

  assert.match(authorizationUrl, /^https:\/\/accounts\.google\.com\//);
  assert.equal(request.init.headers.authorization, 'Bearer clerk-token');
  assert.deepEqual(JSON.parse(request.init.body), {
    returnDestination: 'https://app.narial.in/youtube/connection-return',
  });
});

test('starts OAuth with a Clerk token, opens Google, then refetches authoritative connections', async () => {
  const requests = [];
  const result = await connectYouTubeAccount({
    apiUrl: 'https://api.narial.in',
    clerkToken: 'clerk-token',
    fetch: async (url, init) => {
      requests.push({ url, init });
      if (String(url).endsWith('/oauth/authorizations')) {
        return new Response(JSON.stringify({ data: { authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth?state=opaque' } }), { status: 201 });
      }
      return new Response(JSON.stringify({ data: [{ id: 'connection-id', platform: 'YOUTUBE', channel: { id: 'channel-id', title: 'Narrial AI', thumbnailUrl: 'https://yt.example/avatar.jpg' }, status: 'CONNECTED' }] }), { status: 200 });
    },
    openAuthSession: async (url, returnUrl) => {
      assert.match(url, /^https:\/\/accounts\.google\.com\//);
      assert.equal(returnUrl, 'narrial://youtube/connection-return');
      return { type: 'success', url: `${returnUrl}?result=connected` };
    },
  });

  assert.equal(result.id, 'connection-id');
  assert.equal(result.channel.thumbnailUrl, 'https://yt.example/avatar.jpg');
  assert.equal(requests.length, 2);
  assert.equal(requests[0].init.headers.authorization, 'Bearer clerk-token');
});

test('does not claim success when the browser flow is cancelled', async () => {
  await assert.rejects(() => connectYouTubeAccount({
    apiUrl: 'https://api.narial.in', clerkToken: 'token',
    fetch: async () => new Response(JSON.stringify({ data: { authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth' } }), { status: 201 }),
    openAuthSession: async () => ({ type: 'cancel' }),
  }), /cancelled/);
});

test('reports missing app configuration before making a request', async () => {
  let requested = false;
  await assert.rejects(() => connectYouTubeAccount({
    apiUrl: '',
    clerkToken: 'token',
    fetch: async () => { requested = true; throw new Error('must not run'); },
    openAuthSession: async () => ({ type: 'cancel' }),
  }), /not configured/);
  assert.equal(requested, false);
});
