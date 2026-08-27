import { listContentUnits, type UnitKey } from '@/lib/curriculum/identity';
import { flattenTaxonomy } from '@/lib/capabilities/taxonomy';

/**
 * SARIRO — Content → Capability tags
 * =========================================================
 * Which strands of the map each existing lesson actually develops. This is the
 * migration that makes 61 already-written lessons usable by the learner model —
 * **no lesson content is rewritten, only tagged.**
 *
 * `weight` is how much of that strand this one lesson develops, 0–1. It is not a
 * share and the weights do not sum to 1: a lesson can be 0.9 of one thing and
 * 0.5 of another. Weight feeds evidence strength in S1, so be honest — inflating
 * everything to 1.0 makes every learner look identically strong and destroys the
 * signal the whole model rests on.
 *
 * Two rules held while tagging:
 *
 *  1. **Tag what the lesson develops, not what it mentions.** "Custom domains &
 *     DNS" develops networks, not web design, even though it appears in a web
 *     course.
 *  2. **Meta-strands are earned, not sprinkled.** `problem-solving` is tagged on
 *     build and capstone lessons where a learner genuinely faces an unsolved
 *     problem — not on every lesson because it sounds good. If every lesson
 *     claimed creativity, the parent view would report noise.
 *
 * Most of the map has nothing here, and that is correct: the map is the promise,
 * mentors are the delivery system, and content is optional scaffolding.
 */

export type ContentTag = readonly [strandSlug: string, weight: number];

export const CONTENT_TAGS: Record<UnitKey, readonly ContentTag[]> = {
  /* ── Momentum · web-101 — Module 1: HTML + CSS ─────────────────────────── */
  'web-101:1:0': [['digital-craft', 0.8], ['software-systems', 0.3]],
  'web-101:1:1': [['digital-craft', 0.8], ['design-and-composition', 0.4]],
  'web-101:1:2': [['digital-craft', 0.7], ['design-and-composition', 0.6]],
  'web-101:1:3': [['digital-craft', 0.7], ['design-and-composition', 0.6]],
  'web-101:1:4': [['design-and-composition', 0.7], ['digital-craft', 0.5]],
  'web-101:1:5': [['digital-craft', 0.9], ['problem-solving', 0.5], ['creativity', 0.4]],

  /* ── Module 2: JavaScript ──────────────────────────────────────────────── */
  'web-101:2:0': [['programming-foundations', 0.9], ['computational-thinking', 0.5]],
  'web-101:2:1': [['programming-foundations', 0.9], ['computational-thinking', 0.6]],
  'web-101:2:2': [['programming-foundations', 0.7], ['digital-craft', 0.7]],
  'web-101:2:3': [['programming-foundations', 0.7], ['digital-craft', 0.6]],
  'web-101:2:4': [['programming-foundations', 0.6], ['digital-craft', 0.5], ['data-and-databases', 0.4]],
  'web-101:2:5': [['programming-foundations', 0.8], ['digital-craft', 0.7], ['problem-solving', 0.6]],

  /* ── Module 3: React + Next.js ─────────────────────────────────────────── */
  'web-101:3:0': [['software-systems', 0.7], ['programming-foundations', 0.6], ['digital-craft', 0.6]],
  'web-101:3:1': [['programming-foundations', 0.7], ['software-systems', 0.6]],
  'web-101:3:2': [['programming-foundations', 0.6], ['software-systems', 0.5], ['networks-and-security', 0.3]],
  'web-101:3:3': [['programming-foundations', 0.7], ['digital-craft', 0.5]],
  'web-101:3:4': [['digital-craft', 0.7], ['design-and-composition', 0.6]],
  'web-101:3:5': [['digital-craft', 0.8], ['software-systems', 0.6], ['problem-solving', 0.5]],

  /* ── Module 4: AI features ─────────────────────────────────────────────── */
  'web-101:4:0': [['artificial-intelligence', 0.8], ['programming-foundations', 0.4]],
  'web-101:4:1': [['artificial-intelligence', 0.6], ['software-systems', 0.5]],
  'web-101:4:2': [['artificial-intelligence', 0.8], ['writing-and-composition', 0.4], ['critical-thinking', 0.3]],
  'web-101:4:3': [['software-systems', 0.6], ['programming-foundations', 0.5]],
  'web-101:4:4': [['software-systems', 0.7], ['problem-solving', 0.4]],
  'web-101:4:5': [['artificial-intelligence', 0.8], ['digital-craft', 0.6], ['problem-solving', 0.5]],

  /* ── Module 5: Deploy + capstone ───────────────────────────────────────── */
  'web-101:5:0': [['digital-craft', 0.7], ['software-systems', 0.5]],
  'web-101:5:1': [['networks-and-security', 0.6], ['software-systems', 0.5]],
  'web-101:5:2': [['networks-and-security', 0.7]],
  'web-101:5:3': [['marketing-and-audience', 0.6], ['digital-craft', 0.4]],
  'web-101:5:4': [['digital-craft', 0.9], ['problem-solving', 0.7], ['persistence-and-resilience', 0.6], ['creativity', 0.5]],
  'web-101:5:5': [['writing-and-composition', 0.7], ['metacognition', 0.5], ['marketing-and-audience', 0.4]],

  /* ── Orbit · web-201 ───────────────────────────────────────────────────── */
  'web-201:1:0': [['software-systems', 0.7], ['digital-craft', 0.6]],

  /* ── Compass · agent-101 — Module 1: Agent foundations ─────────────────── */
  'agent-101:1:0': [['artificial-intelligence', 0.8], ['programming-foundations', 0.4]],
  'agent-101:1:1': [['artificial-intelligence', 0.9], ['critical-thinking', 0.3]],
  'agent-101:1:2': [['artificial-intelligence', 0.8], ['writing-and-composition', 0.4]],
  'agent-101:1:3': [['software-systems', 0.7], ['problem-solving', 0.4]],
  'agent-101:1:4': [['artificial-intelligence', 0.5], ['software-systems', 0.5]],
  'agent-101:1:5': [['artificial-intelligence', 0.8], ['programming-foundations', 0.6], ['problem-solving', 0.5]],

  /* ── Module 2: Tool use ────────────────────────────────────────────────── */
  'agent-101:2:0': [['artificial-intelligence', 0.8], ['computational-thinking', 0.4]],
  'agent-101:2:1': [['artificial-intelligence', 0.7], ['programming-foundations', 0.6]],
  'agent-101:2:2': [['artificial-intelligence', 0.7], ['problem-solving', 0.6], ['proof-and-logic', 0.3]],
  'agent-101:2:3': [['artificial-intelligence', 0.6], ['programming-foundations', 0.5], ['networks-and-security', 0.3]],
  'agent-101:2:4': [['networks-and-security', 0.7], ['critical-thinking', 0.4]],
  'agent-101:2:5': [['artificial-intelligence', 0.8], ['problem-solving', 0.5]],

  /* ── Module 3: Memory ──────────────────────────────────────────────────── */
  'agent-101:3:0': [['artificial-intelligence', 0.7], ['software-systems', 0.4]],
  'agent-101:3:1': [['software-systems', 0.6], ['artificial-intelligence', 0.5]],
  'agent-101:3:2': [['artificial-intelligence', 0.6], ['writing-and-composition', 0.4]],
  'agent-101:3:3': [['artificial-intelligence', 0.8], ['data-and-databases', 0.6]],
  'agent-101:3:4': [['data-and-databases', 0.6], ['software-systems', 0.5]],
  'agent-101:3:5': [['artificial-intelligence', 0.8], ['data-and-databases', 0.5], ['problem-solving', 0.5]],

  /* ── Module 4: Reasoning ───────────────────────────────────────────────── */
  'agent-101:4:0': [['artificial-intelligence', 0.8], ['problem-solving', 0.5], ['proof-and-logic', 0.3]],
  'agent-101:4:1': [['artificial-intelligence', 0.7], ['critical-thinking', 0.5], ['proof-and-logic', 0.4]],
  'agent-101:4:2': [['problem-solving', 0.8], ['computational-thinking', 0.6], ['artificial-intelligence', 0.6]],
  'agent-101:4:3': [['metacognition', 0.6], ['artificial-intelligence', 0.6], ['critical-thinking', 0.4]],
  'agent-101:4:4': [['problem-solving', 0.7], ['software-systems', 0.5], ['persistence-and-resilience', 0.3]],
  'agent-101:4:5': [['artificial-intelligence', 0.8], ['problem-solving', 0.6]],

  /* ── Module 5: Ship it ─────────────────────────────────────────────────── */
  'agent-101:5:0': [['digital-craft', 0.7], ['programming-foundations', 0.4]],
  'agent-101:5:1': [['digital-craft', 0.7], ['design-and-composition', 0.5]],
  'agent-101:5:2': [['networks-and-security', 0.6], ['software-systems', 0.5]],
  'agent-101:5:3': [['digital-craft', 0.7], ['software-systems', 0.4]],
  'agent-101:5:4': [['product-thinking', 0.6], ['digital-craft', 0.5], ['design-and-composition', 0.4]],
  'agent-101:5:5': [['writing-and-composition', 0.7], ['metacognition', 0.6], ['marketing-and-audience', 0.3]],
};

export interface TagProblem {
  unitKey: string;
  detail: string;
}

/**
 * A tag pointing at a slug or unit that does not exist is silent data loss — the
 * row inserts fine and the evidence it should have carried never appears.
 */
export function validateContentTags(): TagProblem[] {
  const problems: TagProblem[] = [];
  const strands = new Set(flattenTaxonomy().filter((n) => n.kind === 'strand').map((n) => n.slug));
  const units = new Set(listContentUnits().map((u) => u.unitKey));

  for (const [unitKey, tags] of Object.entries(CONTENT_TAGS)) {
    if (!units.has(unitKey)) problems.push({ unitKey, detail: 'no such content unit' });
    const seen = new Set<string>();
    for (const [slug, weight] of tags) {
      if (!strands.has(slug)) problems.push({ unitKey, detail: `unknown strand "${slug}"` });
      if (seen.has(slug)) problems.push({ unitKey, detail: `duplicate strand "${slug}"` });
      if (weight <= 0 || weight > 1) problems.push({ unitKey, detail: `weight ${weight} out of range for "${slug}"` });
      seen.add(slug);
    }
  }

  for (const unitKey of units) {
    if (!CONTENT_TAGS[unitKey]) problems.push({ unitKey, detail: 'content unit has no capability tags' });
  }

  return problems;
}
