import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { allSpeakingLessons } from '@/lib/speaking/modules';
import { soundPattern } from '@/lib/speaking/sounds';
import { BAND_LESSONS } from './index';
import type { SpeakingBand } from '@/lib/speaking/bands';

/**
 * SARIRO — every band's course is finished, and is its own
 * ============================================================================
 * Five Public Speaking courses means four sets of forty-six lessons here (Grades
 * 1–3 have lib/speaking/junior). A band with a missing lesson silently falls
 * back to the syllabus lesson — the right safety net and the wrong product —
 * so completeness is checked, not assumed.
 */

const syllabus = allSpeakingLessons();
const numbers = syllabus.map((l) => l.number).sort((a, b) => a - b);
const words = (s: string) => s.trim().split(/\s+/).length;

/** The longest drill each band should be asked to record. */
const MAX_SECONDS: Record<string, number> = { primary: 120, middle: 180, senior: 270, adult: 270 };

for (const [band, lessons] of Object.entries(BAND_LESSONS) as [SpeakingBand, NonNullable<(typeof BAND_LESSONS)[SpeakingBand]>][]) {
  describe(`${band}: the whole course`, () => {
    test('one lesson for every syllabus slot, and nothing extra', () => {
      assert.deepEqual(lessons.map((l) => l.number).sort((a, b) => a - b), numbers);
    });

    test('drill ids are the band’s own and never repeat', () => {
      const ids = lessons.flatMap((l) => [...l.drills, ...(l.extraDrills ?? [])].map((d) => d.id));
      assert.equal(new Set(ids).size, ids.length);
      for (const id of ids) assert.match(id, new RegExp(`^ps-${band}-\\d+-[a-d]$`));
    });

    for (const l of lessons) {
      test(`lesson ${l.number}: finished`, () => {
        assert.ok(l.oneLine.length > 30, 'oneLine');
        assert.ok(l.idea.length >= 2 && l.idea.length <= 3, 'two or three paragraphs');
        for (const p of l.idea) assert.ok(p.length > 60, 'a paragraph that short is a placeholder');
        if (band === 'primary') for (const p of l.idea) assert.ok(words(p) <= 70, `a ${words(p)}-word paragraph is too long for Grades 4–6`);
        for (const d of [...l.drills, ...(l.extraDrills ?? [])]) {
          assert.ok(d.brief.length >= 50, `${d.id}: brief too thin to be an instruction`);
          assert.ok((d.targetSeconds ?? 0) >= 10 && (d.targetSeconds ?? 0) <= MAX_SECONDS[band], `${d.id}: ${d.targetSeconds}s is wrong for ${band}`);
          if (d.passage) {
            assert.ok(d.passage.length >= 25, `${d.id}: passage too short`);
            assert.ok(/[.,;:!?—]/.test(d.passage), `${d.id}: nowhere to breathe`);
            // A recogniser hears "nineteen sixty-nine", not "1969".
            assert.ok(!/\d/.test(d.passage), `${d.id}: digits in a passage to be read aloud`);
          }
        }
        assert.ok(l.mentorWatchFor.length >= 2, 'the mentor needs something to look for');
        assert.ok(l.selfCheck.length >= 2, 'the learner needs something to check');
        assert.ok(l.realWorld.length > 10, 'where this is needed');
        assert.ok((l.writePrompt ?? '').length > 20, 'the writing homework needs a prompt');
        if (band === 'primary') assert.ok((l.homeTip ?? '').length > 20, 'Grades 4–6 get a tip for home');
        for (const p of l.soundLab ?? []) assert.ok(soundPattern(p), `unknown sound pattern ${p}`);
      });
    }
  });
}

describe('the bands are genuinely different courses', () => {
  test('no two bands share a lesson’s one-line summary, and none copies the syllabus lesson', () => {
    const bands = Object.values(BAND_LESSONS).filter(Boolean) as NonNullable<(typeof BAND_LESSONS)[SpeakingBand]>[];
    for (const n of numbers) {
      const lines = bands.map((b) => b.find((l) => l.number === n)!.oneLine);
      const base = syllabus.find((l) => l.number === n)!.oneLine;
      assert.equal(new Set(lines).size, lines.length, `lesson ${n}: two bands share a oneLine`);
      assert.ok(!lines.includes(base), `lesson ${n}: a band copied the syllabus oneLine`);
    }
  });
});
