'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { diagnoseMic, micErrorMessage, type MicBlocker } from '@/lib/speaking/mic';
import { assembleTranscript } from '@/lib/speaking/transcript';
import { detectPitch } from '@/lib/speaking/pitch';

/**
 * SARIRO — recording a voice, once, for everything that listens to one
 * ============================================================================
 * The Speaking Lab (enrolled students) and Voice Check (anybody on the website)
 * both need exactly the same recording: the words the browser heard, the
 * loudness of every 50ms frame, and the pitch of each of those frames.
 *
 * It lived inside the Speaking Lab, and two components cannot share a
 * recorder that lives inside one of them. The choice was a copy or this, and a
 * copy is how the lab came to count a child's words twice: a fix made in one
 * place and not the other. So it is here, and both use it.
 *
 * ── Everything runs on their own device ─────────────────────────────────────
 * Words come from the browser's own speech recognition and loudness from the
 * Web Audio analyser. No audio is uploaded and no API is called — a child's
 * voice never leaves their laptop or phone, which is the answer to the question
 * a parent will ask first.
 *
 * ── Two independent streams, deliberately ───────────────────────────────────
 * Speech recognition gives words and no reliable timing. The analyser gives
 * timing and no words. Pace needs both; pauses need only the second, which is
 * what makes the pause measurements trustworthy — see lib/speaking/analyse.ts.
 *
 * This hook only RECORDS. What to measure, what to keep and what to show is the
 * caller's business, handed over whole in `onStop`.
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
export const FRAME_MS = 50;

/** A finished recording, whole. */
export interface Recording {
  /** The final transcript — what every number is measured from. */
  transcript: string;
  durationMs: number;
  /** RMS loudness per frame, oldest first. */
  levels: number[];
  /** Pitch in Hz per frame, aligned to `levels`; null where unvoiced. */
  pitches: (number | null)[];
  frameMs: number;
  /** The recogniser produced at least one word. */
  heardWords: boolean;
  /** The microphone picked up anything louder than silence. */
  heardSound: boolean;
}

export type RecorderState = 'idle' | 'recording' | 'done';

export function useSpeechRecorder({
  onStop,
  lang = 'en-IN',
}: {
  /** Called once per recording, after the microphone is released. */
  onStop: (recording: Recording) => void;
  lang?: string;
}) {
  /* null while unknown, '' when everything is present, otherwise the reason.
     A boolean here was the bug: "this browser cannot listen" was shown for
     three different causes, and the commonest — an http:// page, where the
     browser silently removes navigator.mediaDevices — did not fit it at all. */
  const [blocker, setBlocker] = useState<MicBlocker | null>(null);
  const [state, setState] = useState<RecorderState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState(0);

  const recognition = useRef<SpeechRecognitionLike | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const audioCtx = useRef<AudioContext | null>(null);
  const levels = useRef<number[]>([]);
  /* Pitch per frame, aligned to `levels`. null on unvoiced frames — roughly
     half of ordinary speech, since s, f, sh and silence have no pitch at all. */
  const pitches = useRef<(number | null)[]>([]);
  const finalText = useRef('');
  /* Everything heard in recognition sessions that have already ended. Chrome
     stops on its own after a few seconds of silence and we restart it; each
     restart gets an empty results list, so what came before has to live here. */
  const priorSessions = useRef('');
  const startedAt = useRef(0);
  const sampler = useRef<number | null>(null);
  const ticker = useRef<number | null>(null);
  /** Whether a recording is live, readable from inside long-lived callbacks. */
  const recording = useRef(false);
  /* The latest onStop, so the stop callback never calls a stale one. */
  const onStopRef = useRef(onStop);
  useEffect(() => { onStopRef.current = onStop; }, [onStop]);

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

  // A microphone left running because somebody navigated away is a light that
  // stays on. That is the kind of thing a parent uninstalls over.
  useEffect(() => teardown, [teardown]);

  const stop = useCallback(() => {
    if (!recording.current) return;
    const durationMs = Date.now() - startedAt.current;
    teardown();
    setState('done');

    const text = finalText.current.trim();
    onStopRef.current({
      transcript: text,
      durationMs,
      levels: levels.current,
      pitches: pitches.current,
      frameMs: FRAME_MS,
      heardWords: text.length > 0,
      heardSound: levels.current.some((l) => l > 0.02),
    });
  }, [teardown]);

  const start = useCallback(async () => {
    const Ctor = recognitionCtor();
    if (!Ctor) return;

    setError(null);
    setTranscript('');
    finalText.current = '';
    priorSessions.current = '';
    levels.current = [];
    pitches.current = [];
    setElapsed(0);

    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      /* Three different refusals, and the fix is different for each — no
         microphone, a denied prompt, or a block from before that now denies
         silently. See lib/speaking/mic.ts. */
      setError(micErrorMessage(err));
      return;
    }

    // ── Loudness, and pitch from the same frame ──
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
      pitches.current.push(detectPitch(buf, ctx.sampleRate));
      setLevel(rms);
    }, FRAME_MS);

    // ── Words ──
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = lang;
    /* Rebuilt from scratch on every event, never appended to — appending from
       e.resultIndex double-counts words, because Chrome re-fires results that
       are already final. See lib/speaking/transcript.ts. */
    rec.onresult = (e) => {
      const out = assembleTranscript(e.results, priorSessions.current);
      finalText.current = out.final;
      setTranscript(out.display);
    };
    rec.onerror = (e) => {
      // 'no-speech' fires on a quiet moment and is not worth alarming anybody.
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        setError('Speech recognition stopped unexpectedly. Your recording is still being measured.');
      }
    };
    rec.onend = () => {
      /* Chrome ends the session after a few seconds of silence, and a child
         pausing to think is silence. Bank what this session heard, then start
         again while still recording. Read from a ref: this closure is created
         once, and the state it captured would still say 'idle'. */
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
  }, [lang]);

  /** Back to a clean slate, as though nothing had been recorded. */
  const reset = useCallback(() => {
    teardown();
    setState('idle');
    setTranscript('');
    setError(null);
    setElapsed(0);
    setLevel(0);
  }, [teardown]);

  return { blocker, state, elapsed, transcript, error, setError, level, start, stop, reset };
}
