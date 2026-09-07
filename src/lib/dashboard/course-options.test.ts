import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  optionsFor, gradesFor, familyOf, describeCourse, levelValue, ALL_GRADES,
  checkCourse, CODING_LEVELS,
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


/* ══════════════════════════════════════════════════════════════════════════
   A course that can be chosen has to be a course that can be saved
   ══════════════════════════════════════════════════════════════════════════
   The two halves disagreed and shipped that way. The eligibility picker
   offered the full catalogue while the route behind it validated against
   TRACKS — the coding list — so every school subject and focus course came
   back "invalid track". Then the picker was changed to send lowercase levels
   and the route's list was capitalised, so the coding courses that HAD worked
   started failing too.

   checkCourse() is the one validator both sides now use. These tests are the
   contract between them.
   ══════════════════════════════════════════════════════════════════════════ */

describe('the courses the company actually sells', () => {
  test('school subjects are valid', () => {
    assert.equal(checkCourse('mathematics', 'grade-7').ok, true);
    assert.equal(checkCourse('science', 'grade-5').ok, true);
    assert.equal(checkCourse('english', 'grade-10').ok, true);
  });

  test('focus courses are valid', () => {
    assert.equal(checkCourse('public-speaking', 'focus').ok, true);
  });

  test('coding tracks are valid, lowercase', () => {
    for (const level of CODING_LEVELS) {
      assert.equal(checkCourse('web', level).ok, true, `web/${level}`);
    }
  });

  /* Rows written before the levels were lowercased still say `Beginner`, the
     training gates match them with ilike, and refusing them here would break
     editing an assignment the product itself created. */
  test('the old capitalised levels still validate', () => {
    assert.equal(checkCourse('web', 'Beginner').ok, true);
    assert.equal(checkCourse('web', 'Advanced').ok, true);
    assert.equal(checkCourse('python', 'Elementary').ok, true);
  });

  test('every option the picker can offer is one the server accepts', () => {
    /* Each subject against ITS OWN grades, not a grade assumed to be common.
       Science runs 1-6 and then splits into Physics, Chemistry and Biology at
       7 — so there is no single grade every subject shares, and a test that
       picks one is testing its author's guess. */
    for (const o of optionsFor('school')) {
      const grades = gradesFor('school', o.value);
      assert.ok(grades.length > 0, `${o.value} is offered with no grades at all`);
      for (const g of grades) {
        const r = checkCourse(o.value, `grade-${g}`);
        assert.equal(r.ok, true, `${o.value}/grade-${g} was refused: ${r.message}`);
      }
    }
    for (const o of optionsFor('focus')) {
      assert.equal(checkCourse(o.value, 'focus').ok, true, `${o.value}/focus was refused`);
    }
    for (const o of optionsFor('coding')) {
      assert.equal(checkCourse(o.value, 'beginner').ok, true, `${o.value}/beginner was refused`);
    }
  });
});

describe('what is refused, and why', () => {
  test('a track we do not run', () => {
    const r = checkCourse('underwater-basket-weaving', 'beginner');
    assert.equal(r.ok, false);
    assert.equal(r.code, 'invalid_track');
    assert.match(r.message, /not a course we run/);
  });

  test('a coding level that is not one', () => {
    const r = checkCourse('web', 'grandmaster');
    assert.equal(r.ok, false);
    assert.equal(r.code, 'invalid_level');
  });

  test('a focus course with a level other than focus', () => {
    const r = checkCourse('public-speaking', 'grade-7');
    assert.equal(r.ok, false);
    assert.equal(r.code, 'invalid_level');
  });

  /* The matrix is deliberately not full: primary school teaches combined
     Science, so Chemistry does not exist before grade 7. Offering it tells a
     parent we do not understand schools. */
  test('a school subject at a grade it is not taught in', () => {
    // Science stops at 6 and Chemistry starts at 7 — that seam is the rule.
    assert.equal(checkCourse('science', 'grade-8').ok, false);
    const r = checkCourse('chemistry', 'grade-2');
    assert.equal(r.ok, false);
    assert.equal(r.code, 'invalid_level');
    assert.match(r.message, /do not teach/i);
  });

  test('empty input is refused rather than saved', () => {
    assert.equal(checkCourse('', 'beginner').ok, false);
    assert.equal(checkCourse('web', '').ok, false);
    assert.equal(checkCourse('  ', '  ').ok, false);
  });

  test('surrounding space does not break a valid course', () => {
    assert.equal(checkCourse('  web  ', '  beginner  ').ok, true);
  });
});
