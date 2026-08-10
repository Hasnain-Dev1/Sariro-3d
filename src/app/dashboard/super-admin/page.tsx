'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown, Users, BookOpen, Clock, GraduationCap, ScrollText,
  DollarSign, Loader2, AlertCircle, CheckCircle2, XCircle, Plus,
  Lock, Trophy, ArrowRight, X, Video, Copy, ShieldCheck, Link as LinkIcon,
  FolderOpen, Rocket, Calendar, Mail, Phone, Coins, ChevronDown,
  UserCheck, Search, Download, LogIn,
} from 'lucide-react';
import DashboardLayout from '@/components/dashboard/dashboard-layout';
import { useAuth } from '@/components/auth/auth-provider';
import { TRACKS, COURSES, RAZORPAY_LINKS, RAZORPAY_LINKS_PREMIUM } from '@/lib/sariro-data';
import { createClient } from '@/lib/supabase/client';
import {
  fetchAdminStats, fetchPendingPurchaseIntents, fetchCohorts,
  confirmPurchaseIntent, rejectPurchaseIntent, transitionCohortStatus, createCohort,
  updateCohortMeetUrl, updateCohortMaterialsUrl,
  type AdminStats, type PurchaseIntentRow, type CohortRow,
} from '@/lib/dashboard/admin-data';
import {
  fetchAuditLogs, fetchAuditActions,
  type AuditLogRow,
} from '@/lib/dashboard/super-admin-data';
import {
  fetchCreditsForStudent, adjustCredits,
  formatCreditAmount, formatTransactionType, formatTransactionTime,
  type CreditRow, type CreditTransactionRow,
} from '@/lib/dashboard/credits-data';
import { getCourseSyllabus } from '@/lib/dashboard/student-data';
import { getTrackName } from '@/lib/dashboard/upsell-engine';
import { TeacherManagementModal } from '@/components/dashboard/teacher-management';
import ScheduleBatchModal from '@/components/dashboard/schedule-batch';
import ManageBatchesModal from '@/components/dashboard/manage-batches';
import { TeacherCourseAssignmentModal } from '@/app/dashboard/admin/teacher-course-assignments';
import { UserManagementModal } from '@/components/dashboard/user-management-modal';
import { LeadPipeline } from '@/app/dashboard/super-admin/lead-pipeline';
import { useRealtime } from '@/lib/dashboard/use-realtime';

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
  cohort, onTransition, onSetMeetUrl, onSetMaterialsUrl,
}: {
  cohort: CohortRow;
  onTransition: (cohort: CohortRow, newStatus: 'gathering' | 'ready' | 'active' | 'completed', meetUrl?: string) => void;
  onSetMeetUrl?: (cohort: CohortRow, url: string) => Promise<void>;
  onSetMaterialsUrl?: (cohort: CohortRow, url: string) => Promise<void>;
}) {
  const [processing, setProcessing] = useState(false);
  const [showMeetModal, setShowMeetModal] = useState(false);
  const [showEditMeetModal, setShowEditMeetModal] = useState(false);
  const [showMaterialsModal, setShowMaterialsModal] = useState(false);
  const [meetUrl, setMeetUrl] = useState(cohort.google_meet_url || '');
  const [editMeetUrl, setEditMeetUrl] = useState(cohort.google_meet_url || '');
  const [materialsUrl, setMaterialsUrl] = useState(cohort.materials_url || '');
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

  const handleSaveEditMeet = async () => {
    if (!onSetMeetUrl) return;
    if (editMeetUrl.trim() && !/^https?:\/\/.+/i.test(editMeetUrl.trim())) {
      setError('URL must start with http:// or https://');
      return;
    }
    setProcessing(true);
    setError(null);
    await onSetMeetUrl(cohort, editMeetUrl.trim());
    setProcessing(false);
    setShowEditMeetModal(false);
  };

  const handleSaveMaterials = async () => {
    if (!onSetMaterialsUrl) return;
    if (materialsUrl.trim() && !/^https?:\/\/.+/i.test(materialsUrl.trim())) {
      setError('URL must start with http:// or https://');
      return;
    }
    setProcessing(true);
    setError(null);
    await onSetMaterialsUrl(cohort, materialsUrl.trim());
    setProcessing(false);
    setShowMaterialsModal(false);
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

        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
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
          <div className="col-span-2">
            <div className="text-slate-400 mb-0.5">Materials link</div>
            <div className="font-bold text-slate-700 truncate">
              {cohort.materials_url ? (
                <a href={cohort.materials_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                  <FolderOpen className="w-3 h-3" /> View materials
                </a>
              ) : <span className="text-slate-400">—</span>}
            </div>
          </div>
        </div>

        {/* Set Meet / Materials URL buttons (always visible) */}
        {(onSetMeetUrl || onSetMaterialsUrl) && (
          <div className="flex gap-2 mb-2">
            {onSetMeetUrl && (
              <button
                onClick={() => { setEditMeetUrl(cohort.google_meet_url || ''); setError(null); setShowEditMeetModal(true); }}
                className="flex-1 min-h-[36px] px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center gap-1.5"
                style={{ fontFamily: 'var(--font-grotesk)' }}>
                <Video className="w-3 h-3" />
                {cohort.google_meet_url ? 'Edit Meet' : 'Set Meet'}
              </button>
            )}
            {onSetMaterialsUrl && (
              <button
                onClick={() => { setMaterialsUrl(cohort.materials_url || ''); setError(null); setShowMaterialsModal(true); }}
                className="flex-1 min-h-[36px] px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center gap-1.5"
                style={{ fontFamily: 'var(--font-grotesk)' }}>
                <FolderOpen className="w-3 h-3" />
                {cohort.materials_url ? 'Edit Materials' : 'Set Materials'}
              </button>
            )}
          </div>
        )}

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

      {/* Meet URL modal — activation flow */}
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

      {/* Edit Meet URL modal — independent of state */}
      <AnimatePresence>
        {showEditMeetModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => !processing && setShowEditMeetModal(false)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>Set Google Meet URL</h3>
                <button onClick={() => !processing && setShowEditMeetModal(false)} className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Paste the Google Meet URL for this cohort's sessions. Leave blank to clear.
              </p>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
                Google Meet URL
              </label>
              <input type="url" value={editMeetUrl} onChange={(e) => setEditMeetUrl(e.target.value)}
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
                className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 mb-2"
                autoFocus />
              {error && <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 mb-3">{error}</div>}
              <div className="flex gap-2">
                <button onClick={handleSaveEditMeet} disabled={processing}
                  className="flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ fontFamily: 'var(--font-grotesk)' }}>
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />} Save Meet URL
                </button>
                <button onClick={() => !processing && setShowEditMeetModal(false)}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold"
                  style={{ fontFamily: 'var(--font-grotesk)' }}>Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Materials URL modal */}
      <AnimatePresence>
        {showMaterialsModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => !processing && setShowMaterialsModal(false)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>Set Materials URL</h3>
                <button onClick={() => !processing && setShowMaterialsModal(false)} className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-slate-600 mb-4">
                Paste a link to the cohort's materials folder (Google Drive, Notion, etc.). Students will see this in their dashboard. Leave blank to clear.
              </p>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
                Materials URL
              </label>
              <input type="url" value={materialsUrl} onChange={(e) => setMaterialsUrl(e.target.value)}
                placeholder="https://drive.google.com/..."
                className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50 mb-2"
                autoFocus />
              {error && <div className="px-3 py-2 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 mb-3">{error}</div>}
              <div className="flex gap-2">
                <button onClick={handleSaveMaterials} disabled={processing}
                  className="flex-1 min-h-[44px] px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ fontFamily: 'var(--font-grotesk)' }}>
                  {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderOpen className="w-4 h-4" />} Save Materials URL
                </button>
                <button onClick={() => !processing && setShowMaterialsModal(false)}
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
  const [track, setTrack] = useState<string>(TRACKS[0]?.id ?? 'web');
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
  const { profile, user } = useAuth();
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
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [showScheduleBatch, setShowScheduleBatch] = useState(false);
  const [showManageBatches, setShowManageBatches] = useState(false);

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

  // Realtime sync — auto-refresh when relevant tables change.
  useRealtime({
    tables: ['enrollments', 'bookings', 'cohorts', 'notifications', 'purchase_intents', 'session_attendance'],
    onRefresh: () => { loadAll(); },
    enabled: !!user,
  });

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

  const handleSetMeetUrl = async (cohort: CohortRow, url: string) => {
    const result = await updateCohortMeetUrl(cohort.id, url);
    if (result.success) {
      setToast({ type: 'success', message: url ? 'Meet URL updated' : 'Meet URL cleared' });
      await loadAll();
    } else {
      setToast({ type: 'error', message: result.error || 'Failed to update Meet URL' });
    }
  };

  const handleSetMaterialsUrl = async (cohort: CohortRow, url: string) => {
    const result = await updateCohortMaterialsUrl(cohort.id, url);
    if (result.success) {
      setToast({ type: 'success', message: url ? 'Materials URL updated' : 'Materials URL cleared' });
      await loadAll();
    } else {
      setToast({ type: 'error', message: result.error || 'Failed to update Materials URL' });
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
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowUserManagement(true)}
                className="btn-tactile btn-tactile-light px-4 py-2.5 text-sm flex items-center gap-2"
              >
                <UserCheck className="w-4 h-4" /> Users
              </button>
              <button
                onClick={() => setShowTeacherModal(true)}
                className="btn-tactile btn-tactile-light px-4 py-2.5 text-sm flex items-center gap-2"
              >
                <Users className="w-4 h-4" /> Teachers
              </button>
              <button
                onClick={() => setShowAssignmentModal(true)}
                className="btn-tactile btn-tactile-light px-4 py-2.5 text-sm flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" /> Course Eligibility
              </button>
              <button
                onClick={() => setShowScheduleBatch(true)}
                className="btn-tactile btn-tactile-light px-4 py-2.5 text-sm flex items-center gap-2"
              >
                <Clock className="w-4 h-4" /> Schedule Batch
              </button>
              <button
                onClick={() => setShowManageBatches(true)}
                className="btn-tactile btn-tactile-light px-4 py-2.5 text-sm flex items-center gap-2"
              >
                <Users className="w-4 h-4" /> Manage Batches
              </button>
              <button onClick={() => setShowCreateModal(true)}
                className="btn-tactile btn-tactile-primary px-5 py-2.5 text-sm flex items-center gap-2">
                <Plus className="w-4 h-4" /> New Course
              </button>
            </div>
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
              {cohorts.map(c => <CohortCard key={c.id} cohort={c} onTransition={handleCohortTransition} onSetMeetUrl={handleSetMeetUrl} onSetMaterialsUrl={handleSetMaterialsUrl} />)}
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

      <TeacherManagementModal
        open={showTeacherModal}
        onClose={() => setShowTeacherModal(false)}
        onToast={(msg, kind) => setToast({ type: kind || 'success', message: msg })}
      />

      {/* Teacher course eligibility modal (assign tracks+levels to teachers) */}
      <TeacherCourseAssignmentModal
        open={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        onToast={(msg, kind) => setToast({ type: kind || 'success', message: msg })}
      />

      {/* User management modal — change roles + sign in as */}
      <UserManagementModal
        open={showUserManagement}
        onClose={() => setShowUserManagement(false)}
        onToast={(type, message) => setToast({ type, message })}
      />

      <ScheduleBatchModal
        open={showScheduleBatch}
        onClose={() => setShowScheduleBatch(false)}
        onCreated={() => { setToast({ type: 'success', message: 'Batch scheduled — classes generated.' }); loadAll(); }}
      />

      <ManageBatchesModal
        open={showManageBatches}
        onClose={() => setShowManageBatches(false)}
        onToast={(msg, kind) => setToast({ type: kind || 'success', message: msg })}
      />

      {/* Lead Pipeline — centralized student/lead management */}
      <LeadPipeline onToast={(msg, kind) => setToast({ type: kind || 'success', message: msg })} />

      {/* Demo Class Requests — same as admin dashboard */}
      <DemoRequestsSection onToast={(msg, kind) => setToast({ type: kind || 'success', message: msg })} />

      {/* Credit Adjustment — super admin can add/deduct credits from any student */}
      <CreditAdjustmentSection onToast={(msg, kind) => setToast({ type: kind || 'success', message: msg })} />

      {/* Lesson Plan Browser — super admin can view all course syllabuses */}
      <LessonPlanBrowserSection />

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

/* ════════════════════════════════════════════════════════════════════════
   Demo Class Requests Section (same as admin dashboard)
   ════════════════════════════════════════════════════════════════════════ */

interface DemoRequestRow {
  id: string;
  student_name: string;
  parent_name: string | null;
  phone: string;
  phone_country_code: string | null;
  email: string | null;
  course_interest: string | null;
  preferred_slot: string;
  preferred_slot_label: string;
  timezone: string;
  timezone_offset: number | null;
  status: 'new' | 'contacted' | 'scheduled' | 'completed' | 'cancelled';
  contacted_at: string | null;
  scheduled_at: string | null;
  notes: string | null;
  created_at: string;
}

function DemoRequestsSection({ onToast }: { onToast: (msg: string, kind?: 'success' | 'error') => void }) {
  const [requests, setRequests] = useState<DemoRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState<DemoRequestRow | null>(null);

  const loadRequests = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('demo_class_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      setRequests((data ?? []) as DemoRequestRow[]);
    } catch (err) {
      console.warn('[super-admin] demo requests load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  useRealtime({
    tables: ['demo_class_requests'],
    onRefresh: () => loadRequests(),
  });

  const newCount = requests.filter((r) => r.status === 'new').length;

  const updateStatus = async (id: string, status: DemoRequestRow['status']) => {
    try {
      const supabase = createClient();
      const updates: Partial<DemoRequestRow> = { status };
      if (status === 'contacted') updates.contacted_at = new Date().toISOString();
      if (status === 'scheduled') updates.scheduled_at = new Date().toISOString();
      const { error } = await supabase.from('demo_class_requests').update(updates).eq('id', id);
      if (error) throw error;
      onToast(`Marked as ${status}`, 'success');
      loadRequests();
      setSelectedReq(null);
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Failed to update', 'error');
    }
  };

  return (
    <div>
      <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2 mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}>
        <Rocket className="w-5 h-5 text-amber-600" /> Demo Class Requests
        {newCount > 0 && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700" style={{ fontFamily: 'var(--font-grotesk)' }}>
            {newCount} NEW
          </span>
        )}
      </h2>

      {loading ? (
        <div className="card-3d p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
        </div>
      ) : requests.length === 0 ? (
        <div className="card-3d p-6 text-center">
          <Rocket className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No demo class requests yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {requests.map((req) => (
            <button
              key={req.id}
              onClick={() => setSelectedReq(req)}
              className="block w-full text-left bg-white rounded-xl border border-slate-200 p-3.5 hover:border-amber-300 hover:shadow-md transition-all min-h-[60px] touch-manipulation"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>
                      {new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <DemoStatusBadge status={req.status} />
                  </div>
                  <p className="text-sm font-bold text-slate-900 truncate" style={{ fontFamily: 'var(--font-jakarta)' }}>
                    {req.student_name}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {req.phone}{req.email && ` · ${req.email}`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-slate-500 truncate max-w-[150px]">
                    {req.preferred_slot_label}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {selectedReq && (
        <DemoRequestModal request={selectedReq} onClose={() => setSelectedReq(null)} onUpdateStatus={updateStatus} />
      )}
    </div>
  );
}

function DemoStatusBadge({ status }: { status: DemoRequestRow['status'] }) {
  const styles: Record<DemoRequestRow['status'], string> = {
    new: 'bg-amber-100 text-amber-700',
    contacted: 'bg-blue-100 text-blue-700',
    scheduled: 'bg-violet-100 text-violet-700',
    completed: 'bg-green-100 text-green-700',
    cancelled: 'bg-slate-100 text-slate-500',
  };
  return (
    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${styles[status]}`} style={{ fontFamily: 'var(--font-grotesk)' }}>
      {status}
    </span>
  );
}

function DemoRequestModal({
  request,
  onClose,
  onUpdateStatus,
}: {
  request: DemoRequestRow;
  onClose: () => void;
  onUpdateStatus: (id: string, status: DemoRequestRow['status']) => void;
}) {
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
              <DemoStatusBadge status={request.status} />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base" style={{ fontFamily: 'var(--font-jakarta)' }}>
              {request.student_name}
            </h3>
            <p className="text-xs text-slate-500">Requested {new Date(request.created_at).toLocaleString()}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="shrink-0 w-9 h-9 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center min-h-[44px] min-w-[44px]">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          <DemoDetailRow icon={<Phone className="w-4 h-4" />} label="Phone" value={`${request.phone_country_code ? request.phone_country_code + ' ' : ''}${request.phone}`} />
          {request.parent_name && <DemoDetailRow icon={<Users className="w-4 h-4" />} label="Parent" value={request.parent_name} />}
          {request.email && <DemoDetailRow icon={<Mail className="w-4 h-4" />} label="Email" value={request.email} link={`mailto:${request.email}`} />}
          {request.course_interest && <DemoDetailRow icon={<BookOpen className="w-4 h-4" />} label="Course interest" value={request.course_interest} />}
          <DemoDetailRow icon={<Calendar className="w-4 h-4" />} label="Preferred slot" value={request.preferred_slot_label} />
          <DemoDetailRow icon={<Clock className="w-4 h-4" />} label="Timezone" value={`${request.timezone} (UTC${(request.timezone_offset ?? 0) >= 0 ? '+' : ''}${(request.timezone_offset ?? 0) / 60})`} />
        </div>
        <div className="p-5 border-t border-slate-100 shrink-0 flex flex-wrap gap-2">
          {request.status !== 'contacted' && (
            <button onClick={() => onUpdateStatus(request.id, 'contacted')} className="flex-1 min-h-[44px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold touch-manipulation" style={{ fontFamily: 'var(--font-grotesk)' }}>Mark contacted</button>
          )}
          {request.status !== 'scheduled' && (
            <button onClick={() => onUpdateStatus(request.id, 'scheduled')} className="flex-1 min-h-[44px] rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold touch-manipulation" style={{ fontFamily: 'var(--font-grotesk)' }}>Mark scheduled</button>
          )}
          {request.status !== 'completed' && (
            <button onClick={() => onUpdateStatus(request.id, 'completed')} className="flex-1 min-h-[44px] rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold touch-manipulation" style={{ fontFamily: 'var(--font-grotesk)' }}>Mark completed</button>
          )}
          {request.status !== 'cancelled' && (
            <button onClick={() => onUpdateStatus(request.id, 'cancelled')} className="flex-1 min-h-[44px] rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold touch-manipulation" style={{ fontFamily: 'var(--font-grotesk)' }}>Cancel</button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function DemoDetailRow({ icon, label, value, link }: { icon: React.ReactNode; label: string; value: string; link?: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="text-slate-400 mt-0.5">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>{label}</p>
        {link ? (
          <a href={link} className="text-sm font-bold text-blue-600 hover:text-blue-700 break-all">{value}</a>
        ) : (
          <p className="text-sm font-bold text-slate-900 break-words">{value}</p>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   Credit Adjustment Section — super admin can add/deduct credits
   ════════════════════════════════════════════════════════════════════════ */

function CreditAdjustmentSection({ onToast }: { onToast: (msg: string, kind?: 'success' | 'error') => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Array<{ id: string; full_name: string | null; email: string | null; role: string | null }>>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; full_name: string | null; email: string | null } | null>(null);
  const [credits, setCredits] = useState<CreditRow | null>(null);
  const [transactions, setTransactions] = useState<CreditTransactionRow[]>([]);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  const searchUsers = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10);
      if (error) throw error;
      setResults((data ?? []) as Array<{ id: string; full_name: string | null; email: string | null; role: string | null }>);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const loadUserCredits = useCallback(async (userId: string) => {
    const [creds, txs] = await Promise.all([
      fetchCreditsForStudent(userId),
      (async () => {
        try {
          const supabase = createClient();
          const { data } = await supabase
            .from('credit_transactions')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(20);
          return (data ?? []) as CreditTransactionRow[];
        } catch {
          return [];
        }
      })(),
    ]);
    setCredits(creds);
    setTransactions(txs);
  }, []);

  const handleSelectUser = (user: { id: string; full_name: string | null; email: string | null }) => {
    setSelectedUser(user);
    setSearchQuery('');
    setResults([]);
    loadUserCredits(user.id);
  };

  const handleAdjust = async () => {
    if (!selectedUser) return;
    const amount = parseInt(adjustAmount, 10);
    if (isNaN(amount) || amount === 0) {
      onToast('Amount must be a non-zero number', 'error');
      return;
    }
    if (!adjustReason.trim() || adjustReason.trim().length < 3) {
      onToast('Reason must be at least 3 characters', 'error');
      return;
    }
    setAdjusting(true);
    const result = await adjustCredits(selectedUser.id, amount, adjustReason);
    setAdjusting(false);
    if (result.success) {
      onToast(`${amount > 0 ? 'Added' : 'Deducted'} ${Math.abs(amount)} credits`, 'success');
      setAdjustAmount('');
      setAdjustReason('');
      loadUserCredits(selectedUser.id);
    } else {
      onToast(result.error || 'Adjustment failed', 'error');
    }
  };

  return (
    <div>
      <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2 mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}>
        <Coins className="w-5 h-5 text-amber-600" /> Credit Management
      </h2>

      {/* Search bar */}
      <div className="card-3d p-4 mb-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2" style={{ fontFamily: 'var(--font-grotesk)' }}>
          Search student by name or email
        </p>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            searchUsers(e.target.value);
          }}
          placeholder="e.g. Aarav or aarav@example.com"
          className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3.5 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500"
          style={{ fontFamily: 'var(--font-inter)', fontSize: '16px' }}
        />

        {/* Search results */}
        {searching && (
          <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Searching...
          </div>
        )}
        {!searching && results.length > 0 && (
          <div className="mt-2 space-y-1">
            {results.map((u) => (
              <button
                key={u.id}
                onClick={() => handleSelectUser(u)}
                className="block w-full text-left p-2.5 rounded-lg bg-slate-50 hover:bg-amber-50 hover:border-amber-300 border border-transparent transition-all min-h-[44px] touch-manipulation"
              >
                <p className="text-sm font-bold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
                  {u.full_name ?? 'Unknown'}
                </p>
                <p className="text-xs text-slate-500">{u.email}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Selected user details */}
      {selectedUser && (
        <div className="card-3d p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-sm font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
                {selectedUser.full_name ?? 'Unknown'}
              </p>
              <p className="text-xs text-slate-500">{selectedUser.email}</p>
            </div>
            <button
              onClick={() => { setSelectedUser(null); setCredits(null); setTransactions([]); }}
              className="text-slate-400 hover:text-slate-600 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Current balance */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 flex items-center gap-3">
            <Coins className="w-6 h-6 text-amber-600" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-700" style={{ fontFamily: 'var(--font-grotesk)' }}>
                Current Balance
              </p>
              <p className="text-xl font-extrabold text-amber-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
                {credits?.balance ?? 0} credits
              </p>
            </div>
          </div>

          {/* Adjust form */}
          <div className="space-y-2 mb-4">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500" style={{ fontFamily: 'var(--font-grotesk)' }}>
              Add or Deduct Credits
            </p>
            <div className="flex gap-2">
              <input
                type="number"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                placeholder="e.g. 5 or -3"
                className="flex-1 min-h-[44px] rounded-xl border border-slate-300 px-3 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                style={{ fontFamily: 'var(--font-inter)', fontSize: '16px' }}
              />
              <input
                type="text"
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="Reason (required)"
                maxLength={500}
                className="flex-1 min-h-[44px] rounded-xl border border-slate-300 px-3 py-2.5 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                style={{ fontFamily: 'var(--font-inter)', fontSize: '16px' }}
              />
            </div>
            <button
              onClick={handleAdjust}
              disabled={adjusting || !adjustAmount || !adjustReason.trim()}
              className="w-full min-h-[44px] rounded-xl bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white text-sm font-bold touch-manipulation"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              {adjusting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Apply adjustment'}
            </button>
            <p className="text-[10px] text-slate-400">
              Use positive number to add (e.g. 5), negative to deduct (e.g. -3)
            </p>
          </div>

          {/* Transaction history */}
          {transactions.length > 0 && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2" style={{ fontFamily: 'var(--font-grotesk)' }}>
                Recent Transactions
              </p>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-100 last:border-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate" style={{ fontFamily: 'var(--font-jakarta)' }}>
                        {tx.description}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {formatTransactionType(tx.type)} · {formatTransactionTime(tx.created_at)}
                      </p>
                    </div>
                    <p className={`text-xs font-extrabold shrink-0 ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`} style={{ fontFamily: 'var(--font-grotesk)' }}>
                      {formatCreditAmount(tx.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   Lesson Plan Browser — super admin can view all course syllabuses
   ════════════════════════════════════════════════════════════════════════ */

function LessonPlanBrowserSection() {
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const selectedCourse = COURSES.find((c) => c.id === selectedCourseId);
  const syllabus = selectedCourse ? getCourseSyllabus(selectedCourse.trackId, selectedCourse.level) : null;

  return (
    <div>
      <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2 mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}>
        <BookOpen className="w-5 h-5 text-blue-600" /> Lesson Plans
      </h2>

      {!selectedCourse ? (
        /* Course list */
        <div className="card-3d p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3" style={{ fontFamily: 'var(--font-grotesk)' }}>
            All Courses ({COURSES.length})
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
            {COURSES.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCourseId(c.id)}
                className="text-left p-3 rounded-xl bg-slate-50 hover:bg-blue-50 hover:border-blue-300 border border-transparent transition-all min-h-[60px] touch-manipulation"
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700" style={{ fontFamily: 'var(--font-grotesk)' }}>
                    {c.level}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-900 truncate" style={{ fontFamily: 'var(--font-jakarta)' }}>
                  {c.title}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {c.modules} modules · {c.lessons} lessons
                </p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Selected course syllabus */
        <div className="card-3d p-4">
          <button
            onClick={() => setSelectedCourseId(null)}
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 mb-3 min-h-[44px] touch-manipulation"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            <ArrowRight className="w-3 h-3 rotate-180" /> Back to course list
          </button>

          <h3 className="text-lg font-extrabold text-slate-900 mb-1" style={{ fontFamily: 'var(--font-jakarta)' }}>
            {selectedCourse.title}
          </h3>
          <p className="text-sm text-slate-600 mb-1">{selectedCourse.tagline}</p>
          <div className="flex items-center gap-3 text-xs text-slate-500 mb-4" style={{ fontFamily: 'var(--font-grotesk)' }}>
            <span>{selectedCourse.modules} modules</span>
            <span>·</span>
            <span>{selectedCourse.lessons} lessons</span>
            <span>·</span>
            <span>{selectedCourse.durationWeeks} weeks</span>
          </div>

          {/* Modules */}
          {syllabus && syllabus.modules.map((mod) => (
            <div key={mod.num} className="mb-4 border border-slate-200 rounded-xl overflow-hidden">
              <div className="p-3 bg-slate-50">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-extrabold" style={{ fontFamily: 'var(--font-grotesk)' }}>
                    {mod.num}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
                      {mod.name}
                    </p>
                    <p className="text-xs text-slate-600">
                      <strong>Project:</strong> {mod.project}
                    </p>
                  </div>
                </div>
              </div>
              <ol className="p-3 space-y-1.5">
                {mod.lessons.map((lesson, li) => {
                  const name = typeof lesson === 'string' ? lesson : lesson.name;
                  const topic = typeof lesson === 'string' ? null : lesson.topic;
                  return (
                    <li key={li} className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed">
                      <span className="shrink-0 w-5 h-5 rounded bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold" style={{ fontFamily: 'var(--font-grotesk)' }}>
                        {li + 1}
                      </span>
                      <div>
                        <p className="font-bold">{name}</p>
                        {topic && <p className="text-[10px] text-slate-400">{topic}</p>}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SuperAdminDashboard() {
  return (
    <DashboardLayout>
      <SuperAdminDashboardInner />
    </DashboardLayout>
  );
}
