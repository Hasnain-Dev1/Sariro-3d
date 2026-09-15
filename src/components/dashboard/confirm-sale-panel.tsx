'use client';

import { useState } from 'react';
import { BadgeCheck, Loader2 } from 'lucide-react';
import { PLAN_LABEL, PLAN_MONTHS, RATIOS, inr, isApproved, type PlanMonths, type Ratio } from '@/lib/pricing/economics';
import { NumberField, Segmented } from '@/components/dashboard/pricing/fields';
import { ApprovalBanner, floorOf, useSellerPrices } from '@/components/dashboard/seller-price-list';

/**
 * SARIRO — "they are buying": what, and for how much
 * ============================================================================
 * Confirming a sale used to send HR a lead id and nothing else, so the figure
 * a family had agreed was whatever the seller remembered to write in a note —
 * and nothing stopped it being below what the plan costs to teach.
 *
 * Now the seller picks the plan and types the agreed price, and it is checked
 * against the price list management keeps. Below the floor it says so and
 * cannot be sent; the server checks again (api/seller/confirm-sale), because a
 * disabled button is a suggestion, not a rule.
 */
export default function ConfirmSalePanel({
  leadId,
  onDone,
  onCancel,
}: {
  leadId: string;
  onDone: (message: string, ok: boolean) => void;
  onCancel: () => void;
}) {
  const { state, prices } = useSellerPrices();
  const [ratio, setRatio] = useState<Ratio>('1:4');
  const [months, setMonths] = useState<PlanMonths>(3);
  const [price, setPrice] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const plan = prices?.[ratio].find((p) => p.months === months);
  const floor = floorOf(plan);
  const approved = price !== null && isApproved(price, floor);

  const send = async () => {
    if (!approved || price === null) return;
    setBusy(true);
    try {
      const res = await fetch('/api/seller/confirm-sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId,
          proposedAmount: price,
          plan: { ratio, months },
          packageNote: [`${ratio} · ${PLAN_LABEL[months]} at ${inr(price)}`, note.trim()].filter(Boolean).join(' — '),
        }),
      });
      const json = await res.json();
      onDone(json?.ok ? 'Sent to HR to invoice.' : (json?.message ?? 'That did not work.'), !!json?.ok);
    } catch {
      onDone('That did not work.', false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-green-200 bg-green-50/50 p-3.5 space-y-3">
      <p className="text-[13px] font-extrabold text-slate-900">What did they agree to?</p>
      {state === 'loading' && <p className="flex items-center gap-2 text-[12px] text-slate-500"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading the price list…</p>}
      {state === 'error' && <p className="text-[12px] font-semibold text-rose-700">The price list did not load, so the price cannot be checked. Try again in a moment.</p>}
      {prices && (
        <>
          <div className="flex flex-wrap gap-2">
            <Segmented size="sm" value={ratio} onChange={setRatio} options={RATIOS.map((r) => ({ value: r, label: r }))} />
            <Segmented size="sm" value={months} onChange={setMonths} options={PLAN_MONTHS.map((m) => ({ value: m, label: PLAN_LABEL[m] }))} />
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-40">
              <NumberField label="Agreed price (incl. GST)" prefix="₹" allowEmpty value={price} placeholder={plan?.publicPrice ? String(plan.publicPrice) : ''} onChange={setPrice} />
            </div>
            <p className="text-[11.5px] text-slate-500 pb-2">
              Public {plan?.publicPrice ? inr(plan.publicPrice) : '—'} · lowest {Number.isFinite(floor) ? inr(floor) : '—'}
            </p>
          </div>
          {price !== null && <ApprovalBanner price={price} floor={floor} />}
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={300}
            placeholder="Anything HR should know (optional)"
            className="w-full h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] outline-none focus:border-green-500"
          />
        </>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => void send()}
          disabled={!approved || busy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-40"
        >
          {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <BadgeCheck className="w-3 h-3" />} Send to HR
        </button>
        <button type="button" onClick={onCancel} className="px-2 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800">Cancel</button>
      </div>
    </div>
  );
}
