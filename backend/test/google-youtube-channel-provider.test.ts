import { describe, expect, it } from 'vitest';

import { GoogleYouTubeChannelProvider } from '../src/youtube/infrastructure/google/google-youtube-channel-provider.js';

describe('GoogleYouTubeChannelProvider', () => {
  it('retrieves only the authenticated user channel with a bearer token', async () => {
    const requests: Array<{ url: string; init: RequestInit | undefined }> = [];
    const provider = new GoogleYouTubeChannelProvider((url, init) => {
      const requestUrl = typeof url === 'string' ? url : url instanceof URL ? url.toString() : url.url;
      requests.push({ url: requestUrl, init });
      return Promise.resolve(new Response(JSON.stringify({
        items: [{ id: 'channel-id', snippet: { title: 'Safe channel' } }],
      }), { status: 200 }));
    });

    await expect(provider.getOwnChannel('access-secret')).resolves.toEqual({
      id: 'channel-id', title: 'Safe channel',
    });
    const url = new URL(requests[0]!.url);
    expect(url.origin + url.pathname).toBe('https://www.googleapis.com/youtube/v3/channels');
    expect(url.searchParams.get('mine')).toBe('true');
    expect(url.searchParams.get('part')).toBe('id,snippet');
    expect(requests[0]!.init?.headers).toEqual({ authorization: 'Bearer access-secret' });
  });

  it.each([
    [{ items: [] }],
    [{ items: [{ id: 'one', snippet: { title: 'One' } }, { id: 'two', snippet: { title: 'Two' } }] }],
    [{ items: [{ id: '', snippet: { title: 'Title' } }] }],
    [{ items: [{ id: 'id', snippet: { title: '' } }] }],
  ])('fails closed for an unusable channel response', async (payload) => {
    const provider = new GoogleYouTubeChannelProvider(
      () => Promise.resolve(new Response(JSON.stringify(payload), { status: 200 })),
    );
    await expect(provider.getOwnChannel('access-secret'))
      .rejects.toMatchObject({ code: 'YOUTUBE_CHANNEL_UNAVAILABLE' });
  });
});
