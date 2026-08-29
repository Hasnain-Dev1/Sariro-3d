import type { NextConfig } from "next";

/**
 * SARIRO — Production security headers
 *
 * Returned via the `headers()` key so Next.js applies them to every
 * route. We allowlist specific origins for Google Fonts + Razorpay
 * checkout script + Supabase in the CSP.
 *
 * Notes on each header:
 *   - Content-Security-Policy: blocks inline scripts/styles except where
 *     explicitly allowed (Next.js needs 'unsafe-inline' for styles in
 *     dev, and unsafe-eval for hot-reload — we keep those for now to
 *     avoid breaking the site; tighten post-launch).
 *   - X-Frame-Options: DENY — prevents clickjacking via iframe embed.
 *   - X-Content-Type-Options: nosniff — blocks MIME-type sniffing.
 *   - Referrer-Policy: strict-origin-when-cross-origin — only send
 *     origin (not full path) on cross-origin requests.
 *   - Permissions-Policy: disables camera/mic/geolocation we don't use.
 *   - Strict-Transport-Security: enforces HTTPS for 2 years (only sent
 *     over HTTPS by browsers — safe to set even in dev).
 *
 * The CSP allows:
 *   - Razorpay checkout script (https://checkout.razorpay.com)
 *   - Razorpay API (https://api.razorpay.com)
 *   - Supabase (your-project.supabase.co — wildcard form since we
 *     don't know the exact project URL at build time)
 *   - Google Fonts (fonts.googleapis.com + fonts.gstatic.com)
 *   - framer-motion + Next.js inline styles via 'unsafe-inline'
 */

const csp = [
  "default-src 'self'",
  // Scripts: self + Razorpay checkout + inline (Next.js eval in dev)
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://cdn.razorpay.com",
  // Styles: self + inline (Next.js injects a lot of inline styles)
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  // Images: self + data: (SVGs) + https (Razorpay logos, etc.)
  "img-src 'self' data: https: blob:",
  // Fonts: self + Google Fonts
  "font-src 'self' data: https://fonts.gstatic.com",
  // Connects: self + Supabase + Razorpay API + drei HDRI assets
  //   (drei <Environment preset="..."> loads HDR files from
  //    raw.githubusercontent.com/pmndrs/drei-assets — without this,
  //    the 3D scenes crash with a NetworkError on the homepage.)
  "connect-src 'self' https://*.supabase.co https://api.razorpay.com wss://*.supabase.co https://raw.githubusercontent.com",
  // Frames: Razorpay checkout opens in an iframe
  "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com",
  // Form actions: self + Razorpay (legacy Payment Pages flow)
  "form-action 'self' https://api.razorpay.com https://checkout.razorpay.com",
  // Base + object: lock down
  "base-uri 'self'",
  "object-src 'none'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self), usb=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  // Cross-Origin policies — enable PWA / SharedArrayBuffer; safe defaults.
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
];

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    // Was `true`, which meant `next build` did not type-check at all — a type
    // error could reach production and the build would cheerfully say nothing.
    // The repo is at zero errors, so this is now enforced: a type error fails
    // the build instead of shipping.
    //
    // Only flippable while the count is zero. Left open, errors accumulate and
    // the window closes.
    ignoreBuildErrors: false,
  },
  reactStrictMode: false,
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
