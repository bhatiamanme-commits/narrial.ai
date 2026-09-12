import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('renders a generated script as accessible numbered scenes', async () => {
  const source = await readFile(new URL('./story-card.tsx', import.meta.url), 'utf8');
  assert.match(source, /ORIGINAL SCRIPT/);
  assert.match(source, /accessibilityRole="list"/);
  assert.match(source, /accessibilityLabel=\{`Scene \$\{index \+ 1\}/);
  assert.match(source, /Scene \{index \+ 1\}/);
  assert.match(source, /NARRATION/);
  assert.match(source, /VISUAL DIRECTION/);
});
