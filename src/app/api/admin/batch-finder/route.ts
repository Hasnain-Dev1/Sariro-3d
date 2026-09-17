import { NextRequest, NextResponse } from 'next/server';
import { requireActor } from '@/lib/auth/actor';
import { findStudents, loadBatchFinder } from '@/lib/scheduling/batch-finder-server';

/**
 * SARIRO — GET /api/admin/batch-finder
 * ============================================================================
 * Everything a scheduler needs to place a child, in one read (see
 * lib/scheduling/batch-finder.ts for why):
 *
 *   batches   every open batch — seats, roster, teacher, days, the lesson it is
 *             at, its next class and how many are left
 *   teachers  per course, the teachers trained to teach it and how busy they are
 *   waiting   children who need a batch: paid but not placed, or taken out of one
 *
 *   ?student=<id>  that child's position in each course, and which batches clash
 *                  with a class they already have
 *   ?find=<text>   look a child up by name, email or phone
 *
 * Admins, the super admin and HR. Filtering happens in the page: the lists are
 * small and a scheduler changes filters faster than a round trip.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const gate = await requireActor(req, { bucket: 'batch-finder', limit: 60, allow: ['admin', 'super_admin', 'hr'], skipOriginCheck: true });
  if (!gate.ok) return gate.response;
  const { admin } = gate.actor;
  const params = req.nextUrl.searchParams;

  const find = (params.get('find') ?? '').trim();
  if (find) {
    return NextResponse.json({ ok: true, found: await findStudents(admin, find) }, { headers: { 'Cache-Control': 'no-store' } });
  }

  try {
    const result = await loadBatchFinder(admin, params.get('student'));
    return NextResponse.json({ ok: true, ...result }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('[batch-finder]', err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false, error: 'db', message: 'Could not load batches.' }, { status: 500 });
  }
}
