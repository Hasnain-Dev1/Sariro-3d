'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GraduationCap } from 'lucide-react';

function seededValue(i: number, min: number, max: number): number {
  const x = Math.sin(i * 9999 + 1234) * 10000;
  const frac = x - Math.floor(x);
  return min + frac * (max - min);
}

export default function CinematicIntro() {
  const [show, setShow] = useState(false);
  const [phase, setPhase] = useState<'particles' | 'logo' | 'done'>('particles');

  const particles = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => {
      const angle = (i / 40) * Math.PI * 2;
      const distance = 300 + seededValue(i, 0, 200);
      return {
        id: i,
        startX: Math.cos(angle) * distance,
        startY: Math.sin(angle) * distance,
        size: 3 + seededValue(i + 100, 0, 4),
        color: ['#2563EB', '#7C3AED', '#16A34A', '#06B6D4'][i % 4],
        delay: seededValue(i + 200, 0, 0.3),
      };
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const seen = sessionStorage.getItem('sariro-intro-seen');
    if (seen) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const showFrame = requestAnimationFrame(() => setShow(true));

    const t1 = setTimeout(() => setPhase('logo'), 800);
    const t2 = setTimeout(() => {
      setPhase('done');
      sessionStorage.setItem('sariro-intro-seen', '1');
    }, 2200);
    const t3 = setTimeout(() => setShow(false), 2400);

    return () => {
      cancelAnimationFrame(showFrame);
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
    };
  }, []);

  if (!show) return null;

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950/30 to-violet-950/30" />

          {/* Particles flying in → assembling → dispersing */}
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ x: p.startX, y: p.startY, opacity: 0, scale: 0 }}
              animate={{
                x: phase === 'particles' ? p.startX * 0.4 : 0,
                y: phase === 'particles' ? p.startY * 0.4 : 0,
                opacity: phase === 'particles' ? [0, 1] : 0,
                scale: phase === 'particles' ? 1 : 0,
              }}
              transition={{ duration: phase === 'particles' ? 0.6 : 0.4, delay: p.delay, ease: [0.22, 1, 0.36, 1] }}
              className="absolute rounded-full"
              style={{ width: p.size, height: p.size, background: p.color, boxShadow: `0 0 ${p.size * 2}px ${p.color}` }}
            />
          ))}

          {/* Logo */}
          <motion.div
            initial={{ scale: 0, opacity: 0, rotate: -90 }}
            animate={{
              scale: phase === 'logo' ? 1 : 0,
              opacity: phase === 'logo' ? 1 : 0,
              rotate: 0,
            }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10"
          >
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 0.8, repeat: phase === 'logo' ? 2 : 0 }}
              className="absolute inset-0 rounded-2xl blur-2xl"
              style={{ background: 'radial-gradient(circle, #2563EB, transparent 70%)' }}
            />
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-2xl">
              <GraduationCap className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>
          </motion.div>

          {/* Brand name */}
          {phase === 'logo' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="absolute bottom-1/4 left-1/2 -translate-x-1/2 text-center"
            >
              <div className="text-3xl font-extrabold text-white tracking-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>SARIRO</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-400 mt-1" style={{ fontFamily: 'var(--font-grotesk)' }}>AI Education</div>
            </motion.div>
          )}

          {/* Progress bar */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 2.2, ease: 'linear' }}
            className="absolute bottom-16 left-1/2 -translate-x-1/2 w-32 h-0.5 bg-gradient-to-r from-blue-500 to-violet-500 origin-left rounded-full"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
