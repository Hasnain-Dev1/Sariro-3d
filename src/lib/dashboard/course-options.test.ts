import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  optionsFor, gradesFor, familyOf, describeCourse, levelValue, ALL_GRADES,
} from './course-options';

/**
 * SARIRO — the catalogue two screens have to agree on
 * =========================================================
 * New Course and Manual Enrolment both read this. When they each had their own
 * hardcoded picker, widening one produced a course nobody could be enrolled
 * into — the failure was invisible until an admin tried the obvious next step.
 *
 * These tests pin the shape of a stored choice, because that is the contract
 * the cohorts table, purchase_intents and both screens all depend on. A change
 * that quietly renames "focus" or reformats "grade-7" breaks enrolment for a
 * product that is already sold.
 */

describe('every family offers something', () => {
  test('coding, school and focus all have options', () => {
    for (const f of ['coding', 'school', 'focus'] as const) {
      assert.ok(optionsFor(f).length > 0, `${f} must have options`);
    }
  });

  test('Public Speaking is sellable — it is a focus course', () => {
    // It was missing from the dashboard entirely for months while being on the
    // pricing page, so it gets its own test.
    assert.ok(optionsFor('focus').some((o) => o.value === 'public-speaking'));
  });

  test('no family at all yields nothing rather than throwing', () => {
    assert.deepEqual(optionsFor(null), []);
  });
});

describe('grades are filtered to what a subject is taught for', () => {
  test('Physics is not offered below grade 7', () => {
    // Primary school teaches combined Science. "Chemistry for Grade 2" tells a
    // parent we do not understand schools.
    const grades = gradesFor('school', 'physics');
    assert.ok(!grades.includes(2), 'grade 2 physics must not be offered');
    assert.ok(grades.includes(9), 'grade 9 physics must be');
  });

  test('Mathematics runs the whole way', () => {
    assert.deepEqual(gradesFor('school', 'mathematics'), ALL_GRADES);
  });

  test('an unknown subject falls back to all grades rather than none', () => {
    // An empty grade list would render a step with nothing to click and no
    // explanation — worse than offering too much.
    assert.deepEqual(gradesFor('school', 'not-a-subject'), ALL_GRADES);
  });
});

describe('what gets stored', () => {
  test('a focus course stores focus, whatever was picked', () => {
    assert.equal(levelValue('focus', 'mechanics'), 'focus');
  });

  test('coding and school store the level as picked', () => {
    assert.equal(levelValue('coding', 'beginner'), 'beginner');
    assert.equal(levelValue('school', 'grade-7'), 'grade-7');
  });
});

describe('reading a stored pair back', () => {
  test('the family is recovered from the level', () => {
    assert.equal(familyOf('web', 'beginner'), 'coding');
    assert.equal(familyOf('mathematics', 'grade-7'), 'school');
    assert.equal(familyOf('mechanics', 'focus'), 'focus');
  });

  test('a specialisation is recognised even if the level was lost', () => {
    assert.equal(familyOf('public-speaking', ''), 'focus');
  });

  test('courses are named the same way everywhere', () => {
    assert.equal(describeCourse('mathematics', 'grade-7'), 'Mathematics · Grade 7');
    assert.equal(describeCourse('public-speaking', 'focus'), 'Public Speaking · focus course');
    assert.match(describeCourse('web', 'beginner'), /Beginner$/);
  });

  test('an unknown track still produces a readable name', () => {
    // Never render a blank where a course name belongs.
    assert.ok(describeCourse('some-old-track', 'beginner').includes('some-old-track'));
  });
});
