'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, ClipboardList, GraduationCap } from 'lucide-react';
import { REDUCED, SPRING_QUICK } from '@/lib/motion';
import type { CadenceOption } from '@/app/subjects/subject-picker';

/**
 * SARIRO — Payment cadence chooser
 * =========================================================
 * The three ways to pay, without the grade picker. Used by focus courses, which
 * are a fixed 48 classes and not tied to a grade.
 *
 * Order is deliberate: monthly first. A parent who meets the full price first
 * never reaches the small number underneath it, and the small number is the one
 * that gets a yes.
 */

export default function CadenceChooser({
  accent,
  plans,
  lessons,
  tests,
  ctaLabel,
  ctaHref,
}: {
  accent: string;
  plans: CadenceOption[];
  lessons: number;
  tests: number;
  ctaLabel: string;
  ctaHref: string;
}) {
  const reduced = useReducedMotion();
  const spring = reduced ? REDUCED : SPRING_QUICK;
  const [cadence, setCadence] = useState<CadenceOption['cadence']>('monthly');

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
        How would you like to pay?
      </p>

      <div className="space-y-2.5">
        {plans.map((plan) => {
          const active = cadence === plan.cadence;
          return (
            <button
              key={plan.cadence}
              onClick={() => setCadence(plan.cadence)}
              aria-pressed={active}
              className="w-full text-left rounded-xl border p-4 transition-colors duration-200"
              style={active ? { borderColor: accent, background: `${accent}08` } : { borderColor: '#e2e8f0' }}
            >
              <span className="flex items-baseline justify-between gap-3 flex-wrap">
                <span className="flex items-center gap-2 font-semibold text-slate-900 text-[15px]">
                  {active && <Check className="w-4 h-4" style={{ color: accent }} />}
                  {plan.label}
                </span>
                <span className="text-lg font-bold text-slate-900 tabular-nums">
                  {plan.perPayment}
                </span>
              </span>
              <span className="flex items-baseline justify-between gap-3 flex-wrap mt-1">
                <span className="text-[13px] text-slate-600">{plan.blurb}</span>
                <span className="text-[12.5px] text-slate-500 tabular-nums">
                  {plan.payments > 1 ? `${plan.payments} payments · ${plan.lifetime} total` : plan.lifetime}
                </span>
              </span>
              {plan.saving && (
                <span className="inline-flex items-center gap-1.5 mt-2 text-[12px] font-bold text-emerald-700">
                  {plan.saving}
                  <span className="font-semibold text-emerald-600/80">({plan.discountPercent}% off)</span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-5 pt-4 border-t border-slate-200 text-[13px] text-slate-600">
        <span className="inline-flex items-center gap-1.5 tabular-nums">
          <GraduationCap className="w-4 h-4" style={{ color: accent }} />
          {lessons} lessons
        </span>
        <span className="inline-flex items-center gap-1.5 tabular-nums">
          <ClipboardList className="w-4 h-4" style={{ color: accent }} />
          {tests} assessments
        </span>
      </div>

      <motion.div initial={false} animate={{ opacity: 1 }} transition={spring}>
        <Link
          href={`${ctaHref}&pay=${cadence}`}
          className="mt-5 inline-flex items-center justify-center h-12 px-6 rounded-xl bg-slate-900 text-white text-[15px] font-semibold hover:bg-slate-800 transition-colors w-full sm:w-auto"
        >
          {ctaLabel}
        </Link>
      </motion.div>
      <p className="text-[12.5px] text-slate-500 mt-2.5">
        We&apos;ll find a batch that fits your timings before you pay anything.
      </p>
    </div>
  );
}
