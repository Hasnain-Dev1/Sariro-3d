'use client';

import { useCallback, useEffect, useState } from 'react';
import { Video, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * SARIRO — the door to your classes
 * ============================================================================
 * A normal class inherits its link from its cohort. A trial has no cohort, so
 * until this existed every trial ever booked had google_meet_url = NULL, and
 * the child's dashboard reached the join moment with nothing to join.
 *
 * ── Why one permanent room, not a link per class ────────────────────────────
 * A link per booking means Google Calendar API access, OAuth consent and a
 * service account with domain delegation. A teacher's own room is a URL they
 * already have, it never expires, and it is the room they are sitting in
 * anyway. One field, filled once.
 *
 * ── Why saving it reaches backwards ─────────────────────────────────────────
 * The teacher is not the one waiting. Somewhere there is a child with a trial
 * booked and no way in; saving here puts the link on every upcoming class of
 * theirs that has none, and says how many that was. A teacher who sees "4
 * classes now have a link" understands what they just fixed.
 */

export default function TeacherRoomEditor() {
  const [value, setValue] = useState('');
  const [saved, setSaved] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/teacher/room');
      const j = await res.json().catch(() => null);
      if (j?.ok) {
        setValue(j.meetUrl ?? '');
        setSaved(j.meetUrl ?? null);
      }
    } catch {
      /* Offline or signed out. The field stays empty and saving will say so. */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      const res = await fetch('/api/teacher/room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetUrl: value.trim() }),
      });
      const j = await res.json().catch(() => null);
      if (!res.ok || !j?.ok) {
        setError(j?.message ?? 'Could not save that. Try again in a moment.');
        return;
      }
      setSaved(j.meetUrl ?? null);
      setNote(
        j.backfilled > 0
          ? `Saved. ${j.backfilled} upcoming ${j.backfilled === 1 ? 'class' : 'classes'} had no link and now ${j.backfilled === 1 ? 'does' : 'do'}.`
          : 'Saved. Every class you teach from now on opens here.'
      );
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  const dirty = value.trim() !== (saved ?? '');

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h3
        className="text-sm font-extrabold text-slate-900 flex items-center gap-2"
        style={{ fontFamily: 'var(--font-jakarta)' }}
      >
        <Video className="w-4 h-4 text-green-600" />
        Your class room
      </h3>
      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
        The link your students click to join you. Paste your personal Google Meet, Zoom or Teams room —
        the same one every time. <span className="font-semibold text-slate-700">Trial classes have no link
        until you set this</span>, so a child booked in with you cannot get in.
      </p>

      {loading ? (
        <div className="mt-4 h-11 rounded-xl bg-slate-50 animate-pulse" />
      ) : (
        <>
          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <input
              value={value}
              onChange={(e) => { setValue(e.target.value); setNote(null); setError(null); }}
              inputMode="url"
              placeholder="https://meet.google.com/abc-defg-hij"
              className="flex-1 h-11 px-3 rounded-xl border border-slate-200 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            />
            <button
              onClick={save}
              disabled={busy || !dirty}
              className="h-11 px-5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {saved && !dirty ? 'Saved' : 'Save room'}
            </button>
          </div>

          {error && (
            <p className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {error}
            </p>
          )}
          {note && (
            <p className="mt-2 text-xs text-green-800 bg-green-50 border border-green-200 rounded-xl px-3 py-2 flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {note}
            </p>
          )}
          {!saved && !note && (
            <p className="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-start gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              No room set. Any trial booked with you right now has no join button on the student&apos;s side.
            </p>
          )}
        </>
      )}
    </div>
  );
}
