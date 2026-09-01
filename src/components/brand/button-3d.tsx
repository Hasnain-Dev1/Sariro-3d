'use client';

import Link from 'next/link';
import { useRef, useState, type ReactNode } from 'react';

/**
 * SARIRO — a button with real depth, and no GL context
 * =========================================================
 * ── Why this is CSS and not three.js ────────────────────────────────────────
 * The ask was a "3js animated button". This is a 3D button, built from CSS
 * transforms rather than WebGL, and that is a deliberate trade rather than a
 * shortcut.
 *
 * The site already logs `THREE.WebGLRenderer: Context Lost` on the homepage.
 * Browsers cap how many live WebGL contexts a page may hold — roughly 8–16,
 * and when the cap is hit the OLDEST context is destroyed, which is what that
 * message is. Sariro already runs several permanent scenes. Giving a *button* a
 * canvas of its own would spend one of the scarcest resources on the page on
 * the smallest thing on it, and would push a real scene out of memory to do it.
 *
 * A canvas also costs an animation frame loop per button, cannot be read by a
 * screen reader without duplicate markup, and does not print.
 *
 * What actually reads as "3D" is depth, light and response — a face that tilts
 * toward the cursor, a hard shadow that shortens as the button is pressed, and
 * a specular sweep. `transform-style: preserve-3d` with real perspective does
 * all three on the compositor, at no GPU-context cost. If a scene-quality
 * button is ever genuinely wanted, it belongs in the existing canvas rather
 * than in one of its own.
 *
 * ── Accessibility ───────────────────────────────────────────────────────────
 * Renders a real <a> or <button>, so keyboard, focus ring and screen readers
 * behave normally. The tilt is pointer-only decoration; nothing about the
 * control's meaning lives in it, and it is skipped entirely for anyone who
 * asked for reduced motion.
 */

interface Button3DProps {
  children: ReactNode;
  /** Renders a link when set, a button otherwise. */
  href?: string;
  onClick?: () => void;
  /** Face colour. */
  color?: string;
  /** The side wall — should read as the same hue in shadow. */
  edge?: string;
  className?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
}

/** How far the face tips toward the cursor, in degrees. */
const MAX_TILT = 9;

export default function Button3D({
  children,
  href,
  onClick,
  color = '#B45309',
  edge = '#7C2D12',
  className = '',
  type = 'button',
  disabled = false,
}: Button3DProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [pressed, setPressed] = useState(false);
  // Where the specular highlight sits, as a percentage across the face.
  const [glare, setGlare] = useState({ x: 50, y: 50 });

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    // -0.5..0.5 from the centre of the face.
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    // Tip TOWARD the cursor: a face lit from where you are pointing reads as
    // solid; tipping away reads as a sticker peeling off.
    setTilt({ x: -py * MAX_TILT * 2, y: px * MAX_TILT * 2 });
    setGlare({ x: (px + 0.5) * 100, y: (py + 0.5) * 100 });
  };

  const reset = () => {
    setTilt({ x: 0, y: 0 });
    setPressed(false);
    setGlare({ x: 50, y: 50 });
  };

  // Depth collapses on press — the shadow shortening is what sells the travel.
  const depth = pressed ? 2 : 7;

  const face = (
    <span
      className="relative z-[1] inline-flex items-center justify-center gap-2 w-full h-full"
      style={{ transform: 'translateZ(1px)' }}
    >
      {children}
    </span>
  );

  const inner = (
    <div
      ref={ref}
      onMouseMove={disabled ? undefined : onMove}
      onMouseLeave={reset}
      onMouseDown={() => !disabled && setPressed(true)}
      onMouseUp={() => setPressed(false)}
      className="relative w-full"
      style={{ perspective: '600px' }}
    >
      <div
        data-btn3d
        className="relative flex items-center justify-center rounded-xl px-6 h-12 font-bold text-[15px] text-white select-none"
        style={{
          background: color,
          transformStyle: 'preserve-3d',
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(${pressed ? depth : 0}px)`,
          boxShadow: `0 ${depth}px 0 -1px ${edge}, 0 ${depth + 10}px ${depth + 16}px -${depth}px rgba(60,30,5,0.45)`,
          // Motion is decoration. Reduced motion is honoured in globals.css via
          // [data-btn3d], not a JS branch — a render-time media query cannot
          // give the server and the browser the same answer, and the mismatch
          // leaves the subtree half-hydrated.
          transition:
            'transform 160ms cubic-bezier(0.22,1,0.36,1), box-shadow 160ms cubic-bezier(0.22,1,0.36,1)',
          willChange: 'transform',
        }}
      >
        {/* Specular sweep — follows the pointer, so the face reads as a surface
            catching light rather than a flat fill. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-xl opacity-70"
          style={{
            background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0) 55%)`,
            transform: 'translateZ(0.5px)',
          }}
        />
        {/* Top bevel: one hairline of lighter colour where the light would land. */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-xl"
          style={{ background: 'rgba(255,255,255,0.45)' }}
        />
        {face}
      </div>
    </div>
  );

  const shell = `inline-block w-full ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`;

  if (href && !disabled) {
    return (
      <Link href={href} className={shell} onClick={onClick}>
        {inner}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={shell}>
      {inner}
    </button>
  );
}
