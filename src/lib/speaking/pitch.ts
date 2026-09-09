/**
 * SARIRO — how high the voice is, twenty times a second
 * ============================================================================
 * The speaking lab already samples the microphone every 50ms and keeps one
 * number from each frame: loudness. Loudness tells you whether somebody is
 * audible. It tells you nothing about whether they are interesting.
 *
 * The difference between a child reciting and a child presenting is almost
 * entirely PITCH — a voice that moves. And it is already in the buffer we
 * throw away.
 *
 * ── Autocorrelation, not FFT ────────────────────────────────────────────────
 * A fundamental frequency is a repeat: shift the waveform against itself and
 * the lag where it lines up best is the period. For a single voice this is
 * more robust than picking the loudest FFT bin, which happily returns a
 * harmonic and reports a child as an octave higher than they are.
 *
 * ── Why it refuses so often ─────────────────────────────────────────────────
 * Unvoiced sounds (s, f, sh, t) have no pitch at all, and neither does silence
 * or a room's hum. Roughly half the frames of ordinary speech should come back
 * null, and a detector that always answers is a detector that is guessing.
 * Everything downstream is built to expect gaps.
 */

/** A child's voice sits well inside this. Outside it is noise or a harmonic. */
export const MIN_HZ = 70;
export const MAX_HZ = 500;

/**
 * Below this the frame is silence or a fricative. Chosen deliberately high:
 * a wrong pitch is worse than a missing one, because a missing one is skipped
 * and a wrong one drags the range it lands in.
 */
const MIN_RMS = 0.01;

/** How well the shifted wave must match itself to be believed. */
const MIN_CORRELATION = 0.9;

/**
 * The fundamental frequency of one frame, or null when there isn't one.
 *
 * `buffer` is time-domain samples in [-1, 1], as AnalyserNode's
 * getFloatTimeDomainData gives them.
 */
export function detectPitch(buffer: Float32Array, sampleRate: number): number | null {
  const n = buffer.length;
  if (!n || !Number.isFinite(sampleRate) || sampleRate <= 0) return null;

  // Loudness first: it is cheap, and most frames fail here.
  let sum = 0;
  for (let i = 0; i < n; i++) sum += buffer[i] * buffer[i];
  const rms = Math.sqrt(sum / n);
  if (rms < MIN_RMS) return null;

  const maxLag = Math.min(n - 1, Math.floor(sampleRate / MIN_HZ));
  const minLag = Math.max(1, Math.floor(sampleRate / MAX_HZ));
  if (minLag >= maxLag) return null;

  /* Normalised autocorrelation. Dividing by the energy in the window is what
     makes the threshold mean the same thing at any volume — without it a loud
     frame passes on strength alone and a quiet one never passes at all. */
  /* The energy term is a prefix sum, computed once.
     ────────────────────────────────────────────────────────────────────────
     Written the obvious way, the inner loop recomputes sum(buffer[i]^2) for
     every lag — the same running total, from scratch, five hundred times a
     frame, twenty times a second. On a mid-range Android that is enough to
     make the level meter stutter while a child is speaking, which is the one
     moment the page must not.

     With a prefix sum the denominator is a subtraction and the inner loop does
     one multiply instead of three. */
  const prefixSq = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) prefixSq[i + 1] = prefixSq[i] + buffer[i] * buffer[i];

  const scores = new Float32Array(maxLag + 1);
  for (let lag = minLag; lag <= maxLag; lag++) {
    const upto = n - lag;
    let corr = 0;
    for (let i = 0; i < upto; i++) corr += buffer[i] * buffer[i + lag];
    const energy = prefixSq[upto];
    scores[lag] = energy > 0 ? corr / energy : 0;
  }

  /* Take the FIRST strong peak, not the strongest.
     ────────────────────────────────────────────────────────────────────────
     A waveform correlates with itself at every MULTIPLE of its period, and for
     a clean tone those later peaks score essentially the same as the first —
     so a global maximum is decided by floating-point noise. It reported a
     220Hz tone as 73Hz: exactly one third, the lag at three periods.
     Sub-harmonics like that are the classic autocorrelation failure, and on a
     child's voice they read as an adult male.

     The period is the FIRST lag that correlates strongly, so the search skips
     the descending slope out of lag 0 and then takes the first local peak
     above the threshold. */
  let lag = minLag;
  while (lag < maxLag && scores[lag + 1] > scores[lag]) lag++; // out of the slope

  let bestLag = -1;
  let bestScore = 0;
  for (; lag <= maxLag; lag++) {
    if (scores[lag] < MIN_CORRELATION) continue;
    // A local peak: this is the period, and every later peak is a multiple.
    if (lag === maxLag || scores[lag] >= scores[lag + 1]) {
      bestLag = lag;
      bestScore = scores[lag];
      break;
    }
  }

  if (bestLag < 0 || bestScore < MIN_CORRELATION) return null;

  const hz = sampleRate / bestLag;
  return hz >= MIN_HZ && hz <= MAX_HZ ? hz : null;
}

/**
 * Semitones between two frequencies.
 *
 * Pitch is heard logarithmically: 100Hz to 200Hz and 200Hz to 400Hz are the
 * same musical distance and sound like the same amount of movement. Reporting
 * a range in Hz would make every deep voice look expressive and every high one
 * look flat, which is a statement about their body rather than their delivery.
 */
export function semitones(from: number, to: number): number {
  if (from <= 0 || to <= 0) return 0;
  return 12 * Math.log2(to / from);
}
