'use client';

import { useCallback, useEffect, useState } from 'react';
import { X, Users, UserPlus, UserMinus, PauseCircle, Loader2, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

/* ════════════════════════════════════════════════════════════════════════
   ManageBatchesModal — admin/super-admin management of recurring schedules:
   change teacher, pause (batch), and add/remove kids. Calls
   POST /api/admin/schedule/manage. Bounded, confirm-on-destructive.
   ════════════════════════════════════════════════════════════════════════ */

interface Sched {
  id: string; cohort_id: string; teacher_id: string;
  days_of_week: number[]; time_local: string; timezone: string;
  classes_per_week: number; status: string;
  cohorts: { track: string; level: string; ratio: string; batch_code: string | null } | null;
  teacher: { full_name: string | null } | null;
}
interface Person { id: string; full_name: string | null; email?: string | null }

const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ManageBatchesModal({
  open, onClose, onToast, adminId,
}: { open: boolean; onClose: () => void; onToast?: (msg: string, kind?: 'success' | 'error') => void; adminId?: string | null }) {
  const [schedules, setSchedules] = useState<Sched[]>([]);
  const [teachers, setTeachers] = useState<Person[]>([]);
  const [students, setStudents] = useState<Person[]>([]);
  const [kids, setKids] = useState<Record<string, Person[]>>({});
  const [rosters, setRosters] = useState<Record<string, Person[]>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const sb = createClient();
    // Teachers — scoped to this admin's roster when adminId is set.
    let tq = sb.from('profiles').select('id, full_name').or('role.eq.teacher,is_teacher.eq.true');
    if (adminId) tq = tq.eq('reporting_admin_id', adminId);
    const tRes = await tq.order('full_name');
    const teacherList = (tRes.data ?? []) as Person[];

    // Schedules — restricted to those teachers when scoped.
    let sq = sb.from('cohort_schedules')
      .select('id, cohort_id, teacher_id, days_of_week, time_local, timezone, classes_per_week, status, cohorts(track, level, ratio, batch_code), teacher:profiles!teacher_id(full_name)');
    if (adminId) sq = sq.in('teacher_id', teacherList.length ? teacherList.map((t) => t.id) : ['00000000-0000-0000-0000-000000000000']);

    const [sRes, stRes] = await Promise.all([
      sq.order('created_at', { ascending: false }),
      sb.from('profiles').select('id, full_name, email').or('role.eq.student,is_student.eq.true').order('full_name').limit(500),
    ]);
    const scheds = (sRes.data ?? []) as unknown as Sched[];
    setSchedules(scheds);
    setTeachers(teacherList);
    setStudents((stRes.data ?? []) as Person[]);

    // Roster: enrolled kids' emails per cohort, so a batch maps to its kids.
    const cohortIds = [...new Set(scheds.map((s) => s.cohort_id).filter(Boolean))];
    if (cohortIds.length) {
      const { data: enr } = await sb.from('enrollments').select('user_id, cohort_id').in('cohort_id', cohortIds).eq('status', 'active');
      const uids = [...new Set((enr ?? []).map((e: { user_id: string }) => e.user_id))];
      let profs: Person[] = [];
      if (uids.length) {
        const { data } = await sb.from('profiles').select('id, full_name, email').in('id', uids);
        profs = (data ?? []) as Person[];
      }
      const byId = new Map(profs.map((p) => [p.id, p]));
      const map: Record<string, Person[]> = {};
      for (const e of enr ?? []) {
        const p = byId.get((e as { user_id: string }).user_id);
        if (!p) continue;
        (map[(e as { cohort_id: string }).cohort_id] ??= []).push(p);
      }
      setRosters(map);
    } else {
      setRosters({});
    }
    setLoading(false);
  }, [adminId]);

  useEffect(() => { if (open) Promise.resolve().then(load); }, [open, load]);

  const loadKids = useCallback(async (cohortId: string) => {
    const sb = createClient();
    const { data: enr } = await sb.from('enrollments').select('user_id').eq('cohort_id', cohortId).eq('status', 'active');
    const ids = (enr ?? []).map((e: { user_id: string }) => e.user_id);
    if (ids.length === 0) { setKids((k) => ({ ...k, [cohortId]: [] })); return; }
    const { data: profs } = await sb.from('profiles').select('id, full_name, email').in('id', ids);
    setKids((k) => ({ ...k, [cohortId]: (profs ?? []) as Person[] }));
  }, []);

  const call = async (payload: Record<string, unknown>, okMsg: string) => {
    setBusy(true);
    try {
      const res = await fetch('/api/admin/schedule/manage', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.ok) { onToast?.(okMsg); await load(); }
      else onToast?.(json.error || 'Action failed', 'error');
    } catch { onToast?.('Network error', 'error'); }
    finally { setBusy(false); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>Manage batches</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400" aria-label="Refresh"><RefreshCw className="w-4 h-4" /></button>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400" aria-label="Close"><X className="w-4 h-4" /></button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
        ) : schedules.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-10">No schedules yet. Use “Schedule Batch” to create one.</p>
        ) : (
          <div className="space-y-3">
            {schedules.map((s) => (
              <div key={s.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <p className="font-extrabold text-slate-900 flex items-center gap-2 flex-wrap" style={{ fontFamily: 'var(--font-jakarta)' }}>
                      {s.cohorts?.batch_code && (
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-900 text-white tracking-wider">{s.cohorts.batch_code}</span>
                      )}
                      {s.cohorts ? `${s.cohorts.track} · ${s.cohorts.level} · ${s.cohorts.ratio}` : 'Batch'}
                    </p>
                    <p className="text-xs text-slate-500">
                      {s.days_of_week.map((d) => WD[d]).join(', ')} · {s.time_local} {s.timezone} · {s.classes_per_week}/wk · teacher: {s.teacher?.full_name || '—'}
                    </p>
                    {/* Enrolled kids' emails — maps this batch to its kids at a glance */}
                    <p className="text-[11px] text-slate-500 mt-1">
                      <span className="font-bold text-slate-600">Kids ({(rosters[s.cohort_id] ?? []).length}):</span>{' '}
                      {(rosters[s.cohort_id] ?? []).length === 0
                        ? <span className="text-slate-400">none enrolled yet</span>
                        : (rosters[s.cohort_id] ?? []).map((k) => k.email || k.full_name || 'unknown').join(', ')}
                    </p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${s.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{s.status}</span>
                </div>

                {/* Change / remove teacher */}
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-xs font-bold text-slate-600 shrink-0">Teacher:</label>
                  <select
                    value={s.teacher_id} disabled={busy}
                    onChange={(e) => { if (e.target.value !== s.teacher_id) call({ action: 'change_teacher', scheduleId: s.id, teacherId: e.target.value }, 'Teacher reassigned'); }}
                    className="flex-1 min-h-[36px] px-2 rounded-lg border border-slate-200 text-sm">
                    {teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name || 'Unnamed'}</option>)}
                  </select>
                  <button
                    disabled={busy || s.status !== 'active'}
                    onClick={() => { if (confirm('Remove the teacher from this batch? Future classes will be paused until you assign a new teacher.')) call({ action: 'remove_teacher', scheduleId: s.id }, 'Teacher removed; future classes paused'); }}
                    className="inline-flex items-center gap-1 min-h-[36px] px-2.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold disabled:opacity-40 shrink-0">
                    <UserMinus className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>

                {/* Pause batch */}
                <PauseRow disabled={busy} onPause={(start, end) => call({ action: 'pause_batch', scheduleId: s.id, pauseStart: start, pauseEnd: end }, 'Batch paused; classes shifted forward')} />

                {/* Manage kids */}
                <button
                  onClick={() => { const nx = expanded === s.id ? null : s.id; setExpanded(nx); if (nx) loadKids(s.cohort_id); }}
                  className="mt-2 text-xs font-bold text-blue-600 hover:text-blue-700">
                  {expanded === s.id ? 'Hide kids' : 'Manage kids'}
                </button>
                {expanded === s.id && (
                  <div className="mt-2 rounded-lg bg-slate-50 p-3">
                    <div className="space-y-1.5 mb-3">
                      {(kids[s.cohort_id] ?? []).length === 0 && <p className="text-xs text-slate-400">No active kids.</p>}
                      {(kids[s.cohort_id] ?? []).map((k) => (
                        <div key={k.id} className="flex items-center justify-between gap-2 text-sm">
                          <span className="text-slate-700 truncate min-w-0">{k.full_name || 'Unnamed'} <span className="text-slate-400">· {k.email || 'no email'}</span></span>
                          <button disabled={busy}
                            onClick={() => { if (confirm(`Remove ${k.full_name || 'this kid'} from the batch?`)) call({ action: 'remove_kid', cohortId: s.cohort_id, studentId: k.id }, 'Kid removed').then(() => loadKids(s.cohort_id)); }}
                            className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 text-xs font-bold">
                            <UserMinus className="w-3.5 h-3.5" /> Remove
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-slate-400 shrink-0" />
                      <select disabled={busy} defaultValue=""
                        onChange={(e) => { const id = e.target.value; if (id) { call({ action: 'add_kid', cohortId: s.cohort_id, studentId: id }, 'Kid added').then(() => loadKids(s.cohort_id)); e.target.value = ''; } }}
                        className="flex-1 min-h-[36px] px-2 rounded-lg border border-slate-200 text-sm bg-white">
                        <option value="">Add a kid…</option>
                        {students.map((st) => <option key={st.id} value={st.id}>{st.full_name || 'Unnamed'}</option>)}
                      </select>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PauseRow({ disabled, onPause }: { disabled: boolean; onPause: (start: string, end: string) => void }) {
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <PauseCircle className="w-4 h-4 text-amber-500 shrink-0" />
      <input type="date" value={start} onChange={(e) => setStart(e.target.value)} disabled={disabled} className="min-h-[36px] px-2 rounded-lg border border-slate-200 text-sm" />
      <span className="text-xs text-slate-400">→</span>
      <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} disabled={disabled} className="min-h-[36px] px-2 rounded-lg border border-slate-200 text-sm" />
      <button
        onClick={() => { if (start && end) onPause(start, end); }}
        disabled={disabled || !start || !end}
        className="min-h-[36px] px-3 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold disabled:opacity-40">
        Pause
      </button>
    </div>
  );
}
