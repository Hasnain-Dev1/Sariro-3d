'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Copy, ExternalLink, Link2, Loader2, MessageCircle, Repeat, RefreshCw, Search, ShieldAlert, XCircle } from 'lucide-react';
import { PLAN_LABEL, PLAN_MONTHS, RATIOS, inr, type PlanMonths, type Ratio } from '@/lib/pricing/economics';
import {
  AUTOPAY_FREQUENCIES, FREQUENCY_LABEL, FREQUENCY_MONTHS, MAX_AUTOPAY_PAYMENTS, MIN_AUTOPAY_PAYMENTS,
  autopaySummary, whatsappShareUrl, type AutopayFrequency, type AutopayTerms,
} from '@/lib/payments/link-request';
import { matchesCreator, type LinkView } from '@/lib/payments/link-store';
import { toE164 } from '@/lib/phone/countries';
import { getRole, useAuth } from '@/components/auth/auth-provider';
import { NumberField, Segmented } from '@/components/dashboard/pricing/fields';
import { ApprovalBanner, floorOf, useSellerPrices } from '@/components/dashboard/seller-price-list';

/**
 * SARIRO — a rupee payment link, from the dashboard
 * ============================================================================
 * For a family in India who has agreed on a call: pick the plan, check the
 * price against the floor, make a Razorpay link (UPI, cards, net banking) and
 * send it on WhatsApp in one tap. api/payments/links does the real checks.
 *
 * Since 17 Sep 2026 the same form can make an autopay link — the family
 * approves once and Razorpay charges every month (or quarter, half-year, year)
 * for as many payments as agreed — and the list shows every link made, who
 * made it, and lets an admin end an autopay.
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
  autopay: AutopayTerms | null;
  warning: string | null;
}

/** A stored phone as +CC…, whichever way the lead form saved it. */
function e164Of(phone: string | null | undefined, country: string | null | undefined): string {
  const p = (phone ?? '').trim();
  if (!p) return '';
  if (p.startsWith('+')) return p.replace(/[\s()-]/g, '');
  return toE164(country || 'IN', p) ?? p;
}

type Mode = 'once' | 'autopay';

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
  const { profile } = useAuth();
  const role = getRole(profile);
  /* A seller or HR proves their own number before sending families links (the route refuses otherwise). */
  const phoneMissing = (role === 'seller' || role === 'hr') && !!profile && !(profile.phone && profile.phone_verified === true);

  const { state, prices } = useSellerPrices();
  const [mode, setMode] = useState<Mode>('once');
  const [ratio, setRatio] = useState<Ratio>(preset?.ratio ?? '1:4');
  const [months, setMonths] = useState<PlanMonths>(preset?.months ?? 3);
  const [frequency, setFrequency] = useState<AutopayFrequency>('monthly');
  const [count, setCount] = useState<number | null>(12);
  const [amount, setAmount] = useState<number | null>(preset?.amount ?? null);
  const [name, setName] = useState(customer?.name ?? '');
  const [phone, setPhone] = useState(e164Of(customer?.phone, customer?.phoneCountry));
  const [email, setEmail] = useState(customer?.email ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Created | null>(null);
  const [copied, setCopied] = useState(false);

  const autopay = mode === 'autopay';
  /* Each autopay payment is one plan's worth: monthly is the 1 month plan, and so on. */
  const planMonths: PlanMonths = autopay ? FREQUENCY_MONTHS[frequency] : months;
  const plan = prices?.[ratio].find((p) => p.months === planMonths);
  const floor = floorOf(plan);
  const approved = amount !== null && amount >= floor;
  const countOk = !autopay || (count !== null && Number.isInteger(count) && count >= MIN_AUTOPAY_PAYMENTS && count <= MAX_AUTOPAY_PAYMENTS);
  const terms: AutopayTerms | null = autopay && countOk && count !== null ? { frequency, count } : null;
  const canCreate = !phoneMissing && amount !== null && amount > 0 && countOk && name.trim().length > 1 && phone.trim().length > 7 && (approved || staff);

  const create = async () => {
    if (!canCreate || amount === null) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/payments/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ratio, months: planMonths, amount, customerName: name, phone, email, leadId: customer?.leadId ?? null,
          ...(terms ? { autopay: true, frequency: terms.frequency, count: terms.count } : {}),
        }),
      });
      const j = await res.json();
      if (!j?.ok) { setError(j?.message ?? 'The link could not be made.'); return; }
      setCreated({
        url: j.link.url, amount, ratio, months: planMonths, name: name.trim(), phone: phone.replace(/[\s()-]/g, ''),
        belowFloor: !!j.link.belowFloor, autopay: terms, warning: typeof j.link.warning === 'string' ? j.link.warning : null,
      });
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
          {created.autopay
            ? <>Autopay link ready — {created.ratio}: {autopaySummary(created.amount, created.autopay)}</>
            : <>Payment link ready — {inr(created.amount)} for {created.ratio} · {PLAN_LABEL[created.months]}</>}
        </p>
        {created.belowFloor && (
          <p className="text-[12px] font-semibold text-amber-800">Below the seller floor — made as a staff exception.</p>
        )}
        {created.warning && <p className="text-[12px] font-semibold text-amber-800">{created.warning}</p>}
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2">
          <Link2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span className="truncate text-[13px] font-semibold text-slate-800">{created.url}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={whatsappShareUrl(created.phone, created.name, created.amount, created.url, created.ratio, created.months, created.autopay)}
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
        <p className="text-[11.5px] text-slate-500">
          {created.autopay
            ? 'The family approves it once — by UPI Autopay, card or a bank mandate — and every payment after that is collected automatically. The link works for 7 days.'
            : 'The family can pay by UPI, card or net banking. The link works for 7 days.'}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
      {phoneMissing && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="text-[12.5px] text-amber-900">
            <span className="font-bold">Verify your WhatsApp number first.</span> Every link records who made it, so sellers and HR need a
            verified number before sending one. <Link href="/settings" className="font-bold underline">Verify it in Settings</Link>.
          </p>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          size="sm"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'once', label: 'One-time payment' },
            { value: 'autopay', label: <span className="inline-flex items-center gap-1"><Repeat className="w-3.5 h-3.5" /> Autopay</span> },
          ]}
        />
        <span className="text-[11.5px] text-slate-500">
          {autopay ? 'The family approves once; Razorpay charges automatically on schedule.' : 'The family pays once, by UPI, card or net banking.'}
        </span>
      </div>
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
          <span className="block text-[12px] font-bold text-slate-600 mb-1">Email {autopay ? '(recommended)' : '(optional)'}</span>
          <input value={email} onChange={(e) => setEmail(e.target.value)} inputMode="email" className="h-10 w-full rounded-lg border border-slate-200 px-2.5 text-[14px] outline-none focus:border-blue-500" />
        </label>
      </div>
      {state === 'loading' && <p className="flex items-center gap-2 text-[12px] text-slate-500"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading the price list…</p>}
      {prices && (
        <>
          <div className="flex flex-wrap gap-2">
            <Segmented size="sm" value={ratio} onChange={setRatio} options={RATIOS.map((r) => ({ value: r, label: r }))} />
            {autopay ? (
              <Segmented size="sm" value={frequency} onChange={setFrequency} options={AUTOPAY_FREQUENCIES.map((f) => ({ value: f, label: FREQUENCY_LABEL[f] }))} />
            ) : (
              <Segmented size="sm" value={months} onChange={setMonths} options={PLAN_MONTHS.map((m) => ({ value: m, label: PLAN_LABEL[m] }))} />
            )}
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="w-48">
              <NumberField
                label={autopay ? 'Amount per payment (₹, GST incl.)' : 'Amount (₹, GST included)'}
                prefix="₹"
                allowEmpty
                value={amount}
                placeholder={plan?.publicPrice ? String(plan.publicPrice) : ''}
                onChange={setAmount}
              />
            </div>
            {autopay && (
              <div className="w-40">
                <NumberField
                  label="Number of payments"
                  allowEmpty
                  value={count}
                  placeholder="12"
                  onChange={setCount}
                  invalid={!countOk}
                  hint={`${MIN_AUTOPAY_PAYMENTS}–${MAX_AUTOPAY_PAYMENTS}`}
                />
              </div>
            )}
            <p className="pb-2 text-[11.5px] text-slate-500">
              {autopay ? `Each payment is the ${PLAN_LABEL[planMonths]} plan · ` : ''}
              Public {plan?.publicPrice ? inr(plan.publicPrice) : '—'} · lowest {Number.isFinite(floor) ? inr(floor) : '—'}
            </p>
          </div>
          {autopay && amount !== null && amount > 0 && terms && (
            <p className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2 text-[12.5px] font-semibold text-blue-900">
              The family will be charged {autopaySummary(amount, terms)}.
            </p>
          )}
          {autopay && !countOk && (
            <p className="text-[12px] text-rose-700">Autopay needs between {MIN_AUTOPAY_PAYMENTS} and {MAX_AUTOPAY_PAYMENTS} payments.</p>
          )}
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
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : autopay ? <Repeat className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
        {autopay ? 'Create ₹ autopay link' : 'Create ₹ payment link'}
      </button>
    </div>
  );
}

/* ── The list ─────────────────────────────────────────────────────────────── */

const STATUS_STYLE: Record<string, string> = {
  paid: 'bg-emerald-100 text-emerald-700',
  active: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-emerald-100 text-emerald-700',
  authenticated: 'bg-blue-100 text-blue-700',
  created: 'bg-blue-100 text-blue-700',
  partially_paid: 'bg-amber-100 text-amber-800',
  pending: 'bg-amber-100 text-amber-800',
  paused: 'bg-amber-100 text-amber-800',
  halted: 'bg-rose-100 text-rose-700',
  expired: 'bg-slate-100 text-slate-500',
  cancelled: 'bg-slate-100 text-slate-500',
};

/** Razorpay's status, in words a seller reads at a glance. */
function statusLabel(l: Pick<LinkView, 'kind' | 'status'>): string {
  if (l.kind === 'autopay') {
    const words: Record<string, string> = {
      created: 'awaiting approval', authenticated: 'approved', active: 'active', pending: 'payment retrying',
      halted: 'halted', paused: 'paused', resumed: 'active', cancelled: 'cancelled', completed: 'completed', expired: 'expired',
    };
    return words[l.status] ?? l.status.replace(/_/g, ' ');
  }
  const words: Record<string, string> = { created: 'unpaid', partially_paid: 'part paid' };
  return words[l.status] ?? l.status.replace(/_/g, ' ');
}

const dateOf = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
};

type KindFilter = 'all' | 'one_time' | 'autopay';

export function PaymentLinksList({ refreshKey = 0 }: { refreshKey?: number }) {
  const [links, setLinks] = useState<LinkView[] | null>(null);
  const [canCancel, setCanCancel] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<KindFilter>('all');
  const [ending, setEnding] = useState<LinkView | null>(null);
  const [working, setWorking] = useState(false);
  const [endError, setEndError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payments/links', { cache: 'no-store' });
      const j = await res.json();
      if (j?.ok) { setLinks(j.links as LinkView[]); setCanCancel(j.canCancel === true); setError(null); }
      else setError(j?.message ?? 'Could not load the links.');
    } catch {
      setError('Could not load the links.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load, refreshKey]);

  const shown = useMemo(
    () => (links ?? []).filter((l) => (kind === 'all' || l.kind === kind) && matchesCreator(l, query)),
    [links, kind, query]
  );

  const endAutopay = async () => {
    if (!ending) return;
    setWorking(true);
    setEndError(null);
    try {
      const res = await fetch(`/api/payments/links/${ending.id}/cancel`, { method: 'POST' });
      const j = await res.json();
      if (!j?.ok) { setEndError(j?.message ?? 'The autopay could not be ended.'); return; }
      setEnding(null);
      await load();
    } catch {
      setEndError('The autopay could not be ended. Check your connection.');
    } finally {
      setWorking(false);
    }
  };

  const copy = async (l: LinkView) => {
    try { await navigator.clipboard.writeText(l.url); setCopiedId(l.id); setTimeout(() => setCopiedId(null), 1500); } catch { /* clipboard blocked */ }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <p className="text-[13px] font-extrabold text-slate-900">
          Links made {links ? <span className="font-semibold text-slate-400">· {shown.length} of {links.length}</span> : null}
        </p>
        <button type="button" onClick={() => void load()} className="inline-flex items-center gap-1 text-[12px] font-bold text-slate-500 hover:text-slate-800">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <label className="relative flex-1 min-w-[14rem]">
          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find who made it — their email or phone"
            aria-label="Find by the creator’s email or phone"
            className="h-9 w-full rounded-lg border border-slate-200 pl-8 pr-2.5 text-[13px] outline-none focus:border-blue-500"
          />
        </label>
        <Segmented
          size="sm"
          value={kind}
          onChange={setKind}
          options={[{ value: 'all', label: 'All' }, { value: 'one_time', label: 'One-time' }, { value: 'autopay', label: 'Autopay' }]}
        />
      </div>

      {error && <p className="text-[12.5px] text-rose-700">{error}</p>}
      {!error && links === null && <p className="text-[12.5px] text-slate-500">Loading…</p>}
      {links && links.length === 0 && <p className="text-[12.5px] text-slate-500">No payment links yet.</p>}
      {links && links.length > 0 && shown.length === 0 && <p className="text-[12.5px] text-slate-500">No links match.</p>}
      {shown.length > 0 && (
        <ul className="divide-y divide-slate-100">
          {shown.map((l) => (
            <li key={l.id} className="py-3 space-y-1.5">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px]">
                <span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10.5px] font-extrabold uppercase ${l.kind === 'autopay' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'}`}>
                  {l.kind === 'autopay' ? <><Repeat className="w-3 h-3" /> Autopay</> : 'One-time'}
                </span>
                <span className={`rounded px-1.5 py-0.5 text-[10.5px] font-extrabold uppercase ${STATUS_STYLE[l.status] ?? 'bg-slate-100 text-slate-600'}`}>{statusLabel(l)}</span>
                <span className="font-bold text-slate-900 tabular-nums">
                  {l.kind === 'autopay' ? `${inr(l.amount)} ${(l.frequencyLabel ?? '').toLowerCase()} × ${l.totalCount}` : inr(l.amount)}
                </span>
                {l.kind === 'autopay' && (
                  <span className="text-[12px] text-slate-500 tabular-nums">{l.paidCount} of {l.totalCount} paid · {inr(l.total)} in all</span>
                )}
                {l.kind === 'one_time' && l.amountPaid > 0 && <span className="text-[12px] text-slate-500 tabular-nums">{inr(l.amountPaid)} paid</span>}
                {l.belowFloor && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10.5px] font-bold text-amber-800">below floor</span>}
                <span className="text-slate-400 text-[12px]">{dateOf(l.createdAt)}</span>
                <span className="ml-auto flex items-center gap-3">
                  <button type="button" onClick={() => void copy(l)} className="inline-flex items-center gap-1 text-[12px] font-bold text-slate-500 hover:text-slate-800">
                    {copiedId === l.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copiedId === l.id ? 'Copied' : 'Copy'}
                  </button>
                  <a href={l.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[12px] font-bold text-blue-700 hover:text-blue-900">
                    Open <ExternalLink className="w-3 h-3" />
                  </a>
                  {canCancel && l.cancellable && (
                    <button type="button" onClick={() => { setEndError(null); setEnding(l); }} className="inline-flex items-center gap-1 text-[12px] font-bold text-rose-700 hover:text-rose-900">
                      <XCircle className="w-3.5 h-3.5" /> Cancel autopay
                    </button>
                  )}
                </span>
              </div>
              <p className="text-[12.5px] text-slate-700">
                <span className="font-semibold text-slate-500">Family:</span> {l.customer.name || '—'}
                {l.customer.phone ? ` · ${l.customer.phone}` : ''}{l.customer.email ? ` · ${l.customer.email}` : ''}
              </p>
              <p className="text-[12.5px] text-slate-700">
                <span className="font-semibold text-slate-500">Made by:</span>{' '}
                {l.createdBy
                  ? <>{l.createdBy.name ?? 'Unknown'}{l.createdBy.role ? ` (${l.createdBy.role.replace('_', ' ')})` : ''}{l.createdBy.email ? ` · ${l.createdBy.email}` : ''}{l.createdBy.phone ? ` · ${l.createdBy.phone}` : ''}</>
                  : 'Not recorded'}
              </p>
              <p className="text-[12px] text-slate-500 truncate">
                {l.description}
                {l.cancelledAt ? ` · ended ${dateOf(l.cancelledAt)}` : ''}
              </p>
            </li>
          ))}
        </ul>
      )}

      {ending && (
        <div className="fixed inset-0 z-[95] bg-slate-900/40 flex items-center justify-center px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-5">
            <h4 className="text-base font-extrabold text-slate-900">End the autopay for {ending.customer.name || 'this family'}?</h4>
            <p className="mt-2 text-sm text-slate-700">
              {inr(ending.amount)} {(ending.frequencyLabel ?? '').toLowerCase()} · {ending.paidCount} of {ending.totalCount} payments collected
            </p>
            <ul className="mt-3 space-y-1.5 text-[13px] text-slate-600 list-disc pl-5">
              <li>Razorpay stops every future charge <strong>now</strong>. It cannot be restarted — a new autopay link would be needed.</li>
              <li>Payments already collected are <strong>not</strong> refunded by this.</li>
            </ul>
            {endError && <p className="mt-3 text-[12.5px] font-semibold text-rose-700">{endError}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setEnding(null)} disabled={working} className="h-10 px-4 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">
                No, keep it
              </button>
              <button
                onClick={() => void endAutopay()}
                disabled={working}
                className="h-10 px-4 rounded-xl text-sm font-bold text-white inline-flex items-center gap-2 disabled:opacity-60 bg-red-600 hover:bg-red-700"
              >
                {working && <Loader2 className="w-4 h-4 animate-spin" />}
                Yes, end autopay
              </button>
            </div>
          </div>
        </div>
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
        For families in India: a Razorpay link in rupees — paid once by UPI, card or net banking, or as an autopay the family
        approves once and is charged for automatically. Pick the plan, check the price, and send it on WhatsApp.
      </p>
      <PaymentLinkCreator staff={staff} onCreated={() => setRefresh((n) => n + 1)} />
      <PaymentLinksList refreshKey={refresh} />
    </div>
  );
}
