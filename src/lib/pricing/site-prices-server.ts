import { DEFAULT_SITE_PRICES, type SitePrices } from '@/lib/school/pricing';
import { SITE_PRICE_KEYS, SITE_PRICES_TAG, sitePricesFromRows } from './site-prices';

/**
 * SARIRO — reading the website's live prices, on the server
 * ============================================================================
 * SERVER ONLY: uses the service-role key. Checked against production on
 * 15 Sep 2026 — app_settings does NOT let an anonymous visitor read it (the
 * anon key gets zero rows back, whatever settings-data.ts says), so a page
 * cannot read its own prices with the public key.
 *
 * Plain fetch rather than supabase-js, because fetch is what Next caches:
 *
 *   cached (default)  pages. Revalidated every five minutes, and at once when
 *                     a price is saved (the route calls revalidateTag), so a
 *                     page never needs a database round trip per visitor.
 *   fresh             create-order and the checkout page's check. The amount
 *                     charged is never a cached figure.
 *
 * Any failure — unset env, timeout, bad row — falls back to the defaults in
 * lib/school/pricing.ts rather than breaking a page that shows a price.
 */

export async function readSitePrices(opts: { fresh?: boolean } = {}): Promise<SitePrices> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !url.startsWith('http') || !key || key.startsWith('PUT_YOUR')) return DEFAULT_SITE_PRICES;

  const keys = Object.values(SITE_PRICE_KEYS).join(',');
  try {
    const res = await fetch(`${url}/rest/v1/app_settings?select=key,value&key=in.(${keys})`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      ...(opts.fresh ? { cache: 'no-store' as const } : { next: { revalidate: 300, tags: [SITE_PRICES_TAG] } }),
      signal: AbortSignal.timeout(4_000),
    });
    if (!res.ok) return DEFAULT_SITE_PRICES;
    return sitePricesFromRows((await res.json()) as { key: string; value: string | null }[]);
  } catch {
    return DEFAULT_SITE_PRICES;
  }
}
