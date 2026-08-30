import { COURSES, type LearningRatio } from '@/lib/sariro-data';
import { codingPrice } from '@/lib/pricing/coding';
import {
  LESSONS_PER_GRADE,
  LESSONS_PER_GROUP,
  getSpecialisation,
  getSubject,
  gradeGroupFor,
} from '@/lib/school/curriculum';
import { cadencePlans, formatPrice, type Cadence } from '@/lib/school/pricing';

/**
 * SARIRO — one checkout, every product
 * =========================================================
 * There used to be two checkouts, and they disagreed about almost everything:
 *
 *   /checkout  coding tracks   static Razorpay links, fixed prices, ratio toggle
 *   /enroll    school + focus  server-priced orders, cadences, card-or-bank
 *
 * Two surfaces meant two places to fix a bug, two places for a price to drift,
 * and a buyer's experience that changed depending on which thing they bought.
 * Worse, only one of them was safe: the coding path handed Razorpay a static
 * link with a hard-coded amount, so what was displayed and what was charged
 * were two independent facts.
 *
 * This resolver turns any product's URL parameters into ONE shape, so a single
 * page can render all of them and a single server route can price all of them.
 *
 * ── The shapes genuinely differ, and that is fine ────────────────────────────
 *   Coding       one-time price, varies by RATIO, no cadence
 *   School/Focus recurring, varies by ratio AND CADENCE
 *
 * Rather than pretend they are identical, the item says which controls apply
 * (`offersCadence`) and the page renders accordingly. Forcing a fake cadence
 * onto a one-time purchase would be a worse lie than two pages were.
 */

export type CheckoutKind = 'course' | 'school';

export interface CheckoutItem {
  /** What `create-order` needs to price it. */
  kind: CheckoutKind;
  /** Identifies the product within its kind. */
  slug: string;
  /** "Mathematics", "Momentum" — what the thing is called. */
  name: string;
  /** The selling line, shown as the heading of the summary. */
  tagline: string;
  accent: string;
  /** "Grade 7", "Grades 7–9", "Focus course", "Beginner" */
  scopeLabel: string;
  classes: number;
  backHref: string;
  /** Coding is a one-time purchase; school and focus are paid over time. */
  offersCadence: boolean;

  /** What they hand over today. */
  perPayment: number;
  perPaymentFormatted: string;
  payments: number;
  lifetimeTotal: number;
  lifetimeFormatted: string;
  savingLabel: string | null;

  /**
   * Exactly what gets POSTed to `create-order`. The client never sends an
   * amount — the server prices it from the same libraries this resolver used,
   * so a tampered request cannot change what is charged.
   */
  orderBody: Record<string, unknown>;
  /** For the Razorpay modal's description line. */
  courseName: string;
  track: string;
  level: string;
}

export interface CheckoutParams {
  /** Coding: `?course=web-101` */
  course?: string | null;
  /** School: `?subject=mathematics&grade=7&scope=grade` */
  subject?: string | null;
  /** Focus: `?focus=calculus` */
  focus?: string | null;
  grade?: string | null;
  scope?: string | null;
  ratio: LearningRatio;
  cadence: Cadence;
}

export function resolveCheckoutItem(p: CheckoutParams): CheckoutItem | null {
  const codingId = (p.course ?? '').trim();
  if (codingId) return resolveCoding(codingId, p.ratio);

  const slug = (p.subject ?? p.focus ?? '').trim();
  if (slug) return resolveSchool(slug, p);

  return null;
}

function resolveCoding(courseId: string, ratio: LearningRatio): CheckoutItem | null {
  const course = COURSES.find((c) => c.id === courseId);
  if (!course) return null;

  const price = codingPrice(course.level, ratio);
  if (price === null) return null;

  return {
    kind: 'course',
    slug: course.id,
    name: course.title,
    tagline: course.tagline,
    accent: ACCENT_HEX[course.accent] ?? '#2563EB',
    scopeLabel: course.level,
    classes: course.lessons ?? 0,
    backHref: `/courses/${course.level.toLowerCase()}`,
    // One payment, one seat. There is no instalment plan for a coding cohort,
    // and inventing one here would be a promise the billing cannot keep.
    offersCadence: false,
    perPayment: price,
    perPaymentFormatted: formatPrice(price),
    payments: 1,
    lifetimeTotal: price,
    lifetimeFormatted: formatPrice(price),
    savingLabel: null,
    orderBody: { track: course.trackId ?? course.id, level: course.level, ratio },
    courseName: course.title,
    track: course.trackId ?? course.id,
    level: course.level,
  };
}

function resolveSchool(slug: string, p: CheckoutParams): CheckoutItem | null {
  const subject = getSubject(slug);
  const focus = subject ? null : getSpecialisation(slug);
  if (!subject && !focus) return null;

  const isFocus = !!focus;
  const scope = p.scope === 'group' ? 'group' : 'grade';
  const grade = p.grade ? Number(p.grade) : null;
  const classes = isFocus || scope === 'grade' ? LESSONS_PER_GRADE : LESSONS_PER_GROUP;

  const plan = cadencePlans(classes, p.ratio).find((c) => c.cadence === p.cadence);
  if (!plan) return null;

  const group = grade ? gradeGroupFor(grade) : null;
  const scopeLabel = isFocus
    ? 'Focus course'
    : scope === 'group'
      ? (group?.label ?? 'Full grade group')
      : `Grade ${grade}`;

  const name = (subject ?? focus)!.name;
  const tagline = (subject ?? focus)!.tagline;
  const accent = (subject ?? focus)!.accent;

  return {
    kind: 'school',
    slug,
    name,
    tagline,
    accent,
    scopeLabel,
    classes,
    backHref: isFocus ? `/subjects/focus/${slug}` : `/subjects/${slug}`,
    offersCadence: true,
    perPayment: plan.perPayment,
    perPaymentFormatted: plan.perPaymentFormatted,
    payments: plan.payments,
    lifetimeTotal: plan.lifetimeTotal,
    lifetimeFormatted: plan.lifetimeFormatted,
    savingLabel: plan.savingLabel,
    orderBody: {
      kind: 'school',
      subject: slug,
      grade,
      scope,
      cadence: p.cadence,
      ratio: p.ratio,
    },
    courseName: `${name} — ${scopeLabel}`,
    track: slug,
    level: isFocus ? 'focus' : scope === 'group' ? `group-${grade ?? ''}` : `grade-${grade ?? ''}`,
  };
}

const ACCENT_HEX: Record<string, string> = {
  blue: '#2563EB',
  green: '#16A34A',
  violet: '#7C3AED',
  amber: '#F59E0B',
  cyan: '#06B6D4',
};
