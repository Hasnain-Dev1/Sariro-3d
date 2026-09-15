import { NextRequest, NextResponse } from 'next/server';
import { requireActor } from '@/lib/auth/actor';
import { loadPriceBook } from '@/lib/pricing/price-book-store';
import { sellerPriceList } from '@/lib/pricing/economics';

/**
 * SARIRO — GET /api/seller/prices
 * ============================================================================
 * The price list a seller quotes from: for every plan, the public price, the
 * normal offer, the closing offer and the lowest they may go. Nothing else.
 * No teacher cost, no CAC, no margin, and never the mathematical minimum —
 * a seller who knows the break-even number starts selling at it.
 *
 * Read from the same saved book HR and the super admin edit, so a change they
 * save is what every seller sees on their next load.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const gate = await requireActor(req, {
    bucket: 'seller-prices',
    limit: 120,
    allow: ['seller', 'super_admin', 'admin', 'hr'],
    skipOriginCheck: true,
  });
  if (!gate.ok) return gate.response;

  const loaded = await loadPriceBook(gate.actor.admin);
  return NextResponse.json(
    {
      ok: true,
      saved: loaded.saved,
      updatedAt: loaded.updatedAt,
      prices: sellerPriceList(loaded.book.inputs, loaded.book.ladder),
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
