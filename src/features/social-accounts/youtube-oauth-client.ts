export type YouTubeConnection = {
  id: string;
  platform: 'YOUTUBE';
  channel: { id: string; title: string; thumbnailUrl?: string };
  status: 'CONNECTED' | 'RECONNECT_REQUIRED' | 'DISCONNECTED';
};

type BrowserResult = { type: string; url?: string };

type FetchInput = {
  apiUrl: string;
  clerkToken: string;
  fetch?: typeof fetch;
};

export function getYouTubeReturnUrl(platform: string, currentUrl?: string): string {
  if (platform !== 'web') return 'narrial://youtube/connection-return';
  if (!currentUrl) throw new Error('The web YouTube return URL is unavailable.');
  return new URL('/youtube/connection-return', currentUrl).toString();
}

function parseConnections(value: unknown): YouTubeConnection[] {
  if (typeof value !== 'object' || value === null || !Array.isArray((value as { data?: unknown }).data)) {
    throw new Error('YouTube connection response is invalid.');
  }
  return (value as { data: unknown[] }).data.map((item) => {
    if (typeof item !== 'object' || item === null) throw new Error('YouTube connection response is invalid.');
    const connection = item as Partial<YouTubeConnection>;
    if (
      typeof connection.id !== 'string' || connection.platform !== 'YOUTUBE' ||
      typeof connection.channel?.id !== 'string' || typeof connection.channel.title !== 'string' ||
      (connection.channel.thumbnailUrl !== undefined && typeof connection.channel.thumbnailUrl !== 'string') ||
      !['CONNECTED', 'RECONNECT_REQUIRED', 'DISCONNECTED'].includes(connection.status ?? '')
    ) throw new Error('YouTube connection response is invalid.');
    return connection as YouTubeConnection;
  });
}

export async function connectYouTubeAccount(input: {
  apiUrl: string;
  clerkToken: string;
  fetch?: typeof fetch;
  openAuthSession: (authorizationUrl: string, returnUrl: string) => Promise<BrowserResult>;
}): Promise<YouTubeConnection> {
  const returnUrl = 'narrial://youtube/connection-return';
  const authorizationUrl = await createYouTubeAuthorization({ ...input, returnUrl });

  const browserResult = await input.openAuthSession(authorizationUrl, returnUrl);
  if (browserResult.type !== 'success' || !browserResult.url) {
    throw new Error('YouTube authorization was cancelled.');
  }
  const returnedUrl = new URL(browserResult.url);
  if (`${returnedUrl.protocol}//${returnedUrl.host}${returnedUrl.pathname}` !== returnUrl) {
    throw new Error('YouTube authorization return is invalid.');
  }
  if (returnedUrl.searchParams.get('result') !== 'connected') {
    throw new Error('YouTube authorization was not completed.');
  }

  const connections = await getYouTubeConnections(input);
  const connected = connections.find((connection) => connection.status === 'CONNECTED');
  if (!connected) throw new Error('YouTube connection could not be verified.');
  return connected;
}

export async function createYouTubeAuthorization(input: FetchInput & { returnUrl: string }): Promise<string> {
  if (!input.apiUrl || !input.clerkToken) throw new Error('YouTube connection is not configured.');
  const fetchImplementation = input.fetch ?? fetch;
  const apiUrl = input.apiUrl.replace(/\/$/, '');
  const startResponse = await fetchImplementation(`${apiUrl}/api/v1/youtube/oauth/authorizations`, {
    method: 'POST',
    headers: { authorization: `Bearer ${input.clerkToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({ returnDestination: input.returnUrl }),
  });
  if (!startResponse.ok) throw new Error('YouTube authorization could not be started.');
  const startValue: unknown = await startResponse.json();
  const authorizationUrl = (startValue as { data?: { authorizationUrl?: unknown } }).data?.authorizationUrl;
  if (typeof authorizationUrl !== 'string' || !authorizationUrl.startsWith('https://accounts.google.com/')) {
    throw new Error('YouTube authorization response is invalid.');
  }
  return authorizationUrl;
}

export async function getYouTubeConnections(input: FetchInput): Promise<YouTubeConnection[]> {
  if (!input.apiUrl || !input.clerkToken) throw new Error('YouTube connection is not configured.');
  const fetchImplementation = input.fetch ?? fetch;
  const apiUrl = input.apiUrl.replace(/\/$/, '');
  const listResponse = await fetchImplementation(`${apiUrl}/api/v1/youtube/connections`, {
    headers: { authorization: `Bearer ${input.clerkToken}`, 'content-type': 'application/json' },
  });
  if (!listResponse.ok) throw new Error('YouTube connection could not be verified.');
  return parseConnections(await listResponse.json());
}
