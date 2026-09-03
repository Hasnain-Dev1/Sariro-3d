'use client';

import { useEffect, useState } from 'react';
import { Coins, Loader2, AlertTriangle } from 'lucide-react';

/**
 * SARIRO — students about to run out of credits
 * =========================================================
 * V2 §26 (teacher view) and §63 (super-admin view). One component: the server
 * decides who you can see, so a teacher gets their own batches and HR gets
 * everybody without two components drifting on what "low" means.
 *
 * ── Why the date is stated plainly ──────────────────────────────────────────
 * The date comes from counting their scheduled classes, not from a forecast —
 * one credit is one class, so the class they cannot pay for is already on the
 * calendar. That makes it safe to say out loud to a parent, which is what this
 * screen is ultimately for. Where nothing is scheduled that far ahead the
 * column says so rather than guessing.
 */

interface AtRiskStudent {
  student_id: string;
  student_name: string;
  balance: number;
  course: string | null;
  level: string | null;
  batch_code: string | null;
  teacher_name: string | null;
  scheduled_ahead: number;
  runs_out_at: string | null;
}

/** Emptier is more urgent — one hue, darker as it runs down. */
function toneFor(balance: number): { fg: string; bg: string } {
  if (balance <= 0) return { fg: '#991B1B', bg: '#991B1B14' };
  if (balance <= 1) return { fg: '#B91C1C', bg: '#B91C1C14' };
  if (balance <= 2) return { fg: '#C2410C', bg: '#C2410C14' };
  return { fg: '#B45309', bg: '#B4530914' };
}

function whenDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const days = Math.ceil((d.getTime() - Date.now()) / 86_400_000);
  const date = d.toLocaleDateString([], { day: 'numeric', month: 'short' });
  if (days <= 0) return `${date} (today)`;
  if (days === 1) return `${date} (tomorrow)`;
  return `${date} (${days} days)`;
}

export default function LowCreditPanel({ compact = false }: { compact?: boolean }) {
  const [students, setStudents] = useState<AtRiskStudent[] | null>(null);
  const [threshold, setThreshold] = useState(4);
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/credits/at-risk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        const json = await res.json();
        if (cancelled) return;
        if (!json.ok) { setFailed(json.message ?? 'Could not load credit alerts.'); return; }
        setStudents(json.students as AtRiskStudent[]);
        setThreshold(json.threshold as number);
      } catch {
        if (!cancelled) setFailed('Could not load credit alerts.');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (failed) {
    return (
      <div className="card card--compact">
        <p className="text-[13px] text-slate-600">{failed}</p>
      </div>
    );
  }

  if (!students) {
    return (
      <div className="flex items-center justify-center py-8 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="card card--compact flex items-center gap-3">
        <Coins className="w-5 h-5 text-slate-300 shrink-0" />
        <p className="text-[13.5px] text-slate-600">
          Nobody is below {threshold} credits. Everyone can reach their next class.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <AlertTriangle className="w-4 h-4" style={{ color: '#B45309' }} />
        <p className="text-[13.5px] text-slate-700">
          <span className="font-bold">{students.length}</span>{' '}
          {students.length === 1 ? 'student is' : 'students are'} below {threshold} credits.
        </p>
      </div>

      <div className="space-y-2">
        {students.slice(0, compact ? 5 : students.length).map((s) => {
          const tone = toneFor(s.balance);
          return (
            <div key={s.student_id} className="card card--compact">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-[14.5px]">{s.student_name}</span>
                    <span
                      className="text-[10px] font-black tracking-wider px-1.5 py-0.5 rounded uppercase"
                      style={{ color: tone.fg, background: tone.bg }}
                    >
                      {s.balance <= 0 ? 'Out of credits' : 'Low credits'}
                    </span>
                  </div>
                  <p className="text-[12.5px] text-slate-500 mt-0.5">
                    {[s.course, s.level, s.batch_code].filter(Boolean).join(' · ') || 'No course on file'}
                    {s.teacher_name ? ` · ${s.teacher_name}` : ''}
                  </p>
                  <p className="text-[12.5px] mt-1" style={{ color: tone.fg }}>
                    {s.runs_out_at
                      ? `Credits run out at the class on ${whenDate(s.runs_out_at)}`
                      : s.scheduled_ahead === 0
                        ? 'No classes scheduled ahead'
                        : `Covers all ${s.scheduled_ahead} scheduled ${s.scheduled_ahead === 1 ? 'class' : 'classes'}`}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-2xl font-extrabold tabular-nums leading-none" style={{ color: tone.fg }}>
                    {s.balance}
                  </p>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mt-1">
                    credits
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {compact && students.length > 5 && (
        <p className="text-[12.5px] text-slate-500">and {students.length - 5} more.</p>
      )}
    </div>
  );
}
