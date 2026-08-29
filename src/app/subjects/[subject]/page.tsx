import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, ClipboardList, Users } from 'lucide-react';
import BrandLayout from '@/components/brand/brand-layout';
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
import SubjectPicker, { type GradeChoice, type ScopePrice } from '@/app/subjects/subject-picker';

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

  const sample = buildGradeSyllabus(subject.slug, grades[0].grade);

  return (
    <BrandLayout>
      <section className="pt-28 sm:pt-32 pb-12 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <Link
            href="/subjects"
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
          <p className="strand-enter-delayed text-lg text-slate-600 leading-[1.6] max-w-2xl">
            {subject.description}
          </p>
        </div>
      </section>

      {/* ── choose + price ─────────────────────────────────────────────── */}
      <section className="py-10 sm:py-14 bg-white">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <SubjectPicker
            subjectSlug={subject.slug}
            subjectName={subject.name}
            accent={accent}
            grades={grades}
            prices={prices}
          />
        </div>
      </section>

      {/* ── what a year looks like ─────────────────────────────────────── */}
      <section className="py-12 sm:py-16 bg-slate-50 border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <h2 className="text-xl font-bold text-slate-900 mb-2">What a year looks like</h2>
          <p className="text-slate-600 text-[15px] leading-[1.65] mb-7">
            {LESSONS_PER_GRADE} classes across {sample.modules.length} modules — one class a week,
            four a month. {sample.testCount} of those classes are assessments rather than lessons,
            so you always know whether it is working.
          </p>

          <ol className="space-y-2.5">
            {sample.modules.map((m) => {
              const tests = m.lessons.filter((l) => l.kind === 'test').length;
              return (
                <li
                  key={m.num}
                  className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4"
                >
                  <span
                    className="shrink-0 w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center tabular-nums"
                    style={{ background: `${accent}12`, color: accent }}
                  >
                    {m.num}
                  </span>
                  <span className="flex-1 font-medium text-slate-800 text-[14.5px]">{m.title}</span>
                  <span className="text-[12.5px] text-slate-500 tabular-nums shrink-0">
                    {m.lessons.length - tests} lessons
                    {tests > 0 && (
                      <span className="inline-flex items-center gap-1 ml-2 font-semibold" style={{ color: accent }}>
                        <ClipboardList className="w-3.5 h-3.5" />
                        test
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>

          <p className="text-[13px] text-slate-500 mt-5">
            Module titles are finalised with your child&apos;s teacher to match their school board.
          </p>
        </div>
      </section>

      {/* ── what it builds ─────────────────────────────────────────────── */}
      <section className="py-12 sm:py-16 bg-white border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <h2 className="text-xl font-bold text-slate-900 mb-2">What it actually builds</h2>
          <p className="text-slate-600 text-[15px] leading-[1.65] mb-6">
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
      <section className="py-12 sm:py-16 bg-slate-50 border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Other subjects</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {SCHOOL_SUBJECTS.filter((s) => s.slug !== subject.slug).map((s) => (
              <Link
                key={s.slug}
                href={`/subjects/${s.slug}`}
                className="strand-card group rounded-xl border border-slate-200/80 bg-white p-4"
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
    </BrandLayout>
  );
}
