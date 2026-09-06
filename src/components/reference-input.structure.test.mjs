import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('reference modals keep dismiss buttons separate from their interactive panels', async () => {
  const source = await readFile(new URL('./reference-input.tsx', import.meta.url), 'utf8');
  const modals = source.slice(source.indexOf('<Modal transparent visible={sheetVisible}'));

  assert.equal((modals.match(/<View style=\{styles\.backdrop\}>/g) ?? []).length, 2);
  assert.equal((modals.match(/style=\{styles\.backdropDismiss\}/g) ?? []).length, 2);
  assert.doesNotMatch(modals, /<Pressable[^>]+style=\{styles\.backdrop\}>/);
});
