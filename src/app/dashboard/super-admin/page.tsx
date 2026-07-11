'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown, Users, BookOpen, Clock, GraduationCap, ScrollText,
  DollarSign, Loader2, AlertCircle, CheckCircle2, XCircle, Plus,
  Lock, Trophy, ArrowRight, X, Video, Copy, ShieldCheck, Link as LinkIcon,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/dashboard-layout';
import { useAuth } from '@/components/auth/auth-provider';
import { TRACKS, COURSES, RAZORPAY_LINKS, RAZORPAY_LINKS_PREMIUM } from '@/lib/sariro-data';
import {
  fetchAdminStats, fetchPendingPurchaseIntents, fetchCohorts,
  confirmPurchaseIntent, rejectPurchaseIntent, transitionCohortStatus, createCohort,
  fetchAuditLogs, fetchAuditActions,
  type AdminStats, type PurchaseIntentRow, type CohortRow, type AuditLogRow,
} from '@/lib/dashboard/super-admin-data';
import { getTrackName } from '@/lib/dashboard/upsell-engine';

/* ───── Helpers (shared with admin) ───── */
function levelDisplay(level: string): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return iso;
  }
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  gathering: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Gathering' },
  ready: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Ready' },
  active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' },
  completed: { bg: 'bg-violet-100', text: 'text-violet-700', label: 'Completed' },
  pending: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending' },
};

/* ───── Stat card ───── */
function StatCard({ icon: Icon, color, value, label, loading }: {
  icon: React.ComponentType<{ className?: string }>;
  color: string; value: string | number; label: string; loading?: boolean;
}) {
  return (
    <div className="card-3d p-5">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-2xl font-extrabold text-slate-900">
        {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : value}
      </div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

/* ───── Pending enrollment card (compact version) ───── */
function PendingEnrollmentCard({
  intent, onConfirm, onReject,
}: {
  intent: PurchaseIntentRow;
  onConfirm: (intent: PurchaseIntentRow) => void;
  onReject: (id: string) => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const handleConfirm = async () => {
    setConfirming(true);
    await onConfirm(intent);
    setConfirming(false);
  };
  const handleReject = async () => {
    setRejecting(true);
    await onReject(intent.id);
    setRejecting(false);
  };

  return (
    <div className="card-3d p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-600 mb-1" style={{ fontFamily: 'var(--font-grotesk)' }}>
            Pending · {formatDate(intent.created_at)}
          </div>
          <h4 className="font-extrabold text-slate-900 text-base leading-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>
            {intent.student_name || intent.student_email || 'Unknown student'}
          </h4>
          {intent.student_email && intent.student_name && (
            <div className="text-xs text-slate-500 truncate mt-0.5">{intent.student_email}</div>
          )}
        </div>
        <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700">
          PENDING
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
        <div><div className="text-slate-400 mb-0.5">Track</div><div className="font-bold text-slate-700 truncate">{getTrackName(intent.track)}</div></div>
        <div><div className="text-slate-400 mb-0.5">Level</div><div className="font-bold text-slate-700">{levelDisplay(intent.level)}</div></div>
        <div><div className="text-slate-400 mb-0.5">Ratio</div><div className="font-bold text-slate-700">{intent.ratio}</div></div>
      </div>

      <div className="flex gap-2">
        <button onClick={handleConfirm} disabled={confirming || rejecting}
          className="flex-1 min-h-[44px] px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
          style={{ fontFamily: 'var(--font-grotesk)' }}>
          {confirming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Confirm
        </button>
        <button onClick={handleReject} disabled={confirming || rejecting}
          className="min-h-[44px] px-3 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
          style={{ fontFamily: 'var(--font-grotesk)' }}>
          {rejecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />} Reject
        </button>
      </div>
    </div>
  );
}

/* ───── Cohort card ───── */
function CohortCard({
  cohort, onTransition,
}: {
  cohort: CohortRow;
  onTransition: (cohort: CohortRow, newStatus: 'gathering' | 'ready' | 'active' | 'completed', meetUrl?: string) => void;
}) {
  const [processing, setProcessing] = useState(false);
  const [showMeetModal, setShowMeetModal] = useState(false);
  const [meetUrl, setMeetUrl] = useState(cohort.google_meet_url || '');
  const [error, setError] = useState<string | null>(null);

  const status = STATUS_COLORS[cohort.status] || STATUS_COLORS.gathering;
  const cap = cohort.ratio === '1:1' ? 1 : 4;

  const handleTransition = async (newStatus: 'gathering' | 'ready' | 'active' | 'completed') => {
    if (newStatus === 'active') { setShowMeetModal(true); return; }
    setProcessing(true);
    setError(null);
    await onTransition(cohort, newStatus);
    setProcessing(false);
  };

  const handleActivateWithMeet = async () => {
    if (!meetUrl.trim() || !meetUrl.includes('meet.google.com')) {
      setError('Please enter a valid Google Meet URL');
      return;
    }
    setProcessing(true);
    await onTransition(cohort, 'active', meetUrl);
    setProcessing(false);
    setShowMeetModal(false);
  };

  return (
    <>
      <div className="card-3d p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-violet-600 mb-1" style={{ fontFamily: 'var(--font-grotesk)' }}>
              {levelDisplay(cohort.level)} · {cohort.ratio}
            </div>
            <h4 className="font-extrabold text-slate-900 text-base leading-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>
              {getTrackName(cohort.track)}
            </h4>
            <div className="text-xs text-slate-500 mt-0.5">Created {formatDate(cohort.created_at)}</div>
          </div>
          <span className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-bold ${status.bg} ${status.text}`}>
            {status.label.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
          <div>
            <div className="text-slate-400 mb-0.5">Students</div>
            <div className="font-bold text-slate-700">{cohort.student_count} / {cap}</div>
          </div>
          <div>
            <div className="text-slate-400 mb-0.5">Meet link</div>
            <div className="font-bold text-slate-700 truncate">
              {cohort.google_meet_url ? (
                <a href={cohort.google_meet_url} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline flex items-center gap-1">
                  <Video className="w-3 h-3" /> Active
                </a>
              ) : <span className="text-slate-400">—</span>}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {cohort.status === 'gathering' && (
            <button onClick={() => handleTransition('ready')} disabled={processing || cohort.student_count === 0}
              className="flex-1 min-h-[44px] px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
              style={{ fontFamily: 'var(--font-grotesk)' }}>
              {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />} Mark Ready
            </button>
          )}
          {cohort.status === 'ready' && (
            <button onClick={() => handleTransition('active')} disabled={processing}
              className="flex-1 min-h-[44px] px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
              style={{ fontFamily: 'var(--font-grotesk)' }}>
              {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />} Lock & Activate
            </button>
          )}
          {cohort.status === 'active' && (
            <button onClick={() => handleTransition('completed')} disabled={processing}
              className="flex-1 min-h-[44px] px-3 py-2 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
              style={{ fontFamily: 'var(--font-grotesk)' }}>
              {processing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trophy className="w-3.5 h-3.5" />} Mark Complete
            </button>
          )}
          {cohort.status === 'completed' && (
            <div className="flex-1 text-center text-xs text-violet-600 font-bold py-2.5 flex items-center justify-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> Completed
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showMeetModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => !processing && setShowMeetModal(false)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>Activate Course</h3>
                <button onClick={() => !processing && setShowMeetModal(false)} className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Lock this course and enter the Google Meet URL for all sessions.
              </p>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
                Google Meet URL
              </label>
              <input type="url" value={meetUrl} onChange={(e) => setMeetUrl(e.target.value)}
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
                className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 mb-2"
                autoFocus />
              {error && <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 mb-3">{error}</div>}
              <div className="flex gap-2">
                <button onClick={handleActivateWithMeet} disabled={processing}
                  className="flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ fontFamily: 'var(--font-grotesk)' }}>
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />} Lock & Activate
                </button>
                <button onClick={() => !processing && setShowMeetModal(false)}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold"
                  style={{ fontFamily: 'var(--font-grotesk)' }}>Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ───── Audit log row ───── */
function AuditLogRowItem({ log }: { log: AuditLogRow }) {
  const adminDisplay = log.admin_name || log.admin_email || 'Unknown admin';
  const targetDisplay = log.target_type
    ? `${log.target_type}${log.target_id ? ` · ${log.target_id.slice(0, 8)}...` : ''}`
    : '—';

  // Pretty-print metadata
  let metaDisplay = '';
  if (log.metadata) {
    const m = log.metadata as Record<string, unknown>;
    if (typeof m === 'object' && m !== null) {
      metaDisplay = Object.entries(m)
        .map(([k, v]) => `${k}: ${String(v)}`)
        .join(' · ');
    }
  }

  const actionColors: Record<string, string> = {
    cohort_status_change: 'bg-blue-100 text-blue-700',
  };
  const actionColor = actionColors[log.action] || 'bg-slate-100 text-slate-700';

  return (
    <div className="card-3d p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
          <ScrollText className="w-4 h-4 text-violet-600" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${actionColor}`} style={{ fontFamily: 'var(--font-grotesk)' }}>
              {log.action.replace(/_/g, ' ').toUpperCase()}
            </span>
            <span className="text-[11px] text-slate-500">{formatDateTime(log.created_at)}</span>
          </div>
          <div className="text-sm font-bold text-slate-900 truncate" style={{ fontFamily: 'var(--font-jakarta)' }}>
            {adminDisplay}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Target: {targetDisplay}
          </div>
          {metaDisplay && (
            <div className="text-[11px] text-slate-400 mt-1 truncate">{metaDisplay}</div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───── Razorpay link card ───── */
function RazorpayLinkCard({ tier, ratio, url }: { tier: string; ratio: string; url: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };
  return (
    <div className="card-3d p-4">
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600" style={{ fontFamily: 'var(--font-grotesk)' }}>
            {tier} · {ratio}
          </div>
        </div>
        <button onClick={handleCopy} className="w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600" aria-label="Copy link">
          {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
      <div className="text-xs text-slate-600 break-all font-mono">{url}</div>
      <a href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700 mt-2" style={{ fontFamily: 'var(--font-grotesk)' }}>
        <LinkIcon className="w-3 h-3" /> Open Razorpay page
      </a>
    </div>
  );
}

/* ───── Create cohort modal ───── */
function CreateCohortModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [track, setTrack] = useState(TRACKS[0]?.id ?? 'web');
  const [level, setLevel] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [ratio, setRatio] = useState<'1:1' | '1:4'>('1:4');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    const result = await createCohort({ track, level, ratio, max_capacity: ratio === '1:1' ? 1 : 4 });
    setSubmitting(false);
    if (!result) { setError('Failed to create course.'); return; }
    onCreated();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !submitting && onClose()}>
          <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>Create New Course</h3>
              <button onClick={() => !submitting && onClose()} className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>Track</label>
                <select value={track} onChange={(e) => setTrack(e.target.value)}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/50">
                  {TRACKS.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>Level</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['beginner', 'intermediate', 'advanced'] as const).map(l => (
                    <button key={l} onClick={() => setLevel(l)}
                      className={`h-11 rounded-xl text-sm font-bold border-2 transition-colors ${level === l ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                      style={{ fontFamily: 'var(--font-grotesk)' }}>{levelDisplay(l)}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>Ratio</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['1:1', '1:4'] as const).map(r => (
                    <button key={r} onClick={() => setRatio(r)}
                      className={`h-11 rounded-xl text-sm font-bold border-2 transition-colors ${ratio === r ? 'border-violet-500 bg-violet-50 text-violet-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                      style={{ fontFamily: 'var(--font-grotesk)' }}>{r} {r === '1:1' ? '(Private)' : '(Group)'}</button>
                  ))}
                </div>
              </div>
              {error && <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">{error}</div>}
              <div className="flex gap-2 pt-2">
                <button onClick={handleSubmit} disabled={submitting}
                  className="flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ fontFamily: 'var(--font-grotesk)' }}>
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create
                </button>
                <button onClick={() => !submitting && onClose()}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold"
                  style={{ fontFamily: 'var(--font-grotesk)' }}>Cancel</button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ───── Main super-admin dashboard ───── */
function SuperAdminDashboardInner() {
  const { profile } = useAuth();
  const displayName = profile?.full_name || 'Super Admin';

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [pendingIntents, setPendingIntents] = useState<PurchaseIntentRow[]>([]);
  const [intentsLoading, setIntentsLoading] = useState(true);
  const [cohorts, setCohorts] = useState<CohortRow[]>([]);
  const [cohortsLoading, setCohortsLoading] = useState(true);
  const [cohortFilter, setCohortFilter] = useState<string>('all');
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([]);
  const [auditLoading, setAuditLoading] = useState(true);
  const [auditFilter, setAuditFilter] = useState<string>('all');
  const [auditActions, setAuditActions] = useState<string[]>([]);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const loadAll = useCallback(async () => {
    const [s, intents, c, logs, actions] = await Promise.all([
      fetchAdminStats(),
      fetchPendingPurchaseIntents(),
      fetchCohorts(cohortFilter),
      fetchAuditLogs(auditFilter, 50),
      fetchAuditActions(),
    ]);
    setStats(s); setStatsLoading(false);
    setPendingIntents(intents); setIntentsLoading(false);
    setCohorts(c); setCohortsLoading(false);
    setAuditLogs(logs); setAuditLoading(false);
    setAuditActions(actions);
  }, [cohortFilter, auditFilter]);

  useEffect(() => {
    Promise.resolve().then(() => loadAll());
  }, [loadAll]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleConfirmIntent = async (intent: PurchaseIntentRow) => {
    const result = await confirmPurchaseIntent(intent);
    if (result.success) {
      setToast({ type: 'success', message: `Enrollment confirmed for ${intent.student_name || intent.student_email}` });
      await loadAll();
    } else {
      setToast({ type: 'error', message: result.error || 'Failed to confirm' });
    }
  };

  const handleRejectIntent = async (id: string) => {
    const result = await rejectPurchaseIntent(id);
    if (result.success) {
      setToast({ type: 'success', message: 'Purchase intent rejected' });
      await loadAll();
    } else {
      setToast({ type: 'error', message: result.error || 'Failed to reject' });
    }
  };

  const handleCohortTransition = async (
    cohort: CohortRow,
    newStatus: 'gathering' | 'ready' | 'active' | 'completed',
    meetUrl?: string
  ) => {
    const result = await transitionCohortStatus(cohort.id, newStatus, meetUrl || cohort.google_meet_url || undefined);
    if (result.success) {
      setToast({ type: 'success', message: `Course marked as ${newStatus}` });
      await loadAll();
    } else {
      setToast({ type: 'error', message: result.error || 'Failed to update course' });
    }
  };

  // Build Razorpay links list — 3 tiers × 2 ratios = 6 links total
  const standardEntries = Object.entries(RAZORPAY_LINKS);
  const premiumEntries = Object.entries(RAZORPAY_LINKS_PREMIUM);

  return (
    <section className="relative pt-6 sm:pt-10 pb-16 px-4 sm:px-6 lg:px-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-5 h-5 text-violet-600" />
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600" style={{ fontFamily: 'var(--font-grotesk)' }}>
              Super Admin
            </span>
          </div>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
                Welcome, {displayName.split(' ')[0]}! 👑
              </h1>
              <p className="text-slate-600 mt-1.5 text-sm">
                Full control — manage courses, view audit logs, and oversee payments.
              </p>
            </div>
            <button onClick={() => setShowCreateModal(true)}
              className="btn-tactile btn-tactile-primary px-5 py-2.5 text-sm flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Course
            </button>
          </div>
        </motion.div>

        {/* Stats (5 cards for super-admin) */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
          <StatCard icon={Users} color="bg-blue-100 text-blue-600" value={stats?.totalUsers ?? 0} label="Total users" loading={statsLoading} />
          <StatCard icon={BookOpen} color="bg-green-100 text-green-600" value={stats?.totalEnrollments ?? 0} label="Enrollments" loading={statsLoading} />
          <StatCard icon={Clock} color="bg-amber-100 text-amber-600" value={stats?.pendingPurchaseIntents ?? 0} label="Pending" loading={statsLoading} />
          <StatCard icon={GraduationCap} color="bg-violet-100 text-violet-600" value={stats?.activeCohorts ?? 0} label="Active courses" loading={statsLoading} />
          <StatCard icon={ScrollText} color="bg-red-100 text-red-600" value={auditLogs.length} label="Audit logs" loading={auditLoading} />
        </div>

        {/* Pending enrollments */}
        <div className="mb-10">
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2 mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}>
            <Clock className="w-5 h-5 text-amber-600" />
            Pending Enrollments
            {pendingIntents.length > 0 && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-700">{pendingIntents.length}</span>
            )}
          </h2>
          {intentsLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-amber-600" /></div>
          ) : pendingIntents.length === 0 ? (
            <div className="card-3d p-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900 mb-1" style={{ fontFamily: 'var(--font-jakarta)' }}>All caught up!</h3>
              <p className="text-sm text-slate-500">No pending enrollment approvals right now.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingIntents.map(intent => (
                <PendingEnrollmentCard key={intent.id} intent={intent} onConfirm={handleConfirmIntent} onReject={handleRejectIntent} />
              ))}
            </div>
          )}
        </div>

        {/* Courses */}
        <div className="mb-10" id="cohorts">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2" style={{ fontFamily: 'var(--font-jakarta)' }}>
              <GraduationCap className="w-5 h-5 text-violet-600" /> Courses
              {stats && stats.totalCohorts > 0 && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-violet-100 text-violet-700">{stats.totalCohorts}</span>
              )}
            </h2>
            <div className="inline-flex p-1 rounded-xl bg-slate-100 gap-1 flex-wrap">
              {['all', 'gathering', 'ready', 'active', 'completed'].map(f => (
                <button key={f} onClick={() => setCohortFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${cohortFilter === f ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                  style={{ fontFamily: 'var(--font-grotesk)' }}>
                  {f === 'all' ? 'All' : levelDisplay(f)}
                </button>
              ))}
            </div>
          </div>
          {cohortsLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-violet-600" /></div>
          ) : cohorts.length === 0 ? (
            <div className="card-3d p-8 text-center">
              <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900 mb-1" style={{ fontFamily: 'var(--font-jakarta)' }}>No courses yet</h3>
              <p className="text-sm text-slate-500 mb-4">Create your first course to start gathering students.</p>
              <button onClick={() => setShowCreateModal(true)} className="btn-tactile btn-tactile-primary px-5 py-2.5 text-sm inline-flex items-center gap-2">
                <Plus className="w-4 h-4" /> Create Course
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cohorts.map(c => <CohortCard key={c.id} cohort={c} onTransition={handleCohortTransition} />)}
            </div>
          )}
        </div>

        {/* Razorpay payment links */}
        <div className="mb-10" id="pricing">
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2 mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}>
            <DollarSign className="w-5 h-5 text-amber-600" /> Razorpay Payment Links
          </h2>
          <div className="card-3d p-5 mb-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-sm text-slate-600">
                6 live Razorpay payment page URLs — 3 tiers × 2 ratios. Students get routed to the matching link when they click "Reserve your seat".
                <strong className="text-slate-900"> 1:4 (standard)</strong> uses the base link.
                <strong className="text-slate-900"> 1:1 (premium)</strong> uses the same link with "premium" appended.
                To change these URLs, edit <code className="px-1.5 py-0.5 rounded bg-slate-100 text-xs">RAZORPAY_LINKS</code> in <code className="px-1.5 py-0.5 rounded bg-slate-100 text-xs">src/lib/sariro-data.ts</code>.
              </div>
            </div>
          </div>

          {/* 1:4 Standard links */}
          <div className="mb-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 mb-3" style={{ fontFamily: 'var(--font-grotesk)' }}>
              1:4 Standard (Group)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {standardEntries.map(([tier, url]) => (
                <RazorpayLinkCard key={`std-${tier}`} tier={tier} ratio="1:4" url={url} />
              ))}
            </div>
          </div>

          {/* 1:1 Premium links */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-amber-600 mb-3" style={{ fontFamily: 'var(--font-grotesk)' }}>
              1:1 Premium (Private)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {premiumEntries.map(([tier, url]) => (
                <RazorpayLinkCard key={`prem-${tier}`} tier={tier} ratio="1:1" url={url} />
              ))}
            </div>
          </div>
        </div>

        {/* Audit logs */}
        <div className="mb-10" id="audit">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2" style={{ fontFamily: 'var(--font-jakarta)' }}>
              <ScrollText className="w-5 h-5 text-red-600" /> Audit Logs
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-700">{auditLogs.length}</span>
            </h2>
            <select
              value={auditFilter}
              onChange={(e) => setAuditFilter(e.target.value)}
              className="h-10 px-3 rounded-xl border border-slate-200 text-xs font-bold bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              <option value="all">All actions</option>
              {auditActions.map(a => <option key={a} value={a}>{a.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          {auditLoading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-red-600" /></div>
          ) : auditLogs.length === 0 ? (
            <div className="card-3d p-8 text-center">
              <ScrollText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-900 mb-1" style={{ fontFamily: 'var(--font-jakarta)' }}>No audit logs yet</h3>
              <p className="text-sm text-slate-500">
                Every course status change is automatically logged here. Make your first change to see it appear.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {auditLogs.map(log => <AuditLogRowItem key={log.id} log={log} />)}
            </div>
          )}
        </div>

        {/* Catalog */}
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2 mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}>
            <BookOpen className="w-5 h-5 text-blue-600" /> Catalog
          </h2>
          <div className="card-3d p-5">
            <p className="text-sm text-slate-600 mb-3">
              {COURSES.length} courses across {TRACKS.length} tracks · 3 levels each.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {TRACKS.map(t => (
                <div key={t.id} className="px-3 py-2 rounded-lg bg-slate-50 text-xs font-bold text-slate-700 truncate" style={{ fontFamily: 'var(--font-grotesk)' }}>
                  {t.short}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <CreateCohortModal open={showCreateModal} onClose={() => setShowCreateModal(false)} onCreated={() => { setToast({ type: 'success', message: 'Course created' }); loadAll(); }} />

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
            className={`fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-[90] px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}
            style={{ fontFamily: 'var(--font-grotesk)' }}>
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span className="text-sm font-bold">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default function SuperAdminDashboard() {
  return (
    <DashboardLayout>
      <SuperAdminDashboardInner />
    </DashboardLayout>
  );
}
