import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  SOUND_PATTERNS, soundPattern, sortRound, seeded, stampFor, heardWord,
  parsePassport, stampPassport,
} from './sounds';

describe('the sound patterns', () => {
  test('ids are unique, and there is a real set of them', () => {
    const ids = SOUND_PATTERNS.map((p) => p.id);
    assert.equal(new Set(ids).size, ids.length);
    assert.ok(ids.length >= 12);
    assert.ok(soundPattern('q') && soundPattern('ed'), 'the founder’s examples are here');
  });

  test('Q really does have three ways', () => {
    assert.deepEqual(soundPattern('q')!.ways.map((w) => w.sounds), ['kw', 'k', 'kyoo']);
  });

  for (const p of SOUND_PATTERNS) {
    test(`${p.id}: every way has words, and no word is filed under two sounds`, () => {
      assert.ok(p.ways.length >= 2, 'a pattern needs at least two sounds to sort between');
      const seen = new Map<string, string>();
      for (const way of p.ways) {
        assert.ok(way.words.length >= 2, `${way.id} has too few words`);
        for (const { word } of way.words) {
          const key = word.toLowerCase();
          assert.ok(!seen.has(key), `"${word}" is under both ${seen.get(key)} and ${way.id}`);
          seen.set(key, way.id);
        }
      }
      assert.ok(p.realWorld.length >= 2, 'real-world lines');
      assert.ok(p.traps.length >= 1, 'at least one trap');
      assert.ok(p.ways.reduce((n, w) => n + w.words.length, 0) >= 8, 'enough words for a full round');
    });
  }
});

describe('sortRound', () => {
  test('eight words, every sound represented, same round for the same seed', () => {
    for (const p of SOUND_PATTERNS) {
      const round = sortRound(p, 8, seeded(7));
      assert.equal(round.length, 8, p.id);
      const ways = new Set(round.map((r) => r.wayId));
      assert.equal(ways.size, Math.min(p.ways.length, 8), `${p.id} leaves a sound out`);
      assert.equal(new Set(round.map((r) => r.word.word)).size, 8, `${p.id} repeats a word`);
    }
    assert.deepEqual(sortRound(soundPattern('ed')!, 8, seeded(3)), sortRound(soundPattern('ed')!, 8, seeded(3)));
  });

  test('every item is filed under the way that really lists it', () => {
    const p = soundPattern('ough')!;
    for (const item of sortRound(p, 8, seeded(11))) {
      assert.ok(p.ways.find((w) => w.id === item.wayId)!.words.includes(item.word));
    }
  });
});

test('stampFor', () => {
  assert.equal(stampFor(8, 8), 'gold');
  assert.equal(stampFor(7, 8), 'gold');
  assert.equal(stampFor(6, 8), 'silver');
  assert.equal(stampFor(5, 8), 'try-again');
  assert.equal(stampFor(0, 0), 'try-again');
});

test('heardWord forgives case, punctuation and a leading article, and nothing else', () => {
  assert.ok(heardWord({ word: 'queue' }, 'Queue.'));
  assert.ok(heardWord({ word: 'to record' }, 'I want to record'));
  assert.ok(heardWord({ word: 'Q&A' }, 'q and a'));
  assert.ok(!heardWord({ word: 'vest' }, 'west'));
  assert.ok(!heardWord({ word: 'think' }, 'sink'));
});

test('the passport keeps the best stamp and ignores junk', () => {
  let p = parsePassport('{"q":{"best":"silver","at":"x"},"nope":{"best":"gold"},"ed":{"best":"weird"}}');
  assert.deepEqual(Object.keys(p), ['q']);
  p = stampPassport(p, 'q', 'gold', 'y');
  assert.equal(p.q.best, 'gold');
  assert.equal(stampPassport(p, 'q', 'silver', 'z').q.best, 'gold');
  assert.equal(stampPassport(p, 'th', 'try-again', 'z').th, undefined);
  assert.deepEqual(parsePassport('not json'), {});
});
