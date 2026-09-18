import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { makeRng, hashSeed } from './rng';
import { parseFraction, formatFraction, frac, isSimplest, add } from './fraction';
import { equivalent, evaluateText } from './expr';
import { parseQuantity, parseUnit, sameDims, toSI } from './units';
import { checkAnswer } from './check';

describe('seeded randomness', () => {
  test('the same seed makes the same numbers', () => {
    const a = makeRng(42);
    const b = makeRng(42);
    assert.deepEqual([a.int(1, 100), a.int(1, 100), a.next()], [b.int(1, 100), b.int(1, 100), b.next()]);
  });
  test('int stays inside its range, both ends reachable', () => {
    const r = makeRng(7);
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) {
      const n = r.int(3, 6);
      assert.ok(n >= 3 && n <= 6);
      seen.add(n);
    }
    assert.deepEqual([...seen].sort(), [3, 4, 5, 6]);
  });
  test('hashSeed differs for different text', () => {
    assert.notEqual(hashSeed('maths:fractions#1'), hashSeed('maths:fractions#2'));
  });
});

describe('fractions', () => {
  test('reads every way a child writes one', () => {
    assert.deepEqual(parseFraction('3/4'), { num: 3, den: 4 });
    assert.deepEqual(parseFraction('6/8'), { num: 3, den: 4 });
    assert.deepEqual(parseFraction('1 1/2'), { num: 3, den: 2 });
    assert.deepEqual(parseFraction('-1 1/2'), { num: -3, den: 2 });
    assert.deepEqual(parseFraction('0.75'), { num: 3, den: 4 });
    assert.deepEqual(parseFraction('.5'), { num: 1, den: 2 });
    assert.deepEqual(parseFraction('4'), { num: 4, den: 1 });
    assert.equal(parseFraction('3/0'), null);
    assert.equal(parseFraction('three'), null);
  });
  test('adds exactly and prints mixed numbers', () => {
    assert.equal(formatFraction(add(frac(1, 3), frac(1, 6))), '1/2');
    assert.equal(formatFraction(frac(7, 2), true), '3 1/2');
  });
  test('knows simplest form', () => {
    assert.equal(isSimplest('3/4'), true);
    assert.equal(isSimplest('6/8'), false);
    assert.equal(isSimplest('2'), true);
  });
});

describe('expressions', () => {
  test('evaluates with implicit multiplication and powers', () => {
    assert.equal(evaluateText('2x + 3', { x: 4 }), 11);
    assert.equal(evaluateText('3(x+1)^2', { x: 1 }), 12);
    assert.equal(evaluateText('-x^2', { x: 3 }), -9);
    assert.equal(evaluateText('(x+1)(x-1)', { x: 5 }), 24);
    assert.equal(evaluateText('2 × 3 ÷ 4'), 1.5);
    assert.ok(Math.abs((evaluateText('sqrt(16) + sin(0)') ?? 0) - 4) < 1e-12);
  });
  test('the same expression written differently is equal', () => {
    assert.equal(equivalent('2(x+3)', '2x + 6').equal, true);
    assert.equal(equivalent('x^2 - 1', '(x+1)(x-1)').equal, true);
    assert.equal(equivalent('6 + x*2', '2x+6').equal, true);
    assert.equal(equivalent('2x + 5', '2x + 6').equal, false);
  });
  test('garbage is an error, not a crash', () => {
    assert.ok(equivalent('2x +', '2x').error);
    assert.equal(evaluateText('2 +* 3'), null);
  });
});

describe('units', () => {
  test('km/h and m/s are the same kind of thing, converted', () => {
    assert.equal(toSI(72, 'km/h'), 20);
    assert.ok(sameDims(parseUnit('km/h')!.dims, parseUnit('m/s')!.dims));
    assert.ok(sameDims(parseUnit('N')!.dims, parseUnit('kg m/s^2')!.dims));
    assert.ok(sameDims(parseUnit('J')!.dims, parseUnit('N·m')!.dims));
    assert.ok(sameDims(parseUnit('m/s²')!.dims, parseUnit('m s^-2')!.dims));
  });
  test('reads quantities', () => {
    const q = parseQuantity('43.2 km/h')!;
    assert.ok(Math.abs(q.value - 12) < 1e-9);
    assert.equal(parseQuantity('12')!.hadUnit, false);
    assert.ok(Math.abs(parseQuantity('4.5 x 10^3 J')!.value - 4500) < 1e-9);
    assert.ok(Math.abs(parseQuantity('3 kW')!.value - 3000) < 1e-9);
    assert.equal(parseQuantity('12 furlongs'), null);
  });
});

describe('marking', () => {
  test('fractions: right amount in any form, simplest when asked', () => {
    const ans = { kind: 'number' as const, value: 0.5, fraction: true, simplest: true };
    assert.equal(checkAnswer(ans, { kind: 'text', text: '1/2' }).correct, true);
    assert.equal(checkAnswer(ans, { kind: 'text', text: '0.5' }).correct, true);
    const r = checkAnswer(ans, { kind: 'text', text: '2/4' });
    assert.equal(r.correct, false);
    assert.equal(r.nearly, true);
    assert.equal(checkAnswer(ans, { kind: 'text', text: '1/3' }).correct, false);
  });
  test('quantities: any equivalent unit, missing unit is "nearly"', () => {
    const ans = { kind: 'quantity' as const, si: 12, unit: 'm/s' };
    assert.equal(checkAnswer(ans, { kind: 'text', text: '12 m/s' }).correct, true);
    assert.equal(checkAnswer(ans, { kind: 'text', text: '43.2 km/h' }).correct, true);
    assert.equal(checkAnswer(ans, { kind: 'text', text: '12' }).nearly, true);
    assert.equal(checkAnswer(ans, { kind: 'text', text: '12 m' }).correct, false);
    assert.equal(checkAnswer(ans, { kind: 'text', text: '15 m/s' }).correct, false);
  });
  test('expressions, order and coefficients', () => {
    assert.equal(checkAnswer({ kind: 'expression', value: '2x+6' }, { kind: 'text', text: '2(x+3)' }).correct, true);
    assert.equal(checkAnswer({ kind: 'order', items: ['a', 'b', 'c'], correct: [2, 0, 1] }, { kind: 'order', order: [2, 0, 1] }).correct, true);
    const eq = { kind: 'coefficients' as const, species: ['H2', 'O2', 'H2O'], arrow: 2, correct: [2, 1, 2] };
    assert.equal(checkAnswer(eq, { kind: 'coefficients', values: [2, 1, 2] }).correct, true);
    assert.equal(checkAnswer(eq, { kind: 'coefficients', values: [4, 2, 4] }).nearly, true);
    assert.equal(checkAnswer(eq, { kind: 'coefficients', values: [1, 1, 1] }).correct, false);
  });
  test('text answers ignore case, spaces and punctuation', () => {
    assert.equal(checkAnswer({ kind: 'text', accept: ['Photosynthesis'] }, { kind: 'text', text: ' photosynthesis. ' }).correct, true);
  });
});
