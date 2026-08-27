'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Compass, Users, BookOpen, X } from 'lucide-react';

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

const ACCENTS: Record<string, string> = {
  mathematics: '#2563EB',
  science: '#0891B2',
  technology: '#7C3AED',
  'engineering-and-making': '#EA580C',
  'language-and-communication': '#DB2777',
  humanities: '#CA8A04',
  arts: '#DC2626',
  'business-and-economics': '#059669',
  'health-and-body': '#16A34A',
  'learning-itself': '#0F172A',
};

export default function ExploreMap({ domains }: { domains: MapDomain[] }) {
  const [query, setQuery] = useState('');

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
      <div className="sticky top-16 z-20 -mx-5 sm:-mx-8 px-5 sm:px-8 py-4 bg-white/80 backdrop-blur-xl border-b border-slate-200/70">
        <div className="relative max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What do you want to learn?"
            aria-label="Search the map"
            className="w-full h-12 pl-11 pr-11 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 text-[15px] outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-900/5 transition"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {query && (
          <p className="text-center text-xs text-slate-500 mt-3">
            {shownStrands} of {totalStrands} strands{shownStrands === 0 ? '' : ` in ${filtered.length} ${filtered.length === 1 ? 'domain' : 'domains'}`}
          </p>
        )}
      </div>

      {/* ── the map ────────────────────────────────────────────────────── */}
      <div className="py-14 sm:py-20 space-y-16 sm:space-y-24">
        {filtered.map((domain, di) => {
          const accent = ACCENTS[domain.slug] ?? '#2563EB';
          return (
            <motion.section
              key={domain.slug}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: Math.min(di, 3) * 0.04 }}
            >
              <div className="flex items-baseline gap-3 flex-wrap mb-2">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                  {domain.name}
                </h2>
                <span
                  className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full"
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
              <p className="text-slate-600 text-[15px] max-w-2xl mb-7">{domain.description}</p>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {domain.strands.map((strand) => (
                  <div
                    key={strand.slug}
                    className="group relative rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-300 hover:shadow-[0_8px_30px_-12px_rgba(15,23,42,0.15)] transition-all duration-300"
                  >
                    <span
                      aria-hidden
                      className="absolute left-0 top-5 bottom-5 w-[3px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: accent }}
                    />
                    <h3 className="font-semibold text-slate-900 text-[15px] leading-snug mb-1.5">
                      {strand.name}
                    </h3>
                    <p className="text-[13.5px] leading-relaxed text-slate-600 mb-4">
                      {strand.description}
                    </p>
                    {strand.lessonCount > 0 ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-700">
                        <BookOpen className="w-3.5 h-3.5" style={{ color: accent }} />
                        {strand.lessonCount} {strand.lessonCount === 1 ? 'lesson' : 'lessons'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                        <Users className="w-3.5 h-3.5" />
                        Mentor-led
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </motion.section>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-24">
            <Compass className="w-10 h-10 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-900 font-semibold mb-1">Nothing on the map matches that yet.</p>
            <p className="text-slate-500 text-sm max-w-md mx-auto">
              The map grows with the learners on it. Tell us what you were looking for and it may be
              the next thing we add.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
