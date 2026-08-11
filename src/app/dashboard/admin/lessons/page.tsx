'use client';

/**
 * Admin Lessons — /dashboard/admin/lessons
 *
 * Bulk-create empty <h1> lesson pages for a course, then edit each page's HTML.
 * Admins have direct (RLS-permitted) access to lesson_pages, so editing reads
 * and writes the table straight from the browser client; the bulk seed goes
 * through /api/admin/lessons/seed (service role, idempotent).
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save, Wand2, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { COURSES } from '@/lib/sariro-data';
import { flattenCourseLessons, type OrderedLesson } from '@/lib/dashboard/lessons-data';

interface PageRow { module_num: number; lesson_index: number; html_content: string; title: string | null }

export default function AdminLessonsPage() {
  const supabase = createClient();
  const seedable = COURSES.filter((c) => Array.isArray(c.syllabus) && c.syllabus.length > 0);

  const [courseId, setCourseId] = useState(seedable.find((c) => c.id === 'python-elem')?.id ?? seedable[0]?.id ?? '');
  const [pages, setPages] = useState<Map<string, PageRow>>(new Map());
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const ordered = useMemo<OrderedLesson[]>(() => flattenCourseLessons(courseId), [courseId]);

  const loadPages = useCallback(async () => {
    if (!courseId) return;
    setLoading(true);
    const { data } = await supabase
      .from('lesson_pages')
      .select('module_num, lesson_index, html_content, title')
      .eq('course_id', courseId);
    const map = new Map<string, PageRow>();
    for (const r of (data ?? []) as PageRow[]) map.set(`${r.module_num}:${r.lesson_index}`, r);
    setPages(map);
    setLoading(false);
  }, [courseId, supabase]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => { if (active) { setActiveKey(null); loadPages(); } });
    return () => { active = false; };
  }, [loadPages]);

  const seed = async () => {
    setSeeding(true); setMsg(null);
    try {
      const res = await fetch('/api/admin/lessons/seed', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });
      const j = await res.json();
      setMsg(j.ok ? `Created pages for ${j.lessons} lessons (existing pages kept).` : `Seed failed: ${j.error}`);
      if (j.ok) await loadPages();
    } catch {
      setMsg('Network error.');
    } finally {
      setSeeding(false);
    }
  };

  const selectLesson = (l: OrderedLesson) => {
    const key = `${l.module_num}:${l.lesson_index}`;
    setActiveKey(key);
    setDraft(pages.get(key)?.html_content ?? `<h1>${l.lesson_name}</h1>`);
  };

  const save = async () => {
    if (!activeKey) return;
    const [m, i] = activeKey.split(':').map(Number);
    const lesson = ordered.find((l) => l.module_num === m && l.lesson_index === i);
    if (!lesson) return;
    setSaving(true); setMsg(null);
    const { error } = await supabase.from('lesson_pages').upsert({
      course_id: courseId, module_num: m, lesson_index: i,
      lesson_name: lesson.lesson_name, title: lesson.lesson_name,
      html_content: draft, published: true,
    }, { onConflict: 'course_id,module_num,lesson_index' });
    setSaving(false);
    if (error) { setMsg(`Save failed: ${error.message}`); return; }
    setMsg('Saved.');
    await loadPages();
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50 pb-20 lg:pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <Link href="/dashboard/admin" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </Link>
        <h1 className="text-2xl font-extrabold text-slate-900 mb-5" style={{ fontFamily: 'var(--font-jakarta)' }}>Lesson Pages</h1>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)}
            className="min-h-[40px] px-3 rounded-lg border border-slate-200 bg-white text-sm font-semibold">
            {seedable.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <button onClick={seed} disabled={seeding}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold disabled:opacity-50">
            {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} Generate empty pages
          </button>
          {msg && <span className="text-xs font-semibold text-slate-600">{msg}</span>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,340px)_1fr] gap-4">
          <div className="card-3d p-4 max-h-[70vh] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8 text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
            ) : (
              <div className="space-y-1">
                {ordered.map((l) => {
                  const key = `${l.module_num}:${l.lesson_index}`;
                  const has = pages.has(key);
                  return (
                    <button key={key} onClick={() => selectLesson(l)}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left min-h-[38px] transition-colors ${
                        activeKey === key ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50 border border-transparent'
                      }`}>
                      <span className="text-[10px] font-bold text-slate-400 w-8 shrink-0">M{l.module_num}</span>
                      <span className="min-w-0 flex-1 text-xs font-semibold text-slate-700 truncate">{l.lesson_name}</span>
                      {has ? <Check className="w-3.5 h-3.5 text-green-500 shrink-0" /> : <span className="text-[9px] font-bold text-slate-300 shrink-0">none</span>}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="card-3d p-4">
            {activeKey ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500">Editing HTML — raw content</span>
                  <button onClick={save} disabled={saving}
                    className="inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                  </button>
                </div>
                <textarea value={draft} onChange={(e) => setDraft(e.target.value)}
                  className="w-full h-[52vh] font-mono text-xs p-3 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  spellCheck={false} />
              </>
            ) : (
              <div className="text-center py-16 text-sm text-slate-400">Select a lesson to edit its page.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
