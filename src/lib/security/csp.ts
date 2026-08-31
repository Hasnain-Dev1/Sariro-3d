/**
 * SARIRO — the Content Security Policy, in one place
 * =========================================================
 * This string is consumed TWICE, and it has to be identical in both:
 *
 *   1. `next.config.ts` — as the `Content-Security-Policy` response header.
 *   2. `app/layout.tsx` — as a `<meta http-equiv>` tag in every page's head.
 *
 * ── Why the meta tag exists, which is the important part ─────────────────────
 * The header alone does not reach production. Measured on 30 Aug 2026 against
 * the live site:
 *
 *   local dev  →  Content-Security-Policy: default-src 'self'; script-src …
 *   sariro.com →  Content-Security-Policy: upgrade-insecure-requests
 *
 * Hostinger's CDN layer (`Server: hcdn`) REPLACES this header with its own.
 * Every other security header from `next.config.ts` survives untouched —
 * X-Frame-Options, nosniff, Referrer-Policy, HSTS all arrive intact — so this
 * is a targeted override of the CSP specifically, not a general header strip.
 *
 * The consequence was that Sariro shipped no meaningful CSP at all. The careful
 * allowlist below was written, reviewed, and silently discarded at the edge.
 *
 * A `<meta http-equiv="Content-Security-Policy">` tag is part of the HTML
 * document, not the response headers, so a CDN cannot rewrite it without
 * rewriting the body. Browsers enforce it identically. Both are kept: if the
 * Hostinger override is ever removed, the header takes over and nothing changes.
 *
 * ── What meta CANNOT express ─────────────────────────────────────────────────
 * `frame-ancestors`, `report-uri`/`report-to` and `sandbox` are ignored in a
 * meta tag. This policy uses none of them, so nothing is lost — and clickjacking
 * stays covered by `X-Frame-Options: DENY`, which does survive to production.
 *
 * ── unsafe-inline / unsafe-eval ──────────────────────────────────────────────
 * Both are still here, and both genuinely weaken the policy. They are kept for
 * now because the alternative — nonce-based CSP with Next.js, framer-motion and
 * inline styles — is a change that can break the whole site, and it is worth far
 * less than the step this file just took: going from *no enforced policy* to
 * *an enforced one*. A policy with unsafe-inline still blocks every unlisted
 * origin, which is what stops an injected script from exfiltrating anywhere.
 * Tightening is the next move, not this one.
 *
 * Verified before enforcing: zero CSP violations across /, /courses, /pricing,
 * /subjects/[subject] and /about with the policy active locally, and those pages
 * reference no external origins at all (fonts are self-hosted via next/font).
 */
/**
 * Next.js hot reload runs over `ws://localhost:3000/_next/hmr`, and
 * `connect-src 'self'` does NOT reliably match a `ws:` scheme from an `http:`
 * page — browsers differ on it. Enforcing the policy therefore killed HMR the
 * moment the meta tag went in: the page still worked, but every edit required a
 * manual refresh.
 *
 * Production has no HMR socket, so this allowance is development-only and never
 * reaches sariro.com. Keeping the meta tag active in dev matters — a policy you
 * only see enforced in production is a policy you find out about from users.
 */
const DEV_CONNECT = process.env.NODE_ENV === 'development'
  ? ' ws://localhost:* http://localhost:*'
  : '';

export const CSP_DIRECTIVES = [
  "default-src 'self'",
  // Scripts: self, Razorpay checkout, and Google Identity Services.
  //
  // accounts.google.com was missing, and enforcing this policy therefore BROKE
  // "Sign in with Google" on both auth pages: the GSI script is injected at
  // runtime from accounts.google.com/gsi/client, the load was refused, and
  // `window.google` never existed — so the button silently never rendered.
  // It had worked until then only because Hostinger was stripping the CSP
  // entirely, which is the hazard of a policy that has never actually run.
  //
  // See the note above on 'unsafe-*'.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://cdn.razorpay.com https://accounts.google.com",
  // Styles: self + inline (Next.js and framer-motion both inject inline styles)
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com",
  // Images: self + data: (SVGs) + https (Razorpay logos, avatars) + blob:
  "img-src 'self' data: https: blob:",
  "font-src 'self' data: https://fonts.gstatic.com",
  // Connects: Supabase (REST + Realtime), Razorpay API, and the drei HDRI
  // assets the 3D scenes fetch — without the last one the homepage scenes
  // crash with a NetworkError.
  // *.razorpay.com, not just api — their checkout also calls
  // lumberjack.razorpay.com for telemetry, and enumerating a payment
  // provider's subdomains one CSP violation at a time is a losing game. We
  // already execute their script; allowing their own hosts to be talked to is
  // not a meaningful widening.
  `connect-src 'self' https://*.supabase.co https://*.razorpay.com wss://*.supabase.co https://accounts.google.com https://raw.githubusercontent.com${DEV_CONNECT}`,
  // Razorpay checkout opens in an iframe and moves between their own hosts.
  // Google One Tap renders its prompt in an iframe from accounts.google.com.
  "frame-src 'self' https://*.razorpay.com https://accounts.google.com",
  "form-action 'self' https://*.razorpay.com",
  "base-uri 'self'",
  "object-src 'none'",
];

export const CSP = CSP_DIRECTIVES.join('; ');
