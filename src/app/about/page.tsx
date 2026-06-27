'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowDown,
  ArrowRight,
  Brain,
  Sparkles,
  Lightbulb,
  Heart,
  Target,
  Quote,
  Linkedin,
  Twitter,
} from 'lucide-react';
import BrandLayout from '@/components/brand/brand-layout';
import PageHero from '@/components/brand/page-hero';
import { WaveDivider3D } from '@/components/sariro-3d/kit-3d';
import { FloatingStatsCluster } from '@/components/brand/floating-stats-cluster';
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
import { MIMO, BRAND } from '@/lib/sariro-data';

/* Principle icon map */
const PRINCIPLE_ICONS = [Brain, Target, Lightbulb, Heart];

/* Stat strip values (numbers for CountUp) */
const MIMO_NUMBERS = MIMO.numbers.map((n) => {
  // Try to parse "12+", "5K+", "36", "7" — keep string fallback for non-numeric
  const match = String(n.value).match(/^(\d+)/);
  if (match) {
    return { ...n, numValue: parseInt(match[1], 10), original: n.value };
  }
  return { ...n, numValue: null, original: n.value };
});

export default function AboutPage() {
  const principlesRef = useRef<HTMLDivElement>(null);

  const scrollToPrinciples = () => {
    principlesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <BrandLayout>
      <PageHero
        eyebrow="The founder"
        accentColor="#F59E0B"
        breadcrumb="About"
        variant="about"
        title={
          <>
            Meet <span className="gradient-text">Mimo Patra.</span>
          </>
        }
        subtitle="12+ years teaching. 5,000+ students across 65 nationalities. 36 published papers. 7 patents. One question that won't let go: how do you teach AI in a way that actually lasts?"
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
          Work with Mimo
          <ArrowRight className="w-4 h-4" />
        </Link>
      </PageHero>

      {/* ====== Portrait + Bio + Cube ====== */}
      <section className="relative py-12 sm:py-16 overflow-hidden">
        <ParallaxOrb color="rgba(245, 158, 11, 0.10)" size={420} speed={110} position="top-10 -left-20" />
        <ParallaxOrb color="rgba(37, 99, 235, 0.08)" size={340} speed={-80} position="bottom-10 -right-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* LEFT: portrait */}
            <Reveal y={30} className="relative order-2 lg:order-1">
              {/* Decorative frame */}
              <div className="relative max-w-md mx-auto">
                <div
                  className="absolute -inset-4 rounded-3xl blur-2xl opacity-30 pointer-events-none"
                  style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #2563EB 100%)' }}
                />
                <div className="relative rounded-3xl overflow-hidden card-3d">
                  <Image
                    src="/images/mimo-portrait.png"
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

            {/* RIGHT: bio + cube */}
            <Reveal y={30} delay={0.1} className="order-1 lg:order-2">
              <span
                className="inline-block text-xs font-bold uppercase tracking-[0.18em] text-amber-600 mb-4"
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                The story so far
              </span>
              <h2
                className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-5 leading-tight"
                style={{ fontFamily: 'var(--font-jakarta)' }}
              >
                <SplitText text="An educator who refused to teach the easy way." highlight="easy way." highlightClassName="gradient-text" />
              </h2>
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

              {/* Floating Stats Cluster — replaces old cube */}
              <div className="flex flex-col items-center pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span
                    className="text-xs font-bold uppercase tracking-wider text-slate-500"
                    style={{ fontFamily: 'var(--font-grotesk)' }}
                  >
                    Hover to explore the stats
                  </span>
                </div>
                <FloatingStatsCluster
                  size={220}
                  stats={[
                    { value: '12+', label: 'Years', color: '#16A34A' },
                    { value: '5K+', label: 'Students', color: '#7C3AED' },
                    { value: '36', label: 'Papers', color: '#F59E0B' },
                    { value: '7', label: 'Patents', color: '#06B6D4' },
                    { value: '65+', label: 'Countries', color: '#2563EB' },
                  ]}
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <WaveDivider3D fromColor="#FFFFFF" toColor="#F8FAFC" />

      {/* ====== Principles section (scroll target) ====== */}
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
              <SplitText text="Learn from Mimo. In person." highlight="In person." highlightClassName="gradient-text" />
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
                Browse Mimo's courses
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


