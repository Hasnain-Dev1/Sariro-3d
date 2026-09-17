'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { X, CalendarClock, Loader2, Check, Globe, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { generateOccurrences } from '@/lib/dashboard/schedule-generation';
import { lessonsOf } from '@/lib/dashboard/lesson-plan';
import { courseTitleOf } from '@/lib/dashboard/class-lesson';
import { daysLabel, seatCapacity, type BatchSummary } from '@/lib/scheduling/batch-finder';
import { gradeTag } from '@/lib/grade/tag';
import SearchPicker, { type PickerFilter } from '@/components/dashboard/search-picker';

/* ════════════════════════════════════════════════════════════════════════
   ScheduleBatchModal — admin/super-admin recurring class scheduler.
   Books a cohort onto a weekly cadence (1 or 2 days/week) and shows the
   chosen time live in the teacher's tz AND every enrolled kid's tz, so the
   person booking can coordinate both ends. Calls POST /api/admin/schedule.

   Batch first, then teacher, each found by typing and filter chips rather than
   scrolled for in a dropdown (founder, 17 Sep 2026: "later when we will have a
   lot of batches and teachers it will be hard to scroll and find things").
   ════════════════════════════════════════════════════════════════════════ */

interface Teacher { id: string; full_name: string | null; timezone: string | null }
interface Cohort { id: string; track: string; level: string; ratio: string; status: string; batch_code: string | null; max_capacity?: number | null }
/** A batch as the picker shows it: the cohort plus what the batch finder knows about it. */
interface BatchOption extends Cohort { courseTitle: string; subject: string; summary: BatchSummary | null }
interface Kid { id: string; full_name: string | null; timezone: string | null; grade: number | null }

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const COMMON_TZ = [
  'Asia/Kolkata', 'Asia/Karachi', 'Asia/Dubai', 'Asia/Singapore',
  'Europe/London', 'America/New_York', 'America/Chicago',
  'America/Denver', 'America/Los_Angeles', 'Australia/Sydney',
];
const FALLBACK_TZ = 'Asia/Kolkata';

const fmtInZone = (iso: string, tz: string) => {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz, weekday: 'short', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    }).format(new Date(iso));
  } catch {
    return '—';
  }
};

export default function ScheduleBatchModal({
  open, onClose, onCreated, adminId,
}: { open: boolean; onClose: () => void; onCreated?: () => void; adminId?: string | null }) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [kids, setKids] = useState<Kid[]>([]);

  const [teacherId, setTeacherId] = useState('');
  const [cohortId, setCohortId] = useState('');
  const [startDate, setStartDate] = useState('');
  // Per-day times: which weekdays are selected AND the start time for each.
  const [dayTimes, setDayTimes] = useState<Record<number, string>>({});
  const [defaultTime, setDefaultTime] = useState('17:00'); // seeds newly-picked days
  const [durationMin, setDurationMin] = useState(60);
  const [classesPerWeek, setClassesPerWeek] = useState<1 | 2>(1);
  const [anchorTz, setAnchorTz] = useState(FALLBACK_TZ);

  const weekdays = useMemo(
    () => Object.keys(dayTimes).map(Number).sort((a, b) => a - b),
    [dayTimes]
  );

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Load teachers + cohorts on open.
  useEffect(() => {
    if (!open) return;
    const sb = createClient();
    (async () => {
      // Scope teachers to this admin's roster when adminId is provided.
      let tq = sb.from('profiles').select('id, full_name, timezone').or('role.eq.teacher,is_teacher.eq.true');
      if (adminId) tq = tq.eq('reporting_admin_id', adminId);
      const [tRes, cRes] = await Promise.all([
        tq.order('full_name'),
        sb.from('cohorts').select('id, track, level, ratio, status, batch_code, max_capacity').in('status', ['gathering', 'ready', 'active']).order('created_at', { ascending: false }),
      ]);
      setTeachers((tRes.data ?? []) as Teacher[]);
      setCohorts((cRes.data ?? []) as Cohort[]);
    })();
  }, [open, adminId]);

  /* Seats, teacher and whether each batch is already scheduled — for the filters.
     Guidance only: without it the batches still list and schedule. */
  const [summaries, setSummaries] = useState<Map<string, BatchSummary>>(new Map());
  const [summariesLoaded, setSummariesLoaded] = useState(false);
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch('/api/admin/batch-finder', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => { if (!cancelled && j?.ok) setSummaries(new Map((j.batches as BatchSummary[]).map((b) => [b.cohortId, b]))); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setSummariesLoaded(true); });
    return () => { cancelled = true; };
  }, [open]);

  const batchOptions = useMemo<BatchOption[]>(() => cohorts.map((c) => {
    const courseTitle = courseTitleOf(c.track, c.level);
    return { ...c, courseTitle, subject: courseTitle.split(' · ')[0], summary: summaries.get(c.id) ?? null };
  }), [cohorts, summaries]);

  const batchFilters = useMemo<PickerFilter<BatchOption>[]>(() => {
    const uniq = (xs: string[]) => [...new Set(xs)].sort();
    return [
      { key: 'subject', label: 'Type', options: uniq(batchOptions.map((b) => b.subject)).map((v) => ({ value: v, label: v })), test: (b, v) => b.subject === v },
      { key: 'course', label: 'Course', options: uniq(batchOptions.map((b) => b.courseTitle)).map((v) => ({ value: v, label: v.includes(' · ') ? v.split(' · ').slice(1).join(' · ') : v })), test: (b, v) => b.courseTitle === v },
      // A batch with a schedule already gets a SECOND set of classes if scheduled again.
      { key: 'scheduled', label: 'Schedule', initial: summariesLoaded && summaries.size ? 'no' : '', options: [{ value: 'no', label: 'Not scheduled yet' }, { value: 'yes', label: 'Already scheduled' }], test: (b, v) => (v === 'yes' ? !!b.summary?.scheduleId : !b.summary?.scheduleId) },
      { key: 'ratio', label: 'Ratio', options: uniq(batchOptions.map((b) => b.ratio)).map((v) => ({ value: v, label: v })), test: (b, v) => b.ratio === v },
      { key: 'status', label: 'Status', options: uniq(batchOptions.map((b) => b.status)).map((v) => ({ value: v, label: v[0].toUpperCase() + v.slice(1) })), test: (b, v) => b.status === v },
    ];
  }, [batchOptions, summaries, summariesLoaded]);

  // Load kids when a cohort is chosen.
  const loadKids = useCallback(async (cid: string) => {
    if (!cid) { setKids([]); return; }
    const sb = createClient();
    const { data: enr } = await sb.from('enrollments').select('user_id').eq('cohort_id', cid).eq('status', 'active');
    const ids = (enr ?? []).map((e: { user_id: string }) => e.user_id);
    if (ids.length === 0) { setKids([]); return; }
    const { data: profs } = await sb.from('profiles').select('id, full_name, timezone, grade').in('id', ids);
    setKids((profs ?? []) as Kid[]);
  }, []);

  useEffect(() => { Promise.resolve().then(() => loadKids(cohortId)); }, [cohortId, loadKids]);

  // Only teachers whose course TRAINING is marked complete (by a super-admin)
  // for the selected batch's course may be scheduled.
  const [trainedTeacherIds, setTrainedTeacherIds] = useState<Set<string> | null>(null);
  useEffect(() => {
    const cohort = cohorts.find((c) => c.id === cohortId);
    if (!cohort) { Promise.resolve().then(() => setTrainedTeacherIds(null)); return; }
    let cancelled = false;
    const sb = createClient();
    (async () => {
      const { data } = await sb.from('teacher_course_assignments')
        .select('teacher_id')
        .ilike('track', cohort.track).ilike('level', cohort.level)
        .not('training_completed_at', 'is', null);
      if (!cancelled) setTrainedTeacherIds(new Set((data ?? []).map((r: { teacher_id: string }) => r.teacher_id)));
    })();
    return () => { cancelled = true; };
  }, [cohortId, cohorts]);


  /* §10 — how busy each teacher already is, shown BEFORE one is chosen.
     Conflicts were already refused at submit, which is correct and far too
     late: an admin picked a name with no idea whether that teacher had two
     classes a week or eleven, built a whole schedule, and only then found out. */
  const [workload, setWorkload] = useState<Map<string, { upcoming: number; batches: number; students: number; nextSevenDays: number }>>(new Map());
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/teacher-workload', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}),
        });
        const json = await res.json();
        if (cancelled || !json.ok) return;
        setWorkload(new Map((json.workload as { teacher_id: string; upcoming: number; batches: number; students: number; nextSevenDays: number }[])
          .map((w) => [w.teacher_id, w])));
      } catch {
        // Workload is guidance, not a gate. Its absence must not stop anyone
        // scheduling a class.
      }
    })();
    return () => { cancelled = true; };
  }, [open]);

  /** "4 classes · 2 batches · 6 students · 3 this week" */
  const workloadLabel = (id: string): string => {
    const w = workload.get(id);
    if (!w) return 'no classes scheduled';
    return `${w.upcoming} ${w.upcoming === 1 ? 'class' : 'classes'} · ${w.batches} ${w.batches === 1 ? 'batch' : 'batches'} · ${w.students} ${w.students === 1 ? 'student' : 'students'}${w.nextSevenDays > 0 ? ` · ${w.nextSevenDays} this week` : ''}`;
  };

  /* Everyone, trained for this batch first, then least busy this week. */
  const teacherOptions = useMemo(
    () => [...teachers].sort((a, b) =>
      Number(!!trainedTeacherIds?.has(b.id)) - Number(!!trainedTeacherIds?.has(a.id)) ||
      (workload.get(a.id)?.nextSevenDays ?? 0) - (workload.get(b.id)?.nextSevenDays ?? 0) ||
      (a.full_name ?? '').localeCompare(b.full_name ?? '')),
    [teachers, trainedTeacherIds, workload]
  );
  const teacherFilters = useMemo<PickerFilter<Teacher>[]>(() => {
    const zones = [...new Set(teachers.map((t) => t.timezone).filter((z): z is string => !!z))].sort();
    return [
      ...(trainedTeacherIds ? [{
        key: 'trained', label: 'Training', initial: 'yes',
        options: [{ value: 'yes', label: 'Trained for this batch' }, { value: 'no', label: 'Not trained' }],
        test: (t: Teacher, v: string) => (v === 'yes' ? trainedTeacherIds.has(t.id) : !trainedTeacherIds.has(t.id)),
      }] : []),
      { key: 'week', label: 'This week', options: [{ value: 'light', label: 'Up to 5 classes' }, { value: 'busy', label: 'More than 5' }], test: (t, v) => ((workload.get(t.id)?.nextSevenDays ?? 0) <= 5) === (v === 'light') },
      ...(zones.length > 1 ? [{ key: 'tz', label: 'Time zone', options: zones.map((z) => ({ value: z, label: z })), test: (t: Teacher, v: string) => t.timezone === v }] : []),
    ];
  }, [teachers, trainedTeacherIds, workload]);

  // Clear a chosen teacher if they're no longer eligible for the new batch.
  useEffect(() => {
    if (teacherId && trainedTeacherIds && !trainedTeacherIds.has(teacherId)) {
      Promise.resolve().then(() => setTeacherId(''));
    }
  }, [teacherId, trainedTeacherIds]);

  const teacher = useMemo(() => teachers.find((t) => t.id === teacherId), [teachers, teacherId]);

  // Default the anchor tz to the selected teacher's tz.
  useEffect(() => {
    if (teacher?.timezone) { const tz = teacher.timezone; Promise.resolve().then(() => setAnchorTz(tz)); }
  }, [teacher]);

  // Enforce weekday count against cadence; each newly-picked day inherits the
  // current default time, then can be tuned independently below.
  const toggleDay = (d: number) => {
    setDayTimes((prev) => {
      const next = { ...prev };
      if (d in next) { delete next[d]; return next; }
      const keys = Object.keys(next).map(Number);
      if (keys.length >= classesPerWeek) {
        // replace oldest when at capacity
        delete next[keys.sort((a, b) => a - b)[0]];
      }
      next[d] = defaultTime;
      return next;
    });
  };
  const setDayTime = (d: number, time: string) => {
    setDayTimes((prev) => ({ ...prev, [d]: time }));
  };
  const setCadence = (n: 1 | 2) => {
    setClassesPerWeek(n);
    setDayTimes((prev) => {
      const keys = Object.keys(prev).map(Number).sort((a, b) => a - b).slice(0, n);
      const next: Record<number, string> = {};
      for (const k of keys) next[k] = prev[k];
      return next;
    });
  };

  // Per-day map for the generator.
  const perDay = useMemo(() => {
    const m: Record<number, { time: string }> = {};
    for (const d of weekdays) m[d] = { time: dayTimes[d] };
    return m;
  }, [weekdays, dayTimes]);

  // Live preview: the NEXT occurrence of each selected day, so the booker sees
  // exactly which day+time each class lands on (per-day times reflected).
  const previews = useMemo(() => {
    if (!startDate || weekdays.length !== classesPerWeek) return [];
    return weekdays
      .map((d) => {
        const slots = generateOccurrences(
          { startDate, daysOfWeek: [d], timeLocal: dayTimes[d], durationMin, timezone: anchorTz, perDay },
          1
        );
        return { day: d, iso: slots[0]?.slotStart ?? null };
      })
      .filter((p): p is { day: number; iso: string } => !!p.iso);
  }, [startDate, weekdays, classesPerWeek, dayTimes, durationMin, anchorTz, perDay]);

  /* Which lesson the first class teaches. Batches resuming after a break, or
     picking up from a bridge course, do not start at lesson 1 — and the
     scheduler is the only person who knows which. */
  const [startLesson, setStartLesson] = useState(1);
  const lessons = useMemo(() => {
    const c = cohorts.find((x) => x.id === cohortId);
    return c ? lessonsOf(c.track, c.level) : [];
  }, [cohorts, cohortId]);
  // A different course means a different syllabus; lesson 9 of one is not
  // lesson 9 of another.
  useEffect(() => { setStartLesson(1); }, [cohortId]);

  const valid = !!(teacherId && cohortId && startDate && weekdays.length === classesPerWeek && weekdays.every((d) => dayTimes[d]));

  const submit = async () => {
    setBusy(true); setErr(null);
    try {
      const res = await fetch('/api/admin/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cohortId, teacherId, startDate,
          days: weekdays.map((d) => ({ day: d, time: dayTimes[d] })),
          durationMin, timezone: anchorTz, startLesson,
        }),
      });
      const json = await res.json();
      if (json.ok) { onCreated?.(); onClose(); }
      // `message` before `error`: the API sends a machine slug in `error`
      // ("teacher_conflict", "student_conflict") and the human sentence in
      // `message`. Reading only `error` showed admins the slug, which tells
      // them something failed but not who, when, or what to do about it.
      else setErr(json.errors?.join(', ') || json.message || json.error || 'Could not create schedule.');
    } catch {
      setErr('Network error. Try again.');
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  const tzOptions = Array.from(new Set([anchorTz, teacher?.timezone, ...kids.map((k) => k.timezone), ...COMMON_TZ].filter(Boolean))) as string[];

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-4 sm:p-6 shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>Schedule a batch</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400" aria-label="Close"><X className="w-4 h-4" /></button>
        </div>

        {/* Batch, then teacher — the batch decides who is trained to teach it. */}
        <Field label="Batch">
          <SearchPicker<BatchOption>
            ariaLabel="Find a batch"
            placeholder="Batch code, course or grade…"
            items={batchOptions}
            getId={(b) => b.id}
            value={cohortId || null}
            onChange={(id) => setCohortId(id ?? '')}
            filters={batchFilters}
            pageSize={20}
            searchText={(b) => [b.batch_code, b.courseTitle, b.track, b.level, b.ratio, b.status, b.summary?.teacher?.name, ...(b.summary?.studentNames ?? [])].filter(Boolean).join(' ')}
            emptyText="No batch matches. Clear a filter — a batch already scheduled is under Schedule: Already scheduled."
            renderItem={(b) => (
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-900 text-white tracking-wider">{b.batch_code ?? 'NO CODE'}</span>
                  <span className="text-[13px] font-extrabold text-slate-900">{b.courseTitle}</span>
                  <span className="text-[11px] font-bold text-slate-500">{b.ratio} · {b.status}</span>
                  <span className="ml-auto text-[11px] font-bold text-slate-500">{b.summary ? b.summary.enrolled : '–'}/{b.summary ? b.summary.capacity : seatCapacity(b.ratio, b.max_capacity)} seats</span>
                </div>
                {b.summary?.scheduleId && (
                  <p className="text-[11.5px] text-amber-700 mt-0.5 truncate">Scheduled: {daysLabel(b.summary.days)}{b.summary.teacher?.name ? ` with ${b.summary.teacher.name}` : ''}</p>
                )}
              </div>
            )}
          />
          {(() => {
            const picked = batchOptions.find((b) => b.id === cohortId);
            return picked?.summary?.scheduleId ? (
              <p className="mt-1.5 flex items-start gap-1.5 text-[11.5px] leading-[1.5] text-amber-800">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                This batch already has classes ({daysLabel(picked.summary.days)}). Scheduling it again adds a second set. To change its teacher, days or roster, use Batch control in Classes.
              </p>
            ) : null;
          })()}
        </Field>

        <Field label="Teacher">
          <SearchPicker<Teacher>
            ariaLabel="Find a teacher"
            placeholder="Teacher name or time zone…"
            items={teacherOptions}
            getId={(t) => t.id}
            value={teacherId || null}
            onChange={(id) => setTeacherId(id ?? '')}
            filters={teacherFilters}
            pageSize={20}
            searchText={(t) => [t.full_name, t.timezone].filter(Boolean).join(' ')}
            emptyText={trainedTeacherIds ? 'Nobody matches. Is a teacher’s training for this course marked complete?' : 'No teacher matches.'}
            disabledReason={(t) => (trainedTeacherIds && !trainedTeacherIds.has(t.id) ? 'Training for this course is not marked complete' : null)}
            renderItem={(t) => (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <span className="text-[13px] font-bold text-slate-900">{t.full_name || 'Unnamed'}</span>
                {t.timezone && <span className="text-[11.5px] text-slate-500">{t.timezone}</span>}
                {trainedTeacherIds?.has(t.id) && <span className="text-[10.5px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">Trained</span>}
                {/* §10 — the workload is read at the moment of choosing, not found out at submit. */}
                <span className="basis-full text-[11.5px] text-slate-500">{workloadLabel(t.id)}</span>
              </div>
            )}
          />
          {!cohortId && <p className="text-[11.5px] text-slate-500 mt-1">Pick the batch first to see who is trained for it.</p>}
        </Field>

        {/* Cadence */}
        <Field label="Classes per week">
          <div className="flex gap-2">
            {([1, 2] as const).map((n) => (
              <button key={n} onClick={() => setCadence(n)}
                className={`flex-1 min-h-[40px] rounded-lg text-sm font-bold border-2 transition-colors ${classesPerWeek === n ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-blue-300'}`}
                style={{ fontFamily: 'var(--font-grotesk)' }}>
                {n} {n === 1 ? 'day' : 'days'}/week
              </button>
            ))}
          </div>
        </Field>

        {/* Weekdays */}
        <Field label={`Day${classesPerWeek === 2 ? 's' : ''} of week (pick ${classesPerWeek})`}>
          <div className="grid grid-cols-7 gap-1">
            {WEEKDAYS.map((w, i) => (
              <button key={w} onClick={() => toggleDay(i)}
                className={`min-h-[38px] rounded-lg text-xs font-bold border-2 transition-colors ${weekdays.includes(i) ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:border-blue-300'}`}
                style={{ fontFamily: 'var(--font-grotesk)' }}>
                {w}
              </button>
            ))}
          </div>
        </Field>

        {/* Per-day times — each selected day can meet at a different time */}
        {weekdays.length > 0 && (
          <Field label="Time each day (set independently)">
            <div className="space-y-1.5">
              {weekdays.map((d) => (
                <div key={d} className="flex items-center gap-2">
                  <span className="w-12 shrink-0 text-xs font-bold text-slate-600" style={{ fontFamily: 'var(--font-grotesk)' }}>{WEEKDAYS[d]}</span>
                  <input type="time" value={dayTimes[d]} onChange={(e) => setDayTime(d, e.target.value)} className={inputCls} />
                </div>
              ))}
            </div>
          </Field>
        )}

        {/* Start date + time + duration + anchor tz */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="Start date"><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} /></Field>
          <Field label="Default time (seeds new days)"><input type="time" value={defaultTime} onChange={(e) => setDefaultTime(e.target.value)} className={inputCls} /></Field>
          <Field label="Duration (min)"><input type="number" min={15} step={15} value={durationMin} onChange={(e) => setDurationMin(Number(e.target.value) || 60)} className={inputCls} /></Field>
          <Field label="Time is set in">
            <select value={anchorTz} onChange={(e) => setAnchorTz(e.target.value)} className={selectCls}>
              {tzOptions.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </Field>
        </div>

        {/* Where in the course this batch begins.
            ────────────────────────────────────────────────────────────────
            The lesson used to be derived from a count — the Nth class is the
            Nth lesson — which is right for a batch starting at the beginning
            and wrong for one resuming after a break, or picking up from a
            bridge course. The scheduler is the only person who knows which.

            Hidden when the syllabus is not in code: Public Speaking's lessons
            live in lib/speaking/, and an empty dropdown is worse than none.
            Those classes still generate, they simply carry no lesson name —
            which is what happened for every batch before this. */}
        {lessons.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <Field label="Start from lesson">
              <select
                value={startLesson}
                onChange={(e) => setStartLesson(Number(e.target.value) || 1)}
                className={selectCls}
              >
                {lessons.map((l) => (
                  <option key={l.number} value={l.number}>
                    {l.number}. {l.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex items-end">
              <p className="text-[11px] text-slate-500 leading-relaxed pb-2">
                {startLesson === 1
                  ? `The whole course — ${lessons.length} lessons.`
                  : `Covers ${lessons.length - startLesson + 1} of ${lessons.length}. The first ${startLesson - 1} count as already taught.`}
              </p>
            </div>
          </div>
        )}

        {/* Dual-timezone preview */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 mb-4">
          <div className="flex items-center gap-1.5 mb-2 text-slate-500">
            <Globe className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ fontFamily: 'var(--font-grotesk)' }}>Next class, everyone&apos;s local time</span>
          </div>
          {previews.length > 0 ? (
            <div className="space-y-3">
              {previews.map(({ day, iso }) => (
                <div key={day} className="space-y-1.5 text-sm">
                  <div className="text-[11px] font-extrabold text-slate-700" style={{ fontFamily: 'var(--font-grotesk)' }}>
                    {WEEKDAYS[day]} · next: {dayTimes[day]}
                  </div>
                  <TzRow label={`Teacher${teacher?.full_name ? ` (${teacher.full_name.split(' ')[0]})` : ''}`} tz={teacher?.timezone || anchorTz} iso={iso} />
                  {kids.length === 0 && <p className="text-xs text-slate-400">No enrolled kids yet — they&apos;ll join future classes.</p>}
                  {kids.map((k) => <TzRow key={k.id} label={`${k.full_name?.split(' ')[0] || 'Kid'} · ${gradeTag(k.grade)}`} tz={k.timezone || anchorTz} iso={iso} muted={!k.timezone} />)}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">Pick teacher, batch, day{classesPerWeek === 2 ? 's' : ''}, start date &amp; a time for each day to preview.</p>
          )}
        </div>

        {err && <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 mb-3"><p className="text-sm text-red-700">{err}</p></div>}

        <div className="flex gap-2">
          <button onClick={onClose} disabled={busy} className="flex-1 min-h-[44px] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold disabled:opacity-50">Cancel</button>
          <button onClick={submit} disabled={busy || !valid} className="flex-1 min-h-[44px] rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:bg-slate-300">
            {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : <><Check className="w-4 h-4" /> Create schedule</>}
          </button>
        </div>
      </div>
    </div>
  );
}

const selectCls = 'w-full min-h-[40px] px-2 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40';
const inputCls = 'w-full min-h-[40px] px-3 rounded-lg border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-bold text-slate-700 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>{label}</label>
      {children}
    </div>
  );
}

function TzRow({ label, tz, iso, muted }: { label: string; tz: string; iso: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs font-bold text-slate-600 truncate">{label} <span className="font-normal text-slate-400">· {tz}{muted ? ' (default)' : ''}</span></span>
      <span className="text-sm font-bold text-slate-900 whitespace-nowrap" style={{ fontFamily: 'var(--font-jakarta)' }}>{fmtInZone(iso, tz)}</span>
    </div>
  );
}
