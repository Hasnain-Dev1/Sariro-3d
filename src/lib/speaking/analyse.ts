/**
 * SARIRO — listening to a student speak, and saying something useful about it
 * ============================================================================
 * Public Speaking cannot be taught the way coding is. A coding lesson ends in
 * something a machine can check: the program runs or it does not. A speaking
 * lesson ends in a person having said words out loud, and the only thing that
 * improves them is being told, specifically, what happened.
 *
 * A mentor does that in a live class. What a student has never had is anything
 * to practise against between classes — so they practise wrong, or not at all.
 *
 * This module is the thing that listens. It takes a recording that has already
 * been turned into a transcript and an audio envelope by the browser, and
 * returns measurements plus the sentences a mentor would actually say.
 *
 * ── Why nothing here calls an API ───────────────────────────────────────────
 * Every measurement below is arithmetic over two arrays. The transcript comes
 * from the browser's own speech recognition and the envelope from the Web Audio
 * API, both free and both on the student's device. A student can practise forty
 * times in an evening and it costs the company nothing, which is the difference
 * between a feature people use and one they are rationed on.
 *
 * It also means this is pure and testable, which matters more than usual: a
 * number shown to a child about their own voice had better be right.
 *
 * ── What it deliberately does not judge ─────────────────────────────────────
 * Accent, vocabulary, and whether the argument was any good. The first two are
 * not deficiencies, and the third is what the mentor is for. Everything here is
 * mechanical — pace, pauses, phrasing, fillers, variation — because those are
 * the things that are genuinely measurable and genuinely fixable alone.
 */

/* ─────────────────────────── Input ─────────────────────────── */

export interface SpeechSample {
  /** What the browser heard. */
  transcript: string;
  durationMs: number;
  /**
   * Loudness per frame, 0..1, evenly spaced. Produced by the recorder from the
   * Web Audio analyser — see components/speaking/speaking-lab.tsx.
   */
  levels: number[];
  /** Milliseconds each level covers. 50 in practice. */
  frameMs: number;
  /** The passage the student was asked to read, when the drill set one. */
  reference?: string;
}

/* ─────────────────────────── Thresholds ─────────────────────────── */

/**
 * Below this share of the sample's own loudest frame, nobody is talking.
 *
 * Relative rather than absolute on purpose: a laptop microphone in a quiet room
 * and a phone held at arm's length in a kitchen produce completely different
 * absolute levels, and a fixed threshold would call one of them silent
 * throughout.
 */
const SILENCE_RATIO = 0.12;

/** Shorter than this is the gap between words, not a pause. */
export const PAUSE_MS = 300;

/** A pause a listener notices — the end of a thought. */
export const LONG_PAUSE_MS = 800;

/**
 * Comfortable public speaking. Slower than conversation, and deliberately so:
 * an audience needs the extra beat, and nerves push almost everybody upward.
 */
export const PACE_BAND = { min: 120, max: 165 } as const;

/** Words between pauses. Longer and the listener loses the thread; shorter is choppy. */
export const PHRASE_BAND = { min: 5, max: 18 } as const;

/**
 * Fillers a listener hears as filler, whatever the sentence.
 *
 * Kept separate from the hedged list below because the confidence differs, and
 * telling a child they said "like" seven times when four of them were the
 * preposition is how they stop trusting the feedback.
 */
const CERTAIN_FILLERS = ['um', 'uh', 'erm', 'er', 'ah', 'hmm', 'mmm', 'uhh', 'umm'];

/**
 * Words that are usually filler and sometimes not. Counted, reported, and
 * labelled as worth a look rather than as mistakes.
 */
const HEDGED_FILLERS = ['like', 'basically', 'actually', 'literally', 'you know', 'i mean', 'sort of', 'kind of'];

/* ─────────────────────────── Output ─────────────────────────── */

export type Verdict = 'good' | 'low' | 'high';

export interface SpeechReport {
  words: number;
  durationMs: number;

  pace: {
    /** Over the whole recording, pauses included. What an audience feels. */
    wpm: number;
    /** Over speaking time only. How fast the words themselves come out. */
    articulationWpm: number;
    verdict: Verdict;
  };

  fillers: {
    certain: number;
    hedged: number;
    perMinute: number;
    /** Which ones, most frequent first. */
    breakdown: { word: string; count: number; certain: boolean }[];
  };

  pauses: {
    count: number;
    longPauses: number;
    averageMs: number;
    longestMs: number;
    /** The longest stretch of talking with no pause in it. */
    longestUnbrokenMs: number;
  };

  phrasing: {
    phrases: number;
    averageWords: number;
    verdict: Verdict;
  };

  delivery: {
    /** Spread of loudness across the speaking frames, 0..1. */
    variation: number;
    monotone: boolean;
    tooQuiet: boolean;
  };

  /** Only when the drill set a passage to read. */
  punctuation?: {
    expected: number;
    honoured: number;
    verdict: Verdict;
  };

  /** 0-100. See scoreOf. */
  score: number;

  /** What a mentor would say. Ordered: what to fix first, first. */
  notes: Note[];
}

export interface Note {
  kind: 'good' | 'watch' | 'fix';
  /** One sentence, specific, in a mentor's voice. */
  text: string;
}

/* ─────────────────────────── Helpers ─────────────────────────── */

const round = (n: number, dp = 0) => {
  const f = 10 ** dp;
  return Math.round((n + Number.EPSILON) * f) / f;
};

/** Words as a listener would count them. Apostrophes stay inside a word. */
export function wordsOf(text: string): string[] {
  return (text ?? '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}'\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * The stretches of silence in the recording, in milliseconds.
 *
 * Read off the loudness envelope rather than from word timings, because
 * browser speech recognition does not give reliable per-word times and the
 * envelope does. A pause is a physical fact about the audio; where exactly the
 * words fall around it is not needed to measure one.
 */
export function silences(levels: number[], frameMs: number): { startMs: number; ms: number }[] {
  if (levels.length === 0 || frameMs <= 0) return [];

  const peak = Math.max(...levels);
  // A recording with nothing in it has no pauses either — it is all one silence,
  // and calling that "good pausing" would be absurd.
  if (peak <= 0) return [];
  const floor = peak * SILENCE_RATIO;

  const out: { startMs: number; ms: number }[] = [];
  let runStart: number | null = null;

  for (let i = 0; i <= levels.length; i++) {
    const quiet = i < levels.length && levels[i] < floor;
    if (quiet && runStart === null) runStart = i;
    if (!quiet && runStart !== null) {
      const ms = (i - runStart) * frameMs;
      if (ms >= PAUSE_MS) out.push({ startMs: runStart * frameMs, ms });
      runStart = null;
    }
  }
  return out;
}

/** Fillers found in a word list, most frequent first. */
function countFillers(words: string[]) {
  const joined = ` ${words.join(' ')} `;
  const counts = new Map<string, { count: number; certain: boolean }>();

  for (const f of CERTAIN_FILLERS) {
    const n = words.filter((w) => w === f).length;
    if (n > 0) counts.set(f, { count: n, certain: true });
  }
  for (const f of HEDGED_FILLERS) {
    // Multi-word hedges need the joined string; single words are exact matches
    // so "likely" never counts as "like".
    const n = f.includes(' ')
      ? (joined.match(new RegExp(` ${f} `, 'g')) ?? []).length
      : words.filter((w) => w === f).length;
    if (n > 0) counts.set(f, { count: n, certain: false });
  }

  const breakdown = [...counts.entries()]
    .map(([word, v]) => ({ word, count: v.count, certain: v.certain }))
    .sort((a, b) => b.count - a.count || a.word.localeCompare(b.word));

  return {
    certain: breakdown.filter((b) => b.certain).reduce((n, b) => n + b.count, 0),
    hedged: breakdown.filter((b) => !b.certain).reduce((n, b) => n + b.count, 0),
    breakdown,
  };
}

/**
 * How many places the passage asks for a pause.
 *
 * Sentence ends and commas — the marks a reader is meant to breathe at. Not
 * every comma gets a full stop's pause, but a reader who honours none of them
 * is running sentences together, which is the thing worth telling them.
 */
function expectedPauses(reference: string): number {
  const marks = reference.match(/[.,;:!?—]/g) ?? [];
  return marks.length;
}

/* ─────────────────────────── Scoring ─────────────────────────── */

/**
 * Five things, twenty points each.
 *
 * The bands are wide and the scoring is generous on purpose. This number is
 * shown to a child about their own voice, and a scale that says 41/100 for a
 * decent first attempt teaches them that they are bad at speaking, which is
 * the belief the whole course exists to undo. It should move when they improve
 * and it should not punish nerves.
 */
function scoreOf(r: Omit<SpeechReport, 'score' | 'notes'>): number {
  const band = (v: number, min: number, max: number) => {
    if (v >= min && v <= max) return 20;
    const distance = v < min ? (min - v) / min : (v - max) / max;
    return Math.max(0, round(20 * (1 - Math.min(1, distance))));
  };

  const pace = band(r.pace.wpm, PACE_BAND.min, PACE_BAND.max);
  const phrasing = band(r.phrasing.averageWords, PHRASE_BAND.min, PHRASE_BAND.max);

  // Two fillers a minute is unremarkable in ordinary speech; eight is a habit.
  const fillerRate = r.fillers.perMinute;
  const fillers = fillerRate <= 2 ? 20 : Math.max(0, round(20 - (fillerRate - 2) * 3));

  // Pausing at all is most of the battle. Roughly one every ten seconds is
  // comfortable; none at all is the thing nerves produce.
  const perMin = r.durationMs > 0 ? r.pauses.count / (r.durationMs / 60000) : 0;
  const pausing = perMin >= 4 ? 20 : round((perMin / 4) * 20);

  const delivery = r.delivery.tooQuiet ? 6 : r.delivery.monotone ? 12 : 20;

  return Math.max(0, Math.min(100, pace + phrasing + fillers + pausing + delivery));
}

/* ─────────────────────────── The notes ─────────────────────────── */

/**
 * What a mentor would say, in the order they would say it.
 *
 * Every note names a number the student can see in their own report. "Speak
 * more slowly" is advice anybody could give without listening; "you were at
 * 191 words a minute, which is about a third faster than an audience can
 * comfortably follow" is feedback.
 */
function notesFor(r: Omit<SpeechReport, 'score' | 'notes'>): Note[] {
  const notes: Note[] = [];
  const secs = (ms: number) => round(ms / 1000, 1);

  if (r.words < 15) {
    return [{
      kind: 'watch',
      text: 'That was too short to say much about. Try again with at least twenty or thirty seconds of speaking.',
    }];
  }

  /* ── What went wrong, most useful first ── */

  if (r.delivery.tooQuiet) {
    notes.push({
      kind: 'fix',
      text: 'The recording is very quiet throughout. Move closer to the microphone and try again — none of the rest can be measured properly until it can hear you.',
    });
  }

  if (r.pace.verdict === 'high') {
    notes.push({
      kind: 'fix',
      text: `You spoke at ${r.pace.wpm} words a minute. Comfortable is ${PACE_BAND.min}–${PACE_BAND.max}, so an audience is working harder than you are. Nerves do this — the fix is pauses, not slower words.`,
    });
  } else if (r.pace.verdict === 'low') {
    notes.push({
      kind: 'watch',
      text: `You spoke at ${r.pace.wpm} words a minute, which is on the slow side of ${PACE_BAND.min}–${PACE_BAND.max}. Deliberate is good; make sure it is deliberate and not hesitation.`,
    });
  }

  if (r.pauses.count === 0) {
    notes.push({
      kind: 'fix',
      text: 'You did not pause once. A pause is what lets a point land, and it is the single fastest way to sound more confident than you feel.',
    });
  } else if (r.pauses.longestUnbrokenMs > 30_000) {
    notes.push({
      kind: 'fix',
      text: `Your longest stretch without a pause was ${secs(r.pauses.longestUnbrokenMs)} seconds. Aim to break every ten to fifteen — your listener needs the gap more than you do.`,
    });
  }

  if (r.phrasing.verdict === 'high') {
    notes.push({
      kind: 'fix',
      text: `Your phrases averaged ${r.phrasing.averageWords} words. Past about ${PHRASE_BAND.max} the listener has lost the start of the sentence by the time you finish it.`,
    });
  } else if (r.phrasing.verdict === 'low') {
    notes.push({
      kind: 'watch',
      text: `Your phrases averaged ${r.phrasing.averageWords} words, which is choppy. Let a thought run to its end before you break.`,
    });
  }

  if (r.fillers.certain > 0) {
    const top = r.fillers.breakdown.filter((b) => b.certain).slice(0, 2)
      .map((b) => `"${b.word}" ×${b.count}`).join(', ');
    notes.push({
      kind: r.fillers.perMinute > 4 ? 'fix' : 'watch',
      text: `${r.fillers.certain} filler${r.fillers.certain === 1 ? '' : 's'} — ${top}. These are what a silent pause replaces. You are not filling a gap; you are announcing one.`,
    });
  }

  if (r.fillers.hedged >= 4) {
    const top = r.fillers.breakdown.filter((b) => !b.certain).slice(0, 2)
      .map((b) => `"${b.word}" ×${b.count}`).join(', ');
    notes.push({
      kind: 'watch',
      text: `Worth listening back for: ${top}. Some of those are doing real work in the sentence and some are padding — only you can tell which.`,
    });
  }

  if (r.delivery.monotone && !r.delivery.tooQuiet) {
    notes.push({
      kind: 'watch',
      text: 'Your volume barely changed from start to finish. Emphasis is what tells a listener which words matter; a flat line tells them nothing does.',
    });
  }

  if (r.punctuation && r.punctuation.verdict === 'low') {
    notes.push({
      kind: 'fix',
      text: `The passage had ${r.punctuation.expected} places to breathe and you took ${r.punctuation.honoured}. The punctuation is the writer telling you where the thought ends.`,
    });
  }

  /* ── What went right. Always at least one, and never invented. ── */

  const good: Note[] = [];
  if (r.pace.verdict === 'good') {
    good.push({ kind: 'good', text: `${r.pace.wpm} words a minute — right in the comfortable band. That is harder than it sounds under pressure.` });
  }
  if (r.fillers.certain === 0) {
    good.push({ kind: 'good', text: 'Not one "um" or "uh". Most adults cannot do that.' });
  }
  if (r.phrasing.verdict === 'good' && r.pauses.count > 0) {
    good.push({ kind: 'good', text: `You broke into ${r.phrasing.phrases} phrases averaging ${r.phrasing.averageWords} words. That is a listener being looked after.` });
  }
  if (!r.delivery.monotone && !r.delivery.tooQuiet) {
    good.push({ kind: 'good', text: 'Your volume moved as you spoke, which is what emphasis sounds like.' });
  }
  if (r.punctuation && r.punctuation.verdict === 'good') {
    good.push({ kind: 'good', text: `You paused at ${r.punctuation.honoured} of the ${r.punctuation.expected} marks in the passage. You are reading the punctuation, not just the words.` });
  }

  if (good.length === 0) {
    good.push({ kind: 'good', text: `You spoke for ${secs(r.durationMs)} seconds and got the words out. Everything below is a detail on top of that.` });
  }

  return [...good.slice(0, 2), ...notes];
}

/* ─────────────────────────── The analysis ─────────────────────────── */

export function analyseSpeech(sample: SpeechSample): SpeechReport {
  const words = wordsOf(sample.transcript);
  const durationMs = Math.max(0, sample.durationMs);
  const minutes = durationMs / 60_000;

  const gaps = silences(sample.levels, sample.frameMs);
  const silentMs = gaps.reduce((n, g) => n + g.ms, 0);
  const speakingMs = Math.max(0, durationMs - silentMs);

  const wpm = minutes > 0 ? round(words.length / minutes) : 0;
  const articulationWpm = speakingMs > 0 ? round(words.length / (speakingMs / 60_000)) : 0;

  /* Phrases are the stretches between pauses. One more phrase than there are
     pauses, unless the recording ends in one. */
  const phrases = Math.max(1, gaps.length + 1);
  const averageWords = round(words.length / phrases, 1);

  /* The longest unbroken talking run: the widest gap between consecutive
     silences, including the ends of the recording. */
  let longestUnbrokenMs = 0;
  let cursor = 0;
  for (const g of gaps) {
    longestUnbrokenMs = Math.max(longestUnbrokenMs, g.startMs - cursor);
    cursor = g.startMs + g.ms;
  }
  longestUnbrokenMs = Math.max(longestUnbrokenMs, durationMs - cursor);

  /* Loudness variation over the frames where somebody was actually talking.
     Including the silences would make every recording look dynamic. */
  const peak = sample.levels.length ? Math.max(...sample.levels) : 0;
  const loud = sample.levels.filter((l) => l >= peak * SILENCE_RATIO);
  const mean = loud.length ? loud.reduce((a, b) => a + b, 0) / loud.length : 0;
  const variance = loud.length
    ? loud.reduce((a, b) => a + (b - mean) ** 2, 0) / loud.length
    : 0;
  // Coefficient of variation: spread relative to how loud they were overall, so
  // a quiet speaker with real dynamics is not called monotone.
  const variation = mean > 0 ? round(Math.sqrt(variance) / mean, 3) : 0;

  const fillers = countFillers(words);
  const fillerTotal = fillers.certain + fillers.hedged;

  const pauseMsList = gaps.map((g) => g.ms);

  const base = {
    words: words.length,
    durationMs,
    pace: {
      wpm,
      articulationWpm,
      verdict: (wpm > PACE_BAND.max ? 'high' : wpm < PACE_BAND.min ? 'low' : 'good') as Verdict,
    },
    fillers: {
      certain: fillers.certain,
      hedged: fillers.hedged,
      perMinute: minutes > 0 ? round(fillerTotal / minutes, 1) : 0,
      breakdown: fillers.breakdown,
    },
    pauses: {
      count: gaps.length,
      longPauses: gaps.filter((g) => g.ms >= LONG_PAUSE_MS).length,
      averageMs: pauseMsList.length ? round(pauseMsList.reduce((a, b) => a + b, 0) / pauseMsList.length) : 0,
      longestMs: pauseMsList.length ? Math.max(...pauseMsList) : 0,
      longestUnbrokenMs: round(longestUnbrokenMs),
    },
    phrasing: {
      phrases,
      averageWords,
      verdict: (averageWords > PHRASE_BAND.max ? 'high' : averageWords < PHRASE_BAND.min ? 'low' : 'good') as Verdict,
    },
    delivery: {
      variation,
      /*
       * Below this the loudness is essentially a straight line.
       *
       * Set low deliberately. Expressive speech sits well above it and a genuinely
       * flat read sits below, but the two overlap, and the two mistakes are not
       * equal: missing a monotone costs a note the mentor will give anyway in
       * class, while telling a child who WAS expressive that their voice is flat
       * is the kind of feedback people remember for years.
       *
       * Wants calibrating against real recordings once there are some — this is
       * reasoned from how RMS behaves, not measured from students.
       */
      monotone: loud.length > 0 && variation < 0.12,
      // A tenth of full scale at the loudest point is somebody too far from the
      // microphone to be measured, not somebody speaking softly.
      tooQuiet: peak > 0 && peak < 0.1,
    },
    ...(sample.reference
      ? (() => {
          const expected = expectedPauses(sample.reference);
          const honoured = Math.min(expected, gaps.length);
          const ratio = expected > 0 ? honoured / expected : 1;
          return {
            punctuation: {
              expected,
              honoured,
              verdict: (ratio >= 0.6 ? 'good' : 'low') as Verdict,
            },
          };
        })()
      : {}),
  };

  return { ...base, score: scoreOf(base), notes: notesFor(base) };
}
