import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { requireActor, readJson } from '@/lib/auth/actor';
import { bestEffort } from '@/lib/supabase/best-effort';
import { readBankAccounts } from '@/lib/checkout/bank-accounts-server';
import { BANK_ACCOUNTS_KEY, BANK_ACCOUNTS_TAG, sanitizeBankAccounts } from '@/lib/checkout/bank-accounts';

/**
 * SARIRO — the bank accounts families pay into
 * ============================================================================
 * GET  /api/bank-accounts   super admin and HR — what is saved, for the editor.
 * PUT  /api/bank-accounts   super admin and HR — { accounts: BankAccount[] }
 *
 * The public page (/checkout/bank-transfer) reads them on the server and never
 * calls this. A save refreshes that page at once. Every save is audited with
 * the before and after, because an edited account number is the change that
 * most needs to be traceable.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE = { 'Cache-Control': 'no-store' };

export async function GET(req: NextRequest) {
  const gate = await requireActor(req, { bucket: 'bank-accounts-read', limit: 60, allow: ['super_admin', 'hr'], skipOriginCheck: true });
  if (!gate.ok) return gate.response;
  const { accounts, source } = await readBankAccounts({ fresh: true });
  return NextResponse.json({ ok: true, accounts, source }, { headers: NO_STORE });
}

export async function PUT(req: NextRequest) {
  const gate = await requireActor(req, { bucket: 'bank-accounts-save', limit: 20, allow: ['super_admin', 'hr'] });
  if (!gate.ok) return gate.response;
  const { actor } = gate;

  const parsed = await readJson<{ accounts?: unknown; website?: string }>(req);
  if (!parsed.ok) return parsed.response;

  const check = sanitizeBankAccounts(parsed.body.accounts);
  if (!check.ok) return NextResponse.json({ ok: false, error: 'invalid', message: check.error }, { status: 400 });

  const before = await readBankAccounts({ fresh: true });
  const { error } = await actor.admin.from('app_settings').upsert(
    { key: BANK_ACCOUNTS_KEY, value: JSON.stringify(check.accounts), updated_by: actor.id, updated_at: new Date().toISOString() },
    { onConflict: 'key' }
  );
  if (error) {
    console.warn('[bank-accounts] save failed:', error.code, error.message);
    return NextResponse.json({ ok: false, error: 'save_failed', message: 'The accounts did not save. Nothing on the website changed.' }, { status: 500 });
  }

  await bestEffort(
    'bank-accounts: audit',
    actor.admin.from('admin_audit_logs').insert({
      admin_id: actor.id,
      action: 'bank_accounts_changed',
      target_type: 'bank_accounts',
      target_id: actor.id,
      metadata: { from: before.source === 'dashboard' ? before.accounts : [], to: check.accounts, by_role: actor.role },
    })
  );

  revalidateTag(BANK_ACCOUNTS_TAG, { expire: 0 });
  revalidatePath('/checkout/bank-transfer');

  return NextResponse.json({ ok: true, accounts: check.accounts }, { headers: NO_STORE });
}
