import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { BAND_ORDER, type SpeakingBand } from '@/lib/speaking/bands';
import { soundPattern } from '@/lib/speaking/sounds';
import { SPEAKING_COURSES, showcasesFor, speakingLessonAt, speakingLessons, speakingSyllabus, worldsFor } from './index';

/**
 * SARIRO — five complete courses
 * ============================================================================
 * Pins what the founder asked for (17 Sep 2026): each age group is its own
 * course, complete on the 48-slot schedule, pitched at its age — short spoken
 * drills and no writing for Grades 1–3, a tip for parents through Grade 6, and
 * a written plan before speaking from Grade 4 up.
 */

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

/** The longest a drill may ask a learner of this band to speak, in seconds. */
const MAX_SECONDS: Record<SpeakingBand, number> = { foundation: 60, primary: 120, middle: 180, senior: 270, adult: 270 };
/** The longest passage a learner of this band is dealt to read aloud. */
const MAX_PASSAGE_WORDS: Record<SpeakingBand, number> = { foundation: 60, primary: 90, middle: 120, senior: 120, adult: 120 };

for (const band of BAND_ORDER) {
  describe(`${band}: a complete course`, () => {
    const course = SPEAKING_COURSES[band];
    const lessons = speakingLessons(band);

    test('eight modules on the 48-slot schedule, showcases at 24 and 48', () => {
      assert.equal(course.band, band);
      assert.deepEqual(course.modules.map((m) => m.lessons.length), [6, 6, 6, 5, 6, 6, 6, 5]);
      assert.equal(lessons.length, 46);
      const numbers = lessons.map((l) => l.number);
      assert.ok(!numbers.includes(24) && !numbers.includes(48));
      assert.equal(new Set(numbers).size, 46);
      const syl = speakingSyllabus(band);
      assert.equal(syl.slotCount, 48);
      assert.equal(syl.authoredCount, 46);
      assert.deepEqual(syl.modules.flatMap((m) => m.lessons).filter((l) => l.kind === 'test').map((l) => l.number), [24, 48]);
      for (const l of syl.modules.flatMap((m) => m.lessons).filter((x) => x.kind === 'lesson')) {
        assert.equal(speakingLessonAt(band, l.moduleNum, l.lessonIndex)?.title, l.title, `slot ${l.number}`);
      }
    });

    test('its own names: modules, worlds and lessons are not repeated inside the course', () => {
      assert.equal(new Set(course.modules.map((m) => m.title)).size, 8);
      assert.equal(new Set(worldsFor(band).map((w) => w.name)).size, 8);
      assert.equal(new Set(lessons.map((l) => l.title.toLowerCase())).size, 46);
      assert.equal(showcasesFor(band).length, 2);
      assert.ok(course.warmUps.length >= 8);
      assert.ok(course.promise.length > 40);
    });

    for (const l of lessons) {
      test(`lesson ${l.number} “${l.title}”`, () => {
        assert.ok(l.idea.length >= 2 && l.idea.length <= 3, 'two or three paragraphs');
        assert.ok(l.oneLine.length > 20);
        assert.equal(l.drills.length, 2);
        for (const d of [...l.drills, ...(l.extraDrills ?? [])]) {
          assert.match(d.id, new RegExp(`^ps-${band}-${l.number}-[a-h]$`));
          assert.ok((d.targetSeconds ?? 0) >= 8 && (d.targetSeconds ?? 0) <= MAX_SECONDS[band], `${d.title}: ${d.targetSeconds}s`);
          if (d.passage) {
            assert.ok(words(d.passage) <= MAX_PASSAGE_WORDS[band], `${d.title}: ${words(d.passage)} words to read`);
            assert.ok(!/\d/.test(d.passage), `${d.title}: digits in a passage to read aloud`);
          }
        }
        assert.equal(l.game.how.length, 3);
        assert.ok(l.realWorld.length > 10);
        assert.ok(l.mentorWatchFor.length >= 2 && l.selfCheck.length >= 2);
        for (const p of l.soundLab ?? []) assert.ok(soundPattern(p), `unknown sound pattern ${p}`);
        if (band === 'foundation' || band === 'primary') assert.ok((l.homeTip ?? '').length > 20, 'a tip for parents');
        if (band === 'foundation') assert.equal(l.writePrompt, undefined, 'Grades 1–3 do not write');
        else assert.ok((l.writePrompt ?? '').length > 20, 'a writing prompt');
      });
    }
  });
}

describe('across the five courses', () => {
  test('drill ids never collide', () => {
    const ids = BAND_ORDER.flatMap((b) => speakingLessons(b).flatMap((l) => [...l.drills, ...(l.extraDrills ?? [])].map((d) => d.id)));
    assert.equal(new Set(ids).size, ids.length);
  });

  test('no two courses share a lesson’s one-line summary, a module title or a world', () => {
    const oneLines = BAND_ORDER.flatMap((b) => speakingLessons(b).map((l) => l.oneLine));
    assert.equal(new Set(oneLines).size, oneLines.length);
    const modules = BAND_ORDER.flatMap((b) => SPEAKING_COURSES[b].modules.map((m) => m.title));
    assert.equal(new Set(modules).size, modules.length, 'module titles');
    const worlds = BAND_ORDER.flatMap((b) => worldsFor(b).map((w) => w.name));
    assert.equal(new Set(worlds).size, worlds.length, 'world names');
  });

  test('Grades 1–3 learn with the cast of characters', () => {
    const cast = SPEAKING_COURSES.foundation.cast ?? [];
    assert.ok(cast.length >= 4);
    const text = speakingLessons('foundation').map((l) => `${l.oneLine} ${l.idea.join(' ')}`).join(' ');
    for (const c of cast) assert.ok(text.includes(c.name.split(' ')[0]), `${c.name} never appears`);
  });

  test('UG, PG & professionals get a whole module of interviews', () => {
    const mod = SPEAKING_COURSES.adult.modules.find((m) => /interview/i.test(m.title));
    assert.ok(mod, 'no interview module');
    assert.equal(mod.lessons.length, 5);
  });
});
