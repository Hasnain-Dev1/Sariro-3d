'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  CalendarDays,
  Clock,
  LayoutGrid,
  Sparkles,
  Tag,
  Trophy,
  CheckCircle2,
  RotateCw,
  X,
  BookOpen,
  Layers,
  GraduationCap,
  Briefcase,
} from 'lucide-react';
import BrandLayout from '@/components/brand/brand-layout';
import PageHero from '@/components/brand/page-hero';
import { FlipCard3D, WaveDivider3D } from '@/components/sariro-3d/kit-3d';
import {
  Reveal,
  StaggerGroup,
  StaggerItem,
  TiltCard,
  MagneticButton,
  SplitText,
  CountUp,
  ParallaxOrb,
  StickyScrollSection,
} from '@/components/brand/effects-kit';
import { COURSES, TRACKS, discountPercent, DISCOUNT_LABEL } from '@/lib/sariro-data';

// Filters are level-based: All / Beginner / Intermediate / Advanced
type FilterKey = 'All' | 'Beginner' | 'Intermediate' | 'Advanced';
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'All', label: 'All Courses' },
  { key: 'Beginner', label: 'Beginner' },
  { key: 'Intermediate', label: 'Intermediate' },
  { key: 'Advanced', label: 'Advanced' },
];

type Course = (typeof COURSES)[number];

const ACCENT_HEX: Record<string, string> = {
  blue: '#2563EB',
  green: '#16A34A',
  violet: '#7C3AED',
  amber: '#F59E0B',
  cyan: '#06B6D4',
};

export default function CoursesPage() {
  const [filter, setFilter] = useState<FilterKey>('All');
  const [syllabusCourse, setSyllabusCourse] = useState<Course | null>(null);

  const visible = filter === 'All' ? COURSES : COURSES.filter((c) => c.level === filter);

  return (
    <BrandLayout>
      <PageHero
        eyebrow="Cohort-based learning"
        accentColor="#2563EB"
        breadcrumb="Courses"
        variant="courses"
        title={
          <>
            Courses that ship <span className="gradient-text">real builders.</span>
          </>
        }
        subtitle="No video dumps. No copy-paste tutorials. Every Sariro cohort is live, mentored, and ends with something you can actually show an employer, a client, or a school."
      >
        <Link href="#catalog" className="btn-tactile btn-tactile-primary px-5 py-3 text-sm">
          <LayoutGrid className="w-4 h-4" />
          Browse catalog
        </Link>
        <Link href="/pricing" className="btn-tactile btn-tactile-light px-5 py-3 text-sm">
          See pricing
          <ArrowRight className="w-4 h-4" />
        </Link>
      </PageHero>

      {/* ====== Filter + Catalog ====== */}
      <section id="catalog" className="relative py-16 sm:py-20 overflow-hidden">
        <ParallaxOrb color="rgba(37, 99, 235, 0.10)" size={420} speed={120} position="top-10 -left-20" />
        <ParallaxOrb color="rgba(124, 58, 237, 0.08)" size={360} speed={-90} position="bottom-10 -right-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section heading */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
            <div className="max-w-xl">
              <span
                className="inline-block text-xs font-bold uppercase tracking-[0.18em] text-blue-600 mb-3"
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                The catalog
              </span>
              <h2
                className="text-3xl sm:text-4xl font-extrabold text-slate-900"
                style={{ fontFamily: 'var(--font-jakarta)' }}
              >
                <SplitText text="Flip any card to see what you'll walk out with." highlight="walk out with." highlightClassName="gradient-text" />
              </h2>
              <Reveal delay={0.15}>
                <p className="mt-3 text-slate-600">
                  Hover (or tap) a course to flip it over and read the outcomes — the things you'll be able to do on Monday morning after cohort ends.
                </p>
              </Reveal>
            </div>

            {/* Filter pills — horizontally scrollable on mobile */}
            <div
              className="inline-flex p-1.5 rounded-2xl glass-panel gap-1 self-start md:self-auto flex-wrap justify-center"
              role="tablist"
              aria-label="Filter courses by track"
              style={{ scrollbarWidth: 'thin', WebkitOverflowScrolling: 'touch' }}
            >
              {FILTERS.map((f) => {
                const active = filter === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    role="tab"
                    aria-selected={active}
                    className={`relative px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
                      active ? 'text-white' : 'text-slate-700 hover:text-blue-600'
                    }`}
                    style={{ fontFamily: 'var(--font-grotesk)' }}
                  >
                    {active && (
                      <motion.span
                        layoutId="course-filter-pill"
                        className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-600 to-violet-600 shadow-lg shadow-blue-500/30"
                        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                      />
                    )}
                    <span className="relative flex items-center gap-2">
                      {f.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Catalog grid */}
          {/* Catalog grid.
              KEY=filter forces StaggerGroup to remount on filter change —
              without this, new items mount with initial="hidden" but
              whileInView already fired once, so they stay invisible
              and the courses "disappear". */}
          <StaggerGroup
            key={filter}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            stagger={0.1}
          >
            {visible.map((course) => {
              const accent = ACCENT_HEX[course.accent] ?? '#2563EB';
              return (
                <StaggerItem key={course.id}>
                  <FlipCard3D
                    height="440px"
                    className="h-[440px]"
                    front={<CourseFront course={course} accent={accent} onViewSyllabus={() => setSyllabusCourse(course)} />}
                    back={<CourseBack course={course} accent={accent} onViewSyllabus={() => setSyllabusCourse(course)} />}
                  />
                </StaggerItem>
              );
            })}
          </StaggerGroup>

          {/* Empty state (shouldn't happen, but be safe) */}
          {visible.length === 0 && (
            <div className="text-center py-20">
              <p className="text-slate-500">No courses match this filter yet.</p>
            </div>
          )}

          {/* Browse all courses in depth — tier explorer moved below catalog */}
          <div className="mt-12 pt-8 border-t border-slate-100">
            <h3 className="text-lg font-extrabold text-slate-900 mb-4 text-center" style={{ fontFamily: 'var(--font-jakarta)' }}>
              Browse all courses in depth
            </h3>
            <p className="text-xs text-slate-500 text-center mb-6">Choose a level to explore all tracks at that depth</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link
                href="/courses/beginner"
                className="group rounded-2xl p-5 border-2 border-green-200 hover:border-green-400 hover:shadow-lg hover:shadow-green-500/10 transition-all bg-green-50/50"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
                    <GraduationCap className="w-5 h-5" strokeWidth={2.2} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-green-700" style={{ fontFamily: 'var(--font-grotesk)' }}>
                      From $199
                    </div>
                    <div className="text-base font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
                      Beginner
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-2">
                  5 modules · 30 lessons each. Zero experience required.
                </p>
                <div className="text-xs font-bold text-green-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                  Explore beginner <ArrowRight className="w-3 h-3" />
                </div>
              </Link>

              <Link
                href="/courses/intermediate"
                className="group rounded-2xl p-5 border-2 border-blue-200 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/10 transition-all bg-blue-50/50"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
                    <Briefcase className="w-5 h-5" strokeWidth={2.2} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700" style={{ fontFamily: 'var(--font-grotesk)' }}>
                      From $299
                    </div>
                    <div className="text-base font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
                      Intermediate
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-2">
                  7 modules · 42 lessons each. Ship real products.
                </p>
                <div className="text-xs font-bold text-blue-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                  Explore intermediate <ArrowRight className="w-3 h-3" />
                </div>
              </Link>

              <Link
                href="/courses/advanced"
                className="group rounded-2xl p-5 border-2 border-violet-200 hover:border-violet-400 hover:shadow-lg hover:shadow-violet-500/10 transition-all bg-violet-50/50"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600">
                    <Sparkles className="w-5 h-5" strokeWidth={2.2} />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-violet-700" style={{ fontFamily: 'var(--font-grotesk)' }}>
                      From $699
                    </div>
                    <div className="text-base font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
                      Advanced
                    </div>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-2">
                  16 modules · 96 lessons. Ship production systems.
                </p>
                <div className="text-xs font-bold text-violet-600 flex items-center gap-1 group-hover:gap-2 transition-all">
                  Explore advanced <ArrowRight className="w-3 h-3" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ====== Syllabus modal ====== */}
      <SyllabusModal course={syllabusCourse} onClose={() => setSyllabusCourse(null)} />

      <WaveDivider3D fromColor="#FFFFFF" toColor="#F8FAFC" />

      {/* ====== Cohort value strip ====== */}
      <section className="relative py-16 sm:py-20 mesh-bg-soft-blue overflow-hidden">
        <ParallaxOrb color="rgba(22, 163, 74, 0.10)" size={380} speed={80} position="top-20 left-10" />
        <ParallaxOrb color="rgba(245, 158, 11, 0.08)" size={300} speed={-70} position="bottom-10 right-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <StaggerGroup className="grid grid-cols-1 md:grid-cols-3 gap-6" stagger={0.12}>
            {[
              {
                icon: CalendarDays,
                title: 'Live, not pre-recorded',
                body: 'Every session happens with your cohort. You ask questions, you get answers — in real time.',
                accent: '#2563EB',
              },
              {
                icon: Sparkles,
                title: 'Personalized feedback',
                body: 'Your projects are reviewed by a human mentor who tells you what to fix and why — not just a grade.',
                accent: '#7C3AED',
              },
              {
                icon: Trophy,
                title: 'Portfolio you keep',
                body: 'Every course ends with at least one shipped artifact that lives in your GitHub and your resume.',
                accent: '#16A34A',
              },
            ].map((item) => (
              <StaggerItem key={item.title}>
                <TiltCard className="card-3d p-6 h-full" maxTilt={6}>
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `${item.accent}15`, color: item.accent }}
                  >
                    <item.icon className="w-6 h-6" strokeWidth={2.2} />
                  </div>
                  <h3
                    className="text-lg font-extrabold text-slate-900 mb-2"
                    style={{ fontFamily: 'var(--font-jakarta)' }}
                  >
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.body}</p>
                </TiltCard>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      <WaveDivider3D fromColor="#F8FAFC" toColor="#FFFFFF" />

      {/* ====== Sticky story section ====== */}
      <StickyScrollSection pinHeight="160vh">
        <div className="text-center max-w-3xl px-4">
          <span
            className="inline-block text-xs font-bold uppercase tracking-[0.18em] text-blue-600 mb-4"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            The Sariro difference
          </span>
          <h2
            className="text-3xl sm:text-5xl font-extrabold text-slate-900 mb-5"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            <SplitText text="We don't ship courses. We ship builders." highlight="builders." highlightClassName="gradient-text" />
          </h2>
          <Reveal delay={0.2}>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Every cohort ends with you owning something real — a project, a portfolio, a way of thinking you can't unlearn.
            </p>
          </Reveal>
        </div>
      </StickyScrollSection>

      {/* ====== Bottom CTA ====== */}
      <section className="relative py-20 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 mesh-bg opacity-60" />
        <ParallaxOrb color="rgba(37, 99, 235, 0.12)" size={400} speed={100} position="top-10 left-1/4" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <h2
              className="text-3xl sm:text-5xl font-extrabold text-slate-900"
              style={{ fontFamily: 'var(--font-jakarta)' }}
            >
              <SplitText text="One price. No surprises." highlight="No surprises." highlightClassName="gradient-text" />
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Every cohort includes live sessions, recordings, mentor feedback, and community access. 14-day money-back guarantee on every enrollment.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <MagneticButton as="a" href="/pricing" strength={0.25} className="btn-tactile btn-tactile-primary px-6 py-3.5">
                See pricing
                <ArrowRight className="w-4 h-4" />
              </MagneticButton>
              <MagneticButton as="a" href="/events" strength={0.25} className="btn-tactile btn-tactile-light px-6 py-3.5">
                <CalendarDays className="w-4 h-4" />
                View next cohorts
              </MagneticButton>
            </div>
          </Reveal>
        </div>
      </section>
    </BrandLayout>
  );
}

/* --------------------------------------------------------------- */
/* Course card FRONT face — overview info                          */
/* --------------------------------------------------------------- */
function CourseFront({
  course,
  accent,
  onViewSyllabus,
}: {
  course: Course;
  accent: string;
  onViewSyllabus: () => void;
}) {
  return (
    <div className="card-3d h-full p-6 flex flex-col">
      {/* Top row: badges */}
      <div className="flex items-center justify-between mb-4">
        <span
          className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md"
          style={{
            background: `${accent}15`,
            color: accent,
            fontFamily: 'var(--font-grotesk)',
          }}
        >
          {course.audience}
        </span>
        {course.featured && (
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-amber-100 text-amber-700 flex items-center gap-1"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            <Sparkles className="w-3 h-3" /> Featured
          </span>
        )}
      </div>

      {/* Level + duration + lessons */}
      <div className="flex items-center gap-3 text-xs text-slate-500 mb-3 flex-wrap" style={{ fontFamily: 'var(--font-grotesk)' }}>
        <span className="font-bold uppercase tracking-wider" style={{ color: accent }}>{course.level}</span>
        <span className="w-1 h-1 rounded-full bg-slate-300" />
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" /> {course.durationWeeks}w
        </span>
        <span className="w-1 h-1 rounded-full bg-slate-300" />
        <span className="flex items-center gap-1">
          <LayoutGrid className="w-3 h-3" /> {course.modules} mods
        </span>
        <span className="w-1 h-1 rounded-full bg-slate-300" />
        <span className="flex items-center gap-1">
          <BookOpen className="w-3 h-3" /> {course.lessons} lessons
        </span>
      </div>

      {/* Title */}
      <h3
        className="text-xl font-extrabold text-slate-900 leading-tight mb-2"
        style={{ fontFamily: 'var(--font-jakarta)' }}
      >
        {course.title}
      </h3>
      <p className="text-sm text-slate-600 leading-relaxed mb-4 flex-1">{course.tagline}</p>

      {/* Footer */}
      <div className="mt-auto pt-4 border-t border-slate-100">
        <div className="flex items-end justify-between mb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500" style={{ fontFamily: 'var(--font-grotesk)' }}>
              Price
            </span>
            {(() => {
              const pct = discountPercent(course.price, course.originalPrice);
              return pct > 0 ? (
                <>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded text-white shadow-sm"
                      style={{ background: '#DC2626', fontFamily: 'var(--font-grotesk)' }}
                    >
                      -{pct}%
                    </span>
                    <span
                      className="text-xs font-bold line-through"
                      style={{ fontFamily: 'var(--font-grotesk)', color: '#DC2626' }}
                    >
                      ${course.originalPrice}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span
                      className="text-2xl font-extrabold"
                      style={{ color: accent, fontFamily: 'var(--font-jakarta)' }}
                    >
                      $<CountUp value={course.price} duration={1.5} />
                    </span>
                    <span className="text-xs text-slate-500">USD</span>
                  </div>
                </>
              ) : (
                <div className="flex items-baseline gap-1">
                  <span
                    className="text-2xl font-extrabold"
                    style={{ color: accent, fontFamily: 'var(--font-jakarta)' }}
                  >
                    $<CountUp value={course.price} duration={1.5} />
                  </span>
                  <span className="text-xs text-slate-500">USD</span>
                </div>
              );
            })()}
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1 justify-end" style={{ fontFamily: 'var(--font-grotesk)' }}>
              <CalendarDays className="w-3 h-3" /> Next cohort
            </span>
            <span className="text-sm font-bold text-slate-900">{course.nextCohort}</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onViewSyllabus(); }}
            className="flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-lg transition-colors"
            style={{ background: `${accent}10`, color: accent, fontFamily: 'var(--font-grotesk)' }}
          >
            <BookOpen className="w-3 h-3" />
            Syllabus
          </button>
          <div
            className="flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-lg"
            style={{ background: `${accent}05`, color: '#64748B', fontFamily: 'var(--font-grotesk)' }}
          >
            <RotateCw className="w-3 h-3" />
            Hover: outcomes
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- */
/* Course card BACK face — outcomes + syllabus button              */
/* --------------------------------------------------------------- */
function CourseBack({
  course,
  accent,
  onViewSyllabus,
}: {
  course: Course;
  accent: string;
  onViewSyllabus: () => void;
}) {
  return (
    <div
      className="h-full p-6 flex flex-col rounded-[1.25rem] text-white relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${accent} 0%, #0F172A 100%)`,
        boxShadow: '0 12px 30px -12px rgba(15, 23, 42, 0.4)',
      }}
    >
      {/* Decorative grid */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="relative flex flex-col h-full">
        <span
          className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-white/15 backdrop-blur-sm self-start mb-4"
          style={{ fontFamily: 'var(--font-grotesk)' }}
        >
          <Tag className="w-3 h-3 inline mr-1" />
          What you'll be able to do
        </span>

        <h3
          className="text-lg font-extrabold leading-tight mb-4"
          style={{ fontFamily: 'var(--font-jakarta)' }}
        >
          {course.title}
        </h3>

        <ul className="space-y-3 flex-1">
          {course.outcomes.map((outcome, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" style={{ color: '#FFFFFF' }} />
              <span className="text-sm leading-relaxed text-white/95">{outcome}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 pt-4 border-t border-white/15">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/60" style={{ fontFamily: 'var(--font-grotesk)' }}>
                Investment
              </div>
              {(() => {
                const pct = discountPercent(course.price, course.originalPrice);
                return pct > 0 ? (
                  <div className="flex items-baseline gap-2">
                    {course.originalPrice && (
                      <span
                        className="text-sm font-bold line-through"
                        style={{ fontFamily: 'var(--font-grotesk)', color: '#FCA5A5' }}
                      >
                        ${course.originalPrice}
                      </span>
                    )}
                    <span
                      className="text-2xl font-extrabold"
                      style={{ fontFamily: 'var(--font-jakarta)' }}
                    >
                      $<CountUp value={course.price} duration={1.5} />
                    </span>
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                      style={{ background: '#DC2626', color: '#FFFFFF', fontFamily: 'var(--font-grotesk)' }}
                    >
                      -{pct}%
                    </span>
                  </div>
                ) : (
                  <div className="text-2xl font-extrabold" style={{ fontFamily: 'var(--font-jakarta)' }}>
                    $<CountUp value={course.price} duration={1.5} />
                  </div>
                );
              })()}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onViewSyllabus(); }}
              className="px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Syllabus
            </button>
            <Link
              href={`/course-path/${course.trackId}`}
              className="px-3 py-2 rounded-xl bg-white text-slate-900 text-xs font-bold flex items-center gap-1.5 hover:bg-white/90 transition-colors"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              Enroll now
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- */
/* Syllabus Modal — full module + lesson breakdown                 */
/* --------------------------------------------------------------- */
function SyllabusModal({ course, onClose }: { course: Course | null; onClose: () => void }) {
  /* ---------- Body scroll lock when modal is open ----------
     Same pattern as ChatBubble: lock body in place + pause Lenis
     so only the modal's content area scrolls. Restored on close. */
    useEffect(() => {
    if (typeof window === 'undefined') return;

    if (course) {
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      const o = {
        overflow: document.body.style.overflow,
        position: document.body.style.position,
        top: document.body.style.top,
        left: document.body.style.left,
        width: document.body.style.width,
      };
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = `-${scrollX}px`;
      document.body.style.width = '100%';
      document.documentElement.setAttribute('data-scroll-locked', 'true');
      document.documentElement.setAttribute('data-syllabus-open', 'true');  // ← ADD THIS
      window.dispatchEvent(new CustomEvent('sariro:scroll-lock', { detail: { locked: true } }));

      return () => {
        document.body.style.overflow = o.overflow;
        document.body.style.position = o.position;
        document.body.style.top = o.top;
        document.body.style.left = o.left;
        document.body.style.width = o.width;
        document.documentElement.removeAttribute('data-scroll-locked');
        document.documentElement.removeAttribute('data-syllabus-open');  // ← ADD THIS
        window.dispatchEvent(new CustomEvent('sariro:scroll-lock', { detail: { locked: false } }));
        window.scrollTo(scrollX, scrollY);
      };
    }
  }, [course]);

  return (
    <AnimatePresence>
      {course && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-md flex items-start sm:items-center justify-center p-0 sm:p-4 pt-24 sm:pt-4"
          style={{ overscrollBehavior: 'contain' }}
          data-lenis-prevent
        >
          <motion.div
            initial={{ scale: 0.92, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[100vh] sm:max-h-[90vh] overflow-hidden flex flex-col my-0 sm:my-8"
          >
            {/* Header */}
            <div
              className="relative p-5 sm:p-8 text-white overflow-hidden shrink-0"
              style={{
                background: `linear-gradient(135deg, ${ACCENT_HEX[course.accent] ?? '#2563EB'} 0%, #0F172A 100%)`,
              }}
            >
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />
              <button
                onClick={onClose}
                aria-label="Close syllabus"
                className="absolute top-2 right-2 sm:top-4 sm:right-4 w-11 h-11 sm:w-9 sm:h-9 rounded-xl sm:rounded-lg bg-white/15 hover:bg-white/25 active:bg-white/35 flex items-center justify-center text-white transition-colors z-20 touch-manipulation"
                style={{ minHeight: '44px', minWidth: '44px' }}
              >
                <X className="w-5 h-5 sm:w-4 sm:h-4" />
              </button>
              <div className="relative">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-white/20"
                    style={{ fontFamily: 'var(--font-grotesk)' }}
                  >
                    {course.level} course
                  </span>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-white/15"
                    style={{ fontFamily: 'var(--font-grotesk)' }}
                  >
                    {course.audience}
                  </span>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-white/15"
                    style={{ fontFamily: 'var(--font-grotesk)' }}
                  >
                    {course.durationWeeks} weeks
                  </span>
                </div>
                <h2
                  className="text-2xl sm:text-3xl font-extrabold mb-2"
                  style={{ fontFamily: 'var(--font-jakarta)' }}
                >
                  {course.title}
                </h2>
                <p className="text-sm text-white/85 mb-4">{course.tagline}</p>
                <div className="flex items-center gap-4 text-xs flex-wrap" style={{ fontFamily: 'var(--font-grotesk)' }}>
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" />
                    <strong>{course.modules}</strong> modules
                  </span>
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    <strong>{course.lessons}</strong> lessons
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <strong>6</strong> lessons per module
                  </span>
                </div>
              </div>
            </div>

            {/* Body — module list */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-5">
              {'syllabus' in course && Array.isArray(course.syllabus) &&
                (course.syllabus as Array<{ num: string; name: string; project: string; lessons: string[] }>).map((mod, i) => (
                  <motion.div
                    key={mod.num}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i }}
                    className="rounded-2xl border border-slate-200 overflow-hidden"
                  >
                    <div className="p-4 sm:p-5 bg-slate-50 flex items-start gap-4">
                      <div
                        className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-white font-extrabold text-lg"
                        style={{ background: ACCENT_HEX[course.accent] ?? '#2563EB', fontFamily: 'var(--font-jakarta)' }}
                      >
                        {mod.num}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3
                          className="text-base font-extrabold text-slate-900 mb-1"
                          style={{ fontFamily: 'var(--font-jakarta)' }}
                        >
                          {mod.name}
                        </h3>
                        <p className="text-xs text-slate-600">
                          <strong style={{ color: ACCENT_HEX[course.accent] ?? '#2563EB' }}>Build:</strong> {mod.project}
                        </p>
                      </div>
                    </div>
                    <ol className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {mod.lessons.map((lesson, li) => (
                        <li
                          key={li}
                          className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed"
                        >
                          <span
                            className="shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold mt-0.5"
                            style={{
                              background: `${ACCENT_HEX[course.accent] ?? '#2563EB'}15`,
                              color: ACCENT_HEX[course.accent] ?? '#2563EB',
                              fontFamily: 'var(--font-grotesk)',
                            }}
                          >
                            {li + 1}
                          </span>
                          <span>{lesson}</span>
                        </li>
                      ))}
                    </ol>
                  </motion.div>
                ))}
            </div>

            {/* Footer */}
            <div
              className="shrink-0 p-4 sm:p-5 border-t border-slate-200 bg-white flex items-center justify-between gap-3"
              style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
            >
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500" style={{ fontFamily: 'var(--font-grotesk)' }}>
                  Tuition
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-bold line-through text-red-500">${course.originalPrice}</span>
                  <span
                    className="text-xl font-extrabold"
                    style={{ color: ACCENT_HEX[course.accent] ?? '#2563EB', fontFamily: 'var(--font-jakarta)' }}
                  >
                    ${course.price}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider" style={{ fontFamily: 'var(--font-grotesk)' }}>USD</span>
                </div>
              </div>
              <Link
                href={`/course-path/${course.trackId}`}
                onClick={onClose}
                className="btn-tactile btn-tactile-primary px-5 py-3 text-sm"
                style={{ background: ACCENT_HEX[course.accent] ?? '#2563EB' }}
              >
                Enroll now
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
