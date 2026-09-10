'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, CheckCircle2, GraduationCap, AlertTriangle } from 'lucide-react';
import { MIN_GRADE, MAX_GRADE } from '@/lib/trial/grade-band';

/**
 * SARIRO — the trial seats nobody recorded a grade for
 * ============================================================================
 * A trial holds four children within a year of each other, and the first child
 * to book fixes the band. A seat with no grade cannot be banded at all — so
 * joinable() refuses everybody, the class stops being offered as a class to
 * JOIN, and the next family who books opens a brand new one instead of taking
 * a seat.
 *
 * Every seat in production is in that state, which means four upcoming classes
 * are invisible as joining opportunities: twelve empty seats, and a teacher's
 * evening spent again for every booking that should have filled one.
 *
 * Each answer here is worth three seats. That is the whole reason this is a
 * panel and not a field buried in a profile editor.
 */

interface Seat {
  studentId: string;
  name: string;
  email: string | null;
  profileGrade: number | null;
  seatCount: number;
  nextTrial: string | null;
}

const GRADES = Array.from({ length: MAX_GRADE - MIN_GRADE + 1 }, (_, i) => MIN_GRADE + i);

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

export default function TrialGradesPanel() {
  const [seats, setSeats] = useState<Seat[] | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/trial-grades');
      const json = await res.json();
      if (!json.ok) { setFailed(json.message ?? 'Could not load these.'); return; }
      setSeats(json.seats as Seat[]);
      // A grade already on the profile is almost certainly the answer.
      setDraft(Object.fromEntries(
        (json.seats as Seat[]).filter((s) => s.profileGrade).map((s) => [s.studentId, s.profileGrade!])
      ));
    } catch {
      setFailed('Could not load these.');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const save = async (s: Seat) => {
    const grade = draft[s.studentId];
    if (!grade) return;
    setBusy(s.studentId);
    setNote(null);
    try {
      const res = await fetch('/api/admin/trial-grades', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: s.studentId, grade }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) { setNote(json.message || json.error || 'That did not save.'); return; }
      setNote(
        `${s.name} is grade ${json.grade}. ` +
        `${json.seatsFixed} ${json.seatsFixed === 1 ? 'class is' : 'classes are'} now open to grades ` +
        `${Math.max(MIN_GRADE, json.grade - 1)}–${Math.min(MAX_GRADE, json.grade + 1)}.`
      );
      await load();
    } catch {
      setNote('Network error — please try again.');
    } finally {
      setBusy(null);
    }
  };

  if (failed) {
    return <div className="card card--compact"><p className="text-[13px] text-slate-600">{failed}</p></div>;
  }
  if (!seats) {
    return (
      <div className="flex items-center justify-center py-8 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }
  if (seats.length === 0) {
    return (
      <div className="card card--compact flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-slate-300 shrink-0" />
        <p className="text-[13.5px] text-slate-600">
          Every child in an upcoming trial has a grade recorded, so every class can take joiners.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#B45309' }} />
        <p className="text-[13.5px] text-slate-700">
          <span className="font-bold">{seats.length}</span>{' '}
          {seats.length === 1 ? 'child has' : 'children have'} no grade recorded, so the classes they
          are in cannot take anybody else. Each answer opens up to three seats that are currently
          invisible on the booking page.
        </p>
      </div>

      {note && (
        <div className="card card--compact bg-slate-50">
          <p className="text-[13px] text-slate-700">{note}</p>
        </div>
      )}

      <div className="space-y-2">
        {seats.map((s) => (
          <div key={s.studentId} className="card card--compact">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <p className="font-bold text-slate-900 text-[14.5px] truncate">{s.name}</p>
                <p className="text-[12.5px] text-slate-500 mt-0.5">
                  {s.nextTrial ? `Trial ${when(s.nextTrial)}` : 'Upcoming trial'}
                  {s.seatCount > 1 ? ` · ${s.seatCount} classes` : ''}
                  {s.email ? ` · ${s.email}` : ''}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <GraduationCap className="w-4 h-4 text-slate-400" />
                <select
                  value={draft[s.studentId] ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, [s.studentId]: Number(e.target.value) }))}
                  className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-[13px] text-slate-800"
                >
                  <option value="">Grade…</option>
                  {GRADES.map((g) => <option key={g} value={g}>Grade {g}</option>)}
                </select>
                <button
                  onClick={() => void save(s)}
                  disabled={!draft[s.studentId] || busy === s.studentId}
                  className="h-9 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[12px] font-bold disabled:opacity-50 inline-flex items-center gap-1.5"
                  style={{ fontFamily: 'var(--font-grotesk)' }}
                >
                  {busy === s.studentId && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
