import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { buildParentReport, reportAsText, type ClassRecord } from './parent-report';
import type { PracticeAttempt } from '@/lib/speaking/progress';

/**
 * SARIRO — the report a family decides on
 * ============================================================================
 * "Attended 8 of 8 classes" is the absence of absence, and every competitor
 * can print it. "Filler words: 12 a minute down to 3" is a fact with a date on
 * it that nobody can produce without having built the measuring underneath.
 *
 * A report that overclaims once is never believed again, and a parent who
 * stops believing the report stops believing the teacher. Most of these tests
 * are about the moments it must NOT claim something.
 */

const NOW = Date.parse('2026-10-01T12:00:00.000Z');
const DAY = 86_400_000;

const attempt = (daysAgo: number, metrics: Record<string, number>): PracticeAttempt => ({
  kind: 'speaking',
  score: 60,
  metrics,
  createdAt: new Date(NOW - daysAgo * DAY).toISOString(),
});

/** Six attempts, fillers falling from ~12 a minute to ~3. */
const improving = (): PracticeAttempt[] =>
  [12, 11, 12, 4, 3, 3].map((f, i) => attempt(20 - i * 3, { fillersPerMin: f }));

const klass = (daysAgo: number, attended: boolean, remark?: string): ClassRecord => ({
  at: new Date(NOW - daysAgo * DAY).toISOString(),
  attended,
  remark,
  teacherName: 'Mimo Patra',
});

describe('the headline', () => {
  test('is the real improvement, in the words a parent forwards', () => {
    const r = buildParentReport({ childName: 'Aarav', attempts: improving(), classes: [], now: NOW });
    assert.ok(r.headline);
    assert.match(r.headline, /Filler words/);
    assert.match(r.headline, /down to 3/);
  });

  test('the endpoints are averaged, so one bad take cannot set the headline', () => {
    // Reads "11.5 down to 3", not "12 down to 3", because the first and last
    // thirds are averaged rather than taken as single readings. A child whose
    // very first attempt was a disaster would otherwise get a flattering
    // number, and one bad last take would erase a real month of work.
    const r = buildParentReport({ childName: 'Aarav', attempts: improving(), classes: [], now: NOW });
    assert.match(r.headline!, /11\.5/);
  });

  test('is NULL rather than falling back to attendance', () => {
    // The sentence this report exists to be better than. Reaching for it the
    // moment the real one is unavailable teaches a parent it was always the
    // real one.
    const r = buildParentReport({
      childName: 'Aarav',
      attempts: [],
      classes: [klass(1, true), klass(8, true), klass(15, true)],
      now: NOW,
    });
    assert.equal(r.headline, null);
    assert.equal(r.effort.classesAttended, 3, 'attendance is still reported, just not as the headline');
  });

  test('an up-metric reads as up, not as down', () => {
    const rising = [40, 45, 44, 70, 78, 80].map((v, i) => attempt(20 - i * 3, { pronunciation: v }));
    const r = buildParentReport({ childName: 'Aarav', attempts: rising, classes: [], now: NOW });
    assert.ok(r.headline);
    assert.match(r.headline, /up to/);
  });
});

describe('what it refuses to claim', () => {
  test('two attempts is too early, and it says so', () => {
    const r = buildParentReport({
      childName: 'Aarav',
      attempts: [attempt(3, { fillersPerMin: 9 }), attempt(1, { fillersPerMin: 2 })],
      classes: [],
      now: NOW,
    });
    assert.equal(r.tooEarly, true);
    assert.equal(r.headline, null, 'a two-point line is not a trend');
    assert.equal(r.focus, null);
  });

  test('at most ONE thing going the wrong way', () => {
    // Everything got worse at once. A list of six failings is a list read once.
    const worse = [
      { fillersPerMin: 2, wpm: 140, deliveryVariation: 8, pitchRange: 9 },
      { fillersPerMin: 2, wpm: 142, deliveryVariation: 8, pitchRange: 9 },
      { fillersPerMin: 3, wpm: 145, deliveryVariation: 7, pitchRange: 8 },
      { fillersPerMin: 9, wpm: 220, deliveryVariation: 2, pitchRange: 2 },
      { fillersPerMin: 10, wpm: 225, deliveryVariation: 2, pitchRange: 2 },
      { fillersPerMin: 11, wpm: 230, deliveryVariation: 1, pitchRange: 1 },
    ].map((m, i) => attempt(20 - i * 3, m));

    const r = buildParentReport({ childName: 'Aarav', attempts: worse, classes: [], now: NOW });
    assert.equal(r.movements.filter((m) => m.direction === 'worse').length, 1);
  });

  test('a month with no improvement reports effort instead of inventing progress', () => {
    // Some months a child does not improve. A report that always finds
    // something to celebrate means nothing when it celebrates.
    const flat = new Array(6).fill(0).map((_, i) => attempt(20 - i * 3, { fillersPerMin: 5 }));
    const r = buildParentReport({
      childName: 'Aarav', attempts: flat,
      classes: [klass(2, true), klass(9, true)], now: NOW,
    });
    assert.equal(r.headline, null);
    assert.equal(r.movements.filter((m) => m.direction === 'better').length, 0);
    assert.equal(r.effort.practiceAttempts, 6, 'what they DID is still on the page');
    assert.ok(r.effort.practiceDays > 0);
  });

  test('improvements come before the decline, never after', () => {
    const mixed = [
      { fillersPerMin: 12, deliveryVariation: 9 },
      { fillersPerMin: 11, deliveryVariation: 9 },
      { fillersPerMin: 12, deliveryVariation: 8 },
      { fillersPerMin: 3, deliveryVariation: 2 },
      { fillersPerMin: 3, deliveryVariation: 2 },
      { fillersPerMin: 2, deliveryVariation: 1 },
    ].map((m, i) => attempt(20 - i * 3, m));
    const r = buildParentReport({ childName: 'Aarav', attempts: mixed, classes: [], now: NOW });
    assert.equal(r.movements[0].direction, 'better');
    assert.equal(r.movements[r.movements.length - 1].direction, 'worse');
  });
});

describe('the window', () => {
  test('nothing older than the period leaks in', () => {
    // A headline computed from a different span than the numbers below it is
    // how these reports usually lose a family's trust.
    const old = [12, 11, 12].map((f, i) => attempt(200 - i, { fillersPerMin: f }));
    const recent = [3, 3, 2].map((f, i) => attempt(5 - i, { fillersPerMin: f }));
    const r = buildParentReport({
      childName: 'Aarav', attempts: [...old, ...recent],
      classes: [klass(90, true), klass(2, true)], now: NOW, days: 30,
    });
    assert.equal(r.effort.practiceAttempts, 3, 'only the recent attempts count');
    assert.equal(r.effort.classesHeld, 1, 'only the recent class counts');
  });

  test('a future-dated row does not count', () => {
    const r = buildParentReport({
      childName: 'Aarav',
      attempts: [attempt(-5, { fillersPerMin: 1 })],
      classes: [], now: NOW,
    });
    assert.equal(r.effort.practiceAttempts, 0);
  });
});

describe('effort, which is true even in a bad month', () => {
  test('counts attendance out of classes held, not out of nothing', () => {
    const r = buildParentReport({
      childName: 'Aarav', attempts: [],
      classes: [klass(2, true), klass(9, false), klass(16, true)], now: NOW,
    });
    assert.equal(r.effort.classesAttended, 2);
    assert.equal(r.effort.classesHeld, 3);
  });
});

describe("the teacher's own words", () => {
  test('the most recent remark is used', () => {
    const r = buildParentReport({
      childName: 'Aarav', attempts: [],
      classes: [klass(20, true, 'Quiet at first.'), klass(2, true, 'Spoke up twice today.')],
      now: NOW,
    });
    assert.equal(r.teacherNote?.text, 'Spoke up twice today.');
    assert.equal(r.teacherNote?.from, 'Mimo Patra');
  });

  test('an empty remark is not a remark', () => {
    const r = buildParentReport({
      childName: 'Aarav', attempts: [],
      classes: [klass(2, true, '   '), klass(9, true, 'Good focus.')],
      now: NOW,
    });
    assert.equal(r.teacherNote?.text, 'Good focus.');
  });

  test('no remarks at all is null, not an empty quote', () => {
    const r = buildParentReport({
      childName: 'Aarav', attempts: [], classes: [klass(2, true)], now: NOW,
    });
    assert.equal(r.teacherNote, null);
  });
});

describe('reportAsText — how it will actually travel', () => {
  test('survives being pasted with no styling', () => {
    // A parent does not forward a link behind a login. They forward what is on
    // their screen, to a grandparent or another parent at the school gate.
    const r = buildParentReport({
      childName: 'Aarav', attempts: improving(),
      classes: [klass(2, true, 'Spoke up twice today.')], now: NOW,
    });
    const text = reportAsText(r);
    assert.match(text, /^Aarav — last 30 days/);
    assert.match(text, /Filler words/);
    assert.match(text, /1 of 1 classes/);
    assert.match(text, /Spoke up twice today/);
    assert.match(text, /Mimo Patra/);
  });

  test('says "still early" rather than showing an empty report', () => {
    const r = buildParentReport({
      childName: 'Aarav', attempts: [attempt(1, { fillersPerMin: 4 })], classes: [], now: NOW,
    });
    assert.match(reportAsText(r), /Still early/);
  });

  test('never contains a stray arrow with nothing after it', () => {
    const r = buildParentReport({ childName: 'Aarav', attempts: [], classes: [], now: NOW });
    const text = reportAsText(r);
    assert.doesNotMatch(text, /[↑↓]\s*$/m);
  });
});
