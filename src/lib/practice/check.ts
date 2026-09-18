import type { Answer, CheckResult } from './types';
import { equal as fracEqual, frac, isSimplest, parseFraction } from './fraction';
import { equivalent, evaluateText } from './expr';
import { parseQuantity, parseUnit, sameDims } from './units';

/**
 * SARIRO — practice: marking an answer
 * ============================================================================
 * Generous about form, strict about the maths. "0.5", "1/2" and "2/4" are all
 * the right amount; "2/4" when the question asked for simplest form is marked
 * `nearly` — the child gets told what is missing instead of being told they are
 * wrong. Pure: the same answer always gets the same verdict.
 */

export type Response =
  | { kind: 'choice'; index: number }
  | { kind: 'text'; text: string }
  | { kind: 'order'; order: number[] }
  | { kind: 'coefficients'; values: number[] };

const loose = (s: string) => s.toLowerCase().replace(/[^a-z0-9+\-=/.]/g, '').replace(/\.+$/, '');

function closeEnough(given: number, expected: number, tolerance: number): boolean {
  if (expected === 0) return Math.abs(given) <= tolerance;
  return Math.abs(given - expected) <= Math.abs(expected) * tolerance;
}

export function checkAnswer(answer: Answer, response: Response): CheckResult {
  switch (answer.kind) {
    case 'choice': {
      if (response.kind !== 'choice') return { correct: false, message: 'Pick one of the options.' };
      return response.index === answer.correct
        ? { correct: true, message: 'Right.' }
        : { correct: false, message: `Not that one — it is "${answer.options[answer.correct]}".` };
    }

    case 'number': {
      if (response.kind !== 'text') return { correct: false, message: 'Type a number.' };
      const text = response.text.trim();
      if (!text) return { correct: false, message: 'Type a number.' };
      if (answer.fraction) {
        const given = parseFraction(text);
        if (!given) return { correct: false, message: 'Write it as a number or a fraction, like 3/4.' };
        const exp = toFraction(answer.value);
        if (!fracEqual(given, exp)) return { correct: false, message: 'Not quite.' };
        if (answer.simplest && !isSimplest(text) && !/^-?\d*\.\d+$/.test(text)) {
          return { correct: false, nearly: true, message: 'Right amount — now write it in its simplest form.' };
        }
        return { correct: true, message: 'Right.' };
      }
      const asFraction = parseFraction(text);
      const given = asFraction ? asFraction.num / asFraction.den : evaluateText(text);
      if (given == null) return { correct: false, message: 'That does not read as a number.' };
      return closeEnough(given, answer.value, answer.tolerance ?? 1e-6)
        ? { correct: true, message: 'Right.' }
        : { correct: false, message: 'Not quite.' };
    }

    case 'quantity': {
      if (response.kind !== 'text') return { correct: false, message: 'Type the value and its unit.' };
      const q = parseQuantity(response.text);
      const want = parseUnit(answer.unit);
      if (!want) return { correct: false, message: 'This question is broken — tell your teacher.' };
      if (!q) return { correct: false, message: `Write a number and a unit, like "12 ${answer.unit}".` };
      const tol = answer.tolerance ?? 0.02;
      const siExpected = answer.si;
      if (!q.hadUnit) {
        // The number would be right in the expected unit — they only left the unit off.
        const inExpected = siExpected / want.factor;
        return closeEnough(q.value, inExpected, tol)
          ? { correct: false, nearly: true, message: `Right number — now add the unit (${answer.unit}).` }
          : { correct: false, message: `Add a unit, and check the number: it should be in ${answer.unit}.` };
      }
      if (!sameDims(q.dims, want.dims)) return { correct: false, message: `That unit measures something else. The answer is in ${answer.unit}.` };
      return closeEnough(q.value, siExpected, tol)
        ? { correct: true, message: 'Right.' }
        : { correct: false, message: 'Right kind of unit, wrong amount.' };
    }

    case 'expression': {
      if (response.kind !== 'text') return { correct: false, message: 'Type an expression.' };
      if (!response.text.trim()) return { correct: false, message: 'Type an expression.' };
      const r = equivalent(response.text, answer.value);
      if (r.error) return { correct: false, message: r.error };
      return r.equal ? { correct: true, message: 'Right.' } : { correct: false, message: 'Not equal to the answer.' };
    }

    case 'text': {
      if (response.kind !== 'text') return { correct: false, message: 'Type your answer.' };
      const got = loose(response.text);
      if (!got) return { correct: false, message: 'Type your answer.' };
      return answer.accept.some((a) => loose(a) === got)
        ? { correct: true, message: 'Right.' }
        : { correct: false, message: `The answer is "${answer.accept[0]}".` };
    }

    case 'order': {
      if (response.kind !== 'order') return { correct: false, message: 'Put them in order.' };
      const right = response.order.length === answer.correct.length && response.order.every((v, i) => v === answer.correct[i]);
      if (right) return { correct: true, message: 'Right order.' };
      const inPlace = response.order.filter((v, i) => v === answer.correct[i]).length;
      return { correct: false, message: `${inPlace} of ${answer.correct.length} in the right place.` };
    }

    case 'coefficients': {
      if (response.kind !== 'coefficients') return { correct: false, message: 'Fill in every coefficient.' };
      const v = response.values;
      if (v.length !== answer.correct.length || v.some((n) => !Number.isInteger(n) || n < 1)) {
        return { correct: false, message: 'Every coefficient is a whole number, 1 or more.' };
      }
      // Any whole multiple balances too; lowest terms is what is asked.
      const ratio = v[0] / answer.correct[0];
      const proportional = v.every((n, i) => Math.abs(n - answer.correct[i] * ratio) < 1e-9);
      if (!proportional) return { correct: false, message: 'Count each kind of atom on both sides again.' };
      if (ratio !== 1) return { correct: false, nearly: true, message: 'Balanced — now divide down to the smallest whole numbers.' };
      return { correct: true, message: 'Balanced.' };
    }
  }
}

function toFraction(value: number) {
  // Expected values in fraction questions are made from integers, so a short
  // continued-fraction search recovers them exactly.
  for (let den = 1; den <= 10000; den++) {
    const num = Math.round(value * den);
    if (Math.abs(num / den - value) < 1e-9) return frac(num, den);
  }
  return frac(Math.round(value * 10000), 10000);
}
