import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  creditGate, creditBlockMessage, creditShortMessage, type LearnerCredit,
} from './schedule-credit-gate';

/**
 * SARIRO — a class nobody has paid for
 * ============================================================================
 * The join button has always refused a child with no credits. Nothing refused
 * the SCHEDULING, so the refusal arrived at 5pm on the day of the class, after
 * a teacher's eight Tuesdays had already been committed.
 *
 * These tests are mostly about the two ways this could be wrong in opposite
 * directions: refusing a family who is fine, and waving through one who is not.
 */

const kid = (name: string, balance: number | null): LearnerCredit => ({
  studentId: name.toLowerCase(), name, balance,
});

describe('who cannot be scheduled', () => {
  test('a zero balance blocks', () => {
    const g = creditGate([kid('Aarav', 0)]);
    assert.equal(g.ok, false);
    assert.deepEqual(g.blocked.map((b) => b.name), ['Aarav']);
  });

  test('no credits row at all is the same as zero', () => {
    // A learner who has never had a credit has no row, not a row saying 0.
    // Reading that as "unknown, so allow" is how the whole gate leaks.
    const g = creditGate([kid('Aarav', null)]);
    assert.equal(g.ok, false);
  });

  test('one credit is enough to schedule', () => {
    // The rule is "has the family bought anything", not "has the family bought
    // the whole course". An instalment plan is a real thing.
    const g = creditGate([kid('Aarav', 1)], 8);
    assert.equal(g.ok, true);
    assert.equal(g.blocked.length, 0);
  });

  test('a negative balance cannot sneak through as truthy', () => {
    const g = creditGate([kid('Aarav', -5)]);
    assert.equal(g.ok, false);
  });

  test('NaN is treated as nothing, not as a pass', () => {
    const g = creditGate([kid('Aarav', NaN)]);
    assert.equal(g.ok, false);
  });

  test('one child with nothing blocks the whole batch', () => {
    // A batch is one booking serving several children. There is no way to
    // schedule it for three of the four.
    const g = creditGate([kid('Aarav', 40), kid('Diya', 0), kid('Kabir', 12)]);
    assert.equal(g.ok, false);
    assert.deepEqual(g.blocked.map((b) => b.name), ['Diya']);
  });

  test('an empty roster does not block', () => {
    // A batch with nobody in it yet is a scheduling decision, not a payment
    // one. Refusing it would make an empty batch unschedulable for ever.
    assert.equal(creditGate([]).ok, true);
  });
});

describe('running short — reported, never refused', () => {
  test('fewer credits than classes is flagged with the shortfall', () => {
    const g = creditGate([kid('Aarav', 3)], 8);
    assert.equal(g.ok, true, 'having some credits is not a refusal');
    assert.equal(g.short.length, 1);
    assert.equal(g.short[0].shortfall, 5);
  });

  test('exactly enough is not short', () => {
    assert.equal(creditGate([kid('Aarav', 8)], 8).short.length, 0);
  });

  test('a blocked learner is not ALSO reported as short', () => {
    // Otherwise the admin is told the same child is both out of credits and
    // running low, which reads as two problems.
    const g = creditGate([kid('Aarav', 0)], 8);
    assert.equal(g.blocked.length, 1);
    assert.equal(g.short.length, 0);
  });

  test('with no class count, nobody is short', () => {
    // Adding a child to a batch that already has a diary: the question is only
    // whether they have bought anything.
    assert.equal(creditGate([kid('Aarav', 1)]).short.length, 0);
  });
});

describe('the message an admin actually reads', () => {
  test('names the child rather than counting them', () => {
    // "2 students have no credits" sends somebody hunting through a roster.
    const m = creditBlockMessage([kid('Aarav', 0)]);
    assert.match(m, /Aarav/);
    assert.match(m, /has no class credits/);
    assert.match(m, /Add credits/, 'and says what to do about it');
  });

  test('two names read as a sentence, not a list', () => {
    const m = creditBlockMessage([kid('Aarav', 0), kid('Diya', 0)]);
    assert.match(m, /Aarav and Diya have no class credits/);
  });

  test('three or more get the comma-then-and treatment', () => {
    const m = creditBlockMessage([kid('Aarav', 0), kid('Diya', 0), kid('Kabir', 0)]);
    assert.match(m, /Aarav, Diya and Kabir/);
  });

  test('a nameless account still produces a readable sentence', () => {
    const m = creditBlockMessage([{ studentId: 'u1', name: null, balance: 0 }]);
    assert.match(m, /^One student has no class credits/);
    assert.doesNotMatch(m, /null|undefined/);
  });

  test('a whitespace name is treated as no name', () => {
    const m = creditBlockMessage([{ studentId: 'u1', name: '   ', balance: 0 }]);
    assert.match(m, /^One student has/);
  });

  test('nothing blocked is an empty string, not a sentence about nobody', () => {
    assert.equal(creditBlockMessage([]), '');
  });
});

describe('the shortfall note', () => {
  test('says the balance and what it means', () => {
    const g = creditGate([kid('Aarav', 3)], 8);
    const m = creditShortMessage(g.short, 8);
    assert.match(m, /Scheduling 8 classes/);
    assert.match(m, /Aarav \(3\)/);
    assert.match(m, /without being paid for/);
  });

  test('nobody short is an empty string', () => {
    assert.equal(creditShortMessage([], 8), '');
  });
});
