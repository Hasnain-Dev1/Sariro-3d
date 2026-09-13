import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { analyseSpeech, scoreBreakdown } from './analyse';
import {
  PROMPTS, nextPrompt, checkRecording, scoreBand, tilesFor, weakestPart, drillFor, shareMessage,
  MIN_SECONDS, MIN_WORDS,
} from './voice-check';

/** A realistic 30-second recording: words, and a loudness track with pauses. */
function recording(transcript: string, seconds = 30, pauseEveryFrames = 60) {
  const frames = Math.round((seconds * 1000) / 50);
  const levels = Array.from({ length: frames }, (_, i) => (i % pauseEveryFrames < 10 ? 0.005 : 0.3 + (i % 7) * 0.02));
  return analyseSpeech({ transcript, durationMs: seconds * 1000, levels, frameMs: 50 });
}

const words = (n: number, extra = '') => Array.from({ length: n }, (_, i) => `word${i}`).join(' ') + extra;

describe('prompts', () => {
  test('there are enough to try again with a different one', () => {
    assert.ok(PROMPTS.length >= 4);
    assert.equal(new Set(PROMPTS.map((p) => p.id)).size, PROMPTS.length, 'ids are unique');
  });

  test('the next prompt is never the one they just had', () => {
    for (let i = 0; i < 50; i++) {
      assert.notEqual(nextPrompt('food', () => i / 50).id, 'food');
    }
  });
});

describe('whether a recording can be scored', () => {
  test('no words is not a score of zero — it is a microphone problem, said so', () => {
    const v = checkRecording({ durationMs: 30_000, words: 0, heardWords: false });
    assert.equal(v.ok, false);
    assert.equal(!v.ok && v.reason, 'no_words');
  });

  test('too short to measure honestly', () => {
    const v = checkRecording({ durationMs: (MIN_SECONDS - 1) * 1000, words: 40, heardWords: true });
    assert.equal(!v.ok && v.reason, 'too_short');
  });

  test('too few words to measure honestly', () => {
    const v = checkRecording({ durationMs: 30_000, words: MIN_WORDS - 1, heardWords: true });
    assert.equal(!v.ok && v.reason, 'too_few_words');
  });

  test('a real attempt is scored', () => {
    assert.deepEqual(checkRecording({ durationMs: 30_000, words: 70, heardWords: true }), { ok: true });
  });
});

describe('what the score is called', () => {
  test('every score has a band, and the bands climb', () => {
    assert.equal(scoreBand(95).label, 'Stage-ready');
    assert.equal(scoreBand(75).label, 'Confident speaker');
    assert.equal(scoreBand(60).label, 'Strong start');
    assert.equal(scoreBand(10).label, 'Warming up');
  });

  test('the lowest band still says something a child is glad to read', () => {
    assert.doesNotMatch(scoreBand(0).blurb, /bad|poor|fail/i);
  });
});

describe('the four tiles', () => {
  test('they show the engine’s own numbers, not new ones', () => {
    const r = recording(words(70));
    const tiles = tilesFor(r, null);
    assert.deepEqual(tiles.map((t) => t.key), ['pace', 'fillers', 'pauses', 'expression']);
    assert.equal(tiles[0].value, String(r.pace.wpm));
    assert.equal(tiles[1].value, String(r.fillers.certain));
    assert.equal(tiles[2].value, String(r.pauses.count));
  });

  test('fillers name the word they actually said most', () => {
    const r = recording(`um so um I think ${words(60)} uh`);
    const fillers = tilesFor(r, null).find((t) => t.key === 'fillers')!;
    assert.match(fillers.hint, /"um"/);
  });

  test('a real filler is named before a word that is only sometimes one', () => {
    /* "I like it" is a verb. Naming "like" as their habit, when they also
       said "um", tells a child something false about their speech. */
    const r = recording(`I like it um ${words(60)} um`);
    const fillers = tilesFor(r, null).find((t) => t.key === 'fillers')!;
    assert.match(fillers.hint, /"um"/);
    assert.doesNotMatch(fillers.hint, /"like"/);
  });

  test('expression admits when there was not enough to hear', () => {
    const t = tilesFor(recording(words(70)), null).find((x) => x.key === 'expression')!;
    assert.equal(t.value, '—');
  });
});

describe('the one drill', () => {
  test('goes after the part of the score with the most room to grow', () => {
    assert.equal(weakestPart({ pace: 20, phrasing: 20, fillers: 4, pausing: 18, delivery: 20 }), 'fillers');
    assert.equal(weakestPart({ pace: 20, phrasing: 20, fillers: 20, pausing: 2, delivery: 20 }), 'pausing');
  });

  test('a filler-heavy answer gets the filler drill, naming their own filler', () => {
    const r = recording(`uh uh uh uh uh uh uh ${words(40)} uh uh uh`);
    const d = drillFor(r);
    assert.equal(d.title, 'The silent swap');
    assert.match(d.steps, /an "uh"/, 'the drill names the word they actually said, with the right article');
  });

  test('always returns something to try', () => {
    const d = drillFor(recording(words(70)));
    assert.ok(d.title.length > 0 && d.steps.length > 0 && d.seconds > 0);
  });

  test('matches the breakdown the score was built from', () => {
    const r = recording(words(70));
    const b = scoreBreakdown(r);
    assert.equal(b.pace + b.phrasing + b.fillers + b.pausing + b.delivery, r.score);
  });
});

test('the share message carries the real score and a way to try it', () => {
  const m = shareMessage(78, scoreBand(78), 'https://sariro.com/voice-check');
  assert.match(m, /78\/100/);
  assert.match(m, /Confident speaker/);
  assert.match(m, /sariro\.com\/voice-check/);
});
