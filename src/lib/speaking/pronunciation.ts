/**
 * SARIRO — what a child's mouth actually did, from a transcript
 * ============================================================================
 * They read a passage we wrote. The browser tells us what it heard. Where the
 * two disagree, something happened — and the whole difficulty of this file is
 * that "something" is one of three things:
 *
 *   1. the child mispronounced a word          ← the only one worth reporting
 *   2. the recogniser misheard a correct word
 *   3. the child skipped, repeated or stumbled
 *
 * A naive diff calls all three a mistake, tells a ten-year-old they said
 * eleven words wrong, and is never believed again. So this is built the other
 * way round: it starts from silence and only speaks when the evidence is
 * strong enough to be worth a child's trust.
 *
 * ── The idea that makes it work: report SOUNDS, not words ───────────────────
 * One word coming back wrong is noise. The SAME SUBSTITUTION appearing across
 * DIFFERENT words is a pattern, and a pattern is a fact about a mouth rather
 * than about a microphone:
 *
 *     think → sink,  three → sree,  thought → sought
 *     "th at the start of a word is coming out as s — 3 times out of 4"
 *
 * A recogniser's errors are scattered; a speaker's are systematic. Requiring
 * repetition is what separates them, and it is also what makes the feedback
 * teachable: a child cannot practise "you got 11 words wrong", but they can
 * practise one sound.
 *
 * ── Why the confusion table is Indian English ───────────────────────────────
 * Sariro teaches in India, and the substitutions that actually happen here are
 * known: /θ/→/t̪/, /v/↔/w/, /z/→/dʒ/. Listing them does two jobs — it finds
 * real patterns faster, and it refuses to invent one out of a random mishearing
 * that matches nothing anybody's mouth does.
 *
 * This is not a phoneme recogniser. It cannot hear a vowel that a dictation
 * engine already normalised away, and it will never catch a word the engine
 * "helpfully" corrected. It reports what it can defend and stays quiet about
 * the rest, which for a child's first feedback is the right trade.
 */

export interface PronunciationInput {
  /** The passage they were asked to read. Required — free speech has no target. */
  reference: string;
  /** What the browser heard. */
  transcript: string;
}

export interface SoundPattern {
  /** The sound as written, e.g. "th". */
  sound: string;
  /** What it came out as, e.g. "s". */
  heardAs: string;
  /** Where in the word: start, middle or end. */
  position: 'start' | 'middle' | 'end';
  /** How many times this happened. */
  count: number;
  /** Of how many chances. "3 times out of 4" is more honest than "3 times". */
  opportunities: number;
  /** Real examples, for the report. */
  examples: { expected: string; heard: string }[];
  /** The sentence a child reads. */
  note: string;
}

export interface WordCheck {
  expected: string;
  heard: string | null;
  ok: boolean;
}

export interface PronunciationReport {
  /** Whether there was enough to judge at all. */
  scored: boolean;
  /** Words matched, out of words attempted. 0-100. */
  accuracy: number;
  /** How much of the passage they got through. Low means they stopped. */
  coverage: number;
  wordsRead: number;
  wordsExpected: number;
  /** Only patterns with real repetition. Most reports have none. */
  patterns: SoundPattern[];
  /** Every word, for the side-by-side. */
  words: WordCheck[];
  /** What to say, in order. Never more than one negative. */
  notes: { kind: 'good' | 'watch' | 'fix'; text: string }[];
}

/* ══════════════════════════════════════════════════════════════════════════
   The confusions worth looking for
   ══════════════════════════════════════════════════════════════════════════
   Written as spellings rather than phonemes because the only thing we have is
   text. Each entry says: this written sound, in this position, sometimes comes
   out as one of these.

   Deliberately short. Every extra row is another way to accuse a child of
   something the microphone did.
   ══════════════════════════════════════════════════════════════════════════ */
interface Confusion {
  sound: string;
  becomes: string[];
  position: 'start' | 'middle' | 'end' | 'any';
  /** How it is explained to a child. */
  advice: string;
}

const CONFUSIONS: Confusion[] = [
  {
    sound: 'th', becomes: ['t', 'd', 's', 'f', 'z'], position: 'any',
    advice: 'Put the tip of your tongue lightly between your teeth and blow. It feels wrong at first — that is how you know it is the right sound.',
  },
  {
    sound: 'v', becomes: ['w', 'b'], position: 'any',
    advice: 'Top teeth on your bottom lip for “v”. For “w” the lips do not touch your teeth at all — say “very” and “wary” one after the other and feel the difference.',
  },
  {
    sound: 'w', becomes: ['v'], position: 'any',
    advice: 'Round your lips and keep your teeth away from them. If your teeth touch your lip, it has turned into a “v”.',
  },
  {
    sound: 'z', becomes: ['j', 's'], position: 'any',
    advice: 'A “z” buzzes — hold your throat and you should feel it. “s” is the same mouth shape with the buzz switched off.',
  },
  {
    sound: 'sh', becomes: ['s', 'ch'], position: 'any',
    advice: 'For “sh” the tongue sits further back and the sound is longer. Try holding it: shhhhh.',
  },
  {
    sound: 'ch', becomes: ['sh', 'c'], position: 'any',
    advice: '“ch” starts with a small stop, like a tiny “t”, before the “sh”. “ch” then “sh”, back to back, until they feel different.',
  },
  {
    sound: 'p', becomes: ['f', 'b'], position: 'start',
    advice: 'Press both lips together and let the air pop. Hold a finger in front of your mouth — you should feel the puff.',
  },
  {
    sound: 'ed', becomes: ['', 'd', 't'], position: 'end',
    advice: 'The ending is doing work: “walk” is now, “walked” is finished. Say the last sound even when it feels small.',
  },
  {
    sound: 's', becomes: [''], position: 'end',
    advice: 'The “s” at the end is what makes it more than one. Dropping it changes the meaning, so let it be heard.',
  },
];

/* ══════════════════════════════════════════════════════════════════════════ */

const clean = (w: string) =>
  w.toLowerCase().replace(/[^a-z']/g, '');

const words = (s: string): string[] =>
  (s || '').split(/\s+/).map(clean).filter(Boolean);

/** How many times this pattern could have shown up at all. */
function opportunitiesFor(c: Confusion, reference: string[]): number {
  let n = 0;
  for (const w of reference) {
    if (positionOf(w, c.sound) === c.position || (c.position === 'any' && w.includes(c.sound))) n++;
  }
  return n;
}

function positionOf(word: string, sound: string): 'start' | 'middle' | 'end' | null {
  if (!word.includes(sound)) return null;
  if (word.startsWith(sound)) return 'start';
  if (word.endsWith(sound)) return 'end';
  return 'middle';
}

/**
 * Line the two word lists up.
 *
 * Longest common subsequence, so a skipped or an added word shifts everything
 * after it without turning the whole passage into mismatches. A naive
 * index-by-index compare marks every word after one stumble as wrong, which is
 * exactly the report a child stops believing.
 */
function align(reference: string[], heard: string[]): WordCheck[] {
  const n = reference.length;
  const m = heard.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = reference[i] === heard[j]
        ? dp[i + 1][j + 1] + 1
        : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const out: WordCheck[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (reference[i] === heard[j]) {
      out.push({ expected: reference[i], heard: heard[j], ok: true });
      i++; j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      /* A reference word with nothing matching it. The next heard word is the
         best guess at what it came out as — which is what a substitution looks
         like from here. */
      out.push({ expected: reference[i], heard: heard[j] ?? null, ok: false });
      i++;
      // Only consume the heard word if it is not itself about to match later.
      if (j + 1 <= m && dp[i][j + 1] >= dp[i][j]) j++;
    } else {
      // An extra word they said. Not a pronunciation fault; skipped silently.
      j++;
    }
  }
  for (; i < n; i++) out.push({ expected: reference[i], heard: null, ok: false });

  return out;
}

/** Does `heard` look like `expected` with this one substitution applied? */
function explains(c: Confusion, expected: string, heard: string): boolean {
  const pos = positionOf(expected, c.sound);
  if (!pos) return false;
  if (c.position !== 'any' && pos !== c.position) return false;

  for (const to of c.becomes) {
    if (expected.replace(c.sound, to) === heard) return true;
  }
  return false;
}

/** Below this, the words are too different to be a pronunciation slip. */
const CLOSE_ENOUGH = 0.5;

/** Rough similarity, so a wild mishearing is not blamed on the child. */
function similar(a: string, b: string): number {
  if (!a || !b) return 0;
  const short = a.length < b.length ? a : b;
  const long = a.length < b.length ? b : a;
  let shared = 0;
  const pool = long.split('');
  for (const ch of short) {
    const k = pool.indexOf(ch);
    if (k >= 0) { shared++; pool.splice(k, 1); }
  }
  return shared / long.length;
}

/** Two occurrences of the same substitution before it is called a pattern. */
export const PATTERN_FLOOR = 2;

/** Fewer words than this and there is nothing to judge. */
export const MIN_WORDS = 8;

export function analysePronunciation(input: PronunciationInput): PronunciationReport {
  const reference = words(input.reference);
  const heard = words(input.transcript);

  const empty: PronunciationReport = {
    scored: false, accuracy: 0, coverage: 0,
    wordsRead: heard.length, wordsExpected: reference.length,
    patterns: [], words: [],
    notes: [{ kind: 'watch', text: 'Read the passage aloud and we will show you, word by word, how it came out.' }],
  };

  if (reference.length < MIN_WORDS) return empty;
  if (heard.length === 0) return empty;

  const checks = align(reference, heard);
  const attempted = checks.filter((c) => c.heard !== null);
  const matched = checks.filter((c) => c.ok).length;

  const accuracy = attempted.length === 0 ? 0 : Math.round((matched / attempted.length) * 100);
  const coverage = Math.round((attempted.length / reference.length) * 100);

  /* ── Patterns ────────────────────────────────────────────────────────────
     Only substitutions a real mouth makes, and only when they repeat. */
  const found = new Map<string, SoundPattern>();

  for (const c of checks) {
    if (c.ok || !c.heard) continue;
    // A wild mishearing is the microphone's problem, not the child's.
    if (similar(c.expected, c.heard) < CLOSE_ENOUGH) continue;

    for (const rule of CONFUSIONS) {
      if (!explains(rule, c.expected, c.heard)) continue;

      const pos = positionOf(c.expected, rule.sound)!;
      const to = rule.becomes.find((t) => c.expected.replace(rule.sound, t) === c.heard) ?? '';
      const key = `${rule.sound}>${to}@${pos}`;

      const existing = found.get(key);
      if (existing) {
        existing.count++;
        if (existing.examples.length < 3) existing.examples.push({ expected: c.expected, heard: c.heard });
      } else {
        found.set(key, {
          sound: rule.sound,
          heardAs: to === '' ? '(dropped)' : to,
          position: pos,
          count: 1,
          opportunities: Math.max(1, opportunitiesFor(rule, reference)),
          examples: [{ expected: c.expected, heard: c.heard }],
          note: rule.advice,
        });
      }
      break;
    }
  }

  const patterns = [...found.values()]
    .filter((p) => p.count >= PATTERN_FLOOR)
    .sort((a, b) => b.count - a.count);

  /* ── What to say ─────────────────────────────────────────────────────────
     Praise first, then AT MOST ONE thing to work on. A child who opens their
     first pronunciation report and finds a list of faults does not open the
     second one. */
  const notes: PronunciationReport['notes'] = [];

  if (coverage < 60) {
    notes.push({ kind: 'watch', text: `You read about ${coverage}% of the passage. Finish it and the report gets a lot more useful.` });
  }

  if (accuracy >= 95 && patterns.length === 0) {
    notes.push({ kind: 'good', text: 'Every word came through clearly. Nothing to fix — try it faster, or with more expression.' });
  } else if (accuracy >= 85) {
    notes.push({ kind: 'good', text: `${accuracy}% of your words came through exactly right.` });
  }

  if (patterns.length > 0) {
    const p = patterns[0];
    const where = p.position === 'start' ? 'at the start of a word'
      : p.position === 'end' ? 'at the end of a word'
      : 'in the middle of a word';
    notes.push({
      kind: 'fix',
      text: `“${p.sound}” ${where} came out as “${p.heardAs}” ${p.count} ${p.count === 1 ? 'time' : 'times'} — ${p.examples.map((e) => `${e.expected} → ${e.heard}`).join(', ')}.`,
    });
  } else if (accuracy < 85) {
    /* Words went astray but nothing repeated. Saying "your pronunciation is
       poor" on that evidence would be guessing. */
    notes.push({
      kind: 'watch',
      text: 'A few words did not come through. Nothing repeated, so it may be the microphone as much as you — read it once more and see if the same words slip.',
    });
  }

  return {
    scored: true,
    accuracy,
    coverage,
    wordsRead: heard.length,
    wordsExpected: reference.length,
    patterns,
    words: checks,
    notes,
  };
}
