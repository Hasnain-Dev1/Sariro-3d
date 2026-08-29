'use client';

import { useEffect, useRef, Suspense } from 'react';
import { motion, useScroll, useSpring, useTransform, MotionValue } from 'framer-motion';
import Lenis from 'lenis';

/* ---------------------------------------------------------------
   SmoothScrollProvider
   - Initializes Lenis with tuned settings (buttery, not floaty)
   - Drives Lenis via requestAnimationFrame (rAF) — zero flicker
   - Syncs with framer-motion's scroll tracking
   - DESKTOP ONLY — see below

   Why Lenis never runs on touch devices
   -------------------------------------
   Native mobile scrolling is GPU-accelerated and handled off the main
   thread; it is already smooth, and it is what makes the browser's own
   URL bar hide as you scroll. Lenis replaces that with JavaScript-driven
   scrolling ON the main thread, plus a requestAnimationFrame loop that
   runs for the entire life of the page whether anyone scrolls or not.

   On a desktop with headroom that buys a genuinely nicer feel. On a
   low-end Android it is a permanent main-thread tax and the single
   biggest source of "the site feels laggy" — while replacing something
   that was already better.

   Same gate as `useHeavyVisuals`: non-touch, >=1024px, motion allowed.
--------------------------------------------------------------- */

export default function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const smallViewport = window.matchMedia('(max-width: 1023px)').matches;
    const touchPrimary = window.matchMedia('(pointer: coarse)').matches;

    // Phones and tablets keep native scroll: smoother, cheaper, and it lets the
    // browser chrome collapse the way users expect.
    if (prefersReduced || smallViewport || touchPrimary) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // expo out
      smoothWheel: true,
      wheelMultiplier: 1,
      // Touch is never smoothed — this provider does not run on touch devices
      // at all, and leaving it enabled would only mislead the next reader.
      syncTouch: false,
      infinite: false,
    });
    lenisRef.current = lenis;

    let rafId = 0;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // Listen for scroll-lock events from chat bubble / modals.
    // When locked, stop Lenis entirely so the page can't be scrolled
    // (only the chat panel, which has data-lenis-prevent, can scroll).
    const handleScrollLock = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.locked) {
        lenis.stop();
      } else {
        lenis.start();
      }
    };
    window.addEventListener('sariro:scroll-lock', handleScrollLock);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('sariro:scroll-lock', handleScrollLock);
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
