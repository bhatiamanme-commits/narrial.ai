import assert from 'node:assert/strict';
import test from 'node:test';

import { getReferenceLinkDetails, normalizeReferenceUrl } from './media-reference.ts';

test('accepts public HTTP and HTTPS video links', () => {
  assert.equal(normalizeReferenceUrl(' https://youtu.be/dQw4w9WgXcQ '), 'https://youtu.be/dQw4w9WgXcQ');
  assert.equal(normalizeReferenceUrl('http://cdn.example.com/video.mp4'), 'http://cdn.example.com/video.mp4');
});

test('rejects malformed and non-web links', () => {
  assert.equal(normalizeReferenceUrl('not a link'), null);
  assert.equal(normalizeReferenceUrl('file:///private/video.mp4'), null);
  assert.equal(normalizeReferenceUrl('javascript:alert(1)'), null);
});

test('creates useful labels and a YouTube thumbnail when possible', () => {
  assert.deepEqual(getReferenceLinkDetails('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), {
    name: 'YouTube video',
    thumbnailSource: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
  });
  assert.deepEqual(getReferenceLinkDetails('https://vimeo.com/123456'), {
    name: 'vimeo.com video',
  });
});
