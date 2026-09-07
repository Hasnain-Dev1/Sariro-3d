/**
 * SARIRO — did they actually hear it?
 * ============================================================================
 * A listening drill plays a passage and asks the learner to give it back —
 * spoken into the microphone, or typed. What comes back is compared to what
 * went in, and the comparison IS the mark.
 *
 * ── Why this runs on the device and costs nothing ───────────────────────────
 * Same bet as the speaking analyser: an API call per attempt turns practice
 * into a budget line, and a child who wants to try a passage six times should
 * be able to. Everything here is string arithmetic. The only thing the browser
 * supplies is the transcript, from the speech recognition already in use.
 *
 * ── What "correct" means, and what it deliberately does not ─────────────────
 * Not an exact match. A child who hears "the committee reached a decision" and
 * says "the committee made a decision" has understood it perfectly, and marking
 * that wrong teaches them to parrot rather than to listen. So:
 *
 *   · common words are worth almost nothing — "the", "a", "of" carry no meaning
 *     and a transcript that drops them has lost nothing
 *   · CONTENT words carry the mark, because they carry the passage
 *   · order is scored separately from vocabulary, because "the dog bit the man"
 *     and "the man bit the dog" share every word and differ entirely
 *
 * ── Speech recognition mishears, and that is not the learner's fault ────────
 * "their" for "there", "to" for "two". A homophone is scored as heard, because
 * the ear got it right and only the transcription did not. Marking a child down
 * for their microphone is how they stop using it.
 */

import type { Note, Verdict } from './analyse';

export interface ListeningAttempt {
  /** The passage that was played or read out. */
  source: string;
  /** What the learner gave back — spoken transcript or typed. */
  response: string;
  /** Where it came from, because a typed answer is held to a higher standard. */
  mode: 'spoken' | 'typed';
  /** Seconds the passage ran for, when known. Enables the pace comparison. */
  sourceDurationMs?: number;
}

export interface ListeningReport {
  sourceWords: number;
  responseWords: number;

  /** Content words caught, ignoring the small words that carry no meaning. */
  recall: {
    caught: number;
    total: number;
    percent: number;
    /** What they missed, in the order it was said. The teachable part. */
    missed: string[];
    verdict: Verdict;
  };

  /** Words that were not in the passage at all. */
  invented: {
    count: number;
    words: string[];
  };

  /** Did the ideas come back in the order they were said? */
  sequence: {
    percent: number;
    verdict: Verdict;
  };

  /** Heard right, transcribed wrong. Counted, never penalised. */
  homophones: { heard: string; wrote: string }[];

  /** 0-100. */
  score: number;
  notes: Note[];
}

/* ── The words that carry no meaning ──────────────────────────────────────
   Dropping "the" is not a listening failure. This list is short on purpose:
   every word on it is one whose absence changes nothing about whether the
   passage was understood. */
const FUNCTION_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'so', 'of', 'to', 'in', 'on', 'at',
  'for', 'with', 'as', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
  'am', 'it', 'its', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she',
  'we', 'they', 'him', 'her', 'them', 'his', 'their', 'our', 'my', 'your',
  'do', 'does', 'did', 'has', 'have', 'had', 'will', 'would', 'can', 'could',
  'not', 'no', 'if', 'then', 'than', 'there', 'here', 'up', 'out', 'about',
]);

/* Pairs a microphone confuses. Scored as heard: the ear was right and only the
   transcription was not, and marking a child down for their hardware is how
   they stop using it. */
const HOMOPHONES: [string, string][] = [
  ['there', 'their'], ['there', "they're"], ['their', "they're"],
  ['to', 'too'], ['to', 'two'], ['too', 'two'],
  ['your', "you're"], ['its', "it's"], ['whose', "who's"],
  ['hear', 'here'], ['knew', 'new'], ['know', 'no'], ['one', 'won'],
  ['right', 'write'], ['bye', 'buy'], ['by', 'buy'], ['sea', 'see'],
  ['weather', 'whether'], ['piece', 'peace'], ['principal', 'principle'],
  ['affect', 'effect'], ['past', 'passed'], ['allowed', 'aloud'],
  ['brake', 'break'], ['flour', 'flower'], ['great', 'grate'],
];

const homophoneKey = (w: string): string | null => {
  for (const pair of HOMOPHONES) {
    if (pair[0] === w || pair[1] === w) return pair[0];
  }
  return null;
};

/** Same word to a listener. Case, punctuation and homophones collapse. */
function normalise(word: string): string {
  const w = word.toLowerCase().replace(/[^a-z0-9']/g, '');
  return homophoneKey(w) ?? w;
}

/** Words as a listener would count them. Apostrophes stay inside a word. */
export function tokens(text: string): string[] {
  return (text ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9'\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

const round = (n: number, dp = 0) => {
  const f = 10 ** dp;
  return Math.round((n + Number.EPSILON) * f) / f;
};

/**
 * How much of the ORDER survived, as the longest run of content words that
 * came back in the right sequence, over how many were caught.
 *
 * Scored separately from recall because "the dog bit the man" and "the man bit
 * the dog" share every single word and mean opposite things. A learner who has
 * every word but no order has not understood the passage.
 */
function sequencePercent(sourceContent: string[], responseContent: string[]): number {
  if (sourceContent.length === 0 || responseContent.length === 0) return 0;

  // Longest common subsequence — the standard measure of "in the same order".
  const a = sourceContent;
  const b = responseContent;
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  const inOrder = dp[a.length][b.length];
  const caught = a.filter((w) => b.includes(w)).length;
  if (caught === 0) return 0;
  return round((inOrder / caught) * 100);
}

const verdictFor = (percent: number, floor: number): Verdict =>
  percent >= floor ? 'good' : 'low';

export function analyseListening(attempt: ListeningAttempt): ListeningReport {
  const srcRaw = tokens(attempt.source);
  const resRaw = tokens(attempt.response);

  /* Each word is carried as a pair: the form used for COMPARING and the form
     the learner actually saw. Reporting the comparison key back is a bug that
     reads as a broken product — the passage says "new", homophone folding
     stores it under "knew", and a child is told they missed a word that was
     never in the text. */
  const pair = (w: string) => ({ key: normalise(w), shown: w });
  const srcPairs = srcRaw.map(pair).filter((p) => p.key);
  const resPairs = resRaw.map(pair).filter((p) => p.key);

  const srcContent = srcPairs.filter((p) => !FUNCTION_WORDS.has(p.key));
  const resContent = resPairs.filter((p) => !FUNCTION_WORDS.has(p.key));

  /* Counted as a multiset: a passage that says "small" twice needs it back
     twice, and a learner who says it once has half of it. */
  const pool = new Map<string, { n: number; shown: string }>();
  for (const p of resContent) {
    const cur = pool.get(p.key);
    if (cur) cur.n++;
    else pool.set(p.key, { n: 1, shown: p.shown });
  }

  const missed: string[] = [];
  let caught = 0;
  for (const p of srcContent) {
    const cur = pool.get(p.key);
    if (cur && cur.n > 0) { cur.n--; caught++; }
    else missed.push(p.shown);
  }

  const invented = [...pool.values()].filter((v) => v.n > 0).flatMap((v) => Array(v.n).fill(v.shown));

  const recallPercent = srcContent.length ? round((caught / srcContent.length) * 100) : 0;
  const seqPercent = sequencePercent(srcContent.map((p) => p.key), resContent.map((p) => p.key));

  /* Which homophones actually fired, so the learner can be told their ear was
     right — the single most demoralising "wrong" in a listening drill. */
  const homophones: { heard: string; wrote: string }[] = [];
  const srcSpelt = new Set(srcRaw.map((w) => w.replace(/[^a-z0-9']/g, '')));
  for (const w of resRaw) {
    const plain = w.replace(/[^a-z0-9']/g, '');
    if (srcSpelt.has(plain)) continue;
    const key = homophoneKey(plain);
    if (!key) continue;
    const partner = [...srcSpelt].find((s) => homophoneKey(s) === key);
    if (partner) homophones.push({ heard: partner, wrote: plain });
  }

  /* Typed answers are held slightly higher: there is no microphone to blame
     and the learner could re-read their own sentence before submitting. */
  const floor = attempt.mode === 'typed' ? 75 : 65;

  const score = Math.max(0, Math.min(100, Math.round(
    recallPercent * 0.7 + seqPercent * 0.3 - Math.min(invented.length, 5) * 2
  )));

  const notes: Note[] = [];
  if (srcContent.length === 0) {
    notes.push({ kind: 'watch', text: 'That passage had nothing to catch — it is all common words.' });
  } else if (recallPercent >= 90) {
    notes.push({ kind: 'good', text: `You caught ${caught} of the ${srcContent.length} words that carry the meaning. That is close to everything.` });
  } else if (recallPercent >= floor) {
    notes.push({ kind: 'good', text: `You caught ${recallPercent}% of the key words — solid.` });
  } else {
    notes.push({
      kind: 'fix',
      text: `You caught ${recallPercent}% of the key words. Play it once more and listen only for the nouns — they carry most of it.`,
    });
  }

  if (missed.length > 0 && missed.length <= 6) {
    notes.push({ kind: 'watch', text: `Missed: ${missed.join(', ')}.` });
  } else if (missed.length > 6) {
    notes.push({ kind: 'watch', text: `Missed ${missed.length} key words, starting with ${missed.slice(0, 4).join(', ')}.` });
  }

  if (seqPercent < 70 && caught > 3) {
    notes.push({
      kind: 'fix',
      text: 'You had the words but not the order. Try saying it back one sentence at a time rather than all at once.',
    });
  }

  if (invented.length >= 3) {
    notes.push({
      kind: 'watch',
      text: `${invented.length} words came back that were not in the passage. Guessing fills gaps but it hides what you missed.`,
    });
  }

  if (homophones.length > 0) {
    notes.push({
      kind: 'good',
      text: `${homophones.map((h) => `"${h.wrote}" for "${h.heard}"`).join(', ')} — your ear was right, that is just how it came out.`,
    });
  }

  return {
    sourceWords: srcRaw.length,
    responseWords: resRaw.length,
    recall: {
      caught,
      total: srcContent.length,
      percent: recallPercent,
      missed,
      verdict: verdictFor(recallPercent, floor),
    },
    invented: { count: invented.length, words: [...new Set(invented)] },
    sequence: { percent: seqPercent, verdict: verdictFor(seqPercent, 70) },
    homophones,
    score,
    notes,
  };
}
