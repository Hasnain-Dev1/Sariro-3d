import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { onGrid } from './frames';
import { silences } from './analyse';

const FRAME = 50;

/** Loudness as a sampler would read it at time `ms`: a pause from 3000 to 4200. */
const loudnessAt = (ms: number) => (ms >= 3000 && ms < 4200 ? 0.004 : 0.3);

describe('onGrid', () => {
  test('a punctual sampler comes back unchanged', () => {
    const stamps = Array.from({ length: 40 }, (_, i) => (i + 1) * FRAME);
    const values = stamps.map((s) => s / 1000);
    assert.deepEqual(onGrid(values, stamps, 2000, FRAME), values);
  });

  test('a sampler running at half speed still puts the pause at the right time', () => {
    // Every 100ms: twenty seconds of recording, half the frames it should have.
    const stamps = Array.from({ length: 200 }, (_, i) => (i + 1) * 100);
    const values = stamps.map((s) => loudnessAt(s - 50));

    // Read as-is, the pause is in the wrong place — the bug this exists for.
    assert.equal(silences(values, FRAME)[0].startMs, 1500);

    const fixed = onGrid(values, stamps, 20_000, FRAME);
    assert.equal(fixed.length, 400);
    const [pause] = silences(fixed, FRAME);
    assert.ok(Math.abs(pause.startMs - 3000) <= 100, `pause at ${pause.startMs}`);
    assert.ok(Math.abs(pause.ms - 1200) <= 100, `pause lasted ${pause.ms}`);
  });

  test('a stall and a burst land on the grid in order', () => {
    // Punctual, then nothing for 400ms, then two samples back to back.
    const stamps = [50, 100, 150, 550, 560, 600];
    const values = ['a', 'b', 'c', 'd', 'e', 'f'];
    assert.deepEqual(onGrid(values, stamps, 600, FRAME), ['a', 'b', 'c', 'c', 'c', 'c', 'd', 'd', 'd', 'd', 'd', 'f']);
  });

  test('nulls (unvoiced pitch) are carried like any other value', () => {
    assert.deepEqual(onGrid([null, 200], [100, 200], 200, FRAME), [null, null, 200, 200]);
  });

  test('nothing, or stamps that do not match, are returned as they came', () => {
    assert.deepEqual(onGrid([], [], 1000, FRAME), []);
    assert.deepEqual(onGrid([1, 2, 3], [50, 100], 1000, FRAME), [1, 2, 3]);
    assert.deepEqual(onGrid([1, 2], [50, 100], 0, FRAME), [1, 2]);
  });
});
