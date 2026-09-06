import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('completed analysis is a plain full response without a green status icon', async () => {
  const source = await readFile(new URL('./video-assistant.tsx', import.meta.url), 'utf8');
  const summary = source.slice(source.indexOf('function AnalysisSummary'), source.indexOf('function GeneratedVideoCard'));
  const status = source.slice(source.indexOf('function AnalysisStatus'), source.indexOf('function AnalysisSummary'));

  assert.doesNotMatch(status, /statusCheck/);
  assert.match(summary, /narrativeStructure/);
  assert.match(summary, /visualStyle/);
  assert.match(summary, /editingPatterns/);
  assert.match(summary, /audioStyle/);
  assert.doesNotMatch(summary, /styles\.analysisSummary/);
});
