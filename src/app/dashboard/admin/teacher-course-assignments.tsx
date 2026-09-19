'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Loader2, X, Plus, Trash2, GraduationCap, CheckCircle2,
} from 'lucide-react';
import {
  fetchTeachersWithAssignments, updateTeacherCourses,
  type TeacherWithAssignments,
} from '@/lib/dashboard/teacher-assignments-data';
import {
  COURSE_FAMILIES, describeCourse, familyOf, type CourseFamily,
} from '@/lib/dashboard/course-options';
import { courseGrid, describeCourses, pickKey, type CoursePick, type GridRow } from '@/lib/dashboard/course-picks';
import CapabilityChips from '@/components/dashboard/capability-chips';

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
              Tick every course a teacher can take — a whole subject at once — and add them in one go. They can only teach courses they&apos;re eligible for.
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
  /* The whole catalogue for one family as a grid — every subject, every level
     (lib/dashboard/course-picks.ts). This used to be one subject + one level +
     Add, then "Mark trained" on the new row: two taps per course, twenty-four
     for a maths teacher of every grade (Mimo, 19 Sep 2026). Now: tick as many
     as you like across subjects and families, or "All" for a subject, and add
     them in one request — already trained, if a super-admin says so. */
  const [family, setFamily] = useState<CourseFamily>('school');
  const [picked, setPicked] = useState<Map<string, CoursePick>>(() => new Map());
  const [trained, setTrained] = useState(canManageTraining);
  const [busy, setBusy] = useState(false);

  const have = useMemo(() => new Map(teacher.assignments.map((a) => [pickKey(a), a])), [teacher.assignments]);
  const grid = useMemo(() => courseGrid(family), [family]);
  const untrained = teacher.assignments.filter((a) => !a.training_completed_at);
  const pickedList = [...picked.values()];
  const pickedIn = (f: CourseFamily) => pickedList.filter((c) => familyOf(c.track, c.level) === f).length;

  const openIn = (row: GridRow) => row.levels.map((l) => ({ track: row.track, level: l.level })).filter((c) => !have.has(pickKey(c)));
  const toggle = (c: CoursePick) => setPicked((prev) => {
    const next = new Map(prev);
    const k = pickKey(c);
    if (next.has(k)) next.delete(k); else next.set(k, c);
    return next;
  });
  const toggleRow = (row: GridRow) => {
    const open = openIn(row);
    const allOn = open.length > 0 && open.every((c) => picked.has(pickKey(c)));
    setPicked((prev) => {
      const next = new Map(prev);
      for (const c of open) { if (allOn) next.delete(pickKey(c)); else next.set(pickKey(c), c); }
      return next;
    });
  };

  const run = async (done: string, call: () => Promise<{ success: boolean; error?: string }>) => {
    setBusy(true);
    const result = await call();
    setBusy(false);
    if (result.success) { onToast(done, 'success'); onChanged(); return true; }
    onToast(result.error || 'Update failed', 'error');
    return false;
  };

  const withTraining = canManageTraining && trained;
  const handleAdd = async () => {
    if (!pickedList.length) return;
    const n = pickedList.length;
    const ok = await run(
      `${withTraining ? 'Added and trained' : 'Added'} ${n} course${n === 1 ? '' : 's'} for ${teacher.full_name ?? 'teacher'}: ${describeCourses(pickedList).join('; ')}`,
      () => updateTeacherCourses('assign', teacher.id, pickedList, { trained: withTraining }),
    );
    if (ok) setPicked(new Map());
  };
  const handleTrainAll = () => run(
    `Marked ${untrained.length} course${untrained.length === 1 ? '' : 's'} trained`,
    () => updateTeacherCourses('complete_training', teacher.id, untrained.map((a) => ({ track: a.track, level: a.level }))),
  );
  const handleRemove = (a: CoursePick) => run(`Removed ${describeCourse(a.track, a.level)}`, () => updateTeacherCourses('remove', teacher.id, [a]));
  const handleTraining = (a: CoursePick, complete: boolean) => run(
    complete ? 'Training marked complete' : 'Training reset',
    () => updateTeacherCourses(complete ? 'complete_training' : 'revoke_training', teacher.id, [a]),
  );

  const hint = family === 'school' ? 'Tap the grades' : family === 'coding' ? 'Tap the levels' : 'Tap the courses';

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
          {/* §4. What this teacher is trained for, collapsed to subjects —
              three grades of maths is one chip that says Mathematics. */}
          <div className="mt-1.5">
            <CapabilityChips assignments={teacher.assignments} size="sm" max={4} emptyText="Not eligible for anything yet" />
          </div>
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
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>
                  Eligible to teach:
                </p>
                {canManageTraining && untrained.length > 1 && (
                  <button
                    onClick={handleTrainAll}
                    disabled={busy}
                    className="h-8 px-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold flex items-center gap-1 touch-manipulation disabled:opacity-50"
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    Mark all {untrained.length} trained
                  </button>
                )}
              </div>
              {teacher.assignments.map((a, i) => (
                <div key={`${pickKey(a)}-${i}`} className="flex items-center justify-between gap-2 bg-slate-50 rounded-lg p-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                    <span className="text-xs font-bold text-slate-700 truncate" style={{ fontFamily: 'var(--font-jakarta)' }}>
                      {describeCourse(a.track, a.level)}
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
                        onClick={() => handleTraining(a, !a.training_completed_at)}
                        disabled={busy}
                        className={`h-8 px-2 rounded-lg text-[10px] font-bold flex items-center gap-1 touch-manipulation disabled:opacity-50 ${a.training_completed_at ? 'bg-slate-100 hover:bg-slate-200 text-slate-600' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                        title={a.training_completed_at ? 'Revoke training' : 'Mark training complete'}
                      >
                        <GraduationCap className="w-3.5 h-3.5" />
                        {a.training_completed_at ? 'Reset' : 'Mark trained'}
                      </button>
                    )}
                    <button
                      onClick={() => handleRemove(a)}
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
            <p className="text-xs text-slate-400 italic">Not eligible for any courses yet. Tick them below.</p>
          )}

          <div className="pt-2 border-t border-slate-100 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>
              Add courses
            </p>
            {/* Which catalogue. Picks in the other families are kept. */}
            <div className="grid grid-cols-3 gap-1.5">
              {COURSE_FAMILIES.map((f) => {
                const n = pickedIn(f.key);
                return (
                  <button
                    key={f.key}
                    onClick={() => setFamily(f.key)}
                    disabled={busy}
                    className={`min-h-[34px] rounded-lg text-[11px] font-bold border-2 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 ${
                      family === f.key
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                    style={{ fontFamily: 'var(--font-grotesk)' }}
                  >
                    {f.label}
                    {n > 0 && <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-blue-600 text-white text-[10px] leading-[18px]">{n}</span>}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500">
              <span>{hint} to select · &ldquo;All&rdquo; takes a whole subject</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-100 border border-green-400" /> trained</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-50 border border-amber-400" /> added, not trained</span>
            </div>

            <div className="rounded-lg border border-slate-200 divide-y divide-slate-100">
              {grid.map((row) => {
                const open = openIn(row);
                const allOn = open.length > 0 && open.every((c) => picked.has(pickKey(c)));
                return (
                  <div key={row.track} className="flex flex-col sm:flex-row sm:items-center gap-1.5 px-2 py-1.5">
                    <div className="sm:w-40 shrink-0 flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800 truncate" style={{ fontFamily: 'var(--font-jakarta)' }}>{row.name}</span>
                      {row.levels.length > 1 && (
                        <button
                          onClick={() => toggleRow(row)}
                          disabled={busy || open.length === 0}
                          className="shrink-0 text-[10px] font-bold text-blue-600 hover:text-blue-800 disabled:text-slate-300 px-1.5 min-h-[28px]"
                        >
                          {allOn ? 'None' : 'All'}
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {row.levels.map((l) => {
                        const course = { track: row.track, level: l.level };
                        const existing = have.get(pickKey(course));
                        const on = picked.has(pickKey(course));
                        const tone = existing
                          ? existing.training_completed_at
                            ? 'bg-green-100 border-green-400 text-green-800'
                            : 'bg-amber-50 border-amber-400 text-amber-800'
                          : on
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-blue-400';
                        return (
                          <button
                            key={l.level}
                            onClick={() => toggle(course)}
                            disabled={busy || !!existing}
                            aria-pressed={on}
                            title={existing ? (existing.training_completed_at ? 'Already eligible — trained' : 'Already eligible — training not done') : describeCourse(row.track, l.level)}
                            className={`min-w-[32px] h-8 px-2 rounded-md border text-[11px] font-bold transition-colors touch-manipulation disabled:cursor-default ${tone}`}
                            style={{ fontFamily: 'var(--font-grotesk)' }}
                          >
                            {l.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {pickedList.length > 0 && (
              <div className="sticky bottom-0 -mx-3 px-3 pt-2 pb-1 bg-white/95 backdrop-blur border-t border-slate-100 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[11px] text-slate-600 leading-snug min-w-0">
                    <span className="font-bold text-slate-900">{pickedList.length} selected:</span>{' '}
                    {describeCourses(pickedList).join(' · ')}
                  </p>
                  <button onClick={() => setPicked(new Map())} disabled={busy} className="shrink-0 text-[10px] font-bold text-slate-500 hover:text-slate-800 min-h-[28px] px-1">
                    Clear
                  </button>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {canManageTraining ? (
                    <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 cursor-pointer min-h-[36px]">
                      <input type="checkbox" checked={trained} onChange={(e) => setTrained(e.target.checked)} disabled={busy} className="w-4 h-4 accent-green-600" />
                      Mark trained too — they can be scheduled straight away
                    </label>
                  ) : (
                    <span className="text-[10px] text-slate-500">A super-admin marks the training before they can be scheduled.</span>
                  )}
                  <button
                    onClick={handleAdd}
                    disabled={busy}
                    className={`min-h-[40px] px-4 rounded-lg disabled:bg-slate-300 text-white text-xs font-bold flex items-center gap-1.5 touch-manipulation ${withTraining ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                    style={{ fontFamily: 'var(--font-grotesk)' }}
                  >
                    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : withTraining ? <GraduationCap className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    {withTraining ? `Add ${pickedList.length} as trained` : `Add ${pickedList.length} course${pickedList.length === 1 ? '' : 's'}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
