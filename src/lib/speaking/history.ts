/**
 * SARIRO — Voice Check attempts, remembered on this device
 * ============================================================================
 * "You scored 71" is a result. "You scored 71, up 14 since your first go" is a
 * reason to go again — and going again is where a child actually gets better.
 *
 * Kept in the browser's own storage, like the best score was. No account, and
 * nothing leaves the device: this page promises that, and a progress line is
 * not worth breaking the promise for.
 *
 * Storage is untrusted input. A value can be missing, cleared, edited by hand
 * or written by an older version of this page, so everything read back is
 * checked, and anything malformed is dropped rather than shown.
 */

export interface Attempt {
  /** Epoch ms. 0 for an attempt carried over from before history was kept. */
  at: number;
  score: number;
  /** The six Speaking DNA values, in DNA_ORDER. Empty when not measured. */
  dna: number[];
}

/** Enough for a real trend, small enough that storage never fills. */
export const HISTORY_CAP = 30;

export const HISTORY_KEY = 'sariro.voice-check.history';
/** Where the best score lived before there was a history. Read once, to carry it over. */
export const LEGACY_BEST_KEY = 'sariro.voice-check.best';

const isScore = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 100;

export function parseHistory(raw: string | null | undefined, legacyBest?: string | null): Attempt[] {
  let list: Attempt[] = [];
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) {
      list = parsed
        .filter((a): a is Attempt =>
          !!a && typeof a === 'object' &&
          isScore((a as Attempt).score) &&
          typeof (a as Attempt).at === 'number' && Number.isFinite((a as Attempt).at))
        .map((a) => ({
          at: a.at,
          score: Math.round(a.score),
          dna: Array.isArray(a.dna) && a.dna.length === 6 && a.dna.every(isScore) ? a.dna.map(Math.round) : [],
        }));
    }
  } catch {
    list = [];
  }

  // Somebody who used the page before history existed keeps their best score.
  const best = Number(legacyBest);
  if (list.length === 0 && legacyBest && isScore(best) && best > 0) {
    list = [{ at: 0, score: Math.round(best), dna: [] }];
  }
  return list.slice(-HISTORY_CAP);
}

export function addAttempt(list: readonly Attempt[], attempt: Attempt, cap = HISTORY_CAP): Attempt[] {
  return [...list, attempt].slice(-cap);
}

export interface Progress {
  /** Attempts including this one. */
  count: number;
  /** The best score BEFORE this attempt; null on a first attempt. */
  previousBest: number | null;
  isBest: boolean;
  /** This score minus the first one ever. 0 on a first attempt. */
  sinceFirst: number;
  /** The attempt before this one, for the ghost shape on the chart. */
  previous: Attempt | null;
  /** The most recent scores, oldest first, for the sparkline. */
  recent: number[];
}

/** Where the latest attempt — the last in the list — stands against the rest. */
export function progressOf(list: readonly Attempt[], recentCount = 10): Progress | null {
  if (list.length === 0) return null;
  const latest = list[list.length - 1];
  const earlier = list.slice(0, -1);
  const previousBest = earlier.length ? Math.max(...earlier.map((a) => a.score)) : null;
  return {
    count: list.length,
    previousBest,
    isBest: previousBest === null || latest.score > previousBest,
    sinceFirst: earlier.length ? latest.score - list[0].score : 0,
    previous: earlier.length ? earlier[earlier.length - 1] : null,
    recent: list.slice(-recentCount).map((a) => a.score),
  };
}
