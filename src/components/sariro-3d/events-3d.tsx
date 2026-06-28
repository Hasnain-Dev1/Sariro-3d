'use client';

import { motion, useScroll, useTransform, useSpring, MotionValue } from 'framer-motion';
import { useRef, useState } from 'react';
import { Calendar, MapPin, ArrowRight, Sparkles, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { EVENTS } from '@/lib/sariro-data';
import { SplitText3D, MagneticButton } from './scroll-effects';

const ACCENT_MAP: Record<string, { text: string; bg: string; soft: string; border: string; glow: string; gradient: string }> = {
  blue:   { text: 'text-blue-400',   bg: 'bg-blue-600',   soft: 'bg-blue-500/15',   border: 'border-blue-400/30',   glow: 'rgba(37, 99, 235, 0.5)',   gradient: 'from-blue-600 to-blue-800' },
  green:  { text: 'text-green-400',  bg: 'bg-green-600',  soft: 'bg-green-500/15',  border: 'border-green-400/30',  glow: 'rgba(22, 163, 74, 0.5)',  gradient: 'from-green-600 to-green-800' },
  violet: { text: 'text-violet-400', bg: 'bg-violet-600', soft: 'bg-violet-500/15', border: 'border-violet-400/30', glow: 'rgba(124, 58, 237, 0.5)', gradient: 'from-violet-600 to-violet-800' },
};

/* ---------- Event Card (used in both desktop + mobile) ---------- */
function EventCard({ event, index }: { event: typeof EVENTS[number]; index: number }) {
  const a = ACCENT_MAP[event.accent] ?? ACCENT_MAP.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotateX: -8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileTap={{ scale: 0.97 }}
      className="w-full"
    >
      <div className="relative glass-dark rounded-3xl p-6 sm:p-8 border border-white/10 overflow-hidden group">
        {/* Glow */}
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
          transition={{ duration: 3, repeat: Infinity, delay: index * 0.5 }}
          className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl pointer-events-none"
          style={{ background: a.glow }}
        />
        {/* Number */}
        <div className="absolute top-4 right-4 text-5xl font-extrabold opacity-10 select-none" style={{ fontFamily: 'var(--font-jakarta)', color: a.glow }}>
          {String(index + 1).padStart(2, '0')}
        </div>

        <div className="relative">
          {/* Type + Price */}
          <div className="flex items-center justify-between mb-5">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${a.soft} ${a.text} border ${a.border}`} style={{ fontFamily: 'var(--font-grotesk)' }}>
              {event.type}
            </span>
            <span className="text-sm font-bold text-slate-300">{event.price}</span>
          </div>

          {/* Title */}
          <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-2 leading-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>
            {event.title}
          </h3>
          <p className="text-sm text-slate-300 mb-5 leading-relaxed">{event.description}</p>

          {/* Meta */}
          <div className="space-y-2 mb-5 pt-4 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
              {event.date}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <MapPin className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
              {event.location} · {event.format}
            </div>
          </div>

          {/* CTA */}
          <button className={`inline-flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r ${a.gradient} shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer`}>
            Reserve spot
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default function Events3D() {
  const [activeIndex, setActiveIndex] = useState(0);
  const headerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress: headerProgress } = useScroll({ target: headerRef, offset: ['start end', 'end start'] });
  const headerY = useTransform(headerProgress, [0, 1], [40, -40]);

  const count = EVENTS.length;

  const next = () => setActiveIndex((v) => (v + 1) % count);
  const prev = () => setActiveIndex((v) => (v - 1 + count) % count);
  const goTo = (i: number) => setActiveIndex(i);

  // Touch / swipe
  const touchStartX = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) { if (dx > 0) prev(); else next(); }
  };

  return (
    <section id="events" data-chapter="events" data-chapter-label="Events" className="relative bg-slate-950/95 text-white overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-slate-900 to-violet-950" />
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(37, 99, 235, 0.4) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(124, 58, 237, 0.4) 0%, transparent 50%)' }} />
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '48px 48px', maskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)', WebkitMaskImage: 'radial-gradient(ellipse at center, black 30%, transparent 80%)' }} />
      </div>

      {/* Header */}
      <div ref={headerRef} className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pt-24 sm:pt-32 pb-8">
        <motion.div style={{ y: headerY }} className="max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400 mb-4 block" style={{ fontFamily: 'var(--font-grotesk)' }}>
            — Upcoming events —
          </span>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>
            <SplitText3D text="Show up. Build something." highlight="Build" highlightClassName="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent" />
            <br />
            <SplitText3D text="Meet your people." highlight="people." highlightClassName="bg-gradient-to-r from-violet-400 to-green-400 bg-clip-text text-transparent" delay={0.3} />
          </h2>
          <p className="mt-5 text-base sm:text-lg text-slate-300">
            Cohorts, hackathons, and live workshops. Use the arrows or swipe to browse — every event is designed to leave you with something real.
          </p>
        </motion.div>
      </div>

      {/* Event carousel — arrow + swipe driven, NO scroll-pin */}
      <div
        className="relative pb-20"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative max-w-3xl mx-auto px-5 sm:px-6 min-h-[400px] flex items-center">
          {EVENTS.map((event, i) => (
            <div
              key={event.id}
              className="absolute inset-0 flex items-center justify-center transition-opacity duration-300"
              style={{ opacity: i === activeIndex ? 1 : 0, pointerEvents: i === activeIndex ? 'auto' : 'none' }}
            >
              <div className="w-full max-w-xl">
                <EventCard event={event} index={i} />
              </div>
            </div>
          ))}
        </div>

        {/* Arrow navigation — same style as Oryzo */}
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={prev}
            className="w-12 h-12 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
            aria-label="Previous event"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Progress dots */}
          <div className="flex items-center gap-2">
            {EVENTS.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`rounded-full transition-all duration-300 cursor-pointer ${i === activeIndex ? 'w-8 h-2.5 bg-white' : 'w-2.5 h-2.5 bg-white/30 hover:bg-white/50'}`}
                aria-label={`Go to event ${i + 1}`}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="w-12 h-12 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
            aria-label="Next event"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Swipe hint (mobile) */}
        <div className="sm:hidden text-center mt-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500" style={{ fontFamily: 'var(--font-grotesk)' }}>
            ← Swipe →
          </p>
        </div>

        {/* End CTA */}
        <div className="text-center mt-8 px-5">
          <MagneticButton
            strength={0.2}
            as="a"
            href="/contact"
            className="btn-tactile btn-tactile-primary px-6 py-3.5 text-sm"
          >
            <Clock className="w-4 h-4" />
            Notify me when new events drop
          </MagneticButton>
        </div>
      </div>
    </section>
  );
}

