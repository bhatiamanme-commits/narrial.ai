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
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
  } catch {
    return null;
  }
}

function getYouTubeVideoId(url: URL) {
  if (url.hostname === 'youtu.be') return url.pathname.split('/').filter(Boolean)[0];
  if (url.hostname === 'youtube.com' || url.hostname.endsWith('.youtube.com')) {
    if (url.pathname === '/watch') return url.searchParams.get('v') ?? undefined;
    const parts = url.pathname.split('/').filter(Boolean);
    if (['shorts', 'embed', 'live'].includes(parts[0])) return parts[1];
  }
  return undefined;
}

export function getReferenceLinkDetails(value: string): { name: string; thumbnailSource?: string } {
  const url = new URL(value);
  const youtubeId = getYouTubeVideoId(url);
  if (youtubeId) {
    return { name: 'YouTube video', thumbnailSource: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg` };
  }

  return { name: `${url.hostname.replace(/^www\./, '')} video` };
}
