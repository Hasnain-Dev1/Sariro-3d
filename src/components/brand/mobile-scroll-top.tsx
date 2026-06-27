'use client';

import { motion, useScroll, useSpring, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';

/* ===============================================================
   MOBILE SCROLL-TOP BUTTON
   - Only shows on mobile/tablet (below lg)
   - Appears after scrolling 400px down
   - Bottom-right, 48×48 touch target
   - Smooth scroll to top on tap
=============================================================== */

export default function MobileScrollTop() {
  const [visible, setVisible] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 100, damping: 30, restDelta: 0.001 });

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          onClick={scrollToTop}
          whileTap={{ scale: 0.9 }}
          className="lg:hidden fixed bottom-5 right-5 z-40 w-12 h-12 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-500/40 flex items-center justify-center cursor-pointer active:bg-blue-700 transition-colors"
          style={{ minHeight: '48px', minWidth: '48px' }}
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
          {/* Progress ring */}
          <svg
            className="absolute inset-0 pointer-events-none -rotate-90"
            width="48"
            height="48"
            viewBox="0 0 48 48"
          >
            <circle
              cx="24"
              cy="24"
              r="22"
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="2"
            />
            <motion.circle
              cx="24"
              cy="24"
              r="22"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 22}
              style={{ pathLength: progress }}
            />
          </svg>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
