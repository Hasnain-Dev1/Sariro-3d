'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Trash2, UserMinus, UserPlus, Calendar, Users, Loader2, GraduationCap } from 'lucide-react';
import { TRACKS } from '@/lib/sariro-data';
import { getTrackName } from '@/lib/dashboard/upsell-engine';
import {
  fetchTeachers,
  fetchUsers,
  updateUserRole,
  fetchCohorts,
  fetchCohortBookings,
  assignTeacherToCohort,
  updateBookingTeacher,
  deleteBooking,
} from '@/lib/dashboard/admin-data';

/* ─────────────────────── Types ─────────────────────── */

interface TeacherRow {
  id: string;
  full_name: string | null;
  email: string | null;
  cohort_count?: number;
}

interface UserRow {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  is_teacher?: boolean;
}

interface CohortRow {
  id: string;
  track: string;
  level: string;
  ratio: string;
  status: string;
}

interface BookingRow {
  id: string;
  cohort_id: string;
  teacher_id: string | null;
  slot_start: string;
  slot_end: string;
  status: string;
  teacher_name?: string | null;
}

type TabKey = 'teachers' | 'add' | 'assign';

interface TeacherManagementModalProps {
  open: boolean;
  onClose: () => void;
  onToast?: (msg: string, kind?: 'success' | 'error') => void;
}

/* ─────────────────────── Helpers ─────────────────────── */

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    const off = d.getTimezoneOffset();
    const local = new Date(d.getTime() - off * 60 * 1000);
    return local.toISOString().slice(0, 16);
  } catch {
    return '';
  }
}

/* ════════════════════════════════════════════════════════════════
   TeacherManagementModal — 3 tabs:
     1. All Teachers     — list + demote
     2. Add Teacher      — search users + promote
     3. Assign to Course — pick cohort, manage sessions, reassign,
                            delete session, add session
   ════════════════════════════════════════════════════════════════ */
export function TeacherManagementModal({ open, onClose, onToast }: TeacherManagementModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('teachers');

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const toast = useCallback(
    (msg: string, kind: 'success' | 'error' = 'success') => {
      onToast?.(msg, kind);
    },
    [onToast]
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="teacher-mgmt-title"
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="relative w-full sm:max-w-4xl max-h-[92vh] sm:max-h-[88vh] bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-white shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h2
                    id="teacher-mgmt-title"
                    className="text-lg font-extrabold text-slate-900 truncate"
                    style={{ fontFamily: 'var(--font-jakarta)' }}
                  >
                    Teacher Management
                  </h2>
                  <p className="text-xs text-slate-500 truncate">
                    Manage roles and assign teachers to cohorts.
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500 shrink-0"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 shrink-0 overflow-x-auto">
              <TabButton
                active={activeTab === 'teachers'}
                onClick={() => setActiveTab('teachers')}
                icon={Users}
                label="All Teachers"
              />
              <TabButton
                active={activeTab === 'add'}
                onClick={() => setActiveTab('add')}
                icon={UserPlus}
                label="Add Teacher"
              />
              <TabButton
                active={activeTab === 'assign'}
                onClick={() => setActiveTab('assign')}
                icon={Calendar}
                label="Assign to Course"
              />
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-slate-50">
              {activeTab === 'teachers' && <AllTeachersTab onToast={toast} />}
              {activeTab === 'add' && <AddTeacherTab onToast={toast} />}
              {activeTab === 'assign' && <AssignTab onToast={toast} />}
            </div>

            {/* Footer */}
            <div className="px-5 sm:px-6 py-3 border-t border-slate-200 bg-white shrink-0 flex justify-end">
              <button
                onClick={onClose}
                className="btn-tactile btn-tactile-light px-5 py-2.5 text-sm min-h-[44px]"
              >
                Done
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ─────────────────────── Tab button ─────────────────────── */
function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 sm:px-6 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors min-h-[44px] ${
        active
          ? 'border-emerald-600 text-emerald-700'
          : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
      }`}
      style={{ fontFamily: 'var(--font-grotesk)' }}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

/* ════════════════════════════════════════════════════════════════
   Tab 1 — All Teachers
   ════════════════════════════════════════════════════════════════ */
function AllTeachersTab({ onToast }: { onToast: (m: string, k?: 'success' | 'error') => void }) {
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchTeachers();
      setTeachers(list ?? []);
    } catch (err) {
      console.warn('[teacher-mgmt] fetchTeachers error:', err);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => load());
  }, [load]);

  const handleDemote = async (teacher: TeacherRow) => {
    setBusyId(teacher.id);
    try {
      const res = await updateUserRole(teacher.id, 'student');
      if (res.success) {
        onToast(`${teacher.full_name || teacher.email || 'Teacher'} demoted to student.`, 'success');
        await load();
      } else {
        onToast(res.error || 'Failed to demote teacher.', 'error');
      }
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <LoadingState label="Loading teachers..." />;
  }

  if (teachers.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No teachers yet"
        body="Promote a user to teacher from the “Add Teacher” tab to get started."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
        {teachers.length} teacher{teachers.length === 1 ? '' : 's'}
      </div>
      <ul className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
        {teachers.map((t) => (
          <li
            key={t.id}
            className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between gap-3"
          >
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-slate-900 truncate" style={{ fontFamily: 'var(--font-jakarta)' }}>
                {t.full_name || 'Unnamed teacher'}
              </div>
              <div className="text-xs text-slate-500 truncate">{t.email || '—'}</div>
              {typeof t.cohort_count === 'number' && (
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {t.cohort_count} cohort{t.cohort_count === 1 ? '' : 's'} assigned
                </div>
              )}
            </div>
            <button
              onClick={() => handleDemote(t)}
              disabled={busyId === t.id}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50 min-h-[40px]"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              {busyId === t.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <UserMinus className="w-3.5 h-3.5" />
              )}
              Demote
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Tab 2 — Add Teacher
   ════════════════════════════════════════════════════════════════ */
function AddTeacherTab({ onToast }: { onToast: (m: string, k?: 'success' | 'error') => void }) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [filtered, setFiltered] = useState<UserRow[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchUsers();
      setUsers(list ?? []);
      setFiltered(list ?? []);
    } catch (err) {
      console.warn('[teacher-mgmt] fetchUsers error:', err);
      setUsers([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => load());
  }, [load]);

  // Filter as user types
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setFiltered(users);
      return;
    }
    setFiltered(
      users.filter((u) => {
        const name = (u.full_name || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        return name.includes(q) || email.includes(q);
      })
    );
  }, [query, users]);

  const handlePromote = async (user: UserRow) => {
    setBusyId(user.id);
    try {
      const res = await updateUserRole(user.id, 'teacher');
      if (res.success) {
        onToast(`${user.full_name || user.email || 'User'} promoted to teacher.`, 'success');
        await load();
      } else {
        onToast(res.error || 'Failed to promote user.', 'error');
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 min-h-[44px]"
          style={{ fontFamily: 'var(--font-grotesk)' }}
        />
      </div>

      {loading ? (
        <LoadingState label="Loading users..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title={query ? 'No matches' : 'No users yet'}
          body={query ? 'Try a different name or email.' : 'New users will appear here.'}
        />
      ) : (
        <ul className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
          {filtered.map((u) => {
            const isTeacher =
              u.role === 'teacher' || u.is_teacher === true;
            return (
              <li
                key={u.id}
                className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-slate-900 truncate" style={{ fontFamily: 'var(--font-jakarta)' }}>
                    {u.full_name || 'Unnamed user'}
                  </div>
                  <div className="text-xs text-slate-500 truncate">{u.email || '—'}</div>
                </div>
                {isTeacher ? (
                  <span
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 min-h-[40px]"
                    style={{ fontFamily: 'var(--font-grotesk)' }}
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    Teacher
                  </span>
                ) : (
                  <button
                    onClick={() => handlePromote(u)}
                    disabled={busyId === u.id}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 min-h-[40px]"
                    style={{ fontFamily: 'var(--font-grotesk)' }}
                  >
                    {busyId === u.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UserPlus className="w-3.5 h-3.5" />
                    )}
                    Promote
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Tab 3 — Assign to Course
   ════════════════════════════════════════════════════════════════ */
function AssignTab({ onToast }: { onToast: (m: string, k?: 'success' | 'error') => void }) {
  const [cohorts, setCohorts] = useState<CohortRow[]>([]);
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [selectedCohortId, setSelectedCohortId] = useState<string>('');
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loadingCohorts, setLoadingCohorts] = useState(true);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Add session form state
  const [newStart, setNewStart] = useState('');
  const [newEnd, setNewEnd] = useState('');
  const [newTeacherId, setNewTeacherId] = useState('');
  const [adding, setAdding] = useState(false);

  // Load cohorts + teachers
  const loadCohortsAndTeachers = useCallback(async () => {
    setLoadingCohorts(true);
    try {
      const [c, t] = await Promise.all([fetchCohorts(), fetchTeachers()]);
      setCohorts(c ?? []);
      setTeachers(t ?? []);
    } catch (err) {
      console.warn('[teacher-mgmt] loadCohortsAndTeachers error:', err);
      setCohorts([]);
      setTeachers([]);
    } finally {
      setLoadingCohorts(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => loadCohortsAndTeachers());
  }, [loadCohortsAndTeachers]);

  // Load bookings when cohort changes
  const loadBookings = useCallback(async () => {
    if (!selectedCohortId) {
      setBookings([]);
      return;
    }
    setLoadingBookings(true);
    try {
      const list = await fetchCohortBookings(selectedCohortId);
      setBookings(list ?? []);
    } catch (err) {
      console.warn('[teacher-mgmt] fetchCohortBookings error:', err);
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  }, [selectedCohortId]);

  useEffect(() => {
    Promise.resolve().then(() => loadBookings());
  }, [loadBookings]);

  const handleReassign = async (bookingId: string, teacherId: string) => {
    setBusyId(bookingId);
    try {
      const res = await updateBookingTeacher(bookingId, teacherId);
      if (res.success) {
        onToast('Teacher reassigned.', 'success');
        await loadBookings();
      } else {
        onToast(res.error || 'Failed to reassign teacher.', 'error');
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (bookingId: string) => {
    if (!window.confirm('Delete this session? This cannot be undone.')) return;
    setBusyId(bookingId);
    try {
      const res = await deleteBooking(bookingId);
      if (res.success) {
        onToast('Session deleted.', 'success');
        await loadBookings();
      } else {
        onToast(res.error || 'Failed to delete session.', 'error');
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleAddSession = async () => {
    if (!selectedCohortId || !newStart || !newEnd || !newTeacherId) {
      onToast('Fill in all fields before adding a session.', 'error');
      return;
    }
    const startMs = new Date(newStart).getTime();
    const endMs = new Date(newEnd).getTime();
    if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) {
      onToast('End time must be after start time.', 'error');
      return;
    }
    setAdding(true);
    try {
      const res = await assignTeacherToCohort({
        cohortId: selectedCohortId,
        teacherId: newTeacherId,
        slotStart: new Date(newStart).toISOString(),
        slotEnd: new Date(newEnd).toISOString(),
      });
      if (res.success) {
        onToast('Session added.', 'success');
        setNewStart('');
        setNewEnd('');
        setNewTeacherId('');
        await loadBookings();
      } else {
        onToast(res.error || 'Failed to add session.', 'error');
      }
    } finally {
      setAdding(false);
    }
  };

  if (loadingCohorts) {
    return <LoadingState label="Loading cohorts..." />;
  }

  if (cohorts.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="No cohorts available"
        body="Create a cohort from the admin dashboard first, then come back here to assign teachers."
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Cohort picker */}
      <div>
        <label
          className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2"
          style={{ fontFamily: 'var(--font-grotesk)' }}
        >
          Select cohort
        </label>
        <select
          value={selectedCohortId}
          onChange={(e) => setSelectedCohortId(e.target.value)}
          className="w-full px-3 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 min-h-[44px]"
          style={{ fontFamily: 'var(--font-grotesk)' }}
        >
          <option value="">— Choose a cohort —</option>
          {cohorts.map((c) => (
            <option key={c.id} value={c.id}>
              {getTrackName(c.track)} · {c.level} · {c.ratio} · {c.status}
            </option>
          ))}
        </select>
      </div>

      {selectedCohortId && (
        <>
          {/* Existing sessions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4
                className="text-xs font-bold text-slate-500 uppercase tracking-wider"
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                Sessions
              </h4>
              <span className="text-xs text-slate-400">
                {loadingBookings ? 'Loading...' : `${bookings.length} scheduled`}
              </span>
            </div>

            {loadingBookings ? (
              <LoadingState label="Loading sessions..." />
            ) : bookings.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                No sessions yet. Add the first one below.
              </div>
            ) : (
              <ul className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                {bookings.map((b) => (
                  <li
                    key={b.id}
                    className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col sm:flex-row sm:items-center gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
                        {formatDateTime(b.slot_start)}
                      </div>
                      <div className="text-xs text-slate-500">
                        to {formatDateTime(b.slot_end)}
                      </div>
                      {b.teacher_name && (
                        <div className="text-[11px] text-emerald-700 mt-0.5">
                          {b.teacher_name}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <select
                        value={b.teacher_id || ''}
                        onChange={(e) => handleReassign(b.id, e.target.value)}
                        disabled={busyId === b.id}
                        className="px-2 py-2 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40 min-h-[40px] max-w-[180px]"
                        style={{ fontFamily: 'var(--font-grotesk)' }}
                      >
                        <option value="">— Assign teacher —</option>
                        {teachers.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.full_name || t.email || 'Unnamed'}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleDelete(b.id)}
                        disabled={busyId === b.id}
                        className="w-10 h-10 rounded-lg text-red-600 hover:bg-red-50 flex items-center justify-center disabled:opacity-50 shrink-0"
                        aria-label="Delete session"
                      >
                        {busyId === b.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Add new session */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <h4
              className="text-xs font-bold text-slate-500 uppercase tracking-wider"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              Add new session
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs text-slate-500">Start</span>
                <input
                  type="datetime-local"
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 min-h-[40px]"
                  style={{ fontFamily: 'var(--font-grotesk)' }}
                />
              </label>
              <label className="block">
                <span className="text-xs text-slate-500">End</span>
                <input
                  type="datetime-local"
                  value={newEnd}
                  onChange={(e) => setNewEnd(e.target.value)}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 min-h-[40px]"
                  style={{ fontFamily: 'var(--font-grotesk)' }}
                />
              </label>
            </div>
            <label className="block">
              <span className="text-xs text-slate-500">Teacher</span>
              <select
                value={newTeacherId}
                onChange={(e) => setNewTeacherId(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 min-h-[40px]"
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                <option value="">— Choose teacher —</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name || t.email || 'Unnamed'}
                  </option>
                ))}
              </select>
            </label>
            <button
              onClick={handleAddSession}
              disabled={adding}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 min-h-[44px]"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Add session
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────── Shared sub-components ─────────────────────── */

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-12 text-slate-500">
      <Loader2 className="w-5 h-5 animate-spin mr-2" />
      <span className="text-sm" style={{ fontFamily: 'var(--font-grotesk)' }}>
        {label}
      </span>
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}) {
  return (
    <div className="text-center py-12 px-4">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
        <Icon className="w-6 h-6 text-slate-400" />
      </div>
      <h3
        className="text-base font-extrabold text-slate-900 mb-1"
        style={{ fontFamily: 'var(--font-jakarta)' }}
      >
        {title}
      </h3>
      <p className="text-sm text-slate-500 max-w-sm mx-auto">{body}</p>
    </div>
  );
}

/* Re-export TRACKS for callers that want to build cohort pickers from
   the same data source. */
export { TRACKS };
