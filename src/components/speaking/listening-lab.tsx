'use client';

import { useEffect, useRef, useState } from 'react';
import { Ear, Play, Square, RotateCcw, Keyboard, Mic } from 'lucide-react';
import { analyseListening, type ListeningReport } from '@/lib/speaking/listening';
import { diagnoseMic, micMessage } from '@/lib/speaking/mic';
import { assembleTranscript } from '@/lib/speaking/transcript';
import { logAttempt } from '@/lib/speaking/practice-log';
import { listeningMetrics } from '@/lib/speaking/progress';

/**
 * SARIRO — a listening drill that runs on the device
 * ============================================================================
 * The passage is spoken by the browser, hidden while it plays, and given back
 * by the learner — typed, or out loud into the microphone. What comes back is
 * compared to what went in.
 *
 * ── Why the text is hidden ──────────────────────────────────────────────────
 * A listening drill with the words on screen is a reading drill. The passage
 * appears only after the attempt, next to what they gave back, which is the
 * moment it teaches something.
 *
 * ── Speech synthesis, not an audio file ─────────────────────────────────────
 * speechSynthesis is in every browser we support, costs nothing, and means a
 * passage can be written as a line of text rather than recorded. The rate is
 * settable because the whole skill is following speech that is faster than
 * comfortable, and a learner needs somewhere to start.
 *
 * Typing is offered alongside the microphone rather than as a fallback:
 * recognition is Chrome, Edge and Safari only, and a child on Firefox should
 * get the drill, not an apology.
 */

interface RecognitionAlternativeLike { transcript: string }
interface RecognitionResultLike { isFinal: boolean; 0: RecognitionAlternativeLike; length: number }
interface RecognitionEventLike {
  resultIndex: number;
  results: { length: number; [i: number]: RecognitionResultLike };
}
interface RecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((e: RecognitionEventLike) => void) | null;
  onend: (() => void) | null;
}

const PASSAGES = [
  'The committee reached a difficult decision about the new library building after three long meetings.',
  'Every morning the fishermen leave before sunrise, and by the time the market opens their boats are already back.',
  'She had practised the speech eleven times, but the moment she stood up every word left her completely.',
  'The experiment failed twice before anybody thought to check whether the thermometer itself was working.',
];

export default function ListeningLab({
  passage,
  onLogged,
}: {
  passage?: string;
  onLogged?: () => void;
}) {
  const [index, setIndex] = useState(0);
  const source = passage ?? PASSAGES[index];

  const [rate, setRate] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [plays, setPlays] = useState(0);

  const [mode, setMode] = useState<'typed' | 'spoken'>('typed');
  const [response, setResponse] = useState('');
  const [listening, setListening] = useState(false);
  const [report, setReport] = useState<ListeningReport | null>(null);
  /* What has already been written down. Pressing "Check what I heard" a
     second time re-scores the SAME answer, and every press used to write
     another row: production has four identical listening attempts logged
     within one second of each other. Four rows for one go inflates the
     practice count and flattens the curve with copies of itself. */
  const logged = useRef<string | null>(null);
  /* Not a boolean. "Say it" being greyed out with no explanation is the same
     dead-end the speaking lab had: on http:// the browser will never raise a
     microphone prompt, and the reason has to be sayable. */
  const [micBlocker, setMicBlocker] = useState<string | null>(null);

  const recRef = useRef<RecognitionLike | null>(null);

  useEffect(() => {
    setMicBlocker(diagnoseMic());
    return () => {
      try { window.speechSynthesis?.cancel(); } catch { /* nothing playing */ }
      try { recRef.current?.stop(); } catch { /* not started */ }
    };
  }, []);

  const play = () => {
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(source);
      u.rate = rate;
      u.onend = () => setPlaying(false);
      u.onerror = () => setPlaying(false);
      setPlaying(true);
      setPlays((n) => n + 1);
      window.speechSynthesis.speak(u);
    } catch {
      setPlaying(false);
    }
  };

  const stopPlaying = () => {
    try { window.speechSynthesis.cancel(); } catch { /* nothing playing */ }
    setPlaying(false);
  };

  const toggleMic = () => {
    if (listening) {
      try { recRef.current?.stop(); } catch { /* already stopped */ }
      setListening(false);
      return;
    }
    const w = window as unknown as { SpeechRecognition?: new () => RecognitionLike; webkitSpeechRecognition?: new () => RecognitionLike };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;

    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-IN';
    /* Rebuilt each event rather than appended to — see lib/speaking/transcript.ts.
       Appending from e.resultIndex duplicates phrases, and in a listening drill
       a duplicated word is scored as a word they caught twice. */
    rec.onresult = (e) => {
      setResponse(assembleTranscript(e.results).display.trim());
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    try { rec.start(); } catch { setListening(false); }
  };

  const check = () => {
    const result = analyseListening({ source, response, mode });
    setReport(result);
    // One row per answer. Re-checking the same words is the same attempt.
    const fingerprint = `${source}::${response.trim()}`;
    if (logged.current !== fingerprint) {
      logged.current = fingerprint;
      // See speaking-lab: never awaited, never allowed to block the result.
      void logAttempt({
        kind: 'listening',
        drillId: passage ? 'lesson' : `passage-${index}`,
        score: result.score,
        metrics: listeningMetrics(result),
      }).then((ok) => { if (ok) onLogged?.(); });
    }
  };

  const reset = () => {
    stopPlaying();
    setResponse('');
    setReport(null);
    setPlays(0);
    logged.current = null;
  };

  const next = () => { setIndex((i) => (i + 1) % PASSAGES.length); reset(); };

  const tone = (kind: 'good' | 'watch' | 'fix') =>
    kind === 'good' ? 'bg-green-50 border-green-200 text-green-900'
    : kind === 'fix' ? 'bg-amber-50 border-amber-200 text-amber-900'
    : 'bg-slate-50 border-slate-200 text-slate-700';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2" style={{ fontFamily: 'var(--font-jakarta)' }}>
            <Ear className="w-4 h-4 text-cyan-600" />
            Listening practice
          </h3>
          <p className="text-xs text-slate-600 mt-1">
            Listen, then say or type it back. The words stay hidden until you have tried.
          </p>
        </div>
        {!passage && (
          <button onClick={next}
            className="shrink-0 h-8 px-2.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1"
            style={{ fontFamily: 'var(--font-grotesk)' }}>
            <RotateCcw className="w-3 h-3" /> Another
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={playing ? stopPlaying : play}
          className="h-10 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold flex items-center gap-2"
          style={{ fontFamily: 'var(--font-grotesk)' }}
        >
          {playing ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {playing ? 'Stop' : plays === 0 ? 'Play the passage' : 'Play again'}
        </button>

        {/* The skill is following speech faster than comfortable, so the speed
            is the drill rather than a setting. */}
        <div className="flex items-center gap-1">
          {[0.8, 1, 1.25].map((r) => (
            <button
              key={r}
              onClick={() => setRate(r)}
              className={`h-10 px-2.5 rounded-lg text-[11px] font-bold border-2 ${
                rate === r ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-slate-200 text-slate-500'
              }`}
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              {r}×
            </button>
          ))}
        </div>

        {plays > 0 && (
          <span className="text-[11px] text-slate-400">
            played {plays} {plays === 1 ? 'time' : 'times'}
          </span>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={() => setMode('typed')}
          className={`h-9 px-3 rounded-lg text-xs font-bold border-2 flex items-center gap-1.5 ${
            mode === 'typed' ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-slate-200 text-slate-500'
          }`}
          style={{ fontFamily: 'var(--font-grotesk)' }}
        >
          <Keyboard className="w-3.5 h-3.5" /> Type it
        </button>
        <button
          onClick={() => setMode('spoken')}
          disabled={!!micBlocker}
          title={micBlocker ? micMessage(micBlocker as 'insecure' | 'no-recognition').title : undefined}
          className={`h-9 px-3 rounded-lg text-xs font-bold border-2 flex items-center gap-1.5 disabled:opacity-40 ${
            mode === 'spoken' ? 'border-cyan-500 bg-cyan-50 text-cyan-700' : 'border-slate-200 text-slate-500'
          }`}
          style={{ fontFamily: 'var(--font-grotesk)' }}
        >
          <Mic className="w-3.5 h-3.5" /> Say it
        </button>
      </div>

      {micBlocker && (
        <p className="mt-2 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 leading-relaxed">
          {micMessage(micBlocker as 'insecure' | 'no-recognition').title} Typing it back works just as well.
        </p>
      )}

      {mode === 'spoken' ? (
        <div className="mt-3">
          <button
            onClick={toggleMic}
            className={`w-full h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 ${
              listening ? 'bg-red-600 text-white' : 'bg-cyan-600 hover:bg-cyan-700 text-white'
            }`}
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            <Mic className="w-4 h-4" />
            {listening ? 'Listening — tap when finished' : 'Say it back'}
          </button>
          {response && (
            <p className="mt-2 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              {response}
            </p>
          )}
        </div>
      ) : (
        <textarea
          value={response}
          onChange={(e) => setResponse(e.target.value)}
          rows={4}
          placeholder="Type what you heard, as close as you can get it."
          className="mt-3 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
          style={{ fontFamily: 'var(--font-inter)' }}
        />
      )}

      <div className="mt-3 flex gap-2">
        <button
          onClick={check}
          disabled={!response.trim()}
          className="flex-1 h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold disabled:opacity-40"
          style={{ fontFamily: 'var(--font-grotesk)' }}
        >
          Check what I heard
        </button>
        {report && (
          <button onClick={reset}
            className="h-11 px-4 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50"
            style={{ fontFamily: 'var(--font-grotesk)' }}>
            Again
          </button>
        )}
      </div>

      {report && (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Key words', value: `${report.recall.caught}/${report.recall.total}` },
              { label: 'In order', value: `${report.sequence.percent}%` },
              { label: 'Score', value: String(report.score) },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-slate-200 px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>
                  {s.label}
                </p>
                <p className="text-lg font-extrabold text-slate-900 tabular-nums" style={{ fontFamily: 'var(--font-jakarta)' }}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          {report.notes.map((n, i) => (
            <p key={i} className={`text-xs leading-relaxed rounded-xl border px-3 py-2 ${tone(n.kind)}`}>
              {n.text}
            </p>
          ))}

          {/* Only now. Before this it would have been a reading drill. */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1" style={{ fontFamily: 'var(--font-grotesk)' }}>
              What was actually said
            </p>
            <p className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 leading-relaxed">
              {source}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
