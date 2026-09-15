import { Map as MapIcon, Trophy, AudioLines, ClipboardCheck } from 'lucide-react';
import { STAGES, STAGE_ORDER, stageLesson } from '@/lib/speaking/stages';
import { getSpeakingLesson } from '@/lib/speaking/modules';

/**
 * SARIRO — Public Speaking, for every age (course page section)
 * ============================================================================
 * The course used to say "any age" and then show a syllabus written for
 * teenagers. This shows what "any age" actually means: five stages, and the
 * same lesson — Breath, pace and the pause — as a Grade 2 child reads it and as
 * a Grade 11 student does. Then the four things no other speaking class has.
 *
 * Server-rendered from the same stage data the lessons use, so the page cannot
 * promise a version that does not exist.
 */
export default function SpeakingStages({ accent }: { accent: string }) {
  const lesson = getSpeakingLesson(1, 3);
  const young = lesson ? stageLesson(lesson, 'foundation') : null;
  const older = lesson ? stageLesson(lesson, 'senior') : null;
  const youngPassage = young?.drills.find((d) => d.passage)?.passage;
  const olderPassage = older?.drills.find((d) => d.passage)?.passage;

  return (
    <section className="py-14 sm:py-20 bg-white border-t border-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-2" style={{ color: accent }}>One course, five stages</p>
        <h2 className="text-2xl sm:text-[1.9rem] font-bold tracking-[-0.02em] text-slate-900 mb-2">
          Pitched to your child’s age, from Grade 1 to the boardroom
        </h2>
        <p className="prose-measure text-slate-600 text-[15px] leading-[1.65] mb-8">
          Every learner follows the same 48 classes. What changes is how each lesson is taught: the
          words, the drills, the games and the homework match the age in front of us.
        </p>

        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
          {STAGE_ORDER.map((s) => {
            const m = STAGES[s];
            return (
              <div key={s} className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-2xl" aria-hidden>{m.emoji}</p>
                <p className="mt-2 font-bold text-slate-900 text-[15px]">{m.name}</p>
                <p className="text-[12px] font-semibold" style={{ color: m.color }}>{m.grades}</p>
                <p className="mt-2 text-[12.5px] text-slate-600 leading-[1.55]">{m.blurb}</p>
              </div>
            );
          })}
        </div>

        {lesson && young && older && (
          <div className="mt-10">
            <h3 className="text-lg font-bold text-slate-900 mb-1">The same lesson, two ages</h3>
            <p className="text-[14px] text-slate-600 mb-4">Lesson {lesson.number} · {lesson.title}</p>
            <div className="grid gap-3 md:grid-cols-2">
              {[{ l: young, label: `${STAGES.foundation.emoji} ${STAGES.foundation.name} · ${STAGES.foundation.grades}`, passage: youngPassage, color: STAGES.foundation.color },
                { l: older, label: `${STAGES.senior.emoji} ${STAGES.senior.name} · ${STAGES.senior.grades}`, passage: olderPassage, color: STAGES.senior.color }].map(({ l, label, passage, color }) => (
                <div key={label} className="rounded-2xl border border-slate-200 p-5 bg-slate-50/60">
                  <p className="text-[12px] font-bold" style={{ color }}>{label}</p>
                  <p className="mt-2 text-[15px] font-semibold text-slate-900 leading-snug">{l.oneLine}</p>
                  {passage && (
                    <blockquote className="mt-3 rounded-xl bg-white border-l-2 px-3.5 py-2.5 text-[13.5px] text-slate-700 leading-[1.7]" style={{ borderColor: color }}>
                      “{passage}”
                    </blockquote>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          {[
            { icon: MapIcon, title: 'Voice Quest', body: 'The course as a map of eight worlds. Every class is a level with stars, streaks and badges — earned only by practising.' },
            { icon: ClipboardCheck, title: 'Homework that keeps score', body: 'Every lesson ends with missions: how many tries, a passing score, and a record of every attempt that your child’s teacher sees before the next class.' },
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
