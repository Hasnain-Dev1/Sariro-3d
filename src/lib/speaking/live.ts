import { fillerAt, wordsOf, PACE_BAND } from './analyse';
import type { WordObservation } from './timeline';

/**
 * SARIRO — what the screen shows WHILE a child is talking
 * ============================================================================
 * A score afterwards tells a child what happened. These tell them as it
 * happens, which is when it can still change: the needle drifts into "too fast"
 * and they slow down mid-sentence; the counter jumps on an "um" and the next
 * one turns into a pause.
 *
 * Every function here is cheap enough to run twenty times a second, and pure,
 * so none of it needs a microphone to test.
 */

/** Recent pace needs this much talking before it means anything. */
export const LIVE_PACE_WARMUP_MS = 3_000;

/**
 * Words per minute over the last few seconds.
 *
 * Recent, not overall: a child who started slowly and then rushed should see
 * the needle move while they are rushing, not a minute later. Before there is
 * enough to go on it says 0, and the needle rests.
 */
export function livePace(observations: readonly WordObservation[], nowMs: number, windowMs = 10_000): number {
  if (nowMs < LIVE_PACE_WARMUP_MS || observations.length < 3) return 0;
  const since = Math.max(0, nowMs - windowMs);
  // (since, now] — a word exactly on the window's edge belongs to one window, not two.
  const recent = observations.filter((o) => o.ms > since && o.ms <= nowMs).length;
  const span = Math.min(windowMs, nowMs);
  return Math.round((recent / span) * 60_000);
}

export type PaceZone = 'waiting' | 'slow' | 'good' | 'fast';

export function paceZone(wpm: number): PaceZone {
  if (wpm <= 0) return 'waiting';
  if (wpm < PACE_BAND.min) return 'slow';
  if (wpm > PACE_BAND.max) return 'fast';
  return 'good';
}

/** The dial runs from this pace (hard left) to this one (hard right). */
export const DIAL = { min: 60, max: 240 } as const;

/** Needle angle in degrees: -90 is hard left, 0 is straight up, 90 is hard right. */
export function needleAngle(wpm: number): number {
  if (wpm <= 0) return -90;
  const t = (Math.min(DIAL.max, Math.max(DIAL.min, wpm)) - DIAL.min) / (DIAL.max - DIAL.min);
  return Math.round((t * 180 - 90) * 10) / 10;
}

/**
 * The certain fillers ("um", "uh") said so far, in order.
 *
 * Only the certain ones. "Like" is as often a real word, and a counter that
 * jumps on "I like dogs" teaches a child the counter is wrong.
 */
export function liveFillers(transcript: string): string[] {
  const words = wordsOf(transcript);
  const out: string[] = [];
  for (let i = 0; i < words.length; ) {
    const f = fillerAt(words, i);
    if (f?.certain) out.push(f.word);
    i += f ? f.length : 1;
  }
  return out;
}

/** Semitones either side of the speaker's own middle that the trace can show. */
const TRACE_SEMITONES = 7;

/**
 * The last `frames` of pitch, as heights for a moving line.
 *
 * Each value is 0 (low) to 1 (high), measured in semitones from the speaker's
 * own middle — so a deep voice and a high one both fill the same band, and what
 * shows is the MOVEMENT, which is what expression is. null where there was no
 * pitch (silence, "s", "sh"), so the line breaks instead of diving to zero.
 * The front is padded with nulls until a recording is long enough to fill it.
 */
export function pitchTrace(pitches: readonly (number | null)[], frames: number): (number | null)[] {
  if (frames <= 0) return [];
  const recent = pitches.slice(-frames);
  const voiced = recent.filter((p): p is number => p !== null && p > 0).sort((a, b) => a - b);
  const pad: (number | null)[] = new Array(Math.max(0, frames - recent.length)).fill(null);
  if (voiced.length === 0) return [...pad, ...recent.map(() => null)];

  const middle = voiced[Math.floor(voiced.length / 2)];
  const raw = recent.map((p) => {
    if (p === null || p <= 0) return null;
    const st = 12 * Math.log2(p / middle);
    return 0.5 + Math.max(-1, Math.min(1, st / TRACE_SEMITONES)) / 2;
  });

  // A three-frame average smooths the detector's jitter without hiding a real rise.
  const smooth = raw.map((v, i) => {
    if (v === null) return null;
    const near = [raw[i - 1], v, raw[i + 1]].filter((x): x is number => x !== null && x !== undefined);
    return Math.round((near.reduce((a, b) => a + b, 0) / near.length) * 1000) / 1000;
  });
  return [...pad, ...smooth];
}
