'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { diagnoseMic, micErrorMessage, type MicBlocker } from '@/lib/speaking/mic';
import { assembleTranscript } from '@/lib/speaking/transcript';
import { detectPitch } from '@/lib/speaking/pitch';
import { observeWords, type WordObservation } from '@/lib/speaking/timeline';
import { onGrid } from '@/lib/speaking/frames';

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
 *
 * ── A third stream, for replay: when each word first appeared ───────────────
 * Every recognition event notes the moment each new word position showed up.
 * That is what lib/speaking/timeline.ts turns into a time for every word, so a
 * replay can pin an "um" where it was said. Cheap, so it is always on.
 *
 * ── And the audio itself, only when asked ───────────────────────────────────
 * `captureAudio` keeps the recording as a blob URL in this tab so it can be
 * played back. It is never uploaded, it is released on reset and on leaving the
 * page, and a browser without MediaRecorder simply gets no replay audio — the
 * rest works the same.
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
  /** When each word position first appeared, for timing words in a replay. */
  observations: WordObservation[];
}

export type RecorderState = 'idle' | 'recording' | 'done';

/** The streams as they grow, for live meters. Read in an interval or animation frame. */
export interface RecorderLive {
  levels: { readonly current: number[] };
  pitches: { readonly current: (number | null)[] };
  words: { readonly current: WordObservation[] };
}

export function useSpeechRecorder({
  onStop,
  lang = 'en-IN',
  captureAudio = false,
}: {
  /** Called once per recording, after the microphone is released. */
  onStop: (recording: Recording) => void;
  lang?: string;
  /** Keep the audio in this tab for playback. See the note above. */
  captureAudio?: boolean;
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
  /* The recording as a playable blob URL. Arrives a moment AFTER onStop — the
     browser hands over the last chunk of audio asynchronously. */
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const recognition = useRef<SpeechRecognitionLike | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const audioCtx = useRef<AudioContext | null>(null);
  const levels = useRef<number[]>([]);
  /* Pitch per frame, aligned to `levels`. null on unvoiced frames — roughly
     half of ordinary speech, since s, f, sh and silence have no pitch at all. */
  const pitches = useRef<(number | null)[]>([]);
  /* When each frame was ACTUALLY taken. A 50ms timer on a busy phone fires at
     90ms, and frames read as if punctual put every pause in the wrong place.
     See lib/speaking/frames.ts. */
  const stamps = useRef<number[]>([]);
  const words = useRef<WordObservation[]>([]);
  const recorder = useRef<MediaRecorder | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  /* Which recording is current. A MediaRecorder finishes after it is told to
     stop, so a reset — or a new recording — could otherwise be followed by the
     OLD audio arriving and replacing nothing with the wrong thing. */
  const take = useRef(0);
  const finalText = useRef('');
  /* Final AND interim: everything on screen. What is measured when recording
     stops, and what is banked when a session ends — see stop() and onend. */
  const displayText = useRef('');
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

  const releaseAudio = useCallback(() => {
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = null;
    setAudioUrl(null);
  }, []);

  // Leaving the page frees the audio held in memory.
  useEffect(() => () => {
    take.current += 1;
    if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
    audioUrlRef.current = null;
  }, []);

  /** Everything the recording holds open, released in one place. */
  const teardown = useCallback(() => {
    recording.current = false;
    // Before the tracks stop, so the last of the audio is kept.
    if (recorder.current && recorder.current.state !== 'inactive') {
      try { recorder.current.stop(); } catch { /* already stopped */ }
    }
    recorder.current = null;
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

    /* What was on screen, not only what Chrome had marked final. Pressing Stop
       ends recognition before it settles the last phrase, so the finals alone
       dropped the last few seconds of every recording — a child who spoke for
       thirty seconds was told it was "too short". The interim words were said;
       the recogniser was simply still deciding how to spell them. */
    const text = (displayText.current.trim().length >= finalText.current.trim().length
      ? displayText.current
      : finalText.current
    ).trim();
    onStopRef.current({
      transcript: text,
      durationMs,
      // Onto an exact grid, so frame f really is f × FRAME_MS.
      levels: onGrid(levels.current, stamps.current, durationMs, FRAME_MS),
      pitches: onGrid(pitches.current, stamps.current, durationMs, FRAME_MS),
      frameMs: FRAME_MS,
      heardWords: text.length > 0,
      heardSound: levels.current.some((l) => l > 0.02),
      observations: words.current,
    });
  }, [teardown]);

  const start = useCallback(async () => {
    const Ctor = recognitionCtor();
    if (!Ctor) return;

    setError(null);
    setTranscript('');
    finalText.current = '';
    displayText.current = '';
    priorSessions.current = '';
    levels.current = [];
    pitches.current = [];
    stamps.current = [];
    words.current = [];
    take.current += 1;
    const thisTake = take.current;
    releaseAudio();
    setElapsed(0);

    try {
      /* Noise suppression off, gain control on. Phone noise suppression treats
         a steady speaking voice as something to turn down, which is how a child
         speaking normally was told the recording was too quiet. Ideal values,
         not exact ones, so a device that cannot honour them still records. */
      stream.current = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: true },
      });
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

    // ── The audio, kept in this tab for replay ──
    if (captureAudio && typeof MediaRecorder !== 'undefined') {
      try {
        const mr = new MediaRecorder(stream.current);
        const chunks: Blob[] = [];
        mr.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
        mr.onstop = () => {
          if (thisTake !== take.current || chunks.length === 0) return;
          const url = URL.createObjectURL(new Blob(chunks, { type: mr.mimeType || 'audio/webm' }));
          audioUrlRef.current = url;
          setAudioUrl(url);
        };
        mr.start();
        recorder.current = mr;
      } catch {
        /* No replay audio on this browser. Everything else still works. */
      }
    }

    /* The clock starts with the first loudness frame and the audio, so frame
       f, second s of the replay and a word at s seconds are all the same moment. */
    startedAt.current = Date.now();
    sampler.current = window.setInterval(() => {
      analyser.getFloatTimeDomainData(buf);
      // RMS, which tracks perceived loudness far better than a peak does.
      let sum = 0;
      for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
      const rms = Math.sqrt(sum / buf.length);
      levels.current.push(rms);
      pitches.current.push(detectPitch(buf, ctx.sampleRate));
      stamps.current.push(Date.now() - startedAt.current);
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
      displayText.current = out.display;
      words.current = observeWords(words.current, out.display, Date.now() - startedAt.current);
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
      /* The whole session, interim words included: a session that ends is not
         going to finalise them, and on Android sessions end after nearly every
         sentence — banking only finals lost a phrase at each one. */
      priorSessions.current = displayText.current.trim().length >= finalText.current.trim().length
        ? displayText.current
        : finalText.current;
      if (recording.current) { try { rec.start(); } catch { /* racing a stop */ } }
    };
    recognition.current = rec;
    try { rec.start(); } catch { /* already started */ }

    ticker.current = window.setInterval(() => {
      setElapsed(Math.round((Date.now() - startedAt.current) / 1000));
    }, 250);
    recording.current = true;
    setState('recording');
  }, [lang, captureAudio, releaseAudio]);

  /** Back to a clean slate, as though nothing had been recorded. */
  const reset = useCallback(() => {
    take.current += 1;
    teardown();
    releaseAudio();
    setState('idle');
    setTranscript('');
    setError(null);
    setElapsed(0);
    setLevel(0);
  }, [teardown, releaseAudio]);

  /** Milliseconds since this recording started; 0 when not recording. */
  const clock = useCallback(() => (recording.current ? Date.now() - startedAt.current : 0), []);

  /* The raw streams as they grow, for meters that redraw faster than React
     should re-render. Read them in an interval or animation frame, not in render. */
  // Memoised: the refs never change, and a new object each render would restart
  // every effect that depends on it twenty times a second.
  const live = useMemo<RecorderLive>(() => ({ levels, pitches, words }), []);

  return { blocker, state, elapsed, transcript, error, setError, level, start, stop, reset, audioUrl, clock, live };
}
