import { defineTopic, choice, round } from '../topic-kit';
import type { Topic } from '../types';

/**
 * SARIRO — maths topics for the modules the first set did not reach
 * ============================================================================
 * Shapes, measuring, the calendar, graphs, angles, primes, rounding, area and
 * volume, sets and matrices — found by checking every module of every grade
 * against the generators (13 of 96 matched nothing, so their test sheets were
 * drawing on the whole grade instead of the module).
 */

const D = (d: number, easy: number, mid: number, hard: number) => (d === 1 ? easy : d === 2 ? mid : hard);

const SHAPES: [string, number, number][] = [
  ['triangle', 3, 3], ['square', 4, 4], ['rectangle', 4, 4], ['pentagon', 5, 5], ['hexagon', 6, 6], ['octagon', 8, 8],
];
const SOLIDS: [string, number, number, number][] = [
  // name, faces, edges, vertices
  ['cube', 6, 12, 8], ['cuboid', 6, 12, 8], ['triangular prism', 5, 9, 6], ['square-based pyramid', 5, 8, 5], ['tetrahedron', 4, 6, 4],
];
const WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export const MATHS_EXTRA: Topic[] = [
  defineTopic('maths', 'shape-sides', 'Shapes: sides, faces and corners', [1, 5], ['shapes', 'flat shapes', 'solid shapes', 'polygons', 'faces'], (r, d) => {
    if (d === 1 || r.chance(0.5)) {
      const [name, sides] = r.pick(SHAPES);
      const askCorners = r.chance(0.5);
      return {
        prompt: `How many ${askCorners ? 'corners' : 'sides'} does a ${name} have?`,
        answer: { kind: 'number', value: sides },
        answerText: String(sides),
        hints: ['Picture it and count round.', 'A flat shape has as many corners as sides.'],
        solution: `A ${name} has ${sides} sides and ${sides} corners.`,
      };
    }
    const [name, faces, edges, vertices] = r.pick(SOLIDS);
    const what = r.pick(['faces', 'edges', 'vertices (corners)'] as const);
    const v = what === 'faces' ? faces : what === 'edges' ? edges : vertices;
    return {
      prompt: `How many ${what} does a ${name} have?`,
      answer: { kind: 'number', value: v },
      answerText: String(v),
      hints: ['Faces are the flat surfaces, edges where two faces meet, vertices the corners.'],
      solution: `A ${name} has ${faces} faces, ${edges} edges and ${vertices} vertices.`,
    };
  }),
  defineTopic('maths', 'compare-measures', 'Longer, heavier, holds more', [1, 3], ['measuring', 'longer', 'heavier', 'holds more', 'measurement'], (r) => {
    const kinds: [string, string, string, number][] = [['longer', 'cm', 'm', 100], ['heavier', 'g', 'kg', 1000], ['bigger', 'ml', 'l', 1000]];
    const [word, small, big, f] = r.pick(kinds);
    const a = r.int(1, 5);
    const b = r.pick([a * f - r.int(1, 9) * (f / 10), a * f + r.int(1, 9) * (f / 10)]);
    const left = `${a} ${big}`;
    const right = `${b} ${small}`;
    const bigger = a * f > b ? left : right;
    const c = choice(r, bigger, [bigger === left ? right : left]);
    return {
      prompt: `Which is ${word}: ${left} or ${right}?`,
      ...c,
      hints: [`1 ${big} = ${f} ${small}.`, `So ${left} = ${a * f} ${small}.`],
      solution: `${left} = ${a * f} ${small}, and ${right} is ${b} ${small} — so ${bigger} is ${word}.`,
    };
  }),
  defineTopic('maths', 'unit-conversion', 'Converting units', [3, 7], ['measurement', 'measuring', 'length', 'mass', 'capacity', 'units', 'metric'], (r, d) => {
    const conv: [string, string, number][] = [['m', 'cm', 100], ['km', 'm', 1000], ['kg', 'g', 1000], ['l', 'ml', 1000], ['cm', 'mm', 10], ['hours', 'minutes', 60]];
    const [big, small, f] = r.pick(conv);
    const down = r.chance(0.5);
    const n = d === 1 ? r.int(2, 9) : d === 2 ? r.int(2, 30) : round(r.int(12, 95) / 10, 1);
    const value = down ? round(n * f, 4) : n;
    const shown = down ? n : round(n * f, 4);
    return {
      prompt: down ? `${shown} ${big} = how many ${small}?` : `${shown} ${small} = how many ${big}?`,
      answer: { kind: 'number', value: down ? value : round(shown / f, 4) },
      answerText: String(down ? value : round(shown / f, 4)),
      hints: [`1 ${big} = ${f} ${small}.`, down ? `Multiply by ${f}.` : `Divide by ${f}.`],
      solution: down ? `${shown} × ${f} = ${value} ${small}.` : `${shown} ÷ ${f} = ${round(shown / f, 4)} ${big}.`,
    };
  }),
  defineTopic('maths', 'calendar', 'Days, months and the clock', [1, 3], ['days of the week', 'months', 'seasons', 'telling the time', 'time and money', 'calendar'], (r, d) => {
    const form = r.int(0, D(d, 1, 2, 2));
    if (form === 0) {
      const i = r.int(0, 6);
      const after = r.chance(0.5);
      const ans = WEEK[(i + (after ? 1 : 6)) % 7];
      return {
        prompt: `What day comes ${after ? 'after' : 'before'} ${WEEK[i]}?`,
        answer: { kind: 'text', accept: [ans] },
        answerText: ans,
        hints: ['Say the days of the week in order.'],
        solution: `${WEEK[(i + 6) % 7]}, ${WEEK[i]}, ${WEEK[(i + 1) % 7]} — so ${ans}.`,
      };
    }
    if (form === 1) {
      const i = r.int(0, 11);
      const ans = MONTHS[(i + 1) % 12];
      return {
        prompt: `Which month comes after ${MONTHS[i]}?`,
        answer: { kind: 'text', accept: [ans] },
        answerText: ans,
        hints: ['January, February, March…'],
        solution: `After ${MONTHS[i]} comes ${ans}.`,
      };
    }
    const days = r.int(2, 5);
    const i = r.int(0, 6);
    const ans = WEEK[(i + days) % 7];
    return {
      prompt: `Today is ${WEEK[i]}. What day will it be in ${days} days?`,
      answer: { kind: 'text', accept: [ans] },
      answerText: ans,
      hints: ['Count forward one day at a time.'],
      solution: `Count ${days} days on from ${WEEK[i]}: ${ans}.`,
    };
  }),
  defineTopic('maths', 'read-graph', 'Reading a graph or table', [1, 6], ['graph', 'graphs', 'sorting', 'pictograph', 'picture graph', 'tally', 'bar chart', 'data'], (r, d) => {
    const things = r.shuffle(['Apples', 'Bananas', 'Mangoes', 'Oranges', 'Grapes']).slice(0, D(d, 3, 4, 5));
    const counts = things.map(() => r.int(1, D(d, 9, 20, 60)));
    // One clear winner, so "which was counted most" has one right answer.
    const top = Math.max(...counts);
    if (counts.filter((c) => c === top).length > 1) counts[counts.indexOf(top)] += 1;
    const table = things.map((t, i) => `${t}: ${counts[i]}`).join('\n');
    const form = r.int(0, D(d, 1, 2, 2));
    if (form === 0) {
      const i = r.int(0, things.length - 1);
      let j = r.int(0, things.length - 1);
      if (j === i) j = (i + 1) % things.length;
      const [hi, lo] = counts[i] >= counts[j] ? [i, j] : [j, i];
      return {
        prompt: `A class counted fruit:\n${table}\nHow many more ${things[hi]} than ${things[lo]}?`,
        answer: { kind: 'number', value: counts[hi] - counts[lo] },
        answerText: String(counts[hi] - counts[lo]),
        hints: ['Find both numbers, then take the smaller from the bigger.'],
        solution: `${counts[hi]} − ${counts[lo]} = ${counts[hi] - counts[lo]}.`,
      };
    }
    if (form === 1) {
      const total = counts.reduce((s, c) => s + c, 0);
      return {
        prompt: `A class counted fruit:\n${table}\nHow many pieces of fruit altogether?`,
        answer: { kind: 'number', value: total },
        answerText: String(total),
        hints: ['Add every number in the table.'],
        solution: `${counts.join(' + ')} = ${total}.`,
      };
    }
    const most = things[counts.indexOf(Math.max(...counts))];
    const c = choice(r, most, things.filter((t) => t !== most));
    return {
      prompt: `A class counted fruit:\n${table}\nWhich fruit was counted most?`,
      ...c,
      hints: ['Look for the biggest number.'],
      solution: `${most} has the biggest count, ${Math.max(...counts)}.`,
    };
  }),
  defineTopic('maths', 'angle-types', 'Kinds of angle', [3, 7], ['angles', 'acute', 'obtuse', 'right angle', 'geometry', 'lines of symmetry'], (r) => {
    const deg = r.pick([r.int(10, 85), 90, r.int(95, 175), 180, r.int(185, 355)]);
    const kind = deg < 90 ? 'Acute' : deg === 90 ? 'Right' : deg < 180 ? 'Obtuse' : deg === 180 ? 'Straight' : 'Reflex';
    const c = choice(r, kind, ['Acute', 'Right', 'Obtuse', 'Straight', 'Reflex'].filter((k) => k !== kind));
    return {
      prompt: `An angle of ${deg}° is…`,
      ...c,
      hints: ['Under 90° acute; exactly 90° right; between 90° and 180° obtuse; 180° straight; more than 180° reflex.'],
      solution: `${deg}° is ${kind.toLowerCase()}.`,
    };
  }),
  defineTopic('maths', 'angles-on-a-line', 'Angles on a line and around a point', [5, 8], ['angles on a line', 'around a point', 'angles', 'geometry', 'lines and angles', 'quadrilaterals'], (r, d) => {
    const form = r.int(0, D(d, 0, 1, 2));
    if (form === 0) {
      const a = r.int(20, 160);
      return { prompt: `Two angles sit on a straight line. One is ${a}°. What is the other?`, answer: { kind: 'number', value: 180 - a }, answerText: String(180 - a), inputHint: 'in degrees', hints: ['Angles on a straight line add to 180°.'], solution: `180° − ${a}° = ${180 - a}°.` };
    }
    if (form === 1) {
      const a = r.int(40, 150), b = r.int(40, 320 - a - 40);
      return { prompt: `Three angles meet at a point: ${a}°, ${b}° and one more. What is it?`, answer: { kind: 'number', value: 360 - a - b }, answerText: String(360 - a - b), inputHint: 'in degrees', hints: ['Angles around a point add to 360°.'], solution: `360° − ${a}° − ${b}° = ${360 - a - b}°.` };
    }
    const a = r.int(60, 120), b = r.int(60, 120), c = r.int(50, 110);
    const x = 360 - a - b - c;
    if (x <= 0 || x >= 180) {
      return { prompt: `Three angles of a quadrilateral are 90°, 90° and ${a}°. What is the fourth?`, answer: { kind: 'number', value: 180 - a }, answerText: String(180 - a), inputHint: 'in degrees', hints: ['The angles of a quadrilateral add to 360°.'], solution: `360° − 90° − 90° − ${a}° = ${180 - a}°.` };
    }
    return { prompt: `Three angles of a quadrilateral are ${a}°, ${b}° and ${c}°. What is the fourth?`, answer: { kind: 'number', value: x }, answerText: String(x), inputHint: 'in degrees', hints: ['The angles of a quadrilateral add to 360°.'], solution: `360° − ${a}° − ${b}° − ${c}° = ${x}°.` };
  }),
  defineTopic('maths', 'prime-or-composite', 'Primes and factors', [4, 7], ['prime', 'composite', 'factors', 'multiples', 'factorisation'], (r, d) => {
    const n = r.int(D(d, 2, 11, 30), D(d, 30, 60, 120));
    const smallest = [...Array(n)].map((_, i) => i + 2).find((f) => f <= n && n % f === 0) ?? n;
    const isPrime = smallest === n;
    if (d === 3 && !isPrime) {
      const factors = [...Array(n)].map((_, i) => i + 1).filter((f) => n % f === 0);
      return {
        prompt: `How many factors does ${n} have?`,
        answer: { kind: 'number', value: factors.length },
        answerText: String(factors.length),
        hints: ['List factor pairs: 1 × n, 2 × …'],
        solution: `${factors.join(', ')} — ${factors.length} factors.`,
      };
    }
    const c = choice(r, isPrime ? 'Prime' : 'Composite', [isPrime ? 'Composite' : 'Prime']);
    return {
      prompt: `Is ${n} prime or composite?`,
      ...c,
      hints: ['A prime has exactly two factors: 1 and itself.', `Try dividing ${n} by 2, 3, 5, 7…`],
      solution: isPrime ? `${n} has no factors but 1 and ${n}: prime.` : `${n} = ${smallest} × ${n / smallest}: composite.`,
    };
  }),
  defineTopic('maths', 'rounding', 'Rounding and estimating', [3, 7], ['rounding', 'estimating', 'round', 'estimate', 'place value'], (r, d) => {
    const n = r.int(D(d, 11, 1001, 10001), D(d, 999, 99999, 999999));
    const place = r.pick(D(d, 1, 2, 3) === 1 ? [10, 100] : d === 2 ? [10, 100, 1000] : [100, 1000, 10000]);
    const ans = Math.round(n / place) * place;
    return {
      prompt: `Round ${n.toLocaleString('en-US')} to the nearest ${place.toLocaleString('en-US')}.`,
      short: `round ${n} to ${place}s`,
      answer: { kind: 'number', value: ans },
      answerText: String(ans),
      hints: [`Look at the digit just after the ${place.toLocaleString('en-US')}s place: 5 or more rounds up.`],
      solution: `${n.toLocaleString('en-US')} → ${ans.toLocaleString('en-US')}.`,
    };
  }),
  defineTopic('maths', 'volume-surface', 'Volume and surface area', [7, 10], ['volume', 'surface area', 'cuboid', 'cylinder', 'cone', 'capacity', 'area, volume'], (r, d) => {
    const form = r.int(0, D(d, 1, 2, 3));
    const a = r.int(2, 12), b = r.int(2, 12), c = r.int(2, 12);
    if (form === 0) return { prompt: `A cuboid is ${a} cm × ${b} cm × ${c} cm. What is its volume?`, short: `volume ${a}×${b}×${c} cuboid`, answer: { kind: 'number', value: a * b * c }, answerText: String(a * b * c), inputHint: 'in cm³', hints: ['Volume = length × width × height.'], solution: `${a} × ${b} × ${c} = ${a * b * c} cm³.` };
    if (form === 1) { const sa = 2 * (a * b + b * c + a * c); return { prompt: `A cuboid is ${a} cm × ${b} cm × ${c} cm. What is its surface area?`, answer: { kind: 'number', value: sa }, answerText: String(sa), inputHint: 'in cm²', hints: ['Six faces in three matching pairs.', '2(ab + bc + ca).'], solution: `2(${a * b} + ${b * c} + ${a * c}) = ${sa} cm².` }; }
    const rad = r.int(1, 10), h = r.int(2, 15);
    if (form === 2) { const v = round(Math.PI * rad * rad * h, 1); return { prompt: `A cylinder has radius ${rad} cm and height ${h} cm. What is its volume, to 1 decimal place? (use π)`, answer: { kind: 'number', value: v, tolerance: 0.002 }, answerText: String(v), inputHint: 'in cm³', hints: ['V = πr²h.'], solution: `π × ${rad}² × ${h} ≈ ${v} cm³.` }; }
    const v = round((Math.PI * rad * rad * h) / 3, 1);
    return { prompt: `A cone has radius ${rad} cm and height ${h} cm. What is its volume, to 1 decimal place? (use π)`, answer: { kind: 'number', value: v, tolerance: 0.002 }, answerText: String(v), inputHint: 'in cm³', hints: ['V = ⅓πr²h.'], solution: `⅓ × π × ${rad}² × ${h} ≈ ${v} cm³.` };
  }),
  defineTopic('maths', 'sets', 'Sets and Venn diagrams', [11, 12], ['sets', 'venn', 'relations', 'functions', 'set notation'], (r, d) => {
    const nA = r.int(10, 40), nB = r.int(10, 40), both = r.int(2, Math.min(nA, nB) - 2);
    const form = r.int(0, D(d, 0, 1, 2));
    if (form === 0) return { prompt: `n(A) = ${nA}, n(B) = ${nB} and n(A ∩ B) = ${both}. Find n(A ∪ B).`, short: `n(A)=${nA} n(B)=${nB} n(A∩B)=${both}: n(A∪B)`, answer: { kind: 'number', value: nA + nB - both }, answerText: String(nA + nB - both), hints: ['n(A ∪ B) = n(A) + n(B) − n(A ∩ B).'], solution: `${nA} + ${nB} − ${both} = ${nA + nB - both}.` };
    if (form === 1) return { prompt: `In a class, ${nA} play cricket, ${nB} play football, and ${both} play both. How many play only cricket?`, answer: { kind: 'number', value: nA - both }, answerText: String(nA - both), hints: ['Only cricket = cricket − both.'], solution: `${nA} − ${both} = ${nA - both}.` };
    const n = r.int(3, 6);
    return { prompt: `A set has ${n} elements. How many subsets does it have (including the empty set)?`, short: `subsets of a ${n}-element set`, answer: { kind: 'number', value: 2 ** n }, answerText: String(2 ** n), hints: ['Each element is either in or out of a subset.'], solution: `2^${n} = ${2 ** n}.` };
  }),
  defineTopic('maths', 'matrices', 'Matrices and determinants', [12, 12], ['matrices', 'matrix', 'determinant', 'determinants'], (r, d) => {
    const m = [r.int(-6, 9), r.int(-6, 9), r.int(-6, 9), r.int(-6, 9)];
    const show = (x: number[]) => `[[${x[0]}, ${x[1]}], [${x[2]}, ${x[3]}]]`;
    if (d === 1 || r.chance(0.5)) {
      const det = m[0] * m[3] - m[1] * m[2];
      return { prompt: `Find the determinant of ${show(m)}.`, short: `det ${show(m)}`, answer: { kind: 'number', value: det }, answerText: String(det), hints: ['For [[a, b], [c, d]] the determinant is ad − bc.'], solution: `${m[0]}×${m[3]} − ${m[1]}×${m[2]} = ${det}.` };
    }
    const n = [r.int(-5, 6), r.int(-5, 6), r.int(-5, 6), r.int(-5, 6)];
    const row = r.int(0, 1), col = r.int(0, 1);
    const v = m[row * 2] * n[col] + m[row * 2 + 1] * n[2 + col];
    return { prompt: `A = ${show(m)}, B = ${show(n)}. What is the entry in row ${row + 1}, column ${col + 1} of AB?`, answer: { kind: 'number', value: v }, answerText: String(v), hints: ['Row of A times column of B, entry by entry, then add.'], solution: `${m[row * 2]}×${n[col]} + ${m[row * 2 + 1]}×${n[2 + col]} = ${v}.` };
  }),
];
