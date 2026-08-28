import { CONTENT_TAGS } from '@/lib/capabilities/content-tags';
import { DOMAINS } from '@/lib/capabilities/taxonomy';
import { parseUnitKey } from '@/lib/curriculum/identity';

/**
 * SARIRO — Which strands a course develops
 * =========================================================
 * The reverse of the strand page's lookup, over the same tags.
 *
 * This is what stops a course from reading as a SKU. On its own, "Web Builder
 * Pro — Beginner" is a product you finish. Shown as *Digital Craft · Programming
 * Foundations · Problem Solving*, it becomes one way to travel part of the map —
 * which is the entire repositioning, expressed in a list.
 */

export interface CourseStrand {
  slug: string;
  name: string;
  domainName: string;
  /** Lessons in this course that develop this strand. */
  lessonCount: number;
  /** Sum of tag weights — how central the strand is to the course. */
  emphasis: number;
}

const STRAND_INDEX = new Map(
  DOMAINS.flatMap((d) => d.strands.map((s) => [s.slug, { name: s.name, domainName: d.name }]))
);

/**
 * Strands this course develops, most central first.
 *
 * Ranked by summed weight rather than lesson count, so a strand two lessons
 * teach deeply outranks one five lessons mention in passing.
 */
export function strandsForCourse(courseId: string): CourseStrand[] {
  const totals = new Map<string, { lessonCount: number; emphasis: number }>();

  for (const [unitKey, tags] of Object.entries(CONTENT_TAGS)) {
    const parsed = parseUnitKey(unitKey);
    if (!parsed || parsed.courseId !== courseId) continue;

    for (const [slug, weight] of tags) {
      const entry = totals.get(slug) ?? { lessonCount: 0, emphasis: 0 };
      entry.lessonCount += 1;
      entry.emphasis += weight;
      totals.set(slug, entry);
    }
  }

  return [...totals.entries()]
    .flatMap(([slug, v]) => {
      const meta = STRAND_INDEX.get(slug);
      if (!meta) return [];
      return [{ slug, name: meta.name, domainName: meta.domainName, ...v }];
    })
    .sort((a, b) => b.emphasis - a.emphasis);
}
