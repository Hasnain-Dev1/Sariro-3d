import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  SOURCE_STRENGTH,
  describeConfidence,
  recencyFactor,
  scoreCapability,
  scoreLearner,
  type EvidenceRow,
  type EvidenceSource,
} from './mastery';

/**
 * SARIRO — mastery scoring tests
 * =========================================================
 * This is the moat. `STAGE-2-BUILD.md` calls the evidence ledger the heart of
 * the product, and every slice above it — the parent growth view, the portfolio,
 * the planner — inherits whatever this function believes.
 *
 * It is also the module where a bug is hardest to notice. A wrong price is
 * caught by a customer within a day; a wrong mastery score just produces a
 * plausible number that quietly misdescribes a child, and the first person to
 * find out is a parent being told something untrue about their kid.
 *
 * So these tests assert the PROPERTIES the model claims about itself, not
 * specific outputs. The scoring is expected to be tuned; the guarantees are not.
 */

const DAY = 86_400_000;
const NOW = new Date('2026-08-30T12:00:00Z');
const daysAgo = (n: number) => new Date(NOW.getTime() - n * DAY);

function ev(
  source: EvidenceSource,
  signal: number,
  opts: { weight?: number; days?: number; slug?: string } = {}
): EvidenceRow {
  return {
    capabilitySlug: opts.slug ?? 'algebraic-reasoning',
    source,
    signal,
    weight: opts.weight ?? 1,
    observedAt: daysAgo(opts.days ?? 0),
  };
}

describe('SOURCE_STRENGTH', () => {
  test('demonstrated work outranks consumed content, which outranks showing up', () => {
    // The stated scoring principle: "demonstrated beats consumed". If this
    // ordering ever inverts, the model rewards attendance over achievement.
    assert.ok(SOURCE_STRENGTH.project_review > SOURCE_STRENGTH.quiz);
    assert.ok(SOURCE_STRENGTH.quiz > SOURCE_STRENGTH.lesson_complete);
    assert.ok(SOURCE_STRENGTH.lesson_complete > SOURCE_STRENGTH.attendance);
  });

  test('a human mentor is the strongest signal after reviewed work', () => {
    // The input no competitor has. It must never be scored as an afterthought.
    assert.ok(SOURCE_STRENGTH.mentor_note >= SOURCE_STRENGTH.quiz);
    assert.equal(
      Math.max(...Object.values(SOURCE_STRENGTH)),
      SOURCE_STRENGTH.project_review
    );
  });

  test('a learner marking their own homework is weak evidence', () => {
    assert.ok(SOURCE_STRENGTH.self_assessment < SOURCE_STRENGTH.mentor_note);
  });

  test('every source carries a positive weight in 0..1', () => {
    for (const [source, strength] of Object.entries(SOURCE_STRENGTH)) {
      assert.ok(strength > 0 && strength <= 1, `${source}: ${strength} out of range`);
    }
  });
});

describe('recencyFactor', () => {
  test('evidence is at full weight for its first month', () => {
    assert.equal(recencyFactor(daysAgo(0), NOW), 1);
    assert.equal(recencyFactor(daysAgo(29), NOW), 1);
    assert.equal(recencyFactor(daysAgo(30), NOW), 1);
  });

  test('older evidence decays, but never below half', () => {
    // "A child who learned to reason algebraically has not un-learned it
    // because the summer holidays happened."
    const oneYear = recencyFactor(daysAgo(365), NOW);
    assert.ok(oneYear < 1 && oneYear > 0.5, `one-year factor was ${oneYear}`);
    assert.equal(recencyFactor(daysAgo(3650), NOW), 0.5);
  });

  test('decays monotonically — newer evidence is never worth less', () => {
    let previous = 1.0001;
    for (const days of [0, 15, 30, 45, 90, 180, 365, 730]) {
      const factor = recencyFactor(daysAgo(days), NOW);
      assert.ok(factor <= previous, `${days}d (${factor}) outweighs something newer`);
      previous = factor;
    }
  });

  test('a future timestamp is clamped rather than inflating the score', () => {
    // Clock skew between a client and the database must not manufacture weight.
    assert.equal(recencyFactor(new Date(NOW.getTime() + 10 * DAY), NOW), 1);
  });
});

describe('scoreCapability', () => {
  test('no evidence means no claim, not a zero', () => {
    // A zero would render as "0% — knows nothing", which is a statement we
    // have not earned. Null means we say nothing at all.
    assert.equal(scoreCapability([], NOW), null);
  });

  test('50 means "no evidence either way", not "half competent"', () => {
    const neutral = scoreCapability([ev('quiz', 0)], NOW)!;
    assert.equal(neutral.level, 50);
  });

  test('a perfect signal reaches 100 and a fully negative one reaches 0', () => {
    assert.equal(scoreCapability([ev('project_review', 1)], NOW)!.level, 100);
    assert.equal(scoreCapability([ev('project_review', -1)], NOW)!.level, 0);
  });

  test('level always lands inside 0..100', () => {
    for (const signal of [-1, -0.5, 0, 0.5, 1]) {
      for (const source of Object.keys(SOURCE_STRENGTH) as EvidenceSource[]) {
        const r = scoreCapability([ev(source, signal)], NOW)!;
        assert.ok(r.level >= 0 && r.level <= 100, `${source}/${signal}: ${r.level}`);
      }
    }
  });

  test('it is a weighted MEAN — forty weak signals do not beat three strong ones', () => {
    // The property that stops the model being gamed by attendance.
    const manyWeak = Array.from({ length: 40 }, () => ev('attendance', 0.2));
    const fewStrong = Array.from({ length: 3 }, () => ev('project_review', 0.9));
    assert.ok(
      scoreCapability(fewStrong, NOW)!.level > scoreCapability(manyWeak, NOW)!.level,
      'volume of weak evidence outranked demonstrated work'
    );
  });

  test('a stronger source pulls the mean further than a weaker one', () => {
    const base = ev('attendance', -1);
    const withReview = scoreCapability([base, ev('project_review', 1)], NOW)!;
    const withAttendance = scoreCapability([base, ev('attendance', 1)], NOW)!;
    assert.ok(withReview.level > withAttendance.level);
  });

  test('negative evidence lowers the level — it is real information', () => {
    const positive = scoreCapability([ev('mentor_note', 0.8)], NOW)!;
    const mixed = scoreCapability([ev('mentor_note', 0.8), ev('mentor_note', -0.8)], NOW)!;
    assert.ok(mixed.level < positive.level);
  });

  test('confidence rises with evidence and never exceeds 1', () => {
    let previous = -1;
    for (const count of [1, 2, 4, 8, 20]) {
      const rows = Array.from({ length: count }, () => ev('project_review', 0.7));
      const c = scoreCapability(rows, NOW)!.confidence;
      assert.ok(c >= previous, `confidence fell from ${previous} to ${c} at n=${count}`);
      assert.ok(c <= 1, `confidence ${c} exceeds 1`);
      previous = c;
    }
  });

  test('one fresh review is worth more confidence than five attendance ticks', () => {
    // Stated explicitly in the module doc.
    const review = scoreCapability([ev('project_review', 0.8)], NOW)!;
    const ticks = scoreCapability(
      Array.from({ length: 5 }, () => ev('attendance', 0.8)),
      NOW
    )!;
    assert.ok(review.confidence > ticks.confidence);
  });

  test('stale evidence is less confident than the same evidence fresh', () => {
    // A capability with one 8-month-old data point must be shown as
    // low-confidence, never as a confident number.
    const fresh = scoreCapability([ev('project_review', 0.8, { days: 1 })], NOW)!;
    const stale = scoreCapability([ev('project_review', 0.8, { days: 240 })], NOW)!;
    assert.ok(stale.confidence < fresh.confidence);
  });

  test('reports how much evidence it saw and when it last saw any', () => {
    const rows = [
      ev('quiz', 0.5, { days: 40 }),
      ev('quiz', 0.5, { days: 2 }),
      ev('quiz', 0.5, { days: 90 }),
    ];
    const r = scoreCapability(rows, NOW)!;
    assert.equal(r.evidenceCount, 3);
    assert.equal(r.lastEvidenceAt.getTime(), daysAgo(2).getTime());
  });

  test('zero-weight evidence cannot crash the mean', () => {
    // weight 0 means "this lesson develops none of this capability" — a real
    // tagging outcome, and a division-by-zero waiting to happen.
    const r = scoreCapability([ev('quiz', 1, { weight: 0 })], NOW)!;
    assert.ok(Number.isFinite(r.level));
    assert.equal(r.level, 50);
  });
});

describe('scoreLearner', () => {
  const rows = [
    ev('project_review', 0.9, { slug: 'algebraic-reasoning' }),
    ev('attendance', 0.1, { slug: 'number-sense' }),
    ev('project_review', 0.9, { slug: 'algebraic-reasoning' }),
    ev('mentor_note', -0.6, { slug: 'proof-and-logic' }),
  ];

  test('groups evidence by capability without losing any', () => {
    const results = scoreLearner(rows, NOW);
    assert.equal(results.length, 3);
    assert.equal(
      results.reduce((n, r) => n + r.evidenceCount, 0),
      rows.length
    );
  });

  test('returns strongest first, so a parent reads the good news first', () => {
    const results = scoreLearner(rows, NOW);
    for (let i = 1; i < results.length; i++) {
      assert.ok(results[i - 1].level >= results[i].level, 'results are not sorted by level');
    }
    assert.equal(results[0].capabilitySlug, 'algebraic-reasoning');
  });

  test('no evidence produces no rows rather than a page of zeroes', () => {
    assert.deepEqual(scoreLearner([], NOW), []);
  });

  test('each capability is scored only from its own evidence', () => {
    const isolated = scoreCapability(
      rows.filter((r) => r.capabilitySlug === 'proof-and-logic'),
      NOW
    )!;
    const viaLearner = scoreLearner(rows, NOW).find((r) => r.capabilitySlug === 'proof-and-logic')!;
    assert.equal(viaLearner.level, isolated.level);
  });
});

describe('describeConfidence', () => {
  test('never speaks confidently about thin evidence', () => {
    // "72%" and "72%, based on one observation from March" are different
    // claims, and only one of them is honest.
    assert.equal(describeConfidence(0), 'emerging');
    assert.equal(describeConfidence(0.24), 'emerging');
    assert.equal(describeConfidence(0.25), 'indicative');
    assert.equal(describeConfidence(0.59), 'indicative');
    assert.equal(describeConfidence(0.6), 'solid');
    assert.equal(describeConfidence(1), 'solid');
  });

  test('a single attendance tick is never described as solid', () => {
    const r = scoreCapability([ev('attendance', 1)], NOW)!;
    assert.notEqual(describeConfidence(r.confidence), 'solid');
  });
});
