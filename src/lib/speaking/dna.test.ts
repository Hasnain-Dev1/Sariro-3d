import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { analyseSpeech, scoreBreakdown } from './analyse';
import { analyseModulation } from './modulation';
import { speakingDna, archetypeFor, biggestGain, DNA_ORDER } from './dna';

const FRAME = 50;

function take(opts: { words: number; seconds: number; extra?: string; quiet?: boolean; pitchSwing?: number }) {
  const frames = Math.round((opts.seconds * 1000) / FRAME);
  const loud = opts.quiet ? 0.01 : 0.25;
  const levels = Array.from({ length: frames }, (_, i) => (i % 100 < 12 ? loud * 0.02 : loud + (i % 9) * (opts.quiet ? 0.001 : 0.01)));
  const pitches = levels.map((l, i) => (l < loud * 0.1 ? null : 180 * 2 ** (((opts.pitchSwing ?? 6) * Math.sin(i / 11)) / 12)));
  const transcript = Array.from({ length: opts.words }, (_, i) => `word${i}`).join(' ') + (opts.extra ?? '');
  const report = analyseSpeech({ transcript, durationMs: opts.seconds * 1000, levels, frameMs: FRAME });
  const modulation = analyseModulation({ levels, pitches, frameMs: FRAME });
  return { report, modulation };
}

describe('speakingDna', () => {
  test('six axes, in order, each 0–100', () => {
    const { report, modulation } = take({ words: 100, seconds: 40 });
    const dna = speakingDna(report, modulation);
    assert.deepEqual(dna.map((a) => a.key), DNA_ORDER);
    dna.forEach((a) => assert.ok(a.value >= 0 && a.value <= 100, `${a.key} = ${a.value}`));
  });

  test('the four scored axes are the score parts, out of 100', () => {
    const { report, modulation } = take({ words: 100, seconds: 40, extra: ' um um um um um um' });
    const parts = scoreBreakdown(report);
    const dna = Object.fromEntries(speakingDna(report, modulation).map((a) => [a.key, a.value]));
    assert.equal(dna.pace, parts.pace * 5);
    assert.equal(dna.fluency, parts.fillers * 5);
    assert.equal(dna.pausing, parts.pausing * 5);
    assert.equal(dna.flow, parts.phrasing * 5);
  });

  test('expression follows how far the voice moved', () => {
    const flat = take({ words: 100, seconds: 40, pitchSwing: 0.5 });
    const lively = take({ words: 100, seconds: 40, pitchSwing: 8 });
    const e = (t: typeof flat) => speakingDna(t.report, t.modulation).find((a) => a.key === 'expression')!.value;
    assert.ok(e(lively) > e(flat) + 30, `${e(lively)} vs ${e(flat)}`);
  });

  test('a recording too quiet to hear scores low on expression and energy', () => {
    const { report, modulation } = take({ words: 100, seconds: 40, quiet: true });
    assert.equal(report.delivery.tooQuiet, true);
    const dna = Object.fromEntries(speakingDna(report, modulation).map((a) => [a.key, a.value]));
    assert.equal(dna.expression, 20);
    assert.equal(dna.energy, 20);
  });

  test('without a pitch reading, expression falls back to loudness — not a flattering constant', () => {
    const { report } = take({ words: 100, seconds: 40 });
    const expression = speakingDna(report, null).find((a) => a.key === 'expression')!.value;
    assert.equal(expression, report.delivery.monotone ? 35 : 60);
  });
});

describe('archetypeFor', () => {
  test('a very quiet recording is the Quiet Spark, whatever else it did', () => {
    const { report, modulation } = take({ words: 140, seconds: 40, quiet: true });
    assert.equal(archetypeFor(report, speakingDna(report, modulation)).key, 'quiet-spark');
  });

  test('fast is the Sprinter', () => {
    const { report, modulation } = take({ words: 150, seconds: 40 });
    assert.equal(report.pace.verdict, 'high');
    assert.equal(archetypeFor(report, speakingDna(report, modulation)).key, 'sprinter');
  });

  test('slow is the Thinker', () => {
    const { report, modulation } = take({ words: 55, seconds: 40, pitchSwing: 1, extra: ' um um um um um' });
    assert.equal(report.pace.verdict, 'low');
    assert.equal(archetypeFor(report, speakingDna(report, modulation)).key, 'thinker');
  });

  test('every archetype has a name, an emoji and a line', () => {
    const { report, modulation } = take({ words: 100, seconds: 40 });
    const a = archetypeFor(report, speakingDna(report, modulation));
    assert.ok(a.name.startsWith('The '));
    assert.ok(a.emoji.length > 0 && a.line.length > 20);
  });
});

describe('biggestGain', () => {
  const now = DNA_ORDER.map((key, i) => ({ key, label: key, value: [80, 90, 60, 70, 50, 65][i] }));

  test('the axis that grew most', () => {
    assert.deepEqual(biggestGain(now, [70, 60, 55, 70, 50, 65]), { label: 'fluency', by: 30 });
  });

  test('nothing when nothing moved enough, or there is nothing to compare', () => {
    assert.equal(biggestGain(now, [78, 88, 58, 70, 50, 65]), null);
    assert.equal(biggestGain(now, []), null);
    assert.equal(biggestGain(now, null), null);
  });
});
