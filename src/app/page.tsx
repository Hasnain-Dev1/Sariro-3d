'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion, useScroll, useTransform, useMotionValueEvent, useInView } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight, Sparkles, Rocket } from 'lucide-react';
import { BRAND, HERO_STATS, TRUSTED_BY } from '@/lib/sariro-data';
import { useHeavyVisuals } from '@/lib/use-heavy-visuals';
import BrandLayout from '@/components/brand/brand-layout';
import MapTeaser from '@/components/brand/map-teaser';
import { WaveDivider3D } from '@/components/sariro-3d/kit-3d';

const NeuralNetworkScene = dynamic(() => import('@/components/brand/neural-scene'), { ssr: false });
// Bottom-of-page section, uses three.js — deferred so it never competes with
// the hero for initial load weight.
const OryzoSection = dynamic(() => import('@/components/brand/oryzo-section'), { ssr: false });

// Below-the-fold sections — none of these use three.js, so they still
// server-render (good for SEO/first paint of their content), but splitting
// them out of the hero's own JS chunk means a first-time visitor only has to
// download/parse the hero's code before it's interactive, not the whole page.
const SubjectStrip = dynamic(() => import('@/components/home/subject-strip'));
const HowItWorks = dynamic(() => import('@/components/home/how-it-works'));
const Tracks3D = dynamic(() => import('@/components/sariro-3d/tracks-3d'));
const Stats3D = dynamic(() => import('@/components/sariro-3d/stats-3d'));
const Philosophy3D = dynamic(() => import('@/components/sariro-3d/philosophy-3d'));
const Events3D = dynamic(() => import('@/components/sariro-3d/events-3d'));
const Testimonials3D = dynamic(() => import('@/components/sariro-3d/testimonials-3d'));
const Pricing3D = dynamic(() => import('@/components/sariro-3d/pricing-3d'));
const CTA3D = dynamic(() => import('@/components/sariro-3d/cta-3d'));

export default function Home() {
  const heroRef = useRef<HTMLElement>(null);
  /**
   * The Oryzo scene is heavy WebGL that sits seven sections down the page, and
   * it used to mount at first paint and hold a GL context for the whole visit.
   *
   * Browsers cap the number of simultaneous WebGL contexts and silently DROP
   * THE OLDEST when that cap is hit — which is exactly what
   * "THREE.WebGLRenderer: Context Lost" is. With the intro, the background
   * particles and the companion orb already holding one each on every page,
   * plus the hero scene, an unconditional fifth was enough to start the churn.
   *
   * Mounting it only when it is near the viewport is the same treatment the
   * hero scene already had, and drops the steady-state count by one.
   */
  const oryzoRef = useRef<HTMLDivElement>(null);
  const oryzoNear = useInView(oryzoRef, { margin: '400px' });
  const scrollProgressRef = useRef(0);
  const inView = useInView(heroRef, { margin: '200px' });
  const heavyVisuals = useHeavyVisuals();

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    scrollProgressRef.current = v;
  });

  const heroY = useTransform(scrollYProgress, [0, 1], [0, -150]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <BrandLayout>
      {/* =================== HERO =================== */}
      <section ref={heroRef} className="relative min-h-screen w-full overflow-hidden flex items-center pt-28 pb-12">
        {/* Background layers */}
        <div className="absolute inset-0 mesh-bg" />
        <div className="absolute inset-0 grid-bg" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white" />

        <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* LEFT: Text content (always full width on mobile, never overlapped) */}
            <motion.div style={{ y: heroY, opacity: heroOpacity }} className="max-w-2xl">
              {/* Eyebrow */}
              <motion.div
                initial={{ y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel text-xs font-bold uppercase tracking-wider text-blue-700 mb-6"
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
                </span>
                New: every school subject, not just coding
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] text-slate-900"
                style={{ fontFamily: 'var(--font-jakarta)' }}
              >
                Big enough to teach{' '}
                <span className="gradient-text animate-gradient">anything.</span>
                <br />
                Small enough to know{' '}
                <span className="relative inline-block">
                  <span className="gradient-text-deep">your name</span>
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none" preserveAspectRatio="none">
                    <path d="M2 9 Q 50 1, 100 6 T 198 4" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" fill="none" />
                  </svg>
                </span>
                .
              </motion.h1>

              {/* Subhead */}
              <motion.p
                initial={{ y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="mt-6 text-lg text-slate-600 max-w-xl"
              >
                {BRAND.mission}
              </motion.p>

              {/* CTAs — 3-button layout */}
              <motion.div
                initial={{ y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="mt-8 flex flex-wrap items-center gap-3"
              >
                {/* Explore Courses — small white */}
                <Link href="/courses#learn" className="px-5 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Find your subject
                </Link>
                {/* Sign Up — small white */}
                <Link href="/auth/sign-up" className="px-5 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 text-sm font-bold hover:bg-slate-50 transition-colors flex items-center gap-2">
                  <ArrowRight className="w-4 h-4" />
                  Sign Up
                </Link>
                {/* Book a Free Class — prominent yellow */}
                <Link href="/welcome#book" className="px-6 py-3.5 rounded-xl text-slate-900 text-sm font-extrabold hover:scale-105 transition-transform shadow-md flex items-center gap-2" style={{ background: 'linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%)' }}>
                  <Rocket className="w-5 h-5" />
                  Book a Free Class
                </Link>
              </motion.div>

              {/* Hero stats */}
              <motion.div
                initial={{ y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4 }}
                className="mt-10 max-w-2xl"
              >
                {/* Sariro is the subject of the sentence, not Mimo — a school
                    should not read as one person's CV. But the numbers are still
                    HIS, earned before Sariro existed, so the line says "built on"
                    rather than claiming Sariro did them. "Sariro has taught 5,000
                    students" would be false and disprovable in one search; "built
                    on a decade of teaching" is true and does the same work. */}
                <p
                  className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 mb-3"
                  style={{ fontFamily: 'var(--font-grotesk)' }}
                >
                  Sariro is built on a decade of teaching — {BRAND.founder}&apos;s, before it existed
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {HERO_STATS.map((s) => (
                  <div key={s.label} className="glass-panel rounded-2xl px-4 py-4 text-center">
                    <div
                      className={`text-2xl sm:text-3xl font-extrabold ${
                        s.accent === 'blue' ? 'text-blue-600' :
                        s.accent === 'green' ? 'text-green-600' :
                        s.accent === 'violet' ? 'text-violet-600' :
                        'text-amber-600'
                      }`}
                      style={{ fontFamily: 'var(--font-jakarta)' }}
                    >
                      {s.value.toLocaleString()}{s.suffix}
                    </div>
                    <div className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-wide" style={{ fontFamily: 'var(--font-grotesk)' }}>
                      {s.label}
                    </div>
                  </div>
                ))}
                </div>
              </motion.div>
            </motion.div>

            {/* RIGHT: 3D Neural Network — on mobile: BELOW the text+stats (order-last); on desktop: right column */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.3 }}
              className="relative w-full aspect-square max-w-[500px] mx-auto order-last"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500/20 via-violet-500/20 to-green-500/20 blur-3xl" />
              <div className="relative w-full h-full">
                {heavyVisuals && inView && <NeuralNetworkScene scrollProgress={scrollProgressRef} />}
              </div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
                {/* Was "Live AI Neural Network" — a label that told a parent
                    looking for a maths tutor they were on a machine-learning
                    company's site. Same visual, honest framing: it is a picture
                    of how the subjects connect, which is what the map models. */}
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>
                  Every subject, connected
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Trusted by — bottom marquee */}
        <div className="absolute bottom-0 left-0 right-0 z-20 pb-4 pt-6 bg-gradient-to-t from-white via-white/80 to-transparent">
          <div className="max-w-7xl mx-auto px-4">
            <p className="text-center text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3" style={{ fontFamily: 'var(--font-grotesk)' }}>
              Sariro&apos;s teaching has reached learners from
            </p>
            <div className="relative overflow-hidden mask-fade">
              <div className="flex gap-10 animate-marquee whitespace-nowrap">
                {[...TRUSTED_BY, ...TRUSTED_BY, ...TRUSTED_BY].map((name, i) => (
                  <span key={i} className="text-lg sm:text-xl font-extrabold text-slate-400/80 tracking-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <style jsx>{`
          .mask-fade {
            mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
            -webkit-mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent);
          }
        `}</style>
      </section>

      {/* ── Order is the argument ─────────────────────────────────────────
          A visitor's questions arrive in a fixed sequence, and the page used to
          answer them backwards: philosophy, tracks, an AI-core WebGL scene and
          a coding catalogue all came before any mention of a subject. Someone
          could read the entire homepage and never learn we teach maths.

          Now: what do you teach -> how does it work -> who are you -> what do
          you believe -> what do others say -> what does it cost -> start.

          Courses3D was removed rather than reordered. It rendered the coding
          catalogue, which /courses now owns properly and sells beside every
          other subject; keeping a coding-only grid on the homepage of a
          multi-subject school re-told the exact story we just stopped telling.
          ────────────────────────────────────────────────────────────────── */}

      {/* 1 — what we teach. The question that was never answered. */}
      <SubjectStrip />

      {/* 2 — how it works, and that the first class is free. */}
      <HowItWorks />

      {/* 3 — who is teaching: the founder's record, attributed. */}
      <Stats3D />

      {/* 4 — who it is for, and what we believe. */}
      <Tracks3D />
      <Philosophy3D />

      {/* 5 — the map: a direction rather than a course, for the visitor who is
              not shopping by subject. Lower down because it is the most
              abstract thing here, and abstraction is a poor opening move. */}
      <MapTeaser />

      <WaveDivider3D fromColor="#FBF9F6" toColor="#14100C" />
      {/* ORYZO-STYLE CINEMATIC SCROLL: camera orbits 360°.
          Real WebGL — desktop only, so phones don't hit it on scroll. */}
      <div ref={oryzoRef}>{heavyVisuals && oryzoNear && <OryzoSection />}</div>
      <WaveDivider3D fromColor="#14100C" toColor="#FBF9F6" />

      {/* 6 — proof, price, and the ask. */}
      <Testimonials3D />
      <WaveDivider3D fromColor="#FFFFFF" toColor="#14100C" />
      <Events3D />
      <WaveDivider3D fromColor="#14100C" toColor="#FBF9F6" />
      <Pricing3D />
      <CTA3D />
    </BrandLayout>
  );
}
