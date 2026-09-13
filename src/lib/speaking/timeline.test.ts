import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { fillerAt, analyseSpeech } from './analyse';
import {
  observeWords, alignWordTimes, markersFor, contextFor, waveformBars, clockLabel,
  RECOGNITION_LAG_MS, type WordObservation,
} from './timeline';

const FRAME = 50;

/** Loudness with talking and silence exactly where the test says, in ms. */
function envelope(totalMs: number, talking: [number, number][]): number[] {
  return Array.from({ length: Math.round(totalMs / FRAME) }, (_, f) => {
    const ms = f * FRAME;
    return talking.some(([a, b]) => ms >= a && ms < b) ? 0.3 + (f % 5) * 0.02 : 0.004;
  });
}

const inTalking = (ms: number, talking: [number, number][]) => talking.some(([a, b]) => ms >= a && ms < b);

describe('fillerAt', () => {
  const words = ['so', 'um', 'you', 'know', 'i', 'like', 'it'];

  test('a certain filler', () => {
    assert.deepEqual(fillerAt(words, 1), { word: 'um', certain: true, length: 1 });
  });

  test('a two-word hedge is one filler, found at its first word', () => {
    assert.deepEqual(fillerAt(words, 2), { word: 'you know', certain: false, length: 2 });
  });

  test('a single hedge', () => {
    assert.deepEqual(fillerAt(words, 5), { word: 'like', certain: false, length: 1 });
  });

  test('an ordinary word, and past the end', () => {
    assert.equal(fillerAt(words, 0), null);
    assert.equal(fillerAt(words, 99), null);
  });

  test('"likely" is not "like"', () => {
    assert.equal(fillerAt(['likely'], 0), null);
  });
});

describe('observeWords', () => {
  test('new positions get the time they first appeared', () => {
    let seen: WordObservation[] = [];
    seen = observeWords(seen, 'my favourite', 900);
    seen = observeWords(seen, 'my favourite food is', 1400);
    assert.deepEqual(seen.map((o) => [o.index, o.text, o.ms]), [
      [0, 'my', 900], [1, 'favourite', 900], [2, 'food', 1400], [3, 'is', 1400],
    ]);
  });

  test('a revision keeps the first time, and a shorter interim changes nothing', () => {
    let seen = observeWords([], 'my favourite foo', 900);
    const before = seen;
    seen = observeWords(seen, 'my favourite', 1000);
    assert.equal(seen, before);
    seen = observeWords(seen, 'my favourite food', 1100);
    assert.equal(seen[2].ms, 900);
  });
});

describe('alignWordTimes', () => {
  // Silence, a phrase, a long pause, a phrase, silence.
  const talking: [number, number][] = [[1000, 3000], [4500, 6500]];
  const levels = envelope(7000, talking);
  const text = 'one two three four five um seven eight nine ten';

  test('batched words are spread over the talking before them, never into a pause', () => {
    // The recogniser shows each phrase all at once, a moment after it ends.
    const obs: WordObservation[] = [
      ...[0, 1, 2, 3, 4].map((i) => ({ index: i, text: 'x', ms: 3300 })),
      ...[5, 6, 7, 8, 9].map((i) => ({ index: i, text: 'x', ms: 6900 })),
    ];
    const timed = alignWordTimes(text, obs, 7000, levels, FRAME);
    assert.equal(timed.length, 10);
    timed.forEach((t) => assert.ok(inTalking(t.ms, talking), `${t.word} at ${t.ms} is in a silence`));
    timed.slice(0, 5).forEach((t) => assert.ok(t.ms >= 1000 && t.ms < 3000, `${t.word} at ${t.ms}`));
    timed.slice(5).forEach((t) => assert.ok(t.ms >= 4500 && t.ms < 6500, `${t.word} at ${t.ms}`));
  });

  test('times never go backwards', () => {
    const obs: WordObservation[] = [
      { index: 0, text: 'x', ms: 2000 }, { index: 1, text: 'x', ms: 1600 }, { index: 2, text: 'x', ms: 5200 },
    ];
    const timed = alignWordTimes(text, obs, 7000, levels, FRAME);
    for (let i = 1; i < timed.length; i++) assert.ok(timed[i].ms >= timed[i - 1].ms);
  });

  test('an estimate that lands in a pause goes to the nearer edge of it', () => {
    // Shown at 3700: minus the lag is 3250, just after the first phrase ended.
    const timed = alignWordTimes('hello', [{ index: 0, text: 'hello', ms: 3250 + RECOGNITION_LAG_MS }], 7000, levels, FRAME);
    assert.ok(timed[0].ms >= 2500 && timed[0].ms < 3000, `hello at ${timed[0].ms}`);
  });

  test('with nothing observed, words spread evenly through the talking', () => {
    const timed = alignWordTimes(text, [], 7000, levels, FRAME);
    assert.equal(timed[0].ms, 1000);
    timed.forEach((t) => assert.ok(inTalking(t.ms, talking), `${t.word} at ${t.ms}`));
    assert.ok(timed.slice(0, 5).every((t) => t.ms < 3000));
    assert.ok(timed.slice(5).every((t) => t.ms >= 4500));
  });

  test('words the recogniser never showed come after the last one it did', () => {
    const obs = [0, 1, 2].map((i) => ({ index: i, text: 'x', ms: 2200 }));
    const timed = alignWordTimes(text, obs, 7000, levels, FRAME);
    assert.ok(timed[3].ms >= timed[2].ms);
    assert.ok(timed[9].ms <= 7000);
    assert.ok(timed.slice(3).every((t) => inTalking(t.ms, talking)));
  });

  test('with no loudness at all, times still fit the recording in order', () => {
    const timed = alignWordTimes(text, [], 5000, [], FRAME);
    assert.equal(timed[0].ms, 0);
    for (let i = 1; i < timed.length; i++) assert.ok(timed[i].ms > timed[i - 1].ms);
    assert.ok(timed[9].ms < 5000);
  });

  test('an empty transcript has no times', () => {
    assert.deepEqual(alignWordTimes('', [], 5000, levels, FRAME), []);
  });
});

describe('markersFor', () => {
  const talking: [number, number][] = [[1000, 3000], [4500, 6000], [6500, 8000]];
  const levels = envelope(9000, talking);
  const text = 'so today um i want to talk about you know my dog and why i like him';
  const timed = alignWordTimes(text, [], 9000, levels, FRAME);
  const markers = markersFor(timed, levels, FRAME);

  test('every filler the score counts is pinned, and only those', () => {
    const fillers = markers.filter((m) => m.kind === 'filler').map((m) => m.label);
    assert.deepEqual(fillers, ['um', 'you know', 'like']);
    const report = analyseSpeech({ transcript: text, durationMs: 9000, levels, frameMs: FRAME });
    const counted = report.fillers.breakdown.reduce((n, b) => n + b.count, 0);
    assert.equal(fillers.length, counted);
  });

  test('a filler is pinned at its own word', () => {
    const um = markers.find((m) => m.label === 'um')!;
    assert.equal(um.ms, timed[um.index].ms);
    assert.equal(timed[um.index].word, 'um');
    assert.equal(um.certain, true);
    assert.equal(markers.find((m) => m.label === 'like')!.certain, false);
  });

  test('the long pause in the middle is pinned; the short one and the silent ends are not', () => {
    const pauses = markers.filter((m) => m.kind === 'pause');
    assert.equal(pauses.length, 1);
    assert.equal(pauses[0].ms, 3000);
    assert.equal(pauses[0].durationMs, 1500);
    assert.equal(pauses[0].label, '1.5s pause');
    assert.ok(timed[pauses[0].index].ms >= 4500, 'points at the first word after the pause');
  });

  test('in time order', () => {
    for (let i = 1; i < markers.length; i++) assert.ok(markers[i].ms >= markers[i - 1].ms);
  });

  test('nothing to pin in a recording with no words', () => {
    assert.deepEqual(markersFor([], levels, FRAME), []);
  });
});

describe('contextFor', () => {
  const timed = 'my favourite food is um pani puri because you know it is great'
    .split(' ').map((word, i) => ({ word, ms: i * 400 }));

  test('the words either side of a filler', () => {
    assert.deepEqual(
      contextFor(timed, { kind: 'filler', ms: 1600, label: 'um', index: 4, certain: true }),
      { before: 'favourite food is', focus: 'um', after: 'pani puri because' }
    );
  });

  test('a two-word filler is skipped whole', () => {
    assert.deepEqual(
      contextFor(timed, { kind: 'filler', ms: 3200, label: 'you know', index: 8, certain: false }),
      { before: 'pani puri because', focus: 'you know', after: 'it is great' }
    );
  });

  test('a pause sits between the words around it', () => {
    const c = contextFor(timed, { kind: 'pause', ms: 1500, label: '1.0s pause', index: 4, durationMs: 1000 });
    assert.equal(c.before, 'favourite food is');
    assert.equal(c.after, 'um pani puri');
  });

  test('at the very start there is nothing before', () => {
    assert.equal(contextFor(timed, { kind: 'filler', ms: 0, label: 'my', index: 0 }).before, '');
  });
});

describe('waveformBars', () => {
  test('the requested number of bars, the loudest at 1', () => {
    const bars = waveformBars([0.1, 0.2, 0.4, 0.2, 0.1, 0.05, 0, 0], 4);
    assert.equal(bars.length, 4);
    assert.equal(Math.max(...bars), 1);
    assert.equal(bars[3], 0);
  });

  test('more bars than frames still draws', () => {
    assert.equal(waveformBars([0.5, 0.25], 6).length, 6);
  });

  test('silence and nothing', () => {
    assert.deepEqual(waveformBars([0, 0], 3), [0, 0, 0]);
    assert.deepEqual(waveformBars([], 3), []);
  });
});

test('clockLabel', () => {
  assert.equal(clockLabel(0), '0:00');
  assert.equal(clockLabel(7_400), '0:07');
  assert.equal(clockLabel(62_000), '1:02');
  assert.equal(clockLabel(-5), '0:00');
});
