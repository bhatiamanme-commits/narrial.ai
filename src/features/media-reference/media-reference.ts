export type MediaReference = {
  type: 'file' | 'url';
  mediaType: 'image' | 'video';
  source: string;
  name: string;
  thumbnailSource?: string;
  mimeType?: string;
  size?: number;
};

export function normalizeReferenceUrl(value: string) {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'https:' || url.username || url.password || url.hash) return null;
    return getYouTubeVideoId(url) ? url.toString() : null;
  } catch {
    return null;
  }
}

function getYouTubeVideoId(url: URL) {
  let videoId: string | undefined;
  if (url.hostname === 'youtu.be') videoId = url.pathname.split('/').filter(Boolean)[0];
  if (url.hostname === 'youtube.com' || url.hostname.endsWith('.youtube.com')) {
    if (url.pathname === '/watch') videoId = url.searchParams.get('v') ?? undefined;
    const parts = url.pathname.split('/').filter(Boolean);
    if (['shorts', 'embed', 'live'].includes(parts[0])) videoId = parts[1];
  }
  return videoId && /^[A-Za-z0-9_-]{11}$/.test(videoId) ? videoId : undefined;
}

export function getReferenceLinkDetails(value: string): { name: string; thumbnailSource?: string } {
  const url = new URL(value);
  const youtubeId = getYouTubeVideoId(url);
  if (youtubeId) {
    return { name: 'YouTube video', thumbnailSource: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg` };
  }

  return { name: 'Video reference' };
}
