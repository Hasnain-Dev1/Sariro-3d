/**
 * SARIRO — assembling what the browser heard, without saying it twice
 * ============================================================================
 * Both labs did this, and both did it the same wrong way:
 *
 *     for (let i = e.resultIndex; i < e.results.length; i++)
 *       if (e.results[i].isFinal) text += e.results[i][0].transcript + ' ';
 *
 * It reads as obviously correct and is not. `resultIndex` is the index of the
 * first result that CHANGED in this event — NOT the first one we have yet to
 * see. Chrome re-fires events at an index that is already final often enough
 * to matter, and every time it does, that phrase is appended again.
 *
 * The transcript came back with words doubled. That is not a cosmetic problem:
 * every number in the report is derived from this string, so a duplicated
 * phrase inflates the word count, inflates words-per-minute, and invents
 * filler words the child never said. A report that tells a ten-year-old they
 * said "like" six times when they said it three times is a report they are
 * right to stop believing.
 *
 * ── Why rebuilding is the fix ───────────────────────────────────────────────
 * Nothing is remembered between events, so nothing can be counted twice. The
 * list is a few dozen entries and this runs a few times a second; the cost is
 * irrelevant next to being wrong.
 *
 * ── Why `prior` exists ──────────────────────────────────────────────────────
 * Chrome ends a recognition session on its own after a few seconds of silence,
 * and a child pausing to think is silence. The lab restarts it — and a
 * restarted session gets a FRESH, EMPTY results list. Anything already heard
 * has to be banked outside the session or a 60-second drill keeps only
 * whatever came after the last pause.
 */

/** The shape both labs already have from the Web Speech API. */
export interface ResultLike {
  isFinal: boolean;
  0: { transcript: string };
}

export interface Assembled {
  /** Everything settled: earlier sessions plus this session's final results. */
  final: string;
  /** The words still being revised. Shown, never measured. */
  interim: string;
  /** What to display: final + interim. */
  display: string;
}

/*
 * ── Android says the whole sentence again, every time ───────────────────────
 * Found on a tablet, 15 Sep 2026: a child said "do you know octopus has three
 * hearts" and the box filled with "do do you know do you know do you know
 * octopus do you know octopus has…". Chrome on Android, in continuous mode,
 * does not send one result per phrase. It sends the SAME phrase over and over
 * as it grows — "do", "do you know", "do you know octopus" — each one a
 * separate result, often each one final. Joining them repeats every word as
 * many times as the sentence grew.
 *
 * Desktop Chrome sends separate phrases, which must still be joined. So each
 * result is compared with what came before it: a phrase that merely restates or
 * extends the previous one replaces it; anything else is new and is added. A
 * child genuinely saying the same word twice in a row, as two separate results,
 * loses one — a far smaller error than a transcript ten times too long.
 */
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, ' ').trim();

/** Add a phrase, unless it only restates — or grows — what is already there. */
function fold(parts: string[], text: string): void {
  const t = text.trim();
  if (!t) return;
  const n = norm(t);
  const last = parts.length ? norm(parts[parts.length - 1]) : '';
  if (last) {
    // The same phrase again, or an earlier, shorter version of it.
    if (n === last || last.startsWith(`${n} `)) return;
    // The same phrase, grown.
    if (n.startsWith(`${last} `)) { parts[parts.length - 1] = t; return; }
  }
  // Some Android builds restate the ENTIRE session so far, not just the last phrase.
  const all = norm(parts.join(' '));
  if (all && (n === all || all.startsWith(`${n} `))) return;
  if (all && n.startsWith(`${all} `)) { parts.splice(0, parts.length, t); return; }
  parts.push(t);
}

export function assembleTranscript(
  results: ArrayLike<ResultLike> | null | undefined,
  prior = ''
): Assembled {
  const finals: string[] = [];
  const interims: string[] = [];

  const n = results?.length ?? 0;
  for (let i = 0; i < n; i++) {
    const r = results![i];
    const text = r?.[0]?.transcript;
    if (typeof text !== 'string') continue;
    fold(r.isFinal ? finals : interims, text);
  }

  const sessionFinal = finals.length ? `${finals.join(' ')} ` : '';
  /* The guess still being made. On Android it usually restates the finals too,
     so only the words beyond them are shown. */
  let interim = interims.join(' ');
  const settled = norm(finals.join(' '));
  const guess = norm(interim);
  if (settled && guess) {
    if (guess === settled || settled.startsWith(`${guess} `) || settled.endsWith(` ${guess}`)) interim = '';
    else if (guess.startsWith(`${settled} `)) interim = interim.trim().split(/\s+/).slice(settled.split(' ').length).join(' ');
  }

  /* One space between banked text and this session's, and never a leading
     one — a transcript that starts with a space costs a word in some naive
     splitters and looks like sloppy software in the panel. Trimmed at BOTH
     ends, not just the right: a `prior` of pure whitespace is truthy, and
     trimming only the end left exactly the leading space this avoids. */
  const base = prior.trim();
  const final = (base ? `${base} ` : '') + sessionFinal;
  return {
    final,
    interim,
    display: `${final}${interim}`,
  };
}
