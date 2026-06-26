'use client';

import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { Quote, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { TESTIMONIALS } from '@/lib/sariro-data';
import { SplitText3D } from './scroll-effects';
import { Coverflow3D } from './kit-3d';

const ACCENT_MAP: Record<string, { text: string; bg: string; soft: string; border: string }> = {
  blue:   { text: 'text-blue-700',   bg: 'bg-blue-600',   soft: 'bg-blue-50',   border: 'border-blue-200' },
  green:  { text: 'text-green-700',  bg: 'bg-green-600',  soft: 'bg-green-50',  border: 'border-green-200' },
  violet: { text: 'text-violet-700', bg: 'bg-violet-600', soft: 'bg-violet-50', border: 'border-violet-200' },
  amber:  { text: 'text-amber-700',  bg: 'bg-amber-600',  soft: 'bg-amber-50',  border: 'border-amber-200' },
  cyan:   { text: 'text-cyan-700',   bg: 'bg-cyan-600',   soft: 'bg-cyan-50',   border: 'border-cyan-200' },
};

export default function Testimonials3D() {
  const [active, setActive] = useState(0);
  const [auto, setAuto] = useState(true);
  const sectionRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const headerY = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const orb1Y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const orb2Y = useTransform(scrollYProgress, [0, 1], [-80, 80]);

  useEffect(() => {
    if (!auto) return;
    const id = setInterval(() => setActive((v) => (v + 1) % TESTIMONIALS.length), 5500);
    return () => clearInterval(id);
  }, [auto]);

  const next = () => { setActive((v) => (v + 1) % TESTIMONIALS.length); setAuto(false); };
  const prev = () => { setActive((v) => (v - 1 + TESTIMONIALS.length) % TESTIMONIALS.length); setAuto(false); };

  return (
    <section id="testimonials" ref={sectionRef} data-chapter="testimonials" data-chapter-label="Voices" className="relative py-24 sm:py-32 overflow-hidden bg-gradient-to-b from-slate-50 to-white">
      <div className="absolute inset-0 mesh-bg opacity-60" />
      <motion.div
        style={{ y: orb1Y }}
        className="absolute top-20 right-10 w-80 h-80 rounded-full bg-blue-400/10 blur-3xl pointer-events-none"
      />
      <motion.div
        style={{ y: orb2Y }}
        className="absolute bottom-20 left-10 w-96 h-96 rounded-full bg-violet-400/10 blur-3xl pointer-events-none"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          style={{ y: headerY }}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-14"
        >
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600 mb-4 block" style={{ fontFamily: 'var(--font-grotesk)' }}>
            — Voices from the community —
          </span>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
            <SplitText3D text="What our builders" highlight="builders" highlightClassName="gradient-text" />
            <br />
            <SplitText3D text="say about us." highlight="us." highlightClassName="gradient-text" delay={0.3} />
          </h2>
        </motion.div>

        {/* 3D Coverflow */}
        <div className="mb-8">
          <Coverflow3D
            items={TESTIMONIALS}
            activeIndex={active}
            cardWidth={340}
            cardHeight={440}
            spacing={260}
            maxRotation={45}
            renderItem={(t, isActive) => {
              const a = ACCENT_MAP[t.accent] ?? ACCENT_MAP.blue;
              return (
                <div
                  className={`card-3d h-full p-8 flex flex-col items-center text-center ${isActive ? 'shadow-2xl' : ''}`}
                  style={{
                    background: isActive ? '#fff' : 'rgba(255,255,255,0.85)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  {/* Quote icon */}
                  <div className={`w-14 h-14 rounded-2xl ${a.soft} flex items-center justify-center mb-5`}>
                    <Quote className={`w-7 h-7 ${a.text}`} fill="currentColor" />
                  </div>

                  {/* Stars */}
                  <div className="flex gap-1 mb-5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${a.text}`} fill="currentColor" />
                    ))}
                  </div>

                  {/* Quote */}
                  <blockquote
                    className="text-base font-bold text-slate-800 leading-snug mb-6 flex-1 overflow-hidden"
                    style={{ fontFamily: 'var(--font-jakarta)' }}
                  >
                    "{t.quote}"
                  </blockquote>

                  {/* Author */}
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-100 w-full justify-center">
                    <div className={`w-11 h-11 rounded-full ${a.bg} flex items-center justify-center text-white font-extrabold text-base shadow-md`} style={{ fontFamily: 'var(--font-jakarta)' }}>
                      {t.avatar}
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-bold text-slate-900">{t.name}</div>
                      <div className="text-xs text-slate-500 font-semibold">{t.role}</div>
                    </div>
                  </div>
                </div>
              );
            }}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <button
            onClick={prev}
            className="w-11 h-11 rounded-full glass-panel flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-5 h-5 text-slate-700" />
          </button>
          <div className="flex gap-2">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => { setActive(i); setAuto(false); }}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  i === active ? 'w-8 bg-blue-600' : 'w-2 bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>
          <button
            onClick={next}
            className="w-11 h-11 rounded-full glass-panel flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-5 h-5 text-slate-700" />
          </button>
        </div>

        {/* Mini grid — click to jump */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TESTIMONIALS.slice(0, 3).map((mini, i) => {
            const ma = ACCENT_MAP[mini.accent] ?? ACCENT_MAP.blue;
            return (
              <motion.button
                key={mini.name}
                onClick={() => { setActive(TESTIMONIALS.findIndex((t) => t.name === mini.name)); setAuto(false); }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -4 }}
                className="text-left card-3d p-5 cursor-pointer group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full ${ma.bg} flex items-center justify-center text-white font-bold`}>
                    {mini.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">{mini.name}</div>
                    <div className="text-xs text-slate-500 font-semibold">{mini.role}</div>
                  </div>
                </div>
                <p className="text-sm text-slate-600 line-clamp-2 group-hover:text-slate-800 transition-colors">
                  {mini.quote}
                </p>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
