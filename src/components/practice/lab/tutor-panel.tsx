'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, CheckCircle2, Lightbulb, Loader2, SendHorizonal, Sparkles, TriangleAlert, Wand2 } from 'lucide-react';
import RichText from './rich-text';
import type { Note } from '@/lib/practice/lab/diagnose';
import { isCode, type Challenge } from '@/lib/practice/lab/types';

/**
 * SARIRO — the Code Lab's tutor
 * ============================================================================
 * Two voices in one panel:
 *   · the GUIDE — on the device, free, always on: after every run it says what
 *     the result most likely means (lib/practice/lab/diagnose.ts), and it
 *     answers the quick buttons;
 *   · the AI TUTOR — Gemini, through /api/practice/tutor, when the server has it
 *     switched on: a real conversation that asks and nudges and never hands
 *     over the answer. A daily allowance per learner; when it is used up, or
 *     the tutor is off, the guide carries on alone.
 */

interface Msg {
  id: number;
  who: 'student' | 'tutor' | 'guide';
  text: string;
  title?: string;
  tone?: Note['tone'] | 'hint';
  streaming?: boolean;
}

let aiKnown: boolean | null = null;

async function aiAvailable(): Promise<boolean> {
  if (aiKnown !== null) return aiKnown;
  try {
    const r = await fetch('/api/practice/tutor', { method: 'GET', cache: 'no-store' });
    aiKnown = r.ok && !!(await r.json()).ai;
  } catch {
    aiKnown = false;
  }
  return aiKnown;
}

const QUICK = [
  { key: 'why', label: 'Why is it failing?' },
  { key: 'explain', label: 'Explain the challenge' },
  { key: 'hint', label: 'Give me a hint' },
  { key: 'approach', label: 'Is my approach right?' },
] as const;

export default function TutorPanel({ challenge, getCode, runSummary, note, nextHint, accent }: {
  challenge: Challenge;
  getCode: () => string;
  runSummary: string | null;
  /** The guide's reading of the latest run; a new object each run. */
  note: Note | null;
  /** Reveals the next hint (it costs a little) and returns it — null when there are none left. */
  nextHint: () => string | null;
  accent: string;
}) {
  const [messages, setMessages] = useState<Msg[]>(() => [{
    id: 0, who: 'tutor',
    text: `Hi! I'm your tutor for **${challenge.title}**. I won't give you the answer — but I'll help you find it. Write some code and run the tests, or ask me anything.`,
  }]);
  const [ai, setAi] = useState<boolean | null>(null);
  const [left, setLeft] = useState<number | null>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const nextId = useRef(1);
  const scroller = useRef<HTMLDivElement>(null);
  const history = useRef<Msg[]>([]);

  useEffect(() => { history.current = messages; }, [messages]);
  useEffect(() => { void aiAvailable().then(setAi); }, []);

  const push = useCallback((m: Omit<Msg, 'id'>) => {
    const id = nextId.current++;
    setMessages((list) => [...list, { ...m, id }]);
    return id;
  }, []);

  /* After every run, the guide says what it sees. */
  useEffect(() => {
    if (note) push({ who: 'guide', title: note.title, text: note.body, tone: note.tone });
  }, [note, push]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const guideAnswer = (key: typeof QUICK[number]['key']) => {
    if (key === 'why') {
      if (note) push({ who: 'guide', title: note.title, text: note.body, tone: note.tone });
      else push({ who: 'guide', title: 'Run it first', text: 'Press **Run tests** (or Ctrl + Enter). Once I can see what your code does, I can tell you what the results mean.', tone: 'nudge' });
    } else if (key === 'explain') {
      const goal = challenge.prompt.split(/\n{2,}/)[0];
      const tip = isCode(challenge)
        ? challenge.mode === 'program' ? 'Your program is checked by exactly what it prints — every character counts.' : 'The tests call your function with some inputs and check what it returns. Try one example by hand first.'
        : 'The page is checked by what the browser builds — each check in the list below is one thing to get right.';
      push({ who: 'guide', title: 'In short', text: `${goal}\n\n${tip}`, tone: 'nudge' });
    } else if (key === 'hint') {
      const h = nextHint();
      push(h ? { who: 'guide', title: 'Hint', text: h, tone: 'hint' } : { who: 'guide', title: 'No hints left', text: 'You have seen every hint for this one. Try the smallest example by hand, line by line — or ask me about a specific line.', tone: 'nudge' });
    } else {
      push({ who: 'guide', title: 'Check it against the tests', text: 'Run the tests — each one is a small experiment. Start with the first example: work through your code by hand with that input and see if you land on the expected answer.', tone: 'nudge' });
    }
  };

  const ask = async (question: string) => {
    const q = question.trim();
    if (!q || busy) return;
    push({ who: 'student', text: q });
    setText('');
    setBusy(true);
    const convo = [...history.current.filter((m) => m.who !== 'guide' && m.id !== 0), { who: 'student' as const, text: q }]
      .map((m) => ({ role: m.who === 'student' ? 'user' : 'assistant', content: m.text }));
    const replyId = push({ who: 'tutor', text: '', streaming: true });
    const set = (patch: Partial<Msg>) => setMessages((list) => list.map((m) => (m.id === replyId ? { ...m, ...patch } : m)));
    try {
      const res = await fetch('/api/practice/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId: challenge.id, code: getCode(), run: runSummary ?? undefined, messages: convo }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        if (data.error === 'tutor_off') { aiKnown = false; setAi(false); }
        set({
          streaming: false, who: 'guide', tone: 'nudge',
          title: data.error === 'limit' ? 'That\'s today\'s questions' : data.error === 'tutor_off' ? 'The AI tutor is resting' : 'The tutor can\'t answer right now',
          text: data.message ?? (data.error === 'tutor_off'
            ? 'The AI tutor isn\'t switched on yet. The guide still reads every run for you — and the quick buttons work.'
            : data.error === 'not_enrolled' ? 'The AI tutor is for students on a coding course.'
            : 'Try again in a moment. The guide still reads every run for you.'),
        });
        if (data.error === 'limit') setLeft(0);
        return;
      }
      const leftHeader = res.headers.get('X-Tutor-Left');
      if (leftHeader !== null) setLeft(Number(leftHeader));
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = '';
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        set({ text: acc });
      }
      set({ text: acc.trim() || 'Ask me about a specific line and we will work through it.', streaming: false });
    } catch {
      set({ streaming: false, who: 'guide', tone: 'nudge', title: 'No connection', text: 'The tutor could not be reached. The guide still reads every run for you.' });
    } finally {
      setBusy(false);
    }
  };

  const onQuick = (key: typeof QUICK[number]['key'], label: string) => {
    if (key === 'hint' || !ai) guideAnswer(key);
    else void ask(label);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl text-white" style={{ background: accent }}><Bot className="h-4 w-4" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>Tutor</p>
          <p className="text-[11.5px] text-slate-500">{ai === null ? 'Getting ready…' : ai ? (left !== null ? `${left} question${left === 1 ? '' : 's'} left today` : 'Ask anything about this challenge') : 'Reads every run for you'}</p>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-extrabold uppercase tracking-wider ${ai ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'}`} style={{ fontFamily: 'var(--font-grotesk)' }}>
          {ai ? <><Sparkles className="h-3 w-3" /> AI</> : <><Wand2 className="h-3 w-3" /> Guide</>}
        </span>
      </div>

      <div ref={scroller} className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
        {messages.map((m) => (
          <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className={m.who === 'student' ? 'flex justify-end' : 'flex'}>
            {m.who === 'student' ? (
              <p className="max-w-[88%] rounded-2xl rounded-br-md px-3.5 py-2 text-[13.5px] text-white" style={{ background: accent }}>{m.text}</p>
            ) : m.who === 'guide' ? (
              <div className={`w-full rounded-2xl border px-3.5 py-2.5 text-[13.5px] ${m.tone === 'win' ? 'border-emerald-200 bg-emerald-50' : m.tone === 'error' ? 'border-rose-200 bg-rose-50' : m.tone === 'hint' ? 'border-amber-200 bg-amber-50' : 'border-slate-200 bg-slate-50'}`}>
                <div className={`mb-1 flex items-center gap-1.5 text-[12.5px] font-extrabold ${m.tone === 'win' ? 'text-emerald-800' : m.tone === 'error' ? 'text-rose-800' : m.tone === 'hint' ? 'text-amber-800' : 'text-slate-800'}`}>
                  {m.tone === 'win' ? <CheckCircle2 className="h-4 w-4" /> : m.tone === 'error' ? <TriangleAlert className="h-4 w-4" /> : m.tone === 'hint' ? <Lightbulb className="h-4 w-4" /> : <Wand2 className="h-4 w-4" />}
                  <RichText text={m.title ?? ''} className="inline" />
                </div>
                <RichText text={m.text} className="leading-relaxed text-slate-700" />
              </div>
            ) : (
              <div className="max-w-[92%] rounded-2xl rounded-bl-md border border-slate-200 bg-white px-3.5 py-2.5 text-[13.5px] leading-relaxed text-slate-800 shadow-sm">
                {m.text ? <RichText text={m.text} /> : <span className="inline-flex items-center gap-2 text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Thinking…</span>}
              </div>
            )}
          </motion.div>
        ))}
      </div>

      <div className="border-t border-slate-200 p-3">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {QUICK.map((q) => (
            <button key={q.key} type="button" disabled={busy} onClick={() => onQuick(q.key, q.label)} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[12px] font-bold text-slate-600 hover:border-slate-300 hover:text-slate-900 disabled:opacity-50">
              {q.label}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); void ask(text); }} className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 1500))}
            disabled={!ai || busy}
            placeholder={ai ? 'Ask the tutor…' : 'The AI tutor is not switched on yet — use the buttons'}
            aria-label="Ask the tutor"
            className="h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-[13.5px] outline-none focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400"
          />
          <button type="submit" disabled={!ai || busy || !text.trim()} aria-label="Send" className="flex h-10 w-10 items-center justify-center rounded-xl text-white disabled:opacity-40" style={{ background: accent }}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
