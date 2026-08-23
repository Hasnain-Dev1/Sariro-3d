'use client';

import { useEffect } from 'react';

/**
 * Registers /sw.js (public marketing-page precaching — see public/sw.js for
 * exactly what it does and does NOT touch). Production-only: a service
 * worker intercepting fetches during `next dev` fights with Fast Refresh
 * and hot-reload, so this is skipped in development entirely.
 *
 * Mounted from BrandLayout (public pages only) — deliberately not in the
 * root layout, so this never runs for a session that only ever visits
 * /dashboard/*.
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return;
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Non-fatal — the site works exactly the same without it, just
      // without the instant-repeat-visit caching layer.
    });
  }, []);

  return null;
}
