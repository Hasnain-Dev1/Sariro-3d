'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
  ParallaxOrb,
  StickyScrollSection,
} from '@/components/brand/effects-kit';
import { COURSES } from '@/lib/sariro-data';

type FilterKey = 'All' | 'Students' | 'Professionals';

const ACCENT_HEX: Record<string, string> = {
  blue: '#2563EB',
  green: '#16A34A',
  violet: '#7C3AED',
  amber: '#F59E0B',
  cyan: '#06B6D4',
};

const FILTERS: { key: FilterKey; label: string; count: number }[] = [
  { key: 'All', label: 'All courses', count: COURSES.length },
  { key: 'Students', label: 'Students', count: COURSES.filter((c) => c.audience === 'Students').length },
  { key: 'Professionals', label: 'Professionals', count: COURSES.filter((c) => c.audience === 'Professionals').length },
];

export default function CoursesPage() {
  const [filter, setFilter] = useState<FilterKey>('All');

  // SEO: set document title client-side (since this is a client component)
  useEffect(() => {
    document.title = 'Courses — Sariro | AI Cohort-Based Learning';
  }, []);

  const visible =
    filter === 'All' ? COURSES : COURSES.filter((c) => c.audience === filter);

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

            {/* Filter pills — wraps on mobile, inline on desktop */}
            <div
              className="flex flex-wrap p-1.5 rounded-2xl glass-panel gap-1 self-start md:self-auto"
              role="tablist"
              aria-label="Filter courses by audience"
            >
              {FILTERS.map((f) => {
                const active = filter === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    role="tab"
                    aria-selected={active}
                    className={`relative px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-colors duration-200 flex-1 sm:flex-initial justify-center ${
                      active
                        ? 'text-white bg-gradient-to-r from-blue-600 to-violet-600 shadow-lg shadow-blue-500/30'
                        : 'text-slate-700 hover:text-blue-600'
                    }`}
                    style={{ fontFamily: 'var(--font-grotesk)' }}
                  >
                    <span className="relative flex items-center gap-1.5 sm:gap-2 justify-center">
                      <span className="whitespace-nowrap">{f.label}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                          active ? 'bg-white/20' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {f.count}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Catalog grid — simple grid, no remount on filter change */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visible.map((course, i) => {
              const accent = ACCENT_HEX[course.accent] ?? '#2563EB';
              return (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Link
                    href={`/courses/${course.id}`}
                    className="block group/card focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 rounded-[1.25rem]"
                    aria-label={`View details for ${course.title}`}
                  >
                    <FlipCard3D
                      height="420px"
                      className="h-[420px]"
                      front={<CourseFront course={course} accent={accent} />}
                      back={<CourseBack course={course} accent={accent} />}
                    />
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* Empty state (shouldn't happen, but be safe) */}
          {visible.length === 0 && (
            <div className="text-center py-20">
              <p className="text-slate-500">No courses match this filter yet.</p>
            </div>
          )}
        </div>
      </section>

      <WaveDivider3D fromColor="#FFFFFF" toColor="#F8FAFC" />

      {/* ====== Cohort value strip ====== */}
      <section className="relative py-16 sm:py-20 bg-slate-50 overflow-hidden">
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
}: {
  course: (typeof COURSES)[number];
  accent: string;
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

      {/* Level + duration */}
      <div className="flex items-center gap-3 text-xs text-slate-500 mb-3" style={{ fontFamily: 'var(--font-grotesk)' }}>
        <span className="font-bold uppercase tracking-wider">{course.level}</span>
        <span className="w-1 h-1 rounded-full bg-slate-300" />
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" /> {course.durationWeeks} weeks
        </span>
        <span className="w-1 h-1 rounded-full bg-slate-300" />
        <span className="flex items-center gap-1">
          <LayoutGrid className="w-3 h-3" /> {course.modules} modules
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
        <div className="flex items-end justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500" style={{ fontFamily: 'var(--font-grotesk)' }}>
              Price
            </span>
            <div className="flex items-baseline gap-1">
              <span
                className="text-2xl font-extrabold"
                style={{ color: accent, fontFamily: 'var(--font-jakarta)' }}
              >
                ${course.price}
              </span>
              <span className="text-xs text-slate-500">USD</span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1 justify-end" style={{ fontFamily: 'var(--font-grotesk)' }}>
              <CalendarDays className="w-3 h-3" /> Next cohort
            </span>
            <span className="text-sm font-bold text-slate-900">{course.nextCohort}</span>
          </div>
        </div>
        <div
          className="mt-3 flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-lg"
          style={{ background: `${accent}10`, color: accent, fontFamily: 'var(--font-grotesk)' }}
        >
          <RotateCw className="w-3 h-3" />
          Hover to see outcomes
        </div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------------- */
/* Course card BACK face — outcomes                                 */
/* --------------------------------------------------------------- */
function CourseBack({
  course,
  accent,
}: {
  course: (typeof COURSES)[number];
  accent: string;
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
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/60" style={{ fontFamily: 'var(--font-grotesk)' }}>
                Investment
              </div>
              <div className="text-2xl font-extrabold" style={{ fontFamily: 'var(--font-jakarta)' }}>
                ${course.price}
              </div>
            </div>
            <span
              className="px-4 py-2 rounded-xl bg-white text-slate-900 text-xs font-bold flex items-center gap-1.5 group-hover/card:bg-white/90 transition-colors"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              View details
              <ArrowRight className="w-3.5 h-3.5 group-hover/card:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
