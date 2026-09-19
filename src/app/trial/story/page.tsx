'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { storyFor, type Story } from '@/lib/trial/stories';

/**
 * SARIRO — a trial story, on the shared screen (/trial/story?subject=…&grade=…)
 * ============================================================================
 * The teacher opens this from the trial playbook and shares the screen: the
 * title and the hook, then one chapter at a time — the scene and the task, big
 * enough to read on a phone at the other end of a call — and the cliffhanger
 * last. Answers stay in the teacher's playbook; nothing here gives them away.
 * Arrow keys or the buttons move between screens.
 */

const PALETTES = [
  'radial-gradient(120% 120% at 10% 0%, #4F46E5 0%, #0F172A 70%)',
  'radial-gradient(120% 120% at 90% 0%, #0EA5E9 0%, #0F172A 70%)',
  'radial-gradient(120% 120% at 10% 100%, #10B981 0%, #0F172A 70%)',
  'radial-gradient(120% 120% at 90% 100%, #F59E0B 0%, #0F172A 70%)',
  'radial-gradient(120% 120% at 50% 0%, #DB2777 0%, #0F172A 70%)',
];

function Presenter({ story }: { story: Story }) {
  const [screen, setScreen] = useState(0);
  const last = story.chapters.length + 1;
  const go = useCallback((d: number) => setScreen((s) => Math.max(0, Math.min(last, s + d))), [last]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); go(1); }
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(-1); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go]);

  const chapter = screen >= 1 && screen <= story.chapters.length ? story.chapters[screen - 1] : null;

  return (
    <main className="min-h-[100dvh] text-white flex flex-col transition-[background] duration-700" style={{ background: PALETTES[screen % PALETTES.length] }}>
      <div className="flex items-center justify-between px-5 sm:px-8 pt-5">
        <p className="text-[13px] font-bold uppercase tracking-[0.2em] text-white/60" style={{ fontFamily: 'var(--font-grotesk)' }}>Sariro · {story.grade >= 13 ? 'Story' : `Grade ${story.grade} story`}</p>
        <div className="flex gap-1.5" aria-hidden>
          {Array.from({ length: last + 1 }, (_, i) => (
            <span key={i} className={`h-1.5 rounded-full transition-all ${i === screen ? 'w-8 bg-white' : 'w-3 bg-white/30'}`} />
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-5 sm:px-10 py-8">
        <AnimatePresence mode="wait">
          <motion.div key={screen} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35 }} className="w-full max-w-4xl">
            {screen === 0 && (
              <div className="text-center">
                <p className="text-7xl sm:text-8xl" aria-hidden>{story.emoji}</p>
                <h1 className="mt-5 text-4xl sm:text-6xl font-extrabold leading-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>{story.title}</h1>
                <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-[16px] sm:text-[18px] font-bold"><Sparkles className="h-5 w-5" /> Today, you are {story.role}</p>
                <p className="mt-8 text-[20px] sm:text-[26px] leading-relaxed text-white/90 max-w-3xl mx-auto">{story.hook}</p>
              </div>
            )}

            {chapter && (
              <div>
                <p className="text-[14px] sm:text-[16px] font-bold uppercase tracking-[0.2em] text-white/60" style={{ fontFamily: 'var(--font-grotesk)' }}>Chapter {screen}</p>
                <h2 className="mt-2 text-3xl sm:text-5xl font-extrabold" style={{ fontFamily: 'var(--font-jakarta)' }}>{chapter.title}</h2>
                <p className="mt-6 text-[20px] sm:text-[26px] leading-relaxed text-white/90">{chapter.scene}</p>
                <div className="mt-8 rounded-3xl bg-white text-slate-900 p-6 sm:p-8 shadow-2xl">
                  <p className="text-[13px] font-extrabold uppercase tracking-[0.18em] text-indigo-600" style={{ fontFamily: 'var(--font-grotesk)' }}>Your mission</p>
                  <p className="mt-2 text-[20px] sm:text-[26px] font-bold leading-snug">{chapter.task}</p>
                </div>
              </div>
            )}

            {screen === last && (
              <div className="text-center">
                <p className="text-[14px] sm:text-[16px] font-bold uppercase tracking-[0.25em] text-white/60" style={{ fontFamily: 'var(--font-grotesk)' }}>To be continued…</p>
                <p className="mt-6 text-[22px] sm:text-[30px] font-bold leading-relaxed max-w-3xl mx-auto">{story.cliffhanger}</p>
                <p className="mt-10 inline-flex rounded-2xl bg-white/15 px-5 py-3 text-[16px] sm:text-[18px] text-white/90">🏆 {story.win}</p>
                <p className="mt-6 text-[15px] text-white/60">Chapter 4 happens in your first class.</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between px-5 sm:px-8 pb-6">
        <button type="button" onClick={() => go(-1)} disabled={screen === 0} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-white/10 px-5 text-[15px] font-bold disabled:opacity-30">
          <ArrowLeft className="h-5 w-5" /> Back
        </button>
        {screen === last ? (
          <button type="button" onClick={() => setScreen(0)} className="inline-flex h-12 items-center gap-2 rounded-2xl bg-white/10 px-5 text-[15px] font-bold">
            Start again
          </button>
        ) : (
          <button type="button" onClick={() => go(1)} autoFocus className="inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-6 text-[15px] font-extrabold text-slate-900">
            {screen === 0 ? 'Start the story' : screen === last - 1 ? 'What happens next?' : 'Next chapter'} <ArrowRight className="h-5 w-5" />
          </button>
        )}
      </div>
    </main>
  );
}

function StoryPage() {
  const q = useSearchParams();
  const grade = Number(q.get('grade'));
  const story = storyFor(q.get('subject'), Number.isFinite(grade) && grade > 0 ? grade : null);
  if (!story) {
    return (
      <main className="min-h-[100dvh] flex items-center justify-center bg-slate-950 text-white px-6 text-center">
        <p className="text-lg">There is no story here. Open it from the trial playbook.</p>
      </main>
    );
  }
  return <Presenter key={`${story.subject}:${story.grade}`} story={story} />;
}

export default function Page() {
  return <Suspense><StoryPage /></Suspense>;
}
