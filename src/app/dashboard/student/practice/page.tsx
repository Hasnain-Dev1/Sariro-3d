'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Atom, BookOpen, Code2, FlaskConical, Leaf, Loader2, Lock, Mic, Microscope, Sigma, type LucideIcon } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/dashboard-layout';
import { useAuth } from '@/components/auth/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { practiceAccess, type PracticeAccess } from '@/lib/speaking/access';
import { roomsFor, type RoomAccess } from '@/lib/practice/rooms';
import type { RoomId } from '@/lib/practice/types';

/**
 * SARIRO — the practice rooms, one per course
 * ============================================================================
 * Founder, 18 Sep 2026: every course gets a practice room the way Public
 * Speaking has one. This page is the door to all of them: the learner's own
 * rooms first, then the others locked, each saying which course it comes with
 * (the same rule as the speaking room — a locked door that says what is behind
 * it is worth more than a missing one).
 *
 * Maths and Coding are open now; the other subjects' rooms show "opening soon"
 * to the learners who will get them.
 */

const ICONS: Record<RoomId, LucideIcon> = {
  maths: Sigma, coding: Code2, physics: Atom, chemistry: FlaskConical, biology: Leaf, science: Microscope, english: BookOpen,
};
const READY = new Set<RoomId>(['maths', 'coding']);
const SPEAKING_ACCENT = '#DB2777';

export default function PracticeHubPage() {
  const { user, profile } = useAuth();
  const [rooms, setRooms] = useState<RoomAccess[] | null>(null);
  const [speaking, setSpeaking] = useState<PracticeAccess | null>(null);
  const grade = profile?.grade ?? null;

  useEffect(() => {
    if (!user) return;
    let live = true;
    (async () => {
      try {
        const { data } = await createClient().from('enrollments').select('track, status, level, created_at').eq('user_id', user.id);
        if (!live) return;
        setRooms(roomsFor(data ?? [], grade));
        setSpeaking(practiceAccess(data ?? [], grade));
      } catch {
        if (!live) return;
        setRooms(roomsFor([]));
        setSpeaking(practiceAccess([]));
      }
    })();
    return () => { live = false; };
  }, [user, grade]);

  if (!rooms || !speaking) {
    return (
      <DashboardLayout>
        <section className="min-h-[60vh] flex items-center justify-center"><Loader2 className="w-6 h-6 text-slate-300 animate-spin" aria-label="Loading" /></section>
      </DashboardLayout>
    );
  }

  const open = rooms.filter((r) => r.allowed);
  const locked = rooms.filter((r) => !r.allowed);

  return (
    <DashboardLayout>
      <section className="pt-6 sm:pt-10 pb-16 px-4 sm:px-6 lg:px-10">
        <div className="max-w-5xl mx-auto">
          <Link href="/dashboard/student" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 mb-4" style={{ fontFamily: 'var(--font-grotesk)' }}>
            <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>Practice rooms</h1>
          <p className="text-slate-600 mt-1.5 text-sm max-w-2xl">
            A live class happens once a week. These are for the other six days — every answer checked the moment you give it, as many tries as you like.
          </p>

          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {speaking.allowed && (
              <RoomCard href="/dashboard/student/practice/speaking" icon={Mic} accent={SPEAKING_ACCENT} title="Public Speaking" course={speaking.courseName ?? 'Public Speaking'} blurb="Speaking, listening, sounds and Voice Quest — your rank, streak and homework." />
            )}
            {open.map((r) => (
              <RoomCard
                key={r.room.id}
                href={READY.has(r.room.id) ? `/dashboard/student/practice/${r.room.id}` : null}
                icon={ICONS[r.room.id]}
                accent={r.room.accent}
                title={r.room.label}
                course={r.courseName ?? r.room.label}
                blurb={r.room.blurb}
                soon={!READY.has(r.room.id)}
              />
            ))}
          </div>

          {open.length === 0 && !speaking.allowed && (
            <p className="mt-2 text-[14px] text-slate-600">None of your courses has a practice room yet. Each room below comes with a course.</p>
          )}

          <h2 className="mt-10 text-[13px] font-bold uppercase tracking-wider text-slate-500" style={{ fontFamily: 'var(--font-grotesk)' }}>Other rooms</h2>
          <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {!speaking.allowed && (
              <LockedCard icon={Mic} title="Public Speaking" course="Public Speaking" lapsed={speaking.lapsed} />
            )}
            {locked.map((r) => (
              <LockedCard key={r.room.id} icon={ICONS[r.room.id]} title={r.room.label} course={r.room.course} lapsed={r.lapsed} />
            ))}
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}

function RoomCard({ href, icon: Icon, accent, title, course, blurb, soon }: { href: string | null; icon: LucideIcon; accent: string; title: string; course: string; blurb: string; soon?: boolean }) {
  const body = (
    <>
      <span className="flex items-center gap-3 mb-3">
        <span className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${accent}14`, color: accent }}><Icon className="w-5 h-5" /></span>
        <span className="min-w-0">
          <span className="block text-[17px] font-extrabold text-slate-900">{title}</span>
          <span className="block text-[12px] text-slate-500 truncate">{course}</span>
        </span>
      </span>
      <span className="block text-[13.5px] text-slate-600 leading-relaxed flex-1">{blurb}</span>
      <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-bold" style={{ color: soon ? '#94A3B8' : accent }}>
        {soon ? 'Opening soon' : <>Open <ArrowRight className="w-4 h-4" /></>}
      </span>
    </>
  );
  const cls = 'flex flex-col rounded-2xl border bg-white p-5 transition-shadow';
  return href ? (
    <Link href={href} className={`${cls} hover:shadow-md`} style={{ borderColor: `${accent}40` }}>{body}</Link>
  ) : (
    <div className={cls} style={{ borderColor: '#E2E8F0' }}>{body}</div>
  );
}

function LockedCard({ icon: Icon, title, course, lapsed }: { icon: LucideIcon; title: string; course: string; lapsed: boolean }) {
  return (
    <Link href="/courses" className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 hover:bg-slate-50">
      <span className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400"><Icon className="w-5 h-5" /></span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-[15px] font-bold text-slate-700">{title} <Lock className="w-3.5 h-3.5 text-slate-400" /></span>
        <span className="block text-[12px] text-slate-500">{lapsed ? 'Your course has ended — enrol again to reopen it' : `Comes with ${course}`}</span>
      </span>
    </Link>
  );
}
