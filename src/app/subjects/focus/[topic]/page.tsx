import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, ClipboardList } from 'lucide-react';
import BrandLayout from '@/components/brand/brand-layout';
import {
  LESSONS_PER_GRADE,
  SPECIALISATIONS,
  buildGradeSyllabus,
  getSpecialisation,
} from '@/lib/school/curriculum';
import { cadencePlans } from '@/lib/school/pricing';
import { DOMAINS } from '@/lib/capabilities/taxonomy';
import CadenceChooser from '@/app/subjects/cadence-chooser';

/**
 * SARIRO — /subjects/focus/[topic]
 * =========================================================
 * One page per specialisation. Same 48 classes as a grade year, but aimed at a
 * single topic — the thing a student is failing, or the thing gating their
 * entrance exam.
 *
 * Deliberately no grade picker. A specialisation is not grade-bound: a strong
 * grade-9 student takes Calculus, a grade-12 student catches up on Algebra 1,
 * and an adult takes Public Speaking with no grade at all. The suggested grades
 * are printed as guidance and nothing enforces them.
 */

interface Params {
  params: Promise<{ topic: string }>;
}

const STRAND_NAMES = new Map(
  DOMAINS.flatMap((d) => d.strands.map((s) => [s.slug, s.name] as const))
);

export function generateStaticParams() {
  return SPECIALISATIONS.map((s) => ({ topic: s.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { topic } = await params;
  const spec = getSpecialisation(topic);
  if (!spec) return { title: 'Not found' };
  return { title: `${spec.tagline} — Sariro`, description: spec.description };
}

export default async function SpecialisationPage({ params }: Params) {
  const { topic } = await params;
  const spec = getSpecialisation(topic);
  if (!spec) notFound();

  const accent = spec.accent;
  // Specialisations use the same 48-slot shape as a grade year: 46 lessons,
  // a mid-course assessment and a final one.
  const syllabus = buildGradeSyllabus(spec.slug, 0);
  const plans = cadencePlans(LESSONS_PER_GRADE, '1:4').map((p) => ({
    cadence: p.cadence,
    label: p.label,
    blurb: p.blurb,
    perPayment: p.perPaymentFormatted,
    payments: p.payments,
    lifetime: p.lifetimeFormatted,
    saving: p.savingLabel,
    discountPercent: p.discountPercent,
  }));

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
              Focus course · {spec.suitsGrades}
            </p>
          </div>

          <h1 className="strand-enter text-[2.5rem] leading-[1.05] sm:text-5xl font-bold tracking-[-0.03em] text-slate-900 mb-5">
            {spec.tagline}
          </h1>
          <p className="strand-enter-delayed text-lg text-slate-600 leading-[1.6] max-w-2xl">
            {spec.description}
          </p>
        </div>
      </section>

      <section className="py-10 sm:py-14 bg-white">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <CadenceChooser
            accent={accent}
            plans={plans}
            lessons={syllabus.lessonCount}
            tests={syllabus.testCount}
            ctaLabel={`Start ${spec.name}`}
            ctaHref={`/contact?focus=${spec.slug}`}
          />
        </div>
      </section>

      <section className="py-12 sm:py-16 bg-slate-50 border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <h2 className="text-xl font-bold text-slate-900 mb-2">How the course runs</h2>
          <p className="text-slate-600 text-[15px] leading-[1.65] mb-7">
            {LESSONS_PER_GRADE} classes, one a week, in a batch of four. Two of them are
            assessments — one mid-course, one at the end — so you find out whether it is working
            while there is still time to change something.
          </p>

          <div className="flex flex-wrap gap-2">
            {spec.strands.map((s) => (
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

      <section className="py-12 sm:py-16 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Other focus courses</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SPECIALISATIONS.filter((s) => s.slug !== spec.slug).map((s) => (
              <Link
                key={s.slug}
                href={`/subjects/focus/${s.slug}`}
                className="strand-card group rounded-xl border border-slate-200/80 bg-white p-4"
                style={{ ['--accent' as string]: s.accent }}
              >
                <p className="font-semibold text-slate-900 text-[14.5px]">{s.name}</p>
                <p className="text-[12.5px] text-slate-500 mt-0.5">{s.suitsGrades}</p>
              </Link>
            ))}
          </div>
          <p className="mt-8 inline-flex items-center gap-2 text-[14px] text-slate-600">
            <ClipboardList className="w-4 h-4" />
            Need a full school year instead?
            <Link href="/subjects" className="font-semibold text-slate-900 hover:underline underline-offset-4">
              See subjects by grade
            </Link>
          </p>
        </div>
      </section>
    </BrandLayout>
  );
}
