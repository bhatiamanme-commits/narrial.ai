export type LibraryVideo = {
  id: string;
  title: string;
  thumbnailUrl: string;
  videoUrl?: string;
  durationSeconds: number;
  createdAt: string;
  status?: 'ready' | 'processing' | 'failed';
};

const SAMPLE_VIDEOS: LibraryVideo[] = [
  { id: 'forest-story', title: 'A quiet forest story', thumbnailUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=900', videoUrl: 'local', durationSeconds: 47, createdAt: '2026-08-20T12:00:00Z', status: 'ready' },
  { id: 'city-after-dark', title: 'City after dark', thumbnailUrl: 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=900', videoUrl: 'local', durationSeconds: 23, createdAt: '2026-08-19T12:00:00Z', status: 'ready' },
  { id: 'coffee-ritual', title: 'The perfect morning ritual', thumbnailUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=900', videoUrl: 'local', durationSeconds: 59, createdAt: '2026-08-18T12:00:00Z', status: 'ready' },
  { id: 'desert-road', title: 'Across the open road', thumbnailUrl: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900', videoUrl: 'local', durationSeconds: 15, createdAt: '2026-08-17T12:00:00Z', status: 'ready' },
  { id: 'ocean-light', title: 'Ocean light', thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900', durationSeconds: 62, createdAt: '2026-08-16T12:00:00Z', status: 'processing' },
  { id: 'mountain-air', title: 'Mountain air', thumbnailUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=900', durationSeconds: 37, createdAt: '2026-08-15T12:00:00Z', status: 'failed' },
];

export function formatVideoDuration(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safeSeconds / 60);
  return `${minutes}:${String(safeSeconds % 60).padStart(2, '0')}`;
}

export const getLibraryCountLabel = (count: number) => count === 0 ? 'No videos yet' : `${count} ${count === 1 ? 'video' : 'videos'}`;
export const getSelectionActionLabel = (count: number) => count === 0 ? 'Select videos' : `Continue with ${count} ${count === 1 ? 'video' : 'videos'}`;

export async function loadLibraryVideos(): Promise<LibraryVideo[]> {
  await new Promise((resolve) => setTimeout(resolve, 350));
  return SAMPLE_VIDEOS.map((video) => ({ ...video }));
}
