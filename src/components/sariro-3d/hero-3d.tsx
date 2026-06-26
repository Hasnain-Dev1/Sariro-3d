'use client';

import dynamic from 'next/dynamic';
import { motion, useScroll, useTransform, useMotionValueEvent, useInView } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight, Play, Sparkles } from 'lucide-react';
import { BRAND, HERO_STATS, TRUSTED_BY } from '@/lib/sariro-data';
import { MagneticButton } from './scroll-effects';

const HeroScene3D = dynamic(() => import('./hero-scene'), { ssr: false });

export default function Hero3D() {
  const sectionRef = useRef<HTMLElement>(null);
  const scrollProgressRef = useRef(0);
  // Only render the WebGL canvas while the hero is in view (saves GPU when off-screen)
  const inView = useInView(sectionRef, { margin: '200px' });

  // Track hero scroll progress (0 when hero is at top, 1 when hero has scrolled past)
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });

  // Sync scroll progress into a ref (for the 3D scene to read in useFrame — no React re-renders)
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    scrollProgressRef.current = v;
  });

  // Parallax transforms on hero text
  const heroY = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.85]);
  const heroBlur = useTransform(scrollYProgress, [0, 0.5], [0, 6]);
  const heroFilter = useTransform(heroBlur, (b) => `blur(${b}px)`);
  const badgeY = useTransform(scrollYProgress, [0, 1], [0, -120]);

  return (
    <section ref={sectionRef} data-chapter="hero" data-chapter-label="Home" className="relative min-h-screen w-full overflow-hidden">
      {/* Background layers — also parallax */}
      <motion.div
        className="absolute inset-0 mesh-bg"
        style={{ y: useTransform(scrollYProgress, [0, 1], [0, 80]) }}
      />
      <motion.div
        className="absolute inset-0 grid-bg"
        style={{ y: useTransform(scrollYProgress, [0, 1], [0, 60]), opacity: useTransform(scrollYProgress, [0, 0.8], [1, 0.3]) }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white" />

      {/* 3D Scene — full background, only rendered when in view (perf) */}
      <div className="absolute inset-0 z-10">
        {inView && <HeroScene3D scrollProgress={scrollProgressRef} />}
      </div>

      {/* Foreground content */}
      <motion.div
        style={{ y: heroY, opacity: heroOpacity, scale: heroScale, filter: heroFilter }}
        className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 sm:pt-36"
      >
        <div className="max-w-3xl">
          {/* Eyebrow */}
          <motion.div
            style={{ y: badgeY, fontFamily: 'var(--font-grotesk)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel text-xs font-bold uppercase tracking-wider text-blue-700 mb-6"
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
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] text-slate-900"
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
            className="mt-7 text-lg sm:text-xl text-slate-600 max-w-2xl"
          >
            {BRAND.mission}
          </motion.p>

          {/* CTAs — magnetic */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <MagneticButton
              strength={0.25}
              onClick={() => document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' })}
              className="btn-tactile btn-tactile-primary px-7 py-4 text-base"
            >
              <Sparkles className="w-5 h-5" />
              Explore Courses
              <ArrowRight className="w-5 h-5" />
            </MagneticButton>
            <MagneticButton
              strength={0.2}
              onClick={() => document.getElementById('journey')?.scrollIntoView({ behavior: 'smooth' })}
              className="btn-tactile btn-tactile-light px-7 py-4 text-base"
            >
              <Play className="w-4 h-4 fill-current" />
              See how it works
            </MagneticButton>
          </motion.div>

          {/* Hero stats */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl"
          >
            {HERO_STATS.map((s, i) => (
              <motion.div
                key={s.label}
                whileHover={{ y: -6, scale: 1.03 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="glass-panel rounded-2xl px-4 py-4 text-center"
              >
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
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        style={{ opacity: useTransform(scrollYProgress, [0, 0.15], [1, 0]) }}
        className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-slate-500"
      >
        <span className="text-[10px] font-bold uppercase tracking-[0.3em]" style={{ fontFamily: 'var(--font-grotesk)' }}>
          Scroll to explore
        </span>
        <div className="w-6 h-10 rounded-full border-2 border-slate-400 flex justify-center p-1.5">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-1 h-2 rounded-full bg-blue-600"
          />
        </div>
      </motion.div>

      {/* Trusted by — bottom marquee */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pb-4 pt-6 bg-gradient-to-t from-white via-white/80 to-transparent">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3" style={{ fontFamily: 'var(--font-grotesk)' }}>
            Trusted by educators & learners at
          </p>
          <div className="relative overflow-hidden mask-fade">
            <div className="flex gap-10 animate-marquee whitespace-nowrap">
              {[...TRUSTED_BY, ...TRUSTED_BY, ...TRUSTED_BY].map((name, i) => (
                <span
                  key={i}
                  className="text-lg sm:text-xl font-extrabold text-slate-400/80 tracking-tight"
                  style={{ fontFamily: 'var(--font-jakarta)' }}
                >
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
  );
}
