/**
 * SARIRO — the bank accounts a family can pay into, by country
 * ============================================================================
 * Checkout's bank-transfer page lists every account Sariro takes transfers
 * into, and puts the one for the buyer's country first — an Indian family pays
 * the rupee account by IFSC or UPI, a family in the UK the account with a sort
 * code, anybody else the international (SWIFT) account.
 *
 * ── Where the accounts come from ────────────────────────────────────────────
 * The super admin and HR enter them in the dashboard (Bank accounts), stored
 * as one JSON value in app_settings under `bank_accounts`. Nothing here is
 * invented: an account number that is plausible and wrong sends a family's
 * money somewhere else, so with no account entered the page says so and
 * offers to send the details instead. The older single account in the
 * NEXT_PUBLIC_BANK_* variables (lib/checkout/bank-details.ts) still shows if
 * nothing has been entered in the dashboard.
 *
 * Pure, so the page, the editor and the save route agree on what a valid
 * account is.
 */

export interface BankAccount {
  /** Stable key, e.g. 'india-inr'. */
  id: string;
  /** What the family sees as the heading, e.g. "India — rupee account". */
  label: string;
  /** ISO country codes this account is for. '*' means every other country. */
  countries: string[];
  /** 'INR', 'USD', 'GBP' … */
  currency: string;
  accountName: string;
  accountNumber: string | null;
  iban: string | null;
  bankName: string | null;
  branch: string | null;
  ifsc: string | null;
  swift: string | null;
  routingNumber: string | null;
  sortCode: string | null;
  upi: string | null;
  /** Anything the family must know, e.g. "Transfers in GBP only". */
  note: string | null;
}

export const BANK_ACCOUNTS_KEY = 'bank_accounts';
export const BANK_ACCOUNTS_TAG = 'bank-accounts';
export const EVERY_OTHER_COUNTRY = '*';
export const MAX_BANK_ACCOUNTS = 20;

const OPTIONAL_FIELDS = ['accountNumber', 'iban', 'bankName', 'branch', 'ifsc', 'swift', 'routingNumber', 'sortCode', 'upi', 'note'] as const;

const text = (v: unknown, max: number): string | null => {
  if (typeof v !== 'string') return null;
  const t = v.replace(/\s+/g, ' ').trim().slice(0, max);
  return t.length ? t : null;
};

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

/** One account from untrusted input, or the reason it is not one. */
export function sanitizeBankAccount(raw: unknown, index = 0): { ok: true; account: BankAccount } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object') return { ok: false, error: `Account ${index + 1} is empty.` };
  const r = raw as Record<string, unknown>;
  const accountName = text(r.accountName, 120);
  const label = text(r.label, 80);
  const which = label ?? `Account ${index + 1}`;
  if (!accountName) return { ok: false, error: `${which}: enter the account holder’s name.` };

  const countries = [...new Set(
    (Array.isArray(r.countries) ? r.countries : String(r.countries ?? '').split(/[\s,]+/))
      .map((c) => String(c).trim().toUpperCase())
      .filter(Boolean)
  )];
  if (countries.length === 0) return { ok: false, error: `${which}: choose the countries it is for, or every other country.` };
  const badCountry = countries.find((c) => c !== EVERY_OTHER_COUNTRY && !/^[A-Z]{2}$/.test(c));
  if (badCountry) return { ok: false, error: `${which}: “${badCountry}” is not a two-letter country code.` };

  const currency = (text(r.currency, 3) ?? '').toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) return { ok: false, error: `${which}: the currency is a three-letter code, like INR or USD.` };

  const account: BankAccount = {
    id: text(r.id, 40) ? slug(String(r.id)) : slug(`${label ?? accountName}-${currency}`) || `account-${index + 1}`,
    label: label ?? `${currency} account`,
    countries,
    currency,
    accountName,
    accountNumber: null, iban: null, bankName: null, branch: null, ifsc: null,
    swift: null, routingNumber: null, sortCode: null, upi: null, note: null,
  };
  for (const f of OPTIONAL_FIELDS) account[f] = text(r[f], f === 'note' ? 240 : 80);

  if (!account.accountNumber && !account.iban && !account.upi) {
    return { ok: false, error: `${which}: enter an account number, an IBAN or a UPI ID — something a family can pay into.` };
  }
  return { ok: true, account };
}

/** The editor's save: every account valid, or the first reason one is not. */
export function sanitizeBankAccounts(raw: unknown): { ok: true; accounts: BankAccount[] } | { ok: false; error: string } {
  if (!Array.isArray(raw)) return { ok: false, error: 'Send a list of accounts.' };
  if (raw.length > MAX_BANK_ACCOUNTS) return { ok: false, error: `At most ${MAX_BANK_ACCOUNTS} accounts.` };
  const accounts: BankAccount[] = [];
  const ids = new Set<string>();
  for (let i = 0; i < raw.length; i++) {
    const one = sanitizeBankAccount(raw[i], i);
    if (!one.ok) return one;
    let id = one.account.id;
    for (let n = 2; ids.has(id); n++) id = `${one.account.id}-${n}`;
    ids.add(id);
    accounts.push({ ...one.account, id });
  }
  return { ok: true, accounts };
}

/** What is stored, read leniently: a broken row is dropped, never shown half-right. */
export function parseStoredBankAccounts(value: string | null | undefined): BankAccount[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((a, i) => sanitizeBankAccount(a, i))
      .flatMap((r) => (r.ok ? [r.account] : []))
      .slice(0, MAX_BANK_ACCOUNTS);
  } catch {
    return [];
  }
}

/**
 * The accounts for this country first, then the rest. An account naming the
 * country beats one for "every other country"; with no country known, the
 * list is left in the order it was entered.
 */
export function accountsForCountry(
  accounts: readonly BankAccount[],
  country: string | null | undefined
): { recommended: BankAccount[]; others: BankAccount[] } {
  const code = (country ?? '').trim().toUpperCase();
  if (!code) return { recommended: [], others: [...accounts] };
  let recommended = accounts.filter((a) => a.countries.includes(code));
  if (recommended.length === 0) recommended = accounts.filter((a) => a.countries.includes(EVERY_OTHER_COUNTRY));
  const chosen = new Set(recommended.map((a) => a.id));
  return { recommended, others: accounts.filter((a) => !chosen.has(a.id)) };
}

/** The rows a family copies from, in the order a bank app asks for them. */
export function bankAccountRows(a: BankAccount): { label: string; value: string }[] {
  const rows: [string, string | null][] = [
    ['Account name', a.accountName],
    ['Account number', a.accountNumber],
    ['IBAN', a.iban],
    ['IFSC', a.ifsc],
    ['Sort code', a.sortCode],
    ['Routing number', a.routingNumber],
    ['SWIFT / BIC', a.swift],
    ['Bank', a.bankName],
    ['Branch', a.branch],
    ['UPI ID', a.upi],
  ];
  return rows.flatMap(([label, value]) => (value ? [{ label, value }] : []));
}

/** The older single account from NEXT_PUBLIC_BANK_*, shaped like the rest. */
export function legacyBankAccount(env: {
  name?: string; number?: string; bank?: string; ifsc?: string; swift?: string; upi?: string;
}): BankAccount | null {
  const r = sanitizeBankAccount({
    id: 'sariro',
    label: 'Sariro bank account',
    countries: [EVERY_OTHER_COUNTRY],
    currency: env.ifsc || env.upi ? 'INR' : 'USD',
    accountName: env.name,
    accountNumber: env.number,
    bankName: env.bank,
    ifsc: env.ifsc,
    swift: env.swift,
    upi: env.upi,
  });
  return r.ok ? r.account : null;
}
