/**
 * SARIRO — Charge currency safety
 * =========================================================
 * Exists because of a real, live defect:
 *
 *   The site displays $199. Checkout computed `199 * 100` and sent it to
 *   Razorpay with `currency: 'INR'` (the default, since RAZORPAY_CURRENCY was
 *   never set). The customer was charged **INR 199 — about $2.30** — for a $199
 *   course, and nothing anywhere compared the two.
 *
 * The root cause was not a wrong number. It was that a price was a **bare
 * number with no currency attached**, so no code could possibly notice the
 * mismatch. This module makes the currency explicit and makes a mismatch
 * impossible to ship silently.
 *
 * ── Fail closed, on purpose ────────────────────────────────────────────────
 * When the display currency and the charge currency disagree, checkout is
 * refused rather than guessed. A blocked sale costs one customer; a mis-charged
 * sale costs the revenue, the refund, the reconciliation and the trust — and it
 * runs undetected for as long as nobody happens to check a bank statement.
 */

/**
 * The currency every displayed price on the site is expressed in.
 *
 * All of them: the course tiers in `sariro-data.ts` ($199/$299/$699), the school
 * pricing in `lib/school/pricing.ts` ($9/class, $35/month), and anything stored
 * in `app_settings`. If this ever changes, every one of those must change with
 * it — which is precisely why it is one constant and not a guess per call site.
 */
export const DISPLAY_CURRENCY = 'USD';

/** ISO codes we are prepared to charge in. */
export const SUPPORTED_CURRENCIES = ['USD', 'INR'] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export interface CurrencyCheck {
  ok: boolean;
  chargeCurrency: string;
  displayCurrency: string;
  reason?: string;
}

/**
 * Verify the configured charge currency matches what the customer was shown.
 *
 * `chargeCurrency` comes from RAZORPAY_CURRENCY. It is **not** defaulted here:
 * a silent default is exactly how the original defect survived, so an unset
 * value is a failure, not a fallback.
 */
export function checkChargeCurrency(chargeCurrency: string | undefined): CurrencyCheck {
  const charge = (chargeCurrency ?? '').trim().toUpperCase();

  if (!charge) {
    return {
      ok: false,
      chargeCurrency: '',
      displayCurrency: DISPLAY_CURRENCY,
      reason:
        'RAZORPAY_CURRENCY is not set. Prices on the site are in ' +
        `${DISPLAY_CURRENCY}; refusing to guess a charge currency.`,
    };
  }

  if (!SUPPORTED_CURRENCIES.includes(charge as SupportedCurrency)) {
    return {
      ok: false,
      chargeCurrency: charge,
      displayCurrency: DISPLAY_CURRENCY,
      reason: `Unsupported charge currency "${charge}".`,
    };
  }

  if (charge !== DISPLAY_CURRENCY) {
    return {
      ok: false,
      chargeCurrency: charge,
      displayCurrency: DISPLAY_CURRENCY,
      reason:
        `Prices are displayed in ${DISPLAY_CURRENCY} but RAZORPAY_CURRENCY is ` +
        `${charge}. Charging ${charge} for a ${DISPLAY_CURRENCY} figure would bill ` +
        'the wrong amount. Set RAZORPAY_CURRENCY=' + DISPLAY_CURRENCY +
        `, or convert prices to ${charge} before charging.`,
    };
  }

  return { ok: true, chargeCurrency: charge, displayCurrency: DISPLAY_CURRENCY };
}

/**
 * A displayed price in the smallest unit of its own currency.
 *
 * Takes the currency explicitly so it cannot be called without the caller having
 * thought about which one applies. Both USD and INR use 100 minor units; the
 * parameter exists to force the question, not because the maths differs.
 */
export function toMinorUnits(displayPrice: number, currency: SupportedCurrency): number {
  if (!Number.isFinite(displayPrice) || displayPrice <= 0) {
    throw new Error(`Refusing to charge a non-positive price: ${displayPrice}`);
  }
  const minorPerUnit = currency === 'USD' || currency === 'INR' ? 100 : 100;
  return Math.round(displayPrice * minorPerUnit);
}
