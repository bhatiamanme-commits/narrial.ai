import type { YouTubeConnection, YouTubeConnectionRepository } from './ports.js';

export class YouTubeConnectionService {
  constructor(private readonly repository: YouTubeConnectionRepository) {}

  getForUser(connectionId: string, userId: string): Promise<YouTubeConnection | null> {
    return this.repository.findByIdForUser(connectionId, userId);
  }

  listForUser(userId: string): Promise<YouTubeConnection[]> {
    return this.repository.listForUser(userId);
  }
}
