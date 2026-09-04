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

/* ══════════════════════════════════════════════════════════════════════════
   Three answers, not two
   ══════════════════════════════════════════════════════════════════════════
   The original gate was a boolean, and a boolean forced a choice nobody wants
   to make: either a phone runs four WebGL canvases and the page stutters, or a
   phone gets a flat page while the whole product is called sariro-3d.

   So it is a tier.

     full   desktop with a real pointer, a wide viewport and capable hardware.
            Everything: cinematic intro, background particles, hero scene.

     lite   phones and tablets that are not obviously slow. ONE canvas — the
            hero, and only while it is on screen — at device pixel ratio 1 with
            fewer sparkles. The two full-viewport ambient layers stay off,
            because those run whether or not anything is visible and that is
            what actually costs a phone its frame budget.

     off    reduced motion, or hardware that says it cannot. Unchanged: a
            person who asked for less motion gets less motion, and a 2GB phone
            gets a page that scrolls.

   The split is between "a canvas that is on screen" and "a canvas that is
   always running". The first is a feature; the second is a background tax.
   ══════════════════════════════════════════════════════════════════════════ */

export type VisualTier = 'full' | 'lite' | 'off';

export interface DeviceSignals {
  reducedMotion: boolean;
  smallViewport: boolean;
  touchPrimary: boolean;
  /** RAM in GB. Undefined on Safari and Firefox, which do not expose it. */
  deviceMemory?: number;
  hardwareConcurrency?: number;
}

/**
 * Pure, so the decision can be tested without a browser.
 *
 * Order matters: an explicit request to reduce motion outranks everything,
 * including capable hardware, because it is a person's stated preference and
 * not a guess about their machine.
 */
export function visualTier(d: DeviceSignals): VisualTier {
  if (d.reducedMotion) return 'off';

  // Undefined means the browser does not expose it — not that it is low.
  if (typeof d.deviceMemory === 'number' && d.deviceMemory < MIN_DEVICE_MEMORY_GB) return 'off';
  if (typeof d.hardwareConcurrency === 'number' && d.hardwareConcurrency < MIN_CPU_CORES) return 'off';

  // A wide viewport with a fine pointer is a desktop. Either signal missing —
  // a touchscreen laptop, a phone in landscape — drops to one canvas, which is
  // the safe direction to be wrong in.
  if (!d.smallViewport && !d.touchPrimary) return 'full';

  return 'lite';
}

function readSignals(): DeviceSignals {
  const nav = navigator as Navigator & HardwareHints;
  return {
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    smallViewport: window.matchMedia('(max-width: 1023px)').matches,
    touchPrimary: window.matchMedia('(pointer: coarse)').matches,
    deviceMemory: typeof nav.deviceMemory === 'number' ? nav.deviceMemory : undefined,
    hardwareConcurrency:
      typeof nav.hardwareConcurrency === 'number' ? nav.hardwareConcurrency : undefined,
  };
}

/**
 * The tier for this device. 'off' during SSR and first paint, then resolved on
 * mount — every gated component is already client-only, so this cannot cause a
 * hydration mismatch.
 */
export function useVisualTier(): VisualTier {
  const [tier, setTier] = useState<VisualTier>('off');

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    setTier(visualTier(readSignals()));
  }, []);

  return tier;
}

/**
 * The always-running ambient layers: cinematic intro, background particles.
 * Desktop only, exactly as before.
 */
export function useHeavyVisuals(): boolean {
  return useVisualTier() === 'full';
}

/**
 * The hero canvas, which only renders while it is on screen. True on phones
 * too — that is the whole point of the lite tier.
 */
export function useHeroVisuals(): { show: boolean; lite: boolean } {
  const tier = useVisualTier();
  return { show: tier !== 'off', lite: tier === 'lite' };
}
