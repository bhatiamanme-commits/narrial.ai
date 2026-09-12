import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('choice modal keeps its dismiss button separate from option buttons', async () => {
  const source = await readFile(new URL('./generator.tsx', import.meta.url), 'utf8');
  const choiceModal = source.slice(
    source.indexOf('function ChoiceModal'),
    source.indexOf('export default function GeneratorScreen'),
  );

  assert.match(choiceModal, /<View style=\{styles\.modalShade\}>/);
  assert.match(choiceModal, /style=\{styles\.modalDismiss\}\/>/);
  assert.doesNotMatch(choiceModal, /style=\{styles\.modalShade\}>\s*<View/);
});

test('requires a supported reference before entering the reference-based script flow', async () => {
  const source = await readFile(new URL('./generator.tsx', import.meta.url), 'utf8');
  const generate = source.slice(source.indexOf('const generate = async'), source.indexOf('const openSocialConnections'));

  assert.match(generate, /if \(!reference\)/);
  assert.match(generate, /Add a reference video/);
  assert.match(generate, /if \(reference\?\.type === 'file'\)/);
  assert.match(generate, /if \(reference\?\.type === 'url'\)/);
});
