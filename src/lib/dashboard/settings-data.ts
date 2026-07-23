/**
 * SARIRO — App settings data layer
 *
 * Backs the super-admin pricing/payment-link editor + any other
 * app-wide settings stored in the `app_settings` table (key/value).
 *
 * `app_settings` is a single-row-per-key table. RLS allows:
 *   - super_admins to read + write any key
 *   - everyone (incl. anon) to read — needed so the public pricing page
 *     can read live Razorpay links.
 *
 * supabase client is created INSIDE each function (not at module level)
 * to avoid SSR issues — createBrowserClient must run in the browser only.
 */

import { createClient } from '@/lib/supabase/client';
import { RAZORPAY_LINKS, RAZORPAY_LINKS_PREMIUM } from '@/lib/sariro-data';

/* ─────────────────────── Types ─────────────────────── */

export interface AppSettingRow {
  key: string;
  value: string;
  updated_at: string;
  updated_by: string | null;
}

export interface RazorpayLinkEntry {
  level: string;
  ratio: '1:4' | '1:1';
  url: string;
  /** True if the value comes from the DB (live override) vs. code default. */
  live: boolean;
}

export interface PriceEntry {
  level: string;
  ratio: '1:4' | '1:1';
  price: number;
  originalPrice?: number;
  /** True if the value comes from the DB (live override) vs. code default. */
  live: boolean;
}

/* Known setting keys — kept in sync with scripts/app-settings.sql. */
export const SETTING_KEYS = {
  razorpayLinks: 'razorpay_links',
  razorpayLinksPremium: 'razorpay_links_premium',
  elementaryPrice: 'price_elementary',
  beginnerPrice: 'price_beginner',
  intermediatePrice: 'price_intermediate',
  advancedPrice: 'price_advanced',
  elementaryPrice1on1: 'price_elementary_1on1',
  beginnerPrice1on1: 'price_beginner_1on1',
  intermediatePrice1on1: 'price_intermediate_1on1',
  advancedPrice1on1: 'price_advanced_1on1',
  elementaryOriginalPrice: 'price_elementary_original',
  beginnerOriginalPrice: 'price_beginner_original',
  intermediateOriginalPrice: 'price_intermediate_original',
  advancedOriginalPrice: 'price_advanced_original',
} as const;

/* Code-level defaults — returned when the DB has nothing stored yet so
   that the public pricing page works out of the box. */
export const DEFAULT_RAZORPAY_LINKS: Record<string, string> = { ...RAZORPAY_LINKS };
export const DEFAULT_RAZORPAY_LINKS_PREMIUM: Record<string, string> = { ...RAZORPAY_LINKS_PREMIUM };

const DEFAULT_PRICES: Record<string, number> = {
  [SETTING_KEYS.elementaryPrice]: 249,
  [SETTING_KEYS.beginnerPrice]: 199,
  [SETTING_KEYS.intermediatePrice]: 299,
  [SETTING_KEYS.advancedPrice]: 699,
  [SETTING_KEYS.elementaryPrice1on1]: 349,
  [SETTING_KEYS.beginnerPrice1on1]: 299,
  [SETTING_KEYS.intermediatePrice1on1]: 399,
  [SETTING_KEYS.advancedPrice1on1]: 899,
  [SETTING_KEYS.elementaryOriginalPrice]:498,
  [SETTING_KEYS.beginnerOriginalPrice]: 398,
  [SETTING_KEYS.intermediateOriginalPrice]: 854,
  [SETTING_KEYS.advancedOriginalPrice]: 2330,
};

const ALL_LEVELS = ['Elementary', 'Beginner', 'Intermediate', 'Advanced'];

/* ─────────────────────── fetchAllSettings ───────────────────────
   Returns every row from app_settings as a key→value map. */
export async function fetchAllSettings(): Promise<Record<string, string>> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value');

    if (error) throw error;
    const map: Record<string, string> = {};
    for (const row of data ?? []) {
      if (row && typeof row.key === 'string' && typeof row.value === 'string') {
        map[row.key] = row.value;
      }
    }
    return map;
  } catch (err) {
    console.warn('[settings] fetchAllSettings error:', err);
    return {};
  }
}

/* ─────────────────────── getSetting ───────────────────────
   Fetches a single setting by key. Returns `fallback` if missing. */
export async function getSetting(key: string, fallback = ''): Promise<string> {
  if (!key) return fallback;
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (error) throw error;
    if (!data) return fallback;
    return data.value ?? fallback;
  } catch (err) {
    console.warn('[settings] getSetting error:', err);
    return fallback;
  }
}

/* ─────────────────────── updateSetting ───────────────────────
   Upserts a single setting row. Server-side RLS will reject writes
   from non-super-admins — the function still returns success=false
   if the policy blocks it. */
export async function updateSetting(
  key: string,
  value: string
): Promise<{ success: boolean; error?: string }> {
  if (!key) return { success: false, error: 'Missing key' };
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key, value }, { onConflict: 'key' });

    if (error) throw error;
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.warn('[settings] updateSetting error:', err);
    return { success: false, error: msg };
  }
}

/* ─────────────────────── updateSettings ───────────────────────
   Bulk upsert. Wraps updateSetting in Promise.all — useful when saving
   the entire pricing editor form in one shot. */
export async function updateSettings(
  updates: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  if (!updates || Object.keys(updates).length === 0) {
    return { success: true };
  }
  try {
    const supabase = createClient();
    const rows = Object.entries(updates).map(([key, value]) => ({ key, value }));
    const { error } = await supabase
      .from('app_settings')
      .upsert(rows, { onConflict: 'key' });

    if (error) throw error;
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.warn('[settings] updateSettings error:', err);
    return { success: false, error: msg };
  }
}

/* ─────────────────────── fetchRazorpayLinks ───────────────────────
   Returns a flat list of Razorpay link entries (one per level × ratio).
   Merges live DB overrides on top of the code defaults. */
export async function fetchRazorpayLinks(): Promise<RazorpayLinkEntry[]> {
  const settings = await fetchAllSettings();

  const liveStandard = safeParseLinks(settings[SETTING_KEYS.razorpayLinks]);
  const livePremium = safeParseLinks(settings[SETTING_KEYS.razorpayLinksPremium]);

  return ALL_LEVELS.flatMap<RazorpayLinkEntry>((level) => [
    {
      level,
      ratio: '1:4',
      url: liveStandard[level] ?? DEFAULT_RAZORPAY_LINKS[level] ?? '',
      live: !!liveStandard[level],
    },
    {
      level,
      ratio: '1:1',
      url: livePremium[level] ?? DEFAULT_RAZORPAY_LINKS_PREMIUM[level] ?? '',
      live: !!livePremium[level],
    },
  ]);
}

/* ─────────────────────── fetchPrices ───────────────────────
   Returns a flat list of price entries (one per level × ratio).
   Merges live DB overrides on top of the code defaults. */
export async function fetchPrices(): Promise<PriceEntry[]> {
  const settings = await fetchAllSettings();

  const result: PriceEntry[] = [];
  for (const level of ALL_LEVELS) {
    const lower = level.toLowerCase();
    const stdKey = `price_${lower}` as keyof typeof SETTING_KEYS;
    const premKey = `price_${lower}_1on1` as keyof typeof SETTING_KEYS;
    const origKey = `price_${lower}_original` as keyof typeof SETTING_KEYS;

    const stdSetting = settings[SETTING_KEYS[stdKey]];
    const premSetting = settings[SETTING_KEYS[premKey]];
    const origSetting = settings[SETTING_KEYS[origKey]];

    const origValue = origSetting ? Number(origSetting) : DEFAULT_PRICES[SETTING_KEYS[origKey]];

    result.push({
      level,
      ratio: '1:4',
      price: stdSetting ? Number(stdSetting) : DEFAULT_PRICES[SETTING_KEYS[stdKey]],
      originalPrice: origValue,
      live: !!stdSetting,
    });
    result.push({
      level,
      ratio: '1:1',
      price: premSetting ? Number(premSetting) : DEFAULT_PRICES[SETTING_KEYS[premKey]],
      originalPrice: origValue,
      live: !!premSetting,
    });
  }
  return result;
}

/* ─────────────────────── Helpers ─────────────────────── */

function safeParseLinks(raw: string | undefined): Record<string, string> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const out: Record<string, string> = {};
      for (const [k, v] of Object.entries(parsed)) {
        if (typeof v === 'string') out[k] = v;
      }
      return out;
    }
  } catch {
    /* ignore malformed JSON */
  }
  return {};
}
