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

export function assembleTranscript(
  results: ArrayLike<ResultLike> | null | undefined,
  prior = ''
): Assembled {
  let sessionFinal = '';
  let interim = '';

  const n = results?.length ?? 0;
  for (let i = 0; i < n; i++) {
    const r = results![i];
    const text = r?.[0]?.transcript;
    if (typeof text !== 'string') continue;
    if (r.isFinal) {
      const t = text.trim();
      if (t) sessionFinal += `${t} `;
    } else {
      interim += text;
    }
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
