'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Volume2, Mic, Square, Check, X, RotateCcw, ArrowRight, AlertTriangle, Globe2, Sparkles, Award, BookOpen, Shuffle, MessageSquareQuote,
} from 'lucide-react';
import {
  SOUND_PATTERNS, soundPattern, sortRound, stampFor, heardWord, parsePassport, stampPassport, PASSPORT_KEY,
  type SoundPattern, type SoundWord, type SortItem, type Passport,
} from '@/lib/speaking/sounds';
import { diagnoseMic, micMessage } from '@/lib/speaking/mic';
import SpeakingLab from '@/components/speaking/speaking-lab';
import { logAttempt } from '@/lib/speaking/practice-log';

/**
 * SARIRO — Sound Lab
 * ============================================================================
 * The patterns in lib/speaking/sounds.ts, made into something a child does
 * rather than reads:
 *
 *   Learn      every way a spelling is said, each word one tap from being heard
 *              — in a British, American or Indian voice, because real English
 *              is all three
 *   Sort       eight words, which sound is it, instant answer; a gold or silver
 *              stamp in a passport kept on their device
 *   Say it     the browser listens for the word, and says what it heard
 *   Real life  the sentences you would actually say, heard and then practised
 *              in the speaking lab with the usual measurements
 *
 * Everything runs in the browser — speech synthesis and recognition — so it
 * costs nothing per attempt and never waits on a server.
 */

export type Mode = 'learn' | 'sort' | 'say' | 'real';

const ACCENTS = [
  { key: 'en-GB', label: 'British' },
  { key: 'en-US', label: 'American' },
  { key: 'en-IN', label: 'Indian' },
] as const;
type Accent = (typeof ACCENTS)[number]['key'];

const PALETTE = ['#2563EB', '#7C3AED', '#DB2777', '#EA580C', '#16A34A', '#0891B2', '#CA8A04', '#4F46E5'];
const accentOf = (id: string) => PALETTE[Math.max(0, SOUND_PATTERNS.findIndex((p) => p.id === id)) % PALETTE.length];

/* ── The voice ───────────────────────────────────────────────────────────── */

function useVoices() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener?.('voiceschanged', load);
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', load);
      try { window.speechSynthesis.cancel(); } catch { /* nothing playing */ }
    };
  }, []);
  return voices;
}

function pickVoice(voices: SpeechSynthesisVoice[], accent: Accent): SpeechSynthesisVoice | null {
  const exact = voices.filter((v) => v.lang.replace('_', '-').toLowerCase() === accent.toLowerCase());
  return exact.find((v) => /natural|google|premium|enhanced/i.test(v.name)) ?? exact[0] ?? null;
}

/* ── The component ───────────────────────────────────────────────────────── */

export default function SoundLab({
  patternIds,
  initial,
  initialMode = 'learn',
  practise = true,
  simple = false,
  logAs = (id) => `sound:${id}`,
  onLogged,
}: {
  /** Which patterns to offer; every one when omitted. */
  patternIds?: readonly string[];
  initial?: string;
  initialMode?: Mode;
  /** Show the speaking lab under the real-life lines. Off for a teacher screen-sharing. */
  practise?: boolean;
  /** For Grades 1–6: no phonetic symbols or rules, fewer words, no notes for grown-ups. */
  simple?: boolean;
  /**
   * The drill id a finished sort round is recorded under, or null to record
   * nothing (a teacher demonstrating). Homework passes its mission id; the
   * Practice Room's `sound:<pattern>` feeds Voice Quest's sound badges.
   */
  logAs?: ((patternId: string) => string) | null;
  onLogged?: () => void;
}) {
  const patterns = useMemo(
    () => (patternIds ? patternIds.map((id) => soundPattern(id)).filter((p): p is SoundPattern => !!p) : SOUND_PATTERNS),
    [patternIds]
  );
  const [activeId, setActiveId] = useState(initial && patterns.some((p) => p.id === initial) ? initial : patterns[0]?.id);
  const [mode, setMode] = useState<Mode>(initialMode);
  const [accent, setAccent] = useState<Accent>('en-GB');
  const [speaking, setSpeaking] = useState<string | null>(null);
  const [passport, setPassport] = useState<Passport>({});
  const voices = useVoices();

  useEffect(() => {
    try { setPassport(parsePassport(localStorage.getItem(PASSPORT_KEY))); } catch { /* storage blocked */ }
  }, []);

  const available = useMemo(() => ACCENTS.filter((a) => pickVoice(voices, a.key)), [voices]);

  const say = useCallback((text: string, key = text) => {
    try {
      const synth = window.speechSynthesis;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const voice = pickVoice(synth.getVoices(), accent);
      if (voice) u.voice = voice;
      u.lang = voice?.lang ?? accent;
      u.rate = text.split(' ').length > 3 ? 0.95 : 0.85;
      u.onend = () => setSpeaking((k) => (k === key ? null : k));
      u.onerror = () => setSpeaking((k) => (k === key ? null : k));
      setSpeaking(key);
      synth.speak(u);
    } catch {
      setSpeaking(null);
    }
  }, [accent]);

  const earn = useCallback((id: string, correct: number, total: number) => {
    const stamp = stampFor(correct, total);
    setPassport((prev) => {
      const next = stampPassport(prev, id, stamp, new Date().toISOString());
      if (next !== prev) {
        try { localStorage.setItem(PASSPORT_KEY, JSON.stringify(next)); } catch { /* storage blocked */ }
      }
      return next;
    });
    // A round is a real attempt: it goes on the record, so homework and badges can count it.
    if (logAs && total > 0) {
      void logAttempt({
        kind: 'listening',
        drillId: logAs(id),
        score: Math.round((correct / total) * 100),
        metrics: { soundCorrect: correct, soundTotal: total },
      }).then((ok) => { if (ok) onLogged?.(); });
    }
  }, [logAs, onLogged]);

  const pattern = patterns.find((p) => p.id === activeId) ?? patterns[0];
  if (!pattern) return null;
  const color = accentOf(pattern.id);
  const golds = patterns.filter((p) => passport[p.id]?.best === 'gold').length;

  return (
    <div className="rounded-[1.4rem] border border-slate-200 bg-white overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04),0_24px_48px_-36px_rgba(15,23,42,0.3)]">
      {/* Pattern picker, with the passport stamps on it */}
      {patterns.length > 1 && (
        <div className="border-b border-slate-100 bg-slate-50/70 px-3 py-2.5 flex items-center gap-1.5 overflow-x-auto scroll-strip">
          {patterns.map((p) => {
            const stamp = passport[p.id]?.best;
            const on = p.id === pattern.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => { setActiveId(p.id); setMode('learn'); }}
                className={`shrink-0 inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-[13px] font-extrabold transition-colors ${on ? 'text-white' : 'text-slate-600 hover:bg-white'}`}
                style={{ fontFamily: 'var(--font-grotesk)', ...(on ? { background: accentOf(p.id) } : null) }}
                aria-pressed={on}
              >
                {p.spelling}
                {stamp && <span aria-label={`${stamp} stamp`} className={`w-2 h-2 rounded-full ${stamp === 'gold' ? 'bg-amber-400' : 'bg-slate-300'} ${on ? 'ring-2 ring-white/60' : ''}`} />}
              </button>
            );
          })}
          <span className="ml-auto shrink-0 pl-3 inline-flex items-center gap-1 text-[11.5px] font-bold text-slate-500">
            <Award className="w-3.5 h-3.5 text-amber-500" /> {golds}/{patterns.length} gold
          </span>
        </div>
      )}

      {/* The pattern */}
      <div className="relative px-5 sm:px-7 pt-6 pb-5">
        <span aria-hidden className="pointer-events-none absolute -top-20 -right-16 w-64 h-64 rounded-full blur-3xl opacity-[0.12]" style={{ background: color }} />
        <div className="relative flex items-start gap-4">
          <div className="shrink-0 min-w-[4.25rem] h-[4.25rem] px-3 rounded-2xl flex items-center justify-center text-white text-[1.35rem] font-black tracking-tight shadow-lg" style={{ background: color, fontFamily: 'var(--font-jakarta)', boxShadow: `0 14px 28px -14px ${color}` }}>
            {pattern.spelling}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>Sound Lab</p>
            <h3 className="text-[1.35rem] sm:text-[1.6rem] font-extrabold leading-tight text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>{pattern.title}</h3>
            <p className="mt-1 text-[14px] text-slate-600 leading-relaxed">{pattern.hook}</p>
          </div>
        </div>

        <div className="relative mt-4 flex flex-wrap items-center gap-2">
          {(['learn', 'sort', 'say', 'real'] as Mode[]).map((m) => {
            const meta = { learn: { icon: BookOpen, label: 'Learn' }, sort: { icon: Shuffle, label: 'Sort game' }, say: { icon: Mic, label: 'Say it' }, real: { icon: MessageSquareQuote, label: 'Real life' } }[m];
            const Icon = meta.icon;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-[13px] font-bold transition-colors ${mode === m ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                <Icon className="w-3.5 h-3.5" /> {meta.label}
              </button>
            );
          })}
          {available.length > 1 && (
            <div className="ml-auto inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1" role="group" aria-label="Voice">
              <Globe2 className="w-3.5 h-3.5 text-slate-400 mx-1" />
              {available.map((a) => (
                <button
                  key={a.key}
                  type="button"
                  onClick={() => setAccent(a.key)}
                  className={`h-7 px-2.5 rounded-lg text-[12px] font-bold ${accent === a.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-slate-100 bg-[#FBFAF8] px-5 sm:px-7 py-6">
        {mode === 'learn' && <Learn pattern={pattern} color={color} say={say} speaking={speaking} simple={simple} />}
        {mode === 'sort' && <SortGame key={pattern.id} pattern={pattern} color={color} say={say} onFinish={(correct, total) => earn(pattern.id, correct, total)} />}
        {mode === 'say' && <SayIt key={pattern.id} pattern={pattern} color={color} say={say} />}
        {mode === 'real' && <RealLife key={pattern.id} pattern={pattern} say={say} speaking={speaking} practise={practise} />}
      </div>
    </div>
  );
}

/* ── Learn ───────────────────────────────────────────────────────────────── */

function HearButton({ text, onSay, active, label }: { text: string; onSay: () => void; active: boolean; label?: string }) {
  return (
    <button
      type="button"
      onClick={onSay}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold transition-colors ${active ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-800 hover:border-slate-300'}`}
      aria-label={`Hear ${text}`}
    >
      <Volume2 className={`w-3.5 h-3.5 ${active ? 'animate-pulse' : 'text-slate-400'}`} />
      {label ?? text}
    </button>
  );
}

function Learn({ pattern, color, say, speaking, simple }: { pattern: SoundPattern; color: string; say: (t: string, k?: string) => void; speaking: string | null; simple: boolean }) {
  const words = (ws: SoundWord[]) => ws.map((x) => x.say ?? x.word).join('. ');
  return (
    <div className="space-y-5">
      {pattern.rule && !simple && (
        <p className="rounded-xl bg-white border border-slate-200 px-4 py-3 text-[14px] text-slate-700 leading-relaxed">
          <span className="font-bold text-slate-900">The rule. </span>{pattern.rule}
        </p>
      )}

      <div className={`grid gap-3 ${pattern.ways.length >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        {pattern.ways.map((way) => (
          <div key={way.id} className="rounded-2xl bg-white border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[1.15rem] font-extrabold text-slate-900 leading-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>{way.sounds}</p>
                {!simple && <p className="text-[12px] font-mono text-slate-400">{way.ipa}</p>}
              </div>
              <button
                type="button"
                onClick={() => say(words(way.words), `way:${way.id}`)}
                className="shrink-0 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11.5px] font-bold text-white"
                style={{ background: color }}
              >
                <Volume2 className="w-3.5 h-3.5" /> Hear all
              </button>
            </div>
            <p className="mt-1.5 text-[12.5px] text-slate-500 leading-snug">{way.how}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(simple ? way.words.slice(0, 5) : way.words).map((x) => (
                <HearButton key={x.word} text={x.word} onSay={() => say(x.say ?? x.word, x.word)} active={speaking === x.word} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-amber-700"><AlertTriangle className="w-3.5 h-3.5" /> Watch out</p>
          <ul className="mt-2 space-y-2.5">
            {pattern.traps.map((t) => (
              <li key={t.word} className="flex items-start gap-2">
                <button type="button" onClick={() => say(t.say ?? t.word, `trap:${t.word}`)} className="mt-0.5 shrink-0 w-7 h-7 rounded-lg bg-white border border-amber-200 flex items-center justify-center" aria-label={`Hear ${t.word}`}>
                  <Volume2 className={`w-3.5 h-3.5 ${speaking === `trap:${t.word}` ? 'text-amber-600 animate-pulse' : 'text-amber-500'}`} />
                </button>
                <p className="text-[13.5px] text-amber-950 leading-snug"><span className="font-bold">{t.word}</span> — {t.why}</p>
              </li>
            ))}
          </ul>
        </div>
        {!simple && (pattern.indiaTip || pattern.accentNote) && (
          <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4 space-y-2.5">
            {pattern.indiaTip && (
              <p className="text-[13.5px] text-sky-950 leading-snug"><span className="font-bold">Coach’s tip. </span>{pattern.indiaTip}</p>
            )}
            {pattern.accentNote && (
              <p className="text-[13.5px] text-sky-950 leading-snug"><span className="font-bold">Around the world. </span>{pattern.accentNote}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Sort ────────────────────────────────────────────────────────────────── */

function SortGame({ pattern, color, say, onFinish }: { pattern: SoundPattern; color: string; say: (t: string, k?: string) => void; onFinish: (correct: number, total: number) => void }) {
  const [round, setRound] = useState<SortItem[]>(() => sortRound(pattern));
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const done = i >= round.length;
  const item = round[i];
  const finished = useRef(false);

  useEffect(() => {
    if (!done || finished.current) return;
    finished.current = true;
    onFinish(correct, round.length);
  }, [done, correct, round.length, onFinish]);

  const again = () => {
    finished.current = false;
    setRound(sortRound(pattern));
    setI(0); setPicked(null); setCorrect(0);
  };

  if (done) {
    const stamp = stampFor(correct, round.length);
    return (
      <div className="text-center py-4">
        <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center text-3xl ${stamp === 'gold' ? 'bg-amber-100' : stamp === 'silver' ? 'bg-slate-100' : 'bg-rose-50'}`}>
          {stamp === 'gold' ? '🥇' : stamp === 'silver' ? '🥈' : '💪'}
        </div>
        <p className="mt-3 text-[1.6rem] font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>{correct} / {round.length}</p>
        <p className="text-[14px] text-slate-600">
          {stamp === 'gold' ? `Gold stamp for ${pattern.spelling} — that is in your passport.` : stamp === 'silver' ? 'Silver stamp. One more round for gold?' : 'Listen to the words in Learn, then try again — this one is hard.'}
        </p>
        <button type="button" onClick={again} className="mt-4 inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-slate-900 text-white text-[13px] font-bold">
          <RotateCcw className="w-4 h-4" /> Play again
        </button>
      </div>
    );
  }

  const right = item.wayId;
  const answered = picked !== null;
  const choose = (wayId: string) => {
    if (answered) return;
    setPicked(wayId);
    if (wayId === right) setCorrect((c) => c + 1);
    say(item.word.say ?? item.word.word, `sort:${i}`);
  };

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${(i / round.length) * 100}%`, background: color }} />
        </div>
        <span className="text-[12px] font-bold text-slate-500 tabular-nums">{i + 1}/{round.length} · {correct} right</span>
      </div>

      <div className="mt-5 text-center">
        <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-slate-400">Which sound is it?</p>
        <div className="mt-2 inline-flex items-center gap-3">
          <span className="text-[2.2rem] sm:text-[2.8rem] font-extrabold text-slate-900 tracking-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>{item.word.word}</span>
          {answered && (
            <button type="button" onClick={() => say(item.word.say ?? item.word.word, `sort:${i}`)} className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center" aria-label="Hear it again">
              <Volume2 className="w-4 h-4 text-slate-600" />
            </button>
          )}
        </div>
        {!answered && <p className="text-[12.5px] text-slate-400">Say it in your head first — you will hear it after you choose.</p>}
      </div>

      <div className={`mt-5 grid gap-2 ${pattern.ways.length > 3 ? 'grid-cols-2 sm:grid-cols-3' : pattern.ways.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {pattern.ways.map((way) => {
          const isRight = answered && way.id === right;
          const isWrong = answered && picked === way.id && way.id !== right;
          return (
            <button
              key={way.id}
              type="button"
              onClick={() => choose(way.id)}
              disabled={answered}
              className={`rounded-2xl border-2 px-3 py-3 text-center transition-all ${
                isRight ? 'border-emerald-500 bg-emerald-50' : isWrong ? 'border-rose-400 bg-rose-50' : answered ? 'border-slate-200 bg-white opacity-60' : 'border-slate-200 bg-white hover:border-slate-400 hover:-translate-y-0.5'
              }`}
            >
              <span className="block text-[1.05rem] font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>{way.sounds}</span>
              <span className="block text-[11.5px] font-mono text-slate-400">{way.ipa}</span>
              {isRight && <Check className="w-4 h-4 text-emerald-600 mx-auto mt-1" />}
              {isWrong && <X className="w-4 h-4 text-rose-500 mx-auto mt-1" />}
            </button>
          );
        })}
      </div>

      {answered && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-white border border-slate-200 px-4 py-3">
          <p className="text-[13.5px] text-slate-700">
            {picked === right ? <span className="font-bold text-emerald-700">Yes. </span> : <span className="font-bold text-rose-600">Not quite. </span>}
            <span className="font-semibold">{item.word.word}</span> is “{pattern.ways.find((x) => x.id === right)!.sounds}”. {pattern.ways.find((x) => x.id === right)!.how}
          </p>
          <button type="button" onClick={() => { setPicked(null); setI((n) => n + 1); }} className="shrink-0 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-white text-[13px] font-bold" style={{ background: color }}>
            {i + 1 === round.length ? 'Finish' : 'Next'} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Say it ──────────────────────────────────────────────────────────────── */

interface RecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  onresult: ((e: { results: { length: number; [i: number]: { length: number; [j: number]: { transcript: string } } } }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
}

function SayIt({ pattern, color, say }: { pattern: SoundPattern; color: string; say: (t: string, k?: string) => void }) {
  const [wayId, setWayId] = useState(pattern.ways[0].id);
  const [target, setTarget] = useState<SoundWord | null>(null);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState<{ text: string; ok: boolean } | null>(null);
  const [blocker, setBlocker] = useState<string>('');
  const recRef = useRef<RecognitionLike | null>(null);

  useEffect(() => {
    setBlocker(diagnoseMic());
    return () => { try { recRef.current?.stop(); } catch { /* not started */ } };
  }, []);

  const way = pattern.ways.find((x) => x.id === wayId) ?? pattern.ways[0];

  const listen = (word: SoundWord) => {
    if (listening) { try { recRef.current?.stop(); } catch { /* stopped */ } return; }
    const wnd = window as unknown as { SpeechRecognition?: new () => RecognitionLike; webkitSpeechRecognition?: new () => RecognitionLike };
    const Ctor = wnd.SpeechRecognition ?? wnd.webkitSpeechRecognition;
    if (!Ctor) return;
    setTarget(word);
    setHeard(null);
    const rec = new Ctor();
    rec.continuous = false;
    rec.interimResults = false;
    rec.maxAlternatives = 5;
    rec.lang = 'en-IN';
    rec.onresult = (e) => {
      const alts: string[] = [];
      for (let r = 0; r < e.results.length; r++) {
        for (let a = 0; a < e.results[r].length; a++) alts.push(e.results[r][a].transcript);
      }
      const ok = alts.some((t) => heardWord(word, t));
      setHeard({ text: (ok ? alts.find((t) => heardWord(word, t)) : alts[0]) ?? '', ok });
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    try { rec.start(); } catch { setListening(false); }
  };

  if (blocker) {
    const msg = micMessage(blocker as Exclude<ReturnType<typeof diagnoseMic>, ''>);
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="text-[14px] font-bold text-amber-900">{msg.title}</p>
        <p className="text-[13px] text-amber-900/80 mt-1">{msg.body}</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[14px] text-slate-600">Pick a sound, tap a word, and say it. The browser writes down what it heard — if it wrote your word, it understood you.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {pattern.ways.map((x) => (
          <button key={x.id} type="button" onClick={() => { setWayId(x.id); setHeard(null); setTarget(null); }}
            className={`h-9 px-3 rounded-xl text-[13px] font-bold ${x.id === way.id ? 'text-white' : 'bg-white border border-slate-200 text-slate-600'}`}
            style={x.id === way.id ? { background: color } : undefined}>
            {x.sounds}
          </button>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
        {way.words.map((x) => {
          const isTarget = target?.word === x.word;
          return (
            <div key={x.word} className={`rounded-2xl border bg-white p-3 ${isTarget && heard ? (heard.ok ? 'border-emerald-400' : 'border-rose-300') : 'border-slate-200'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-[15px] font-extrabold text-slate-900 truncate" style={{ fontFamily: 'var(--font-jakarta)' }}>{x.word}</span>
                <button type="button" onClick={() => say(x.say ?? x.word, `say:${x.word}`)} className="shrink-0 w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center" aria-label={`Hear ${x.word}`}>
                  <Volume2 className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => listen(x)}
                className={`mt-2 w-full inline-flex items-center justify-center gap-1.5 h-9 rounded-xl text-[12.5px] font-bold ${listening && isTarget ? 'bg-rose-600 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
              >
                {listening && isTarget ? <><Square className="w-3.5 h-3.5" /> Listening…</> : <><Mic className="w-3.5 h-3.5" /> Say it</>}
              </button>
              {isTarget && heard && (
                <p className={`mt-2 text-[12.5px] leading-snug ${heard.ok ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {heard.ok ? <><Check className="inline w-3.5 h-3.5" /> Understood: “{heard.text}”</> : <>Heard “{heard.text || '…nothing'}”. Tap the speaker, copy it, try again.</>}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Real life ───────────────────────────────────────────────────────────── */

function RealLife({ pattern, say, speaking, practise }: { pattern: SoundPattern; say: (t: string, k?: string) => void; speaking: string | null; practise: boolean }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-3">
      {pattern.realWorld.map((r, idx) => (
        <div key={r.line} className="rounded-2xl bg-white border border-slate-200 p-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> {r.situation}</p>
          <p className="mt-1.5 text-[1.05rem] font-semibold text-slate-900 leading-snug" style={{ fontFamily: 'var(--font-jakarta)' }}>“{r.line}”</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <HearButton text={r.line} label="Hear it" onSay={() => say(r.line, `real:${idx}`)} active={speaking === `real:${idx}`} />
            {practise && (
              <button type="button" onClick={() => setOpen(open === idx ? null : idx)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-semibold bg-slate-900 text-white">
                <Mic className="w-3.5 h-3.5" /> {open === idx ? 'Close practice' : 'Practise out loud'}
              </button>
            )}
          </div>
          {practise && open === idx && (
            <div className="mt-4">
              <SpeakingLab
                drill={{
                  id: `sound-${pattern.id}-${idx}`,
                  title: r.situation,
                  brief: 'Read it the way you would really say it — then read it again, slower, landing every sound.',
                  passage: r.line,
                  targetSeconds: Math.max(6, Math.round(r.line.split(' ').length / 2.3)),
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
