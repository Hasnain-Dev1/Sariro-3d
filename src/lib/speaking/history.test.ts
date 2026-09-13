import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { parseHistory, addAttempt, progressOf, HISTORY_CAP, type Attempt } from './history';

const at = (score: number, dna: number[] = []): Attempt => ({ at: 1_700_000_000_000 + score, score, dna });

describe('parseHistory', () => {
  test('reads back what was written', () => {
    const list = [at(60, [50, 60, 70, 80, 90, 100]), at(72)];
    assert.deepEqual(parseHistory(JSON.stringify(list)), list);
  });

  test('nothing, junk and the wrong shape are all an empty history', () => {
    assert.deepEqual(parseHistory(null), []);
    assert.deepEqual(parseHistory('not json'), []);
    assert.deepEqual(parseHistory('{"score":80}'), []);
  });

  test('drops malformed attempts and keeps the good ones', () => {
    const raw = JSON.stringify([at(60), { score: 'high' }, { at: 1, score: 140 }, null, at(70)]);
    assert.deepEqual(parseHistory(raw).map((a) => a.score), [60, 70]);
  });

  test('a DNA of the wrong length is dropped, not the attempt', () => {
    const raw = JSON.stringify([{ at: 5, score: 66, dna: [1, 2, 3] }]);
    assert.deepEqual(parseHistory(raw), [{ at: 5, score: 66, dna: [] }]);
  });

  test('a best score from before history existed is carried over', () => {
    assert.deepEqual(parseHistory(null, '74'), [{ at: 0, score: 74, dna: [] }]);
  });

  test('but never over a real history, and never when it is junk', () => {
    assert.equal(parseHistory(JSON.stringify([at(60)]), '99').length, 1);
    assert.deepEqual(parseHistory(null, 'abc'), []);
    assert.deepEqual(parseHistory(null, '0'), []);
  });
});

describe('addAttempt', () => {
  test('appends, and forgets the oldest past the cap', () => {
    let list: Attempt[] = [];
    for (let i = 0; i < HISTORY_CAP + 5; i++) list = addAttempt(list, at(i % 100));
    assert.equal(list.length, HISTORY_CAP);
    assert.equal(list[0].score, 5);
  });
});

describe('progressOf', () => {
  test('a first attempt is the best, with nothing to compare', () => {
    assert.deepEqual(progressOf([at(64)]), {
      count: 1, previousBest: null, isBest: true, sinceFirst: 0, previous: null, recent: [64],
    });
  });

  test('up since the first go, and a new best', () => {
    const p = progressOf([at(58), at(66), at(63), at(72)])!;
    assert.equal(p.sinceFirst, 14);
    assert.equal(p.previousBest, 66);
    assert.equal(p.isBest, true);
    assert.equal(p.previous!.score, 63);
    assert.equal(p.count, 4);
  });

  test('matching the best is not a new best', () => {
    assert.equal(progressOf([at(70), at(70)])!.isBest, false);
  });

  test('the sparkline holds the most recent scores, oldest first', () => {
    const list = Array.from({ length: 14 }, (_, i) => at(50 + i));
    assert.deepEqual(progressOf(list, 4)!.recent, [60, 61, 62, 63]);
  });

  test('no attempts, no progress', () => {
    assert.equal(progressOf([]), null);
  });
});
