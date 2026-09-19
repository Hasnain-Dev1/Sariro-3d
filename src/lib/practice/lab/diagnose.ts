import { formatValue } from './format';
import { isCode, type Challenge, type FnTest, type LabRun, type ProgramTest } from './types';

/**
 * SARIRO — Code Lab: the tutor's first look (pure, on the device)
 * ============================================================================
 * Before any AI — and when there is none — the lab reads a failed run the way a
 * teacher glancing over a shoulder would: "your function doesn't return
 * anything", "those differ only in capitals", "one too many — check where your
 * loop stops". It names the likely mistake and where to look; it never writes
 * the fix. Free, instant, and it works offline.
 */

export interface Note {
  tone: 'win' | 'nudge' | 'error';
  title: string;
  body: string;
}

const NOTHING = new Set(['None', 'undefined']);

function unquote(s: string): string | null {
  const m = /^(['"])([\s\S]*)\1$/.exec(s.trim());
  return m ? m[2] : null;
}

function errorNote(error: string, line: number | undefined, c: Challenge): Note {
  const lang = c.lang === 'python' ? 'Python' : 'JavaScript';
  const at = line ? ` on line ${line}` : '';
  const name = /(?:NameError: name '|ReferenceError: )([A-Za-z_$][\w$]*)/.exec(error)?.[1];
  if (/IndentationError|TabError|unindent|expected an indented block/.test(error)) {
    return { tone: 'error', title: `Check the indentation${at}`, body: 'Python uses spaces to know what belongs inside a `def`, `if` or loop. Indent those lines by 4 spaces, and keep lines at the same level lined up.' };
  }
  if (/SyntaxError/.test(error)) {
    return {
      tone: 'error',
      title: `${lang} couldn't read your code${at}`,
      body: c.lang === 'python'
        ? 'Look for a missing `:` at the end of a `def`, `if`, `for` or `while` line, a bracket or quote that is never closed, or `=` where you meant `==`.'
        : 'Look for a bracket, brace or quote that is opened but never closed, or a missing comma between items.',
    };
  }
  if (name) {
    return { tone: 'error', title: `\`${name}\` doesn't exist${at}`, body: `Check the spelling — capitals matter, so \`${name}\` and \`${name.toLowerCase() === name ? name.toUpperCase() : name.toLowerCase()}\` are different names. A variable also has to be created before you use it.` };
  }
  if (/no function called/.test(error)) {
    return { tone: 'error', title: 'The tests can\'t find your function', body: 'Keep the function\'s name exactly as the starter code has it — the tests call it by name.' };
  }
  if (/unsupported operand type\(s\) for \+: 'int' and 'str'|can only concatenate str \(not "int"\)|must be str, not int/.test(error)) {
    return { tone: 'error', title: `Text and a number can't be joined with +${at}`, body: 'Turn the number into text first with `str(...)`, or use an f-string: `f"I am {age}"`.' };
  }
  if (/EOFError|input\(\)/.test(error)) {
    return { tone: 'error', title: 'No need for input()', body: 'The tests give your function its values through its parameters. Use those instead of asking for input.' };
  }
  if (/IndexError|out of range/.test(error)) {
    return { tone: 'error', title: `An index is past the end${at}`, body: 'A list of n items has indexes 0 to n − 1. Check where your loop stops, and whether the list could be empty.' };
  }
  if (/Cannot read propert(y|ies) of (undefined|null)/.test(error)) {
    return { tone: 'error', title: `Something is undefined${at}`, body: 'You used `.something` on a value that is undefined — often an index past the end of an array, or a misspelt name.' };
  }
  if (/is not a function|object is not callable/.test(error)) {
    return { tone: 'error', title: `That isn't a function${at}`, body: 'You called something with `(...)` that is not a function. Check the name and what it holds.' };
  }
  if (/ZeroDivisionError|division by zero/.test(error)) {
    return { tone: 'error', title: `Divided by zero${at}`, body: 'What happens when the list is empty, or the count is 0? Handle that case before you divide.' };
  }
  if (/RecursionError|Maximum call stack/.test(error)) {
    return { tone: 'error', title: 'A function keeps calling itself', body: 'A function that calls itself needs a stopping case that returns without calling again.' };
  }
  return { tone: 'error', title: `Your code stopped with an error${at}`, body: error };
}

function programNote(printed: string, want: string, c: Challenge): Note {
  const say = c.lang === 'python' ? '`print(...)`' : '`console.log(...)`';
  const got = printed.replace(/\r/g, '').split('\n').map((l) => l.trimEnd());
  const exp = want.split('\n').map((l) => l.trimEnd());
  while (got.length && got[got.length - 1] === '') got.pop();
  if (!got.length) return { tone: 'nudge', title: 'Nothing was printed', body: `Your program ran but printed nothing. Use ${say} to print each line.` };
  for (let i = 0; i < Math.max(got.length, exp.length); i++) {
    if (got[i] === exp[i]) continue;
    if (got[i] === undefined) return { tone: 'nudge', title: `${exp.length - got.length} line${exp.length - got.length === 1 ? '' : 's'} missing`, body: `Everything printed so far is right. Next should come: \`${exp[i]}\`.` };
    if (exp[i] === undefined) return { tone: 'nudge', title: 'Too many lines', body: `The output should stop after line ${exp.length}, but yours goes on with \`${got[i]}\`. Check where your loop stops.` };
    if (got[i].toLowerCase() === exp[i].toLowerCase()) return { tone: 'nudge', title: `Line ${i + 1}: only the capitals differ`, body: `Expected \`${exp[i]}\`, you printed \`${got[i]}\`.` };
    if (got[i].replace(/\s+/g, '') === exp[i].replace(/\s+/g, '')) return { tone: 'nudge', title: `Line ${i + 1}: check the spaces`, body: `Expected \`${exp[i]}\`, you printed \`${got[i]}\`.` };
    return { tone: 'nudge', title: `Line ${i + 1} is different`, body: `Expected \`${exp[i]}\`, you printed \`${got[i]}\`.` };
  }
  return { tone: 'nudge', title: 'Almost', body: 'Compare your output with the expected output line by line.' };
}

function valueNote(expected: unknown, got: string, c: Challenge, code: string): Note {
  const ret = '`return`';
  if (NOTHING.has(got.trim()) && expected !== null) {
    const prints = c.lang === 'python' ? /\bprint\s*\(/.test(code) : /console\.log/.test(code);
    return {
      tone: 'nudge',
      title: `Your function gives back ${got.trim()}`,
      body: prints && !/\breturn\b/.test(code)
        ? `You print the answer, but the tests look at what the function RETURNS. Use ${ret} instead of printing.`
        : `The function finishes without returning a value. Every path through it needs a ${ret}.`,
    };
  }
  const text = unquote(got);
  if (typeof expected === 'number' && text !== null) {
    return { tone: 'nudge', title: 'That\'s text, not a number', body: `The test wants the number ${expected}, but your function returns the text ${got}. Return the number itself, without quotes${c.lang === 'python' ? ' or str()' : ''}.` };
  }
  if (typeof expected === 'string' && text === null && /^-?\d/.test(got)) {
    return { tone: 'nudge', title: 'That\'s a number, not text', body: `The test wants text, your function returns ${got}. ${c.lang === 'python' ? 'Turn it into text with `str(...)`.' : 'Turn it into text with `String(...)`.'}` };
  }
  if (typeof expected === 'string' && text !== null) {
    if (text.toLowerCase() === expected.toLowerCase()) return { tone: 'nudge', title: 'So close — only the capitals differ', body: `Expected "${expected}", got "${text}".` };
    if (text.replace(/[\s.,!?]/g, '') === expected.replace(/[\s.,!?]/g, '')) return { tone: 'nudge', title: 'Check the spaces and punctuation', body: `Expected "${expected}", got "${text}". Every space, comma and "!" counts.` };
  }
  if (typeof expected === 'number') {
    const n = Number(got);
    if (Number.isFinite(n) && Math.abs(n - expected) === 1) return { tone: 'nudge', title: 'Off by one', body: `Expected ${expected}, got ${got}. Check where a count starts (0 or 1?), and \`<\` against \`<=\` — or \`range(n)\` stopping before n.` };
    if (Number.isFinite(n) && Math.abs(n - expected) < 1 && !Number.isInteger(expected)) return { tone: 'nudge', title: 'Close — check the rounding', body: `Expected ${expected}, got ${got}.` };
  }
  if (Array.isArray(expected)) {
    const items = got.trim().startsWith('[') ? (got.match(/,/g)?.length ?? 0) + (got.trim() === '[]' ? 0 : 1) : null;
    if (items !== null && items !== expected.length && !/[[{].*[[{]/.test(got.slice(1))) {
      return { tone: 'nudge', title: items > expected.length ? 'Too many items' : 'Too few items', body: `The list should have ${expected.length} item${expected.length === 1 ? '' : 's'}, yours has ${items}. Check where your loop starts and stops.` };
    }
  }
  return { tone: 'nudge', title: 'Not quite yet', body: `For this test the answer should be \`${formatValue(expected, c.lang)}\`, and your code gave \`${got}\`. Walk through your code by hand with those inputs.` };
}

/** What the tutor says about a run. */
export function diagnose(c: Challenge, run: LabRun, code: string): Note {
  if (!run.ok) {
    if (run.timedOut) return { tone: 'error', title: 'Your code ran forever', body: 'It was stopped after a few seconds. Look for a loop whose condition never becomes false — a `while` where nothing changes, or a counter that never moves.' };
    return errorNote(run.error, run.line, c);
  }
  if (run.passed === run.total) return { tone: 'win', title: 'Every test passes!', body: 'Nicely done. Read your code once more — could it be shorter or clearer? Then take the next challenge.' };

  if (!isCode(c)) {
    const first = run.results.find((r) => !r.pass)!;
    return { tone: 'nudge', title: `Not yet: ${first.label}`, body: first.got ? `Right now: ${first.got}.` : 'Look at the page preview and your code side by side.' };
  }

  if (c.mode === 'program') {
    const first = run.results.find((r) => !r.pass)!;
    return programNote(first.got ?? '', (c.tests[first.index] as ProgramTest).stdout, c);
  }

  const failed = run.results.filter((r) => !r.pass);
  const visibleFail = failed.find((r) => !r.hidden);
  if (!visibleFail) {
    return { tone: 'nudge', title: 'The examples pass — a hidden test doesn\'t', body: 'Your code works for the examples but not every case. Think about the edges: an empty list or text, zero, negative numbers, capitals, repeats.' };
  }
  if (visibleFail.error) return errorNote(visibleFail.error, undefined, c);
  const test = c.tests[visibleFail.index] as FnTest;
  return valueNote(test.expected, visibleFail.got ?? '', c, code);
}
