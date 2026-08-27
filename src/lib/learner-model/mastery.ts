/**
 * SARIRO — Mastery scoring
 * =========================================================
 * Turns a list of raw observations into a number and a confidence. Kept pure and
 * dependency-free on purpose: this function decides what a parent is told about
 * their child, so it must be testable in isolation and reviewable by someone who
 * does not read TypeScript for a living.
 *
 * Three principles, each of which exists because the obvious alternative fails:
 *
 *  1. **Demonstrated beats consumed.** A reviewed project outweighs ten completed
 *     lessons. Sitting through content is not evidence of capability, and any
 *     model that treats it as such rewards attendance and reports fiction.
 *
 *  2. **Recent beats old.** A learner who could do something eight months ago
 *     and has not touched it since is not the same as one who did it last week.
 *     Evidence decays toward — never below — half weight.
 *
 *  3. **Confidence is separate from level.** One data point can produce a high
 *     level; it must never produce a confident one. Every surface that renders a
 *     level is obliged to render its confidence too.
 */

export type EvidenceSource =
  | 'project_review'
  | 'mentor_note'
  | 'quiz'
  | 'lesson_complete'
  | 'attendance'
  | 'self_assessment';

/**
 * How much each kind of observation is worth. A human judging real work is the
 * strongest signal we have and the only one competitors cannot manufacture;
 * showing up is the weakest thing we bother recording.
 */
export const SOURCE_STRENGTH: Record<EvidenceSource, number> = {
  project_review: 1.0,
  mentor_note: 0.9,
  quiz: 0.5,
  self_assessment: 0.3,
  lesson_complete: 0.25,
  attendance: 0.15,
};

export interface EvidenceRow {
  capabilitySlug: string;
  source: EvidenceSource;
  /** -1..1 — negative means demonstrated inability, which is real information. */
  signal: number;
  /** 0..1 — how much of this capability the observed thing actually develops. */
  weight: number;
  observedAt: Date;
}

export interface MasteryResult {
  capabilitySlug: string;
  /** 0..100 */
  level: number;
  /** 0..1 */
  confidence: number;
  evidenceCount: number;
  lastEvidenceAt: Date;
}

/** Evidence keeps 100% of its weight for this long, then decays. */
const FRESH_DAYS = 30;
/** Floor for decay: old evidence still counts, it just stops dominating. */
const MIN_RECENCY = 0.5;
/** Evidence count at which confidence approaches its ceiling. */
const CONFIDENCE_SATURATION = 6;

const DAY_MS = 86_400_000;

/**
 * Full weight for a month, then a slow slide to half. Deliberately gentle: a
 * child who learned to reason algebraically has not un-learned it because the
 * summer holidays happened.
 */
export function recencyFactor(observedAt: Date, now: Date): number {
  const days = Math.max(0, (now.getTime() - observedAt.getTime()) / DAY_MS);
  if (days <= FRESH_DAYS) return 1;
  const decayed = 1 - ((days - FRESH_DAYS) / 365) * (1 - MIN_RECENCY);
  return Math.max(MIN_RECENCY, decayed);
}

/**
 * Confidence rises with the amount of evidence AND its quality, and is dragged
 * down when everything we know is stale. A single fresh project review is worth
 * more confidence than five attendance ticks.
 */
function computeConfidence(rows: EvidenceRow[], now: Date): number {
  const effective = rows.reduce(
    (sum, r) => sum + SOURCE_STRENGTH[r.source] * r.weight * recencyFactor(r.observedAt, now),
    0
  );
  return Math.min(1, effective / CONFIDENCE_SATURATION);
}

/**
 * Score one capability from every observation about it.
 *
 * A weighted mean, not a sum — so a learner with forty weak observations does
 * not out-rank one with three strong ones. Level is the mean signal mapped from
 * -1..1 onto 0..100, where 50 means "no demonstrated evidence either way".
 */
export function scoreCapability(rows: EvidenceRow[], now: Date = new Date()): MasteryResult | null {
  if (rows.length === 0) return null;

  let weightedSignal = 0;
  let totalWeight = 0;

  for (const row of rows) {
    const w = SOURCE_STRENGTH[row.source] * row.weight * recencyFactor(row.observedAt, now);
    weightedSignal += row.signal * w;
    totalWeight += w;
  }

  const meanSignal = totalWeight > 0 ? weightedSignal / totalWeight : 0;
  const level = Math.max(0, Math.min(100, ((meanSignal + 1) / 2) * 100));

  const lastEvidenceAt = rows.reduce(
    (latest, r) => (r.observedAt > latest ? r.observedAt : latest),
    rows[0].observedAt
  );

  return {
    capabilitySlug: rows[0].capabilitySlug,
    level: Math.round(level * 100) / 100,
    confidence: Math.round(computeConfidence(rows, now) * 1000) / 1000,
    evidenceCount: rows.length,
    lastEvidenceAt,
  };
}

/** Score every capability a learner has evidence for. */
export function scoreLearner(rows: EvidenceRow[], now: Date = new Date()): MasteryResult[] {
  const byCapability = new Map<string, EvidenceRow[]>();
  for (const row of rows) {
    const list = byCapability.get(row.capabilitySlug) ?? [];
    list.push(row);
    byCapability.set(row.capabilitySlug, list);
  }

  return [...byCapability.values()]
    .map((group) => scoreCapability(group, now))
    .filter((r): r is MasteryResult => r !== null)
    .sort((a, b) => b.level - a.level);
}

/**
 * How a level should be spoken about. Never render a bare number without this —
 * "72%" and "72%, based on one observation from March" are different claims, and
 * only one of them is honest.
 */
export function describeConfidence(confidence: number): 'emerging' | 'indicative' | 'solid' {
  if (confidence < 0.25) return 'emerging';
  if (confidence < 0.6) return 'indicative';
  return 'solid';
}
