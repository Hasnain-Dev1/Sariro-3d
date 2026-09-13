import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { livePace, paceZone, needleAngle, liveFillers, pitchTrace, DIAL } from './live';
import { PACE_BAND } from './analyse';
import type { WordObservation } from './timeline';

/** A word every `gapMs`, from the start. */
const steady = (gapMs: number, untilMs: number): WordObservation[] =>
  Array.from({ length: Math.floor(untilMs / gapMs) }, (_, i) => ({ index: i, text: 'w', ms: (i + 1) * gapMs }));

describe('livePace', () => {
  test('rests for the first few seconds', () => {
    assert.equal(livePace(steady(300, 2500), 2500), 0);
  });

  test('a word every 400ms is 150 a minute', () => {
    assert.equal(livePace(steady(400, 20_000), 20_000), 150);
  });

  test('reads the recent pace, not the overall one', () => {
    // Slow for fifteen seconds, then fast for ten.
    const slow = steady(1000, 15_000);
    const fast = Array.from({ length: 40 }, (_, i) => ({ index: slow.length + i, text: 'w', ms: 15_000 + (i + 1) * 250 }));
    assert.equal(livePace([...slow, ...fast], 25_000), 240);
  });

  test('words from the future are not counted', () => {
    assert.equal(livePace(steady(400, 20_000), 10_000), 150);
  });
});

describe('the dial', () => {
  test('zones follow the comfortable band', () => {
    assert.equal(paceZone(0), 'waiting');
    assert.equal(paceZone(PACE_BAND.min - 1), 'slow');
    assert.equal(paceZone(PACE_BAND.min), 'good');
    assert.equal(paceZone(PACE_BAND.max), 'good');
    assert.equal(paceZone(PACE_BAND.max + 1), 'fast');
  });

  test('the needle rests hard left, points up mid-dial, and never leaves the dial', () => {
    assert.equal(needleAngle(0), -90);
    assert.equal(needleAngle((DIAL.min + DIAL.max) / 2), 0);
    assert.equal(needleAngle(9_999), 90);
    assert.equal(needleAngle(10), -90);
  });

  test('the comfortable band sits right of centre-left and left of hard right', () => {
    assert.ok(needleAngle(PACE_BAND.min) < 0 && needleAngle(PACE_BAND.max) > 0);
  });
});

describe('liveFillers', () => {
  test('counts "um" and "uh", in order', () => {
    assert.deepEqual(liveFillers('so um I think uh we should um go'), ['um', 'uh', 'um']);
  });

  test('does not count words that are only sometimes fillers', () => {
    assert.deepEqual(liveFillers('I like dogs and you know I actually mean it'), []);
  });

  test('empty', () => {
    assert.deepEqual(liveFillers(''), []);
  });
});

describe('pitchTrace', () => {
  test('always the requested length, padded at the front', () => {
    const t = pitchTrace([200, 200, 200], 6);
    assert.equal(t.length, 6);
    assert.deepEqual(t.slice(0, 3), [null, null, null]);
  });

  test("a steady pitch sits in the middle, whatever the speaker's voice", () => {
    assert.deepEqual(pitchTrace([110, 110, 110, 110], 4), [0.5, 0.5, 0.5, 0.5]);
    assert.deepEqual(pitchTrace([300, 300, 300, 300], 4), [0.5, 0.5, 0.5, 0.5]);
  });

  test('a rise goes up, and the line breaks where there was no pitch', () => {
    const t = pitchTrace([200, 200, null, 300, 300], 5);
    assert.equal(t[2], null);
    assert.ok((t[4] as number) > (t[0] as number));
    assert.ok(t.every((v) => v === null || (v >= 0 && v <= 1)));
  });

  test('only the most recent frames', () => {
    const t = pitchTrace([100, 100, 100, 400, 400], 2);
    assert.deepEqual(t, [0.5, 0.5]);
  });

  test('silence is all breaks', () => {
    assert.deepEqual(pitchTrace([null, null], 3), [null, null, null]);
  });
});
