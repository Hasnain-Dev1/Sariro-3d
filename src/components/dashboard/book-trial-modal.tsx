'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, CalendarCheck, AlertCircle, PhoneOff, CheckCircle2, Search } from 'lucide-react';
import CapabilityChips from '@/components/dashboard/capability-chips';
import {
  fetchBookableTeachers, fetchTrialStudents, fetchTeacherSlots, bookTrial, TRIAL_MINUTES,
  type BookableTeacher, type TrialStudent, type DaySlots,
} from '@/lib/dashboard/trial-booking-data';
import { MIN_GRADE, MAX_GRADE } from '@/lib/trial/grade-band';

/**
 * SARIRO — booking a free trial, from any staff dashboard
 * ============================================================================
 * One modal for admin, super-admin, HR and seller. The three of them were
 * going to want the same three answers — who is the child, who teaches it, and
 * when is that teacher actually free — and three near-copies is three chances
 * for one to offer a slot that is already taken.
 *
 * ── No verification code here, on purpose ───────────────────────────────────
 * The public booking form makes a parent verify their mobile, because it is
 * open to the internet and a free class costs a mentor half an hour. This is
 * staff booking on behalf of somebody they have usually just spoken to, and
 * making a seller read a code down the phone is friction that buys nothing —
 * the account already exists and the staff member is named on the audit entry.
 *
 * What has NOT been dropped is the phone number itself. An account with no
 * usable number cannot be given a trial, for the same reason it cannot be given
 * a course: nobody can chase it when the child does not appear. That is shown
 * against the student before a slot is chosen, rather than as a refusal after.
 */

/* Half an hour. Long enough to show a parent what a class is like, and it
   doubles how many a teacher can run in an evening. Imported rather than
   re-declared so this cannot drift from the picker or the API. */
const DURATION_MINUTES = TRIAL_MINUTES;

/* The years a child can be in. Same bounds the booking route enforces, taken
   from the band rules rather than written out again — the picker offering a
   grade the API would refuse is a dead end a seller cannot get out of. */
const GRADES = Array.from({ length: MAX_GRADE - MIN_GRADE + 1 }, (_, i) => MIN_GRADE + i);

export default function BookTrialModal({
  open,
  onClose,
  onBooked,
  presetStudentId,
  demoRequestId,
}: {
  open: boolean;
  onClose: () => void;
  onBooked?: (message: string) => void;
  presetStudentId?: string;
  demoRequestId?: string;
}) {
  const [students, setStudents] = useState<TrialStudent[]>([]);
  const [teachers, setTeachers] = useState<BookableTeacher[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  /* A trial can hold up to four children — it is a sample of a class capped
     at four, and one child is just the common case. */
  const [studentIds, setStudentIds] = useState<string[]>(presetStudentId ? [presetStudentId] : []);
  const [teacherId, setTeacherId] = useState('');
  const [slots, setSlots] = useState<DaySlots[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [chosen, setChosen] = useState('');

  /* Grades typed in here for children whose profile carries none. Keyed by
     student id rather than held on the row, so switching the search text does
     not lose what has already been answered. */
  const [grades, setGrades] = useState<Record<string, number>>({});

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([fetchTrialStudents(), fetchBookableTeachers()]).then(([s, t]) => {
      if (cancelled) return;
      setStudents(s);
      setTeachers(t);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [open]);

  const teacher = useMemo(() => teachers.find((t) => t.id === teacherId) ?? null, [teachers, teacherId]);
  const chosenStudents = useMemo(
    () => studentIds.map((id) => students.find((s) => s.id === id)).filter((s): s is TrialStudent => !!s),
    [students, studentIds]
  );
  const unreachable = chosenStudents.find((s) => !!s.blocker) ?? null;

  /* ── Who still has no grade ───────────────────────────────────────────────
     A trial holds four children and the first one fixes what level the class
     is teaching at, plus or minus a year. A child with no recorded grade
     cannot be seated by that rule at all — and until now nothing in the
     product let a seller record one, so every child they booked had none and
     every class they made quietly refused the second family.

     Asked here, for the selected children only. Nobody is made to fill in a
     grade for a student they are not booking. */
  const needGrade = useMemo(
    () => chosenStudents.filter((s) => s.grade == null && grades[s.id] == null),
    [chosenStudents, grades]
  );
  const gradeFor = (s: TrialStudent) => grades[s.id] ?? s.grade ?? null;

  const toggleStudent = (id: string) =>
    setStudentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length >= 4 ? prev : [...prev, id]
    );

  const loadSlots = useCallback(async (t: BookableTeacher) => {
    setSlotsLoading(true);
    setChosen('');
    const days = await fetchTeacherSlots(t, { slotMinutes: DURATION_MINUTES });
    setSlots(days);
    setSlotsLoading(false);
  }, []);

  useEffect(() => {
    if (!teacher || teacher.blocker) { setSlots([]); return; }
    void loadSlots(teacher);
  }, [teacher, loadSlots]);

  const visibleStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students.slice(0, 60);
    return students
      .filter((s) => `${s.full_name ?? ''} ${s.email ?? ''} ${s.phone ?? ''}`.toLowerCase().includes(q))
      .slice(0, 60);
  }, [students, search]);

  const canBook =
    studentIds.length > 0 && !!teacherId && !!chosen &&
    !unreachable && !teacher?.blocker && needGrade.length === 0 && !saving;

  const submit = async () => {
    if (!canBook) return;
    setSaving(true);
    setError(null);
    const res = await bookTrial({
      studentIds, teacherId, slotStart: chosen,
      durationMinutes: DURATION_MINUTES,
      demoRequestId,
      /* Only the ones typed in. A child whose profile already carries a grade
         is not re-sent, so a stale copy in this tab cannot overwrite a newer
         one recorded elsewhere. */
      grades,
    });
    setSaving(false);
    if (!res.ok) { setError(res.error ?? 'Could not book that trial.'); return; }

    const when = new Date(chosen).toLocaleString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
    const who = chosenStudents.length === 1
      ? (chosenStudents[0].full_name ?? 'student')
      : `${chosenStudents.length} students`;
    const msg = `Trial booked — ${who} with ${teacher?.full_name ?? 'teacher'}, ${when}.`;
    setDone(msg);
    onBooked?.(msg);
    // The slot is gone now; reload so a second booking cannot be offered it.
    if (teacher) void loadSlots(teacher);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => !saving && onClose()}
        >
          <motion.div
            initial={{ scale: 0.96, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, y: 16 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog" aria-modal="true" aria-label="Book a trial class"
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
                  Book a trial class
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">One hour, free, no verification code needed.</p>
              </div>
              <button onClick={() => !saving && onClose()} className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
            ) : done ? (
              <div className="p-5 space-y-4">
                <div className="flex gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-green-900 leading-relaxed">{done}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setDone(null); setChosen(''); }} className="flex-1 h-11 rounded-xl border border-slate-200 text-sm font-bold hover:bg-slate-50" style={{ fontFamily: 'var(--font-grotesk)' }}>
                    Book another
                  </button>
                  <button onClick={onClose} className="flex-1 h-11 rounded-xl bg-slate-900 text-white text-sm font-bold" style={{ fontFamily: 'var(--font-grotesk)' }}>
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                {/* ── Student ── */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
                    Student
                  </label>
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <input
                      value={search} onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search name, email or phone"
                      className="w-full h-10 pl-9 pr-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      style={{ fontFamily: 'var(--font-inter)' }}
                    />
                  </div>
                  {/* Checkboxes rather than a select, because a trial can hold
                      several children and a multi-select is unusable on a
                      phone, which is where sellers work. */}
                  <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
                    {visibleStudents.length === 0 ? (
                      <p className="text-xs text-slate-400 italic p-3">No students match that search.</p>
                    ) : visibleStudents.map((s) => {
                      const picked = studentIds.includes(s.id);
                      const full = !picked && studentIds.length >= 4;
                      return (
                        <label
                          key={s.id}
                          className={`flex items-start gap-2.5 px-3 py-2 cursor-pointer hover:bg-slate-50 ${
                            s.blocker || full ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={picked}
                            disabled={!!s.blocker || full}
                            onChange={() => toggleStudent(s.id)}
                            className="mt-0.5 w-4 h-4 rounded accent-blue-600"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1.5 min-w-0">
                              <span className="text-sm text-slate-800 truncate">
                                {s.full_name || s.email || 'Unnamed'}
                              </span>
                              {/* The year they are in, where anybody has ever
                                  recorded it. Shown on the row because it is
                                  what decides which classes they can join. */}
                              {gradeFor(s) != null && (
                                <span className="shrink-0 text-[10px] font-bold text-slate-500 bg-slate-100 rounded px-1.5 py-0.5">
                                  G{gradeFor(s)}
                                </span>
                              )}
                            </span>
                            {s.blocker && (
                              <span className="block text-[11px] text-amber-700 flex items-center gap-1">
                                <PhoneOff className="w-3 h-3" /> no phone — cannot be booked
                              </span>
                            )}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-400">
                    {studentIds.length === 0
                      ? 'Pick one child, or up to four to share the class.'
                      : `${studentIds.length} of 4 selected.`}
                  </p>

                  {/* ── The grades we do not have ──────────────────────────
                      Appears only when something is actually missing, and
                      lists the child by name. "A student has no grade" sends
                      a seller hunting; "Mehul" does not. */}
                  {needGrade.length > 0 && (
                    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800" style={{ fontFamily: 'var(--font-grotesk)' }}>
                        Which year {needGrade.length === 1 ? 'is this child' : 'are these children'} in?
                      </p>
                      <p className="mt-1 text-[11px] text-amber-800/80 leading-relaxed">
                        A trial seats children within one year of each other, so we cannot place
                        {needGrade.length === 1 ? ' them' : ' them'} without it. Asked once — it is saved to their profile.
                      </p>
                      <div className="mt-2.5 space-y-2">
                        {needGrade.map((s) => (
                          <div key={s.id} className="flex items-center gap-2">
                            <span className="text-xs text-slate-700 truncate flex-1 min-w-0">
                              {s.full_name || s.email || 'Unnamed'}
                            </span>
                            <select
                              value={grades[s.id] ?? ''}
                              onChange={(e) => {
                                const v = e.target.value;
                                setGrades((prev) => {
                                  const next = { ...prev };
                                  if (v === '') delete next[s.id];
                                  else next[s.id] = Number(v);
                                  return next;
                                });
                              }}
                              className="shrink-0 h-8 rounded-lg border border-amber-300 bg-white px-2 text-xs text-slate-800"
                            >
                              <option value="">Grade…</option>
                              {GRADES.map((g) => (
                                <option key={g} value={g}>Grade {g}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Teacher ── */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
                    Teacher
                  </label>
                  <select
                    value={teacherId} onChange={(e) => setTeacherId(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    <option value="">Select a teacher…</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id} disabled={!!t.blocker}>
                        {t.full_name || t.email || 'Unnamed'}{t.blocker ? ` — ${t.blocker}` : ''}
                      </option>
                    ))}
                  </select>
                  {teacher && !teacher.blocker && (
                    <div className="mt-2">
                      <CapabilityChips assignments={teacher.assignments} size="sm" max={4} emptyText="Not eligible for any course yet" />
                    </div>
                  )}
                </div>

                {/* ── Slots ── */}
                {teacher && !teacher.blocker && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
                      When they are free ({teacher.timezone})
                    </label>
                    {slotsLoading ? (
                      <div className="flex items-center gap-2 py-4 text-sm text-slate-400">
                        <Loader2 className="w-4 h-4 animate-spin" /> Working out their free slots…
                      </div>
                    ) : slots.length === 0 ? (
                      <p className="text-xs text-amber-700 py-2">
                        Nothing free in the next two weeks — their hours are full, or they have not offered any.
                      </p>
                    ) : (
                      <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                        {slots.map((day) => (
                          <div key={day.date}>
                            <p className="text-[11px] font-bold text-slate-500 mb-1" style={{ fontFamily: 'var(--font-grotesk)' }}>
                              {day.label}
                            </p>
                            {/* Occupancy on every slot. A trial holds four
                                children, so a half-full one is an opportunity
                                rather than a clash — and a seller who cannot
                                see that fills a fresh slot instead, spending
                                another half-hour of a teacher's evening. */}
                            <div className="flex flex-wrap gap-1.5">
                              {day.slots.map(({ iso, state }) => {
                                const label = new Date(iso).toLocaleTimeString('en-GB', {
                                  timeZone: teacher.timezone!, hour: '2-digit', minute: '2-digit',
                                });
                                const active = chosen === iso;
                                const tooMany = studentIds.length > state.free;
                                const disabled = state.full || tooMany;
                                return (
                                  <button
                                    key={iso}
                                    onClick={() => setChosen(iso)}
                                    disabled={disabled}
                                    title={
                                      state.full
                                        ? 'Full — all four seats taken'
                                        : tooMany
                                          ? `Only ${state.free} left, and you have chosen ${studentIds.length}`
                                          : state.label
                                    }
                                    className={`px-2.5 py-1.5 rounded-lg border-2 transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed ${
                                      active
                                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                                        : state.full
                                          ? 'border-slate-200 bg-slate-50 text-slate-400'
                                          : state.taken > 0
                                            ? 'border-amber-300 bg-amber-50 text-amber-800 hover:border-amber-400'
                                            : 'border-slate-200 text-slate-600 hover:border-slate-300'
                                    }`}
                                    style={{ fontFamily: 'var(--font-grotesk)' }}
                                  >
                                    <span className="block text-[11px] font-bold">{label}</span>
                                    <span className="block text-[9px] font-bold uppercase tracking-wider opacity-70">
                                      {state.full
                                        ? 'Full'
                                        : state.taken === 0
                                          ? '4 seats'
                                          : `${state.free} left`}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {error && (
                  <div className="flex gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-px" /><span>{error}</span>
                  </div>
                )}

                <button
                  onClick={submit}
                  disabled={!canBook}
                  className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                  style={{ fontFamily: 'var(--font-grotesk)' }}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarCheck className="w-4 h-4" />}
                  Book the trial
                </button>

                {/* The slot picker is long, so by the time somebody reaches
                    this button the missing grade is scrolled off the screen.
                    A disabled button with no reason is the worst thing on any
                    form. */}
                {needGrade.length > 0 && studentIds.length > 0 && (
                  <p className="-mt-1 text-[11px] text-amber-700 text-center">
                    Add a grade for {needGrade.map((s) => s.full_name || 'this child').join(', ')} to book.
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
