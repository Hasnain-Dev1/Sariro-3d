import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { BAND_PRACTICE, passageIn } from './band-practice';
import { BAND_ORDER } from '@/lib/speaking/bands';
import { wordCount } from '@/lib/speaking/passages';

/**
 * SARIRO — each band's practice room is its own
 * ============================================================================
 * A six-year-old should never be dealt a hundred-and-fifty-word passage, and a
 * manager should never be asked to invent a better school. These pin the room
 * to the band.
 */

/** Passage length, in words, a band's reader should be dealt. */
const WORDS: Record<string, [number, number]> = {
  foundation: [25, 60],
  primary: [50, 100],
  middle: [100, 200],
  senior: [100, 200],
  adult: [70, 200],
};

describe('every band has a complete room', () => {
  for (const band of BAND_ORDER) {
    const p = BAND_PRACTICE[band];
    test(`${band}`, () => {
      assert.equal(p.band, band);
      assert.deepEqual(p.drills.map((d) => d.kind).sort(), ['free', 'read', 'task']);
      assert.ok(p.drills.every((d) => d.id.startsWith(`practice:${band}:`)), 'drill ids name the band');
      assert.ok(p.topics.length >= 10, 'enough topics to deal from');
      assert.equal(new Set(p.topics.map((t) => t.id)).size, p.topics.length, 'unique topic ids');
      assert.ok(p.passages.length >= 12, 'enough passages to deal from');
      assert.equal(new Set(p.passages.map((x) => x.id)).size, p.passages.length, 'unique passage ids');
      const [min, max] = WORDS[band];
      for (const x of p.passages) {
        const n = wordCount(x.text);
        assert.ok(n >= min && n <= max, `${band}/${x.id}: ${n} words`);
        assert.ok(!/\d/.test(x.text), `${band}/${x.id}: digits in a passage to read aloud`);
      }
      assert.equal(passageIn(p, p.passages[0].id), p.passages[0]);
    });
  }

  test('Grades 1–3 do not write; every other band does', () => {
    assert.equal(BAND_PRACTICE.foundation.writingPrompts.length, 0);
    for (const b of BAND_ORDER.filter((x) => x !== 'foundation')) assert.ok(BAND_PRACTICE[b].writingPrompts.length >= 5, b);
  });

  test('the younger bands get the simple Sound Lab', () => {
    assert.deepEqual(BAND_ORDER.filter((b) => BAND_PRACTICE[b].simpleSounds), ['foundation', 'primary']);
  });

  test('drill lengths grow with the band', () => {
    const free = BAND_ORDER.map((b) => BAND_PRACTICE[b].drills.find((d) => d.kind === 'free')!.targetSeconds ?? 0);
    assert.ok(free[0] < free[1] && free[1] < free[2] && free[2] < free[3], `free talk seconds: ${free.join(', ')}`);
  });
});
