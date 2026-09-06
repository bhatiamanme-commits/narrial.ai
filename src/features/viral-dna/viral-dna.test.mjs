import assert from 'node:assert/strict';
import test from 'node:test';

import { deriveViralDNA, parseViralDNA } from './viral-dna.ts';

const analysis = {
  schemaVersion: 1,
  summary: 'A concise product demonstration with an immediate result.',
  durationSeconds: 30,
  language: 'English',
  subjects: [{ label: 'Presenter', description: 'A presenter demonstrates a workflow.' }],
  scenes: [
    { startSeconds: 0, endSeconds: 3, description: 'Unexpected result first', cameraMovement: 'push in', onScreenText: ['Wait—what?'] },
    { startSeconds: 3, endSeconds: 12, description: 'Problem and escalating explanation' },
    { startSeconds: 12, endSeconds: 25, description: 'Demonstration and payoff' },
    { startSeconds: 25, endSeconds: 30, description: 'Call to action' },
  ],
  creativeDNA: {
    openingHook: 'Result-first visual surprise', narrativeStructure: 'Hook, problem, demonstration, payoff, CTA',
    pacing: 'Fast with one short pause', visualStyle: ['clean close-ups'], colorMood: ['warm'],
    editingPatterns: ['hard cuts', 'caption emphasis'], audioStyle: 'Energetic voiceover', callToAction: 'Try it yourself',
  },
  reusableInsights: ['Lead with a visible outcome.'], safetyFlags: [],
};

test('derives timed DNA from actual analyzed scenes', () => {
  const dna = deriveViralDNA(analysis, { referenceId: 'ref-1', platform: 'YouTube Shorts', aspectRatio: '9:16' });
  assert.equal(dna.referenceId, 'ref-1');
  assert.equal(dna.retention.totalDurationSeconds, 30);
  assert.equal(dna.retention.averageShotLengthSeconds, 7.5);
  assert.deepEqual(dna.timeline.map((item) => [item.startSeconds, item.endSeconds]), [[0, 3], [3, 12], [12, 25], [25, 30]]);
  assert.match(dna.hook.likelyRetentionDriver, /Likely retention driver/);
  assert.equal(parseViralDNA(dna).schemaVersion, 1);
});

test('rejects malformed DNA instead of exposing it to the interface', () => {
  assert.throws(() => parseViralDNA({ schemaVersion: 1, timeline: [] }), /invalid/i);
});
