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
  Zap,
  Target,
  Calendar,
  Users,
  TrendingUp,
  Star,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  fetchStudentLeaderboard,
  fetchMyStudentRank,
  type StudentLeaderboardRow,
} from '@/lib/dashboard/submissions-data';
import { useAuth } from '@/components/auth/auth-provider';

/* ════════════════════════════════════════════════════════════════════════
   Student Leaderboard Page — /dashboard/student/leaderboard
   ════════════════════════════════════════════════════════════════════════
   Features:
   - Scoped to student's own cohort by default (compete with classmates)
   - Falls back to track+level global scope if cohort has <5 students
   - Shows top 50 + sticky "your rank" card at bottom
   - Points breakdown: speed + approval + attendance
   - Mobile-first: 44px touch targets, safe-area, 100dvh, 16px font
   ════════════════════════════════════════════════════════════════════════ */

type Scope = 'cohort' | 'track_level' | 'global';

interface MyEnrollment {
  id: string;
  cohort_id: string | null;
  track: string;
  level: string;
  status: string;
}

export default function StudentLeaderboardPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<StudentLeaderboardRow[]>([]);
  const [myRank, setMyRank] = useState<{
    rank: number;
    total: number;
    row: StudentLeaderboardRow;
  } | null>(null);
  const [myEnrollment, setMyEnrollment] = useState<MyEnrollment | null>(null);
  const [scope, setScope] = useState<Scope>('cohort');
  const [scopeLocked, setScopeLocked] = useState(false); // true if cohort too small

  /* ─── Determine student's enrollment + initial scope ─── */
  useEffect(() => {
    let cancelled = false;
    async function loadEnrollment() {
      if (!user) return;
      try {
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('id, cohort_id, track, level, status')
          .eq('user_id', user.id)
          .in('status', ['active', 'completed'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (cancelled) return;
        const enrollment = enrollments as MyEnrollment | null;
        setMyEnrollment(enrollment);

        // If no cohort, fall back to track_level scope
        if (!enrollment?.cohort_id) {
          setScope(enrollment ? 'track_level' : 'global');
          setScopeLocked(!enrollment);
        }
      } catch (err) {
        console.warn('[leaderboard] enrollment load error:', err);
      }
    }
    loadEnrollment();
    return () => {
      cancelled = true;
    };
  }, [user]);

  /* ─── Fetch leaderboard + my rank ─── */
  const loadLeaderboard = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      let cohortId: string | undefined;
      let track: string | undefined;
      let level: string | undefined;

      if (scope === 'cohort') {
        cohortId = myEnrollment?.cohort_id ?? undefined;
        if (!cohortId) {
          // No cohort — fall back to track_level
          setScope('track_level');
          return;
        }
      }
      if (scope === 'track_level' || scope === 'cohort') {
        track = myEnrollment?.track;
        level = myEnrollment?.level;
      }

      const [leaderboardRows, rank] = await Promise.all([
        fetchStudentLeaderboard({
          scope,
          limit: 50,
          cohortId,
          track,
          level,
        }),
        fetchMyStudentRank(),
      ]);

      setRows(leaderboardRows);

      // If cohort has < 5 students, lock scope to track_level (better competition)
      if (scope === 'cohort' && leaderboardRows.length < 5 && myEnrollment?.track) {
        setScopeLocked(true);
      } else {
        setScopeLocked(false);
      }

      setMyRank(rank);
    } catch (err) {
      console.warn('[leaderboard] load error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, [user, scope, myEnrollment]);

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
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
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
            className="inline-flex items-center gap-2 min-h-[44px] px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold mt-4 touch-manipulation"
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
            onClick={() => router.push('/dashboard/student')}
            className="flex items-center gap-1.5 text-sm font-bold text-slate-700 hover:text-slate-900 min-h-[44px] px-2 -ml-2 touch-manipulation"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h1 className="text-base font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
              Leaderboard
            </h1>
          </div>
          <div className="w-16" /> {/* Spacer for centering */}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-32">
        {/* Scope selector */}
        <ScopeSelector
          scope={scope}
          onScopeChange={setScope}
          scopeLocked={scopeLocked}
          hasCohort={!!myEnrollment?.cohort_id}
        />

        {/* Period banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex items-center gap-2 text-sm text-blue-800">
          <Calendar className="w-4 h-4 shrink-0" />
          <span>Points from the last 90 days · resets rolling</span>
        </div>

        {/* Leaderboard list */}
        {rows.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-2">
            {rows.map((row, idx) => (
              <LeaderboardRow
                key={row.user_id + row.enrollment_id}
                row={row}
                isMe={row.user_id === user?.id}
                topThree={idx < 3}
              />
            ))}
          </div>
        )}
      </div>

      {/* Sticky "your rank" card at bottom (mobile-first) */}
      {myRank && (
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-white border-t-2 border-blue-500 shadow-2xl">
          <div
            style={{
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
          >
            <div className="max-w-2xl mx-auto px-4 py-3">
              <YourRankCard rank={myRank.rank} total={myRank.total} row={myRank.row} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   Scope selector — cohort / track+level / global
   ════════════════════════════════════════════════════════════════════════ */

function ScopeSelector({
  scope,
  onScopeChange,
  scopeLocked,
  hasCohort,
}: {
  scope: Scope;
  onScopeChange: (s: Scope) => void;
  scopeLocked: boolean;
  hasCohort: boolean;
}) {
  const options: Array<{ value: Scope; label: string; icon: typeof Users; disabled?: boolean }> = [
    { value: 'cohort', label: 'My Cohort', icon: Users, disabled: !hasCohort },
    { value: 'track_level', label: 'My Course', icon: Target },
    { value: 'global', label: 'All Students', icon: Trophy },
  ];

  return (
    <div className="mb-4">
      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider" style={{ fontFamily: 'var(--font-grotesk)' }}>
        <TrendingUp className="w-3.5 h-3.5" />
        <span>Compare against</span>
      </div>
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isActive = scope === opt.value;
          const isDisabled = opt.disabled;
          return (
            <button
              key={opt.value}
              onClick={() => !isDisabled && onScopeChange(opt.value)}
              disabled={isDisabled}
              className={`flex-1 min-h-[44px] flex items-center justify-center gap-1.5 rounded-lg text-xs font-bold transition-all touch-manipulation ${
                isActive
                  ? 'bg-white shadow-sm text-blue-700'
                  : 'text-slate-600 hover:text-slate-900'
              } ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden xs:inline sm:inline">{opt.label}</span>
            </button>
          );
        })}
      </div>
      {scopeLocked && scope === 'track_level' && (
        <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Your cohort has fewer than 5 students — showing your course-wide ranking instead.
        </p>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   Single leaderboard row
   ════════════════════════════════════════════════════════════════════════ */

function LeaderboardRow({
  row,
  isMe,
  topThree,
}: {
  row: StudentLeaderboardRow;
  isMe: boolean;
  topThree: boolean;
}) {
  const rank = row.rank ?? 0;

  return (
    <div
      className={`rounded-xl border p-3.5 flex items-center gap-3 transition-all ${
        isMe
          ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200'
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
          <Avatar name={row.full_name} avatarUrl={row.avatar_url} />
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-bold truncate ${isMe ? 'text-blue-900' : 'text-slate-900'}`} style={{ fontFamily: 'var(--font-jakarta)' }}>
              {row.full_name ?? 'Anonymous'}
              {isMe && (
                <span className="ml-1.5 text-[10px] font-bold text-blue-600 uppercase tracking-wider" style={{ fontFamily: 'var(--font-grotesk)' }}>
                  You
                </span>
              )}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {row.projects_submitted} projects · {row.classes_attended} classes
            </p>
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

function Avatar({ name, avatarUrl }: { name: string | null; avatarUrl: string | null }) {
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
    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ fontFamily: 'var(--font-grotesk)' }}>
      {initials || '?'}
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
  row: StudentLeaderboardRow;
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
          icon={<Zap className="w-3 h-3" />}
          value={row.speed_points}
          color="amber"
          label="Speed"
        />
        <PointsChip
          icon={<Star className="w-3 h-3" />}
          value={row.approval_points}
          color="violet"
          label="Approved"
        />
        <PointsChip
          icon={<Calendar className="w-3 h-3" />}
          value={row.attendance_points}
          color="green"
          label="Attendance"
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
          {value >= 0 ? '+' : ''}
          {value}
        </span>
      </div>
      <span className="text-[9px] font-bold uppercase tracking-wider opacity-70" style={{ fontFamily: 'var(--font-grotesk)' }}>
        {label}
      </span>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   Empty state — no submissions yet
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
        Be the first to submit a project and claim the #1 spot! Submit your capstone piece after each class to earn points.
      </p>
      <Link
        href="/dashboard/student"
        className="inline-flex items-center gap-2 min-h-[44px] px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold touch-manipulation"
        style={{ fontFamily: 'var(--font-grotesk)' }}
      >
        <Sparkles className="w-4 h-4" /> Go to dashboard
      </Link>
    </div>
  );
}
