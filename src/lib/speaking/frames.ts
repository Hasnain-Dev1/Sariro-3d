/**
 * SARIRO — putting loudness back on the clock
 * ============================================================================
 * The recorder samples loudness "every 50ms" with setInterval, and everything
 * downstream — pauses, phrasing, the replay pins — reads frame f as the moment
 * f × 50ms. That is only true if the timer is punctual, and timers are not:
 *
 *   • a phone that is busy (the live meters re-render twenty times a second)
 *     runs a 50ms timer at 70, 90, 120ms;
 *   • a tab in the background, or a screen that dims, is throttled to once a
 *     second.
 *
 * Found by recording a scripted voice with a known pause at 3.3s: the timer ran
 * at about 100ms, so the recording had half the frames it should, and the pause
 * was reported at 1.65s — and every word after it was pinned seconds early.
 *
 * So each sample carries the time it was actually taken, and before anything
 * measures the recording the samples are laid onto an exact 50ms grid. A punctual
 * recording comes back unchanged; a late one comes back with its pauses where
 * they really were.
 */

/**
 * `values[i]` was taken at `stamps[i]` ms. Returns one value per `frameMs` of
 * `durationMs`: for frame f, the sample taken nearest to (f + 1) × frameMs —
 * where a punctual sampler would have taken sample f.
 *
 * Lengths that disagree mean the stamps cannot be trusted, and the values are
 * returned as they came rather than guessed at.
 */
export function onGrid<T>(values: readonly T[], stamps: readonly number[], durationMs: number, frameMs: number): T[] {
  if (values.length === 0) return [];
  if (stamps.length !== values.length || frameMs <= 0 || !(durationMs > 0)) return [...values];

  const frames = Math.max(1, Math.round(durationMs / frameMs));
  const out: T[] = new Array(frames);
  let j = 0;
  for (let f = 0; f < frames; f++) {
    const target = (f + 1) * frameMs;
    // Stamps only go forward, so the nearest sample only moves forward too.
    while (j + 1 < stamps.length && Math.abs(stamps[j + 1] - target) <= Math.abs(stamps[j] - target)) j++;
    out[f] = values[j];
  }
  return out;
}
