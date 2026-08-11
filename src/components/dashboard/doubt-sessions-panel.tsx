'use client';

/**
 * SARIRO — DoubtSessionsPanel
 *
 * Teacher mode: see your doubt sessions; once HR approves one, add the recording
 * link and mark it conducted — that pays back the withheld half of a 1:1
 * no-show class.
 * HR mode: approve or reject the doubt sessions teachers request.
 */

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Check, X, Video, Clock } from 'lucide-react';
import { getTrackName } from '@/lib/dashboard/upsell-engine';

interface Session {
  id: string;
  status: 'requested' | 'hr_approved' | 'rejected' | 'conducted' | 'cancelled';
  teacher_id: string;
  teacher_name: string | null;
  track: string | null;
  level: string | null;
  class_date: string | null;
  notes: string | null;
  created_at: string;
}

const STATUS_STYLE: Record<string, string> = {
  requested: 'bg-amber-100 text-amber-700',
  hr_approved: 'bg-blue-100 text-blue-700',
  conducted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-600',
  cancelled: 'bg-slate-100 text-slate-500',
};

function fmt(iso: string | null): string {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }); }
  catch { return '—'; }
}

export function DoubtSessionsPanel({ mode }: { mode: 'teacher' | 'hr' }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [recordingUrl, setRecordingUrl] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const res = await fetch('/api/doubt-session');
    const j = await res.json();
    setSessions(j.ok ? j.sessions : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (payload: Record<string, unknown>, id: string) => {
    setBusyId(id);
    try {
      const res = await fetch('/api/doubt-session', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!j.ok) alert(j.message || j.error || 'Action failed.');
      await load();
    } finally { setBusyId(null); }
  };

  if (loading) return <div className="flex justify-center py-12 text-slate-400"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  if (sessions.length === 0) return <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">No doubt sessions {mode === 'hr' ? 'to review' : 'yet'}.</div>;

  return (
    <div className="space-y-2">
      {sessions.map((s) => (
        <div key={s.id} className="card-3d p-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {mode === 'hr' && <span className="text-sm font-bold text-slate-800 truncate">{s.teacher_name || 'Teacher'}</span>}
                <span className="text-sm font-bold text-slate-700 truncate">{s.track ? getTrackName(s.track) : 'Doubt session'}{s.level ? ` · ${s.level}` : ''}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[s.status] ?? 'bg-slate-100 text-slate-500'}`}>{s.status.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                <Clock className="w-3 h-3" /> Class: {fmt(s.class_date)} · requested {fmt(s.created_at)}
              </div>
            </div>

            {/* HR actions */}
            {mode === 'hr' && s.status === 'requested' && (
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => act({ action: 'approve', sessionId: s.id }, s.id)} disabled={busyId === s.id}
                  className="inline-flex items-center gap-1 min-h-[36px] px-3 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold disabled:opacity-50">
                  {busyId === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Approve
                </button>
                <button onClick={() => act({ action: 'reject', sessionId: s.id }, s.id)} disabled={busyId === s.id}
                  className="inline-flex items-center gap-1 min-h-[36px] px-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold disabled:opacity-50">
                  <X className="w-3.5 h-3.5" /> Reject
                </button>
              </div>
            )}

            {/* Teacher action: mark conducted once approved */}
            {mode === 'teacher' && s.status === 'hr_approved' && (
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                <input
                  value={recordingUrl[s.id] ?? ''}
                  onChange={(e) => setRecordingUrl((p) => ({ ...p, [s.id]: e.target.value }))}
                  placeholder="Recording link…"
                  className="flex-1 sm:w-56 min-h-[36px] px-3 rounded-lg border border-slate-200 text-xs"
                />
                <button
                  onClick={() => act({ action: 'conduct', sessionId: s.id, recordingUrl: recordingUrl[s.id] }, s.id)}
                  disabled={busyId === s.id || !(recordingUrl[s.id] ?? '').trim()}
                  className="inline-flex items-center gap-1 min-h-[36px] px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:bg-slate-300">
                  {busyId === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Video className="w-3.5 h-3.5" />} Mark conducted
                </button>
              </div>
            )}
          </div>
          {s.status === 'conducted' && s.notes && (
            <a href={s.notes} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-green-700 hover:underline">
              <Video className="w-3 h-3" /> Recording
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
