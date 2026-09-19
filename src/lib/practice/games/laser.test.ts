import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  angleFromPointer, bearingText, checkShot, clampToScale, fromBearing, gap, kindsFor, makeShot, nameOf, norm, radianText, toBearing,
} from './laser';

describe('angles', () => {
  test('norm and gap', () => {
    assert.equal(norm(-30), 330);
    assert.equal(norm(725), 5);
    assert.equal(gap(350, 10), 20);
    assert.equal(gap(90, 270), 180);
  });
  test('the pointer: right is 0°, up is 90°, anticlockwise', () => {
    assert.equal(angleFromPointer(1, 0), 0);
    assert.equal(angleFromPointer(0, -1), 90);
    assert.equal(angleFromPointer(-1, 0), 180);
    assert.equal(angleFromPointer(0, 1), 270);
    assert.equal(angleFromPointer(1, -1), 45);
  });
  test('bearings: north is 000°, east is 090°, clockwise', () => {
    assert.equal(toBearing(90), 0);
    assert.equal(toBearing(0), 90);
    assert.equal(toBearing(270), 180);
    for (let b = 0; b < 360; b += 5) assert.equal(toBearing(fromBearing(b)), b);
    assert.equal(bearingText(60), '060°');
  });
  test('radians', () => {
    assert.equal(radianText(180), 'π');
    assert.equal(radianText(120), '2π/3');
    assert.equal(radianText(30), 'π/6');
    assert.equal(radianText(330), '11π/6');
  });
  test('a half protractor stops at its ends', () => {
    assert.equal(clampToScale(200, 'half'), 180);
    assert.equal(clampToScale(350, 'half'), 0);
    assert.equal(clampToScale(350, 'full'), 350);
  });
  test('kinds of angle', () => {
    assert.equal(nameOf(30), 'acute');
    assert.equal(nameOf(90), 'right');
    assert.equal(nameOf(135), 'obtuse');
    assert.equal(nameOf(180), 'straight');
    assert.equal(nameOf(250), 'reflex');
    assert.equal(nameOf(0), null);
  });
});

describe('shots', () => {
  test('kinds unlock with grade', () => {
    assert.deepEqual(kindsFor(3, 1), ['kind']);
    assert.ok(kindsFor(4, 1).includes('measure'));
    assert.ok(kindsFor(9, 1).includes('bearing'));
    assert.ok(kindsFor(11, 1).includes('radian'));
  });

  test('every shot is fair: on its scale, not already aimed, and hit by aiming true', () => {
    const seen = new Set<string>();
    for (let grade = 3; grade <= 12; grade++) {
      for (let level = 1; level <= 6; level++) {
        for (let seed = 1; seed <= 150; seed++) {
          const s = makeShot(seed * 6151 + grade * 13 + level, grade, level);
          const where = `g${grade} l${level} ${s.kind}: ${s.text} (target ${s.target}, start ${s.start})`;
          seen.add(s.kind);
          assert.ok(!/NaN|undefined|Infinity/.test(s.text), where);
          assert.equal(clampToScale(s.start, s.scale), s.start, `${where} → starts off the scale`);
          if (s.kind === 'measure') {
            assert.ok(s.options!.includes(s.correctOption!), where);
            assert.equal(s.correctOption, `${s.target}°`, where);
            assert.equal(new Set(s.options).size, s.options!.length, where);
            assert.ok(s.options!.includes(`${180 - s.target}°`), `${where} → the other-scale trap is missing`);
            continue;
          }
          const aimTrue = s.kind === 'bearing' ? fromBearing(s.target) : s.target;
          assert.equal(clampToScale(aimTrue, s.scale), norm(aimTrue), `${where} → target off the scale`);
          assert.equal(checkShot(s, aimTrue).ok, true, where);
          assert.equal(checkShot(s, s.start).ok, false, `${where} → already on target`);
          if (s.kind === 'missing') {
            const total = s.given!.reduce((a, b) => a + b, 0) + s.target;
            assert.ok([90, 180, 360].includes(total) && s.target > 0, where);
          }
        }
      }
    }
    assert.deepEqual([...seen].sort(), ['bearing', 'estimate', 'kind', 'measure', 'missing', 'radian', 'turn']);
  });

  test('tolerance is a hit, one more is a miss', () => {
    const s = { ...makeShot(1, 6, 1), kind: 'turn' as const, target: 130, tolerance: 2, scale: 'half' as const };
    assert.equal(checkShot(s, 132).ok, true);
    assert.equal(checkShot(s, 133).ok, false);
    assert.match(checkShot(s, 130).message, /Bullseye/);
  });
  test('a bearing is read clockwise from north', () => {
    const s = { ...makeShot(1, 9, 1), kind: 'bearing' as const, target: 135, tolerance: 3, scale: 'compass' as const };
    assert.equal(checkShot(s, fromBearing(135)).ok, true);
    assert.equal(checkShot(s, 135).ok, false, 'anticlockwise from east is not a bearing');
  });
});
