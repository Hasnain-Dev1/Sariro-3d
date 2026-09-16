import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  BAND_ORDER, bandLevel, bandOfLevel, bandForGrade, speakingCourseId, bandOfCourseId, isSpeakingCourseId, bandCourseName,
} from './bands';

describe('Public Speaking is five courses, one per band', () => {
  test('a band round-trips through its level and its lesson course id', () => {
    for (const b of BAND_ORDER) {
      assert.equal(bandOfLevel(bandLevel(b)), b);
      assert.equal(bandOfCourseId(speakingCourseId(b)), b);
    }
  });

  test('the old single course is still a Public Speaking course, with no band of its own', () => {
    assert.equal(bandOfLevel('focus'), null);
    assert.equal(bandOfCourseId('public-speaking-focus'), null);
    assert.equal(isSpeakingCourseId('public-speaking-focus'), true);
    assert.equal(isSpeakingCourseId('mathematics-grade-7'), false);
  });

  test('grades land in the founder’s bands: 1–3, 4–6, 7–9, 10–12, UG/PG/professional', () => {
    assert.deepEqual([1, 3, 4, 6, 7, 9, 10, 12, 13, 14].map(bandForGrade),
      ['foundation', 'foundation', 'primary', 'primary', 'middle', 'middle', 'senior', 'senior', 'adult', 'adult']);
    assert.equal(bandForGrade(null), 'middle');
  });

  test('nothing that merely looks like a band is one', () => {
    assert.equal(bandOfLevel('band-toddler'), null);
    assert.equal(bandOfLevel('grade-7'), null);
    assert.equal(bandOfCourseId('public-speaking-grade-7'), null);
  });

  test('named the way a parent reads it', () => {
    assert.equal(bandCourseName('adult'), 'Public Speaking · UG, PG & professionals');
  });
});
