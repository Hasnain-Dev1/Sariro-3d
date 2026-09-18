'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, GraduationCap, Loader2, Lock } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/dashboard-layout';
import { useAuth } from '@/components/auth/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { roomById, roomsFor, type RoomAccess } from '@/lib/practice/rooms';
import { buildGradeSyllabus } from '@/lib/school/curriculum';
import MathsRoom from '@/components/practice/maths-room';
import CodingRoom from '@/components/practice/coding-room';

/**
 * SARIRO — one practice room (/dashboard/student/practice/<room>)
 * ============================================================================
 * The door is the enrolment (lib/practice/rooms.ts): a course the learner is in
 * opens its room; otherwise the page says which course it comes with. The maths
 * room is also told the last lesson their batch was taught, so it can open on
 * that — read from the batch's most recent completed class.
 */

type LastLesson = { title: string; module: string; moduleNum: number | null } | null;

export default function PracticeRoomPage() {
  const params = useParams<{ room: string }>();
  const def = roomById(String(params?.room ?? ''));
  const { user, profile } = useAuth();
  const [access, setAccess] = useState<RoomAccess | null>(null);
  const [lastLesson, setLastLesson] = useState<LastLesson>(null);
  const grade = profile?.grade ?? null;

  useEffect(() => {
    if (!user || !def) return;
    let live = true;
    (async () => {
      const supabase = createClient();
      try {
        const { data } = await supabase.from('enrollments').select('track, status, level, created_at, cohort_id').eq('user_id', user.id);
        const rooms = roomsFor(data ?? [], grade);
        const mine = rooms.find((r) => r.room.id === def.id) ?? null;
        if (!live) return;
        setAccess(mine);

        // The maths room opens on the batch's last taught lesson, when there is one.
        if (def.id === 'maths' && mine?.allowed && mine.grade) {
          const cohortId = (data ?? []).find((e) => def.tracks.includes(e.track as string) && e.cohort_id)?.cohort_id as string | undefined;
          if (cohortId) {
            const { data: last } = await supabase
              .from('bookings')
              .select('lesson_name, module_num')
              .eq('cohort_id', cohortId)
              .eq('status', 'completed')
              .not('lesson_name', 'is', null)
              .order('slot_start', { ascending: false })
              .limit(1)
              .maybeSingle();
            if (live && last?.lesson_name) {
              const moduleNum = parseInt(String(last.module_num ?? ''), 10);
              const module = Number.isFinite(moduleNum) ? buildGradeSyllabus('mathematics', mine.grade).modules[moduleNum - 1]?.title ?? '' : '';
              setLastLesson({ title: last.lesson_name as string, module, moduleNum: Number.isFinite(moduleNum) ? moduleNum : null });
            }
          }
        }
      } catch {
        if (live) setAccess(roomsFor([]).find((r) => r.room.id === def.id) ?? null);
      }
    })();
    return () => { live = false; };
  }, [user, def, grade]);

  if (!def) {
    return (
      <DashboardLayout>
        <section className="min-h-[60vh] flex flex-col items-center justify-center gap-3 px-4 text-center">
          <p className="text-slate-600">There is no practice room here.</p>
          <Link href="/dashboard/student/practice" className="text-sm font-bold text-blue-600">See all practice rooms</Link>
        </section>
      </DashboardLayout>
    );
  }

  if (!access) {
    return (
      <DashboardLayout>
        <section className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-6 h-6 text-slate-300 animate-spin" aria-label="Loading" /></section>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <section className="pt-6 sm:pt-10 pb-16 px-4 sm:px-6 lg:px-10">
        <div className="max-w-5xl mx-auto">
          <Link href="/dashboard/student/practice" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 mb-4" style={{ fontFamily: 'var(--font-grotesk)' }}>
            <ArrowLeft className="w-3.5 h-3.5" /> All practice rooms
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>{def.label} practice</h1>
          <p className="text-slate-600 mt-1.5 text-sm max-w-2xl">{def.blurb}</p>
          {access.allowed && access.courseName && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12.5px] font-bold" style={{ borderColor: `${def.accent}40`, background: `${def.accent}10`, color: def.accent, fontFamily: 'var(--font-grotesk)' }}>
              <GraduationCap className="w-4 h-4" /> {access.courseName}
            </p>
          )}

          <div className="mt-6">
            {!access.allowed ? (
              <div className="max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-center mx-auto">
                <Lock className="w-6 h-6 text-slate-400 mx-auto" />
                <p className="mt-3 text-[16px] font-bold text-slate-900">{access.lapsed ? 'Your course has ended' : `This room comes with ${def.course}`}</p>
                <p className="mt-1 text-[14px] text-slate-600">{access.lapsed ? 'Enrol again and the room — and your progress in it — opens straight back up.' : 'Enrol in the course and the room opens straight away.'}</p>
                <Link href="/courses" className="mt-4 inline-flex h-10 items-center px-4 rounded-xl text-white text-sm font-bold" style={{ background: def.accent }}>See courses</Link>
              </div>
            ) : def.id === 'maths' ? (
              <MathsRoom grade={access.grade ?? 8} accent={def.accent} lastLesson={lastLesson} />
            ) : def.id === 'coding' ? (
              <CodingRoom level={access.grade ?? 2} accent={def.accent} />
            ) : (
              <div className="max-w-lg rounded-2xl border border-slate-200 bg-white p-6 text-center mx-auto">
                <p className="text-[16px] font-bold text-slate-900">The {def.label} room is being built</p>
                <p className="mt-1 text-[14px] text-slate-600">It opens here, for your course, as soon as it is ready. Maths and Coding are open now.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
