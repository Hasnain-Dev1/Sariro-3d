'use client';

import type { LabRun, TestResult, WebChallenge, WebCheck } from './types';

/**
 * SARIRO — Code Lab: building and checking an HTML & CSS page
 * ============================================================================
 * The learner's page is shown in an <iframe sandbox="allow-scripts"> — scripts
 * run, but in an opaque origin: no cookies, no storage, no reaching into the
 * lab. For a check, the same page is built in a hidden frame with
 * public/practice/web-checker.js at the end; it posts its results back tagged
 * with a one-time nonce, and anything else posting to the lab is ignored.
 */

const esc = (s: string) => s.replace(/<\/(script|style)/gi, '<\\/$1');

/** The page: the learner's HTML with their CSS in its head (whether they wrote a whole document or a fragment). */
export function buildPage(html: string, css: string, tail = ''): string {
  const style = `<style>\n${esc(css)}\n</style>`;
  let doc = html;
  if (!/<html[\s>]/i.test(doc)) doc = `<!DOCTYPE html>\n<html>\n<head><meta charset="utf-8"></head>\n<body>\n${doc}\n</body>\n</html>`;
  doc = /<\/head>/i.test(doc) ? doc.replace(/<\/head>/i, `${style}\n</head>`) : doc.replace(/<body[^>]*>/i, (m) => `${m}\n${style}`);
  if (tail) doc = /<\/body>/i.test(doc) ? doc.replace(/<\/body>(?![\s\S]*<\/body>)/i, `${tail}\n</body>`) : `${doc}\n${tail}`;
  return doc;
}

/*
 * The checker's source is fetched once and written INTO the frame. A
 * <script src> would not do: a sandboxed frame's origin is opaque, and the
 * CSP's 'self' never matches an opaque origin, so Chrome refuses the load.
 */
let checkerSource: Promise<string> | null = null;
function checker(): Promise<string> {
  checkerSource ??= fetch('/practice/web-checker.js').then((r) => (r.ok ? r.text() : Promise.reject(new Error(String(r.status))))).catch((e) => { checkerSource = null; throw e; });
  return checkerSource;
}

function checkerTail(source: string, checks: WebCheck[], nonce: string): string {
  const payload = JSON.stringify({ checks, nonce }).replace(/</g, '\\u003c');
  return `<script>${source.replace(/<\/script/gi, '<\\/script')}</script>
<script>
(function () {
  var p = ${payload};
  function go() {
    var results;
    try { results = self.sariroWebCheck(document, window, p.checks); } catch (e) { results = null; }
    parent.postMessage({ sariroLab: p.nonce, results: results }, '*');
  }
  if (document.readyState === 'complete') go(); else window.addEventListener('load', go);
})();
</script>`;
}

export async function runWeb(html: string, css: string, c: WebChallenge, timeoutMs = 4000): Promise<LabRun> {
  const started = performance.now();
  const ms = () => Math.round(performance.now() - started);
  const nonce = Math.random().toString(36).slice(2) + Date.now().toString(36);
  let source: string;
  try {
    source = await checker();
  } catch {
    return { ok: false, error: 'The checker could not load. Check your connection and run again.', logs: [], ms: ms() };
  }
  return new Promise((resolve) => {
    const frame = document.createElement('iframe');
    frame.setAttribute('sandbox', 'allow-scripts');
    frame.setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;
    frame.style.cssText = 'position:fixed;left:-10000px;top:0;width:800px;height:600px;border:0;visibility:hidden;';
    const done = (run: LabRun) => {
      clearTimeout(timer);
      window.removeEventListener('message', onMessage);
      frame.remove();
      resolve(run);
    };
    const onMessage = (e: MessageEvent) => {
      if (e.source !== frame.contentWindow || e.data?.sariroLab !== nonce) return;
      const raw = e.data.results as { pass: boolean; label: string; got?: string }[] | null;
      if (!Array.isArray(raw)) {
        done({ ok: false, error: 'The page could not be checked.', logs: [], ms: ms() });
        return;
      }
      const results: TestResult[] = raw.map((r, i) => ({ index: i, pass: !!r.pass, label: String(r.label), got: r.pass ? undefined : r.got }));
      done({ ok: true, results, logs: [], passed: results.filter((r) => r.pass).length, total: results.length, ms: ms() });
    };
    const timer = setTimeout(() => done({ ok: false, timedOut: true, error: 'The page took too long to load.', logs: [], ms: ms() }), timeoutMs);
    window.addEventListener('message', onMessage);
    frame.srcdoc = buildPage(html, css, checkerTail(source, c.checks, nonce));
    document.body.appendChild(frame);
  });
}
