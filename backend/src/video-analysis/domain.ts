export type VideoProvider = 'YOUTUBE';
export type VideoAnalysisJobStatus = 'QUEUED' | 'ANALYZING' | 'COMPLETE' | 'FAILED';

export interface ParsedVideoReference {
  provider: VideoProvider;
  providerVideoId: string;
  canonicalUrl: string;
  title: string;
  thumbnailUrl: string;
}

export interface VideoScene {
  startSeconds: number;
  endSeconds: number;
  description: string;
  shotType?: string;
  cameraMovement?: string;
  transition?: string;
  onScreenText?: string[];
  spokenContent?: string;
}

export interface VideoAnalysis {
  schemaVersion: 1;
  summary: string;
  durationSeconds: number;
  language?: string;
  subjects: Array<{ label: string; description: string }>;
  scenes: VideoScene[];
  creativeDNA: {
    openingHook: string;
    narrativeStructure: string;
    pacing: string;
    visualStyle: string[];
    colorMood: string[];
    editingPatterns: string[];
    audioStyle: string;
    callToAction?: string;
  };
  reusableInsights: string[];
  safetyFlags: string[];
}

export class VideoAnalysisError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = 'VideoAnalysisError';
  }
}

const youtubeIdPattern = /^[A-Za-z0-9_-]{11}$/;

export function parseVideoReferenceUrl(value: string): ParsedVideoReference {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new VideoAnalysisError('UNSUPPORTED_VIDEO_URL', 'Use a supported public YouTube URL.');
  }

  if (url.protocol !== 'https:' || url.username || url.password || url.hash) {
    throw new VideoAnalysisError('UNSUPPORTED_VIDEO_URL', 'Use a supported public YouTube URL.');
  }

  const hostname = url.hostname.toLowerCase();
  let videoId: string | null | undefined;
  if (hostname === 'youtu.be') {
    videoId = url.pathname.split('/').filter(Boolean)[0];
  } else if (hostname === 'youtube.com' || hostname.endsWith('.youtube.com')) {
    const parts = url.pathname.split('/').filter(Boolean);
    videoId = url.pathname === '/watch' ? url.searchParams.get('v') :
      ['shorts', 'embed', 'live'].includes(parts[0] ?? '') ? parts[1] : undefined;
  }

  if (!videoId || !youtubeIdPattern.test(videoId)) {
    throw new VideoAnalysisError('UNSUPPORTED_VIDEO_URL', 'Use a supported public YouTube URL.');
  }

  return {
    provider: 'YOUTUBE',
    providerVideoId: videoId,
    canonicalUrl: `https://www.youtube.com/watch?v=${videoId}`,
    title: 'YouTube video',
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isText(value: unknown, max = 4_000): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max;
}

function isTextArray(value: unknown, maxItems = 30): value is string[] {
  return Array.isArray(value) && value.length <= maxItems && value.every((item) => isText(item, 500));
}

export function parseVideoAnalysis(value: unknown): VideoAnalysis {
  const invalid = () => new VideoAnalysisError('INVALID_ANALYSIS', 'The analyzer returned an invalid analysis.');
  if (!isRecord(value) || !isText(value.summary) || typeof value.durationSeconds !== 'number' ||
      !Number.isFinite(value.durationSeconds) || value.durationSeconds <= 0 || value.durationSeconds > 86_400 ||
      !Array.isArray(value.subjects) || value.subjects.length > 50 ||
      !value.subjects.every((item) => isRecord(item) && isText(item.label, 200) && isText(item.description, 1_000)) ||
      !Array.isArray(value.scenes) || value.scenes.length > 500 || !isRecord(value.creativeDNA) ||
      !isTextArray(value.reusableInsights) || !isTextArray(value.safetyFlags)) throw invalid();

  const scenes: VideoScene[] = [];
  for (const item of value.scenes) {
    if (!isRecord(item) || typeof item.startSeconds !== 'number' || typeof item.endSeconds !== 'number' ||
        item.startSeconds < 0 || item.endSeconds <= item.startSeconds || item.endSeconds > value.durationSeconds ||
        !isText(item.description, 2_000)) throw invalid();
    const scene: VideoScene = { startSeconds: item.startSeconds, endSeconds: item.endSeconds, description: item.description };
    for (const key of ['shotType', 'cameraMovement', 'transition', 'spokenContent'] as const) {
      const optionalValue = item[key];
      if (optionalValue !== undefined) {
        if (!isText(optionalValue, 1_000)) throw invalid();
        scene[key] = optionalValue;
      }
    }
    if (item.onScreenText !== undefined) {
      if (!isTextArray(item.onScreenText)) throw invalid();
      scene.onScreenText = item.onScreenText;
    }
    scenes.push(scene);
  }

  const dna = value.creativeDNA;
  if (!isText(dna.openingHook, 1_000) || !isText(dna.narrativeStructure, 1_000) ||
      !isText(dna.pacing, 500) || !isTextArray(dna.visualStyle) || !isTextArray(dna.colorMood) ||
      !isTextArray(dna.editingPatterns) || !isText(dna.audioStyle, 1_000) ||
      (dna.callToAction !== undefined && !isText(dna.callToAction, 1_000)) ||
      (value.language !== undefined && !isText(value.language, 100))) throw invalid();

  return {
    schemaVersion: 1,
    summary: value.summary,
    durationSeconds: value.durationSeconds,
    ...(value.language ? { language: value.language } : {}),
    subjects: value.subjects as VideoAnalysis['subjects'],
    scenes,
    creativeDNA: {
      openingHook: dna.openingHook,
      narrativeStructure: dna.narrativeStructure,
      pacing: dna.pacing,
      visualStyle: dna.visualStyle,
      colorMood: dna.colorMood,
      editingPatterns: dna.editingPatterns,
      audioStyle: dna.audioStyle,
      ...(dna.callToAction ? { callToAction: dna.callToAction } : {}),
    },
    reusableInsights: value.reusableInsights,
    safetyFlags: value.safetyFlags,
  };
}
