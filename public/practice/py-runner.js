/*
 * SARIRO — the Code Lab's Python runner (a Web Worker)
 * ============================================================================
 * Python in the browser, free, through Pyodide (CPython compiled to
 * WebAssembly), loaded once from jsDelivr and cached by the browser after that.
 *
 *   · it runs in a worker, so an endless loop freezes nothing — the page kills
 *     this worker after a few seconds (lib/practice/lab/run-python.ts) and
 *     starts a fresh one;
 *   · once Python is loaded, the network is taken away before any learner code
 *     runs, so code typed into the lab cannot call our APIs or anybody else's;
 *   · the tests are run by public/practice/py-harness.py — the same file the
 *     packs' tests run in CPython.
 *
 * Messages in:  { type: 'warm' }                                  load Python now
 *               { type: 'run', code, mode, fnName, tests }        run the tests
 * Messages out: { type: 'ready' } | { type: 'failed', error }
 *               { type: 'result', result }   (the harness's JSON, parsed)
 */
'use strict';

var PYODIDE = 'https://cdn.jsdelivr.net/npm/pyodide@0.29.5/';
var NETWORK = ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'importScripts', 'indexedDB', 'caches', 'BroadcastChannel', 'WebTransport', 'Worker', 'SharedWorker'];

function lockNetwork() {
  var lock = function (obj, k) {
    try { Object.defineProperty(obj, k, { value: undefined, writable: false, configurable: false }); }
    catch (e) { try { obj[k] = undefined; } catch (e2) { /* read-only */ } }
  };
  for (var o = self; o; o = Object.getPrototypeOf(o)) {
    NETWORK.forEach(function (k) { if (Object.prototype.hasOwnProperty.call(o, k)) lock(o, k); });
  }
  NETWORK.forEach(function (k) { lock(self, k); });
}

var booting = null;
function boot() {
  if (!booting) {
    booting = (async function () {
      importScripts(PYODIDE + 'pyodide.js');
      /* global loadPyodide */
      var py = await loadPyodide({ indexURL: PYODIDE });
      var harness = await (await fetch('/practice/py-harness.py')).text();
      py.runPython(harness);
      lockNetwork();
      return py;
    })();
  }
  return booting;
}

self.onmessage = async function (event) {
  var d = event.data || {};
  if (d.type === 'warm') {
    try { await boot(); self.postMessage({ type: 'ready' }); }
    catch (err) { self.postMessage({ type: 'failed', error: String((err && err.message) || err) }); }
    return;
  }
  var py;
  try {
    py = await boot();
  } catch (err) {
    self.postMessage({ type: 'result', result: { ok: false, error: 'Python could not load. Check your internet connection and try again.', logs: [] } });
    return;
  }
  try {
    var run = py.globals.get('run');
    var out = run(String(d.code || ''), d.mode === 'program' ? 'program' : 'function', String(d.fnName || ''), JSON.stringify(d.tests || []));
    run.destroy();
    self.postMessage({ type: 'result', result: JSON.parse(out) });
  } catch (err) {
    self.postMessage({ type: 'result', result: { ok: false, error: String((err && err.message) || err).split('\n').slice(-2).join(' ').trim(), logs: [] } });
  }
};
