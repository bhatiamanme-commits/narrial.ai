import type { ViralDNA } from '@/features/viral-dna/viral-dna';

export type BriefAnswer = { topic?: string; audience?: string; emotion?: string; action?: string };
export type ClarificationQuestion = { id: keyof BriefAnswer; title: string; explanation: string; options: string[]; allowCustom: boolean; allowNarial: boolean };
export type CreativeBrief = Required<BriefAnswer> & { durationSeconds: number; aspectRatio: string; platform: string; language: string; visualStyle: string; captionStyle: string; musicEnergy: string; pacing: string; restrictions: string[] };
export type SceneStatus = 'planned' | 'queued' | 'generating' | 'generated' | 'editing' | 'ready' | 'failed' | 'needs-review';
export type SceneVersion = { id: string; createdAt: string; instruction: string; status: SceneStatus };
export type VideoScene = {
  id: string; startSeconds: number; endSeconds: number; durationSeconds: number; purpose: string; scriptLine: string;
  voiceEmotion: string; visualDescription: string; cameraDirection: string; characterDetails: string; location: string;
  lighting: string; motion: string; textOverlay: string; captions: { startSeconds: number; endSeconds: number; text: string }[];
  transitionIn: string; transitionOut: string; soundEffect: string; musicIntensity: string; generationPrompt: string;
  status: SceneStatus; continuityReferences: string[]; versions: SceneVersion[]; activeVersionId: string;
};
export type VideoProject = {
  schemaVersion: 1; id: string; status: 'brief-ready' | 'planning' | 'generating' | 'partial-generation' | 'editing' | 'preview-ready' | 'completed';
  createdAt: string; updatedAt: string; dna: ViralDNA; brief: CreativeBrief;
  hooks: { id: string; text: string; score: number; selected: boolean; reason: string }[];
  script: string; continuity: { id: string; character: string; wardrobe: string; environment: string; lighting: string; cameraLanguage: string; colorPalette: string; visualStyle: string; lockedElements: string[] };
  scenes: VideoScene[]; timeline: { durationSeconds: number; sceneOrder: string[]; captionsTrack: string[]; voiceoverTrack: string[]; musicTrack: string; transitions: string[] };
  generation: { jobId: string; progress: number; stage: string; error?: string; updatedAt: string };
  quality?: QualityReport;
};
export type QualityReport = { status: 'passed' | 'needs-review'; checkedAt: string; checks: { id: string; label: string; passed: boolean; detail: string }[] };

export const GENERATION_STAGES = ['Understanding your idea', 'Extracting the strongest Viral DNA', 'Writing an original hook', 'Building the script', 'Planning scenes', 'Creating characters and visual references', 'Generating clips', 'Recording voiceover', 'Adding captions and sound', 'Editing the final video', 'Running quality checks', 'Preparing preview'] as const;

export function buildClarificationQuestions(dna: ViralDNA, known: BriefAnswer = {}): ClarificationQuestion[] {
  const audienceOptions = [...new Set([dna.audience.likelyAudience, 'Creators and small teams', 'New customers', 'A custom audience'])].slice(0, 4);
  const definitions: ClarificationQuestion[] = [
    { id: 'topic', title: 'What should the new video be about?', explanation: 'This keeps the result original while carrying over the reference’s retention logic.', options: ['Explain my product', 'Promote a feature', 'Tell an educational story', 'Share a surprising insight'], allowCustom: true, allowNarial: false },
    { id: 'audience', title: 'Who should feel this was made for them?', explanation: 'Audience language changes the hook, examples, and pace.', options: audienceOptions, allowCustom: true, allowNarial: true },
    { id: 'emotion', title: 'Which emotion should lead the video?', explanation: 'The lead emotion guides voice energy, shot length, music, and captions.', options: ['Curiosity', 'Excitement', 'Trust', 'Inspiration', 'Urgency', 'Humour'], allowCustom: false, allowNarial: true },
    { id: 'action', title: 'What should viewers do after watching?', explanation: 'One clear outcome gives the ending a satisfying direction.', options: ['Visit a website', 'Try the product', 'Follow the account', 'Comment', 'Save or share', 'Learn something'], allowCustom: true, allowNarial: true },
  ];
  return definitions.filter((question) => !known[question.id]);
}

export function buildCreativeBrief(answers: BriefAnswer, dna: ViralDNA): CreativeBrief {
  if (!answers.topic?.trim()) throw new Error('A topic is required before generation.');
  return {
    topic: answers.topic.trim(), audience: answers.audience?.trim() || dna.audience.likelyAudience,
    emotion: answers.emotion?.trim() || dna.hook.emotionalTrigger || 'Curiosity', action: answers.action?.trim() || 'No direct CTA',
    durationSeconds: Math.min(60, Math.max(15, Math.round(dna.retention.totalDurationSeconds || 30))),
    aspectRatio: dna.audience.aspectRatio, platform: dna.audience.platform, language: 'English',
    visualStyle: dna.editing.visualLayering, captionStyle: dna.editing.captionBehavior,
    musicEnergy: dna.editing.musicEnergy, pacing: dna.editing.cutRhythm,
    restrictions: dna.originalityGuardrails,
  };
}

function splitTiming(duration: number, count: number): [number, number][] {
  const weights = count === 7 ? [3, 4, 4, 5, 5, 5, 4] : Array.from({ length: count }, () => 1);
  const total = weights.reduce((sum, value) => sum + value, 0);
  let cursor = 0;
  return weights.map((weight, index) => {
    const end = index === count - 1 ? duration : Math.round((cursor + duration * weight / total) * 10) / 10;
    const result: [number, number] = [cursor, end]; cursor = end; return result;
  });
}

function sentenceFor(purpose: string, brief: CreativeBrief): string {
  const topic = brief.topic.replace(/[.!?]+$/, '');
  const lines: Record<string, string> = {
    Hook: `What if ${topic.toLowerCase()} took less effort than you think?`, Context: `Most ${brief.audience.toLowerCase()} start with too many moving parts.`,
    Problem: 'That complexity slows the idea down before anyone sees its value.', Escalation: 'And every extra step creates another reason to stop.',
    Solution: `The better approach is to make ${topic.toLowerCase()} clear, focused, and easy to act on.`,
    Payoff: 'Now the idea lands quickly—and the next step feels obvious.', CTA: brief.action === 'No direct CTA' ? 'Keep the idea; use it when the moment is right.' : `${brief.action} and make the next version yours.`,
  };
  return lines[purpose] || topic;
}

export function createVideoProject(input: { id?: string; dna: ViralDNA; brief: CreativeBrief; now?: Date }): VideoProject {
  const now = input.now ?? new Date();
  const id = input.id ?? `project-${now.getTime().toString(36)}`;
  const purposes = ['Hook', 'Context', 'Problem', 'Escalation', 'Solution', 'Payoff', 'CTA'];
  const timings = splitTiming(input.brief.durationSeconds, purposes.length);
  const continuityId = `${id}-continuity`;
  const hooks = [
    `What if ${input.brief.topic.toLowerCase()} took less effort than you think?`,
    `Most people make ${input.brief.topic.toLowerCase()} harder than it needs to be.`,
    `Here’s the shift that changes how ${input.brief.topic.toLowerCase()} works.`,
  ].map((text, index) => ({ id: `hook-${index + 1}`, text, score: 92 - index * 4, selected: index === 0, reason: index === 0 ? 'Best balance of clarity, curiosity, and visual potential.' : 'Strong alternative with a different emotional entry.' }));
  const continuity = {
    id: continuityId, character: 'One original, non-identifiable creator in the target audience age range', wardrobe: 'Charcoal overshirt with no logos',
    environment: 'Modern workspace with uncluttered surfaces', lighting: 'Soft directional key light with a subtle lime practical',
    cameraLanguage: input.dna.editing.cameraMovement, colorPalette: input.dna.editing.colorLightingMood,
    visualStyle: input.brief.visualStyle, lockedElements: ['wardrobe', 'face and hair', 'workspace layout', 'product proportions', 'color treatment'],
  };
  const scenes = purposes.map((purpose, index): VideoScene => {
    const [startSeconds, endSeconds] = timings[index];
    const scriptLine = sentenceFor(purpose, input.brief);
    const versionId = `scene-${index + 1}-v1`;
    return {
      id: `scene-${index + 1}`, startSeconds, endSeconds, durationSeconds: Number((endSeconds - startSeconds).toFixed(1)), purpose, scriptLine,
      voiceEmotion: `${input.brief.emotion}; ${purpose === 'Hook' ? 'immediate and precise' : 'natural and confident'}`,
      visualDescription: `${purpose}: an original visual metaphor for ${input.brief.topic}; no reference-video assets or identifiable people.`,
      cameraDirection: purpose === 'Hook' ? 'Immediate push-in from a clean wide frame' : index % 2 ? 'Controlled lateral move' : 'Stable medium close-up',
      characterDetails: continuity.character, location: continuity.environment, lighting: continuity.lighting,
      motion: input.brief.pacing === 'Fast' ? 'One clear movement on the spoken beat' : 'Subtle purposeful movement',
      textOverlay: purpose === 'Hook' ? scriptLine.split(' ').slice(0, 6).join(' ') : purpose,
      captions: [{ startSeconds, endSeconds, text: scriptLine }], transitionIn: index === 0 ? 'Cold open' : 'Match cut on motion',
      transitionOut: index === purposes.length - 1 ? 'Clean hold for comprehension' : 'Direct cut on phrase ending',
      soundEffect: purpose === 'Hook' || purpose === 'Payoff' ? 'Subtle tonal accent' : 'None', musicIntensity: index < 4 ? 'Rising' : 'Resolved',
      generationPrompt: `[Continuity: ${continuityId}] ${continuity.visualStyle}. ${purpose}. ${scriptLine} ${continuity.cameraLanguage}. ${continuity.lighting}. Completely original people, setting, composition, and assets.`,
      status: 'planned', continuityReferences: [continuityId], versions: [{ id: versionId, createdAt: now.toISOString(), instruction: 'Initial production plan', status: 'planned' }], activeVersionId: versionId,
    };
  });
  return {
    schemaVersion: 1, id, status: 'brief-ready', createdAt: now.toISOString(), updatedAt: now.toISOString(), dna: input.dna, brief: input.brief,
    hooks, script: scenes.map((scene) => scene.scriptLine).join(' '), continuity, scenes,
    timeline: { durationSeconds: input.brief.durationSeconds, sceneOrder: scenes.map((scene) => scene.id), captionsTrack: scenes.map((scene) => scene.id), voiceoverTrack: scenes.map((scene) => scene.id), musicTrack: `${input.brief.musicEnergy} royalty-safe original instrumental`, transitions: scenes.map((scene) => scene.transitionOut) },
    generation: { jobId: `job-${id}`, progress: 0, stage: GENERATION_STAGES[0], updatedAt: now.toISOString() },
  };
}

export function advanceVideoProject(project: VideoProject, now = new Date()): VideoProject {
  if (project.status === 'preview-ready' || project.status === 'completed') return project;
  const firstPending = project.scenes.findIndex((scene) => scene.status !== 'ready');
  const scenes = project.scenes.map((scene, index) => index === firstPending ? { ...scene, status: scene.status === 'planned' ? 'generating' as const : 'ready' as const } : scene);
  const ready = scenes.filter((scene) => scene.status === 'ready').length;
  const progress = Math.round((ready / scenes.length) * 82);
  if (ready === scenes.length) {
    const withQuality = { ...project, scenes, status: 'preview-ready' as const, generation: { ...project.generation, progress: 100, stage: GENERATION_STAGES.at(-1)!, updatedAt: now.toISOString() }, updatedAt: now.toISOString() };
    return { ...withQuality, quality: runQualityCheck(withQuality) };
  }
  const stageIndex = Math.min(GENERATION_STAGES.length - 2, Math.max(1, Math.ceil(progress / 9)));
  return { ...project, scenes, status: ready ? 'partial-generation' : 'generating', generation: { ...project.generation, progress: Math.max(4, progress), stage: GENERATION_STAGES[stageIndex], updatedAt: now.toISOString() }, updatedAt: now.toISOString() };
}

export function regenerateScene(project: VideoProject, sceneId: string, instruction: string, now = new Date()): VideoProject {
  const scenes = project.scenes.map((scene) => {
    if (scene.id !== sceneId) return scene;
    const version: SceneVersion = { id: `${scene.id}-v${scene.versions.length + 1}`, createdAt: now.toISOString(), instruction: instruction.trim() || 'Regenerate this scene', status: 'queued' };
    return { ...scene, status: 'queued' as const, generationPrompt: `${scene.generationPrompt} Revision: ${version.instruction}`, versions: [...scene.versions, version], activeVersionId: version.id };
  });
  return { ...project, scenes, status: 'partial-generation', quality: undefined, updatedAt: now.toISOString() };
}

export function updateSceneScript(project: VideoProject, sceneId: string, scriptLine: string, now = new Date()): VideoProject {
  const scenes = project.scenes.map((scene) => scene.id === sceneId ? { ...scene, scriptLine, textOverlay: scriptLine.split(' ').slice(0, 6).join(' '), captions: [{ startSeconds: scene.startSeconds, endSeconds: scene.endSeconds, text: scriptLine }], status: 'needs-review' as const } : scene);
  return { ...project, scenes, script: scenes.map((scene) => scene.scriptLine).join(' '), status: 'editing', quality: undefined, updatedAt: now.toISOString() };
}

export function runQualityCheck(project: VideoProject, now = new Date()): QualityReport {
  const checks = [
    { id: 'hook', label: 'Hook is clear in the opening seconds', passed: project.scenes[0]?.durationSeconds <= 4 && project.scenes[0]?.scriptLine.length > 10, detail: 'Opening beat is concise and understandable.' },
    { id: 'duration', label: 'Duration matches the brief', passed: project.scenes.at(-1)?.endSeconds === project.brief.durationSeconds, detail: `${project.timeline.durationSeconds} second timeline.` },
    { id: 'originality', label: 'Originality guardrails are attached', passed: project.brief.restrictions.length > 0 && project.scenes.every((scene) => scene.generationPrompt.includes('original')), detail: 'New script, scenes, people, voice, captions, and assets are required.' },
    { id: 'continuity', label: 'Continuity is shared across clips', passed: project.scenes.every((scene) => scene.continuityReferences.includes(project.continuity.id)), detail: 'Character and visual profile is referenced by every clip.' },
    { id: 'captions', label: 'Captions align to each scene', passed: project.scenes.every((scene) => scene.captions[0]?.text === scene.scriptLine), detail: 'Caption timing follows clip boundaries.' },
    { id: 'ending', label: 'Ending has a complete action or payoff', passed: Boolean(project.scenes.at(-1)?.scriptLine), detail: project.brief.action },
  ];
  return { status: checks.every((check) => check.passed) ? 'passed' : 'needs-review', checkedAt: now.toISOString(), checks };
}
