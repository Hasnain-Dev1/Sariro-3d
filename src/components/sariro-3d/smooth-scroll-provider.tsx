'use client';

import { useEffect, useRef, Suspense } from 'react';
import { motion, useScroll, useSpring, useTransform, MotionValue } from 'framer-motion';
import Lenis from 'lenis';

/* ---------------------------------------------------------------
   SmoothScrollProvider
   - Initializes Lenis with tuned settings (buttery, not floaty)
   - Drives Lenis via requestAnimationFrame (rAF) — zero flicker
   - Syncs with framer-motion's scroll tracking
   - Respects prefers-reduced-motion
--------------------------------------------------------------- */

export default function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return; // skip smooth scroll for accessibility

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo out
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.6,
      infinite: false,
    });
    lenisRef.current = lenis;

    let rafId = 0;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return (
    <>
      <ScrollProgressBar />
      {children}
    </>
  );
}

/* ---------------------------------------------------------------
   ScrollProgressBar — top progress bar that fills as you scroll
   Uses spring physics for a weighted, premium feel
--------------------------------------------------------------- */
function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    restDelta: 0.001,
  });

  return (
    <motion.div
      style={{ scaleX, transformOrigin: '0% 50%' }}
      className="fixed top-0 left-0 right-0 h-1 z-[100] bg-gradient-to-r from-blue-600 via-violet-600 to-green-500"
      aria-hidden
    />
  );
}

/* ---------------------------------------------------------------
   useParallax — helper hook for scroll-linked parallax
--------------------------------------------------------------- */
export function useParallax(value: MotionValue<number>, distance: number) {
  return useTransform(value, [0, 1], [-distance, distance]);
}
