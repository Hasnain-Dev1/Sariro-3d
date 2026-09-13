'use client';

import { useCallback, useState } from 'react';
import { Mic, Square, RotateCcw, AlertCircle, Loader2, CheckCircle2, Info } from 'lucide-react';
import { analyseSpeech, type SpeechReport } from '@/lib/speaking/analyse';
import { micMessage } from '@/lib/speaking/mic';
import PronunciationPanel from '@/components/speaking/pronunciation-panel';
import { analysePronunciation } from '@/lib/speaking/pronunciation';
import { analyseModulation } from '@/lib/speaking/modulation';
import ModulationPanel from '@/components/speaking/modulation-panel';
import { logAttempt } from '@/lib/speaking/practice-log';
import { speakingMetrics } from '@/lib/speaking/progress';
import { useSpeechRecorder, FRAME_MS, type Recording } from '@/components/speaking/use-speech-recorder';

/**
 * SARIRO — the Speaking Lab
 * =========================================================
 * A student presses record, talks, and gets told what actually happened to
 * their voice. Between classes, as many times as they like.
 *
 * The recording itself — words, loudness and pitch, all on the device — lives
 * in components/speaking/use-speech-recorder.ts, shared with the public Voice
 * Check. This component decides what an ENROLLED student gets from it: the
 * full report, pronunciation against a passage, modulation, and a row in their
 * practice log so it becomes a curve rather than a one-off reading.
 *
 * ── When the browser cannot do it ───────────────────────────────────────────
 * Speech recognition is Chrome, Edge and Safari; Firefox has none. Rather than
 * hide the lesson, the drill stays readable and the panel says plainly what is
 * missing and where it does work.
 */

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

export default function SpeakingLab({
  drill,
  onLogged,
}: {
  drill: Drill;
  /** Fired once a row is actually written, so a progress panel can refresh. */
  onLogged?: () => void;
}) {
  const [report, setReport] = useState<SpeechReport | null>(null);
  /** The recording the report on screen was measured from. */
  const [last, setLast] = useState<Recording | null>(null);

  const onStop = useCallback((rec: Recording) => {
    setLast(rec);
    const result = analyseSpeech({
      transcript: rec.transcript,
      durationMs: rec.durationMs,
      levels: rec.levels,
      frameMs: rec.frameMs,
      reference: drill.passage,
    });
    setReport(result);

    /* Pronunciation only exists for a drill with a passage — free speech has
       no target to compare against. Logged alongside the rest so it becomes a
       CURVE: "words heard right, 71% to 88%" is the sentence a parent renews on. */
    const said = drill.passage
      ? analysePronunciation({ reference: drill.passage, transcript: rec.transcript })
      : null;
    const moved = analyseModulation({ levels: rec.levels, pitches: rec.pitches, frameMs: rec.frameMs });

    /* Logged after the report is on screen, and deliberately not awaited. The
       child has finished speaking and wants their result; a slow network must
       not sit between them and it. */
    void logAttempt({
      kind: 'speaking',
      drillId: drill.id,
      score: result.score,
      durationMs: rec.durationMs,
      metrics: speakingMetrics({
        ...result,
        hadWords: rec.heardWords,
        pronunciationAccuracy: said?.scored ? said.accuracy : undefined,
        pitchRange: moved.scored && moved.rangeSemitones > 0 ? moved.rangeSemitones : undefined,
        energyDrift: moved.scored ? moved.energyDrift : undefined,
      }),
    }).then((ok) => { if (ok) onLogged?.(); });
  }, [drill.passage, drill.id, onLogged]);

  const { blocker, state, elapsed, transcript, error, level, start, stop, reset } = useSpeechRecorder({ onStop });

  /* Audio came through and no words did. That is not a slow speaker, it is a
     recogniser that gave us nothing — said plainly, rather than reported as a
     pace of zero. Derived from the last recording, so it clears itself the
     moment a new one starts. */
  const noWords =
    state === 'done' && last && !last.heardWords
      ? last.heardSound
        ? 'We heard you, but the browser turned none of it into words. Chrome or Edge are the most reliable — and check the passage is being read aloud rather than under your breath.'
        : 'We did not pick up any sound. Check the right microphone is selected and try once more.'
      : null;
  const shownError = error ?? noWords;

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
              onClick={() => { reset(); setReport(null); setLast(null); }}
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

        {shownError && (
          <p className="flex items-start gap-1.5 text-[12.5px] text-red-600 mt-2.5 leading-[1.5]">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" /> {shownError}
          </p>
        )}

        {transcript && (
          <p className="mt-3 text-[13px] text-slate-500 leading-[1.7] max-h-32 overflow-y-auto">
            {transcript}
          </p>
        )}
      </div>

      {report && state === 'done' && <SpeechReportCard report={report} />}

      {/* Only for a drill with a passage. Pronunciation needs a target: with
          free speech there is nothing to compare against, and inventing one
          would mean guessing what a child meant to say. */}
      {report && drill.passage && state === 'done' && (
        <PronunciationPanel reference={drill.passage} transcript={last?.transcript ?? ''} />
      )}

      {/* Every drill, not just read-aloud: how a voice moves needs no target
          text, only the voice. */}
      {report && state === 'done' && (
        <ModulationPanel
          levels={last?.levels ?? []}
          pitches={last?.pitches ?? []}
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
