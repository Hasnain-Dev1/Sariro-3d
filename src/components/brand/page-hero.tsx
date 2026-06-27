'use client';

import dynamic from 'next/dynamic';
import { motion, useInView } from 'framer-motion';
import { ReactNode, useRef } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

const GSAPHero3D = dynamic(() => import('./gsap-hero-3d'), { ssr: false });

/* ===============================================================
   PAGE HERO — Now with GSAP-powered 3D camera scroll
   Camera orbits the 3D object as you scroll past the hero
=============================================================== */

export type PageHeroProps = {
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
  accentColor?: string;
  breadcrumb: string;
  variant?: 'courses' | 'schools' | 'events' | 'pricing' | 'about' | 'resources' | 'contact' | 'story';
  children?: ReactNode;
};

export default function PageHero({
  eyebrow,
  title,
  subtitle,
  accentColor = '#2563EB',
  breadcrumb,
  variant = 'courses',
  children,
}: PageHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, { margin: '100px' });

  return (
    <section ref={sectionRef} className="relative pt-36 sm:pt-44 pb-16 sm:pb-20 overflow-hidden min-h-[90vh] flex items-center">
      {/* Background layers */}
      <div className="absolute inset-0 mesh-bg opacity-70" />
      <div className="absolute inset-0 grid-bg opacity-40" />
      {/* Accent glow */}
      <div
        className="absolute top-20 right-1/4 w-[500px] h-[500px] rounded-full blur-[120px] opacity-30 pointer-events-none"
        style={{ background: accentColor }}
      />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* LEFT: Text */}
          <div>
            {/* Breadcrumb */}
            <motion.nav
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 mb-6"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
              <ChevronRight className="w-3 h-3" />
              <span style={{ color: accentColor }}>{breadcrumb}</span>
            </motion.nav>

            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-panel text-xs font-bold uppercase tracking-wider mb-6"
              style={{ color: accentColor, fontFamily: 'var(--font-grotesk)' }}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: accentColor }} />
                <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: accentColor }} />
              </span>
              {eyebrow}
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.1]"
              style={{ fontFamily: 'var(--font-jakarta)' }}
            >
              {title}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="mt-6 text-base sm:text-lg text-slate-600 max-w-xl"
            >
              {subtitle}
            </motion.p>

            {/* CTAs */}
            {children && (
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.7 }}
                className="mt-8 flex flex-wrap items-center gap-3"
              >
                {children}
              </motion.div>
            )}
          </div>

          {/* RIGHT: GSAP-powered 3D Scene with scroll camera orbit */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="relative w-full aspect-square max-w-[280px] sm:max-w-[400px] lg:max-w-[500px] mx-auto"
          >
            {/* Glow behind canvas */}
            <div
              className="absolute inset-0 rounded-full blur-3xl opacity-30"
              style={{ background: `radial-gradient(circle, ${accentColor}, transparent 70%)` }}
            />
            {/* 3D Canvas with GSAP camera */}
            <div className="relative w-full h-full">
              {inView && <GSAPHero3D variant={variant} accentColor={accentColor} triggerRef={sectionRef} />}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
