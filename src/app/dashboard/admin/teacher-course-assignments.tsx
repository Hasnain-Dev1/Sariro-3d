'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2, X, Plus, Trash2, GraduationCap, CheckCircle2, BookOpen,
} from 'lucide-react';
import {
  fetchTeachersWithAssignments, assignTeacherCourse, removeTeacherCourse, setTeacherTraining,
  ALL_LEVELS, getTrackName,
  type TeacherWithAssignments,
} from '@/lib/dashboard/teacher-assignments-data';
import { TRACKS } from '@/lib/sariro-data';

export function TeacherCourseAssignmentModal({
  open,
  onClose,
  onToast,
  canManageTraining = false,
}: {
  open: boolean;
  onClose: () => void;
  onToast: (msg: string, kind?: 'success' | 'error') => void;
  /** Super-admins can mark a teacher's course training complete (scheduler gate). */
  canManageTraining?: boolean;
}) {
  const [teachers, setTeachers] = useState<TeacherWithAssignments[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTeachers = useCallback(async () => {
    setLoading(true);
    const data = await fetchTeachersWithAssignments();
    setTeachers(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) {
      Promise.resolve().then(() => loadTeachers());
    }
  }, [open, loadTeachers]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        role="dialog"
        aria-modal="true"
        className="relative w-full sm:max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="flex items-start justify-between gap-3 p-5 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2" style={{ fontFamily: 'var(--font-jakarta)' }}>
              <GraduationCap className="w-5 h-5 text-blue-600" />
              Teacher Course Eligibility
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Assign tracks + levels to teachers. They can only teach courses they&apos;re eligible for.
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
          ) : teachers.length === 0 ? (
            <div className="text-center py-8">
              <GraduationCap className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No teachers found. Add teachers first via User Management.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {teachers.map((teacher) => (
                <TeacherAssignmentRow
                  key={teacher.id}
                  teacher={teacher}
                  onToast={onToast}
                  onChanged={loadTeachers}
                  canManageTraining={canManageTraining}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function TeacherAssignmentRow({
  teacher,
  onToast,
  onChanged,
  canManageTraining,
}: {
  teacher: TeacherWithAssignments;
  onToast: (msg: string, kind?: 'success' | 'error') => void;
  onChanged: () => void;
  canManageTraining: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [newTrack, setNewTrack] = useState<string>(TRACKS[0]?.id ?? '');
  const [newLevel, setNewLevel] = useState<string>('Beginner');
  const [busy, setBusy] = useState(false);

  const handleAssign = async () => {
    if (!newTrack || !newLevel) return;
    setBusy(true);
    const result = await assignTeacherCourse(teacher.id, newTrack, newLevel);
    setBusy(false);
    if (result.success) {
      onToast(`Assigned ${getTrackName(newTrack)} ${newLevel} to ${teacher.full_name ?? 'teacher'}`, 'success');
      onChanged();
    } else {
      onToast(result.error || 'Failed to assign', 'error');
    }
  };

  const handleRemove = async (track: string, level: string) => {
    setBusy(true);
    const result = await removeTeacherCourse(teacher.id, track, level);
    setBusy(false);
    if (result.success) {
      onToast(`Removed ${getTrackName(track)} ${level}`, 'success');
      onChanged();
    } else {
      onToast(result.error || 'Failed to remove', 'error');
    }
  };

  const handleTraining = async (track: string, level: string, complete: boolean) => {
    setBusy(true);
    const result = await setTeacherTraining(teacher.id, track, level, complete);
    setBusy(false);
    if (result.success) {
      onToast(complete ? 'Training marked complete' : 'Training reset', 'success');
      onChanged();
    } else {
      onToast(result.error || 'Failed to update training', 'error');
    }
  };

  return (
    <div className={`rounded-xl border-2 transition-all ${expanded ? 'border-blue-300 shadow-sm' : 'border-slate-200'}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-3 flex items-center justify-between gap-3 text-left min-h-[60px] touch-manipulation"
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-900 truncate" style={{ fontFamily: 'var(--font-jakarta)' }}>
            {teacher.full_name ?? 'Unknown'}
          </p>
          <p className="text-xs text-slate-500 truncate">{teacher.email}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700" style={{ fontFamily: 'var(--font-grotesk)' }}>
            {teacher.assignments.length} {teacher.assignments.length === 1 ? 'course' : 'courses'}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 border-t border-slate-100 pt-3 space-y-3">
          {teacher.assignments.length > 0 ? (
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>
                Eligible to teach:
              </p>
              {teacher.assignments.map((a, i) => (
                <div key={i} className="flex items-center justify-between gap-2 bg-slate-50 rounded-lg p-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    <span className="text-xs font-bold text-slate-700 truncate" style={{ fontFamily: 'var(--font-jakarta)' }}>
                      {getTrackName(a.track)} · {a.level}
                    </span>
                    {a.training_completed_at ? (
                      <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700" title="Training complete — can be scheduled">Trained</span>
                    ) : (
                      <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700" title="Training not complete — cannot be scheduled">Untrained</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {canManageTraining && (
                      <button
                        onClick={() => handleTraining(a.track, a.level, !a.training_completed_at)}
                        disabled={busy}
                        className={`h-8 px-2 rounded-lg text-[10px] font-bold flex items-center gap-1 touch-manipulation disabled:opacity-50 ${a.training_completed_at ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                        title={a.training_completed_at ? 'Revoke training' : 'Mark training complete'}
                      >
                        <GraduationCap className="w-3.5 h-3.5" />
                        {a.training_completed_at ? 'Reset' : 'Mark trained'}
                      </button>
                    )}
                    <button
                      onClick={() => handleRemove(a.track, a.level)}
                      disabled={busy}
                      className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center min-h-[32px] min-w-[32px] touch-manipulation disabled:opacity-50"
                      title="Remove eligibility"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">Not eligible for any courses yet. Add one below.</p>
          )}

          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <select
              value={newTrack}
              onChange={(e) => setNewTrack(e.target.value)}
              disabled={busy}
              className="flex-1 min-h-[40px] rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              {TRACKS.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <select
              value={newLevel}
              onChange={(e) => setNewLevel(e.target.value)}
              disabled={busy}
              className="min-h-[40px] rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
              style={{ fontFamily: 'var(--font-inter)' }}
            >
              {ALL_LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <button
              onClick={handleAssign}
              disabled={busy}
              className="min-h-[40px] px-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-xs font-bold flex items-center gap-1 touch-manipulation"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}