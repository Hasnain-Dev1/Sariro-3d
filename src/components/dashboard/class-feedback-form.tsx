'use client';

import { useState } from 'react';
import { Star, Loader2, CheckCircle2, AlertCircle, Coins } from 'lucide-react';
import { checkFeedback, MIN_REMARK_CHARS, type FeedbackAuthor, type Interest } from '@/lib/dashboard/class-feedback';

/**
 * SARIRO — writing up a class, from either side
 * ============================================================================
 * One form, two audiences, and the difference between them is deliberate.
 *
 * A teacher is paid for the class, so their write-up is required and the form
 * says exactly what is still owed and what it unlocks. Reporting on a class is
 * part of teaching it, and pay is the only lever that reliably produces it.
 *
 * A parent owes us nothing. Their rating is one tap, the words are optional,
 * and nothing is ever blocked. A form that demands a paragraph from a parent is
 * a form that collects nothing from parents.
 *
 * ── Why the teacher is asked about interest ─────────────────────────────────
 * It is the single most useful field a seller has, and only the teacher can
 * answer it — they were in the room. Everything else the seller sees is
 * inferred; this is observed.
 */

export default function ClassFeedbackForm({
  bookingId,
  role,
  subjectStudentId,
  subjectName,
  onSaved,
  compact = false,
}: {
  bookingId: string;
  role: FeedbackAuthor;
  /** The child this is about. Omitted when a parent writes their own. */
  subjectStudentId?: string;
  subjectName?: string;
  onSaved?: (r: { payReleased: boolean; gateMessage: string }) => void;
  compact?: boolean;
}) {
  const [rating, setRating] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [remarks, setRemarks] = useState('');
  const [interest, setInterest] = useState<Interest | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ payReleased: boolean; gateMessage: string } | null>(null);

  const isTeacher = role === 'teacher';
  const shortBy = Math.max(0, MIN_REMARK_CHARS - remarks.trim().length);

  const submit = async () => {
    setError(null);
    const check = checkFeedback(role, rating, remarks);
    if (!check.ok) { setError(check.problem); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/trial/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          subjectStudentId,
          rating,
          remarks: remarks.trim(),
          interestLevel: isTeacher ? interest : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) { setError(json.message || 'Could not save that.'); return; }
      const result = { payReleased: !!json.payReleased, gateMessage: json.gateMessage ?? '' };
      setDone(result);
      onSaved?.(result);
    } catch {
      setError('Network error — please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div className="flex gap-3 p-4 rounded-xl bg-green-50 border border-green-200">
        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-sm font-bold text-green-900" style={{ fontFamily: 'var(--font-grotesk)' }}>
            {isTeacher ? 'Written up' : 'Thank you'}
          </p>
          <p className="text-sm text-green-800 mt-0.5 leading-relaxed">
            {isTeacher
              ? done.payReleased
                ? 'Every student is written up — this class has been added to your earnings.'
                : done.gateMessage || 'Saved.'
              : 'That goes straight to the team who arranged your class.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {subjectName && isTeacher && (
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider" style={{ fontFamily: 'var(--font-grotesk)' }}>
          About {subjectName}
        </p>
      )}

      {/* ── Stars ── */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
          {isTeacher ? 'How did the session go?' : 'How was the class?'}
        </label>
        <div className="flex items-center gap-1" onMouseLeave={() => setHover(null)}>
          {[1, 2, 3, 4, 5].map((n) => {
            const lit = (hover ?? rating ?? 0) >= n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                aria-label={`${n} out of 5`}
                className="p-1 rounded hover:scale-110 transition-transform"
              >
                <Star
                  className={`w-7 h-7 ${lit ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}`}
                />
              </button>
            );
          })}
          {rating && (
            <span className="ml-2 text-xs font-bold text-slate-500" style={{ fontFamily: 'var(--font-grotesk)' }}>
              {rating}/5
            </span>
          )}
        </div>
      </div>

      {/* ── Interest, teacher only ── */}
      {isTeacher && (
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
            Will they join? Your read
          </label>
          <div className="grid grid-cols-3 gap-2">
            {([
              { key: 'hot', label: 'Keen', tone: 'border-green-500 bg-green-50 text-green-700' },
              { key: 'warm', label: 'Maybe', tone: 'border-amber-500 bg-amber-50 text-amber-700' },
              { key: 'cold', label: 'Unlikely', tone: 'border-slate-400 bg-slate-50 text-slate-600' },
            ] as const).map((o) => (
              <button
                key={o.key}
                type="button"
                onClick={() => setInterest(o.key)}
                className={`h-10 rounded-xl text-xs font-bold border-2 transition-colors ${
                  interest === o.key ? o.tone : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                {o.label}
              </button>
            ))}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            You were in the room — this is the one thing the sales team cannot work out for themselves.
          </p>
        </div>
      )}

      {/* ── Words ── */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
          {isTeacher ? 'What happened' : 'Anything you want to add?'}
          {!isTeacher && <span className="ml-1 font-medium normal-case tracking-normal text-slate-400">optional</span>}
        </label>
        <textarea
          value={remarks}
          onChange={(e) => { setRemarks(e.target.value); setError(null); }}
          rows={compact ? 3 : 4}
          placeholder={
            isTeacher
              ? 'What they picked up quickly, what they struggled with, anything the parent should hear.'
              : 'What your child enjoyed, or anything we could do better.'
          }
          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          style={{ fontFamily: 'var(--font-inter)' }}
        />
        {isTeacher && shortBy > 0 && (
          <p className="mt-1 text-[11px] text-slate-400">
            {shortBy} more character{shortBy === 1 ? '' : 's'} — a seller rings the parent off the back of this.
          </p>
        )}
      </div>

      {error && (
        <div className="flex gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 mt-px" /><span>{error}</span>
        </div>
      )}

      <button
        onClick={submit}
        disabled={saving}
        className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
        style={{ fontFamily: 'var(--font-grotesk)' }}
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isTeacher ? <Coins className="w-4 h-4" /> : <Star className="w-4 h-4" />}
        {isTeacher ? 'Submit and release pay' : 'Send feedback'}
      </button>
    </div>
  );
}
