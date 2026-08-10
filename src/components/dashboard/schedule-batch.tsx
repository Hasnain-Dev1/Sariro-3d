'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { X, CalendarClock, Loader2, Check, Globe } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { generateOccurrences } from '@/lib/dashboard/schedule-generation';

/* ════════════════════════════════════════════════════════════════════════
   ScheduleBatchModal — admin/super-admin recurring class scheduler.
   Books a cohort onto a weekly cadence (1 or 2 days/week) and shows the
   chosen time live in the teacher's tz AND every enrolled kid's tz, so the
   person booking can coordinate both ends. Calls POST /api/admin/schedule.
   ════════════════════════════════════════════════════════════════════════ */

interface Teacher { id: string; full_name: string | null; timezone: string | null }
interface Cohort { id: string; track: string; level: string; ratio: string; status: string }
interface Kid { id: string; full_name: string | null; timezone: string | null }

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
  const [weekdays, setWeekdays] = useState<number[]>([]);
  const [timeLocal, setTimeLocal] = useState('17:00');
  const [durationMin, setDurationMin] = useState(60);
  const [classesPerWeek, setClassesPerWeek] = useState<1 | 2>(1);
  const [anchorTz, setAnchorTz] = useState(FALLBACK_TZ);

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
        sb.from('cohorts').select('id, track, level, ratio, status').in('status', ['gathering', 'ready', 'active']).order('created_at', { ascending: false }),
      ]);
      setTeachers((tRes.data ?? []) as Teacher[]);
      setCohorts((cRes.data ?? []) as Cohort[]);
    })();
  }, [open, adminId]);

  // Load kids when a cohort is chosen.
  const loadKids = useCallback(async (cid: string) => {
    if (!cid) { setKids([]); return; }
    const sb = createClient();
    const { data: enr } = await sb.from('enrollments').select('user_id').eq('cohort_id', cid).eq('status', 'active');
    const ids = (enr ?? []).map((e: { user_id: string }) => e.user_id);
    if (ids.length === 0) { setKids([]); return; }
    const { data: profs } = await sb.from('profiles').select('id, full_name, timezone').in('id', ids);
    setKids((profs ?? []) as Kid[]);
  }, []);

  useEffect(() => { loadKids(cohortId); }, [cohortId, loadKids]);

  const teacher = useMemo(() => teachers.find((t) => t.id === teacherId), [teachers, teacherId]);

  // Default the anchor tz to the selected teacher's tz.
  useEffect(() => {
    if (teacher?.timezone) setAnchorTz(teacher.timezone);
  }, [teacher]);

  // Enforce weekday count against cadence.
  const toggleDay = (d: number) => {
    setWeekdays((prev) => {
      if (prev.includes(d)) return prev.filter((x) => x !== d);
      if (prev.length >= classesPerWeek) {
        // replace oldest when at capacity
        return [...prev.slice(1), d];
      }
      return [...prev, d].sort((a, b) => a - b);
    });
  };
  const setCadence = (n: 1 | 2) => {
    setClassesPerWeek(n);
    setWeekdays((prev) => prev.slice(0, n));
  };

  // Live preview: next occurrence rendered in every relevant tz.
  const preview = useMemo(() => {
    if (!startDate || weekdays.length !== classesPerWeek || !timeLocal) return null;
    const slots = generateOccurrences(
      { startDate, daysOfWeek: weekdays, timeLocal, durationMin, timezone: anchorTz },
      1
    );
    return slots[0]?.slotStart ?? null;
  }, [startDate, weekdays, classesPerWeek, timeLocal, durationMin, anchorTz]);

  const valid = teacherId && cohortId && startDate && timeLocal && weekdays.length === classesPerWeek;

  const submit = async () => {
    setBusy(true); setErr(null);
    try {
      const res = await fetch('/api/admin/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cohortId, teacherId, startDate, daysOfWeek: weekdays,
          timeLocal, durationMin, timezone: anchorTz, classesPerWeek,
        }),
      });
      const json = await res.json();
      if (json.ok) { onCreated?.(); onClose(); }
      else setErr(json.errors?.join(', ') || json.error || 'Could not create schedule.');
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
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>Schedule a batch</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400" aria-label="Close"><X className="w-4 h-4" /></button>
        </div>

        {/* Teacher + cohort */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <Field label="Teacher">
            <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className={selectCls}>
              <option value="">Select teacher…</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name || 'Unnamed'}{t.timezone ? ` · ${t.timezone}` : ''}</option>)}
            </select>
          </Field>
          <Field label="Batch (cohort)">
            <select value={cohortId} onChange={(e) => setCohortId(e.target.value)} className={selectCls}>
              <option value="">Select batch…</option>
              {cohorts.map((c) => <option key={c.id} value={c.id}>{c.track} · {c.level} · {c.ratio}</option>)}
            </select>
          </Field>
        </div>

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

        {/* Start date + time + duration + anchor tz */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="Start date"><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} /></Field>
          <Field label="Time"><input type="time" value={timeLocal} onChange={(e) => setTimeLocal(e.target.value)} className={inputCls} /></Field>
          <Field label="Duration (min)"><input type="number" min={15} step={15} value={durationMin} onChange={(e) => setDurationMin(Number(e.target.value) || 60)} className={inputCls} /></Field>
          <Field label="Time is set in">
            <select value={anchorTz} onChange={(e) => setAnchorTz(e.target.value)} className={selectCls}>
              {tzOptions.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </Field>
        </div>

        {/* Dual-timezone preview */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 mb-4">
          <div className="flex items-center gap-1.5 mb-2 text-slate-500">
            <Globe className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ fontFamily: 'var(--font-grotesk)' }}>Next class, everyone&apos;s local time</span>
          </div>
          {preview ? (
            <div className="space-y-1.5 text-sm">
              <TzRow label={`Teacher${teacher?.full_name ? ` (${teacher.full_name.split(' ')[0]})` : ''}`} tz={teacher?.timezone || anchorTz} iso={preview} />
              {kids.length === 0 && <p className="text-xs text-slate-400">No enrolled kids yet — they&apos;ll join future classes.</p>}
              {kids.map((k) => <TzRow key={k.id} label={k.full_name?.split(' ')[0] || 'Kid'} tz={k.timezone || anchorTz} iso={preview} muted={!k.timezone} />)}
            </div>
          ) : (
            <p className="text-xs text-slate-400">Pick teacher, batch, day{classesPerWeek === 2 ? 's' : ''}, start date &amp; time to preview.</p>
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
