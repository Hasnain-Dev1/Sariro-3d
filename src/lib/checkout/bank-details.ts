/**
 * SARIRO — bank details, shown only if they are real
 * =========================================================
 * The ask was: on bank transfer, either collect details in a form HR can see,
 * *or* show the account details on the spot. Both are built. Which one a buyer
 * gets is decided by whether the account details below are actually configured.
 *
 * ── Why they are not hardcoded ──────────────────────────────────────────────
 * I do not have Sariro's account details, and a plausible-looking account
 * number is far worse than no account number: it does not fail loudly, it sends
 * a customer's money somewhere else. So the direct-display path stays dark
 * until someone who knows the real values sets them.
 *
 * ── The trade to make knowingly ─────────────────────────────────────────────
 * Publishing account details on a public page is the fastest route to payment —
 * no human in the loop, no waiting, and the buyer can pay at 2am. It also means
 * anyone can read them, which invites two specific problems:
 *
 *   • Payments arrive with no reference and no record of who sent them, so
 *     reconciling a transfer to a student becomes manual detective work. The
 *     panel therefore always shows a reference and still offers the form.
 *   • Scraped account details get reused in impersonation scams ("pay Sariro
 *     here"), which is a reputational problem you find out about late.
 *
 * The form-only path avoids both at the cost of a delay. Neither is wrong;
 * it is a business call, which is why it is configuration rather than code.
 *
 * ── Setting it up ───────────────────────────────────────────────────────────
 * These are NEXT_PUBLIC_* because the panel renders in the browser. Anything
 * here is world-readable — put only details you are content to publish, never
 * a login, an API key, or anything that can move money out.
 *
 *   NEXT_PUBLIC_BANK_ACCOUNT_NAME    e.g. "Sariro Education Pvt Ltd"
 *   NEXT_PUBLIC_BANK_ACCOUNT_NUMBER
 *   NEXT_PUBLIC_BANK_NAME            e.g. "HDFC Bank, Bhubaneswar"
 *   NEXT_PUBLIC_BANK_IFSC            India
 *   NEXT_PUBLIC_BANK_SWIFT           international transfers
 *   NEXT_PUBLIC_BANK_UPI             e.g. "sariro@hdfcbank"
 *
 * Leave them unset and checkout keeps the form, which is the safe default.
 */

export interface BankDetails {
  accountName: string;
  accountNumber: string;
  bankName: string | null;
  ifsc: string | null;
  swift: string | null;
  upi: string | null;
}

const val = (v: string | undefined): string | null => {
  const t = (v ?? '').trim();
  return t.length > 0 ? t : null;
};

/**
 * The configured details, or null when the direct-display path is switched off.
 *
 * Requires BOTH an account name and a number: a number with no name is not
 * payable, and a name with no number is not a bank account. Anything less than
 * both means the form is the safer answer.
 */
export function getBankDetails(): BankDetails | null {
  const accountName = val(process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME);
  const accountNumber = val(process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER);
  if (!accountName || !accountNumber) return null;

  return {
    accountName,
    accountNumber,
    bankName: val(process.env.NEXT_PUBLIC_BANK_NAME),
    ifsc: val(process.env.NEXT_PUBLIC_BANK_IFSC),
    swift: val(process.env.NEXT_PUBLIC_BANK_SWIFT),
    upi: val(process.env.NEXT_PUBLIC_BANK_UPI),
  };
}

/**
 * A short, human-quotable reference the buyer puts on the transfer.
 *
 * Without one, an incoming payment is an amount and a stranger's name, and
 * matching it to an enrolment is guesswork. Derived from the product and a
 * timestamp so it is stable enough to read down a phone but unique enough to
 * search for.
 */
export function transferReference(productSlug: string, now: Date = new Date()): string {
  const slug = (productSlug || 'sariro')
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 6)
    .toUpperCase();
  // Day-of-year + minutes-of-day: short, and unlikely to collide for one buyer.
  const startOfYear = Date.UTC(now.getUTCFullYear(), 0, 1);
  const day = Math.floor((now.getTime() - startOfYear) / 86_400_000);
  const mins = now.getUTCHours() * 60 + now.getUTCMinutes();
  return `${slug}-${String(day).padStart(3, '0')}${String(mins).padStart(4, '0')}`;
}
