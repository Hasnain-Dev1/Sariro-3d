import { PRICING_TIERS, classesForTier, discountPercent } from '@/lib/sariro-data';

/**
 * SARIRO — a coding tier, as a card shows it
 * ============================================================================
 * The homepage's Coding & AI cards used to do this arithmetic inline, in JSX,
 * and only ever for the small batch. Pulled out so the card is layout and
 * nothing else, and so what a parent reads — the price, the price per class,
 * where the button goes — is tested rather than eyeballed.
 */

export type CodingRatio = '1:4' | '1:1';

type Tier = (typeof PRICING_TIERS)[number];

export type FeatureLine = { kind: 'item' | 'heading'; text: string };

export interface CodingTierView {
  id: string;
  name: string;
  tagline: string;
  popular: boolean;
  /** What is charged, once, at this ratio. null for a custom-quoted tier. */
  price: number | null;
  /** The crossed-out price, only when a real discount is running. */
  was: number | null;
  savePercent: number;
  classes: number | null;
  perClass: number | null;
  features: FeatureLine[];
  cta: string;
  href: string;
}

/** Tier ids and course levels disagree on one name: the top tier is "expert" here, "Advanced" on /courses. */
const COURSE_LEVEL: Record<string, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  expert: 'Advanced',
};

export function courseLevelFor(tierId: string): string {
  return COURSE_LEVEL[tierId] ?? tierId.charAt(0).toUpperCase() + tierId.slice(1);
}

/**
 * The feature list, made true for the ratio on screen.
 *
 * The data says "1:4 teacher-student ratio (1 teacher per 4 students)" on every
 * tier, which is a lie the moment somebody switches to one to one. And
 * "Everything in Beginner, plus:" is a heading, not a benefit — drawn with a
 * tick beside it, it read as a feature called "Everything in Beginner, plus:".
 */
export function featureLines(features: readonly string[], ratio: CodingRatio): FeatureLine[] {
  return features.map((f) => {
    if (/^1:4 teacher-student ratio/i.test(f)) {
      return { kind: 'item', text: ratio === '1:1' ? 'One to one — the mentor is all yours' : 'Four learners to one mentor' };
    }
    if (/plus:\s*$/i.test(f)) return { kind: 'heading', text: f.replace(/:\s*$/, '') };
    return { kind: 'item', text: f };
  });
}

export function codingTierView(tier: Tier, ratio: CodingRatio): CodingTierView {
  const base = tier.price as number | null;
  const oneOnOne = (tier as { oneOnOnePrice?: number | null }).oneOnOnePrice ?? null;
  const price = base === null ? null : ratio === '1:1' ? oneOnOne ?? base : base;
  const classes = classesForTier(tier.id);
  /* A discount is quoted against the group price it was set for. On one to
     one there is no "was" figure, so none is shown rather than a wrong one. */
  const was = ratio === '1:4' ? ((tier as { originalPrice?: number | null }).originalPrice ?? null) : null;
  const savePercent = ratio === '1:4' ? discountPercent(base, was) : 0;

  return {
    id: tier.id,
    name: tier.name,
    tagline: tier.tagline,
    popular: !!tier.popular,
    price,
    was: savePercent > 0 ? was : null,
    savePercent,
    classes,
    perClass: price !== null && classes ? Math.round((price / classes) * 100) / 100 : null,
    features: featureLines(tier.features, ratio),
    cta: tier.cta,
    href: `/courses?level=${courseLevelFor(tier.id)}`,
  };
}

export const codingTierViews = (ratio: CodingRatio): CodingTierView[] =>
  PRICING_TIERS.map((t) => codingTierView(t, ratio));
