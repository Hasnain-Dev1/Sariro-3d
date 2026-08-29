import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, BookOpen, Users } from 'lucide-react';
import BrandLayout from '@/components/brand/brand-layout';
import { Container } from '@/components/layout/page-shell';
import { DOMAINS } from '@/lib/capabilities/taxonomy';
import { CONTENT_TAGS } from '@/lib/capabilities/content-tags';
import { STAGES } from '@/lib/capabilities/types';
import { listContentUnits, parseUnitKey } from '@/lib/curriculum/identity';
import { COURSES } from '@/lib/sariro-data';
import StartThisButton from '@/app/explore/start-this-button';
import { accentFor } from '@/lib/capabilities/accents';

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
  const accent = accentFor(domain.slug);
  const courses = coursesForStrand(slug);
  const lessonCount = courses.reduce((n, c) => n + c.lessons.length, 0);

  return (
    <BrandLayout>
      <section className="pt-28 sm:pt-32 pb-12 bg-gradient-to-b from-slate-50 to-white">
        <Container>
          <Link
            href="/explore"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            The Map
          </Link>

          <div className="flex items-center gap-2.5 mb-4">
            <span className="h-px w-6" style={{ background: accent }} aria-hidden />
            <p className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ color: accent }}>
              {domain.name}
            </p>
          </div>
          <h1 className="strand-enter text-[2.75rem] leading-[1.05] sm:text-6xl font-bold tracking-[-0.03em] text-slate-900 mb-5">
            {strand.name}
          </h1>
          <p className="strand-enter-delayed prose-measure text-lg sm:text-xl text-slate-600 leading-[1.55]">
            {strand.description}
          </p>

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
        </Container>
      </section>

      {/* ── stages ─────────────────────────────────────────────────────── */}
      <section className="py-14 sm:py-20 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-[1.75rem] font-bold tracking-[-0.02em] text-slate-900 mb-2">How deep you go is up to you</h2>
          <p className="prose-measure text-slate-600 text-[15px] leading-[1.65] mb-8">
            There is no beginner version and no advanced version of this. You enter wherever you
            actually are — and a ten-year-old and a forty-year-old can be at the same place.
          </p>

          {/* A connected track, not four separate boxes — depth is a journey
              through one thing. The learner's position will be marked here once
              mastery data exists (S4); the shape is built for it now. */}
          <ol className="relative">
            <span
              aria-hidden
              className="absolute left-[13px] top-3 bottom-3 w-px"
              style={{ background: `linear-gradient(to bottom, ${accent}55, ${accent}12)` }}
            />
            {STAGES.map((stage, i) => (
              <li key={stage} className="relative flex gap-5 pb-7 last:pb-0">
                <span
                  className="relative z-10 shrink-0 w-7 h-7 rounded-full bg-white border-2 text-[11px] font-bold flex items-center justify-center tabular-nums"
                  style={{ borderColor: accent, color: accent }}
                >
                  {i + 1}
                </span>
                <div className="pt-0.5">
                  <p className="font-semibold text-slate-900 text-[15px] capitalize">{stage}</p>
                  <p className="text-[13.5px] leading-[1.6] text-slate-600 mt-0.5">
                    {STAGE_MEANING[stage]}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── how you learn it ───────────────────────────────────────────── */}
      <section className="py-14 sm:py-20 bg-slate-50 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-[1.75rem] font-bold tracking-[-0.02em] text-slate-900 mb-6">How you learn this at Sariro</h2>

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
                    className="card group flex items-start gap-4"
                    style={{ ['--accent' as string]: accent }}
                  >
                    <BookOpen className="w-5 h-5 shrink-0 mt-0.5" style={{ color: accent }} />
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
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:translate-x-0.5 transition-all duration-300 shrink-0 mt-1" />
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="card card--feature">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5" style={{ color: accent }} />
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
      <section className="py-14 sm:py-20 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-[1.75rem] font-bold tracking-[-0.02em] text-slate-900 mb-6">
            The rest of {domain.name}
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {domain.strands
              .filter((s) => s.slug !== strand.slug)
              .map((s) => (
                <Link
                  key={s.slug}
                  href={`/explore/${s.slug}`}
                  className="card card--compact group"
                  style={{ ['--accent' as string]: accent }}
                >
                  <p className="font-semibold text-slate-900 text-[14px] transition-colors duration-300">
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
