import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  AUTHORED_TITLES,
  GRADE_GROUPS,
  LESSONS_PER_GRADE,
  LESSONS_PER_MODULE,
  MODULES_PER_GRADE,
  SCHOOL_SUBJECTS,
  SPECIALISATIONS,
  buildGradeSyllabus,
  enrolmentOptions,
  gradeGroupFor,
  testPositions,
} from './curriculum';

/**
 * SARIRO — curriculum shape tests
 * =========================================================
 * `scripts/audit-school-curriculum.ts` already guards the authored CONTENT.
 * These guard the SHAPE — the invariants the scheduler, credits and attendance
 * all quietly assume, and which no audit run would catch if the builder itself
 * regressed.
 *
 * The one that matters most: a parent buys 48 classes and must receive exactly
 * 48 slots. If `buildGradeSyllabus` ever returns 47 or 49, every downstream
 * count — credits granted, classes scheduled, money owed — is wrong, and the
 * error surfaces months later as a billing dispute.
 */

const ALL_GRADES = GRADE_GROUPS.flatMap((g) => g.grades);

describe('grade groups', () => {
  test('cover grades 1 to 12 exactly once each', () => {
    // Overlapping groups would make "which cohort does grade 6 belong to?"
    // ambiguous, and the scheduler has to answer it deterministically.
    assert.deepEqual([...ALL_GRADES].sort((a, b) => a - b), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    assert.equal(new Set(ALL_GRADES).size, ALL_GRADES.length, 'a grade appears in two groups');
  });

  test('every group holds exactly three grades', () => {
    for (const g of GRADE_GROUPS) {
      assert.equal(g.grades.length, 3, `${g.slug} has ${g.grades.length} grades`);
    }
  });

  test('every grade resolves to exactly one group', () => {
    for (const grade of ALL_GRADES) {
      const group = gradeGroupFor(grade);
      assert.ok(group, `grade ${grade} belongs to no group`);
      assert.ok(group!.grades.includes(grade));
    }
  });

  test('grades outside 1–12 resolve to nothing rather than guessing', () => {
    assert.equal(gradeGroupFor(0), null);
    assert.equal(gradeGroupFor(13), null);
  });
});

describe('testPositions', () => {
  test('a school year is assessed at the midpoint and the end', () => {
    assert.deepEqual(testPositions(48), [24, 48]);
  });

  test('the final assessment always lands on the last slot', () => {
    // If it landed anywhere else, a course would end on a lesson and the final
    // test would sit in the middle of nothing.
    for (const total of [30, 42, 48, 96, 144]) {
      const positions = testPositions(total);
      assert.equal(positions[positions.length - 1], total, `${total} slots: final test is not last`);
    }
  });

  test('longer courses get proportionally more, never fewer than two', () => {
    assert.ok(testPositions(96).length >= testPositions(48).length);
    for (const total of [12, 24, 30, 48, 96, 144]) {
      assert.ok(testPositions(total).length >= 2, `${total} slots: fewer than two assessments`);
    }
  });

  test('positions are strictly increasing and inside the course', () => {
    for (const total of [30, 42, 48, 96, 144]) {
      const positions = testPositions(total);
      for (let i = 0; i < positions.length; i++) {
        assert.ok(positions[i] >= 1 && positions[i] <= total, `${total}: position out of range`);
        if (i > 0) assert.ok(positions[i] > positions[i - 1], `${total}: positions not increasing`);
      }
    }
  });
});

describe('buildGradeSyllabus', () => {
  test('a parent who buys 48 classes gets exactly 48 slots', () => {
    // The invariant every downstream count depends on.
    for (const subject of SCHOOL_SUBJECTS) {
      for (const group of GRADE_GROUPS) {
        if (!subject.groups.includes(group.slug)) continue;
        for (const grade of group.grades) {
          const syl = buildGradeSyllabus(subject.slug, grade);
          const slots = syl.modules.flatMap((m) => m.lessons);
          assert.equal(slots.length, LESSONS_PER_GRADE, `${subject.slug}:${grade}`);
          assert.equal(syl.slotCount, LESSONS_PER_GRADE, `${subject.slug}:${grade}`);
          assert.equal(
            syl.lessonCount + syl.testCount,
            LESSONS_PER_GRADE,
            `${subject.slug}:${grade}: lessons + tests do not sum to the slot count`
          );
        }
      }
    }
  });

  test('48 slots is always 46 lessons and 2 assessments', () => {
    for (const subject of SCHOOL_SUBJECTS) {
      for (const grade of ALL_GRADES) {
        if (!gradeGroupFor(grade)) continue;
        const syl = buildGradeSyllabus(subject.slug, grade);
        assert.equal(syl.testCount, 2, `${subject.slug}:${grade}`);
        assert.equal(syl.lessonCount, 46, `${subject.slug}:${grade}`);
      }
    }
  });

  test('slot numbers run 1..48 with no gaps or repeats', () => {
    const syl = buildGradeSyllabus('mathematics', 8);
    const numbers = syl.modules.flatMap((m) => m.lessons.map((l) => l.number));
    assert.deepEqual(numbers, Array.from({ length: LESSONS_PER_GRADE }, (_, i) => i + 1));
  });

  test('lesson keys are unique — evidence is recorded against them', () => {
    // A duplicate key would silently merge two different lessons' history.
    const syl = buildGradeSyllabus('physics', 11);
    const keys = syl.modules.flatMap((m) => m.lessons.map((l) => l.key));
    assert.equal(new Set(keys).size, keys.length, 'duplicate lesson key');
  });

  test('assessments fall on slots 24 and 48 and are named', () => {
    const syl = buildGradeSyllabus('chemistry', 10);
    const tests = syl.modules.flatMap((m) => m.lessons).filter((l) => l.kind === 'test');
    assert.deepEqual(tests.map((t) => t.number), [24, 48]);
    assert.equal(tests[0].title, 'Mid-year assessment');
    assert.equal(tests[1].title, 'Final assessment');
  });

  test('an authored title can never overwrite an assessment slot', () => {
    // The builder overrides slots 24 and 48. This is why modules 4 and 8 carry
    // five authored lessons — a sixth would be silently discarded.
    for (const key of Object.keys(AUTHORED_TITLES)) {
      const [slug, gradeRaw] = key.split(':');
      const syl = buildGradeSyllabus(slug, Number(gradeRaw));
      for (const lesson of syl.modules.flatMap((m) => m.lessons)) {
        if (lesson.kind === 'test') {
          assert.equal(lesson.authored, false, `${key} slot ${lesson.number}: assessment marked authored`);
          assert.ok(
            lesson.title.endsWith('assessment'),
            `${key} slot ${lesson.number}: assessment carries a lesson title`
          );
        }
      }
    }
  });

  test('an unauthored grade still produces a complete, schedulable scaffold', () => {
    // A batch must be sellable and schedulable before any content is written.
    const syl = buildGradeSyllabus('mathematics', 99);
    assert.equal(syl.modules.length, MODULES_PER_GRADE);
    assert.equal(syl.slotCount, LESSONS_PER_GRADE);
    assert.equal(syl.authoredCount, 0);
    assert.equal(syl.modules[0].title, 'Module 1');
    assert.equal(syl.modules[0].lessons[0].title, 'Lesson 1');
  });

  test('every module holds the same number of slots', () => {
    const syl = buildGradeSyllabus('english', 7);
    assert.equal(syl.modules.length, MODULES_PER_GRADE);
    for (const m of syl.modules) {
      assert.equal(m.lessons.length, LESSONS_PER_MODULE, `module ${m.num}`);
    }
  });
});

describe('focus courses', () => {
  test('are keyed on grade 0 and build the same 48-slot shape', () => {
    for (const spec of SPECIALISATIONS) {
      const syl = buildGradeSyllabus(spec.slug, 0);
      assert.equal(syl.slotCount, LESSONS_PER_GRADE, spec.slug);
      assert.equal(syl.testCount, 2, spec.slug);
      assert.equal(syl.authoredCount, 46, `${spec.slug}: not fully authored`);
    }
  });

  test('every focus course is reachable by its own slug', () => {
    const slugs = SPECIALISATIONS.map((s) => s.slug);
    assert.equal(new Set(slugs).size, slugs.length, 'duplicate focus slug');
    for (const slug of slugs) {
      assert.ok(AUTHORED_TITLES[`${slug}:0`], `${slug}: no authored titles`);
    }
  });
});

describe('enrolmentOptions', () => {
  test('offers this grade and the whole group, in that order', () => {
    // Showing the smaller commitment first is what gets the first yes.
    const options = enrolmentOptions('mathematics', 8);
    assert.equal(options.length, 2);
    assert.equal(options[0].scope, 'grade');
    assert.equal(options[1].scope, 'group');
    assert.ok(options[0].lessonCount < options[1].lessonCount);
  });

  test('the group option is exactly three grades of classes', () => {
    const [grade, group] = enrolmentOptions('physics', 11);
    assert.equal(group.lessonCount, grade.lessonCount * 3);
  });

  test('refuses a subject that is not offered for that grade', () => {
    // Physics does not exist before grade 7. Offering it would tell every
    // parent who saw it that we do not understand schools.
    assert.deepEqual(enrolmentOptions('physics', 3), []);
    assert.deepEqual(enrolmentOptions('science', 11), []);
    assert.deepEqual(enrolmentOptions('not-a-subject', 8), []);
  });

  test('months always match classes at one a week', () => {
    for (const o of enrolmentOptions('english', 5)) {
      assert.equal(o.months, o.lessonCount / 4, `${o.scope}: months disagree with class count`);
    }
  });
});
