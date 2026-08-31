import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, Users } from 'lucide-react';
import BrandLayout from '@/components/brand/brand-layout';
import ClosingAsk from '@/components/brand/closing-ask';
import {
  GRADE_GROUPS,
  LESSONS_PER_GRADE,
  LESSONS_PER_GROUP,
  SCHOOL_SUBJECTS,
  buildGradeSyllabus,
  gradeGroupFor,
  getSubject,
} from '@/lib/school/curriculum';
import { cadencePlans, formatPrice, perMonthFor } from '@/lib/school/pricing';
import { DOMAINS } from '@/lib/capabilities/taxonomy';
import { type GradeChoice, type ScopePrice } from '@/app/subjects/subject-picker';
import SubjectPlan, { type GradePlan } from '@/app/subjects/subject-plan';

/**
 * SARIRO — /subjects/[subject]
 * =========================================================
 * One page per subject, the way coding has a page per tier. A parent looking for
 * maths help should land somewhere that is *about maths* — not a catalogue where
 * they have to find it.
 *
 * Route is `/subjects`, not `/school`, because `/schools` already exists for
 * institutional partnerships and two near-identical URLs is how support tickets
 * are born.
 *
 * Statically generated per subject — no database, no TTFB cost.
 */

interface Params {
  params: Promise<{ subject: string }>;
}

const STRAND_NAMES = new Map(
  DOMAINS.flatMap((d) => d.strands.map((s) => [s.slug, s.name] as const))
);

export function generateStaticParams() {
  return SCHOOL_SUBJECTS.map((s) => ({ subject: s.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { subject: slug } = await params;
  const subject = getSubject(slug);
  if (!subject) return { title: 'Not found' };
  return {
    title: `${subject.tagline} — Sariro`,
    description: subject.description,
  };
}

export default async function SubjectPage({ params }: Params) {
  const { subject: slug } = await params;
  const subject = getSubject(slug);
  if (!subject) notFound();

  const accent = subject.accent;
  const groups = GRADE_GROUPS.filter((g) => subject.groups.includes(g.slug));
  const grades: GradeChoice[] = groups.flatMap((g) =>
    g.grades.map((grade) => ({ grade, groupSlug: g.slug, groupLabel: g.label }))
  );

  // Every price the picker can need, computed once at build time.
  const prices: Record<string, ScopePrice> = {};
  for (const { grade } of grades) {
    const syllabus = buildGradeSyllabus(subject.slug, grade);
    for (const scope of ['grade', 'group'] as const) {
      const classes = scope === 'grade' ? LESSONS_PER_GRADE : LESSONS_PER_GROUP;
      const multiple = scope === 'grade' ? 1 : 3;
      prices[`${grade}:${scope}`] = {
        classes,
        months: classes / 4,
        monthly: formatPrice(perMonthFor('1:4')),
        lessons: syllabus.lessonCount * multiple,
        tests: syllabus.testCount * multiple,
        plans: cadencePlans(classes, '1:4').map((p) => ({
          cadence: p.cadence,
          label: p.label,
          blurb: p.blurb,
          perPayment: p.perPaymentFormatted,
          payments: p.payments,
          lifetime: p.lifetimeFormatted,
          saving: p.savingLabel,
          discountPercent: p.discountPercent,
        })),
      };
    }
  }

  // Every offered grade's outline, so the plan below the picker follows the
  // grade a parent chooses instead of being frozen on whichever one is first.
  const plans: Record<number, GradePlan> = {};
  for (const { grade } of grades) {
    const syllabus = buildGradeSyllabus(subject.slug, grade);
    plans[grade] = {
      testCount: syllabus.testCount,
      authored: syllabus.modules.every((m) => m.authored),
      modules: syllabus.modules.map((m) => {
        const tests = m.lessons.filter((l) => l.kind === 'test').length;
        return { num: m.num, title: m.title, lessons: m.lessons.length - tests, tests };
      }),
    };
  }

  return (
    <BrandLayout>
      <section className="pt-28 sm:pt-32 pb-12 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            href="/courses#learn"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            All subjects
          </Link>

          <div className="flex items-center gap-2.5 mb-4">
            <span className="h-px w-6" style={{ background: accent }} aria-hidden />
            <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: accent }}>
              {groups.map((g) => g.label).join(' · ')}
            </p>
          </div>

          <h1 className="strand-enter text-[2.5rem] leading-[1.05] sm:text-5xl font-bold tracking-[-0.03em] text-slate-900 mb-5">
            {subject.tagline}
          </h1>
          <p className="strand-enter-delayed prose-measure text-lg text-slate-600 leading-[1.6]">
            {subject.description}
          </p>
        </div>
      </section>

      {/* ── choose + price, and the year that choice buys ──────────────── */}
      <SubjectPlan
        subjectSlug={subject.slug}
        subjectName={subject.name}
        accent={accent}
        grades={grades}
        prices={prices}
        plans={plans}
        totalSlots={LESSONS_PER_GRADE}
      />

      {/* ── what it builds ─────────────────────────────────────────────── */}
      <section className="py-14 sm:py-20 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-[1.75rem] font-bold tracking-[-0.02em] text-slate-900 mb-2">What it actually builds</h2>
          <p className="prose-measure text-slate-600 text-[15px] leading-[1.65] mb-6">
            Every class feeds a capability on the Sariro map, so progress is measured as what your
            child can do — not how many lessons they sat through.
          </p>
          <div className="flex flex-wrap gap-2">
            {subject.strands.map((s) => (
              <Link
                key={s}
                href={`/explore/${s}`}
                className="group inline-flex items-center gap-1.5 text-[13.5px] font-medium px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:text-slate-900 transition"
              >
                {STRAND_NAMES.get(s) ?? s}
                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 transition" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── other subjects ─────────────────────────────────────────────── */}
      <section className="py-14 sm:py-20 bg-slate-50 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-[1.75rem] font-bold tracking-[-0.02em] text-slate-900 mb-6">Other subjects</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {SCHOOL_SUBJECTS.filter((s) => s.slug !== subject.slug).map((s) => (
              <Link
                key={s.slug}
                href={`/subjects/${s.slug}`}
                className="card card--compact group"
                style={{ ['--accent' as string]: s.accent }}
              >
                <p className="font-semibold text-slate-900 text-[14.5px]">{s.name}</p>
                <p className="text-[13px] text-slate-600 mt-1">
                  {GRADE_GROUPS.filter((g) => s.groups.includes(g.slug))
                    .map((g) => g.label.replace('Grades ', ''))
                    .join(' · ')}
                </p>
              </Link>
            ))}
          </div>

          <div className="mt-8 flex items-center gap-2 text-[14px] text-slate-600">
            <Users className="w-4 h-4" />
            Looking for coding instead?
            <Link href="/courses" className="font-semibold text-slate-900 hover:underline underline-offset-4">
              See the coding tracks
            </Link>
          </div>
        </div>
      </section>

      {/* The page spent everything above proving it teaches this well, then used
          to end on a link to a different subject. */}
      <ClosingAsk
        accent={accent}
        productName={subject.name}
        enrolHref={`/checkout?subject=${subject.slug}&grade=${grades[Math.floor(grades.length / 2)]?.grade ?? grades[0].grade}&scope=grade&pay=monthly`}
      />
    </BrandLayout>
  );
}
