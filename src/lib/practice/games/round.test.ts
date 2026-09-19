import { test } from 'node:test';
import assert from 'node:assert/strict';
import { coinsFor, levelFor } from './round';
import { weighExplain, makePuzzle } from './balance';

test('coins: speed, streak, bonus', () => {
  assert.equal(coinsFor(0, 30, 0), 10);
  assert.equal(coinsFor(30, 30, 0), 20);
  assert.equal(coinsFor(30, 30, 2), 40);
  assert.equal(coinsFor(30, 30, 100), 100);
  assert.equal(coinsFor(15, 30, 0, 10), 25);
  assert.equal(coinsFor(5, 0, 0), 10);
});

test('levels', () => {
  assert.equal(levelFor(0, 4), 1);
  assert.equal(levelFor(3, 4), 1);
  assert.equal(levelFor(4, 4), 2);
});

test('the weigh explanation ends on the answer', () => {
  for (let g = 2; g <= 5; g++) for (let l = 1; l <= 5; l++) for (let s = 1; s < 40; s++) {
    const p = makePuzzle(s * 97 + l, g, l);
    if (p.mode !== 'weigh') continue;
    const text = weighExplain(p);
    assert.ok(text.endsWith(`${p.value}.`), text);
    assert.ok(!/NaN|undefined/.test(text), text);
  }
});
