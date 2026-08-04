'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, AlertCircle, Search, Filter, X, Users, History,
  ChevronDown, Phone, Mail, MapPin, GraduationCap, Briefcase,
  Clock, UserCheck, TrendingUp, Award,
} from 'lucide-react';
import {
  fetchLeads, fetchStageSummary, fetchSellerWorkload,
  fetchLeadHistory, fetchSellers, assignSeller, updateLeadStage,
  STAGE_ORDER, STAGE_LABELS, STAGE_COLORS,
  type StudentLead, type LeadStage, type StageSummary, type SellerWorkload,
  type LeadHistoryRow,
} from '@/lib/dashboard/leads-data';
import { useRealtime } from '@/lib/dashboard/use-realtime';
import { TRACKS } from '@/lib/sariro-data';

/* ════════════════════════════════════════════════════════════════════════
   LeadPipeline — full lead management UI for super admin
   ════════════════════════════════════════════════════════════════════════ */

export function LeadPipeline({ onToast }: { onToast: (msg: string, kind?: 'success' | 'error') => void }) {
  const [leads, setLeads] = useState<StudentLead[]>([]);
  const [summary, setSummary] = useState<StageSummary | null>(null);
  const [workload, setWorkload] = useState<SellerWorkload[]>([]);
  const [sellers, setSellers] = useState<Array<{ id: string; full_name: string | null; email: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [showWorkload, setShowWorkload] = useState(false);

  // Filters
  const [stageFilter, setStageFilter] = useState<LeadStage | 'all'>('all');
  const [sellerFilter, setSellerFilter] = useState<string>('all');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<'student' | 'professional' | 'all'>('all');
  const [interestFilter, setInterestFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  // History modal
  const [historyLead, setHistoryLead] = useState<StudentLead | null>(null);

  const loadAll = useCallback(async () => {
    const [leadsData, summaryData, workloadData, sellersData] = await Promise.all([
      fetchLeads({
        stage: stageFilter,
        sellerId: sellerFilter,
        country: countryFilter,
        leadType: typeFilter,
        areaOfInterest: interestFilter,
        search: search.trim() || undefined,
        limit: 200,
      }),
      fetchStageSummary(),
      fetchSellerWorkload(),
      fetchSellers(),
    ]);
    setLeads(leadsData);
    setSummary(summaryData);
    setWorkload(workloadData);
    setSellers(sellersData);
    setLoading(false);
  }, [stageFilter, sellerFilter, countryFilter, typeFilter, interestFilter, search]);

  useEffect(() => {
    Promise.resolve().then(() => loadAll());
  }, [loadAll]);

  useRealtime({
    tables: ['student_leads', 'lead_history'],
    onRefresh: () => loadAll(),
  });

  // Get unique countries from leads for the country filter
  const countries = [...new Set(leads.map((l) => l.country).filter(Boolean))] as string[];

  return (
    <div>
      <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2 mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}>
        <TrendingUp className="w-5 h-5 text-violet-600" /> Lead Pipeline
        {summary && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700" style={{ fontFamily: 'var(--font-grotesk)' }}>
            {summary.total} total
          </span>
        )}
      </h2>

      {/* Stage summary cards */}
      {summary && (
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
                  isActive ? 'border-violet-400 shadow-md' : 'border-slate-200 hover:border-slate-300'
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
          {/* Deferred separately since it's not in STAGE_ORDER */}
          <button
            onClick={() => setStageFilter(stageFilter === 'deferred' ? 'all' : 'deferred')}
            className={`p-3 rounded-xl border-2 transition-all min-h-[70px] touch-manipulation text-left ${
              stageFilter === 'deferred' ? 'border-violet-400 shadow-md' : 'border-slate-200 hover:border-slate-300'
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
      )}

      {/* Filters bar */}
      <div className="card-3d p-3 mb-4 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, phone, email..."
              className="w-full min-h-[44px] rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              style={{ fontFamily: 'var(--font-inter)', fontSize: '16px' }}
            />
          </div>

          {/* Seller filter */}
          <select
            value={sellerFilter}
            onChange={(e) => setSellerFilter(e.target.value)}
            className="min-h-[44px] rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            <option value="all">All Sellers</option>
            <option value="unassigned">Unassigned</option>
            {sellers.map((s) => (
              <option key={s.id} value={s.id}>{s.full_name ?? s.email}</option>
            ))}
          </select>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as 'student' | 'professional' | 'all')}
            className="min-h-[44px] rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            <option value="all">All Types</option>
            <option value="student">Students</option>
            <option value="professional">Professionals</option>
          </select>

          {/* Interest filter */}
          <select
            value={interestFilter}
            onChange={(e) => setInterestFilter(e.target.value)}
            className="min-h-[44px] rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            <option value="all">All Interests</option>
            {TRACKS.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          {/* Country filter */}
          {countries.length > 0 && (
            <select
              value={countryFilter}
              onChange={(e) => setCountryFilter(e.target.value)}
              className="min-h-[44px] rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              <option value="all">All Countries</option>
              {countries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}

          {/* Clear filters */}
          {(stageFilter !== 'all' || sellerFilter !== 'all' || countryFilter !== 'all' || typeFilter !== 'all' || interestFilter !== 'all' || search) && (
            <button
              onClick={() => { setStageFilter('all'); setSellerFilter('all'); setCountryFilter('all'); setTypeFilter('all'); setInterestFilter('all'); setSearch(''); }}
              className="min-h-[44px] px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold flex items-center gap-1 touch-manipulation"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}

          {/* Workload toggle */}
          <button
            onClick={() => setShowWorkload(!showWorkload)}
            className="min-h-[44px] px-3 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-bold flex items-center gap-1 touch-manipulation"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            <Users className="w-3.5 h-3.5" /> {showWorkload ? 'Hide' : 'Seller'} Workload
          </button>
        </div>
      </div>

      {/* Seller workload overview */}
      {showWorkload && workload.length > 0 && (
        <div className="card-3d p-4 mb-4 overflow-x-auto">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3" style={{ fontFamily: 'var(--font-grotesk)' }}>
            Seller Workload Overview
          </h3>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-2 font-bold text-slate-500">Seller</th>
                <th className="text-center py-2 px-2 font-bold text-amber-600">New</th>
                <th className="text-center py-2 px-2 font-bold text-blue-600">Assigned</th>
                <th className="text-center py-2 px-2 font-bold text-violet-600">Connected</th>
                <th className="text-center py-2 px-2 font-bold text-cyan-600">Gathering</th>
                <th className="text-center py-2 px-2 font-bold text-orange-600">Final</th>
                <th className="text-center py-2 px-2 font-bold text-slate-600">Deferred</th>
                <th className="text-center py-2 px-2 font-bold text-green-600">Enrolled</th>
                <th className="text-center py-2 px-2 font-bold text-slate-900">Total</th>
              </tr>
            </thead>
            <tbody>
              {workload.map((wl) => (
                <tr key={wl.seller_id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="py-2 px-2 font-bold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
                    {wl.seller_name}
                  </td>
                  <td className="text-center py-2 px-2 text-amber-600 font-bold">{wl.new}</td>
                  <td className="text-center py-2 px-2 text-blue-600 font-bold">{wl.seller_assigned}</td>
                  <td className="text-center py-2 px-2 text-violet-600 font-bold">{wl.connected}</td>
                  <td className="text-center py-2 px-2 text-cyan-600 font-bold">{wl.gathering_booked}</td>
                  <td className="text-center py-2 px-2 text-orange-600 font-bold">{wl.final}</td>
                  <td className="text-center py-2 px-2 text-slate-600 font-bold">{wl.deferred}</td>
                  <td className="text-center py-2 px-2 text-green-600 font-bold">{wl.enrolled}</td>
                  <td className="text-center py-2 px-2 text-slate-900 font-extrabold">{wl.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Leads table */}
      {loading ? (
        <div className="card-3d p-8 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
        </div>
      ) : leads.length === 0 ? (
        <div className="card-3d p-8 text-center">
          <TrendingUp className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No leads found. New demo class bookings will appear here automatically.</p>
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
                <th className="text-left py-2 px-2 font-bold text-slate-500">Seller</th>
                <th className="text-left py-2 px-2 font-bold text-slate-500">Stage</th>
                <th className="text-center py-2 px-2 font-bold text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <LeadRow
                  key={lead.id}
                  lead={lead}
                  sellers={sellers}
                  onToast={onToast}
                  onChanged={loadAll}
                  onShowHistory={() => setHistoryLead(lead)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* History modal */}
      {historyLead && (
        <HistoryModal lead={historyLead} onClose={() => setHistoryLead(null)} />
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   Single lead row — with seller dropdown + stage dropdown
   ════════════════════════════════════════════════════════════════════════ */

function LeadRow({
  lead,
  sellers,
  onToast,
  onChanged,
  onShowHistory,
}: {
  lead: StudentLead;
  sellers: Array<{ id: string; full_name: string | null; email: string | null }>;
  onToast: (msg: string, kind?: 'success' | 'error') => void;
  onChanged: () => void;
  onShowHistory: () => void;
}) {
  const [updating, setUpdating] = useState(false);
  const colors = STAGE_COLORS[lead.stage];

  const handleAssignSeller = async (sellerId: string) => {
    if (!sellerId) return;
    setUpdating(true);
    const result = await assignSeller(lead.id, sellerId);
    setUpdating(false);
    if (result.success) {
      onToast('Seller assigned', 'success');
      onChanged();
    } else {
      onToast(result.error || 'Failed to assign seller', 'error');
    }
  };

  const handleStageChange = async (newStage: LeadStage) => {
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

      {/* Seller dropdown */}
      <td className="py-2 px-2">
        <select
          value={lead.assigned_seller ?? ''}
          onChange={(e) => handleAssignSeller(e.target.value)}
          disabled={updating}
          className="text-[10px] rounded-lg border border-slate-200 px-1.5 py-1 text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-violet-400 min-h-[32px] max-w-[120px]"
          style={{ fontFamily: 'var(--font-grotesk)' }}
        >
          <option value="">— Assign —</option>
          {sellers.map((s) => (
            <option key={s.id} value={s.id}>{s.full_name ?? s.email}</option>
          ))}
        </select>
      </td>

      {/* Stage dropdown */}
      <td className="py-2 px-2">
        <select
          value={lead.stage}
          onChange={(e) => handleStageChange(e.target.value as LeadStage)}
          disabled={updating}
          className={`text-[10px] font-bold rounded-lg border border-slate-200 px-1.5 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-violet-400 min-h-[32px] ${colors.text}`}
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
          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 hover:bg-violet-100 text-slate-500 hover:text-violet-600 min-h-[32px] min-w-[32px] touch-manipulation"
          title="View history"
        >
          <History className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   History modal — shows full audit trail for a lead
   ════════════════════════════════════════════════════════════════════════ */

function HistoryModal({ lead, onClose }: { lead: StudentLead; onClose: () => void }) {
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
        {/* Header */}
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

        {/* Body — timeline */}
        <div className="p-5 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">No history yet.</p>
          ) : (
            <div className="space-y-3">
              {history.map((h) => (
                <div key={h.id} className="flex items-start gap-3">
                  {/* Timeline dot */}
                  <div className="shrink-0 w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center mt-0.5">
                    {h.action === 'created' && <TrendingUp className="w-4 h-4 text-violet-600" />}
                    {h.action === 'stage_changed' && <Award className="w-4 h-4 text-violet-600" />}
                    {(h.action === 'seller_assigned' || h.action === 'seller_changed') && <UserCheck className="w-4 h-4 text-violet-600" />}
                  </div>
                  {/* Content */}
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