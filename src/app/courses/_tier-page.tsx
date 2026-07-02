'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Layers,
  Clock,
  CheckCircle2,
  Sparkles,
  CalendarDays,
  Users,
  GraduationCap,
  Briefcase,
} from 'lucide-react';
import BrandLayout from '@/components/brand/brand-layout';
import PageHero from '@/components/brand/page-hero';
import { WaveDivider3D } from '@/components/sariro-3d/kit-3d';
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
import { COURSES, discountPercent, getRazorpayLink } from '@/lib/sariro-data';

/* ===============================================================
   TierPage — shared layout for /courses/beginner|intermediate|advanced
   Renders every course in the tier with full syllabus (modules+lessons).
=============================================================== */

type Tier = 'Beginner' | 'Intermediate' | 'Advanced';

const TIER_CFG: Record<
  Tier,
  {
    accent: string;
    accentColor: string;
    eyebrow: string;
    title: React.ReactNode;
    subtitle: string;
    intro: string;
    stats: { value: number; suffix: string; label: string }[];
    pageHeroVariant: 'courses' | 'schools' | 'pricing' | 'about';
    icon: typeof GraduationCap;
  }
> = {
  Beginner: {
    accent: 'green',
    accentColor: '#16A34A',
    eyebrow: 'Beginner track',
    title: (
      <>
        Start <span className="gradient-text">from zero.</span>
      </>
    ),
    subtitle:
      'Five cohort-based courses designed for first-time builders. No coding experience required — we teach from scratch, ship real projects, and build the mental models for everything AI.',
    intro:
      'Beginner courses are designed for absolute newcomers. Every course is 5 modules, 30 lessons, with 6 lessons per module — structured to take you from "what is AI?" to shipping a real portfolio project. You will leave with at least one deployed artifact you can show an employer, client, or school.',
    stats: [
      { value: 199, suffix: '', label: 'USD per cohort' },
      { value: 5, suffix: '', label: 'Modules' },
      { value: 30, suffix: '', label: 'Lessons' },
      { value: 6, suffix: '', label: 'Lessons / module' },
    ],
    pageHeroVariant: 'courses',
    icon: GraduationCap,
  },
  Intermediate: {
    accent: 'blue',
    accentColor: '#2563EB',
    eyebrow: 'Intermediate track',
    title: (
      <>
        Build <span className="gradient-text">real products.</span>
      </>
    ),
    subtitle:
      'Six cohort-based courses for builders who know the basics. Ship mobile apps, SaaS products, data dashboards, games, security tools, and cloud infrastructure — all with AI features.',
    intro:
      'Intermediate courses assume basic programming familiarity (you can write a function, use a list, and read documentation). Every course is 7 modules, 42 lessons, with 6 lessons per module. Each module ends with a real build, and the capstone ships a production-grade artifact to real users.',
    stats: [
      { value: 299, suffix: '', label: 'USD per cohort' },
      { value: 7, suffix: '', label: 'Modules' },
      { value: 42, suffix: '', label: 'Lessons' },
      { value: 6, suffix: '', label: 'Lessons / module' },
    ],
    pageHeroVariant: 'schools',
    icon: Briefcase,
  },
  Advanced: {
    accent: 'violet',
    accentColor: '#7C3AED',
    eyebrow: 'Advanced track',
    title: (
      <>
        Ship <span className="gradient-text">agent products.</span>
      </>
    ),
    subtitle:
      'The flagship Agent Architect cohort — 16 weeks, 16 modules, 96 lessons. Build autonomous AI agents, multi-agent systems, and ship a real agent product to production with paying users.',
    intro:
      'The Advanced track is for serious builders who want to lead the AI agent revolution. Agent Architect assumes intermediate Python and AI fundamentals. Over 16 weeks, you will master LangChain, LangGraph, CrewAI, MCP, vector databases, and multi-agent orchestration — and ship a real agent product with real users.',
    stats: [
      { value: 699, suffix: '', label: 'USD per cohort' },
      { value: 16, suffix: '', label: 'Modules' },
      { value: 96, suffix: '', label: 'Lessons' },
      { value: 6, suffix: '', label: 'Lessons / module' },
    ],
    pageHeroVariant: 'pricing',
    icon: Sparkles,
  },
};

type Course = (typeof COURSES)[number];
type SyllabusModule = { num: string; name: string; project: string; lessons: string[] };

export default function TierPage({ tier }: { tier: Tier }) {
  const cfg = TIER_CFG[tier];
  const courses = COURSES.filter((c) => c.level === tier);

  return (
    <BrandLayout>
      <PageHero
        eyebrow={cfg.eyebrow}
        accentColor={cfg.accentColor}
        breadcrumb={`Courses / ${tier}`}
        variant={cfg.pageHeroVariant}
        title={cfg.title}
        subtitle={cfg.subtitle}
      >
        <Link href="/courses" className="btn-tactile btn-tactile-light px-5 py-3 text-sm">
          <ArrowLeft className="w-4 h-4" />
          All courses
        </Link>
        <Link href="/pricing" className="btn-tactile btn-tactile-primary px-5 py-3 text-sm" style={{ background: cfg.accentColor }}>
          <Sparkles className="w-4 h-4" />
          See pricing
        </Link>
      </PageHero>

      {/* ====== Tier intro + stats ====== */}
      <section className="relative py-12 sm:py-16 overflow-hidden">
        <ParallaxOrb color={`${cfg.accentColor}1A`} size={420} speed={110} position="top-10 -left-20" />
        <ParallaxOrb color="rgba(124, 58, 237, 0.08)" size={340} speed={-80} position="bottom-10 -right-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* LEFT: intro narrative */}
            <Reveal y={30} className="lg:col-span-7">
              <span
                className="inline-block text-xs font-bold uppercase tracking-[0.18em] mb-4"
                style={{ color: cfg.accentColor, fontFamily: 'var(--font-grotesk)' }}
              >
                The {tier.toLowerCase()} track
              </span>
              <h2
                className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-5 leading-tight"
                style={{ fontFamily: 'var(--font-jakarta)' }}
              >
                <SplitText text={`What ${tier} courses are about.`} highlight={tier} highlightClassName="gradient-text" />
              </h2>
              <p className="text-base sm:text-lg text-slate-700 leading-relaxed mb-5 font-medium">
                {cfg.intro}
              </p>
              <p className="text-base text-slate-600 leading-relaxed mb-6">
                Every module ends with a real build — not a quiz, not a homework, a real thing you can show. The capstone project is shipped live and demoed to the cohort. You leave with a portfolio you own forever.
              </p>

              {/* What's included */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  'Live cohort sessions (2-3x per week)',
                  'Recordings of every session',
                  '1:1 mentor feedback on every build',
                  'Cohort-only community access',
                  'Certificate of completion',
                  '14-day money-back guarantee',
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2.5 rounded-xl p-3 border"
                    style={{ borderColor: `${cfg.accentColor}30`, background: `${cfg.accentColor}06` }}
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: cfg.accentColor }} />
                    <span className="text-xs font-semibold text-slate-700">{item}</span>
                  </div>
                ))}
              </div>
            </Reveal>

            {/* RIGHT: stats panel */}
            <Reveal y={30} delay={0.1} className="lg:col-span-5">
              <div
                className="rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${cfg.accentColor} 0%, #0F172A 100%)`,
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
                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/15"
                    >
                      <cfg.icon className="w-6 h-6" strokeWidth={2.2} />
                    </div>
                    <div>
                      <div
                        className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70"
                        style={{ fontFamily: 'var(--font-grotesk)' }}
                      >
                        Tier at a glance
                      </div>
                      <div
                        className="text-xl font-extrabold"
                        style={{ fontFamily: 'var(--font-jakarta)' }}
                      >
                        {tier}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {cfg.stats.map((s) => (
                      <div key={s.label} className="rounded-2xl bg-white/10 p-4 text-center">
                        <div
                          className="text-3xl font-extrabold"
                          style={{ fontFamily: 'var(--font-jakarta)' }}
                        >
                          <CountUp value={s.value} suffix={s.suffix} duration={1.8} />
                        </div>
                        <div
                          className="text-[10px] font-bold uppercase tracking-wider text-white/70 mt-1"
                          style={{ fontFamily: 'var(--font-grotesk)' }}
                        >
                          {s.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2 text-sm text-white/90 mb-6">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 shrink-0" />
                      <span>3-4 live cohorts + special 1:1 cohort</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 shrink-0" />
                      <span>2-3 live sessions per week (90 min)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>8-12 hours/week total commitment</span>
                    </div>
                  </div>

                  <a
                    href={getRazorpayLink(tier)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full text-center px-5 py-3 rounded-xl bg-white text-slate-900 text-sm font-bold hover:bg-white/90 transition-colors"
                    style={{ fontFamily: 'var(--font-grotesk)' }}
                  >
                    Reserve a seat
                    <ArrowRight className="w-4 h-4 inline ml-1.5" />
                  </a>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <WaveDivider3D fromColor="#FFFFFF" toColor="#F8FAFC" />

      {/* ====== Full course catalog for this tier ====== */}
      <section className="relative py-16 sm:py-20 overflow-hidden">
        <ParallaxOrb color={`${cfg.accentColor}1A`} size={420} speed={120} position="top-10 -right-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span
              className="inline-block text-xs font-bold uppercase tracking-[0.18em] mb-3"
              style={{ color: cfg.accentColor, fontFamily: 'var(--font-grotesk)' }}
            >
              The {tier.toLowerCase()} catalog
            </span>
            <h2
              className="text-3xl sm:text-4xl font-extrabold text-slate-900"
              style={{ fontFamily: 'var(--font-jakarta)' }}
            >
              <SplitText
                text={`${courses.length} ${tier.toLowerCase()} courses, fully detailed.`}
                highlight="fully detailed."
                highlightClassName="gradient-text"
              />
            </h2>
            <Reveal delay={0.15}>
              <p className="mt-3 text-slate-600">
                Every module, every lesson, every build — laid out so you know exactly what you're getting before you enroll.
              </p>
            </Reveal>
          </div>

          <StaggerGroup className="space-y-12" stagger={0.1}>
            {courses.map((course, idx) => (
              <StaggerItem key={course.id}>
                <CourseDetailCard course={course} tier={tier} accentColor={cfg.accentColor} index={idx} />
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      <WaveDivider3D fromColor="#F8FAFC" toColor="#FFFFFF" />

      {/* ====== Sticky story section ====== */}
      <StickyScrollSection pinHeight="140vh">
        <div className="text-center max-w-3xl px-4">
          <span
            className="inline-block text-xs font-bold uppercase tracking-[0.18em] mb-4"
            style={{ color: cfg.accentColor, fontFamily: 'var(--font-grotesk)' }}
          >
            The Sariro difference
          </span>
          <h2
            className="text-3xl sm:text-5xl font-extrabold text-slate-900 mb-5"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            <SplitText text="Every module ends with something working." highlight="something working." highlightClassName="gradient-text" />
          </h2>
          <Reveal delay={0.2}>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              No quizzes. No "review questions." Every single module ends with a real build you can show, demo, and add to your portfolio. By the end of the cohort, you will have shipped 5-16 real projects depending on the tier.
            </p>
          </Reveal>
        </div>
      </StickyScrollSection>

      {/* ====== Bottom CTA ====== */}
      <section className="relative py-20 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 mesh-bg opacity-60" />
        <ParallaxOrb color={`${cfg.accentColor}1F`} size={420} speed={100} position="top-10 left-1/4" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <h2
              className="text-3xl sm:text-5xl font-extrabold text-slate-900"
              style={{ fontFamily: 'var(--font-jakarta)' }}
            >
              <SplitText text={`Ready to start the ${tier.toLowerCase()} track?`} highlight="start" highlightClassName="gradient-text" />
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Reserve your seat in the next cohort. 14-day money-back guarantee — if it's not for you, full refund, no questions.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <MagneticButton as="a" href={getRazorpayLink(tier)} target="_blank" rel="noopener noreferrer" strength={0.25} className="btn-tactile btn-tactile-primary px-6 py-3.5" style={{ background: cfg.accentColor }}>
                Reserve a seat
                <ArrowRight className="w-4 h-4" />
              </MagneticButton>
              <MagneticButton as="a" href="/pricing" strength={0.25} className="btn-tactile btn-tactile-light px-6 py-3.5">
                See pricing
              </MagneticButton>
            </div>
          </Reveal>
        </div>
      </section>
    </BrandLayout>
  );
}

/* --------------------------------------------------------------- */
/* CourseDetailCard — full course layout with syllabus              */
/* --------------------------------------------------------------- */
function CourseDetailCard({
  course,
  tier,
  accentColor,
  index,
}: {
  course: Course;
  tier: Tier;
  accentColor: string;
  index: number;
}) {
  const pct = discountPercent(course.price, course.originalPrice);
  const syllabus = 'syllabus' in course ? (course.syllabus as SyllabusModule[]) : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="card-3d overflow-hidden"
    >
      {/* ---------- Card header ---------- */}
      <div
        className="relative p-6 sm:p-8 text-white overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${accentColor} 0%, #0F172A 100%)`,
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
        <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left: course number + title */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-3 flex-wrap">
              <span
                className="text-xs font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-md bg-white/20"
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                Course {String(index + 1).padStart(2, '0')}
              </span>
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-white/15"
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                {course.audience}
              </span>
              {course.featured && (
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md bg-amber-400 text-slate-900 flex items-center gap-1"
                  style={{ fontFamily: 'var(--font-grotesk)' }}
                >
                  <Sparkles className="w-3 h-3" /> Featured
                </span>
              )}
            </div>
            <h3
              className="text-2xl sm:text-3xl font-extrabold leading-tight mb-2"
              style={{ fontFamily: 'var(--font-jakarta)' }}
            >
              {course.title}
            </h3>
            <p className="text-sm sm:text-base text-white/90 leading-relaxed">{course.tagline}</p>
          </div>

          {/* Right: price + meta */}
          <div className="lg:col-span-1">
            <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-5">
              <div
                className="text-[10px] font-bold uppercase tracking-wider text-white/70 mb-1"
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                Tuition
              </div>
              <div className="flex items-baseline gap-2 mb-3">
                {pct > 0 && (
                  <span className="text-sm font-bold line-through text-white/60">${course.originalPrice}</span>
                )}
                <span
                  className="text-3xl font-extrabold"
                  style={{ fontFamily: 'var(--font-jakarta)' }}
                >
                  ${course.price}
                </span>
                <span className="text-xs text-white/70 uppercase">USD</span>
              </div>
              {pct > 0 && (
                <div
                  className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mb-3"
                  style={{ background: '#DC2626', color: '#FFFFFF', fontFamily: 'var(--font-grotesk)' }}
                >
                  -{pct}% launch discount
                </div>
              )}
              <div className="space-y-1.5 text-xs text-white/80">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 shrink-0" />
                  <span>{course.durationWeeks} weeks</span>
                </div>
                <div className="flex items-center gap-2">
                  <Layers className="w-3 h-3 shrink-0" />
                  <span>{course.modules} modules</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="w-3 h-3 shrink-0" />
                  <span>{course.lessons} lessons</span>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-3 h-3 shrink-0" />
                  <span>Next: {course.nextCohort}</span>
                </div>
              </div>
              <Link
                href={`/checkout?course=${course.id}`}
                className="block w-full text-center mt-4 px-4 py-2.5 rounded-xl bg-white text-slate-900 text-xs font-bold hover:bg-white/90 transition-colors"
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                Reserve a seat
                <ArrowRight className="w-3.5 h-3.5 inline ml-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Outcomes ---------- */}
      <div className="p-6 sm:p-8 bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Outcomes */}
          <div>
            <h4
              className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2"
              style={{ color: accentColor, fontFamily: 'var(--font-grotesk)' }}
            >
              <CheckCircle2 className="w-4 h-4" />
              What you'll be able to do
            </h4>
            <ul className="space-y-2.5">
              {course.outcomes.map((outcome, i) => (
                <li key={i} className="flex items-start gap-2.5">
                  <span
                    className="shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold mt-0.5"
                    style={{ background: `${accentColor}15`, color: accentColor }}
                  >
                    ✓
                  </span>
                  <span className="text-sm text-slate-700 leading-relaxed">{outcome}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Tech stack + build summary */}
          <div>
            <h4
              className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2"
              style={{ color: accentColor, fontFamily: 'var(--font-grotesk)' }}
            >
              <Sparkles className="w-4 h-4" />
              Capstone build
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed mb-4">
              {syllabus.length > 0
                ? `By the end you will have: ${syllabus[syllabus.length - 1].project}. A real, deployed artifact you own forever — live on the internet, in your GitHub, on your resume.`
                : 'A real, deployed artifact you own forever.'}
            </p>
            <div className="rounded-2xl bg-slate-50 p-4">
              <div
                className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2"
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                Quick facts
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div className="text-slate-500">Level</div>
                  <div className="font-bold text-slate-900">{course.level}</div>
                </div>
                <div>
                  <div className="text-slate-500">Audience</div>
                  <div className="font-bold text-slate-900">{course.audience}</div>
                </div>
                <div>
                  <div className="text-slate-500">Duration</div>
                  <div className="font-bold text-slate-900">{course.durationWeeks} weeks</div>
                </div>
                <div>
                  <div className="text-slate-500">Lessons</div>
                  <div className="font-bold text-slate-900">{course.lessons} ({course.modules} × 6)</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ---------- Full syllabus ---------- */}
        <div className="mt-8 pt-8 border-t border-slate-100">
          <h4
            className="text-xs font-bold uppercase tracking-wider mb-5 flex items-center gap-2"
            style={{ color: accentColor, fontFamily: 'var(--font-grotesk)' }}
          >
            <Layers className="w-4 h-4" />
            Full syllabus — {course.modules} modules, {course.lessons} lessons
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {syllabus.map((mod) => (
              <div
                key={mod.num}
                className="rounded-2xl border border-slate-200 overflow-hidden"
              >
                <div
                  className="p-4 flex items-start gap-3"
                  style={{ background: `${accentColor}08` }}
                >
                  <div
                    className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-white font-extrabold text-sm"
                    style={{ background: accentColor, fontFamily: 'var(--font-jakarta)' }}
                  >
                    {mod.num}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5
                      className="text-sm font-extrabold text-slate-900 mb-0.5"
                      style={{ fontFamily: 'var(--font-jakarta)' }}
                    >
                      {mod.name}
                    </h5>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      <strong style={{ color: accentColor }}>Build:</strong> {mod.project}
                    </p>
                  </div>
                </div>
                <ol className="p-4 space-y-1.5">
                  {mod.lessons.map((lesson, li) => (
                    <li
                      key={li}
                      className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed"
                    >
                      <span
                        className="shrink-0 w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold mt-0.5"
                        style={{
                          background: `${accentColor}15`,
                          color: accentColor,
                          fontFamily: 'var(--font-grotesk)',
                        }}
                      >
                        {li + 1}
                      </span>
                      <span>{lesson}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
