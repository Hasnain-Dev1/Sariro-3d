/**
 * SARIRO — practice: what a question is
 * ============================================================================
 * One shape for every subject's questions, so one player can ask them, one
 * checker can mark them, and one log can record them. A subject adds
 * generators; it never adds a new kind of screen for an ordinary question.
 */

export type RoomId = 'maths' | 'coding' | 'physics' | 'chemistry' | 'biology' | 'science' | 'english';

/** How an answer is typed or chosen, and so how it is marked. */
export type Answer =
  /** Pick one. `correct` is an index into `options`. */
  | { kind: 'choice'; options: string[]; correct: number }
  /** A number. Exact rationals when `fraction`; otherwise within `tolerance` (relative). */
  | { kind: 'number'; value: number; tolerance?: number; fraction?: boolean; simplest?: boolean }
  /** A physical quantity: SI value + the unit it is expected in (any equivalent unit is accepted). */
  | { kind: 'quantity'; si: number; unit: string; tolerance?: number }
  /** An algebraic expression, marked by evaluating both at sample points. */
  | { kind: 'expression'; value: string }
  /** Several accepted words or phrases, compared loosely (case, spaces, punctuation). */
  | { kind: 'text'; accept: string[] }
  /** Put `items` in order. `correct` is the right order, as indexes into `items`. */
  | { kind: 'order'; items: string[]; correct: number[] }
  /** A chemical equation to balance: the coefficients, lowest whole numbers. */
  | { kind: 'coefficients'; species: string[]; arrow: number; correct: number[] };

export interface Item {
  /** `<topic>#<seed>` — enough to make exactly this question again. */
  id: string;
  topic: string;
  seed: number;
  /** The question. Plain text; `**bold**` and line breaks are kept. */
  prompt: string;
  answer: Answer;
  /** Shown one at a time, each costing a little. */
  hints: string[];
  /** The worked solution, shown after an answer. */
  solution: string;
  /** The right answer as a learner would type it — shown after, and used by tests. */
  answerText: string;
  /** Unit or format reminder under the input, e.g. "in m/s" or "as a fraction". */
  inputHint?: string;
  /** The same question in a few symbols, for games where it must fit on a meteor. */
  short?: string;
}

export type Difficulty = 1 | 2 | 3;

export interface Topic {
  /** Stable key: `maths:fractions-add`. Logged with every attempt. */
  key: string;
  room: RoomId;
  title: string;
  /** Grades it suits, inclusive. Coding uses 0–14 (any age). */
  grades: [number, number];
  /** Words a lesson title may contain for this topic to be "this week's". */
  keywords: string[];
  make(seed: number, difficulty: Difficulty): Item;
}

export interface CheckResult {
  correct: boolean;
  /** Right idea, wrong form — e.g. not simplified, missing the unit. Not counted wrong twice. */
  nearly?: boolean;
  /** One sentence for the learner. */
  message: string;
}
