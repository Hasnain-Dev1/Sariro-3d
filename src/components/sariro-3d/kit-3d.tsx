'use client';

import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useRef, useState, useEffect, ReactNode, MouseEvent } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/* ===============================================================
   SARIRO 3D KIT — Reusable 3D effect components.
   All CSS-3D based (no WebGL) for max performance.
   Use these to give each section a UNIQUE 3D identity.
=============================================================== */


/* ---------------------------------------------------------------
   FlipCard3D — card that flips on Y-axis to reveal back face.
   Used by: Courses (front=info, back=syllabus)
--------------------------------------------------------------- */
export function FlipCard3D({
  front,
  back,
  className = '',
  height = 'auto',
}: {
  front: ReactNode;
  back: ReactNode;
  className?: string;
  height?: string;
}) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className={`relative ${className}`}
      style={{ perspective: '1200px', height }}
      onMouseEnter={() => setFlipped(true)}
      onMouseLeave={() => setFlipped(false)}
      onClick={() => setFlipped((v) => !v)}
    >
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 backface-hidden"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          {front}
        </div>
        {/* Back */}
        <div
          className="absolute inset-0 backface-hidden"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {back}
        </div>
      </motion.div>
    </div>
  );
}


/* ---------------------------------------------------------------
   Coverflow3D — Apple Cover Flow style carousel.
   Cards angle at 45° on either side, active one faces forward.
   Used by: Testimonials
--------------------------------------------------------------- */
export function Coverflow3D<T>({
  items,
  activeIndex,
  renderItem,
  cardWidth = 360,
  cardHeight = 420,
  spacing = 280,
  maxRotation = 50,
}: {
  items: T[];
  activeIndex: number;
  renderItem: (item: T, isActive: boolean) => ReactNode;
  cardWidth?: number;
  cardHeight?: number;
  spacing?: number;
  maxRotation?: number;
}) {
  return (
    <div
      className="relative flex items-center justify-center overflow-hidden"
      style={{ height: cardHeight + 60, perspective: '1500px' }}
    >
      {items.map((item, i) => {
        const offset = i - activeIndex;
        const absOffset = Math.abs(offset);
        const x = offset * spacing;
        const rotateY = offset === 0 ? 0 : offset > 0 ? -maxRotation : maxRotation;
        const translateZ = absOffset === 0 ? 60 : -Math.min(absOffset, 3) * 80;
        const opacity = absOffset > 2 ? 0 : absOffset === 0 ? 1 : 0.7 - absOffset * 0.15;
        const zIndex = items.length - absOffset;

        return (
          <motion.div
            key={i}
            animate={{
              x,
              rotateY,
              z: translateZ,
              opacity,
            }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute cursor-pointer"
            style={{
              width: cardWidth,
              height: cardHeight,
              zIndex,
              transformStyle: 'preserve-3d',
            }}
            onClick={() => {
              // Click non-active cards to make them active (handled by parent)
            }}
          >
            {renderItem(item, offset === 0)}
          </motion.div>
        );
      })}
    </div>
  );
}


/* ---------------------------------------------------------------
   NumberFlip3D — digit that rotates on X-axis to show value.
   Used by: Stats counters (each digit flips like a departure board)
--------------------------------------------------------------- */
export function NumberFlip3D({
  value,
  className = '',
  accentColor = '#2563EB',
}: {
  value: number;
  className?: string;
  accentColor?: string;
}) {
  const digits = String(value).split('');

  return (
    <div className={`inline-flex ${className}`} style={{ perspective: '600px' }}>
      {digits.map((d, i) => (
        <DigitFlip key={i} digit={d} accentColor={accentColor} />
      ))}
    </div>
  );
}

function DigitFlip({ digit, accentColor }: { digit: string; accentColor: string }) {
  // Key-based remount: each digit change triggers a fresh rotateX entrance.
  // Simpler than state-driven flip and avoids setState-in-effect lint.
  return (
    <div
      className="relative inline-block overflow-hidden"
      style={{ width: '0.65em', height: '0.85em', transformStyle: 'preserve-3d' }}
    >
      <motion.span
        key={digit}
        initial={{ rotateX: -90, opacity: 0 }}
        animate={{ rotateX: 0, opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0 flex items-center justify-center"
        style={{
          transformStyle: 'preserve-3d',
          transformOrigin: 'center bottom',
          fontFamily: 'var(--font-jakarta)',
          fontWeight: 800,
          color: accentColor,
          fontSize: '1em',
          lineHeight: 1,
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
        }}
      >
        {digit}
      </motion.span>
    </div>
  );
}


/* ---------------------------------------------------------------
   RotatingCube3D — 6-face cube that rotates continuously.
   Each face shows different content.
   Used by: Philosophy (Mimo's portrait cube)
--------------------------------------------------------------- */
export function RotatingCube3D({
  faces,
  size = 240,
  autoRotate = true,
  rotateSpeed = 8,
}: {
  faces: ReactNode[]; // exactly 6
  size?: number;
  autoRotate?: boolean;
  rotateSpeed?: number;
}) {
  const [rotation, setRotation] = useState({ x: -15, y: 25 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 });
  const [userInteracted, setUserInteracted] = useState(false);

  const handleMouseDown = (e: MouseEvent) => {
    setIsDragging(true);
    setLastPos({ x: e.clientX, y: e.clientY });
    setUserInteracted(true);
  };
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastPos.x;
    const dy = e.clientY - lastPos.y;
    setRotation((r) => ({ x: r.x - dy * 0.5, y: r.y + dx * 0.5 }));
    setLastPos({ x: e.clientX, y: e.clientY });
  };
  const handleMouseUp = () => setIsDragging(false);

  const half = size / 2;
  const faceTransforms = [
    { transform: `rotateY(0deg) translateZ(${half}px)` },           // front
    { transform: `rotateY(90deg) translateZ(${half}px)` },          // right
    { transform: `rotateY(180deg) translateZ(${half}px)` },         // back
    { transform: `rotateY(-90deg) translateZ(${half}px)` },         // left
    { transform: `rotateX(90deg) translateZ(${half}px)` },          // top
    { transform: `rotateX(-90deg) translateZ(${half}px)` },         // bottom
  ];

  return (
    <div
      className="relative cursor-grab active:cursor-grabbing select-none"
      style={{ width: size, height: size, perspective: '1000px' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <motion.div
        animate={autoRotate && !userInteracted ? { y: rotation.y + 360 } : {}}
        transition={autoRotate && !userInteracted ? { duration: rotateSpeed, repeat: Infinity, ease: 'linear' } : {}}
        style={{
          transformStyle: 'preserve-3d',
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
      >
        {faces.slice(0, 6).map((face, i) => (
          <div
            key={i}
            className="absolute inset-0 flex items-center justify-center"
            style={{
              ...faceTransforms[i],
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            {face}
          </div>
        ))}
      </motion.div>
    </div>
  );
}


/* ---------------------------------------------------------------
   FloatingIcon3D — icon that floats with translateZ depth.
   Used by: Tracks (icons hover above cards), Pricing
--------------------------------------------------------------- */
export function FloatingIcon3D({
  children,
  floatDistance = 40,
  className = '',
  delay = 0,
}: {
  children: ReactNode;
  floatDistance?: number;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      animate={{
        y: [0, -8, 0],
        z: [floatDistance, floatDistance + 10, floatDistance],
      }}
      transition={{
        duration: 3 + delay * 0.5,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
      className={className}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {children}
    </motion.div>
  );
}


/* ---------------------------------------------------------------
   WaveDivider3D — animated SVG wave with 3D perspective.
   Sits between sections for smooth visual transitions.
   Used by: between all major sections
--------------------------------------------------------------- */
export function WaveDivider3D({
  fromColor = '#FFFFFF',
  toColor = '#FFFFFF',
  flip = false,
  height = 80,
}: {
  fromColor?: string;
  toColor?: string;
  flip?: boolean;
  height?: number;
}) {
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height, transformStyle: 'preserve-3d', perspective: '800px' }}
      aria-hidden
    >
      <svg
        className="absolute bottom-0 left-0 w-full"
        style={{ height: '100%', transform: flip ? 'scaleY(-1)' : 'none' }}
        viewBox="0 0 1440 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={`wave-${fromColor}-${toColor}-${flip}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fromColor} />
            <stop offset="100%" stopColor={toColor} />
          </linearGradient>
        </defs>
        <motion.path
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
          d="M0,50 C180,90 360,10 540,40 C720,70 900,20 1080,45 C1260,70 1380,40 1440,50 L1440,100 L0,100 Z"
          fill={`url(#wave-${fromColor}-${toColor}-${flip})`}
        />
      </svg>
    </div>
  );
}


/* ---------------------------------------------------------------
   DepthPopOut3D — element that pops forward in Z-space.
   Used by: Pricing (popular tier), CTA button
--------------------------------------------------------------- */
export function DepthPopOut3D({
  children,
  zDistance = 40,
  hoverBoost = true,
  className = '',
}: {
  children: ReactNode;
  zDistance?: number;
  hoverBoost?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      ref={ref}
      className={`relative ${className}`}
      style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.div
        animate={{
          z: hovered && hoverBoost ? zDistance + 20 : zDistance,
          scale: hovered && hoverBoost ? 1.03 : 1,
        }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {children}
      </motion.div>
    </div>
  );
}


/* ---------------------------------------------------------------
   TiltCardGlare3D — enhanced tilt card with light glare.
   Different from the original TiltCard3D — adds a moving light
   reflection that follows the cursor. Used by: Tracks.
--------------------------------------------------------------- */
export function TiltCardGlare3D({
  children,
  className = '',
  maxTilt = 12,
}: {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMove = (e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `perspective(1200px) rotateY(${px * maxTilt}deg) rotateX(${-py * maxTilt}deg) translateZ(10px)`;

    const glareEl = el.querySelector('[data-glare-3d]') as HTMLElement | null;
    if (glareEl) {
      glareEl.style.background = `radial-gradient(circle at ${(px + 0.5) * 100}% ${(py + 0.5) * 100}%, rgba(255,255,255,0.3), transparent 50%)`;
    }
    const shadowEl = el.querySelector('[data-shadow-3d]') as HTMLElement | null;
    if (shadowEl) {
      shadowEl.style.boxShadow = `${-px * 30}px ${py * 30}px 60px rgba(15, 23, 42, 0.15)`;
    }
  };
  const handleLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = 'perspective(1200px) rotateY(0deg) rotateX(0deg) translateZ(0px)';
    const glareEl = el.querySelector('[data-glare-3d]') as HTMLElement | null;
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
      <div data-glare-3d className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity" style={{ background: 'transparent' }} />
    </div>
  );
}
