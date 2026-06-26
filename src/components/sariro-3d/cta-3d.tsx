'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { ArrowRight, Sparkles, Mail } from 'lucide-react';
import { BRAND } from '@/lib/sariro-data';
import { SplitText3D, MagneticButton } from './scroll-effects';

export default function CTA3D() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const contentY = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const orb1Y = useTransform(scrollYProgress, [0, 1], [120, -120]);
  const orb2Y = useTransform(scrollYProgress, [0, 1], [-100, 100]);
  const orb3Y = useTransform(scrollYProgress, [0, 1], [80, -80]);

  return (
    <section ref={sectionRef} data-chapter="start" data-chapter-label="Start" className="relative py-24 sm:py-32 overflow-hidden">
      {/* Deep gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-violet-700 to-blue-900" />
      <div className="absolute inset-0 opacity-30" style={{
        backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.25) 0%, transparent 40%), radial-gradient(circle at 70% 80%, rgba(22, 163, 74, 0.4) 0%, transparent 40%)'
      }} />
      <div className="absolute inset-0" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
        maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 75%)'
      }} />

      {/* Parallax floating orbs */}
      <motion.div
        style={{ y: orb1Y }}
        animate={{ rotate: [0, 5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-10 left-10 w-32 h-32 rounded-full bg-white/10 backdrop-blur-md border border-white/20 hidden lg:block"
      />
      <motion.div
        style={{ y: orb2Y }}
        animate={{ rotate: [0, -5, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-10 right-10 w-40 h-40 rounded-full bg-green-400/20 backdrop-blur-md border border-white/20 hidden lg:block"
      />
      <motion.div
        style={{ y: orb3Y }}
        animate={{ rotate: [0, 8, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/2 left-1/3 w-24 h-24 rounded-full bg-violet-400/20 backdrop-blur-md border border-white/20 hidden lg:block"
      />

      <motion.div
        style={{ y: contentY }}
        className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-xs font-bold uppercase tracking-wider mb-6"
          style={{ fontFamily: 'var(--font-grotesk)' }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Ready when you are
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1]"
          style={{ fontFamily: 'var(--font-jakarta)' }}
        >
          <SplitText3D text="Stop watching AI happen." highlight="watching" highlightClassName="bg-gradient-to-r from-yellow-200 via-green-200 to-cyan-200 bg-clip-text text-transparent" />
          <br />
          <SplitText3D text="Start building it." highlight="building" highlightClassName="bg-gradient-to-r from-yellow-200 via-green-200 to-cyan-200 bg-clip-text text-transparent" delay={0.3} />
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-6 text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto"
        >
          Join 5,000+ students from 65 countries who chose to learn AI the way it should be taught — by building real things with people who care.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-9 flex flex-col sm:flex-row gap-3 justify-center items-center"
        >
          <MagneticButton
            strength={0.2}
            onClick={() => document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth' })}
            className="btn-tactile btn-tactile-light px-8 py-4 text-base"
          >
            <Sparkles className="w-5 h-5" />
            Explore courses
            <ArrowRight className="w-5 h-5" />
          </MagneticButton>

          <MagneticButton
            strength={0.2}
            as="a"
            href={`mailto:${BRAND.email}`}
            className="btn-tactile px-8 py-4 text-base text-white border-2 border-white/30 hover:bg-white/10"
          >
            <Mail className="w-5 h-5" />
            Talk to Mimo
          </MagneticButton>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-6 text-sm text-blue-200/80"
        >
          No spam. No sales calls. Just a real human reply within 24 hours.
        </motion.p>
      </motion.div>
    </section>
  );
}
