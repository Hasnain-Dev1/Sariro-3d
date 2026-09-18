/**
 * SARIRO — practice: reading an algebraic answer
 * ============================================================================
 * "2(x+3)", "2x + 6" and "6 + x*2" are the same answer. Comparing the text
 * would mark two of them wrong; expanding and normalising symbolically is a
 * computer-algebra system. Instead both expressions are EVALUATED at a handful
 * of random points: if they agree everywhere they are, for every purpose a
 * school answer has, the same expression.
 *
 * A small recursive-descent parser — no eval, nothing a child types can run.
 *
 *   numbers      3, 2.5, .5
 *   variables    single letters (x, y, t…), plus pi and e
 *   operators    + − × ÷ * / ^ ** and · ; unary minus
 *   implicit ×   2x, 3(x+1), (x+1)(x−1), 2pi
 *   functions    sqrt sin cos tan ln log abs exp
 */

export type Node =
  | { t: 'num'; v: number }
  | { t: 'var'; name: string }
  | { t: 'neg'; a: Node }
  | { t: 'bin'; op: '+' | '-' | '*' | '/' | '^'; a: Node; b: Node }
  | { t: 'fn'; name: string; a: Node };

const FUNCTIONS = new Set(['sqrt', 'sin', 'cos', 'tan', 'ln', 'log', 'abs', 'exp']);

type Tok = { k: 'num'; v: number } | { k: 'id'; v: string } | { k: 'op'; v: string } | { k: '('} | { k: ')' };

function tokenize(src: string): Tok[] {
  const s = src
    .replace(/[×·]/g, '*')
    .replace(/÷/g, '/')
    .replace(/[−–]/g, '-')
    .replace(/\*\*/g, '^')
    .replace(/π/g, 'pi')
    .replace(/√/g, 'sqrt');
  const out: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === ' ' || c === '\t') { i++; continue; }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      const text = s.slice(i, j);
      if ((text.match(/\./g) ?? []).length > 1 || text === '.') throw new Error(`Bad number "${text}"`);
      out.push({ k: 'num', v: Number(text) });
      i = j;
      continue;
    }
    if (/[a-zA-Z]/.test(c)) {
      let j = i;
      while (j < s.length && /[a-zA-Z]/.test(s[j])) j++;
      const word = s.slice(i, j).toLowerCase();
      // A function name, a constant, or a run of single-letter variables (xy = x·y).
      if (FUNCTIONS.has(word) || word === 'pi') out.push({ k: 'id', v: word });
      else for (const ch of word) out.push({ k: 'id', v: ch });
      i = j;
      continue;
    }
    if ('+-*/^'.includes(c)) { out.push({ k: 'op', v: c }); i++; continue; }
    if (c === '(' || c === '[') { out.push({ k: '(' }); i++; continue; }
    if (c === ')' || c === ']') { out.push({ k: ')' }); i++; continue; }
    throw new Error(`Unexpected "${c}"`);
  }
  return out;
}

export function parseExpr(src: string): Node {
  const toks = tokenize(src);
  let p = 0;
  const peek = () => toks[p];
  const eat = () => toks[p++];

  // expr := term (('+'|'-') term)*
  const expr = (): Node => {
    let node = term();
    while (peek()?.k === 'op' && ((peek() as { v: string }).v === '+' || (peek() as { v: string }).v === '-')) {
      const op = (eat() as { v: '+' | '-' }).v;
      node = { t: 'bin', op, a: node, b: term() };
    }
    return node;
  };
  // term := unary (('*'|'/') unary | implicit-factor)*
  const startsFactor = (tok: Tok | undefined) => !!tok && (tok.k === 'num' || tok.k === 'id' || tok.k === '(');
  const term = (): Node => {
    let node = unary();
    for (;;) {
      const tok = peek();
      if (tok?.k === 'op' && (tok.v === '*' || tok.v === '/')) {
        eat();
        node = { t: 'bin', op: tok.v, a: node, b: unary() };
      } else if (startsFactor(tok)) {
        node = { t: 'bin', op: '*', a: node, b: power() };
      } else break;
    }
    return node;
  };
  // unary := '-' unary | '+' unary | power
  const unary = (): Node => {
    const tok = peek();
    if (tok?.k === 'op' && tok.v === '-') { eat(); return { t: 'neg', a: unary() }; }
    if (tok?.k === 'op' && tok.v === '+') { eat(); return unary(); }
    return power();
  };
  // power := atom ('^' unary)?   (right-associative; -x^2 is -(x^2))
  const power = (): Node => {
    const base = atom();
    const tok = peek();
    if (tok?.k === 'op' && tok.v === '^') {
      eat();
      return { t: 'bin', op: '^', a: base, b: unary() };
    }
    return base;
  };
  const atom = (): Node => {
    const tok = eat();
    if (!tok) throw new Error('The answer ends too soon');
    if (tok.k === 'num') return { t: 'num', v: tok.v };
    if (tok.k === '(') {
      const inner = expr();
      if (eat()?.k !== ')') throw new Error('A bracket is not closed');
      return inner;
    }
    if (tok.k === 'id') {
      if (FUNCTIONS.has(tok.v)) {
        // sqrt(x), or sqrt x / sin x for the brave.
        return { t: 'fn', name: tok.v, a: peek()?.k === '(' ? atom() : power() };
      }
      if (tok.v === 'pi') return { t: 'num', v: Math.PI };
      if (tok.v === 'e') return { t: 'num', v: Math.E };
      return { t: 'var', name: tok.v };
    }
    throw new Error('That does not read as an expression');
  };

  const tree = expr();
  if (p < toks.length) throw new Error('Something extra at the end');
  return tree;
}

export function evaluate(node: Node, vars: Record<string, number>): number {
  switch (node.t) {
    case 'num': return node.v;
    case 'var': {
      if (!(node.name in vars)) throw new Error(`Unknown letter "${node.name}"`);
      return vars[node.name];
    }
    case 'neg': return -evaluate(node.a, vars);
    case 'fn': {
      const x = evaluate(node.a, vars);
      switch (node.name) {
        case 'sqrt': return Math.sqrt(x);
        case 'sin': return Math.sin(x);
        case 'cos': return Math.cos(x);
        case 'tan': return Math.tan(x);
        case 'ln': return Math.log(x);
        case 'log': return Math.log10(x);
        case 'abs': return Math.abs(x);
        case 'exp': return Math.exp(x);
      }
      throw new Error(`Unknown function ${node.name}`);
    }
    case 'bin': {
      const a = evaluate(node.a, vars);
      const b = evaluate(node.b, vars);
      switch (node.op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/': return a / b;
        case '^': return a ** b;
      }
    }
  }
}

/** The letters an expression uses. */
export function variablesOf(node: Node, out = new Set<string>()): Set<string> {
  if (node.t === 'var') out.add(node.name);
  else if (node.t === 'neg' || node.t === 'fn') variablesOf(node.a, out);
  else if (node.t === 'bin') { variablesOf(node.a, out); variablesOf(node.b, out); }
  return out;
}

/** Evaluate text, or null when it does not parse or uses a letter not given. */
export function evaluateText(src: string, vars: Record<string, number> = {}): number | null {
  try {
    const v = evaluate(parseExpr(src), vars);
    return Number.isFinite(v) ? v : null;
  } catch {
    return null;
  }
}

const close = (a: number, b: number) => Math.abs(a - b) <= 1e-7 * Math.max(1, Math.abs(a), Math.abs(b));

/**
 * Whether two expressions agree at `samples` random points (deterministic
 * points, so a verdict never flickers). Points where either side is undefined
 * (a division by zero, a square root of a negative) are skipped; if too few
 * points survive, they are not called equal.
 */
export function equivalent(a: string, b: string, samples = 8): { equal: boolean; error?: string } {
  let na: Node;
  let nb: Node;
  try { na = parseExpr(a); } catch (e) { return { equal: false, error: e instanceof Error ? e.message : 'Could not read that' }; }
  try { nb = parseExpr(b); } catch { return { equal: false, error: 'The expected answer did not parse' }; }
  const letters = [...new Set([...variablesOf(na), ...variablesOf(nb)])];
  let agreed = 0;
  for (let i = 0; i < samples * 3 && agreed < samples; i++) {
    const vars: Record<string, number> = {};
    letters.forEach((l, j) => { vars[l] = 0.37 + ((i * 7 + j * 13) % 17) * 0.41 - 2.9; });
    let va: number;
    let vb: number;
    try { va = evaluate(na, vars); vb = evaluate(nb, vars); } catch { return { equal: false, error: 'Uses a letter that is not in the question' }; }
    if (!Number.isFinite(va) || !Number.isFinite(vb)) continue;
    if (!close(va, vb)) return { equal: false };
    agreed++;
  }
  return { equal: agreed >= Math.min(samples, 3) };
}
