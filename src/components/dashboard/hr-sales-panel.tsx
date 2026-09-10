'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Loader2, RefreshCw, FileText, BadgeCheck, IndianRupee, Check, X,
  TrendingUp, AlertCircle, Pencil,
} from 'lucide-react';
import { inr, type IncentiveBreakdown } from '@/lib/seller/incentives';
import { pct, type MetricWindows } from '@/lib/seller/metrics';

/**
 * SARIRO — HR's half of the sales pipeline
 * ============================================================================
 * Three things that had no screen at all:
 *
 *   · sales a seller has closed and nobody has invoiced
 *   · incentives that have been earned and not approved
 *   · what each seller is actually paid
 *
 * ── Punching is one button, and it is the last word ─────────────────────────
 * The confirm dialog is not politeness. `punch_sale()` locks who is credited,
 * counts the sale towards their month, and moves the family to enrolled — all
 * in one transaction, and after it neither a seller nor an ordinary HR user
 * can move the attribution. Correcting the seller is possible in the same
 * click and nowhere afterwards, so the seller is a field on the form rather
 * than something to fix later.
 */

interface WaitingLead {
  id: string;
  student_name: string | null;
  parent_name: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  subject: string | null;
  grade: number | null;
  sale_value: number | null;
  assigned_seller: string | null;
  trial_status: string | null;
  last_updated: string;
  seller?: { full_name?: string | null; email?: string | null } | null;
}

interface IncentiveRequest {
  id: string;
  seller_id: string;
  month_key: string;
  sales_count: number;
  tier_sales: number;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  breakdown: IncentiveBreakdown | null;
  decided_at: string | null;
  notes: string | null;
  seller?: { full_name?: string | null; email?: string | null } | null;
}

interface SellerRow {
  id: string;
  name: string;
  email: string | null;
  baseSalary: number;
  ownSalarySet: boolean;
  metrics: MetricWindows;
}

interface Payload {
  ok: boolean;
  waitingForInvoice: WaitingLead[];
  incentives: IncentiveRequest[];
  sellers: SellerRow[];
  tiersDescription: string;
}

export default function HrSalesPanel() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/hr/pipeline');
      const json = await res.json();
      if (!json?.ok) throw new Error(json?.message || 'Could not load the pipeline.');
      setData(json as Payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the pipeline.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading && !data) {
    return (
      <div className="card card-md flex items-center justify-center py-14">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card card-md">
        <p className="text-sm text-rose-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
        </p>
        <button onClick={() => void load()} className="mt-3 text-xs font-bold text-blue-700 hover:underline">
          Try again
        </button>
      </div>
    );
  }

  if (!data) return null;

  const pending = data.incentives.filter((i) => i.status === 'pending');

  return (
    <div className="space-y-5">
      {msg && (
        <p className="text-sm rounded-xl border border-blue-200 bg-blue-50 text-blue-900 px-3 py-2">{msg}</p>
      )}

      {/* ── Sales waiting to be invoiced ──────────────────────────────────── */}
      <section className="card card-md">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2" style={{ fontFamily: 'var(--font-grotesk)' }}>
            <FileText className="w-4 h-4 text-slate-400" />
            Invoice pending
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
              {data.waitingForInvoice.length}
            </span>
          </h2>
          <button onClick={() => void load()} className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1">
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {data.waitingForInvoice.length === 0 ? (
          <p className="text-sm text-slate-500 py-5 text-center">
            Nothing waiting. A seller marking a sale confirmed puts it here.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.waitingForInvoice.map((lead) => (
              <PunchRow key={lead.id} lead={lead} onDone={(m) => { setMsg(m); void load(); }} />
            ))}
          </ul>
        )}
      </section>

      {/* ── Incentives to approve ─────────────────────────────────────────── */}
      <section className="card card-md">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2 mb-1" style={{ fontFamily: 'var(--font-grotesk)' }}>
          <TrendingUp className="w-4 h-4 text-slate-400" />
          Incentives
          {pending.length > 0 && (
            <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-green-100 text-green-800">
              {pending.length} to decide
            </span>
          )}
        </h2>
        <p className="text-[11px] text-slate-500 mb-3">{data.tiersDescription}</p>

        {data.incentives.length === 0 ? (
          <p className="text-sm text-slate-500 py-5 text-center">
            Nothing earned yet. A request appears here the moment a seller crosses a tier.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.incentives.map((req) => (
              <IncentiveRow key={req.id} req={req} onDone={(m) => { setMsg(m); void load(); }} />
            ))}
          </ul>
        )}
      </section>

      {/* ── The sellers themselves ────────────────────────────────────────── */}
      <section className="card card-md">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2 mb-3" style={{ fontFamily: 'var(--font-grotesk)' }}>
          <IndianRupee className="w-4 h-4 text-slate-400" /> Sellers
        </h2>

        {data.sellers.length === 0 ? (
          <p className="text-sm text-slate-500 py-5 text-center">Nobody is set up as a seller.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <th className="text-left py-2">Seller</th>
                  <th className="text-right py-2">Leads</th>
                  <th className="text-right py-2">Trials</th>
                  <th className="text-right py-2">Sales</th>
                  <th className="text-right py-2">Conversion</th>
                  <th className="text-right py-2">Base pay</th>
                </tr>
              </thead>
              <tbody>
                {data.sellers.map((s) => (
                  <SellerRowView key={s.id} seller={s} onDone={(m) => { setMsg(m); void load(); }} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   One sale, punched
   ══════════════════════════════════════════════════════════════════════════ */

function PunchRow({ lead, onDone }: { lead: WaitingLead; onDone: (msg: string) => void }) {
  const [open, setOpen] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [sellerId, setSellerId] = useState(lead.assigned_seller ?? '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const punch = async () => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch('/api/hr/punch-sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceNumber: invoiceNumber.trim(),
          leadId: lead.id,
          /* Only sent when HR has actually changed it. Sending the unchanged
             value would be harmless but makes the audit trail read as though
             somebody made a decision they did not make. */
          ...(sellerId && sellerId !== lead.assigned_seller ? { sellerId } : {}),
        }),
      });
      const json = await res.json();
      if (!json?.ok) { setErr(json?.message ?? 'That did not go through.'); return; }
      onDone(`Punched ${json.sale.invoiceNumber} · ${inr(json.sale.amount)}. Attribution is now locked.`);
    } catch {
      setErr('Could not reach the server.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <li className="py-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900">
            {lead.student_name || 'Unnamed'}
            {lead.grade != null && <span className="ml-1.5 text-[11px] font-semibold text-slate-500">G{lead.grade}</span>}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {lead.subject || 'No subject'} · {lead.email || 'no email'} · {lead.phone || 'no phone'}
            {lead.country && lead.country !== 'IN' && <> · {lead.country}</>}
          </p>
          <p className="text-[11px] text-slate-500">
            Sold by <strong className="text-slate-700">{lead.seller?.full_name ?? 'unassigned'}</strong>
            {lead.sale_value != null && <> · quoted {inr(Number(lead.sale_value))}</>}
          </p>
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="px-3 py-1.5 text-xs font-bold rounded-lg border border-green-300 bg-green-50 text-green-800 hover:bg-green-100 flex items-center gap-1.5 shrink-0"
        >
          <BadgeCheck className="w-3.5 h-3.5" /> Punch sale
        </button>
      </div>

      {open && (
        <div className="mt-3 rounded-xl bg-slate-50 border border-slate-200 p-3">
          <p className="text-[11px] text-slate-600 mb-2">
            Raise the invoice first, then enter its number. Punching locks who is credited —
            this is the last moment the seller can be corrected.
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              value={invoiceNumber}
              onChange={(e) => { setInvoiceNumber(e.target.value); setErr(null); }}
              placeholder="SARIRO-INV-2026-0001"
              className="flex-1 min-w-[200px] h-10 px-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40"
            />
            <input
              value={sellerId}
              onChange={(e) => setSellerId(e.target.value)}
              placeholder="Seller id (leave as-is to keep)"
              className="flex-1 min-w-[200px] h-10 px-3 rounded-lg border border-slate-200 text-[11px] focus:outline-none focus:ring-2 focus:ring-green-500/40"
            />
            <button
              onClick={() => void punch()}
              disabled={busy || !invoiceNumber.trim()}
              className="h-10 px-4 rounded-lg bg-slate-900 text-white text-xs font-bold disabled:opacity-40 flex items-center gap-1.5"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Confirm sale
            </button>
          </div>
          {err && <p className="mt-2 text-[11px] text-rose-700">{err}</p>}
        </div>
      )}
    </li>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   One month's entitlement, decided
   ══════════════════════════════════════════════════════════════════════════ */

function IncentiveRow({ req, onDone }: { req: IncentiveRequest; onDone: (msg: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState('');
  const [err, setErr] = useState<string | null>(null);

  const decide = async (decision: 'approved' | 'rejected') => {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch('/api/hr/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'decide_incentive', requestId: req.id, decision, notes }),
      });
      const json = await res.json();
      if (!json?.ok) { setErr(json?.message ?? 'That did not go through.'); return; }
      onDone(
        decision === 'approved'
          ? `Approved ${inr(Number(req.amount))} for ${req.month_key}.`
          : `Rejected the ${req.month_key} incentive.`
      );
    } catch {
      setErr('Could not reach the server.');
    } finally {
      setBusy(false);
    }
  };

  const b = req.breakdown;

  return (
    <li className="py-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900">
            {req.seller?.full_name ?? 'Unknown seller'}
            <span className="ml-2 text-[11px] font-semibold text-slate-500">{req.month_key}</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {req.sales_count} {req.sales_count === 1 ? 'sale' : 'sales'}
            {req.tier_sales > 0 && <> · tier {req.tier_sales}</>}
            {b && b.extraSales > 0 && <> · {b.extraSales} above tier</>}
            {b && (b.bonus20kCount + b.bonus50kCount) > 0 && (
              <> · {b.bonus50kCount + b.bonus20kCount} value {b.bonus50kCount + b.bonus20kCount === 1 ? 'bonus' : 'bonuses'}</>
            )}
          </p>
          {b && (
            <p className="text-[11px] text-slate-400 mt-0.5">
              {inr(b.tierAmount)} tier + {inr(b.extraAmount)} per-sale + {inr(b.bonusAmount)} value
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-base font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
            {inr(Number(req.amount))}
          </span>
          {req.status === 'pending' ? (
            <>
              <button
                onClick={() => void decide('approved')}
                disabled={busy}
                className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-green-300 bg-green-50 text-green-800 hover:bg-green-100 disabled:opacity-50 flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" /> Approve
              </button>
              <button
                onClick={() => void decide('rejected')}
                disabled={busy}
                className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Reject
              </button>
            </>
          ) : (
            <span className={`text-[10px] font-extrabold uppercase px-2 py-1 rounded-full ${
              req.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
            }`}>
              {req.status}
            </span>
          )}
        </div>
      </div>

      {req.status === 'pending' && (
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Note (optional — the seller sees it if you reject)"
          className="mt-2 w-full h-9 px-2.5 rounded-lg border border-slate-200 text-[12px] focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        />
      )}
      {err && <p className="mt-2 text-[11px] text-rose-700">{err}</p>}
    </li>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   One seller's numbers, and their base pay
   ══════════════════════════════════════════════════════════════════════════ */

function SellerRowView({ seller, onDone }: { seller: SellerRow; onDone: (msg: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(seller.baseSalary));
  const [busy, setBusy] = useState(false);

  const m = seller.metrics.month;

  const save = async (clear = false) => {
    setBusy(true);
    try {
      const res = await fetch('/api/hr/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set_base_salary',
          sellerId: seller.id,
          amount: clear ? null : Number(value),
        }),
      });
      const json = await res.json();
      if (json?.ok) {
        setEditing(false);
        onDone(clear ? `${seller.name} is back on the company default.` : `${seller.name}'s base pay is now ${inr(Number(value))}.`);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="py-2.5">
        <p className="text-sm font-bold text-slate-900">{seller.name}</p>
        <p className="text-[10px] text-slate-400">this month</p>
      </td>
      <td className="py-2.5 text-right text-sm text-slate-700">{m.leadsReceived}</td>
      <td className="py-2.5 text-right text-sm text-slate-700">{m.trialsCompleted}/{m.trialsBooked}</td>
      <td className="py-2.5 text-right text-sm font-bold text-slate-900">{m.sales}</td>
      <td className="py-2.5 text-right text-sm text-blue-700 font-semibold">{pct(m.conversionRate)}</td>
      <td className="py-2.5 text-right">
        {editing ? (
          <div className="flex items-center gap-1 justify-end">
            <input
              value={value}
              onChange={(e) => setValue(e.target.value.replace(/[^\d.]/g, ''))}
              className="w-24 h-8 px-2 rounded-lg border border-slate-200 text-xs text-right"
            />
            <button onClick={() => void save()} disabled={busy} className="text-[11px] font-bold text-green-700 hover:underline">Save</button>
            {seller.ownSalarySet && (
              <button onClick={() => void save(true)} disabled={busy} className="text-[11px] font-bold text-slate-400 hover:underline">Clear</button>
            )}
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="text-sm text-slate-700 hover:text-slate-900 inline-flex items-center gap-1">
            {inr(seller.baseSalary)}
            {!seller.ownSalarySet && <span className="text-[9px] text-slate-400 uppercase font-bold">default</span>}
            <Pencil className="w-3 h-3 text-slate-300" />
          </button>
        )}
      </td>
    </tr>
  );
}
