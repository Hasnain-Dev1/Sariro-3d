/**
 * SARIRO — Service Worker (public marketing site only)
 * =====================================================
 *
 * Goal: after a first visit, the static public pages (home, courses,
 * pricing, about, etc.) load near-instantly — served straight from the
 * Cache Storage API instead of waiting on the network — then quietly
 * refresh themselves in the background so content never stays stale for
 * more than one visit.
 *
 * SAFETY — what this NEVER touches, on purpose:
 *   - Anything not GET (never cache a mutation).
 *   - Any cross-origin request (Supabase, Razorpay, etc. pass straight through).
 *   - /api/*, /dashboard/*, /auth/*, /settings, /checkout, /payment-success,
 *     /payment-failure, /certificate/*, /welcome — these must ALWAYS hit the
 *     network. A cached class schedule, credit balance, or payment page
 *     would be a real correctness bug, not just a UX nitpick. This file
 *     uses an ALLOWLIST of public marketing routes for page caching — a
 *     request has to be explicitly listed to ever be cached, not the other
 *     way around.
 *
 * Strategies:
 *   - /_next/static/* (JS/CSS, content-hashed by Next.js so a given URL's
 *     content never changes) → cache-first. Completely safe: if the content
 *     changed, the filename changed too.
 *   - Fonts/images (same-origin) → cache-first.
 *   - Allowlisted public page navigations → stale-while-revalidate: serve
 *     the cached version instantly if we have one, then re-fetch in the
 *     background and update the cache for next time. Never more than one
 *     visit stale.
 *   - Everything else → untouched passthrough to the network.
 */

const CACHE_VERSION = 'sariro-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const PAGE_CACHE = `${CACHE_VERSION}-pages`;

// Public marketing routes only — a request must match one of these prefixes
// to ever be served from (or written to) the page cache.
const CACHEABLE_PAGE_PREFIXES = [
  '/', '/about', '/story', '/schools', '/events', '/pricing',
  '/courses', '/resources', '/faq', '/contact',
  '/privacy', '/refunds', '/terms', '/course-path',
];

function isCacheablePage(pathname) {
  if (pathname === '/') return true;
  return CACHEABLE_PAGE_PREFIXES.some(
    (p) => p !== '/' && (pathname === p || pathname.startsWith(p + '/'))
  );
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((n) => n.startsWith('sariro-') && n !== STATIC_CACHE && n !== PAGE_CACHE)
          .map((n) => caches.delete(n))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only ever handle same-origin GET requests. Everything else (POSTs,
  // Supabase/Razorpay cross-origin calls, etc.) passes straight through —
  // we don't even call respondWith, so the browser handles it normally.
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Next.js's content-hashed static assets — cache-first, always safe.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(req, STATIC_CACHE));
    return;
  }

  // Same-origin images/fonts — cache-first.
  if (/\.(png|jpe?g|webp|avif|svg|gif|woff2?|ttf)$/i.test(url.pathname)) {
    event.respondWith(cacheFirst(req, STATIC_CACHE));
    return;
  }

  // Page navigations — ONLY the explicitly allowlisted public routes.
  // Everything else (dashboard, api, auth, settings, checkout, payment
  // pages, certificates, welcome) is deliberately left untouched.
  if (req.mode === 'navigate' && isCacheablePage(url.pathname)) {
    event.respondWith(staleWhileRevalidate(req, PAGE_CACHE));
    return;
  }

  // Everything else: no-op, let the browser handle it normally.
});

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const networkFetch = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached); // offline / network failure — fall back to cache

  return cached || networkFetch;
}
