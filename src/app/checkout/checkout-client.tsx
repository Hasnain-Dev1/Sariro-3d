'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, CalendarRange, Check, CreditCard, Landmark, Loader2, Lock, ShieldCheck, User, Users,
} from 'lucide-react';
import { RazorpayCheckoutButton } from '@/components/auth/razorpay-checkout';
import { resolveCheckoutItem, type CheckoutItem } from '@/lib/checkout/resolve';
import type { LearningRatio } from '@/lib/sariro-data';
import { type Cadence, type SitePrices } from '@/lib/school/pricing';
import { useDisplayCurrency, useInrPrices, useSitePrices } from '@/components/pricing/site-prices-provider';
import CurrencySwitch from '@/components/pricing/currency-switch';
import { useAuth } from '@/components/auth/auth-provider';
import { INR_PHONE_MESSAGE, isIndianPhone, type InrPlanPrices } from '@/lib/pricing/inr-site';

/**
 * SARIRO — the one checkout
 * =========================================================
 * Every product Sariro sells ends here: coding tracks, school subjects by grade
 * or by group, and focus courses. One page, one payment path, one place to fix
 * anything that goes wrong.
 *
 * What changed by merging, beyond having half as much code:
 *
 *   • Coding used to pay through a STATIC Razorpay link with a hard-coded
 *     amount, so the displayed price and the charged price were two independent
 *     facts that could drift. Everything now goes through `create-order`, which
 *     prices on the server — the client never sends an amount.
 *   • School buyers could pay by bank transfer; coding buyers could not, for no
 *     reason other than which page they landed on. Now both can.
 *   • The 1:4 / 1:1 choice was only on the coding page. It applies to school
 *     subjects too, and now appears wherever it is real.
 *
 * The one thing NOT unified is the cadence control, because the underlying
 * products genuinely differ: a coding cohort is a single payment, school is
 * paid over time. `item.offersCadence` says which, and the summary shows "One
 * payment" rather than inventing an instalment plan that billing cannot honour.
 *
 * ── The look (15 Sep 2026) ──────────────────────────────────────────────────
 * Rebuilt in the dashboard's language — numbered step cards, choice tiles that
 * show what each choice costs, and the order summary holding the one action —
 * after the founder called the old page cheap. The Pay button had also lost its
 * styling: a `className` of just "w-full" replaced the tactile-button classes,
 * leaving a flat blue block with its icons stacked.
 *
 * Bank transfer now goes to its own page (/checkout/bank-transfer), which lists
 * every account with the one for the buyer's country first.
 */

type Method = 'card' | 'bank';

const CADENCES: { value: Cadence; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Every 3 months' },
  { value: 'full', label: 'Pay in full' },
];

function Step({ n, title, hint, children }: { n: number; title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="card-3d p-5 sm:p-6">
      <div className="flex items-start gap-3 mb-4">
        <span
          className="inline-flex w-7 h-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white text-[12px] font-black"
          style={{ fontFamily: 'var(--font-grotesk)' }}
        >
          {n}
        </span>
        <div className="min-w-0">
          <h2 className="text-[17px] font-extrabold text-slate-900 leading-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>
            {title}
          </h2>
          {hint && <p className="text-[13px] text-slate-500 mt-0.5">{hint}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function Choice({
  selected, onClick, icon, title, detail, price, badge, accent,
}: {
  selected: boolean;
  onClick: () => void;
  icon?: ReactNode;
  title: string;
  detail?: string;
  price?: string | null;
  badge?: string | null;
  accent: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`relative w-full h-full text-left rounded-2xl border-2 bg-white p-4 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
        selected ? 'shadow-[0_10px_28px_-14px_rgba(15,23,42,0.35)]' : 'border-slate-200 hover:border-slate-300'
      }`}
      style={selected ? { borderColor: accent } : undefined}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <span
            className={`inline-flex w-10 h-10 shrink-0 items-center justify-center rounded-xl ${selected ? '' : 'bg-slate-100 text-slate-500'}`}
            style={selected ? { background: `${accent}18`, color: accent } : undefined}
          >
            {icon}
          </span>
        )}
        <div className="flex-1 min-w-0">
          <span className="block font-bold text-slate-900 text-[15px] leading-snug" style={{ fontFamily: 'var(--font-jakarta)' }}>
            {title}
          </span>
          {detail && <span className="block text-[12.5px] text-slate-500 mt-0.5 leading-snug">{detail}</span>}
        </div>
        <span
          className={`inline-flex w-5 h-5 shrink-0 items-center justify-center rounded-full border-2 ${selected ? 'text-white' : 'border-slate-300'}`}
          style={selected ? { background: accent, borderColor: accent } : undefined}
          aria-hidden
        >
          {selected && <Check className="w-3 h-3" strokeWidth={3} />}
        </span>
      </div>
      {(price || badge) && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          {price && <span className="text-[14px] font-extrabold text-slate-900 tabular-nums">{price}</span>}
          {badge && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">{badge}</span>
          )}
        </div>
      )}
    </button>
  );
}

export default function CheckoutClient() {
  const params = useSearchParams();
  const [method, setMethod] = useState<Method>('card');
  const [ratio, setRatio] = useState<LearningRatio>(
    params.get('ratio') === '1:1' ? '1:1' : '1:4'
  );
  const [cadence, setCadence] = useState<Cadence>(
    (params.get('pay') as Cadence) || 'monthly'
  );

  /* The page's prices can be up to five minutes old (they are cached with the
     page). The amount charged never is — create-order reads them fresh — so
     the checkout asks for the live figures too, and the Pay button always
     shows what will actually be charged, even straight after HR changes it. */
  const pagePrices = useSitePrices();
  const pageInr = useInrPrices();
  const { currency, setCurrency } = useDisplayCurrency();
  const { user, profile } = useAuth();
  const [livePrices, setLivePrices] = useState<SitePrices>(pagePrices);
  const [liveInr, setLiveInr] = useState<InrPlanPrices>(pageInr);
  useEffect(() => {
    let live = true;
    fetch('/api/site-prices', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => {
        if (!live || !j?.ok) return;
        if (j.prices) setLivePrices(j.prices as SitePrices);
        if (j.inr) setLiveInr(j.inr as InrPlanPrices);
      })
      .catch(() => { /* the page's prices stand */ });
    return () => { live = false; };
  }, []);

  /* What each choice would cost, so a tile can say it. Priced by the same
     resolver as the item itself — the numbers cannot disagree. */
  const priced = useMemo(() => {
    const base = {
      course: params.get('course'),
      subject: params.get('subject'),
      focus: params.get('focus'),
      grade: params.get('grade'),
      scope: params.get('scope'),
    };
    const at = (r: LearningRatio, c: Cadence): CheckoutItem | null =>
      resolveCheckoutItem({ ...base, ratio: r, cadence: c }, livePrices, { currency, inr: liveInr });
    return {
      item: at(ratio, cadence),
      ratios: { '1:4': at('1:4', cadence), '1:1': at('1:1', cadence) } as Record<LearningRatio, CheckoutItem | null>,
      cadences: Object.fromEntries(CADENCES.map((c) => [c.value, at(ratio, c.value)])) as Record<Cadence, CheckoutItem | null>,
    };
  }, [params, ratio, cadence, livePrices, currency, liveInr]);
  const item = priced.item;

  if (!item) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="card-3d p-8 text-center">
          <h1 className="text-2xl font-extrabold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>
            We couldn&apos;t find that course
          </h1>
          <p className="text-slate-600 mb-8">
            The link may be out of date. Pick a subject and we will bring you straight back here.
          </p>
          <Link href="/courses#learn" className="btn-tactile btn-tactile-primary h-12 px-6 text-[15px]">
            Browse everything we teach <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  /* The same product, priced the same way, on the bank-transfer page. */
  const transferQuery = new URLSearchParams();
  for (const k of ['course', 'subject', 'focus', 'grade', 'scope'] as const) {
    const v = params.get(k);
    if (v) transferQuery.set(k, v);
  }
  transferQuery.set('ratio', ratio);
  transferQuery.set('pay', cadence);
  transferQuery.set('currency', item.currency);
  const bankHref = `/checkout/bank-transfer?${transferQuery.toString()}`;

  const needsIndianNumber = method === 'card' && item.currency === 'INR' && !!user && !isIndianPhone(profile?.phone);
  const accent = item.accent;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-20">
      <Link
        href={item.backHref}
        className="flex w-fit items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 transition mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {item.name}
      </Link>

      <p
        className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-blue-600 mb-2"
        style={{ fontFamily: 'var(--font-grotesk)' }}
      >
        <Lock className="w-3.5 h-3.5" /> Secure checkout
      </p>
      <h1
        className="text-[2rem] sm:text-[2.6rem] font-extrabold tracking-[-0.02em] text-slate-900 leading-[1.1]"
        style={{ fontFamily: 'var(--font-jakarta)' }}
      >
        Complete your enrolment
      </h1>
      <p className="mt-3 text-[15px] text-slate-600 max-w-2xl leading-relaxed">
        Choose how you learn and how you pay. The full total is shown before you pay.
      </p>

      <div className="mt-8 grid lg:grid-cols-[1fr_380px] gap-6 items-start">
        <div className="space-y-5 min-w-0">
          {/* ── 1. class size ─────────────────────────────────────────── */}
          <Step n={1} title="How would you like to learn?">
            <div className="grid sm:grid-cols-2 gap-3">
              {(['1:4', '1:1'] as const).map((r) => (
                <Choice
                  key={r}
                  selected={ratio === r}
                  onClick={() => setRatio(r)}
                  accent={accent}
                  icon={r === '1:4' ? <Users className="w-5 h-5" /> : <User className="w-5 h-5" />}
                  title={r === '1:4' ? 'Small batch of four' : 'One to one'}
                  detail={r === '1:4' ? 'Learn alongside three others.' : 'The mentor’s full attention, paced to you.'}
                  price={priced.ratios[r]?.perPaymentFormatted ?? null}
                  badge={r === '1:4' ? 'Best value' : null}
                />
              ))}
            </div>
          </Step>

          {/* ── 2. cadence, only where it is real ─────────────────────── */}
          {item.offersCadence && (
            <Step n={2} title="How would you like to spread it?" hint="Same classes, whichever you pick.">
              <div className="grid sm:grid-cols-3 gap-3">
                {CADENCES.map((c) => {
                  const option = priced.cadences[c.value];
                  return (
                    <Choice
                      key={c.value}
                      selected={cadence === c.value}
                      onClick={() => setCadence(c.value)}
                      accent={accent}
                      title={c.label}
                      detail={option ? (option.payments > 1 ? `${option.payments} payments` : 'One payment') : undefined}
                      price={option?.perPaymentFormatted ?? null}
                      badge={option?.savingLabel ?? null}
                    />
                  );
                })}
              </div>
            </Step>
          )}

          {/* ── 3. payment method ─────────────────────────────────────── */}
          <Step n={item.offersCadence ? 3 : 2} title="How would you like to pay?">
            <div className="grid sm:grid-cols-2 gap-3">
              <Choice
                selected={method === 'card'}
                onClick={() => setMethod('card')}
                accent={accent}
                icon={<CreditCard className="w-5 h-5" />}
                title={item.currency === 'INR' ? 'UPI, card or net banking' : 'Card, UPI or wallet'}
                detail="Instant. Your seat is confirmed straight away."
              />
              <Choice
                selected={method === 'bank'}
                onClick={() => setMethod('bank')}
                accent={accent}
                icon={<Landmark className="w-5 h-5" />}
                title="Bank transfer"
                detail="Pay into our account for your country. Confirmed within one working day."
              />
            </div>
          </Step>
        </div>

        {/* ── the order summary, and the one action ───────────────────── */}
        <aside className="lg:sticky lg:top-24">
          <div className="card-3d overflow-hidden" style={{ ['--accent' as string]: accent }}>
            <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${accent}, ${accent}99)` }} />
            <div className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-2 mb-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500" style={{ fontFamily: 'var(--font-grotesk)' }}>
                  Your enrolment
                </p>
                {/* Coding tracks are sold in dollars only. */}
                {item.kind === 'school' && <CurrencySwitch />}
              </div>

              <p className="text-xl font-extrabold text-slate-900 leading-snug" style={{ fontFamily: 'var(--font-jakarta)' }}>
                {item.tagline}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[item.scopeLabel, item.classes > 0 ? `${item.classes} classes` : null, ratio === '1:1' ? 'One to one' : 'Batch of 4']
                  .filter(Boolean)
                  .map((chip) => (
                    <span key={chip as string} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11.5px] font-semibold text-slate-600">
                      {chip}
                    </span>
                  ))}
              </div>

              <dl className="mt-5 space-y-2 text-[13.5px]">
                <div className="flex items-center justify-between gap-3 text-slate-500">
                  <dt className="flex items-center gap-1.5"><CalendarRange className="w-4 h-4" /> Plan</dt>
                  <dd className="font-semibold text-slate-700">
                    {item.offersCadence ? CADENCES.find((c) => c.value === cadence)?.label : 'One payment'}
                  </dd>
                </div>
                {/* The total sits next to the instalment, never instead of it. A
                    parent who discovers the full figure later feels misled, and
                    they are right to. */}
                <div className="flex items-center justify-between gap-3 text-slate-500">
                  <dt>{item.payments > 1 ? `${item.payments} payments in total` : 'Total'}</dt>
                  <dd className="font-semibold text-slate-700 tabular-nums">{item.lifetimeFormatted}</dd>
                </div>
              </dl>

              <div className="mt-4 pt-4 border-t border-dashed border-slate-200 flex items-end justify-between gap-3">
                <span className="text-[13px] font-bold text-slate-700">Due today</span>
                <span className="text-[1.9rem] leading-none font-extrabold text-slate-900 tabular-nums" style={{ fontFamily: 'var(--font-jakarta)' }}>
                  {item.perPaymentFormatted}
                </span>
              </div>
              {item.savingLabel && (
                <p className="mt-2 text-right text-[12.5px] font-bold text-emerald-700">{item.savingLabel} versus paying monthly</p>
              )}

              <div className="mt-5">
                {method === 'bank' ? (
                  <Link href={bankHref} className="btn-tactile btn-tactile-primary w-full h-14 text-[15px]">
                    <Landmark className="w-5 h-5" /> See bank details <ArrowRight className="w-5 h-5" />
                  </Link>
                ) : needsIndianNumber ? (
                  /* Rupee prices are for families in India — the server refuses a
                     rupee order without a +91 number, so say it before they press. */
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="text-[13.5px] text-amber-900 leading-[1.6]">{INR_PHONE_MESSAGE}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setCurrency('USD')}
                        className="btn-tactile btn-tactile-deep h-10 px-4 text-[13px]"
                      >
                        Pay in dollars
                      </button>
                      <Link href="/settings" className="btn-tactile btn-tactile-light h-10 px-4 text-[13px]">
                        Add my Indian number
                      </Link>
                    </div>
                  </div>
                ) : (
                  <RazorpayCheckoutButton
                    track={item.track}
                    level={item.level}
                    ratio={ratio}
                    paymentLink=""
                    courseName={item.courseName}
                    accentColor={accent}
                    className="btn-tactile btn-tactile-primary w-full h-14 text-[15px]"
                    // Server-priced. The client never sends an amount, so a
                    // tampered request cannot change what is charged.
                    orderBody={item.orderBody}
                  />
                )}
              </div>

              <p className="mt-4 flex items-center justify-center gap-1.5 text-[11.5px] text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {method === 'bank' ? 'You will get a reference to quote with your transfer' : 'Payments are processed securely by Razorpay'}
              </p>
            </div>

            <div className="px-5 sm:px-6 py-4 bg-slate-50 border-t border-slate-100 space-y-2">
              {item.currency === 'INR' && (
                <p className="text-[12px] text-slate-600 leading-[1.6]">
                  Rupee price for families in India, GST included.
                </p>
              )}
              <p className="text-[12px] text-slate-500 leading-[1.6]">
                We find a batch that fits your timings before your first class. If nothing suits, you get a full refund.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function CheckoutFallback() {
  return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );
}
