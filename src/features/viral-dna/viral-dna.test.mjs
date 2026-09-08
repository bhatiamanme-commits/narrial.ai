import assert from 'node:assert/strict';
import test from 'node:test';

import { deriveViralDna } from './viral-dna.ts';

const analysis = {
  schemaVersion: 1,
  summary: 'A fast product demonstration with a clear result.',
  durationSeconds: 30,
  subjects: [{ label: 'Creator', description: 'Demonstrates the product.' }],
  scenes: [
    { startSeconds: 0, endSeconds: 3, description: 'Unexpected close-up reveal.' },
    { startSeconds: 3, endSeconds: 9, description: 'Problem and context.' },
    { startSeconds: 9, endSeconds: 20, description: 'Demonstration and escalation.' },
    { startSeconds: 20, endSeconds: 27, description: 'Result and payoff.' },
    { startSeconds: 27, endSeconds: 30, description: 'Call to action.' },
  ],
  creativeDNA: {
    openingHook: 'Unexpected close-up reveal', narrativeStructure: 'Hook, problem, demonstration, payoff, CTA',
    pacing: 'Fast', visualStyle: ['High contrast'], colorMood: ['Warm'], editingPatterns: ['Jump cuts'],
    audioStyle: 'Energetic voice-over', callToAction: 'Try it today',
  },
  reusableInsights: ['Reveal the result early.'], safetyFlags: [],
};

test('derives timing and retention observations from actual scenes', () => {
  const dna = deriveViralDna(analysis);
  assert.equal(dna.durationSeconds, 30);
  assert.equal(dna.averageShotSeconds, 6);
  assert.equal(dna.visualChanges, 4);
  assert.equal(dna.timeline[0].range, '0:00–0:03');
  assert.equal(dna.timeline.at(-1).purpose, 'Call to action');
  assert.match(dna.retentionLanguage, /Likely retention driver/);
});

test('does not invent a viral performance guarantee', () => {
  const dna = deriveViralDna({ ...analysis, creativeDNA: { ...analysis.creativeDNA, callToAction: undefined } });
  assert.doesNotMatch(JSON.stringify(dna), /went viral because|guaranteed/i);
  assert.equal(dna.timeline.at(-1).purpose, 'Payoff');
});

