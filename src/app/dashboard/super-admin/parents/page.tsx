'use client';

/**
 * Parent Course Eligibility — /dashboard/super-admin/parents  (super-admin only)
 *
 * Search any user, then grant/revoke course (track + level) eligibility for them
 * as a parent. Assigning flags is_parent = true on their profile.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Search, Loader2, Plus, Trash2, Users2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { fetchUsers, type UserRow } from '@/lib/dashboard/admin-data';
import { TRACKS } from '@/lib/sariro-data';
import { ALL_LEVELS, getTrackName } from '@/lib/dashboard/teacher-assignments-data';

interface PAssignment { track: string; level: string }

export default function ParentEligibilityPage() {
  const supabase = createClient();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [selected, setSelected] = useState<UserRow | null>(null);

  const [assignments, setAssignments] = useState<PAssignment[]>([]);
  const [newTrack, setNewTrack] = useState<string>(TRACKS[0]?.id ?? '');
  const [newLevel, setNewLevel] = useState<string>('Elementary');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => { const t = setTimeout(() => setDebounced(search), 300); return () => clearTimeout(t); }, [search]);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => setLoadingUsers(true));
    fetchUsers(debounced).then((rows) => { if (!cancelled) { setUsers(rows.slice(0, 25)); setLoadingUsers(false); } });
    return () => { cancelled = true; };
  }, [debounced]);

  const loadAssignments = useCallback(async (parentId: string) => {
    const { data } = await supabase.from('parent_course_assignments').select('track, level').eq('parent_id', parentId);
    setAssignments((data ?? []) as PAssignment[]);
  }, [supabase]);

  useEffect(() => {
    if (selected) loadAssignments(selected.id);
    else Promise.resolve().then(() => setAssignments([]));
  }, [selected, loadAssignments]);

  const post = async (action: 'assign' | 'remove', track: string, level: string) => {
    if (!selected) return;
    setBusy(true); setMsg(null);
    try {
      const res = await fetch('/api/admin/parent-assignments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, parent_id: selected.id, track, level }),
      });
      const j = await res.json();
      if (j.ok) { await loadAssignments(selected.id); setMsg(action === 'assign' ? 'Granted.' : 'Removed.'); }
      else setMsg(j.message || j.error || 'Failed.');
    } catch { setMsg('Network error.'); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50 pb-20 lg:pb-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        <Link href="/dashboard/super-admin" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </Link>
        <div className="flex items-center gap-2 mb-5">
          <Users2 className="w-6 h-6 text-violet-600" />
          <h1 className="text-2xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>Parent Course Eligibility</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,360px)_1fr] gap-4">
          {/* User search */}
          <div className="card-3d p-4">
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email…"
                className="w-full min-h-[40px] pl-9 pr-3 rounded-lg border border-slate-200 text-sm" />
            </div>
            <div className="space-y-1 max-h-[60vh] overflow-y-auto">
              {loadingUsers ? (
                <div className="flex justify-center py-6 text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
              ) : users.map((u) => (
                <button key={u.id} onClick={() => setSelected(u)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg min-h-[44px] transition-colors ${selected?.id === u.id ? 'bg-violet-50 border border-violet-200' : 'hover:bg-slate-50 border border-transparent'}`}>
                  <div className="text-sm font-bold text-slate-800 truncate">{u.full_name || 'Unnamed'}</div>
                  <div className="text-xs text-slate-500 truncate">{u.email || '—'}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Assignment editor */}
          <div className="card-3d p-4">
            {!selected ? (
              <div className="text-center py-16 text-sm text-slate-400">Select a user to manage their parent eligibility.</div>
            ) : (
              <>
                <div className="mb-4">
                  <p className="text-sm font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>{selected.full_name || 'Unnamed'}</p>
                  <p className="text-xs text-slate-500">{selected.email}</p>
                </div>

                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Eligible courses</p>
                {assignments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic mb-3">No courses assigned yet.</p>
                ) : (
                  <div className="space-y-1 mb-3">
                    {assignments.map((a, i) => (
                      <div key={i} className="flex items-center justify-between gap-2 bg-slate-50 rounded-lg p-2">
                        <span className="text-xs font-bold text-slate-700">{getTrackName(a.track)} · {a.level}</span>
                        <button onClick={() => post('remove', a.track, a.level)} disabled={busy}
                          className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center disabled:opacity-50">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <select value={newTrack} onChange={(e) => setNewTrack(e.target.value)} className="flex-1 min-h-[40px] rounded-lg border border-slate-300 px-2 text-xs bg-white">
                    {TRACKS.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <select value={newLevel} onChange={(e) => setNewLevel(e.target.value)} className="min-h-[40px] rounded-lg border border-slate-300 px-2 text-xs bg-white">
                    {ALL_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                  <button onClick={() => post('assign', newTrack, newLevel)} disabled={busy}
                    className="min-h-[40px] px-3 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold flex items-center gap-1 disabled:bg-slate-300">
                    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Add
                  </button>
                </div>
                {msg && <p className="text-xs text-slate-500 mt-2">{msg}</p>}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
