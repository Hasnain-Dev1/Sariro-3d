import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { streakFrom } from './gamification';

/**
 * SARIRO — the streak a child is told they have
 * =========================================================
 * Small function, and the reason it is tested is that it is shown to a learner
 * as a fact about themselves. Getting it wrong in either direction is worse
 * than not showing it:
 *
 *   too generous — the number stops meaning anything, and a child who missed
 *                  two weeks is congratulated for consistency;
 *   too harsh    — a streak resets for no visible reason and the feature reads
 *                  as broken, which is exactly how a child concludes the app
 *                  is not paying attention to them.
 *
 * Order is the whole risk here: the rows arrive from the database in whatever
 * order the query returns, and a streak read out of order is not a streak.
 */

const at = (day: number, status: string) => ({
  status,
  slot_start: `2026-08-${String(day).padStart(2, '0')}T10:00:00.000Z`,
});

describe('streaks', () => {
  test('counts back from the most recent class', () => {
    assert.equal(streakFrom([at(1, 'present'), at(2, 'present'), at(3, 'present')]), 3);
  });

  test('order of the input does not matter', () => {
    // The real risk: the rows arrive unsorted and a naive scan reads a streak
    // that never happened.
    const shuffled = [at(2, 'present'), at(3, 'absent'), at(1, 'present')];
    assert.equal(streakFrom(shuffled), 0, 'the newest class was a miss, so the streak is 0');
  });

  test('an absence ends it, however good the earlier run was', () => {
    const rows = [at(1, 'present'), at(2, 'present'), at(3, 'present'), at(4, 'absent')];
    assert.equal(streakFrom(rows), 0);
  });

  test('late still counts — they came', () => {
    assert.equal(streakFrom([at(1, 'present'), at(2, 'late'), at(3, 'present')]), 3);
  });

  test('only the current run counts, not the best one ever', () => {
    // Four in a row, then a miss, then one. The honest answer is 1.
    const rows = [
      at(1, 'present'), at(2, 'present'), at(3, 'present'), at(4, 'present'),
      at(5, 'absent'), at(6, 'present'),
    ];
    assert.equal(streakFrom(rows), 1);
  });

  test('no classes is zero, not a crash', () => {
    assert.equal(streakFrom([]), 0);
  });

  test('rows with unusable dates are dropped rather than mis-ordered', () => {
    const rows = [at(1, 'present'), { status: 'present', slot_start: 'nonsense' }, at(2, 'present')];
    assert.equal(streakFrom(rows), 2);
  });

  test('excused is not attendance', () => {
    // A child who was excused did not attend. Counting it would quietly make
    // the streak mean something other than what it says.
    assert.equal(streakFrom([at(1, 'present'), at(2, 'excused')]), 0);
  });
});
