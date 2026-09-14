import { describe, expect, it } from 'vitest';
import { GeminiStoryPlanner } from '../src/story-generation/gemini-story-planner.js';

describe('GeminiStoryPlanner', () => {
  it('uses structural reference data without sending source dialogue', async () => {
    let requestBody = '';
    const fetcher: typeof fetch = (_url, init) => {
      requestBody = typeof init?.body === 'string' ? init.body : '';
      return Promise.resolve(new Response(JSON.stringify({ status: 'completed', steps: [{ type: 'model_output', content: [{ type: 'text', text: JSON.stringify({
        title: 'Original', hook: 'A fresh hook', story: 'A new story',
        scenes: [{ startSeconds: 0, endSeconds: 2, purpose: 'Hook', narration: 'New words', visual: 'New view', emotion: 'Curiosity' }, { startSeconds: 2, endSeconds: 5, purpose: 'Payoff', narration: 'New ending', visual: 'New result', emotion: 'Trust' }],
        ending: 'Finish', originalityNote: 'All expression is original',
      }) }] }] }), { status: 200 }));
    };
    await new GeminiStoryPlanner({ apiKey: 'test', model: 'test', timeoutMs: 1_000 }, fetcher).generate({
      prompt: 'Tell a product story', questionAnswers: [{ question: 'Audience?', answer: 'Creators' }],
      analysis: { schemaVersion: 1, summary: 'Summary', durationSeconds: 5, subjects: [], scenes: [{ startSeconds: 0, endSeconds: 5, description: 'Scene', spokenContent: 'PROTECTED SOURCE DIALOGUE' }], creativeDNA: { openingHook: 'Reveal', narrativeStructure: 'Hook payoff', pacing: 'Fast', visualStyle: [], colorMood: [], editingPatterns: [], audioStyle: 'Voice' }, reusableInsights: [], safetyFlags: [] },
    });
    expect(requestBody).not.toContain('PROTECTED SOURCE DIALOGUE');
    expect(requestBody).toContain('sceneRhythm');
    const body = JSON.parse(requestBody) as {
      response_format?: { type?: string; mime_type?: string; schema?: { type?: string; required?: string[] } };
      store?: boolean;
    };
    expect(body.response_format).toMatchObject({
      type: 'text',
      mime_type: 'application/json',
      schema: { type: 'object', required: ['title', 'hook', 'story', 'scenes', 'ending', 'originalityNote'] },
    });
    expect(body.store).toBe(false);
  });

  it('classifies malformed model JSON as invalid story output', async () => {
    const fetcher: typeof fetch = () => Promise.resolve(new Response(JSON.stringify({
      status: 'completed',
      steps: [{ type: 'model_output', content: [{ type: 'text', text: 'not-json' }] }],
    }), { status: 200 }));

    await expect(new GeminiStoryPlanner({ apiKey: 'test', model: 'test', timeoutMs: 1_000 }, fetcher).generate({
      prompt: 'Tell a product story',
      questionAnswers: [],
      analysis: { schemaVersion: 1, summary: 'Summary', durationSeconds: 5, subjects: [], scenes: [{ startSeconds: 0, endSeconds: 5, description: 'Scene' }], creativeDNA: { openingHook: 'Reveal', narrativeStructure: 'Hook payoff', pacing: 'Fast', visualStyle: [], colorMood: [], editingPatterns: [], audioStyle: 'Voice' }, reusableInsights: [], safetyFlags: [] },
    })).rejects.toMatchObject({ code: 'INVALID_STORY' });
  });
});
