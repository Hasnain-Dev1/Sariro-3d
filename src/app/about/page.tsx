'use client';

import { useEffect, useRef } from 'react';
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
  Star,
  Users,
  Globe2,
  GraduationCap,
  Rocket,
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
} from '@/components/brand/effects-kit';
import { MIMO, BRAND } from '@/lib/sariro-data';

/* Principle icon map */
const PRINCIPLE_ICONS = [Brain, Target, Lightbulb, Heart];

/* Founding team — Mimo + 3 others */
const TEAM = [
  {
    name: MIMO.name,
    role: 'Founder & CEO',
    bio: 'AI educator, researcher, and patent-holding inventor. 12+ years teaching thinking — not just typing.',
    accent: '#F59E0B',
    isFounder: true,
    avatar: 'M',
  },
  {
    name: 'Hasnain Ali',
    role: 'Lead Director  · Development',
    bio: 'Ex-ML engineer turned educator. Designs every Sariro course to ship real projects, not toy demos.',
    accent: '#2563EB',
    avatar: 'A',
  },
  {
    name: 'Dr. Lena Okafor',
    role: 'Head of School Partnerships',
    bio: 'Former principal turned advocate for AI literacy. Brings Sariro to campuses in 65 countries.',
    accent: '#16A34A',
    avatar: 'L',
  },
  {
    name: 'Marco Rossi',
    role: 'Lead Mentor · Professionals',
    bio: 'Senior PM at a fintech by day, Sariro mentor by night. Teaches the AI-for-PMs track himself.',
    accent: '#7C3AED',
    avatar: 'M',
  },
];

/* Floating stats around Mimo portrait */
const FOUNDER_STATS = [
  { value: 12, suffix: '+', label: 'Years teaching', accent: '#F59E0B' },
  { value: 5000, suffix: '+', label: 'Students mentored', accent: '#2563EB' },
  { value: 36, suffix: '', label: 'Papers published', accent: '#7C3AED' },
  { value: 7, suffix: '', label: 'Patents filed', accent: '#16A34A' },
];

/* Living numbers strip below founder bio */
const LIVING_NUMBERS = [
  { value: 65, suffix: '+', label: 'Nationalities taught', icon: Globe2, accent: '#16A34A' },
  { value: 200, suffix: '+', label: 'Cohorts led', icon: GraduationCap, accent: '#2563EB' },
  { value: 98, suffix: '%', label: 'Student satisfaction', icon: Heart, accent: '#EC4899' },
  { value: 1000, suffix: '+', label: 'Projects shipped', icon: Rocket, accent: '#F59E0B' },
];

export default function AboutPage() {
  const principlesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = 'About — Sariro | Meet Founder & CEO Mimo Patra';
  }, []);

  const scrollToPrinciples = () => {
    principlesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <BrandLayout>
      <PageHero
        eyebrow="About Sariro"
        accentColor="#F59E0B"
        breadcrumb="About"
        variant="about"
        title={
          <>
            We&rsquo;re not building a course. We&rsquo;re building a future where{' '}
            <span className="gradient-text">thinking comes first.</span>
          </>
        }
        subtitle="Sariro is a brand on a mission — to teach the next generation not just how to code, but how to think. Founded by educator Mimo Patra after 12 years watching smart students graduate unable to build."
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
        <Link href="/story" className="btn-tactile btn-tactile-light px-5 py-3 text-sm">
          Read our story
          <ArrowRight className="w-4 h-4" />
        </Link>
      </PageHero>

      {/* ====== 1. Brand Story ====== */}
      <section className="relative py-16 sm:py-20 overflow-hidden">
        <ParallaxOrb color="rgba(245, 158, 11, 0.10)" size={420} speed={110} position="top-10 -left-20" />
        <ParallaxOrb color="rgba(37, 99, 235, 0.08)" size={340} speed={-80} position="bottom-10 -right-20" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <span
              className="inline-block text-xs font-bold uppercase tracking-[0.18em] text-amber-600 mb-4"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              What is Sariro?
            </span>
          </Reveal>
          <Reveal delay={0.05}>
            <h2
              className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-8 leading-tight"
              style={{ fontFamily: 'var(--font-jakarta)' }}
            >
              <SplitText
                text="A brand. A philosophy. A refusal to teach the easy way."
                highlight="refusal"
                highlightClassName="gradient-text"
              />
            </h2>
          </Reveal>

          <div className="space-y-6 text-base sm:text-lg text-slate-700 leading-relaxed">
            <Reveal delay={0.1}>
              <p>
                Sariro started with a question that wouldn&rsquo;t go away: why do so many smart
                students graduate unable to build anything real? They can pass exams. They can
                recite definitions. But ask them to ship a working AI feature, audit a model for
                bias, or explain why their prompt falls apart in production — and they freeze.
              </p>
            </Reveal>
            <Reveal delay={0.15}>
              <p>
                The answer wasn&rsquo;t more tutorials. Tutorials teach typing. Sariro teaches{' '}
                <strong className="text-slate-900">thinking</strong> — the ability to break
                problems apart, reason about systems, and build with confidence. Every cohort,
                every workshop, every free resource we publish is shaped by that single belief.
              </p>
            </Reveal>
            <Reveal delay={0.2}>
              <p>
                Today, Sariro is a remote-first brand serving 5,000+ students across 65
                countries. We run cohort-based courses, partner with schools to bring AI literacy
                to entire campuses, and mentor professionals who refuse to be left behind by the
                AI shift. We are not a bootcamp. We are not a course platform. We are a movement
                that believes thinking — real thinking — is the most important skill of the next
                fifty years.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <WaveDivider3D fromColor="#FFFFFF" toColor="#F8FAFC" />

      {/* ====== 2. Mission + Vision ====== */}
      <section className="relative py-16 sm:py-20 bg-slate-50 overflow-hidden">
        <ParallaxOrb color="rgba(245, 158, 11, 0.10)" size={380} speed={100} position="top-20 right-10" />
        <ParallaxOrb color="rgba(124, 58, 237, 0.08)" size={320} speed={-70} position="bottom-10 left-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span
                className="inline-block text-xs font-bold uppercase tracking-[0.18em] text-amber-600 mb-3"
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                Mission &amp; Vision
              </span>
              <h2
                className="text-3xl sm:text-4xl font-extrabold text-slate-900"
                style={{ fontFamily: 'var(--font-jakarta)' }}
              >
                <SplitText
                  text="What we're here to do. Where we're going."
                  highlight="Where we're going."
                  highlightClassName="gradient-text"
                />
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <StaggerItem>
              <TiltCard className="card-3d p-8 h-full group" maxTilt={6}>
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                    <Target className="w-6 h-6" strokeWidth={2.2} />
                  </div>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md text-white mt-1.5"
                    style={{ background: '#F59E0B', fontFamily: 'var(--font-grotesk)' }}
                  >
                    Mission
                  </span>
                </div>
                <h3
                  className="text-2xl font-extrabold text-slate-900 mb-3"
                  style={{ fontFamily: 'var(--font-jakarta)' }}
                >
                  Teach thinking, not just typing.
                </h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  {BRAND.mission}
                </p>
              </TiltCard>
            </StaggerItem>

            <StaggerItem>
              <TiltCard className="card-3d p-8 h-full group" maxTilt={6}>
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                    <Sparkles className="w-6 h-6" strokeWidth={2.2} />
                  </div>
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md text-white mt-1.5"
                    style={{ background: '#7C3AED', fontFamily: 'var(--font-grotesk)' }}
                  >
                    Vision
                  </span>
                </div>
                <h3
                  className="text-2xl font-extrabold text-slate-900 mb-3"
                  style={{ fontFamily: 'var(--font-jakarta)' }}
                >
                  A world where everyone can build the future.
                </h3>
                <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                  We picture a future where AI literacy is as universal as reading — where an
                  8-year-old in Lagos and a grandmother in Lisbon can both understand, critique,
                  and shape the AI systems shaping their lives. Sariro is our small, stubborn
                  contribution to that future.
                </p>
              </TiltCard>
            </StaggerItem>
          </div>
        </div>
      </section>

      <WaveDivider3D fromColor="#F8FAFC" toColor="#FFFFFF" />

      {/* ====== 3. Founder & CEO ====== */}
      <section className="relative py-16 sm:py-24 overflow-hidden">
        <ParallaxOrb color="rgba(245, 158, 11, 0.12)" size={440} speed={100} position="top-10 -left-20" />
        <ParallaxOrb color="rgba(37, 99, 235, 0.10)" size={360} speed={-90} position="bottom-20 -right-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span
                className="inline-block text-xs font-bold uppercase tracking-[0.18em] text-amber-600 mb-3"
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                Founder &amp; CEO
              </span>
              <h2
                className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900"
                style={{ fontFamily: 'var(--font-jakarta)' }}
              >
                <SplitText text="Meet Mimo Patra." highlight="Mimo Patra." highlightClassName="gradient-text" />
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* LEFT: portrait with floating stats cluster */}
            <Reveal y={30} className="relative">
              <div className="relative max-w-md mx-auto">
                {/* Decorative frame */}
                <div
                  className="absolute -inset-4 rounded-3xl blur-2xl opacity-30 pointer-events-none"
                  style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #2563EB 100%)' }}
                />
                <div className="relative rounded-3xl overflow-hidden card-3d">
                  <Image
                    src="/images/mimo-portrait.webp"
                    alt={`${MIMO.name} — Founder & CEO`}
                    width={640}
                    height={720}
                    className="w-full h-auto object-cover"
                    priority
                  />
                  {/* Label overlay */}
                  <div className="absolute top-4 left-4">
                    <span
                      className="inline-block px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-white"
                      style={{ background: '#F59E0B', fontFamily: 'var(--font-grotesk)' }}
                    >
                      Founder &amp; CEO
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-slate-950/85 via-slate-950/40 to-transparent">
                    <div className="text-white">
                      <div
                        className="text-2xl font-extrabold"
                        style={{ fontFamily: 'var(--font-jakarta)' }}
                      >
                        {MIMO.name}
                      </div>
                      <div
                        className="text-sm text-amber-300 font-bold"
                        style={{ fontFamily: 'var(--font-grotesk)' }}
                      >
                        Founder &amp; CEO · Sariro
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating stats cluster — anchored around the portrait */}
                <div className="hidden sm:block">
                  <FloatingStatsCluster
                    stats={FOUNDER_STATS}
                    size={520}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                  />
                </div>
              </div>

              {/* Social row */}
              <div className="flex items-center justify-center gap-3 mt-8">
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
                  href={`mailto:${BRAND.emails.founder}`}
                  aria-label="Email Mimo"
                  className="px-4 h-10 rounded-xl glass-panel flex items-center justify-center text-xs font-bold text-slate-700 hover:text-amber-600 transition-colors"
                  style={{ fontFamily: 'var(--font-grotesk)' }}
                >
                  {BRAND.emails.founder}
                </a>
              </div>
            </Reveal>

            {/* RIGHT: bio + living numbers */}
            <Reveal y={30} delay={0.1}>
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
                <SplitText
                  text="An educator who refused to teach the easy way."
                  highlight="easy way."
                  highlightClassName="gradient-text"
                />
              </h3>
              <p className="text-base sm:text-lg text-slate-700 leading-relaxed mb-4">
                {MIMO.bio}
              </p>
              <p className="text-base text-slate-600 leading-relaxed mb-8">
                Mimo started Sariro after a decade watching smart students graduate unable to
                build anything real. The fix wasn&rsquo;t more tutorials — it was teaching
                thinking. Today, Sariro serves thousands of students across 65 countries, all
                taught by Mimo and a hand-picked mentor team that shares the same stubborn belief.
              </p>

              {/* Living numbers strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {LIVING_NUMBERS.map((n) => (
                  <div
                    key={n.label}
                    className="rounded-2xl bg-slate-50 p-4 text-center border border-slate-100"
                  >
                    <n.icon
                      className="w-5 h-5 mx-auto mb-1.5"
                      style={{ color: n.accent }}
                      strokeWidth={2.2}
                    />
                    <div
                      className="text-xl sm:text-2xl font-extrabold text-slate-900"
                      style={{ fontFamily: 'var(--font-jakarta)' }}
                    >
                      <CountUp value={n.value} suffix={n.suffix} duration={1.8} />
                    </div>
                    <div
                      className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1"
                      style={{ fontFamily: 'var(--font-grotesk)' }}
                    >
                      {n.label}
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      <WaveDivider3D fromColor="#FFFFFF" toColor="#F8FAFC" />

      {/* ====== 4. Team ====== */}
      <section className="relative py-16 sm:py-20 bg-slate-50 overflow-hidden">
        <ParallaxOrb color="rgba(124, 58, 237, 0.08)" size={360} speed={90} position="top-10 left-10" />
        <ParallaxOrb color="rgba(22, 163, 74, 0.08)" size={320} speed={-70} position="bottom-10 right-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span
                className="inline-block text-xs font-bold uppercase tracking-[0.18em] text-amber-600 mb-3"
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                The team
              </span>
              <h2
                className="text-3xl sm:text-4xl font-extrabold text-slate-900"
                style={{ fontFamily: 'var(--font-jakarta)' }}
              >
                <SplitText
                  text="Educators first. Builders second. Always curious."
                  highlight="curious."
                  highlightClassName="gradient-text"
                />
              </h2>
            </div>
          </Reveal>

          <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" stagger={0.1}>
            {TEAM.map((member) => (
              <StaggerItem key={member.name}>
                <TiltCard className="card-3d p-6 h-full group relative" maxTilt={6}>
                  {member.isFounder && (
                    <div className="absolute -top-3 -right-3 z-10">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center shadow-lg"
                        style={{ background: member.accent }}
                      >
                        <Star className="w-4 h-4 text-white fill-white" />
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col items-center text-center">
                    {/* Avatar */}
                    <div className="relative mb-4">
                      <div
                        className="absolute inset-0 rounded-full blur-lg opacity-30 group-hover:opacity-60 transition-opacity"
                        style={{ background: member.accent }}
                      />
                      <div
                        className="relative w-20 h-20 rounded-full flex items-center justify-center text-2xl font-extrabold text-white shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${member.accent} 0%, #0F172A 100%)`, fontFamily: 'var(--font-jakarta)' }}
                      >
                        {member.avatar}
                      </div>
                    </div>
                    <h3
                      className="text-lg font-extrabold text-slate-900"
                      style={{ fontFamily: 'var(--font-jakarta)' }}
                    >
                      {member.name}
                    </h3>
                    <div
                      className="text-xs font-bold uppercase tracking-wider mt-0.5 mb-3"
                      style={{ color: member.accent, fontFamily: 'var(--font-grotesk)' }}
                    >
                      {member.role}
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{member.bio}</p>
                  </div>
                </TiltCard>
              </StaggerItem>
            ))}
          </StaggerGroup>

          <Reveal delay={0.3}>
            <div className="mt-10 text-center">
              <p className="text-sm text-slate-600 mb-4">
                Plus 30+ mentors across 12 timezones — every one of them a builder first.
              </p>
              <MagneticButton
                as="a"
                href={`mailto:${BRAND.emails.hr}`}
                strength={0.2}
                className="btn-tactile btn-tactile-light px-6 py-3 text-sm"
              >
                <Users className="w-4 h-4" />
                Join the team
              </MagneticButton>
            </div>
          </Reveal>
        </div>
      </section>

      <WaveDivider3D fromColor="#F8FAFC" toColor="#FFFFFF" />

      {/* ====== 5. Principles (scroll target) ====== */}
      <section
        ref={principlesRef}
        className="relative py-16 sm:py-20 scroll-mt-24 overflow-hidden"
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
              <SplitText
                text="Four ideas that shape every Sariro course."
                highlight="every Sariro course."
                highlightClassName="gradient-text"
              />
            </h2>
            <Reveal delay={0.15}>
              <p className="mt-3 text-slate-600">
                Not a manifesto. Just the four things Mimo refuses to compromise on — and the
                reason Sariro feels different from day one.
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

      <WaveDivider3D fromColor="#FFFFFF" toColor="#0F172A" />

      {/* ====== 6. Quote (dark card) ====== */}
      <section className="relative py-16 sm:py-24 overflow-hidden bg-slate-950">
        <ParallaxOrb color="rgba(245, 158, 11, 0.12)" size={420} speed={100} position="top-10 left-10" />
        <ParallaxOrb color="rgba(37, 99, 235, 0.10)" size={360} speed={-80} position="bottom-10 right-10" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div
              className="relative rounded-3xl overflow-hidden border border-white/10"
              style={{
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
              }}
            >
              <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-[120px] opacity-30 pointer-events-none" style={{ background: '#F59E0B' }} />
              <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full blur-[100px] opacity-20 pointer-events-none" style={{ background: '#2563EB' }} />
              <div className="relative p-8 sm:p-14 text-center">
                <Quote className="w-12 h-12 text-amber-400 mx-auto mb-6" />
                <p
                  className="text-2xl sm:text-3xl font-bold text-white leading-snug max-w-3xl mx-auto"
                  style={{ fontFamily: 'var(--font-jakarta)' }}
                >
                  &ldquo;Anyone can copy a tutorial. We teach you to think — to break problems
                  apart, to ask the right questions. The typing comes naturally after.&rdquo;
                </p>
                <div className="mt-8 flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white font-extrabold text-sm">
                    M
                  </div>
                  <div className="text-left">
                    <div className="text-amber-300 text-sm font-bold" style={{ fontFamily: 'var(--font-jakarta)' }}>
                      {MIMO.name}
                    </div>
                    <div className="text-slate-400 text-xs" style={{ fontFamily: 'var(--font-grotesk)' }}>
                      Founder &amp; CEO · Sariro
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ====== 7. Closing CTA ====== */}
      <section className="relative py-20 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 mesh-bg opacity-60" />
        <ParallaxOrb color="rgba(245, 158, 11, 0.12)" size={420} speed={100} position="top-10 left-1/4" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <span
              className="inline-block text-xs font-bold uppercase tracking-[0.18em] text-amber-600 mb-3"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              The future is being built right now
            </span>
          </Reveal>
          <Reveal delay={0.05}>
            <h2
              className="text-3xl sm:text-5xl font-extrabold text-slate-900"
              style={{ fontFamily: 'var(--font-jakarta)' }}
            >
              <SplitText
                text="Will you watch it happen — or build it?"
                highlight="build it?"
                highlightClassName="gradient-text"
              />
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Every Sariro cohort is led by Mimo and a hand-picked mentor team. Reserve a seat
              in the next cohort, partner with us to bring AI to your school, or just say hi.
            </p>
          </Reveal>
          <Reveal delay={0.25}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <MagneticButton
                as="a"
                href="/courses"
                strength={0.25}
                className="btn-tactile btn-tactile-primary px-6 py-3.5"
              >
                Browse Mimo&rsquo;s courses
                <ArrowRight className="w-4 h-4" />
              </MagneticButton>
              <MagneticButton
                as="a"
                href={`mailto:${BRAND.emails.founder}`}
                strength={0.25}
                className="btn-tactile btn-tactile-light px-6 py-3.5"
              >
                Email Mimo directly
              </MagneticButton>
            </div>
          </Reveal>
        </div>
      </section>
    </BrandLayout>
  );
}
