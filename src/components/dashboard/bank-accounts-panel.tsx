'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, ExternalLink, Landmark, Loader2, Plus, Save, Trash2 } from 'lucide-react';
import { EVERY_OTHER_COUNTRY, MAX_BANK_ACCOUNTS, type BankAccount } from '@/lib/checkout/bank-accounts';

/**
 * SARIRO — the bank accounts families pay into, edited by the super admin and HR
 * ============================================================================
 * What checkout's bank-transfer page lists (/checkout/bank-transfer), with the
 * account for the buyer's country first. Saved through /api/bank-accounts,
 * which validates every account and audits the change — an edited account
 * number is the edit that most needs a trail.
 *
 * Enter only real accounts, copied from the bank: the page shows exactly what
 * is typed here to paying families.
 */

type Draft = Omit<BankAccount, 'countries'> & { countries: string; everyOther: boolean };

const FIELDS: { key: keyof BankAccount; label: string; placeholder: string }[] = [
  { key: 'accountName', label: 'Account holder name', placeholder: 'As the bank shows it' },
  { key: 'accountNumber', label: 'Account number', placeholder: '' },
  { key: 'iban', label: 'IBAN', placeholder: 'For Europe, the Gulf and others' },
  { key: 'ifsc', label: 'IFSC', placeholder: 'India' },
  { key: 'sortCode', label: 'Sort code', placeholder: 'United Kingdom' },
  { key: 'routingNumber', label: 'Routing number', placeholder: 'United States' },
  { key: 'swift', label: 'SWIFT / BIC', placeholder: 'International transfers' },
  { key: 'bankName', label: 'Bank name', placeholder: '' },
  { key: 'branch', label: 'Branch', placeholder: '' },
  { key: 'upi', label: 'UPI ID', placeholder: 'India' },
];

const toDraft = (a: BankAccount): Draft => ({
  ...a,
  countries: a.countries.filter((c) => c !== EVERY_OTHER_COUNTRY).join(', '),
  everyOther: a.countries.includes(EVERY_OTHER_COUNTRY),
});

const blank = (): Draft => ({
  id: '', label: '', countries: '', everyOther: false, currency: '', accountName: '',
  accountNumber: null, iban: null, bankName: null, branch: null, ifsc: null, swift: null,
  routingNumber: null, sortCode: null, upi: null, note: null,
});

const fromDraft = (d: Draft) => ({
  ...d,
  countries: [...d.countries.split(/[\s,]+/).filter(Boolean), ...(d.everyOther ? [EVERY_OTHER_COUNTRY] : [])],
});

const input = 'w-full h-10 rounded-lg border border-slate-200 bg-white px-3 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-blue-500/40';
const labelCls = 'block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1';

export default function BankAccountsPanel() {
  const [drafts, setDrafts] = useState<Draft[] | null>(null);
  const [source, setSource] = useState<string>('none');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let live = true;
    fetch('/api/bank-accounts', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => {
        if (!live) return;
        if (!j?.ok) { setError(j?.message ?? 'Could not load the accounts.'); setDrafts([]); return; }
        setSource(j.source);
        setDrafts((j.accounts as BankAccount[]).map(toDraft));
      })
      .catch(() => { if (live) { setError('Could not load the accounts.'); setDrafts([]); } });
    return () => { live = false; };
  }, []);

  const change = (i: number, patch: Partial<Draft>) => {
    setSaved(false);
    setDrafts((ds) => (ds ?? []).map((d, j) => (j === i ? { ...d, ...patch } : d)));
  };

  const save = async () => {
    if (!drafts) return;
    setBusy(true); setError(null); setSaved(false);
    try {
      const r = await fetch('/api/bank-accounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accounts: drafts.map(fromDraft) }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok || !j?.ok) { setError(j?.message ?? 'The accounts did not save.'); return; }
      setDrafts((j.accounts as BankAccount[]).map(toDraft));
      setSource('dashboard');
      setSaved(true);
    } catch {
      setError('Could not reach the server. Nothing was saved.');
    } finally {
      setBusy(false);
    }
  };

  if (!drafts) {
    return <div className="flex items-center gap-2 py-6 text-[13px] text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading accounts…</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-slate-600">
        <p className="flex-1 min-w-[14rem] leading-relaxed">
          Families see these on the bank-transfer page, with the account for their country first. Copy every detail
          from the bank — what you type is exactly what they pay into.
        </p>
        <Link
          href="/checkout/bank-transfer"
          target="_blank"
          className="inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-lg border border-slate-300 bg-white font-semibold text-slate-700 hover:bg-slate-50"
        >
          <ExternalLink className="w-4 h-4 text-slate-400" /> View the page
        </Link>
      </div>

      {source === 'environment' && (
        <p className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-[12.5px] text-amber-900">
          The account below comes from the server’s settings. Save here to manage it from the dashboard instead.
        </p>
      )}

      {drafts.length === 0 && (
        <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-[13px] text-slate-500">
          <Landmark className="w-6 h-6 mx-auto mb-2 text-slate-400" />
          No bank accounts yet. Until one is added, families are asked to request the details.
        </div>
      )}

      {drafts.map((d, i) => (
        <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[12rem]">
              <label className={labelCls}>Heading families see</label>
              <input className={input} value={d.label} onChange={(e) => change(i, { label: e.target.value })} placeholder="India — rupee account" />
            </div>
            <div className="w-24">
              <label className={labelCls}>Currency</label>
              <input className={`${input} uppercase`} maxLength={3} value={d.currency} onChange={(e) => change(i, { currency: e.target.value })} placeholder="INR" />
            </div>
            <button
              type="button"
              onClick={() => { setSaved(false); setDrafts((ds) => (ds ?? []).filter((_, j) => j !== i)); }}
              className="inline-flex items-center gap-1.5 h-10 px-3 rounded-lg border border-red-200 text-[12.5px] font-semibold text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" /> Remove
            </button>
          </div>

          <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end">
            <div>
              <label className={labelCls}>For payments from (country codes)</label>
              <input className={`${input} uppercase`} value={d.countries} onChange={(e) => change(i, { countries: e.target.value })} placeholder="IN   or   GB, IE" />
            </div>
            <label className="inline-flex items-center gap-2 h-10 text-[13px] font-semibold text-slate-700">
              <input type="checkbox" checked={d.everyOther} onChange={(e) => change(i, { everyOther: e.target.checked })} className="w-4 h-4" />
              All other countries
            </label>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {FIELDS.map((f) => (
              <div key={f.key}>
                <label className={labelCls}>{f.label}</label>
                <input
                  className={input}
                  value={(d[f.key] as string | null) ?? ''}
                  onChange={(e) => change(i, { [f.key]: e.target.value } as Partial<Draft>)}
                  placeholder={f.placeholder}
                  autoComplete="off"
                />
              </div>
            ))}
          </div>

          <div>
            <label className={labelCls}>Note for families (optional)</label>
            <input className={input} value={d.note ?? ''} onChange={(e) => change(i, { note: e.target.value })} placeholder="e.g. Transfers in GBP only" />
          </div>
        </div>
      ))}

      {error && (
        <p className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-800">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => { setSaved(false); setDrafts((ds) => [...(ds ?? []), blank()]); }}
          disabled={drafts.length >= MAX_BANK_ACCOUNTS}
          className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 rounded-lg border border-slate-300 bg-white text-[13px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> Add an account
        </button>
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className="btn-tactile btn-tactile-primary h-10 px-5 text-[13.5px] disabled:opacity-60"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save accounts
        </button>
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-emerald-700">
            <CheckCircle2 className="w-4 h-4" /> Saved — the page shows them now
          </span>
        )}
      </div>
    </div>
  );
}
