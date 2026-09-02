'use client';

import Link from 'next/link';
import { ArrowRight, Check, ClipboardList, GraduationCap, Users } from 'lucide-react';
import { LESSONS_PER_GRADE } from '@/lib/school/curriculum';
import { cadencePlans, formatPrice, perClassFor, perMonthFor } from '@/lib/school/pricing';

/**
 * SARIRO — school pricing on /pricing
 * =========================================================
 * `/pricing` rendered `PRICING_TIERS` and nothing else — the four CODING tiers.
 * So a parent who clicked "Pricing" in the nav to find out what grade 8 maths
 * costs saw a bootcamp price list and left. The number they wanted ($27.99 a
 * month) existed, was correct, and was reachable only by first picking a
 * subject, then a grade, on a different page.
 *
 * This section puts it on the page where people go looking for it. Numbers come
 * from `school/pricing.ts` — the same source the subject pages use, so the two
 * can never drift.
 */

const RATIOS = [
  {
    ratio: '1:4' as const,
    icon: Users,
    label: 'Small batch',
    sub: 'Four learners, one mentor',
    accent: '#2563EB',
    blurb:
      'The default, and the one most families choose. Small enough that a teacher notices when your child goes quiet.',
    highlight: true,
  },
  {
    ratio: '1:1' as const,
    icon: GraduationCap,
    label: 'One to one',
    sub: 'Just your child and the mentor',
    accent: '#7C3AED',
    blurb:
      'Every minute of the class is theirs, and the path is shaped around them rather than the batch.',
    highlight: false,
  },
];

export default function SchoolPricing() {
  return (
    <section className="relative py-14 sm:py-20 bg-white border-t border-slate-100">
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-10">
          <span
            className="inline-block text-xs font-bold uppercase tracking-[0.18em] text-blue-600 mb-3"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            School subjects & Public Speaking
          </span>
          <h2
            className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-[-0.02em]"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            Maths, science, English and Public Speaking are priced per class.
          </h2>
          <p className="mt-3 text-slate-600 text-[15px] leading-[1.65]">
            One class a week, {LESSONS_PER_GRADE} a year, the same price everywhere in the world.
            Coding is sold as a track instead — those tiers are above.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mb-10">
          {RATIOS.map((r) => {
            const perClass = perClassFor(r.ratio);
            const perMonth = perMonthFor(r.ratio);
            return (
              <div
                key={r.ratio}
                className="card card--feature flex flex-col"
                style={{ ['--accent' as string]: r.accent }}
              >
                <span className="flex items-center gap-3 mb-4">
                  <span
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${r.accent}14`, color: r.accent }}
                  >
                    <r.icon className="w-5 h-5" strokeWidth={2.2} />
                  </span>
                  <span>
                    <span className="block font-bold text-slate-900 text-[16px]">{r.label}</span>
                    <span className="block text-[13px] text-slate-500">{r.sub}</span>
                  </span>
                  {r.highlight && (
                    <span
                      className="ml-auto text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
                      style={{ color: r.accent, background: `${r.accent}14` }}
                    >
                      Most chosen
                    </span>
                  )}
                </span>

                <span className="flex items-baseline gap-2 mb-1">
                  <span className="text-4xl font-extrabold text-slate-900 tabular-nums">
                    {formatPrice(perMonth)}
                  </span>
                  <span className="text-slate-500 text-[15px]">/ month</span>
                </span>
                <span className="text-[13px] text-slate-500 tabular-nums mb-4">
                  {formatPrice(perClass)} per class · 4 classes a month
                </span>

                <p className="text-[14px] leading-[1.6] text-slate-600 flex-1">{r.blurb}</p>
              </div>
            );
          })}
        </div>

        {/* Commit longer, pay less — the same three cadences the subject pages
            offer, quoted against the monthly total so a parent can check it. */}
        <div className="card card--feature">
          <p className="font-bold text-slate-900 text-[16px] mb-1">
            Commit for longer, pay less
          </p>
          <p className="text-[13.5px] text-slate-600 mb-5">
            One year of a subject — {LESSONS_PER_GRADE} classes in a small batch. Savings are
            measured against the monthly total, never an invented list price.
          </p>

          <div className="grid sm:grid-cols-3 gap-3">
            {cadencePlans(LESSONS_PER_GRADE, '1:4').map((plan) => (
              <div
                key={plan.cadence}
                className="rounded-xl border p-4"
                style={{ borderColor: plan.discountPercent > 0 ? '#2563EB40' : '#E9E2D8' }}
              >
                <p className="text-[13px] font-semibold text-slate-900">{plan.label}</p>
                <p className="text-2xl font-extrabold text-slate-900 tabular-nums mt-1">
                  {plan.perPaymentFormatted}
                </p>
                <p className="text-[12.5px] text-slate-500 tabular-nums mt-0.5">
                  {plan.payments > 1
                    ? `${plan.payments} payments · ${plan.lifetimeFormatted} total`
                    : plan.lifetimeFormatted}
                </p>
                {plan.savingLabel && (
                  <p className="inline-flex items-center gap-1.5 mt-2.5 text-[12px] font-bold text-emerald-700">
                    <Check className="w-3.5 h-3.5" />
                    {plan.savingLabel}
                  </p>
                )}
              </div>
            ))}
          </div>

          <p className="flex items-start gap-2 mt-5 text-[13px] text-slate-600">
            <ClipboardList className="w-4 h-4 mt-0.5 shrink-0 text-slate-400" />
            Two of the {LESSONS_PER_GRADE} classes are assessments — one mid-year, one at the end.
            They are part of the {LESSONS_PER_GRADE}, never an extra charge.
          </p>

          <Link
            href="/courses#learn"
            className="mt-6 inline-flex items-center justify-center h-12 px-6 rounded-xl bg-slate-900 text-white text-[15px] font-semibold hover:bg-slate-800 transition-colors"
          >
            Pick a subject and grade
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </div>
    </section>
  );
}
