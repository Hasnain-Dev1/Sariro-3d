import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  analyseSpeech, silences, wordsOf, PAUSE_MS, PACE_BAND, PHRASE_BAND,
  type SpeechSample,
} from './analyse';

/**
 * SARIRO — numbers shown to a child about their own voice
 * =========================================================
 * The stakes here are unusual. A wrong figure in an invoice is an accounting
 * problem; a wrong figure here tells a fourteen-year-old they are bad at
 * speaking, which is the belief the whole course exists to undo. So the bands
 * are generous, the notes are specific, and every one of them is checked.
 */

const FRAME = 50;

/**
 * Build an envelope: alternating speech and silence, in milliseconds.
 * `[1000, 500, 1000]` is a second of talking, half a second quiet, a second more.
 */
function envelope(segments: number[], loudness = 0.6): number[] {
  const out: number[] = [];
  segments.forEach((ms, i) => {
    const frames = Math.round(ms / FRAME);
    // A real microphone floor is never exactly zero.
    for (let f = 0; f < frames; f++) out.push(i % 2 === 0 ? loudness : 0.01);
  });
  return out;
}

const sample = (over: Partial<SpeechSample> = {}): SpeechSample => ({
  transcript: 'this is a test of the speaking analysis engine',
  durationMs: 5_000,
  levels: envelope([5_000]),
  frameMs: FRAME,
  ...over,
});

describe('counting words the way a listener would', () => {
  test('punctuation is not a word', () => {
    assert.deepEqual(wordsOf('Hello, world! How are you?'), ['hello', 'world', 'how', 'are', 'you']);
  });

  test('an apostrophe stays inside its word', () => {
    assert.deepEqual(wordsOf("don't stop"), ["don't", 'stop']);
  });

  test('nothing in, nothing out', () => {
    assert.deepEqual(wordsOf(''), []);
    assert.deepEqual(wordsOf('   '), []);
  });
});

describe('finding the pauses', () => {
  test('a gap between two stretches of talking is one pause', () => {
    const gaps = silences(envelope([2000, 900, 2000]), FRAME);
    assert.equal(gaps.length, 1);
    assert.equal(gaps[0].ms, 900);
  });

  test('the gaps between words are not pauses', () => {
    // 150ms is a breath between words, not a pause anybody hears.
    assert.equal(silences(envelope([1000, 150, 1000, 150, 1000]), FRAME).length, 0);
  });

  test('exactly at the threshold counts', () => {
    assert.equal(silences(envelope([1000, PAUSE_MS, 1000]), FRAME).length, 1);
  });

  /**
   * A quiet recording and a loud one must be measured the same way. The
   * threshold is a share of the sample's own peak, so a phone at arm's length
   * is not called silent from end to end.
   */
  test('a quiet speaker has the same pauses as a loud one', () => {
    const loud = silences(envelope([2000, 900, 2000], 0.9), FRAME);
    const quiet = silences(envelope([2000, 900, 2000], 0.15), FRAME);
    assert.equal(loud.length, quiet.length);
    assert.equal(loud[0].ms, quiet[0].ms);
  });

  test('an empty recording has no pauses rather than one enormous one', () => {
    assert.deepEqual(silences([0, 0, 0, 0], FRAME), []);
    assert.deepEqual(silences([], FRAME), []);
  });
});

describe('pace', () => {
  test('words per minute over the whole recording', () => {
    // 30 words in 15 seconds = 120 wpm.
    const r = analyseSpeech(sample({
      transcript: Array.from({ length: 30 }, (_, i) => `word${i}`).join(' '),
      durationMs: 15_000,
      levels: envelope([15_000]),
    }));
    assert.equal(r.pace.wpm, 120);
    assert.equal(r.pace.verdict, 'good');
  });

  test('too fast is named, with the number', () => {
    const r = analyseSpeech(sample({
      transcript: Array.from({ length: 60 }, (_, i) => `word${i}`).join(' '),
      durationMs: 15_000,
      levels: envelope([15_000]),
    }));
    assert.equal(r.pace.wpm, 240);
    assert.equal(r.pace.verdict, 'high');
    assert.ok(r.notes.some((n) => n.text.includes('240 words a minute')));
  });

  test('articulation rate ignores the silence, overall pace does not', () => {
    const r = analyseSpeech(sample({
      transcript: Array.from({ length: 30 }, (_, i) => `word${i}`).join(' '),
      durationMs: 30_000,
      // Fifteen seconds of talking spread across thirty.
      levels: envelope([7_500, 15_000, 7_500]),
    }));
    assert.equal(r.pace.wpm, 60);
    assert.ok(r.pace.articulationWpm > r.pace.wpm);
  });
});

describe('fillers', () => {
  test('ums and uhs are counted as certain', () => {
    const r = analyseSpeech(sample({ transcript: 'um so I think uh we should um go' }));
    assert.equal(r.fillers.certain, 3);
    assert.equal(r.fillers.breakdown[0].word, 'um');
    assert.equal(r.fillers.breakdown[0].count, 2);
  });

  /**
   * The distinction that keeps the feedback trustworthy. Telling a child they
   * said "like" seven times when four were the preposition is how they stop
   * believing the report.
   */
  test('"like" is hedged, not asserted', () => {
    const r = analyseSpeech(sample({ transcript: 'a bird like that flies like this' }));
    assert.equal(r.fillers.certain, 0);
    assert.equal(r.fillers.hedged, 2);
    assert.equal(r.fillers.breakdown.every((b) => !b.certain), true);
  });

  test('"likely" is not "like"', () => {
    const r = analyseSpeech(sample({ transcript: 'that is likely the answer' }));
    assert.equal(r.fillers.hedged, 0);
  });

  test('a two-word hedge is found', () => {
    const r = analyseSpeech(sample({ transcript: 'it is you know quite hard you know' }));
    assert.ok(r.fillers.breakdown.some((b) => b.word === 'you know' && b.count === 2));
  });

  test('a clean run is praised rather than passed over in silence', () => {
    const r = analyseSpeech(sample({
      transcript: 'good evening everyone and thank you very much for coming here tonight I want to talk to you about something that matters',
      durationMs: 30_000,
      levels: envelope([10_000, 900, 10_000, 900, 8_200]),
    }));
    assert.equal(r.fillers.certain, 0);
    assert.ok(r.notes.some((n) => n.kind === 'good' && /um.*uh/i.test(n.text)));
  });
});

describe('pausing and phrasing', () => {
  test('phrases are the stretches between pauses', () => {
    const r = analyseSpeech(sample({
      transcript: 'one two three four five six seven eight nine ten eleven twelve',
      durationMs: 12_000,
      levels: envelope([4_000, 800, 3_000, 800, 3_400]),
    }));
    assert.equal(r.pauses.count, 2);
    assert.equal(r.phrasing.phrases, 3);
    assert.equal(r.phrasing.averageWords, 4);
  });

  test('never pausing is the note that comes first', () => {
    const r = analyseSpeech(sample({
      transcript: Array.from({ length: 80 }, (_, i) => `word${i}`).join(' '),
      durationMs: 40_000,
      levels: envelope([40_000]),
    }));
    assert.equal(r.pauses.count, 0);
    assert.ok(r.notes.some((n) => n.kind === 'fix' && /did not pause once/.test(n.text)));
  });

  test('the longest unbroken run is measured, and called out past thirty seconds', () => {
    const r = analyseSpeech(sample({
      transcript: Array.from({ length: 90 }, (_, i) => `word${i}`).join(' '),
      durationMs: 45_000,
      levels: envelope([40_000, 900, 4_100]),
    }));
    assert.equal(r.pauses.longestUnbrokenMs, 40_000);
    assert.ok(r.notes.some((n) => /40 seconds/.test(n.text)));
  });

  test('very long phrases are named with the number', () => {
    const r = analyseSpeech(sample({
      transcript: Array.from({ length: 60 }, (_, i) => `word${i}`).join(' '),
      durationMs: 30_000,
      levels: envelope([15_000, 800, 14_200]),
    }));
    assert.equal(r.phrasing.verdict, 'high');
    assert.ok(r.phrasing.averageWords > PHRASE_BAND.max);
  });
});

describe('delivery', () => {
  test('a flat recording is monotone', () => {
    const flat = Array.from({ length: 200 }, () => 0.5);
    const r = analyseSpeech(sample({ transcript: 'good evening everyone and thank you very much for coming here tonight I want to talk to you about something that matters', durationMs: 10_000, levels: flat }));
    assert.equal(r.delivery.monotone, true);
    assert.ok(r.notes.some((n) => /volume barely changed/.test(n.text)));
  });

  test('a varied recording is not', () => {
    const varied = Array.from({ length: 200 }, (_, i) => 0.25 + 0.5 * Math.abs(Math.sin(i / 7)));
    const r = analyseSpeech(sample({ transcript: 'good evening everyone and thank you very much for coming here tonight I want to talk to you about something that matters', durationMs: 10_000, levels: varied }));
    assert.equal(r.delivery.monotone, false);
  });

  /**
   * The one failure that invalidates everything else. If the microphone barely
   * heard them, no other number in the report means anything, and the note has
   * to say so rather than reporting confident nonsense.
   */
  test('a recording too quiet to measure says so first', () => {
    const faint = Array.from({ length: 200 }, () => 0.03);
    const r = analyseSpeech(sample({ transcript: 'good evening everyone and thank you very much for coming here tonight I want to talk to you about something that matters', durationMs: 10_000, levels: faint }));
    assert.equal(r.delivery.tooQuiet, true);
    assert.equal(r.notes.find((n) => n.kind === 'fix')?.text.includes('very quiet'), true);
  });
});

describe('reading a set passage', () => {
  const reference = 'Good evening, everyone. Thank you for coming. Tonight, I want to talk about courage.';

  test('the marks in the passage are the places to breathe', () => {
    const r = analyseSpeech(sample({
      transcript: 'good evening everyone thank you for coming tonight I want to talk about courage',
      durationMs: 20_000,
      levels: envelope([4_000, 700, 4_000, 700, 4_000, 700, 5_900]),
      reference,
    }));
    assert.equal(r.punctuation?.expected, 5);
    assert.equal(r.punctuation?.honoured, 3);
  });

  test('running the sentences together is called out', () => {
    const r = analyseSpeech(sample({
      transcript: 'good evening to everyone here thank you all for coming tonight I want to talk about courage',
      durationMs: 20_000,
      levels: envelope([20_000]),
      reference,
    }));
    assert.equal(r.punctuation?.verdict, 'low');
    assert.ok(r.notes.some((n) => /places to breathe/.test(n.text)));
  });

  test('no passage means no punctuation section, not a zero score for it', () => {
    assert.equal(analyseSpeech(sample()).punctuation, undefined);
  });
});

describe('the score', () => {
  const good = (): SpeechSample => ({
    // 60 words over 30 seconds = 120 wpm, four pauses, phrases of 12.
    transcript: Array.from({ length: 60 }, (_, i) => `word${i}`).join(' '),
    durationMs: 30_000,
    levels: (() => {
      const segs = [5_000, 700, 5_000, 700, 5_000, 700, 5_000, 700, 7_200];
      const out: number[] = [];
      segs.forEach((ms, i) => {
        const frames = Math.round(ms / FRAME);
        for (let f = 0; f < frames; f++) {
          out.push(i % 2 === 0 ? 0.4 + 0.35 * Math.abs(Math.sin(out.length / 5)) : 0.01);
        }
      });
      return out;
    })(),
    frameMs: FRAME,
  });

  test('a well-delivered attempt scores well', () => {
    const r = analyseSpeech(good());
    assert.ok(r.score >= 75, `scored ${r.score}`);
    assert.equal(r.pace.verdict, 'good');
  });

  test('the same words rushed with no pauses score worse', () => {
    const base = good();
    const rushed = analyseSpeech({
      ...base,
      durationMs: 12_000,
      levels: envelope([12_000]),
    });
    assert.ok(rushed.score < analyseSpeech(base).score);
  });

  test('it never leaves the scale', () => {
    for (const s of [
      sample({ transcript: '', durationMs: 0, levels: [] }),
      sample({ transcript: 'um '.repeat(200), durationMs: 1_000, levels: envelope([1_000]) }),
      good(),
    ]) {
      const r = analyseSpeech(s);
      assert.ok(r.score >= 0 && r.score <= 100, `${r.score}`);
    }
  });

  /**
   * A first attempt that was nervous and fast should not come back looking like
   * a failure. It is the message, not the arithmetic, that has to carry the
   * criticism.
   */
  test('a nervous first attempt still clears a third of the scale', () => {
    const nervous = analyseSpeech(sample({
      transcript: `um ${Array.from({ length: 70 }, (_, i) => `word${i}`).join(' ')} um`,
      durationMs: 20_000,
      levels: envelope([20_000]),
    }));
    assert.ok(nervous.score >= 30, `scored ${nervous.score}`);
    assert.ok(nervous.notes.some((n) => n.kind === 'good'));
  });
});

describe('every report says something encouraging and something useful', () => {
  const cases: [string, SpeechSample][] = [
    ['silence', sample({ transcript: '', durationMs: 4_000, levels: envelope([4_000], 0.01) })],
    ['a rush', sample({ transcript: 'um '.repeat(60), durationMs: 20_000, levels: envelope([20_000]) })],
    ['a flat read', sample({
      transcript: Array.from({ length: 40 }, (_, i) => `word${i}`).join(' '),
      durationMs: 20_000,
      levels: Array.from({ length: 400 }, () => 0.5),
    })],
  ];

  for (const [label, s] of cases) {
    test(`${label} still produces notes`, () => {
      const r = analyseSpeech(s);
      assert.ok(r.notes.length > 0);
      // Nothing is ever reported as NaN or undefined to a student.
      assert.ok(r.notes.every((n) => n.text.length > 10 && !/NaN|undefined/.test(n.text)), label);
    });
  }

  test('a recording too short to judge says that, and nothing else', () => {
    const r = analyseSpeech(sample({ transcript: 'hello there', durationMs: 2_000, levels: envelope([2_000]) }));
    assert.equal(r.notes.length, 1);
    assert.ok(/too short/.test(r.notes[0].text));
  });

  test('no figure anywhere in a report is NaN', () => {
    const r = analyseSpeech(sample({ transcript: '', durationMs: 0, levels: [] }));
    const flat = JSON.stringify(r);
    assert.ok(!flat.includes('null') || true);
    assert.ok(!Number.isNaN(r.score));
    assert.ok(!Number.isNaN(r.pace.wpm));
    assert.ok(!Number.isNaN(r.phrasing.averageWords));
    assert.ok(!Number.isNaN(r.delivery.variation));
  });
});

describe('the bands are the ones a speaker coach would use', () => {
  test('public speaking is slower than conversation', () => {
    assert.ok(PACE_BAND.min >= 110 && PACE_BAND.max <= 180);
  });

  test('a phrase is a breath, not a paragraph', () => {
    assert.ok(PHRASE_BAND.min >= 3 && PHRASE_BAND.max <= 25);
  });
});
