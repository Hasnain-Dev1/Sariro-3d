import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { SITE_PRICES_TAG } from '@/lib/pricing/site-prices';
import { requireActor, readJson } from '@/lib/auth/actor';
import { loadPriceBook, priceBookHistory, savePriceBook } from '@/lib/pricing/price-book-store';

/**
 * SARIRO — the price book, for the people who set prices
 * ============================================================================
 * GET  /api/pricing/price-book   the assumptions, the ladder, the cohort model,
 *                                who saved it last and the last ten changes
 * PUT  /api/pricing/price-book   { book, note? }
 *
 * HR and the super admin only. Everything here — teacher cost, CAC, the
 * mathematical minimum — is internal; sellers get /api/seller/prices instead.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOW = ['super_admin', 'hr'] as const;

export async function GET(req: NextRequest) {
  const gate = await requireActor(req, { bucket: 'price-book-read', limit: 120, allow: [...ALLOW], skipOriginCheck: true });
  if (!gate.ok) return gate.response;
  const { admin } = gate.actor;

  const [loaded, history] = await Promise.all([loadPriceBook(admin), priceBookHistory(admin)]);
  return NextResponse.json({ ok: true, ...loaded, history }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PUT(req: NextRequest) {
  const gate = await requireActor(req, { bucket: 'price-book-save', limit: 30, allow: [...ALLOW] });
  if (!gate.ok) return gate.response;
  const { actor } = gate;

  const parsed = await readJson<{ book?: unknown; note?: string; website?: string }>(req);
  if (!parsed.ok) return parsed.response;
  if (!parsed.body.book) return NextResponse.json({ ok: false, error: 'missing_book' }, { status: 400 });

  const note = typeof parsed.body.note === 'string' ? parsed.body.note.trim() : null;
  const result = await savePriceBook(actor.admin, parsed.body.book, actor.id, note);
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.setup ? 'not_set_up' : 'save_failed', message: result.message },
      { status: result.setup ? 503 : 500 }
    );
  }

  /* The public prices in the book are the rupee prices on the website, so a
     save refreshes every cached page — the same as saving the dollar prices. */
  revalidateTag(SITE_PRICES_TAG, { expire: 0 });
  revalidatePath('/', 'layout');

  const [loaded, history] = await Promise.all([loadPriceBook(actor.admin), priceBookHistory(actor.admin)]);
  return NextResponse.json({ ok: true, ...loaded, history });
}
