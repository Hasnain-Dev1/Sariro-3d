/**
 * SARIRO — reading a child's writing back to them
 * ============================================================================
 * The third of the three. Speaking is measured from the microphone, listening
 * from what comes back, and writing from the text itself — which is the only
 * one of them that needs nothing but the words.
 *
 * ── Why there is no model behind this ───────────────────────────────────────
 * Every measure here is countable: sentence lengths, repeated openers, hedges,
 * passive constructions, paragraph shape. A model would grade the ideas; this
 * grades the CRAFT, and craft is what can be taught in a lesson and improved by
 * Friday. It also costs nothing, so a child can rewrite a paragraph nine times,
 * which is the only way anybody has ever learned to write.
 *
 * It is deliberately not a score out of ten for "quality". A number on somebody's
 * ideas is a number they will argue with and learn nothing from.
 *
 * ── The one thing it refuses to do ──────────────────────────────────────────
 * It never says a long sentence is wrong. Long sentences are how complex ideas
 * get expressed, and a rule that punishes them produces writing made of stubs.
 * What it looks for is VARIETY — a page where every sentence is the same length
 * is a page that drones, whatever that length is.
 */

import type { Note, Verdict } from './analyse';

export interface WritingReport {
  words: number;
  sentences: number;
  paragraphs: number;

  sentenceLength: {
    average: number;
    shortest: number;
    longest: number;
    /** Spread. Low means every sentence is the same shape. */
    variety: number;
    verdict: Verdict;
  };

  /** Sentences that start with the same word, one after another. */
  repetition: {
    repeatedOpeners: { word: string; count: number }[];
    /** Content words used far more than the rest. */
    overused: { word: string; count: number }[];
  };

  hedging: {
    count: number;
    words: string[];
  };

  passive: {
    count: number;
    /** The sentences it found, so the writer can see them. */
    examples: string[];
  };

  /** Rough US grade level, from words per sentence and syllables per word. */
  readability: {
    grade: number;
    /** What that grade means for the reader they are writing for. */
    summary: string;
  };

  score: number;
  notes: Note[];
}

const round = (n: number, dp = 0) => {
  const f = 10 ** dp;
  return Math.round((n + Number.EPSILON) * f) / f;
};

export function words(text: string): string[] {
  return (text ?? '').toLowerCase().replace(/[^a-z0-9'\s]/g, ' ').split(/\s+/).filter(Boolean);
}

/**
 * Sentences, split on terminal punctuation.
 *
 * Abbreviations are protected first, because "Dr. Rao said so." is one sentence
 * and splitting it into two quietly halves every average on the page.
 */
export function sentences(text: string): string[] {
  const guarded = (text ?? '')
    .replace(/\b(Mr|Mrs|Ms|Dr|Prof|Sr|Jr|vs|etc|e\.g|i\.e)\./gi, '$1<DOT>')
    .replace(/\b([A-Z])\./g, '$1<DOT>');
  return guarded
    .split(/[.!?]+[\s"')\]]*/)
    .map((s) => s.replace(/<DOT>/g, '.').trim())
    .filter((s) => s.length > 0);
}

/** Vowel groups, minus a silent trailing e. Rough, and rough is enough here. */
export function syllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length <= 3) return 1;
  const trimmed = w.replace(/(?:es|ed|e)$/, '');
  const groups = trimmed.match(/[aeiouy]+/g);
  return Math.max(1, groups ? groups.length : 1);
}

/* Words that take the weight out of a sentence. Not banned — a hedge is
   sometimes exactly right — but four in a paragraph is a writer apologising
   for their own argument. */
const HEDGES = [
  'very', 'really', 'quite', 'rather', 'somewhat', 'fairly', 'basically',
  'actually', 'literally', 'just', 'maybe', 'perhaps', 'probably', 'sort',
  'kind', 'like', 'stuff', 'things', 'a lot', 'lots',
];

/* Any form of "to be" followed by a past participle. Crude, and it finds the
   ones that matter: "the ball was thrown", "mistakes were made". */
const PASSIVE = /\b(is|are|was|were|been|being|be)\s+(\w+(?:ed|en|wn|ne))\b/i;

const COMMON = new Set([
  'the', 'and', 'a', 'an', 'to', 'of', 'in', 'is', 'it', 'that', 'this', 'for',
  'on', 'with', 'as', 'was', 'were', 'are', 'be', 'been', 'at', 'by', 'from',
  'or', 'but', 'not', 'they', 'their', 'you', 'your', 'we', 'our', 'i', 'my',
  'he', 'she', 'his', 'her', 'them', 'has', 'have', 'had', 'will', 'would',
  'can', 'could', 'so', 'if', 'then', 'than', 'there', 'when', 'what', 'which',
]);

export function analyseWriting(text: string): WritingReport {
  const all = words(text);
  const sents = sentences(text);
  const paras = (text ?? '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  const lengths = sents.map((s) => words(s).length).filter((n) => n > 0);
  const avg = lengths.length ? round(lengths.reduce((a, b) => a + b, 0) / lengths.length, 1) : 0;
  const shortest = lengths.length ? Math.min(...lengths) : 0;
  const longest = lengths.length ? Math.max(...lengths) : 0;

  /* Standard deviation of sentence length. This — not the average — is what
     separates prose that moves from prose that drones. */
  const variety = lengths.length > 1
    ? round(Math.sqrt(lengths.reduce((s, n) => s + (n - avg) ** 2, 0) / lengths.length), 1)
    : 0;

  // Openers repeated back to back.
  const openers = sents.map((s) => words(s)[0]).filter(Boolean);
  const openerRuns = new Map<string, number>();
  for (let i = 1; i < openers.length; i++) {
    if (openers[i] === openers[i - 1]) {
      openerRuns.set(openers[i], (openerRuns.get(openers[i]) ?? 1) + 1);
    }
  }
  const repeatedOpeners = [...openerRuns.entries()]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count);

  // Content words leaning on one another.
  const freq = new Map<string, number>();
  for (const w of all) if (!COMMON.has(w) && w.length > 3) freq.set(w, (freq.get(w) ?? 0) + 1);
  const overused = [...freq.entries()]
    .filter(([, n]) => n >= Math.max(3, Math.ceil(all.length / 60)))
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const hedgeHits = all.filter((w) => HEDGES.includes(w));
  const passiveSentences = sents.filter((s) => PASSIVE.test(s));

  /* Flesch-Kincaid grade level. A number for "who could read this
     comfortably", not for how good it is. */
  const syl = all.reduce((s, w) => s + syllables(w), 0);
  const grade = all.length && sents.length
    ? round(0.39 * (all.length / sents.length) + 11.8 * (syl / all.length) - 15.59, 1)
    : 0;

  const summary =
    grade <= 0 ? 'not enough writing to tell'
    : grade < 6 ? 'a younger reader could follow this easily'
    : grade < 9 ? 'clear for most readers'
    : grade < 13 ? 'demanding — fine for an older reader'
    : 'heavy going; long sentences and long words together';

  /* Monotony is checked BEFORE length, and the order matters: prose whose
     sentences are all the same length is the more actionable fault, and a page
     of uniformly long sentences has both problems at once. The overlong note
     still fires separately, so nothing is hidden — only the single-word
     verdict has to choose, and it chooses the one worth fixing first. */
  const lengthVerdict: Verdict =
    lengths.length < 2 ? 'good'
    : variety < 3 ? 'low'
    : avg > 28 ? 'high'
    : 'good';

  let score = 100;
  if (lengths.length >= 3 && variety < 3) score -= 18;
  if (avg > 30) score -= 10;
  score -= Math.min(15, hedgeHits.length * 2);
  score -= Math.min(12, passiveSentences.length * 3);
  score -= Math.min(10, repeatedOpeners.length * 4);
  score -= Math.min(10, overused.length * 3);
  score = Math.max(0, Math.min(100, Math.round(score)));

  const notes: Note[] = [];

  if (all.length < 25) {
    notes.push({ kind: 'watch', text: 'Too short to say much about yet — write a paragraph and run it again.' });
  }

  if (lengths.length >= 3) {
    if (variety < 3) {
      notes.push({
        kind: 'fix',
        text: `Every sentence is about ${Math.round(avg)} words long. Cut one in half and let another run — that change of pace is what stops a page droning.`,
      });
    } else if (variety >= 6) {
      notes.push({ kind: 'good', text: `Your sentences run from ${shortest} to ${longest} words. That variety is doing a lot of work.` });
    }
  }

  if (avg > 30) {
    notes.push({ kind: 'fix', text: `Averaging ${avg} words a sentence. Find the longest one and put a full stop in the middle of it.` });
  }

  if (hedgeHits.length >= 3) {
    const top = [...new Set(hedgeHits)].slice(0, 4).join(', ');
    notes.push({
      kind: 'fix',
      text: `${hedgeHits.length} soft words (${top}). Delete them and read it again — it usually gets stronger and never gets weaker.`,
    });
  }

  if (passiveSentences.length >= 2) {
    notes.push({
      kind: 'watch',
      text: `${passiveSentences.length} sentences hide who did the thing. "Mistakes were made" — by whom?`,
    });
  }

  if (repeatedOpeners.length > 0) {
    const r = repeatedOpeners[0];
    notes.push({ kind: 'watch', text: `${r.count} sentences in a row start with "${r.word}".` });
  }

  if (overused.length > 0) {
    notes.push({
      kind: 'watch',
      text: `"${overused[0].word}" appears ${overused[0].count} times. Is there a better word for one of them?`,
    });
  }

  if (paras.length === 1 && all.length > 140) {
    notes.push({ kind: 'fix', text: 'One long block. A paragraph break every few sentences gives the reader somewhere to breathe.' });
  }

  if (notes.length === 0 || (notes.every((n) => n.kind === 'good') && all.length >= 25)) {
    notes.unshift({ kind: 'good', text: 'Nothing to fix in the craft of this. Read it aloud and see if it still sounds like you.' });
  }

  return {
    words: all.length,
    sentences: sents.length,
    paragraphs: paras.length,
    sentenceLength: { average: avg, shortest, longest, variety, verdict: lengthVerdict },
    repetition: { repeatedOpeners, overused },
    hedging: { count: hedgeHits.length, words: [...new Set(hedgeHits)] },
    passive: { count: passiveSentences.length, examples: passiveSentences.slice(0, 3) },
    readability: { grade, summary },
    score,
    notes,
  };
}
