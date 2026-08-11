'use client';

/**
 * SARIRO — SupportPanel
 *
 * Student support chat, shared by the student view and the admin inbox. Queries
 * and messages are read directly (RLS scopes them: a student sees only their
 * own; an admin sees the ones routed to them). All writes go through
 * /api/support, which also routes new queries to the teacher's assigned admin.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Send, Plus, MessageSquare, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Query { id: string; subject: string; status: string; last_message_at: string; student_id: string }
interface Message { id: string; query_id: string; sender_id: string; body: string; created_at: string }

export function SupportPanel({ mode }: { mode: 'student' | 'admin' }) {
  const supabase = createClient();
  const [uid, setUid] = useState<string | null>(null);
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newBody, setNewBody] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const loadQueries = useCallback(async () => {
    const { data } = await supabase.from('support_queries')
      .select('id, subject, status, last_message_at, student_id')
      .order('last_message_at', { ascending: false });
    setQueries((data ?? []) as Query[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!cancelled) setUid(user?.id ?? null);
      await loadQueries();
    })();
    return () => { cancelled = true; };
  }, [supabase, loadQueries]);

  const loadMessages = useCallback(async (queryId: string) => {
    const { data } = await supabase.from('support_messages')
      .select('id, query_id, sender_id, body, created_at')
      .eq('query_id', queryId).order('created_at', { ascending: true });
    setMessages((data ?? []) as Message[]);
    Promise.resolve().then(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }));
  }, [supabase]);

  useEffect(() => { if (activeId) loadMessages(activeId); }, [activeId, loadMessages]);

  const send = async () => {
    if (!draft.trim() || !activeId) return;
    setBusy(true);
    try {
      const res = await fetch('/api/support', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'message', queryId: activeId, body: draft.trim() }),
      });
      const j = await res.json();
      if (j.ok) { setDraft(''); await loadMessages(activeId); await loadQueries(); }
    } finally { setBusy(false); }
  };

  const createQuery = async () => {
    if (!newSubject.trim() || !newBody.trim()) return;
    setBusy(true);
    try {
      const res = await fetch('/api/support', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', subject: newSubject.trim(), body: newBody.trim() }),
      });
      const j = await res.json();
      if (j.ok) { setCreating(false); setNewSubject(''); setNewBody(''); await loadQueries(); setActiveId(j.queryId); }
    } finally { setBusy(false); }
  };

  const setStatus = async (status: string) => {
    if (!activeId) return;
    await fetch('/api/support', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'status', queryId: activeId, status }),
    });
    await loadQueries();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,320px)_1fr] gap-4">
      {/* Query list */}
      <div className="card-3d p-4 max-h-[72vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5" style={{ fontFamily: 'var(--font-jakarta)' }}>
            <MessageSquare className="w-4 h-4 text-blue-600" /> {mode === 'admin' ? 'Assigned queries' : 'My queries'}
          </h3>
          {mode === 'student' && (
            <button onClick={() => { setCreating(true); setActiveId(null); }} className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700">
              <Plus className="w-3.5 h-3.5" /> New
            </button>
          )}
        </div>
        {loading ? (
          <div className="flex justify-center py-8 text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
        ) : queries.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No support queries yet.</p>
        ) : (
          <div className="space-y-1">
            {queries.map((q) => (
              <button key={q.id} onClick={() => { setActiveId(q.id); setCreating(false); }}
                className={`w-full text-left px-2.5 py-2 rounded-lg min-h-[44px] transition-colors ${activeId === q.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-slate-50 border border-transparent'}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800 truncate">{q.subject}</span>
                  <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${q.status === 'resolved' || q.status === 'closed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{q.status}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Thread / composer */}
      <div className="card-3d p-4 flex flex-col min-h-[300px]">
        {creating ? (
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>New support query</h3>
            <input value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="Subject" maxLength={200}
              className="w-full min-h-[40px] px-3 rounded-lg border border-slate-200 text-sm" />
            <textarea value={newBody} onChange={(e) => setNewBody(e.target.value)} placeholder="Describe your issue…" maxLength={2000}
              className="w-full h-40 p-3 rounded-lg border border-slate-200 text-sm" />
            <div className="flex gap-2">
              <button onClick={() => setCreating(false)} className="flex-1 min-h-[44px] rounded-lg bg-slate-100 text-slate-700 text-sm font-bold">Cancel</button>
              <button onClick={createQuery} disabled={busy || !newSubject.trim() || !newBody.trim()}
                className="flex-1 min-h-[44px] rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold disabled:bg-slate-300 flex items-center justify-center gap-2">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send to my admin
              </button>
            </div>
          </div>
        ) : !activeId ? (
          <div className="flex-1 flex items-center justify-center text-sm text-slate-400">
            {mode === 'student' ? 'Select a query or start a new one.' : 'Select a query to respond.'}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500">Conversation</span>
              {mode === 'admin' && (
                <button onClick={() => setStatus('resolved')} className="inline-flex items-center gap-1 text-xs font-bold text-green-600 hover:text-green-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Mark resolved
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 mb-3 max-h-[52vh]">
              {messages.map((m) => {
                const mine = m.sender_id === uid;
                return (
                  <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${mine ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-slate-100 text-slate-800 rounded-bl-sm'}`}>
                      {m.body}
                    </div>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>
            <div className="flex items-center gap-2">
              <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
                placeholder="Type a message…" className="flex-1 min-h-[44px] px-3 rounded-lg border border-slate-200 text-sm" />
              <button onClick={send} disabled={busy || !draft.trim()} className="min-h-[44px] px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold disabled:bg-slate-300 flex items-center gap-1">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
