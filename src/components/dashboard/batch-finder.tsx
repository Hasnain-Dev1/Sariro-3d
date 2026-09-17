'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Loader2, RefreshCw, Search, UserPlus, Users, X } from 'lucide-react';
import { openBatchControl } from '@/components/dashboard/batch-control';
import {
  batchLessonAt, daysLabel, fitFor, freeSeats, matchesFilters, rankForStudent,
  type BatchSummary, type FinderFilters,
} from '@/lib/scheduling/batch-finder';

/**
 * SARIRO — Batch finder
 * ============================================================================
 * Placing a child without opening every batch: every open batch with its seats,
 * teacher, days and the lesson it has reached; filters for the questions a
 * scheduler actually asks; the children waiting for a batch; and, for one child,
 * the batches ranked by fit with the add done in place.
 * The data: api/admin/batch-finder. The add: api/admin/schedule/manage (add_kid),
 * which refuses a full batch, a clash and a second batch of the same course.
 */

interface Waiting {
  studentId: string; name: string | null; email: string | null; grade: number | null;
  track: string; level: string; ratio: string | null; courseTitle: string;
  reason: string; lessonsDone: number; credits: number; since: string;
}
interface StudentInfo {
  id: string; name: string | null; email: string | null; grade: number | null; credits: number;
  courses: { track: string; level: string; courseTitle: string; lessonsDone: number; cohortId: string | null }[];
}
interface Teacher { id: string; name: string | null; classesNext7Days: number }
interface Payload { batches: BatchSummary[]; teachersByCourse: Record<string, Teacher[]>; waiting: Waiting[]; student: StudentInfo | null }

const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const when = (iso: string | null, tz: string | null) =>
  iso ? new Date(iso).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', ...(tz ? { timeZone: tz } : {}) }) : 'Nothing scheduled';

export default function BatchFinder({ onToast }: { onToast?: (msg: string, kind?: 'success' | 'error') => void }) {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [studentCourse, setStudentCourse] = useState<string | null>(null);

  const [filters, setFilters] = useState<FinderFilters>({ freeSeatsOnly: false });
  const set = (patch: Partial<FinderFilters>) => setFilters((f) => ({ ...f, ...patch }));

  const [query, setQuery] = useState('');
  const [found, setFound] = useState<{ id: string; name: string | null; email: string | null; grade: number | null }[]>([]);
  const [showWaiting, setShowWaiting] = useState(true);
  const [adding, setAdding] = useState<BatchSummary | null>(null);
  const [addBusy, setAddBusy] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const load = useCallback(async (forStudent: string | null) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/batch-finder${forStudent ? `?student=${forStudent}` : ''}`, { cache: 'no-store' });
      const j = await res.json();
      if (!j?.ok) { setError(j?.message ?? 'Could not load batches.'); return; }
      setData({ batches: j.batches, teachersByCourse: j.teachersByCourse ?? {}, waiting: j.waiting ?? [], student: j.student ?? null });
      setError(null);
    } catch {
      setError('Could not load batches. Check your connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(studentId); }, [load, studentId]);

  /* Looking a child up, as they type. */
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { const t = setTimeout(() => setFound([]), 0); return () => clearTimeout(t); }
    const t = setTimeout(() => {
      fetch(`/api/admin/batch-finder?find=${encodeURIComponent(q)}`, { cache: 'no-store' })
        .then((r) => r.json()).then((j) => setFound(j?.found ?? [])).catch(() => setFound([]));
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const pickStudent = (id: string, courseTitle: string | null = null) => {
    setStudentId(id);
    setStudentCourse(courseTitle);
    setQuery('');
    setFound([]);
    if (courseTitle) set({ courseTitle });
  };

  const clearStudent = () => { setStudentId(null); setStudentCourse(null); };

  const student = data?.student && data.student.id === studentId ? data.student : null;
  const studentCourseInfo = student?.courses.find((c) => c.courseTitle === (studentCourse ?? filters.courseTitle)) ?? null;

  const courseOptions = useMemo(() => {
    const titles = new Set<string>();
    for (const b of data?.batches ?? []) titles.add(b.courseTitle);
    for (const w of data?.waiting ?? []) titles.add(w.courseTitle);
    for (const c of student?.courses ?? []) titles.add(c.courseTitle);
    return [...titles].sort();
  }, [data, student]);

  const teacherOptions = useMemo(() => {
    const m = new Map<string, string>();
    for (const b of data?.batches ?? []) if (b.teacher) m.set(b.teacher.id, b.teacher.name ?? 'Unnamed');
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [data]);

  const matched = useMemo(() => (data?.batches ?? []).filter((b) => matchesFilters(b, filters)), [data, filters]);
  const ranked = useMemo(
    () => (student && studentCourseInfo ? rankForStudent(matched, { lessonsDone: studentCourseInfo.lessonsDone }) : matched.map((batch) => ({ batch, fit: null }))),
    [matched, student, studentCourseInfo]
  );

  const addStudent = async () => {
    if (!adding || !student) return;
    setAddBusy(true);
    setAddError(null);
    try {
      const res = await fetch('/api/admin/schedule/manage', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_kid', cohortId: adding.cohortId, studentId: student.id }),
      });
      const j = await res.json();
      if (!j?.ok) { setAddError(j?.message ?? j?.error ?? 'Could not add them to this batch.'); return; }
      onToast?.(`${student.name ?? 'Student'} added to ${adding.batchCode ?? 'the batch'}`);
      setAdding(null);
      await load(student.id);
    } catch {
      setAddError('Could not add them. Check your connection.');
    } finally {
      setAddBusy(false);
    }
  };

  const trained = filters.courseTitle ? data?.teachersByCourse[filters.courseTitle] ?? [] : [];

  return (
    <div className="card-3d p-4 sm:p-5 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2" style={{ fontFamily: 'var(--font-jakarta)' }}>
            <Search className="w-5 h-5 text-violet-600" /> Batch finder
          </h3>
          <p className="text-[12.5px] text-slate-500">Seats, teacher, days and the lesson each batch is at — and the best batch for a child.</p>
        </div>
        <button type="button" onClick={() => void load(studentId)} className="inline-flex items-center gap-1 text-[12px] font-bold text-slate-500 hover:text-slate-800">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* ── Place a child ── */}
      <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-3 space-y-2">
        {student ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[13px] font-extrabold text-violet-900">Placing: {student.name ?? student.email ?? 'Student'}</span>
            {student.grade !== null && <span className="text-[11px] font-bold text-violet-700">Grade {student.grade}</span>}
            <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${student.credits > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{student.credits} credits</span>
            {student.courses.length > 0 && (
              <select
                value={studentCourse ?? filters.courseTitle ?? ''}
                onChange={(e) => { setStudentCourse(e.target.value || null); set({ courseTitle: e.target.value || null }); }}
                className="h-8 rounded-lg border border-violet-200 bg-white px-2 text-[12px] font-semibold"
              >
                <option value="">Pick their course</option>
                {student.courses.map((c) => (
                  <option key={c.courseTitle} value={c.courseTitle}>{c.courseTitle} · {c.lessonsDone} lessons done{c.cohortId ? ' · in a batch' : ''}</option>
                ))}
              </select>
            )}
            <button type="button" onClick={clearStudent} className="ml-auto inline-flex items-center gap-1 text-[12px] font-bold text-violet-700 hover:text-violet-900">
              <X className="w-3.5 h-3.5" /> Clear
            </button>
            {studentCourseInfo && (
              <p className="w-full text-[12px] text-violet-900">
                Finished {studentCourseInfo.lessonsDone} lesson{studentCourseInfo.lessonsDone === 1 ? '' : 's'} — next up is lesson {studentCourseInfo.lessonsDone + 1}. Batches are ranked: no clash, a free seat, closest lesson.
                {studentCourseInfo.cohortId ? ' They are already in a batch of this course — remove them there before moving them.' : ''}
              </p>
            )}
          </div>
        ) : (
          <div className="relative">
            <label className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-violet-600 shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Place a child — search name, email or phone"
                className="h-9 w-full rounded-lg border border-violet-200 bg-white px-2.5 text-[13px] outline-none focus:border-violet-500"
              />
            </label>
            {found.length > 0 && (
              <ul className="absolute z-20 left-6 right-0 mt-1 rounded-lg border border-slate-200 bg-white shadow-lg max-h-64 overflow-y-auto">
                {found.map((f) => (
                  <li key={f.id}>
                    <button type="button" onClick={() => pickStudent(f.id)} className="w-full text-left px-3 py-2 hover:bg-slate-50 text-[13px]">
                      <span className="font-bold text-slate-900">{f.name ?? 'Unnamed'}</span>
                      <span className="text-slate-500"> · {f.email ?? 'no email'}{f.grade !== null ? ` · Grade ${f.grade}` : ''}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* ── Waiting for a batch ── */}
      {data && data.waiting.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3">
          <button type="button" onClick={() => setShowWaiting((s) => !s)} className="w-full flex items-center justify-between text-left">
            <span className="text-[13px] font-extrabold text-amber-900">Waiting for a batch ({data.waiting.length})</span>
            <span className="text-[12px] font-bold text-amber-700">{showWaiting ? 'Hide' : 'Show'}</span>
          </button>
          {showWaiting && (
            <ul className="mt-2 divide-y divide-amber-100">
              {data.waiting.map((w) => (
                <li key={`${w.studentId}-${w.courseTitle}`} className="py-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px]">
                  <span className="font-bold text-slate-900">{w.name ?? w.email ?? 'Unnamed'}</span>
                  <span className="text-slate-600">{w.courseTitle}{w.ratio ? ` · ${w.ratio}` : ''}</span>
                  <span className="text-slate-500">{w.reason} · {w.lessonsDone} lessons done · {w.credits} credits</span>
                  <button type="button" onClick={() => pickStudent(w.studentId, w.courseTitle)} className="ml-auto inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[12px] font-bold">
                    Find a batch
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ── Filters ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        <select value={filters.courseTitle ?? ''} onChange={(e) => set({ courseTitle: e.target.value || null })} className="col-span-2 h-9 rounded-lg border border-slate-200 bg-white px-2 text-[12.5px]">
          <option value="">Any course</option>
          {courseOptions.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filters.ratio ?? ''} onChange={(e) => set({ ratio: e.target.value || null })} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-[12.5px]">
          <option value="">Any ratio</option><option value="1:4">1:4</option><option value="1:1">1:1</option>
        </select>
        <select value={filters.status ?? ''} onChange={(e) => set({ status: e.target.value || null })} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-[12.5px]">
          <option value="">Any status</option><option value="gathering">Gathering</option><option value="ready">Ready</option><option value="active">Active</option>
        </select>
        <select value={filters.teacherId ?? ''} onChange={(e) => set({ teacherId: e.target.value || null })} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-[12.5px]">
          <option value="">Any teacher</option>
          {teacherOptions.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
        <select value={filters.day ?? ''} onChange={(e) => set({ day: e.target.value === '' ? null : Number(e.target.value) })} className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-[12.5px]">
          <option value="">Any day</option>
          {WD.map((d, i) => <option key={d} value={i}>{d}</option>)}
        </select>
        <div className="flex items-center gap-1">
          <input type="number" min={1} placeholder="Lesson from" value={filters.lessonFrom ?? ''} onChange={(e) => set({ lessonFrom: e.target.value ? Number(e.target.value) : null })} className="h-9 w-full rounded-lg border border-slate-200 px-2 text-[12.5px]" />
          <input type="number" min={1} placeholder="to" value={filters.lessonTo ?? ''} onChange={(e) => set({ lessonTo: e.target.value ? Number(e.target.value) : null })} className="h-9 w-full rounded-lg border border-slate-200 px-2 text-[12.5px]" />
        </div>
        <label className="col-span-2 sm:col-span-1 inline-flex items-center gap-1.5 h-9 px-2 rounded-lg border border-slate-200 bg-white text-[12.5px] font-semibold text-slate-700">
          <input type="checkbox" checked={!!filters.freeSeatsOnly} onChange={(e) => set({ freeSeatsOnly: e.target.checked })} /> Free seat only
        </label>
      </div>

      {/* ── Trained teachers for the course, for starting a new batch ── */}
      {filters.courseTitle && (
        <p className="text-[12px] text-slate-600">
          <span className="font-bold text-slate-800">Trained to teach it:</span>{' '}
          {trained.length
            ? trained.map((t) => `${t.name ?? 'Unnamed'} (${t.classesNext7Days} classes next 7 days)`).join(' · ')
            : 'nobody yet — mark a teacher’s training complete first.'}
        </p>
      )}

      {error && <p className="text-[12.5px] font-semibold text-rose-700">{error}</p>}
      {!data && !error && <div className="flex items-center gap-2 text-[12.5px] text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading batches…</div>}

      {data && (
        <>
          <p className="text-[12px] font-bold text-slate-500">{ranked.length} of {data.batches.length} open batches</p>
          {ranked.length === 0 ? (
            <p className="text-[13px] text-slate-500">No batch matches. Loosen a filter, or schedule a new batch with one of the trained teachers.</p>
          ) : (
            <ul className="space-y-2">
              {ranked.map(({ batch: b, fit }) => {
                const free = freeSeats(b);
                const at = batchLessonAt(b);
                return (
                  <li key={b.cohortId} className={`rounded-xl border p-3 ${fit && !fit.clash && !fit.full && fit.gap === 0 ? 'border-emerald-300 bg-emerald-50/40' : 'border-slate-200 bg-white'}`}>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-900 text-white tracking-wider">{b.batchCode ?? 'NO CODE'}</span>
                      <span className="text-[13.5px] font-extrabold text-slate-900">{b.courseTitle}</span>
                      <span className="text-[11px] font-bold text-slate-500">{b.ratio} · {b.status}{b.country ? ` · ${b.country}` : ''}</span>
                      <span className={`ml-auto inline-flex items-center gap-1 text-[11.5px] font-bold px-2 py-0.5 rounded-full ${free === 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                        <Users className="w-3 h-3" /> {b.enrolled}/{b.capacity}{free === 0 ? ' full' : ` · ${free} free`}
                      </span>
                    </div>
                    <div className="mt-1.5 grid gap-x-4 gap-y-0.5 sm:grid-cols-2 text-[12.5px] text-slate-700">
                      <p><span className="text-slate-500">Teacher:</span> {b.teacher?.name ?? 'None assigned'}</p>
                      <p><span className="text-slate-500">When:</span> {daysLabel(b.days)}{b.timezone ? ` (${b.timezone})` : ''}</p>
                      <p><span className="text-slate-500">At:</span> lesson {at}{b.totalLessons ? ` of ${b.totalLessons}` : ''}{b.nextLesson ? ` · ${b.nextLesson.name}` : ''}</p>
                      <p><span className="text-slate-500">Next class:</span> {when(b.nextClassAt, b.timezone)} · {b.remaining} left</p>
                      {b.studentNames.length > 0 && <p className="sm:col-span-2 text-slate-500 truncate">Students: {b.studentNames.join(', ')}</p>}
                    </div>
                    {!student && (
                      <div className="mt-2 flex justify-end">
                        <button type="button" onClick={() => openBatchControl(b.cohortId)} className="inline-flex items-center gap-1 h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[12px] font-bold text-slate-700">
                          Manage teacher, times &amp; roster
                        </button>
                      </div>
                    )}
                    {fit && (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {fit.clash ? (
                          <span className="inline-flex items-center gap-1 text-[12px] font-bold text-rose-700"><AlertTriangle className="w-3.5 h-3.5" /> Clashes with their class on {when(b.clashAt ?? null, b.timezone)}</span>
                        ) : (
                          <span className={`text-[12px] font-bold ${fit.gap === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>{fit.note}</span>
                        )}
                        {student && (
                          <button
                            type="button"
                            disabled={fit.clash || fit.full}
                            onClick={() => { setAddError(null); setAdding(b); }}
                            className="ml-auto inline-flex items-center gap-1 h-8 px-3 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[12px] font-bold disabled:opacity-40"
                          >
                            <UserPlus className="w-3.5 h-3.5" /> Add {student.name?.split(' ')[0] ?? 'student'}
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      {adding && student && (
        <div className="fixed inset-0 z-[95] bg-slate-900/40 flex items-center justify-center px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-5">
            <h4 className="text-base font-extrabold text-slate-900">Add {student.name ?? 'this student'} to {adding.batchCode ?? 'this batch'}?</h4>
            <ul className="mt-3 space-y-1.5 text-[13px] text-slate-600 list-disc pl-5">
              <li>{adding.courseTitle} · {adding.ratio} · {daysLabel(adding.days)} with {adding.teacher?.name ?? 'no teacher yet'}.</li>
              <li>Seat {adding.enrolled + 1} of {adding.capacity}.</li>
              {studentCourseInfo && <li>{fitFor(adding, { lessonsDone: studentCourseInfo.lessonsDone }).note}. Lessons the batch has already taught unlock for them.</li>}
              <li className={student.credits > 0 ? '' : 'text-rose-700'}>{student.credits} credit{student.credits === 1 ? '' : 's'} — {student.credits > 0 ? 'one is used per class.' : 'they cannot be added until they have credits.'}</li>
            </ul>
            {addError && <p className="mt-3 text-[12.5px] font-semibold text-rose-700">{addError}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setAdding(null)} disabled={addBusy} className="h-10 px-4 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={() => void addStudent()} disabled={addBusy} className="h-10 px-4 rounded-xl text-sm font-bold text-white inline-flex items-center gap-2 disabled:opacity-60 bg-violet-600 hover:bg-violet-700">
                {addBusy && <Loader2 className="w-4 h-4 animate-spin" />} Add to batch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
