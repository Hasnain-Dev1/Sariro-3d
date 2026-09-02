'use client';

import { useState } from 'react';
import { Loader2, ClipboardCheck } from 'lucide-react';
import { CATEGORIES, saveMonitoring } from '@/lib/dashboard/monitoring';

/**
 * SARIRO — recording an observation
 * =========================================================
 * V2 §29-30. The admin's side of monitoring.
 *
 * ── Every category can be left blank, on purpose ────────────────────────────
 * An observer who did not see something should say nothing about it. A forced
 * middling score for "technical execution" in a class with no technical
 * component is worse than a gap: it drags the average toward the middle and
 * reads as an observation that was never made. Blank is a real answer here, and
 * the overall score is computed only from what was filled in.
 *
 * ── Why the written fields are not optional-looking ─────────────────────────
 * §32 asks that a teacher understand why they got their score. Nine numbers do
 * not explain themselves, so "what went well" sits directly under the scores
 * rather than collapsed behind a toggle — the form should make writing
 * something feel like the normal thing to do.
 */

const SCORES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function MonitoringForm({
  teacherId,
  teacherName,
  bookingId,
  cohortId,
  onDone,
  onToast,
}: {
  teacherId: string;
  teacherName?: string;
  bookingId?: string | null;
  cohortId?: string | null;
  onDone?: () => void;
  onToast?: (msg: string, kind?: 'success' | 'error') => void;
}) {
  const [scores, setScores] = useState<Record<string, number | null>>({});
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovements] = useState('');
  const [actionItems, setActionItems] = useState('');
  const [saving, setSaving] = useState(false);

  const scoredCount = CATEGORIES.filter((c) => scores[c.key] != null).length;
  const running =
    scoredCount > 0
      ? Math.round(
          (CATEGORIES.reduce((sum, c) => sum + (scores[c.key] ?? 0), 0) / scoredCount) * 10
        ) / 10
      : null;

  const submit = async () => {
    if (scoredCount === 0 && !strengths.trim() && !improvements.trim()) {
      onToast?.('Score at least one category, or write something.', 'error');
      return;
    }
    setSaving(true);
    const res = await saveMonitoring({
      teacherId,
      bookingId,
      cohortId,
      scores,
      strengths,
      improvements,
      actionItems,
    });
    setSaving(false);
    if (res.success) {
      onToast?.('Observation saved — the teacher can see it now', 'success');
      setScores({});
      setStrengths('');
      setImprovements('');
      setActionItems('');
      onDone?.();
    } else {
      onToast?.(res.error ?? 'Could not save the observation', 'error');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <div>
          <h3
            className="text-base font-extrabold text-slate-900"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            Observing {teacherName ?? 'this teacher'}
          </h3>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Leave anything you did not see blank — it will not count against them.
          </p>
        </div>
        {running !== null && (
          <span className="text-[13px] font-bold text-slate-700 tabular-nums shrink-0">
            {running.toFixed(1)}
            <span className="font-semibold text-slate-400"> / 10 · {scoredCount} scored</span>
          </span>
        )}
      </div>

      <div className="space-y-2.5">
        {CATEGORIES.map((c) => (
          <div key={c.key} className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="sm:w-52 shrink-0">
              <p className="text-[13.5px] font-semibold text-slate-800">{c.label}</p>
              <p className="text-[11.5px] text-slate-500 leading-snug">{c.hint}</p>
            </div>
            <div className="flex flex-wrap gap-1">
              {SCORES.map((n) => {
                const on = scores[c.key] === n;
                return (
                  <button
                    key={n}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setScores((prev) => ({ ...prev, [c.key]: prev[c.key] === n ? null : n }))
                    }
                    className={`min-w-[32px] min-h-[32px] rounded-md text-[12.5px] font-bold tabular-nums transition-colors ${
                      on
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {(
          [
            ['What went well', strengths, setStrengths, 'Name something specific they did.'],
            ['What to work on', improvements, setImprovements, 'One thing, described plainly.'],
            ['Next time', actionItems, setActionItems, 'Something they can actually do.'],
          ] as const
        ).map(([label, val, set, placeholder]) => (
          <div key={label}>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
              {label}
            </label>
            <textarea
              value={val}
              onChange={(e) => set(e.target.value)}
              placeholder={placeholder}
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
              style={{ fontSize: '16px' }}
            />
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={saving}
        className="inline-flex items-center gap-2 px-4 min-h-[42px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold disabled:opacity-50"
        style={{ fontFamily: 'var(--font-grotesk)' }}
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}
        Save observation
      </button>
    </div>
  );
}
