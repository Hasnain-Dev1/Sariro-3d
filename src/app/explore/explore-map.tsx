'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Search, Compass, Users, BookOpen, X, ArrowRight } from 'lucide-react';
import {
  REDUCED,
  SPRING,
  SPRING_QUICK,
  VIEWPORT,
  reflowVariants,
  revealVariants,
  staggerDelay,
} from '@/lib/motion';
import { accentFor } from '@/lib/capabilities/accents';

/**
 * SARIRO — The map, rendered.
 * =========================================================
 * Deliberately NOT a course grid. There are no prices, no "enrol", no badges, no
 * thumbnails and nothing to buy. It is an outline of what a person can become
 * capable of, and the honest state of each part of it.
 *
 * Two states a strand can be in, and we show which:
 *   · MENTOR-LED  — no authored lessons; a mentor teaches it directly
 *   · N LESSONS   — authored material exists behind it
 *
 * Showing the empty parts is the point. A map that hides where it is thin is a
 * catalog pretending to be a map, and the learner finds out later anyway.
 *
 * ── On the look ───────────────────────────────────────────────────────────
 * Light, not dark: the rest of the site is light, and a dark map would read as a
 * different website rather than a different world. "Expensive" here comes from
 * precision — spring motion, shadow used as *light* rather than grey, hairline
 * borders doing the structural work, and exactly one accent per domain. Vision
 * §11: it should still look excellent in five years, which rules out neon.
 */

export interface MapStrand {
  slug: string;
  name: string;
  description: string;
  lessonCount: number;
  /** Subject words a learner would type, plus the titles of any lessons behind it. */
  searchTerms: string;
}

export interface MapDomain {
  slug: string;
  name: string;
  description: string;
  isMeta: boolean;
  strands: MapStrand[];
}



export default function ExploreMap({ domains }: { domains: MapDomain[] }) {
  const [query, setQuery] = useState('');
  const reduced = useReducedMotion();
  const spring = reduced ? REDUCED : SPRING;
  const springQuick = reduced ? REDUCED : SPRING_QUICK;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return domains;
    return domains
      .map((d) => {
        // A domain matching by name keeps all its strands, so searching
        // "science" shows the whole field rather than an arbitrary subset.
        if (d.name.toLowerCase().includes(q)) return d;
        // searchTerms carries subject words and lesson titles, so "fractions",
        // "python" and "memory" reach the right strand even though the map is
        // written in capability language.
        const strands = d.strands.filter(
          (s) =>
            s.name.toLowerCase().includes(q) ||
            s.description.toLowerCase().includes(q) ||
            s.searchTerms.includes(q)
        );
        return { ...d, strands };
      })
      .filter((d) => d.strands.length > 0);
  }, [domains, query]);

  const totalStrands = domains.reduce((n, d) => n + d.strands.length, 0);
  const shownStrands = filtered.reduce((n, d) => n + d.strands.length, 0);

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8">
      {/* ── search ─────────────────────────────────────────────────────── */}
      <div className="sticky top-16 z-20 -mx-5 sm:-mx-8 px-5 sm:px-8 py-4 glass-panel border-x-0 border-t-0 rounded-none">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What do you want to learn?"
            aria-label="Search the map"
            className="w-full h-12 pl-11 pr-11 rounded-xl border border-slate-200/90 bg-white/90 text-slate-900 placeholder:text-slate-400 text-[15px] outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-900/5 transition-[border-color,box-shadow] duration-300"
          />
          <AnimatePresence>
            {query && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={springQuick}
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Tabular figures: proportional numerals shift width as the count
            changes, which reads as a glitch rather than a transition. */}
        <AnimatePresence>
          {query && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={springQuick}
              className="text-center text-xs text-slate-500 mt-3 tabular-nums"
            >
              <motion.span
                key={shownStrands}
                initial={{ opacity: 0.4 }}
                animate={{ opacity: 1 }}
                transition={springQuick}
                className="font-semibold text-slate-700"
              >
                {shownStrands}
              </motion.span>{' '}
              of {totalStrands} strands
              {shownStrands > 0 &&
                ` in ${filtered.length} ${filtered.length === 1 ? 'domain' : 'domains'}`}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* ── the map ────────────────────────────────────────────────────── */}
      <div className="py-14 sm:py-20 space-y-16 sm:space-y-24">
        {filtered.map((domain, di) => {
          const accent = accentFor(domain.slug);
          return (
            <motion.section
              key={domain.slug}
              layout={!reduced}
              variants={revealVariants}
              initial="hidden"
              whileInView="visible"
              viewport={VIEWPORT}
              transition={{ ...spring, delay: staggerDelay(di) }}
            >
              <div className="flex items-baseline gap-3 flex-wrap mb-2">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-[-0.02em] text-slate-900">
                  {domain.name}
                </h2>
                <span
                  className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full tabular-nums"
                  style={{ color: accent, background: `${accent}14` }}
                >
                  {domain.strands.length} {domain.strands.length === 1 ? 'strand' : 'strands'}
                </span>
                {domain.isMeta && (
                  <span className="text-[11px] font-medium text-slate-500">
                    how you learn everything else
                  </span>
                )}
              </div>
              <p className="text-slate-600 text-[15px] leading-[1.65] max-w-2xl mb-7">
                {domain.description}
              </p>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <AnimatePresence mode="popLayout">
                  {domain.strands.map((strand) => (
                    <motion.div
                      key={strand.slug}
                      layout={!reduced}
                      variants={reflowVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      transition={spring}
                      // Hover is physical: the card lifts and its shadow deepens
                      // with the accent, rather than just changing colour.
                      whileHover={reduced ? undefined : { y: -2 }}
                    >
                      <Link
                        href={`/explore/${strand.slug}`}
                        className="strand-card group relative flex flex-col h-full rounded-2xl border border-slate-200/80 bg-white p-5"
                        style={{ ['--accent' as string]: accent }}
                      >
                        <span
                          aria-hidden
                          className="absolute left-0 top-5 bottom-5 w-[3px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          style={{ background: accent }}
                        />
                        <h3 className="font-semibold text-slate-900 text-[15px] leading-snug mb-1.5">
                          {strand.name}
                        </h3>
                        <p className="text-[13.5px] leading-[1.6] text-slate-600 mb-4 flex-1">
                          {strand.description}
                        </p>
                        {strand.lessonCount > 0 ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 tabular-nums">
                            <BookOpen className="w-3.5 h-3.5" style={{ color: accent }} />
                            {strand.lessonCount} {strand.lessonCount === 1 ? 'lesson' : 'lessons'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                            <Users className="w-3.5 h-3.5" />
                            Mentor-led
                          </span>
                        )}
                        <ArrowRight className="absolute right-4 bottom-5 w-4 h-4 text-slate-200 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all duration-300" />
                      </Link>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.section>
          );
        })}

        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={spring}
            className="text-center py-24"
          >
            <Compass className="w-10 h-10 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-900 font-semibold mb-1">Nothing on the map matches that yet.</p>
            <p className="text-slate-500 text-sm max-w-md mx-auto leading-[1.65]">
              The map grows with the learners on it. Tell us what you were looking for and it may be
              the next thing we add.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
