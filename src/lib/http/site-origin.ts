import type { NextRequest } from 'next/server';

/**
 * SARIRO — where this site actually lives, as far as a browser is concerned.
 *
 * ── Why this is not just `new URL(req.url).origin` ──────────────────────────
 * It was, and live families were sent to http://localhost:3000. Behind
 * Hostinger's proxy the app answers on localhost, so the request URL says
 * localhost, and anything built from it — a sign-in link, a button in an
 * email — points at the family's own machine, where nothing is listening.
 *
 * The order is deliberate:
 *   1. NEXT_PUBLIC_SITE_URL, if somebody set it. An explicit answer beats a
 *      guess, and it is the only one that survives a change of host.
 *   2. The forwarded host the proxy tells us about. This is what makes the bug
 *      stay fixed when nobody remembers to set the variable — and nobody has:
 *      it is absent from the environment as this is written.
 *   3. The request origin, which is right in development and is the last
 *      resort everywhere else.
 *
 * A localhost host in step 2 is ignored on purpose: in production it is the
 * proxy talking to itself, and in development step 3 gives the same answer.
 */
export function siteOrigin(req: NextRequest): string {
  const configured = (process.env.NEXT_PUBLIC_SITE_URL || '').trim().replace(/\/+$/, '');
  if (configured) return configured;

  const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
  if (host && !isLocal(host)) {
    const proto = (req.headers.get('x-forwarded-proto') || 'https').split(',')[0].trim();
    return `${proto}://${host}`;
  }

  return new URL(req.url).origin;
}

/** localhost, 127.x, or [::1] — with or without a port. */
export function isLocal(host: string): boolean {
  const raw = host.trim().toLowerCase();
  /* An IPv6 host is bracketed, and the address inside is full of the same
     colons a port is separated by — so the brackets have to be read first.
     Splitting on ':' regardless turns [::1]:3000 into an empty string, which
     matches nothing and quietly calls the loopback address a live site. */
  const name = raw.startsWith('[')
    ? raw.slice(1, raw.indexOf(']') === -1 ? raw.length : raw.indexOf(']'))
    : raw.split(':')[0];
  return name === 'localhost' || name === '::1' || /^127\./.test(name);
}
