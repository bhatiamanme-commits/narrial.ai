import { VideoAnalysisError, parseVideoAnalysis, type VideoAnalysis } from '../video-analysis/domain.js';

export type StoryScene = { startSeconds: number; endSeconds: number; purpose: string; narration: string; visual: string; emotion: string };
export type GeneratedStory = { schemaVersion: 1; title: string; hook: string; story: string; scenes: StoryScene[]; ending: string; originalityNote: string };
export type StoryRequest = { analysis: VideoAnalysis; prompt: string; questionAnswers: Array<{ question: string; answer: string }> };

function text(value: unknown, max: number): value is string { return typeof value === 'string' && value.trim().length > 0 && value.length <= max; }
function record(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }

export function parseStoryRequest(value: unknown): StoryRequest {
  if (!record(value) || !text(value.prompt, 2_000) || !Array.isArray(value.questionAnswers) || value.questionAnswers.length > 12 ||
      !value.questionAnswers.every((item) => record(item) && text(item.question, 300) && text(item.answer, 1_000))) {
    throw new VideoAnalysisError('INVALID_STORY_REQUEST', 'Story input is invalid.');
  }
  return { analysis: parseVideoAnalysis(value.analysis), prompt: value.prompt.trim(), questionAnswers: value.questionAnswers as StoryRequest['questionAnswers'] };
}

export function parseGeneratedStory(value: unknown, durationSeconds: number): GeneratedStory {
  if (!record(value) || !text(value.title, 200) || !text(value.hook, 500) || !text(value.story, 8_000) || !text(value.ending, 1_000) ||
      !text(value.originalityNote, 1_000) || !Array.isArray(value.scenes) || value.scenes.length < 2 || value.scenes.length > 20) {
    throw new VideoAnalysisError('INVALID_STORY', 'The story generator returned an invalid story.');
  }
  let previousEnd = 0;
  const scenes = value.scenes.map((scene) => {
    if (!record(scene) || typeof scene.startSeconds !== 'number' || typeof scene.endSeconds !== 'number' ||
        scene.startSeconds !== previousEnd || scene.endSeconds <= scene.startSeconds || scene.endSeconds > durationSeconds ||
        !text(scene.purpose, 200) || !text(scene.narration, 1_500) || !text(scene.visual, 1_500) || !text(scene.emotion, 100)) {
      throw new VideoAnalysisError('INVALID_STORY', 'The story generator returned an invalid story.');
    }
    previousEnd = scene.endSeconds;
    return scene as StoryScene;
  });
  if (Math.abs(previousEnd - durationSeconds) > 0.01) throw new VideoAnalysisError('INVALID_STORY', 'Story scenes do not match the requested duration.');
  return { schemaVersion: 1, title: value.title, hook: value.hook, story: value.story, scenes, ending: value.ending, originalityNote: value.originalityNote };
}

