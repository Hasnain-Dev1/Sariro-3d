'use client';

/**
 * SARIRO — LessonsViewer
 *
 * Shared lesson browser for students and teachers. Fetches the access-resolved
 * lesson list for a course (/api/lessons/list) and renders it grouped by module
 * with per-lesson lock state. Clicking a VIEWABLE lesson loads its HTML
 * (/api/lessons/content) into a reading panel. Non-viewable lessons show a lock
 * and cannot be opened — the gating is enforced server-side either way.
 *
 *   Student → completed + current unlocked; upcoming locked.
 *   Teacher → EVERY lesson unlocked (review anything to finish training); the
 *             badge still reflects their taught progress (completed/current/
 *             next/upcoming) so the list doubles as a training tracker.
 */

import { useEffect, useState, useCallback } from 'react';
import { Lock, Check, PlayCircle, ChevronRight, Loader2, BookOpen } from 'lucide-react';
import { getStructuredCourse, getStructuredLesson } from '@/lib/curriculum';
import { StructuredLessonView } from '@/components/dashboard/structured-lesson-view';
import type { StructuredLesson } from '@/lib/curriculum/types';

interface LessonRow {
  module_num: number;
  module_name: string;
  lesson_index: number;
  lesson_name: string;
  order: number;
  access: 'completed' | 'current' | 'next' | 'upcoming' | 'locked';
  viewable: boolean;
}

const ACCESS_BADGE: Record<string, { label: string; cls: string }> = {
  completed: { label: 'Completed', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  current: { label: 'Current', cls: 'bg-green-50 text-green-700 border-green-200' },
  next: { label: 'Next', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  // "upcoming" is shown when the lesson is VIEWABLE (a teacher reviewing ahead
  // for training) — "locked" is the true not-viewable state (students only).
  upcoming: { label: 'Upcoming', cls: 'bg-slate-100 text-slate-500 border-slate-200' },
  locked: { label: 'Locked', cls: 'bg-slate-100 text-slate-400 border-slate-200' },
};

export function LessonsViewer({ courseId }: { courseId: string }) {
  const [lessons, setLessons] = useState<LessonRow[]>([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [content, setContent] = useState<{ html: string; name: string } | null>(null);
  const [structured, setStructured] = useState<StructuredLesson | null>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentError, setContentError] = useState<string | null>(null);
  /**
   * The lesson whose page could not be loaded, and why.
   *
   * "Not written yet" and "locked" are different situations and were being
   * shown with the same grey sentence. Locked is a rule the learner can act on
   * (their class has not reached it). Unwritten is our gap, not theirs — and it
   * is the common case: written pages exist for two and a half of forty-eight
   * courses, so every school subject lands here.
   */
  const [missingFor, setMissingFor] = useState<LessonRow | null>(null);

  // Courses listed in the curriculum registry render as rich 5-tab lessons
  // from codebase data instead of the DB html_content path.
  const structuredCourse = getStructuredCourse(courseId);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => { setLoading(true); setError(null); });
    fetch(`/api/lessons/list?courseId=${encodeURIComponent(courseId)}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (j.ok) { setLessons(j.lessons); setTitle(j.title); }
        else setError(j.error === 'not_enrolled' ? 'You are not enrolled in this course.'
          : j.error === 'not_eligible' ? 'You are not assigned to this course.'
          : 'Could not load lessons.');
      })
      .catch(() => { if (!cancelled) setError('Network error.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [courseId]);

  const openLesson = useCallback(async (l: LessonRow) => {
    if (!l.viewable) return;
    const key = `${l.module_num}:${l.lesson_index}`;
    setActiveKey(key); setContent(null); setStructured(null); setContentError(null); setMissingFor(null);

    // Structured curriculum: render straight from codebase data, no fetch.
    if (structuredCourse) {
      const lesson = getStructuredLesson(courseId, l.module_num, l.lesson_index);
      if (lesson) { setStructured(lesson); return; }
      // Same situation as a course with no structured curriculum at all: the
      // page is missing, the class still happens. web-201 alone puts 41
      // lessons through here.
      setMissingFor(l);
      return;
    }

    setContentLoading(true);
    try {
      const res = await fetch(`/api/lessons/content?courseId=${encodeURIComponent(courseId)}&module=${l.module_num}&index=${l.lesson_index}`);
      const j = await res.json();
      if (j.ok) {
        setContent({ html: j.page.html_content || '', name: j.page.lesson_name });
      } else if (j.error === 'not_found') {
        // Not an error the learner caused, so it does not get an error voice.
        setMissingFor(l);
      } else {
        setContentError('This lesson unlocks when your class reaches it.');
      }
    } catch {
      setContentError('Network error.');
    } finally {
      setContentLoading(false);
    }
  }, [courseId, structuredCourse]);

  if (loading) {
    return <div className="flex items-center justify-center py-12 text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  }
  if (error) {
    return <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">{error}</div>;
  }

  // Group by module for display.
  const modules = new Map<number, { name: string; rows: LessonRow[] }>();
  for (const l of lessons) {
    if (!modules.has(l.module_num)) modules.set(l.module_num, { name: l.module_name, rows: [] });
    modules.get(l.module_num)!.rows.push(l);
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,340px)_1fr] gap-4">
      {/* Lesson list */}
      <div className="card-3d p-4 max-h-[70vh] overflow-y-auto">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-extrabold text-slate-900 truncate" style={{ fontFamily: 'var(--font-jakarta)' }}>{title}</h3>
        </div>
        <div className="space-y-4">
          {[...modules.entries()].map(([num, mod]) => (
            <div key={num}>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
                Module {num} · {mod.name}
              </p>
              <div className="space-y-1">
                {mod.rows.map((l) => {
                  // Not-viewable always reads as "Locked" regardless of access
                  // label; a viewable-but-upcoming lesson (teachers) reads as
                  // "Upcoming" instead — it's open for review, just not taught yet.
                  const badge = !l.viewable ? ACCESS_BADGE.locked : (ACCESS_BADGE[l.access] ?? ACCESS_BADGE.upcoming);
                  const key = `${l.module_num}:${l.lesson_index}`;
                  const isActive = activeKey === key;
                  return (
                    <button
                      key={key}
                      onClick={() => openLesson(l)}
                      disabled={!l.viewable}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-colors min-h-[40px] ${
                        isActive ? 'bg-blue-50 border border-blue-200'
                        : l.viewable ? 'hover:bg-slate-50 border border-transparent'
                        : 'opacity-60 cursor-not-allowed border border-transparent'
                      }`}
                    >
                      <span className="shrink-0">
                        {l.access === 'completed' ? <Check className="w-4 h-4 text-blue-500" />
                          : !l.viewable ? <Lock className="w-4 h-4 text-slate-300" />
                          : <PlayCircle className="w-4 h-4 text-green-500" />}
                      </span>
                      <span className="min-w-0 flex-1 text-xs font-semibold text-slate-700 truncate">{l.lesson_name}</span>
                      <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold border ${badge.cls}`}>{badge.label}</span>
                      {l.viewable && <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reading panel */}
      <div className="card-3d p-6 min-h-[300px]">
        {contentLoading ? (
          <div className="flex items-center justify-center py-16 text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
        ) : contentError ? (
          <div className="text-center py-16 text-sm text-slate-500">{contentError}</div>
        ) : missingFor ? (
          /* Sariro classes are taught live by a mentor — the written page is a
             companion to that, not the product. Saying "has not been created
             yet" to someone who has paid reads as a broken app; saying what the
             lesson IS and where it happens is both true and useful. */
          <div className="py-14 px-6 text-center">
            <BookOpen className="w-8 h-8 mx-auto mb-3 text-slate-300" />
            <p className="font-bold text-slate-900 text-[15px] mb-1.5">{missingFor.lesson_name}</p>
            <p className="text-[13.5px] text-slate-600 leading-[1.65] max-w-md mx-auto">
              This one is taught live with your mentor — there is no written page for it yet. Your
              teacher brings the plan to the class.
            </p>
            <p className="text-[12.5px] text-slate-400 mt-3">
              Module {missingFor.module_num} · {missingFor.module_name}
            </p>
          </div>
        ) : structured ? (
          <StructuredLessonView lesson={structured} />
        ) : content ? (
          <article className="lesson-content prose max-w-none" dangerouslySetInnerHTML={{ __html: content.html }} />
        ) : (
          <div className="text-center py-16 text-slate-400">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">Select a lesson to read it.</p>
          </div>
        )}
      </div>
    </div>
  );
}
