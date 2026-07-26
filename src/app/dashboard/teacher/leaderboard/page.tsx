'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Trophy,
  Medal,
  Crown,
  Loader2,
  AlertTriangle,
  Sparkles,
  Calendar,
  Users,
  Star,
  TrendingUp,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import {
  fetchTeacherLeaderboard,
  type TeacherLeaderboardRow,
} from '@/lib/dashboard/submissions-data';
import { useAuth } from '@/components/auth/auth-provider';

/* ════════════════════════════════════════════════════════════════════════
   Teacher Leaderboard Page — /dashboard/teacher/leaderboard
   ════════════════════════════════════════════════════════════════════════
   Features:
   - GLOBAL scope (teachers compete platform-wide — smaller population than
     students, so cohort scoping doesn't make sense)
   - Shows top 50 teachers with rank badges (gold/silver/bronze for top 3)
   - Sticky "your rank" card at bottom with points breakdown
   - 90-day rolling window (points decay — keeps leaderboard competitive)
   - Mobile-first: 44px touch targets, safe-area, 100dvh, 16px font
   ════════════════════════════════════════════════════════════════════════ */

export default function TeacherLeaderboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<TeacherLeaderboardRow[]>([]);
  const [myRow, setMyRow] = useState<TeacherLeaderboardRow | null>(null);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [total, setTotal] = useState<number>(0);

  /* ─── Fetch leaderboard + my rank ─── */
  const loadLeaderboard = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const leaderboardRows = await fetchTeacherLeaderboard(50);
      setRows(leaderboardRows);
      setTotal(leaderboardRows.length);

      // Find my row in the leaderboard
      const me = leaderboardRows.find((r) => r.user_id === user.id);
      if (me) {
        setMyRow(me);
        setMyRank(me.rank ?? null);
      } else {
        setMyRow(null);
        setMyRank(null);
      }
    } catch (err) {
      console.warn('[teacher-leaderboard] load error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && !authLoading) {
      loadLeaderboard();
    }
  }, [user, authLoading, loadLeaderboard]);

  /* ─── Render ─── */
  if (authLoading || (loading && rows.length === 0)) {
    return (
      <div
        className="min-h-[100dvh] bg-slate-50 flex items-center justify-center"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <Loader2 className="w-10 h-10 animate-spin text-green-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="min-h-[100dvh] bg-slate-50 flex items-center justify-center p-4"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="max-w-md w-full text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-slate-900 mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>
            {error}
          </h1>
          <button
            onClick={() => loadLeaderboard()}
            className="inline-flex items-center gap-2 min-h-[44px] px-5 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold mt-4 touch-manipulation"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-[100dvh] bg-slate-50"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* Sticky top bar */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button
            onClick={() => router.push('/dashboard/teacher')}
            className="flex items-center gap-1.5 text-sm font-bold text-slate-700 hover:text-slate-900 min-h-[44px] px-2 -ml-2 touch-manipulation"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h1 className="text-base font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
              Teacher Leaderboard
            </h1>
          </div>
          <div className="w-16" /> {/* Spacer for centering */}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-32">
        {/* Period banner */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4 flex items-center gap-2 text-sm text-green-800">
          <Calendar className="w-4 h-4 shrink-0" />
          <span>Points from the last 90 days · resets rolling · all teachers</span>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <StatBox
            icon={<Users className="w-4 h-4" />}
            value={total}
            label="Teachers"
            color="green"
          />
          <StatBox
            icon={<CheckCircle2 className="w-4 h-4" />}
            value={rows.reduce((sum, r) => sum + r.classes_taught, 0)}
            label="Classes"
            color="blue"
          />
          <StatBox
            icon={<Star className="w-4 h-4" />}
            value={rows.reduce((sum, r) => sum + r.projects_reviewed, 0)}
            label="Reviews"
            color="violet"
          />
        </div>

        {/* Leaderboard list */}
        {rows.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2">
            {rows.map((row, idx) => (
              <TeacherLeaderboardRow
                key={row.user_id}
                row={row}
                isMe={row.user_id === user?.id}
                topThree={idx < 3}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sticky "your rank" card at bottom (mobile-first) */}
      {myRow && myRank !== null && (
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t-2 border-green-500 shadow-2xl">
          <div
            style={{
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
          >
            <div className="max-w-2xl mx-auto px-4 py-3">
              <YourRankCard rank={myRank} total={total} row={myRow} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   Single leaderboard row
   ════════════════════════════════════════════════════════════════════════ */

function TeacherLeaderboardRow({
  row,
  isMe,
  topThree,
}: {
  row: TeacherLeaderboardRow;
  isMe: boolean;
  topThree: boolean;
}) {
  const rank = row.rank ?? 0;

  return (
    <div
      className={`rounded-xl border p-3.5 flex items-center gap-3 transition-all ${
        isMe
          ? 'bg-green-50 border-green-300 ring-2 ring-green-200'
          : topThree
          ? 'bg-white border-slate-200 shadow-sm'
          : 'bg-white border-slate-200'
      }`}
    >
      {/* Rank badge */}
      <RankBadge rank={rank} />

      {/* Avatar + name */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Avatar name={row.full_name} />
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-bold truncate ${isMe ? 'text-green-900' : 'text-slate-900'}`} style={{ fontFamily: 'var(--font-jakarta)' }}>
              {row.full_name ?? 'Teacher'}
              {isMe && (
                <span className="ml-1.5 text-[10px] font-bold text-green-600 uppercase tracking-wider" style={{ fontFamily: 'var(--font-grotesk)' }}>
                  You
                </span>
              )}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {row.classes_taught} classes · {row.projects_reviewed} reviews
            </p>
            {row.projects_reviewed > 0 && (
              <div className="flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-500" style={{ fontFamily: 'var(--font-grotesk)' }}>
                  {row.ontime_review_rate}% on-time
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Points */}
      <div className="text-right shrink-0">
        <p className="text-base font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
          {row.total_points}
        </p>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider" style={{ fontFamily: 'var(--font-grotesk)' }}>
          points
        </p>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   Rank badge — 1st gold, 2nd silver, 3rd bronze, others plain
   ════════════════════════════════════════════════════════════════════════ */

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 flex items-center justify-center shrink-0 shadow-md">
        <Crown className="w-5 h-5 text-white" />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center shrink-0 shadow-md">
        <Medal className="w-5 h-5 text-white" />
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shrink-0 shadow-md">
        <Medal className="w-5 h-5 text-white" />
      </div>
    );
  }
  return (
    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
      <span className="text-sm font-extrabold text-slate-600" style={{ fontFamily: 'var(--font-grotesk)' }}>
        {rank}
      </span>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   Avatar — shows image if available, else initials
   ════════════════════════════════════════════════════════════════════════ */

function Avatar({ name, avatarUrl }: { name: string | null; avatarUrl?: string | null }) {
  const [imgError, setImgError] = useState(false);

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={name ?? 'avatar'}
        onError={() => setImgError(true)}
        className="w-9 h-9 rounded-full object-cover shrink-0"
      />
    );
  }

  const initials = (name ?? '?')
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ fontFamily: 'var(--font-grotesk)' }}>
      {initials || '?'}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   Stat box — small summary stat at top of page
   ════════════════════════════════════════════════════════════════════════ */

function StatBox({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  color: 'green' | 'blue' | 'violet';
}) {
  const colorClasses = {
    green: 'bg-green-50 border-green-200 text-green-700',
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    violet: 'bg-violet-50 border-violet-200 text-violet-700',
  };
  return (
    <div className={`rounded-xl border p-3 text-center ${colorClasses[color]}`}>
      <div className="flex items-center justify-center mb-1">{icon}</div>
      <p className="text-lg font-extrabold" style={{ fontFamily: 'var(--font-jakarta)' }}>
        {value}
      </p>
      <p className="text-[10px] font-bold uppercase tracking-wider opacity-70" style={{ fontFamily: 'var(--font-grotesk)' }}>
        {label}
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   Sticky "your rank" card at the bottom
   ════════════════════════════════════════════════════════════════════════ */

function YourRankCard({
  rank,
  total,
  row,
}: {
  rank: number;
  total: number;
  row: TeacherLeaderboardRow;
}) {
  return (
    <div className="flex items-center gap-3">
      <RankBadge rank={rank} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider" style={{ fontFamily: 'var(--font-grotesk)' }}>
            Your rank
          </p>
          <span className="text-xs font-bold text-slate-400">
            · {rank} of {total}
          </span>
        </div>
        <p className="text-sm font-extrabold text-slate-900 truncate" style={{ fontFamily: 'var(--font-jakarta)' }}>
          {row.total_points} points
        </p>
      </div>
      {/* Points breakdown chips */}
      <div className="flex items-center gap-1.5 shrink-0">
        <PointsChip
          icon={<CheckCircle2 className="w-3 h-3" />}
          value={row.classes_points}
          color="green"
          label="Classes"
        />
        <PointsChip
          icon={<Star className="w-3 h-3" />}
          value={row.review_points}
          color="violet"
          label="Reviews"
        />
        <PointsChip
          icon={<Clock className="w-3 h-3" />}
          value={row.ontime_bonus}
          color="amber"
          label="On-time"
        />
      </div>
    </div>
  );
}

function PointsChip({
  icon,
  value,
  color,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  color: 'amber' | 'violet' | 'green';
  label: string;
}) {
  const colorClasses = {
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    violet: 'bg-violet-50 text-violet-700 border-violet-200',
    green: 'bg-green-50 text-green-700 border-green-200',
  };
  return (
    <div
      className={`flex flex-col items-center justify-center px-2 py-1 rounded-lg border ${colorClasses[color]}`}
      title={label}
    >
      <div className="flex items-center gap-0.5">
        {icon}
        <span className="text-xs font-extrabold" style={{ fontFamily: 'var(--font-grotesk)' }}>
          +{value}
        </span>
      </div>
      <span className="text-[9px] font-bold uppercase tracking-wider opacity-70" style={{ fontFamily: 'var(--font-grotesk)' }}>
        {label}
      </span>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   Empty state — no activity yet
   ════════════════════════════════════════════════════════════════════════ */

function EmptyState() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
        <Trophy className="w-8 h-8 text-amber-500" />
      </div>
      <h2 className="text-lg font-extrabold text-slate-900 mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>
        Leaderboard is warming up
      </h2>
      <p className="text-sm text-slate-600 mb-6 max-w-sm mx-auto">
        Be the first teacher to complete classes and review student projects! You earn points for every class taught (+5), every project reviewed (+3), and an on-time bonus (+2) for reviews within 48 hours.
      </p>
      <Link
        href="/dashboard/teacher"
        className="inline-flex items-center gap-2 min-h-[44px] px-5 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-bold touch-manipulation"
        style={{ fontFamily: 'var(--font-grotesk)' }}
      >
        <Sparkles className="w-4 h-4" /> Go to dashboard
      </Link>
    </div>
  );
}
