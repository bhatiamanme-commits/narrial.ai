export interface YouTubeConnection {
  id: string;
  ownerId: string;
  platform: 'YOUTUBE';
  channel: {
    id: string;
    title: string;
  };
  status: 'CONNECTED' | 'RECONNECT_REQUIRED' | 'DISCONNECTED';
  credentialEnvelope?: string;
}

export interface YouTubeConnectionRepository {
  findByIdForUser(connectionId: string, userId: string): Promise<YouTubeConnection | null>;
  listForUser(userId: string): Promise<YouTubeConnection[]>;
}

export interface YouTubeProvider {
  getChannel(connectionId: string): Promise<{ id: string; title: string }>;
}
