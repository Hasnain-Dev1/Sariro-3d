'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Loader2, Search, X, History, TrendingUp, Award, UserCheck,
  Phone, Mail, GraduationCap, Briefcase, FileText, CheckCircle2, AlertCircle,
} from 'lucide-react';
import {
  fetchLeads, fetchLeadHistory, updateLeadStage,
  STAGE_ORDER, STAGE_LABELS, STAGE_COLORS,
  type StudentLead, type LeadStage, type StageSummary,
  type LeadHistoryRow,
} from '@/lib/dashboard/leads-data';
import { previewInvoice, recordSale, type InvoicePreview } from '@/lib/dashboard/sales-ledger';
import { useRealtime } from '@/lib/dashboard/use-realtime';
import { TRACKS } from '@/lib/sariro-data';

/* ════════════════════════════════════════════════════════════════════════
   SellerLeads — lead management for admin/seller dashboard
   ════════════════════════════════════════════════════════════════════════
   Key differences from super-admin LeadPipeline:
   - Sellers see ONLY leads assigned to them (RLS enforces this)
   - Sellers can update stages but CANNOT change seller assignments
   - No seller workload overview (they only see their own)
   - No seller assignment dropdown
   ════════════════════════════════════════════════════════════════════════ */

export function SellerLeads({ onToast }: { onToast: (msg: string, kind?: 'success' | 'error') => void }) {
  const [leads, setLeads] = useState<StudentLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState<LeadStage | 'all'>('all');
  const [search, setSearch] = useState('');
  const [historyLead, setHistoryLead] = useState<StudentLead | null>(null);
  const [enrollLead, setEnrollLead] = useState<StudentLead | null>(null);

  const loadAll = useCallback(async () => {
    const leadsData = await fetchLeads({
      stage: stageFilter,
      search: search.trim() || undefined,
      limit: 100,
    });
    setLeads(leadsData);
    setLoading(false);
  }, [stageFilter, search]);

  useEffect(() => {
    Promise.resolve().then(() => loadAll());
  }, [loadAll]);

  useRealtime({
    tables: ['student_leads', 'lead_history'],
    onRefresh: () => loadAll(),
  });

  // Compute summary from loaded leads (sellers see only their own)
  const summary: StageSummary = {
    new: 0, seller_assigned: 0, connected: 0, gathering_booked: 0,
    final: 0, deferred: 0, enrolled: 0, total: leads.length,
  };
  for (const lead of leads) {
    summary[lead.stage]++;
  }

  return (
    <div>
      <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2 mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}>
        <TrendingUp className="w-5 h-5 text-blue-600" /> My Leads
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700" style={{ fontFamily: 'var(--font-grotesk)' }}>
          {summary.total} total
        </span>
      </h2>

      {/* Stage summary cards (clickable to filter) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-4">
        {STAGE_ORDER.map((stage) => {
          const count = summary[stage];
          const colors = STAGE_COLORS[stage];
          const isActive = stageFilter === stage;
          return (
            <button
              key={stage}
              onClick={() => setStageFilter(isActive ? 'all' : stage)}
              className={`p-3 rounded-xl border-2 transition-all min-h-[70px] touch-manipulation text-left ${
                isActive ? 'border-blue-400 shadow-md' : 'border-slate-200 hover:border-slate-300'
              } ${colors.bg}`}
            >
              <p className={`text-2xl font-extrabold ${colors.text}`} style={{ fontFamily: 'var(--font-jakarta)' }}>
                {count}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500" style={{ fontFamily: 'var(--font-grotesk)' }}>
                {STAGE_LABELS[stage]}
              </p>
            </button>
          );
        })}
        <button
          onClick={() => setStageFilter(stageFilter === 'deferred' ? 'all' : 'deferred')}
          className={`p-3 rounded-xl border-2 transition-all min-h-[70px] touch-manipulation text-left ${
            stageFilter === 'deferred' ? 'border-blue-400 shadow-md' : 'border-slate-200 hover:border-slate-300'
          } ${STAGE_COLORS.deferred.bg}`}
        >
          <p className={`text-2xl font-extrabold ${STAGE_COLORS.deferred.text}`} style={{ fontFamily: 'var(--font-jakarta)' }}>
            {summary.deferred}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500" style={{ fontFamily: 'var(--font-grotesk)' }}>
            Deferred
          </p>
        </button>
      </div>

      {/* Search bar */}
      <div className="card-3d p-3 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your leads by name, phone, email..."
              className="w-full min-h-[44px] rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              style={{ fontFamily: 'var(--font-inter)', fontSize: '16px' }}
            />
          </div>
          {(stageFilter !== 'all' || search) && (
            <button
              onClick={() => { setStageFilter('all'); setSearch(''); }}
              className="min-h-[44px] px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold flex items-center gap-1 touch-manipulation"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Leads table */}
      {loading ? (
        <div className="card-3d p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : leads.length === 0 ? (
        <div className="card-3d p-8 text-center">
          <TrendingUp className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">
            {search || stageFilter !== 'all'
              ? 'No leads match your filters.'
              : 'No leads assigned to you yet. The super admin will assign leads as they come in.'}
          </p>
        </div>
      ) : (
        <div className="card-3d p-2 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-2 font-bold text-slate-500">Student</th>
                <th className="text-left py-2 px-2 font-bold text-slate-500 hidden sm:table-cell">Country</th>
                <th className="text-left py-2 px-2 font-bold text-slate-500 hidden md:table-cell">Phone</th>
                <th className="text-left py-2 px-2 font-bold text-slate-500 hidden lg:table-cell">Type</th>
                <th className="text-left py-2 px-2 font-bold text-slate-500 hidden lg:table-cell">Interest</th>
                <th className="text-left py-2 px-2 font-bold text-slate-500 hidden sm:table-cell">Booked</th>
                <th className="text-left py-2 px-2 font-bold text-slate-500">Stage</th>
                <th className="text-center py-2 px-2 font-bold text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <SellerLeadRow
                  key={lead.id}
                  lead={lead}
                  onToast={onToast}
                  onChanged={loadAll}
                  onShowHistory={() => setHistoryLead(lead)}
                  onEnroll={() => setEnrollLead(lead)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* History modal */}
      {historyLead && (
        <SellerHistoryModal lead={historyLead} onClose={() => setHistoryLead(null)} />
      )}

      {/* Enroll → capture sale value */}
      {enrollLead && (
        <EnrollSaleModal
          lead={enrollLead}
          onToast={onToast}
          onClose={() => setEnrollLead(null)}
          onDone={() => { setEnrollLead(null); loadAll(); }}
        />
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   Single lead row — stage dropdown only (NO seller dropdown)
   ════════════════════════════════════════════════════════════════════════ */

function SellerLeadRow({
  lead,
  onToast,
  onChanged,
  onShowHistory,
  onEnroll,
}: {
  lead: StudentLead;
  onToast: (msg: string, kind?: 'success' | 'error') => void;
  onChanged: () => void;
  onShowHistory: () => void;
  onEnroll: () => void;
}) {
  const [updating, setUpdating] = useState(false);
  const colors = STAGE_COLORS[lead.stage];

  const handleStageChange = async (newStage: LeadStage) => {
    // Enrolling captures the sale value first (parent-managed modal).
    if (newStage === 'enrolled') { onEnroll(); return; }
    setUpdating(true);
    const result = await updateLeadStage(lead.id, newStage);
    setUpdating(false);
    if (result.success) {
      onToast(`Stage → ${STAGE_LABELS[newStage]}`, 'success');
      onChanged();
    } else {
      onToast(result.error || 'Failed to update stage', 'error');
    }
  };

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50">
      {/* Student name + email */}
      <td className="py-2 px-2">
        <p className="font-bold text-slate-900 truncate max-w-[150px]" style={{ fontFamily: 'var(--font-jakarta)' }}>
          {lead.student_name}
        </p>
        {lead.email && <p className="text-[10px] text-slate-400 truncate max-w-[150px]">{lead.email}</p>}
      </td>

      {/* Country */}
      <td className="py-2 px-2 text-slate-600 hidden sm:table-cell">{lead.country ?? '—'}</td>

      {/* Phone */}
      <td className="py-2 px-2 text-slate-600 hidden md:table-cell">
        {lead.phone_country_code && <span className="text-slate-400">{lead.phone_country_code} </span>}
        {lead.phone}
      </td>

      {/* Type */}
      <td className="py-2 px-2 hidden lg:table-cell">
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${lead.lead_type === 'student' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`} style={{ fontFamily: 'var(--font-grotesk)' }}>
          {lead.lead_type === 'student' ? <GraduationCap className="w-3 h-3 inline mr-0.5" /> : <Briefcase className="w-3 h-3 inline mr-0.5" />}
          {lead.lead_type}
        </span>
      </td>

      {/* Interest */}
      <td className="py-2 px-2 text-slate-600 hidden lg:table-cell">{lead.area_of_interest ?? '—'}</td>

      {/* Booking date */}
      <td className="py-2 px-2 text-slate-400 hidden sm:table-cell">
        {new Date(lead.booking_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </td>

      {/* Stage dropdown — sellers CAN change this */}
      <td className="py-2 px-2">
        <select
          value={lead.stage}
          onChange={(e) => handleStageChange(e.target.value as LeadStage)}
          disabled={updating}
          className={`text-[10px] font-bold rounded-lg border border-slate-200 px-1.5 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 min-h-[32px] ${colors.text}`}
          style={{ fontFamily: 'var(--font-grotesk)' }}
        >
          {STAGE_ORDER.map((s) => (
            <option key={s} value={s}>{STAGE_LABELS[s]}</option>
          ))}
          <option value="deferred">{STAGE_LABELS.deferred}</option>
        </select>
      </td>

      {/* Actions */}
      <td className="py-2 px-2 text-center">
        <button
          onClick={onShowHistory}
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-600 min-h-[32px] min-w-[32px] touch-manipulation"
          title="View history"
        >
          <History className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   History modal — seller version (same as super-admin)
   ════════════════════════════════════════════════════════════════════════ */

function SellerHistoryModal({ lead, onClose }: { lead: StudentLead; onClose: () => void }) {
  const [history, setHistory] = useState<LeadHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchLeadHistory(lead.id).then((rows) => {
      if (!cancelled) {
        setHistory(rows);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [lead.id]);

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        role="dialog"
        aria-modal="true"
        className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-100 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${STAGE_COLORS[lead.stage].chip}`} style={{ fontFamily: 'var(--font-grotesk)' }}>
                {STAGE_LABELS[lead.stage]}
              </span>
            </div>
            <h3 className="font-extrabold text-slate-900 text-base" style={{ fontFamily: 'var(--font-jakarta)' }}>
              {lead.student_name}
            </h3>
            <p className="text-xs text-slate-500">
              {lead.phone} · {lead.email ?? 'No email'} · {lead.country ?? 'Unknown country'}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="shrink-0 w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center min-h-[44px] min-w-[44px]">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No history yet.</p>
          ) : (
            <div className="space-y-3">
              {history.map((h) => (
                <div key={h.id} className="flex items-start gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                    {h.action === 'created' && <TrendingUp className="w-4 h-4 text-blue-600" />}
                    {h.action === 'stage_changed' && <Award className="w-4 h-4 text-blue-600" />}
                    {(h.action === 'seller_assigned' || h.action === 'seller_changed') && <UserCheck className="w-4 h-4 text-blue-600" />}
                  </div>
                  <div className="min-w-0 flex-1 pb-3 border-b border-slate-100 last:border-0">
                    <p className="text-sm font-bold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
                      {h.action === 'created' && 'Lead created'}
                      {h.action === 'stage_changed' && `Stage: ${h.old_value ?? '?'} → ${h.new_value ?? '?'}`}
                      {h.action === 'seller_assigned' && 'Seller assigned'}
                      {h.action === 'seller_changed' && 'Seller changed'}
                    </p>
                    {h.notes && <p className="text-xs text-slate-500 mt-0.5">{h.notes}</p>}
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {h.performer_name ?? 'System'} · {h.performed_by_role ?? 'system'} · {new Date(h.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   Enroll → the invoice number, and what the invoice says (seller)
   ════════════════════════════════════════════════════════════════════════
   The sale value used to be typed here. It is not any more.

   A typed figure is a figure that can be wrong: mistyped, rounded, entered
   before a discount was agreed, or quietly different from the invoice the
   parent is holding. So the seller gives the one thing only they know — the
   invoice number HR issued — and the amount comes from the invoice itself.

   That also makes the order of work explicit: no invoice, no sale. Which is
   the point. An unbilled enrolment is a hole in the books.
   ════════════════════════════════════════════════════════════════════════ */

function EnrollSaleModal({
  lead, onToast, onClose, onDone,
}: {
  lead: StudentLead;
  onToast: (msg: string, kind?: 'success' | 'error') => void;
  onClose: () => void;
  onDone: () => void;
}) {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [preview, setPreview] = useState<InvoicePreview | null>(null);
  const [looking, setLooking] = useState(false);
  const [busy, setBusy] = useState(false);

  // Look the number up as it is typed, but only once typing pauses — otherwise
  // every keystroke of a twenty-character invoice number is a round trip.
  useEffect(() => {
    const number = invoiceNumber.trim();
    if (number.length < 6) { setPreview(null); setLooking(false); return; }
    setLooking(true);
    let cancelled = false;
    const t = setTimeout(async () => {
      const found = await previewInvoice(number);
      if (cancelled) return;
      setPreview(found);
      setLooking(false);
    }, 400);
    return () => { cancelled = true; clearTimeout(t); };
  }, [invoiceNumber]);

  /* Nothing here is typed. The invoice already knows what the deal is worth
     and what has been collected against it — an installment for 12,000 of a
     36,000 course carries all three numbers — so asking a seller to retype any
     of them could only ever introduce a disagreement. */
  const dealValue = preview ? Number(preview.course_total ?? preview.total) : 0;
  const collected = preview ? Number(preview.previously_paid ?? 0) + Number(preview.total) : 0;
  const due = Math.max(0, dealValue - collected);
  const valid = !!preview;

  const confirm = async () => {
    if (!preview) return;
    setBusy(true);
    try {
      // The ledger first. If this fails the enrolment does not proceed — an
      // enrolment without a recorded sale is exactly the hole we are closing.
      // An invoice already in the books is not a failure: somebody logged it
      // ahead of the enrolment, and the figure is the same either way.
      if (!preview.already_recorded) {
        const { error } = await recordSale(preview.invoice_number, lead.assigned_seller ?? null);
        if (error) { onToast(error, 'error'); setBusy(false); return; }
      }

      const fRes = await fetch('/api/leads/financials', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id, saleValue: dealValue, amountPaid: collected }),
      });
      const fJson = await fRes.json();
      if (!fJson.ok) { onToast(fJson.error || 'Sale recorded, but the lead could not be updated', 'error'); setBusy(false); return; }

      const result = await updateLeadStage(lead.id, 'enrolled');
      if (result.success) { onToast(`Enrolled — ${preview.invoice_number} recorded`, 'success'); onDone(); }
      else { onToast(result.error || 'Sale saved, but stage update failed', 'error'); setBusy(false); }
    } catch { onToast('Network error', 'error'); setBusy(false); }
  };

  const money = (v: number) => `${preview?.currency_symbol ?? '₹'}${Number(v || 0).toFixed(0)}`;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>Record the sale</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400" aria-label="Close"><X className="w-4 h-4" /></button>
        </div>
        <p className="text-sm text-slate-600 mb-4">
          Enrolling <strong>{lead.student_name}</strong>. Enter the invoice number HR issued — every figure below comes from the invoice.
        </p>

        <label className="block text-xs font-bold text-slate-700 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>Invoice number</label>
        <div className="relative mb-3">
          <FileText className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            disabled={busy}
            placeholder="SR2627-0042-K7XQ"
            autoComplete="off"
            className="w-full min-h-[44px] pl-9 pr-9 rounded-lg border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-green-500/40"
          />
          {looking && <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-300" />}
          {!looking && preview && <CheckCircle2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-green-600" />}
        </div>

        {/* What that number actually is. Confirming blind is how a transposed
            digit becomes somebody else's sale. */}
        {!looking && invoiceNumber.trim().length >= 6 && !preview && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 mb-3 flex gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-700">No invoice with that number. Ask HR to generate it first — a sale cannot be recorded without one.</p>
          </div>
        )}
        {preview && (
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 mb-3">
            <p className="text-sm font-bold text-slate-900">{preview.customer_name}</p>
            <p className="text-xs text-slate-500 mb-2">{preview.course_name} · {new Date(`${preview.invoice_date}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>
                {preview.payment_type === 'installment' ? 'Paid on this invoice' : 'Invoice total'}
                {preview.include_gst ? ' · incl. GST' : ''}
              </span>
              <span className="text-lg font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>{money(Number(preview.total))}</span>
            </div>
            {/* An installment is a part of something. Without this the seller
                sees a small number and wonders whether they typed the wrong
                invoice. */}
            {preview.payment_type === 'installment' && preview.course_total != null && (
              <p className="text-[11px] text-slate-500 mt-1">
                Part payment towards {money(Number(preview.course_total))}
                {Number(preview.previously_paid ?? 0) > 0
                  && ` · ${money(Number(preview.previously_paid))} paid earlier`}
              </p>
            )}
            {preview.already_recorded && (
              <p className="text-[11px] text-amber-700 mt-1.5">Already in the sales ledger — it will not be counted twice.</p>
            )}
          </div>
        )}

        {preview && (
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 mb-5 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Deal value</span>
              <span className="font-semibold text-slate-900">{money(dealValue)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span>Collected</span>
              <span className="font-semibold text-slate-900">{money(collected)}</span>
            </div>
            <div className="flex items-center justify-between pt-1.5 border-t border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider" style={{ fontFamily: 'var(--font-grotesk)' }}>Due</span>
              <span className={`text-lg font-extrabold ${due > 0 ? 'text-red-600' : 'text-green-700'}`} style={{ fontFamily: 'var(--font-jakarta)' }}>{money(due)}</span>
            </div>
          </div>
        )}
        <div className="flex gap-2">
          <button onClick={onClose} disabled={busy} className="flex-1 min-h-[44px] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold disabled:opacity-50">Cancel</button>
          <button onClick={confirm} disabled={busy || !valid} className="flex-1 min-h-[44px] rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:bg-slate-300">
            {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : 'Confirm enrollment'}
          </button>
        </div>
      </div>
    </div>
  );
}
