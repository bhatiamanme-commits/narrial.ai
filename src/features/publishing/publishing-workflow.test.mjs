import assert from 'node:assert/strict';
import test from 'node:test';

import {
  beginVideoGeneration,
  canScheduleGeneratedVideo,
  clearGeneratedVideoState,
  getGeneratedVideo,
  getPublishableGeneratedVideo,
  markGeneratedVideoReady,
  markGeneratedVideoReviewed,
} from './publishing-workflow.ts';

test('a generated video becomes publishable only after it is ready and reviewed', () => {
  clearGeneratedVideoState('workflow-user');
  beginVideoGeneration('workflow-user');
  assert.equal(getGeneratedVideo('workflow-user'), null);
  assert.equal(getPublishableGeneratedVideo('workflow-user'), null);

  markGeneratedVideoReady('workflow-user', 'generated-video-primary');
  assert.deepEqual(getGeneratedVideo('workflow-user'), {
    userId: 'workflow-user',
    videoId: 'generated-video-primary',
    status: 'ready',
    reviewed: false,
  });
  assert.equal(getPublishableGeneratedVideo('workflow-user'), null);
  assert.equal(canScheduleGeneratedVideo('workflow-user', 'generated-video-primary', ['instagram-1']), false);

  markGeneratedVideoReviewed('workflow-user', 'generated-video-primary');
  assert.equal(getPublishableGeneratedVideo('workflow-user')?.videoId, 'generated-video-primary');
  assert.equal(canScheduleGeneratedVideo('workflow-user', 'generated-video-primary', []), false);
  assert.equal(canScheduleGeneratedVideo('workflow-user', 'another-video', ['instagram-1']), false);
  assert.equal(canScheduleGeneratedVideo('workflow-user', 'generated-video-primary', ['instagram-1']), true);

  beginVideoGeneration('workflow-user');
  assert.equal(getGeneratedVideo('workflow-user'), null);
});

test('review cannot be recorded before the matching video is ready', () => {
  clearGeneratedVideoState('invalid-workflow-user');
  assert.throws(() => markGeneratedVideoReviewed('invalid-workflow-user', 'missing-video'));
});
