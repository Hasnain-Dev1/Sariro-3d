'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  MessageSquare, Plus, Search, Send, ArrowLeft, Loader2, X, AlertCircle, ShieldAlert,
} from 'lucide-react';
import {
  fetchConversations, fetchDirectory, fetchMessages, markRead, openConversationWith,
  sendMessage, describe, whenShort, DESIGNATION_LABEL, DESIGNATION_TONE,
  type ConversationSummary, type Message, type Person, type Designation,
} from '@/lib/dashboard/messaging';

/**
 * SARIRO — Messages
 * =========================================================
 * One chat for the whole organisation. A student writes to their teacher; a
 * teacher writes to HR about a settlement; an admin tells a teacher their class
 * moved. Same screen, same rules, one place to look.
 *
 * ── Everyone wears their designation ────────────────────────────────────────
 * The first question in any of these conversations is "who is this?", so the
 * answer is never more than one glance away: the badge sits beside the name in
 * the list, in the thread header, and in the directory. Teachers additionally
 * carry their tier, because that is what colleagues need to know about a
 * teacher. The badge is a colour AND a word — the colour alone would be a
 * guess for anyone who cannot separate the hues.
 *
 * ── Two panes on desktop, one at a time on a phone ──────────────────────────
 * Most of the people using this are on phones between classes. A phone shows
 * either the list or the thread, never a squeezed pair.
 *
 * ── Why it polls ────────────────────────────────────────────────────────────
 * Every read goes through /api/messaging (see that file for why), so there is
 * no socket to subscribe to. It polls, slowly, and only while the tab is
 * actually being looked at — a dashboard left open on a staffroom screen
 * should not spend the night talking to the server.
 */

const POLL_LIST_MS = 15_000;
const POLL_THREAD_MS = 8_000;

function initials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0] ?? '').join('').toUpperCase() || '?';
}

function Badge({ designation, tier }: { designation: Designation; tier?: number | null }) {
  const tone = DESIGNATION_TONE[designation];
  return (
    <span
      className="text-[10px] font-black tracking-wider px-1.5 py-0.5 rounded uppercase whitespace-nowrap"
      style={{ color: tone.fg, background: tone.bg }}
    >
      {DESIGNATION_LABEL[designation]}
      {designation === 'teacher' && tier ? ` · T${tier}` : ''}
    </span>
  );
}

function Avatar({ person, size = 40 }: { person: Person | null; size?: number }) {
  const tone = person ? DESIGNATION_TONE[person.designation] : DESIGNATION_TONE.student;
  return (
    <div
      className="rounded-full flex items-center justify-center font-extrabold shrink-0"
      style={{
        width: size, height: size, background: tone.bg, color: tone.fg,
        fontSize: size * 0.36, fontFamily: 'var(--font-grotesk)',
      }}
      aria-hidden="true"
    >
      {initials(person?.name ?? '?')}
    </div>
  );
}

/** Day heading between message groups. "Today", "Yesterday", then the date. */
function dayLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const today = new Date();
  const yest = new Date(today.getTime() - 86_400_000);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yest.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: d.getFullYear() === today.getFullYear() ? undefined : 'numeric' });
}

export default function MessagesPanel() {
  const [conversations, setConversations] = useState<ConversationSummary[] | null>(null);
  const [myRole, setMyRole] = useState<Designation | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  /* A refusal under the contact-details rule. Kept apart from `notice` because
     it is not a fault — it is the policy, and it reads differently. */
  const [refused, setRefused] = useState<string | null>(null);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [meId, setMeId] = useState<string>('');
  const [threadLoading, setThreadLoading] = useState(false);

  const [picking, setPicking] = useState(false);
  const [query, setQuery] = useState('');
  const [people, setPeople] = useState<Person[] | null>(null);
  const [peopleError, setPeopleError] = useState<string | null>(null);

  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const active = useMemo(
    () => conversations?.find((c) => c.id === activeId) ?? null,
    [conversations, activeId]
  );

  /* ── the list ─────────────────────────────────────────────────────────── */
  const loadList = useCallback(async () => {
    try {
      const { conversations: rows, me } = await fetchConversations();
      setConversations(rows);
      setMyRole(me);
      setListError(null);
    } catch (e) {
      setListError(e instanceof Error ? e.message : 'Could not load your messages.');
    }
  }, []);

  useEffect(() => {
    void loadList();
    const t = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') void loadList();
    }, POLL_LIST_MS);
    return () => clearInterval(t);
  }, [loadList]);

  /* ── the open thread ──────────────────────────────────────────────────── */
  const loadThread = useCallback(
    async (id: string, showSpinner: boolean, stale: () => boolean) => {
      if (showSpinner) setThreadLoading(true);
      try {
        const { messages: rows, meId: mine } = await fetchMessages(id);
        // A slow reply from a thread the user has since left must not land on
        // top of the one they are reading now.
        if (stale()) return;
        setMessages(rows);
        setMeId(mine);
        setNotice(null);
      } catch (e) {
        if (!stale()) setNotice(e instanceof Error ? e.message : 'Could not load that conversation.');
      } finally {
        if (showSpinner && !stale()) setThreadLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!activeId) { setMessages([]); return; }
    let cancelled = false;
    const stale = () => cancelled;
    void loadThread(activeId, true, stale);
    void markRead(activeId).then(loadList);
    const t = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        void loadThread(activeId, false, stale);
      }
    }, POLL_THREAD_MS);
    return () => { cancelled = true; clearInterval(t); };
  }, [activeId, loadThread, loadList]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages.length, activeId]);

  /* ── the directory ────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!picking) return;
    let cancelled = false;
    // Debounced: typing a name should not be one request per keystroke.
    const t = setTimeout(async () => {
      try {
        const found = await fetchDirectory(query);
        if (!cancelled) { setPeople(found); setPeopleError(null); }
      } catch (e) {
        if (!cancelled) setPeopleError(e instanceof Error ? e.message : 'Could not load the directory.');
      }
    }, query ? 250 : 0);
    return () => { cancelled = true; clearTimeout(t); };
  }, [picking, query]);

  const start = async (person: Person) => {
    const res = await openConversationWith(person.id);
    if (res.error || !res.id) { setNotice(res.error ?? 'Could not start that conversation.'); return; }
    setPicking(false);
    setQuery('');
    setActiveId(res.id);
    await loadList();
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || !activeId || sending) return;
    setSending(true);
    const res = await sendMessage(activeId, text);
    setSending(false);

    if (!res.success) {
      // The draft is deliberately kept. A refused message the person has to
      // retype is a product that feels broken; one they can edit is a rule
      // they can comply with.
      if (res.blocked) { setRefused(res.error ?? null); setNotice(null); }
      else setNotice(res.error ?? 'Not sent.');
      return;
    }

    setRefused(null);
    setNotice(res.warning ?? null);
    setDraft('');
    if (res.message) setMessages((prev) => [...prev, res.message as Message]);
    void loadList();
  };

  /** Grouped by designation so a long directory stays scannable. */
  const grouped = useMemo(() => {
    const order: Designation[] = ['teacher', 'hr', 'admin', 'super_admin', 'seller', 'student'];
    const map = new Map<Designation, Person[]>();
    for (const p of people ?? []) {
      const list = map.get(p.designation) ?? [];
      list.push(p);
      map.set(p.designation, list);
    }
    return order.filter((d) => map.has(d)).map((d) => ({ designation: d, people: map.get(d)! }));
  }, [people]);

  const totalUnread = (conversations ?? []).reduce((n, c) => n + c.unread, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2" style={{ fontFamily: 'var(--font-grotesk)' }}>
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Messages
            {totalUnread > 0 && (
              <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center leading-none">
                {totalUnread}
              </span>
            )}
          </h2>
          <p className="text-[13px] text-slate-500 mt-0.5">
            Reach anyone on the team directly. Everyone&rsquo;s role is shown beside their name.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setPicking(true); setQuery(''); setPeople(null); }}
          className="inline-flex items-center gap-2 px-4 min-h-[44px] rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold"
          style={{ fontFamily: 'var(--font-grotesk)' }}
        >
          <Plus className="w-4 h-4" />
          New message
        </button>
      </div>

      {/* The policy speaking, not an error. Louder than a warning, and it does
          not offer a dismiss button — the sender closes it by fixing the
          message, which is the behaviour we actually want. */}
      {refused && (
        <div className="flex items-start gap-2.5 rounded-lg border border-red-300 bg-red-50 px-3.5 py-3 text-[13.5px] text-red-800">
          <ShieldAlert className="w-[18px] h-[18px] shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold mb-0.5">Message not sent</p>
            <p className="leading-[1.6]">{refused}</p>
          </div>
        </div>
      )}

      {notice && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[13px] text-amber-900">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span className="flex-1">{notice}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid lg:grid-cols-[320px_1fr] gap-4 items-start">
        {/* ── conversations ──────────────────────────────────────────────── */}
        <div className={`card card--compact !p-0 overflow-hidden ${activeId ? 'hidden lg:block' : ''}`}>
          {listError ? (
            <div className="p-4">
              <p className="font-semibold text-slate-900 text-[14px] mb-1">Messages unavailable.</p>
              <p className="text-[13px] text-slate-600 leading-[1.6]">{listError}</p>
            </div>
          ) : !conversations ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-12 px-5">
              <MessageSquare className="w-8 h-8 mx-auto text-slate-300 mb-3" />
              <p className="text-[14px] text-slate-600">No conversations yet.</p>
              <p className="text-[13px] text-slate-500 mt-1">
                Start one and it will stay here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 max-h-[70vh] overflow-y-auto">
              {conversations.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(c.id)}
                    className={`w-full text-left px-3.5 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors ${
                      c.id === activeId ? 'bg-blue-50/60' : ''
                    }`}
                  >
                    <Avatar person={c.other} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-[14px] truncate">
                          {c.other?.name ?? 'Someone'}
                        </span>
                        {c.other && <Badge designation={c.other.designation} tier={c.other.tier} />}
                      </div>
                      <p className={`text-[12.5px] mt-0.5 truncate ${c.unread ? 'text-slate-900 font-semibold' : 'text-slate-500'}`}>
                        {c.lastMessage ? `${c.lastMessageMine ? 'You: ' : ''}${c.lastMessage}` : 'No messages yet'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[11px] text-slate-400 tabular-nums">{whenShort(c.lastMessageAt)}</span>
                      {c.unread > 0 && (
                        <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── the thread ─────────────────────────────────────────────────── */}
        <div className={`card card--compact !p-0 overflow-hidden flex flex-col ${activeId ? '' : 'hidden lg:flex'}`} style={{ minHeight: '60vh' }}>
          {!activeId ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
              <MessageSquare className="w-9 h-9 text-slate-300 mb-3" />
              <p className="text-[14.5px] font-semibold text-slate-700">Pick a conversation</p>
              <p className="text-[13px] text-slate-500 mt-1 max-w-[38ch]">
                Or start a new one — you&rsquo;ll see everyone&rsquo;s name and what they do.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 px-3.5 py-3 border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveId(null)}
                  className="lg:hidden w-9 h-9 -ml-1 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-600"
                  aria-label="Back to conversations"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <Avatar person={active?.other ?? null} size={38} />
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 text-[14.5px] truncate">{active?.other?.name ?? 'Someone'}</p>
                  <p className="text-[12px] text-slate-500">{active?.other ? describe(active.other) : ''}</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-1" style={{ maxHeight: '58vh' }}>
                {threadLoading ? (
                  <div className="flex items-center justify-center py-12 text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <p className="text-center text-[13px] text-slate-500 py-12">
                    Nothing here yet. Say hello.
                  </p>
                ) : (
                  messages.map((m, i) => {
                    const mine = m.sender_id === meId;
                    const prev = messages[i - 1];
                    const newDay = !prev || dayLabel(prev.created_at) !== dayLabel(m.created_at);
                    return (
                      <div key={m.id}>
                        {newDay && (
                          <p className="text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400 my-3">
                            {dayLabel(m.created_at)}
                          </p>
                        )}
                        <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[78%] rounded-2xl px-3.5 py-2 ${
                              mine
                                ? 'bg-blue-600 text-white rounded-br-md'
                                : 'bg-slate-100 text-slate-900 rounded-bl-md'
                            }`}
                          >
                            <p className="text-[14px] leading-[1.5] whitespace-pre-wrap break-words">{m.body}</p>
                            <p className={`text-[10.5px] mt-0.5 tabular-nums ${mine ? 'text-blue-100' : 'text-slate-400'}`}>
                              {new Date(m.created_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              <div className="border-t border-slate-100">
                {/* Said before the rule is broken, not only after. A teacher who
                    reads this does not need to be refused; a teacher who is
                    refused without ever having been told feels ambushed. */}
                {(active?.other?.designation === 'student' || myRole === 'student') && (
                  <p className="px-3.5 pt-2.5 text-[11.5px] text-slate-500 leading-[1.5] flex items-start gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-[1px] text-slate-400" />
                    <span>
                      Keep it on Sariro. Phone numbers, email addresses and outside
                      messengers can&rsquo;t be shared here.
                    </span>
                  </p>
                )}

                <div className="p-2.5 flex items-end gap-2">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void send(); }
                    }}
                    rows={1}
                    maxLength={4000}
                    placeholder="Write a message…"
                    aria-label="Message"
                    className="flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 max-h-32"
                    style={{ fontSize: '16px' }}
                  />
                  <button
                    type="button"
                    onClick={send}
                    disabled={sending || !draft.trim()}
                    aria-label="Send"
                    className="w-11 h-11 shrink-0 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center disabled:opacity-40"
                  >
                    {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── who do you want ────────────────────────────────────────────────
          The flow the team asked for: type a name, see everyone who matches
          with what they do — and a teacher's tier — then pick the right one. */}
      {picking && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setPicking(false)}
          role="presentation"
        >
          <div
            className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Start a new conversation"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <p className="font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-grotesk)' }}>
                Who do you want to message?
              </p>
              <button type="button" onClick={() => setPicking(false)} aria-label="Close" className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 border-b border-slate-100">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter a name…"
                  aria-label="Search by name"
                  className="w-full min-h-[44px] rounded-lg border border-slate-300 pl-9 pr-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                  style={{ fontSize: '16px' }}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {peopleError ? (
                <p className="text-[13px] text-slate-600 px-4 py-8 text-center">{peopleError}</p>
              ) : !people ? (
                <div className="flex items-center justify-center py-12 text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : people.length === 0 ? (
                <p className="text-[13px] text-slate-500 px-4 py-10 text-center">
                  {query ? `Nobody here matches “${query}”.` : 'Nobody to message yet.'}
                </p>
              ) : (
                grouped.map((g) => (
                  <div key={g.designation}>
                    <p className="px-4 pt-3 pb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {DESIGNATION_LABEL[g.designation]}
                      {g.people.length > 1 ? 's' : ''}
                    </p>
                    <ul>
                      {g.people.map((p) => (
                        <li key={p.id}>
                          <button
                            type="button"
                            onClick={() => start(p)}
                            className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-slate-50 transition-colors"
                          >
                            <Avatar person={p} size={36} />
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-slate-900 text-[14px] truncate">{p.name}</p>
                              <p className="text-[12px] text-slate-500 truncate">{describe(p)}</p>
                            </div>
                            <Badge designation={p.designation} tier={p.tier} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
