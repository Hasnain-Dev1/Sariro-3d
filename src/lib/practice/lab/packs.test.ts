import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';
import { ALL_CHALLENGES, PACKS, packOrder, challengeById, suggestedTier } from './packs';
import { buildPage } from './run-web';
import { isCode, type CodeChallenge, type WebChallenge } from './types';

/* Every runner the browser uses, loaded as-is — so these tests check the files
   that actually ship: the JS worker in a vm, the Python harness in CPython, the
   web checker in jsdom. */
const JS_RUNNER = readFileSync(join(process.cwd(), 'public/practice/code-runner.js'), 'utf8');
const PY_HARNESS = join(process.cwd(), 'public/practice/py-harness.py');
const WEB_CHECKER = readFileSync(join(process.cwd(), 'public/practice/web-checker.js'), 'utf8');

type Raw = { ok: boolean; results?: { pass: boolean; got?: string; error?: string }[]; error?: string };

function runJs(code: string, c: CodeChallenge): Raw {
  let out: Raw | null = null;
  const self: Record<string, unknown> = { postMessage: (m: Raw) => { out = m; } };
  vm.runInContext(JS_RUNNER, vm.createContext({ self, JSON, Math, Object, Array, Set, Map, String, Number, isNaN, RegExp, Infinity }));
  (self.onmessage as (e: { data: unknown }) => void)({ data: { code, mode: c.mode, fnName: c.fnName, tests: c.tests } });
  return JSON.parse(JSON.stringify(out!));
}

/** All Python runs in one CPython process: [{ code, mode, fnName, tests }] → [Raw]. */
function runPythonBatch(jobs: { code: string; mode: string; fnName?: string; tests: unknown[] }[]): Raw[] {
  const dir = mkdtempSync(join(tmpdir(), 'sariro-py-'));
  try {
    const input = join(dir, 'jobs.json');
    writeFileSync(input, JSON.stringify(jobs));
    const script = [
      'import json, sys',
      `exec(open(${JSON.stringify(PY_HARNESS)}, encoding="utf-8").read())`,
      `jobs = json.load(open(${JSON.stringify(input)}, encoding="utf-8"))`,
      'print(json.dumps([json.loads(run(j["code"], j["mode"], j.get("fnName") or "", json.dumps(j["tests"]))) for j in jobs]))',
    ].join('\n');
    const r = spawnSync('python', ['-c', script], { encoding: 'utf8', timeout: 120_000, maxBuffer: 64 * 1024 * 1024 });
    assert.equal(r.status, 0, r.stderr);
    return JSON.parse(r.stdout);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

function checkWeb(html: string, css: string, c: WebChallenge) {
  const dom = new JSDOM(buildPage(html, css), { runScripts: 'outside-only', pretendToBeVisual: true });
  dom.window.eval(WEB_CHECKER);
  const out = (dom.window as unknown as { sariroWebCheck: (d: Document, w: Window, c: unknown) => { pass: boolean; label: string; got?: string }[] })
    .sariroWebCheck(dom.window.document, dom.window as unknown as Window, c.checks);
  dom.window.close();
  return out;
}

describe('every challenge is well-formed', () => {
  test('ids are unique and every id resolves', () => {
    const ids = ALL_CHALLENGES.map((c) => c.id);
    assert.equal(new Set(ids).size, ids.length);
    for (const id of ids) assert.equal(challengeById(id)?.id, id);
  });
  test('each has a prompt, at least two hints, and a visible example', () => {
    for (const c of ALL_CHALLENGES) {
      assert.ok(c.prompt.length > 20, c.id);
      assert.ok(c.hints.length >= 2, `${c.id} needs two hints`);
      assert.ok(c.topic && c.title, c.id);
      if (isCode(c)) {
        assert.ok(c.tests.some((t) => t.visible), `${c.id} shows no example`);
        if (c.mode === 'function') assert.ok(c.fnName && c.starter.includes(c.fnName), `${c.id}: the starter must name ${c.fnName}`);
      } else {
        assert.ok(c.checks.length >= 1, c.id);
      }
    }
  });
  test('every pack has every tier it will be asked for', () => {
    for (const pack of Object.values(PACKS)) {
      for (const tier of [1, 2, 3] as const) assert.ok(pack.challenges.some((c) => c.tier === tier), `${pack.label} has no tier ${tier}`);
    }
  });
});

describe('JavaScript: every solution passes, every starter fails', () => {
  for (const c of PACKS.javascript.challenges as CodeChallenge[]) {
    test(c.id, () => {
      const good = runJs(c.solution, c);
      assert.equal(good.ok, true, `${c.id}: ${good.error}`);
      assert.ok(good.results!.every((r) => r.pass), `${c.id}: ${JSON.stringify(good.results)}`);
      const start = runJs(c.starter, c);
      assert.ok(!start.ok || start.results!.some((r) => !r.pass), `${c.id}: the starter already passes`);
    });
  }
});

describe('Python: every solution passes, every starter fails', () => {
  const list = PACKS.python.challenges as CodeChallenge[];
  const out = runPythonBatch(list.flatMap((c) => [
    { code: c.solution, mode: c.mode, fnName: c.fnName, tests: c.tests },
    { code: c.starter, mode: c.mode, fnName: c.fnName, tests: c.tests },
  ]));
  list.forEach((c, i) => {
    test(c.id, () => {
      const good = out[2 * i];
      const start = out[2 * i + 1];
      assert.equal(good.ok, true, `${c.id}: ${good.error}`);
      assert.ok(good.results!.every((r) => r.pass), `${c.id}: ${JSON.stringify(good.results)}`);
      assert.ok(!start.ok || start.results!.some((r) => !r.pass), `${c.id}: the starter already passes`);
    });
  });
});

describe('the Python harness', () => {
  const [syntax, name, printer, tuple, loop] = runPythonBatch([
    { code: 'def f(:\n  pass', mode: 'function', fnName: 'f', tests: [] },
    { code: 'def f(x):\n    return y', mode: 'function', fnName: 'f', tests: [{ args: [1], expected: 1 }] },
    { code: 'def f(x):\n    print(x)', mode: 'function', fnName: 'f', tests: [{ args: [3], expected: 3 }] },
    { code: 'def f():\n    return (1, 2)', mode: 'function', fnName: 'f', tests: [{ args: [], expected: [1, 2] }] },
    { code: 'print("a")\nprint("b")  ', mode: 'program', tests: [{ stdout: 'a\nb' }] },
  ]) as (Raw & { line?: number; logs?: string[] })[];
  test('a syntax error names its line', () => {
    assert.equal(syntax.ok, false);
    assert.match(syntax.error!, /SyntaxError/);
    assert.equal(syntax.line, 1);
  });
  test('an error inside the function names the line in main.py', () => {
    assert.match(name.results![0].error!, /NameError.*line 2/);
  });
  test('printing is captured, and printing is not returning', () => {
    assert.deepEqual(printer.logs, ['3']);
    assert.equal(printer.results![0].got, 'None');
  });
  test('a tuple answers a list test', () => assert.equal(tuple.results![0].pass, true));
  test('programs compare what they print, trailing spaces ignored', () => assert.equal(loop.results![0].pass, true));
});

describe('HTML & CSS: every solution passes, every starter fails', () => {
  for (const c of PACKS.web.challenges as WebChallenge[]) {
    test(c.id, () => {
      const good = checkWeb(c.solution.html, c.solution.css, c);
      assert.ok(good.every((r) => r.pass), `${c.id}: ${JSON.stringify(good.filter((r) => !r.pass))}`);
      const start = checkWeb(c.starter.html, c.starter.css, c);
      assert.ok(start.some((r) => !r.pass), `${c.id}: the starter already passes`);
    });
  }
});

describe('which pack a course opens on', () => {
  test('Python courses open on Python, web basics on HTML, the rest on JavaScript', () => {
    assert.equal(packOrder('python')[0], 'python');
    assert.equal(packOrder('data')[0], 'python');
    assert.equal(packOrder('web-basics')[0], 'web');
    assert.equal(packOrder('saas')[0], 'javascript');
    assert.equal(packOrder(null)[0], 'javascript');
    for (const t of ['python', 'web', 'java', 'scratch']) assert.equal(new Set(packOrder(t)).size, 3);
  });
  test('course levels suggest tiers 1–4', () => {
    assert.deepEqual([0, 1, 2, 3, 4, 9, null].map((l) => suggestedTier(l)), [1, 1, 2, 3, 4, 4, 1]);
  });
});
