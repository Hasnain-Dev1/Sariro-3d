'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Sparkles,
  HelpCircle,
  Ban,
  Hammer,
  Globe2,
  Heart,
  Brain,
  Users,
  Quote,
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
} from '@/components/brand/effects-kit';
import { BRAND } from '@/lib/sariro-data';

/* 5 chapter cards — dark cosmic theme */
type Chapter = {
  num: string;
  title: string;
  body: string;
  accent: string;
  icon: typeof HelpCircle;
};

const CHAPTERS: Chapter[] = [
  {
    num: '01',
    title: 'The Question',
    body:
      'It started with a question that wouldn\'t go away: why do smart students graduate unable to build anything real? They pass exams. They can recite definitions. But ship a working AI feature? Freeze. The question sat in the back of Mimo\'s mind for twelve years.',
    accent: '#7C3AED',
    icon: HelpCircle,
  },
  {
    num: '02',
    title: 'The Refusal',
    body:
      'Mimo spent 12 years watching this — in classrooms, in bootcamps, in corporate training rooms. Watching smart people leave with certificates and zero confidence. The industry kept saying \u201cmore tutorials, more videos, more bootcamps.\u201d Mimo refused. Tutorials teach typing. They don\'t teach thinking.',
    accent: '#06B6D4',
    icon: Ban,
  },
  {
    num: '03',
    title: 'The Bet',
    body:
      'So Mimo made a bet: teach thinking, not typing. Build a brand that respects curiosity over credentials, projects over playlists, questions over answers. Cohort-based. Mentor-led. Project-first. Plain language. No jargon. No gatekeeping. Sariro was the name. The bet was that students would actually learn.',
    accent: '#F59E0B',
    icon: Sparkles,
  },
  {
    num: '04',
    title: 'The Proof',
    body:
      'The bet paid off. 5,000+ students. 65 countries. 200+ cohorts. 1,000+ portfolio projects shipped. A history teacher became an AI engineer. A 16-year-old built her first neural net. A principal started an AI ethics club. The proof wasn\'t in the numbers — it was in the builders those numbers represented.',
    accent: '#16A34A',
    icon: Hammer,
  },
  {
    num: '05',
    title: 'The Future',
    body:
      'The next chapter isn\'t ours to write. It\'s yours. If you\'re curious — really curious, the kind of curious that keeps you up at night — you belong here. Sariro isn\'t a course. It isn\'t a platform. It\'s a movement of people who refuse to watch the future happen to them.',
    accent: '#EC4899',
    icon: Globe2,
  },
];

/* 4 value cards */
const VALUES = [
  {
    title: 'Thinking over typing',
    body: "Anyone can copy a tutorial. We teach you to think — to break problems apart, to ask the right questions, to reason about systems.",
    accent: '#7C3AED',
    icon: Brain,
  },
  {
    title: 'Build real things',
    body: "Every Sariro course ends with something you can show an employer, a client, or a school. Not a \u201chello world\u201d — a real, working AI artifact.",
    accent: '#F59E0B',
    icon: Hammer,
  },
  {
    title: 'Accessible by design',
    body: "AI education shouldn\'t be gatekept by jargon. We teach in plain language. An 8-year-old and a grandpa should both be able to follow along.",
    accent: '#16A34A',
    icon: Heart,
  },
  {
    title: 'Community, not customers',
    body: "Once you\'re in, you\'re in. Lifetime community access, mentorship opportunities, and a network that shows up when you ship — and when you stumble.",
    accent: '#06B6D4',
    icon: Users,
  },
];

/* Impact stats — colored glow cards */
const IMPACT = [
  { value: 5000, suffix: '+', label: 'Students taught', accent: '#7C3AED' },
  { value: 65, suffix: '', label: 'Countries served', accent: '#06B6D4' },
  { value: 200, suffix: '+', label: 'Cohorts led', accent: '#F59E0B' },
  { value: 1000, suffix: '+', label: 'Projects shipped', accent: '#16A34A' },
];

export default function StoryPage() {
  useEffect(() => {
    document.title = "Story — Sariro | How a Question Became a Movement";
  }, []);

  return (
    <BrandLayout>
      <PageHero
        eyebrow="Our story"
        accentColor="#7C3AED"
        breadcrumb="Story"
        variant="story"
        title={
          <>
            It started with a question that{' '}
            <span className="gradient-text">wouldn&rsquo;t go away.</span>
          </>
        }
        subtitle="Five chapters. One stubborn belief. The story of how Sariro went from a question Mimo could not shake to a movement of 5,000+ builders across 65 countries."
      >
        <a
          href="#chapter-01"
          className="btn-tactile px-5 py-3 text-sm text-white"
          style={{
            background: '#7C3AED',
            boxShadow: '0 10px 0 -1px #5B21B6, 0 18px 30px -12px rgba(124,58,237,0.55)',
            fontFamily: 'var(--font-grotesk)',
          }}
        >
          <Sparkles className="w-4 h-4" />
          Start reading
        </a>
        <Link href="/about" className="btn-tactile btn-tactile-light px-5 py-3 text-sm">
          Meet the founder
          <ArrowRight className="w-4 h-4" />
        </Link>
      </PageHero>

      {/* ====== 5 chapter cards (dark cosmic theme) ====== */}
      <section
        id="chapter-01"
        className="relative py-16 sm:py-24 overflow-hidden scroll-mt-24"
        style={{ background: 'linear-gradient(180deg, #0F172A 0%, #1E1B4B 100%)' }}
      >
        {/* Starfield */}
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(2px 2px at 20% 30%, white, transparent), radial-gradient(1px 1px at 60% 70%, white, transparent), radial-gradient(1.5px 1.5px at 80% 20%, #FCD34D, transparent), radial-gradient(1px 1px at 40% 90%, white, transparent), radial-gradient(2px 2px at 90% 50%, #06B6D4, transparent)',
            backgroundSize: '300px 300px',
          }}
        />
        <ParallaxOrb color="rgba(124, 58, 237, 0.18)" size={460} speed={120} position="top-10 -left-20" />
        <ParallaxOrb color="rgba(6, 182, 212, 0.12)" size={360} speed={-90} position="bottom-20 -right-20" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span
                className="inline-block text-xs font-bold uppercase tracking-[0.18em] text-violet-300 mb-3"
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                Five chapters
              </span>
              <h2
                className="text-3xl sm:text-4xl font-extrabold text-white"
                style={{ fontFamily: 'var(--font-jakarta)' }}
              >
                <SplitText
                  text="How a question became a movement."
                  highlight="movement."
                  highlightClassName="bg-gradient-to-r from-violet-300 via-cyan-300 to-amber-300 bg-clip-text text-transparent"
                />
              </h2>
            </div>
          </Reveal>

          <div className="space-y-8">
            {CHAPTERS.map((chapter, i) => (
              <Reveal key={chapter.num} delay={i * 0.05}>
                <TiltCard
                  className="relative rounded-3xl border border-white/10 p-7 sm:p-9 overflow-hidden group"
                  maxTilt={4}
                >
                  {/* Glow */}
                  <div
                    className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity pointer-events-none"
                    style={{ background: chapter.accent }}
                  />
                  {/* Top row: number + icon */}
                  <div className="relative flex items-start gap-5 mb-4">
                    <div className="shrink-0">
                      <div
                        className="text-5xl sm:text-6xl font-extrabold leading-none opacity-30"
                        style={{ color: chapter.accent, fontFamily: 'var(--font-jakarta)' }}
                      >
                        {chapter.num}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ background: `${chapter.accent}25`, color: chapter.accent }}
                        >
                          <chapter.icon className="w-5 h-5" strokeWidth={2.2} />
                        </div>
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md text-white"
                          style={{ background: chapter.accent, fontFamily: 'var(--font-grotesk)' }}
                        >
                          Chapter {chapter.num}
                        </span>
                      </div>
                      <h3
                        className="text-2xl sm:text-3xl font-extrabold text-white mb-3"
                        style={{ fontFamily: 'var(--font-jakarta)' }}
                      >
                        {chapter.title}
                      </h3>
                    </div>
                  </div>
                  <p className="relative text-base sm:text-lg text-slate-300 leading-relaxed pl-0 sm:pl-[88px]">
                    {chapter.body}
                  </p>
                </TiltCard>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ====== Values ====== */}
      <section className="relative py-16 sm:py-20 overflow-hidden">
        <ParallaxOrb color="rgba(124, 58, 237, 0.10)" size={400} speed={100} position="top-20 -left-10" />
        <ParallaxOrb color="rgba(6, 182, 212, 0.08)" size={320} speed={-70} position="bottom-10 -right-10" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span
                className="inline-block text-xs font-bold uppercase tracking-[0.18em] text-violet-600 mb-3"
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                What we believe
              </span>
              <h2
                className="text-3xl sm:text-4xl font-extrabold text-slate-900"
                style={{ fontFamily: 'var(--font-jakarta)' }}
              >
                <SplitText
                  text="Four values we don\'t compromise on."
                  highlight="don\'t compromise"
                  highlightClassName="gradient-text"
                />
              </h2>
            </div>
          </Reveal>

          <StaggerGroup className="grid grid-cols-1 md:grid-cols-2 gap-6" stagger={0.1}>
            {VALUES.map((v) => (
              <StaggerItem key={v.title}>
                <TiltCard className="card-3d p-7 h-full group" maxTilt={6}>
                  <div className="flex items-start gap-5">
                    <div className="relative shrink-0">
                      <div
                        className="absolute inset-0 rounded-2xl blur-lg opacity-30 group-hover:opacity-60 transition-opacity"
                        style={{ background: v.accent }}
                      />
                      <div
                        className="relative w-14 h-14 rounded-2xl flex items-center justify-center"
                        style={{ background: `${v.accent}15`, color: v.accent }}
                      >
                        <v.icon className="w-7 h-7" strokeWidth={2.2} />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3
                        className="text-xl font-extrabold text-slate-900 mb-2"
                        style={{ fontFamily: 'var(--font-jakarta)' }}
                      >
                        {v.title}
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{v.body}</p>
                    </div>
                  </div>
                </TiltCard>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      <WaveDivider3D fromColor="#FFFFFF" toColor="#F8FAFC" />

      {/* ====== Impact numbers (colored glow cards) ====== */}
      <section className="relative py-16 sm:py-24 bg-slate-50 overflow-hidden">
        <ParallaxOrb color="rgba(124, 58, 237, 0.10)" size={400} speed={100} position="top-10 -left-20" />
        <ParallaxOrb color="rgba(16, 185, 129, 0.08)" size={320} speed={-80} position="bottom-10 -right-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span
                className="inline-block text-xs font-bold uppercase tracking-[0.18em] text-violet-600 mb-3"
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                The proof
              </span>
              <h2
                className="text-3xl sm:text-4xl font-extrabold text-slate-900"
                style={{ fontFamily: 'var(--font-jakarta)' }}
              >
                <SplitText
                  text="Five years. Five thousand builders."
                  highlight="Five thousand"
                  highlightClassName="gradient-text"
                />
              </h2>
            </div>
          </Reveal>

          <StaggerGroup className="grid grid-cols-2 lg:grid-cols-4 gap-6" stagger={0.1}>
            {IMPACT.map((stat) => (
              <StaggerItem key={stat.label}>
                <div className="relative">
                  {/* Glow */}
                  <div
                    className="absolute inset-0 rounded-3xl blur-2xl opacity-30 pointer-events-none"
                    style={{ background: stat.accent }}
                  />
                  <TiltCard className="relative card-3d p-7 text-center h-full" maxTilt={6}>
                    <div
                      className="text-4xl sm:text-5xl font-extrabold mb-2"
                      style={{ color: stat.accent, fontFamily: 'var(--font-jakarta)' }}
                    >
                      <CountUp value={stat.value} suffix={stat.suffix} duration={2} />
                    </div>
                    <div
                      className="text-xs font-bold uppercase tracking-wider text-slate-600"
                      style={{ fontFamily: 'var(--font-grotesk)' }}
                    >
                      {stat.label}
                    </div>
                  </TiltCard>
                </div>
              </StaggerItem>
            ))}
          </StaggerGroup>
        </div>
      </section>

      <WaveDivider3D fromColor="#F8FAFC" toColor="#0F172A" />

      {/* ====== Quote ====== */}
      <section className="relative py-20 sm:py-24 overflow-hidden bg-slate-950">
        <ParallaxOrb color="rgba(124, 58, 237, 0.16)" size={460} speed={120} position="top-10 left-10" />
        <ParallaxOrb color="rgba(6, 182, 212, 0.12)" size={380} speed={-90} position="bottom-10 right-10" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <Quote className="w-12 h-12 text-violet-400 mx-auto mb-6" />
            <p
              className="text-2xl sm:text-3xl font-bold text-white leading-snug"
              style={{ fontFamily: 'var(--font-jakarta)' }}
            >
              "Every number on this page started with one student. One question. One refusal to settle for a tutorial that didn't teach them anything. We don\'t count enrollments. We count builders."
            </p>
            <Reveal delay={0.2}>
              <div className="mt-8 inline-flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white font-extrabold text-sm">
                  M
                </div>
                <div className="text-left">
                  <div className="text-violet-300 text-sm font-bold" style={{ fontFamily: 'var(--font-jakarta)' }}>
                    {BRAND.founder}
                  </div>
                  <div className="text-slate-400 text-xs" style={{ fontFamily: 'var(--font-grotesk)' }}>
                    Founder &amp; CEO · Sariro
                  </div>
                </div>
              </div>
            </Reveal>
          </Reveal>
        </div>
      </section>

      {/* ====== Closing CTA ====== */}
      <section className="relative py-20 sm:py-24 overflow-hidden">
        <div className="absolute inset-0 mesh-bg opacity-60" />
        <ParallaxOrb color="rgba(124, 58, 237, 0.12)" size={420} speed={100} position="top-10 left-1/4" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <span
              className="inline-block text-xs font-bold uppercase tracking-[0.18em] text-violet-600 mb-3"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              The next chapter is yours.
            </span>
          </Reveal>
          <Reveal delay={0.05}>
            <h2
              className="text-3xl sm:text-5xl font-extrabold text-slate-900"
              style={{ fontFamily: 'var(--font-jakarta)' }}
            >
              <SplitText
                text="Will you be chapter six?"
                highlight="chapter six?"
                highlightClassName="gradient-text"
              />
            </h2>
          </Reveal>
          <Reveal delay={0.15}>
            <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
              Five chapters down. The sixth is the one you write. Join a cohort, partner with a
              school, or just say hi — every future builder starts with a single message.
            </p>
          </Reveal>
          <Reveal delay={0.25}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <MagneticButton
                as="a"
                href="/courses"
                strength={0.2}
                className="btn-tactile btn-tactile-primary px-6 py-3.5 text-sm"
              >
                <Sparkles className="w-4 h-4" />
                Browse cohorts
                <ArrowRight className="w-4 h-4" />
              </MagneticButton>
              <MagneticButton
                as="a"
                href="/about"
                strength={0.2}
                className="btn-tactile btn-tactile-light px-6 py-3.5 text-sm"
              >
                Meet the team
              </MagneticButton>
            </div>
          </Reveal>
        </div>
      </section>
    </BrandLayout>
  );
}
