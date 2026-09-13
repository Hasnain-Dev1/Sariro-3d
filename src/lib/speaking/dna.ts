import { scoreBreakdown, type SpeechReport } from './analyse';
import type { ModulationReport } from './modulation';

/**
 * SARIRO — Speaking DNA
 * ============================================================================
 * One number says how good. A shape says what KIND of speaker — and two
 * children who both scored 72 almost never have the same shape. One races and
 * never says "um"; the other is calm and flat. Telling them the same thing
 * would be telling neither of them anything.
 *
 * Six axes, each 0–100, each read straight off something measured:
 *
 *   Pace        how close to the comfortable band          scoreBreakdown.pace
 *   Fluency     how few "um"s and "uh"s                     scoreBreakdown.fillers
 *   Pausing     breathing room between ideas                scoreBreakdown.pausing
 *   Flow        phrases a listener can hold in their head   scoreBreakdown.phrasing
 *   Expression  how far the voice moved                     modulation.expressiveness
 *   Energy      holding volume to the end, and emphasis     modulation drift + emphasis
 *
 * Nothing is invented for the chart. Where a measurement could not be taken —
 * a recording too short to hear pitch — the axis falls back to the plainer
 * loudness reading the score itself used, never to a flattering constant.
 */

export type DnaKey = 'pace' | 'fluency' | 'pausing' | 'flow' | 'expression' | 'energy';

export interface DnaAxis {
  key: DnaKey;
  label: string;
  value: number;
}

/** Clockwise from the top, so the chart reads the same way every time. */
export const DNA_ORDER: readonly DnaKey[] = ['pace', 'fluency', 'pausing', 'flow', 'expression', 'energy'];

const LABEL: Record<DnaKey, string> = {
  pace: 'Pace',
  fluency: 'Fluency',
  pausing: 'Pausing',
  flow: 'Flow',
  expression: 'Expression',
  energy: 'Energy',
};

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export function speakingDna(report: SpeechReport, modulation: ModulationReport | null): DnaAxis[] {
  const parts = scoreBreakdown(report);
  const scored = modulation?.scored ?? false;
  const quiet = report.delivery.tooQuiet;

  const expression = quiet
    ? 20
    : scored
      ? modulation!.expressiveness
      : report.delivery.monotone ? 35 : 60;

  let energy: number;
  if (quiet) {
    energy = 20;
  } else if (scored) {
    // Holding the volume is most of it; a fade from start to finish costs up to
    // 45 points. Moments of emphasis add the rest.
    const drift = modulation!.energyDrift;
    const hold = drift >= -10 ? 70 : drift <= -50 ? 25 : 70 - ((-10 - drift) / 40) * 45;
    energy = hold + Math.min(30, modulation!.emphasisPerMin * 3);
  } else {
    energy = report.delivery.monotone ? 55 : 75;
  }

  const values: Record<DnaKey, number> = {
    pace: parts.pace * 5,
    fluency: parts.fillers * 5,
    pausing: parts.pausing * 5,
    flow: parts.phrasing * 5,
    expression,
    energy,
  };

  return DNA_ORDER.map((key) => ({ key, label: LABEL[key], value: clamp(values[key]) }));
}

export interface Archetype {
  key: 'quiet-spark' | 'sprinter' | 'storyteller' | 'calm-presenter' | 'thinker' | 'rising-voice';
  name: string;
  emoji: string;
  /** What it says about them, kindly and truthfully. */
  line: string;
}

const value = (dna: readonly DnaAxis[], key: DnaKey) => dna.find((a) => a.key === key)?.value ?? 0;

/**
 * The kind of speaker this shape belongs to.
 *
 * Every archetype is something a child is glad to be called, and every one is
 * earned by a measurement — the Sprinter really was fast, the Storyteller's
 * voice really did move. The checks run in order, the most defining first:
 * a very quiet recording is the Quiet Spark whatever else it did, because
 * nothing else can be heard properly until the volume comes up.
 */
export function archetypeFor(report: SpeechReport, dna: readonly DnaAxis[]): Archetype {
  if (report.delivery.tooQuiet) {
    return {
      key: 'quiet-spark', name: 'The Quiet Spark', emoji: '✨',
      line: 'Big ideas at a small volume. Turn it up and people will hear what you have got.',
    };
  }
  if (report.pace.verdict === 'high') {
    return {
      key: 'sprinter', name: 'The Sprinter', emoji: '⚡',
      line: 'Full of energy — the ideas come faster than the breaths. Pauses will make every one land.',
    };
  }
  if (value(dna, 'expression') >= 67 && value(dna, 'flow') >= 70) {
    return {
      key: 'storyteller', name: 'The Storyteller', emoji: '🎭',
      line: 'Your voice rises and falls in a way that makes people lean in.',
    };
  }
  if (value(dna, 'fluency') >= 90 && value(dna, 'pausing') >= 75) {
    return {
      key: 'calm-presenter', name: 'The Calm Presenter', emoji: '🎯',
      line: 'Clean, unhurried and easy to follow. You sound like you know what you are talking about.',
    };
  }
  if (report.pace.verdict === 'low') {
    return {
      key: 'thinker', name: 'The Thinker', emoji: '🧠',
      line: 'Careful and deliberate — every word chosen. A little more momentum and you will hold any room.',
    };
  }
  return {
    key: 'rising-voice', name: 'The Rising Voice', emoji: '🚀',
    line: 'The foundations are all there, and every try sharpens them.',
  };
}

/**
 * The axis that grew most since another attempt, for the line under the chart.
 * null when nothing moved by at least `threshold` points.
 */
export function biggestGain(
  now: readonly DnaAxis[],
  before: readonly number[] | null | undefined,
  threshold = 5
): { label: string; by: number } | null {
  if (!before || before.length !== now.length) return null;
  let best: { label: string; by: number } | null = null;
  now.forEach((axis, i) => {
    const by = axis.value - before[i];
    if (by >= threshold && (!best || by > best.by)) best = { label: axis.label, by };
  });
  return best;
}
