'use client';

import { toLabRun, type RawRun } from './results';
import type { CodeChallenge, LabRun } from './types';

/**
 * SARIRO — Code Lab: running Python
 * ============================================================================
 * Python takes a few seconds to load the first time (Pyodide, from jsDelivr,
 * cached by the browser after that), so one worker is kept warm and reused.
 * A run that has not answered in time is killed with its worker — Python
 * cannot be interrupted from outside — and the next run starts a fresh one.
 */

export type PythonStatus = 'idle' | 'loading' | 'ready' | 'failed';

const LOAD_TIMEOUT_MS = 90_000;

class PythonRunner {
  private worker: Worker | null = null;
  private ready: Promise<boolean> | null = null;
  private listeners = new Set<(s: PythonStatus) => void>();
  status: PythonStatus = 'idle';

  onStatus(fn: (s: PythonStatus) => void): () => void {
    this.listeners.add(fn);
    fn(this.status);
    return () => { this.listeners.delete(fn); };
  }

  private set(s: PythonStatus) {
    this.status = s;
    for (const fn of this.listeners) fn(s);
  }

  /** Start loading Python now, so it is ready by the time the learner runs. */
  warm(): Promise<boolean> {
    if (this.ready) return this.ready;
    this.set('loading');
    const worker = new Worker('/practice/py-runner.js');
    this.worker = worker;
    this.ready = new Promise<boolean>((resolve) => {
      const timer = setTimeout(() => { finish(false); }, LOAD_TIMEOUT_MS);
      const finish = (ok: boolean) => {
        clearTimeout(timer);
        worker.removeEventListener('message', onMessage);
        this.set(ok ? 'ready' : 'failed');
        if (!ok) this.reset();
        resolve(ok);
      };
      const onMessage = (e: MessageEvent<{ type: string }>) => {
        if (e.data?.type === 'ready') finish(true);
        else if (e.data?.type === 'failed') finish(false);
      };
      worker.addEventListener('message', onMessage);
      worker.onerror = () => finish(false);
      worker.postMessage({ type: 'warm' });
    });
    return this.ready;
  }

  private reset() {
    this.worker?.terminate();
    this.worker = null;
    this.ready = null;
  }

  async run(code: string, c: CodeChallenge, timeoutMs = 5000): Promise<LabRun> {
    const ok = await this.warm();
    const worker = this.worker;
    if (!ok || !worker) {
      return { ok: false, error: 'Python could not load. Check your internet connection and run again.', logs: [], ms: 0 };
    }
    const started = performance.now();
    const ms = () => Math.round(performance.now() - started);
    return new Promise<LabRun>((resolve) => {
      const timer = setTimeout(() => {
        worker.removeEventListener('message', onMessage);
        this.reset();
        this.set('idle');
        resolve({ ok: false, timedOut: true, error: `Stopped after ${timeoutMs / 1000} seconds.`, logs: [], ms: ms() });
        void this.warm(); // a fresh Python for the next run
      }, timeoutMs);
      const onMessage = (e: MessageEvent<{ type: string; result?: RawRun }>) => {
        if (e.data?.type !== 'result') return;
        clearTimeout(timer);
        worker.removeEventListener('message', onMessage);
        resolve(toLabRun(c, e.data.result ?? { ok: false, error: 'No answer from Python.' }, ms()));
      };
      worker.addEventListener('message', onMessage);
      worker.postMessage({ type: 'run', code, mode: c.mode, fnName: c.fnName, tests: c.tests });
    });
  }
}

/** One Python per tab. */
export const python = typeof window !== 'undefined' ? new PythonRunner() : (null as unknown as PythonRunner);
