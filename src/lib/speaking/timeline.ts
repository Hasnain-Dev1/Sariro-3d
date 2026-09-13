import { fillerAt, silences, LONG_PAUSE_MS, wordsOf } from './analyse';

/**
 * SARIRO — when each word was said
 * ============================================================================
 * The replay timeline pins every "um" and every long pause at the moment it
 * happened, so a child can tap one and hear it. That needs a time for every
 * word — and the browser's speech recognition does not give one. It returns
 * text, and nothing else.
 *
 * ── How the times are recovered ─────────────────────────────────────────────
 * Two clocks run during a recording, and neither knows about the other:
 *
 *   • the recogniser streams INTERIM words while the child is still talking,
 *     and the moment each word position first appears is noted (observeWords);
 *   • the analyser measures loudness every 50ms, so it knows to the frame when
 *     somebody was talking and when nobody was.
 *
 * A word's first appearance is late — the recogniser needs a little audio after
 * a word before it shows it — and words often arrive in a batch, several at one
 * instant, when a phrase ends. So:
 *
 *   1. the recogniser's lag is taken off, and the result is moved onto the
 *      nearest audio where somebody was actually talking;
 *   2. a batch is spread back over the talking that came before it, at the
 *      speaker's own rate — not stacked on one instant;
 *   3. positions the recogniser never showed are placed between neighbours;
 *   4. all of this happens in VOICED time — a clock that only runs while
 *      somebody is talking. A word is never placed inside a pause, because in
 *      voiced time a pause has no length.
 *
 * Accurate to a fraction of a second, which is what "tap it and hear it" needs.
 * Pure, so every part is tested without a microphone.
 */

/** A word position, and when it first appeared in the interim stream. */
export interface WordObservation {
  index: number;
  text: string;
  /** Milliseconds from the start of the recording. */
  ms: number;
}

export interface TimedWord {
  word: string;
  ms: number;
}

/** How long, typically, the recogniser takes to show a word after it is said. */
export const RECOGNITION_LAG_MS = 450;

/** How far a late estimate may be moved to reach audio where somebody is talking. */
const SNAP_WINDOW_MS = 1_500;

/** Below this share of the loudest frame, nobody is talking. Matches analyse.ts. */
const SILENCE_RATIO = 0.12;

/** A spoken word, bounded — so one odd recording cannot spread a batch over half a minute. */
const WORD_MS = { min: 180, max: 700 } as const;

/**
 * Record what the interim transcript shows now: any word position not seen
 * before gets the current time. Called on every recognition event. Positions
 * already seen keep their first time — a revision is the same word, later.
 */
export function observeWords(
  seen: readonly WordObservation[],
  transcript: string,
  nowMs: number
): WordObservation[] {
  const words = wordsOf(transcript);
  if (words.length <= seen.length) return seen as WordObservation[];
  const added: WordObservation[] = [];
  for (let i = seen.length; i < words.length; i++) {
    added.push({ index: i, text: words[i], ms: Math.max(0, Math.round(nowMs)) });
  }
  return [...seen, ...added];
}

/**
 * A clock that only runs while somebody is talking.
 *
 * `toVoiced(ms)` is how much talking had happened by `ms`; `fromVoiced(v)` is
 * the moment that much talking had happened. With no loudness to go on — a
 * sample, or a recording the analyser missed — both are the identity.
 */
function voicedClock(levels: readonly number[], frameMs: number, durationMs: number) {
  const peak = levels.length ? Math.max(...levels) : 0;
  if (peak <= 0 || frameMs <= 0) {
    return {
      total: durationMs,
      toVoiced: (ms: number) => Math.max(0, Math.min(durationMs, ms)),
      fromVoiced: (v: number) => Math.max(0, Math.min(durationMs, v)),
      snap: (ms: number) => ms,
    };
  }

  const floor = peak * SILENCE_RATIO;
  const voiced = levels.map((l) => l >= floor);
  const cum = new Array<number>(levels.length + 1);
  cum[0] = 0;
  for (let f = 0; f < levels.length; f++) cum[f + 1] = cum[f] + (voiced[f] ? frameMs : 0);
  const total = cum[levels.length];
  const lastVoiced = voiced.lastIndexOf(true);

  const toVoiced = (ms: number) => {
    const f = Math.max(0, Math.min(levels.length - 1, Math.floor(ms / frameMs)));
    if (ms >= levels.length * frameMs) return total;
    return voiced[f] ? cum[f] + Math.min(frameMs, Math.max(0, ms - f * frameMs)) : cum[f];
  };

  const fromVoiced = (v: number) => {
    if (v <= 0) return Math.max(0, voiced.indexOf(true)) * frameMs;
    if (v >= total) return lastVoiced * frameMs;
    // The frame whose talking contains v: cum[f] <= v < cum[f + 1].
    let lo = 0;
    let hi = levels.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cum[mid + 1] > v) hi = mid;
      else lo = mid + 1;
    }
    return lo * frameMs + (v - cum[lo]);
  };

  /* An estimate that lands in a silence moves to the nearer edge of it. A tie
     goes backwards: a recogniser most often commits to a word when the pause
     AFTER it begins, so a word found in a pause was usually said just before. */
  const snap = (ms: number) => {
    const f = Math.floor(ms / frameMs);
    if (f >= 0 && f < levels.length && voiced[f]) return ms;
    const reach = Math.ceil(SNAP_WINDOW_MS / frameMs);
    for (let d = 1; d <= reach; d++) {
      const back = f - d;
      if (back >= 0 && back < levels.length && voiced[back]) return back * frameMs;
      const fwd = f + d;
      if (fwd >= 0 && fwd < levels.length && voiced[fwd]) return fwd * frameMs;
    }
    return ms;
  };

  return { total, toVoiced, fromVoiced, snap };
}

/**
 * A time for every word in the FINAL transcript.
 *
 * The final transcript can differ from the interim one — a word revised, two
 * merged — so times are matched by position, and positions nobody saw are
 * interpolated rather than guessed as zero.
 */
export function alignWordTimes(
  finalTranscript: string,
  observations: readonly WordObservation[],
  durationMs: number,
  levels: readonly number[],
  frameMs: number
): TimedWord[] {
  const words = wordsOf(finalTranscript);
  const n = words.length;
  if (n === 0) return [];

  const clock = voicedClock(levels, frameMs, Math.max(0, durationMs));
  const wordV = Math.max(WORD_MS.min, Math.min(WORD_MS.max, clock.total / n));

  /* Anchors, in voiced time, for the positions the recogniser showed. Words
     that appeared at one instant are one batch and are spread back over the
     talking before that instant. */
  const seen = observations.filter((o) => o.index < n).sort((a, b) => a.index - b.index);
  const anchors: (number | null)[] = new Array(n).fill(null);
  let prevEnd = 0;
  for (let k = 0; k < seen.length; ) {
    let j = k;
    while (j + 1 < seen.length && seen[j + 1].ms === seen[k].ms && seen[j + 1].index === seen[j].index + 1) j++;
    const size = j - k + 1;
    const said = clock.snap(Math.max(0, seen[k].ms - RECOGNITION_LAG_MS));
    const end = Math.max(prevEnd, clock.toVoiced(said));
    const start = Math.max(prevEnd, end - size * wordV);
    for (let m = 0; m < size; m++) {
      anchors[seen[k + m].index] = start + ((m + 1) * (end - start)) / size;
    }
    prevEnd = end;
    k = j + 1;
  }

  /* Everything else, between the nearest anchors on either side. The first
     word cannot be before the start and the last cannot be after the end. */
  const voicedTimes = anchors.map((a, i) => {
    if (a !== null) return a;
    let b = i - 1;
    while (b >= 0 && anchors[b] === null) b--;
    let f = i + 1;
    while (f < n && anchors[f] === null) f++;
    const vb = b >= 0 ? (anchors[b] as number) : 0;
    const vf = f < n ? (anchors[f] as number) : clock.total;
    // With no anchor before, word 0 sits at the start of talking, not a step into it.
    const from = b >= 0 ? b : 0;
    const steps = f - from;
    const share = b >= 0 ? i - b : i;
    return steps > 0 ? vb + ((vf - vb) * share) / steps : vb;
  });

  let last = 0;
  return words.map((word, i) => {
    const ms = Math.min(durationMs, Math.max(last, clock.fromVoiced(voicedTimes[i])));
    last = ms;
    return { word, ms: Math.round(ms) };
  });
}

export interface TimelineMarker {
  kind: 'filler' | 'pause';
  ms: number;
  label: string;
  /** The word the marker belongs to: the filler itself, or the first word after the pause. */
  index: number;
  /** Fillers: always a filler ("um"), or only usually one ("like"). */
  certain?: boolean;
  /** Pauses: how long. */
  durationMs?: number;
}

/**
 * The moments worth pinning: every filler the score counted, and every long
 * pause in the middle of speaking. Silence before the first word and after the
 * last is nerves and the button, not a pause.
 */
export function markersFor(
  timed: readonly TimedWord[],
  levels: readonly number[],
  frameMs: number
): TimelineMarker[] {
  const out: TimelineMarker[] = [];
  const words = timed.map((t) => t.word);

  for (let i = 0; i < words.length; ) {
    const f = fillerAt(words, i);
    if (f) {
      out.push({ kind: 'filler', ms: timed[i].ms, label: f.word, index: i, certain: f.certain });
      i += f.length;
    } else {
      i += 1;
    }
  }

  if (timed.length > 0) {
    const firstMs = timed[0].ms;
    const lastMs = timed[timed.length - 1].ms;
    for (const s of silences([...levels], frameMs)) {
      if (s.ms < LONG_PAUSE_MS) continue;
      const endMs = s.startMs + s.ms;
      if (endMs <= firstMs || s.startMs >= lastMs) continue;
      const after = timed.findIndex((t) => t.ms >= endMs - frameMs);
      out.push({
        kind: 'pause',
        ms: s.startMs,
        label: `${(s.ms / 1000).toFixed(1)}s pause`,
        index: after === -1 ? timed.length - 1 : after,
        durationMs: s.ms,
      });
    }
  }

  return out.sort((a, b) => a.ms - b.ms || a.index - b.index);
}

/** The words either side of a marker, so a pin can be read as well as heard. */
export function contextFor(
  timed: readonly TimedWord[],
  marker: TimelineMarker,
  span = 3
): { before: string; focus: string; after: string } {
  const words = timed.map((t) => t.word);
  if (marker.kind === 'filler') {
    const length = marker.label.split(' ').length;
    return {
      before: words.slice(Math.max(0, marker.index - span), marker.index).join(' '),
      focus: marker.label,
      after: words.slice(marker.index + length, marker.index + length + span).join(' '),
    };
  }
  return {
    before: words.slice(Math.max(0, marker.index - span), marker.index).join(' '),
    focus: '· · ·',
    after: words.slice(marker.index, marker.index + span).join(' '),
  };
}

/** The loudness envelope as `bars` heights between 0 and 1, for drawing. */
export function waveformBars(levels: readonly number[], bars: number): number[] {
  if (levels.length === 0 || bars <= 0) return [];
  const peak = Math.max(...levels);
  if (peak <= 0) return Array.from({ length: bars }, () => 0);
  const size = levels.length / bars;
  return Array.from({ length: bars }, (_, b) => {
    const from = Math.floor(b * size);
    const to = Math.max(from + 1, Math.floor((b + 1) * size));
    let max = 0;
    for (let i = from; i < to && i < levels.length; i++) max = Math.max(max, levels[i]);
    return Math.round((max / peak) * 1000) / 1000;
  });
}

/** 0:07, 1:02 */
export function clockLabel(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
