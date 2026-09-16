'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, Ear, PenLine, ArrowLeft, Lock, Loader2, ArrowRight, Shuffle, BookOpen, AudioLines, Map as MapIcon, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import { practiceAccess, SPEAKING_TRACK, type PracticeAccess } from '@/lib/speaking/access';
import DashboardLayout from '@/components/dashboard/dashboard-layout';
import SpeakingLab from '@/components/speaking/speaking-lab';
import ListeningLab from '@/components/speaking/listening-lab';
import WritingLab from '@/components/speaking/writing-lab';
import SoundLab from '@/components/speaking/sound-lab';
import VoiceQuest from '@/components/speaking/quest/voice-quest';
import PracticeProgress from '@/components/speaking/practice-progress';
import { readingSeconds } from '@/lib/speaking/passages';
import { dealFromStorage } from '@/lib/speaking/passages/deck';
import { passageIn, practiceFor } from '@/lib/speaking/practice/band-practice';
import { STAGES } from '@/lib/speaking/stages';

/**
 * SARIRO — the practice room
 * ============================================================================
 * A live class happens once a week. This is the other six days.
 *
 * Speaking, listening and writing, all three running on the device: no API
 * call, no cost per attempt, no queue. That is the point rather than an
 * implementation detail — a child who can try a passage nine times will, and a
 * child who has to wait for a server, or who costs the company money each time
 * they press the button, quietly practises less.
 *
 * ── Why it is not inside a lesson ───────────────────────────────────────────
 * The lesson drills exist and are tied to what was taught that week. This is
 * open at any hour with no lesson attached, because the thing that actually
 * improves a speaker is the practice they do when nobody set it.
 */

/* Which passage and which topic each drill is on, remembered on this device so
   the next visit carries on through the library rather than starting again.
   One deck per band: moving up a band starts the new library from the top. */
const readDeck = (band: string) => `sariro.practice.read-aloud.${band}`;
const topicDeck = (band: string) => `sariro.practice.topic.${band}`;

type Tab = 'quest' | 'speaking' | 'sounds' | 'listening' | 'writing';

const TABS: { key: Tab; label: string; icon: typeof Mic; blurb: string }[] = [
  { key: 'quest', label: 'Quest', icon: MapIcon, blurb: 'Your rank, your streak, today’s quest and the whole course as a map — every level with homework that keeps score.' },
  { key: 'speaking', label: 'Speaking', icon: Mic, blurb: 'Pace, pauses, filler words and whether your voice moves.' },
  { key: 'sounds', label: 'Sounds', icon: AudioLines, blurb: 'Why Q says three different things, and every other spelling that lies — heard, sorted and said.' },
  { key: 'listening', label: 'Listening', icon: Ear, blurb: 'Catch a passage once and give it back.' },
  { key: 'writing', label: 'Writing', icon: PenLine, blurb: 'Sentence rhythm, soft words, and who did the thing.' },
];

/**
 * The room, locked.
 *
 * Not hidden. A coding student who finds this has been told exactly what it
 * is and where to get it, which is worth more than a missing sidebar row —
 * and a Public Speaking student who lands here by mistake after their course
 * ended gets a sentence that acknowledges they used to be inside.
 */
function Locked({ access }: { access: PracticeAccess }) {
  return (
    <section className="relative min-h-[70vh] flex items-center px-4 sm:px-6 lg:px-10 py-16">
      <div className="max-w-xl mx-auto text-center">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-5">
          <Lock className="w-6 h-6 text-slate-400" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>
          {access.lapsed ? 'The practice room is closed' : 'This comes with Public Speaking'}
        </h1>
        <p className="text-[15px] text-slate-600 leading-[1.75] mb-6">{access.reason}</p>

        {/* What is actually behind the door, so the decision is informed. */}
        <div className="text-left rounded-2xl border border-slate-200 bg-white p-5 mb-6 space-y-3">
          {[
            { icon: Mic, label: 'Speaking', body: 'Pace, pauses, filler words and whether your voice moves — scored the second you stop talking.' },
            { icon: Ear, label: 'Listening', body: 'A passage read once. Say it back and find out what you actually caught.' },
            { icon: PenLine, label: 'Writing', body: 'Sentence rhythm, soft words, and the sentences that hide who did the thing.' },
          ].map((f) => (
            <div key={f.label} className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <f.icon className="w-4 h-4 text-slate-600" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900" style={{ fontFamily: 'var(--font-grotesk)' }}>{f.label}</p>
                <p className="text-xs text-slate-600 leading-relaxed mt-0.5">{f.body}</p>
              </div>
            </div>
          ))}
        </div>

        <Link
          href={`/course-path/${SPEAKING_TRACK}`}
          className="btn-tactile btn-tactile-primary px-6 py-3 text-sm inline-flex items-center justify-center gap-2"
        >
          See the Public Speaking course <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}

/** What was dealt, and a way to get another. */
function DealtBar({
  icon: Icon, label, detail, action, onNext,
}: {
  icon: typeof Mic;
  label: string;
  detail: string;
  action: string;
  onNext: () => void;
}) {
  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 flex items-center gap-3">
      <Icon className="w-4 h-4 text-blue-600 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-slate-900 leading-snug" style={{ fontFamily: 'var(--font-jakarta)' }}>{label}</p>
        <p className="text-[11px] text-slate-500">{detail}</p>
      </div>
      <button
        onClick={onNext}
        className="shrink-0 h-9 px-3 rounded-lg border border-blue-200 bg-white text-[12px] font-bold text-blue-700 hover:bg-blue-50 inline-flex items-center gap-1.5"
        style={{ fontFamily: 'var(--font-grotesk)' }}
      >
        <Shuffle className="w-3.5 h-3.5" /> {action}
      </button>
    </div>
  );
}

export default function PracticePage() {
  const { user, profile } = useAuth();
  /* null while the answer is unknown. Rendering the room and snatching it back
     a beat later is worse than a spinner. */
  const [access, setAccess] = useState<PracticeAccess | null>(null);
  const grade = profile?.grade ?? null;

  useEffect(() => {
    if (!user) return;
    let live = true;
    (async () => {
      try {
        /* Level and date too: the room is the band of the most recent Public
           Speaking enrolment (lib/speaking/access.ts). */
        const { data } = await createClient()
          .from('enrollments')
          .select('track, status, level, created_at')
          .eq('user_id', user.id);
        if (live) setAccess(practiceAccess(data ?? [], grade));
      } catch {
        // A failed read must not hand out the room. It also must not accuse
        // somebody of not being enrolled — the locked copy says what it is
        // and offers the course, which is safe either way.
        if (live) setAccess(practiceAccess([]));
      }
    })();
    return () => { live = false; };
  }, [user, grade]);

  /* The band's own room: drills, topics, passages, writing prompts, sounds. */
  const band = access?.band ?? 'middle';
  const practice = useMemo(() => practiceFor(band), [band]);
  const passageIds = useMemo(() => practice.passages.map((p) => p.id), [practice]);
  const topicIds = useMemo(() => practice.topics.map((p) => p.id), [practice]);

  const [tab, setTab] = useState<Tab>('quest');
  const [drill, setDrill] = useState(0);
  /* Bumped when a lab actually writes a row, which re-mounts the panel below
     so the attempt they just finished is in it. Refreshing the whole page to
     see your own last go is the sort of thing that stops people practising. */
  const [logged, setLogged] = useState(0);
  const noteLogged = useCallback(() => setLogged((n) => n + 1), []);

  /* Dealt after mount: storage is only on the device, and the first render must
     match the server's. */
  const [passageId, setPassageId] = useState<string | null>(null);
  const [topicId, setTopicId] = useState<string | null>(null);
  useEffect(() => {
    if (!access?.band) return;
    setPassageId(dealFromStorage(readDeck(access.band), passageIds));
    setTopicId(dealFromStorage(topicDeck(access.band), topicIds));
    setDrill(0);
  }, [access?.band, passageIds, topicIds]);
  const passage = passageIn(practice, passageId);
  const topic = practice.topics.find((p) => p.id === topicId) ?? null;
  const current = practice.drills[Math.min(drill, practice.drills.length - 1)];
  const stageMeta = STAGES[band];
  /* Grades 1–3 do not write homework, so the writing tab is not theirs either. */
  const tabs = practice.writingPrompts.length ? TABS : TABS.filter((t) => t.key !== 'writing');

  const active = TABS.find((t) => t.key === tab)!;

  if (access === null) {
    return (
      <DashboardLayout>
        <section className="relative min-h-[70vh] flex items-center justify-center px-4">
          <Loader2 className="w-6 h-6 text-slate-300 animate-spin" aria-label="Loading" />
        </section>
      </DashboardLayout>
    );
  }

  if (!access.allowed) {
    return (
      <DashboardLayout>
        <Locked access={access} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <section className="relative pt-6 sm:pt-10 pb-16 px-4 sm:px-6 lg:px-10">
        <div className={`${tab === 'quest' ? 'max-w-5xl' : 'max-w-3xl'} mx-auto`}>
          <Link
            href="/dashboard/student"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 mb-4"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard
          </Link>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
              Practice room
            </h1>
            <p className="text-slate-600 mt-1.5 text-sm">
              {active.blurb} Everything here runs on your own device — nothing is recorded, nothing is sent anywhere,
              and you can try as many times as you like.
            </p>
            {/* Which course this room belongs to. Enrolling in the next band
                replaces it with that band's room. */}
            {access.courseName && (
              <p
                className="mt-3 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[12.5px] font-bold"
                style={{ borderColor: `${stageMeta.color}40`, background: `${stageMeta.color}10`, color: stageMeta.color, fontFamily: 'var(--font-grotesk)' }}
              >
                <GraduationCap className="w-4 h-4" />
                <span aria-hidden>{stageMeta.emoji}</span> {access.courseName} · {stageMeta.name}
              </p>
            )}
          </motion.div>

          <div className={`grid ${tabs.length === 5 ? 'grid-cols-5' : 'grid-cols-4'} gap-2 mb-6`}>
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`h-12 rounded-xl text-sm font-bold border-2 flex items-center justify-center gap-2 transition-colors ${
                  tab === t.key
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                <t.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </div>

          {tab === 'speaking' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {practice.drills.map((d, i) => (
                  <button
                    key={d.id}
                    onClick={() => setDrill(i)}
                    className={`px-3 py-2 rounded-lg text-xs font-bold border-2 ${
                      drill === i ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'
                    }`}
                    style={{ fontFamily: 'var(--font-grotesk)' }}
                  >
                    {d.title}
                  </button>
                ))}
              </div>
              {current.kind === 'read' && passage && (
                <DealtBar
                  icon={BookOpen}
                  label={passage.title}
                  detail={`${passage.topic} · about ${Math.max(10, Math.round(readingSeconds(passage) / 5) * 5)} seconds · ${practice.passages.length} passages`}
                  action="Another passage"
                  onNext={() => setPassageId(dealFromStorage(readDeck(band), passageIds))}
                />
              )}
              {current.kind === 'free' && topic && (
                <DealtBar
                  icon={Mic}
                  label={`${topic.emoji} ${topic.text}`}
                  detail={`Your topic · ${practice.topics.length} to choose from`}
                  action="Another topic"
                  onNext={() => setTopicId(dealFromStorage(topicDeck(band), topicIds))}
                />
              )}
              {/* Keyed so switching drills — or passages — starts a clean
                  recording rather than carrying the last one's into the next. */}
              {current.kind === 'read' ? (
                passage ? (
                  <SpeakingLab
                    key={`${current.id}-${passage.id}`}
                    drill={{ ...current, passage: passage.text, targetSeconds: Math.max(10, readingSeconds(passage)) }}
                    onLogged={noteLogged}
                  />
                ) : null
              ) : (
                <SpeakingLab key={`${current.id}-${topicId ?? ''}`} drill={current} onLogged={noteLogged} />
              )}
            </div>
          )}

          {/* The band's own quest: its lessons, homework and record. */}
          {tab === 'quest' && <VoiceQuest stage={band} />}

          {/* Every pattern, with the passport of stamps across all of them. */}
          {tab === 'sounds' && <SoundLab key={band} simple={practice.simpleSounds} />}
          {tab === 'listening' && (
            <ListeningLab key={band} library={practice.passages} deckKey={`sariro.practice.listening.${band}`} onLogged={noteLogged} />
          )}
          {tab === 'writing' && practice.writingPrompts.length > 0 && (
            <WritingLab key={band} prompts={practice.writingPrompts} onLogged={noteLogged} />
          )}

          {/* Underneath the drill, not above it. Somebody who opened this page
              came to practise; the history is what they read afterwards. */}
          {tab !== 'quest' && (
            <div className="mt-6">
              <PracticeProgress key={logged} />
            </div>
          )}
        </div>
      </section>
    </DashboardLayout>
  );
}
