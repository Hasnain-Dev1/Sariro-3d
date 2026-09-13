import { PACE_BAND, scoreBreakdown, type ScoreBreakdown, type SpeechReport } from './analyse';
import type { ModulationReport } from './modulation';

/**
 * SARIRO — Voice Check
 * ============================================================================
 * The free speaking check anybody can take on the website: talk for 45
 * seconds, get told what your voice actually did.
 *
 * It measures nothing new. The pace, the fillers, the pauses and the score all
 * come from lib/speaking/analyse.ts — the engine enrolled students have
 * practised against for months — and expression from lib/speaking/modulation.
 * This module only decides how that is PRESENTED to a stranger: which prompt,
 * which words for the score, which four numbers, which one drill.
 *
 * ── Honest first ────────────────────────────────────────────────────────────
 * The score is the engine's, unchanged, and shown with its five parts. It is
 * already generous by design (see scoreBreakdown) — there is no second,
 * flattering number layered on top for marketing. A parent who notices the
 * score was inflated stops believing everything else on the page.
 */

/** How long the prompt asks them to speak. */
export const TARGET_SECONDS = 45;
/** Recording stops itself here, so a forgotten tab does not listen for ever. */
export const MAX_SECONDS = 60;
/** Below this there is not enough speech to measure honestly. */
export const MIN_SECONDS = 10;
export const MIN_WORDS = 15;

export interface Prompt {
  id: string;
  emoji: string;
  text: string;
}

/**
 * Things a child can talk about for 45 seconds without preparing. Every one
 * is about THEM — the easiest subject anybody has, which keeps nerves out of
 * the measurement.
 */
export const PROMPTS: readonly Prompt[] = [
  { id: 'food', emoji: '🍕', text: 'Convince us your favourite food is the best in the world.' },
  { id: 'superpower', emoji: '🦸', text: 'If you had one superpower, what would it be — and what would you do first?' },
  { id: 'proud', emoji: '🏆', text: 'Tell us about a time you felt really proud of yourself.' },
  { id: 'place', emoji: '🗺️', text: 'If you could visit any place tomorrow, where would you go and why?' },
  { id: 'teach', emoji: '🧑‍🏫', text: 'Teach us how to do something you are good at.' },
  { id: 'invention', emoji: '💡', text: 'Invent something that would make school better. Sell it to us.' },
];

/** A different prompt from the one they just had. */
export function nextPrompt(currentId: string | null, rand: () => number = Math.random): Prompt {
  const pool = PROMPTS.filter((p) => p.id !== currentId);
  return pool[Math.floor(rand() * pool.length)] ?? PROMPTS[0];
}

export type Validity =
  | { ok: true }
  | { ok: false; reason: 'no_words' | 'too_short' | 'too_few_words'; message: string };

/**
 * Whether there is enough here to put a number on. A score for eight words is
 * a random number with a decimal point, and giving a child one would be worse
 * than giving them none.
 */
export function checkRecording(input: { durationMs: number; words: number; heardWords: boolean }): Validity {
  if (!input.heardWords) {
    return {
      ok: false,
      reason: 'no_words',
      message: 'We could not hear any words. Check the microphone is allowed, speak up a little, and try again.',
    };
  }
  if (input.durationMs < MIN_SECONDS * 1000) {
    return {
      ok: false,
      reason: 'too_short',
      message: `Keep going a little longer — at least ${MIN_SECONDS} seconds gives us enough to measure.`,
    };
  }
  if (input.words < MIN_WORDS) {
    return {
      ok: false,
      reason: 'too_few_words',
      message: 'We only caught a few words. Try again, and keep talking until the timer is nearly done.',
    };
  }
  return { ok: true };
}

export interface ScoreBand {
  label: string;
  blurb: string;
  tone: 'gold' | 'green' | 'blue' | 'violet';
}

/** What the number means, in words a child is glad to read. */
export function scoreBand(score: number): ScoreBand {
  if (score >= 85) return { label: 'Stage-ready', blurb: 'Clear, steady and easy to follow. That is a voice people listen to.', tone: 'gold' };
  if (score >= 70) return { label: 'Confident speaker', blurb: 'Most of what makes a good speaker is already there.', tone: 'green' };
  if (score >= 55) return { label: 'Strong start', blurb: 'A few habits away from sounding really confident.', tone: 'blue' };
  return { label: 'Warming up', blurb: 'Everybody starts somewhere — and the second try is usually a big jump.', tone: 'violet' };
}

export interface Tile {
  key: 'pace' | 'fillers' | 'pauses' | 'expression';
  label: string;
  value: string;
  unit: string;
  good: boolean;
  /** One sentence about what the number means for THEM. */
  hint: string;
}

/** The four numbers worth showing a stranger, each with what it means. */
export function tilesFor(report: SpeechReport, modulation: ModulationReport | null): Tile[] {
  const { wpm, verdict } = report.pace;
  const pace: Tile = {
    key: 'pace',
    label: 'Pace',
    value: String(wpm),
    unit: 'words / min',
    good: verdict === 'good',
    hint:
      verdict === 'high'
        ? `A little fast — ${PACE_BAND.min}–${PACE_BAND.max} is easiest to follow.`
        : verdict === 'low'
          ? `A little slow — ${PACE_BAND.min}–${PACE_BAND.max} keeps listeners with you.`
          : 'Just right — easy for anybody to follow.',
  };

  const top = topFiller(report);
  const fillers: Tile = {
    key: 'fillers',
    label: 'Filler words',
    value: String(report.fillers.certain),
    unit: report.fillers.certain === 1 ? 'filler' : 'fillers',
    good: report.fillers.perMinute <= 2,
    hint:
      report.fillers.certain === 0
        ? 'No "um" or "uh" at all. That sounds confident.'
        : `Mostly "${top}". A short silence sounds stronger.`,
  };

  const pauses: Tile = {
    key: 'pauses',
    label: 'Pauses',
    value: String(report.pauses.count),
    unit: report.pauses.count === 1 ? 'pause' : 'pauses',
    good: report.pauses.count > 0,
    hint:
      report.pauses.count === 0
        ? 'No pauses — a breath between ideas helps people keep up.'
        : 'Good — pausing gives every idea room to land.',
  };

  const scored = modulation?.scored ?? false;
  const band = modulation?.band ?? 'steady';
  const expression: Tile = {
    key: 'expression',
    label: 'Expression',
    value: scored ? String(modulation!.expressiveness) : '—',
    unit: scored ? band : 'needs a longer recording',
    good: scored ? band !== 'flat' : !report.delivery.monotone,
    hint: !scored
      ? 'Speak a little longer and louder for us to hear your voice move.'
      : band === 'flat'
        ? 'Quite flat — let your voice rise and fall like a story.'
        : band === 'lively'
          ? 'Lively! Your voice moves in a way that holds attention.'
          : 'Steady — a little more rise and fall would add colour.',
  };

  return [pace, fillers, pauses, expression];
}

export interface VoiceDrill {
  title: string;
  steps: string;
  seconds: number;
}

/**
 * The filler worth naming. A certain one ("um") before a hedged one ("like"),
 * because "like" is as often a real word — "I like it" — and telling a child
 * their verbs were fillers is how they stop believing the rest.
 */
export function topFiller(report: SpeechReport): string {
  const b = report.fillers.breakdown;
  return b.find((f) => f.certain)?.word ?? b[0]?.word ?? 'um';
}

/** The part of the score with the most room to grow. Ties go in listed order. */
export function weakestPart(b: ScoreBreakdown): keyof ScoreBreakdown {
  const order: (keyof ScoreBreakdown)[] = ['fillers', 'pausing', 'pace', 'delivery', 'phrasing'];
  return order.reduce((worst, k) => (b[k] < b[worst] ? k : worst), order[0]);
}

/**
 * One thing to try, right now, for the part that cost the most points.
 * One — a list of five tips is a list of none.
 */
export function drillFor(report: SpeechReport): VoiceDrill {
  const part = weakestPart(scoreBreakdown(report));

  switch (part) {
    case 'fillers': {
      const word = topFiller(report);
      // "an um", "an uh" — but "a like", "a basically".
      const article = /^[aeiou]/i.test(word) ? 'an' : 'a';
      return {
        title: 'The silent swap',
        steps: `Say your answer again. Every time ${article} "${word}" is coming, close your mouth and pause instead. Silence sounds confident — "${word}" does not.`,
        seconds: 20,
      };
    }
    case 'pausing':
      return {
        title: 'The power pause',
        steps: 'Pick your best sentence. Say it, stop for two full seconds, then say why it matters. Feel how much stronger it lands.',
        seconds: 20,
      };
    case 'pace':
      return report.pace.verdict === 'low'
        ? {
            title: 'Keep it rolling',
            steps: 'Say your first two sentences again without stopping between words. Keep your energy up all the way to the full stop.',
            seconds: 20,
          }
        : {
            title: 'The speed bump',
            steps: 'Say your first sentence again, taking one full breath at every comma. Make it last twice as long as before.',
            seconds: 20,
          };
    case 'delivery':
      return report.delivery.tooQuiet
        ? {
            title: 'Back of the room',
            steps: 'Imagine someone at the far end of a big room. Say your first sentence so they hear every word — clearly, not shouting.',
            seconds: 15,
          }
        : {
            title: 'Colour your voice',
            steps: 'Say "I can’t believe it!" three ways: surprised, excited, then whispering a secret. That rise and fall is expression.',
            seconds: 15,
          };
    case 'phrasing':
    default:
      return {
        title: 'One idea, one breath',
        steps: 'Say your answer again as short ideas. Finish one idea, breathe, then start the next.',
        seconds: 20,
      };
  }
}

/** What goes out with the share card. */
export function shareMessage(score: number, band: ScoreBand, url: string): string {
  return `I scored ${score}/100 — "${band.label}" — on the Sariro Voice Check. Free, and it takes 45 seconds: ${url}`;
}
