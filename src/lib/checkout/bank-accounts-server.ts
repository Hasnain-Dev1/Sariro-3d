import {
  BANK_ACCOUNTS_KEY, BANK_ACCOUNTS_TAG, legacyBankAccount, parseStoredBankAccounts, type BankAccount,
} from './bank-accounts';

/**
 * SARIRO — reading the bank accounts, on the server
 * ============================================================================
 * SERVER ONLY: the service-role key. app_settings is not readable with the
 * public key in production (see lib/pricing/site-prices-server.ts), so the
 * bank-transfer page reads here and renders the accounts into its HTML.
 *
 * Cached for five minutes and refreshed at once when the editor saves
 * (revalidateTag). `fresh` is for the editor, which must show what is saved.
 *
 * `source` says where the list came from: the dashboard, the older
 * NEXT_PUBLIC_BANK_* variables, or nowhere — the page and the editor both
 * need to know which.
 */
export async function readBankAccounts(
  opts: { fresh?: boolean } = {}
): Promise<{ accounts: BankAccount[]; source: 'dashboard' | 'environment' | 'none' }> {
  const fallback = () => {
    const legacy = legacyBankAccount({
      name: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME,
      number: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER,
      bank: process.env.NEXT_PUBLIC_BANK_NAME,
      ifsc: process.env.NEXT_PUBLIC_BANK_IFSC,
      swift: process.env.NEXT_PUBLIC_BANK_SWIFT,
      upi: process.env.NEXT_PUBLIC_BANK_UPI,
    });
    return legacy ? { accounts: [legacy], source: 'environment' as const } : { accounts: [], source: 'none' as const };
  };

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !url.startsWith('http') || !key || key.startsWith('PUT_YOUR')) return fallback();

  try {
    const res = await fetch(`${url}/rest/v1/app_settings?select=value&key=eq.${BANK_ACCOUNTS_KEY}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      ...(opts.fresh ? { cache: 'no-store' as const } : { next: { revalidate: 300, tags: [BANK_ACCOUNTS_TAG] } }),
      signal: AbortSignal.timeout(4_000),
    });
    if (!res.ok) return fallback();
    const rows = (await res.json()) as { value: string | null }[];
    const accounts = parseStoredBankAccounts(rows[0]?.value);
    return accounts.length ? { accounts, source: 'dashboard' } : fallback();
  } catch {
    return fallback();
  }
}
