import type { LabLanguage } from './types';

/**
 * SARIRO — Code Lab: values written the way the learner's language writes them
 * ============================================================================
 * A Python learner should see `['a', 'b']`, `True` and `None`; a JavaScript
 * learner `["a", "b"]`, `true` and `null`. The Python runner already reports
 * what the learner's function returned with Python's own repr(); this writes
 * the tests' arguments and expected values to match.
 */

function py(v: unknown): string {
  if (v === null || v === undefined) return 'None';
  if (v === true) return 'True';
  if (v === false) return 'False';
  if (typeof v === 'string') return v.includes("'") && !v.includes('"') ? `"${v}"` : `'${v.replace(/'/g, "\\'")}'`;
  if (Array.isArray(v)) return `[${v.map(py).join(', ')}]`;
  if (typeof v === 'object') return `{${Object.entries(v as Record<string, unknown>).map(([k, x]) => `${py(k)}: ${py(x)}`).join(', ')}}`;
  return String(v);
}

function js(v: unknown): string {
  if (v === undefined) return 'undefined';
  if (typeof v === 'string') return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(js).join(', ')}]`;
  if (v && typeof v === 'object') {
    const entries = Object.entries(v as Record<string, unknown>);
    if (!entries.length) return '{}';
    return `{ ${entries.map(([k, x]) => `${/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)}: ${js(x)}`).join(', ')} }`;
  }
  return String(v);
}

export function formatValue(v: unknown, lang: LabLanguage): string {
  return lang === 'python' ? py(v) : js(v);
}

/** "say_hello('Ada')" */
export function callLabel(fnName: string, args: readonly unknown[], lang: LabLanguage): string {
  const text = `${fnName}(${args.map((a) => formatValue(a, lang)).join(', ')})`;
  return text.length > 90 ? `${text.slice(0, 87)}…)` : text;
}
