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
 *
 * ── Why viewport width is not enough ──────────────────────────────────────
 * A 1080p screen says nothing about the machine behind it. Budget laptops,
 * school desktops and older office machines all report a wide viewport and a
 * fine pointer, then choke on four WebGL canvases — which is most of what
 * "the site feels laggy on low-end devices" actually means.
 *
 * So we also read what the browser will tell us about the hardware:
 *   · deviceMemory        — RAM in GB (Chromium only, absent elsewhere)
 *   · hardwareConcurrency — logical CPU cores
 *
 * Both are absent on Safari and Firefox. Missing data is treated as "capable",
 * because refusing the premium layer to every Safari user to catch a few slow
 * machines is the worse trade.
 */

/** Below these, the machine gets the design without the WebGL. */
const MIN_DEVICE_MEMORY_GB = 4;
const MIN_CPU_CORES = 4;

interface HardwareHints {
  deviceMemory?: number;
  hardwareConcurrency?: number;
}

function hardwareLooksCapable(): boolean {
  if (typeof navigator === 'undefined') return true;
  const nav = navigator as Navigator & HardwareHints;

  // Undefined means the browser does not expose it — not that it is low.
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory < MIN_DEVICE_MEMORY_GB) return false;
  if (typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency < MIN_CPU_CORES) return false;

  return true;
}
export function useHeavyVisuals(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const smallViewport = window.matchMedia('(max-width: 1023px)').matches;
    const touchPrimary = window.matchMedia('(pointer: coarse)').matches;
    setEnabled(!reducedMotion && !smallViewport && !touchPrimary && hardwareLooksCapable());
  }, []);

  return enabled;
}
