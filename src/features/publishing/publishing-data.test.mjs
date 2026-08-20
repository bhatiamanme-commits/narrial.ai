import assert from 'node:assert/strict';
import test from 'node:test';

import { applyScheduledOperations, filterPublishedPosts, getContentPerformance, PUBLISHING_WEEK } from './publishing-data.ts';

test('reschedule moves a dashboard post and duplicate adds a persisted copy', () => {
  const operations = [
    { id: 'rescheduled-1', userId: 'user-1', accountIds: ['account-1'], postId: 'discipline-scheduled', scheduledAt: '2025-08-21T09:30:00.000Z', timezone: 'UTC', action: 'reschedule', status: 'scheduled' },
    { id: 'duplicate-1', userId: 'user-1', accountIds: ['account-1'], postId: 'five-second-scheduled', scheduledAt: '2025-08-22T10:00:00.000Z', timezone: 'UTC', action: 'duplicate', status: 'scheduled' },
  ];

  const week = applyScheduledOperations(PUBLISHING_WEEK, operations);
  assert.equal(week.find((day) => day.id === 'week-wednesday').posts.some((post) => post.id === 'discipline-scheduled'), false);
  assert.equal(week.find((day) => day.id === 'week-thursday').posts.some((post) => post.id === 'discipline-scheduled' && post.time === '9:30 AM'), true);
  assert.equal(week.find((day) => day.id === 'week-friday').posts.some((post) => post.id === 'duplicate-1' && post.time === '10:00 AM'), true);
});

test('content performance aggregates only the filtered posts', () => {
  const performance = getContentPerformance([
    { views: 100, engagements: 10 },
    { views: 300, engagements: 60 },
  ]);

  assert.deepEqual(performance, { views: 400, engagement: 17.5 });
  assert.deepEqual(getContentPerformance([]), { views: 0, engagement: 0 });
});

test('published post ranges use timestamps rather than array position and retain platform filtering', () => {
  const posts = [
    { id: 'outside', publishedAt: '2026-08-12T11:59:59.999Z', platforms: ['instagram'] },
    { id: 'other-platform', publishedAt: '2026-08-18T12:00:00.000Z', platforms: ['youtube'] },
    { id: 'boundary', publishedAt: '2026-08-12T12:00:00.000Z', platforms: ['instagram'] },
  ];

  const filtered = filterPublishedPosts(posts, '7-days', 'instagram', new Date('2026-08-19T12:00:00.000Z'));
  assert.deepEqual(filtered.map((post) => post.id), ['boundary']);
});
