/**
 * SARIRO — where "?next=" may send somebody
 * ============================================================================
 * 17 Sep 2026: https://sariro.com/auth/callback?next=https://evil.example.com
 * answered 307 → evil.example.com. A link that starts on our own domain and
 * lands on a copy of our sign-in page is exactly what a phishing email wants.
 *
 * "next" is only ever a page on this site: a path that starts with one "/".
 * Everything else — another scheme, "//host", "/\host" (browsers read "\" as
 * "/"), control characters the URL parser strips into "//" — falls back.
 */

const PROBE = 'https://sariro.invalid';

export function safeNextPath(raw: string | null | undefined, fallback = '/dashboard'): string {
  if (!raw) return fallback;
  const value = raw.trim();
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback;
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    if (code < 0x20 || code === 0x7f) return fallback;
  }
  try {
    const url = new URL(value, PROBE);
    if (url.origin !== PROBE) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
