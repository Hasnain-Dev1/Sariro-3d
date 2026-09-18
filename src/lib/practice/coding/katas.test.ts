import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import { KATAS, katasFor } from './katas';

/* The runner the browser uses, loaded as-is into a sandbox with a fake worker
   `self` — so these tests check the file that actually ships. */
const RUNNER = readFileSync(join(process.cwd(), 'public/practice/code-runner.js'), 'utf8');

type Out = { ok: boolean; results?: { pass: boolean; got?: string; error?: string }[]; error?: string; logs: string[] };

function run(code: string, fnName: string, tests: { args: unknown[]; expected: unknown }[]): Out {
  let out: Out | null = null;
  const self: Record<string, unknown> = { postMessage: (m: Out) => { out = m; }, fetch: () => 'network!' };
  const context = vm.createContext({ self, JSON, Math, Object, Array, Set, Map, String, Number, isNaN });
  vm.runInContext(RUNNER, context);
  (self.onmessage as (e: { data: unknown }) => void)({ data: { code, fnName, tests } });
  // A real worker's message is structured-cloned into the page's realm; this is the same.
  return JSON.parse(JSON.stringify(out!));
}

describe('the runner', () => {
  test('passes and fails tests, compares arrays and objects deeply', () => {
    const r = run('function f(a){ return { n: a, list: [a, a] }; }', 'f', [
      { args: [2], expected: { list: [2, 2], n: 2 } },
      { args: [3], expected: { n: 3, list: [3] } },
    ]);
    assert.equal(r.ok, true);
    assert.deepEqual(r.results!.map((x) => x.pass), [true, false]);
  });
  test('a syntax error is reported, not thrown', () => {
    const r = run('function f( { return 1 }', 'f', [{ args: [], expected: 1 }]);
    assert.equal(r.ok, false);
    assert.match(r.error!, /SyntaxError/);
  });
  test('a missing function is named', () => {
    const r = run('function g(){}', 'f', [{ args: [], expected: 1 }]);
    assert.match(r.error!, /no function called f/);
  });
  test('learner code has no network', () => {
    const r = run('function f(){ return typeof fetch; }', 'f', [{ args: [], expected: 'undefined' }]);
    assert.equal(r.results![0].pass, true);
  });
  test('console.log is captured', () => {
    const r = run('function f(){ console.log("hi", 2); return 1; }', 'f', [{ args: [], expected: 1 }]);
    assert.deepEqual(r.logs, ['hi 2']);
  });
  test('a thrown error fails that test only', () => {
    const r = run('function f(x){ if (x) throw new Error("boom"); return 0; }', 'f', [{ args: [1], expected: 0 }, { args: [0], expected: 0 }]);
    assert.equal(r.results![0].pass, false);
    assert.match(r.results![0].error!, /boom/);
    assert.equal(r.results![1].pass, true);
  });
  test('a test cannot be passed by mutating its arguments', () => {
    const r = run('function f(a){ a.push(9); return a.length; }', 'f', [{ args: [[1]], expected: 2 }, { args: [[1]], expected: 2 }]);
    assert.deepEqual(r.results!.map((x) => x.pass), [true, true]);
  });
});

describe('every kata', () => {
  test('ids are unique, each has visible tests and hidden ones', () => {
    assert.equal(new Set(KATAS.map((k) => k.id)).size, KATAS.length);
    for (const k of KATAS) {
      assert.ok(k.tests.some((t) => t.visible), `${k.id} has no visible test`);
      assert.ok(k.tests.some((t) => !t.visible), `${k.id} has no hidden test`);
    }
  });
  for (const kata of KATAS) {
    test(`${kata.id}: its solution passes every test, and the starter does not`, () => {
      const good = run(kata.solution, kata.fnName, kata.tests);
      assert.equal(good.ok, true, `${kata.id} solution: ${good.error}`);
      good.results!.forEach((r, i) => assert.equal(r.pass, true, `${kata.id} test ${i}: got ${r.got ?? r.error}`));
      const start = run(kata.starter, kata.fnName, kata.tests);
      const allPass = start.ok && start.results!.every((r) => r.pass);
      assert.equal(allPass, false, `${kata.id}: the starter already passes`);
    });
  }
  test('every level has katas, and each learner level gets some', () => {
    for (const lvl of [1, 2, 3, 4]) {
      assert.ok(KATAS.some((k) => k.level === lvl), `level ${lvl}`);
      assert.ok(katasFor(lvl).length >= 4, `katasFor(${lvl})`);
    }
  });
});
