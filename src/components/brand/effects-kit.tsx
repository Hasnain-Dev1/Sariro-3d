'use client';

import { motion, useScroll, useTransform, useInView, useMotionValue, useSpring, animate } from 'framer-motion';
import { useRef, useEffect, ReactNode, MouseEvent, useState } from 'react';

/* ===============================================================
   EFFECTS KIT — Drop-in scroll/hover/3D effects for any page.
   All GPU-accelerated (transform/opacity only). FAST.
=============================================================== */

/* ---------- Reveal: fade + slide + optional rotate on scroll into view ---------- */
export function Reveal({
  children,
  delay = 0,
  y = 40,
  rotateX = 0,
  className = '',
  once = true,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  rotateX?: number;
  className?: string;
  once?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y, rotateX }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once, margin: '-60px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ---------- StaggerGroup + StaggerItem: staggered grid reveals ---------- */
export function StaggerGroup({
  children,
  className = '',
  stagger = 0.08,
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ margin: '-40px' }}
      variants={{ hidden: {}, visible: { transition: { staggerChildren: stagger } } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className = '',
  y = 40,
}: {
  children: ReactNode;
  className?: string;
  y?: number;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y, rotateX: -8 },
        visible: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
      }}
      whileTap={{ scale: 0.97 }}
      className={className}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {children}
    </motion.div>
  );
}

/* ---------- TiltCard: hover tilt with glare + touch support ---------- */
export function TiltCard({
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
    el.style.transform = `perspective(1000px) rotateY(${px * maxTilt}deg) rotateX(${-py * maxTilt}deg) translateZ(8px)`;
    if (glare) {
      const g = el.querySelector('[data-tilt-glare]') as HTMLElement | null;
      if (g) g.style.background = `radial-gradient(circle at ${(px + 0.5) * 100}% ${(py + 0.5) * 100}%, rgba(255,255,255,0.25), transparent 50%)`;
    }
  };
  const handleLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) translateZ(0px)';
    const g = el.querySelector('[data-tilt-glare]') as HTMLElement | null;
    if (g) g.style.background = 'transparent';
  };
  // Touch support — tilt based on touch position
  const handleTouchMove = (e: React.TouchEvent) => {
    const el = ref.current;
    if (!el || !e.touches[0]) return;
    const r = el.getBoundingClientRect();
    const px = (e.touches[0].clientX - r.left) / r.width - 0.5;
    const py = (e.touches[0].clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(1000px) rotateY(${px * maxTilt * 0.6}deg) rotateX(${-py * maxTilt * 0.6}deg) translateZ(4px)`;
  };
  const handleTouchEnd = handleLeave;

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative transition-transform duration-200 ease-out will-change-transform ${className}`}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {children}
      {glare && <div data-tilt-glare className="pointer-events-none absolute inset-0 rounded-[inherit]" style={{ background: 'transparent' }} />}
    </div>
  );
}

/* ---------- MagneticButton: attracts toward cursor ---------- */
export function MagneticButton({
  children,
  className = '',
  strength = 0.25,
  onClick,
  as = 'button',
  href,
}: {
  children: ReactNode;
  className?: string;
  strength?: number;
  onClick?: () => void;
  as?: 'button' | 'a';
  href?: string;
}) {
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

  const shared = {
    ref: ref as any,
    onMouseMove: handleMove,
    onMouseLeave: handleLeave,
    className: `transition-transform duration-300 ease-out will-change-transform active:scale-95 ${className}`,
    style: { display: 'inline-flex' },
  };

  if (as === 'a') return <a {...shared} href={href} onClick={onClick}>{children}</a>;
  return <button {...shared} onClick={onClick}>{children}</button>;
}

/* ---------- SplitText: word-by-word 3D reveal ---------- */
export function SplitText({
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
  const hl = highlight?.split(' ') ?? [];
  return (
    <span className={className} style={{ perspective: '800px' }}>
      {words.map((word, i) => {
        const isHl = hl.includes(word);
        return (
          <span key={i} className="inline-block overflow-hidden align-bottom">
            <motion.span
              initial={{ opacity: 0, rotateX: -90, y: 20 }}
              whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: delay + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              className={`inline-block ${isHl ? highlightClassName : ''}`}
              style={{ transformOrigin: '50% 100%', transformStyle: 'preserve-3d' }}
            >
              {word}{i < words.length - 1 ? '\u00A0' : ''}
            </motion.span>
          </span>
        );
      })}
    </span>
  );
}

/* ---------- CountUp: number animates when scrolled into view ---------- */
export function CountUp({
  value,
  suffix = '',
  prefix = '',
  className = '',
  duration = 2,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.floor(v)),
    });
    return controls.stop;
  }, [inView, value, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}{display.toLocaleString()}{suffix}
    </span>
  );
}

/* ---------- ParallaxOrb: decorative background orb with scroll parallax ---------- */
export function ParallaxOrb({
  className = '',
  color = 'rgba(37, 99, 235, 0.1)',
  size = 400,
  speed = 100,
  position = 'top-20 right-10',
}: {
  className?: string;
  color?: string;
  size?: number;
  speed?: number;
  position?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [speed, -speed]);

  return (
    <motion.div
      ref={ref}
      style={{ y, width: size, height: size, background: color }}
      className={`absolute ${position} rounded-full blur-3xl pointer-events-none ${className}`}
    />
  );
}

/* ---------- StickyScrollSection: pins content while scrolling, animates children ---------- */
export function StickyScrollSection({
  children,
  className = '',
  pinHeight = '200vh',
}: {
  children: ReactNode;
  className?: string;
  pinHeight?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const opacity = useTransform(scrollYProgress, [0, 0.1, 0.9, 1], [0, 1, 1, 0.3]);

  return (
    <div ref={ref} style={{ height: pinHeight }} className={`relative ${className}`}>
      <motion.div style={{ opacity }} className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        {children}
      </motion.div>
    </div>
  );
}
