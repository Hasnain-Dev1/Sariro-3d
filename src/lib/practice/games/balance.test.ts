import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  applyMove, equationText, isSolved, makePuzzle, modeFor, parFor, solveForm, splitsAvailable, sumWeights, tilt, weightOf,
  MAX_WEIGHTS, WEIGHTS, type Move, type Pan,
} from './balance';

/** Solve the way the par counts it: boxes off the lighter-boxed pan, weights off the other, then split. */
function solve(left: Pan, right: Pan): { left: Pan; right: Pan; moves: number } {
  let l = left;
  let r = right;
  let moves = 0;
  const go = (m: Move) => {
    const res = applyMove(l, r, m);
    assert.ok(res.ok, `${equationText(l, r)}: ${JSON.stringify(m)} → ${res.ok ? '' : res.reason}`);
    if (res.ok) { l = res.left; r = res.right; moves += 1; }
  };
  const boxed = l.x >= r.x ? 'left' : 'right';
  const small = boxed === 'left' ? r : l;
  if (small.x) go({ op: 'takeX', k: small.x });
  const big = boxed === 'left' ? l : r;
  if (big.n) go({ op: 'take', n: big.n });
  const b2 = boxed === 'left' ? l : r;
  if (b2.x > 1) go({ op: 'split', k: b2.x });
  return { left: l, right: r, moves };
}

/** Greedy weights for a total, biggest first. */
function greedy(total: number): number[] {
  const out: number[] = [];
  let left = total;
  for (const w of [...WEIGHTS].reverse()) while (left >= w) { out.push(w); left -= w; }
  return out;
}

describe('moves on both pans', () => {
  const l = { x: 3, n: 7 };
  const r = { x: 1, n: 19 };
  test('taking the same off both keeps it true', () => {
    const res = applyMove(l, r, { op: 'take', n: 7 });
    assert.ok(res.ok);
    if (res.ok) assert.equal(equationText(res.left, res.right), '3x = x + 12');
  });
  test('you cannot take more than a pan has', () => {
    const res = applyMove(l, r, { op: 'take', n: 8 });
    assert.equal(res.ok, false);
    if (!res.ok) assert.match(res.reason, /only 7/);
    assert.equal(applyMove(l, r, { op: 'takeX', k: 2 }).ok, false);
  });
  test('a split needs every count to divide', () => {
    assert.equal(applyMove({ x: 2, n: 6 }, { x: 0, n: 14 }, { op: 'split', k: 2 }).ok, true);
    assert.equal(applyMove({ x: 2, n: 5 }, { x: 0, n: 13 }, { op: 'split', k: 2 }).ok, false);
    assert.deepEqual(splitsAvailable({ x: 2, n: 6 }, { x: 0, n: 12 }), [2]);
    assert.deepEqual(splitsAvailable({ x: 6, n: 0 }, { x: 0, n: 24 }), [2, 3, 6]);
  });
  test('solved is one box alone against weights, either side', () => {
    assert.ok(isSolved({ x: 1, n: 0 }, { x: 0, n: 5 }));
    assert.ok(isSolved({ x: 0, n: 5 }, { x: 1, n: 0 }));
    assert.ok(!isSolved({ x: 1, n: 1 }, { x: 0, n: 5 }));
    assert.ok(!isSolved({ x: 2, n: 0 }, { x: 0, n: 10 }));
  });
  test('par', () => {
    assert.equal(parFor({ x: 3, n: 7 }, { x: 1, n: 19 }), 3);
    assert.equal(parFor({ x: 1, n: 4 }, { x: 0, n: 9 }), 1);
    assert.equal(parFor({ x: 0, n: 12 }, { x: 4, n: 0 }), 1);
  });
  test('the beam tips toward the heavier pan, always visibly, never wildly', () => {
    assert.equal(tilt(5, 5), 0);
    assert.ok(tilt(5, 6) >= 4);
    assert.ok(tilt(6, 5) <= -4);
    assert.equal(tilt(0, 100), 18);
  });
  test('the equation reads like one', () => {
    assert.equal(equationText({ x: 3, n: 7 }, { x: 1, n: 19 }), '3x + 7 = x + 19');
    assert.equal(equationText({ x: 1, n: 0 }, { x: 0, n: 12 }), 'x = 12');
    assert.equal(equationText({ x: 0, n: 0 }, { x: 0, n: 0 }), '0 = 0');
  });
});

describe('puzzles', () => {
  test('modes and forms rise with grade and level', () => {
    assert.equal(modeFor(3, 9), 'weigh');
    assert.equal(modeFor(5, 1), 'weigh');
    assert.equal(modeFor(5, 3), 'solve');
    assert.equal(modeFor(7, 1), 'solve');
    assert.equal(solveForm(6, 1), 1);
    assert.equal(solveForm(7, 1), 2);
    assert.equal(solveForm(8, 1), 3);
    assert.equal(solveForm(8, 3), 4);
    assert.equal(solveForm(5, 3), 1);
    for (let l = 1; l < 20; l++) assert.ok(solveForm(9, l) <= 4 && solveForm(5, l) >= 1);
  });

  test('every puzzle is fair: true, not already solved, solvable in par moves to its own value', () => {
    let n = 0;
    for (let grade = 2; grade <= 9; grade++) {
      for (let level = 1; level <= 8; level++) {
        for (let seed = 1; seed <= 150; seed++) {
          const p = makePuzzle(seed * 7919 + grade * 31 + level, grade, level);
          const where = `g${grade} l${level} seed ${seed}: ${equationText(p.left, p.right)} (x = ${p.value})`;
          n += 1;
          assert.ok(p.value >= 1, where);
          if (p.mode === 'weigh') {
            assert.ok(p.left.x >= 1 && p.right.x === 0 && p.right.n === 0, where);
            const total = weightOf(p.left, p.value);
            assert.ok(greedy(total).length <= MAX_WEIGHTS, `${where} needs too many weights`);
            assert.equal(sumWeights(greedy(total)), total);
            continue;
          }
          assert.equal(weightOf(p.left, p.value), weightOf(p.right, p.value), `${where} is not balanced`);
          assert.ok(!isSolved(p.left, p.right), `${where} starts solved`);
          assert.ok(p.par >= 1 && p.par <= 3, where);
          assert.ok(Math.max(p.left.x, p.right.x) <= 7 && Math.max(p.left.n, p.right.n) <= 120, `${where} is too big to draw`);
          const done = solve(p.left, p.right);
          assert.ok(isSolved(done.left, done.right), `${where} did not solve`);
          assert.equal(done.moves, p.par, where);
          assert.equal(done.left.x ? done.right.n : done.left.n, p.value, where);
        }
      }
    }
    assert.ok(n > 9000);
  });

  test('the same seed makes the same puzzle', () => {
    assert.deepEqual(makePuzzle(42, 7, 3), makePuzzle(42, 7, 3));
  });
});
