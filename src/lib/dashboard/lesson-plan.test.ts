import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { lessonsOf, lessonForIndex, remainingFrom } from './lesson-plan';

/**
 * SARIRO — "let the scheduler choose which lesson to start from"
 * ============================================================================
 * The lesson used to be derived from a count: the Nth booking is the Nth
 * lesson. Right for a batch starting at the beginning; wrong for a batch
 * resuming after a break, a group that covered the first lessons elsewhere, or
 * a re-run for children who joined late.
 *
 * And the batch scheduler wrote no lesson at all, which is why every
 * batch-generated booking in production has module_num and lesson_name NULL.
 */

/* A real course, so the tests break if the syllabus shape changes rather than
   passing against a fixture that no longer resembles it.

   Deliberately a coding track: getCourseSyllabus only knows those. Public
   Speaking's lessons live in lib/speaking/, which is why a scheduler picking
   a start lesson for it gets an empty list and the picker hides itself — see
   lessonsOf(). Worth knowing before somebody debugs that as a bug. */
const TRACK = 'agent';
const LEVEL = 'intermediate';

describe('lessonsOf', () => {
  const all = lessonsOf(TRACK, LEVEL);

  test('a real course produces a flat, numbered list', () => {
    assert.ok(all.length > 0, 'agent/intermediate should have lessons');
    assert.equal(all[0].number, 1);
    assert.equal(all[all.length - 1].number, all.length);
  });

  test('numbering is continuous across module boundaries', () => {
    // Modules are a teaching structure, not a schedule. Nobody counting
    // "lesson 9" wants to work out it is module 3 lesson 1.
    all.forEach((l, i) => assert.equal(l.number, i + 1));
  });

  test('every lesson carries a module and a name', () => {
    for (const l of all) {
      assert.ok(l.moduleNum, `lesson ${l.number} has no module`);
      assert.ok(l.name && l.name.length > 0, `lesson ${l.number} has no name`);
    }
  });

  test('an unknown course is an empty list, not a crash', () => {
    assert.deepEqual(lessonsOf('not-a-track', 'not-a-level'), []);
  });
});

describe('lessonForIndex', () => {
  const all = lessonsOf(TRACK, LEVEL);

  test('the first class of a normal run teaches lesson 1', () => {
    assert.equal(lessonForIndex(TRACK, LEVEL, 0)?.number, 1);
  });

  test('the run advances one lesson per class', () => {
    assert.equal(lessonForIndex(TRACK, LEVEL, 3)?.number, 4);
  });

  test('starting at lesson 9 means the first class IS lesson 9', () => {
    // The founder's ask, in one assertion.
    assert.equal(lessonForIndex(TRACK, LEVEL, 0, 9)?.number, 9);
    assert.equal(lessonForIndex(TRACK, LEVEL, 1, 9)?.number, 10);
  });

  test('past the end of the course it says nothing rather than wrapping', () => {
    // A batch with more sessions than lessons is having revision classes.
    // Labelling those "Lesson 1" again is worse than labelling them nothing.
    assert.equal(lessonForIndex(TRACK, LEVEL, all.length + 5), null);
  });

  test('a start beyond the course is pulled back to the last lesson', () => {
    assert.equal(lessonForIndex(TRACK, LEVEL, 0, 9999)?.number, all.length);
  });

  test('a start of zero or negative behaves as lesson 1', () => {
    assert.equal(lessonForIndex(TRACK, LEVEL, 0, 0)?.number, 1);
    assert.equal(lessonForIndex(TRACK, LEVEL, 0, -4)?.number, 1);
  });

  test('an unknown course returns null instead of throwing mid-schedule', () => {
    // This runs inside a loop generating a term of bookings. A throw here
    // would abandon the whole schedule.
    assert.equal(lessonForIndex('not-a-track', 'nope', 0), null);
  });
});

describe('remainingFrom', () => {
  const total = lessonsOf(TRACK, LEVEL).length;

  test('starting at 1 covers the whole course', () => {
    assert.equal(remainingFrom(TRACK, LEVEL, 1), total);
  });

  test('starting at the last lesson covers exactly one', () => {
    assert.equal(remainingFrom(TRACK, LEVEL, total), 1);
  });

  test('it is the count a scheduler needs to see before committing', () => {
    // "Start at lesson 9" is a decision about how much of the course a batch
    // gets, not a numbering preference.
    assert.equal(remainingFrom(TRACK, LEVEL, 9), total - 8);
  });

  test('an unknown course is zero, not NaN', () => {
    assert.equal(remainingFrom('not-a-track', 'nope', 1), 0);
  });
});
