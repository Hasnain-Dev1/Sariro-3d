'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, CreditCard, Landmark, Loader2, Users } from 'lucide-react';
import { RazorpayCheckoutButton } from '@/components/auth/razorpay-checkout';
import { resolveCheckoutItem } from '@/lib/checkout/resolve';
import type { LearningRatio } from '@/lib/sariro-data';
import { formatPrice, type Cadence } from '@/lib/school/pricing';

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
 */

type Method = 'card' | 'bank';

const CADENCES: { value: Cadence; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Every 3 months' },
  { value: 'full', label: 'Pay in full' },
];

export default function CheckoutClient() {
  const params = useSearchParams();
  const [method, setMethod] = useState<Method>('card');
  const [ratio, setRatio] = useState<LearningRatio>(
    params.get('ratio') === '1:1' ? '1:1' : '1:4'
  );
  const [cadence, setCadence] = useState<Cadence>(
    (params.get('pay') as Cadence) || 'monthly'
  );

  const item = useMemo(
    () =>
      resolveCheckoutItem({
        course: params.get('course'),
        subject: params.get('subject'),
        focus: params.get('focus'),
        grade: params.get('grade'),
        scope: params.get('scope'),
        ratio,
        cadence,
      }),
    [params, ratio, cadence]
  );

  if (!item) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-3">
          We couldn&apos;t find that course
        </h1>
        <p className="text-slate-600 mb-8">
          The link may be out of date. Pick a subject and we will bring you straight back here.
        </p>
        <Link
          href="/courses#learn"
          className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-slate-900 text-white font-semibold"
        >
          Browse everything we teach
        </Link>
      </div>
    );
  }

  const bankHref =
    `/contact?intent=bank-transfer&product=${item.slug}` +
    `&scope=${encodeURIComponent(item.scopeLabel)}&pay=${cadence}&ratio=${ratio}`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
      <Link
        href={item.backHref}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {item.name}
      </Link>

      <h1 className="text-[2rem] sm:text-4xl font-bold tracking-[-0.02em] text-slate-900 mb-8">
        Complete your enrolment
      </h1>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
        <div className="space-y-6">
          {/* ── class size ─────────────────────────────────────────────── */}
          <div className="card card--feature">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
              How would you like to learn?
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {(['1:4', '1:1'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRatio(r)}
                  aria-pressed={ratio === r}
                  className="text-left rounded-xl border p-4 transition-colors"
                  style={
                    ratio === r
                      ? { borderColor: item.accent, background: `${item.accent}08` }
                      : { borderColor: '#E9E2D8' }
                  }
                >
                  <span className="flex items-center gap-2 font-semibold text-slate-900 text-[15px]">
                    {ratio === r ? (
                      <CheckCircle2 className="w-4 h-4" style={{ color: item.accent }} />
                    ) : (
                      <Users className="w-4 h-4 text-slate-400" />
                    )}
                    {r === '1:4' ? 'Small batch of four' : 'One to one'}
                  </span>
                  <span className="block text-[13px] text-slate-600 mt-1">
                    {r === '1:4'
                      ? 'Learn alongside three others. Best value.'
                      : 'The mentor’s full attention, paced to you.'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ── cadence, only where it is real ─────────────────────────── */}
          {item.offersCadence && (
            <div className="card card--feature">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
                How would you like to spread it?
              </p>
              <div className="grid sm:grid-cols-3 gap-3">
                {CADENCES.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setCadence(c.value)}
                    aria-pressed={cadence === c.value}
                    className="text-left rounded-xl border p-3.5 transition-colors"
                    style={
                      cadence === c.value
                        ? { borderColor: item.accent, background: `${item.accent}08` }
                        : { borderColor: '#E9E2D8' }
                    }
                  >
                    <span className="block font-semibold text-slate-900 text-[14px]">
                      {c.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── payment method ─────────────────────────────────────────── */}
          <div className="card card--feature">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
              How would you like to pay?
            </p>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => setMethod('card')}
                aria-pressed={method === 'card'}
                className="w-full text-left rounded-xl border p-4 transition-colors"
                style={
                  method === 'card'
                    ? { borderColor: item.accent, background: `${item.accent}08` }
                    : { borderColor: '#E9E2D8' }
                }
              >
                <span className="flex items-center gap-2.5 font-semibold text-slate-900">
                  {method === 'card' ? (
                    <CheckCircle2 className="w-4 h-4" style={{ color: item.accent }} />
                  ) : (
                    <CreditCard className="w-4 h-4 text-slate-400" />
                  )}
                  Card, UPI or wallet
                </span>
                <span className="block text-[13px] text-slate-600 mt-1">
                  Instant. Your seat is confirmed straight away.
                </span>
              </button>

              <button
                onClick={() => setMethod('bank')}
                aria-pressed={method === 'bank'}
                className="w-full text-left rounded-xl border p-4 transition-colors"
                style={
                  method === 'bank'
                    ? { borderColor: item.accent, background: `${item.accent}08` }
                    : { borderColor: '#E9E2D8' }
                }
              >
                <span className="flex items-center gap-2.5 font-semibold text-slate-900">
                  {method === 'bank' ? (
                    <CheckCircle2 className="w-4 h-4" style={{ color: item.accent }} />
                  ) : (
                    <Landmark className="w-4 h-4 text-slate-400" />
                  )}
                  Bank transfer
                </span>
                <span className="block text-[13px] text-slate-600 mt-1">
                  Available in several countries. We confirm within one working day.
                </span>
              </button>
            </div>

            {method === 'card' ? (
              <RazorpayCheckoutButton
                track={item.track}
                level={item.level}
                ratio={ratio}
                paymentLink=""
                courseName={item.courseName}
                accentColor={item.accent}
                className="w-full"
                // Server-priced. The client never sends an amount, so a
                // tampered request cannot change what is charged.
                orderBody={item.orderBody}
              />
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                <p className="font-semibold text-slate-900 mb-2">Bank transfer</p>
                <p className="text-[14px] text-slate-600 leading-[1.65] mb-4">
                  Tell us a little about the learner and we will send you the account details for
                  your country, along with a reference so we can match your transfer straight away.
                </p>
                <Link
                  href={bankHref}
                  className="inline-flex items-center justify-center h-12 px-6 rounded-xl bg-slate-900 text-white text-[15px] font-semibold hover:bg-slate-800 transition-colors w-full"
                >
                  Request bank details
                </Link>
                <p className="text-[12.5px] text-slate-500 mt-3">
                  Bank details are sent to you directly rather than published here.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── what they are buying ─────────────────────────────────────── */}
        <div
          className="card card--feature lg:sticky lg:top-24"
          style={{ ['--accent' as string]: item.accent }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Your enrolment
          </p>

          <p className="text-xl font-bold text-slate-900 leading-snug">{item.tagline}</p>
          <p className="text-[14px] text-slate-600 mt-1">
            {item.scopeLabel}
            {item.classes > 0 && ` · ${item.classes} classes`} ·{' '}
            {ratio === '1:1' ? 'One to one' : 'Small batch of 4'}
          </p>

          <div className="card-meta">
            <div className="flex items-baseline justify-between gap-3 mb-1">
              <span className="text-[14px] text-slate-600">Due today</span>
              <span className="text-2xl font-bold text-slate-900 tabular-nums">
                {item.perPaymentFormatted}
              </span>
            </div>

            {/* The total sits next to the instalment, never instead of it. A
                parent who discovers the full figure later feels misled, and
                they are right to. */}
            <div className="flex items-baseline justify-between gap-3 text-[13.5px] text-slate-500">
              <span>
                {item.payments > 1 ? `${item.payments} payments in total` : 'One payment'}
              </span>
              <span className="tabular-nums">{formatPrice(item.lifetimeTotal)}</span>
            </div>

            {item.savingLabel && (
              <p className="text-[13px] font-bold text-emerald-700 mt-2">
                {item.savingLabel} versus paying monthly
              </p>
            )}
          </div>

          <p className="text-[12.5px] text-slate-500 mt-4 leading-[1.6]">
            We find a batch that fits your timings before your first class. If nothing suits, you
            get a full refund.
          </p>
        </div>
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
