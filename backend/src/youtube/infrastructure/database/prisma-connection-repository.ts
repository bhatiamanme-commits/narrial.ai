import type { YouTubeConnectionRepository } from '../../application/ports.js';

interface ConnectionPersistence {
  findConnectionForUser(id: string, ownerId: string): Promise<{
    id: string;
    ownerId: string;
    youtubeChannelId: string;
    channelTitle: string;
    status: string;
  } | null>;
  listConnectionsForUser(ownerId: string): Promise<Array<{
    id: string;
    narrialUserId: string;
    youtubeChannelId: string;
    channelTitle: string;
    status: string;
  }>>;
}

export class PrismaConnectionRepository implements YouTubeConnectionRepository {
  constructor(private readonly persistence: ConnectionPersistence) {}

  async findByIdForUser(connectionId: string, userId: string) {
    const connection = await this.persistence.findConnectionForUser(connectionId, userId);
    if (!connection) return null;
    if (!['CONNECTED', 'RECONNECT_REQUIRED', 'DISCONNECTED'].includes(connection.status)) return null;
    return {
      id: connection.id,
      ownerId: connection.ownerId,
      platform: 'YOUTUBE' as const,
      channel: { id: connection.youtubeChannelId, title: connection.channelTitle },
      status: connection.status as 'CONNECTED' | 'RECONNECT_REQUIRED' | 'DISCONNECTED',
    };
  }

  async listForUser(userId: string) {
    const connections = await this.persistence.listConnectionsForUser(userId);
    return connections.flatMap((connection) => {
      if (!['CONNECTED', 'RECONNECT_REQUIRED', 'DISCONNECTED'].includes(connection.status)) return [];
      return [{
        id: connection.id,
        ownerId: connection.narrialUserId,
        platform: 'YOUTUBE' as const,
        channel: { id: connection.youtubeChannelId, title: connection.channelTitle },
        status: connection.status as 'CONNECTED' | 'RECONNECT_REQUIRED' | 'DISCONNECTED',
      }];
    });
  }
}
