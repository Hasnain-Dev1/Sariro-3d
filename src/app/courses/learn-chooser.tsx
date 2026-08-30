import Link from 'next/link';
import {
  ArrowRight,
  Atom,
  BookOpen,
  Code2,
  Compass,
  Dna,
  FlaskConical,
  Microscope,
  Sigma,
  type LucideIcon,
} from 'lucide-react';
import {
  GRADE_GROUPS,
  LESSONS_PER_GRADE,
  SCHOOL_SUBJECTS,
  SPECIALISATIONS,
} from '@/lib/school/curriculum';

/**
 * SARIRO — the one place you choose what to learn
 * =========================================================
 * Before this existed a visitor had to already know which of three pages they
 * wanted: `/courses` for coding, `/subjects` for school subjects, `/explore` for
 * the capability map. Nobody arrives knowing that. A parent looking for maths
 * landed on a coding catalogue and left.
 *
 * So coding stops being a separate destination and becomes one card among the
 * subjects. It is first because it is the flagship, and it is the only card that
 * does not navigate away — it drops to the coding catalogue further down this
 * same page, which is the view that already works and that people already link
 * to.
 *
 * The capability map is not deleted, and not a peer of these cards either. It
 * answers a different question — "what could I become?" rather than "what do you
 * teach?" — so it sits at the end as a second lens for the visitor who is not
 * shopping for a subject at all.
 */

/** One icon per subject. Colour comes from the subject's own accent. */
const SUBJECT_ICONS: Record<string, LucideIcon> = {
  mathematics: Sigma,
  science: Microscope,
  physics: Atom,
  chemistry: FlaskConical,
  biology: Dna,
  english: BookOpen,
};

const CODING_ACCENT = '#EA580C';

export default function LearnChooser() {
  return (
    <>
      <section className="relative py-14 sm:py-20 bg-white">
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-10">
            <span
              className="inline-block text-xs font-bold uppercase tracking-[0.18em] text-blue-600 mb-3"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              Everything we teach
            </span>
            <h2
              className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-[-0.02em]"
              style={{ fontFamily: 'var(--font-jakarta)' }}
            >
              What do you want to learn?
            </h2>
            <p className="mt-3 text-slate-600 text-[15px] leading-[1.65]">
              Every one of these is live and mentored, in small batches, with a real human who knows
              your name. Pick the subject — we will find a batch that fits your timings.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Coding first, and staying on this page. */}
            <Link
              href="#catalog"
              className="card card--feature group flex flex-col"
              style={{ ['--accent' as string]: CODING_ACCENT }}
            >
              <span className="flex items-center gap-3 mb-3">
                <span
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${CODING_ACCENT}14`, color: CODING_ACCENT }}
                >
                  <Code2 className="w-5 h-5" strokeWidth={2.2} />
                </span>
                <span
                  className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
                  style={{ color: CODING_ACCENT, background: `${CODING_ACCENT}14` }}
                >
                  Any age
                </span>
              </span>

              <h3 className="text-xl font-bold text-slate-900 tracking-[-0.01em] mb-2">
                Coding Beyond School
              </h3>
              <p className="text-[14px] leading-[1.6] text-slate-600 flex-1">
                Not tied to a grade. Four tracks by what you can already do — from first steps to
                shipping applications people actually use.
              </p>

              <span className="card-meta flex items-center justify-between">
                <span className="text-[13px] text-slate-500">4 tracks · all levels</span>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all duration-300" />
              </span>
            </Link>

            {SCHOOL_SUBJECTS.map((subject) => {
              const Icon = SUBJECT_ICONS[subject.slug] ?? BookOpen;
              const groups = GRADE_GROUPS.filter((g) => subject.groups.includes(g.slug));
              const lowest = groups[0]?.grades[0];
              const highest = groups[groups.length - 1]?.grades.slice(-1)[0];

              return (
                <Link
                  key={subject.slug}
                  href={`/subjects/${subject.slug}`}
                  className="card card--feature group flex flex-col"
                  style={{ ['--accent' as string]: subject.accent }}
                >
                  <span className="flex items-center gap-3 mb-3">
                    <span
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${subject.accent}14`, color: subject.accent }}
                    >
                      <Icon className="w-5 h-5" strokeWidth={2.2} />
                    </span>
                    <span
                      className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full tabular-nums"
                      style={{ color: subject.accent, background: `${subject.accent}14` }}
                    >
                      Grades {lowest}–{highest}
                    </span>
                  </span>

                  <h3 className="text-xl font-bold text-slate-900 tracking-[-0.01em] mb-2">
                    {subject.tagline}
                  </h3>
                  <p className="text-[14px] leading-[1.6] text-slate-600 flex-1">
                    {subject.description}
                  </p>

                  <span className="card-meta flex items-center justify-between">
                    <span className="text-[13px] text-slate-500 tabular-nums">
                      {LESSONS_PER_GRADE} classes a year
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all duration-300" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── focus courses ────────────────────────────────────────────────── */}
      <section className="relative py-14 sm:py-20 bg-slate-50 border-t border-slate-100">
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-8">
            <h2
              className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-[-0.02em]"
              style={{ fontFamily: 'var(--font-jakarta)' }}
            >
              Or fix one thing
            </h2>
            <p className="mt-2.5 text-slate-600 text-[15px] leading-[1.65]">
              Focus courses take a single topic — usually the one someone has decided they are bad
              at — and spend {LESSONS_PER_GRADE} classes on it. Not tied to a grade: take Algebra at
              sixteen if that is where the gap is, or Public Speaking at forty.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SPECIALISATIONS.map((spec) => (
              <Link
                key={spec.slug}
                href={`/subjects/focus/${spec.slug}`}
                className="card group flex flex-col"
                style={{ ['--accent' as string]: spec.accent }}
              >
                <span
                  className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full self-start mb-3"
                  style={{ color: spec.accent, background: `${spec.accent}14` }}
                >
                  {spec.suitsGrades}
                </span>
                <p className="font-bold text-slate-900 text-[16px] mb-1.5">{spec.name}</p>
                <p className="text-[13.5px] leading-[1.6] text-slate-600 flex-1">
                  {spec.description}
                </p>
                <span className="card-meta flex items-center justify-between">
                  <span className="text-[12.5px] text-slate-500 tabular-nums">
                    {LESSONS_PER_GRADE} classes
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all duration-300" />
                </span>
              </Link>
            ))}
          </div>

          {/* The map, as a second lens rather than a fourth catalogue. */}
          <Link
            href="/explore"
            className="mt-8 card card--feature group flex flex-col sm:flex-row sm:items-center gap-4"
            style={{ ['--accent' as string]: '#7C3AED' }}
          >
            <span
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: '#7C3AED14', color: '#7C3AED' }}
            >
              <Compass className="w-5 h-5" strokeWidth={2.2} />
            </span>
            <span className="flex-1">
              <span className="block font-bold text-slate-900 text-[16px] mb-1">
                Not sure which subject? Start from what you want to become.
              </span>
              <span className="block text-[13.5px] leading-[1.6] text-slate-600">
                The Sariro map — ten domains and sixty-eight strands of human capability. Pick a
                direction instead of a course, and go as deep as you want.
              </span>
            </span>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 group-hover:translate-x-0.5 transition-all duration-300 shrink-0" />
          </Link>
        </div>
      </section>
    </>
  );
}
