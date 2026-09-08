'use client';

import { useEffect, useMemo, useState } from 'react';
import { Mic, Ear, PenLine, TrendingUp, TrendingDown, Minus, Sparkles, Flame, Target, Trophy } from 'lucide-react';
import { fetchAttempts } from '@/lib/speaking/practice-log';
import {
  summarise,
  headlines,
  streak,
  nextFocus,
  TREND_FLOOR,
  type Direction,
  type KindSummary,
  type PracticeAttempt,
  type PracticeKind,
} from '@/lib/speaking/progress';

/**
 * SARIRO — what the practice room adds up to
 * ============================================================================
 * Every attempt is measured and, until now, thrown away. This is the other end
 * of that: the same numbers, read backwards over weeks.
 *
 * ── Why the sentences come before the chart ─────────────────────────────────
 * "Attended 8 classes" is a line every competitor can print. "Filler words 12 a
 * minute down to 3" is not, and it is the line a parent forwards to another
 * parent. So it goes at the top, in words, before any graph — a chart is what
 * you look at once you already believe the claim.
 *
 * ── Why nothing is shown too early ──────────────────────────────────────────
 * Two attempts is not a trend, it is two attempts. Below TREND_FLOOR the panel
 * says how many more goes it needs rather than drawing a confident line through
 * noise. A progress page that lies on day one is a progress page nobody trusts
 * on day thirty.
 *
 * ── Why it never scolds ─────────────────────────────────────────────────────
 * At most one thing going the wrong way is ever shown (see headlines()). A
 * child who opens their own progress page and finds six failures closes it and
 * does not come back, and the practice was the whole point.
 */

const LOOK: Record<PracticeKind, { label: string; icon: typeof Mic; dot: string; line: string }> = {
  speaking:  { label: 'Speaking',  icon: Mic,     dot: 'text-blue-600',   line: '#2563eb' },
  listening: { label: 'Listening', icon: Ear,     dot: 'text-cyan-600',   line: '#0891b2' },
  writing:   { label: 'Writing',   icon: PenLine, dot: 'text-violet-600', line: '#7c3aed' },
};

const KINDS: PracticeKind[] = ['speaking', 'listening', 'writing'];

function arrow(d: Direction) {
  if (d === 'better') return <TrendingUp className="w-3.5 h-3.5 text-green-600" />;
  if (d === 'worse') return <TrendingDown className="w-3.5 h-3.5 text-amber-600" />;
  if (d === 'flat') return <Minus className="w-3.5 h-3.5 text-slate-400" />;
  return null;
}

function sinceWords(iso: string | null): string {
  if (!iso) return '';
  const days = Math.floor((Date.now() - Date.parse(iso)) / 86_400_000);
  if (!Number.isFinite(days)) return '';
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 14) return `${days} days ago`;
  return `${Math.floor(days / 7)} weeks ago`;
}

/**
 * Scores over time, drawn small.
 *
 * The y-axis is deliberately the full 0–100 rather than fitted to the data: a
 * fitted axis turns a three-point wobble into a mountain range, which is
 * flattering and false. Real improvement still shows, because real improvement
 * on a 0–100 score is large.
 */
function Sparkline({ scores, colour }: { scores: number[]; colour: string }) {
  if (scores.length < 2) return null;
  const W = 220;
  const H = 44;
  const pad = 3;
  const step = (W - pad * 2) / (scores.length - 1);
  const y = (s: number) => H - pad - (Math.max(0, Math.min(100, s)) / 100) * (H - pad * 2);
  const pts = scores.map((s, i) => `${(pad + i * step).toFixed(1)},${y(s).toFixed(1)}`);
  const last = scores[scores.length - 1];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-11 mt-1"
      role="img"
      aria-label={`Scores from ${scores[0]} to ${last} over ${scores.length} attempts`}
    >
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={colour}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Only the latest point is marked. A dot on every attempt is a dot on
          every bad day, and it reads as a row of judgements. */}
      <circle
        cx={pad + (scores.length - 1) * step}
        cy={y(last)}
        r={4}
        fill={colour}
        stroke="#fff"
        strokeWidth={2}
      />
    </svg>
  );
}

function KindCard({ summary, scores }: { summary: KindSummary; scores: number[] }) {
  const look = LOOK[summary.kind];
  const Icon = look.icon;
  const short = summary.attempts > 0 && summary.attempts < TREND_FLOOR;
  const remaining = TREND_FLOOR - summary.attempts;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <h4
          className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5"
          style={{ fontFamily: 'var(--font-jakarta)' }}
        >
          <Icon className={`w-3.5 h-3.5 ${look.dot}`} />
          {look.label}
        </h4>
        {summary.latestScore != null && (
          <span
            className="flex items-center gap-1 text-sm font-extrabold text-slate-900 tabular-nums"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            {arrow(summary.scoreTrend)}
            {summary.latestScore}
          </span>
        )}
      </div>

      {summary.attempts === 0 ? (
        <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">
          Nothing yet. One attempt is all it takes to start the line.
        </p>
      ) : (
        <>
          <p className="mt-1 text-[11px] text-slate-500">
            {summary.attempts} {summary.attempts === 1 ? 'attempt' : 'attempts'}
            {summary.activeDays > 1 ? ` across ${summary.activeDays} days` : ''}
            {summary.lastAt ? ` · last ${sinceWords(summary.lastAt)}` : ''}
          </p>

          <Sparkline scores={scores} colour={look.line} />

          {short ? (
            <p className="mt-1 text-[11px] text-slate-400">
              {remaining} more {remaining === 1 ? 'go' : 'goes'} and the trends appear.
            </p>
          ) : (
            <ul className="mt-2 space-y-1">
              {summary.trends
                .filter((t) => t.direction !== 'unknown')
                .slice(0, 4)
                .map((t) => (
                  <li
                    key={t.spec.key}
                    className="flex items-start gap-1.5 text-[11px] text-slate-600 leading-relaxed"
                  >
                    <span className="mt-0.5 shrink-0">{arrow(t.direction)}</span>
                    <span>{t.sentence}</span>
                  </li>
                ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

export default function PracticeProgress({
  userId,
  heading = 'What the practice is doing',
  learnerName,
}: {
  /** Somebody else's, for a teacher or parent. Omitted means the signed-in learner. */
  userId?: string;
  heading?: string;
  /** Turns "your" into "Aarav's" for the staff-facing read. */
  learnerName?: string;
}) {
  const [attempts, setAttempts] = useState<PracticeAttempt[] | null>(null);

  useEffect(() => {
    let live = true;
    fetchAttempts(userId).then((rows) => {
      if (live) setAttempts(rows);
    });
    return () => {
      live = false;
    };
  }, [userId]);

  const summaries = useMemo(
    () => (attempts ? KINDS.map((k) => summarise(attempts, k)) : []),
    [attempts]
  );
  const lines = useMemo(() => headlines(summaries), [summaries]);
  const focus = useMemo(() => nextFocus(summaries), [summaries]);
  const run = useMemo(() => streak(attempts ?? []), [attempts]);
  const best = useMemo(
    () => summaries.reduce<number | null>(
      (m, s) => (s.bestScore != null && (m == null || s.bestScore > m) ? s.bestScore : m),
      null
    ),
    [summaries]
  );

  const scoresByKind = useMemo(() => {
    const out: Record<PracticeKind, number[]> = { speaking: [], listening: [], writing: [] };
    const ordered = [...(attempts ?? [])].sort(
      (a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)
    );
    for (const a of ordered) if (out[a.kind]) out[a.kind].push(a.score);
    return out;
  }, [attempts]);

  if (attempts === null) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="h-4 w-40 bg-slate-100 rounded animate-pulse" />
        <div className="mt-4 grid sm:grid-cols-3 gap-3">
          {KINDS.map((k) => (
            <div key={k} className="h-28 rounded-xl bg-slate-50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const total = attempts.length;

  /* Nobody has practised yet. This is an invitation, not an empty state — the
     panel exists to get somebody into the practice room, and a grey box saying
     "no data" has never got anybody anywhere. */
  if (total === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h3
          className="text-sm font-extrabold text-slate-900 flex items-center gap-2"
          style={{ fontFamily: 'var(--font-jakarta)' }}
        >
          <Sparkles className="w-4 h-4 text-blue-600" />
          {heading}
        </h3>
        <p className="mt-2 text-xs text-slate-600 leading-relaxed">
          {learnerName
            ? `${learnerName} has not used the practice room yet, so there is nothing measured between classes.`
            : 'Nothing measured yet. Every attempt in the practice room is scored the moment you finish — pace, filler words, how much of a passage you caught — and this is where those numbers turn into a line you can watch move.'}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h3
          className="text-sm font-extrabold text-slate-900 flex items-center gap-2"
          style={{ fontFamily: 'var(--font-jakarta)' }}
        >
          <Sparkles className="w-4 h-4 text-blue-600" />
          {heading}
        </h3>
        <span className="text-[11px] text-slate-400">
          {total} {total === 1 ? 'attempt' : 'attempts'} recorded
        </span>
      </div>

      {/* Effort, before result. A child who came back six days running has
          done the thing that actually moves a score, and on a bad week it is
          the only honest thing on the page worth being pleased about. */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {[
          { icon: Flame, label: run.current === 1 ? 'day in a row' : 'days in a row', value: String(run.current), tone: run.current >= 3 ? 'text-orange-600' : 'text-slate-400' },
          { icon: Trophy, label: 'best score', value: best != null ? String(best) : '—', tone: 'text-amber-600' },
          { icon: Sparkles, label: run.days === 1 ? 'day practised' : 'days practised', value: String(run.days), tone: 'text-blue-600' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-slate-200 px-3 py-2">
            <s.icon className={`w-3.5 h-3.5 ${s.tone}`} />
            <p className="mt-1 text-xl font-extrabold text-slate-900 tabular-nums leading-none" style={{ fontFamily: 'var(--font-jakarta)' }}>
              {s.value}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1" style={{ fontFamily: 'var(--font-grotesk)' }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* One instruction, not four. A page of numbers tells somebody how they
          did; it does not tell them what to do on Tuesday, and the second is
          the thing a learner actually needs from their own progress page. */}
      {focus && (
        <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50/60 px-3 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
            <Target className="w-3 h-3" /> Work on this next
          </p>
          <p className="mt-1.5 text-xs font-bold text-slate-900 leading-relaxed">{focus.headline}</p>
          <p className="mt-1 text-xs text-slate-700 leading-relaxed">{focus.advice}</p>
        </div>
      )}

      {/* The claim, in words, before the graph of it. */}
      {lines.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {lines.map((l, i) => (
            <p
              key={i}
              className="text-xs text-slate-800 leading-relaxed rounded-xl bg-slate-50 border border-slate-200 px-3 py-2"
            >
              {l}
            </p>
          ))}
        </div>
      )}

      <div className="mt-3 grid sm:grid-cols-3 gap-3">
        {summaries.map((s) => (
          <KindCard key={s.kind} summary={s} scores={scoresByKind[s.kind]} />
        ))}
      </div>

      <p className="mt-3 text-[11px] text-slate-400 leading-relaxed">
        {learnerName ? `${learnerName}'s scores are` : 'Your scores are'} measured on the device as each attempt
        finishes. Only the numbers are kept — no recording, no transcript, nothing anybody can listen to.
      </p>
    </div>
  );
}
