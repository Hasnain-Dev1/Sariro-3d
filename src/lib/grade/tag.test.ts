import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  gradeTag, gradeName, normaliseGrade, isSchoolGrade, gradeFromStage, parseGrade,
  GRADE_CHOICES, GRADE_UNDERGRADUATE, GRADE_PROFESSIONAL,
} from './tag';

/**
 * SARIRO — the grade-tag tests
 * ============================================================================
 * One vocabulary shown on every screen, so its edges are pinned here rather
 * than rediscovered on each of them.
 */

describe('the tags', () => {
  test('school grades are G1 to G12', () => {
    for (let g = 1; g <= 12; g++) assert.equal(gradeTag(g), `G${g}`);
  });

  test('13 is an undergraduate, 14 a graduate or professional', () => {
    assert.equal(gradeTag(GRADE_UNDERGRADUATE), 'U');
    assert.equal(gradeTag(GRADE_PROFESSIONAL), 'P');
  });

  /* The founder's rule: not given shows as U. */
  test('anything unknown shows as U', () => {
    for (const bad of [null, undefined, '', 0, 15, -1, 7.5, Number.NaN, 'abc']) {
      assert.equal(gradeTag(bad), 'U', `${String(bad)} did not show as U`);
    }
  });

  test('a numeric string reads as the number', () => {
    assert.equal(gradeTag('7'), 'G7');
  });
});

describe('the data keeps what the display hides', () => {
  /* Unknown and undergraduate look the same on screen, and must not look the
     same in the database — or the rule could never be changed. */
  test('unknown normalises to null, never to 13', () => {
    assert.equal(normaliseGrade(null), null);
    assert.equal(normaliseGrade(undefined), null);
    assert.equal(normaliseGrade(''), null);
    assert.notEqual(normaliseGrade(null), GRADE_UNDERGRADUATE);
  });

  test('only integers from 1 to 14 survive', () => {
    assert.equal(normaliseGrade(1), 1);
    assert.equal(normaliseGrade(14), 14);
    assert.equal(normaliseGrade(0), null);
    assert.equal(normaliseGrade(15), null);
    assert.equal(normaliseGrade(3.2), null);
  });

  test('school grades are 1 to 12 and nothing above', () => {
    assert.equal(isSchoolGrade(12), true);
    assert.equal(isSchoolGrade(13), false);
    assert.equal(isSchoolGrade(null), false);
  });
});

describe('the long names', () => {
  test('say what the tag stands for', () => {
    assert.equal(gradeName(7), 'Grade 7');
    assert.equal(gradeName(13), 'Undergraduate');
    assert.equal(gradeName(14), 'Graduate or working professional');
    assert.equal(gradeName(null), 'Grade not given');
  });
});

describe('the picker', () => {
  test('offers G1 to G12, then U, then P — fourteen choices in order', () => {
    assert.deepEqual(
      GRADE_CHOICES.map((c) => c.tag),
      ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7', 'G8', 'G9', 'G10', 'G11', 'G12', 'U', 'P']
    );
  });
});

describe('the old demo form’s columns', () => {
  test('postgraduate counts as P — finished school and college', () => {
    assert.equal(gradeFromStage('postgraduate', null), GRADE_PROFESSIONAL);
    assert.equal(gradeFromStage('professional', null), GRADE_PROFESSIONAL);
    assert.equal(gradeFromStage('undergraduate', null), GRADE_UNDERGRADUATE);
  });

  test('a school stage keeps its grade', () => {
    assert.equal(gradeFromStage('school', 8), 8);
  });

  test('a school stage cannot smuggle in 13', () => {
    assert.equal(gradeFromStage('school', 13), null);
  });

  test('nothing given is nothing', () => {
    assert.equal(gradeFromStage(null, null), null);
  });
});

describe('what a person might type', () => {
  test('G7, g7 and 7 are the same grade', () => {
    assert.equal(parseGrade('G7'), 7);
    assert.equal(parseGrade('g7'), 7);
    assert.equal(parseGrade('7'), 7);
    assert.equal(parseGrade(7), 7);
  });

  test('U and P are understood', () => {
    assert.equal(parseGrade('u'), GRADE_UNDERGRADUATE);
    assert.equal(parseGrade('P'), GRADE_PROFESSIONAL);
  });

  test('G13 is not a thing — U is', () => {
    assert.equal(parseGrade('G13'), null);
  });

  test('rubbish is refused', () => {
    assert.equal(parseGrade('year nine'), null);
    assert.equal(parseGrade(''), null);
  });
});
