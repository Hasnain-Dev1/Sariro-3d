'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, Copy, ExternalLink, Link2, Loader2, MessageCircle, RefreshCw } from 'lucide-react';
import { PLAN_LABEL, PLAN_MONTHS, RATIOS, inr, type PlanMonths, type Ratio } from '@/lib/pricing/economics';
import { whatsappShareUrl } from '@/lib/payments/link-request';
import { toE164 } from '@/lib/phone/countries';
import { NumberField, Segmented } from '@/components/dashboard/pricing/fields';
import { ApprovalBanner, floorOf, useSellerPrices } from '@/components/dashboard/seller-price-list';

/**
 * SARIRO — a rupee payment link, from the dashboard
 * ============================================================================
 * For a family in India who has agreed on a call: pick the plan, check the
 * price against the floor, make a Razorpay link (UPI, cards, net banking) and
 * send it on WhatsApp in one tap. api/payments/links does the real checks.
 */

export interface LinkCustomer {
  leadId?: string | null;
  name?: string | null;
  phone?: string | null;
  phoneCountry?: string | null;
  email?: string | null;
}

interface Created {
  url: string;
  amount: number;
  ratio: Ratio;
  months: PlanMonths;
  name: string;
  phone: string;
  belowFloor: boolean;
}

/** A stored phone as +CC…, whichever way the lead form saved it. */
function e164Of(phone: string | null | undefined, country: string | null | undefined): string {
  const p = (phone ?? '').trim();
  if (!p) return '';
  if (p.startsWith('+')) return p.replace(/[\s()-]/g, '');
  return toE164(country || 'IN', p) ?? p;
}

export function PaymentLinkCreator({
  customer,
  preset,
  staff = false,
  onCreated,
}: {
  customer?: LinkCustomer;
  preset?: { ratio: Ratio; months: PlanMonths; amount: number | null };
  /** HR and admins may go below the floor (it is flagged, not refused). */
  staff?: boolean;
  onCreated?: () => void;
}) {
  const { state, prices } = useSellerPrices();
  const [ratio, setRatio] = useState<Ratio>(preset?.ratio ?? '1:4');
  const [months, setMonths] = useState<PlanMonths>(preset?.months ?? 3);
  const [amount, setAmount] = useState<number | null>(preset?.amount ?? null);
  const [name, setName] = useState(customer?.name ?? '');
  const [phone, setPhone] = useState(e164Of(customer?.phone, customer?.phoneCountry));
  const [email, setEmail] = useState(customer?.email ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Created | null>(null);
  const [copied, setCopied] = useState(false);

  const plan = prices?.[ratio].find((p) => p.months === months);
  const floor = floorOf(plan);
  const approved = amount !== null && amount >= floor;
  const canCreate = amount !== null && amount > 0 && name.trim().length > 1 && phone.trim().length > 7 && (approved || staff);

  const create = async () => {
    if (!canCreate || amount === null) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/payments/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ratio, months, amount, customerName: name, phone, email, leadId: customer?.leadId ?? null }),
      });
      const j = await res.json();
      if (!j?.ok) { setError(j?.message ?? 'The link could not be made.'); return; }
      setCreated({ url: j.link.url, amount, ratio, months, name: name.trim(), phone: phone.replace(/[\s()-]/g, ''), belowFloor: !!j.link.belowFloor });
      onCreated?.();
    } catch {
      setError('The link could not be made. Check your connection.');
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!created) return;
    try { await navigator.clipboard.writeText(created.url); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard blocked */ }
  };

  if (created) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-3">
        <p className="text-[13.5px] font-extrabold text-emerald-900">
          Payment link ready — {inr(created.amount)} for {created.ratio} · {PLAN_LABEL[created.months]}
        </p>
        {created.belowFloor && (
          <p className="text-[12px] font-semibold text-amber-800">Below the seller floor — made as a staff exception.</p>
        )}
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2">
          <Link2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span className="truncate text-[13px] font-semibold text-slate-800">{created.url}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={whatsappShareUrl(created.phone, created.name, created.amount, created.url, created.ratio, created.months)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[#25D366] text-white text-[13px] font-bold"
          >
            <MessageCircle className="w-4 h-4" /> Send on WhatsApp
          </a>
          <button type="button" onClick={() => void copy()} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 bg-white text-[13px] font-bold text-slate-700">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? 'Copied' : 'Copy link'}
          </button>
          <a href={created.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 bg-white text-[13px] font-bold text-slate-700">
            <ExternalLink className="w-4 h-4" /> Open
          </a>
          <button type="button" onClick={() => { setCreated(null); setAmount(null); }} className="h-9 px-2 text-[13px] font-bold text-slate-500 hover:text-slate-800">
            Make another
          </button>
        </div>
        <p className="text-[11.5px] text-slate-500">The family can pay by UPI, card or net banking. The link works for 7 days.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="block text-[12px] font-bold text-slate-600 mb-1">Parent’s name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="h-10 w-full rounded-lg border border-slate-200 px-2.5 text-[14px] outline-none focus:border-blue-500" />
        </label>
        <label className="block">
          <span className="block text-[12px] font-bold text-slate-600 mb-1">Phone (with +91)</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="+91 98765 43210" className="h-10 w-full rounded-lg border border-slate-200 px-2.5 text-[14px] outline-none focus:border-blue-500" />
        </label>
        <label className="block">
          <span className="block text-[12px] font-bold text-slate-600 mb-1">Email (optional)</span>
          <input value={email} onChange={(e) => setEmail(e.target.value)} inputMode="email" className="h-10 w-full rounded-lg border border-slate-200 px-2.5 text-[14px] outline-none focus:border-blue-500" />
        </label>
      </div>
      {state === 'loading' && <p className="flex items-center gap-2 text-[12px] text-slate-500"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading the price list…</p>}
      {prices && (
        <>
          <div className="flex flex-wrap gap-2">
            <Segmented size="sm" value={ratio} onChange={setRatio} options={RATIOS.map((r) => ({ value: r, label: r }))} />
            <Segmented size="sm" value={months} onChange={setMonths} options={PLAN_MONTHS.map((m) => ({ value: m, label: PLAN_LABEL[m] }))} />
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-44">
              <NumberField label="Amount (₹, GST included)" prefix="₹" allowEmpty value={amount} placeholder={plan?.publicPrice ? String(plan.publicPrice) : ''} onChange={setAmount} />
            </div>
            <p className="pb-2 text-[11.5px] text-slate-500">
              Public {plan?.publicPrice ? inr(plan.publicPrice) : '—'} · lowest {Number.isFinite(floor) ? inr(floor) : '—'}
            </p>
          </div>
          {amount !== null && <ApprovalBanner price={amount} floor={floor} />}
          {amount !== null && !approved && staff && (
            <p className="text-[12px] text-amber-800">You can still make this link as a staff exception — it is flagged on the link.</p>
          )}
        </>
      )}
      {error && <p className="text-[12.5px] font-semibold text-rose-700">{error}</p>}
      <button
        type="button"
        onClick={() => void create()}
        disabled={!canCreate || busy}
        className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold disabled:opacity-40"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />} Create ₹ payment link
      </button>
    </div>
  );
}

interface Listed {
  id: string;
  url: string;
  status: string;
  amount: number;
  paid: number;
  description: string;
  customerName: string | null;
  createdAt: number;
  mine: boolean;
}

const STATUS_STYLE: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-700',
  partially_paid: 'bg-amber-100 text-amber-800',
  created: 'bg-blue-100 text-blue-700',
  expired: 'bg-slate-100 text-slate-500',
  cancelled: 'bg-slate-100 text-slate-500',
};

export function PaymentLinksList({ refreshKey = 0 }: { refreshKey?: number }) {
  const [links, setLinks] = useState<Listed[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payments/links', { cache: 'no-store' });
      const j = await res.json();
      if (j?.ok) { setLinks(j.links as Listed[]); setError(null); }
      else setError(j?.message ?? 'Could not load the links.');
    } catch {
      setError('Could not load the links.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load, refreshKey]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <p className="text-[13px] font-extrabold text-slate-900">Links sent</p>
        <button type="button" onClick={() => void load()} className="inline-flex items-center gap-1 text-[12px] font-bold text-slate-500 hover:text-slate-800">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>
      {error && <p className="text-[12.5px] text-rose-700">{error}</p>}
      {!error && links === null && <p className="text-[12.5px] text-slate-500">Loading…</p>}
      {links && links.length === 0 && <p className="text-[12.5px] text-slate-500">No payment links yet.</p>}
      {links && links.length > 0 && (
        <ul className="divide-y divide-slate-100">
          {links.map((l) => (
            <li key={l.id} className="py-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
              <span className={`rounded px-1.5 py-0.5 text-[10.5px] font-extrabold uppercase ${STATUS_STYLE[l.status] ?? 'bg-slate-100 text-slate-600'}`}>{l.status.replace(/_/g, ' ')}</span>
              <span className="font-bold text-slate-900 tabular-nums">{inr(l.amount)}</span>
              <span className="text-slate-700">{l.customerName ?? '—'}</span>
              <span className="text-slate-500 truncate max-w-[16rem]">{l.description}</span>
              <span className="text-slate-400 text-[12px]">{l.createdAt ? new Date(l.createdAt * 1000).toLocaleDateString([], { day: 'numeric', month: 'short' }) : ''}</span>
              <a href={l.url} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 text-[12px] font-bold text-blue-700 hover:text-blue-900">
                Open <ExternalLink className="w-3 h-3" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** The workspace section: make a link for any family, and see the ones sent. */
export default function PaymentLinksSection({ staff = false }: { staff?: boolean }) {
  const [refresh, setRefresh] = useState(0);
  return (
    <div className="space-y-4">
      <p className="text-[13px] text-slate-600 max-w-2xl">
        For families in India: a Razorpay link in rupees they can pay by UPI, card or net banking. Pick the plan, check
        the price, and send it on WhatsApp.
      </p>
      <PaymentLinkCreator staff={staff} onCreated={() => setRefresh((n) => n + 1)} />
      <PaymentLinksList refreshKey={refresh} />
    </div>
  );
}
