import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ClipboardList, Code2 } from 'lucide-react';
import BrandLayout from '@/components/brand/brand-layout';
import PageHero from '@/components/brand/page-hero';
import {
  GRADE_GROUPS,
  LESSONS_PER_GRADE,
  SCHOOL_SUBJECTS,
  SPECIALISATIONS,
  subjectsForGroup,
} from '@/lib/school/curriculum';
import { formatPrice, perMonthFor } from '@/lib/school/pricing';

/**
 * SARIRO — /subjects
 * =========================================================
 * The global page: every school subject, and which grades each covers.
 *
 * Organised by SUBJECT rather than by grade, because a parent arrives already
 * knowing which subject is the problem — "he's struggling with maths" — and only
 * then narrows to the grade. Leading with grade would make them answer the
 * question they care least about first.
 *
 * Coding is not here. It is a track, not a grade subject, and it has its own
 * pages under /courses.
 */

export const metadata: Metadata = {
  title: 'Subjects — school, taught properly',
  description:
    'Mathematics, Science, Physics, Chemistry and English for grades 1–12. Weekly live classes in small batches, 48 classes a year, with real assessments.',
};

export default function SubjectsPage() {
  const monthly = formatPrice(perMonthFor('1:4'));

  return (
    <BrandLayout>
      <PageHero
        eyebrow="Subjects"
        title={
          <>
            School, taught
            <br />
            properly.
          </>
        }
        subtitle={`Grades 1 to 12. ${LESSONS_PER_GRADE} live classes a year in small batches, with real assessments — starting at ${monthly} a month.`}
        breadcrumb="Subjects"
        variant="courses"
        accentColor="#2563EB"
      />

      <section className="py-14 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SCHOOL_SUBJECTS.map((subject) => {
              const groups = GRADE_GROUPS.filter((g) => subject.groups.includes(g.slug));
              const lowest = groups[0]?.grades[0];
              const highest = groups[groups.length - 1]?.grades.slice(-1)[0];

              return (
                <Link
                  key={subject.slug}
                  href={`/subjects/${subject.slug}`}
                  className="card card--feature group flex flex-col"
                  style={{ ['--accent' as string]: subject.accent }}
                >
                  <span
                    className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full self-start mb-3 tabular-nums"
                    style={{ color: subject.accent, background: `${subject.accent}14` }}
                  >
                    Grades {lowest}–{highest}
                  </span>

                  <h2 className="text-xl font-bold text-slate-900 tracking-[-0.01em] mb-2">
                    {subject.tagline}
                  </h2>
                  <p className="text-[14px] leading-[1.6] text-slate-600 flex-1">
                    {subject.description}
                  </p>

                  <span className="card-meta flex items-center justify-between">
                    <span className="text-[13px] text-slate-500 tabular-nums">
                      {LESSONS_PER_GRADE} classes a year
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all duration-300" />
                  </span>
                </Link>
              );
            })}

            {/* Coding is a track, not a grade subject — but a parent scanning this
                page is looking for it, and a dead end here is a lost enquiry. */}
            <Link
              href="/courses"
              className="card card--feature card--dashed group flex flex-col"
              style={{ ['--accent' as string]: '#EA580C' }}
            >
              <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full self-start mb-3 bg-orange-50 text-orange-700">
                Any age
              </span>
              <h2 className="text-xl font-bold text-slate-900 tracking-[-0.01em] mb-2">
                Coding Beyond School
              </h2>
              <p className="text-[14px] leading-[1.6] text-slate-600 flex-1">
                Not tied to a grade. Four tracks by what your child can already do — from first
                steps to shipping real applications.
              </p>
              <span className="card-meta flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-[13px] text-slate-500">
                  <Code2 className="w-4 h-4" />
                  4 tracks
                </span>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all duration-300" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── by grade group ─────────────────────────────────────────────── */}
      <section className="py-14 sm:py-20 bg-slate-50 border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 tracking-[-0.02em] mb-2">
            What we teach, by stage
          </h2>
          <p className="prose-measure text-slate-600 text-[15px] leading-[1.65] mb-8">
            Physics and Chemistry begin at grade 7, when school splits them out of Science. Before
            that they are one subject, because the world still is.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {GRADE_GROUPS.map((group) => (
              <div key={group.slug} className="card">
                <p className="font-bold text-slate-900 mb-1.5 tabular-nums">{group.label}</p>
                <p className="text-[13px] text-slate-600 leading-[1.6] mb-4">{group.pitch}</p>
                <ul className="space-y-1.5">
                  {subjectsForGroup(group.slug).map((s) => (
                    <li key={s.slug}>
                      <Link
                        href={`/subjects/${s.slug}`}
                        className="text-[14px] font-medium text-slate-700 hover:text-slate-900 transition-colors"
                      >
                        {s.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── focus courses ──────────────────────────────────────────────── */}
      <section className="py-14 sm:py-20 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 tracking-[-0.02em] mb-2">
            Or fix one thing
          </h2>
          <p className="prose-measure text-slate-600 text-[15px] leading-[1.65] mb-8">
            Focus courses take one topic — usually the one a student has decided they are bad at —
            and spend {LESSONS_PER_GRADE} classes on it. Not tied to a grade: take Algebra at
            sixteen if that is where the gap is.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SPECIALISATIONS.map((spec) => (
              <Link
                key={spec.slug}
                href={`/subjects/focus/${spec.slug}`}
                className="card group flex flex-col"
                style={{ ['--accent' as string]: spec.accent }}
              >
                <span
                  className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full self-start mb-3"
                  style={{ color: spec.accent, background: `${spec.accent}14` }}
                >
                  {spec.suitsGrades}
                </span>
                <p className="font-bold text-slate-900 text-[16px] mb-1.5">{spec.name}</p>
                <p className="text-[13.5px] leading-[1.6] text-slate-600 flex-1">
                  {spec.description}
                </p>
                <span className="card-meta flex items-center justify-between">
                  <span className="text-[12.5px] text-slate-500 tabular-nums">
                    {LESSONS_PER_GRADE} classes
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all duration-300" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── assessments ────────────────────────────────────────────────── */}
      <section className="py-14 sm:py-20 bg-white border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <ClipboardList className="w-8 h-8 text-slate-400 mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 tracking-[-0.02em] mb-3">
            Two assessments a year, not a surprise at the end
          </h2>
          <p className="prose-measure text-slate-600 text-[15px] leading-[1.7]">
            Of the {LESSONS_PER_GRADE} classes, two are assessments — one mid-year, one at the end.
            They are part of the {LESSONS_PER_GRADE}, never an extra charge, and they exist so a
            parent finds out in month six whether it is working, rather than in month twelve.
          </p>
        </div>
      </section>
    </BrandLayout>
  );
}
