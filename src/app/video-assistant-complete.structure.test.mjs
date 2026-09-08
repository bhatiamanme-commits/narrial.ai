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

test('analysis progress is a simple vertical step timeline', async () => {
  const source = await readFile(new URL('./video-assistant.tsx', import.meta.url), 'utf8');
  const status = source.slice(source.indexOf('function AnalysisStatus'), source.indexOf('function AnalysisSummary'));

  assert.doesNotMatch(status, /analysisEyebrow|analysisPercentage|progressTrack/);
  assert.match(status, /LoadingCircle/);
  assert.match(status, /stepConnector/);
});

test('completed analysis scrolls the conversation to the option sheet', async () => {
  const source = await readFile(new URL('./video-assistant.tsx', import.meta.url), 'utf8');

  assert.match(source, /conversationScrollRef/);
  assert.match(source, /scrollToEnd\(\{ animated: true \}\)/);
});

test('analysis completion does not show a generated video before options are answered', async () => {
  const source = await readFile(new URL('./video-assistant.tsx', import.meta.url), 'utf8');

  assert.doesNotMatch(source, /GeneratedVideoCard/);
});
