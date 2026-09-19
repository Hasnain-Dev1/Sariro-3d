import { KATAS } from '../../coding/katas';
import type { CodeChallenge, Tier } from '../types';

/**
 * SARIRO — Code Lab: the JavaScript pack
 * ============================================================================
 * The 25 katas the coding room shipped with (lib/practice/coding/katas.ts, ids
 * kept so nobody's progress moves), sorted into topics — plus first programs
 * that print, and more practice with strings, arrays and objects.
 */

const TOPIC: Record<string, string> = {
  'coding:double': 'Basics', 'coding:is-even': 'Basics', 'coding:greet': 'Strings', 'coding:bigger': 'Basics', 'coding:sum-to': 'Loops',
  'coding:fix-last': 'Debugging', 'coding:count-vowels': 'Strings', 'coding:reverse': 'Strings', 'coding:largest': 'Arrays',
  'coding:fizzbuzz': 'Loops', 'coding:palindrome': 'Strings', 'coding:unique': 'Arrays', 'coding:fix-average': 'Debugging',
  'coding:word-count': 'Objects', 'coding:fibonacci': 'Algorithms', 'coding:chunk': 'Arrays', 'coding:anagram': 'Strings',
  'coding:names-by-age': 'Objects', 'coding:brackets': 'Algorithms', 'coding:fix-count': 'Debugging', 'coding:two-sum': 'Algorithms',
  'coding:group-by': 'Objects', 'coding:binary-search': 'Algorithms', 'coding:merge-intervals': 'Algorithms', 'coding:roman': 'Algorithms',
};

const FROM_KATAS: CodeChallenge[] = KATAS.map((k) => ({
  id: k.id,
  lang: 'javascript',
  mode: 'function',
  title: k.title,
  tier: k.level as Tier,
  topic: TOPIC[k.id] ?? 'Practice',
  prompt: k.prompt,
  fnName: k.fnName,
  starter: k.starter,
  solution: k.solution,
  tests: k.tests,
  hints: k.hints,
}));

const MORE: CodeChallenge[] = [
  /* ── First programs: what they print ─────────────────────────────────── */
  {
    id: 'lab:js:hello', lang: 'javascript', mode: 'program', tier: 1, topic: 'First programs', title: 'Hello, World!',
    prompt: 'Every programmer\'s first program. Make it print exactly:\n\n`Hello, World!`',
    starter: '// console.log prints a line\n',
    solution: 'console.log("Hello, World!");\n',
    tests: [{ stdout: 'Hello, World!', visible: true }],
    hints: ['`console.log(...)` prints whatever is inside the brackets.', 'Text goes in quotes: `"Hello, World!"`.', 'Capital H, comma, space, capital W, exclamation mark.'],
  },
  {
    id: 'lab:js:count-to-five', lang: 'javascript', mode: 'program', tier: 1, topic: 'First programs', title: 'Count to five',
    prompt: 'Print the numbers 1 to 5, one on each line — with a loop, not five `console.log`s.',
    starter: 'for (let i = 1; i <= 5; i++) {\n  // print i\n}\n',
    solution: 'for (let i = 1; i <= 5; i++) {\n  console.log(i);\n}\n',
    tests: [{ stdout: '1\n2\n3\n4\n5', visible: true }],
    hints: ['The loop already counts 1 to 5 in `i`.', 'Put `console.log(i);` inside the loop.'],
  },
  {
    id: 'lab:js:countdown', lang: 'javascript', mode: 'program', tier: 1, topic: 'First programs', title: 'Countdown',
    prompt: 'Print 5, 4, 3, 2, 1 on separate lines, then `Liftoff!`',
    starter: '',
    solution: 'for (let i = 5; i >= 1; i--) {\n  console.log(i);\n}\nconsole.log("Liftoff!");\n',
    tests: [{ stdout: '5\n4\n3\n2\n1\nLiftoff!', visible: true }],
    hints: ['A loop can count down: start at 5 and use `i--`.', 'Keep going while `i >= 1`.', 'Print `Liftoff!` once, after the loop ends.'],
  },
  {
    id: 'lab:js:times-table', lang: 'javascript', mode: 'program', tier: 1, topic: 'First programs', title: 'The 7 times table',
    prompt: 'Print the 7 times table from 1 to 10, like this:\n\n`7 x 1 = 7`\n`7 x 2 = 14`\n…\n`7 x 10 = 70`',
    starter: '',
    solution: 'for (let i = 1; i <= 10; i++) {\n  console.log(`7 x ${i} = ${7 * i}`);\n}\n',
    tests: [{ stdout: Array.from({ length: 10 }, (_, i) => `7 x ${i + 1} = ${7 * (i + 1)}`).join('\n'), visible: true }],
    hints: ['Loop `i` from 1 to 10.', 'A template string builds the line: `` `7 x ${i} = ${7 * i}` ``.'],
  },
  {
    id: 'lab:js:triangle', lang: 'javascript', mode: 'program', tier: 2, topic: 'Loops', title: 'A triangle of stars',
    prompt: 'Print a triangle five rows tall — one star on the first row, five on the last:\n\n`*`\n`**`\n`***`\n`****`\n`*****`',
    starter: '',
    solution: 'for (let row = 1; row <= 5; row++) {\n  console.log("*".repeat(row));\n}\n',
    tests: [{ stdout: '*\n**\n***\n****\n*****', visible: true }],
    hints: ['One loop for the rows, 1 to 5.', '`"*".repeat(3)` makes `"***"`.'],
  },

  /* ── Functions ────────────────────────────────────────────────────────── */
  {
    id: 'lab:js:celsius', lang: 'javascript', mode: 'function', tier: 1, topic: 'Basics', title: 'Celsius to Fahrenheit', fnName: 'toFahrenheit',
    prompt: 'Write `toFahrenheit(c)`: multiply by 9, divide by 5, add 32. `toFahrenheit(100)` is `212`.',
    starter: 'function toFahrenheit(c) {\n  \n}\n',
    solution: 'function toFahrenheit(c) {\n  return c * 9 / 5 + 32;\n}\n',
    tests: [{ args: [100], expected: 212, visible: true }, { args: [0], expected: 32, visible: true }, { args: [-40], expected: -40 }, { args: [37], expected: 98.6 }],
    hints: ['Remember `return`.', '`c * 9 / 5 + 32`'],
  },
  {
    id: 'lab:js:evens', lang: 'javascript', mode: 'function', tier: 1, topic: 'Arrays', title: 'Only the evens', fnName: 'evens',
    prompt: 'Write `evens(nums)` that returns a new array with only the even numbers, in the same order.',
    starter: 'function evens(nums) {\n  \n}\n',
    solution: 'function evens(nums) {\n  return nums.filter((n) => n % 2 === 0);\n}\n',
    tests: [{ args: [[1, 2, 3, 4]], expected: [2, 4], visible: true }, { args: [[]], expected: [], visible: true }, { args: [[7, 9]], expected: [] }, { args: [[-2, 0, 5, 10]], expected: [-2, 0, 10] }],
    hints: ['`.filter(...)` keeps the items a test says yes to.', 'Even means `n % 2 === 0`.'],
  },
  {
    id: 'lab:js:initials', lang: 'javascript', mode: 'function', tier: 2, topic: 'Strings', title: 'Initials', fnName: 'initials',
    prompt: 'Write `initials(name)`: `initials("Ada Lovelace")` is `"A.L."`, `initials("grace brewster hopper")` is `"G.B.H."` — always capitals.',
    starter: 'function initials(name) {\n  \n}\n',
    solution: 'function initials(name) {\n  return name.split(" ").filter(Boolean).map((w) => w[0].toUpperCase() + ".").join("");\n}\n',
    tests: [{ args: ['Ada Lovelace'], expected: 'A.L.', visible: true }, { args: ['grace brewster hopper'], expected: 'G.B.H.', visible: true }, { args: ['Alan'], expected: 'A.' }, { args: ['  Tim   Berners  '], expected: 'T.B.' }],
    hints: ['`.split(" ")` breaks a name into words.', 'Extra spaces make empty words — `.filter(Boolean)` drops them.', 'Take `w[0].toUpperCase()`, add a dot, then `.join("")`.'],
  },
  {
    id: 'lab:js:title-case', lang: 'javascript', mode: 'function', tier: 2, topic: 'Strings', title: 'Title Case', fnName: 'titleCase',
    prompt: 'Write `titleCase(text)` that capitalises the first letter of every word and makes the rest lower case: `"hello wORLD"` → `"Hello World"`.',
    starter: 'function titleCase(text) {\n  \n}\n',
    solution: 'function titleCase(text) {\n  return text.split(" ").map((w) => w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w).join(" ");\n}\n',
    tests: [{ args: ['hello wORLD'], expected: 'Hello World', visible: true }, { args: [''], expected: '', visible: true }, { args: ['sARIRO'], expected: 'Sariro' }, { args: ['a b c'], expected: 'A B C' }],
    hints: ['Work word by word: `.split(" ")`, change each, `.join(" ")`.', '`w[0].toUpperCase()` + `w.slice(1).toLowerCase()`.'],
  },
  {
    id: 'lab:js:cart-total', lang: 'javascript', mode: 'function', tier: 2, topic: 'Objects', title: 'Cart total', fnName: 'cartTotal',
    prompt: 'A cart is a list of items like `{ name: "pen", price: 20, qty: 3 }`. Write `cartTotal(cart)` — the total of price × qty for every item.',
    starter: 'function cartTotal(cart) {\n  \n}\n',
    solution: 'function cartTotal(cart) {\n  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);\n}\n',
    tests: [{ args: [[{ name: 'pen', price: 20, qty: 3 }, { name: 'book', price: 150, qty: 1 }]], expected: 210, visible: true }, { args: [[]], expected: 0, visible: true }, { args: [[{ name: 'x', price: 0.5, qty: 4 }]], expected: 2 }],
    hints: ['Start a total at 0 and add each `item.price * item.qty`.', '`.reduce((sum, item) => …, 0)` does exactly that.'],
  },
  {
    id: 'lab:js:count-by', lang: 'javascript', mode: 'function', tier: 3, topic: 'Objects', title: 'Tally', fnName: 'tally',
    prompt: 'Write `tally(items)` that counts each item: `tally(["a", "b", "a"])` is `{ a: 2, b: 1 }`.',
    starter: 'function tally(items) {\n  \n}\n',
    solution: 'function tally(items) {\n  const out = {};\n  for (const x of items) out[x] = (out[x] || 0) + 1;\n  return out;\n}\n',
    tests: [{ args: [['a', 'b', 'a']], expected: { a: 2, b: 1 }, visible: true }, { args: [[]], expected: {}, visible: true }, { args: [['cat', 'cat', 'cat']], expected: { cat: 3 } }],
    hints: ['Start with an empty object `{}`.', 'For each item, add one to `out[item]` — starting from 0 if it is not there yet.'],
  },
  {
    id: 'lab:js:flatten', lang: 'javascript', mode: 'function', tier: 2, topic: 'Arrays', title: 'Flatten', fnName: 'flatten',
    prompt: 'Write `flatten(lists)` that joins a list of lists into one list: `[[1, 2], [3], []]` → `[1, 2, 3]`. Try it without `.flat()`.',
    starter: 'function flatten(lists) {\n  \n}\n',
    solution: 'function flatten(lists) {\n  const out = [];\n  for (const list of lists) for (const x of list) out.push(x);\n  return out;\n}\n',
    tests: [{ args: [[[1, 2], [3], []]], expected: [1, 2, 3], visible: true }, { args: [[]], expected: [], visible: true }, { args: [[['a'], ['b', 'c']]], expected: ['a', 'b', 'c'] }],
    hints: ['A loop inside a loop.', 'Push every item of every inner list onto one result list.'],
  },
  {
    id: 'lab:js:rotate', lang: 'javascript', mode: 'function', tier: 3, topic: 'Arrays', title: 'Rotate', fnName: 'rotate',
    prompt: 'Write `rotate(list, k)` that moves every item `k` places to the right, wrapping around: `rotate([1, 2, 3, 4, 5], 2)` → `[4, 5, 1, 2, 3]`. `k` can be bigger than the list.',
    starter: 'function rotate(list, k) {\n  \n}\n',
    solution: 'function rotate(list, k) {\n  if (!list.length) return [];\n  const s = k % list.length;\n  return list.slice(-s).concat(list.slice(0, list.length - s)).slice(0, list.length);\n}\n',
    tests: [{ args: [[1, 2, 3, 4, 5], 2], expected: [4, 5, 1, 2, 3], visible: true }, { args: [[1, 2, 3], 0], expected: [1, 2, 3], visible: true }, { args: [[1, 2, 3], 4], expected: [3, 1, 2] }, { args: [[], 3], expected: [] }],
    hints: ['Rotating by the length changes nothing — use `k % list.length`.', 'The last `k` items go to the front: `list.slice(-k)`.', 'Careful: `slice(-0)` is the whole list.'],
  },
  {
    id: 'lab:js:caesar', lang: 'javascript', mode: 'function', tier: 3, topic: 'Strings', title: 'Caesar cipher', fnName: 'caesar',
    prompt: 'Write `caesar(text, shift)` that moves every letter `shift` places along the alphabet, wrapping from z to a. Keep capitals capital; leave everything else alone. `caesar("abc xyz", 3)` → `"def abc"`.',
    starter: 'function caesar(text, shift) {\n  \n}\n',
    solution: 'function caesar(text, shift) {\n  return text.replace(/[a-z]/gi, (ch) => {\n    const base = ch <= "Z" ? 65 : 97;\n    return String.fromCharCode(((ch.charCodeAt(0) - base + shift) % 26 + 26) % 26 + base);\n  });\n}\n',
    tests: [{ args: ['abc xyz', 3], expected: 'def abc', visible: true }, { args: ['Hello, World!', 1], expected: 'Ifmmp, Xpsme!', visible: true }, { args: ['def', -3], expected: 'abc' }, { args: ['Zz', 27], expected: 'Aa' }],
    hints: ['`"a".charCodeAt(0)` is 97; `String.fromCharCode(97)` is `"a"`.', 'Subtract the base (97 or 65), add the shift, wrap with `% 26`, add the base back.', 'A negative shift needs `(x % 26 + 26) % 26`.'],
  },
  {
    id: 'lab:js:strong-password', lang: 'javascript', mode: 'function', tier: 3, topic: 'Security', title: 'Strong password?', fnName: 'isStrong',
    prompt: 'Write `isStrong(password)`: true when it has at least 8 characters, a capital letter, a small letter and a digit.',
    starter: 'function isStrong(password) {\n  \n}\n',
    solution: 'function isStrong(password) {\n  return password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password);\n}\n',
    tests: [{ args: ['Sariro2026'], expected: true, visible: true }, { args: ['password'], expected: false, visible: true }, { args: ['Short1A'], expected: false }, { args: ['ALLCAPS123'], expected: false }, { args: ['lower12345x'], expected: false }],
    hints: ['Check each rule separately and combine with `&&`.', '`/[A-Z]/.test(password)` asks "is there a capital?"'],
  },
  {
    id: 'lab:js:max-profit', lang: 'javascript', mode: 'function', tier: 4, topic: 'Algorithms', title: 'Best day to sell', fnName: 'maxProfit',
    prompt: '`prices[i]` is a share\'s price on day `i`. Buy on one day, sell on a LATER day. Write `maxProfit(prices)` — the most you can make (0 if you cannot make anything). One pass through the list is enough.',
    starter: 'function maxProfit(prices) {\n  \n}\n',
    solution: 'function maxProfit(prices) {\n  let low = Infinity;\n  let best = 0;\n  for (const p of prices) {\n    low = Math.min(low, p);\n    best = Math.max(best, p - low);\n  }\n  return best;\n}\n',
    tests: [{ args: [[7, 1, 5, 3, 6, 4]], expected: 5, visible: true }, { args: [[7, 6, 4, 3, 1]], expected: 0, visible: true }, { args: [[]], expected: 0 }, { args: [[2, 4, 1, 7]], expected: 6 }],
    hints: ['Remember the cheapest price seen so far.', 'Each day, selling today earns `price - cheapest`. Keep the best.'],
  },
];

export const JAVASCRIPT: CodeChallenge[] = [...MORE.filter((c) => c.topic === 'First programs'), ...FROM_KATAS, ...MORE.filter((c) => c.topic !== 'First programs')];
