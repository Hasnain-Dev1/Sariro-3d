'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { GraduationCap, School, Briefcase, ArrowRight, Check } from 'lucide-react';
import { TRACKS } from '@/lib/sariro-data';
import { SplitText3D, TiltCard3D } from './scroll-effects';

const ICON_MAP: Record<string, typeof GraduationCap> = {
  GraduationCap,
  School,
  Briefcase,
};

const ACCENT_MAP: Record<string, { bg: string; text: string; ring: string; shadow: string; deep: string }> = {
  blue:   { bg: 'from-blue-500 to-blue-700',   text: 'text-blue-600',   ring: 'ring-blue-200',   shadow: 'shadow-blue-500/30',   deep: 'bg-blue-600' },
  green:  { bg: 'from-green-500 to-green-700', text: 'text-green-600',  ring: 'ring-green-200',  shadow: 'shadow-green-500/30',  deep: 'bg-green-600' },
  violet: { bg: 'from-violet-500 to-violet-700', text: 'text-violet-600', ring: 'ring-violet-200', shadow: 'shadow-violet-500/30', deep: 'bg-violet-600' },
};

function TrackCard({ track, index, scrollYProgress }: { track: typeof TRACKS[number]; index: number; scrollYProgress: any }) {
  const Icon = ICON_MAP[track.icon] ?? GraduationCap;
  const a = ACCENT_MAP[track.accent] ?? ACCENT_MAP.blue;

  // Each card gets a slightly different parallax depth based on its index
  const y = useTransform(scrollYProgress, [0, 1], [80 - index * 20, -80 + index * 20]);
  const rotateZ = useTransform(scrollYProgress, [0, 1], [index === 1 ? 0 : index === 0 ? -2 : 2, index === 1 ? 0 : index === 0 ? 2 : -2]);

  return (
    <motion.div
      style={{ y, rotateZ }}
      initial={{ opacity: 0, y: 60, rotateX: 20 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -8 }}
      whileTap={{ scale: 0.98 }}
      className="perspective-1000"
    >
      <TiltCard3D className="card-3d p-7 h-full" maxTilt={10}>
        {/* Floating icon */}
        <div className="mb-5" style={{ transform: 'translateZ(40px)' }}>
          <div className={`inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br ${a.bg} items-center justify-center shadow-lg ${a.shadow}`}>
            <Icon className="w-7 h-7 text-white" strokeWidth={2.4} />
          </div>
        </div>

        {/* Heading */}
        <div className="mb-3" style={{ transform: 'translateZ(30px)' }}>
          <span className={`text-xs font-bold uppercase tracking-wider ${a.text}`} style={{ fontFamily: 'var(--font-grotesk)' }}>
            Track 0{index + 1}
          </span>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-1" style={{ fontFamily: 'var(--font-jakarta)' }}>
            {track.title}
          </h3>
          <p className={`text-sm font-semibold ${a.text} mt-1`}>{track.tagline}</p>
        </div>

        <p className="text-slate-600 mb-5 text-[15px]" style={{ transform: 'translateZ(20px)' }}>
          {track.description}
        </p>

        {/* Points */}
        <ul className="space-y-2.5 mb-6" style={{ transform: 'translateZ(25px)' }}>
          {track.points.map((p) => (
            <li key={p} className="flex items-start gap-2.5">
              <span className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-md ${a.deep} flex items-center justify-center`}>
                <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
              </span>
              <span className="text-sm font-medium text-slate-700">{p}</span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          className={`group/btn inline-flex items-center gap-2 text-sm font-bold ${a.text} hover:gap-3 transition-all cursor-pointer`}
          style={{ fontFamily: 'var(--font-grotesk)', transform: 'translateZ(35px)' }}
        >
          {track.cta}
          <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
        </button>
      </TiltCard3D>
    </motion.div>
  );
}

export default function Tracks3D() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const headerY = useTransform(scrollYProgress, [0, 1], [60, -60]);
  // Removed headerRotate — was causing the "Three paths" text to tilt.

  return (
    <section id="tracks" ref={sectionRef} data-chapter="tracks" data-chapter-label="Tracks" className="relative py-24 sm:py-32 overflow-hidden">
      <div className="absolute inset-0 mesh-bg opacity-50" />
      {/* Floating background shapes that parallax */}
      <motion.div
        style={{ y: useTransform(scrollYProgress, [0, 1], [120, -120]) }}
        className="absolute top-20 left-10 w-72 h-72 rounded-full bg-blue-400/10 blur-3xl"
      />
      <motion.div
        style={{ y: useTransform(scrollYProgress, [0, 1], [-80, 80]) }}
        className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-violet-400/10 blur-3xl"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          style={{ y: headerY }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-4"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            — Three paths, one philosophy —
          </motion.span>
          <h2
            className="text-4xl sm:text-5xl font-extrabold text-slate-900 leading-tight"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            <SplitText3D
              text="Whoever you are,"
              highlight="you,"
              highlightClassName="gradient-text"
            />
            <br />
            <SplitText3D
              text="we have a track for you."
              highlight="track"
              highlightClassName="gradient-text"
              delay={0.3}
            />
          </h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="mt-5 text-lg text-slate-600"
          >
            Sariro meets you where you are — a curious 14-year-old, a teacher with 200 students, or a PM shipping AI features next quarter. Different contexts, same teaching DNA.
          </motion.p>
        </motion.div>

        {/* Track cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {TRACKS.map((t, i) => (
            <TrackCard key={t.id} track={t} index={i} scrollYProgress={scrollYProgress} />
          ))}
        </div>
      </div>
    </section>
  );
}
