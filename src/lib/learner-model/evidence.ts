import { CONTENT_TAGS } from '@/lib/capabilities/content-tags';
import type { UnitKey } from '@/lib/curriculum/identity';
import type { EvidenceSource } from '@/lib/learner-model/mastery';

/**
 * SARIRO — Recording evidence
 * =========================================================
 * One entry point for writing to the ledger, so every observation in the product
 * is shaped the same way and the scoring never has to guess what a row meant.
 *
 * Callers describe *what happened* ("this project was reviewed Partial"); this
 * module works out which capabilities that touches and how strongly, using the
 * content tags. A caller should never hand-pick a capability slug — that is how
 * two features end up disagreeing about what a lesson teaches.
 *
 * Writes go through service-role API routes only. The ledger is append-only at
 * the database level, so a mistake here is permanent: prefer recording nothing
 * over recording something wrong.
 */

export interface EvidenceInput {
  learnerId: string;
  source: EvidenceSource;
  /** The thing observed — e.g. a project_submissions id. Makes replays idempotent. */
  sourceRef?: string | null;
  /** -1..1. Negative is legitimate and meaningful. */
  signal: number;
  observedAt?: Date;
  note?: string | null;
  recordedBy?: string | null;
}

/** A row ready to insert into `learning_evidence`. */
export interface EvidenceRowInsert {
  learner_id: string;
  capability_slug: string;
  source: EvidenceSource;
  source_ref: string | null;
  unit_key: string | null;
  signal: number;
  weight: number;
  note: string | null;
  observed_at: string;
  recorded_by: string | null;
}

/**
 * The three-way project review is the strongest signal in the product, and the
 * only one a competitor cannot fabricate — it requires a human who watched the
 * work happen.
 *
 * `invalid` is deliberately negative rather than zero. Zero would mean "we
 * learned nothing", but a submission a teacher judged invalid tells us the
 * learner cannot yet do this — real information, and the thing that stops every
 * learner's profile drifting upward forever.
 */
export function signalForReview(outcome: 'complete' | 'partial' | 'invalid'): number {
  if (outcome === 'complete') return 1;
  if (outcome === 'partial') return 0.3;
  return -0.5;
}

/**
 * Turn one observation about a content unit into evidence rows — one per
 * capability that unit develops, each carrying that tag's weight.
 *
 * Returns an empty array for an untagged unit rather than inventing a tag.
 */
export function evidenceForUnit(unitKey: UnitKey, input: EvidenceInput): EvidenceRowInsert[] {
  const tags = CONTENT_TAGS[unitKey];
  if (!tags?.length) return [];

  const observedAt = (input.observedAt ?? new Date()).toISOString();

  return tags.map(([capabilitySlug, weight]) => ({
    learner_id: input.learnerId,
    capability_slug: capabilitySlug,
    source: input.source,
    source_ref: input.sourceRef ?? null,
    unit_key: unitKey,
    signal: clampSignal(input.signal),
    weight,
    note: input.note ?? null,
    observed_at: observedAt,
    recorded_by: input.recordedBy ?? null,
  }));
}

/**
 * Evidence a mentor records directly against a capability, with no lesson
 * involved — "she started attempting problems before asking for help."
 *
 * This is the input no competitor has. Khan Academy cannot observe it, and no
 * model can infer it from clickstream. It is the moat's supply line.
 */
export function evidenceForObservation(
  capabilitySlug: string,
  input: EvidenceInput,
  weight = 1
): EvidenceRowInsert {
  return {
    learner_id: input.learnerId,
    capability_slug: capabilitySlug,
    source: input.source,
    source_ref: input.sourceRef ?? null,
    unit_key: null,
    signal: clampSignal(input.signal),
    weight: Math.max(0.001, Math.min(1, weight)),
    note: input.note ?? null,
    observed_at: (input.observedAt ?? new Date()).toISOString(),
    recorded_by: input.recordedBy ?? null,
  };
}

function clampSignal(signal: number): number {
  if (!Number.isFinite(signal)) return 0;
  return Math.max(-1, Math.min(1, signal));
}
