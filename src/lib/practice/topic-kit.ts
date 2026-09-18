import { makeRng, type Rng } from './rng';
import type { Answer, Difficulty, Item, RoomId, Topic } from './types';

/**
 * SARIRO — practice: the few lines every generator would otherwise repeat
 * ============================================================================
 * A generator writes the question; this stamps its id, topic and seed, so an
 * item can always be rebuilt from `<topic>#<seed>` and nothing else.
 */

export interface Draft {
  prompt: string;
  answer: Answer;
  answerText: string;
  hints: string[];
  solution: string;
  inputHint?: string;
  /** Arcade wording: the same question in a few symbols. */
  short?: string;
}

export function defineTopic(
  room: RoomId,
  slug: string,
  title: string,
  grades: [number, number],
  keywords: string[],
  build: (r: Rng, d: Difficulty) => Draft
): Topic {
  const key = `${room}:${slug}`;
  return {
    key,
    room,
    title,
    grades,
    keywords,
    make(seed: number, difficulty: Difficulty): Item {
      const draft = build(makeRng(seed), difficulty);
      return { id: `${key}#${seed}`, topic: key, seed, ...draft };
    },
  };
}

/** 3,482 — digit groups for numbers a child reads aloud. */
export const fmt = (n: number) => (Math.abs(n) >= 10000 ? n.toLocaleString('en-US') : String(n));

/** Signed term for printing an equation: "+ 5", "− 3". */
export const signed = (n: number) => (n < 0 ? `− ${Math.abs(n)}` : `+ ${n}`);

/** "(−7)" for a negative number inside a sum. */
export const paren = (n: number) => (n < 0 ? `(−${Math.abs(n)})` : String(n));

/** Round to d decimal places, as a number. */
export const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

/** Multiple-choice answer: `correct` shuffled in among `wrong`, duplicates dropped. */
export function choice(r: Rng, correct: string, wrong: string[]): { answer: Answer; answerText: string } {
  const distinct = [...new Set(wrong.filter((w) => w !== correct))].slice(0, 3);
  const options = r.shuffle([correct, ...distinct]);
  return { answer: { kind: 'choice', options, correct: options.indexOf(correct) }, answerText: correct };
}
