import assert from 'node:assert/strict';
import test from 'node:test';

import { formatVideoDuration, getLibraryCountLabel, getSelectionActionLabel } from './video-library.ts';

test('formats video durations without hardcoded labels', () => {
  assert.equal(formatVideoDuration(23), '0:23');
  assert.equal(formatVideoDuration(62), '1:02');
  assert.equal(formatVideoDuration(736), '12:16');
});

test('uses correct singular, plural, and empty library labels', () => {
  assert.equal(getLibraryCountLabel(0), 'No videos yet');
  assert.equal(getLibraryCountLabel(1), '1 video');
  assert.equal(getLibraryCountLabel(12), '12 videos');
});

test('describes the selection action', () => {
  assert.equal(getSelectionActionLabel(0), 'Select videos');
  assert.equal(getSelectionActionLabel(1), 'Continue with 1 video');
  assert.equal(getSelectionActionLabel(3), 'Continue with 3 videos');
});
