'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Loader2, RefreshCw, Star, AlertTriangle, Video, Users, CheckCircle2, XCircle, Clock,
} from 'lucide-react';
import { subjectLabel } from '@/lib/trial/subjects';
import { gradeTag, gradeName } from '@/lib/grade/tag';

/**
 * SARIRO — every trial, and everything hanging off it
 * ============================================================================
 * A super-admin asking "is the trial funnel working" was, until now, asking
 * four screens and doing the join in their head: the booking on one, the child
 * on another, the seller on the pipeline board, and the write-up somewhere
 * else again.
 *
 * ── The column that matters most is the one that is usually empty ───────────
 * "No lead" — a trial with a child in it and nothing on anybody's desk. That
 * is not a display problem, it is a family who booked a free class and whom
 * nobody was ever told to ring, and it was the live state of this system for
 * months: a CHECK constraint rejected every lead the public form wrote, inside
 * a swallowed promise, and nothing anywhere said so.
 *
 * So it is a red badge rather than a blank cell, and it sorts to the top.
 */

interface StudentRow {
  id: string;
  name: string;
  phone: string | null;
  grade: number | null;
  paused: boolean;
  attendance: string | null;
  teacherRating: number | null;
  teacherRemarks: string | null;
  interest: string | null;
  studentRating: number | null;
  lead: {
    id: string;
    stage: string;
    trialStatus: string | null;
    saleStage: string | null;
    sellerName: string | null;
    saleValue: number | null;
  } | null;
}

interface TrialRow {
  id: string;
  slotStart: string;
  slotEnd: string;
  status: string;
  subject: string | null;
  joinUrl: string | null;
  teacherName: string | null;
  students: StudentRow[];
  hasLead: boolean;
  seats: number;
}

type Filter = 'all' | 'upcoming' | 'done' | 'no_lead';

export default function TrialManagementPanel() {
  const [trials, setTrials] = useState<TrialRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/trials');
      const json = await res.json();
      if (!json?.ok) throw new Error(json?.message || 'Could not load the trials.');
      setTrials(json.trials as TrialRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the trials.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const shown = useMemo(() => {
    const rows = trials ?? [];
    const now = Date.now();
    const picked =
      filter === 'upcoming' ? rows.filter((t) => Date.parse(t.slotStart) >= now && t.status === 'scheduled')
      : filter === 'done' ? rows.filter((t) => t.status === 'completed')
      : filter === 'no_lead' ? rows.filter((t) => !t.hasLead && t.seats > 0)
      : rows;

    /* Trials with nobody on a desk first, whatever the filter. It is the one
       row on this screen that costs money every hour it stays true. */
    return [...picked].sort((a, b) => {
      if (a.hasLead !== b.hasLead) return a.hasLead ? 1 : -1;
      return Date.parse(b.slotStart) - Date.parse(a.slotStart);
    });
  }, [trials, filter]);

  const orphans = (trials ?? []).filter((t) => !t.hasLead && t.seats > 0).length;

  if (loading && !trials) {
    return (
      <div className="card card-md flex items-center justify-center py-14">
        <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card card-md">
        <p className="text-sm text-rose-700">{error}</p>
        <button onClick={() => void load()} className="mt-3 text-xs font-bold text-blue-700 hover:underline">Try again</button>
      </div>
    );
  }

  return (
    <div className="card card-md">
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-2" style={{ fontFamily: 'var(--font-grotesk)' }}>
          <Users className="w-4 h-4 text-slate-400" /> Trial management
          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {(trials ?? []).length}
          </span>
        </h2>
        <button onClick={() => void load()} className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1">
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {orphans > 0 && (
        <p className="mb-3 text-sm rounded-xl border border-red-200 bg-red-50 text-red-900 px-3 py-2 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            <strong>{orphans}</strong> {orphans === 1 ? 'trial has' : 'trials have'} a child booked and no lead
            behind {orphans === 1 ? 'it' : 'them'} — nobody has been told to ring {orphans === 1 ? 'that family' : 'those families'}.
          </span>
        </p>
      )}

      <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5 mb-3 w-fit">
        {([['all', 'All'], ['upcoming', 'Upcoming'], ['done', 'Finished'], ['no_lead', 'No lead']] as [Filter, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
              filter === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="text-sm text-slate-500 py-6 text-center">
          {filter === 'no_lead' ? 'Every trial has a lead behind it. That is the good version.' : 'No trials here.'}
        </p>
      ) : (
        <ul className="space-y-2.5">
          {shown.map((t) => <TrialCardRow key={t.id} trial={t} />)}
        </ul>
      )}
    </div>
  );
}

function TrialCardRow({ trial }: { trial: TrialRow }) {
  const when = new Date(trial.slotStart).toLocaleString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });

  return (
    <li className={`rounded-xl border p-3 ${trial.hasLead ? 'border-slate-200 bg-white' : 'border-red-200 bg-red-50/40'}`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-900">
            {trial.subject ? subjectLabel(trial.subject) : 'Trial class'}
            <span className="ml-2 text-[11px] font-semibold text-slate-500">{when}</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {trial.teacherName ?? 'No teacher'} · {trial.seats} {trial.seats === 1 ? 'seat' : 'seats'} · {trial.status}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {!trial.hasLead && trial.seats > 0 && (
            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-red-100 text-red-700">No lead</span>
          )}
          {trial.joinUrl && (
            <a href={trial.joinUrl} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-slate-700" title="Join link">
              <Video className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>

      {trial.students.length === 0 ? (
        <p className="mt-2 text-[11px] text-amber-700">No children recorded on this booking.</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {trial.students.map((s) => (
            <li key={s.id} className="rounded-lg bg-slate-50 px-2.5 py-2 text-[11px]">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-800">{s.name}</span>
                <span className="px-1 py-0.5 rounded text-[9px] font-black bg-slate-200 text-slate-600" title={gradeName(s.grade)}>{gradeTag(s.grade)}</span>
                {s.paused && <span className="px-1 py-0.5 rounded text-[9px] font-black bg-red-100 text-red-700">PAUSED</span>}

                {s.attendance === 'present' && <span className="inline-flex items-center gap-0.5 text-green-700 font-bold"><CheckCircle2 className="w-3 h-3" /> attended</span>}
                {s.attendance === 'absent' && <span className="inline-flex items-center gap-0.5 text-rose-700 font-bold"><XCircle className="w-3 h-3" /> no-show</span>}
                {s.attendance === null && <span className="inline-flex items-center gap-0.5 text-slate-400"><Clock className="w-3 h-3" /> not marked</span>}

                {s.teacherRating != null && (
                  <span className="inline-flex items-center gap-0.5 font-bold text-amber-700">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />{s.teacherRating} teacher
                  </span>
                )}
                {s.studentRating != null && (
                  <span className="inline-flex items-center gap-0.5 font-bold text-blue-700">
                    <Star className="w-3 h-3 fill-blue-400 text-blue-400" />{s.studentRating} family
                  </span>
                )}
              </div>

              <div className="mt-1 text-slate-500">
                {s.lead ? (
                  <>
                    <span className="font-semibold text-slate-700">{s.lead.sellerName ?? 'Unassigned'}</span>
                    {' · '}{s.lead.stage}
                    {s.lead.trialStatus ? ` · ${s.lead.trialStatus}` : ''}
                    {s.lead.saleStage ? ` · ${s.lead.saleStage}` : ''}
                  </>
                ) : (
                  <span className="text-red-700 font-bold">No lead — nobody has been told to ring them.</span>
                )}
              </div>

              {s.teacherRemarks && (
                <p className="mt-1 text-slate-600 leading-snug">“{s.teacherRemarks}”</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
