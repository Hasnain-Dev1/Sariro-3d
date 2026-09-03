import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPayoutBreakdown, classifyPenalty, explainLine, groupByMonth,
  type EarningRow, type IncentiveRow,
} from './payout-breakdown';

/**
 * SARIRO — the sum a teacher is paid
 * =========================================================
 * §36-37 turn a pile of class rows into "this is what you earned and this is
 * what was taken off". The failure that matters is not an ugly screen — it is
 * a deduction that appears in the total but not in the breakdown, so a teacher
 * sees ₹400 missing and no line explaining it. That is the fastest way to lose
 * a teacher's trust in the whole payout, so most of what follows checks that
 * every rupee is accounted for on both sides.
 */

let seq = 0;
function earning(p: Partial<EarningRow> = {}): EarningRow {
  seq += 1;
  return {
    id: `e${seq}`,
    class_date: '2026-08-12T11:00:00.000Z',
    lesson_name: 'Lesson',
    ratio: '1:1',
    base_amount: 250,
    bonus_amount: 0,
    penalty_amount: 0,
    penalty_reason: null,
    net_amount: 250,
    amount: 250,
    status: 'pending',
    ...p,
  };
}

describe('reading the penalty back out of its reason', () => {
  test('the reasons the triggers actually write', () => {
    assert.equal(classifyPenalty('Late join (7 min)'), 'late_join');
    assert.equal(classifyPenalty('Student no-show — half withheld (claim via doubt session)'), 'student_no_show');
    assert.equal(classifyPenalty('No show'), 'no_show');
    assert.equal(classifyPenalty('Late attendance marking'), 'late_attendance');
  });

  test('a student not turning up is not the teacher being punished', () => {
    // Its reason contains "no-show" too. Grouping the two would tell a teacher
    // they were penalised for a child's absence.
    assert.notEqual(
      classifyPenalty('Student no-show — half withheld (claim via doubt session)'),
      'no_show'
    );
  });

  test('anything unrecognised is Other, never dropped', () => {
    assert.equal(classifyPenalty('Some rule invented next year'), 'other');
    assert.equal(classifyPenalty(null), 'other');
  });
});

describe('§36 — the breakdown adds up', () => {
  test('earnings split by ratio, with the classes kept behind each line', () => {
    const b = buildPayoutBreakdown([
      earning({ ratio: '1:1', base_amount: 250 }),
      earning({ ratio: '1:1', base_amount: 250 }),
      earning({ ratio: '1:4', base_amount: 275, bonus_amount: 25 }),
    ]);

    assert.equal(b.classes, 3);
    const oneToOne = b.earnings.find((l) => l.ratio === '1:1')!;
    const group = b.earnings.find((l) => l.ratio === '1:4')!;
    assert.equal(oneToOne.classes, 2);
    assert.equal(oneToOne.total, 500);
    assert.equal(group.total, 300, 'base plus the group bonus');
    assert.equal(group.rows.length, 1, 'the class behind the number is kept');
    assert.equal(b.gross, 800);
  });

  test('every deduction in the total also appears as a line', () => {
    const b = buildPayoutBreakdown([
      earning({ penalty_amount: 100, penalty_reason: 'Late join (7 min)' }),
      earning({ penalty_amount: 100, penalty_reason: 'Late join (6 min)' }),
      earning({ penalty_amount: 1000, penalty_reason: 'No show' }),
      earning({ penalty_amount: 50, penalty_reason: 'Mystery rule' }),
    ]);

    assert.equal(b.totalDeductions, 1250);
    const summed = b.deductions.reduce((s, d) => s + d.amount, 0);
    assert.equal(summed, b.totalDeductions, 'the lines must account for the total');
    assert.ok(b.deductions.some((d) => d.kind === 'other' && d.amount === 50), 'the unknown one is still shown');
  });

  test('deductions are ordered by what costs most', () => {
    const b = buildPayoutBreakdown([
      earning({ penalty_amount: 100, penalty_reason: 'Late join (7 min)' }),
      earning({ penalty_amount: 1000, penalty_reason: 'No show' }),
    ]);
    assert.equal(b.deductions[0].kind, 'no_show');
  });

  test('only approved incentives reach the final figure', () => {
    const incentives: IncentiveRow[] = [
      { id: 'i1', amount: 500, reason: 'Extra session', status: 'approved', requested_at: '2026-08-10T00:00:00.000Z' },
      { id: 'i2', amount: 900, reason: 'Pending one', status: 'requested', requested_at: '2026-08-11T00:00:00.000Z' },
      { id: 'i3', amount: 400, reason: 'Turned down', status: 'rejected', requested_at: '2026-08-12T00:00:00.000Z' },
    ];
    const b = buildPayoutBreakdown([earning({ base_amount: 250 })], incentives);
    assert.equal(b.incentives, 500, '§44 — only approved incentives affect the payout');
  });

  test('gross − deductions + incentives is the final payable', () => {
    const b = buildPayoutBreakdown(
      [
        earning({ base_amount: 250 }),
        earning({ base_amount: 250, penalty_amount: 100, penalty_reason: 'Late join (7 min)' }),
      ],
      [{ id: 'i1', amount: 300, reason: 'x', status: 'approved', requested_at: '2026-08-01T00:00:00.000Z' }]
    );
    assert.equal(b.gross, 500);
    assert.equal(b.totalDeductions, 100);
    assert.equal(b.incentives, 300);
    assert.equal(b.finalPayable, 700);
  });

  test('a month with nothing in it is zeroes, not a crash', () => {
    const b = buildPayoutBreakdown([]);
    assert.deepEqual(
      { g: b.gross, d: b.totalDeductions, f: b.finalPayable, c: b.classes },
      { g: 0, d: 0, f: 0, c: 0 }
    );
  });
});

describe('§37 — the arithmetic written out', () => {
  test('one rate gives a multiplication that actually multiplies', () => {
    const b = buildPayoutBreakdown([
      earning({ ratio: '1:1', base_amount: 300 }),
      earning({ ratio: '1:1', base_amount: 300 }),
    ]);
    assert.equal(explainLine(b.earnings[0]), '2 × 1:1 × ₹300 = ₹600');
  });

  test('mixed rates say so instead of showing a sum that does not add up', () => {
    // A tier change mid-month, or a rate edited in settings.
    const b = buildPayoutBreakdown([
      earning({ ratio: '1:1', base_amount: 250 }),
      earning({ ratio: '1:1', base_amount: 300 }),
    ]);
    const text = explainLine(b.earnings[0]);
    assert.match(text, /mixed rates/);
    assert.match(text, /₹550/, 'and still states the true total');
  });

  test('a group bonus is named rather than folded into the rate', () => {
    const b = buildPayoutBreakdown([earning({ ratio: '1:4', base_amount: 275, bonus_amount: 25 })]);
    assert.match(explainLine(b.earnings[0]), /group bonus/);
  });
});

describe('§39 — grouping the history by month', () => {
  test('newest month first', () => {
    const groups = groupByMonth([
      earning({ class_date: '2026-07-15T10:00:00.000Z' }),
      earning({ class_date: '2026-08-15T10:00:00.000Z' }),
    ]);
    assert.equal(groups[0].month, '2026-08');
    assert.equal(groups[0].label, 'August 2026');
  });

  test('a late-evening class stays in the month it was taught in India', () => {
    // 23:30 IST on 31 August is 18:00Z — a UTC month check keeps it in August
    // too, but 00:30 IST on 1 September is 19:00Z on 31 August and would be
    // filed under August by a naive check. This is that case.
    const groups = groupByMonth([earning({ class_date: '2026-08-31T19:00:00.000Z' })]);
    assert.equal(groups[0].month, '2026-09');
  });

  test('an unparseable date is skipped, not counted into the wrong month', () => {
    const groups = groupByMonth([earning({ class_date: 'nonsense' })]);
    assert.equal(groups.length, 0);
  });
});
