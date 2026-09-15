'use client';

import { inr, PLAN_LABEL, type Breakdown, type PlanMonths } from '@/lib/pricing/economics';
import { StatusChip } from './fields';

/**
 * One price, taken apart: where every rupee of it goes, and — for a plan paid
 * upfront — how much of the cash that arrived today is actually free.
 */

function Row({ label, value, strong, tone, indent }: { label: string; value: string; strong?: boolean; tone?: 'good' | 'bad' | 'muted'; indent?: boolean }) {
  const color = tone === 'good' ? 'text-emerald-700' : tone === 'bad' ? 'text-rose-700' : tone === 'muted' ? 'text-slate-500' : 'text-slate-900';
  return (
    <div className={`flex items-baseline justify-between gap-3 py-1.5 ${strong ? 'border-t border-slate-200 mt-1 pt-2.5' : ''}`}>
      <span className={`text-[13px] ${indent ? 'pl-3 text-slate-500' : strong ? 'font-extrabold text-slate-900' : 'text-slate-600'}`}>{label}</span>
      <span className={`tabular-nums text-[13.5px] ${strong ? 'font-extrabold' : 'font-semibold'} ${color}`}>{value}</span>
    </div>
  );
}

const SEGMENTS: { key: keyof Breakdown; label: string; color: string }[] = [
  { key: 'gst', label: 'GST', color: '#94A3B8' },
  { key: 'gateway', label: 'Gateway', color: '#64748B' },
  { key: 'cac', label: 'CAC', color: '#F59E0B' },
  { key: 'deliveryReserve', label: 'Delivery reserve', color: '#6366F1' },
  { key: 'contribution', label: 'Contribution', color: '#10B981' },
];

export default function BreakdownView({ b }: { b: Breakdown }) {
  const neg = (n: number) => (n > 0 ? `−${inr(n).replace('−', '')}` : inr(0));
  const loss = b.contribution < 0;
  const plan = PLAN_LABEL[b.months as PlanMonths] ?? `${b.months} months`;

  /* The split bar. A loss has no green slice; the costs then add up to more
     than the price, so they are scaled to the costs instead. */
  const parts = SEGMENTS.map((s) => ({ ...s, v: Math.max(0, b[s.key] as number) }));
  const whole = parts.reduce((n, p) => n + p.v, 0) || 1;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100" role="img" aria-label="Where the price goes">
          {parts.map((p) => p.v > 0 && <span key={p.key} style={{ width: `${(p.v / whole) * 100}%`, background: p.color }} />)}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {parts.map((p) => (
            <span key={p.key} className="inline-flex items-center gap-1.5 text-[11.5px] text-slate-600">
              <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
              {p.label} {b.price > 0 ? `${Math.round(((b[p.key] as number) / b.price) * 100)}%` : ''}
            </span>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 p-3.5">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500" style={{ fontFamily: 'var(--font-grotesk)' }}>
              Profit · {plan} · {b.ratio}
            </p>
            <StatusChip status={b.status} />
          </div>
          <Row label="Customer pays (incl. GST)" value={inr(b.price)} />
          <Row label="GST inside it" value={neg(b.gst)} tone="muted" />
          <Row label="Revenue excluding GST" value={inr(b.revenueExGst)} strong />
          <Row label="Gateway fee" value={neg(b.gateway)} indent />
          <Row label="CAC (once)" value={neg(b.cac)} indent />
          <Row label={`Teacher × ${b.months}`} value={neg(b.teacher)} indent />
          <Row label="Technology & developer reserve" value={neg(b.tech)} indent />
          <Row label={`Operations × ${Math.max(0, b.months - 1)}`} value={neg(b.ops)} indent />
          <Row label="Catch-up reserve" value={neg(b.catchup)} indent />
          <Row label="Doubt-session reserve" value={neg(b.doubt)} indent />
          {b.overhead > 0 && <Row label="Company overhead" value={neg(b.overhead)} indent />}
          <Row label="Total cost" value={neg(b.totalCost)} />
          <Row label="Contract contribution" value={inr(b.contribution)} strong tone={loss ? 'bad' : 'good'} />
          <Row label="Per month (average)" value={inr(b.perMonth)} tone={loss ? 'bad' : undefined} />
          <Row label="Per regular class" value={inr(b.perClass)} tone={loss ? 'bad' : undefined} />
          <Row label="Margin (of revenue ex GST)" value={`${b.marginPercent.toFixed(1)}%`} tone={loss ? 'bad' : undefined} />
          {b.perBatch !== null && <Row label="Per batch (all its children)" value={inr(b.perBatch)} tone={loss ? 'bad' : undefined} />}
          <Row label={b.months === 1 ? 'First-month target' : `Target (₹/month × ${b.months})`} value={inr(b.target)} tone="muted" />
          {b.renewal && (
            <div className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-[12.5px] text-slate-600">
              Each renewal month at this price leaves{' '}
              <strong className={b.renewal.contribution < b.renewal.target ? 'text-rose-700' : 'text-emerald-700'}>{inr(b.renewal.contribution)}</strong>{' '}
              against a target of {inr(b.renewal.target)} — no CAC, operations included.
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 p-3.5">
          <p className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-slate-500" style={{ fontFamily: 'var(--font-grotesk)' }}>
            {b.months > 1 ? 'Prepaid cash flow' : 'Cash flow'}
          </p>
          <Row label="Cash collected upfront" value={inr(b.price)} strong />
          <Row label="GST liability" value={neg(b.gst)} indent />
          <Row label="Gateway cost" value={neg(b.gateway)} indent />
          <Row label="CAC" value={neg(b.cac)} indent />
          <Row label={`Full future delivery reserve (${b.months} mo)`} value={neg(b.deliveryReserve)} indent />
          <Row label="Free contribution remaining" value={inr(b.contribution)} strong tone={loss ? 'bad' : 'good'} />
          {b.months > 1 && (
            <p className="mt-3 text-[12px] leading-relaxed text-slate-500">
              {inr(b.price)} arrives today, but {inr(b.deliveryReserve)} of it is already owed to {b.months} months of classes.
              Only the last line is money Sariro can spend.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
