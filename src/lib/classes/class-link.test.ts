import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classLink } from './class-link';

const ROOM = 'https://meet.google.com/abc-defg-hij';
const OLD = 'https://zoom.us/j/111';
const BATCH = 'https://meet.google.com/batch-room';

test('the teacher’s own room wins over anything stored on the class or batch', () => {
  assert.equal(classLink(ROOM, OLD, BATCH), ROOM);
});

test('a teacher who has not set a room still sends students to the class link', () => {
  assert.equal(classLink(null, OLD, BATCH), OLD);
});

test('then the batch link, then nothing', () => {
  assert.equal(classLink(null, null, BATCH), BATCH);
  assert.equal(classLink(undefined, undefined, undefined), null);
});

test('a blank room is no room', () => {
  assert.equal(classLink('   ', '', BATCH), BATCH);
});
