import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { chooseSeller, monthWindow, type SellerLoad } from './seller-assignment';

/**
 * SARIRO — who gets the next lead
 * ============================================================================
 * Distribution has to be FAIR, not merely automatic. A seller who quietly
 * receives half the leads earns half the incentives, and the first person to
 * notice will be the one who did not.
 *
 * The month boundary tests matter for the same reason: a sale landing in the
 * wrong month decides an incentive on the strength of a timezone.
 */

const loads = (...ns: number[]): SellerLoad[] =>
  ns.map((n, i) => ({ id: `s${i}`, assignedThisMonth: n }));

describe('chooseSeller', () => {
  test('the lightest desk wins', () => {
    assert.equal(chooseSeller(loads(12, 12, 13, 9)), 's3');
  });

  test('nobody to give it to is null, not a throw', () => {
    // A company with no seller in the seat must still be able to take a free
    // class booking. Losing the booking over an internal staffing gap is the
    // worst possible trade.
    assert.equal(chooseSeller([]), null);
  });

  test('one seller always gets it', () => {
    assert.equal(chooseSeller(loads(400)), 's0');
  });

  test('a tie is broken by the coin, and every tied seller can win', () => {
    // 12, 12, 13, 12 — A, B and D are tied and C is never eligible.
    const pool = loads(12, 12, 13, 12);
    const winners = new Set<string>();
    for (const r of [0, 0.34, 0.67, 0.99]) {
      winners.add(chooseSeller(pool, () => r)!);
    }
    assert.deepEqual([...winners].sort(), ['s0', 's1', 's3']);
    assert.ok(!winners.has('s2'), 'the busiest seller is never in the tie-break');
  });

  test('a random source returning exactly 1 does not fall off the end', () => {
    // Math.random() never returns 1, but a stubbed or broken one can. Indexing
    // past the end yields undefined, which reads downstream as "no sellers"
    // and silently stops assigning anything at all.
    assert.equal(chooseSeller(loads(5, 5), () => 1), 's1');
    assert.equal(chooseSeller(loads(5, 5), () => 1.7), 's1');
    assert.equal(chooseSeller(loads(5, 5), () => -3), 's0');
  });

  test('a missing or nonsense count is treated as zero, not as infinity', () => {
    // A seller who joined today has no rows. Reading that as "unknown, so skip
    // them" would mean a new hire never receives their first lead.
    const fresh = [
      { id: 'old', assignedThisMonth: 8 },
      { id: 'new', assignedThisMonth: NaN as unknown as number },
    ];
    assert.equal(chooseSeller(fresh), 'new');
  });

  test('a negative count cannot buy a seller extra leads', () => {
    const cooked = [
      { id: 'honest', assignedThisMonth: 0 },
      { id: 'cooked', assignedThisMonth: -50 },
    ];
    // Both clamp to 0, so it comes down to the coin rather than the -50 winning
    // every lead for the rest of the month.
    assert.equal(chooseSeller(cooked, () => 0), 'honest');
  });

  test('over many draws the load evens out', () => {
    // The property that matters: after a month of this, nobody is carrying
    // double. Deterministic rnd so the test cannot flake.
    const counts: Record<string, number> = { s0: 0, s1: 0, s2: 0 };
    let seed = 1;
    const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    for (let i = 0; i < 60; i++) {
      const pick = chooseSeller(
        Object.entries(counts).map(([id, n]) => ({ id, assignedThisMonth: n })),
        rnd
      )!;
      counts[pick]++;
    }
    const values = Object.values(counts);
    assert.equal(Math.max(...values) - Math.min(...values) <= 1, true, JSON.stringify(counts));
  });
});

describe('monthWindow', () => {
  test('an instant mid-month sits inside its own window', () => {
    const w = monthWindow(Date.parse('2026-09-10T12:00:00Z'));
    assert.equal(w.key, '2026-09');
    assert.ok(Date.parse(w.start) <= Date.parse('2026-09-10T12:00:00Z'));
    assert.ok(Date.parse(w.end) > Date.parse('2026-09-10T12:00:00Z'));
  });

  test('the month begins at midnight in INDIA, not midnight UTC', () => {
    // 1 Sept 00:00 IST is 31 Aug 18:30 UTC. Getting this wrong puts five and a
    // half hours of every month into the previous one's totals.
    const w = monthWindow(Date.parse('2026-09-10T12:00:00Z'));
    assert.equal(w.start, '2026-08-31T18:30:00.000Z');
    assert.equal(w.end, '2026-09-30T18:30:00.000Z');
  });

  test('2am on the 1st in Delhi is the NEW month', () => {
    // 2026-10-01T02:00 IST === 2026-09-30T20:30Z. A UTC month puts this sale in
    // September and pays it against September's target.
    const w = monthWindow(Date.parse('2026-09-30T20:30:00Z'));
    assert.equal(w.key, '2026-10', 'a sale entered at 2am in Delhi belongs to October');
  });

  test('11pm on the last day in Delhi is still the OLD month', () => {
    // 2026-09-30T23:00 IST === 2026-09-30T17:30Z. The mirror of the case above.
    const w = monthWindow(Date.parse('2026-09-30T17:30:00Z'));
    assert.equal(w.key, '2026-09');
  });

  test('December rolls into the next year', () => {
    const w = monthWindow(Date.parse('2026-12-15T09:00:00Z'));
    assert.equal(w.key, '2026-12');
    assert.equal(w.end, '2026-12-31T18:30:00.000Z');
    assert.ok(Date.parse(w.end) > Date.parse(w.start));
  });

  test('consecutive months meet exactly, with no gap and no overlap', () => {
    // Half-open windows: a row belongs to exactly one month. A gap loses a
    // sale; an overlap counts it twice.
    const sep = monthWindow(Date.parse('2026-09-15T00:00:00Z'));
    const oct = monthWindow(Date.parse('2026-10-15T00:00:00Z'));
    assert.equal(sep.end, oct.start);
  });

  test('every month of a year meets its neighbour', () => {
    for (let m = 1; m <= 11; m++) {
      const a = monthWindow(Date.parse(`2026-${String(m).padStart(2, '0')}-15T06:00:00Z`));
      const b = monthWindow(Date.parse(`2026-${String(m + 1).padStart(2, '0')}-15T06:00:00Z`));
      assert.equal(a.end, b.start, `${a.key} → ${b.key}`);
    }
  });

  test('a Date and a number are the same answer', () => {
    const n = Date.parse('2026-09-10T12:00:00Z');
    assert.deepEqual(monthWindow(n), monthWindow(new Date(n)));
  });
});
