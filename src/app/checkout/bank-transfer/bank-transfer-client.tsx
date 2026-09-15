'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Check, CheckCircle2, Copy, Globe2, Landmark, MapPin, MessageSquareText, ReceiptText, ShieldCheck,
} from 'lucide-react';
import { accountsForCountry, bankAccountRows, EVERY_OTHER_COUNTRY, type BankAccount } from '@/lib/checkout/bank-accounts';
import { transferReference } from '@/lib/checkout/bank-details';
import { COUNTRY_LIST, countryByCode, guessCountry } from '@/lib/phone/countries';

/**
 * SARIRO — the bank-transfer page, in the browser
 * ============================================================================
 * The accounts and the amount arrive from the server (page.tsx). What happens
 * here is only what needs a browser: guessing the country to start from,
 * letting the family change it, copying a detail, and the reference.
 */

export interface TransferItem {
  slug: string;
  tagline: string;
  scopeLabel: string;
  ratioLabel: string;
  ratio: string;
  cadence: string;
  dueToday: string;
  payments: number;
  lifetime: string;
  currency: string;
  accent: string;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1600);
        } catch { /* nothing to copy to — the value is on screen */ }
      }}
      aria-label={`Copy ${label}`}
      className={`shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-colors ${
        copied ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-slate-200 bg-white text-slate-400 hover:text-slate-700 hover:border-slate-300'
      }`}
    >
      {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function countriesLabel(a: BankAccount): string {
  return a.countries
    .map((c) => (c === EVERY_OTHER_COUNTRY ? 'All other countries' : countryByCode(c)?.name ?? c))
    .join(', ');
}

function AccountCard({ account, recommended }: { account: BankAccount; recommended: boolean }) {
  return (
    <div
      className="card-3d overflow-hidden"
      /* Inline: .card-3d's own shadow would paint over a ring utility. */
      style={recommended ? { borderColor: '#3B82F6', boxShadow: '0 0 0 1px #3B82F6, var(--card-shadow)' } : undefined}
    >
      <div className={`flex flex-wrap items-center gap-3 px-5 py-4 border-b ${recommended ? 'bg-blue-50/60 border-blue-100' : 'bg-slate-50/70 border-slate-100'}`}>
        <span className={`inline-flex w-10 h-10 items-center justify-center rounded-xl ${recommended ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 border border-slate-200'}`}>
          <Landmark className="w-5 h-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-extrabold text-slate-900 leading-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>{account.label}</p>
          <p className="text-[12px] text-slate-500 mt-0.5 flex items-center gap-1">
            <MapPin className="w-3 h-3 shrink-0" /> {countriesLabel(account)}
          </p>
        </div>
        <span className="rounded-full bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-black tracking-wider text-slate-700" style={{ fontFamily: 'var(--font-grotesk)' }}>
          {account.currency}
        </span>
        {recommended && (
          <span className="w-full sm:w-auto inline-flex items-center gap-1 text-[11px] font-bold text-blue-700" style={{ fontFamily: 'var(--font-grotesk)' }}>
            <CheckCircle2 className="w-3.5 h-3.5" /> Recommended for you
          </span>
        )}
      </div>
      <dl className="divide-y divide-slate-100">
        {bankAccountRows(account).map((row) => (
          <div key={row.label} className="flex items-center gap-3 px-5 py-2.5">
            <dt className="w-32 shrink-0 text-[12px] font-semibold text-slate-500">{row.label}</dt>
            <dd className="flex-1 min-w-0 text-[14px] font-bold text-slate-900 break-all tabular-nums">{row.value}</dd>
            <CopyButton value={row.value} label={row.label} />
          </div>
        ))}
      </dl>
      {account.note && (
        <p className="px-5 py-3 text-[12.5px] text-amber-900 bg-amber-50 border-t border-amber-100 leading-relaxed">{account.note}</p>
      )}
    </div>
  );
}

export default function BankTransferClient({
  accounts,
  item,
  checkoutHref,
}: {
  accounts: BankAccount[];
  item: TransferItem | null;
  checkoutHref: string;
}) {
  /* Both start after mount. The country comes from the browser's time zone,
     and the reference embeds the current minute — computed during render, the
     server's minute and the browser's disagree and hydration fails. Made once
     and kept, so it never changes while a family is copying it into their
     banking app. */
  const [country, setCountry] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const slug = item?.slug ?? '';
  useEffect(() => {
    let guess = '';
    try { guess = guessCountry(Intl.DateTimeFormat().resolvedOptions().timeZone); } catch { /* none */ }
    const id = setTimeout(() => {
      setCountry((c) => c || guess);
      setReference((r) => r || transferReference(slug));
    }, 0);
    return () => clearTimeout(id);
  }, [slug]);

  const { recommended, others } = useMemo(() => accountsForCountry(accounts, country), [accounts, country]);
  const countryName = countryByCode(country)?.name ?? null;

  const paidHref =
    `/contact?intent=bank-transfer&paid=1&ref=${encodeURIComponent(reference)}` +
    (item ? `&product=${encodeURIComponent(item.slug)}&scope=${encodeURIComponent(item.scopeLabel)}&pay=${encodeURIComponent(item.cadence)}&ratio=${encodeURIComponent(item.ratio)}` : '');
  const requestHref =
    `/contact?intent=bank-transfer` +
    (item ? `&product=${encodeURIComponent(item.slug)}&scope=${encodeURIComponent(item.scopeLabel)}&pay=${encodeURIComponent(item.cadence)}&ratio=${encodeURIComponent(item.ratio)}` : '');

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-20">
      <Link href={checkoutHref} className="flex w-fit items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 transition mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to checkout
      </Link>

      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-600 mb-2" style={{ fontFamily: 'var(--font-grotesk)' }}>
        Checkout · Bank transfer
      </p>
      <h1 className="text-[2rem] sm:text-[2.6rem] font-extrabold tracking-[-0.02em] text-slate-900 leading-[1.1]" style={{ fontFamily: 'var(--font-jakarta)' }}>
        Pay by bank transfer
      </h1>
      <p className="mt-3 text-[15px] text-slate-600 max-w-2xl leading-relaxed">
        Transfer to the account for your country and quote your reference. We match your payment and confirm your seat
        within one working day.
      </p>

      <div className="mt-8 grid lg:grid-cols-[1fr_340px] gap-6 items-start">
        <div className="space-y-6 min-w-0">
          {/* ── Where they are paying from ─────────────────────────────── */}
          <div className="card-3d p-5 flex flex-wrap items-center gap-3">
            <span className="inline-flex w-10 h-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <Globe2 className="w-5 h-5" />
            </span>
            <div className="flex-1 min-w-[10rem]">
              <label htmlFor="pay-from" className="block text-[10px] font-bold uppercase tracking-wider text-slate-500" style={{ fontFamily: 'var(--font-grotesk)' }}>
                Paying from
              </label>
              <p className="text-[13px] text-slate-600">We show the account that avoids international fees first.</p>
            </div>
            <select
              id="pay-from"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="h-11 min-w-[12rem] max-w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="">Choose your country</option>
              {COUNTRY_LIST.map((c) => (
                <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
              ))}
            </select>
          </div>

          {accounts.length === 0 ? (
            <div className="card-3d p-6 sm:p-8 text-center">
              <span className="inline-flex w-12 h-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 mb-4">
                <Landmark className="w-6 h-6" />
              </span>
              <h2 className="text-xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>We send bank details on request</h2>
              <p className="mt-2 text-[14px] text-slate-600 max-w-md mx-auto leading-relaxed">
                Tell us where you are paying from and we will send the right account and a reference — usually the same day.
              </p>
              <Link href={requestHref} className="btn-tactile btn-tactile-primary mt-6 h-12 px-6 text-[15px]">
                <MessageSquareText className="w-4 h-4" /> Request bank details
              </Link>
            </div>
          ) : (
            <>
              {recommended.length > 0 && (
                <section>
                  <h2 className="text-[13px] font-black uppercase tracking-wider text-slate-500 mb-3" style={{ fontFamily: 'var(--font-grotesk)' }}>
                    {countryName ? `For payments from ${countryName}` : 'Recommended account'}
                  </h2>
                  <div className="space-y-4">
                    {recommended.map((a) => <AccountCard key={a.id} account={a} recommended />)}
                  </div>
                </section>
              )}
              {others.length > 0 && (
                <section>
                  <h2 className="text-[13px] font-black uppercase tracking-wider text-slate-500 mb-3" style={{ fontFamily: 'var(--font-grotesk)' }}>
                    {recommended.length ? 'Other accounts' : 'Our bank accounts'}
                  </h2>
                  <div className="space-y-4">
                    {others.map((a) => <AccountCard key={a.id} account={a} recommended={false} />)}
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        {/* ── What they are paying, and what to do ─────────────────────── */}
        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="card-3d p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500" style={{ fontFamily: 'var(--font-grotesk)' }}>Amount due today</p>
            {item ? (
              <>
                <p className="mt-1 text-3xl font-extrabold text-slate-900 tabular-nums" style={{ fontFamily: 'var(--font-jakarta)' }}>{item.dueToday}</p>
                <p className="mt-2 text-[14px] font-bold text-slate-800 leading-snug">{item.tagline}</p>
                <p className="text-[12.5px] text-slate-500">{item.scopeLabel} · {item.ratioLabel}</p>
                <p className="mt-2 text-[12px] text-slate-500">
                  {item.payments > 1 ? `${item.payments} payments · ${item.lifetime} in total` : 'One payment'}
                </p>
              </>
            ) : (
              <p className="mt-1 text-[13.5px] text-slate-600">The amount quoted at checkout, or on your invoice.</p>
            )}

            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800" style={{ fontFamily: 'var(--font-grotesk)' }}>Your payment reference</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="flex-1 text-lg font-black tracking-wide text-amber-950 tabular-nums">{reference || '…'}</span>
                {reference && <CopyButton value={reference} label="reference" />}
              </div>
              <p className="mt-1 text-[11.5px] text-amber-900/80 leading-snug">Put this in the transfer’s reference or remarks box.</p>
            </div>
          </div>

          <div className="card-3d p-5">
            <ol className="space-y-3">
              {[
                { icon: Landmark, text: 'Transfer the amount to the account for your country.' },
                { icon: ReceiptText, text: 'Quote your reference so we can match the payment.' },
                { icon: ShieldCheck, text: 'Tell us you have paid — we confirm your seat within one working day.' },
              ].map((s, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="inline-flex w-6 h-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white text-[11px] font-black">{i + 1}</span>
                  <span className="text-[13px] text-slate-700 leading-snug">{s.text}</span>
                </li>
              ))}
            </ol>
            <Link href={paidHref} className="btn-tactile btn-tactile-primary mt-5 w-full h-12 text-[15px]">
              <CheckCircle2 className="w-4 h-4" /> I have made the transfer
            </Link>
            <p className="mt-3 text-[11.5px] text-slate-500 leading-snug text-center">
              Prefer to pay instantly? <Link href={checkoutHref} className="font-bold text-blue-600 hover:text-blue-700">Pay by card or UPI</Link>
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
