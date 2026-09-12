import assert from 'node:assert/strict';
import test from 'node:test';

import { ANALYSIS_STEPS, buildCompleteQuestionAnswerPayload, buildQuestionAnswerPayload, getAnalysisPresentation, getAnalysisStepIndex, getAnalysisStepStates, getNextAnalysisDisplayProgress, getVideoAssistantPhase, recordQuestionAdvance } from './video-assistant-state.ts';

test('collects user options before starting video analysis', () => {
  assert.equal(getVideoAssistantPhase(false, 0), 'questions');
  assert.equal(getVideoAssistantPhase(false, 100), 'questions');
});

test('starts analysis only after the questions are complete', () => {
  assert.equal(getVideoAssistantPhase(true, 0), 'analyzing');
  assert.equal(getVideoAssistantPhase(true, 99), 'analyzing');
  assert.equal(getVideoAssistantPhase(true, 100), 'complete');
});

test('describes the creative work the AI performs in order', () => {
  assert.deepEqual(ANALYSIS_STEPS.map((step) => step.label), [
    'Understanding your video DNA',
    'Understanding the visuals',
    'Understanding scenes and audio',
    'Finding the hook',
    'Learning content patterns',
    'Reading performance signals',
  ]);
  assert.deepEqual(ANALYSIS_STEPS.map((step) => step.activity), [
    'Mapping pacing, tone, and structure',
    'Reading composition, motion, and text',
    'Listening for dialogue, music, and rhythm',
    'Detecting the opening attention trigger',
    'Connecting recurring creative decisions',
    'Evaluating retention and engagement cues',
  ]);
});

test('marks earlier analysis steps complete and the current step active', () => {
  assert.deepEqual(getAnalysisStepStates(2), ['complete', 'complete', 'active', 'upcoming', 'upcoming', 'upcoming']);
  assert.deepEqual(getAnalysisStepStates(99), ['complete', 'complete', 'complete', 'complete', 'complete', 'active']);
});

test('includes free-form creative direction in the script-generation brief', () => {
  assert.deepEqual(buildCompleteQuestionAnswerPayload(
    [{ id: 'tone', title: 'What tone?' }],
    { tone: { option: 'Inspiring' } },
    ['Open quietly', 'End with a strong call to action'],
  ), [
    { question: 'What tone?', answer: 'Inspiring' },
    { question: 'Additional creative direction', answer: 'Open quietly\nEnd with a strong call to action' },
  ]);
});

test('maps real job progress across every visible analysis step', () => {
  assert.equal(getAnalysisStepIndex(0), 0);
  assert.equal(getAnalysisStepIndex(15), 0);
  assert.equal(getAnalysisStepIndex(17), 1);
  assert.equal(getAnalysisStepIndex(79), 4);
  assert.equal(getAnalysisStepIndex(99), 5);
  assert.equal(getAnalysisStepIndex(100), 5);
});

test('advances display progress smoothly without claiming completion', () => {
  assert.equal(getNextAnalysisDisplayProgress(0, 0), 1);
  assert.equal(getNextAnalysisDisplayProgress(12, 30), 30);
  assert.equal(getNextAnalysisDisplayProgress(30, 30), 31);
  assert.equal(getNextAnalysisDisplayProgress(92, 30), 92);
  assert.equal(getNextAnalysisDisplayProgress(40, 100), 100);
});

test('builds one complete question and answer payload after collection', () => {
  const payload = buildQuestionAnswerPayload([
    { id: 'format', title: 'What are you creating?' },
    { id: 'audience', title: 'Who is this video for?' },
    { id: 'tone', title: 'What tone should the video have?' },
  ], {
    format: { option: 'Social reel' },
    audience: { option: 'Custom audience', custom: 'New founders' },
    tone: { skipped: true },
  });

  assert.deepEqual(payload, [
    { question: 'What are you creating?', answer: 'Social reel' },
    { question: 'Who is this video for?', answer: 'New founders' },
    { question: 'What tone should the video have?', answer: 'Not specified' },
  ]);
});

test('commits a displayed default answer when the user advances without selecting it', () => {
  const answers = recordQuestionAdvance({}, { id: 'format', title: 'What are you creating?', defaultOption: 'Social reel' }, 'next');
  assert.deepEqual(answers, { format: { option: 'Social reel' } });
  assert.deepEqual(buildQuestionAnswerPayload([{ id: 'format', title: 'What are you creating?' }], answers), [
    { question: 'What are you creating?', answer: 'Social reel' },
  ]);
});

test('replaces processing details with one summary after analysis completes', () => {
  assert.equal(getAnalysisPresentation(99), 'process');
  assert.equal(getAnalysisPresentation(100), 'summary');
});
