import { defineTopic, fmt, paren, round, signed, choice } from '../topic-kit';
import { gcd, lcm, frac, add, sub, mul, div, formatFraction } from '../fraction';
import type { Topic } from '../types';
import { MATHS_EXTRA } from './topics-extra';

/**
 * SARIRO — the maths practice room's questions, Grade 1 to Grade 12
 * ============================================================================
 * Each topic makes endless questions from a seed, marks them exactly, and says
 * how to do them. Difficulty 1 → 3 widens the numbers and adds the awkward
 * cases (carrying, negatives, unlike denominators) as a topic is learned.
 *
 * `keywords` are words that appear in the syllabus's module and lesson titles
 * (lib/school/curriculum.ts): a lesson titled "Adding fractions with different
 * denominators" in module "Fractions" picks the fraction topics, which is how
 * the room opens on the week's lesson.
 */

const D = (d: number, easy: number, mid: number, hard: number) => (d === 1 ? easy : d === 2 ? mid : hard);

/** "x² − 3x + 2" from [[1, 'x²'], [-3, 'x'], [2, '']] — zero terms left out. */
function poly(terms: [number, string][]): string {
  const out = terms
    .filter(([c]) => c !== 0)
    .map(([c, v], i) => {
      const mag = Math.abs(c) === 1 && v ? '' : String(Math.abs(c));
      const sign = i === 0 ? (c < 0 ? '−' : '') : c < 0 ? ' − ' : ' + ';
      return `${sign}${mag}${v}`;
    })
    .join('');
  return out || '0';
}

const CORE: Topic[] = [
  /* ── Grades 1–3 ─────────────────────────────────────────────────────────── */
  defineTopic('maths', 'add-within-20', 'Adding small numbers', [1, 2], ['adding', 'add', 'addition', 'numbers to twenty'], (r, d) => {
    const top = D(d, 10, 15, 20);
    const a = r.int(1, top - 1);
    const b = r.int(1, top - a);
    return {
      prompt: `${a} + ${b} = ?`,
      answer: { kind: 'number', value: a + b },
      answerText: String(a + b),
      hints: [`Start at ${Math.max(a, b)} and count on ${Math.min(a, b)} more.`, `Make ten first if you can.`],
      solution: `Start at ${Math.max(a, b)}, count on ${Math.min(a, b)}: ${a + b}.`,
    };
  }),
  defineTopic('maths', 'subtract-within-20', 'Taking away', [1, 2], ['taking away', 'subtract', 'subtraction', 'take away'], (r, d) => {
    const a = r.int(D(d, 5, 10, 12), D(d, 10, 18, 20));
    const b = r.int(1, a - 1);
    return {
      prompt: `${a} − ${b} = ?`,
      answer: { kind: 'number', value: a - b },
      answerText: String(a - b),
      hints: [`Start at ${b} and count up to ${a}.`, `How many steps did that take?`],
      solution: `From ${b} up to ${a} is ${a - b} steps, so ${a} − ${b} = ${a - b}.`,
    };
  }),
  defineTopic('maths', 'number-bonds', 'Number bonds', [1, 2], ['number bonds', 'numbers to twenty', 'adding', 'make ten'], (r, d) => {
    const target = r.pick(D(d, 1, 2, 3) === 1 ? [10] : d === 2 ? [10, 20] : [20, 50, 100]);
    const a = r.int(1, target - 1);
    return {
      prompt: `${a} + ? = ${target}`,
      answer: { kind: 'number', value: target - a },
      answerText: String(target - a),
      hints: [`Count on from ${a} to ${target}.`],
      solution: `${a} + ${target - a} = ${target}.`,
    };
  }),
  defineTopic('maths', 'compare-numbers', 'Bigger or smaller', [1, 3], ['numbers to twenty', 'numbers to a hundred', 'compare', 'place value', 'numbers to a thousand'], (r, d) => {
    const hi = D(d, 20, 100, 1000);
    const a = r.int(0, hi);
    const b = r.chance(0.15) ? a : r.int(0, hi);
    const sign = a > b ? '>' : a < b ? '<' : '=';
    const c = choice(r, sign, ['>', '<', '='].filter((x) => x !== sign));
    return {
      prompt: `Which sign goes in the box?  ${a} ☐ ${b}`,
      ...c,
      hints: ['> means "is bigger than", < means "is smaller than".', 'The open mouth eats the bigger number.'],
      solution: `${a} ${sign} ${b}.`,
    };
  }),
  defineTopic('maths', 'add-two-digit', 'Adding bigger numbers', [2, 4], ['addition', 'adding', 'add', 'numbers to a hundred', 'numbers to a thousand'], (r, d) => {
    const hi = D(d, 50, 99, 999);
    const a = r.int(10, hi);
    const b = r.int(10, hi);
    const carry = (a % 10) + (b % 10) >= 10;
    return {
      prompt: `${a} + ${b} = ?`,
      answer: { kind: 'number', value: a + b },
      answerText: String(a + b),
      hints: ['Add the ones first, then the tens.', carry ? 'The ones make more than 9 — carry one ten across.' : 'No carrying needed this time.'],
      solution: `Ones: ${a % 10} + ${b % 10} = ${(a % 10) + (b % 10)}${carry ? ', write the ones digit and carry 1' : ''}. Then the rest: ${a} + ${b} = ${a + b}.`,
    };
  }),
  defineTopic('maths', 'subtract-two-digit', 'Subtracting bigger numbers', [2, 4], ['subtraction', 'taking away', 'subtract'], (r, d) => {
    const hi = D(d, 60, 99, 999);
    const a = r.int(20, hi);
    const b = r.int(10, a - 1);
    const borrow = a % 10 < b % 10;
    return {
      prompt: `${a} − ${b} = ?`,
      answer: { kind: 'number', value: a - b },
      answerText: String(a - b),
      hints: ['Take away the ones first, then the tens.', borrow ? `You cannot take ${b % 10} from ${a % 10} — borrow a ten.` : 'No borrowing needed.'],
      solution: `${a} − ${b} = ${a - b}. Check: ${a - b} + ${b} = ${a}.`,
    };
  }),
  defineTopic('maths', 'place-value', 'Place value', [1, 6], ['place value', 'numbers to', 'numbers and place value', 'large numbers'], (r, d) => {
    const digits = D(d, 3, 4, 6);
    const n = r.int(10 ** (digits - 1), 10 ** digits - 1);
    const s = String(n);
    const pos = r.int(0, s.length - 1);
    const digit = Number(s[pos]);
    const place = 10 ** (s.length - 1 - pos);
    const names: Record<number, string> = { 1: 'ones', 10: 'tens', 100: 'hundreds', 1000: 'thousands', 10000: 'ten-thousands', 100000: 'hundred-thousands' };
    if (digit === 0) {
      return {
        prompt: `In ${fmt(n)}, what is the digit in the ${names[place]} place?`,
        answer: { kind: 'number', value: 0 },
        answerText: '0',
        hints: ['Count places from the right: ones, tens, hundreds…'],
        solution: `The ${names[place]} digit of ${fmt(n)} is 0.`,
      };
    }
    return {
      prompt: `In ${fmt(n)}, what is the digit ${digit} in the ${names[place]} place worth?`,
      answer: { kind: 'number', value: digit * place },
      answerText: String(digit * place),
      hints: ['Count places from the right: ones, tens, hundreds…', `A digit in the ${names[place]} place is worth digit × ${fmt(place)}.`],
      solution: `${digit} × ${fmt(place)} = ${fmt(digit * place)}.`,
    };
  }),
  defineTopic('maths', 'times-tables', 'Times tables', [2, 5], ['multiplication', 'times', 'multiply', 'tables'], (r, d) => {
    const a = r.int(2, D(d, 5, 10, 12));
    const b = r.int(2, D(d, 10, 12, 12));
    return {
      prompt: `${a} × ${b} = ?`,
      answer: { kind: 'number', value: a * b },
      answerText: String(a * b),
      hints: [`That is ${b} groups of ${a}.`, `${a} × ${b - 1} = ${a * (b - 1)} — add one more ${a}.`],
      solution: `${a} × ${b} = ${a * b}.`,
    };
  }),
  defineTopic('maths', 'division-facts', 'Division facts', [3, 5], ['division', 'divide', 'sharing'], (r, d) => {
    const b = r.int(2, D(d, 5, 10, 12));
    const q = r.int(2, D(d, 10, 12, 15));
    const a = b * q;
    return {
      prompt: `${a} ÷ ${b} = ?`,
      answer: { kind: 'number', value: q },
      answerText: String(q),
      hints: [`Which number times ${b} makes ${a}?`, `Use the ${b} times table.`],
      solution: `${b} × ${q} = ${a}, so ${a} ÷ ${b} = ${q}.`,
    };
  }),
  defineTopic('maths', 'elapsed-time', 'Time: when does it end?', [2, 5], ['time', 'clock', 'time and money'], (r, d) => {
    const h = r.int(1, 11);
    const m = r.pick(D(d, 1, 2, 3) === 1 ? [0, 30] : [0, 15, 30, 45, 10, 20, 40, 50]);
    const len = D(d, 1, 2, 3) === 1 ? r.pick([15, 30, 60]) : r.int(2, 11) * 5 + (d === 3 ? 60 : 0);
    const total = h * 60 + m + len;
    const eh = ((Math.floor(total / 60) - 1) % 12) + 1;
    const em = total % 60;
    const t = (hh: number, mm: number) => `${hh}:${String(mm).padStart(2, '0')}`;
    return {
      prompt: `A lesson starts at ${t(h, m)} and lasts ${len} minutes. What time does it end? (write it like 4:35)`,
      answer: { kind: 'text', accept: [t(eh, em)] },
      answerText: t(eh, em),
      hints: [`Add the minutes to ${m}.`, 'If the minutes go past 60, move on one hour.'],
      solution: `${t(h, m)} + ${len} minutes = ${t(eh, em)}.`,
    };
  }),

  /* ── Grades 3–6 ─────────────────────────────────────────────────────────── */
  defineTopic('maths', 'multiply-multi-digit', 'Long multiplication', [4, 6], ['multiplication', 'multiply', 'multiplication and division'], (r, d) => {
    const a = r.int(D(d, 12, 23, 123), D(d, 49, 99, 999));
    const b = r.int(D(d, 3, 12, 12), D(d, 9, 49, 99));
    return {
      prompt: `${a} × ${b} = ?`,
      answer: { kind: 'number', value: a * b },
      answerText: String(a * b),
      hints: [b >= 10 ? `Split ${b} into ${Math.floor(b / 10) * 10} + ${b % 10}.` : `Split ${a} into tens and ones.`, 'Multiply each part, then add.'],
      solution: b >= 10
        ? `${a} × ${Math.floor(b / 10) * 10} = ${a * Math.floor(b / 10) * 10}; ${a} × ${b % 10} = ${a * (b % 10)}; total ${a * b}.`
        : `${a} × ${b} = ${a * b}.`,
    };
  }),
  defineTopic('maths', 'long-division', 'Long division', [5, 7], ['division', 'divide', 'multiplication and division'], (r, d) => {
    const b = r.int(D(d, 3, 6, 12), D(d, 9, 12, 25));
    const q = r.int(D(d, 12, 25, 40), D(d, 50, 150, 400));
    return {
      prompt: `${fmt(b * q)} ÷ ${b} = ?`,
      answer: { kind: 'number', value: q },
      answerText: String(q),
      hints: [`How many ${b}s go into the first digits?`, 'Divide, multiply, subtract, bring down — then repeat.'],
      solution: `${b} × ${q} = ${fmt(b * q)}, so the answer is ${q}.`,
    };
  }),
  defineTopic('maths', 'fraction-of-amount', 'A fraction of an amount', [3, 6], ['fractions', 'fraction of'], (r, d) => {
    const den = r.pick(D(d, 1, 2, 3) === 1 ? [2, 4, 5, 10] : [3, 4, 5, 6, 8, 10]);
    const num = r.int(1, den - 1);
    const amount = den * r.int(2, D(d, 6, 12, 25));
    const ans = (amount / den) * num;
    return {
      prompt: `What is ${num}/${den} of ${amount}?`,
      answer: { kind: 'number', value: ans },
      answerText: String(ans),
      hints: [`First find 1/${den} of ${amount}: divide by ${den}.`, `Then multiply by ${num}.`],
      solution: `${amount} ÷ ${den} = ${amount / den}; × ${num} = ${ans}.`,
    };
  }),
  defineTopic('maths', 'simplify-fraction', 'Simplifying fractions', [4, 7], ['fractions', 'equivalent fractions', 'simplify', 'simplest form'], (r, d) => {
    const den0 = r.int(2, D(d, 6, 10, 15));
    const num0 = r.int(1, den0 - 1);
    const base = frac(num0, den0);
    const k = r.int(2, D(d, 4, 6, 9));
    const n = base.num * k;
    const dd = base.den * k;
    return {
      prompt: `Write ${n}/${dd} in its simplest form.`,
      answer: { kind: 'number', value: base.num / base.den, fraction: true, simplest: true },
      answerText: formatFraction(base),
      inputHint: 'as a fraction, like 3/4',
      hints: [`Find a number that divides both ${n} and ${dd}.`, `The biggest one is ${gcd(n, dd)}.`],
      solution: `Divide top and bottom by ${gcd(n, dd)}: ${n}/${dd} = ${formatFraction(base)}.`,
    };
  }),
  defineTopic('maths', 'fraction-add-sub', 'Adding and subtracting fractions', [5, 8], ['fractions', 'adding fractions', 'fraction', 'rational numbers'], (r, d) => {
    const pickDen = () => r.pick(D(d, 1, 2, 3) === 1 ? [2, 4, 8] : [2, 3, 4, 5, 6, 8, 10, 12]);
    let d1 = pickDen();
    const d2 = d === 1 ? d1 : pickDen();
    if (d === 1) d1 = d2;
    // Shown as dealt (2/4 stays 2/4): an easy question keeps its same bottoms.
    const a = { num: r.int(1, d1 - 1), den: d1 };
    const b = { num: r.int(1, d2 - 1), den: d2 };
    const minus = d >= 2 && r.chance(0.5);
    const [x, y] = minus && a.num / a.den < b.num / b.den ? [b, a] : [a, b];
    const res = minus ? sub(frac(x.num, x.den), frac(y.num, y.den)) : add(frac(x.num, x.den), frac(y.num, y.den));
    const common = lcm(x.den, y.den);
    return {
      prompt: `${x.num}/${x.den} ${minus ? '−' : '+'} ${y.num}/${y.den} = ?`,
      answer: { kind: 'number', value: res.num / res.den, fraction: true, simplest: true },
      answerText: formatFraction(res),
      inputHint: 'as a fraction in simplest form, like 5/6',
      hints: [x.den === y.den ? 'Same bottom — just add or take the tops.' : `Make the bottoms the same: ${common}.`, 'Simplify at the end.'],
      solution: `${x.num * (common / x.den)}/${common} ${minus ? '−' : '+'} ${y.num * (common / y.den)}/${common} = ${formatFraction(res)}.`,
    };
  }),
  defineTopic('maths', 'fraction-multiply-divide', 'Multiplying and dividing fractions', [6, 8], ['fractions', 'multiplying fractions', 'dividing fractions', 'rational numbers'], (r, d) => {
    const mk = () => { const den = r.int(2, D(d, 5, 9, 12)); return frac(r.int(1, den + (d === 3 ? 4 : -1)), den); };
    const a = mk();
    const b = mk();
    const divide = r.chance(0.5);
    const res = divide ? div(a, b) : mul(a, b);
    return {
      prompt: `${formatFraction(a)} ${divide ? '÷' : '×'} ${formatFraction(b)} = ?`,
      answer: { kind: 'number', value: res.num / res.den, fraction: true, simplest: true },
      answerText: formatFraction(res),
      inputHint: 'as a fraction in simplest form',
      hints: [divide ? `Dividing by ${formatFraction(b)} is multiplying by ${formatFraction(frac(b.den, b.num))}.` : 'Multiply the tops, multiply the bottoms.', 'Simplify at the end.'],
      solution: divide
        ? `${formatFraction(a)} × ${formatFraction(frac(b.den, b.num))} = ${formatFraction(res)}.`
        : `(${a.num} × ${b.num}) / (${a.den} × ${b.den}) = ${formatFraction(res)}.`,
    };
  }),
  defineTopic('maths', 'decimals', 'Decimals', [5, 7], ['decimals', 'decimal'], (r, d) => {
    const dp = D(d, 1, 1, 2);
    const a = r.int(10, D(d, 99, 500, 999)) / 10 ** dp;
    const b = r.int(10, D(d, 99, 500, 999)) / 10 ** dp;
    const op = r.pick(d === 1 ? ['+', '−'] : ['+', '−', '×']);
    const [x, y] = op === '−' && a < b ? [b, a] : [a, b];
    const val = round(op === '+' ? x + y : op === '−' ? x - y : x * y, 4);
    return {
      prompt: `${x} ${op} ${y} = ?`,
      answer: { kind: 'number', value: val, tolerance: 1e-9 },
      answerText: String(val),
      hints: [op === '×' ? 'Multiply as whole numbers, then count the decimal places.' : 'Line up the decimal points.'],
      solution: `${x} ${op} ${y} = ${val}.`,
    };
  }),
  defineTopic('maths', 'percent-of', 'Percentages', [5, 9], ['percentages', 'percentage', 'percent', 'decimals and percentages', 'ratio, percentage'], (r, d) => {
    const p = r.pick(D(d, 1, 2, 3) === 1 ? [10, 25, 50, 75] : d === 2 ? [5, 10, 15, 20, 25, 30, 40, 60] : [12, 15, 35, 45, 65, 85, 120]);
    const n = r.int(2, D(d, 20, 40, 80)) * 20;
    const val = round((p / 100) * n, 4);
    return {
      prompt: `What is ${p}% of ${n}?`,
      answer: { kind: 'number', value: val },
      answerText: String(val),
      hints: ['10% is a tenth. 1% is a hundredth.', `${p}% of ${n} = ${p}/100 × ${n}.`],
      solution: `${p}/100 × ${n} = ${val}.`,
    };
  }),
  defineTopic('maths', 'ratio-share', 'Sharing in a ratio', [6, 8], ['ratio', 'proportion', 'ratio, proportion'], (r, d) => {
    const a = r.int(1, D(d, 3, 5, 7));
    let b = r.int(1, D(d, 4, 6, 9));
    if (gcd(a, b) !== 1) b += 1;
    const unit = r.int(2, D(d, 10, 20, 40));
    const total = (a + b) * unit;
    const askBigger = r.chance(0.5);
    const ans = (askBigger ? Math.max(a, b) : Math.min(a, b)) * unit;
    return {
      prompt: `Share ${total} in the ratio ${a} : ${b}. What is the ${askBigger ? 'larger' : 'smaller'} share?`,
      short: `${total} in ${a}:${b} → ${askBigger ? 'larger' : 'smaller'}`,
      answer: { kind: 'number', value: ans },
      answerText: String(ans),
      hints: [`There are ${a} + ${b} = ${a + b} parts.`, `One part is ${total} ÷ ${a + b}.`],
      solution: `${a + b} parts; one part = ${unit}. Shares: ${a * unit} and ${b * unit}, so the ${askBigger ? 'larger' : 'smaller'} is ${ans}.`,
    };
  }),
  defineTopic('maths', 'order-of-operations', 'Order of operations', [5, 8], ['order of operations', 'bodmas', 'brackets', 'integers'], (r, d) => {
    const a = r.int(2, 9), b = r.int(2, 9), c = r.int(2, 9), e = r.int(1, 5);
    const form = r.int(0, D(d, 1, 2, 3));
    const cases = [
      { text: `${a} + ${b} × ${c}`, v: a + b * c, why: `× first: ${b} × ${c} = ${b * c}; then + ${a}.` },
      { text: `(${a} + ${b}) × ${c}`, v: (a + b) * c, why: `Brackets first: ${a + b}; then × ${c}.` },
      { text: `${a} × ${b} − ${c} + ${e}`, v: a * b - c + e, why: `× first: ${a * b}; then left to right.` },
      { text: `${a} + ${b} × (${c} − ${e})`, v: a + b * (c - e), why: `Brackets: ${c - e}; × ${b} = ${b * (c - e)}; + ${a}.` },
    ];
    const pick = cases[form];
    return {
      prompt: `${pick.text} = ?`,
      answer: { kind: 'number', value: pick.v },
      answerText: String(pick.v),
      hints: ['Brackets, then × and ÷, then + and −.'],
      solution: `${pick.why} = ${pick.v}.`,
    };
  }),
  defineTopic('maths', 'area-perimeter', 'Area and perimeter of rectangles', [3, 7], ['area', 'perimeter', 'measurement', 'measuring'], (r, d) => {
    const w = r.int(2, D(d, 10, 20, 45));
    const h = r.int(2, D(d, 10, 20, 45));
    const area = r.chance(0.5);
    return {
      prompt: `A rectangle is ${w} cm long and ${h} cm wide. What is its ${area ? 'area' : 'perimeter'}?`,
      answer: { kind: 'number', value: area ? w * h : 2 * (w + h) },
      answerText: String(area ? w * h : 2 * (w + h)),
      inputHint: area ? 'in cm²' : 'in cm',
      hints: [area ? 'Area = length × width.' : 'Perimeter = all four sides added.'],
      solution: area ? `${w} × ${h} = ${w * h} cm².` : `2 × (${w} + ${h}) = ${2 * (w + h)} cm.`,
    };
  }),
  defineTopic('maths', 'hcf-lcm', 'Factors, HCF and LCM', [4, 8], ['factors', 'multiples', 'hcf', 'lcm', 'primes', 'playing with numbers'], (r, d) => {
    const base = r.int(2, D(d, 6, 9, 12));
    const a = base * r.int(2, D(d, 5, 7, 9));
    let b = base * r.int(2, D(d, 5, 7, 9));
    if (a === b) b += base;
    const askHcf = r.chance(0.5);
    const ans = askHcf ? gcd(a, b) : lcm(a, b);
    return {
      prompt: `Find the ${askHcf ? 'highest common factor (HCF)' : 'lowest common multiple (LCM)'} of ${a} and ${b}.`,
      short: `${askHcf ? 'HCF' : 'LCM'}(${a}, ${b})`,
      answer: { kind: 'number', value: ans },
      answerText: String(ans),
      hints: [askHcf ? 'List the factors of each and find the biggest shared one.' : 'List multiples of the bigger number until the other divides it.', `HCF × LCM = ${a} × ${b}.`],
      solution: `HCF(${a}, ${b}) = ${gcd(a, b)}; LCM = ${a} × ${b} ÷ ${gcd(a, b)} = ${lcm(a, b)}.`,
    };
  }),
  defineTopic('maths', 'mean-median', 'Mean and median', [6, 10], ['statistics', 'data', 'average', 'mean', 'median', 'data handling'], (r, d) => {
    const n = D(d, 5, 6, 7);
    const vals = Array.from({ length: n }, () => r.int(1, D(d, 20, 50, 99)));
    const askMean = r.chance(0.5);
    const sorted = [...vals].sort((a, b) => a - b);
    const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
    const sum = vals.reduce((s, v) => s + v, 0);
    const mean = round(sum / n, 2);
    return {
      prompt: `Find the ${askMean ? 'mean' : 'median'} of: ${vals.join(', ')}`,
      answer: { kind: 'number', value: askMean ? mean : median, tolerance: 0.005 },
      answerText: String(askMean ? mean : median),
      inputHint: askMean ? 'to 2 decimal places if needed' : undefined,
      hints: askMean ? ['Add them all up.', `Divide by how many there are (${n}).`] : ['Put them in order first.', n % 2 ? 'Take the middle one.' : 'Two middle numbers — take halfway between them.'],
      solution: askMean ? `Sum ${sum} ÷ ${n} = ${mean}.` : `In order: ${sorted.join(', ')} → median ${median}.`,
    };
  }),

  /* ── Grades 6–9 ─────────────────────────────────────────────────────────── */
  defineTopic('maths', 'integers', 'Negative numbers', [6, 8], ['integers', 'negative', 'directed numbers', 'integers and their operations'], (r, d) => {
    const a = r.nonZero(-D(d, 10, 20, 50), D(d, 10, 20, 50));
    const b = r.nonZero(-D(d, 10, 20, 50), D(d, 10, 20, 50));
    const c = r.nonZero(-9, 9);
    const form = r.int(0, D(d, 1, 2, 2));
    const cases = [
      { text: `${paren(a)} + ${paren(b)}`, v: a + b },
      { text: `${paren(a)} − ${paren(b)}`, v: a - b },
      { text: `${paren(a)} + ${paren(b)} × ${paren(c)}`, v: a + b * c },
    ];
    const pick = cases[form];
    return {
      prompt: `${pick.text} = ?`,
      answer: { kind: 'number', value: pick.v },
      answerText: String(pick.v),
      hints: ['Subtracting a negative is adding.', 'A negative times a negative is positive.'],
      solution: `${pick.text} = ${pick.v}.`,
    };
  }),
  defineTopic('maths', 'solve-linear', 'Solving linear equations', [7, 10], ['equations', 'simple equations', 'linear equations', 'solving', 'algebra'], (r, d) => {
    const x = r.nonZero(-D(d, 1, 9, 15), D(d, 12, 12, 15));
    const a = r.int(2, D(d, 5, 9, 12));
    const b = r.nonZero(-20, 20);
    if (d === 3) {
      const c = r.int(1, a - 1);
      const e = r.nonZero(-15, 15);
      // a x + b = c x + e  →  x = (e − b) / (a − c)
      const right = c * x + e;
      const left = a * x + b;
      const bb = left - a * x;
      const ee = right - c * x;
      return {
        prompt: `Solve: ${a}x ${signed(bb)} = ${c}x ${signed(ee)}`,
        answer: { kind: 'number', value: x },
        answerText: String(x),
        inputHint: 'x = ?',
        hints: [`Get the x terms on one side: subtract ${c}x.`, 'Then undo the + or − and divide.'],
        solution: `${a - c}x = ${ee - bb}, so x = ${x}.`,
      };
    }
    const rhs = a * x + b;
    return {
      prompt: `Solve: ${a}x ${signed(b)} = ${rhs}`,
      answer: { kind: 'number', value: x },
      answerText: String(x),
      inputHint: 'x = ?',
      hints: [`Undo the ${b < 0 ? '−' : '+'} ${Math.abs(b)} first.`, `Then divide both sides by ${a}.`],
      solution: `${a}x = ${rhs - b}, so x = ${rhs - b} ÷ ${a} = ${x}.`,
    };
  }),
  defineTopic('maths', 'expand-simplify', 'Expanding and simplifying', [7, 10], ['algebraic expressions', 'expressions', 'expanding', 'simplifying', 'polynomials', 'algebra'], (r, d) => {
    const a = r.int(2, 6), b = r.nonZero(-9, 9), c = r.nonZero(-5, 8), k = r.int(2, 5), m = r.nonZero(-6, 6);
    if (d === 3) {
      // (x + p)(x + q)
      const p = r.nonZero(-7, 7), q = r.nonZero(-7, 7);
      return {
        prompt: `Expand and simplify: (x ${signed(p)})(x ${signed(q)})`,
        answer: { kind: 'expression', value: `x^2 + ${p + q}x + ${p * q}` },
        answerText: poly([[1, 'x^2'], [p + q, 'x'], [p * q, '']]),
        inputHint: 'use ^ for powers, e.g. x^2 + 3x - 4',
        hints: ['Multiply each term in the first bracket by each in the second.', `x·x = x², x·(${q}) + (${p})·x, then (${p})(${q}).`],
        solution: `${poly([[1, 'x²'], [p + q, 'x'], [p * q, '']])}.`,
      };
    }
    return {
      prompt: `Expand and simplify: ${k}(${a}x ${signed(b)}) ${signed(c)}x ${d === 2 ? signed(m) : ''}`.trim(),
      answer: { kind: 'expression', value: `${k * a + c}x + ${k * b + (d === 2 ? m : 0)}` },
      answerText: `${k * a + c}x ${signed(k * b + (d === 2 ? m : 0))}`,
      inputHint: 'e.g. 7x + 3',
      hints: [`Multiply both terms in the bracket by ${k}.`, 'Then collect the x terms and the numbers.'],
      solution: `${k * a}x ${signed(k * b)} ${signed(c)}x${d === 2 ? ` ${signed(m)}` : ''} = ${k * a + c}x ${signed(k * b + (d === 2 ? m : 0))}.`,
    };
  }),
  defineTopic('maths', 'index-laws', 'Powers and index laws', [8, 10], ['exponents', 'powers', 'indices', 'index', 'real number system'], (r, d) => {
    const base = r.int(2, D(d, 3, 5, 9));
    const m = r.int(2, 6), n = r.int(1, 5);
    const form = r.int(0, D(d, 0, 1, 2));
    const cases = [
      { q: `${base}^${m} × ${base}^${n} = ${base}^?`, v: m + n, why: 'Multiplying: add the powers.' },
      { q: `${base}^${m + n} ÷ ${base}^${n} = ${base}^?`, v: m, why: 'Dividing: subtract the powers.' },
      { q: `(${base}^${m})^${n} = ${base}^?`, v: m * n, why: 'Power of a power: multiply the powers.' },
    ];
    const pick = cases[form];
    return {
      prompt: pick.q,
      answer: { kind: 'number', value: pick.v },
      answerText: String(pick.v),
      hints: [pick.why],
      solution: `${pick.why} The power is ${pick.v}.`,
    };
  }),
  defineTopic('maths', 'pythagoras', "Pythagoras' theorem", [8, 10], ['pythagoras', 'right-angled', 'triangles', 'right triangle'], (r, d) => {
    const triples = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [6, 8, 10], [9, 12, 15], [20, 21, 29]];
    if (d === 3) {
      const a = r.int(2, 12), b = r.int(2, 12);
      const c = round(Math.sqrt(a * a + b * b), 2);
      return {
        prompt: `A right-angled triangle has shorter sides ${a} cm and ${b} cm. Find the hypotenuse, to 2 decimal places.`,
        answer: { kind: 'number', value: c, tolerance: 0.002 },
        answerText: String(c),
        inputHint: 'in cm, 2 decimal places',
        hints: ['c² = a² + b².', `c² = ${a * a} + ${b * b} = ${a * a + b * b}.`],
        solution: `c = √${a * a + b * b} ≈ ${c} cm.`,
      };
    }
    const [a, b, c] = r.pick(triples).map((v) => v * (d === 2 ? r.int(1, 3) : r.int(1, 2)));
    const findLeg = d === 2 && r.chance(0.5);
    return {
      prompt: findLeg
        ? `A right-angled triangle has hypotenuse ${c} cm and one side ${a} cm. How long is the other side?`
        : `A right-angled triangle has shorter sides ${a} cm and ${b} cm. How long is the hypotenuse?`,
      short: findLeg ? `hyp ${c}, leg ${a} → other leg` : `legs ${a}, ${b} → hypotenuse`,
      answer: { kind: 'number', value: findLeg ? b : c },
      answerText: String(findLeg ? b : c),
      inputHint: 'in cm',
      hints: ['a² + b² = c², where c is the longest side.', findLeg ? `${c}² − ${a}² = ${c * c - a * a}.` : `${a}² + ${b}² = ${a * a + b * b}.`],
      solution: findLeg ? `√(${c * c} − ${a * a}) = √${b * b} = ${b} cm.` : `√(${a * a} + ${b * b}) = √${c * c} = ${c} cm.`,
    };
  }),
  defineTopic('maths', 'triangle-angles', 'Angles in a triangle', [6, 10], ['angles', 'triangles', 'lines and angles'], (r, d) => {
    const a = r.int(20, 100);
    const b = r.int(20, 160 - a);
    const c = 180 - a - b;
    const exterior = d === 3 && r.chance(0.5);
    if (exterior) {
      return {
        prompt: `Two angles of a triangle are ${a}° and ${b}°. What is the exterior angle next to the third angle?`,
        answer: { kind: 'number', value: a + b },
        answerText: String(a + b),
        inputHint: 'in degrees',
        hints: ['An exterior angle equals the two opposite interior angles added.'],
        solution: `${a}° + ${b}° = ${a + b}°.`,
      };
    }
    return {
      prompt: `Two angles of a triangle are ${a}° and ${b}°. What is the third?`,
      answer: { kind: 'number', value: c },
      answerText: String(c),
      inputHint: 'in degrees',
      hints: ['The angles in a triangle add up to 180°.'],
      solution: `180° − ${a}° − ${b}° = ${c}°.`,
    };
  }),
  defineTopic('maths', 'simple-interest', 'Simple interest', [7, 9], ['interest', 'money', 'comparing quantities', 'ratio, percentage and money'], (r, d) => {
    const p = r.int(2, D(d, 10, 50, 200)) * 1000;
    const rate = r.pick(D(d, 1, 2, 3) === 1 ? [5, 10] : [4, 6, 7.5, 8, 12]);
    const t = r.int(1, D(d, 3, 5, 8));
    const si = round((p * rate * t) / 100, 2);
    return {
      prompt: `₹${fmt(p)} is invested at ${rate}% simple interest per year for ${t} year${t > 1 ? 's' : ''}. How much interest is earned?`,
      short: `SI on ₹${fmt(p)}, ${rate}%, ${t} yr`,
      answer: { kind: 'number', value: si, tolerance: 1e-6 },
      answerText: String(si),
      inputHint: 'in ₹',
      hints: ['Interest = P × R × T ÷ 100.'],
      solution: `${fmt(p)} × ${rate} × ${t} ÷ 100 = ₹${fmt(si)}.`,
    };
  }),
  defineTopic('maths', 'probability', 'Probability', [7, 12], ['probability', 'chance', 'statistics and probability', 'statistics and chance'], (r, d) => {
    const red = r.int(1, D(d, 5, 8, 12)), blue = r.int(1, D(d, 5, 8, 12)), green = r.int(d === 1 ? 0 : 1, 6);
    const total = red + blue + green;
    const colour = r.pick(green ? ['red', 'blue', 'green'] : ['red', 'blue']);
    const count = colour === 'red' ? red : colour === 'blue' ? blue : green;
    if (d === 3) {
      // two draws with replacement
      const p = mul(frac(count, total), frac(count, total));
      return {
        prompt: `A bag has ${red} red, ${blue} blue and ${green} green counters. One is taken, put back, and another taken. What is the probability both are ${colour}?`,
        answer: { kind: 'number', value: p.num / p.den, fraction: true, simplest: true },
        answerText: formatFraction(p),
        inputHint: 'as a fraction in simplest form',
        hints: [`P(${colour}) = ${count}/${total} each time.`, 'Independent draws: multiply.'],
        solution: `${count}/${total} × ${count}/${total} = ${formatFraction(p)}.`,
      };
    }
    const p = frac(count, total);
    return {
      prompt: `A bag has ${red} red, ${blue} blue${green ? ` and ${green} green` : ''} counters. One is picked at random. What is the probability it is ${colour}?`,
      answer: { kind: 'number', value: p.num / p.den, fraction: true, simplest: true },
      answerText: formatFraction(p),
      inputHint: 'as a fraction in simplest form',
      hints: ['Probability = ways it can happen ÷ all the ways.', `There are ${total} counters.`],
      solution: `${count}/${total} = ${formatFraction(p)}.`,
    };
  }),
  defineTopic('maths', 'gradient', 'Gradient between two points', [9, 11], ['coordinate geometry', 'gradient', 'slope', 'straight lines', 'linear equations in two variables'], (r, d) => {
    const x1 = r.int(-6, 6), y1 = r.int(-6, 6);
    let x2 = r.int(-6, 6);
    if (x2 === x1) x2 = x1 + r.int(1, 4);
    const y2 = r.int(-8, 8);
    const g = frac(y2 - y1, x2 - x1);
    return {
      prompt: `Find the gradient of the line through (${x1}, ${y1}) and (${x2}, ${y2}).`,
      short: `slope (${x1},${y1})→(${x2},${y2})`,
      answer: { kind: 'number', value: g.num / g.den, fraction: true, simplest: d >= 2 },
      answerText: formatFraction(g),
      inputHint: 'a whole number or a fraction',
      hints: ['Gradient = change in y ÷ change in x.', `(${y2} − ${paren(y1)}) ÷ (${x2} − ${paren(x1)}).`],
      solution: `${y2 - y1} ÷ ${x2 - x1} = ${formatFraction(g)}.`,
    };
  }),
  defineTopic('maths', 'simultaneous', 'Simultaneous equations', [9, 11], ['simultaneous', 'pair of linear equations', 'linear equations in two variables', 'two variables'], (r, d) => {
    const x = r.nonZero(-6, 8), y = r.nonZero(-6, 8);
    const a1 = r.int(1, D(d, 3, 5, 7)), b1 = r.nonZero(-4, 5), a2 = r.nonZero(-3, 5);
    let b2 = r.nonZero(-4, 6);
    if (a1 * b2 === a2 * b1) b2 = b2 === -1 ? 2 : b2 + 1;
    const c1 = a1 * x + b1 * y, c2 = a2 * x + b2 * y;
    const askX = r.chance(0.5);
    const term = (coef: number, v: string, first: boolean) =>
      `${first ? (coef < 0 ? '−' : '') : coef < 0 ? ' − ' : ' + '}${Math.abs(coef) === 1 ? '' : Math.abs(coef)}${v}`;
    return {
      prompt: `Solve together:\n${term(a1, 'x', true)}${term(b1, 'y', false)} = ${c1}\n${term(a2, 'x', true)}${term(b2, 'y', false)} = ${c2}\nWhat is ${askX ? 'x' : 'y'}?`,
      answer: { kind: 'number', value: askX ? x : y },
      answerText: String(askX ? x : y),
      hints: ['Make the x (or y) coefficients match, then add or subtract the equations.', 'Solve for one letter, then put it back in.'],
      solution: `x = ${x}, y = ${y}. Check: ${a1}(${x}) + ${b1}(${y}) = ${c1}.`,
    };
  }),

  /* ── Grades 10–12 ───────────────────────────────────────────────────────── */
  defineTopic('maths', 'quadratic-roots', 'Solving quadratics', [10, 12], ['quadratic', 'quadratics', 'polynomials', 'factorising', 'roots'], (r, d) => {
    const p = r.nonZero(-D(d, 6, 9, 12), D(d, 6, 9, 12));
    let q = r.nonZero(-D(d, 6, 9, 12), D(d, 6, 9, 12));
    if (p === q) q += 1;
    const a = d === 3 ? r.int(2, 3) : 1;
    // a(x − p)(x − q) = a x² − a(p+q)x + a pq
    const b = -a * (p + q), c = a * p * q;
    const askLarger = r.chance(0.5);
    return {
      prompt: `Solve ${poly([[a, 'x²'], [b, 'x'], [c, '']])} = 0. What is the ${askLarger ? 'larger' : 'smaller'} solution?`,
      short: `${poly([[a, 'x²'], [b, 'x'], [c, '']])} = 0 → ${askLarger ? 'larger' : 'smaller'} x`,
      answer: { kind: 'number', value: askLarger ? Math.max(p, q) : Math.min(p, q) },
      answerText: String(askLarger ? Math.max(p, q) : Math.min(p, q)),
      hints: [a > 1 ? `Divide through by ${a} first.` : `Find two numbers that multiply to ${c} and add to ${b}.`, 'Then set each bracket to zero.'],
      solution: `${a > 1 ? `${a}` : ''}(x ${signed(-p)})(x ${signed(-q)}) = 0, so x = ${p} or x = ${q}.`,
    };
  }),
  defineTopic('maths', 'trig-ratios', 'Trigonometric ratios', [10, 12], ['trigonometry', 'trigonometric', 'sine', 'cosine', 'heights and distances', 'triangles and applications'], (r, d) => {
    if (d === 1) {
      const table: [string, string, string[]][] = [
        ['sin 30°', '1/2', ['√3/2', '1', '1/√2']],
        ['cos 60°', '1/2', ['√3/2', '0', '1']],
        ['tan 45°', '1', ['0', '√3', '1/2']],
        ['sin 90°', '1', ['0', '1/2', '√3/2']],
        ['cos 0°', '1', ['0', '1/2', '−1']],
        ['tan 60°', '√3', ['1/√3', '1', '√3/2']],
        ['sin 45°', '1/√2', ['1/2', '√3/2', '1']],
      ];
      const [q, a, wrong] = r.pick(table);
      const c = choice(r, a, wrong);
      return { prompt: `${q} = ?`, ...c, hints: ['Picture the 30-60-90 and 45-45-90 triangles.'], solution: `${q} = ${a}.` };
    }
    const angle = r.int(15, 75);
    const side = r.int(5, 40);
    const fn = r.pick(['sin', 'cos', 'tan'] as const);
    const rad = (angle * Math.PI) / 180;
    const known = fn === 'tan' ? 'the side next to it' : 'the hypotenuse';
    const want = fn === 'cos' ? 'the side next to the angle' : 'the side opposite the angle';
    const value = round(side * (fn === 'sin' ? Math.sin(rad) : fn === 'cos' ? Math.cos(rad) : Math.tan(rad)), 2);
    return {
      prompt: `In a right-angled triangle, one angle is ${angle}° and ${known} is ${side} cm. Find ${want}, to 2 decimal places.`,
      answer: { kind: 'number', value, tolerance: 0.003 },
      answerText: String(value),
      inputHint: 'in cm, 2 decimal places',
      hints: ['SOH CAH TOA.', `${fn} ${angle}° = ${fn === 'cos' ? 'adjacent / hypotenuse' : fn === 'sin' ? 'opposite / hypotenuse' : 'opposite / adjacent'}.`],
      solution: `${side} × ${fn} ${angle}° = ${value} cm.`,
    };
  }),
  defineTopic('maths', 'differentiate', 'Differentiating polynomials', [11, 12], ['derivatives', 'differentiation', 'limits and derivatives', 'differential', 'calculus'], (r, d) => {
    const terms = D(d, 2, 3, 4);
    const coeffs: [number, number][] = [];
    const used = new Set<number>();
    for (let i = 0; i < terms; i++) {
      let p = r.int(0, D(d, 3, 4, 6));
      while (used.has(p)) p = (p + 1) % 7;
      used.add(p);
      coeffs.push([r.nonZero(-9, 9), p]);
    }
    coeffs.sort((a, b) => b[1] - a[1]);
    const show = (cs: [number, number][]) =>
      cs.filter(([c]) => c !== 0).map(([c, p], i) => {
        const sign = i === 0 ? (c < 0 ? '−' : '') : c < 0 ? ' − ' : ' + ';
        const mag = Math.abs(c) === 1 && p !== 0 ? '' : String(Math.abs(c));
        return `${sign}${mag}${p === 0 ? '' : p === 1 ? 'x' : `x^${p}`}`;
      }).join('') || '0';
    const deriv: [number, number][] = coeffs.filter(([, p]) => p > 0).map(([c, p]) => [c * p, p - 1]);
    return {
      prompt: `Differentiate: y = ${show(coeffs)}`,
      short: `d/dx (${show(coeffs)})`,
      answer: { kind: 'expression', value: deriv.length ? deriv.map(([c, p]) => `(${c})*x^${p}`).join(' + ') : '0' },
      answerText: show(deriv),
      inputHint: 'dy/dx = … (use ^ for powers)',
      hints: ['Multiply by the power, then take one off the power.', 'A constant differentiates to 0.'],
      solution: `dy/dx = ${show(deriv)}.`,
    };
  }),
  defineTopic('maths', 'definite-integral', 'Definite integrals', [12, 12], ['integrals', 'integration', 'integral', 'calculus'], (r, d) => {
    const a = r.int(1, D(d, 3, 6, 6));
    const b = r.nonZero(-5, 6);
    const lo = r.int(0, 2);
    const hi = lo + r.int(1, D(d, 2, 3, 4));
    // ∫ (a x + b) dx or ∫ a x² dx
    const quad = d === 3;
    const F = (x: number) => (quad ? (a * x ** 3) / 3 + b * x : (a * x * x) / 2 + b * x);
    const v = round(F(hi) - F(lo), 4);
    const integrand = quad ? `${a}x^2 ${signed(b)}` : `${a}x ${signed(b)}`;
    return {
      prompt: `Evaluate ∫ from ${lo} to ${hi} of (${integrand}) dx.`,
      short: `∫${lo}→${hi} (${integrand}) dx`,
      answer: { kind: 'number', value: v, tolerance: 0.002 },
      answerText: String(round(v, 4)),
      inputHint: 'an exact number or a fraction',
      hints: ['Integrate: raise the power by one, divide by the new power.', `Then F(${hi}) − F(${lo}).`],
      solution: `F(x) = ${quad ? `${a}x³/3 ${signed(b)}x` : `${a}x²/2 ${signed(b)}x`}; F(${hi}) − F(${lo}) = ${round(v, 4)}.`,
    };
  }),
  defineTopic('maths', 'logarithms', 'Logarithms', [10, 12], ['logarithms', 'logarithm', 'log', 'exponential'], (r, d) => {
    const base = r.pick([2, 3, 5, 10]);
    const k = r.int(d === 1 ? 1 : -2, D(d, 4, 5, 6));
    const n = base ** k;
    const shown = k < 0 ? `1/${base ** -k}` : String(n);
    return {
      prompt: `log${base === 10 ? '' : `_${base}`}(${shown}) = ?`,
      answer: { kind: 'number', value: k },
      answerText: String(k),
      hints: [`What power of ${base} gives ${shown}?`, k < 0 ? 'A fraction 1/n means a negative power.' : `${base}^? = ${shown}.`],
      solution: `${base}^${k} = ${shown}, so the log is ${k}.`,
    };
  }),
  defineTopic('maths', 'arithmetic-sequence', 'Arithmetic sequences', [10, 11], ['sequences', 'progressions', 'arithmetic progression', 'sequences and series', 'binomial theorem and sequences'], (r, d) => {
    const a = r.int(-10, 20);
    const dd = r.nonZero(-7, 9);
    const n = r.int(D(d, 5, 10, 20), D(d, 10, 30, 60));
    const askSum = d === 3;
    const nth = a + (n - 1) * dd;
    const sum = (n * (2 * a + (n - 1) * dd)) / 2;
    return {
      prompt: `An arithmetic sequence starts ${a}, ${a + dd}, ${a + 2 * dd}, … ${askSum ? `Find the sum of the first ${n} terms.` : `Find term number ${n}.`}`,
      short: `${a}, ${a + dd}, ${a + 2 * dd}… ${askSum ? `S${n}` : `term ${n}`}`,
      answer: { kind: 'number', value: askSum ? sum : nth },
      answerText: String(askSum ? sum : nth),
      hints: [`The common difference is ${dd}.`, askSum ? 'Sₙ = n/2 × (2a + (n − 1)d).' : 'aₙ = a + (n − 1)d.'],
      solution: askSum ? `${n}/2 × (2×${a} + ${n - 1}×${dd}) = ${sum}.` : `${a} + ${n - 1} × ${dd} = ${nth}.`,
    };
  }),
  defineTopic('maths', 'combinations', 'Permutations and combinations', [11, 12], ['permutations', 'combinations', 'permutations and combinations', 'counting'], (r, d) => {
    const n = r.int(4, D(d, 6, 9, 12));
    const k = r.int(2, Math.min(n - 1, D(d, 2, 3, 4)));
    const fact = (x: number): number => (x <= 1 ? 1 : x * fact(x - 1));
    const choose = fact(n) / (fact(k) * fact(n - k));
    const order = r.chance(0.5);
    const perm = fact(n) / fact(n - k);
    return {
      prompt: order
        ? `In how many ways can ${k} of ${n} students be chosen for first, second${k > 2 ? ' and third' : ''} place?`
        : `In how many ways can a team of ${k} be chosen from ${n} students?`,
      short: order ? `${n}P${k}` : `${n}C${k}`,
      answer: { kind: 'number', value: order ? perm : choose },
      answerText: String(order ? perm : choose),
      hints: [order ? 'Order matters: permutations, nPr = n!/(n−r)!.' : 'Order does not matter: combinations, nCr = n!/(r!(n−r)!).'],
      solution: order ? `${n}P${k} = ${perm}.` : `${n}C${k} = ${choose}.`,
    };
  }),
];

export const MATHS_TOPICS: Topic[] = [...CORE, ...MATHS_EXTRA];

/**
 * The topics a lesson is about, from its titles. A lesson whose words match
 * nothing still gets its grade's topics, so the room is never empty.
 */
export function mathsTopicsFor(grade: number, moduleTitle = '', lessonTitle = ''): Topic[] {
  const forGrade = gradeTopics(grade);
  const text = `${moduleTitle} ${lessonTitle}`;
  if (!text.trim()) return forGrade;
  const matched = matchTopics(grade, text);
  return matched.length ? matched : forGrade;
}

/** Every topic a grade is taught. */
export function gradeTopics(grade: number): Topic[] {
  return MATHS_TOPICS.filter((t) => grade >= t.grades[0] && grade <= t.grades[1]);
}

/** The grade's topics whose keywords appear in `text` — possibly none. */
export function matchTopics(grade: number, text: string): Topic[] {
  const lower = text.toLowerCase();
  return gradeTopics(grade).filter((t) => t.keywords.some((k) => lower.includes(k)));
}
