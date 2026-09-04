'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ShieldAlert, ShieldCheck, Loader2, Check } from 'lucide-react';
import {
  fetchPolicyFlags, reviewPolicyFlag, DESIGNATION_LABEL, DESIGNATION_TONE,
  type PolicyFlag,
} from '@/lib/dashboard/messaging';
import { REASON_LABEL, type PolicyReason } from '@/lib/messaging/contact-policy';
import DateRangeFilter from '@/components/dashboard/date-range-filter';
import { resolveRange, inRange, type RangePreset, type DateRange } from '@/lib/dashboard/date-ranges';

/**
 * SARIRO — attempts to take a conversation off the platform
 * =========================================================
 * The other half of the contact-details rule. Refusing a message stops one
 * message; this screen is what stops the behaviour, because somebody can see
 * it, ask about it, and act on a pattern.
 *
 * ── What this screen is for ─────────────────────────────────────────────────
 * Not for punishing a single slip. Most single flags are nothing — a teacher
 * typing a reference number, a parent quoting an invoice. The signal worth
 * acting on is the same person appearing repeatedly, which is why the top of
 * the page counts people rather than incidents.
 *
 * ── Reviewed means somebody looked ──────────────────────────────────────────
 * Not "resolved", not "dismissed". A flag with a name against it and a note is
 * a decision that can be defended later; a flag that quietly disappears is not.
 * Reviewed flags stay on the page.
 */

function timeAgo(iso: string): string {
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return '';
  const mins = Math.floor((Date.now() - then) / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(then).toLocaleDateString([], { day: 'numeric', month: 'short' });
}

function Who({ person, fallback }: { person: PolicyFlag['sender']; fallback: string }) {
  if (!person) return <span className="text-slate-400">{fallback}</span>;
  const tone = DESIGNATION_TONE[person.designation];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="font-bold text-slate-900">{person.name}</span>
      <span
        className="text-[10px] font-black tracking-wider px-1.5 py-0.5 rounded uppercase"
        style={{ color: tone.fg, background: tone.bg }}
      >
        {DESIGNATION_LABEL[person.designation]}
        {person.designation === 'teacher' && person.tier ? ` · T${person.tier}` : ''}
      </span>
    </span>
  );
}

export default function PolicyFlagsPanel() {
  const [flags, setFlags] = useState<PolicyFlag[] | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [showReviewed, setShowReviewed] = useState(false);
  /* §73 — the same range definition every other dashboard uses. "This month"
     must mean one thing across the product, or two screens disagree about the
     same words and nobody can tell which is right. */
  const [range, setRange] = useState<DateRange>(() => resolveRange('all'));
  const [busyId, setBusyId] = useState<string | null>(null);
  const [note, setNote] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      setFlags(await fetchPolicyFlags());
      setFailed(null);
    } catch (e) {
      setFailed(e instanceof Error ? e.message : 'Could not load flags.');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const shown = useMemo(
    () => (flags ?? []).filter((f) =>
      (showReviewed || !f.reviewed_at) && inRange(f.created_at, range)
    ),
    [flags, showReviewed, range]
  );

  /* Repeat offenders. One flag is noise; the same name four times is a
     conversation HR needs to have. */
  const repeats = useMemo(() => {
    const count = new Map<string, { name: string; n: number }>();
    for (const f of flags ?? []) {
      if (!f.sender) continue;
      const prev = count.get(f.sender.id) ?? { name: f.sender.name, n: 0 };
      count.set(f.sender.id, { name: prev.name, n: prev.n + 1 });
    }
    return [...count.values()].filter((r) => r.n > 1).sort((a, b) => b.n - a.n).slice(0, 6);
  }, [flags]);

  const review = async (id: string) => {
    setBusyId(id);
    const res = await reviewPolicyFlag(id, note[id]);
    setBusyId(null);
    if (res.success) void load();
    else setFailed(res.error ?? 'Could not save.');
  };

  if (failed) {
    return (
      <div className="card card--feature">
        <p className="font-semibold text-slate-900 mb-1">Could not load policy flags.</p>
        <p className="text-[13.5px] text-slate-600 leading-[1.6]">
          If this is the first time here, run{' '}
          <code className="px-1 rounded bg-slate-100">scripts/messaging.sql</code>.
        </p>
        <p className="text-[12px] text-slate-400 mt-2">{failed}</p>
      </div>
    );
  }

  if (!flags) {
    return (
      <div className="flex items-center justify-center py-10 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  const open = flags.filter((f) => !f.reviewed_at).length;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[13px] text-slate-600 leading-[1.6] max-w-[62ch]">
            Attempts to share personal contact details with a learner. Blocked
            messages were never delivered; flagged ones were sent and are here
            because the wording was worth a look.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowReviewed((v) => !v)}
          className="text-[12.5px] font-bold text-blue-600 hover:text-blue-700 min-h-[40px] px-3"
        >
          {showReviewed ? 'Show unreviewed only' : `Show all (${flags.length})`}
        </button>
      </div>

      <DateRangeFilter
        value={range}
        onChange={(preset: RangePreset, custom) => setRange(resolveRange(preset, custom))}
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="card card--compact">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Awaiting review</p>
          <p className="text-2xl font-extrabold tabular-nums mt-1 leading-none" style={{ color: open ? '#B45309' : undefined }}>
            {open}
          </p>
        </div>
        <div className="card card--compact">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Blocked outright</p>
          <p className="text-2xl font-extrabold tabular-nums mt-1 leading-none">
            {flags.filter((f) => f.blocked).length}
          </p>
        </div>
        <div className="card card--compact">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">People involved</p>
          <p className="text-2xl font-extrabold tabular-nums mt-1 leading-none">
            {new Set(flags.map((f) => f.sender?.id).filter(Boolean)).size}
          </p>
        </div>
      </div>

      {repeats.length > 0 && (
        <div className="card card--feature">
          <p className="text-[13px] font-semibold uppercase tracking-wider text-slate-500 mb-3">
            More than once
          </p>
          <div className="space-y-2">
            {repeats.map((r) => {
              const widest = repeats[0].n || 1;
              return (
                <div key={r.name} className="flex items-center gap-3">
                  <span className="w-40 shrink-0 text-[13px] text-slate-700 truncate">{r.name}</span>
                  <div className="flex-1 h-2 rounded-full" style={{ background: '#B4530914' }}>
                    <div
                      className="h-2 rounded-full"
                      style={{ width: `${Math.max((r.n / widest) * 100, 4)}%`, background: '#B45309' }}
                    />
                  </div>
                  <span className="w-16 shrink-0 text-right text-[12.5px] font-semibold text-slate-700 tabular-nums">
                    {r.n}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {shown.length === 0 ? (
        <div className="card card--feature text-center py-10">
          <ShieldCheck className="w-8 h-8 mx-auto text-slate-300 mb-3" />
          <p className="text-[14px] text-slate-600">
            {flags.length === 0 ? 'Nothing flagged. Conversations are staying in-house.' : 'Nothing left to review.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {shown.map((f) => (
            <div key={f.id} className="card card--compact" style={{ opacity: f.reviewed_at ? 0.7 : 1 }}>
              <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                <div className="min-w-0 text-[13.5px] text-slate-600">
                  <Who person={f.sender} fallback="Someone" />
                  <span className="mx-1.5 text-slate-400">→</span>
                  <Who person={f.recipient} fallback="a learner" />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="text-[10px] font-black tracking-wider px-1.5 py-0.5 rounded uppercase"
                    style={
                      f.blocked
                        ? { color: '#B91C1C', background: '#B91C1C14' }
                        : { color: '#B45309', background: '#B4530914' }
                    }
                  >
                    {f.blocked ? 'Blocked' : 'Flagged'}
                  </span>
                  <span className="text-[11.5px] text-slate-400 tabular-nums">{timeAgo(f.created_at)}</span>
                </div>
              </div>

              {/* The evidence. Without it a reviewer cannot tell a violation
                  from a maths teacher sending a long number. */}
              <p className="text-[13.5px] text-slate-900 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 leading-[1.55] whitespace-pre-wrap break-words">
                {f.body}
              </p>

              <div className="flex items-center gap-1.5 flex-wrap mt-2">
                {(f.reasons as PolicyReason[]).map((r) => (
                  <span key={r} className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                    {REASON_LABEL[r] ?? r}
                  </span>
                ))}
              </div>

              {f.reviewed_at ? (
                <p className="text-[12.5px] text-slate-500 mt-2 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Reviewed {timeAgo(f.reviewed_at)}
                  {f.review_note ? ` — ${f.review_note}` : ''}
                </p>
              ) : (
                <div className="flex gap-2 mt-2.5">
                  <input
                    value={note[f.id] ?? ''}
                    onChange={(e) => setNote((n) => ({ ...n, [f.id]: e.target.value }))}
                    placeholder="What did you do about it? (optional)"
                    className="flex-1 min-h-[40px] rounded-lg border border-slate-300 px-3 text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                    style={{ fontSize: '16px' }}
                  />
                  <button
                    type="button"
                    onClick={() => review(f.id)}
                    disabled={busyId === f.id}
                    className="inline-flex items-center gap-1.5 px-3.5 min-h-[40px] rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-bold disabled:opacity-50"
                  >
                    {busyId === f.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-4 h-4" />}
                    Reviewed
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-[12px] text-slate-400 flex items-start gap-1.5 leading-[1.6]">
        <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-[1px]" />
        <span>
          This catches plain sharing and the obvious ways around it. It will not
          catch a code agreed out loud in a lesson — the written policy and this
          record are what carry the rest.
        </span>
      </p>
    </div>
  );
}
