/**
 * SARIRO — the coding practice room's katas
 * ============================================================================
 * A kata is one function to write, a set of tests it must pass, and the tests
 * a learner can see before running. Every kata ships with a reference solution,
 * and katas.test.ts runs each one through the same runner the browser uses —
 * so a kata whose own solution fails can never reach a child.
 *
 * Levels follow the coding courses: 1 Elementary · 2 Beginner · 3 Intermediate
 * · 4 Advanced. JavaScript first (it runs in every browser, free); Python comes
 * later through Pyodide.
 *
 * `kind: 'fix'` katas start with working-looking code that has one bug in it —
 * reading someone else's code is half of the job.
 */

export interface KataTest {
  args: unknown[];
  expected: unknown;
  /** Shown before running. Hidden tests catch hard-coded answers. */
  visible?: boolean;
}

export interface Kata {
  id: string;
  level: 1 | 2 | 3 | 4;
  kind: 'write' | 'fix';
  title: string;
  /** What to build, in plain words. */
  prompt: string;
  fnName: string;
  starter: string;
  tests: KataTest[];
  solution: string;
  hints: string[];
  /** Words from the coding syllabi this kata practises. */
  concepts: string[];
}

export const KATAS: Kata[] = [
  /* ── Level 1 · first steps ─────────────────────────────────────────────── */
  {
    id: 'coding:double', level: 1, kind: 'write', title: 'Double it', fnName: 'double',
    prompt: 'Write a function `double(n)` that returns n times two.',
    starter: 'function double(n) {\n  // your code here\n}\n',
    tests: [{ args: [4], expected: 8, visible: true }, { args: [0], expected: 0, visible: true }, { args: [-3], expected: -6 }, { args: [2.5], expected: 5 }],
    solution: 'function double(n) {\n  return n * 2;\n}\n',
    hints: ['`return` sends a value back out of the function.', 'Multiply with `*`.'],
    concepts: ['functions', 'variables', 'basics'],
  },
  {
    id: 'coding:is-even', level: 1, kind: 'write', title: 'Even or odd', fnName: 'isEven',
    prompt: 'Write `isEven(n)` that returns `true` when n is even and `false` when it is odd.',
    starter: 'function isEven(n) {\n  \n}\n',
    tests: [{ args: [4], expected: true, visible: true }, { args: [7], expected: false, visible: true }, { args: [0], expected: true }, { args: [-2], expected: true }, { args: [-5], expected: false }],
    solution: 'function isEven(n) {\n  return n % 2 === 0;\n}\n',
    hints: ['`%` gives the remainder after dividing.', 'An even number has remainder 0 when divided by 2.'],
    concepts: ['conditions', 'operators', 'basics'],
  },
  {
    id: 'coding:greet', level: 1, kind: 'write', title: 'Say hello', fnName: 'greet',
    prompt: 'Write `greet(name)` that returns the text `Hello, NAME!` — e.g. `greet("Asha")` gives `"Hello, Asha!"`.',
    starter: 'function greet(name) {\n  \n}\n',
    tests: [{ args: ['Asha'], expected: 'Hello, Asha!', visible: true }, { args: ['Sam'], expected: 'Hello, Sam!' }, { args: [''], expected: 'Hello, !' }],
    solution: 'function greet(name) {\n  return `Hello, ${name}!`;\n}\n',
    hints: ['Join text with `+`, or use a template string with backticks.', 'Do not forget the comma, the space and the "!".'],
    concepts: ['strings', 'basics', 'variables'],
  },
  {
    id: 'coding:bigger', level: 1, kind: 'write', title: 'The bigger one', fnName: 'bigger',
    prompt: 'Write `bigger(a, b)` that returns whichever number is larger (either if they are equal). Try it without `Math.max`.',
    starter: 'function bigger(a, b) {\n  \n}\n',
    tests: [{ args: [3, 9], expected: 9, visible: true }, { args: [10, 2], expected: 10, visible: true }, { args: [-1, -4], expected: -1 }, { args: [5, 5], expected: 5 }],
    solution: 'function bigger(a, b) {\n  if (a > b) return a;\n  return b;\n}\n',
    hints: ['An `if` can compare the two.', '`if (a > b) return a;`'],
    concepts: ['conditions', 'if', 'basics'],
  },
  {
    id: 'coding:sum-to', level: 1, kind: 'write', title: 'Add up to n', fnName: 'sumTo',
    prompt: 'Write `sumTo(n)` that adds every whole number from 1 to n. `sumTo(4)` is 1 + 2 + 3 + 4 = 10.',
    starter: 'function sumTo(n) {\n  let total = 0;\n  \n  return total;\n}\n',
    tests: [{ args: [4], expected: 10, visible: true }, { args: [1], expected: 1, visible: true }, { args: [10], expected: 55 }, { args: [0], expected: 0 }, { args: [100], expected: 5050 }],
    solution: 'function sumTo(n) {\n  let total = 0;\n  for (let i = 1; i <= n; i++) total += i;\n  return total;\n}\n',
    hints: ['A `for` loop can count from 1 to n.', 'Add each number to `total` as you go.'],
    concepts: ['loops', 'for', 'basics'],
  },
  {
    id: 'coding:fix-last', level: 1, kind: 'fix', title: 'Fix: the last item', fnName: 'last',
    prompt: '`last(list)` should return the last item of an array, but it returns `undefined`. Find the bug.',
    starter: 'function last(list) {\n  return list[list.length];\n}\n',
    tests: [{ args: [[1, 2, 3]], expected: 3, visible: true }, { args: [['a']], expected: 'a', visible: true }, { args: [[true, false]], expected: false }],
    solution: 'function last(list) {\n  return list[list.length - 1];\n}\n',
    hints: ['Arrays count from 0.', 'A list of 3 items has positions 0, 1 and 2.'],
    concepts: ['arrays', 'debugging', 'indexes'],
  },

  /* ── Level 2 · loops, strings and arrays ───────────────────────────────── */
  {
    id: 'coding:count-vowels', level: 2, kind: 'write', title: 'Count the vowels', fnName: 'countVowels',
    prompt: 'Write `countVowels(text)` that returns how many vowels (a, e, i, o, u — upper or lower case) are in the text.',
    starter: 'function countVowels(text) {\n  \n}\n',
    tests: [{ args: ['hello'], expected: 2, visible: true }, { args: ['SKY'], expected: 0, visible: true }, { args: ['Education'], expected: 5 }, { args: [''], expected: 0 }, { args: ['AEIOU aeiou'], expected: 10 }],
    solution: "function countVowels(text) {\n  let n = 0;\n  for (const ch of text.toLowerCase()) if ('aeiou'.includes(ch)) n++;\n  return n;\n}\n",
    hints: ['Loop over each character with `for (const ch of text)`.', 'Lower-case it first so "A" and "a" count the same.'],
    concepts: ['strings', 'loops'],
  },
  {
    id: 'coding:reverse', level: 2, kind: 'write', title: 'Backwards', fnName: 'reverse',
    prompt: 'Write `reverse(text)` that returns the text backwards: `reverse("code")` is `"edoc"`.',
    starter: 'function reverse(text) {\n  \n}\n',
    tests: [{ args: ['code'], expected: 'edoc', visible: true }, { args: ['a'], expected: 'a', visible: true }, { args: [''], expected: '' }, { args: ['racecar'], expected: 'racecar' }, { args: ['Hello World'], expected: 'dlroW olleH' }],
    solution: "function reverse(text) {\n  return text.split('').reverse().join('');\n}\n",
    hints: ['Build a new string by walking backwards through the old one.', "Or: split into letters, reverse the array, join it."],
    concepts: ['strings', 'arrays', 'loops'],
  },
  {
    id: 'coding:largest', level: 2, kind: 'write', title: 'The largest number', fnName: 'largest',
    prompt: 'Write `largest(numbers)` that returns the biggest number in a non-empty array — without `Math.max`.',
    starter: 'function largest(numbers) {\n  \n}\n',
    tests: [{ args: [[3, 9, 2]], expected: 9, visible: true }, { args: [[-5, -2, -9]], expected: -2, visible: true }, { args: [[7]], expected: 7 }, { args: [[1, 1, 1]], expected: 1 }],
    solution: 'function largest(numbers) {\n  let best = numbers[0];\n  for (const n of numbers) if (n > best) best = n;\n  return best;\n}\n',
    hints: ['Start by assuming the first number is the biggest.', 'Walk the rest; keep any number bigger than your current best.'],
    concepts: ['arrays', 'loops'],
  },
  {
    id: 'coding:fizzbuzz', level: 2, kind: 'write', title: 'FizzBuzz', fnName: 'fizzBuzz',
    prompt: 'Write `fizzBuzz(n)`: return "FizzBuzz" if n divides by 3 and 5, "Fizz" if only by 3, "Buzz" if only by 5, otherwise the number as text.',
    starter: 'function fizzBuzz(n) {\n  \n}\n',
    tests: [{ args: [3], expected: 'Fizz', visible: true }, { args: [10], expected: 'Buzz', visible: true }, { args: [15], expected: 'FizzBuzz', visible: true }, { args: [7], expected: '7' }, { args: [30], expected: 'FizzBuzz' }, { args: [9], expected: 'Fizz' }],
    solution: "function fizzBuzz(n) {\n  if (n % 15 === 0) return 'FizzBuzz';\n  if (n % 3 === 0) return 'Fizz';\n  if (n % 5 === 0) return 'Buzz';\n  return String(n);\n}\n",
    hints: ['Check the "both" case first.', '`String(n)` turns a number into text.'],
    concepts: ['conditions', 'operators'],
  },
  {
    id: 'coding:palindrome', level: 2, kind: 'write', title: 'Palindromes', fnName: 'isPalindrome',
    prompt: 'Write `isPalindrome(text)` — true if it reads the same backwards, ignoring case and spaces. "Never odd or even" is one.',
    starter: 'function isPalindrome(text) {\n  \n}\n',
    tests: [{ args: ['racecar'], expected: true, visible: true }, { args: ['Never odd or even'], expected: true, visible: true }, { args: ['hello'], expected: false }, { args: [''], expected: true }, { args: ['ab'], expected: false }],
    solution: "function isPalindrome(text) {\n  const t = text.toLowerCase().replace(/ /g, '');\n  return t === t.split('').reverse().join('');\n}\n",
    hints: ['Clean it first: lower case, spaces removed.', 'Then compare it with its reverse.'],
    concepts: ['strings', 'conditions'],
  },
  {
    id: 'coding:unique', level: 2, kind: 'write', title: 'No repeats', fnName: 'unique',
    prompt: 'Write `unique(list)` that returns a new array without duplicates, keeping the first time each value appears.',
    starter: 'function unique(list) {\n  \n}\n',
    tests: [{ args: [[1, 2, 2, 3, 1]], expected: [1, 2, 3], visible: true }, { args: [['a', 'b', 'a']], expected: ['a', 'b'], visible: true }, { args: [[]], expected: [] }, { args: [[5, 5, 5]], expected: [5] }],
    solution: 'function unique(list) {\n  return [...new Set(list)];\n}\n',
    hints: ['Keep a list of what you have already seen.', 'A `Set` only ever holds one of each value.'],
    concepts: ['arrays', 'sets'],
  },
  {
    id: 'coding:fix-average', level: 2, kind: 'fix', title: 'Fix: the average', fnName: 'average',
    prompt: '`average(numbers)` gives the wrong answer. Find the bug.',
    starter: 'function average(numbers) {\n  let sum = 0;\n  for (let i = 1; i < numbers.length; i++) {\n    sum += numbers[i];\n  }\n  return sum / numbers.length;\n}\n',
    tests: [{ args: [[2, 4, 6]], expected: 4, visible: true }, { args: [[10]], expected: 10, visible: true }, { args: [[1, 2]], expected: 1.5 }],
    solution: 'function average(numbers) {\n  let sum = 0;\n  for (let i = 0; i < numbers.length; i++) {\n    sum += numbers[i];\n  }\n  return sum / numbers.length;\n}\n',
    hints: ['Which item does the loop start at?', 'The first item is at position 0.'],
    concepts: ['loops', 'debugging', 'arrays'],
  },

  /* ── Level 3 · objects and algorithms ───────────────────────────────────── */
  {
    id: 'coding:word-count', level: 3, kind: 'write', title: 'Count the words', fnName: 'wordCount',
    prompt: 'Write `wordCount(text)` that returns an object counting each word (lower-cased, split on spaces). `wordCount("the cat the")` is `{ the: 2, cat: 1 }`.',
    starter: 'function wordCount(text) {\n  const counts = {};\n  \n  return counts;\n}\n',
    tests: [{ args: ['the cat the'], expected: { the: 2, cat: 1 }, visible: true }, { args: ['A a A'], expected: { a: 3 }, visible: true }, { args: [''], expected: {} }, { args: ['one two  three'], expected: { one: 1, two: 1, three: 1 } }],
    solution: "function wordCount(text) {\n  const counts = {};\n  for (const w of text.toLowerCase().split(' ')) {\n    if (!w) continue;\n    counts[w] = (counts[w] || 0) + 1;\n  }\n  return counts;\n}\n",
    hints: ['Split the text into words with `.split(" ")`.', 'Skip empty words (two spaces in a row make one).', '`counts[w] = (counts[w] || 0) + 1`'],
    concepts: ['objects', 'strings', 'loops'],
  },
  {
    id: 'coding:fibonacci', level: 3, kind: 'write', title: 'Fibonacci', fnName: 'fib',
    prompt: 'Write `fib(n)` returning the n-th Fibonacci number, where fib(0) = 0, fib(1) = 1, and each next one is the sum of the two before. It must be fast for n = 70.',
    starter: 'function fib(n) {\n  \n}\n',
    tests: [{ args: [0], expected: 0, visible: true }, { args: [1], expected: 1, visible: true }, { args: [10], expected: 55, visible: true }, { args: [20], expected: 6765 }, { args: [70], expected: 190392490709135 }],
    solution: 'function fib(n) {\n  let a = 0, b = 1;\n  for (let i = 0; i < n; i++) [a, b] = [b, a + b];\n  return a;\n}\n',
    hints: ['Keep just the last two numbers in two variables.', 'Recursion without memory is far too slow for 70.'],
    concepts: ['loops', 'algorithms', 'recursion'],
  },
  {
    id: 'coding:chunk', level: 3, kind: 'write', title: 'Chunks', fnName: 'chunk',
    prompt: 'Write `chunk(list, size)` that splits an array into groups of `size`. `chunk([1,2,3,4,5], 2)` is `[[1,2],[3,4],[5]]`.',
    starter: 'function chunk(list, size) {\n  \n}\n',
    tests: [{ args: [[1, 2, 3, 4, 5], 2], expected: [[1, 2], [3, 4], [5]], visible: true }, { args: [[1, 2, 3], 3], expected: [[1, 2, 3]], visible: true }, { args: [[], 2], expected: [] }, { args: [[1, 2, 3], 5], expected: [[1, 2, 3]] }],
    solution: 'function chunk(list, size) {\n  const out = [];\n  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));\n  return out;\n}\n',
    hints: ['Step through the array `size` at a time.', '`list.slice(i, i + size)` takes one group.'],
    concepts: ['arrays', 'loops'],
  },
  {
    id: 'coding:anagram', level: 3, kind: 'write', title: 'Anagrams', fnName: 'isAnagram',
    prompt: 'Write `isAnagram(a, b)`: true if the two words use exactly the same letters (ignore case). "Listen" and "Silent" are anagrams.',
    starter: 'function isAnagram(a, b) {\n  \n}\n',
    tests: [{ args: ['Listen', 'Silent'], expected: true, visible: true }, { args: ['cat', 'act'], expected: true, visible: true }, { args: ['cat', 'car'], expected: false }, { args: ['aab', 'abb'], expected: false }, { args: ['', ''], expected: true }],
    solution: "function isAnagram(a, b) {\n  const key = (s) => s.toLowerCase().split('').sort().join('');\n  return key(a) === key(b);\n}\n",
    hints: ['If you sort the letters of both words, anagrams become identical.', '`word.toLowerCase().replace(/ /g, "").split("").sort().join("")` gives a word\'s sorted letters.'],
    concepts: ['strings', 'sorting', 'arrays'],
  },
  {
    id: 'coding:names-by-age', level: 3, kind: 'write', title: 'Youngest first', fnName: 'namesByAge',
    prompt: 'Given an array of `{ name, age }`, return just the names, youngest first.',
    starter: 'function namesByAge(people) {\n  \n}\n',
    tests: [
      { args: [[{ name: 'Ria', age: 12 }, { name: 'Dev', age: 9 }, { name: 'Ali', age: 15 }]], expected: ['Dev', 'Ria', 'Ali'], visible: true },
      { args: [[]], expected: [], visible: true },
      { args: [[{ name: 'Zoe', age: 30 }, { name: 'Amy', age: 20 }]], expected: ['Amy', 'Zoe'] },
    ],
    solution: 'function namesByAge(people) {\n  return [...people].sort((a, b) => a.age - b.age).map((p) => p.name);\n}\n',
    hints: ['`.sort((a, b) => a.age - b.age)` sorts by age.', '`.map(p => p.name)` keeps only the names.'],
    concepts: ['objects', 'arrays', 'sorting', 'map'],
  },
  {
    id: 'coding:brackets', level: 3, kind: 'write', title: 'Balanced brackets', fnName: 'balanced',
    prompt: 'Write `balanced(text)` — true if every `(`, `[` and `{` is closed by the matching bracket in the right order. Other characters are ignored.',
    starter: 'function balanced(text) {\n  \n}\n',
    tests: [{ args: ['(a[b]{c})'], expected: true, visible: true }, { args: ['(]'], expected: false, visible: true }, { args: [''], expected: true }, { args: ['(()'], expected: false }, { args: ['{[()()]}'], expected: true }, { args: [')('], expected: false }],
    solution: "function balanced(text) {\n  const pairs = { ')': '(', ']': '[', '}': '{' };\n  const stack = [];\n  for (const ch of text) {\n    if ('([{'.includes(ch)) stack.push(ch);\n    else if (pairs[ch]) { if (stack.pop() !== pairs[ch]) return false; }\n  }\n  return stack.length === 0;\n}\n",
    hints: ['Use an array as a stack: push openers, pop on closers.', 'A closer must match the opener you pop.'],
    concepts: ['algorithms', 'stacks', 'strings'],
  },
  {
    id: 'coding:fix-count', level: 3, kind: 'fix', title: 'Fix: counting matches', fnName: 'countOf',
    prompt: '`countOf(list, value)` should count how many times `value` appears. It is always one too high or wrong — find it.',
    starter: 'function countOf(list, value) {\n  let n = 1;\n  for (const item of list) {\n    if (item = value) n++;\n  }\n  return n;\n}\n',
    tests: [{ args: [[1, 2, 1, 1], 1], expected: 3, visible: true }, { args: [[], 5], expected: 0, visible: true }, { args: [['a', 'b'], 'c'], expected: 0 }],
    solution: 'function countOf(list, value) {\n  let n = 0;\n  for (const item of list) {\n    if (item === value) n++;\n  }\n  return n;\n}\n',
    hints: ['There are two bugs.', '`=` sets a value; `===` compares.', 'What should the count start at?'],
    concepts: ['debugging', 'loops', 'conditions'],
  },

  /* ── Level 4 · real problems ───────────────────────────────────────────── */
  {
    id: 'coding:two-sum', level: 4, kind: 'write', title: 'Two sum', fnName: 'twoSum',
    prompt: 'Given numbers and a target, return the indexes `[i, j]` (i < j) of the two numbers that add to the target. There is exactly one answer. Aim for one pass.',
    starter: 'function twoSum(nums, target) {\n  \n}\n',
    tests: [{ args: [[2, 7, 11, 15], 9], expected: [0, 1], visible: true }, { args: [[3, 2, 4], 6], expected: [1, 2], visible: true }, { args: [[3, 3], 6], expected: [0, 1] }, { args: [[-1, 5, 8, 4], 3], expected: [0, 3] }],
    solution: 'function twoSum(nums, target) {\n  const seen = new Map();\n  for (let j = 0; j < nums.length; j++) {\n    const need = target - nums[j];\n    if (seen.has(need)) return [seen.get(need), j];\n    seen.set(nums[j], j);\n  }\n}\n',
    hints: ['For each number, the one you need is target − number.', 'A Map remembers where you saw each number.'],
    concepts: ['algorithms', 'maps', 'arrays'],
  },
  {
    id: 'coding:group-by', level: 4, kind: 'write', title: 'Group by', fnName: 'groupBy',
    prompt: 'Write `groupBy(list, key)` that groups objects by the value of `key`: returns an object whose keys are those values and whose values are arrays of the objects.',
    starter: 'function groupBy(list, key) {\n  \n}\n',
    tests: [
      { args: [[{ t: 'a', v: 1 }, { t: 'b', v: 2 }, { t: 'a', v: 3 }], 't'], expected: { a: [{ t: 'a', v: 1 }, { t: 'a', v: 3 }], b: [{ t: 'b', v: 2 }] }, visible: true },
      { args: [[], 'x'], expected: {}, visible: true },
      { args: [[{ n: 1, k: 'x' }, { n: 2, k: 'y' }, { n: 3, k: 'x' }, { n: 4, k: 'z' }], 'k'], expected: { x: [{ n: 1, k: 'x' }, { n: 3, k: 'x' }], y: [{ n: 2, k: 'y' }], z: [{ n: 4, k: 'z' }] } },
    ],
    solution: 'function groupBy(list, key) {\n  const out = {};\n  for (const item of list) (out[item[key]] ||= []).push(item);\n  return out;\n}\n',
    hints: ['`item[key]` reads a property whose name is in a variable.', 'Create the array the first time a group is seen.'],
    concepts: ['objects', 'arrays', 'data'],
  },
  {
    id: 'coding:binary-search', level: 4, kind: 'write', title: 'Binary search', fnName: 'search',
    prompt: 'Given a SORTED array and a value, return its index, or -1. Halve the search each step — no `indexOf`.',
    starter: 'function search(sorted, value) {\n  let lo = 0, hi = sorted.length - 1;\n  \n  return -1;\n}\n',
    tests: [{ args: [[1, 3, 5, 7, 9], 7], expected: 3, visible: true }, { args: [[1, 3, 5], 4], expected: -1, visible: true }, { args: [[], 1], expected: -1 }, { args: [[2], 2], expected: 0 }, { args: [[1, 2, 3, 4, 5, 6, 7, 8], 1], expected: 0 }, { args: [[1, 2, 3, 4, 5, 6, 7, 8], 8], expected: 7 }],
    solution: 'function search(sorted, value) {\n  let lo = 0, hi = sorted.length - 1;\n  while (lo <= hi) {\n    const mid = (lo + hi) >> 1;\n    if (sorted[mid] === value) return mid;\n    if (sorted[mid] < value) lo = mid + 1;\n    else hi = mid - 1;\n  }\n  return -1;\n}\n',
    hints: ['Look at the middle: too small → search the right half; too big → the left.', '`while (lo <= hi)`'],
    concepts: ['algorithms', 'searching'],
  },
  {
    id: 'coding:merge-intervals', level: 4, kind: 'write', title: 'Merge intervals', fnName: 'merge',
    prompt: 'Given intervals `[start, end]`, merge the overlapping ones and return them sorted by start. `[[1,3],[2,6],[8,10]]` → `[[1,6],[8,10]]`.',
    starter: 'function merge(intervals) {\n  \n}\n',
    tests: [{ args: [[[1, 3], [2, 6], [8, 10]]], expected: [[1, 6], [8, 10]], visible: true }, { args: [[[1, 4], [4, 5]]], expected: [[1, 5]], visible: true }, { args: [[]], expected: [] }, { args: [[[5, 7], [1, 2]]], expected: [[1, 2], [5, 7]] }, { args: [[[1, 10], [2, 3]]], expected: [[1, 10]] }],
    solution: 'function merge(intervals) {\n  const s = [...intervals].sort((a, b) => a[0] - b[0]);\n  const out = [];\n  for (const [a, b] of s) {\n    const last = out[out.length - 1];\n    if (last && a <= last[1]) last[1] = Math.max(last[1], b);\n    else out.push([a, b]);\n  }\n  return out;\n}\n',
    hints: ['Sort by start first.', 'Then an interval overlaps only the last one you kept.'],
    concepts: ['algorithms', 'sorting', 'arrays'],
  },
  {
    id: 'coding:roman', level: 4, kind: 'write', title: 'Roman numerals', fnName: 'fromRoman',
    prompt: 'Write `fromRoman(text)` converting a Roman numeral to a number: I 1, V 5, X 10, L 50, C 100, D 500, M 1000; a smaller one before a bigger one is subtracted (IV = 4).',
    starter: 'function fromRoman(text) {\n  \n}\n',
    tests: [{ args: ['III'], expected: 3, visible: true }, { args: ['IV'], expected: 4, visible: true }, { args: ['MCMXCIV'], expected: 1994 }, { args: ['LVIII'], expected: 58 }, { args: ['XL'], expected: 40 }],
    solution: "function fromRoman(text) {\n  const v = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };\n  let total = 0;\n  for (let i = 0; i < text.length; i++) {\n    const cur = v[text[i]], next = v[text[i + 1]] || 0;\n    total += cur < next ? -cur : cur;\n  }\n  return total;\n}\n",
    hints: ['Walk left to right, looking one letter ahead.', 'If the next letter is bigger, subtract this one.'],
    concepts: ['algorithms', 'strings', 'objects'],
  },
];

export const kataById = (id: string) => KATAS.find((k) => k.id === id) ?? null;

/** Katas for a learner's coding level: their level and the one below it, easiest first. */
export function katasFor(level: number): Kata[] {
  return KATAS.filter((k) => k.level <= Math.max(1, level) && k.level >= Math.max(1, level - 1)).sort((a, b) => a.level - b.level);
}
