'use client';

/**
 * Teacher Lessons — /dashboard/teacher/lessons
 *
 * Shows every course this teacher is ASSIGNED to (teacher_course_assignments) —
 * assignment is admin-controlled, and training must be completed before a
 * teacher can actually be scheduled to teach it (see schedule-batch training
 * gate). For the selected course, LessonsViewer now unlocks EVERY lesson (not
 * just past-taught/current/next) so a teacher can review the full syllabus to
 * finish training. Each course chip shows an "Assigned" or "Trained" status so
 * a teacher always knows what they're qualified to teach.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, GraduationCap, Loader2, CheckCircle2, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import { COURSES, TRACKS } from '@/lib/sariro-data';
import { LessonsViewer } from '@/components/dashboard/lessons-viewer';

interface Assignment { track: string; level: string; training_completed_at: string | null }

function courseIdFor(track: string, level: string): string | null {
  const c = COURSES.find((x) => x.trackId === track && x.level.toLowerCase() === (level || '').toLowerCase());
  return c?.id ?? null;
}

export default function TeacherLessonsPage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [activeCourse, setActiveCourse] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { Promise.resolve().then(() => setLoading(false)); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('teacher_course_assignments')
        .select('track, level, training_completed_at')
        .eq('teacher_id', user.id);
      if (cancelled) return;
      const rows = (data ?? []) as Assignment[];
      setAssignments(rows);
      const available = rows.map((r) => courseIdFor(r.track, r.level)).filter(Boolean) as string[];
      const param = new URLSearchParams(window.location.search).get('course');
      setActiveCourse(param && available.includes(param) ? param : available[0] ?? null);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user, authLoading, supabase]);

  const courses = useMemo(() => {
    const seen = new Set<string>();
    const out: { id: string; label: string; trained: boolean }[] = [];
    for (const a of assignments) {
      const id = courseIdFor(a.track, a.level);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const c = COURSES.find((x) => x.id === id)!;
      const trackName = TRACKS.find((t) => t.id === a.track)?.name ?? a.track;
      out.push({ id, label: c?.title ?? `${trackName} · ${a.level}`, trained: !!a.training_completed_at });
    }
    return out;
  }, [assignments]);

  const trainedCount = useMemo(() => courses.filter((c) => c.trained).length, [courses]);

  return (
    <div className="min-h-[100dvh] bg-slate-50 pb-20 lg:pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <Link href="/dashboard/teacher" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </Link>

        <div className="flex items-center gap-2 mb-1.5">
          <GraduationCap className="w-6 h-6 text-green-600" />
          <h1 className="text-2xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>Course Lessons</h1>
        </div>

        {!loading && !authLoading && courses.length > 0 && (
          <p className="text-xs text-slate-500 mb-4">
            Trained for <span className="font-bold text-slate-700">{trainedCount}</span> of{' '}
            <span className="font-bold text-slate-700">{courses.length}</span> assigned course{courses.length === 1 ? '' : 's'}.
            Browse every lesson below to work toward training on the rest — admins control assignment and mark training complete.
          </p>
        )}

        {loading || authLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : courses.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            You have no course assignments yet. An admin controls which courses you can teach.
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              {courses.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCourse(c.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-colors ${
                    activeCourse === c.id ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-600 hover:border-green-300'
                  }`}
                >
                  {c.label}
                  {c.trained ? (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                      <CheckCircle2 className="w-2.5 h-2.5" /> Trained
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                      <Clock className="w-2.5 h-2.5" /> Assigned
                    </span>
                  )}
                </button>
              ))}
            </div>
            {activeCourse && <LessonsViewer courseId={activeCourse} />}
          </>
        )}
      </div>
    </div>
  );
}
