'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { Calendar, MapPin, ArrowRight, Sparkles } from 'lucide-react';
import { EVENTS } from '@/lib/sariro-data';
import { SplitText3D, MagneticButton } from './scroll-effects';

const ACCENT_MAP: Record<string, { text: string; bg: string; soft: string; border: string; glow: string }> = {
  blue:   { text: 'text-blue-400',   bg: 'bg-blue-600',   soft: 'bg-blue-500/15',   border: 'border-blue-400/30',   glow: 'rgba(37, 99, 235, 0.5)' },
  green:  { text: 'text-green-400',  bg: 'bg-green-600',  soft: 'bg-green-500/15',  border: 'border-green-400/30',  glow: 'rgba(22, 163, 74, 0.5)' },
  violet: { text: 'text-violet-400', bg: 'bg-violet-600', soft: 'bg-violet-500/15', border: 'border-violet-400/30', glow: 'rgba(124, 58, 237, 0.5)' },
};

/* Single stacking card — extracted so hooks stay at top level */
function EventStackCard({
  event,
  index,
  count,
  scrollYProgress,
}: {
  event: typeof EVENTS[number];
  index: number;
  count: number;
  scrollYProgress: any;
}) {
  const a = ACCENT_MAP[event.accent] ?? ACCENT_MAP.blue;
  const isLast = index === count - 1;
  const start = index / count;
  const end = (index + 1) / count;

  // SWAP animation:
  // - Enter: card slides UP from below (100vh → 0) and fades in, slightly scaled up
  // - Active: card sits at center, full opacity, scale 1
  // - Exit (skip for last card): card slides UP and out the top (0 → -70vh), fades out, shrinks
  // The next card enters FROM BELOW at the same time, creating a clean swap.
  const y = useTransform(
    scrollYProgress,
    [Math.max(0, start - 0.06), start, end, Math.min(1, end + 0.06)],
    ['100vh', '0vh', '0vh', isLast ? '0vh' : '-70vh']
  );
  const opacity = useTransform(
    scrollYProgress,
    [Math.max(0, start - 0.06), start, end, Math.min(1, end + 0.06)],
    [0, 1, 1, isLast ? 1 : 0]
  );
  const scale = useTransform(
    scrollYProgress,
    [Math.max(0, start - 0.06), start, end, Math.min(1, end + 0.06)],
    [0.92, 1, 1, isLast ? 1 : 0.88]
  );
  const rotateZ = useTransform(
    scrollYProgress,
    [Math.max(0, start - 0.06), start, end, Math.min(1, end + 0.06)],
    [index % 2 === 0 ? -2.5 : 2.5, 0, 0, isLast ? 0 : index % 2 === 0 ? 2.5 : -2.5]
  );

  return (
    <motion.div
      style={{ y, scale, opacity, rotateZ, zIndex: index + 1, position: 'absolute', width: '100%', maxWidth: '48rem' }}
      className="px-4"
    >
      <div
        className="relative glass-dark rounded-3xl p-8 sm:p-12 border border-white/10 overflow-hidden"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Glow accent */}
        <div
          className="absolute -top-20 -right-20 w-72 h-72 rounded-full blur-3xl opacity-40 pointer-events-none"
          style={{ background: a.glow }}
        />

        <div className="relative grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Left: meta */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${a.soft} ${a.text} border ${a.border}`} style={{ fontFamily: 'var(--font-grotesk)' }}>
                {event.type}
              </span>
              <span className="text-xs font-bold text-slate-300">{event.price}</span>
            </div>

            <h3 className="text-3xl sm:text-4xl font-extrabold text-white mb-3 leading-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>
              {event.title}
            </h3>
            <p className="text-base text-slate-300 mb-6 leading-relaxed">{event.description}</p>

            <div className="space-y-2.5 mb-7">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Calendar className="w-4 h-4 text-blue-400" />
                {event.date}
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <MapPin className="w-4 h-4 text-green-400" />
                {event.location} · {event.format}
              </div>
            </div>

            <MagneticButton
              strength={0.2}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white"
            >
              <span className={`flex-shrink-0 w-2 h-2 rounded-full ${a.bg}`} />
              Reserve spot
              <ArrowRight className="w-4 h-4" />
            </MagneticButton>
          </div>

          {/* Right: big number + ghost icon */}
          <div className="relative h-48 md:h-64 flex items-center justify-center">
            <div
              className="absolute text-[14rem] sm:text-[18rem] font-extrabold leading-none opacity-10 select-none"
              style={{ fontFamily: 'var(--font-jakarta)', color: a.glow }}
            >
              {String(index + 1).padStart(2, '0')}
            </div>
            <div
              className={`relative w-24 h-24 rounded-3xl ${a.bg} flex items-center justify-center shadow-2xl`}
              style={{ boxShadow: `0 25px 60px -20px ${a.glow}` }}
            >
              <Sparkles className="w-12 h-12 text-white" strokeWidth={2} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Events3D() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // Header parallax
  const { scrollYProgress: headerProgress } = useScroll({
    target: headerRef,
    offset: ['start end', 'end start'],
  });
  const headerY = useTransform(headerProgress, [0, 1], [40, -40]);

  // Pinned stack progress
  const { scrollYProgress: stackProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end end'],
  });

  const count = EVENTS.length;

  return (
    <section id="events" data-chapter="events" data-chapter-label="Events" className="relative bg-slate-950/95 text-white">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-slate-900 to-violet-950" />
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(37, 99, 235, 0.4) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(124, 58, 237, 0.4) 0%, transparent 50%)'
        }} />
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)'
        }} />
      </div>

      {/* Header */}
      <div ref={headerRef} className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 pb-12">
        <motion.div style={{ y: headerY }} className="max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400 mb-4 block" style={{ fontFamily: 'var(--font-grotesk)' }}>
            — Upcoming events —
          </span>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>
            <SplitText3D text="Show up. Build something." highlight="Build" highlightClassName="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent" />
            <br />
            <SplitText3D text="Meet your people." highlight="people." highlightClassName="bg-gradient-to-r from-violet-400 to-green-400 bg-clip-text text-transparent" delay={0.3} />
          </h2>
          <p className="mt-5 text-lg text-slate-300">
            Cohorts, hackathons, and live workshops. Scroll to step through each one — every event is designed to leave you with something real.
          </p>
        </motion.div>
      </div>

      {/* Pinned stacking section */}
      <div
        ref={sectionRef}
        className="relative"
        style={{ height: `${count * 60}vh` }}
      >
        <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
          {EVENTS.map((event, i) => (
            <EventStackCard
              key={event.id}
              event={event}
              index={i}
              count={count}
              scrollYProgress={stackProgress}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
