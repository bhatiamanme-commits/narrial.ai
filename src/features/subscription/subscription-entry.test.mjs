import assert from 'node:assert/strict';
import test from 'node:test';

import {
  dismissSubscriptionForSession,
  resetSubscriptionSession,
  shouldShowSubscriptionForSession,
} from './subscription-entry.ts';

test('each fresh login session opens the subscription screen', () => {
  resetSubscriptionSession('user-one');
  assert.equal(shouldShowSubscriptionForSession('user-one'), true);
});

test('closing the subscription screen keeps it closed during that login session', () => {
  resetSubscriptionSession('user-one');
  dismissSubscriptionForSession('user-one');
  assert.equal(shouldShowSubscriptionForSession('user-one'), false);
});

test('signing out resets dismissal so the next login opens the screen again', () => {
  dismissSubscriptionForSession('user-one');
  resetSubscriptionSession('user-one');
  assert.equal(shouldShowSubscriptionForSession('user-one'), true);
});
