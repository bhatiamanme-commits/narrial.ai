import assert from 'node:assert/strict';
import test from 'node:test';

import { clearSchedulingDraft, getSchedulingDraft, startSchedulingDraft } from './scheduling-service.ts';

test('schedule access exists only after the generated-video publishing flow starts', () => {
  clearSchedulingDraft();
  assert.equal(getSchedulingDraft('user-1'), null);

  startSchedulingDraft('user-1', 'generated-video-primary');
  assert.deepEqual(getSchedulingDraft('user-1'), { userId: 'user-1', postId: 'generated-video-primary' });
  assert.equal(getSchedulingDraft('user-2'), null);

  clearSchedulingDraft();
  assert.equal(getSchedulingDraft('user-1'), null);
});
