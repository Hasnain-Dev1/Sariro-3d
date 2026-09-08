import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  trendFor, summarise, headlines, METRICS, TREND_FLOOR,
  speakingMetrics, listeningMetrics, writingMetrics,
  streak, nextFocus,
  type PracticeAttempt,
} from './progress';

/**
 * SARIRO — the number a parent renews on
 * ============================================================================
 * This decides what a family is told about their child's progress, so it has
 * to be right in a specific way: it must never call improvement a decline.
 *
 * The trap is treating every metric as "bigger is better". A child who slowed
 * from a panicked 200 words a minute to a comfortable 150 has got markedly
 * better at speaking, and a naive comparison reports that as a fall. Half the
 * tests below exist for that one mistake.
 */

const at = (kind: 'speaking' | 'listening' | 'writing', daysAgo: number, score: number, metrics: Record<string, number>): PracticeAttempt => ({
  kind,
  score,
  metrics,
  createdAt: new Date(Date.parse('2026-09-20T10:00:00Z') - daysAgo * 86_400_000).toISOString(),
});

const spec = (kind: 'speaking' | 'listening' | 'writing', key: string) =>
  METRICS[kind].find((s) => s.key === key)!;

describe('a metric where going down is the win', () => {
  const fillers = spec('speaking', 'fillersPerMin');

  test('fewer fillers reads as better', () => {
    const t = trendFor([
      at('speaking', 30, 40, { fillersPerMin: 12 }),
      at('speaking', 20, 55, { fillersPerMin: 9 }),
      at('speaking', 10, 70, { fillersPerMin: 4 }),
      at('speaking', 1, 78, { fillersPerMin: 3 }),
    ], fillers);
    assert.equal(t.direction, 'better');
    assert.match(t.sentence, /12.*→.*3/);
  });

  test('more fillers reads as worse, and says so gently', () => {
    const t = trendFor([
      at('speaking', 30, 70, { fillersPerMin: 3 }),
      at('speaking', 20, 60, { fillersPerMin: 7 }),
      at('speaking', 10, 50, { fillersPerMin: 11 }),
    ], fillers);
    assert.equal(t.direction, 'worse');
    assert.match(t.sentence, /worth a look/);
  });
});

describe('pace has a target, not a direction', () => {
  const pace = spec('speaking', 'wpm');

  /* The mistake this whole file exists to prevent. */
  test('slowing from a panicked 200 into the band is IMPROVEMENT', () => {
    const t = trendFor([
      at('speaking', 30, 40, { wpm: 205 }),
      at('speaking', 20, 50, { wpm: 190 }),
      at('speaking', 10, 65, { wpm: 160 }),
      at('speaking', 1, 75, { wpm: 148 }),
    ], pace);
    assert.equal(t.direction, 'better', 'slowing into the comfortable band must not read as a decline');
  });

  test('speeding up from a mumble into the band is also improvement', () => {
    const t = trendFor([
      at('speaking', 30, 40, { wpm: 80 }),
      at('speaking', 20, 50, { wpm: 100 }),
      at('speaking', 10, 65, { wpm: 130 }),
    ], pace);
    assert.equal(t.direction, 'better');
  });

  test('leaving the band is worse, whichever way they go', () => {
    const t = trendFor([
      at('speaking', 30, 70, { wpm: 145 }),
      at('speaking', 20, 60, { wpm: 175 }),
      at('speaking', 10, 50, { wpm: 205 }),
    ], pace);
    assert.equal(t.direction, 'worse');
  });

  test('moving around inside the band is neither', () => {
    const t = trendFor([
      at('speaking', 30, 70, { wpm: 130 }),
      at('speaking', 20, 72, { wpm: 155 }),
      at('speaking', 10, 71, { wpm: 140 }),
    ], pace);
    assert.equal(t.direction, 'flat');
  });
});

describe('one point is not a line', () => {
  /* A child told they are "improving" after a single recording learns the
     number is decorative. */
  test('below the floor, no trend is claimed', () => {
    const t = trendFor([at('listening', 1, 60, { recallPercent: 60 })], spec('listening', 'recallPercent'));
    assert.equal(t.direction, 'unknown');
    assert.match(t.sentence, /a few more goes/i);
  });

  test('nothing recorded says so rather than showing a zero', () => {
    const t = trendFor([], spec('listening', 'recallPercent'));
    assert.equal(t.latest, null);
    assert.match(t.sentence, /no .* recorded yet/i);
  });

  test('exactly at the floor is enough', () => {
    const rows = Array.from({ length: TREND_FLOOR }, (_, i) =>
      at('listening', 30 - i * 10, 50 + i * 10, { recallPercent: 50 + i * 15 })
    );
    assert.notEqual(trendFor(rows, spec('listening', 'recallPercent')).direction, 'unknown');
  });
});

describe('one bad take does not decide the story', () => {
  /* Endpoints average a few attempts at each end, because the very first
     recording is always somebody finding the button. */
  test('a single disastrous first attempt does not inflate the gain', () => {
    const withDisaster = trendFor([
      at('writing', 40, 10, { variety: 0.2 }),
      at('writing', 35, 55, { variety: 5 }),
      at('writing', 30, 57, { variety: 5.2 }),
      at('writing', 20, 60, { variety: 5.6 }),
      at('writing', 10, 62, { variety: 6 }),
      at('writing', 1, 63, { variety: 6.1 }),
    ], spec('writing', 'variety'));
    // First three average ~3.5, not 0.2 — so the claimed gain is honest.
    assert.ok(withDisaster.first !== null && withDisaster.first > 1, `first was ${withDisaster.first}`);
    assert.equal(withDisaster.direction, 'better');
  });
});

describe('noise is not progress', () => {
  test('a tiny wobble reads as holding steady', () => {
    const t = trendFor([
      at('listening', 30, 80, { recallPercent: 80 }),
      at('listening', 20, 81, { recallPercent: 81 }),
      at('listening', 10, 80, { recallPercent: 80.5 }),
    ], spec('listening', 'recallPercent'));
    assert.equal(t.direction, 'flat');
    assert.match(t.sentence, /holding around/i);
  });
});

describe('the summary a dashboard shows', () => {
  const rows: PracticeAttempt[] = [
    at('speaking', 20, 50, { wpm: 190, fillersPerMin: 10 }),
    at('speaking', 20, 55, { wpm: 180, fillersPerMin: 9 }),   // same day
    at('speaking', 10, 70, { wpm: 155, fillersPerMin: 4 }),
    at('speaking', 2, 80, { wpm: 150, fillersPerMin: 3 }),
    at('writing', 5, 65, { variety: 4 }),
  ];

  test('it counts only its own kind', () => {
    assert.equal(summarise(rows, 'speaking').attempts, 4);
    assert.equal(summarise(rows, 'writing').attempts, 1);
  });

  /* Effort is worth showing separately from result: two goes in one evening is
     one day of practice, not two. */
  test('active days are days, not attempts', () => {
    assert.equal(summarise(rows, 'speaking').activeDays, 3);
  });

  test('latest and best are not the same question', () => {
    const s = summarise([...rows, at('speaking', 0, 62, { wpm: 150 })], 'speaking');
    assert.equal(s.latestScore, 62);
    assert.equal(s.bestScore, 80);
  });

  test('a kind never practised is empty rather than zero', () => {
    const s = summarise(rows, 'listening');
    assert.equal(s.attempts, 0);
    assert.equal(s.latestScore, null);
    assert.equal(s.bestScore, null);
    assert.equal(s.scoreTrend, 'unknown');
    assert.equal(s.lastAt, null);
  });

  test('a broken timestamp is dropped rather than crashing the page', () => {
    const s = summarise([...rows, { kind: 'speaking', score: 50, metrics: {}, createdAt: 'nonsense' }], 'speaking');
    assert.equal(s.attempts, 4);
  });
});

describe('the lines a parent actually reads', () => {
  test('improvements come first', () => {
    const s = summarise([
      at('speaking', 30, 40, { fillersPerMin: 12, wpm: 200 }),
      at('speaking', 20, 60, { fillersPerMin: 7, wpm: 175 }),
      at('speaking', 10, 78, { fillersPerMin: 3, wpm: 150 }),
    ], 'speaking');
    const lines = headlines([s]);
    assert.ok(lines.length > 0);
    assert.ok(lines.some((l) => /filler/i.test(l)));
  });

  /* A list of six things a child is bad at is a list a parent reads once. */
  test('at most one thing going the wrong way', () => {
    const s = summarise([
      at('writing', 30, 70, { variety: 8, hedges: 1, passive: 0, avgSentence: 18 }),
      at('writing', 20, 55, { variety: 4, hedges: 6, passive: 3, avgSentence: 34 }),
      at('writing', 10, 45, { variety: 2, hedges: 9, passive: 5, avgSentence: 40 }),
    ], 'writing');
    const lines = headlines([s]);
    const bad = lines.filter((l) => /worth a look/.test(l));
    assert.ok(bad.length <= 1, `${bad.length} negatives shown`);
  });

  test('nothing to say yet says nothing rather than inventing', () => {
    assert.deepEqual(headlines([summarise([], 'speaking')]), []);
  });
});

describe('turning a report into a row', () => {
  test('speaking keeps only the chartable numbers', () => {
    const m = speakingMetrics({
      pace: { wpm: 152 }, fillers: { perMinute: 3.4 },
      phrasing: { averageWords: 9 }, delivery: { variation: 0.31 },
    });
    assert.deepEqual(m, { wpm: 152, fillersPerMin: 3.4, phraseAverage: 9, deliveryVariation: 0.31 });
  });

  test('listening and writing likewise', () => {
    assert.deepEqual(
      listeningMetrics({ recall: { percent: 82 }, sequence: { percent: 100 }, invented: { count: 1 } }),
      { recallPercent: 82, sequencePercent: 100, invented: 1 }
    );
    const w = writingMetrics({ sentenceLength: { average: 17.4, variety: 6.2 }, hedging: { count: 2 }, passive: { count: 1 }, words: 140 });
    assert.equal(w.variety, 6.2);
    assert.equal(w.words, 140);
  });

  /* A missing field must not become a zero — a zero is a measurement and an
     absence is not, and one of them would drag an average down. */
  test('missing fields are omitted, never zeroed', () => {
    const m = speakingMetrics({ pace: { wpm: 150 } });
    assert.deepEqual(Object.keys(m), ['wpm']);
    assert.equal('fillersPerMin' in m, false);
  });

  test('an empty report produces an empty row rather than throwing', () => {
    assert.deepEqual(speakingMetrics({}), {});
    assert.deepEqual(listeningMetrics({}), {});
    assert.deepEqual(writingMetrics({}), {});
  });
});

/* ══════════════════════════════════════════════════════════════════════════
   Streaks, and the one thing to do next
   ══════════════════════════════════════════════════════════════════════════ */

const DAY = 86_400_000;
const day = (daysAgo: number, over = 0): PracticeAttempt => ({
  kind: 'speaking',
  score: 60,
  metrics: {},
  createdAt: new Date(NOW - daysAgo * DAY + over).toISOString(),
});

const NOW = Date.parse('2026-09-08T09:00:00.000Z');

describe('streak', () => {
  test('nothing recorded is a zero, not a crash', () => {
    const s = streak([], NOW);
    assert.deepEqual(s, { current: 0, best: 0, days: 0 });
  });

  test('three days running', () => {
    const s = streak([day(0), day(1), day(2)], NOW);
    assert.equal(s.current, 3);
    assert.equal(s.days, 3);
  });

  test('several goes in one day is one day', () => {
    // Otherwise a child who practises six times on Sunday has a six-day
    // streak, which is a lie that gets found out on Monday.
    const s = streak([day(0), day(0, 1000), day(0, 2000)], NOW);
    assert.equal(s.current, 1);
    assert.equal(s.days, 1);
  });

  test('a streak survives until a whole day is missed', () => {
    // Last practised yesterday, asked this morning: still going. Breaking it
    // at midnight punishes an evening learner for being asked at 11am.
    const s = streak([day(1), day(2), day(3)], NOW);
    assert.equal(s.current, 3);
  });

  test('two days off ends it', () => {
    const s = streak([day(2), day(3), day(4)], NOW);
    assert.equal(s.current, 0);
    assert.equal(s.best, 3);
  });

  test('best remembers a run that has already been broken', () => {
    const s = streak([day(10), day(11), day(12), day(13), day(0)], NOW);
    assert.equal(s.current, 1);
    assert.equal(s.best, 4);
  });
});

describe('nextFocus', () => {
  const speaking = (rows: Array<Record<string, number>>): PracticeAttempt[] =>
    rows.map((metrics, i) => ({
      kind: 'speaking' as const,
      score: 60,
      metrics,
      createdAt: new Date(NOW - (rows.length - i) * DAY).toISOString(),
    }));

  test('a metric going backwards is picked, with something to do about it', () => {
    const attempts = speaking([
      { fillersPerMin: 2 }, { fillersPerMin: 3 }, { fillersPerMin: 4 },
      { fillersPerMin: 9 }, { fillersPerMin: 10 }, { fillersPerMin: 11 },
    ]);
    const f = nextFocus([summarise(attempts, 'speaking')]);
    assert.ok(f);
    assert.equal(f.spec.key, 'fillersPerMin');
    assert.match(f.headline, /wrong way/);
    assert.ok(f.advice.length > 40, 'advice has to say what to actually do');
  });

  test('a number quietly outside its band is found even when nothing is moving', () => {
    // The trap this exists for: someone stuck at 200wpm for a month has a
    // flat trend and a real problem. A page that only reports movement says
    // nothing at all to them.
    const attempts = speaking([
      { wpm: 200 }, { wpm: 201 }, { wpm: 199 }, { wpm: 200 }, { wpm: 202 }, { wpm: 200 },
    ]);
    const f = nextFocus([summarise(attempts, 'speaking')]);
    assert.ok(f);
    assert.equal(f.spec.key, 'wpm');
    assert.match(f.headline, /over/);
  });

  test('a decline outranks a band miss', () => {
    const attempts = speaking([
      { wpm: 200, fillersPerMin: 2 }, { wpm: 200, fillersPerMin: 2 }, { wpm: 200, fillersPerMin: 3 },
      { wpm: 200, fillersPerMin: 9 }, { wpm: 200, fillersPerMin: 10 }, { wpm: 200, fillersPerMin: 11 },
    ]);
    const f = nextFocus([summarise(attempts, 'speaking')]);
    assert.ok(f);
    assert.equal(f.spec.key, 'fillersPerMin', 'a fall is news; a standing problem is not');
  });

  test('nothing wrong returns null rather than inventing a fault', () => {
    const attempts = speaking([
      { wpm: 140, fillersPerMin: 3, phraseAverage: 10, deliveryVariation: 5 },
      { wpm: 142, fillersPerMin: 3, phraseAverage: 11, deliveryVariation: 5 },
      { wpm: 141, fillersPerMin: 2, phraseAverage: 10, deliveryVariation: 6 },
      { wpm: 143, fillersPerMin: 2, phraseAverage: 11, deliveryVariation: 6 },
      { wpm: 140, fillersPerMin: 2, phraseAverage: 10, deliveryVariation: 6 },
      { wpm: 142, fillersPerMin: 2, phraseAverage: 11, deliveryVariation: 6 },
    ]);
    assert.equal(nextFocus([summarise(attempts, 'speaking')]), null);
  });

  test('too little data says nothing', () => {
    const f = nextFocus([summarise(speaking([{ wpm: 250 }]), 'speaking')]);
    assert.equal(f, null);
  });
});
