import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { fireStorm, newStorm, stepStorm, pointsFor, spawnEvery, MAX_ON_SCREEN, type StormState } from './storm';
import type { Item } from '../types';

const sum = (a: number, b: number): Item => ({
  id: `t#${a}${b}`, topic: 't', seed: 1, prompt: `${a} + ${b} = ?`, answer: { kind: 'number', value: a + b }, answerText: String(a + b), hints: [], solution: '',
});

let n = 0;
const spawn = () => { n += 1; return { item: sum(n, 1), x: 50 }; };

describe('the storm', () => {
  test('spawns on its interval, up to the cap', () => {
    let st: StormState = newStorm();
    st = stepStorm(st, 0, 0, spawn).st;
    assert.equal(st.meteors.length, 1);
    st = stepStorm(st, 1000, 0, spawn).st;
    assert.equal(st.meteors.length, 1, 'not yet');
    st = stepStorm(st, spawnEvery(0), 0, spawn).st;
    assert.equal(st.meteors.length, 2);
    for (let t = 2; t < 20; t++) st = stepStorm(st, t * 10_000, 0, spawn).st;
    assert.equal(st.meteors.length, MAX_ON_SCREEN);
  });
  test('meteors fall, and one that lands costs a heart and the combo', () => {
    let st: StormState = { ...newStorm(), combo: 3 };
    st = stepStorm(st, 0, 0, spawn).st;
    const r = stepStorm(st, 1, 30, spawn); // 30 s at 5%/s is past the ground
    assert.equal(r.landed.length, 1);
    assert.equal(r.st.hearts, 2);
    assert.equal(r.st.combo, 0);
  });
  test('three landings end it', () => {
    let st: StormState = { ...newStorm(), hearts: 1 };
    st = stepStorm(st, 0, 0, spawn).st;
    st = stepStorm(st, 1, 30, spawn).st;
    assert.equal(st.over, true);
  });
});

describe('firing', () => {
  const two = (): StormState => ({
    ...newStorm(),
    meteors: [
      { id: 1, item: sum(2, 3), x: 20, y: 10, speed: 5 },
      { id: 2, item: sum(1, 4), x: 60, y: 70, speed: 5 },
    ],
  });
  test('the right answer destroys the lowest meteor it is right for', () => {
    const r = fireStorm(two(), '5');
    assert.equal(r.hit?.id, 2);
    assert.equal(r.st.meteors.length, 1);
    assert.equal(r.st.score, pointsFor(0));
    assert.equal(r.st.combo, 1);
  });
  test('combos multiply, up to ×5', () => {
    assert.deepEqual([0, 1, 2, 8, 20].map(pointsFor), [10, 15, 20, 50, 50]);
    const r = fireStorm({ ...two(), combo: 4 }, '5');
    assert.equal(r.gained, 30);
  });
  test('a miss breaks the combo but costs no heart', () => {
    const r = fireStorm({ ...two(), combo: 3 }, '99');
    assert.equal(r.hit, null);
    assert.equal(r.st.combo, 0);
    assert.equal(r.st.hearts, 3);
    assert.equal(r.st.misses, 1);
  });
});
