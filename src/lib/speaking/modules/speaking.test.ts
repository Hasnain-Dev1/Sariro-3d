import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { SPEAKING_MODULES, allSpeakingLessons, getSpeakingLesson } from './index';
import { buildGradeSyllabus } from '@/lib/school/curriculum';

/**
 * SARIRO — the written course against the sold one
 * =========================================================
 * Two things describe this course and they are in different files. The syllabus
 * in lib/school/curriculum.ts is what a parent is shown and what the timetable
 * is built from. The lessons here are what a student opens.
 *
 * If they drift, a student clicks lesson 19 and gets the content for lesson 20,
 * and nobody finds out until a class goes wrong. So the drift is checked here
 * rather than left to care.
 */

const syllabus = buildGradeSyllabus('public-speaking', 0);
const lessons = allSpeakingLessons();

describe('the course matches the syllabus that was sold', () => {
  test('46 lessons — 48 slots less the two assessments', () => {
    assert.equal(syllabus.slotCount, 48);
    assert.equal(syllabus.testCount, 2);
    assert.equal(syllabus.lessonCount, 46);
    assert.equal(lessons.length, 46);
  });

  /**
   * The one that would actually hurt. A student opening a lesson gets content
   * looked up by (module, index), so a mismatch here serves the wrong lesson
   * silently.
   */
  test('every written lesson sits in the slot with its own title', () => {
    for (const l of lessons) {
      const mod = syllabus.modules.find((m) => m.num === l.moduleNum);
      assert.ok(mod, `module ${l.moduleNum} is not in the syllabus`);
      const slot = mod.lessons.find((s) => s.lessonIndex === l.lessonIndex);
      assert.ok(slot, `${l.key} has no slot`);
      assert.equal(slot.title, l.title, `slot ${l.number} title mismatch`);
      assert.equal(slot.kind, 'lesson', `${l.key} is an assessment slot, not a lesson`);
    }
  });

  test('every teaching slot in the syllabus has a lesson written for it', () => {
    for (const mod of syllabus.modules) {
      for (const slot of mod.lessons) {
        if (slot.kind !== 'lesson') continue;
        const written = getSpeakingLesson(mod.num, slot.lessonIndex);
        assert.ok(written, `nothing written for module ${mod.num} slot ${slot.lessonIndex} — "${slot.title}"`);
      }
    }
  });

  test('module titles match', () => {
    for (const m of SPEAKING_MODULES) {
      const s = syllabus.modules.find((x) => x.num === m.num);
      assert.equal(s?.title, m.title, `module ${m.num}`);
    }
  });

  /** Modules 4 and 8 lose their sixth slot to an assessment. */
  test('modules 4 and 8 carry five lessons, the rest six', () => {
    for (const m of SPEAKING_MODULES) {
      const expected = m.num === 4 || m.num === 8 ? 5 : 6;
      assert.equal(m.lessons.length, expected, `module ${m.num}`);
    }
  });

  test('lesson numbers run 1 to 47 with the assessments skipped', () => {
    const numbers = lessons.map((l) => l.number);
    assert.equal(new Set(numbers).size, numbers.length, 'duplicate lesson numbers');
    assert.equal(Math.min(...numbers), 1);
    assert.equal(Math.max(...numbers), 47);
    // 24 and 48 are the assessments and belong to nothing written here.
    assert.ok(!numbers.includes(24), 'lesson 24 is the mid-course assessment');
    assert.ok(!numbers.includes(48), 'lesson 48 is the final assessment');
  });

  test('keys are unique and derived from their own position', () => {
    const keys = lessons.map((l) => l.key);
    assert.equal(new Set(keys).size, keys.length);
    for (const l of lessons) {
      assert.equal(l.key, `public-speaking:0:${l.moduleNum}:${l.lessonIndex}`);
    }
  });
});

describe('every lesson is actually finished', () => {
  for (const l of lessons) {
    test(`${l.number}. ${l.title}`, () => {
      assert.ok(l.oneLine.length > 30, 'oneLine too short to say anything');
      assert.ok(l.idea.length >= 2, 'needs at least two paragraphs of idea');
      assert.ok(l.idea.every((p) => p.length > 80), 'a paragraph that short is a placeholder');

      // The drills ARE the lesson — a speaking lesson with nothing to say out
      // loud is a reading comprehension exercise.
      assert.ok(l.drills.length >= 2, 'needs at least two drills');
      assert.ok((l.extraDrills ?? []).length >= 2, 'needs extra practice — students run out');

      assert.ok(l.mentorWatchFor.length >= 3, 'the mentor needs something to look for');
      assert.ok(l.selfCheck.length >= 2, 'the student needs something to check');
    });
  }
});

describe('the drills hold together', () => {
  const drills = lessons.flatMap((l) => [...l.drills, ...(l.extraDrills ?? [])]);

  test('there are more than a hundred of them', () => {
    // "Practise it again" has to lead somewhere.
    assert.ok(drills.length > 100, `only ${drills.length}`);
  });

  test('every drill id is unique — the lab keys on it', () => {
    const ids = drills.map((d) => d.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  test('every drill says what to do, at length', () => {
    for (const d of drills) {
      assert.ok(d.title.length > 3, d.id);
      assert.ok(d.brief.length > 60, `${d.id}: brief too short to be an instruction`);
    }
  });

  test('a drill that sets a passage sets one worth reading', () => {
    for (const d of drills) {
      if (!d.passage) continue;
      // Floor set low enough to admit "I never said she stole my money." — the
      // seven-meanings drill, where one short sentence IS the exercise. The
      // punctuation check below is what actually catches a placeholder.
      assert.ok(d.passage.length >= 25, `${d.id}: passage too short`);
      // The passage's punctuation is what the report measures pausing against,
      // so a passage without any cannot be scored on it.
      assert.ok(/[.,;:!?—]/.test(d.passage), `${d.id}: no punctuation to breathe at`);
    }
  });

  test('target lengths are sane', () => {
    for (const d of drills) {
      if (d.targetSeconds === undefined) continue;
      assert.ok(d.targetSeconds >= 10, `${d.id}: too short to measure`);
      assert.ok(d.targetSeconds <= 300, `${d.id}: longer than anybody will practise`);
    }
  });
});
