import type { VideoAnalysis } from '@/features/video-analysis/video-analysis-client';

export type ViralDNAMarker = {
  id: string;
  startSeconds: number;
  endSeconds: number;
  label: string;
  description: string;
  strength: 'high' | 'medium';
};

export type ViralDNA = {
  schemaVersion: 1;
  referenceId: string;
  generatedAt: string;
  confidence: number;
  hook: {
    type: string; durationSeconds: number; openingVisual: string; firstLinePurpose: string;
    curiosityGap: string; patternInterrupt: string; emotionalTrigger: string; likelyRetentionDriver: string;
  };
  narrative: { id: string; label: string; startSeconds: number; endSeconds: number; description: string }[];
  retention: {
    totalDurationSeconds: number; averageShotLengthSeconds: number; visualChangeCount: number;
    majorBeatCount: number; captionDensity: string; voiceoverSpeed: string; pausePlacement: string;
    motionFrequency: string; bRollFrequency: string; patternInterruptMoments: number[];
    emotionalProgression: string[]; payoffTimingSeconds: number; ctaTimingSeconds?: number;
  };
  editing: {
    cutRhythm: string; transitionStyle: string; cameraMovement: string; framing: string;
    captionBehavior: string; textEmphasis: string; soundEffects: string; musicEnergy: string;
    pauseUsage: string; visualLayering: string; colorLightingMood: string;
  };
  audience: {
    likelyAudience: string; awarenessLevel: string; platform: string; aspectRatio: string;
    contentCategory: string; viewerMotivation: string; potentialSharingTrigger: string;
  };
  timeline: ViralDNAMarker[];
  reusablePrinciples: string[];
  originalityGuardrails: string[];
};

const stageNames = ['Hook', 'Setup', 'Problem', 'Escalation', 'Insight', 'Transformation', 'Payoff', 'CTA'];

function inferStage(description: string, index: number, count: number): string {
  const value = description.toLowerCase();
  const matched = stageNames.find((stage) => value.includes(stage.toLowerCase()));
  if (matched) return matched;
  if (index === 0) return 'Hook';
  if (index === count - 1 && /(call|action|follow|visit|try|subscribe)/.test(value)) return 'CTA';
  if (index === count - 1) return 'Payoff';
  const progress = index / Math.max(1, count - 1);
  return progress < .4 ? 'Setup' : progress < .72 ? 'Escalation' : 'Insight';
}

function inferHookType(hook: string): string {
  const value = hook.toLowerCase();
  if (value.includes('question')) return 'Question';
  if (value.includes('before') || value.includes('after')) return 'Before-and-after';
  if (value.includes('warning') || value.includes('urgent')) return 'Urgent warning';
  if (value.includes('result') || value.includes('outcome')) return 'Desired outcome';
  if (value.includes('surprise') || value.includes('unexpected')) return 'Visual surprise';
  if (value.includes('problem')) return 'Direct problem';
  return 'Open loop';
}

function cadence(pacing: string): string {
  const value = pacing.toLowerCase();
  return value.includes('fast') ? 'Fast' : value.includes('slow') || value.includes('calm') ? 'Measured' : 'Balanced';
}

export function deriveViralDNA(
  analysis: VideoAnalysis,
  context: { referenceId: string; platform?: string; aspectRatio?: string; now?: Date },
): ViralDNA {
  const scenes: VideoAnalysis['scenes'] = analysis.scenes.length ? analysis.scenes : [{ startSeconds: 0, endSeconds: analysis.durationSeconds, description: analysis.summary }];
  const timeline = scenes.map((scene, index) => ({
    id: `marker-${index + 1}`,
    startSeconds: scene.startSeconds,
    endSeconds: scene.endSeconds,
    label: inferStage(scene.description, index, scenes.length),
    description: scene.description,
    strength: index === 0 || index === scenes.length - 1 ? 'high' as const : 'medium' as const,
  }));
  const first = scenes[0];
  const last = scenes.at(-1)!;
  const editing = analysis.creativeDNA.editingPatterns.join(', ') || 'Clean cuts';
  const motion = scenes.map((scene) => scene.cameraMovement).filter(Boolean).join(', ');
  const onScreenTextCount = scenes.reduce((total, scene) => total + (scene.onScreenText?.length ?? 0), 0);
  const cutRhythm = cadence(analysis.creativeDNA.pacing);
  const cta = analysis.creativeDNA.callToAction ? last.startSeconds : undefined;

  return parseViralDNA({
    schemaVersion: 1,
    referenceId: context.referenceId,
    generatedAt: (context.now ?? new Date()).toISOString(),
    confidence: analysis.scenes.length >= 3 ? .82 : .68,
    hook: {
      type: inferHookType(analysis.creativeDNA.openingHook),
      durationSeconds: Number((first.endSeconds - first.startSeconds).toFixed(1)),
      openingVisual: first.description,
      firstLinePurpose: 'Create immediate relevance and open a question the viewer wants resolved.',
      curiosityGap: `The opening withholds the explanation behind “${analysis.creativeDNA.openingHook}”.`,
      patternInterrupt: first.cameraMovement || analysis.creativeDNA.visualStyle[0] || 'A visible change in the opening beat',
      emotionalTrigger: analysis.creativeDNA.colorMood[0] || 'Curiosity',
      likelyRetentionDriver: `Likely retention driver: ${analysis.reusableInsights[0] || 'the opening establishes a clear unresolved outcome.'}`,
    },
    narrative: timeline.map(({ id, label, startSeconds, endSeconds, description }) => ({ id, label, startSeconds, endSeconds, description })),
    retention: {
      totalDurationSeconds: analysis.durationSeconds,
      averageShotLengthSeconds: Number((analysis.durationSeconds / scenes.length).toFixed(1)),
      visualChangeCount: Math.max(0, scenes.length - 1),
      majorBeatCount: new Set(timeline.map((marker) => marker.label)).size,
      captionDensity: onScreenTextCount > scenes.length ? 'High' : onScreenTextCount ? 'Medium' : 'Low',
      voiceoverSpeed: cutRhythm === 'Fast' ? 'Fast' : 'Conversational',
      pausePlacement: analysis.creativeDNA.pacing.toLowerCase().includes('pause') ? 'A deliberate pause follows a key beat' : 'No strong pause detected',
      motionFrequency: motion ? (scenes.filter((scene) => scene.cameraMovement).length > scenes.length / 2 ? 'Frequent' : 'Occasional') : 'Restrained',
      bRollFrequency: analysis.subjects.length > 1 ? 'Frequent' : 'Occasional',
      patternInterruptMoments: timeline.filter((marker) => marker.strength === 'high').map((marker) => marker.startSeconds),
      emotionalProgression: [analysis.creativeDNA.colorMood[0] || 'Curiosity', 'Interest', analysis.creativeDNA.colorMood.at(-1) || 'Satisfaction'],
      payoffTimingSeconds: timeline.find((marker) => marker.label === 'Payoff')?.startSeconds ?? Math.round(analysis.durationSeconds * .82),
      ...(cta !== undefined ? { ctaTimingSeconds: cta } : {}),
    },
    editing: {
      cutRhythm, transitionStyle: editing, cameraMovement: motion || 'Mostly stable',
      framing: scenes[0].shotType || 'Subject-led framing', captionBehavior: onScreenTextCount ? 'Timed to spoken beats' : 'Minimal',
      textEmphasis: editing.toLowerCase().includes('caption') ? 'Key words emphasized' : 'Selective emphasis',
      soundEffects: analysis.creativeDNA.audioStyle.toLowerCase().includes('effect') ? 'Beat accents' : 'Restrained',
      musicEnergy: cutRhythm === 'Fast' ? 'Rising' : 'Supportive', pauseUsage: 'Preserve purposeful breathing room',
      visualLayering: analysis.creativeDNA.visualStyle.join(', ') || 'Clean foreground focus',
      colorLightingMood: analysis.creativeDNA.colorMood.join(', ') || 'Neutral, high contrast',
    },
    audience: {
      likelyAudience: analysis.subjects[0]?.label ? `Viewers interested in ${analysis.subjects[0].label.toLowerCase()}` : 'Short-form viewers',
      awarenessLevel: 'Problem aware', platform: context.platform || 'Short-form video', aspectRatio: context.aspectRatio || '9:16',
      contentCategory: analysis.creativeDNA.narrativeStructure, viewerMotivation: 'Resolve the opening curiosity gap',
      potentialSharingTrigger: `Potential sharing trigger: ${analysis.reusableInsights.at(-1) || 'a clear, useful payoff.'}`,
    },
    timeline,
    reusablePrinciples: analysis.reusableInsights,
    originalityGuardrails: [
      'Use a new script, wording, scenes, characters, voice, captions, and edit decisions.',
      'Do not reproduce identifiable people, branding, protected dialogue, exact shots, music, or distinctive assets.',
      ...analysis.safetyFlags,
    ],
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function parseViralDNA(value: unknown): ViralDNA {
  const valid = isRecord(value) && value.schemaVersion === 1 && typeof value.referenceId === 'string' &&
    isRecord(value.hook) && typeof value.hook.type === 'string' && isRecord(value.retention) &&
    typeof value.retention.totalDurationSeconds === 'number' && isRecord(value.editing) &&
    isRecord(value.audience) && Array.isArray(value.timeline) && value.timeline.length > 0 &&
    value.timeline.every((marker) => isRecord(marker) && typeof marker.startSeconds === 'number' &&
      typeof marker.endSeconds === 'number' && marker.endSeconds > marker.startSeconds && typeof marker.label === 'string') &&
    Array.isArray(value.reusablePrinciples) && Array.isArray(value.originalityGuardrails);
  if (!valid) throw new Error('Viral DNA response is invalid.');
  return value as ViralDNA;
}
