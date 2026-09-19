/*
 * SARIRO — the Code Lab's HTML & CSS checker
 * ============================================================================
 * Loaded into the sandboxed preview frame with the learner's page
 * (lib/practice/lab/run-web.ts builds that page). It looks at the page the
 * browser actually built — elements, text, attributes and COMPUTED styles — so
 * `color: red`, `#f00` and `rgb(255, 0, 0)` are all the same right answer.
 *
 * The same file is loaded into jsdom by src/lib/practice/lab/packs.test.ts,
 * which checks that every web challenge's own solution passes.
 *
 *   sariroWebCheck(document, window, checks) → [{ pass, label, got }]
 */
'use strict';

(function (root) {
  function squash(t) {
    return String(t == null ? '' : t).replace(/\s+/g, ' ').trim().toLowerCase();
  }

  /* What the browser computes for `value` on a fresh element — the fair way
     to compare "red" with "rgb(255, 0, 0)" or "1rem" with "16px". */
  function computed(doc, win, prop, value) {
    var probe = doc.createElement('div');
    probe.style.setProperty(prop, String(value));
    (doc.body || doc.documentElement).appendChild(probe);
    var out = win.getComputedStyle(probe).getPropertyValue(prop);
    probe.parentNode.removeChild(probe);
    return squash(out || value);
  }

  function one(doc, win, c) {
    var all;
    try {
      all = doc.querySelectorAll(c.selector);
    } catch (e) {
      return { pass: false, label: c.label, got: 'this check is broken' };
    }
    var el = all[0];
    switch (c.expect) {
      case 'exists':
        return { pass: all.length > 0, label: c.label, got: all.length ? undefined : 'nothing matches ' + c.selector };
      case 'count': {
        var want = String(c.value);
        var atLeast = want.indexOf('>=') === 0;
        var n = Number(atLeast ? want.slice(2) : want);
        return { pass: atLeast ? all.length >= n : all.length === n, label: c.label, got: all.length + ' found' };
      }
      case 'text': {
        if (!el) return { pass: false, label: c.label, got: 'nothing matches ' + c.selector };
        var text = squash(el.textContent);
        return { pass: text.indexOf(squash(c.value)) >= 0, label: c.label, got: text ? '"' + text.slice(0, 60) + '"' : 'no text' };
      }
      case 'attr': {
        if (!el) return { pass: false, label: c.label, got: 'nothing matches ' + c.selector };
        var v = el.getAttribute(c.attr);
        var has = v != null && String(v).trim() !== '';
        var ok = has && (c.value == null || squash(v) === squash(c.value));
        return { pass: ok, label: c.label, got: has ? c.attr + '="' + v + '"' : 'no ' + c.attr };
      }
      case 'style': {
        if (!el) return { pass: false, label: c.label, got: 'nothing matches ' + c.selector };
        var got = squash(win.getComputedStyle(el).getPropertyValue(c.prop));
        return { pass: got === computed(doc, win, c.prop, c.value), label: c.label, got: c.prop + ': ' + (got || 'not set') };
      }
      default:
        return { pass: false, label: c.label, got: 'unknown check' };
    }
  }

  root.sariroWebCheck = function (doc, win, checks) {
    var out = [];
    for (var i = 0; i < (checks || []).length; i++) out.push(one(doc, win, checks[i]));
    return out;
  };
})(typeof self !== 'undefined' ? self : this);
