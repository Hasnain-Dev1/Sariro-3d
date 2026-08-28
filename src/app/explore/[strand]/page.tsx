import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, BookOpen, Users } from 'lucide-react';
import BrandLayout from '@/components/brand/brand-layout';
import { DOMAINS } from '@/lib/capabilities/taxonomy';
import { CONTENT_TAGS } from '@/lib/capabilities/content-tags';
import { STAGES } from '@/lib/capabilities/types';
import { listContentUnits, parseUnitKey } from '@/lib/curriculum/identity';
import { COURSES } from '@/lib/sariro-data';
import StartThisButton from '@/app/explore/start-this-button';

/**
 * SARIRO — /explore/[strand]
 * =========================================================
 * Where the map stops being a poster and becomes a door.
 *
 * A strand has one of two shapes, and we show whichever is true:
 *
 *   HAS CONTENT   the lessons behind it, grouped by the course that carries
 *                 them, linking straight into the existing enrolment flow.
 *                 Courses are a delivery mechanism for part of a strand — not
 *                 the thing itself.
 *
 *   NO CONTENT    51 of 68 strands. Not a dead end and not an apology: a mentor
 *                 teaches it directly. This is the honest half of the promise,
 *                 and the half competitors cannot fake.
 *
 * Statically generated for all 68 strands — no database, no TTFB cost.
 */

interface StrandParams {
  params: Promise<{ strand: string }>;
}

function findStrand(slug: string) {
  for (const domain of DOMAINS) {
    const strand = domain.strands.find((s) => s.slug === slug);
    if (strand) return { domain, strand };
  }
  return null;
}

/** The lessons tagged to this strand, grouped by the course that carries them. */
function coursesForStrand(slug: string) {
  const units = new Map(listContentUnits().map((u) => [u.unitKey, u]));
  const byCourse = new Map<string, { title: string; level: string; lessons: string[] }>();

  for (const [unitKey, tags] of Object.entries(CONTENT_TAGS)) {
    if (!tags.some(([s]) => s === slug)) continue;

    const parsed = parseUnitKey(unitKey);
    const unit = units.get(unitKey);
    if (!parsed || !unit) continue;

    const course = COURSES.find((c) => c.id === parsed.courseId);
    if (!course) continue;

    const entry = byCourse.get(course.id) ?? { title: course.title, level: course.level, lessons: [] };
    entry.lessons.push(unit.name);
    byCourse.set(course.id, entry);
  }
  return [...byCourse.entries()].map(([id, v]) => ({ id, ...v }));
}

export function generateStaticParams() {
  return DOMAINS.flatMap((d) => d.strands.map((s) => ({ strand: s.slug })));
}

export async function generateMetadata({ params }: StrandParams): Promise<Metadata> {
  const { strand: slug } = await params;
  const found = findStrand(slug);
  if (!found) return { title: 'Not found' };
  return {
    title: `${found.strand.name} — Sariro`,
    description: found.strand.description,
  };
}

const STAGE_MEANING: Record<string, string> = {
  foundation: 'First contact. The ideas underneath, in plain language.',
  developing: 'You can do it with help, and you know when you are stuck.',
  proficient: 'You can do it alone, reliably, on unfamiliar problems.',
  advanced: 'You can extend it, teach it, and use it where nobody has told you to.',
};

export default async function StrandPage({ params }: StrandParams) {
  const { strand: slug } = await params;
  const found = findStrand(slug);
  if (!found) notFound();

  const { domain, strand } = found;
  const courses = coursesForStrand(slug);
  const lessonCount = courses.reduce((n, c) => n + c.lessons.length, 0);

  return (
    <BrandLayout>
      <section className="pt-28 sm:pt-32 pb-12 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-4xl mx-auto px-5 sm:px-8">
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            The Map
          </Link>

          <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 mb-3">
            {domain.name}
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-4">
            {strand.name}
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl">{strand.description}</p>

          <div className="flex flex-wrap gap-2 mt-7">
            {strand.keywords.map((k) => (
              <span
                key={k}
                className="text-[12px] px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-600"
              >
                {k}
              </span>
            ))}
          </div>

          {/* The map's front door. Identical on all 68 strands — a learner is
              never told "we don't offer that". */}
          <div className="mt-9">
            <StartThisButton capabilitySlug={strand.slug} strandName={strand.name} source="strand" />
          </div>
        </div>
      </section>

      {/* ── stages ─────────────────────────────────────────────────────── */}
      <section className="py-12 sm:py-16 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-5 sm:px-8">
          <h2 className="text-xl font-bold text-slate-900 mb-2">How deep you go is up to you</h2>
          <p className="text-slate-600 text-[15px] mb-8 max-w-2xl">
            There is no beginner version and no advanced version of this. You enter wherever you
            actually are — and a ten-year-old and a forty-year-old can be at the same place.
          </p>

          <ol className="space-y-3">
            {STAGES.map((stage, i) => (
              <li key={stage} className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4">
                <span className="shrink-0 w-7 h-7 rounded-lg bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <div>
                  <p className="font-semibold text-slate-900 text-[15px] capitalize">{stage}</p>
                  <p className="text-[13.5px] text-slate-600">{STAGE_MEANING[stage]}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── how you learn it ───────────────────────────────────────────── */}
      <section className="py-12 sm:py-16 bg-slate-50 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-5 sm:px-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">How you learn this at Sariro</h2>

          {courses.length > 0 ? (
            <>
              <p className="text-slate-600 text-[15px] mb-6">
                {lessonCount} {lessonCount === 1 ? 'lesson' : 'lessons'} across{' '}
                {courses.length === 1 ? 'one programme' : `${courses.length} programmes`} develop this
                strand — alongside a mentor, in a live class.
              </p>

              <div className="space-y-3">
                {courses.map((c) => (
                  <Link
                    key={c.id}
                    href={`/course-path/${c.id}`}
                    className="group flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5 hover:border-violet-300 hover:shadow-[0_8px_30px_-12px_rgba(15,23,42,0.15)] transition-all"
                  >
                    <BookOpen className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 text-[15px]">{c.title}</p>
                      <p className="text-[13px] text-slate-500 mt-0.5">
                        {c.level} · {c.lessons.length} {c.lessons.length === 1 ? 'lesson' : 'lessons'}{' '}
                        on this strand
                      </p>
                      <p className="text-[13px] text-slate-600 mt-2 line-clamp-2">
                        {c.lessons.slice(0, 3).join(' · ')}
                        {c.lessons.length > 3 ? ` · +${c.lessons.length - 3} more` : ''}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-violet-600 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-7">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-violet-600" />
                <p className="font-semibold text-slate-900">Mentor-led</p>
              </div>
              <p className="text-slate-600 text-[15px] leading-relaxed mb-5">
                There is no pre-written course for this — and that is deliberate. A mentor teaches it
                to you directly, at your depth, and what you become capable of is recorded the same
                way it is everywhere else on the map. You are never handed a reading list and left to
                it.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <StartThisButton
                  capabilitySlug={strand.slug}
                  strandName={strand.name}
                  source="strand"
                />
                <Link
                  href="/contact"
                  className="text-sm font-medium text-slate-600 hover:text-slate-900 underline underline-offset-4 transition"
                >
                  Or talk to us first
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── siblings ───────────────────────────────────────────────────── */}
      <section className="py-12 sm:py-16 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-5 sm:px-8">
          <h2 className="text-xl font-bold text-slate-900 mb-6">
            The rest of {domain.name}
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {domain.strands
              .filter((s) => s.slug !== strand.slug)
              .map((s) => (
                <Link
                  key={s.slug}
                  href={`/explore/${s.slug}`}
                  className="group rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-300 transition"
                >
                  <p className="font-semibold text-slate-900 text-[14px] group-hover:text-violet-700 transition">
                    {s.name}
                  </p>
                  <p className="text-[13px] text-slate-600 mt-1 line-clamp-2">{s.description}</p>
                </Link>
              ))}
          </div>
        </div>
      </section>
    </BrandLayout>
  );
}
