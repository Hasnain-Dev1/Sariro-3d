'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowDown,
  ArrowRight,
  Brain,
  Target,
  Lightbulb,
  Heart,
  Quote,
  Linkedin,
  Twitter,
  Users,
  Sparkles,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import BrandLayout from '@/components/brand/brand-layout';
import PageHero from '@/components/brand/page-hero';
import { WaveDivider3D } from '@/components/sariro-3d/kit-3d';
import { StatPills, type PillStat } from '@/components/sariro-3d/stat-pills';
import {
  Reveal,
  StaggerGroup,
  StaggerItem,
  TiltCard,
  MagneticButton,
  SplitText,
  CountUp,
  ParallaxOrb,
} from '@/components/brand/effects-kit';
import { MIMO, BRAND, SARIRO_ABOUT, TEAM } from '@/lib/sariro-data';

/* Principle icon map for the Mimo section */
const PRINCIPLE_ICONS = [Brain, Target, Lightbulb, Heart];

/* Sariro-company principles use a different set */
const SARIRO_PRINCIPLE_ICONS = [Users, Building2, CheckCircle2, Sparkles];

/* Stat pills — match the reference design.
   4 pills floating around the portrait (top, left, right, bottom). */
const MIMO_PILLS: PillStat[] = [
  { value: '12+', label: 'Years teaching', color: '#F59E0B' },
  { value: '7', label: 'Patents filed', color: '#16A34A' },
  { value: '5,000+', label: 'Students mentored', color: '#2563EB' },
  { value: '36', label: 'Papers published', color: '#7C3AED' },
];

/* Stat strip values (numbers for CountUp) for the Mimo section */
const MIMO_NUMBERS = MIMO.numbers.map((n) => {
  const match = String(n.value).match(/^(\d+)/);
  if (match) {
    return { ...n, numValue: parseInt(match[1], 10), original: n.value };
  }
  return { ...n, numValue: null, original: n.value };
});

/* Accent map for Sariro stats */
const ACCENT_HEX: Record<string, string> = {
  blue: '#2563EB',
  green: '#16A34A',
  violet: '#7C3AED',
  amber: '#F59E0B',
};

export default function AboutPage() {
  const principlesRef = useRef<HTMLDivElement>(null);

  const scrollToPrinciples = () => {
    principlesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const team = TEAM as ReadonlyArray<{
    name: string;
    role: string;
    bio: string;
    avatar: string;
    image?: string;
    accent: string;
    isFounder?: boolean;
  }>;

  return (
    <BrandLayout>
      <PageHero
        eyebrow="About us"
        accentColor="#F59E0B"
        breadcrumb="About"
        variant="about"
        title={
          <>
            About <span className="gradient-text">Sariro.</span>
          </>
        }
        subtitle="A cohort-based AI education studio from San Francisco. We teach thinking, not just typing — and we ship real, working AI artifacts, not hello world demos."
      >
        <button
          onClick={scrollToPrinciples}
          className="btn-tactile px-5 py-3 text-sm text-white"
          style={{
            background: '#F59E0B',
            boxShadow: '0 10px 0 -1px #B45309, 0 18px 30px -12px rgba(245,158,11,0.55)',
            fontFamily: 'var(--font-grotesk)',
          }}
        >
          <ArrowDown className="w-4 h-4" />
          Read the philosophy
        </button>
        <Link href="/contact" className="btn-tactile btn-tactile-light px-5 py-3 text-sm">
          Work with us
          <ArrowRight className="w-4 h-4" />
        </Link>
      </PageHero>

      {/* ============================================================
          SECTION 1 — ABOUT SARIRO (the company, FIRST)
         ============================================================ */}
      <section className="relative py-12 sm:py-16 overflow-hidden">
        <ParallaxOrb color="rgba(245, 158, 11, 0.10)" size={420} speed={110} position="top-10 -left-20" />
        <ParallaxOrb color="rgba(37, 99, 235, 0.08)" size={340} speed={-80} position="bottom-10 -right-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            {/* LEFT: Sariro narrative */}
            <Reveal y={30} className="lg:col-span-7">
              <span
                className="inline-block text-xs font-bold uppercase tracking-[0.18em] text-amber-600 mb-4"
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                {SARIRO_ABOUT.eyebrow}
              </span>
              <h2
                className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-5 leading-tight"
                style={{ fontFamily: 'var(--font-jakarta)' }}
              >
                <SplitText text={SARIRO_ABOUT.headline} highlight="refuses to teach the easy way." highlightClassName="gradient-text" />
              </h2>
              <p className="text-base sm:text-lg text-slate-700 leading-relaxed mb-5 font-medium">
                {SARIRO_ABOUT.lead}
              </p>
              {SARIRO_ABOUT.paragraphs.map((p, i) => (
                <p key={i} className="text-base text-slate-600 leading-relaxed mb-4">
                  {p}
                </p>
              ))}
            </Reveal>

            {/* RIGHT: Sariro stat strip + principles */}
            <Reveal y={30} delay={0.1} className="lg:col-span-5">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-8">
                {SARIRO_ABOUT.stats.map((s) => (
                  <div key={s.label} className="rounded-2xl pill-tint-amber p-4 text-center">
                    <div
                      className="text-2xl sm:text-3xl font-extrabold"
                      style={{ color: ACCENT_HEX[s.accent], fontFamily: 'var(--font-jakarta)' }}
                    >
                      <CountUp value={s.value} suffix={s.suffix} duration={1.8} />
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1" style={{ fontFamily: 'var(--font-grotesk)' }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Principles — Sariro-company level */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SARIRO_ABOUT.principles.map((p, i) => {
                  const Icon = SARIRO_PRINCIPLE_ICONS[i % SARIRO_PRINCIPLE_ICONS.length];
                  return (
                    <div
                      key={p.title}
                      className="rounded-2xl p-4 border border-amber-200/40 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/10 transition-all"
                      style={{ background: 'rgba(245, 158, 11, 0.04)' }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B' }}>
                          <Icon className="w-4 h-4" strokeWidth={2.4} />
                        </div>
                        <h4 className="text-sm font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
                          {p.title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{p.body}</p>
                    </div>
                  );
                })}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <WaveDivider3D fromColor="#FFFFFF" toColor="#F8FAFC" />

      {/* ============================================================
          SECTION 2 — MIMO PATRA (founder, with floating stat pills)
         ============================================================ */}
      <section className="relative py-12 sm:py-16 overflow-hidden">
        <ParallaxOrb color="rgba(124, 58, 237, 0.10)" size={420} speed={110} position="top-10 -right-20" />
        <ParallaxOrb color="rgba(245, 158, 11, 0.08)" size={340} speed={-80} position="bottom-10 -left-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span
              className="inline-block text-xs font-bold uppercase tracking-[0.18em] text-violet-600 mb-3"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              The founder
            </span>
            <h2
              className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight"
              style={{ fontFamily: 'var(--font-jakarta)' }}
            >
              <SplitText text="Meet Mimo Patra." highlight="Mimo Patra." highlightClassName="gradient-text" />
            </h2>
            <Reveal delay={0.15}>
              <p className="mt-3 text-slate-600">
                12+ years teaching. 5,000+ students across 65 nationalities. 36 published papers. 7 patents. One question that won't let go: how do you teach AI in a way that actually lasts?
              </p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* LEFT: portrait with floating stat pills */}
            <Reveal y={30} className="relative order-2 lg:order-1">
              {/* Decorative frame */}
              <div className="relative max-w-md mx-auto">
                <div
                  className="absolute -inset-4 rounded-3xl blur-2xl opacity-30 pointer-events-none"
                  style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #2563EB 100%)' }}
                />
                <div className="relative rounded-3xl overflow-hidden card-3d">
                  <Image
                    src="/images/mimo-portrait.webp"
                    alt={`${MIMO.name} — ${MIMO.title}`}
                    width={640}
                    height={720}
                    className="w-full h-auto object-cover"
                    priority
                  />
                  {/* Overlay tag */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent">
                    <div className="text-white">
                      <div
                        className="text-xl font-extrabold"
                        style={{ fontFamily: 'var(--font-jakarta)' }}
                      >
                        {MIMO.name}
                      </div>
                      <div className="text-sm text-amber-300 font-bold" style={{ fontFamily: 'var(--font-grotesk)' }}>
                        {MIMO.title}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating stat pills — replace the old rotating cube.
                    On sm+ they hug the portrait edges (top/left/right/bottom);
                    on mobile they stack in a 2-col grid below the portrait. */}
                <StatPills stats={MIMO_PILLS} size="md" />
              </div>

              {/* Social row */}
              <div className="flex items-center justify-center gap-3 mt-6">
                <a
                  href="#"
                  aria-label="Mimo on LinkedIn"
                  className="w-10 h-10 rounded-xl glass-panel flex items-center justify-center text-slate-700 hover:text-amber-600 transition-colors"
                >
                  <Linkedin className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  aria-label="Mimo on Twitter"
                  className="w-10 h-10 rounded-xl glass-panel flex items-center justify-center text-slate-700 hover:text-amber-600 transition-colors"
                >
                  <Twitter className="w-5 h-5" />
                </a>
                <a
                  href={`mailto:${BRAND.email}`}
                  aria-label="Email Mimo"
                  className="px-4 h-10 rounded-xl glass-panel flex items-center justify-center text-xs font-bold text-slate-700 hover:text-amber-600 transition-colors"
                  style={{ fontFamily: 'var(--font-grotesk)' }}
                >
                  {BRAND.email}
                </a>
              </div>
            </Reveal>

            {/* RIGHT: bio + numbers */}
            <Reveal y={30} delay={0.1} className="order-1 lg:order-2">
              <span
                className="inline-block text-xs font-bold uppercase tracking-[0.18em] text-amber-600 mb-4"
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                The story so far
              </span>
              <h3
                className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-5 leading-tight"
                style={{ fontFamily: 'var(--font-jakarta)' }}
              >
                <SplitText text="An educator who refused to teach the easy way." highlight="easy way." highlightClassName="gradient-text" />
              </h3>
              <p className="text-base sm:text-lg text-slate-700 leading-relaxed mb-6">
                {MIMO.bio}
              </p>
              <p className="text-base text-slate-600 leading-relaxed mb-8">
                Mimo started Sariro after a decade watching smart students graduate unable to build anything real. The fix wasn't more tutorials — it was teaching thinking. Sariro is the result: cohort-based, project-first, mentor-led AI education that respects your time and your curiosity.
              </p>

              {/* Numbers strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                {MIMO_NUMBERS.map((n) => (
                  <div key={n.label} className="rounded-2xl bg-slate-50 p-4 text-center">
                    <div
                      className="text-2xl sm:text-3xl font-extrabold text-slate-900"
                      style={{ fontFamily: 'var(--font-jakarta)' }}
                    >
                      {n.numValue !== null ? (
                        <CountUp
                          value={n.numValue}
                          suffix={String(n.original).replace(/^\d+/, '')}
                          duration={1.8}
                        />
                      ) : (
                        n.original
                      )}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1" style={{ fontFamily: 'var(--font-grotesk)' }}>
                      {n.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Principle highlights (compact, Mimo's 4 principles) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                {MIMO.principles.map((p, i) => {
                  const Icon = PRINCIPLE_ICONS[i];
                  return (
                    <div
                      key={p.title}
                      className="rounded-2xl p-4 border border-amber-200/40 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/10 transition-all"
                      style={{ background: 'rgba(245, 158, 11, 0.04)' }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B' }}>
                          <Icon className="w-4 h-4" strokeWidth={2.4} />
                        </div>
                        <h4 className="text-sm font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
                          {p.title}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{p.body}</p>
                    </div>
                  );
                })}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <WaveDivider3D fromColor="#F8FAFC" toColor="#FFFFFF" />

      {/* ============================================================
          SECTION 3 — TEAM (after Mimo)
         ============================================================ */}
      <section className="relative py-16 sm:py-20 mesh-bg-soft-amber overflow-hidden">
        <ParallaxOrb color="rgba(124, 58, 237, 0.10)" size={380} speed={100} position="top-20 right-10" />
        <ParallaxOrb color="rgba(22, 163, 74, 0.08)" size={320} speed={-70} position="bottom-10 left-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span
              className="inline-block text-xs font-bold uppercase tracking-[0.18em] text-violet-600 mb-3"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              The team
            </span>
            <h2
              className="text-3xl sm:text-4xl font-extrabold text-slate-900"
              style={{ fontFamily: 'var(--font-jakarta)' }}
            >
              <SplitText text="Mentors who have shipped real AI." highlight="shipped real AI." highlightClassName="gradient-text" />
            </h2>
            <Reveal delay={0.15}>
              <p className="mt-3 text-slate-600">
                Every Sariro cohort is led by senior builders who have shipped AI to production. You learn from scars, not slides.
              </p>
            </Reveal>
          </div>

          <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" stagger={0.08}>
            {team.map((member: { name: string; role: string; bio: string; avatar: string; image?: string; accent: string; isFounder?: boolean }) => (
              <StaggerItem key={member.name}>
                <TiltCard className="card-3d p-6 h-full group" maxTilt={5}>
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div
                        className="absolute inset-0 rounded-2xl blur-md opacity-40 group-hover:opacity-70 transition-opacity"
                        style={{ background: member.accent }}
                      />
                      <div
                        className="relative w-14 h-14 rounded-2xl overflow-hidden flex items-center justify-center text-white font-extrabold text-xl"
                        style={{ background: member.accent, fontFamily: 'var(--font-jakarta)' }}
                      >
                        {member.image ? (
                          <Image
                            src={member.image}
                            alt={member.name}
                            fill
                            className="object-cover"
                            sizes="56px"
                          />
                        ) : (
                          member.avatar
                        )}
                      </div>
                      {'isFounder' in member && member.isFounder && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center ring-2 ring-white">
                          <Sparkles className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3
                        className="text-base font-extrabold text-slate-900"
                        style={{ fontFamily: 'var(--font-jakarta)' }}
                      >
                        {member.name}
                      </h3>
                      <div
                        className="text-xs font-bold uppercase tracking-wider mb-2"
                        style={{ color: member.accent, fontFamily: 'var(--font-grotesk)' }}
                      >
                        {member.role}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{member.bio}</p>
                    </div>
                  </div>
                </TiltCard>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      <WaveDivider3D fromColor="#FFFFFF" toColor="#F8FAFC" />

      {/* ============================================================
          SECTION 4 — Philosophy (scroll target, sticky principles)
         ============================================================ */}
      <section
        ref={principlesRef}
        className="relative py-16 sm:py-20 bg-slate-50 scroll-mt-24 overflow-hidden"
      >
        <ParallaxOrb color="rgba(245, 158, 11, 0.10)" size={380} speed={100} position="top-20 right-10" />
        <ParallaxOrb color="rgba(124, 58, 237, 0.08)" size={320} speed={-70} position="bottom-10 left-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span
              className="inline-block text-xs font-bold uppercase tracking-[0.18em] text-amber-600 mb-3"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              The philosophy
            </span>
            <h2
              className="text-3xl sm:text-4xl font-extrabold text-slate-900"
              style={{ fontFamily: 'var(--font-jakarta)' }}
            >
              <SplitText text="Four ideas that shape every Sariro course." highlight="every Sariro course." highlightClassName="gradient-text" />
            </h2>
            <Reveal delay={0.15}>
              <p className="mt-3 text-slate-600">
                Not a manifesto. Just the four things Mimo refuses to compromise on — and the reason Sariro feels different from day one.
              </p>
            </Reveal>
          </div>

          <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 gap-6" stagger={0.1}>
            {MIMO.principles.map((p, i) => {
              const Icon = PRINCIPLE_ICONS[i % PRINCIPLE_ICONS.length];
              const accent = ['#F59E0B', '#2563EB', '#7C3AED', '#16A34A'][i % 4];
              return (
                <StaggerItem key={p.title}>
                  <TiltCard className="card-3d p-7 h-full group" maxTilt={5}>
                    <div className="flex items-start gap-5">
                      <div className="relative shrink-0">
                        <div
                          className="absolute inset-0 rounded-2xl blur-lg opacity-30 group-hover:opacity-60 transition-opacity"
                          style={{ background: accent }}
                        />
                        <div
                          className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
                          style={{ background: `${accent}15`, color: accent }}
                        >
                          <Icon className="w-7 h-7" strokeWidth={2.2} />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md text-white"
                            style={{ background: accent, fontFamily: 'var(--font-grotesk)' }}
                          >
                            Principle {String(i + 1).padStart(2, '0')}
                          </span>
                        </div>
                        <h3
                          className="text-xl font-extrabold text-slate-900 mb-2"
                          style={{ fontFamily: 'var(--font-jakarta)' }}
                        >
                          {p.title}
                        </h3>
                        <p className="text-sm text-slate-600 leading-relaxed">{p.body}</p>
                      </div>
                    </div>
                  </TiltCard>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        </div>
      </section>

      <WaveDivider3D fromColor="#F8FAFC" toColor="#FFFFFF" />

      {/* ====== Quote pull (dark card) ====== */}
      <section className="relative py-16 sm:py-20 overflow-hidden">
        <ParallaxOrb color="rgba(245, 158, 11, 0.12)" size={400} speed={100} position="top-10 left-10" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div
              className="relative rounded-3xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
              }}
            >
              {/* Decorative accent glow */}
              <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[120px] opacity-30 pointer-events-none" style={{ background: '#F59E0B' }} />
              <div className="relative p-8 sm:p-14 text-center">
                <Quote className="w-12 h-12 text-amber-400 mx-auto mb-6" />
                <p
                  className="text-2xl sm:text-3xl font-bold text-white leading-snug max-w-3xl mx-auto"
                  style={{ fontFamily: 'var(--font-jakarta)' }}
                >
                  "Anyone can copy a tutorial. We teach you to think — to break problems apart, to ask the right questions. The typing comes naturally after."
                </p>
                <div className="mt-6 text-amber-300 text-sm font-bold uppercase tracking-wider" style={{ fontFamily: 'var(--font-grotesk)' }}>
                  — {MIMO.name}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ====== Bottom CTA ====== */}
      <section className="relative py-20 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 mesh-bg opacity-60" />
        <ParallaxOrb color="rgba(245, 158, 11, 0.12)" size={420} speed={100} position="top-10 left-1/4" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <h2
              className="text-3xl sm:text-5xl font-extrabold text-slate-900"
              style={{ fontFamily: 'var(--font-jakarta)' }}
            >
              <SplitText text="Learn from the team. In person." highlight="In person." highlightClassName="gradient-text" />
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Every Sariro cohort is led by Mimo and a hand-picked mentor team. Reserve a seat in the next cohort — or just say hi.
            </p>
          </Reveal>
          <Reveal delay={0.25}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <MagneticButton as="a" href="/courses" strength={0.25} className="btn-tactile btn-tactile-primary px-6 py-3.5">
                Browse courses
                <ArrowRight className="w-4 h-4" />
              </MagneticButton>
              <MagneticButton as="a" href="/contact" strength={0.25} className="btn-tactile btn-tactile-light px-6 py-3.5">
                Say hello
              </MagneticButton>
            </div>
          </Reveal>
        </div>
      </section>
    </BrandLayout>
  );
}
