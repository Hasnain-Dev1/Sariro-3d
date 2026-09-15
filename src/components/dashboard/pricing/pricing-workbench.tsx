'use client';

import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle, BadgeCheck, Calculator, ChevronDown, Globe, History, Layers, Loader2, PieChart, Save,
  SlidersHorizontal, Users, XCircle,
} from 'lucide-react';
import {
  NOT_APPROVED, PLAN_LABEL, PLAN_MONTHS, RATIOS,
  breakdown, inr, isApproved, ladderWarnings, mathematicalMinimum, recommendedFloor, sellerFloor,
  type EconomicsInputs, type LadderEntry, type LadderWarning, type PlanMonths, type Ratio,
} from '@/lib/pricing/economics';
import { DEFAULT_PRICE_BOOK, type PriceBook } from '@/lib/pricing/price-book';
import BreakdownView from './breakdown-view';
import { Card, NumberField, Segmented, StatusChip, Toggle } from './fields';
import { AssumptionsPanel, PlanMixPanel, SalesCapacityPanel } from './pricing-models';
import SitePricesEditor from './site-prices-editor';

/**
 * SARIRO — the pricing & profitability calculator
 * ============================================================================
 * For HR and the super admin (the same screen in both dashboards). Works out
 * the lowest safe price for every 1:4 and 1:1 plan from everything a seat
 * really costs — GST, the gateway, CAC, the teacher, the technology reserve,
 * operations, the catch-up and doubt obligations, over the whole plan — and
 * keeps the ladder sellers quote from: public price, two offers, and a floor.
 *
 * Saving writes the price book (/api/pricing/price-book); sellers read their
 * part of it on their Prices page. The website's dollar prices are a separate,
 * smaller editor on the last tab.
 *
 * The arithmetic is all in lib/pricing/economics.ts, tested; this file only
 * draws it.
 */

type Tab = 'prices' | 'tester' | 'assumptions' | 'team' | 'mix' | 'website';

const TABS: { key: Tab; label: string; icon: typeof Layers }[] = [
  { key: 'prices', label: 'Price list', icon: Layers },
  { key: 'tester', label: 'Test a price', icon: Calculator },
  { key: 'assumptions', label: 'Assumptions', icon: SlidersHorizontal },
  { key: 'team', label: 'Sales team', icon: Users },
  { key: 'mix', label: 'Plan mix', icon: PieChart },
  { key: 'website', label: 'Website ($)', icon: Globe },
];

interface Loaded {
  configured: boolean;
  saved: boolean;
  book: PriceBook;
  updatedAt: string | null;
  updatedBy: string | null;
  history: { changedAt: string; changedBy: string | null; note: string | null }[];
}

const WARNING_TEXT: Record<LadderWarning, string> = {
  public_below_floor: 'The public price is below the seller floor.',
  offer1_below_floor: 'The normal offer is below the floor — sellers will not see it.',
  offer2_below_floor: 'The closing offer is below the floor — sellers will not see it.',
  offers_out_of_order: 'Offers should step down: public, then normal, then closing.',
  manual_floor_below_minimum: 'The manager’s floor is below the mathematical minimum — every sale at it misses the target.',
  no_public_price: 'No public price set.',
};

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString([], { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '';

export default function PricingWorkbench() {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [book, setBook] = useState<PriceBook>(DEFAULT_PRICE_BOOK);
  const [tab, setTab] = useState<Tab>('prices');
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const apply = useCallback((j: Loaded) => {
    setLoaded(j);
    setBook(j.book);
  }, []);

  useEffect(() => {
    let live = true;
    fetch('/api/pricing/price-book', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => {
        if (!live) return;
        if (j?.ok) apply(j as Loaded);
        else setError(j?.message ?? 'Could not load the price book.');
      })
      .catch(() => { if (live) setError('Could not load the price book.'); });
    return () => { live = false; };
  }, [apply]);

  const dirty = useMemo(() => !!loaded && JSON.stringify(book) !== JSON.stringify(loaded.book), [book, loaded]);

  const patchInputs = (p: Partial<EconomicsInputs>) => { setMsg(null); setBook((b) => ({ ...b, inputs: { ...b.inputs, ...p } })); };
  const patchEntry = (ratio: Ratio, months: PlanMonths, p: Partial<LadderEntry>) => {
    setMsg(null);
    setBook((b) => ({ ...b, ladder: { ...b.ladder, [ratio]: { ...b.ladder[ratio], [months]: { ...b.ladder[ratio][months], ...p } } } }));
  };

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch('/api/pricing/price-book', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ book, note: note.trim() || undefined }),
      });
      const j = await res.json();
      if (j?.ok) {
        apply(j as Loaded);
        setNote('');
        setMsg({ ok: true, text: 'Saved. Sellers see the new price list on their next load.' });
      } else {
        setMsg({ ok: false, text: j?.message ?? 'That did not save.' });
      }
    } catch {
      setMsg({ ok: false, text: 'That did not save.' });
    } finally {
      setSaving(false);
    }
  };

  if (error) {
    return <Card><p className="text-[13px] text-rose-700 font-semibold">{error}</p></Card>;
  }
  if (!loaded) {
    return (
      <Card>
        <div className="flex items-center gap-2 text-[13px] text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading the price book…</div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {!loaded.configured && (
        <p className="flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-[13px] text-amber-900">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            Saving is waiting on a database update — run <code className="px-1 rounded bg-amber-100">scripts/price-book.sql</code> in Supabase.
            The calculator works on the defaults until then, and sellers see the default price list.
          </span>
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-[12.5px] text-slate-500">
          {loaded.saved
            ? <>Last saved {when(loaded.updatedAt)}{loaded.updatedBy ? ` by ${loaded.updatedBy}` : ''}.</>
            : 'Not saved yet — these are the founder’s defaults of 15 Sep 2026.'}
          {loaded.history.length > 0 && (
            <button type="button" onClick={() => setShowHistory((s) => !s)} className="ml-2 inline-flex items-center gap-1 font-bold text-slate-600 hover:text-slate-900">
              <History className="w-3.5 h-3.5" /> {showHistory ? 'Hide' : 'Show'} changes
            </button>
          )}
        </div>
        <div className="overflow-x-auto max-w-full">
          <Segmented
            size="sm"
            value={tab}
            onChange={setTab}
            options={TABS.map((t) => ({ value: t.key, label: <span className="inline-flex items-center gap-1.5"><t.icon className="w-3.5 h-3.5" />{t.label}</span> }))}
          />
        </div>
      </div>

      {showHistory && (
        <Card title="Recent changes" icon={<History className="w-4 h-4 text-slate-500" />}>
          <ul className="divide-y divide-slate-100 text-[13px]">
            {loaded.history.map((h, idx) => (
              <li key={idx} className="py-2 flex flex-wrap gap-x-3">
                <span className="font-semibold text-slate-800">{when(h.changedAt)}</span>
                <span className="text-slate-500">{h.changedBy ?? 'Someone'}</span>
                {h.note && <span className="text-slate-700">— {h.note}</span>}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {tab === 'prices' && <PriceList book={book} onEntry={patchEntry} />}
      {tab === 'tester' && <PriceTester book={book} />}
      {tab === 'assumptions' && <AssumptionsPanel inputs={book.inputs} onChange={patchInputs} />}
      {tab === 'team' && <SalesCapacityPanel inputs={book.inputs} onChange={patchInputs} />}
      {tab === 'mix' && <PlanMixPanel inputs={book.inputs} ladder={book.ladder} mix={book.mix} onChange={(m) => { setMsg(null); setBook((b) => ({ ...b, mix: m })); }} />}
      {tab === 'website' && <SitePricesEditor />}

      {tab !== 'website' && (dirty || msg) && (
        <div className="sticky bottom-3 z-20 rounded-2xl border border-slate-200 bg-white/95 backdrop-blur px-3.5 py-3 shadow-[0_18px_40px_-20px_rgba(15,23,42,0.45)] flex flex-wrap items-center gap-2.5">
          {dirty && (
            <>
              <span className="text-[13px] font-bold text-slate-900">Unsaved changes</span>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What changed, and why (optional)"
                maxLength={500}
                className="flex-1 min-w-[12rem] h-9 rounded-lg border border-slate-200 px-2.5 text-[13px] outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => { setBook(loaded.book); setMsg(null); }}
                className="h-9 px-3 rounded-lg text-[13px] font-bold text-slate-500 hover:text-slate-800"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={() => void save()}
                disabled={saving || !loaded.configured}
                title={loaded.configured ? undefined : 'Run scripts/price-book.sql first'}
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] font-bold disabled:opacity-40"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save price book
              </button>
            </>
          )}
          {msg && <span className={`text-[12.5px] font-semibold ${msg.ok ? 'text-emerald-700' : 'text-rose-700'}`}>{msg.text}</span>}
        </div>
      )}
    </div>
  );
}

/* ── Price list ──────────────────────────────────────────────────────────── */

function PriceList({ book, onEntry }: { book: PriceBook; onEntry: (r: Ratio, m: PlanMonths, p: Partial<LadderEntry>) => void }) {
  const [ratio, setRatio] = useState<Ratio>('1:4');
  const [open, setOpen] = useState<PlanMonths | null>(null);
  const i = book.inputs;

  return (
    <Card
      title="Seller price list"
      aside={<Segmented value={ratio} onChange={(v) => { setRatio(v); setOpen(null); }} options={RATIOS.map((r) => ({ value: r, label: r === '1:4' ? '1:4 group' : '1:1' }))} />}
    >
      <p className="text-[12.5px] text-slate-600 mb-3 max-w-3xl">
        Sellers start at the public price, come down to the normal offer, then the closing offer — and may never go under the floor.
        Leave the floor blank to use the maths minimum plus your buffer. All prices include GST.
      </p>
      <div className="overflow-x-auto -mx-1 px-1">
        <table className="w-full min-w-[920px] text-[13px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500">
              <th className="py-2 pr-2 font-bold">Plan</th>
              <th className="py-2 px-1.5 font-bold">Public price</th>
              <th className="py-2 px-1.5 font-bold">Normal offer</th>
              <th className="py-2 px-1.5 font-bold">Closing offer</th>
              <th className="py-2 px-1.5 font-bold">Seller floor</th>
              <th className="py-2 px-1.5 font-bold text-right">Maths minimum</th>
              <th className="py-2 px-1.5 font-bold text-right">At public price</th>
              <th className="py-2 pl-1.5" />
            </tr>
          </thead>
          <tbody>
            {PLAN_MONTHS.map((months) => {
              const e = book.ladder[ratio][months];
              const min = mathematicalMinimum(i, ratio, months);
              const floor = sellerFloor(i, ratio, months, e);
              const auto = recommendedFloor(i, ratio, months);
              const b = breakdown(i, ratio, months, e.publicPrice ?? floor);
              const warnings = ladderWarnings(i, ratio, months, e);
              const below = (v: number | null) => !!v && v < floor;
              const isOpen = open === months;
              return (
                <Fragment key={months}>
                  <tr className="border-t border-slate-100 align-top">
                    <td className="py-2.5 pr-2">
                      <p className="font-extrabold text-slate-900 whitespace-nowrap">{PLAN_LABEL[months]}</p>
                      <p className="text-[11.5px] text-slate-500">{months * (ratio === '1:4' ? i.groupClassesPerMonth : i.oneClassesPerMonth)} classes</p>
                    </td>
                    <td className="py-2 px-1.5 w-[9.5rem]">
                      <NumberField compact prefix="₹" allowEmpty value={e.publicPrice} invalid={below(e.publicPrice)} onChange={(v) => onEntry(ratio, months, { publicPrice: v })} />
                    </td>
                    <td className="py-2 px-1.5 w-[9.5rem]">
                      <NumberField compact prefix="₹" allowEmpty value={e.offer1} placeholder="—" invalid={below(e.offer1)} onChange={(v) => onEntry(ratio, months, { offer1: v })} />
                    </td>
                    <td className="py-2 px-1.5 w-[9.5rem]">
                      <NumberField compact prefix="₹" allowEmpty value={e.offer2} placeholder="—" invalid={below(e.offer2)} onChange={(v) => onEntry(ratio, months, { offer2: v })} />
                    </td>
                    <td className="py-2 px-1.5 w-[9.5rem]">
                      <NumberField
                        compact
                        prefix="₹"
                        allowEmpty
                        value={e.manualFloor}
                        placeholder={Number.isFinite(auto) ? `${auto.toLocaleString('en-IN')} auto` : '—'}
                        invalid={warnings.includes('manual_floor_below_minimum')}
                        onChange={(v) => onEntry(ratio, months, { manualFloor: v })}
                      />
                      <p className="mt-0.5 text-[10.5px] font-semibold text-slate-400">{e.manualFloor ? 'manager-approved' : 'minimum + buffer'}</p>
                    </td>
                    <td className="py-2.5 px-1.5 text-right tabular-nums">
                      <p className="font-bold text-slate-900">{inr(Math.ceil(min.value))}</p>
                      {min.renewal !== null && (
                        <p className="text-[11px] text-slate-500 leading-snug">
                          month 1 {inr(Math.ceil(min.firstMonth))}<br />renewal {inr(Math.ceil(min.renewal))}
                        </p>
                      )}
                    </td>
                    <td className="py-2.5 px-1.5 text-right">
                      <StatusChip status={b.status} />
                      <p className={`mt-1 text-[12px] font-bold tabular-nums ${b.contribution < 0 ? 'text-rose-700' : 'text-slate-800'}`}>{inr(b.perMonth)}/mo</p>
                      <p className="text-[11px] text-slate-500 tabular-nums">{b.marginPercent.toFixed(0)}% margin</p>
                    </td>
                    <td className="py-2.5 pl-1.5 text-right">
                      <button
                        type="button"
                        onClick={() => setOpen(isOpen ? null : months)}
                        aria-expanded={isOpen}
                        className="inline-flex items-center gap-1 h-8 px-2.5 rounded-lg text-[12px] font-bold text-slate-600 hover:bg-slate-100"
                      >
                        Breakdown <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </td>
                  </tr>
                  {warnings.length > 0 && (
                    <tr>
                      <td colSpan={8} className="pb-2.5">
                        <div className="flex flex-wrap gap-1.5">
                          {warnings.map((w) => (
                            <span key={w} className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11.5px] font-semibold text-amber-800">
                              <AlertTriangle className="w-3 h-3" /> {WARNING_TEXT[w]}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                  {isOpen && (
                    <tr>
                      <td colSpan={8} className="pb-4">
                        <div className="rounded-xl bg-slate-50/60 border border-slate-100 p-3">
                          <p className="mb-2 text-[12px] text-slate-500">At {e.publicPrice ? `the public price, ${inr(e.publicPrice)}` : `the seller floor, ${inr(floor)}`}:</p>
                          <BreakdownView b={b} />
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ── Price tester ────────────────────────────────────────────────────────── */

function PriceTester({ book }: { book: PriceBook }) {
  const [ratio, setRatio] = useState<Ratio>('1:4');
  const [months, setMonths] = useState<PlanMonths>(6);
  const [price, setPrice] = useState<number | null>(null);
  /* Stress tests for this check only — the saved assumptions do not change. */
  const [occupancy, setOccupancy] = useState<number>(book.inputs.batchOccupancy);
  const [abroad, setAbroad] = useState(false);

  const i: EconomicsInputs = { ...book.inputs, batchOccupancy: occupancy, gstEnabled: abroad ? false : book.inputs.gstEnabled };
  const e = book.ladder[ratio][months];
  const floor = sellerFloor(i, ratio, months, e);
  const min = mathematicalMinimum(i, ratio, months).value;
  const tested = price ?? e.publicPrice ?? floor;
  const b = breakdown(i, ratio, months, tested);
  const approved = isApproved(tested, floor);

  const rungs = [
    { label: 'Public', v: e.publicPrice },
    { label: 'Normal offer', v: e.offer1 },
    { label: 'Closing offer', v: e.offer2 },
    { label: 'Seller floor', v: floor },
    { label: 'Maths minimum', v: Math.ceil(min) },
  ].filter((r): r is { label: string; v: number } => !!r.v && Number.isFinite(r.v));

  return (
    <div className="space-y-4">
      <Card title="Test a price">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <span className="block text-[12px] font-bold text-slate-600 mb-1">Class type</span>
            <Segmented value={ratio} onChange={setRatio} options={RATIOS.map((r) => ({ value: r, label: r }))} />
          </div>
          <div>
            <span className="block text-[12px] font-bold text-slate-600 mb-1">Plan</span>
            <Segmented value={months} onChange={setMonths} options={PLAN_MONTHS.map((m) => ({ value: m, label: PLAN_LABEL[m] }))} />
          </div>
          <div className="w-48">
            <NumberField label="Price (incl. GST)" prefix="₹" allowEmpty value={price} placeholder={String(e.publicPrice ?? floor)} onChange={setPrice} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-5">
          {ratio === '1:4' && (
            <div>
              <span className="block text-[12px] font-bold text-slate-600 mb-1">Children in the batch</span>
              <Segmented size="sm" value={occupancy} onChange={setOccupancy} options={[4, 3, 2, 1].map((n) => ({ value: n, label: String(n) }))} />
            </div>
          )}
          <Toggle checked={abroad} onChange={setAbroad} label="Family pays from outside India" hint="No GST in the price." />
        </div>

        <div className={`mt-4 flex items-center gap-2.5 rounded-xl border px-3.5 py-3 ${approved ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-300 bg-rose-50 text-rose-800'}`}>
          {approved ? <BadgeCheck className="w-5 h-5 shrink-0" /> : <XCircle className="w-5 h-5 shrink-0" />}
          <p className="text-[14px] font-extrabold tracking-tight">
            {approved ? `Approved — ${inr(tested)} is at or above the floor of ${inr(floor)}` : NOT_APPROVED}
          </p>
          <span className="ml-auto"><StatusChip status={b.status} /></span>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {rungs.map((r) => (
            <span key={r.label} className={`rounded-lg border px-2 py-1 text-[12px] tabular-nums ${tested >= r.v ? 'border-slate-200 bg-white text-slate-700' : 'border-slate-100 bg-slate-50 text-slate-400'}`}>
              {r.label} <strong>{inr(r.v)}</strong>
            </span>
          ))}
        </div>
      </Card>

      <Card>
        <BreakdownView b={b} />
      </Card>
    </div>
  );
}
