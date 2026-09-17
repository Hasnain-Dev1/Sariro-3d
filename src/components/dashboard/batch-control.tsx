'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CalendarClock, CheckCircle2, Loader2, RefreshCw, Settings2, UserCog, UserMinus, UserPlus, Users } from 'lucide-react';
import SearchPicker, { type PickerFilter } from '@/components/dashboard/search-picker';
import { batchLessonAt, daysLabel, freeSeats, type BatchSummary } from '@/lib/scheduling/batch-finder';
import { generateOccurrences } from '@/lib/dashboard/schedule-generation';
import { gradeTag } from '@/lib/grade/tag';

/**
 * SARIRO — Batch control: one batch's teacher, timetable and roster
 * ============================================================================
 * The founder, 17 Sep 2026: there was no single place to find a batch by its
 * code and change its teacher. Changing the teacher has to move every upcoming
 * class — and the new teacher may not be free at the batch's times, so the
 * timetable has to change in the same place, not in a second tool that knows
 * nothing about the first. And the roster: take a child out, put a child in,
 * right there.
 *
 *   Teacher   pick one (trained first, busiest last); they are checked against
 *             every upcoming class. Free → move them all. Busy → the days and
 *             times open underneath and both change together.
 *   Schedule  new days and times from a date, same teacher.
 *   Roster    remove a child, or find one and add them (seat, clash and credit
 *             checks are the add's own).
 *
 * Reads: api/admin/batch-finder (the list), api/admin/batch-control (one batch).
 * Writes: api/admin/batch-control, api/admin/schedule/manage (add_kid/remove_kid).
 */

/** Opens a batch here from anywhere on the page — the batch finder's "Manage". */
export const OPEN_BATCH_EVENT = 'sariro:open-batch-control';
export function openBatchControl(cohortId: string) {
  window.dispatchEvent(new CustomEvent(OPEN_BATCH_EVENT, { detail: { cohortId } }));
}

type Toast = (msg: string, kind?: 'success' | 'error') => void;

interface Teacher { id: string; name: string | null; email: string | null; timezone: string | null; trained: boolean; classesNext7Days: number }
interface Kid { id: string; name: string | null; email: string | null; grade: number | null }
interface Detail {
  batch: { cohortId: string; batchCode: string | null; courseTitle: string; ratio: string; status: string; capacity: number };
  schedule: {
    id: string; status: string; teacherId: string | null; timezone: string; durationMin: number; startDate: string | null;
    days: { day: number; time: string }[]; upcoming: number; nextClassAt: string | null;
  } | null;
  roster: Kid[];
  teachers: Teacher[];
}
interface Refusal { message: string; clashes?: string[] }

const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const subjectOf = (courseTitle: string) => courseTitle.split(' · ')[0];
const today = () => new Date().toLocaleDateString('en-CA');
const uniq = (xs: string[]) => [...new Set(xs)].sort();

const fmt = (iso: string, tz: string | null) => {
  try {
    return new Date(iso).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', ...(tz ? { timeZone: tz } : {}) });
  } catch {
    return iso;
  }
};

async function post(url: string, body: unknown): Promise<{ ok: boolean; message?: string; error?: string; clashes?: string[]; [k: string]: unknown }> {
  try {
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    return await res.json();
  } catch {
    return { ok: false, message: 'Network error. Check your connection and try again.' };
  }
}

export default function BatchControl({ onToast }: { onToast?: Toast }) {
  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [cohortId, setCohortId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [tab, setTab] = useState<'teacher' | 'schedule' | 'roster'>('teacher');
  const rootRef = useRef<HTMLDivElement>(null);
  /* Pages pass a fresh arrow each render; reading it through a ref keeps the loads from refiring. */
  const toastRef = useRef(onToast);
  useEffect(() => { toastRef.current = onToast; }, [onToast]);

  const loadList = useCallback(async () => {
    setListLoading(true);
    try {
      const res = await fetch('/api/admin/batch-finder', { cache: 'no-store' });
      const j = await res.json();
      if (!j?.ok) { setListError(j?.message ?? 'Could not load batches.'); return; }
      setBatches(j.batches ?? []);
      setListError(null);
    } catch {
      setListError('Could not load batches. Check your connection.');
    } finally {
      setListLoading(false);
    }
  }, []);

  const loadDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/batch-control?cohortId=${encodeURIComponent(id)}`, { cache: 'no-store' });
      const j = await res.json();
      if (!j?.ok) { toastRef.current?.(j?.message ?? 'Could not open that batch.', 'error'); setDetail(null); return; }
      setDetail({ batch: j.batch, schedule: j.schedule, roster: j.roster ?? [], teachers: j.teachers ?? [] });
    } catch {
      toastRef.current?.('Could not open that batch. Check your connection.', 'error');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => { void loadList(); }, [loadList]);
  useEffect(() => {
    if (!cohortId) { const t = setTimeout(() => setDetail(null), 0); return () => clearTimeout(t); }
    void loadDetail(cohortId);
  }, [cohortId, loadDetail]);

  /* The batch finder's "Manage" lands here. */
  useEffect(() => {
    const open = (e: Event) => {
      const id = (e as CustomEvent<{ cohortId?: string }>).detail?.cohortId;
      if (!id) return;
      setCohortId(id);
      setTab('teacher');
      rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    window.addEventListener(OPEN_BATCH_EVENT, open);
    return () => window.removeEventListener(OPEN_BATCH_EVENT, open);
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadList(), cohortId ? loadDetail(cohortId) : Promise.resolve()]);
  }, [loadList, loadDetail, cohortId]);

  const batchFilters = useMemo<PickerFilter<BatchSummary>[]>(() => [
    { key: 'subject', label: 'Type', options: uniq(batches.map((b) => subjectOf(b.courseTitle))).map((v) => ({ value: v, label: v })), test: (b, v) => subjectOf(b.courseTitle) === v },
    { key: 'course', label: 'Course', options: uniq(batches.map((b) => b.courseTitle)).map((v) => ({ value: v, label: v.includes(' · ') ? v.split(' · ').slice(1).join(' · ') : v })), test: (b, v) => b.courseTitle === v },
    { key: 'teacher', label: 'Teacher', options: [{ value: 'yes', label: 'Assigned' }, { value: 'no', label: 'No teacher' }], test: (b, v) => (v === 'yes' ? !!b.teacher : !b.teacher) },
    { key: 'seats', label: 'Seats', options: [{ value: 'free', label: 'Seat free' }, { value: 'full', label: 'Full' }, { value: 'empty', label: 'Empty' }], test: (b, v) => (v === 'free' ? freeSeats(b) > 0 : v === 'full' ? freeSeats(b) === 0 : b.enrolled === 0) },
    { key: 'ratio', label: 'Ratio', options: uniq(batches.map((b) => b.ratio)).map((v) => ({ value: v, label: v })), test: (b, v) => b.ratio === v },
    { key: 'status', label: 'Status', options: uniq(batches.map((b) => b.status)).map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) })), test: (b, v) => b.status === v },
  ], [batches]);

  const current = detail && detail.batch.cohortId === cohortId ? detail : null;
  const currentTeacher = current?.schedule?.teacherId ? current.teachers.find((t) => t.id === current.schedule!.teacherId) ?? null : null;
  /* The teacher and schedule forms start again from what the batch now is after a change. */
  const version = current ? `${current.batch.cohortId}|${current.schedule?.teacherId ?? ''}|${daysLabel(current.schedule?.days ?? [])}` : '';

  return (
    <div ref={rootRef} className="card-3d p-4 sm:p-5 space-y-4 scroll-mt-24">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2" style={{ fontFamily: 'var(--font-jakarta)' }}>
            <Settings2 className="w-5 h-5 text-blue-600" /> Batch control
          </h3>
          <p className="text-[12.5px] text-slate-500">Find a batch by its code, course, teacher or a child in it — then change its teacher, days and times, or roster.</p>
        </div>
        <button type="button" onClick={() => void refreshAll()} className="inline-flex items-center gap-1 text-[12px] font-bold text-slate-500 hover:text-slate-800">
          <RefreshCw className={`w-3.5 h-3.5 ${listLoading || detailLoading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {listError && <p className="text-[12.5px] font-semibold text-rose-700">{listError}</p>}

      <SearchPicker<BatchSummary>
        ariaLabel="Find a batch"
        placeholder="Batch code (B-0052), course, teacher or a child's name…"
        items={batches}
        loading={listLoading}
        getId={(b) => b.cohortId}
        value={cohortId}
        onChange={(id) => { setCohortId(id); setTab('teacher'); }}
        filters={batchFilters}
        searchText={(b) => [b.batchCode, b.courseTitle, b.ratio, b.status, b.country, b.teacher?.name, ...b.studentNames].filter(Boolean).join(' ')}
        emptyText="No batch matches. Clear a filter or check the code."
        renderItem={(b) => <BatchRow b={b} />}
      />

      {cohortId && !current && (
        <p className="flex items-center gap-2 text-[12.5px] text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Opening the batch…</p>
      )}

      {current && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 sm:p-4 space-y-3">
          <div className="grid gap-x-4 gap-y-1 sm:grid-cols-2 text-[12.5px] text-slate-700">
            <p><span className="text-slate-500">Teacher:</span> <b>{currentTeacher?.name ?? (current.schedule?.teacherId ? 'Unknown teacher' : 'None assigned')}</b></p>
            <p><span className="text-slate-500">When:</span> {current.schedule ? `${daysLabel(current.schedule.days)} (${current.schedule.timezone})` : 'Not scheduled yet — use Schedule batch'}</p>
            <p><span className="text-slate-500">Upcoming:</span> {current.schedule ? `${current.schedule.upcoming} classes${current.schedule.nextClassAt ? ` · next ${fmt(current.schedule.nextClassAt, current.schedule.timezone)}` : ''}` : '—'}</p>
            <p><span className="text-slate-500">Roster:</span> {current.roster.length}/{current.batch.capacity} seats · {current.batch.ratio} · {current.batch.status}</p>
          </div>

          <div className="grid grid-cols-3 gap-1 rounded-xl bg-white border border-slate-200 p-1" role="tablist">
            {([
              ['teacher', 'Change teacher', 'Teacher', UserCog],
              ['schedule', 'Change days & times', 'Times', CalendarClock],
              ['roster', 'Change roster', 'Roster', Users],
            ] as const).map(([key, label, short, Icon]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                aria-label={label}
                className={`min-w-0 min-h-[38px] px-1 rounded-lg text-[12px] sm:text-[12.5px] font-bold inline-flex items-center justify-center gap-1.5 ${tab === key ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <Icon className="w-4 h-4 shrink-0" /> <span className="truncate sm:hidden">{short}</span><span className="truncate hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {tab === 'teacher' && <TeacherTab key={`t-${version}`} detail={current} onDone={refreshAll} onToast={onToast} />}
          {tab === 'schedule' && <ScheduleTab key={`s-${version}`} detail={current} onDone={refreshAll} onToast={onToast} />}
          {tab === 'roster' && <RosterTab key={`r-${current.batch.cohortId}`} detail={current} onDone={refreshAll} onToast={onToast} />}
        </div>
      )}
    </div>
  );
}

function BatchRow({ b }: { b: BatchSummary }) {
  const free = freeSeats(b);
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-900 text-white tracking-wider">{b.batchCode ?? 'NO CODE'}</span>
        <span className="text-[13px] font-extrabold text-slate-900">{b.courseTitle}</span>
        <span className="text-[11px] font-bold text-slate-500">{b.ratio} · {b.status}</span>
        <span className={`ml-auto text-[11px] font-bold px-1.5 py-0.5 rounded-full ${free === 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>{b.enrolled}/{b.capacity} seats</span>
      </div>
      <p className="text-[12px] text-slate-600 mt-0.5 truncate">
        {b.teacher?.name ?? 'No teacher'} · {daysLabel(b.days)} · lesson {batchLessonAt(b)}{b.totalLessons ? ` of ${b.totalLessons}` : ''}
        {b.studentNames.length ? ` · ${b.studentNames.join(', ')}` : ''}
      </p>
    </div>
  );
}

/* ── Days and times, with the first classes they make ─────────────────────── */

function DayTimeEditor({
  days, onDays, from, onFrom, timezone, durationMin, teacherTz,
}: {
  days: Record<number, string>; onDays: (d: Record<number, string>) => void;
  from: string; onFrom: (v: string) => void;
  timezone: string; durationMin: number; teacherTz?: string | null;
}) {
  const picked = Object.keys(days).map(Number).sort((a, b) => a - b);
  const toggle = (d: number) => {
    const next = { ...days };
    if (d in next) delete next[d];
    else next[d] = picked.length ? days[picked[0]] : '17:00';
    onDays(next);
  };

  const preview = useMemo(() => {
    if (!picked.length || !from) return [];
    const perDay: Record<number, { time: string }> = {};
    for (const d of picked) perDay[d] = { time: days[d] };
    try {
      return generateOccurrences({ startDate: from, daysOfWeek: picked, timeLocal: days[picked[0]], durationMin, timezone, perDay }, 4);
    } catch {
      return [];
    }
  }, [picked, days, from, durationMin, timezone]);

  return (
    <div className="space-y-2.5">
      <div>
        <p className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">Days</p>
        <div className="grid grid-cols-7 gap-1">
          {WD.map((w, i) => (
            <button
              key={w}
              type="button"
              onClick={() => toggle(i)}
              aria-pressed={i in days}
              className={`min-h-[36px] rounded-lg text-[12px] font-bold border-2 ${i in days ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-500 hover:border-blue-300'}`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>
      {picked.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {picked.map((d) => (
            <label key={d} className="flex items-center gap-2">
              <span className="w-10 shrink-0 text-[12px] font-bold text-slate-600">{WD[d]}</span>
              <input type="time" value={days[d]} onChange={(e) => onDays({ ...days, [d]: e.target.value })} className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-[13px]" />
            </label>
          ))}
        </div>
      )}
      <label className="block">
        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">Starting from</span>
        <input type="date" value={from} min={today()} onChange={(e) => onFrom(e.target.value)} className="mt-1 h-9 w-full sm:w-56 rounded-lg border border-slate-200 bg-white px-2 text-[13px]" />
        <span className="block text-[11.5px] text-slate-500 mt-1">Times are in {timezone}. Upcoming classes before this date are cancelled (a break); past classes stay as they are.</span>
      </label>
      {preview.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-2 text-[12px] text-slate-700">
          <p className="font-bold text-slate-500 mb-0.5">First classes</p>
          {preview.map((s) => (
            <p key={s.slotStart}>
              {fmt(s.slotStart, timezone)}
              {teacherTz && teacherTz !== timezone && <span className="text-slate-400"> · teacher: {fmt(s.slotStart, teacherTz)}</span>}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function initialDays(detail: Detail): Record<number, string> {
  return Object.fromEntries((detail.schedule?.days ?? []).map((d) => [d.day, d.time]));
}

function daysPayload(days: Record<number, string>) {
  return Object.keys(days).map(Number).sort((a, b) => a - b).map((d) => ({ day: d, time: days[d] }));
}

function RefusalBox({ refusal, tz }: { refusal: Refusal; tz: string }) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-[12.5px] text-rose-800">
      <p className="font-semibold">{refusal.message}</p>
      {refusal.clashes && refusal.clashes.length > 0 && (
        <p className="mt-1 text-rose-700">Clashes: {refusal.clashes.slice(0, 6).map((c) => fmt(c, tz)).join(' · ')}{refusal.clashes.length > 6 ? ` and ${refusal.clashes.length - 6} more` : ''}</p>
      )}
    </div>
  );
}

/* ── Teacher ──────────────────────────────────────────────────────────────── */

type Check =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'done'; trained: boolean; upcoming: number; clashes: string[] }
  | { state: 'error'; message: string };

function TeacherTab({ detail, onDone, onToast }: { detail: Detail; onDone: () => Promise<void>; onToast?: Toast }) {
  const sched = detail.schedule;
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [check, setCheck] = useState<Check>({ state: 'idle' });
  const [withTimes, setWithTimes] = useState(false);
  const [days, setDays] = useState<Record<number, string>>(() => initialDays(detail));
  const [from, setFrom] = useState(today);
  const [busy, setBusy] = useState(false);
  const [refusal, setRefusal] = useState<Refusal | null>(null);

  const teachers = useMemo(
    () => detail.teachers
      .filter((t) => t.id !== sched?.teacherId)
      .sort((a, b) => Number(b.trained) - Number(a.trained) || a.classesNext7Days - b.classesNext7Days || (a.name ?? '').localeCompare(b.name ?? '')),
    [detail.teachers, sched?.teacherId]
  );
  const filters = useMemo<PickerFilter<Teacher>[]>(() => [
    { key: 'trained', label: 'Training', initial: 'yes', options: [{ value: 'yes', label: 'Trained for this course' }, { value: 'no', label: 'Not trained' }], test: (t, v) => (v === 'yes' ? t.trained : !t.trained) },
    { key: 'load', label: 'Load', options: [{ value: 'light', label: 'Up to 5 classes' }, { value: 'busy', label: 'More than 5' }], test: (t, v) => (v === 'light' ? t.classesNext7Days <= 5 : t.classesNext7Days > 5) },
  ], []);

  const chosen = teachers.find((t) => t.id === teacherId) ?? null;

  const pick = async (id: string | null) => {
    setTeacherId(id);
    setRefusal(null);
    setWithTimes(false);
    if (!id || !sched) { setCheck({ state: 'idle' }); return; }
    setCheck({ state: 'checking' });
    const j = await post('/api/admin/batch-control', { action: 'check_teacher', scheduleId: sched.id, teacherId: id });
    if (!j.ok) { setCheck({ state: 'error', message: j.message ?? 'Could not check that teacher.' }); return; }
    const result = { state: 'done' as const, trained: !!j.trained, upcoming: Number(j.upcoming ?? 0), clashes: (j.clashes as string[] | undefined) ?? [] };
    setCheck(result);
    // Not free, or nothing booked to move: the timetable has to be set with them.
    if (result.trained && (result.clashes.length > 0 || result.upcoming === 0)) setWithTimes(true);
  };

  const apply = async () => {
    if (!sched || !teacherId) return;
    setBusy(true);
    setRefusal(null);
    const body = withTimes
      ? { action: 'change_teacher', scheduleId: sched.id, teacherId, days: daysPayload(days), effectiveFrom: from }
      : { action: 'change_teacher', scheduleId: sched.id, teacherId };
    const j = await post('/api/admin/batch-control', body);
    setBusy(false);
    if (!j.ok) {
      setRefusal({ message: j.message ?? j.error ?? 'Could not change the teacher.', clashes: j.clashes });
      if (j.error === 'teacher_conflict' && !withTimes) setWithTimes(true);
      return;
    }
    const name = chosen?.name ?? 'the new teacher';
    onToast?.(withTimes
      ? `${detail.batch.batchCode ?? 'Batch'} moved to ${name}, ${j.classes} classes on the new days and times`
      : `${detail.batch.batchCode ?? 'Batch'}: ${j.moved} upcoming classes moved to ${name}`);
    setTeacherId(null);
    setCheck({ state: 'idle' });
    await onDone();
  };

  if (!sched) {
    return <p className="text-[12.5px] text-slate-600">This batch has no schedule yet. Use <b>Schedule batch</b> to give it a teacher, days and times first.</p>;
  }

  const canApply = !!teacherId && check.state === 'done' && check.trained && (!withTimes || Object.keys(days).length > 0);

  return (
    <div className="space-y-3">
      <SearchPicker<Teacher>
        ariaLabel="Find a teacher"
        placeholder="Teacher name or email…"
        items={teachers}
        getId={(t) => t.id}
        value={teacherId}
        onChange={(id) => void pick(id)}
        filters={filters}
        searchText={(t) => [t.name, t.email, t.timezone].filter(Boolean).join(' ')}
        emptyText="No teacher matches. Is their training for this course marked complete? Try the Not trained chip."
        disabledReason={(t) => (t.trained ? null : 'Training for this course is not marked complete')}
        renderItem={(t) => (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-[13px] font-bold text-slate-900">{t.name ?? 'Unnamed'}</span>
            <span className="text-[11.5px] text-slate-500">{t.email ?? ''}{t.timezone ? ` · ${t.timezone}` : ''}</span>
            {t.trained && <span className="text-[10.5px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">Trained</span>}
            <span className="ml-auto text-[11.5px] font-semibold text-slate-500">{t.classesNext7Days} classes next 7 days</span>
          </div>
        )}
      />

      {check.state === 'checking' && <p className="flex items-center gap-2 text-[12.5px] text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Checking {chosen?.name ?? 'the teacher'} against every upcoming class…</p>}
      {check.state === 'error' && <p className="text-[12.5px] font-semibold text-rose-700">{check.message}</p>}
      {check.state === 'done' && !check.trained && (
        <p className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-[12.5px] font-semibold text-rose-800">{chosen?.name ?? 'This teacher'}&apos;s training for this course is not marked complete, so they cannot take this batch.</p>
      )}
      {check.state === 'done' && check.trained && (
        check.upcoming === 0 ? (
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[12.5px] text-amber-900">The batch has no upcoming classes to move. Set its days and times below and they start with {chosen?.name ?? 'the teacher'}.</p>
        ) : check.clashes.length === 0 ? (
          <p className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-[12.5px] text-emerald-900">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> Free for all {check.upcoming} upcoming classes at the batch&apos;s current times.
          </p>
        ) : (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-[12.5px] text-amber-900">
            <p className="flex items-start gap-2 font-semibold"><AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> Busy for {check.clashes.length} of {check.upcoming} upcoming classes — change the days and times with them below.</p>
            <p className="mt-1 text-amber-800">{check.clashes.slice(0, 5).map((c) => fmt(c, sched.timezone)).join(' · ')}{check.clashes.length > 5 ? ` and ${check.clashes.length - 5} more` : ''}</p>
          </div>
        )
      )}

      {check.state === 'done' && check.trained && (
        <>
          {check.upcoming > 0 && check.clashes.length === 0 && (
            <label className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-slate-700">
              <input type="checkbox" checked={withTimes} onChange={(e) => setWithTimes(e.target.checked)} /> Also change the days and times
            </label>
          )}
          {withTimes && (
            <DayTimeEditor days={days} onDays={setDays} from={from} onFrom={setFrom} timezone={sched.timezone} durationMin={sched.durationMin} teacherTz={chosen?.timezone} />
          )}
          {refusal && <RefusalBox refusal={refusal} tz={sched.timezone} />}
          <button
            type="button"
            disabled={!canApply || busy}
            onClick={() => void apply()}
            className="w-full min-h-[44px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold inline-flex items-center justify-center gap-2 disabled:bg-slate-300"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {withTimes
              ? `Change teacher to ${chosen?.name ?? 'them'} on these days and times`
              : `Move all ${check.upcoming} upcoming classes to ${chosen?.name ?? 'them'}`}
          </button>
        </>
      )}
    </div>
  );
}

/* ── Schedule ─────────────────────────────────────────────────────────────── */

function ScheduleTab({ detail, onDone, onToast }: { detail: Detail; onDone: () => Promise<void>; onToast?: Toast }) {
  const sched = detail.schedule;
  const [days, setDays] = useState<Record<number, string>>(() => initialDays(detail));
  const [from, setFrom] = useState(today);
  const [busy, setBusy] = useState(false);
  const [refusal, setRefusal] = useState<Refusal | null>(null);
  const teacher = sched?.teacherId ? detail.teachers.find((t) => t.id === sched.teacherId) ?? null : null;

  if (!sched) return <p className="text-[12.5px] text-slate-600">This batch has no schedule yet. Use <b>Schedule batch</b> first.</p>;
  if (!sched.teacherId) return <p className="text-[12.5px] text-slate-600">This batch has no teacher. Pick one in <b>Change teacher</b> — the days and times are set there with them.</p>;

  const apply = async () => {
    setBusy(true);
    setRefusal(null);
    const j = await post('/api/admin/batch-control', { action: 'reschedule', scheduleId: sched.id, days: daysPayload(days), effectiveFrom: from });
    setBusy(false);
    if (!j.ok) { setRefusal({ message: j.message ?? j.error ?? 'Could not change the schedule.', clashes: j.clashes }); return; }
    onToast?.(`${detail.batch.batchCode ?? 'Batch'}: ${j.classes} classes on the new days and times from ${j.effectiveFrom}`);
    await onDone();
  };

  return (
    <div className="space-y-3">
      <p className="text-[12.5px] text-slate-600">Same teacher{teacher?.name ? ` (${teacher.name})` : ''}. Checked against their other classes and every child&apos;s before anything changes.</p>
      <DayTimeEditor days={days} onDays={setDays} from={from} onFrom={setFrom} timezone={sched.timezone} durationMin={sched.durationMin} teacherTz={teacher?.timezone} />
      {refusal && <RefusalBox refusal={refusal} tz={sched.timezone} />}
      <button
        type="button"
        disabled={busy || Object.keys(days).length === 0}
        onClick={() => void apply()}
        className="w-full min-h-[44px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold inline-flex items-center justify-center gap-2 disabled:bg-slate-300"
      >
        {busy && <Loader2 className="w-4 h-4 animate-spin" />} Apply new days and times
      </button>
    </div>
  );
}

/* ── Roster ───────────────────────────────────────────────────────────────── */

function RosterTab({ detail, onDone, onToast }: { detail: Detail; onDone: () => Promise<void>; onToast?: Toast }) {
  const code = detail.batch.batchCode ?? 'this batch';
  const [removing, setRemoving] = useState<Kid | null>(null);
  const [query, setQuery] = useState('');
  const [found, setFound] = useState<Kid[]>([]);
  const [adding, setAdding] = useState<Kid | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const full = detail.roster.length >= detail.batch.capacity;
  const inBatch = useMemo(() => new Set(detail.roster.map((k) => k.id)), [detail.roster]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { const t = setTimeout(() => setFound([]), 0); return () => clearTimeout(t); }
    const t = setTimeout(() => {
      fetch(`/api/admin/batch-finder?find=${encodeURIComponent(q)}`, { cache: 'no-store' })
        .then((r) => r.json()).then((j) => setFound(j?.found ?? [])).catch(() => setFound([]));
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const run = async (action: 'add_kid' | 'remove_kid', kid: Kid) => {
    setBusy(true);
    setError(null);
    const j = await post('/api/admin/schedule/manage', { action, cohortId: detail.batch.cohortId, studentId: kid.id });
    setBusy(false);
    if (!j.ok) { setError(j.message ?? j.error ?? 'That did not go through.'); return; }
    onToast?.(action === 'add_kid' ? `${kid.name ?? 'Student'} added to ${code}` : `${kid.name ?? 'Student'} removed from ${code}`);
    setRemoving(null);
    setAdding(null);
    setQuery('');
    await onDone();
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">In the batch · {detail.roster.length}/{detail.batch.capacity} seats</p>
        {detail.roster.length === 0 ? (
          <p className="text-[12.5px] text-slate-500">Nobody yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
            {detail.roster.map((k) => (
              <li key={k.id} className="px-3 py-2">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="text-[13px] font-bold text-slate-900">{k.name ?? 'Unnamed'}</span>
                  <span className="text-[11.5px] text-slate-500">{gradeTag(k.grade)}{k.email ? ` · ${k.email}` : ''}</span>
                  {removing?.id !== k.id && (
                    <button type="button" onClick={() => { setError(null); setRemoving(k); setAdding(null); }} className="ml-auto inline-flex items-center gap-1 h-8 px-2.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-[12px] font-bold">
                      <UserMinus className="w-3.5 h-3.5" /> Remove
                    </button>
                  )}
                </div>
                {removing?.id === k.id && (
                  <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5">
                    <p className="text-[12.5px] text-rose-900">Remove {k.name ?? 'this child'} from {code}? They stop getting this batch&apos;s classes and go on the waiting list in the batch finder.</p>
                    <div className="mt-2 flex justify-end gap-2">
                      <button type="button" onClick={() => setRemoving(null)} disabled={busy} className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-[12px] font-bold text-slate-600">Keep</button>
                      <button type="button" onClick={() => void run('remove_kid', k)} disabled={busy} className="h-8 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[12px] font-bold inline-flex items-center gap-1.5 disabled:opacity-60">
                        {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Remove
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className="text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1">Add a child</p>
        {full ? (
          <p className="text-[12.5px] text-slate-600">The batch is full. Remove someone first, or find another batch in the batch finder.</p>
        ) : (
          <>
            <label className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-blue-600 shrink-0" />
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setAdding(null); }}
                placeholder="Search a child by name, email or phone"
                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-[13px] outline-none focus:border-blue-500"
              />
            </label>
            {found.length > 0 && (
              <ul className="mt-1.5 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white max-h-64 overflow-y-auto">
                {found.map((k) => (
                  <li key={k.id} className="px-3 py-2">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-[13px] font-bold text-slate-900">{k.name ?? 'Unnamed'}</span>
                      <span className="text-[11.5px] text-slate-500">{gradeTag(k.grade)}{k.email ? ` · ${k.email}` : ''}</span>
                      {inBatch.has(k.id) ? (
                        <span className="ml-auto text-[11.5px] font-bold text-slate-400">Already in this batch</span>
                      ) : adding?.id !== k.id && (
                        <button type="button" onClick={() => { setError(null); setAdding(k); setRemoving(null); }} className="ml-auto inline-flex items-center gap-1 h-8 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold">
                          <UserPlus className="w-3.5 h-3.5" /> Add
                        </button>
                      )}
                    </div>
                    {adding?.id === k.id && (
                      <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 p-2.5">
                        <p className="text-[12.5px] text-blue-900">Add {k.name ?? 'this child'} to {code} — seat {detail.roster.length + 1} of {detail.batch.capacity}? Refused if they have no credits, already have a batch of this course, or have another class at the same time.</p>
                        <div className="mt-2 flex justify-end gap-2">
                          <button type="button" onClick={() => setAdding(null)} disabled={busy} className="h-8 px-3 rounded-lg border border-slate-200 bg-white text-[12px] font-bold text-slate-600">Cancel</button>
                          <button type="button" onClick={() => void run('add_kid', k)} disabled={busy} className="h-8 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-bold inline-flex items-center gap-1.5 disabled:opacity-60">
                            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Add to batch
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {error && <p className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-[12.5px] font-semibold text-rose-800">{error}</p>}
    </div>
  );
}
