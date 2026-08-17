'use client';

/**
 * SARIRO — StructuredLessonView
 *
 * Renders a StructuredLesson as a five-tab page:
 *   Concept · Mini Project · Final Project · Quiz · Homework
 * The Quiz is interactive and auto-scored. Content comes from the in-codebase
 * curriculum (src/lib/curriculum), not the DB — so it's the same for every
 * viewer and needs no authoring UI.
 */

import { useState } from 'react';
import { BookOpen, FlaskConical, Rocket, ListChecks, GraduationCap, Check, X, ChevronRight } from 'lucide-react';
import type { StructuredLesson, CodeBlock, QuizQuestion } from '@/lib/curriculum/types';

type TabKey = 'concept' | 'mini' | 'final' | 'quiz' | 'homework';

const TABS: { key: TabKey; label: string; icon: typeof BookOpen }[] = [
  { key: 'concept', label: 'Concept', icon: BookOpen },
  { key: 'mini', label: 'Mini Project', icon: FlaskConical },
  { key: 'final', label: 'Final Project', icon: Rocket },
  { key: 'quiz', label: 'Quiz', icon: ListChecks },
  { key: 'homework', label: 'Homework', icon: GraduationCap },
];

function Code({ block }: { block: CodeBlock }) {
  return (
    <div className="rounded-xl overflow-hidden border border-slate-800 bg-[#0b1524] my-3">
      {(block.filename || block.language) && (
        <div className="flex items-center gap-2 px-3.5 py-2 border-b border-white/10 text-[11px] font-mono text-slate-400">
          <span className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          </span>
          <span className="ml-1">{block.filename ?? block.language}</span>
        </div>
      )}
      <pre className="overflow-x-auto p-4 text-[12.5px] leading-relaxed text-slate-200 font-mono"><code>{block.code}</code></pre>
      {block.caption && <p className="px-4 pb-3 text-[11px] text-slate-500 font-mono">{block.caption}</p>}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 mb-2" style={{ fontFamily: 'var(--font-grotesk)' }}>{children}</p>;
}

function Prose({ text }: { text: string }) {
  return (
    <div className="space-y-2.5">
      {text.split('\n\n').map((para, i) => (
        <p key={i} className="text-sm text-slate-600 leading-relaxed">{para}</p>
      ))}
    </div>
  );
}

function Bullets({ items, tone = 'slate' }: { items: string[]; tone?: 'slate' | 'amber' | 'green' | 'cyan' }) {
  const dot = { slate: 'text-slate-400', amber: 'text-amber-500', green: 'text-green-500', cyan: 'text-cyan-500' }[tone];
  return (
    <ul className="space-y-1.5">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2 text-sm text-slate-600 leading-relaxed">
          <ChevronRight className={`w-4 h-4 shrink-0 mt-0.5 ${dot}`} /> <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

/* ── Quiz ─────────────────────────────────────────────────────────────── */
function Quiz({ questions }: { questions: QuizQuestion[] }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const answeredCount = Object.keys(answers).length;
  const score = questions.reduce((s, q) => s + (answers[q.id] === q.answerIndex ? 1 : 0), 0);
  const pct = Math.round((score / questions.length) * 100);

  return (
    <div>
      {submitted && (
        <div className={`rounded-xl border p-4 mb-4 ${pct >= 70 ? 'bg-green-50 border-green-200' : pct >= 40 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
          <p className="text-lg font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
            You scored {score}/{questions.length} ({pct}%)
          </p>
          <p className="text-sm text-slate-600 mt-0.5">
            {pct >= 70 ? "Great work — you've got this lesson down." : pct >= 40 ? 'Good start — review the explanations and try again.' : "Worth another pass through the Concept tab, then retry."}
          </p>
        </div>
      )}

      <div className="space-y-5">
        {questions.map((q, qi) => {
          const chosen = answers[q.id];
          return (
            <div key={q.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-start gap-2 mb-2">
                <span className="shrink-0 text-[11px] font-bold text-cyan-700 font-mono mt-0.5">Q{qi + 1}</span>
                <p className="text-sm font-bold text-slate-800">{q.prompt}</p>
              </div>
              {q.code && <Code block={q.code} />}
              <div className="space-y-1.5 mt-2">
                {q.options.map((opt, oi) => {
                  const isChosen = chosen === oi;
                  const isCorrect = oi === q.answerIndex;
                  let cls = 'border-slate-200 hover:border-cyan-300';
                  if (submitted) {
                    if (isCorrect) cls = 'border-green-400 bg-green-50';
                    else if (isChosen) cls = 'border-red-300 bg-red-50';
                    else cls = 'border-slate-200 opacity-70';
                  } else if (isChosen) cls = 'border-cyan-400 bg-cyan-50';
                  return (
                    <button
                      key={oi}
                      disabled={submitted}
                      onClick={() => setAnswers((a) => ({ ...a, [q.id]: oi }))}
                      className={`w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-lg border-2 text-sm transition-colors ${cls}`}
                    >
                      <span className={`shrink-0 w-5 h-5 rounded-full border grid place-items-center text-[11px] font-bold ${
                        submitted && isCorrect ? 'bg-green-500 border-green-500 text-white'
                        : submitted && isChosen ? 'bg-red-400 border-red-400 text-white'
                        : isChosen ? 'bg-cyan-500 border-cyan-500 text-white' : 'border-slate-300 text-slate-400'
                      }`}>
                        {submitted && isCorrect ? <Check className="w-3 h-3" /> : submitted && isChosen && !isCorrect ? <X className="w-3 h-3" /> : String.fromCharCode(65 + oi)}
                      </span>
                      <span className="text-slate-700">{opt}</span>
                    </button>
                  );
                })}
              </div>
              {submitted && (
                <p className="mt-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                  <span className="font-bold text-slate-700">Why:</span> {q.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex items-center gap-3">
        {!submitted ? (
          <button
            onClick={() => setSubmitted(true)}
            disabled={answeredCount < questions.length}
            className="min-h-[44px] px-5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-bold disabled:bg-slate-300"
          >
            {answeredCount < questions.length ? `Answer all ${questions.length} (${answeredCount} done)` : 'Submit & score'}
          </button>
        ) : (
          <button
            onClick={() => { setSubmitted(false); setAnswers({}); }}
            className="min-h-[44px] px-5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Main ─────────────────────────────────────────────────────────────── */
export function StructuredLessonView({ lesson }: { lesson: StructuredLesson }) {
  const [tab, setTab] = useState<TabKey>('concept');

  return (
    <div>
      {/* Lesson header */}
      <div className="mb-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-cyan-700 font-mono">Lesson {lesson.globalNumber} · Module {lesson.moduleNum}</p>
        <h2 className="text-xl font-extrabold text-slate-900 mt-1" style={{ fontFamily: 'var(--font-jakarta)' }}>{lesson.title}</h2>
        <p className="text-sm text-slate-500 mt-1">{lesson.subtitle}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 mb-5 overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-bold border-b-2 -mb-px whitespace-nowrap transition-colors ${
              tab === key ? 'border-cyan-500 text-cyan-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {/* Concept */}
      {tab === 'concept' && (
        <div className="space-y-5">
          <p className="text-sm text-slate-700 bg-cyan-50 border border-cyan-100 rounded-lg p-3"><span className="font-bold">In this lesson:</span> {lesson.concept.summary}</p>
          {lesson.concept.sections.map((s, i) => (
            <div key={i}>
              <h3 className="text-base font-bold text-slate-900 mb-1.5" style={{ fontFamily: 'var(--font-jakarta)' }}>{s.heading}</h3>
              <Prose text={s.body} />
              {s.code && <Code block={s.code} />}
            </div>
          ))}
          <div className="rounded-xl border border-slate-200 p-4">
            <SectionLabel>Key terms</SectionLabel>
            <dl className="space-y-2">
              {lesson.concept.keyTerms.map((t, i) => (
                <div key={i} className="text-sm"><dt className="font-bold text-slate-800 inline">{t.term}</dt><dd className="text-slate-600 inline"> — {t.definition}</dd></div>
              ))}
            </dl>
          </div>
          <div><SectionLabel>Common mistakes</SectionLabel><Bullets items={lesson.concept.commonMistakes} tone="amber" /></div>
          <div><SectionLabel>Takeaways</SectionLabel><Bullets items={lesson.concept.takeaways} tone="green" /></div>
        </div>
      )}

      {/* Mini Project */}
      {tab === 'mini' && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>{lesson.miniProject.title}</h3>
          <div><SectionLabel>Objective</SectionLabel><p className="text-sm text-slate-600">{lesson.miniProject.objective}</p></div>
          <div><SectionLabel>Instructions</SectionLabel><Bullets items={lesson.miniProject.instructions} tone="cyan" /></div>
          <div><SectionLabel>Code</SectionLabel>{lesson.miniProject.code.map((c, i) => <Code key={i} block={c} />)}</div>
          <div><SectionLabel>How it works</SectionLabel><Prose text={lesson.miniProject.explanation} /></div>
          <div><SectionLabel>Expected output</SectionLabel><p className="text-sm text-slate-600">{lesson.miniProject.expectedOutput}</p></div>
          <div><SectionLabel>What you learned</SectionLabel><Bullets items={lesson.miniProject.learned} tone="green" /></div>
        </div>
      )}

      {/* Final Project */}
      {tab === 'final' && (
        <div className="space-y-4">
          <div className="rounded-xl bg-cyan-50 border border-cyan-100 p-4">
            <SectionLabel>Feature we're shipping</SectionLabel>
            <p className="text-sm font-semibold text-slate-800">{lesson.finalProject.feature}</p>
          </div>
          <div><SectionLabel>Why we need it</SectionLabel><p className="text-sm text-slate-600">{lesson.finalProject.why}</p></div>
          <div><SectionLabel>Where it lives</SectionLabel><p className="text-sm text-slate-600 font-mono">{lesson.finalProject.fileLocation}</p></div>
          <div><SectionLabel>Code</SectionLabel>{lesson.finalProject.code.map((c, i) => <Code key={i} block={c} />)}</div>
          <div><SectionLabel>Where to put it</SectionLabel><Prose text={lesson.finalProject.placement} /></div>
          <div><SectionLabel>How it works</SectionLabel><Prose text={lesson.finalProject.implementation} /></div>
          <div><SectionLabel>Expected result</SectionLabel><p className="text-sm text-slate-600">{lesson.finalProject.expectedResult}</p></div>
          <div className="rounded-xl border border-slate-200 p-4">
            <SectionLabel>How this connects</SectionLabel>
            <p className="text-sm text-slate-600">{lesson.finalProject.connects}</p>
          </div>
        </div>
      )}

      {/* Quiz */}
      {tab === 'quiz' && <Quiz questions={lesson.quiz} />}

      {/* Homework */}
      {tab === 'homework' && (
        <div className="space-y-4">
          <div><SectionLabel>Your task</SectionLabel><p className="text-sm text-slate-600">{lesson.homework.task}</p></div>
          <div><SectionLabel>Requirements</SectionLabel><Bullets items={lesson.homework.requirements} tone="cyan" /></div>
          <div><SectionLabel>Expected outcome</SectionLabel><p className="text-sm text-slate-600">{lesson.homework.expectedOutcome}</p></div>

          {lesson.homework.previousHomeworkHint && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <SectionLabel>Previous lesson — homework hint &amp; approach</SectionLabel>
              <p className="text-sm text-slate-700 mb-2">{lesson.homework.previousHomeworkHint.hint}</p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-1.5">Step by step</p>
              <Bullets items={lesson.homework.previousHomeworkHint.steps} tone="amber" />
              {lesson.homework.previousHomeworkHint.codeGuidance?.map((c, i) => <Code key={i} block={c} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
