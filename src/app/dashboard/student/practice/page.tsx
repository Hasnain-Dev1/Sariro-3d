'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, Ear, PenLine, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/dashboard/dashboard-layout';
import SpeakingLab, { type Drill } from '@/components/speaking/speaking-lab';
import ListeningLab from '@/components/speaking/listening-lab';
import WritingLab from '@/components/speaking/writing-lab';

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

const SPEAKING_DRILLS: Drill[] = [
  {
    id: 'free-60',
    title: 'Sixty seconds, no notes',
    brief: 'Pick anything you know well and talk about it for a minute. Do not plan it. The point is to hear what your unplanned speech actually sounds like.',
    targetSeconds: 60,
  },
  {
    id: 'read-aloud',
    title: 'Read it as though you mean it',
    brief: 'Read the passage aloud. The full stops and commas are where you breathe — let them be pauses rather than pushing straight through.',
    passage:
      'The trouble with speaking well is that everybody assumes it is a gift. It is not. ' +
      'It is a handful of habits, each of them dull on its own: breathing before you start, ' +
      'stopping at the end of a thought, letting your voice fall rather than rise. ' +
      'None of that is talent. All of it is practice.',
    targetSeconds: 45,
  },
  {
    id: 'explain-hard',
    title: 'Explain something difficult, simply',
    brief: 'Explain something you understand to somebody who knows nothing about it. No jargon. If you need a word they would not know, define it as you go.',
    targetSeconds: 90,
  },
];

type Tab = 'speaking' | 'listening' | 'writing';

const TABS: { key: Tab; label: string; icon: typeof Mic; blurb: string }[] = [
  { key: 'speaking', label: 'Speaking', icon: Mic, blurb: 'Pace, pauses, filler words and whether your voice moves.' },
  { key: 'listening', label: 'Listening', icon: Ear, blurb: 'Catch a passage once and give it back.' },
  { key: 'writing', label: 'Writing', icon: PenLine, blurb: 'Sentence rhythm, soft words, and who did the thing.' },
];

export default function PracticePage() {
  const [tab, setTab] = useState<Tab>('speaking');
  const [drill, setDrill] = useState(0);

  const active = TABS.find((t) => t.key === tab)!;

  return (
    <DashboardLayout>
      <section className="relative pt-6 sm:pt-10 pb-16 px-4 sm:px-6 lg:px-10">
        <div className="max-w-3xl mx-auto">
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
          </motion.div>

          <div className="grid grid-cols-3 gap-2 mb-6">
            {TABS.map((t) => (
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
                {SPEAKING_DRILLS.map((d, i) => (
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
              {/* Keyed so switching drills starts a clean recording rather than
                  carrying the last one's audio into the next. */}
              <SpeakingLab key={SPEAKING_DRILLS[drill].id} drill={SPEAKING_DRILLS[drill]} />
            </div>
          )}

          {tab === 'listening' && <ListeningLab />}
          {tab === 'writing' && <WritingLab />}
        </div>
      </section>
    </DashboardLayout>
  );
}
