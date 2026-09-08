import { describe, expect, it } from 'vitest';
import { parseGeneratedStory } from '../src/story-generation/domain.js';

describe('generated story validation', () => {
  it('accepts contiguous scenes covering the target duration', () => {
    const story = parseGeneratedStory({ title: 'A fresh start', hook: 'What if one minute changed everything?', story: 'An original transformation.', scenes: [
      { startSeconds: 0, endSeconds: 3, purpose: 'Hook', narration: 'Watch this.', visual: 'A blank desk transforms.', emotion: 'Curiosity' },
      { startSeconds: 3, endSeconds: 10, purpose: 'Payoff', narration: 'Now it is clear.', visual: 'The finished result.', emotion: 'Trust' },
    ], ending: 'Try it.', originalityNote: 'New characters, wording, and visuals.' }, 10);
    expect(story.scenes).toHaveLength(2);
  });
  it('rejects gaps and incomplete duration', () => {
    expect(() => parseGeneratedStory({ title: 'x', hook: 'x', story: 'x', scenes: [
      { startSeconds: 0, endSeconds: 2, purpose: 'x', narration: 'x', visual: 'x', emotion: 'x' },
      { startSeconds: 3, endSeconds: 9, purpose: 'x', narration: 'x', visual: 'x', emotion: 'x' },
    ], ending: 'x', originalityNote: 'x' }, 10)).toThrow(/invalid story/i);
  });
});
