import { callLabel, formatValue } from './format';
import type { CodeChallenge, FnTest, LabRun, ProgramTest, TestResult } from './types';

/**
 * SARIRO — Code Lab: a runner's raw answer, in the shape the lab shows
 * ============================================================================
 * The JavaScript and Python workers both answer
 *   { ok: true, results: [{ i, pass, got, error }], logs } | { ok: false, error, line, logs }
 * and this names each test the way the learner would call it — or "Hidden test
 * 3", whose arguments stay hidden so they cannot be hard-coded.
 */

export interface RawRun {
  ok: boolean;
  results?: { i: number; pass: boolean; got?: string; error?: string }[];
  error?: string;
  line?: number;
  logs?: string[];
}

export function toLabRun(c: CodeChallenge, raw: RawRun, ms: number): LabRun {
  const logs = raw.logs ?? [];
  if (!raw.ok) return { ok: false, error: raw.error ?? 'Your code could not run.', line: raw.line, logs, ms };
  let hiddenNo = 0;
  const results: TestResult[] = (raw.results ?? []).map((r) => {
    const t = c.tests[r.i];
    const hidden = !t?.visible;
    if (hidden) hiddenNo += 1;
    if (c.mode === 'program') {
      return { index: r.i, pass: r.pass, hidden, label: hidden ? `Hidden test ${hiddenNo}` : 'Output', expected: (t as ProgramTest).stdout, got: r.got, error: r.error };
    }
    const ft = t as FnTest;
    return {
      index: r.i,
      pass: r.pass,
      hidden,
      label: hidden ? `Hidden test ${hiddenNo}` : callLabel(c.fnName!, ft.args, c.lang),
      expected: hidden ? undefined : formatValue(ft.expected, c.lang),
      got: hidden ? undefined : r.got,
      error: r.error,
    };
  });
  const passed = results.filter((r) => r.pass).length;
  return { ok: true, results, logs, passed, total: results.length, ms };
}
