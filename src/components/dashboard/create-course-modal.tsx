'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Check, ChevronLeft } from 'lucide-react';
import { createCohortDetailed } from '@/lib/dashboard/admin-data';
import { COUNTRIES } from '@/lib/invoice/company';
import {
  COURSE_FAMILIES, CODING_LEVELS, ALL_GRADES,
  optionsFor, gradesFor, suitsGrades, levelValue, describeCourse,
  type CourseFamily,
} from '@/lib/dashboard/course-options';

/**
 * SARIRO — New Course
 * =========================================================
 * V2 §4-7. Every kind of class we sell, created from one place.
 *
 * ── Why it starts with the subject ──────────────────────────────────────────
 * §4 is explicit: "The New Course workflow must start with Select Subject.
 * After selecting the subject, dynamically show the appropriate level
 * structure." That is not a presentation preference — the levels genuinely
 * differ. Coding has Beginner through Advanced and no grades, because a child
 * does not take "grade 8 coding". School subjects have grades 1-12 and no
 * levels. A focus course has neither; it is 48 classes on one topic.
 *
 * The previous modal offered coding tracks and three levels, full stop. Every
 * Mathematics, Physics and Public Speaking class we sell was unschedulable
 * from the dashboard.
 *
 * ── How the choice is stored ────────────────────────────────────────────────
 * `track` holds the subject slug — a coding track id, a school subject slug, or
 * a specialisation slug. `level` holds the shape:
 *
 *     beginner | intermediate | advanced | elementary   coding
 *     grade-1 … grade-12                                one school year
 *     focus                                             a specialisation
 *
 * That convention already exists — purchase_intents has enforced exactly this
 * since the school products launched (scripts/purchase-intent-school-levels.sql).
 * Inventing a second one here would mean a cohort and the order that filled it
 * disagreeing about what was sold.
 *
 * ── Capacity comes from ratio, never typed ──────────────────────────────────
 * §7. 1:1 means one seat and 1:4 means four. Letting someone type a number
 * would eventually produce a "1:1" cohort with three children in it.
 */

type Family = CourseFamily;

export default function CreateCourseModal({
  open, onClose, onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (summary: string) => void;
}) {
  const [family, setFamily] = useState<Family | null>(null);
  const [track, setTrack] = useState('');
  const [level, setLevel] = useState('');
  const [ratio, setRatio] = useState<'1:1' | '1:4'>('1:4');
  /** §8 — the region this batch's weekly slot suits. Blank = everybody. */
  const [country, setCountry] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setFamily(null); setTrack(''); setLevel(''); setRatio('1:4');
    setCountry(''); setError(null);
  };

  const close = () => { if (!submitting) { reset(); onClose(); } };

  /* Both this and Manual Enrolment read the same catalogue — see
     lib/dashboard/course-options.ts for why that matters. */
  const options = useMemo(() => optionsFor(family), [family]);
  const gradesForSubject = useMemo(() => gradesFor(family, track), [family, track]);

  const readyLabel = useMemo(() => {
    if (!family || !track) return null;
    if (family !== 'focus' && !level) return null;
    return `${describeCourse(track, levelValue(family, level))} · ${ratio}`;
  }, [family, track, level, ratio]);

  const submit = async () => {
    if (!family || !track) return;
    const finalLevel = levelValue(family, level);
    if (!finalLevel) return;

    setSubmitting(true);
    setError(null);
    const result = await createCohortDetailed({
      track,
      country: country || undefined,
      // createCohort's type still names the three coding levels; the column and
      // its constraint accept the wider set (grade-N, focus).
      level: finalLevel as 'beginner' | 'intermediate' | 'advanced',
      ratio,
      max_capacity: ratio === '1:1' ? 1 : 4,
    });
    setSubmitting(false);

    // The reason comes from the database, not from a guess made here. This
    // message used to blame scripts/cohort-levels.sql for every failure, and
    // the first real failure was a missing `country` column in a different
    // migration entirely — so it sent somebody to check something that was fine.
    if (!result.id) {
      setError(result.error ?? 'Could not create the course.');
      return;
    }
    onCreated(readyLabel ?? 'Course created');
    reset();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={close}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[88vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog" aria-modal="true" aria-label="Create a new course"
          >
            <div className="flex items-center gap-2 mb-4">
              {family && (
                <button
                  onClick={() => { setFamily(null); setTrack(''); setLevel(''); }}
                  className="w-8 h-8 -ml-1 rounded-full hover:bg-slate-100 flex items-center justify-center"
                  aria-label="Back"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              <h3 className="text-lg font-extrabold text-slate-900 flex-1" style={{ fontFamily: 'var(--font-jakarta)' }}>
                Create New Course
              </h3>
              <button onClick={close} className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ── Step 1: what kind of class ────────────────────────────── */}
            {!family ? (
              <div className="space-y-2">
                <p className="text-[13px] text-slate-500 mb-3">
                  What are you scheduling? The levels differ by subject.
                </p>
                {COURSE_FAMILIES.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFamily(f.key)}
                    className="w-full text-left p-4 rounded-xl border-2 border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 transition-colors"
                  >
                    <p className="font-bold text-slate-900 text-[15px]" style={{ fontFamily: 'var(--font-grotesk)' }}>
                      {f.label}
                    </p>
                    <p className="text-[12.5px] text-slate-500 mt-0.5">{f.blurb}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {/* ── Step 2: which subject ──────────────────────────────── */}
                <div>
                  <label htmlFor="course-subject" className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
                    {family === 'coding' ? 'Track' : family === 'school' ? 'Subject' : 'Focus course'}
                  </label>
                  <select
                    id="course-subject"
                    value={track}
                    onChange={(e) => { setTrack(e.target.value); setLevel(''); }}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="">Choose one…</option>
                    {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>

                {/* ── Step 3: the level structure for that subject ───────── */}
                {track && family === 'coding' && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
                      Level
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {CODING_LEVELS.map((l) => (
                        <button
                          key={l}
                          onClick={() => setLevel(l)}
                          className={`h-11 rounded-xl text-sm font-bold border-2 capitalize transition-colors ${
                            level === l ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {track && family === 'school' && (
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
                      Grade
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {gradesForSubject.map((g) => (
                        <button
                          key={g}
                          onClick={() => setLevel(`grade-${g}`)}
                          className={`h-11 rounded-xl text-sm font-bold border-2 transition-colors ${
                            level === `grade-${g}` ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {g}
                        </button>
                      ))}
                    </div>
                    {gradesForSubject.length < ALL_GRADES.length && (
                      <p className="text-[11.5px] text-slate-400 mt-1.5 leading-[1.5]">
                        Only the grades this subject is taught for. Physics and Chemistry
                        start at grade 7 — before that it is Science.
                      </p>
                    )}
                  </div>
                )}

                {track && family === 'focus' && (
                  <p className="text-[12.5px] text-slate-500 leading-[1.55] bg-slate-50 rounded-lg px-3 py-2.5">
                    A focus course is 48 classes on one topic, not tied to a grade.
                    {suitsGrades(track) ? ` Usually suits ${suitsGrades(track)}.` : ''}
                  </p>
                )}

                {/* §8 — which region this batch's weekly slot suits. Optional:
                    left blank the batch is offered to everybody, which is how
                    every batch behaved before the field existed. */}
                <div>
                  <label htmlFor="course-country" className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
                    Country <span className="text-slate-400 normal-case tracking-normal font-semibold">(optional)</span>
                  </label>
                  <select
                    id="course-country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="">Any — offer to everybody</option>
                    {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <p className="text-[11.5px] text-slate-400 mt-1.5 leading-[1.5]">
                    A batch meets at the same time every week. Setting a country
                    stops it being offered to a child for whom that is 3am.
                  </p>
                </div>

                {/* ── Ratio ──────────────────────────────────────────────── */}
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
                    Ratio (mentor : students)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['1:1', '1:4'] as const).map((r) => (
                      <button
                        key={r}
                        onClick={() => setRatio(r)}
                        className={`h-11 rounded-xl text-sm font-bold border-2 transition-colors ${
                          ratio === r ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11.5px] text-slate-400 mt-1.5">
                    Sets the seat limit: {ratio === '1:1' ? 'one student' : 'four students'}. Enrolment is refused beyond it.
                  </p>
                </div>

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-700 leading-[1.55]">
                    {error}
                  </div>
                )}

                <button
                  onClick={submit}
                  disabled={submitting || !readyLabel}
                  className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold disabled:bg-slate-300 inline-flex items-center justify-center gap-2"
                  style={{ fontFamily: 'var(--font-grotesk)' }}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {readyLabel ? `Create — ${readyLabel}` : 'Choose a subject and level'}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
