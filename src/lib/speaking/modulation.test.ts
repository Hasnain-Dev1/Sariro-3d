import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { analyseModulation, MIN_FRAMES, MIN_VOICED } from './modulation';
import { detectPitch, semitones, MIN_HZ, MAX_HZ } from './pitch';

/**
 * SARIRO — did the voice move, and where did it give up
 * ============================================================================
 * Two things a speaking teacher says constantly, both invisible to the
 * speaker: "you are flat" and "you trailed off". Both are measurable from
 * frames the lab already records and used to throw away.
 *
 * The tests are weighted at the false accusations. Telling a careful child
 * their voice is flat, or a child who paused for breath that they faded,
 * teaches them to stop reading aloud.
 */

/* ── Signal builders ─────────────────────────────────────────────────────── */

/** A pure tone, the shape getFloatTimeDomainData hands over. */
const tone = (hz: number, sampleRate = 44100, n = 2048, amp = 0.5): Float32Array => {
  const buf = new Float32Array(n);
  for (let i = 0; i < n; i++) buf[i] = amp * Math.sin((2 * Math.PI * hz * i) / sampleRate);
  return buf;
};

const frames = (n: number, level: number) => new Array(n).fill(level);
const pitched = (n: number, hz: number) => new Array<number | null>(n).fill(hz);

describe('detectPitch', () => {
  test('finds the fundamental of a clean tone', () => {
    const hz = detectPitch(tone(220), 44100);
    assert.ok(hz !== null);
    assert.ok(Math.abs(hz - 220) < 6, `expected ~220Hz, got ${hz}`);
  });

  test('a child voice at 300Hz is found, not an octave out', () => {
    // The classic FFT failure: reporting a harmonic. Autocorrelation is used
    // precisely to avoid telling a child they speak an octave higher.
    const hz = detectPitch(tone(300), 44100);
    assert.ok(hz !== null && Math.abs(hz - 300) < 10, `got ${hz}`);
  });

  test('silence has no pitch', () => {
    assert.equal(detectPitch(new Float32Array(2048), 44100), null);
  });

  test('a whisper-quiet frame is refused rather than guessed at', () => {
    // A wrong pitch is worse than a missing one: missing is skipped, wrong
    // drags the range it lands in.
    assert.equal(detectPitch(tone(200, 44100, 2048, 0.001), 44100), null);
  });

  test('noise is refused', () => {
    const buf = new Float32Array(2048);
    for (let i = 0; i < buf.length; i++) buf[i] = Math.random() * 2 - 1;
    const hz = detectPitch(buf, 44100);
    assert.ok(hz === null, `noise should not have a pitch, got ${hz}`);
  });

  test('nothing outside a human range is ever returned', () => {
    for (const hz of [40, 60, 900, 2000]) {
      const got = detectPitch(tone(hz), 44100);
      if (got !== null) {
        assert.ok(got >= MIN_HZ && got <= MAX_HZ, `${hz}Hz produced ${got}`);
      }
    }
  });

  test('a bad sample rate does not throw mid-recording', () => {
    assert.equal(detectPitch(tone(200), 0), null);
    assert.equal(detectPitch(new Float32Array(0), 44100), null);
  });
});

describe('semitones', () => {
  test('an octave is twelve', () => {
    assert.equal(Math.round(semitones(200, 400)), 12);
  });

  test('the same distance sounds the same at any pitch — the whole reason', () => {
    // 100->200 and 200->400 are one octave each. In hertz they look like 100
    // and 200, which would make every deep voice look expressive.
    assert.equal(Math.round(semitones(100, 200)), Math.round(semitones(200, 400)));
  });

  test('zero or negative is zero, not NaN', () => {
    assert.equal(semitones(0, 200), 0);
    assert.equal(semitones(200, 0), 0);
  });
});

describe('analyseModulation — refusing to judge', () => {
  test('a recording too short says so', () => {
    const r = analyseModulation({ levels: frames(10, 0.2), pitches: pitched(10, 200), frameMs: 50 });
    assert.equal(r.scored, false);
  });

  test('enough frames but almost no voiced ones asks them to move closer', () => {
    // Not "your voice is flat". They were too quiet to measure, which is a
    // different sentence and a different fix.
    const r = analyseModulation({
      levels: frames(200, 0.2),
      pitches: new Array<number | null>(200).fill(null),
      frameMs: 50,
    });
    assert.equal(r.rangeSemitones, 0);
    assert.match(r.notes[0].text, /quiet|closer/i);
    assert.equal(r.notes.some((n) => /flat/.test(n.text)), false);
  });

  test('the floors are meaningful', () => {
    assert.ok(MIN_FRAMES >= 20 && MIN_VOICED >= 10);
  });
});

describe('range and band', () => {
  test('a genuinely monotone delivery is flat', () => {
    const r = analyseModulation({ levels: frames(200, 0.2), pitches: pitched(200, 200), frameMs: 50 });
    assert.equal(r.band, 'flat');
    assert.ok(r.rangeSemitones < 3.5);
  });

  test('a voice moving an octave is lively', () => {
    const pitches: (number | null)[] = [];
    for (let i = 0; i < 200; i++) pitches.push(i % 2 === 0 ? 200 : 400);
    const r = analyseModulation({ levels: frames(200, 0.2), pitches, frameMs: 50 });
    assert.equal(r.band, 'lively');
    assert.ok(r.expressiveness > 60);
  });

  test('one squeak does not make a monotone child operatic', () => {
    // 10th-90th percentile, not min-max. The outliers are also exactly where
    // a pitch detector is least reliable.
    const pitches = pitched(200, 200);
    pitches[7] = 480;
    pitches[9] = 75;
    const r = analyseModulation({ levels: frames(200, 0.2), pitches, frameMs: 50 });
    assert.equal(r.band, 'flat', 'two stray frames must not become a range');
  });

  test('ordinary conversational movement is steady, not criticised', () => {
    // ~5 semitones. A careful child is not a flat one, and telling them so
    // teaches them to stop reading aloud.
    const pitches: (number | null)[] = [];
    for (let i = 0; i < 200; i++) pitches.push(i % 2 === 0 ? 200 : 268);
    const r = analyseModulation({ levels: frames(200, 0.2), pitches, frameMs: 50 });
    assert.equal(r.band, 'steady');
    assert.equal(r.notes.some((n) => /flat/.test(n.text)), false);
  });
});

describe('the fade — the note nobody can hear in themselves', () => {
  test('starting strong and trailing off is caught and named', () => {
    const levels = [...frames(70, 0.4), ...frames(70, 0.3), ...frames(70, 0.12)];
    const r = analyseModulation({ levels, pitches: pitched(210, 200), frameMs: 50 });
    assert.ok(r.energyDrift <= -25, `expected a real drop, got ${r.energyDrift}`);
    const fix = r.notes.find((n) => n.kind === 'fix');
    assert.ok(fix);
    assert.match(fix.text, /louder than you finished|last sentence/);
  });

  test('a steady delivery is not accused of fading', () => {
    const r = analyseModulation({ levels: frames(210, 0.3), pitches: pitched(210, 200), frameMs: 50 });
    assert.ok(Math.abs(r.energyDrift) < 25);
    assert.equal(r.notes.some((n) => /louder than you finished/.test(n.text)), false);
  });

  test('finishing stronger is praised, because almost nobody does', () => {
    const levels = [...frames(70, 0.15), ...frames(70, 0.25), ...frames(70, 0.35)];
    const pitches: (number | null)[] = [];
    for (let i = 0; i < 210; i++) pitches.push(i % 2 === 0 ? 200 : 268);
    const r = analyseModulation({ levels, pitches, frameMs: 50 });
    assert.ok(r.energyDrift >= 15);
    assert.ok(r.notes.some((n) => /finished stronger/.test(n.text)));
  });

  test('the fade outranks flatness — one thing to fix, and this is the one', () => {
    const levels = [...frames(70, 0.4), ...frames(70, 0.3), ...frames(70, 0.1)];
    const r = analyseModulation({ levels, pitches: pitched(210, 200), frameMs: 50 });
    assert.equal(r.notes.filter((n) => n.kind === 'fix').length, 1);
    assert.match(r.notes.find((n) => n.kind === 'fix')!.text, /louder than you finished/);
  });
});

describe('emphasis', () => {
  test('peaks are relative to this speaker, not an absolute volume', () => {
    // A quiet child emphasising is still emphasising. An absolute threshold
    // would only ever find loud children.
    const quiet = frames(200, 0.05);
    for (let i = 10; i < 200; i += 40) quiet[i] = 0.2;
    const r = analyseModulation({ levels: quiet, pitches: pitched(200, 200), frameMs: 50 });
    assert.ok(r.emphasisPerMin > 0, 'a quiet speaker must still be able to emphasise');
  });

  test('a flat wall of sound has no emphasis and is told so gently', () => {
    const pitches: (number | null)[] = [];
    for (let i = 0; i < 200; i++) pitches.push(i % 2 === 0 ? 200 : 268);
    const r = analyseModulation({ levels: frames(200, 0.3), pitches, frameMs: 50 });
    assert.equal(r.emphasisPerMin, 0);
    assert.ok(r.notes.some((n) => /Nothing stood out/.test(n.text)));
  });
});

describe('the drawable arc', () => {
  test('is normalised so a quiet recording has the same shape as a loud one', () => {
    const shape = [...frames(60, 0.1), ...frames(60, 0.4), ...frames(60, 0.2)];
    const loud = analyseModulation({ levels: shape, pitches: pitched(180, 200), frameMs: 50 });
    const quiet = analyseModulation({
      levels: shape.map((v) => v / 10), pitches: pitched(180, 200), frameMs: 50,
    });
    assert.deepEqual(loud.arc, quiet.arc);
  });

  test('every point is drawable', () => {
    const r = analyseModulation({ levels: frames(300, 0.3), pitches: pitched(300, 200), frameMs: 50 });
    assert.ok(r.arc.length > 0 && r.arc.length <= 61);
    for (const v of r.arc) assert.ok(v >= 0 && v <= 1, `arc point out of range: ${v}`);
  });
});

describe('never more than one thing to fix', () => {
  test('flat AND fading AND no emphasis still shows one', () => {
    const levels = [...frames(70, 0.4), ...frames(70, 0.25), ...frames(70, 0.08)];
    const r = analyseModulation({ levels, pitches: pitched(210, 200), frameMs: 50 });
    assert.equal(r.notes.filter((n) => n.kind === 'fix').length, 1);
  });
});
