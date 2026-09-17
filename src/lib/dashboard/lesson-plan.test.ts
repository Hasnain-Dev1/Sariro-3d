import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { findLesson, lessonsOf, lessonForIndex, planCourseFill, remainingFrom } from './lesson-plan';

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

   A coding track here; school subjects and Public Speaking are checked below —
   they had no lessons at all until 17 Sep 2026, so every one of their classes
   was scheduled unlabelled. */
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

describe('every kind of course has its lessons', () => {
  test('Public Speaking Grades 1–3: all 48 classes, showcases included, each findable again', () => {
    const ps = lessonsOf('public-speaking', 'band-foundation');
    assert.equal(ps.length, 48);
    assert.equal(ps[0].name, 'Hello! This is me');
    assert.equal(ps[0].courseId, 'public-speaking-foundation');
    assert.equal(ps[23].name.includes('assessment'), true, 'slot 24 is a class too');
    const found = findLesson(ps, ps[11].moduleNum, ps[11].name);
    assert.equal(found?.number, 12);
    assert.deepEqual([found?.module, found?.lessonIndex], [2, 5]);
  });

  test('a school subject has its 48 classes', () => {
    assert.equal(lessonsOf('mathematics', 'grade-7').length, 48);
  });
});

describe('planCourseFill', () => {
  type C = { id: string; n: number | null };
  const known = (c: C) => c.n;

  test('an unlabelled batch of eight is numbered 1–8, and forty more are needed', () => {
    const eight: C[] = Array.from({ length: 8 }, (_, i) => ({ id: String(i), n: null }));
    const plan = planCourseFill(eight, 48, known);
    assert.deepEqual(plan.stamps.map((s) => s.number), [1, 2, 3, 4, 5, 6, 7, 8]);
    assert.equal(plan.toAdd, 40);
  });

  test('a batch that started at lesson 9 keeps its numbering', () => {
    const plan = planCourseFill([{ id: 'a', n: 9 }, { id: 'b', n: null }], 48, known);
    assert.deepEqual(plan.stamps.map((s) => s.number), [10]);
    assert.equal(plan.lastNumber, 10);
    assert.equal(plan.toAdd, 38);
  });

  test('a finished course needs nothing, and extra classes are left unlabelled', () => {
    const many: C[] = Array.from({ length: 50 }, (_, i) => ({ id: String(i), n: null }));
    const plan = planCourseFill(many, 48, known);
    assert.equal(plan.toAdd, 0);
    assert.equal(plan.stamps.length, 48);
  });
});
