'use client';

import { useEffect, useState } from 'react';

/**
 * useHeavyVisuals — should we mount the decorative WebGL/three.js layers?
 *
 * The homepage layers four separate three.js canvases (cinematic intro, hero
 * neural scene, background particles, companion orb). On a desktop with a real
 * GPU that's a premium touch; on a phone it's continuous rAF render loops that
 * dominate the main thread and wreck the mobile PageSpeed score (TBT/LCP).
 *
 * So we gate all of them behind this hook: enabled ONLY on non-touch, wide
 * viewports that haven't asked to reduce motion. Phones and tablets get the
 * exact same design — gradients, mesh background, framer-motion text — just
 * without the WebGL layers they can't run smoothly.
 *
 * Returns false during SSR / first paint (unknown), then resolves on mount.
 * All the gated components are already client-only (ssr:false / inView), so
 * this never causes hydration mismatch.
 */
export function useHeavyVisuals(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const smallViewport = window.matchMedia('(max-width: 1023px)').matches;
    const touchPrimary = window.matchMedia('(pointer: coarse)').matches;
    setEnabled(!reducedMotion && !smallViewport && !touchPrimary);
  }, []);

  return enabled;
}
