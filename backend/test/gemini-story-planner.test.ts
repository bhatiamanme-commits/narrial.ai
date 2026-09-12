import { describe, expect, it } from 'vitest';
import { GeminiStoryPlanner } from '../src/story-generation/gemini-story-planner.js';

describe('GeminiStoryPlanner', () => {
  it('uses structural reference data without sending source dialogue', async () => {
    let requestBody = '';
    const fetcher: typeof fetch = (_url, init) => {
      requestBody = typeof init?.body === 'string' ? init.body : '';
      return Promise.resolve(new Response(JSON.stringify({ output_text: JSON.stringify({
        title: 'Original', hook: 'A fresh hook', story: 'A new story',
        scenes: [{ startSeconds: 0, endSeconds: 2, purpose: 'Hook', narration: 'New words', visual: 'New view', emotion: 'Curiosity' }, { startSeconds: 2, endSeconds: 5, purpose: 'Payoff', narration: 'New ending', visual: 'New result', emotion: 'Trust' }],
        ending: 'Finish', originalityNote: 'All expression is original',
      }) }), { status: 200 }));
    };
    await new GeminiStoryPlanner({ apiKey: 'test', model: 'test', timeoutMs: 1_000 }, fetcher).generate({
      prompt: 'Tell a product story', questionAnswers: [{ question: 'Audience?', answer: 'Creators' }],
      analysis: { schemaVersion: 1, summary: 'Summary', durationSeconds: 5, subjects: [], scenes: [{ startSeconds: 0, endSeconds: 5, description: 'Scene', spokenContent: 'PROTECTED SOURCE DIALOGUE' }], creativeDNA: { openingHook: 'Reveal', narrativeStructure: 'Hook payoff', pacing: 'Fast', visualStyle: [], colorMood: [], editingPatterns: [], audioStyle: 'Voice' }, reusableInsights: [], safetyFlags: [] },
    });
    expect(requestBody).not.toContain('PROTECTED SOURCE DIALOGUE');
    expect(requestBody).toContain('sceneRhythm');
  });
});
