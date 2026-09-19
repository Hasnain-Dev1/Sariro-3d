/**
 * SARIRO — Code Lab: what a challenge is
 * ============================================================================
 * The founder, 19 Sep 2026: a proper coding practice room for every coding
 * course — pick a challenge, write the code, run the tests, take a hint, ask a
 * tutor who will not hand over the answer.
 *
 * Three languages run in the browser, free, with nothing installed:
 *   javascript  a Web Worker (public/practice/code-runner.js)
 *   python      Pyodide in a Web Worker (public/practice/py-runner.js)
 *   web         HTML + CSS in a sandboxed frame, checked by
 *               public/practice/web-checker.js
 *
 * A challenge is either a FUNCTION to write (tests call it with arguments and
 * compare what it returns) or a PROGRAM to write (tests compare what it
 * prints). Every challenge carries a reference solution, and the packs' tests
 * run each one through the same runner the browser uses — a challenge whose
 * own solution fails can never reach a learner.
 */

export type LabLanguage = 'javascript' | 'python' | 'web';

/** 1 Easy · 2 Medium · 3 Hard · 4 Expert — and the course level it suits (Elementary…Advanced). */
export type Tier = 1 | 2 | 3 | 4;

export const TIER_LABEL: Record<Tier, string> = { 1: 'Easy', 2: 'Medium', 3: 'Hard', 4: 'Expert' };
export const TIER_XP: Record<Tier, number> = { 1: 10, 2: 20, 3: 35, 4: 50 };

export interface FnTest {
  args: unknown[];
  expected: unknown;
  /** Shown with its arguments before running. Hidden tests catch hard-coded answers. */
  visible?: boolean;
}

export interface ProgramTest {
  /** What the program should print, line for line (trailing spaces ignored). */
  stdout: string;
  visible?: boolean;
}

export interface WebCheck {
  /** What the learner reads: "The page has a main heading". */
  label: string;
  selector: string;
  /**
   *   exists  at least one element matches
   *   count   exactly `value` match (or at least, when value is ">=N")
   *   text    the first match's text contains `value` (case-insensitive)
   *   attr    the first match has attribute `attr` (non-empty; equal to `value` if given)
   *   style   the first match's computed `prop` equals `value`
   */
  expect: 'exists' | 'count' | 'text' | 'attr' | 'style';
  value?: string | number;
  attr?: string;
  prop?: string;
}

interface Base {
  /** `lab:py:hello` — logged as the attempt's topic. JavaScript keeps the old `coding:` ids. */
  id: string;
  lang: LabLanguage;
  title: string;
  tier: Tier;
  /** A group in the challenge list: "Basics", "Strings", "Lists"… */
  topic: string;
  /** What to build. Plain text; `code` in backticks; blank lines separate paragraphs. */
  prompt: string;
  /** Two or three, each giving away a little more. */
  hints: string[];
}

export interface CodeChallenge extends Base {
  lang: 'javascript' | 'python';
  /** 'function': tests call `fnName`. 'program': tests read what it prints. */
  mode: 'function' | 'program';
  fnName?: string;
  starter: string;
  solution: string;
  tests: FnTest[] | ProgramTest[];
}

export interface WebChallenge extends Base {
  lang: 'web';
  starter: { html: string; css: string };
  solution: { html: string; css: string };
  checks: WebCheck[];
}

export type Challenge = CodeChallenge | WebChallenge;

export const isCode = (c: Challenge): c is CodeChallenge => c.lang !== 'web';

/** One test's outcome, the same shape for every runner. */
export interface TestResult {
  /** The test's position in the challenge's list. */
  index: number;
  pass: boolean;
  /** "sayHello('Ada')" or "Hidden test 3" or a web check's label. */
  label: string;
  expected?: string;
  got?: string;
  error?: string;
  hidden?: boolean;
}

export type LabRun =
  | { ok: true; results: TestResult[]; logs: string[]; passed: number; total: number; ms: number }
  | { ok: false; error: string; line?: number; logs: string[]; ms: number; timedOut?: boolean };
