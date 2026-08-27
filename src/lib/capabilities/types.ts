/**
 * SARIRO — Capability Map
 * =========================================================
 * This is the outline of everything a person can become capable of. It is NOT a
 * curriculum, a course list, or a syllabus. Nothing here is content. It is the
 * map a learner points at and says *"that — I want to become that."*
 *
 * Three levels:
 *
 *   DOMAIN      a field of human capability            (Mathematics)
 *   STRAND      a coherent thread inside it            (Algebraic Reasoning)
 *   CAPABILITY  the actual learnable thing             (solve for an unknown)
 *
 * ── Why there is no "KG map" and no "advanced map" ─────────────────────────
 * Age is not a level of this map. Every node carries STAGES instead, so a
 * six-year-old and a thirty-five-year-old enter the same node at different
 * depths and neither is in the wrong place:
 *
 *   Number Sense
 *     foundation  counting, quantity, "5 is more than 3"
 *     developing  place value, operations, fractions
 *     proficient  ratio, proportion, negative numbers
 *     advanced    number theory, modular arithmetic
 *
 * The map therefore never needs rebuilding as a learner grows — they move
 * through it, not out of it.
 *
 * ── Why breadth before depth ───────────────────────────────────────────────
 * The promise is "learn anything." A map that only goes deep on programming
 * proves the opposite. So the spine is authored across every domain first, and
 * depth is added wherever real learners actually go.
 *
 * Content is optional scaffolding hanging off a few nodes. The mentor is the
 * delivery system, and the map is the promise.
 */

/** Depth within a node. Replaces grade, year group and "beginner course". */
export type Stage = 'foundation' | 'developing' | 'proficient' | 'advanced';

export const STAGES: readonly Stage[] = ['foundation', 'developing', 'proficient', 'advanced'] as const;

export interface Strand {
  /** Stable, globally unique. Never change once evidence points at it. */
  slug: string;
  name: string;
  /** Learner-facing, in terms of what they become able to do. */
  description: string;
  /**
   * What a learner actually types when looking for this. The map is written in
   * capability language ("Number Sense"), but people search in subject language
   * ("fractions", "times tables"). Without these, the front door answers "what do
   * you want to learn?" with nothing for most real queries.
   */
  keywords: string[];
}

export interface Domain {
  slug: string;
  name: string;
  description: string;
  /**
   * Meta-domains describe *how* a person learns rather than *what* they learn.
   * They are what the parent view reports and the only part of the map that
   * survives a learner changing field entirely — so they are modelled
   * first-class, never derived as a side effect of subject work.
   */
  isMeta?: boolean;
  strands: Strand[];
}

/** A flattened node, the shape the database stores. */
export interface CapabilityNode {
  slug: string;
  name: string;
  kind: 'domain' | 'strand';
  domainSlug: string;
  parentSlug: string | null;
  description: string;
  isMeta: boolean;
  sortOrder: number;
}
