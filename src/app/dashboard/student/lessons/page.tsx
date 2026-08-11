'use client';

/**
 * Student Lessons — /dashboard/student/lessons
 *
 * Lists the courses the student is enrolled in and, for the selected course,
 * shows the LessonsViewer. Access is enforced server-side: the student can only
 * open lesson pages for their CURRENT and COMPLETED lessons — upcoming lessons,
 * unassigned pages, and other courses are never viewable.
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BookOpen, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import { COURSES, TRACKS } from '@/lib/sariro-data';
import { LessonsViewer } from '@/components/dashboard/lessons-viewer';

interface Enrollment { id: string; track: string; level: string; status: string }

function courseIdFor(track: string, level: string): string | null {
  const c = COURSES.find((x) => x.trackId === track && x.level.toLowerCase() === (level || '').toLowerCase());
  return c?.id ?? null;
}

export default function StudentLessonsPage() {
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [activeCourse, setActiveCourse] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { Promise.resolve().then(() => setLoading(false)); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('enrollments')
        .select('id, track, level, status')
        .eq('user_id', user.id)
        .in('status', ['active', 'completed']);
      if (cancelled) return;
      const rows = (data ?? []) as Enrollment[];
      setEnrollments(rows);
      // Honor ?course= if present and enrolled, else first with a known page.
      const param = new URLSearchParams(window.location.search).get('course');
      const available = rows.map((r) => courseIdFor(r.track, r.level)).filter(Boolean) as string[];
      setActiveCourse(param && available.includes(param) ? param : available[0] ?? null);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user, authLoading, supabase]);

  const courses = useMemo(() => {
    const seen = new Set<string>();
    const out: { id: string; label: string }[] = [];
    for (const e of enrollments) {
      const id = courseIdFor(e.track, e.level);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      const c = COURSES.find((x) => x.id === id)!;
      const trackName = TRACKS.find((t) => t.id === e.track)?.name ?? e.track;
      out.push({ id, label: c?.title ?? trackName });
    }
    return out;
  }, [enrollments]);

  return (
    <div className="min-h-[100dvh] bg-slate-50 pb-20 lg:pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <Link href="/dashboard/student" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </Link>

        <div className="flex items-center gap-2 mb-5">
          <BookOpen className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>My Lessons</h1>
        </div>

        {loading || authLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : courses.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            You have no active courses yet. Lessons unlock as you enroll and progress.
          </div>
        ) : (
          <>
            {courses.length > 1 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {courses.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveCourse(c.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-colors ${
                      activeCourse === c.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-blue-300'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            )}
            {activeCourse && <LessonsViewer courseId={activeCourse} />}
          </>
        )}
      </div>
    </div>
  );
}
