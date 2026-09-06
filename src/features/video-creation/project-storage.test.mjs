import assert from 'node:assert/strict';
import test from 'node:test';

import { createMemoryStorage, loadViralDNASession, saveViralDNASession } from './project-storage.ts';

test('workflow seed survives a storage round trip', async () => {
  const storage = createMemoryStorage();
  const seed = { id: 'session-1', referenceId: 'ref-1', referenceName: 'Reference', platform: 'Short-form video', aspectRatio: '9:16', savedAt: '2026-09-06T00:00:00Z', analysis: { schemaVersion: 1, summary: 'Test', durationSeconds: 10, subjects: [], scenes: [], creativeDNA: { openingHook: 'Question', narrativeStructure: 'Hook payoff', pacing: 'Fast', visualStyle: [], colorMood: [], editingPatterns: [], audioStyle: 'Voice' }, reusableInsights: [], safetyFlags: [] } };
  await saveViralDNASession(seed, storage);
  assert.deepEqual(await loadViralDNASession(seed.id, storage), seed);
});
