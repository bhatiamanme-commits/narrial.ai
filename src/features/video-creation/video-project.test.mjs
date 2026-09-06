import assert from 'node:assert/strict';
import test from 'node:test';

import { buildClarificationQuestions, buildCreativeBrief, createVideoProject, getClarificationStartIndex, regenerateScene, runQualityCheck } from './video-project.ts';

const dna = {
  schemaVersion: 1, referenceId: 'ref-1', generatedAt: '2026-09-06T00:00:00.000Z', confidence: 0.78,
  hook: { type: 'Visual surprise', durationSeconds: 3, openingVisual: 'Result first', firstLinePurpose: 'Open curiosity', curiosityGap: 'How it happened', patternInterrupt: 'Fast push in', emotionalTrigger: 'Curiosity', likelyRetentionDriver: 'Likely retention driver: immediate contrast.' },
  narrative: [{ id: 'hook', label: 'Hook', startSeconds: 0, endSeconds: 3, description: 'Result first' }],
  retention: { totalDurationSeconds: 30, averageShotLengthSeconds: 5, visualChangeCount: 6, majorBeatCount: 6, captionDensity: 'Medium', voiceoverSpeed: 'Fast', pausePlacement: 'After hook', motionFrequency: 'Frequent', bRollFrequency: 'Occasional', patternInterruptMoments: [0], emotionalProgression: ['Curiosity', 'Trust'], payoffTimingSeconds: 25, ctaTimingSeconds: 27 },
  editing: { cutRhythm: 'Fast', transitionStyle: 'Hard cuts', cameraMovement: 'Push ins', framing: 'Close', captionBehavior: 'Emphasis', textEmphasis: 'Keywords', soundEffects: 'Restrained', musicEnergy: 'Rising', pauseUsage: 'Intentional', visualLayering: 'Clean', colorLightingMood: 'Warm' },
  audience: { likelyAudience: 'Creators', awarenessLevel: 'Problem aware', platform: 'Shorts', aspectRatio: '9:16', contentCategory: 'Education', viewerMotivation: 'Learn', potentialSharingTrigger: 'Potential sharing trigger: useful shortcut.' },
  timeline: [{ id: 'm1', startSeconds: 0, endSeconds: 3, label: 'Hook', description: 'Result first', strength: 'high' }], reusablePrinciples: ['Lead with outcome'], originalityGuardrails: ['Do not copy wording']
};

test('questions adapt to known topic and never repeat it', () => {
  const questions = buildClarificationQuestions(dna, { topic: 'Explain Narial AI' });
  assert.ok(questions.some((question) => question.id === 'audience'));
  assert.ok(!questions.some((question) => question.id === 'topic'));
  assert.ok(questions.every((question) => question.options.length >= 2 && question.options.length <= 6));
});

test('an entirely answered clarification session has no invalid question index', () => {
  const answers = { topic: 'Explain Narial AI', audience: 'Creators', emotion: 'Trust', action: 'Try the product' };
  const questions = buildClarificationQuestions(dna, answers);
  assert.equal(questions.length, 0);
  assert.equal(getClarificationStartIndex(questions, answers), -1);
});

test('creates a 30-second original production plan with independent scenes', () => {
  const brief = buildCreativeBrief({ topic: 'Explain Narial AI', audience: 'Solo creators', emotion: 'Curiosity', action: 'Try the product' }, dna);
  const project = createVideoProject({ id: 'project-1', dna, brief, now: new Date('2026-09-06T00:00:00Z') });
  assert.equal(project.timeline.durationSeconds, 30);
  assert.equal(project.scenes.at(-1).endSeconds, 30);
  assert.equal(project.hooks.length, 3);
  assert.ok(project.scenes.every((scene) => scene.generationPrompt.includes(project.continuity.id)));

  const unchanged = project.scenes[1];
  const regenerated = regenerateScene(project, project.scenes[0].id, 'Make it more energetic', new Date('2026-09-06T00:01:00Z'));
  assert.equal(regenerated.scenes[0].versions.length, 2);
  assert.deepEqual(regenerated.scenes[1], unchanged);
  assert.equal(runQualityCheck(regenerated).status, 'passed');
});
