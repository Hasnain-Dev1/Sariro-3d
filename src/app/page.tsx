'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { motion, useScroll, useTransform, useMotionValueEvent, useInView } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { BRAND, HERO_STATS, TRUSTED_BY } from '@/lib/sariro-data';
import BrandLayout from '@/components/brand/brand-layout';
import OryzoSection from '@/components/brand/oryzo-section';
import Tracks3D from '@/components/sariro-3d/tracks-3d';
import Stats3D from '@/components/sariro-3d/stats-3d';
import Courses3D from '@/components/sariro-3d/courses-3d';
import Philosophy3D from '@/components/sariro-3d/philosophy-3d';
import Events3D from '@/components/sariro-3d/events-3d';
import Testimonials3D from '@/components/sariro-3d/testimonials-3d';
import Pricing3D from '@/components/sariro-3d/pricing-3d';
import CTA3D from '@/components/sariro-3d/cta-3d';
import { WaveDivider3D } from '@/components/sariro-3d/kit-3d';

const NeuralNetworkScene = dynamic(() => import('@/components/brand/neural-scene'), { ssr: false });

export default function Home() {
  const heroRef = useRef<HTMLElement>(null);
  const scrollProgressRef = useRef(0);
  const inView = useInView(heroRef, { margin: '200px' });

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
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel text-xs font-bold uppercase tracking-wider text-blue-700 mb-6"
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600" />
                </span>
                New: Summer 2026 cohort — 12 seats left
              </motion.div>

              {/* Headline */}
              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] text-slate-900"
                style={{ fontFamily: 'var(--font-jakarta)' }}
              >
                Teaching the{' '}
                <span className="gradient-text animate-gradient">future.</span>
                <br />
                We teach{' '}
                <span className="relative inline-block">
                  <span className="gradient-text-deep">thinking</span>
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none" preserveAspectRatio="none">
                    <path d="M2 9 Q 50 1, 100 6 T 198 4" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" fill="none" />
                  </svg>
                </span>
                ,<br /> not just coding.
              </motion.h1>

              {/* Subhead */}
              <motion.p
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="mt-6 text-lg text-slate-600 max-w-xl"
              >
                {BRAND.mission}
              </motion.p>

              {/* CTAs */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="mt-8 flex flex-wrap items-center gap-3"
              >
                <Link href="/courses" className="btn-tactile btn-tactile-primary px-7 py-4 text-base">
                  <Sparkles className="w-5 h-5" />
                  Explore Courses
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link href="/auth/sign-up" className="btn-tactile btn-tactile-light px-7 py-4 text-base">
                  <Sparkles className="w-4 h-4" />
                  Sign up!
                </Link>
              </motion.div>

              {/* Hero stats */}
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4 }}
                className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl"
              >
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
                {inView && <NeuralNetworkScene scrollProgress={scrollProgressRef} />}
              </div>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>
                  Live AI Neural Network
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Trusted by — bottom marquee */}
        <div className="absolute bottom-0 left-0 right-0 z-20 pb-4 pt-6 bg-gradient-to-t from-white via-white/80 to-transparent">
          <div className="max-w-7xl mx-auto px-4">
            <p className="text-center text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3" style={{ fontFamily: 'var(--font-grotesk)' }}>
              Trusted by educators & learners at
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

      {/* =================== ALL THE 3D FLOW SECTIONS (brought back!) =================== */}
      <Tracks3D />
      <WaveDivider3D fromColor="#FFFFFF" toColor="#0B1120" />
      {/* ORYZO-STYLE CINEMATIC SCROLL: camera orbits 360° around AI Core */}
      <OryzoSection />
      <WaveDivider3D fromColor="#0B1120" toColor="#F8FAFC" />
      <Stats3D />
      <Courses3D />
      <Philosophy3D />
      <WaveDivider3D fromColor="#FFFFFF" toColor="#0B1120" />
      <Events3D />
      <WaveDivider3D fromColor="#0B1120" toColor="#F8FAFC" />
      <Testimonials3D />
      <Pricing3D />
      <CTA3D />
    </BrandLayout>
  );
}
