'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Heart, Rocket, Eye, Users, Globe, Zap } from 'lucide-react';
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
import { BRAND, HERO_STATS } from '@/lib/sariro-data';

/* Story chapters */
const CHAPTERS = [
  {
    num: '01',
    title: 'The Question',
    body: 'Why do smart students graduate unable to build anything real? They can pass exams, recite algorithms, even explain backpropagation. But hand them a blank screen and say "build me an AI app" — and they freeze. Not because they\'re not smart. Because nobody taught them to think.',
    icon: Sparkles,
    color: '#2563EB',
  },
  {
    num: '02',
    title: 'The Refusal',
    body: 'Mimo Patra spent 12 years watching this happen. In universities, in bootcamps, in corporate training rooms. The pattern was always the same: teach the syntax, skip the thinking, hope they figure it out. They never did. Mimo refused to accept that this was just "how education works."',
    icon: Heart,
    color: '#7C3AED',
  },
  {
    num: '03',
    title: 'The Bet',
    body: 'So Mimo made a bet: if you teach people to think — to break problems apart, to ask the right questions, to reason about systems — the typing comes naturally. You don\'t need 80 hours of video. You need a cohort, a mentor, a real project, and the permission to fail. That bet became Sariro.',
    icon: Rocket,
    color: '#16A34A',
  },
  {
    num: '04',
    title: 'The Proof',
    body: '5,000+ students later, across 65 countries, the bet paid off. Sariro alumni ship AI apps at their jobs. They lead AI clubs at their schools. They switch careers. They teach others. Not because we taught them to copy code — because we taught them to think. And thinking is portable.',
    icon: Users,
    color: '#F59E0B',
  },
  {
    num: '05',
    title: 'The Future',
    body: 'Sariro is just getting started. The next decade will be defined by who can build with AI — and who can\'t. We\'re here to make sure that\'s not a question of privilege, geography, or background. If you\'re curious, you belong here. If you\'re willing to think, you\'ll succeed here. That\'s the whole pitch.',
    icon: Globe,
    color: '#06B6D4',
  },
];

/* Values */
const VALUES = [
  { title: 'Thinking over typing', body: 'We teach you to reason, not to copy. The code is a byproduct of understanding.', icon: Sparkles, color: '#2563EB' },
  { title: 'Build real things', body: 'Every cohort ends with a shipped artifact. Not a hello world — a real, working AI project.', icon: Rocket, color: '#7C3AED' },
  { title: 'Accessible by design', body: 'AI education shouldn\'t be gatekept by jargon. An 8-year-old and a grandpa should both follow along.', icon: Heart, color: '#16A34A' },
  { title: 'Community, not customers', body: 'Once you\'re in, you\'re in. Lifetime community access, mentorship, and a network that shows up.', icon: Users, color: '#F59E0B' },
];

export default function StoryPage() {
  // SEO: set document title client-side (since this is a client component)
  useEffect(() => {
    document.title = 'Story — Sariro | How a Question Became a Movement';
  }, []);

  return (
    <BrandLayout>
      {/* ============ HERO ============ */}
      <PageHero
        eyebrow="The Sariro Story"
        accentColor="#7C3AED"
        breadcrumb="Story"
        variant="story"
        title={
          <>
            It started with a{' '}
            <span className="gradient-text">question</span>{' '}
            that wouldn't go away.
          </>
        }
        subtitle="Why do smart students graduate unable to build anything real? This is the story of how that question became Sariro — and how a refusal to teach the easy way became a movement."
      >
        <Link href="/about" className="btn-tactile btn-tactile-light px-5 py-3 text-sm">
          Meet the founder
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link href="/courses" className="btn-tactile btn-tactile-primary px-5 py-3 text-sm">
          <Sparkles className="w-4 h-4" />
          Join a cohort
        </Link>
      </PageHero>

      {/* ============ STORY CHAPTERS (sticky scroll) ============ */}
      <section className="relative py-12 sm:py-16 overflow-hidden bg-slate-950">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-blue-950/40 to-slate-950" />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(124, 58, 237, 0.3) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(37, 99, 235, 0.3) 0%, transparent 50%)'
        }} />

        <div className="relative max-w-4xl mx-auto px-5 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-violet-400 mb-4 block" style={{ fontFamily: 'var(--font-grotesk)' }}>
              — The journey —
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white" style={{ fontFamily: 'var(--font-jakarta)' }}>
              Five chapters.{' '}
              <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                One transformation.
              </span>
            </h2>
          </Reveal>

          {/* Chapter cards */}
          <div className="space-y-8">
            {CHAPTERS.map((ch, i) => {
              const Icon = ch.icon;
              return (
                <Reveal key={ch.num} delay={i * 0.1} y={50}>
                  <div className="relative glass-dark rounded-3xl p-8 sm:p-10 border border-white/10 overflow-hidden group">
                    {/* Glow */}
                    <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ background: ch.color }} />
                    {/* Big number */}
                    <div className="absolute top-4 right-6 text-7xl font-extrabold opacity-10 select-none" style={{ fontFamily: 'var(--font-jakarta)', color: ch.color }}>
                      {ch.num}
                    </div>
                    <div className="relative">
                      {/* Icon */}
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 shadow-lg" style={{ background: `linear-gradient(135deg, ${ch.color}, ${ch.color}99)`, boxShadow: `0 10px 25px -5px ${ch.color}80` }}>
                        <Icon className="w-6 h-6 text-white" strokeWidth={2.4} />
                      </div>
                      {/* Title */}
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}>
                        {ch.title}
                      </h3>
                      {/* Body */}
                      <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                        {ch.body}
                      </p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <WaveDivider3D fromColor="#0B1120" toColor="#FFFFFF" />

      {/* ============ VALUES ============ */}
      <section className="relative py-16 sm:py-20 overflow-hidden">
        <ParallaxOrb color="rgba(124, 58, 237, 0.08)" size={400} speed={100} position="top-10 -left-20" />
        <ParallaxOrb color="rgba(37, 99, 235, 0.06)" size={320} speed={-70} position="bottom-10 -right-20" />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-violet-600 mb-3" style={{ fontFamily: 'var(--font-grotesk)' }}>
              What we stand for
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
              <SplitText text="Four values we refuse to compromise." highlight="refuse to compromise." highlightClassName="gradient-text" />
            </h2>
          </Reveal>

          <StaggerGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" stagger={0.1}>
            {VALUES.map((v) => {
              const Icon = v.icon;
              return (
                <StaggerItem key={v.title}>
                  <TiltCard className="card-3d p-6 h-full" maxTilt={6}>
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: `${v.color}15`, color: v.color }}>
                      <Icon className="w-6 h-6" strokeWidth={2.2} />
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>
                      {v.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{v.body}</p>
                  </TiltCard>
                </StaggerItem>
              );
            })}
          </StaggerGroup>
        </div>
      </section>

      <WaveDivider3D fromColor="#FFFFFF" toColor="#F8FAFC" />

      {/* ============ IMPACT NUMBERS (living) ============ */}
      <section className="relative py-16 sm:py-20 bg-slate-50 overflow-hidden">
        <ParallaxOrb color="rgba(124, 58, 237, 0.10)" size={380} speed={90} position="top-20 right-10" />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-12">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-violet-600 mb-3" style={{ fontFamily: 'var(--font-grotesk)' }}>
              The proof
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
              <SplitText text="Numbers that started with one student." highlight="one student." highlightClassName="gradient-text" />
            </h2>
          </Reveal>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {HERO_STATS.map((s, i) => {
              const accents = ['#2563EB', '#16A34A', '#7C3AED', '#F59E0B'];
              const accent = accents[i % accents.length];
              return (
                <Reveal key={s.label} delay={i * 0.1}>
                  <div className="relative rounded-2xl p-6 text-center overflow-hidden" style={{ background: `${accent}08`, border: `1px solid ${accent}20` }}>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-24 h-24 rounded-full blur-2xl opacity-30" style={{ background: accent }} />
                    <div className="relative">
                      <div className="text-4xl sm:text-5xl font-extrabold" style={{ fontFamily: 'var(--font-jakarta)', color: accent }}>
                        <CountUp value={s.value} suffix={s.suffix} duration={2} />
                      </div>
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-2" style={{ fontFamily: 'var(--font-grotesk)' }}>
                        {s.label}
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>

          <Reveal delay={0.4}>
            <p className="text-center mt-8 text-slate-500 italic">
              "Every number on this page started with one student who decided to take a class. We're still counting." — {BRAND.founder}
            </p>
          </Reveal>
        </div>
      </section>

      <WaveDivider3D fromColor="#F8FAFC" toColor="#FFFFFF" />

      {/* ============ CLOSING CTA ============ */}
      <section className="relative py-20 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 mesh-bg opacity-60" />
        <ParallaxOrb color="rgba(124, 58, 237, 0.12)" size={420} speed={100} position="top-10 left-1/4" />
        <div className="relative max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
              <SplitText text="The next chapter is yours." highlight="yours." highlightClassName="gradient-text" />
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-5 text-lg text-slate-600 max-w-xl mx-auto">
              Sariro isn't a course you take. It's a community you join. A way of thinking you adopt. A future you build.
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="mt-8 flex flex-wrap gap-3 justify-center">
              <MagneticButton as="a" href="/courses" strength={0.2} className="btn-tactile btn-tactile-primary px-6 py-3.5 text-sm">
                <Zap className="w-4 h-4" />
                Start your chapter
              </MagneticButton>
              <MagneticButton as="a" href="/about" strength={0.2} className="btn-tactile btn-tactile-light px-6 py-3.5 text-sm">
                Meet the team
                <ArrowRight className="w-4 h-4" />
              </MagneticButton>
            </div>
          </Reveal>
        </div>
      </section>
    </BrandLayout>
  );
}
