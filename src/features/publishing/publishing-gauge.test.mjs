import assert from 'node:assert/strict';
import test from 'node:test';

import { getContentScoreGauge } from './publishing-gauge.ts';

test('content score gauge clamps scores and positions the marker on the arc', () => {
  assert.deepEqual(getContentScoreGauge(-10), {
    score: 0,
    dashLength: 0,
    cx: 20,
    cy: 116,
  });

  const midpoint = getContentScoreGauge(50);
  assert.equal(midpoint.score, 50);
  assert.equal(midpoint.dashLength, 157);
  assert.ok(Math.abs(midpoint.cx - 120) < Number.EPSILON * 100);
  assert.equal(midpoint.cy, 16);

  assert.deepEqual(getContentScoreGauge(110), {
    score: 100,
    dashLength: 314,
    cx: 220,
    cy: 116,
  });
});
