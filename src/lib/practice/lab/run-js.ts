'use client';

import { toLabRun, type RawRun } from './results';
import type { CodeChallenge, LabRun } from './types';

/**
 * SARIRO — Code Lab: running JavaScript
 * ============================================================================
 * One fresh worker per run (public/practice/code-runner.js), killed if it has
 * not answered in three seconds — the commonest reason is a loop that never
 * ends, and the tutor says so.
 */

export function runJavaScript(code: string, c: CodeChallenge, timeoutMs = 3000): Promise<LabRun> {
  const started = performance.now();
  const ms = () => Math.round(performance.now() - started);
  return new Promise((resolve) => {
    let worker: Worker;
    try {
      worker = new Worker('/practice/code-runner.js');
    } catch {
      resolve({ ok: false, error: 'This browser could not start the code runner.', logs: [], ms: 0 });
      return;
    }
    const timer = setTimeout(() => {
      worker.terminate();
      resolve({ ok: false, timedOut: true, error: `Stopped after ${timeoutMs / 1000} seconds.`, logs: [], ms: ms() });
    }, timeoutMs);
    worker.onmessage = (e: MessageEvent<RawRun>) => {
      clearTimeout(timer);
      worker.terminate();
      resolve(toLabRun(c, e.data, ms()));
    };
    worker.onerror = (e) => {
      clearTimeout(timer);
      worker.terminate();
      resolve({ ok: false, error: e.message || 'Your code could not run.', logs: [], ms: ms() });
    };
    worker.postMessage({ code, mode: c.mode, fnName: c.fnName, tests: c.tests });
  });
}
