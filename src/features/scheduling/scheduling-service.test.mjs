import assert from 'node:assert/strict';
import test from 'node:test';

import { clearAllSchedulingDrafts, clearSchedulingDraft, getScheduledPosts, getSchedulingDraft, schedulePost, startSchedulingDraft } from './scheduling-service.ts';

test('schedule access exists only after the generated-video publishing flow starts', () => {
  clearAllSchedulingDrafts();
  assert.equal(getSchedulingDraft('user-1'), null);

  startSchedulingDraft('user-1', 'generated-video-primary');
  startSchedulingDraft('user-2', 'another-generated-video');
  assert.deepEqual(getSchedulingDraft('user-1'), { userId: 'user-1', postId: 'generated-video-primary', action: 'create' });
  assert.deepEqual(getSchedulingDraft('user-2'), { userId: 'user-2', postId: 'another-generated-video', action: 'create' });

  clearSchedulingDraft('user-1');
  assert.equal(getSchedulingDraft('user-1'), null);
  assert.deepEqual(getSchedulingDraft('user-2'), { userId: 'user-2', postId: 'another-generated-video', action: 'create' });
  clearAllSchedulingDrafts();
  assert.equal(getSchedulingDraft('user-2'), null);
});

test('scheduled operations retain the dashboard action and source post', async () => {
  startSchedulingDraft('user-1', 'discipline-scheduled', 'reschedule');
  assert.deepEqual(getSchedulingDraft('user-1'), {
    userId: 'user-1',
    postId: 'discipline-scheduled',
    action: 'reschedule',
  });

  await schedulePost({
    userId: 'user-1',
    accountIds: ['instagram-1'],
    postId: 'discipline-scheduled',
    scheduledAt: '2099-08-20T09:30:00.000Z',
    timezone: 'UTC',
    action: 'reschedule',
  });

  assert.deepEqual(getScheduledPosts('user-1').map(({ postId, action }) => ({ postId, action })), [
    { postId: 'discipline-scheduled', action: 'reschedule' },
  ]);
  assert.deepEqual(getScheduledPosts('user-2'), []);
});

test('schedule validation rejects invalid inputs before the transport wait or persistence', async () => {
  const validRequest = {
    userId: 'validation-user',
    accountIds: ['instagram-1'],
    postId: 'generated-video-primary',
    scheduledAt: '2099-08-20T09:30:00.000Z',
    timezone: 'UTC',
  };
  const invalidRequests = [
    { ...validRequest, postId: '  ' },
    { ...validRequest, scheduledAt: 'not-a-timestamp' },
    { ...validRequest, scheduledAt: '2000-01-01T00:00:00.000Z' },
    { ...validRequest, timezone: 'Not/A_Timezone' },
  ];

  const validation = Promise.all(invalidRequests.map((request) => assert.rejects(schedulePost(request))));
  await Promise.race([
    validation,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Validation ran after the transport wait.')), 100)),
  ]);
  assert.deepEqual(getScheduledPosts('validation-user'), []);
});

test('distinct scheduled operations receive unique IDs in the same millisecond', async () => {
  const originalNow = Date.now;
  Date.now = () => 123456789;
  const content = { title: 'Generated Video', duration: '0:30', platforms: ['instagram'], status: 'ready', thumbnail: 'runner' };
  try {
    const [first, second] = await Promise.all([
      schedulePost({ userId: 'id-user', accountIds: ['instagram-1'], postId: 'video-1', scheduledAt: '2099-09-01T10:00:00.000Z', timezone: 'UTC', content }),
      schedulePost({ userId: 'id-user', accountIds: ['instagram-1'], postId: 'video-2', scheduledAt: '2099-09-01T11:00:00.000Z', timezone: 'UTC', content }),
    ]);
    assert.notEqual(first.id, second.id);
  } finally {
    Date.now = originalNow;
  }
});
