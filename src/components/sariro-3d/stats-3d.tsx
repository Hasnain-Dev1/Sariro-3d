'use client';

import { motion, useInView, useMotionValue, useTransform, animate, useScroll } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Users, Globe, FileText, Award } from 'lucide-react';
import { HERO_STATS } from '@/lib/sariro-data';
import { SplitText3D } from './scroll-effects';
import { NumberFlip3D } from './kit-3d';

const ICON_MAP = [Users, Globe, FileText, Award];
const ACCENT_STYLES = [
  { text: 'text-blue-600', bg: 'from-blue-500 to-blue-700', shadow: 'shadow-blue-500/40', glow: 'rgba(37, 99, 235, 0.45)', hex: '#2563EB' },
  { text: 'text-green-600', bg: 'from-green-500 to-green-700', shadow: 'shadow-green-500/40', glow: 'rgba(22, 163, 74, 0.45)', hex: '#16A34A' },
  { text: 'text-violet-600', bg: 'from-violet-500 to-violet-700', shadow: 'shadow-violet-500/40', glow: 'rgba(124, 58, 237, 0.45)', hex: '#7C3AED' },
  { text: 'text-amber-600', bg: 'from-amber-500 to-amber-700', shadow: 'shadow-amber-500/40', glow: 'rgba(245, 158, 11, 0.45)', hex: '#F59E0B' },
];

function Counter({ value, suffix, index }: { value: number; suffix: string; index: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.floor(v));
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const unsub = rounded.on('change', (v) => setDisplayValue(v));
    return () => unsub();
  }, [rounded]);

  useEffect(() => {
    if (inView) {
      const controls = animate(count, value, {
        duration: 2,
        ease: [0.22, 1, 0.36, 1],
      });
      return controls.stop;
    }
  }, [inView, value, count]);

  const a = ACCENT_STYLES[index % ACCENT_STYLES.length];
  const Icon = ICON_MAP[index % ICON_MAP.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 60, rotateX: -20 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.7, delay: index * 0.12 }}
      whileHover={{ y: -8, rotateX: 5 }}
      className="relative perspective-1000"
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Floating 3D shape behind the card */}
      <motion.div
        animate={{
          rotateY: [0, 360],
          y: [0, -10, 0],
        }}
        transition={{
          rotateY: { duration: 12 + index * 2, repeat: Infinity, ease: 'linear' },
          y: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
        }}
        className="absolute -top-6 -right-6 w-20 h-20 opacity-20 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${a.hex}, transparent)`,
          transform: 'rotateY(45deg)',
          borderRadius: index % 2 === 0 ? '30%' : '50%',
        }}
      />

      <div
        className="card-3d p-8 text-center h-full relative overflow-hidden"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Glow */}
        <div
          className="absolute -top-8 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full blur-2xl opacity-40 pointer-events-none"
          style={{ background: a.glow }}
        />

        {/* Icon — floating with translateZ */}
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: index * 0.3 }}
          className={`inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br ${a.bg} items-center justify-center shadow-xl ${a.shadow} mb-5`}
          style={{ transform: 'translateZ(40px)' }}
        >
          <Icon className="w-7 h-7 text-white" strokeWidth={2.4} />
        </motion.div>

        {/* 3D Number Flip counter */}
        <div
          className={`text-5xl sm:text-6xl font-extrabold ${a.text} flex items-center justify-center`}
          style={{ fontFamily: 'var(--font-jakarta)', transform: 'translateZ(25px)' }}
        >
          <span ref={ref}>
            <NumberFlip3D value={displayValue} accentColor={a.hex} />
          </span>
          <span>{suffix}</span>
        </div>

        {/* Label */}
        <div
          className="mt-2 text-sm font-bold uppercase tracking-wider text-slate-500"
          style={{ fontFamily: 'var(--font-grotesk)', transform: 'translateZ(15px)' }}
        >
          {HERO_STATS[index].label}
        </div>
      </div>
    </motion.div>
  );
}

export default function Stats3D() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const headerY = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const orb1Y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const orb2Y = useTransform(scrollYProgress, [0, 1], [-80, 80]);

  return (
    <section id="stats" ref={sectionRef} data-chapter="stats" data-chapter-label="Impact" className="relative py-24 sm:py-32 overflow-hidden bg-gradient-to-b from-white via-slate-50 to-white">
      <div className="absolute inset-0 grid-bg opacity-60" />
      <motion.div
        style={{ y: orb1Y }}
        className="absolute top-20 left-10 w-80 h-80 rounded-full bg-blue-400/10 blur-3xl pointer-events-none"
      />
      <motion.div
        style={{ y: orb2Y }}
        className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-violet-400/10 blur-3xl pointer-events-none"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          style={{ y: headerY }}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-4 block" style={{ fontFamily: 'var(--font-grotesk)' }}>
            — By the numbers —
          </span>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
            <SplitText3D text="A decade of teaching." highlight="decade" highlightClassName="gradient-text" />
            <br />
            <SplitText3D text="A generation of builders." highlight="builders." highlightClassName="gradient-text" delay={0.3} />
          </h2>
          <p className="mt-5 text-lg text-slate-600">
            Numbers don't tell the whole story — but they tell a lot of it. Here's what 12+ years of teaching AI education looks like.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {HERO_STATS.map((s, i) => (
            <Counter key={s.label} value={s.value} suffix={s.suffix} index={i} />
          ))}
        </div>

        {/* Secondary highlight strip */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-12 glass-panel rounded-3xl p-8 sm:p-10 text-center"
        >
          <p className="text-xl sm:text-2xl font-bold text-slate-800 max-w-3xl mx-auto" style={{ fontFamily: 'var(--font-jakarta)' }}>
            "Every number on this page started with one student who decided to take a class. We're still counting."
          </p>
          <p className="mt-4 text-sm font-semibold text-slate-500 uppercase tracking-wider" style={{ fontFamily: 'var(--font-grotesk)' }}>
            — Mimo Patra, Founder
          </p>
        </motion.div>
      </div>
    </section>
  );
}
