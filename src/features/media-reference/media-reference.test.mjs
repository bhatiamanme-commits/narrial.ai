import assert from 'node:assert/strict';
import test from 'node:test';

import { getReferenceLinkDetails, normalizeReferenceUrl } from './media-reference.ts';

test('accepts supported public HTTPS YouTube links', () => {
  assert.equal(normalizeReferenceUrl(' https://youtu.be/dQw4w9WgXcQ '), 'https://youtu.be/dQw4w9WgXcQ');
});

test('rejects malformed and non-web links', () => {
  assert.equal(normalizeReferenceUrl('not a link'), null);
  assert.equal(normalizeReferenceUrl('file:///private/video.mp4'), null);
  assert.equal(normalizeReferenceUrl('javascript:alert(1)'), null);
  assert.equal(normalizeReferenceUrl('http://youtu.be/dQw4w9WgXcQ'), null);
  assert.equal(normalizeReferenceUrl('https://vimeo.com/123456'), null);
  assert.equal(normalizeReferenceUrl('https://youtube.com.evil.test/watch?v=dQw4w9WgXcQ'), null);
  assert.equal(normalizeReferenceUrl('https://youtube.com/watch?v=bad'), null);
});

test('creates useful labels and a YouTube thumbnail when possible', () => {
  assert.deepEqual(getReferenceLinkDetails('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), {
    name: 'YouTube video',
    thumbnailSource: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
  });
});
