import type {
  AuthorizedYouTubeChannel,
  YouTubeChannelProvider,
} from '../../application/oauth-completion.js';

const CHANNELS_ENDPOINT = 'https://www.googleapis.com/youtube/v3/channels';

export class YouTubeChannelUnavailableError extends Error {
  readonly code = 'YOUTUBE_CHANNEL_UNAVAILABLE';

  constructor() {
    super('YouTube channel is unavailable');
    this.name = 'YouTubeChannelUnavailableError';
  }
}

type FetchImplementation = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export class GoogleYouTubeChannelProvider implements YouTubeChannelProvider {
  constructor(
    private readonly fetchImplementation: FetchImplementation = fetch,
    private readonly timeoutMs = 5_000,
  ) {}

  async getOwnChannel(accessToken: string): Promise<AuthorizedYouTubeChannel> {
    try {
      const url = new URL(CHANNELS_ENDPOINT);
      url.searchParams.set('part', 'id,snippet');
      url.searchParams.set('mine', 'true');
      const response = await this.fetchImplementation(url, {
        headers: { authorization: `Bearer ${accessToken}` },
        redirect: 'error',
        signal: AbortSignal.timeout(this.timeoutMs),
      });
      if (!response.ok) throw new YouTubeChannelUnavailableError();
      const value: unknown = await response.json();
      if (typeof value !== 'object' || value === null) throw new YouTubeChannelUnavailableError();
      const items = (value as { items?: unknown }).items;
      if (!Array.isArray(items) || items.length !== 1) throw new YouTubeChannelUnavailableError();
      const channel = items[0] as { id?: unknown; snippet?: { title?: unknown } };
      if (
        typeof channel?.id !== 'string' || channel.id.length === 0 || channel.id.length > 255 ||
        typeof channel.snippet?.title !== 'string' || channel.snippet.title.length === 0 ||
        channel.snippet.title.length > 255
      ) throw new YouTubeChannelUnavailableError();
      return { id: channel.id, title: channel.snippet.title };
    } catch {
      throw new YouTubeChannelUnavailableError();
    }
  }
}
