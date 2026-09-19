/*
 * SARIRO — the coding practice room's runner (a Web Worker)
 * ============================================================================
 * Runs a learner's JavaScript against a kata's tests, off the page:
 *   · in a worker, so an endless loop freezes nothing — the page kills it
 *     after a few seconds (lib/practice/coding/run.ts);
 *   · with the network taken away before any learner code runs, so code typed
 *     into a practice box cannot call our APIs or anybody else's;
 *   · with console.log captured and shown back, capped.
 *
 * Plain JavaScript on purpose: it is served as a static file, and the same
 * file is loaded by katas.test.ts, so what the tests check is what runs.
 *
 * Message in:  { code, fnName, tests: [{ args, expected }] }            (a function)
 *            | { code, mode: 'program', tests: [{ stdout }] }         (a program)
 * Message out: { ok: true, results: [{ i, pass, got, error }], logs }
 *            | { ok: false, error, line, logs }
 *
 * `line` is the line of the learner's code an error came from, when the
 * engine says (the wrapper below adds three lines in front of their code).
 */
'use strict';

(function () {
  var g = typeof self !== 'undefined' ? self : this;
  /* Taken away on the global AND up its prototype chain, where a browser may
     define them — a shadowing own property alone leaves the prototype's copy
     one Object.getPrototypeOf away. */
  var NETWORK = ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'importScripts', 'indexedDB', 'caches', 'BroadcastChannel', 'WebTransport', 'Worker', 'SharedWorker'];
  var lock = function (obj, k) {
    try { Object.defineProperty(obj, k, { value: undefined, writable: false, configurable: false }); }
    catch (e) { try { obj[k] = undefined; } catch (e2) { /* read-only in some browsers */ } }
  };
  for (var o = Object.getPrototypeOf(g); o && o !== Object.prototype; o = Object.getPrototypeOf(o)) {
    NETWORK.forEach(function (k) { if (Object.prototype.hasOwnProperty.call(o, k)) lock(o, k); });
  }
  NETWORK.forEach(function (k) { lock(g, k); });

  /* A plain object from any realm: its prototype is an Object.prototype, whose
     own prototype is null. (Comparing to this realm's Object.prototype would
     reject objects that arrived from the page.) */
  function isPlain(o) {
    if (o === null || typeof o !== 'object' || Array.isArray(o)) return false;
    var p = Object.getPrototypeOf(o);
    return p === null || Object.getPrototypeOf(p) === null;
  }

  function deepEqual(a, b) {
    if (a === b) return true;
    if (typeof a === 'number' && typeof b === 'number') return (isNaN(a) && isNaN(b)) || Math.abs(a - b) < 1e-9;
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      for (var i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false;
      return true;
    }
    if (isPlain(a) && isPlain(b)) {
      var ka = Object.keys(a), kb = Object.keys(b);
      if (ka.length !== kb.length) return false;
      for (var j = 0; j < ka.length; j++) {
        if (!Object.prototype.hasOwnProperty.call(b, ka[j]) || !deepEqual(a[ka[j]], b[ka[j]])) return false;
      }
      return true;
    }
    return false;
  }

  function show(v) {
    if (v === undefined) return 'undefined';
    if (typeof v === 'function') return 'a function';
    if (typeof v === 'string') return JSON.stringify(v);
    try { return JSON.stringify(v); } catch (e) { return String(v); }
  }

  function clone(v) {
    return v === undefined ? v : JSON.parse(JSON.stringify(v));
  }

  var WRAPPER_LINES = 3;
  function lineOf(err) {
    var m = /<anonymous>:(\d+):\d+/.exec(String(err && err.stack || ''));
    if (!m) return undefined;
    var n = Number(m[1]) - WRAPPER_LINES;
    return n > 0 ? n : undefined;
  }
  function describe(err) {
    return (err && err.name ? err.name + ': ' : '') + (err && err.message ? err.message : String(err));
  }

  /* What a program printed, compared line by line, trailing spaces ignored. */
  function sameOutput(got, want) {
    var norm = function (t) { return String(t).replace(/\r/g, '').split('\n').map(function (l) { return l.replace(/\s+$/, ''); }).join('\n').replace(/\n+$/, ''); };
    return norm(got) === norm(want);
  }

  g.onmessage = function (event) {
    var data = event.data || {};
    var logs = [];
    var log = function () {
      if (logs.length >= 100) return;
      logs.push(Array.prototype.map.call(arguments, function (x) { return typeof x === 'string' ? x : show(x); }).join(' '));
    };
    var fakeConsole = { log: log, info: log, warn: log, error: log, table: log };

    if (data.mode === 'program') {
      try {
        new Function('console', '"use strict";\n' + String(data.code || ''))(fakeConsole);
      } catch (err) {
        g.postMessage({ ok: false, error: describe(err), line: lineOf(err), logs: logs });
        return;
      }
      var printed = logs.join('\n');
      g.postMessage({
        ok: true,
        logs: logs,
        results: (data.tests || []).map(function (t, i) { return { i: i, pass: sameOutput(printed, t.stdout), got: printed }; }),
      });
      return;
    }

    if (!/^[A-Za-z_$][\w$]*$/.test(String(data.fnName || ''))) {
      g.postMessage({ ok: false, error: 'This kata is broken (bad function name).', logs: logs });
      return;
    }

    var fn;
    try {
      fn = new Function('console', '"use strict";\n' + String(data.code || '') + '\n;return typeof ' + data.fnName + " === 'function' ? " + data.fnName + ' : undefined;')(fakeConsole);
    } catch (err) {
      g.postMessage({ ok: false, error: describe(err), line: lineOf(err), logs: logs });
      return;
    }
    if (typeof fn !== 'function') {
      g.postMessage({ ok: false, error: 'There is no function called ' + data.fnName + ' — keep its name exactly as given.', logs: logs });
      return;
    }

    var results = (data.tests || []).map(function (t, i) {
      try {
        var got = fn.apply(null, clone(t.args) || []);
        return { i: i, pass: deepEqual(got, t.expected), got: show(got) };
      } catch (err) {
        var line = lineOf(err);
        return { i: i, pass: false, error: describe(err) + (line ? ' (line ' + line + ')' : '') };
      }
    });
    g.postMessage({ ok: true, results: results, logs: logs });
  };
})();
