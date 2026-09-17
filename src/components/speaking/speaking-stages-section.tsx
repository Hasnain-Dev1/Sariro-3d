import Link from 'next/link';
import { Map as MapIcon, Trophy, AudioLines, ClipboardCheck, ArrowRight } from 'lucide-react';
import { STAGES, STAGE_ORDER } from '@/lib/speaking/stages';
import { SPEAKING_COURSES, speakingLessons } from '@/lib/speaking/courses';

/**
 * SARIRO — Public Speaking, for every age (course page section)
 * ============================================================================
 * The course used to say "any age" and then show a syllabus written for
 * teenagers. Now it is five courses, and this shows what that means: an enrol
 * card per age group, and the first lessons of each course side by side — a
 * Grade 2 child starts with "Hello! This is me" and Leo the Lion's voice, a
 * graduate with first impressions at work. Then the four things no other
 * speaking class has.
 *
 * Server-rendered from the course data itself, so the page cannot promise a
 * lesson that does not exist.
 */
export default function SpeakingStages({ accent }: { accent: string }) {
  return (
    <section className="py-14 sm:py-20 bg-white border-t border-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-2" style={{ color: accent }}>Five courses, one for every age</p>
        <h2 className="text-2xl sm:text-[1.9rem] font-bold tracking-[-0.02em] text-slate-900 mb-2">
          Pick the course for your child’s age, from Grade 1 to the boardroom
        </h2>
        <p className="prose-measure text-slate-600 text-[15px] leading-[1.65] mb-8">
          Each age group is its own course of 48 classes, in its own batches, with its own syllabus.
          The lessons, the drills, the games and the homework are made for that age — moving up a
          group means a new course, not the same one again.
        </p>

        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
          {STAGE_ORDER.map((s) => {
            const m = STAGES[s];
            return (
              /* Each band is its own course, so each card is where you enrol in it. */
              <Link
                key={s}
                href={`/checkout?focus=public-speaking&band=${s}&pay=monthly`}
                className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300"
              >
                <p className="text-2xl" aria-hidden>{m.emoji}</p>
                <p className="mt-2 font-bold text-slate-900 text-[15px]">{m.name}</p>
                <p className="text-[12px] font-semibold" style={{ color: m.color }}>{m.grades}</p>
                <p className="mt-2 text-[12.5px] text-slate-600 leading-[1.55] flex-1">{m.blurb}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-bold" style={{ color: m.color }}>
                  Enrol <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>

        <div className="mt-10">
          <h3 className="text-lg font-bold text-slate-900 mb-1">The first three weeks, five different courses</h3>
          <p className="text-[14px] text-slate-600 mb-4">Every course has its own map of eight worlds and its own lessons.</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {STAGE_ORDER.map((s) => {
              const meta = STAGES[s];
              const world = SPEAKING_COURSES[s].modules[0].world;
              return (
                <div key={s} className="rounded-2xl border border-slate-200 p-4 bg-slate-50/60">
                  <p className="text-[12px] font-bold" style={{ color: meta.color }}>{meta.emoji} {meta.grades}</p>
                  <p className="mt-1.5 text-[13px] font-semibold text-slate-900">{world.emoji} {world.name}</p>
                  <ol className="mt-2 space-y-1.5">
                    {speakingLessons(s).slice(0, 3).map((l) => (
                      <li key={l.key} className="text-[12.5px] text-slate-700 leading-snug">
                        <span className="text-slate-400 tabular-nums">{l.number}.</span> {l.title}
                      </li>
                    ))}
                  </ol>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          {[
            { icon: MapIcon, title: 'Voice Quest', body: 'Each course is a map of eight worlds. Every class is a level with stars, streaks and badges — earned only by practising.' },
            { icon: ClipboardCheck, title: 'Homework that keeps score', body: 'Every lesson ends with missions: how many tries, a passing score, and a record of every attempt that the teacher sees before the next class.' },
            { icon: AudioLines, title: 'Sound Lab', body: 'Why Q says three different things, and every other spelling that lies — heard in British, American and Indian voices, sorted as a game, said aloud.' },
            { icon: Trophy, title: 'Measured, not guessed', body: 'Pace, filler words, pauses and pronunciation measured on every recording, so “better at speaking” is a number that moves.' },
          ].map((f) => (
            <div key={f.title} className="flex gap-3 rounded-2xl border border-slate-200 p-4">
              <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${accent}14`, color: accent }}>
                <f.icon className="w-5 h-5" />
              </span>
              <div>
                <p className="font-bold text-slate-900 text-[14.5px]">{f.title}</p>
                <p className="text-[13px] text-slate-600 leading-[1.55] mt-0.5">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
