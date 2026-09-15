'use client';

import { useEffect, useState } from 'react';
import { BadgeCheck, Loader2, Lock, XCircle } from 'lucide-react';
import {
  NOT_APPROVED, PLAN_LABEL, PLAN_MONTHS, RATIOS,
  inr, isApproved, type PlanMonths, type Ratio, type SellerPlanPrice,
} from '@/lib/pricing/economics';
import { NumberField, Segmented } from '@/components/dashboard/pricing/fields';

/**
 * SARIRO — what a seller may quote
 * ============================================================================
 * The price list management keeps in the pricing calculator, as a seller needs
 * it on a call: start at the public price, come down to the normal offer, then
 * the closing offer, and never below the floor. No costs, no margins, no
 * break-even number — just the ladder, and a box to check a figure before
 * saying it out loud.
 */

export interface SellerPrices {
  state: 'loading' | 'ready' | 'error';
  prices: Record<Ratio, SellerPlanPrice[]> | null;
  saved: boolean;
  updatedAt: string | null;
}

export function useSellerPrices(): SellerPrices {
  const [s, setS] = useState<SellerPrices>({ state: 'loading', prices: null, saved: false, updatedAt: null });
  useEffect(() => {
    let live = true;
    fetch('/api/seller/prices', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => {
        if (!live) return;
        if (j?.ok) setS({ state: 'ready', prices: j.prices, saved: !!j.saved, updatedAt: j.updatedAt ?? null });
        else setS((p) => ({ ...p, state: 'error' }));
      })
      .catch(() => { if (live) setS((p) => ({ ...p, state: 'error' })); });
    return () => { live = false; };
  }, []);
  return s;
}

/** A floor arrives as null over JSON when nothing can cover the plan. */
export const floorOf = (p: SellerPlanPrice | undefined) => (p && typeof p.floor === 'number' ? p.floor : Infinity);

export function ApprovalBanner({ price, floor }: { price: number; floor: number }) {
  const ok = isApproved(price, floor);
  return (
    <div className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 ${ok ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-300 bg-rose-50 text-rose-800'}`}>
      {ok ? <BadgeCheck className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
      <p className="text-[13.5px] font-extrabold tracking-tight">{ok ? `Approved — ${inr(price)} is within the price list` : NOT_APPROVED}</p>
    </div>
  );
}

export default function SellerPriceList() {
  const { state, prices, saved, updatedAt } = useSellerPrices();
  const [ratio, setRatio] = useState<Ratio>('1:4');
  const [checkPlan, setCheckPlan] = useState<PlanMonths>(3);
  const [checkPrice, setCheckPrice] = useState<number | null>(null);

  if (state === 'loading') {
    return <div className="flex items-center gap-2 py-8 text-[13px] text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading the price list…</div>;
  }
  if (state === 'error' || !prices) {
    return <p className="py-6 text-[13px] font-semibold text-rose-700">The price list did not load. Refresh the page, and ask HR if it keeps happening.</p>;
  }

  const list = prices[ratio];
  const checked = list.find((p) => p.months === checkPlan);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented value={ratio} onChange={setRatio} options={RATIOS.map((r) => ({ value: r, label: r === '1:4' ? '1:4 small batch' : '1:1 one to one' }))} />
        <p className="text-[12px] text-slate-500">
          All prices include GST.{' '}
          {saved && updatedAt
            ? `Updated ${new Date(updatedAt).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}.`
            : 'Default list — management has not changed it yet.'}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {list.map((p) => {
          const floor = floorOf(p);
          return (
            <div key={p.months} className="rounded-2xl border border-slate-200 bg-white p-4 flex flex-col">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-slate-500" style={{ fontFamily: 'var(--font-grotesk)' }}>{p.label}</p>
              <p className="mt-1 text-[1.6rem] font-extrabold text-slate-900 tabular-nums leading-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>
                {p.publicPrice ? inr(p.publicPrice) : '—'}
              </p>
              <p className="text-[11.5px] text-slate-500">Public price — say this first</p>
              <dl className="mt-3 space-y-1.5 text-[13px] flex-1">
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-600">Normal offer</dt>
                  <dd className="font-bold tabular-nums text-slate-900">{p.offer1 ? inr(p.offer1) : '—'}</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-slate-600">Closing offer</dt>
                  <dd className="font-bold tabular-nums text-slate-900">{p.offer2 ? inr(p.offer2) : '—'}</dd>
                </div>
              </dl>
              <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-slate-900 text-white px-2.5 py-2">
                <span className="inline-flex items-center gap-1.5 text-[11.5px] font-bold"><Lock className="w-3.5 h-3.5" /> Lowest you can go</span>
                <span className="text-[14px] font-extrabold tabular-nums">{Number.isFinite(floor) ? inr(floor) : '—'}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-[14px] font-extrabold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>Check a price before you say it</p>
        <div className="flex flex-wrap items-end gap-3">
          <Segmented size="sm" value={checkPlan} onChange={setCheckPlan} options={PLAN_MONTHS.map((m) => ({ value: m, label: PLAN_LABEL[m] }))} />
          <div className="w-44">
            <NumberField prefix="₹" allowEmpty value={checkPrice} placeholder="e.g. 12,999" onChange={setCheckPrice} />
          </div>
        </div>
        {checkPrice !== null && checked && (
          <div className="mt-3">
            <ApprovalBanner price={checkPrice} floor={floorOf(checked)} />
          </div>
        )}
      </div>
    </div>
  );
}
