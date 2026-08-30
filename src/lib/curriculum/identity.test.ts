import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  IDENTITY_OVERRIDES,
  listContentUnits,
  normalizeLessonName,
  parseModuleNum,
  parseUnitKey,
  resolveSyllabusLesson,
  resolveUnitKey,
  unitKeyOf,
} from './identity';

/**
 * SARIRO — content identity tests
 * =========================================================
 * `STAGE-2-BUILD.md` §4 calls this the BLOCKER that every later slice sits on:
 * two incompatible lesson identities in production, and no reliable join
 * between "what a student completed" and "what that lesson taught".
 *
 * The failure mode is silent. A rename, a reordered module, an off-by-one in a
 * lesson index — none of them throw. They just orphan a learner's history, and
 * the first symptom is a mastery profile that no longer describes the child.
 *
 * `scripts/audit-content-identity.ts` checks the real data. These check the
 * RULES, so a regression in the resolver is caught before it reaches the data.
 */

describe('unitKeyOf / parseUnitKey', () => {
  test('round-trips', () => {
    const key = unitKeyOf('web-101', 2, 4);
    assert.equal(key, 'web-101:2:4');
    assert.deepEqual(parseUnitKey(key), { courseId: 'web-101', moduleNum: 2, lessonIndex: 4 });
  });

  test('index 0 survives — modules are 0-based and 0 is falsy', () => {
    // The exact shape of the live bug this layer was built to catch: agent-101
    // module 4 numbered lessons 1..6 while every other module is 0..5, and a
    // paying student got the wrong content for every lesson in it.
    const parsed = parseUnitKey(unitKeyOf('agent-101', 4, 0));
    assert.deepEqual(parsed, { courseId: 'agent-101', moduleNum: 4, lessonIndex: 0 });
  });

  test('rejects anything malformed rather than guessing', () => {
    // A key that parses "successfully" into nonsense would attach evidence to
    // the wrong lesson, which is worse than attaching it to none.
    for (const bad of ['', 'web-101', 'web-101:2', 'web-101:2:4:5', ':2:4', 'web-101:x:4', 'web-101:2:y']) {
      assert.equal(parseUnitKey(bad), null, `accepted malformed key: "${bad}"`);
    }
  });

  test('a non-integer position is not a position', () => {
    assert.equal(parseUnitKey('web-101:2.5:4'), null);
  });
});

describe('normalizeLessonName', () => {
  test('folds the cosmetic differences between the two authoring surfaces', () => {
    // The real pair from the module doc: "+" in the syllabus, "&" in the
    // structured lesson. These are the same lesson.
    assert.equal(
      normalizeLessonName('HTML structure + semantic tags'),
      normalizeLessonName('HTML structure & semantic tags')
    );
  });

  test('smart quotes, dashes and casing do not make two lessons different', () => {
    assert.equal(normalizeLessonName('The Builder’s Mindset'), normalizeLessonName("the builder's mindset"));
    assert.equal(normalizeLessonName('State — and why it leaks'), normalizeLessonName('State - and why it leaks'));
    assert.equal(normalizeLessonName('  Padded   Name  '), normalizeLessonName('Padded Name'));
  });

  test('genuinely different lessons stay different', () => {
    // Normalisation must not be so aggressive that it merges real lessons.
    assert.notEqual(normalizeLessonName('Module 1 build'), normalizeLessonName('Module 2 build'));
    assert.notEqual(normalizeLessonName('Forms'), normalizeLessonName('Formulas'));
  });

  test('is idempotent', () => {
    const once = normalizeLessonName('HTML structure + semantic tags');
    assert.equal(normalizeLessonName(once), once);
  });
});

describe('parseModuleNum', () => {
  test('accepts the zero-padded strings the database actually stores', () => {
    assert.equal(parseModuleNum('02'), 2);
    assert.equal(parseModuleNum('2'), 2);
    assert.equal(parseModuleNum(2), 2);
    assert.equal(parseModuleNum(' 03 '), 3);
  });

  test('refuses what is not a module number', () => {
    assert.equal(parseModuleNum('two'), null);
    assert.equal(parseModuleNum(''), null);
    assert.equal(parseModuleNum('2.5'), null);
  });
});

describe('resolveSyllabusLesson', () => {
  const units = listContentUnits();

  test('the real catalogue resolves to unique keys', () => {
    // A duplicate unitKey would silently merge two lessons' evidence.
    assert.ok(units.length > 0, 'no content units — the fixture data is missing');
    const keys = units.map((u) => u.unitKey);
    assert.equal(new Set(keys).size, keys.length, 'duplicate unitKey in the catalogue');
  });

  test('every content unit has a parseable key', () => {
    for (const u of units) {
      assert.ok(parseUnitKey(u.unitKey), `unparseable unitKey: ${u.unitKey}`);
    }
  });

  test('resolves by ORDINAL position, not by name', () => {
    // The core rule. Names drift between the two surfaces; positions do not.
    const unit = units[0];
    const parsed = parseUnitKey(unit.unitKey)!;
    const resolved = resolveSyllabusLesson(
      parsed.courseId,
      String(parsed.moduleNum),
      'a name that appears nowhere in any syllabus'
    );
    // A wrong name must not prevent resolution — at worst it downgrades quality.
    assert.ok(
      resolved.quality !== 'exact',
      'a fabricated name should never report an exact match'
    );
  });

  test('a position that does not exist is unresolved, never a wrong guess', () => {
    const r = resolveSyllabusLesson('web-101', '99', 'nothing here');
    assert.equal(r.unitKey, null);
    assert.equal(r.quality, 'unresolved');
  });

  test('an unknown course resolves to nothing', () => {
    const r = resolveSyllabusLesson('not-a-course', '1', 'whatever');
    assert.equal(r.unitKey, null);
    assert.equal(r.quality, 'unresolved');
  });

  test('resolveUnitKey agrees with resolveSyllabusLesson', () => {
    const unit = units[0];
    const parsed = parseUnitKey(unit.unitKey)!;
    const viaResolve = resolveSyllabusLesson(parsed.courseId, String(parsed.moduleNum), unit.name);
    const viaKey = resolveUnitKey(parsed.courseId, String(parsed.moduleNum), unit.name);
    assert.equal(viaKey, viaResolve.unitKey);
  });

  test('a padded module number resolves the same as an unpadded one', () => {
    // `lesson_progress` stores "02"; the structured content uses 2.
    const parsed = parseUnitKey(units[0].unitKey)!;
    if (parsed.moduleNum >= 10) return; // padding only differs below ten
    const padded = resolveUnitKey(parsed.courseId, `0${parsed.moduleNum}`, units[0].name);
    const plain = resolveUnitKey(parsed.courseId, String(parsed.moduleNum), units[0].name);
    assert.equal(padded, plain);
  });
});

describe('IDENTITY_OVERRIDES', () => {
  test('is empty — every entry would be debt', () => {
    // Documented as "empty by design: every entry here is a piece of debt.
    // Prefer fixing the data." This test makes adding one a deliberate act.
    assert.deepEqual(
      Object.keys(IDENTITY_OVERRIDES),
      [],
      'an override was added — fix the underlying data instead, or update this test knowingly'
    );
  });
});
