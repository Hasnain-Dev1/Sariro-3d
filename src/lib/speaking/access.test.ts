import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { practiceAccess, canPractise, SPEAKING_TRACK } from './access';

/**
 * SARIRO — who gets the practice room
 * ============================================================================
 * Getting this wrong in one direction shows a coding student a speaking tool
 * they did not pay for. Getting it wrong in the other locks a paying Public
 * Speaking student out of the homework their course is built around, which is
 * the more expensive mistake and the one these tests are weighted towards.
 */

const en = (track: string, status: string) => ({ track, status });

describe('practiceAccess', () => {
  test('an active Public Speaking student is let in', () => {
    assert.equal(canPractise([en(SPEAKING_TRACK, 'active')]), true);
  });

  test('somebody who finished the course keeps it', () => {
    // They paid for it and finished it. Taking the tool away on the last day
    // of the course is a strange thank-you.
    assert.equal(canPractise([en(SPEAKING_TRACK, 'completed')]), true);
  });

  test('a coding student is not', () => {
    const a = practiceAccess([en('web-dev', 'active'), en('agent', 'active')]);
    assert.equal(a.allowed, false);
    assert.equal(a.lapsed, false);
    assert.match(a.reason, /Public Speaking/);
  });

  test('no enrolments at all is a locked room, not a crash', () => {
    assert.equal(canPractise([]), false);
    assert.equal(canPractise(null), false);
    assert.equal(canPractise(undefined), false);
  });

  test('a dropped Public Speaking student is locked out, but told a different thing', () => {
    const a = practiceAccess([en(SPEAKING_TRACK, 'dropped')]);
    assert.equal(a.allowed, false);
    assert.equal(a.lapsed, true);
    assert.match(a.reason, /still here/);
  });

  test('one active enrolment beats a dropped one on the same track', () => {
    // Re-enrolling leaves the old dropped row in place. Reading the first row
    // rather than any row would lock out somebody who is paying today.
    assert.equal(canPractise([en(SPEAKING_TRACK, 'dropped'), en(SPEAKING_TRACK, 'active')]), true);
  });

  test('case and stray whitespace do not decide who gets in', () => {
    assert.equal(canPractise([en('  Public-Speaking ', 'ACTIVE')]), true);
  });

  test('the room belongs to one band course, and says which', () => {
    const a = practiceAccess([{ track: SPEAKING_TRACK, status: 'active', level: 'band-primary', created_at: '2026-06-01T00:00:00Z' }]);
    assert.equal(a.band, 'primary');
    assert.equal(a.courseName, 'Public Speaking · Grades 4–6');
  });

  test('enrolling in the next band replaces the room with that band — the older one is not offered', () => {
    const a = practiceAccess([
      { track: SPEAKING_TRACK, status: 'active', level: 'band-foundation', created_at: '2026-01-10T00:00:00Z' },
      { track: SPEAKING_TRACK, status: 'active', level: 'band-primary', created_at: '2026-09-16T00:00:00Z' },
    ]);
    assert.equal(a.band, 'primary');
  });

  test('a dropped newer band does not replace an active one', () => {
    const a = practiceAccess([
      { track: SPEAKING_TRACK, status: 'active', level: 'band-middle', created_at: '2026-01-10T00:00:00Z' },
      { track: SPEAKING_TRACK, status: 'dropped', level: 'band-senior', created_at: '2026-09-16T00:00:00Z' },
    ]);
    assert.equal(a.band, 'middle');
  });

  test('an enrolment from before the bands follows the grade, as it always did', () => {
    assert.equal(practiceAccess([{ track: SPEAKING_TRACK, status: 'active', level: 'focus' }], 11).band, 'senior');
  });

  test('a track that merely contains the words does not count', () => {
    // Guards against a substring match creeping in later.
    assert.equal(canPractise([en('public-speaking-for-teachers', 'active')]), false);
  });
});
