import assert from 'node:assert/strict';
import test from 'node:test';
import { buildAiCreativeContext, buildClarificationQuestions, buildCreativeBrief } from './creative-brief.ts';

test('skips the topic question when the generator already supplied a topic', () => {
  const questions = buildClarificationQuestions({ prompt: 'Explain our automatic caption product' });
  assert.equal(questions.some((question) => question.id === 'topic'), false);
  assert.deepEqual(questions.map((question) => question.id), ['audience', 'emotion', 'action']);
});

test('asks for topic first when it is missing', () => {
  assert.equal(buildClarificationQuestions({ prompt: '' })[0].id, 'topic');
});

test('creates a normalized brief and records Narial-decided values', () => {
  const brief = buildCreativeBrief({ prompt: 'Launch a caption tool', aspectRatio: '9:16' }, {
    audience: { custom: 'Solo creators' }, emotion: { option: 'Let Narial decide' }, action: { option: 'Try the product' },
  });
  assert.equal(brief.topic, 'Launch a caption tool');
  assert.equal(brief.audience, 'Solo creators');
  assert.equal(brief.primaryEmotion, 'Narial decides');
  assert.equal(brief.desiredAction, 'Try the product');
});

test('sends all questions with their answers as one structured AI context', () => {
  const context = buildAiCreativeContext({
    prompt: 'Launch a caption tool',
    referenceSummary: 'Fast demonstration with an early payoff.',
    questions: buildClarificationQuestions({ prompt: 'Launch a caption tool' }),
    answers: { audience: { custom: 'Solo creators' }, emotion: { option: 'Trust' }, action: { option: 'Try the product' } },
  });
  assert.equal(context.userIntent.originalPrompt, 'Launch a caption tool');
  assert.deepEqual(context.userIntent.questionAnswers[0], { questionId: 'audience', question: 'Who should feel this was made for them?', answer: 'Solo creators' });
  assert.equal(context.userIntent.questionAnswers.length, 3);
  assert.equal(context.referenceContext.summary, 'Fast demonstration with an early payoff.');
});
