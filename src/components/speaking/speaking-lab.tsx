'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, Square, RotateCcw, AlertCircle, Loader2, CheckCircle2, Info } from 'lucide-react';
import { analyseSpeech, type SpeechReport, type SpeechSample } from '@/lib/speaking/analyse';

/**
 * SARIRO — the Speaking Lab
 * =========================================================
 * A student presses record, talks, and gets told what actually happened to
 * their voice. Between classes, as many times as they like.
 *
 * ── Everything runs on their own device ─────────────────────────────────────
 * The transcript comes from the browser's own speech recognition and the
 * loudness from the Web Audio analyser. No audio is uploaded, no API is called,
 * and no credit is spent — which is what makes "practise it again" a real
 * instruction rather than a rationed one. It also means a child's voice never
 * leaves their laptop, which is the answer to the question a parent will ask.
 *
 * ── Two independent streams, deliberately ───────────────────────────────────
 * Speech recognition gives words and no reliable timing. The analyser gives
 * timing and no words. Pace needs both; pauses need only the second. Reading
 * pauses off the audio rather than off word timings is what makes the pause
 * measurements trustworthy — see lib/speaking/analyse.ts.
 *
 * ── When the browser cannot do it ───────────────────────────────────────────
 * Speech recognition is Chrome, Edge and Safari; Firefox has none. Rather than
 * hide the lesson, the drill stays readable and the panel says plainly what is
 * missing and where it does work. A student on the wrong browser can still read
 * the passage aloud — they just do not get the report.
 */

/* The Web Speech API is not in TypeScript's DOM library. */
interface SpeechRecognitionAlternativeLike { transcript: string }
interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: SpeechRecognitionAlternativeLike;
  length: number;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: { length: number; [i: number]: SpeechRecognitionResultLike };
}
interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type RecognitionCtor = new () => SpeechRecognitionLike;

function recognitionCtor(): RecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: RecognitionCtor;
    webkitSpeechRecognition?: RecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

/** Loudness is sampled this often. 50ms is finer than any pause worth naming. */
const FRAME_MS = 50;

export interface Drill {
  id: string;
  title: string;
  /** What to do, in the mentor's words. */
  brief: string;
  /**
   * A passage to read, when the drill sets one. Its punctuation becomes the
   * places the student is expected to breathe.
   */
  passage?: string;
  /** Roughly how long they should speak for. */
  targetSeconds?: number;
}

import { diagnoseMic, micMessage, micErrorMessage, type MicBlocker } from '@/lib/speaking/mic';
import { assembleTranscript } from '@/lib/speaking/transcript';
import PronunciationPanel from '@/components/speaking/pronunciation-panel';
import { analysePronunciation } from '@/lib/speaking/pronunciation';
import { detectPitch } from '@/lib/speaking/pitch';
import { analyseModulation } from '@/lib/speaking/modulation';
import ModulationPanel from '@/components/speaking/modulation-panel';
import { logAttempt } from '@/lib/speaking/practice-log';
import { speakingMetrics } from '@/lib/speaking/progress';

export default function SpeakingLab({
  drill,
  onLogged,
}: {
  drill: Drill;
  /** Fired once a row is actually written, so a progress panel can refresh. */
  onLogged?: () => void;
}) {
  /* null while unknown, '' when everything is present, otherwise the reason.
     A boolean here was the bug: "this browser cannot listen" was shown for
     three completely different causes, and the commonest one — an http:// page,
     where the browser silently removes navigator.mediaDevices entirely — is
     the one the message did not fit at all. Nobody could tell why the
     microphone prompt never appeared, because it never had a chance to. */
  const [blocker, setBlocker] = useState<MicBlocker | null>(null);
  const [state, setState] = useState<'idle' | 'recording' | 'done'>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [report, setReport] = useState<SpeechReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState(0);

  const recognition = useRef<SpeechRecognitionLike | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const audioCtx = useRef<AudioContext | null>(null);
  const levels = useRef<number[]>([]);
  /* Pitch per frame, aligned to `levels`. null on unvoiced frames — roughly
     half of ordinary speech, since s, f, sh and silence have no pitch at all.
     The buffer was already being read for loudness and then discarded; this is
     the same buffer, asked a second question. */
  const pitches = useRef<(number | null)[]>([]);
  const finalText = useRef('');
  /* Everything heard in recognition sessions that have already ended. Chrome
     stops on its own after a few seconds of silence and we restart it; each
     restart gets an empty results list, so what came before has to live here
     or it is lost. */
  const priorSessions = useRef('');
  const startedAt = useRef(0);
  const sampler = useRef<number | null>(null);
  const ticker = useRef<number | null>(null);
  /** Whether a recording is live, readable from inside long-lived callbacks. */
  const recording = useRef(false);

  useEffect(() => {
    setBlocker(diagnoseMic());
  }, []);

  /** Everything the recording holds open, released in one place. */
  const teardown = useCallback(() => {
    recording.current = false;
    if (sampler.current) { clearInterval(sampler.current); sampler.current = null; }
    if (ticker.current) { clearInterval(ticker.current); ticker.current = null; }
    try { recognition.current?.stop(); } catch { /* already stopped */ }
    recognition.current = null;
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    void audioCtx.current?.close().catch(() => {});
    audioCtx.current = null;
  }, []);

  // A recording left running because the student navigated away is a
  // microphone light that stays on. That is the kind of thing a parent
  // uninstalls over.
  useEffect(() => teardown, [teardown]);

  const stop = useCallback(() => {
    const durationMs = Date.now() - startedAt.current;
    teardown();
    setState('done');

    const sample: SpeechSample = {
      transcript: finalText.current.trim(),
      durationMs,
      levels: levels.current,
      frameMs: FRAME_MS,
      reference: drill.passage,
    };
    const result = analyseSpeech(sample);
    setReport(result);

    /* Audio came through and no words did. That is not a slow speaker, it is
       a recogniser that gave us nothing — and it must not be recorded as a
       pace of zero. */
    const heardWords = sample.transcript.trim().length > 0;
    if (!heardWords) {
      setError(
        levels.current.some((l) => l > 0.02)
          ? 'We heard you, but the browser turned none of it into words. Chrome or Edge are the most reliable — and check the passage is being read aloud rather than under your breath.'
          : 'We did not pick up any sound. Check the right microphone is selected and try once more.'
      );
    }

    /* Pronunciation only exists for a drill with a passage — free speech has
       no target to compare against. Logged alongside the rest so it becomes a
       CURVE rather than a one-off reading: "words heard right, 71% to 88%" is
       the sentence a parent renews on. */
    const said = drill.passage
      ? analysePronunciation({ reference: drill.passage, transcript: finalText.current })
      : null;
    const moved = analyseModulation({
      levels: levels.current, pitches: pitches.current, frameMs: FRAME_MS,
    });

    /* Logged after the report is on screen, and deliberately not awaited. The
       child has finished speaking and wants their result; a slow network must
       not sit between them and it. A failed write loses one row, which is the
       right thing to lose. */
    void logAttempt({
      kind: 'speaking',
      drillId: drill.id,
      score: result.score,
      durationMs,
      metrics: speakingMetrics({
        ...result,
        hadWords: heardWords,
        pronunciationAccuracy: said?.scored ? said.accuracy : undefined,
        pitchRange: moved.scored && moved.rangeSemitones > 0 ? moved.rangeSemitones : undefined,
        energyDrift: moved.scored ? moved.energyDrift : undefined,
      }),
    }).then((ok) => { if (ok) onLogged?.(); });
  }, [teardown, drill.passage, drill.id, onLogged]);

  const start = useCallback(async () => {
    const Ctor = recognitionCtor();
    if (!Ctor) return;

    setError(null);
    setReport(null);
    setTranscript('');
    finalText.current = '';
    priorSessions.current = '';
    levels.current = [];
    pitches.current = [];
    setElapsed(0);

    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      /* Three different refusals, and the fix is different for each. "Check
         the permission" is unhelpful to somebody whose laptop simply has no
         microphone, and actively wrong for somebody who has blocked us once
         and now gets no prompt at all — the browser denies instantly and
         silently from then on, which reads exactly like nothing happened. */
      setError(micErrorMessage(err));
      return;
    }

    // ── Loudness ──
    const ctx = new AudioContext();
    audioCtx.current = ctx;
    const source = ctx.createMediaStreamSource(stream.current);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(analyser);
    const buf = new Float32Array(analyser.fftSize);

    sampler.current = window.setInterval(() => {
      analyser.getFloatTimeDomainData(buf);
      // RMS, which tracks perceived loudness far better than a peak does.
      let sum = 0;
      for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
      const rms = Math.sqrt(sum / buf.length);
      levels.current.push(rms);
      /* The same frame, asked how HIGH it was. Loudness says whether somebody
         is audible; pitch is what separates reciting from presenting, and it
         was already in this buffer being thrown away. */
      pitches.current.push(detectPitch(buf, ctx.sampleRate));
      setLevel(rms);
    }, FRAME_MS);

    // ── Words ──
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-IN';
    /* Rebuilt from scratch on every event, not appended to.
       ────────────────────────────────────────────────────────────────────
       This used to loop from e.resultIndex and do `finalText += ...`, which
       duplicates words. resultIndex is the first result that CHANGED, not the
       first UNSEEN one, and Chrome re-fires it at an index that is already
       final often enough to matter. The transcript came back with phrases
       doubled — and because every number in the report is derived from it,
       the word count, the pace and the filler count were all inflated with
       the child's own words counted twice.

       Rebuilding is O(results) on a list of a few dozen, and it cannot
       double-count because nothing is remembered between events. Text from
       earlier sessions is banked separately in onend, since Chrome hands each
       restarted session a fresh, empty results list. */
    rec.onresult = (e) => {
      const out = assembleTranscript(e.results, priorSessions.current);
      finalText.current = out.final;
      setTranscript(out.display);
    };
    rec.onerror = (e) => {
      // 'no-speech' fires on a quiet moment and is not worth alarming anybody
      // about; the report will say the recording was too short.
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        setError('Speech recognition stopped unexpectedly. Your recording is still being measured.');
      }
    };
    rec.onend = () => {
      // Chrome ends the session on its own after a few seconds of silence.
      // While the student is still recording, start it again rather than
      // silently losing the rest of what they say.
      //
      // Read from a ref, not from `state`: this closure is created once when
      // recording starts, so the state variable it captured is whatever it was
      // THEN — 'idle' — and the session would never restart.
      /* Bank what this session heard before the next one wipes e.results.
         Without this, restarting after a silence loses everything said so far
         — which on a 60-second drill is most of it, because Chrome gives up
         after a few seconds of quiet and a child pauses to think. */
      priorSessions.current = finalText.current;
      if (recording.current) { try { rec.start(); } catch { /* racing a stop */ } }
    };
    recognition.current = rec;
    try { rec.start(); } catch { /* already started */ }

    startedAt.current = Date.now();
    ticker.current = window.setInterval(() => {
      setElapsed(Math.round((Date.now() - startedAt.current) / 1000));
    }, 250);
    recording.current = true;
    setState('recording');
  }, []);

  /* ── Something is in the way, and it is worth naming which ── */
  if (blocker) {
    const said = micMessage(blocker);

    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-2.5">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-[13px] text-amber-900 leading-[1.6]">
          <p className="font-bold mb-1">{said.title}</p>
          <p>{said.body}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── The drill ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400 mb-1.5">Practise</p>
        <p className="text-[15px] font-bold text-slate-900 mb-1" style={{ fontFamily: 'var(--font-jakarta)' }}>
          {drill.title}
        </p>
        <p className="text-[13.5px] text-slate-600 leading-[1.65]">{drill.brief}</p>
        {drill.passage && (
          <blockquote className="mt-3 rounded-lg bg-slate-50 border-l-2 border-slate-300 px-3.5 py-3 text-[14px] text-slate-800 leading-[1.8]">
            {drill.passage}
          </blockquote>
        )}
        {drill.targetSeconds && (
          <p className="text-[12px] text-slate-400 mt-2">Aim for about {drill.targetSeconds} seconds.</p>
        )}
      </div>

      {/* ── The control ── */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-3">
          {state === 'recording' ? (
            <button
              type="button"
              onClick={stop}
              className="inline-flex items-center gap-2 min-h-[46px] px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              <Square className="w-4 h-4 fill-current" /> Stop
            </button>
          ) : (
            <button
              type="button"
              onClick={start}
              disabled={blocker === null}
              className="inline-flex items-center gap-2 min-h-[46px] px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold disabled:bg-slate-300"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              {blocker === null ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
              {state === 'done' ? 'Record again' : 'Start recording'}
            </button>
          )}

          {state === 'recording' && (
            <>
              <span className="tabular-nums text-[15px] font-bold text-slate-900">
                {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
              </span>
              {/* A live meter, so a student who cannot be heard finds out now
                  rather than from the report. */}
              <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden" aria-hidden>
                <div
                  className="h-full rounded-full transition-[width] duration-75"
                  style={{
                    width: `${Math.min(100, level * 320)}%`,
                    background: level * 320 < 8 ? '#F59E0B' : '#16A34A',
                  }}
                />
              </div>
            </>
          )}

          {state === 'done' && report && (
            <button
              type="button"
              onClick={() => { setState('idle'); setReport(null); setTranscript(''); }}
              className="inline-flex items-center gap-1.5 min-h-[46px] px-3 rounded-xl text-slate-500 hover:bg-slate-100 text-[13px] font-bold"
            >
              <RotateCcw className="w-4 h-4" /> Clear
            </button>
          )}
        </div>

        {state === 'recording' && level * 320 < 8 && (
          <p className="text-[12.5px] text-amber-700 mt-2.5">
            We can barely hear you. Move closer to the microphone.
          </p>
        )}

        {error && (
          <p className="flex items-start gap-1.5 text-[12.5px] text-red-600 mt-2.5 leading-[1.5]">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" /> {error}
          </p>
        )}

        {transcript && (
          <p className="mt-3 text-[13px] text-slate-500 leading-[1.7] max-h-32 overflow-y-auto">
            {transcript}
          </p>
        )}
      </div>

      {report && <SpeechReportCard report={report} />}

      {/* Only for a drill with a passage. Pronunciation needs a target: with
          free speech there is nothing to compare against, and inventing one
          would mean guessing what a child meant to say. */}
      {report && drill.passage && state === 'done' && (
        <PronunciationPanel reference={drill.passage} transcript={finalText.current} />
      )}

      {/* Every drill, not just read-aloud: how a voice moves needs no target
          text, only the voice. */}
      {report && state === 'done' && (
        <ModulationPanel
          levels={levels.current}
          pitches={pitches.current}
          frameMs={FRAME_MS}
        />
      )}
    </div>
  );
}

/* ─────────────────────────── The report ─────────────────────────── */

function SpeechReportCard({ report }: { report: SpeechReport }) {
  const secs = (ms: number) => `${Math.round(ms / 100) / 10}s`;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">How that went</p>
        <p className="text-2xl font-extrabold text-slate-900 tabular-nums" style={{ fontFamily: 'var(--font-jakarta)' }}>
          {report.score}<span className="text-sm text-slate-400 font-bold">/100</span>
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <Stat label="Pace" value={`${report.pace.wpm}`} unit="wpm" verdict={report.pace.verdict} />
        <Stat label="Phrases" value={`${report.phrasing.averageWords}`} unit="words each" verdict={report.phrasing.verdict} />
        <Stat label="Pauses" value={`${report.pauses.count}`} unit={report.pauses.count ? `avg ${secs(report.pauses.averageMs)}` : 'none'} verdict={report.pauses.count > 0 ? 'good' : 'low'} />
        <Stat label="Fillers" value={`${report.fillers.certain}`} unit={report.fillers.hedged ? `+${report.fillers.hedged} maybe` : 'um, uh'} verdict={report.fillers.certain === 0 ? 'good' : report.fillers.perMinute > 4 ? 'high' : 'low'} />
      </div>

      {report.punctuation && (
        <p className="text-[12.5px] text-slate-500">
          You paused at <strong className="text-slate-800">{report.punctuation.honoured}</strong> of the{' '}
          <strong className="text-slate-800">{report.punctuation.expected}</strong> marks in the passage.
        </p>
      )}

      <div className="space-y-2">
        {report.notes.map((n, i) => (
          <div
            key={i}
            className={`flex gap-2 rounded-lg px-3 py-2.5 text-[13px] leading-[1.6] ${
              n.kind === 'good'
                ? 'bg-green-50 text-green-900'
                : n.kind === 'fix'
                  ? 'bg-red-50 text-red-900'
                  : 'bg-amber-50 text-amber-900'
            }`}
          >
            {n.kind === 'good'
              ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
            <span>{n.text}</span>
          </div>
        ))}
      </div>

      <p className="text-[11.5px] text-slate-400 leading-[1.55]">
        Measured on your own device. Nothing is uploaded and nobody hears the
        recording — practise as many times as you like.
      </p>
    </div>
  );
}

function Stat({
  label, value, unit, verdict,
}: { label: string; value: string; unit: string; verdict: 'good' | 'low' | 'high' }) {
  const tone = verdict === 'good' ? '#15803D' : verdict === 'high' ? '#B91C1C' : '#B45309';
  return (
    <div className="rounded-lg border border-slate-200 px-3 py-2.5">
      <p className="text-[10.5px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-lg font-extrabold tabular-nums" style={{ color: tone, fontFamily: 'var(--font-jakarta)' }}>
        {value}
      </p>
      <p className="text-[11px] text-slate-400">{unit}</p>
    </div>
  );
}
