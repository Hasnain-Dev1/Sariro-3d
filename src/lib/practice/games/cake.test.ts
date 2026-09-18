import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { checkServe, cutInto, eatSlice, freshCake, kindsFor, leftCount, makeOrder, recutEach, servedCount, toggleServe, coinsFor, levelFor, MAX_SLICES } from './cake';

describe('the cake', () => {
  test('cutting, serving, eating', () => {
    let s = cutInto(freshCake(), 8);
    assert.equal(s.slices, 8);
    s = toggleServe(toggleServe(toggleServe(s, 0), 1), 2);
    assert.equal(servedCount(s), 3);
    s = eatSlice(s, 5);
    assert.equal(leftCount(s), 7);
    assert.equal(servedCount(s), 3);
    // Cannot re-cut after serving or eating.
    assert.equal(cutInto(s, 4).slices, 8);
  });
  test('recutting keeps what was eaten and served', () => {
    let s = freshCake(4, 1);
    s = recutEach(s, 3);
    assert.equal(s.slices, 12);
    assert.equal(s.eaten.filter(Boolean).length, 3);
    assert.equal(recutEach(s, 2).slices, 12, 'never past the maximum');
  });
});

describe('serving an order', () => {
  const order = { kind: 'serve' as const, seed: 1, text: '', num: 1, den: 2, patience: 30 };
  test('the same amount in any equal cutting counts', () => {
    let s = cutInto(freshCake(), 4);
    s = toggleServe(toggleServe(s, 0), 1);
    const v = checkServe(order, s);
    assert.equal(v.ok, true);
    assert.match(v.message, /same amount/);
  });
  test('the wrong amount is named', () => {
    const s = toggleServe(cutInto(freshCake(), 4), 0);
    const v = checkServe(order, s);
    assert.equal(v.ok, false);
    assert.match(v.message, /1\/4/);
  });
  test('a required cutting is required', () => {
    const s = toggleServe(cutInto(freshCake(), 2), 0);
    assert.equal(checkServe({ ...order, mustCut: 6 }, s).ok, false);
  });
});

describe('orders', () => {
  test('young grades get cupcakes and halves/quarters; older grades get recuts', () => {
    assert.ok(kindsFor(1, 1).includes('takeaway'));
    assert.ok(!kindsFor(1, 1).includes('recut'));
    assert.ok(kindsFor(6, 2).includes('recut'));
  });
  test('every order is solvable, and its answer is among its options', () => {
    for (let grade = 1; grade <= 6; grade++) {
      for (let level = 1; level <= 5; level++) {
        for (let seed = 1; seed <= 200; seed++) {
          const o = makeOrder(seed * 31 + grade * 7 + level, grade, level);
          assert.ok(o.text && !/NaN|undefined/.test(o.text), o.text);
          if (o.options) {
            assert.ok(o.options.includes(o.correctOption!), `${o.text} → ${o.options} vs ${o.correctOption}`);
            assert.equal(new Set(o.options).size, o.options.length);
          }
          if (o.kind === 'serve' || o.kind === 'recut') {
            // A perfect player can serve it.
            let s = o.kind === 'recut' ? freshCake(o.startSlices!, o.startEaten!) : freshCake();
            const target = o.mustCut ?? o.den!;
            s = o.kind === 'recut' ? recutEach(s, target / s.slices) : cutInto(s, target);
            assert.equal(s.slices, target, o.text);
            const need = (o.num! * s.slices) / o.den!;
            let served = 0;
            for (let i = 0; i < s.slices && served < need; i++) if (!s.eaten[i]) { s = toggleServe(s, i); served++; }
            assert.equal(served, need, `${o.text}: not enough cake left to serve`);
            assert.equal(checkServe(o, s).ok, true, o.text);
          }
          if (o.kind === 'leftover') {
            assert.ok(o.startSlices! <= MAX_SLICES);
            assert.ok(o.take! >= 1 && o.take! + o.startEaten! < o.startSlices!);
          }
        }
      }
    }
  });
  test('coins reward speed and combos; levels every five', () => {
    assert.ok(coinsFor(30, 30, 0) > coinsFor(5, 30, 0));
    assert.ok(coinsFor(10, 30, 4) > coinsFor(10, 30, 0));
    assert.deepEqual([0, 4, 5, 10].map(levelFor), [1, 1, 2, 3]);
  });
});
