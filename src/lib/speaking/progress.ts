/**
 * SARIRO — the curve, which is the actual product
 * ============================================================================
 * Every practice attempt is measured already. Until now none of it was kept,
 * so a child could do forty reps and there was nothing afterwards to show for
 * it — not to them, not to their teacher, and not to the parent deciding
 * whether to renew.
 *
 * "Attended 8 classes" is something every competitor can print. "Filler words
 * 12 a minute down to 3, speaking pace 190 down to 148" is not, and it is
 * already sitting in memory the moment a recording stops. This is the file
 * that turns it into a history.
 *
 * ── Direction is the whole difficulty ───────────────────────────────────────
 * A trend is not "did the number go up". Fillers going up is worse; recall
 * going up is better; pace has a BAND and moving toward it from either side is
 * progress. A generic "is this bigger than last time" would tell a child who
 * slowed from a panicked 200wpm to a comfortable 150 that they got worse.
 *
 * So every metric declares which way is good, and pace declares a target
 * instead. Nothing here compares two numbers without knowing what they mean.
 *
 * ── Why the first attempt is never a trend ──────────────────────────────────
 * One point is not a line. A child who records once and is told they are
 * "improving" learns that the number is decorative. Trends need a floor of
 * attempts before they say anything at all.
 */

export type PracticeKind = 'speaking' | 'listening' | 'writing';

export interface PracticeAttempt {
  id?: string;
  kind: PracticeKind;
  /** Which drill or passage, when there was one. */
  drillId?: string | null;
  /** 0-100, as the analyser scored it. */
  score: number;
  /** Flat and chartable. See METRICS for what each one means. */
  metrics: Record<string, number>;
  createdAt: string;
}

/** Which way is better, and what a person should call it. */
export interface MetricSpec {
  key: string;
  label: string;
  /** 'up' better, 'down' better, or toward a band. */
  direction: 'up' | 'down' | 'band';
  band?: { min: number; max: number };
  unit?: string;
  /** Below this many attempts, do not draw a conclusion. */
  minAttempts?: number;
}

export const METRICS: Record<PracticeKind, MetricSpec[]> = {
  speaking: [
    /* A band, not a direction. Somebody who slowed from a panicked 200 to a
       comfortable 150 has improved, and "went down" would call that a loss. */
    { key: 'wpm', label: 'Speaking pace', direction: 'band', band: { min: 120, max: 165 }, unit: 'wpm' },
    { key: 'fillersPerMin', label: 'Filler words', direction: 'down', unit: '/min' },
    { key: 'phraseAverage', label: 'Words per phrase', direction: 'band', band: { min: 5, max: 18 } },
    { key: 'deliveryVariation', label: 'Voice variation', direction: 'up' },
  ],
  listening: [
    { key: 'recallPercent', label: 'Words caught', direction: 'up', unit: '%' },
    { key: 'sequencePercent', label: 'Kept the order', direction: 'up', unit: '%' },
    { key: 'invented', label: 'Words guessed', direction: 'down' },
  ],
  writing: [
    { key: 'variety', label: 'Sentence variety', direction: 'up' },
    { key: 'hedges', label: 'Soft words', direction: 'down' },
    { key: 'passive', label: 'Hidden subjects', direction: 'down' },
    { key: 'avgSentence', label: 'Sentence length', direction: 'band', band: { min: 12, max: 26 }, unit: 'w' },
  ],
};

/** The fewest attempts before any trend is claimed. */
export const TREND_FLOOR = 3;

export type Direction = 'better' | 'worse' | 'flat' | 'unknown';

export interface MetricTrend {
  spec: MetricSpec;
  first: number | null;
  latest: number | null;
  /** Positive means the raw number rose, whatever that means for this metric. */
  change: number | null;
  direction: Direction;
  /** "12 a minute down to 3" — the sentence a parent forwards. */
  sentence: string;
}

const round = (n: number, dp = 1) => {
  const f = 10 ** dp;
  return Math.round((n + Number.EPSILON) * f) / f;
};

/** Oldest first, so "first" and "latest" mean what they say. */
function chronological(attempts: PracticeAttempt[]): PracticeAttempt[] {
  return [...attempts]
    .filter((a) => Number.isFinite(Date.parse(a.createdAt)))
    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
}

/**
 * The average of the first few and the last few, rather than the single first
 * and single last.
 *
 * One bad recording at either end would otherwise decide the whole story, and
 * the first attempt is always the worst — it is somebody finding the button.
 */
function endpoints(values: number[]): { first: number; latest: number } | null {
  if (values.length < 2) return null;
  const window = Math.max(1, Math.min(3, Math.floor(values.length / 3)));
  const head = values.slice(0, window);
  const tail = values.slice(-window);
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  return { first: round(mean(head)), latest: round(mean(tail)) };
}

/** How far outside its band a value sits. Zero when it is inside. */
function bandDistance(value: number, band: { min: number; max: number }): number {
  if (value < band.min) return band.min - value;
  if (value > band.max) return value - band.max;
  return 0;
}

/** Movements smaller than this are noise, not progress. */
const NOISE = 0.05;

export function trendFor(attempts: PracticeAttempt[], spec: MetricSpec): MetricTrend {
  const values = chronological(attempts)
    .map((a) => a.metrics?.[spec.key])
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));

  const ends = values.length >= (spec.minAttempts ?? TREND_FLOOR) ? endpoints(values) : null;
  if (!ends) {
    return {
      spec,
      first: values.length ? round(values[0]) : null,
      latest: values.length ? round(values[values.length - 1]) : null,
      change: null,
      direction: 'unknown',
      sentence:
        values.length === 0
          ? `No ${spec.label.toLowerCase()} recorded yet.`
          : `${spec.label}: ${round(values[values.length - 1])}${spec.unit ?? ''} — a few more goes and we can show the trend.`,
    };
  }

  const { first, latest } = ends;
  const change = round(latest - first);

  let direction: Direction;
  if (spec.direction === 'band' && spec.band) {
    /* Closer to the band is better, from either side. */
    const before = bandDistance(first, spec.band);
    const after = bandDistance(latest, spec.band);
    /* Scaled to the reading, exactly as the up/down branch below is. A bare
       0.05 meant a 200wpm attempt that wobbled to 201 was announced as
       "worth a look", while the identical 0.5% drift on a filler count was
       correctly ignored — the same noise, reported two different ways. */
    const floor = Math.max(1, Math.abs(first)) * NOISE;
    direction = Math.abs(before - after) < floor ? 'flat' : after < before ? 'better' : 'worse';
  } else {
    const magnitude = Math.abs(change);
    const scale = Math.max(1, Math.abs(first)) * NOISE;
    if (magnitude < scale) direction = 'flat';
    else if (spec.direction === 'up') direction = change > 0 ? 'better' : 'worse';
    else direction = change < 0 ? 'better' : 'worse';
  }

  const u = spec.unit ?? '';
  const sentence =
    direction === 'flat'
      ? `${spec.label}: holding around ${latest}${u}.`
      : direction === 'better'
        ? `${spec.label}: ${first}${u} → ${latest}${u}.`
        : `${spec.label}: ${first}${u} → ${latest}${u} — worth a look.`;

  return { spec, first, latest, change, direction, sentence };
}

export interface KindSummary {
  kind: PracticeKind;
  attempts: number;
  /** Days on which they practised at all. Effort, separate from result. */
  activeDays: number;
  latestScore: number | null;
  bestScore: number | null;
  scoreTrend: Direction;
  trends: MetricTrend[];
  /** Most recent attempt, for "last practised". */
  lastAt: string | null;
}

export function summarise(attempts: PracticeAttempt[], kind: PracticeKind): KindSummary {
  const mine = chronological(attempts.filter((a) => a.kind === kind));
  const scores = mine.map((a) => a.score).filter((n) => Number.isFinite(n));

  const days = new Set(mine.map((a) => new Date(a.createdAt).toISOString().slice(0, 10)));
  const ends = scores.length >= TREND_FLOOR ? endpoints(scores) : null;

  let scoreTrend: Direction = 'unknown';
  if (ends) {
    const delta = ends.latest - ends.first;
    scoreTrend = Math.abs(delta) < Math.max(1, ends.first * NOISE) ? 'flat' : delta > 0 ? 'better' : 'worse';
  }

  return {
    kind,
    attempts: mine.length,
    activeDays: days.size,
    latestScore: scores.length ? scores[scores.length - 1] : null,
    bestScore: scores.length ? Math.max(...scores) : null,
    scoreTrend,
    trends: METRICS[kind].map((spec) => trendFor(mine, spec)),
    lastAt: mine.length ? mine[mine.length - 1].createdAt : null,
  };
}

/**
 * The two or three lines worth putting in front of a parent.
 *
 * Improvements first, because that is what the page is for, then anything
 * going the wrong way — never more than one of those. A list of six things a
 * child is bad at is a list a parent reads once.
 */
export function headlines(summaries: KindSummary[], limit = 3): string[] {
  const better = summaries.flatMap((s) => s.trends.filter((t) => t.direction === 'better'));
  const worse = summaries.flatMap((s) => s.trends.filter((t) => t.direction === 'worse'));

  const out = better.slice(0, limit).map((t) => t.sentence);
  if (out.length < limit && worse.length > 0) out.push(worse[0].sentence);
  return out;
}

/* ══════════════════════════════════════════════════════════════════════════
   Turning a report into a row
   ══════════════════════════════════════════════════════════════════════════
   Each analyser returns a rich object. Only the numbers that can be charted
   go into metrics — the prose notes are regenerated from the same input any
   time they are needed, and storing them would freeze wording that is still
   being edited.
   ══════════════════════════════════════════════════════════════════════════ */

const num = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? round(v, 2) : null;

const compact = (o: Record<string, number | null>): Record<string, number> =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null)) as Record<string, number>;

export function speakingMetrics(report: {
  pace?: { wpm?: number };
  fillers?: { perMinute?: number };
  phrasing?: { averageWords?: number };
  delivery?: { variation?: number };
}): Record<string, number> {
  return compact({
    wpm: num(report?.pace?.wpm),
    fillersPerMin: num(report?.fillers?.perMinute),
    phraseAverage: num(report?.phrasing?.averageWords),
    deliveryVariation: num(report?.delivery?.variation),
  });
}

export function listeningMetrics(report: {
  recall?: { percent?: number };
  sequence?: { percent?: number };
  invented?: { count?: number };
}): Record<string, number> {
  return compact({
    recallPercent: num(report?.recall?.percent),
    sequencePercent: num(report?.sequence?.percent),
    invented: num(report?.invented?.count),
  });
}

export function writingMetrics(report: {
  sentenceLength?: { average?: number; variety?: number };
  hedging?: { count?: number };
  passive?: { count?: number };
  words?: number;
}): Record<string, number> {
  return compact({
    variety: num(report?.sentenceLength?.variety),
    avgSentence: num(report?.sentenceLength?.average),
    hedges: num(report?.hedging?.count),
    passive: num(report?.passive?.count),
    words: num(report?.words),
  });
}

/* ══════════════════════════════════════════════════════════════════════════
   Effort, separately from result
   ══════════════════════════════════════════════════════════════════════════
   A score says how the last attempt went. It says nothing about whether the
   child came back on Tuesday, and coming back on Tuesday is the thing that
   actually moves a score. They are two different facts and they are reported
   as two different facts.
   ══════════════════════════════════════════════════════════════════════════ */

const DAY_MS = 86_400_000;

/** UTC calendar day. Local days would make the streak depend on the reader. */
const dayKey = (iso: string) => new Date(iso).toISOString().slice(0, 10);

export interface Streak {
  /** Days in a row, counting back from today. */
  current: number;
  /** The best run they have ever had. */
  best: number;
  /** Distinct days with at least one attempt. */
  days: number;
}

/**
 * Consecutive days of practice.
 *
 * A streak counts as unbroken while the last attempt was today OR yesterday.
 * Ending it at midnight punishes somebody who practises every evening for
 * being asked a question at 11am, and a streak that breaks while you are
 * asleep is a streak nobody trusts.
 *
 * `now` is injectable because a function whose answer depends on the wall
 * clock cannot otherwise be tested.
 */
export function streak(attempts: PracticeAttempt[], now: number = Date.now()): Streak {
  const days = [...new Set(
    attempts
      .filter((a) => Number.isFinite(Date.parse(a.createdAt)))
      .map((a) => dayKey(a.createdAt))
  )].sort();

  if (days.length === 0) return { current: 0, best: 0, days: 0 };

  let best = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    const gap = (Date.parse(days[i]) - Date.parse(days[i - 1])) / DAY_MS;
    run = gap === 1 ? run + 1 : 1;
    if (run > best) best = run;
  }

  const today = new Date(now).toISOString().slice(0, 10);
  const last = days[days.length - 1];
  const sinceLast = Math.round((Date.parse(today) - Date.parse(last)) / DAY_MS);

  /* Yesterday still counts — see above. Anything older has been broken. */
  let current = 0;
  if (sinceLast <= 1) {
    current = 1;
    for (let i = days.length - 1; i > 0; i--) {
      const gap = (Date.parse(days[i]) - Date.parse(days[i - 1])) / DAY_MS;
      if (gap !== 1) break;
      current++;
    }
  }

  return { current, best, days: days.length };
}

/* ══════════════════════════════════════════════════════════════════════════
   The one thing to do next
   ══════════════════════════════════════════════════════════════════════════
   Four numbers and three arrows is a report. A report tells somebody how they
   did; it does not tell them what to do on Tuesday, and a child reading their
   own progress page needs the second thing far more than the first.

   So exactly one instruction is produced, it names a metric they can see, and
   it is phrased as an action rather than a fault.
   ══════════════════════════════════════════════════════════════════════════ */

const ADVICE: Record<string, string> = {
  wpm: 'Read your next passage a shade slower than feels natural. Aim to land between 120 and 165 words a minute — that is the range a listener can follow without effort.',
  fillersPerMin: 'When you feel an "um" coming, close your mouth instead. A silent gap sounds considered; a filled one sounds unsure. Try one drill where you deliberately pause rather than fill.',
  phraseAverage: 'Break at the full stops. Read the passage drill and treat every comma as a small breath and every full stop as a real one.',
  deliveryVariation: 'Pick one sentence in your next attempt and say it like you mean it — louder on the word that matters. A flat voice is the fastest way to lose a room.',
  recallPercent: 'Play the passage once at 0.8×, then once at 1×, before answering. Catching the nouns first and filling in around them beats trying to hold every word.',
  sequencePercent: 'You are catching the words but not the order. Try repeating the passage out loud rather than typing it — order is easier to hold in speech than in your hands.',
  invented: 'You are filling gaps with words that were not said. Leave the gap. A blank is honest and it shows you exactly where to listen harder next time.',
  variety: 'Every sentence is coming out about the same length. Follow your next long one with a short one. Three words. Like that.',
  hedges: 'Cut the "quite", "maybe" and "sort of" from your next draft and read it back. Almost every one can go, and the sentence gets stronger without it.',
  passive: 'Say who did the thing. "Mistakes were made" hides somebody; "I got it wrong" does not, and it is the better sentence.',
  avgSentence: 'Your sentences are drifting away from a comfortable length. Twelve to twenty-six words reads easily — under that it is choppy, over it and the reader loses the thread.',
};

export interface Focus {
  kind: PracticeKind;
  spec: MetricSpec;
  /** Why it was picked, in the learner's words. */
  headline: string;
  /** What to actually do about it. */
  advice: string;
}

/**
 * The single weakest thing, with what to do about it.
 *
 * Anything actively going backwards is picked first, because a fall is news.
 * Failing that, anything sitting outside its band — a number that has been
 * quietly wrong the whole time and never moved is not visible in a trend.
 *
 * Returns null when there is nothing honest to say, which is a real answer
 * and better than inventing a fault to fill the box.
 */
export function nextFocus(summaries: KindSummary[]): Focus | null {
  const build = (kind: PracticeKind, t: MetricTrend, headline: string): Focus | null => {
    const advice = ADVICE[t.spec.key];
    return advice ? { kind, spec: t.spec, headline, advice } : null;
  };

  for (const s of summaries) {
    for (const t of s.trends) {
      if (t.direction === 'worse' && t.first != null && t.latest != null) {
        const u = t.spec.unit ?? '';
        const f = build(kind(s), t, `${t.spec.label} has moved the wrong way — ${t.first}${u} to ${t.latest}${u}.`);
        if (f) return f;
      }
    }
  }

  for (const s of summaries) {
    for (const t of s.trends) {
      if (t.direction === 'unknown' || t.latest == null) continue;
      const band = t.spec.band;
      if (!band) continue;
      if (t.latest >= band.min && t.latest <= band.max) continue;
      const u = t.spec.unit ?? '';
      const side = t.latest < band.min ? 'under' : 'over';
      const f = build(kind(s), t, `${t.spec.label} is sitting ${side} where it wants to be — ${t.latest}${u}, against ${band.min}–${band.max}${u}.`);
      if (f) return f;
    }
  }

  return null;
}

/** Narrow the kind off a summary without repeating the cast four times. */
function kind(s: KindSummary): PracticeKind {
  return s.kind;
}
