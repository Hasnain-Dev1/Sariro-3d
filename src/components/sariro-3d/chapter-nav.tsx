'use client';

import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

/* ---------------------------------------------------------------
   ChapterNav — right-side vertical dot navigation
   - Shows one dot per chapter (section)
   - Active dot expands + fills with gradient
   - Click to smooth-scroll to that chapter
   - Chapter name tooltip on hover
   - Auto-hides on mobile (too cramped)
   - Reads section IDs from the DOM (data-chapter attributes)
--------------------------------------------------------------- */

type Chapter = { id: string; label: string };

export default function ChapterNav() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const [hoveredId, setHoveredId] = useState<string>('');

  // Discover chapters from the DOM (data-chapter + data-chapter-label)
  // This is a legitimate "sync external state → React state" pattern.
  // The setState calls happen after DOM is ready, not synchronously during render.
  /**
   * Discover chapters from the DOM, and KEEP discovering.
   *
   * This used to be a single scan on mount. Every section it looks for is a
   * `dynamic()` import on the homepage, so at the moment ChapterNav mounted
   * almost none of them existed yet — the scan found an empty list, and
   * `chapters.length === 0` below returns null. The jump navigation was not
   * merely hidden on small screens; it rendered nothing at all, on every
   * viewport, on the longest page of the site.
   *
   * A MutationObserver keeps it in step as the lazy sections arrive, and
   * disconnects once the DOM settles. Cheap: it only reacts to nodes being
   * added or removed, and the rescan is a single querySelectorAll.
   */
  useEffect(() => {
    let frame = 0;

    const scan = () => {
      const els = Array.from(document.querySelectorAll<HTMLElement>('[data-chapter]'));
      const found: Chapter[] = els.map((el) => ({
        id: el.dataset.chapter || el.id,
        label: el.dataset.chapterLabel || el.id,
      }));
      setChapters((prev) => {
        // Same list, same order: keep the old array so the observer effect
        // below is not torn down and rebuilt on every unrelated mutation.
        const same =
          prev.length === found.length && prev.every((c, i) => c.id === found[i].id);
        return same ? prev : found;
      });
      if (found[0]) setActiveId((cur) => cur || found[0].id);
    };

    scan();

    const observer = new MutationObserver(() => {
      // Coalesce bursts of mutations into one scan per frame.
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        scan();
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  // Track which chapter is currently in view using IntersectionObserver
  useEffect(() => {
    if (chapters.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        // Find the entry closest to the viewport center
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          const id = visible[0].target.getAttribute('data-chapter') || visible[0].target.id;
          setActiveId(id);
        }
      },
      { rootMargin: '-30% 0px -50% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    chapters.forEach(({ id }) => {
      const el = document.querySelector(`[data-chapter="${id}"]`) || document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [chapters]);

  const handleClick = (id: string) => {
    const el = document.querySelector(`[data-chapter="${id}"]`) || document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (chapters.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1.2, duration: 0.6 }}
      className="fixed right-1.5 sm:right-4 lg:right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2 sm:gap-3"
    >
      {chapters.map((ch) => {
        const isActive = activeId === ch.id;
        const isHovered = hoveredId === ch.id;
        return (
          <button
            key={ch.id}
            onClick={() => handleClick(ch.id)}
            onMouseEnter={() => setHoveredId(ch.id)}
            onMouseLeave={() => setHoveredId('')}
            className="group relative flex items-center justify-end cursor-pointer"
            aria-label={`Jump to ${ch.label}`}
          >
            {/* The label is pointer-only, on purpose.
                It was briefly shown permanently for the active chapter below
                lg, on the reasoning that touch has no hover and nine
                unlabelled dots means tapping blind. Seen on a real 375px
                screen, that label landed across the hero headline - the rail
                sits at the screen edge and the content runs edge to edge, so
                any label wide enough to read overlaps the text underneath it.
                A word covering the headline is worse than a word missing: the
                dots still show position, and tapping one lands you somewhere
                you can immediately see. */}
            <AnimatePresence>
              {isHovered && (
                <motion.span
                  initial={{ opacity: 0, x: 8, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 8, scale: 0.9 }}
                  transition={{ duration: 0.18 }}
                  className="hidden lg:block absolute right-7 mr-1 px-2.5 py-1 rounded-md glass-panel text-[11px] font-bold text-slate-700 whitespace-nowrap pointer-events-none"
                  style={{ fontFamily: 'var(--font-grotesk)' }}
                >
                  {ch.label}
                </motion.span>
              )}
            </AnimatePresence>

            {/* The dot itself */}
            <motion.div
              animate={{
                width: isActive ? 28 : 10,
                height: 10,
                backgroundColor: isActive ? '#2563EB' : 'rgba(15, 23, 42, 0.25)',
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="rounded-full"
            >
              {isActive && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full h-full rounded-full bg-gradient-to-r from-blue-600 to-violet-600"
                />
              )}
            </motion.div>
          </button>
        );
      })}
    </motion.div>
  );
}

/* ---------------------------------------------------------------
   ScrollHueShift — subtle background tint that shifts hue
   as you scroll through the page. Sits behind all content.
   Pure CSS gradient, animated by scroll progress. Very cheap.
--------------------------------------------------------------- */
export function ScrollHueShift() {
  const { scrollYProgress } = useScroll();
  // Three layered radial gradients, each cross-fading as you scroll
  const g1Opacity = useTransform(scrollYProgress, [0, 0.25, 0.5], [0.7, 0.3, 0]);
  const g2Opacity = useTransform(scrollYProgress, [0.25, 0.5, 0.75], [0, 0.6, 0.2]);
  const g3Opacity = useTransform(scrollYProgress, [0.6, 0.85, 1], [0, 0.5, 0.7]);

  return (
    <div className="fixed inset-0 pointer-events-none z-0" aria-hidden>
      <motion.div
        style={{
          opacity: g1Opacity,
          background: 'radial-gradient(ellipse 80% 50% at 20% 0%, rgba(37, 99, 235, 0.08), transparent 70%)',
        }}
        className="absolute inset-0"
      />
      <motion.div
        style={{
          opacity: g2Opacity,
          background: 'radial-gradient(ellipse 80% 50% at 80% 50%, rgba(124, 58, 237, 0.08), transparent 70%)',
        }}
        className="absolute inset-0"
      />
      <motion.div
        style={{
          opacity: g3Opacity,
          background: 'radial-gradient(ellipse 80% 50% at 50% 100%, rgba(22, 163, 74, 0.08), transparent 70%)',
        }}
        className="absolute inset-0"
      />
    </div>
  );
}

/* ---------------------------------------------------------------
   SectionDivider — animated gradient wave between sections
   Pure decoration to smooth the visual transition between
   different-color sections (e.g. white → dark → white).
--------------------------------------------------------------- */
export function SectionDivider({
  variant = 'light-to-dark',
}: {
  variant?: 'light-to-dark' | 'dark-to-light' | 'light-to-light';
}) {
  const colors = {
    'light-to-dark': { from: '#FFFFFF', to: '#14100C' },
    'dark-to-light': { from: '#14100C', to: '#FFFFFF' },
    'light-to-light': { from: '#FFFFFF', to: '#FFFFFF' },
  }[variant];

  return (
    <div className="relative h-16 sm:h-24 overflow-hidden" aria-hidden>
      <svg
        className="absolute bottom-0 left-0 right-0 w-full h-full"
        viewBox="0 0 1440 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={`divider-grad-${variant}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.from} />
            <stop offset="100%" stopColor={colors.to} />
          </linearGradient>
        </defs>
        <path
          d="M0,40 C240,90 480,0 720,40 C960,80 1200,10 1440,50 L1440,100 L0,100 Z"
          fill={`url(#divider-grad-${variant})`}
        />
      </svg>
    </div>
  );
}
