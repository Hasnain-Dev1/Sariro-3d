import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  bandFor, bandOf, fits, bandLabel, GRADE_SPREAD, MIN_GRADE, MAX_GRADE,
} from './grade-band';

/**
 * SARIRO — "think mapping a grade 1 kid with a grade 10, how does that work"
 * ============================================================================
 * It does not. One lesson cannot serve a six-year-old learning to read and a
 * fifteen-year-old doing board revision, and the trial is the half hour that
 * decides whether a family buys anything.
 *
 * The first child to book a slot fixes it at their grade ± 1. Everything below
 * is that one sentence, and the edges where it could quietly stop holding.
 */

describe('bandFor', () => {
  test('a grade 6 opens a 5–7 class', () => {
    assert.deepEqual(bandFor(6), { anchor: 6, min: 5, max: 7 });
  });

  test('the band never runs below grade 1', () => {
    assert.deepEqual(bandFor(1), { anchor: 1, min: 1, max: 2 });
  });

  test('the band never runs above grade 12', () => {
    assert.deepEqual(bandFor(12), { anchor: 12, min: 11, max: 12 });
  });

  test('a grade outside the school is pulled back into it', () => {
    assert.equal(bandFor(0).anchor, MIN_GRADE);
    assert.equal(bandFor(99).anchor, MAX_GRADE);
  });

  test('the spread really is one, not a fixed 1-3 / 4-6 block', () => {
    // Fixed blocks split the pairs that matter most: a 3 and a 4 are a year
    // apart and could not share a class, while a 1 and a 3 could.
    assert.equal(GRADE_SPREAD, 1);
    assert.ok(fits(4, bandFor(3)).ok, 'a 3 and a 4 must be able to share');
    assert.ok(!fits(1, bandFor(3)).ok, 'a 1 and a 3 must not');
  });
});

describe('bandOf', () => {
  test('the FIRST child sets it, not the youngest or the average', () => {
    // "the first entry decides which grade group batch it will be"
    assert.deepEqual(bandOf([8, 7]), { anchor: 8, min: 7, max: 9 });
    assert.deepEqual(bandOf([7, 8]), { anchor: 7, min: 6, max: 8 });
  });

  test('an empty class has no band and takes anybody', () => {
    assert.equal(bandOf([]), null);
    assert.equal(fits(11, null).ok, true);
  });

  test('a class assembled before grades were recorded still answers', () => {
    // Reading the band from the children rather than a stored column means an
    // old booking with one known grade behaves, instead of blocking forever.
    assert.deepEqual(bandOf([null, 4]), { anchor: 4, min: 3, max: 5 });
    assert.equal(bandOf([null, undefined]), null);
  });
});

describe('fits', () => {
  const band = bandFor(6); // 5–7

  test('the anchor grade itself fits', () => {
    assert.ok(fits(6, band).ok);
  });

  test('one either side fits', () => {
    assert.ok(fits(5, band).ok);
    assert.ok(fits(7, band).ok);
  });

  test('two either side does not', () => {
    assert.ok(!fits(4, band).ok);
    assert.ok(!fits(8, band).ok);
  });

  test('a grade 1 cannot join a grade 10 class — the whole point', () => {
    const senior = bandFor(10);
    const r = fits(1, senior);
    assert.equal(r.ok, false);
    assert.match(r.message, /grades 9–11/);
  });

  test('the refusal says which grades the class IS for', () => {
    // A seller reading "not allowed" has to guess. This tells them what to
    // look for instead.
    assert.match(fits(9, band).message, /grades 5–7/);
    assert.match(fits(9, band).message, /grade 9/);
  });

  test('an unknown grade is refused, not waved through', () => {
    // Seating a child whose level nobody recorded is exactly how the 1 and the
    // 10 end up in the same room. "We did not ask" is not a reason to risk it.
    assert.equal(fits(null, band).ok, false);
    assert.equal(fits(undefined, band).ok, false);
    assert.equal(fits(NaN, band).ok, false);
  });

  test('an unknown grade cannot even open an empty class', () => {
    assert.equal(fits(null, null).ok, false);
    assert.match(fits(null, null).message, /need the grade/);
  });

  test('the four children of a 6-anchored class can only be 5, 6 or 7', () => {
    // "if we have a grade 6 kid as the first entry then the second entry can
    // only be 5 or 7 ... the next 3 will be now 5-7"
    const allowed: number[] = [];
    for (let g = MIN_GRADE; g <= MAX_GRADE; g++) if (fits(g, band).ok) allowed.push(g);
    assert.deepEqual(allowed, [5, 6, 7]);
  });
});

describe('bandLabel', () => {
  test('reads as a range', () => {
    assert.equal(bandLabel(bandFor(6)), 'Grades 5–7');
  });

  test('a clamped band at the edge reads sensibly', () => {
    assert.equal(bandLabel(bandFor(1)), 'Grades 1–2');
  });

  test('no band yet says so rather than pretending', () => {
    assert.equal(bandLabel(null), 'Any grade');
  });
});
