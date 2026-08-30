'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Building2, CheckCircle2, CreditCard, Loader2 } from 'lucide-react';
import { RazorpayCheckoutButton } from '@/components/auth/razorpay-checkout';
import {
  LESSONS_PER_GRADE,
  LESSONS_PER_GROUP,
  gradeGroupFor,
  getSpecialisation,
  getSubject,
} from '@/lib/school/curriculum';
import { cadencePlans, formatPrice, type Cadence, type Ratio } from '@/lib/school/pricing';

/**
 * SARIRO — Enrol
 * =========================================================
 * The page that was missing. Choosing a plan on a subject page used to send the
 * family to `/contact` — a general enquiry form, at the exact moment they had
 * decided to buy. That is the most expensive possible place to put a dead end.
 *
 * What a checkout has to do, in order:
 *   1. Show them exactly what they picked, so nothing is a surprise later
 *   2. Show the amount charged TODAY, next to the total, so neither hides
 *   3. Let them choose how to pay
 *   4. Get out of the way
 */

type Method = 'card' | 'bank';

export default function EnrollClient() {
  const params = useSearchParams();
  const [method, setMethod] = useState<Method>('card');

  const subjectSlug = params.get('subject') ?? params.get('focus') ?? '';
  const gradeParam = params.get('grade');
  const scope = params.get('scope') === 'group' ? 'group' : 'grade';
  const cadence = (params.get('pay') ?? 'monthly') as Cadence;
  const ratio: Ratio = params.get('ratio') === '1:1' ? '1:1' : '1:4';

  const product = useMemo(() => {
    const subject = getSubject(subjectSlug);
    if (subject) return { name: subject.name, tagline: subject.tagline, accent: subject.accent, isFocus: false };
    const focus = getSpecialisation(subjectSlug);
    if (focus) return { name: focus.name, tagline: focus.tagline, accent: focus.accent, isFocus: true };
    return null;
  }, [subjectSlug]);

  const grade = gradeParam ? Number(gradeParam) : null;
  const classes = product?.isFocus || scope === 'grade' ? LESSONS_PER_GRADE : LESSONS_PER_GROUP;
  const plan = cadencePlans(classes, ratio).find((p) => p.cadence === cadence);

  if (!product || !plan) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-3">We couldn&apos;t find that course</h1>
        <p className="text-slate-600 mb-8">
          The link may be out of date. Pick a subject and we will take you straight back here.
        </p>
        <Link
          href="/courses#learn"
          className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-slate-900 text-white font-semibold"
        >
          Browse subjects
        </Link>
      </div>
    );
  }

  const group = grade ? gradeGroupFor(grade) : null;
  const scopeLabel = product.isFocus
    ? 'Focus course'
    : scope === 'group'
      ? (group?.label ?? 'Full grade group')
      : `Grade ${grade}`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
      <Link
        href={product.isFocus ? `/subjects/focus/${subjectSlug}` : `/subjects/${subjectSlug}`}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 transition mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {product.name}
      </Link>

      <h1 className="text-[2rem] sm:text-4xl font-bold tracking-[-0.02em] text-slate-900 mb-8">
        Complete your enrolment
      </h1>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
        {/* ── how to pay ─────────────────────────────────────────────── */}
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
                  ? { borderColor: product.accent, background: `${product.accent}08` }
                  : { borderColor: '#e2e8f0' }
              }
            >
              <span className="flex items-center gap-2.5 font-semibold text-slate-900">
                {method === 'card' ? (
                  <CheckCircle2 className="w-4 h-4" style={{ color: product.accent }} />
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
                  ? { borderColor: product.accent, background: `${product.accent}08` }
                  : { borderColor: '#e2e8f0' }
              }
            >
              <span className="flex items-center gap-2.5 font-semibold text-slate-900">
                {method === 'bank' ? (
                  <CheckCircle2 className="w-4 h-4" style={{ color: product.accent }} />
                ) : (
                  <Building2 className="w-4 h-4 text-slate-400" />
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
              track={subjectSlug}
              level={product.isFocus ? 'focus' : scope === 'group' ? `group-${grade ?? ''}` : `grade-${grade ?? ''}`}
              ratio={ratio}
              paymentLink=""
              courseName={`${product.name} — ${scopeLabel}`}
              accentColor={product.accent}
              className="w-full"
              // Priced by lib/school/pricing on the server; the client never
              // sends an amount, so a tampered request cannot change what is
              // charged.
              orderBody={{
                kind: 'school',
                subject: subjectSlug,
                grade,
                scope,
                cadence,
                ratio,
              }}
            />
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
              <p className="font-semibold text-slate-900 mb-2">Bank transfer</p>
              <p className="text-[14px] text-slate-600 leading-[1.65] mb-4">
                Tell us a little about the learner and we will send you the account details for your
                country, along with a reference so we can match your transfer straight away.
              </p>
              <Link
                href={`/contact?intent=bank-transfer&subject=${subjectSlug}&grade=${grade ?? ''}&scope=${scope}&pay=${cadence}`}
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

        {/* ── what they are buying ───────────────────────────────────── */}
        <div className="card card--feature lg:sticky lg:top-24" style={{ ['--accent' as string]: product.accent }}>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            Your enrolment
          </p>

          <p className="text-xl font-bold text-slate-900 leading-snug">{product.tagline}</p>
          <p className="text-[14px] text-slate-600 mt-1">
            {scopeLabel} · {classes} classes · {ratio === '1:1' ? 'One to one' : 'Small batch of 4'}
          </p>

          <div className="card-meta">
            <div className="flex items-baseline justify-between gap-3 mb-1">
              <span className="text-[14px] text-slate-600">Due today</span>
              <span className="text-2xl font-bold text-slate-900 tabular-nums">
                {formatPrice(plan.perPayment)}
              </span>
            </div>

            {/* The total sits next to the instalment, never instead of it. A
                parent who discovers the full figure later feels misled, and they
                are right to. */}
            <div className="flex items-baseline justify-between gap-3 text-[13.5px] text-slate-500">
              <span>
                {plan.payments > 1 ? `${plan.payments} payments in total` : 'One payment'}
              </span>
              <span className="tabular-nums">{formatPrice(plan.lifetimeTotal)}</span>
            </div>

            {plan.savingLabel && (
              <p className="text-[13px] font-bold text-emerald-700 mt-2">
                {plan.savingLabel} versus paying monthly
              </p>
            )}
          </div>

          <p className="text-[12.5px] text-slate-500 mt-4 leading-[1.6]">
            We find a batch that fits your timings before your first class. If nothing suits, you get
            a full refund.
          </p>
        </div>
      </div>
    </div>
  );
}

export function EnrollFallback() {
  return (
    <div className="flex items-center justify-center py-32">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
    </div>
  );
}
