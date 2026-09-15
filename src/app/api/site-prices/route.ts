import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { requireActor, readJson } from '@/lib/auth/actor';
import { bestEffort } from '@/lib/supabase/best-effort';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { readInrSitePrices, readSitePrices } from '@/lib/pricing/site-prices-server';
import { SITE_PRICES_TAG, sitePriceRows, validateSitePrices } from '@/lib/pricing/site-prices';

/**
 * SARIRO — the website's prices
 * ============================================================================
 * GET  /api/site-prices   anyone. The live figures, never cached — the checkout
 *                         page asks before it shows a Pay button, so what a
 *                         parent agrees to is what create-order will charge.
 * PUT  /api/site-prices   HR and the super admin. { groupMonthly, oneToOneMonthly,
 *                         quarterlyDiscount, fullDiscount }
 *
 * A save refreshes every cached page at once, so the site shows the new price
 * on the next visit rather than in five minutes.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = rateLimit({ key: `site-prices:${ip}`, limit: 60, windowMs: 60_000, ip });
  if (!rl.ok) return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429, headers: NO_STORE });
  const [prices, inr] = await Promise.all([readSitePrices({ fresh: true }), readInrSitePrices({ fresh: true })]);
  return NextResponse.json({ ok: true, prices, inr }, { headers: NO_STORE });
}

export async function PUT(req: NextRequest) {
  const gate = await requireActor(req, { bucket: 'site-prices-save', limit: 20, allow: ['super_admin', 'hr'] });
  if (!gate.ok) return gate.response;
  const { actor } = gate;

  const parsed = await readJson<{ prices?: unknown; website?: string }>(req);
  if (!parsed.ok) return parsed.response;

  const check = validateSitePrices(parsed.body.prices);
  if (!check.ok) return NextResponse.json({ ok: false, error: 'invalid', message: check.error }, { status: 400 });

  const before = await readSitePrices({ fresh: true });
  const now = new Date().toISOString();
  const { error } = await actor.admin
    .from('app_settings')
    .upsert(sitePriceRows(check.prices).map((r) => ({ ...r, updated_by: actor.id, updated_at: now })), { onConflict: 'key' });

  if (error) {
    console.warn('[site-prices] save failed:', error.code, error.message);
    return NextResponse.json({ ok: false, error: 'save_failed', message: 'The prices did not save. Nothing on the website changed.' }, { status: 500 });
  }

  await bestEffort(
    'site-prices: audit',
    actor.admin.from('admin_audit_logs').insert({
      admin_id: actor.id,
      action: 'site_prices_changed',
      target_type: 'site_prices',
      target_id: actor.id,
      metadata: { from: before, to: check.prices, by_role: actor.role },
    })
  );

  revalidateTag(SITE_PRICES_TAG, { expire: 0 });
  revalidatePath('/', 'layout');

  return NextResponse.json({ ok: true, prices: check.prices }, { headers: NO_STORE });
}
