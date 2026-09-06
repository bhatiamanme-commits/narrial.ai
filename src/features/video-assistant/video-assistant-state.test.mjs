import assert from 'node:assert/strict';
import test from 'node:test';

import { ANALYSIS_STEPS, buildQuestionAnswerPayload, getAnalysisPresentation, getAnalysisStepIndex, getAnalysisStepStates, getVideoAssistantPhase } from './video-assistant-state.ts';

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
    'Finding the hook',
    'Creating the visuals',
    'Learning content patterns',
    'Reading performance and signals',
  ]);
  assert.deepEqual(ANALYSIS_STEPS.map((step) => step.activity), [
    'Mapping pacing · tone · structure',
    'Detecting the opening attention trigger',
    'Matching composition · motion · typography',
    'Connecting recurring creative decisions',
    'Evaluating retention · rhythm · engagement',
  ]);
});

test('marks earlier analysis steps complete and the current step active', () => {
  assert.deepEqual(getAnalysisStepStates(2), ['complete', 'complete', 'active', 'upcoming', 'upcoming']);
  assert.deepEqual(getAnalysisStepStates(99), ['complete', 'complete', 'complete', 'complete', 'active']);
});

test('maps real job progress across every visible analysis step', () => {
  assert.equal(getAnalysisStepIndex(0), 0);
  assert.equal(getAnalysisStepIndex(19), 0);
  assert.equal(getAnalysisStepIndex(20), 1);
  assert.equal(getAnalysisStepIndex(79), 3);
  assert.equal(getAnalysisStepIndex(99), 4);
  assert.equal(getAnalysisStepIndex(100), 4);
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

test('replaces processing details with one summary after analysis completes', () => {
  assert.equal(getAnalysisPresentation(99), 'process');
  assert.equal(getAnalysisPresentation(100), 'summary');
});
