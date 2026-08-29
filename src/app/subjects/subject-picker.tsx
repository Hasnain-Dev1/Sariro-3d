'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, ClipboardList, GraduationCap } from 'lucide-react';
import { REDUCED, SPRING_QUICK } from '@/lib/motion';

/**
 * SARIRO — Grade picker + price
 * =========================================================
 * The moment a parent decides. Two choices, in this order:
 *
 *   1. which grade their child is in   — the only question they can answer
 *      without thinking
 *   2. one grade, or the whole group   — commitment size
 *
 * Everything else on the page is supporting material. The price updates in
 * place as they choose, so the number is never a surprise waiting on the next
 * screen — which is where checkouts are abandoned.
 */

export interface GradeChoice {
  grade: number;
  groupSlug: string;
  groupLabel: string;
}

export interface CadenceOption {
  cadence: 'monthly' | 'quarterly' | 'full';
  label: string;
  blurb: string;
  perPayment: string;
  payments: number;
  lifetime: string;
  saving: string | null;
  discountPercent: number;
}

export interface ScopePrice {
  classes: number;
  months: number;
  monthly: string;
  lessons: number;
  tests: number;
  plans: CadenceOption[];
}

export interface SubjectPickerProps {
  subjectSlug: string;
  subjectName: string;
  accent: string;
  grades: GradeChoice[];
  /** Keyed `${grade}:grade` and `${grade}:group`. */
  prices: Record<string, ScopePrice>;
}

export default function SubjectPicker({
  subjectSlug,
  subjectName,
  accent,
  grades,
  prices,
}: SubjectPickerProps) {
  const reduced = useReducedMotion();
  const spring = reduced ? REDUCED : SPRING_QUICK;

  // Default to the middle of the range: most enquiries are for older children,
  // and a default of grade 1 makes the product look like it is for toddlers.
  const [grade, setGrade] = useState(grades[Math.floor(grades.length / 2)]?.grade ?? grades[0].grade);
  const [scope, setScope] = useState<'grade' | 'group'>('grade');
  const [cadence, setCadence] = useState<'monthly' | 'quarterly' | 'full'>('monthly');

  const chosen = useMemo(() => grades.find((g) => g.grade === grade) ?? grades[0], [grades, grade]);
  const price = prices[`${grade}:${scope}`];

  return (
    <div className="card card--feature sm:p-8">
      {/* ── grade ─────────────────────────────────────────────────────── */}
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
        Which grade is your child in?
      </p>
      <div className="flex flex-wrap gap-2 mb-7">
        {grades.map((g) => {
          const active = g.grade === grade;
          return (
            <button
              key={g.grade}
              onClick={() => setGrade(g.grade)}
              aria-pressed={active}
              className="h-10 min-w-[3rem] px-3 rounded-xl border text-sm font-semibold tabular-nums transition-colors duration-200"
              style={
                active
                  ? { borderColor: accent, background: `${accent}12`, color: accent }
                  : { borderColor: '#e2e8f0', color: '#475569' }
              }
            >
              {g.grade}
            </button>
          );
        })}
      </div>

      {/* ── scope ─────────────────────────────────────────────────────── */}
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
        How far do you want to go?
      </p>
      <div className="grid sm:grid-cols-2 gap-3 mb-7">
        {(['grade', 'group'] as const).map((s) => {
          const p = prices[`${grade}:${s}`];
          if (!p) return null;
          const active = scope === s;
          return (
            <button
              key={s}
              onClick={() => setScope(s)}
              aria-pressed={active}
              className="text-left rounded-xl border p-4 transition-colors duration-200"
              style={active ? { borderColor: accent, background: `${accent}08` } : { borderColor: '#e2e8f0' }}
            >
              <span className="flex items-center gap-2 font-semibold text-slate-900 text-[15px]">
                {active && <Check className="w-4 h-4" style={{ color: accent }} />}
                {s === 'grade' ? `Grade ${grade} only` : chosen.groupLabel}
              </span>
              <span className="block text-[13px] text-slate-600 mt-1 tabular-nums">
                {p.classes} classes · {p.months} months
              </span>
            </button>
          );
        })}
      </div>

      {/* ── price ─────────────────────────────────────────────────────── */}
      {price && (
        <motion.div
          key={`${grade}:${scope}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
            How would you like to pay?
          </p>

          {/* Three cadences, cheapest commitment first. A parent who sees the
              full price first never reaches the monthly line underneath it. */}
          <div className="space-y-2.5">
            {price.plans.map((plan) => {
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
                      <span className="font-semibold text-emerald-600/80">
                        ({plan.discountPercent}% off)
                      </span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-5 pt-4 border-t border-slate-200 text-[13px] text-slate-600">
            <span className="inline-flex items-center gap-1.5 tabular-nums">
              <GraduationCap className="w-4 h-4" style={{ color: accent }} />
              {price.lessons} lessons
            </span>
            <span className="inline-flex items-center gap-1.5 tabular-nums">
              <ClipboardList className="w-4 h-4" style={{ color: accent }} />
              {price.tests} assessments
            </span>
          </div>

          <Link
            href={`/contact?subject=${subjectSlug}&grade=${grade}&scope=${scope}&pay=${cadence}`}
            className="mt-5 inline-flex items-center justify-center h-12 px-6 rounded-xl bg-slate-900 text-white text-[15px] font-semibold hover:bg-slate-800 transition-colors w-full sm:w-auto"
          >
            Start {subjectName} — Grade {grade}
          </Link>
          <p className="text-[12.5px] text-slate-500 mt-2.5">
            We&apos;ll find a batch that fits your timings before you pay anything.
          </p>
        </motion.div>
      )}
    </div>
  );
}
