'use client';

import {
  motion,
  useScroll,
  useTransform,
  useMotionValue,
  useSpring,
  useVelocity,
  MotionValue,
} from 'framer-motion';
import { useRef, useEffect, ReactNode, MouseEvent } from 'react';

/* ---------------------------------------------------------------
   ScrollReveal3D
   Wraps any block; animates it into view with a 3D entrance
   (rotateX + translateY + opacity) once when scrolled into view.
--------------------------------------------------------------- */
type RevealProps = {
  children: ReactNode;
  delay?: number;
  className?: string;
  rotation?: number; // rotateX in degrees
  distance?: number; // translateY in px
  once?: boolean;
};

export function ScrollReveal3D({
  children,
  delay = 0,
  className = '',
  rotation = 12,
  distance = 60,
  once = true,
}: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: distance, rotateX: rotation }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once, margin: '-80px' }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      style={{ transformStyle: 'preserve-3d', perspective: '1200px' }}
    >
      {children}
    </motion.div>
  );
}

/* ---------------------------------------------------------------
   MagneticButton
   Button that subtly attracts toward the cursor on hover.
   Uses direct DOM mutation (no React re-render) for max perf.
--------------------------------------------------------------- */
type MagneticProps = {
  children: ReactNode;
  className?: string;
  strength?: number;
  onClick?: () => void;
  as?: 'button' | 'a';
  href?: string;
};

export function MagneticButton({
  children,
  className = '',
  strength = 0.35,
  onClick,
  as = 'button',
  href,
}: MagneticProps) {
  const ref = useRef<HTMLElement>(null);

  const handleMove = (e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    el.style.transform = `translate(${x * strength}px, ${y * strength}px)`;
  };
  const handleLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = 'translate(0px, 0px)';
  };

  const sharedProps = {
    ref: ref as any,
    onMouseMove: handleMove,
    onMouseLeave: handleLeave,
    className: `transition-transform duration-300 ease-out will-change-transform ${className}`,
    style: { display: 'inline-flex' },
  };

  if (as === 'a') {
    return (
      <a {...sharedProps} href={href} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <button {...sharedProps} onClick={onClick}>
      {children}
    </button>
  );
}

/* ---------------------------------------------------------------
   TiltCard3D — pointer-tracking 3D tilt on hover
   Pure DOM mutation for max perf. Optional glare highlight.
--------------------------------------------------------------- */
export function TiltCard3D({
  children,
  className = '',
  maxTilt = 8,
  glare = true,
}: {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  glare?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = (e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(1200px) rotateY(${px * maxTilt}deg) rotateX(${-py * maxTilt}deg) translateZ(8px)`;

    if (glare) {
      const glareEl = el.querySelector('[data-glare]') as HTMLElement | null;
      if (glareEl) {
        glareEl.style.background = `radial-gradient(circle at ${(px + 0.5) * 100}% ${(py + 0.5) * 100}%, rgba(255,255,255,0.25), transparent 50%)`;
      }
    }
  };
  const handleLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = 'perspective(1200px) rotateY(0deg) rotateX(0deg) translateZ(0px)';
    const glareEl = el.querySelector('[data-glare]') as HTMLElement | null;
    if (glareEl) glareEl.style.background = 'transparent';
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`relative transition-transform duration-200 ease-out will-change-transform ${className}`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {children}
      {glare && (
        <div
          data-glare
          className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity"
          style={{ background: 'transparent' }}
        />
      )}
    </div>
  );
}

/* ---------------------------------------------------------------
   SplitText3D — splits a heading into words, each rotating in 3D
   on scroll-into-view. Lightweight (no character-level split).
--------------------------------------------------------------- */
export function SplitText3D({
  text,
  className = '',
  highlight,
  highlightClassName = '',
  delay = 0,
}: {
  text: string;
  className?: string;
  highlight?: string;
  highlightClassName?: string;
  delay?: number;
}) {
  const words = text.split(' ');
  const highlightWords = highlight?.split(' ') ?? [];

  return (
    <span className={className} style={{ perspective: '1000px' }}>
      {words.map((word, i) => {
        const isHighlight = highlightWords.includes(word);
        return (
          <span key={i} className="inline-block overflow-hidden align-bottom" style={{ perspective: '1000px' }}>
            <motion.span
              initial={{ opacity: 0, rotateX: -90, y: 30 }}
              whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: delay + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className={`inline-block ${isHighlight ? highlightClassName : ''}`}
              style={{ transformOrigin: '50% 100%', transformStyle: 'preserve-3d' }}
            >
              {word}
              {i < words.length - 1 ? '\u00A0' : ''}
            </motion.span>
          </span>
        );
      })}
    </span>
  );
}

/* ---------------------------------------------------------------
   useScrollVelocity — returns a MotionValue representing the
   current scroll velocity. Used by VelocitySkew for that
   satisfying "lean into the scroll" effect on cards.
--------------------------------------------------------------- */
export function useScrollVelocity() {
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  // Smooth so skew doesn't jitter
  return useSpring(velocity, {
    stiffness: 200,
    damping: 30,
    mass: 0.5,
  });
}

/* ---------------------------------------------------------------
   VelocitySkew — wraps children; skews them slightly based on
   scroll velocity. Returns to 0 when velocity settles.
--------------------------------------------------------------- */
export function VelocitySkew({
  children,
  max = 8,
  velocity,
  className = '',
}: {
  children: ReactNode;
  max?: number;
  velocity: MotionValue<number>;
  className?: string;
}) {
  const skew = useTransform(velocity, [-2000, 0, 2000], [max, 0, -max]);
  return (
    <motion.div style={{ skewX: skew }} className={className}>
      {children}
    </motion.div>
  );
}

/* ---------------------------------------------------------------
   CustomCursor — premium dual-element cursor:
   - A small dot that follows the cursor instantly
   - A larger ring that lags behind with spring physics
   - Grows + changes color when hovering interactive elements
   - Auto-disables on touch devices and reduced-motion
   - Uses direct DOM mutation (no React re-renders on mousemove)
--------------------------------------------------------------- */
export function CustomCursor() {
  useEffect(() => {
    const fine = window.matchMedia('(pointer: fine)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!fine || reduced) return;

    const dot = document.createElement('div');
    const ring = document.createElement('div');

    dot.style.cssText = `
      position: fixed; top: 0; left: 0; width: 8px; height: 8px;
      background: #2563EB; border-radius: 50%; pointer-events: none;
      z-index: 9999; transform: translate(-50%, -50%);
      transition: width 0.2s, height 0.2s, background 0.2s;
      will-change: transform;
    `;
    ring.style.cssText = `
      position: fixed; top: 0; left: 0; width: 36px; height: 36px;
      border: 1.5px solid rgba(37, 99, 235, 0.5); border-radius: 50%;
      pointer-events: none; z-index: 9998;
      transform: translate(-50%, -50%);
      transition: width 0.25s, height 0.25s, border-color 0.25s, background 0.25s;
      will-change: transform;
    `;
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    document.body.style.cursor = 'none';
    const styleEl = document.createElement('style');
    styleEl.textContent = `
      @media (pointer: fine) {
        a, button, [role="button"], input, textarea, select, label, [data-cursor] {
          cursor: none !important;
        }
      }
    `;
    document.head.appendChild(styleEl);

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let rafId = 0;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;

      // Guard: e.target can be a Text node or SVG without .closest()
      const target = e.target;
      if (!target || typeof (target as Element).closest !== 'function') return;
      const interactive = (target as Element).closest('a, button, [role="button"], input, textarea, select, label, [data-cursor]');
      if (interactive) {
        dot.style.width = '12px';
        dot.style.height = '12px';
        dot.style.background = '#7C3AED';
        ring.style.width = '56px';
        ring.style.height = '56px';
        ring.style.borderColor = 'rgba(124, 58, 237, 0.6)';
        ring.style.background = 'rgba(124, 58, 237, 0.08)';
      } else {
        dot.style.width = '8px';
        dot.style.height = '8px';
        dot.style.background = '#2563EB';
        ring.style.width = '36px';
        ring.style.height = '36px';
        ring.style.borderColor = 'rgba(37, 99, 235, 0.5)';
        ring.style.background = 'transparent';
      }
    };

    const onDown = () => {
      dot.style.width = '6px';
      dot.style.height = '6px';
      ring.style.width = '28px';
      ring.style.height = '28px';
    };
    const onUp = () => {
      dot.style.width = '8px';
      dot.style.height = '8px';
      ring.style.width = '36px';
      ring.style.height = '36px';
    };

    function tick() {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
      dot.remove();
      ring.remove();
      styleEl.remove();
      document.body.style.cursor = '';
    };
  }, []);

  return null;
}

/* ---------------------------------------------------------------
   PinnedStackCard — a single card in the PinnedStack.
   Extracted as its own component so hooks are called at the top
   level (not inside a .map() callback).
--------------------------------------------------------------- */
function PinnedStackCard({
  index,
  count,
  scrollYProgress,
  children,
}: {
  index: number;
  count: number;
  scrollYProgress: MotionValue<number>;
  children: ReactNode;
}) {
  const isLast = index === count - 1;
  const start = index / count;
  const end = (index + 1) / count;

  // SWAP animation: card enters from below, exits up when next card enters.
  // Last card stays put after entering.
  const y = useTransform(
    scrollYProgress,
    [Math.max(0, start - 0.06), start, end, Math.min(1, end + 0.06)],
    ['100vh', '0vh', '0vh', isLast ? '0vh' : '-70vh']
  );
  const scale = useTransform(
    scrollYProgress,
    [Math.max(0, start - 0.06), start, end, Math.min(1, end + 0.06)],
    [0.92, 1, 1, isLast ? 1 : 0.88]
  );
  const opacity = useTransform(
    scrollYProgress,
    [Math.max(0, start - 0.06), start, end, Math.min(1, end + 0.06)],
    [0, 1, 1, isLast ? 1 : 0]
  );
  return (
    <motion.div
      style={{
        y,
        scale,
        opacity,
        zIndex: index + 1,
        position: 'absolute',
        width: '100%',
        maxWidth: '56rem',
      }}
      className="px-4"
    >
      {children}
    </motion.div>
  );
}

/* ---------------------------------------------------------------
   PinnedStack — pinned stacking cards effect.
   The section is pinned for N * stackHeight viewport heights.
   Each card slides up and sticks as you scroll past.
   Inspired by Apple's product pages.
--------------------------------------------------------------- */
export function PinnedStack({
  children,
  count,
  stackHeight = 60, // vh per card
}: {
  children: (index: number) => ReactNode;
  count: number;
  stackHeight?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  });

  return (
    <div ref={ref} style={{ height: `${count * stackHeight}vh` }} className="relative">
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        {Array.from({ length: count }).map((_, i) => (
          <PinnedStackCard
            key={i}
            index={i}
            count={count}
            scrollYProgress={scrollYProgress}
          >
            {children(i)}
          </PinnedStackCard>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   ParallaxLayer — wraps children and moves them at a different
   speed than the scroll.
--------------------------------------------------------------- */
export function ParallaxLayer({
  children,
  speed = 0.3,
  className = '',
  progress,
}: {
  children: ReactNode;
  speed?: number;
  className?: string;
  progress?: MotionValue<number>;
}) {
  const { scrollYProgress } = useScroll();
  const p = progress ?? scrollYProgress;
  const y = useTransform(p, [0, 1], [speed * 100, -speed * 100]);
  return (
    <motion.div style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}
