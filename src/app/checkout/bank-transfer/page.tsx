import type { Metadata } from 'next';
import BrandLayout from '@/components/brand/brand-layout';
import BankTransferClient from './bank-transfer-client';
import { readBankAccounts } from '@/lib/checkout/bank-accounts-server';
import { readInrSitePrices, readSitePrices } from '@/lib/pricing/site-prices-server';
import { resolveCheckoutItem } from '@/lib/checkout/resolve';
import type { Cadence } from '@/lib/school/pricing';

/**
 * SARIRO — /checkout/bank-transfer
 * ============================================================================
 * Every bank account a family can pay into, with the one for their country
 * first (lib/checkout/bank-accounts.ts). Reached from checkout's "Bank
 * transfer", carrying the same query string, so the amount due is priced here
 * from the live prices exactly as checkout priced it — never read from the URL.
 *
 * The accounts are rendered on the server: app_settings is not readable with
 * the public key. `noindex`, like checkout: account details belong in front of
 * a buyer, not in search results.
 */

export const metadata: Metadata = {
  title: 'Pay by bank transfer — Sariro',
  robots: { index: false, follow: false },
};

type Search = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? null;

export default async function BankTransferPage({ searchParams }: { searchParams: Promise<Search> }) {
  const q = await searchParams;
  const [{ accounts }, prices, inr] = await Promise.all([readBankAccounts(), readSitePrices(), readInrSitePrices()]);

  const item = resolveCheckoutItem(
    {
      course: one(q.course),
      subject: one(q.subject),
      focus: one(q.focus),
      grade: one(q.grade),
      scope: one(q.scope),
      ratio: one(q.ratio) === '1:1' ? '1:1' : '1:4',
      cadence: ((one(q.pay) as Cadence | null) ?? 'monthly'),
      band: one(q.band),
    },
    prices,
    { currency: one(q.currency) === 'INR' ? 'INR' : 'USD', inr }
  );

  const query = new URLSearchParams();
  for (const k of ['course', 'subject', 'focus', 'grade', 'scope', 'ratio', 'pay', 'currency', 'band']) {
    const v = one(q[k]);
    if (v) query.set(k, v);
  }

  return (
    <BrandLayout>
      <BankTransferClient
        accounts={accounts}
        checkoutHref={`/checkout?${query.toString()}`}
        item={
          item
            ? {
                slug: item.slug,
                tagline: item.tagline,
                scopeLabel: item.scopeLabel,
                ratioLabel: one(q.ratio) === '1:1' ? 'One to one' : 'Small batch of 4',
                cadence: one(q.pay) ?? 'monthly',
                ratio: one(q.ratio) === '1:1' ? '1:1' : '1:4',
                dueToday: item.perPaymentFormatted,
                payments: item.payments,
                lifetime: item.lifetimeFormatted,
                currency: item.currency,
                accent: item.accent,
              }
            : null
        }
      />
    </BrandLayout>
  );
}
