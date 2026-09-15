'use client';

import { AlertTriangle, BadgeIndianRupee, Calculator, GraduationCap, Landmark, Megaphone, ShieldCheck, Target, Users } from 'lucide-react';
import {
  PLAN_LABEL, PLAN_MONTHS, RATIOS,
  capacityPlan, inr, keepFactor, mathematicalMinimum, monthlyCost, planMix, teamSales,
  type EconomicsInputs, type Ladder, type PlanMix, type PriceBasis,
} from '@/lib/pricing/economics';
import { Card, NumberField, Segmented, Stat, Toggle } from './fields';

type Patch = (p: Partial<EconomicsInputs>) => void;

/* ── Assumptions ─────────────────────────────────────────────────────────── */

export function AssumptionsPanel({ inputs: i, onChange }: { inputs: EconomicsInputs; onChange: Patch }) {
  const k = keepFactor(i);
  const cac = i.cacSource === 'target' ? capacityPlan(i).cac : teamSales(i).cac;
  const g = monthlyCost(i, '1:4');
  const o = monthlyCost(i, '1:1');
  const money = (key: keyof EconomicsInputs) => ({
    value: i[key] as number,
    onChange: (v: number | null) => onChange({ [key]: v ?? 0 } as Partial<EconomicsInputs>),
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <Stat label="Kept of every ₹100" value={k > 0 ? `₹${(k * 100).toFixed(1)}` : '₹0'} sub={i.gstEnabled ? `after ${i.gstRate}% GST and ${i.gatewayRate}% gateway` : `no GST · ${i.gatewayRate}% gateway`} tone={k > 0 ? 'default' : 'bad'} />
        <Stat label="CAC per student" value={inr(cac)} sub={i.cacSource === 'target' ? 'from the growth plan' : 'from today’s team'} />
        <Stat label="1:4 cost / month" value={`${inr(g.firstMonth)} → ${inr(g.laterMonth)}`} sub={`month 1 → month 2+ · ${i.batchOccupancy} in the batch`} />
        <Stat label="1:1 cost / month" value={`${inr(o.firstMonth)} → ${inr(o.laterMonth)}`} sub="month 1 → month 2+" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Tax & payment gateway" icon={<Landmark className="w-4 h-4 text-slate-500" />}>
          <div className="space-y-3.5">
            <Toggle
              checked={i.gstEnabled}
              onChange={(v) => onChange({ gstEnabled: v })}
              label="GST included in the price"
              hint="Turn off to price a family paying from outside India — no GST applies to them."
            />
            <div className="grid grid-cols-2 gap-3">
              <NumberField label="GST rate" suffix="%" {...money('gstRate')} disabled={!i.gstEnabled} />
              <NumberField label="Gateway fee" suffix="% of payment" {...money('gatewayRate')} hint="On the whole upfront payment." />
            </div>
          </div>
        </Card>

        <Card title="Sales team" icon={<Megaphone className="w-4 h-4 text-slate-500" />}>
          <div className="grid grid-cols-3 gap-3">
            <NumberField label="Salary" prefix="₹" {...money('sellerSalary')} />
            <NumberField label="Food" prefix="₹" {...money('sellerFood')} />
            <NumberField label="Fuel / travel" prefix="₹" {...money('sellerTravel')} />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <NumberField label="Sellers" {...money('sellers')} />
            <NumberField label="New students / month" {...money('studentsAcquired')} />
          </div>
          <p className="mt-2.5 text-[12px] text-slate-500">
            {inr(teamSales(i).costPerSeller)} a seller · {teamSales(i).productivity.toFixed(1)} students each · CAC {inr(teamSales(i).cac)}.
            CAC is charged once, when the student joins — never on a renewal.
          </p>
        </Card>

        <Card title="Teachers" icon={<GraduationCap className="w-4 h-4 text-slate-500" />}>
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mb-2" style={{ fontFamily: 'var(--font-grotesk)' }}>1:4 group</p>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Pay per class" prefix="₹" {...money('groupTeacherRate')} />
            <NumberField label="Classes / month" {...money('groupClassesPerMonth')} />
          </div>
          <div className="mt-3">
            <span className="block text-[12px] font-bold text-slate-600 mb-1">Children in the batch</span>
            <Segmented
              value={i.batchOccupancy}
              onChange={(v) => onChange({ batchOccupancy: v })}
              options={[4, 3, 2, 1].map((n) => ({ value: n, label: n === 4 ? '4 (full)' : String(n) }))}
            />
            <p className="mt-1.5 text-[12px] text-slate-500">
              Teacher cost per child: {inr(g.teacher)}. Seller prices assume a full batch of 4 — fewer stress-tests a half-empty one.
            </p>
          </div>
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mt-4 mb-2" style={{ fontFamily: 'var(--font-grotesk)' }}>1:1</p>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Pay per class" prefix="₹" {...money('oneTeacherRate')} />
            <NumberField label="Classes / month" {...money('oneClassesPerMonth')} />
          </div>
        </Card>

        <Card title="Reserves, per student per month" icon={<ShieldCheck className="w-4 h-4 text-slate-500" />}>
          <Toggle
            checked={i.conservative}
            onChange={(v) => onChange({ conservative: v })}
            label="Conservative mode"
            hint="Every catch-up and doubt session used, every month, full operations, technology and CAC. Use this to set seller floors."
          />
          <div className="grid grid-cols-2 gap-3 mt-3.5">
            <NumberField label="Technology & developer" prefix="₹" {...money('techReserve')} hint="Developers, hosting, AI, messages, storage." />
            <NumberField label="Operations (month 2+)" prefix="₹" {...money('opsCost')} hint="Renewals, support, relationship." />
            <NumberField label="Catch-up reserve" prefix="₹" {...money('catchupReserve')} />
            <NumberField label="Catch-up used" suffix="%" {...money('catchupUtilisation')} disabled={i.conservative} hint={i.conservative ? 'Locked at 100% in conservative mode.' : undefined} />
            <NumberField label="Doubt-session reserve" prefix="₹" {...money('doubtReserve')} />
            <NumberField label="Doubt sessions used" suffix="%" {...money('doubtUtilisation')} disabled={i.conservative} hint={i.conservative ? 'Locked at 100% in conservative mode.' : undefined} />
            <NumberField label="Company overhead" prefix="₹" {...money('overhead')} hint="Optional. Accounting and compliance, if you want them in the price." />
          </div>
        </Card>

        <Card title="Profit targets" icon={<Target className="w-4 h-4 text-slate-500" />}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <NumberField label="Minimum per month" prefix="₹" {...money('minContributionPerMonth')} hint="3 months needs 3×, a year 12×." />
            <NumberField label="First month (monthly plan)" prefix="₹" {...money('firstMonthContribution')} hint="Small — CAC is earned back on renewals." />
            <NumberField label="Each renewal month" prefix="₹" {...money('renewalMonthContribution')} />
          </div>
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 mt-4 mb-2" style={{ fontFamily: 'var(--font-grotesk)' }}>Status</p>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Green at or above" suffix="% of target" {...money('greenAtPercent')} />
            <NumberField label="Yellow at or above" suffix="% of target" {...money('yellowAtPercent')} hint="Below this is red." />
          </div>
        </Card>

        <Card title="Seller floor" icon={<BadgeIndianRupee className="w-4 h-4 text-slate-500" />}>
          <p className="text-[12.5px] text-slate-600 mb-3">
            Sellers never see the mathematical minimum. Their floor is the minimum plus this buffer, rounded up to end in 99 —
            unless you type a manager-approved floor for a plan in the price list.
          </p>
          <Segmented
            value={i.bufferMode}
            onChange={(v) => onChange({ bufferMode: v })}
            options={[{ value: 'fixed', label: 'Fixed ₹' }, { value: 'percent', label: 'Percentage' }]}
          />
          <div className="mt-3 max-w-[14rem]">
            <NumberField
              label="Buffer above the minimum"
              prefix={i.bufferMode === 'fixed' ? '₹' : undefined}
              suffix={i.bufferMode === 'percent' ? '%' : undefined}
              {...money('bufferValue')}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ── Sales team capacity ─────────────────────────────────────────────────── */

export function SalesCapacityPanel({ inputs: i, onChange }: { inputs: EconomicsInputs; onChange: Patch }) {
  const team = teamSales(i);
  const plan = capacityPlan(i);
  const withCac = (source: 'team' | 'target') => ({ ...i, cacSource: source });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Today’s team" icon={<Users className="w-4 h-4 text-slate-500" />}>
          <div className="grid grid-cols-2 gap-2.5">
            <Stat label="Sellers" value={team.sellers} sub={`${inr(team.costPerSeller)} each`} />
            <Stat label="New students / month" value={team.students} sub={`${team.productivity.toFixed(1)} per seller`} />
            <Stat label="Team cost / month" value={inr(team.teamCost)} />
            <Stat label="CAC per student" value={inr(team.cac)} />
          </div>
          <p className="mt-3 text-[12px] text-slate-500">Change these under Assumptions → Sales team.</p>
        </Card>

        <Card title="Growth plan" icon={<Calculator className="w-4 h-4 text-slate-500" />}>
          <div className="grid grid-cols-2 gap-3">
            <NumberField label="Target new students / month" value={i.targetStudents} onChange={(v) => onChange({ targetStudents: v ?? 0 })} />
            <NumberField
              label="Students per seller"
              value={i.productivityOverride}
              allowEmpty
              placeholder={`${team.productivity.toFixed(1)} (today)`}
              onChange={(v) => onChange({ productivityOverride: v })}
              hint="Blank uses today’s team."
            />
          </div>
          <div className="grid grid-cols-3 gap-2.5 mt-3">
            <Stat label="Sellers needed" value={plan.sellers} sub={plan.productivity > 0 ? `${plan.students} ÷ ${plan.productivity.toFixed(2)}, rounded up` : 'set productivity'} />
            <Stat label="Team cost" value={inr(plan.teamCost)} />
            <Stat label="CAC" value={inr(plan.cac)} tone={plan.cac > team.cac ? 'bad' : 'good'} />
          </div>
        </Card>
      </div>

      <Card
        title="Which CAC the prices use"
        aside={
          <Segmented
            size="sm"
            value={i.cacSource}
            onChange={(v) => onChange({ cacSource: v })}
            options={[{ value: 'team', label: 'Today’s team' }, { value: 'target', label: 'Growth plan' }]}
          />
        }
      >
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full min-w-[520px] text-[13px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500">
                <th className="py-2 font-bold">Maths minimum</th>
                {RATIOS.map((r) => (
                  <th key={r} colSpan={2} className="py-2 font-bold text-right">{r} · team → growth</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {PLAN_MONTHS.map((m) => (
                <tr key={m}>
                  <td className="py-2 font-semibold text-slate-800">{PLAN_LABEL[m]}</td>
                  {RATIOS.map((r) => (
                    <td key={r} colSpan={2} className="py-2 text-right tabular-nums text-slate-700">
                      {inr(Math.ceil(mathematicalMinimum(withCac('team'), r, m).value))}
                      <span className="text-slate-400"> → </span>
                      <strong className="text-slate-900">{inr(Math.ceil(mathematicalMinimum(withCac('target'), r, m).value))}</strong>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

/* ── Plan mix ────────────────────────────────────────────────────────────── */

const BASIS_LABEL: Record<PriceBasis, string> = { public: 'Public price', offer1: 'Normal offer', offer2: 'Closing offer', floor: 'Seller floor' };

export function PlanMixPanel({
  inputs,
  ladder,
  mix,
  onChange,
}: {
  inputs: EconomicsInputs;
  ladder: Ladder;
  mix: PlanMix;
  onChange: (m: PlanMix) => void;
}) {
  const r = planMix(inputs, ladder, mix);
  const off = Math.abs(r.percentTotal - 100) > 0.001;

  return (
    <div className="space-y-4">
      <Card title="A month’s new students">
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-40">
            <NumberField label="Students" value={mix.cohort} onChange={(v) => onChange({ ...mix, cohort: Math.max(0, Math.round(v ?? 0)) })} />
          </div>
          <div>
            <span className="block text-[12px] font-bold text-slate-600 mb-1">Class type</span>
            <Segmented value={mix.ratio} onChange={(v) => onChange({ ...mix, ratio: v })} options={RATIOS.map((x) => ({ value: x, label: x }))} />
          </div>
          <div>
            <span className="block text-[12px] font-bold text-slate-600 mb-1">Sold at</span>
            <Segmented
              size="sm"
              value={mix.basis}
              onChange={(v) => onChange({ ...mix, basis: v })}
              options={(Object.keys(BASIS_LABEL) as PriceBasis[]).map((b) => ({ value: b, label: BASIS_LABEL[b] }))}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
          {PLAN_MONTHS.map((m) => (
            <NumberField
              key={m}
              label={PLAN_LABEL[m]}
              suffix="%"
              value={mix.percents[m]}
              onChange={(v) => onChange({ ...mix, percents: { ...mix.percents, [m]: Math.max(0, Math.min(100, v ?? 0)) } })}
            />
          ))}
        </div>
        {off && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1.5 text-[12.5px] font-semibold text-amber-800">
            <AlertTriangle className="w-4 h-4" /> The plans add up to {r.percentTotal}%, not 100% — students are shared out in proportion.
          </p>
        )}
        {mix.basis !== 'public' && mix.basis !== 'floor' && (
          <p className="mt-2 text-[12px] text-slate-500">A plan without that offer is priced at its seller floor.</p>
        )}
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5">
        <Stat label="Cash collected" value={inr(r.totals.cash)} />
        <Stat label="GST" value={inr(r.totals.gst)} tone="muted" />
        <Stat label="CAC" value={inr(r.totals.cac)} tone="muted" />
        <Stat label="Future delivery reserve" value={inr(r.totals.reserve)} tone="muted" />
        <Stat label="Contract contribution" value={inr(r.totals.contribution)} tone={r.totals.contribution < 0 ? 'bad' : 'good'} />
      </div>

      <Card>
        <div className="overflow-x-auto -mx-1 px-1">
          <table className="w-full min-w-[760px] text-[13px]">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500">
                <th className="py-2 font-bold">Plan</th>
                <th className="py-2 font-bold text-right">Students</th>
                <th className="py-2 font-bold text-right">Price</th>
                <th className="py-2 font-bold text-right">Cash upfront</th>
                <th className="py-2 font-bold text-right">GST</th>
                <th className="py-2 font-bold text-right">Gateway</th>
                <th className="py-2 font-bold text-right">CAC</th>
                <th className="py-2 font-bold text-right">Delivery reserve</th>
                <th className="py-2 font-bold text-right">Contribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 tabular-nums">
              {r.rows.map((row) => (
                <tr key={row.months} className={row.students === 0 ? 'text-slate-400' : 'text-slate-700'}>
                  <td className="py-2 font-semibold text-slate-800">{PLAN_LABEL[row.months]}</td>
                  <td className="py-2 text-right">{row.students}</td>
                  <td className="py-2 text-right">{inr(row.price)}</td>
                  <td className="py-2 text-right">{inr(row.cash)}</td>
                  <td className="py-2 text-right">{inr(row.gst)}</td>
                  <td className="py-2 text-right">{inr(row.gateway)}</td>
                  <td className="py-2 text-right">{inr(row.cac)}</td>
                  <td className="py-2 text-right">{inr(row.reserve)}</td>
                  <td className={`py-2 text-right font-bold ${row.contribution < 0 ? 'text-rose-700' : 'text-emerald-700'}`}>{inr(row.contribution)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-slate-200 font-extrabold text-slate-900">
                <td className="py-2.5">Total</td>
                <td className="py-2.5 text-right">{r.totals.students}</td>
                <td className="py-2.5" />
                <td className="py-2.5 text-right">{inr(r.totals.cash)}</td>
                <td className="py-2.5 text-right">{inr(r.totals.gst)}</td>
                <td className="py-2.5 text-right">{inr(r.totals.gateway)}</td>
                <td className="py-2.5 text-right">{inr(r.totals.cac)}</td>
                <td className="py-2.5 text-right">{inr(r.totals.reserve)}</td>
                <td className={`py-2.5 text-right ${r.totals.contribution < 0 ? 'text-rose-700' : 'text-emerald-700'}`}>{inr(r.totals.contribution)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
