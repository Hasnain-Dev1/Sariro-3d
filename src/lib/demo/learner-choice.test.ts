import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  subjectGroups,
  focusGroupsFor,
  stageGroups,
  parseStage,
  describeChoice,
  gradeFromFocus,
  gradeValue,
} from './learner-choice';
import { SCHOOL_SUBJECTS, GRADE_GROUPS, SPECIALISATIONS } from '@/lib/school/curriculum';
import { TRACKS } from '@/lib/sariro-data';

/**
 * SARIRO — the demo form's cascade
 * =========================================================
 * The booking form is the top of the funnel, and it is the one place where a
 * wrong option list costs a real enquiry: a parent who cannot find "Class 8
 * Maths" does not file a bug, they close the tab.
 *
 * The failure these guard against is drift. Every list here is derived from the
 * curriculum and the catalogue, so the danger is not a typo but a silent
 * disconnect — a subject gaining a grade, a focus course being added, a track
 * renamed — leaving the form offering something we do not teach, or hiding
 * something we do.
 */

describe('subject step', () => {
  test('offers every school subject, plus the two beyond-school ones', () => {
    const values = subjectGroups().flatMap((g) => g.options.map((o) => o.value));
    for (const s of SCHOOL_SUBJECTS) {
      assert.ok(values.includes(s.slug), `${s.name} is taught but not offered`);
    }
    assert.ok(values.includes('coding'));
    assert.ok(values.includes('public-speaking'));
  });

  test('every option carries a human label, never a bare slug', () => {
    for (const g of subjectGroups()) {
      for (const o of g.options) {
        assert.ok(o.label.length > 0);
        assert.notEqual(o.label, o.value, `${o.value} is showing its slug`);
      }
    }
  });
});

describe('focus step', () => {
  test('offers only the grades a subject is actually taught at', () => {
    // Science stops at 6 and the three sciences start at 7. Offering a parent
    // "Science, Grade 9" would promise a year that does not exist.
    const science = focusGroupsFor('science');
    const scienceGrades = science!.groups[0].options.map((o) => gradeFromFocus(o.value));
    assert.deepEqual(scienceGrades, [1, 2, 3, 4, 5, 6]);

    const physics = focusGroupsFor('physics');
    const physicsGrades = physics!.groups[0].options.map((o) => gradeFromFocus(o.value));
    assert.deepEqual(physicsGrades, [7, 8, 9, 10, 11, 12]);
  });

  test("a subject's grade list matches the curriculum, for every subject", () => {
    for (const s of SCHOOL_SUBJECTS) {
      const expected = GRADE_GROUPS.filter((g) => s.groups.includes(g.slug)).flatMap(
        (g) => g.grades
      );
      const offered = focusGroupsFor(s.slug)!
        .groups[0].options.map((o) => gradeFromFocus(o.value))
        .filter((n): n is number => n !== null);
      assert.deepEqual(offered, expected, `${s.name} offers the wrong grades`);
    }
  });

  test('attaches focus courses to the subject a learner would look under', () => {
    const chem = focusGroupsFor('chemistry')!;
    const chemFocus = chem.groups.find((g) => g.label === 'Focus courses');
    assert.deepEqual(
      chemFocus?.options.map((o) => o.value),
      ['organic-chemistry']
    );

    const maths = focusGroupsFor('mathematics')!;
    const mathsFocus = maths.groups.find((g) => g.label === 'Focus courses');
    assert.deepEqual(
      mathsFocus?.options.map((o) => o.value).sort(),
      ['algebra-1', 'algebra-2', 'calculus', 'trigonometry']
    );

    // Biology has none authored, so it must not show an empty group.
    const bio = focusGroupsFor('biology')!;
    assert.equal(bio.groups.find((g) => g.label === 'Focus courses'), undefined);
  });

  test('every focus course is reachable from some subject, or is a subject itself', () => {
    // A focus course nobody can navigate to is content we paid to author and
    // then hid. Public Speaking is its own subject; the rest must appear under
    // one of the school subjects.
    const reachable = new Set(
      SCHOOL_SUBJECTS.flatMap(
        (s) =>
          focusGroupsFor(s.slug)
            ?.groups.find((g) => g.label === 'Focus courses')
            ?.options.map((o) => o.value) ?? []
      )
    );
    for (const sp of SPECIALISATIONS) {
      if (sp.slug === 'public-speaking') continue;
      assert.ok(reachable.has(sp.slug), `${sp.name} cannot be reached from any subject`);
    }
  });

  test('coding offers the catalogue, and nothing else does', () => {
    const coding = focusGroupsFor('coding')!;
    assert.equal(coding.groups[0].options.length, TRACKS.length);
    assert.deepEqual(
      coding.groups[0].options.map((o) => o.value),
      TRACKS.map((t) => t.id)
    );
  });

  test('hides the second step where there is nothing to choose', () => {
    // One course, so a select with a single option is friction, not a choice.
    assert.equal(focusGroupsFor('public-speaking'), null);
    // "Not sure yet" must not strand the visitor on an empty select.
    assert.equal(focusGroupsFor(''), null);
  });
});

describe('stage step', () => {
  test('covers school, college and work', () => {
    const values = stageGroups().flatMap((g) => g.options.map((o) => o.value));
    for (const g of GRADE_GROUPS.flatMap((x) => x.grades)) {
      assert.ok(values.includes(gradeValue(g)), `Grade ${g} missing`);
    }
    assert.ok(values.includes('undergraduate'));
    assert.ok(values.includes('postgraduate'));
    assert.ok(values.includes('professional'));
  });

  test('splits into the two columns the database stores', () => {
    assert.deepEqual(parseStage('grade-11'), { stage: 'school', grade: 11 });
    assert.deepEqual(parseStage('professional'), { stage: 'professional', grade: null });
    assert.deepEqual(parseStage(''), { stage: null, grade: null });
    // Anything unrecognised must be discarded rather than stored as a stage.
    assert.deepEqual(parseStage('grade-99'), { stage: null, grade: null });
    assert.deepEqual(parseStage('vice-chancellor'), { stage: null, grade: null });
  });
});

describe('describeChoice', () => {
  test('reads as a sentence an admin can act on', () => {
    assert.equal(
      describeChoice('chemistry', 'organic-chemistry', 'professional', null),
      'Chemistry · Organic Chemistry — Working professional'
    );
    assert.equal(
      describeChoice('coding', 'web', 'undergraduate', null),
      'Coding & AI · Web Builder Pro — Undergraduate'
    );
  });

  test('says the grade once when the learner is studying their own year', () => {
    // The common case. "Mathematics · Grade 8 — Grade 8" is noise.
    assert.equal(describeChoice('mathematics', 'grade-8', 'school', 8), 'Mathematics · Grade 8');
    // But an adult on Grade 8 material is exactly the distinction worth keeping.
    assert.equal(
      describeChoice('mathematics', 'grade-8', 'professional', null),
      'Mathematics · Grade 8 — Working professional'
    );
  });

  test('never leaks a raw slug, and never renders empty', () => {
    assert.equal(describeChoice(null, null, null, null), 'No preference');
    const out = describeChoice('physics', 'mechanics', 'school', 11);
    assert.ok(!out.includes('-'), `slug leaked: ${out}`);
  });
});
