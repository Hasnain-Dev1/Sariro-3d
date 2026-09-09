import { semitones } from './pitch';

/**
 * SARIRO — whether the voice moved, and where it gave up
 * ============================================================================
 * "Voice modulation" as a teaching note means almost nothing to a child. What
 * they can act on is three specific things, and all three are measurable from
 * what the lab already records:
 *
 *   · how far the voice moves           — monotone or not, in semitones
 *   · where it faded                    — the last third, usually
 *   · whether anything was emphasised   — deliberate peaks, or a flat wall
 *
 * ── Semitones, not hertz ────────────────────────────────────────────────────
 * A deep voice moving 40Hz and a high voice moving 40Hz do not sound remotely
 * alike. Semitones are what the ear actually measures, so a twelve-year-old
 * boy and an eight-year-old girl are judged on their delivery rather than on
 * their vocal cords.
 *
 * ── Why the thresholds are where they are ───────────────────────────────────
 * Ordinary conversational English moves through about 4–6 semitones. Engaged,
 * expressive speech is 8–12. Below 3 is the flat recitation that makes a
 * listener stop hearing the words. Those are the numbers the bands use, and
 * they are deliberately generous at the bottom: telling a nervous child their
 * voice is flat, when they were merely careful, teaches them to stop reading
 * aloud at all.
 *
 * ── The measurement that matters most is the fade ───────────────────────────
 * Almost every child starts strong and trails off. It is the single most
 * common thing a speaking teacher says, it is invisible to the speaker, and it
 * is trivially visible in the energy over time. Nobody has to be told twice.
 */

export interface ModulationInput {
  /** RMS per frame, oldest first. */
  levels: number[];
  /** Detected pitch per frame in Hz, aligned to `levels`. null where unvoiced. */
  pitches: (number | null)[];
  /** How long each frame covers. */
  frameMs: number;
}

export interface ModulationReport {
  scored: boolean;
  /** How far the voice moved, in semitones, ignoring the extremes. */
  rangeSemitones: number;
  /** 0-100. How much the voice moved, as a score. */
  expressiveness: number;
  /** 'flat' | 'steady' | 'lively' */
  band: 'flat' | 'steady' | 'lively';
  /** Percentage change in energy, first third to last third. Negative = faded. */
  energyDrift: number;
  /** Deliberate loud moments per minute. */
  emphasisPerMin: number;
  /** Energy over time, normalised to 0-1, downsampled for drawing. */
  arc: number[];
  /** How much of the recording had any pitch at all. Low means very quiet. */
  voicedPercent: number;
  notes: { kind: 'good' | 'watch' | 'fix'; text: string }[];
}

/** Below this there is not enough recording to say anything. */
export const MIN_FRAMES = 40;
/** And below this many pitched frames, the range would be noise. */
export const MIN_VOICED = 20;

const EMPTY: ModulationReport = {
  scored: false, rangeSemitones: 0, expressiveness: 0, band: 'steady',
  energyDrift: 0, emphasisPerMin: 0, arc: [], voicedPercent: 0,
  notes: [{ kind: 'watch', text: 'Record for a few seconds longer and we can show you how your voice moved.' }],
};

const round = (n: number, dp = 1) => {
  const f = 10 ** dp;
  return Math.round((n + Number.EPSILON) * f) / f;
};

/** The value at a percentile of a sorted copy. */
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const i = Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * p)));
  return sorted[i];
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export function analyseModulation(input: ModulationInput): ModulationReport {
  const levels = (input.levels ?? []).filter((n) => Number.isFinite(n) && n >= 0);
  const pitches = input.pitches ?? [];
  const frameMs = input.frameMs > 0 ? input.frameMs : 50;

  if (levels.length < MIN_FRAMES) return EMPTY;

  const voiced = pitches.filter((p): p is number => typeof p === 'number' && p > 0);
  const voicedPercent = Math.round((voiced.length / Math.max(1, pitches.length)) * 100);

  /* ── Range ───────────────────────────────────────────────────────────────
     10th to 90th percentile, not min to max. One squeak or one creaky frame
     would otherwise make a monotone child look operatic, and the outliers are
     exactly where a pitch detector is least reliable. */
  let rangeSemitones = 0;
  if (voiced.length >= MIN_VOICED) {
    const sorted = [...voiced].sort((a, b) => a - b);
    rangeSemitones = round(semitones(percentile(sorted, 0.1), percentile(sorted, 0.9)));
  }

  /* ── Energy over time ────────────────────────────────────────────────────
     Thirds, because a fade is a slow thing and comparing the first frame to
     the last would report a breath. */
  const third = Math.floor(levels.length / 3);
  const opening = mean(levels.slice(0, third));
  const closing = mean(levels.slice(-third));
  const energyDrift = opening > 0 ? round(((closing - opening) / opening) * 100, 0) : 0;

  /* ── Emphasis ────────────────────────────────────────────────────────────
     A frame well above this speaker's own normal. Relative on purpose: a
     quiet child emphasising is still emphasising, and an absolute threshold
     would only ever find loud children. */
  const sortedLevels = [...levels].sort((a, b) => a - b);
  const median = percentile(sortedLevels, 0.5);
  const peakFloor = median * 1.8;
  let peaks = 0;
  let inPeak = false;
  for (const l of levels) {
    if (l > peakFloor && !inPeak) { peaks++; inPeak = true; }
    else if (l <= peakFloor) inPeak = false;
  }
  const minutes = Math.max(0.05, (levels.length * frameMs) / 60_000);
  const emphasisPerMin = round(peaks / minutes, 1);

  /* ── The drawable arc ────────────────────────────────────────────────────
     Downsampled to about 60 points and normalised to this speaker's own peak,
     so the shape is comparable between a loud recording and a quiet one. */
  const BUCKETS = 60;
  const size = Math.max(1, Math.floor(levels.length / BUCKETS));
  const arcRaw: number[] = [];
  for (let i = 0; i < levels.length; i += size) arcRaw.push(mean(levels.slice(i, i + size)));
  const top = Math.max(...arcRaw, 0.0001);
  const arc = arcRaw.map((v) => round(v / top, 2));

  const band: ModulationReport['band'] =
    rangeSemitones >= 8 ? 'lively' : rangeSemitones >= 3.5 ? 'steady' : 'flat';

  /* Expressiveness: 12 semitones is a full, engaged delivery and scores 100.
     Linear because it is a progress bar for a child, not a statistic. */
  const expressiveness = Math.max(0, Math.min(100, Math.round((rangeSemitones / 12) * 100)));

  /* ── What to say ─────────────────────────────────────────────────────────
     One good thing, then at most one to work on. */
  const notes: ModulationReport['notes'] = [];

  if (voiced.length < MIN_VOICED) {
    notes.push({
      kind: 'watch',
      text: 'Too quiet to hear the shape of your voice. Move closer to the microphone and try again.',
    });
    return {
      scored: true, rangeSemitones: 0, expressiveness: 0, band: 'steady',
      energyDrift, emphasisPerMin, arc, voicedPercent, notes,
    };
  }

  if (band === 'lively') {
    notes.push({ kind: 'good', text: `Your voice moved through ${rangeSemitones} semitones — that is a delivery people stay with.` });
  } else if (band === 'steady') {
    notes.push({ kind: 'good', text: `Your voice moved through ${rangeSemitones} semitones, which is a normal speaking range.` });
  }

  /* The fade first: it is the commonest fault and the one nobody can hear in
     themselves. Only a real drop counts — a small one is a breath. */
  if (energyDrift <= -25) {
    notes.push({
      kind: 'fix',
      text: `You started ${Math.abs(energyDrift)}% louder than you finished. Pick the last sentence and say it as though it were the first — the end is what a listener remembers.`,
    });
  } else if (band === 'flat') {
    notes.push({
      kind: 'fix',
      text: `Your voice stayed within ${rangeSemitones} semitones, which reads as flat to a listener. Choose one word in each sentence and lift it — just one, and the whole line changes.`,
    });
  } else if (energyDrift >= 15) {
    /* Checked BEFORE emphasis: nearly every speaker fades, so finishing
       stronger is the rarer and more encouraging thing to have noticed. It
       used to sit below the emphasis branch and was almost never reached. */
    notes.push({ kind: 'good', text: 'You finished stronger than you started, which almost nobody does.' });
  } else if (emphasisPerMin < 4) {
    notes.push({
      kind: 'watch',
      text: 'Nothing stood out. Even in a calm delivery, a listener needs a few moments that are louder than the rest to know what mattered.',
    });
  }

  return {
    scored: true,
    rangeSemitones,
    expressiveness,
    band,
    energyDrift,
    emphasisPerMin,
    arc,
    voicedPercent,
    notes,
  };
}
