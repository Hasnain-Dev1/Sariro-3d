'use client';

import type { Kata } from './katas';

/**
 * SARIRO — running a kata in the browser
 * ============================================================================
 * One fresh worker per run (public/practice/code-runner.js). A run that has not
 * answered in `timeoutMs` is killed — the commonest reason is a loop whose
 * condition never turns false, so that is what the learner is told.
 */

export interface TestOutcome {
  i: number;
  pass: boolean;
  got?: string;
  error?: string;
}

export type RunResult =
  | { ok: true; results: TestOutcome[]; logs: string[]; passed: number; total: number }
  | { ok: false; error: string; logs: string[] };

export function runKata(code: string, kata: Pick<Kata, 'fnName' | 'tests'>, timeoutMs = 3000): Promise<RunResult> {
  return new Promise((resolve) => {
    let worker: Worker;
    try {
      worker = new Worker('/practice/code-runner.js');
    } catch {
      resolve({ ok: false, error: 'This browser could not start the code runner.', logs: [] });
      return;
    }
    const timer = setTimeout(() => {
      worker.terminate();
      resolve({ ok: false, error: `Your code ran for more than ${timeoutMs / 1000} seconds and was stopped. Is there a loop that never ends?`, logs: [] });
    }, timeoutMs);
    worker.onmessage = (e: MessageEvent) => {
      clearTimeout(timer);
      worker.terminate();
      const data = e.data as { ok: boolean; results?: TestOutcome[]; error?: string; logs?: string[] };
      if (!data.ok) {
        resolve({ ok: false, error: data.error ?? 'Your code could not run.', logs: data.logs ?? [] });
        return;
      }
      const results = data.results ?? [];
      resolve({ ok: true, results, logs: data.logs ?? [], passed: results.filter((r) => r.pass).length, total: results.length });
    };
    worker.onerror = (e) => {
      clearTimeout(timer);
      worker.terminate();
      resolve({ ok: false, error: e.message || 'Your code could not run.', logs: [] });
    };
    worker.postMessage({ code, fnName: kata.fnName, tests: kata.tests.map((t) => ({ args: t.args, expected: t.expected })) });
  });
}
