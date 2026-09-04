import type {
  YouTubeConnection,
  YouTubeConnectionRepository,
} from '../application/ports.js';

export class EmptyYouTubeConnectionRepository implements YouTubeConnectionRepository {
  findByIdForUser(connectionId: string, userId: string): Promise<YouTubeConnection | null> {
    void connectionId;
    void userId;
    return Promise.resolve(null);
  }

  listForUser(): Promise<YouTubeConnection[]> {
    return Promise.resolve([]);
  }
}
