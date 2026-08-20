import assert from 'node:assert/strict';
import test from 'node:test';

import { getBackAction } from './navigation-utils.ts';

test('back navigation falls back when the navigator has no history', () => {
  assert.equal(getBackAction(true, '/generator'), 'back');
  assert.equal(getBackAction(false, '/generator'), '/generator');
});
