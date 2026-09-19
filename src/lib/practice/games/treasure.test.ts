import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { checkDig, fourQuadrants, kindsFor, lineText, makeClue, pt, same, type Point } from './treasure';

const inside = (p: Point, min: number, max: number) => p.x >= min && p.x <= max && p.y >= min && p.y <= max;

describe('treasure clues', () => {
  test('kinds unlock with grade', () => {
    assert.deepEqual(kindsFor(2, 5), ['steps']);
    assert.ok(kindsFor(4, 3).includes('plot'));
    assert.ok(!kindsFor(6, 5).includes('translate'));
    assert.ok(kindsFor(8, 2).includes('reflect'));
    assert.ok(kindsFor(10, 1).includes('line'));
    assert.equal(fourQuadrants(5, 9), false);
    assert.equal(fourQuadrants(6, 2), true);
  });

  test('every clue is fair: on the map, true to its words, never on the scenery', () => {
    const seen = new Set<string>();
    for (let grade = 2; grade <= 12; grade++) {
      for (let level = 1; level <= 6; level++) {
        for (let seed = 1; seed <= 120; seed++) {
          const c = makeClue(seed * 104729 + grade * 17 + level, grade, level);
          const where = `g${grade} l${level} ${c.kind}: ${c.text}`;
          seen.add(c.kind);
          assert.ok(!/NaN|undefined|Infinity|\[object/.test(c.text), where);
          assert.ok(inside(c.target, c.min, c.max), `${where} → target ${pt(c.target)} off the map`);
          for (const l of [...c.landmarks, ...c.decor]) assert.ok(inside(l, c.min, c.max), `${where} → ${l.label} off the map`);
          for (const d of c.decor) assert.ok(!same(d, c.target), `${where} → scenery on the treasure`);
          if (c.kind !== 'steps') assert.equal(c.axes, true);
          if (c.min < 0) assert.ok(grade >= 6, where);

          if (c.kind === 'steps' || c.kind === 'translate') {
            // Walking the legs from the landmark, every step on the map, ends on the treasure.
            let at = { x: c.landmarks[0].x, y: c.landmarks[0].y };
            for (const leg of c.legs!) {
              at = { x: at.x + leg.x, y: at.y + leg.y };
              assert.ok(inside(at, c.min, c.max), `${where} → walks off the map`);
            }
            assert.ok(same(at, c.target), where);
            assert.ok(!same(c.landmarks[0], c.target), where);
          }
          if (c.kind === 'plot') assert.ok(c.text.includes(pt(c.target)), where);
          if (c.kind === 'read') {
            assert.ok(c.options!.includes(pt(c.target)), where);
            assert.equal(new Set(c.options).size, c.options!.length, where);
            assert.ok(c.options!.length >= 3, where);
          }
          if (c.kind === 'reflect') {
            const s = c.landmarks[0];
            const t = c.target;
            const ok = (/x-axis/.test(c.text) && t.x === s.x && t.y === -s.y)
              || (/y-axis/.test(c.text) && t.x === -s.x && t.y === s.y)
              || (/y = x/.test(c.text) && t.x === s.y && t.y === s.x);
            assert.ok(ok && !same(s, t), where);
          }
          if (c.kind === 'midpoint') {
            const [a, b] = c.landmarks;
            assert.ok(!same(a, b), where);
            assert.equal(a.x + b.x, 2 * c.target.x, where);
            assert.equal(a.y + b.y, 2 * c.target.y, where);
          }
          if (c.kind === 'line') {
            assert.ok(c.lines!.length >= 1, where);
            for (const { m, c: k } of c.lines!) {
              assert.equal(m * c.target.x + k, c.target.y, where);
              assert.ok(c.text.includes(lineText(m, k)), where);
            }
            if (c.lines!.length === 2) assert.notEqual(c.lines![0].m, c.lines![1].m, where);
          }
        }
      }
    }
    assert.deepEqual([...seen].sort(), ['line', 'midpoint', 'plot', 'read', 'reflect', 'steps', 'translate']);
  });

  test('lines read the way a book prints them', () => {
    assert.equal(lineText(2, -1), 'y = 2x − 1');
    assert.equal(lineText(-1, 5), 'y = −x + 5');
    assert.equal(lineText(1, 0), 'y = x');
    assert.equal(lineText(0, -3), 'y = −3');
  });
});

describe('digging', () => {
  const clue = makeClue(7, 9, 1);
  const t = clue.target;
  test('the right spot finds it', () => assert.equal(checkDig(clue, t).ok, true));
  test('swapped coordinates are named as swapped', () => {
    if (t.x === t.y) return;
    const v = checkDig(clue, { x: t.y, y: t.x });
    assert.equal(v.ok, false);
    assert.match(v.message, /swapped/);
  });
  test('a sign slip is named as a sign slip', () => {
    if (t.x === 0) return;
    const v = checkDig(clue, { x: -t.x, y: t.y });
    assert.match(v.message, /signs/);
  });
});
