import type { VideoAnalysis } from '@/features/video-analysis/video-analysis-client';

export type ViralDnaTimelineItem = {
  startSeconds: number;
  endSeconds: number;
  range: string;
  purpose: string;
  description: string;
};

export type ViralDna = {
  durationSeconds: number;
  averageShotSeconds: number;
  visualChanges: number;
  hook: string;
  pacing: string;
  dominantEmotion: string;
  narrativeStructure: string;
  visualRhythm: string;
  captionStyle: string;
  audioStyle: string;
  retentionLanguage: string;
  reusableInsights: string[];
  timeline: ViralDnaTimelineItem[];
};

function clock(seconds: number) {
  const rounded = Math.max(0, Math.round(seconds));
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, '0')}`;
}

function inferPurpose(description: string, index: number, total: number, hasCta: boolean) {
  const text = description.toLowerCase();
  if (index === 0) return 'Hook';
  if (hasCta && index === total - 1) return 'Call to action';
  if (/payoff|result|reveal|transform|after/.test(text) || index === total - 1) return 'Payoff';
  if (/problem|pain|struggle|context|setup/.test(text)) return 'Problem';
  if (/solution|explain|demonstrat|insight/.test(text)) return 'Explanation';
  return index < total / 2 ? 'Curiosity escalation' : 'Development';
}

function inferEmotion(analysis: VideoAnalysis) {
  const source = `${analysis.creativeDNA.openingHook} ${analysis.creativeDNA.audioStyle} ${analysis.creativeDNA.colorMood.join(' ')}`.toLowerCase();
  if (/urgent|warning|tense/.test(source)) return 'Urgency';
  if (/fun|comic|humou|playful/.test(source)) return 'Humour';
  if (/calm|soft|trust|warm/.test(source)) return 'Trust';
  if (/inspir|uplift|hope/.test(source)) return 'Inspiration';
  if (/energetic|fast|excited|upbeat/.test(source)) return 'Excitement';
  return 'Curiosity';
}

export function deriveViralDna(analysis: VideoAnalysis): ViralDna {
  const sceneCount = analysis.scenes.length;
  const averageShotSeconds = sceneCount ? Number((analysis.durationSeconds / sceneCount).toFixed(1)) : analysis.durationSeconds;
  const timeline = analysis.scenes.map((scene, index) => ({
    startSeconds: scene.startSeconds,
    endSeconds: scene.endSeconds,
    range: `${clock(scene.startSeconds)}–${clock(scene.endSeconds)}`,
    purpose: inferPurpose(scene.description, index, sceneCount, Boolean(analysis.creativeDNA.callToAction)),
    description: scene.description,
  }));
  return {
    durationSeconds: analysis.durationSeconds,
    averageShotSeconds,
    visualChanges: Math.max(0, sceneCount - 1),
    hook: analysis.creativeDNA.openingHook,
    pacing: analysis.creativeDNA.pacing,
    dominantEmotion: inferEmotion(analysis),
    narrativeStructure: analysis.creativeDNA.narrativeStructure,
    visualRhythm: analysis.creativeDNA.editingPatterns.join(', ') || 'Natural cuts',
    captionStyle: analysis.scenes.some((scene) => 'onScreenText' in scene) ? 'Scene-led emphasis' : 'Not clearly detected',
    audioStyle: analysis.creativeDNA.audioStyle,
    retentionLanguage: `Likely retention driver: ${analysis.reusableInsights[0] ?? 'the opening hook and progression of visual changes.'}`,
    reusableInsights: analysis.reusableInsights,
    timeline,
  };
}
