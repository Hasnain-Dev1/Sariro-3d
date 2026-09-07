import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  summariseCapabilities, capabilityLine, capabilityDetail,
  isTrainedFor, isEligibleFor, type TeacherAssignmentRow,
} from './teacher-capability';

/**
 * SARIRO — nine rows of eligibility, read as three subjects
 * ============================================================================
 * The founder's example, verbatim: a teacher trained for 1 coding, 2 maths and
 * 1 public speaking should read as "coding, maths, public speaking". Not four
 * rows, not a count — the subjects, which is the unit everybody thinks in.
 *
 * The half of this that has to be right is the other half: a subject is only
 * "trained" when every level under it is. Rounding that up puts a teacher in
 * front of a Grade 9 class they were never prepared for.
 */

const row = (track: string, level: string, trained = true): TeacherAssignmentRow => ({
  track,
  level,
  training_completed_at: trained ? '2026-09-01T00:00:00Z' : null,
});

describe('the founder’s example', () => {
  const rows = [
    row('web', 'beginner'),
    row('mathematics', 'grade-7'),
    row('mathematics', 'grade-8'),
    row('public-speaking', 'focus'),
  ];

  test('four rows collapse to three subjects', () => {
    const caps = summariseCapabilities(rows);
    assert.equal(caps.length, 3);
  });

  test('two grades of maths are one chip, not two', () => {
    const maths = summariseCapabilities(rows).find((c) => c.track === 'mathematics')!;
    assert.deepEqual(maths.levels, ['grade-7', 'grade-8']);
    assert.equal(maths.trainedCount, 2);
    assert.equal(maths.trained, true);
  });

  test('the one-line version reads as a sentence', () => {
    // The labels come from the real catalogue, not from what a test author
    // assumes a track is called — `web` is "Web Builder Pro" in the product.
    assert.equal(capabilityLine(rows), 'Mathematics, Web Builder Pro, Public Speaking');
  });

  test('school first, then coding, then focus — the same on every screen', () => {
    const families = summariseCapabilities(rows).map((c) => c.family);
    assert.deepEqual(families, ['school', 'coding', 'focus']);
  });
});

describe('trained is not the same as eligible', () => {
  test('a subject is trained only when every level under it is', () => {
    const caps = summariseCapabilities([
      row('mathematics', 'grade-7', true),
      row('mathematics', 'grade-8', false),
    ]);
    const maths = caps[0];
    assert.equal(maths.trained, false, 'half-trained maths must not read as trained');
    assert.equal(maths.trainedCount, 1);
    assert.equal(capabilityDetail(maths), '1 of 2 trained');
  });

  test('nothing signed off says so plainly', () => {
    const caps = summariseCapabilities([row('web', 'beginner', false)]);
    assert.equal(caps[0].trained, false);
    assert.equal(capabilityDetail(caps[0]), 'training pending');
  });

  test('fully trained school subject lists its grades in order', () => {
    const caps = summariseCapabilities([
      row('mathematics', 'grade-10'),
      row('mathematics', 'grade-7'),
      row('mathematics', 'grade-9'),
    ]);
    assert.equal(capabilityDetail(caps[0]), 'Grade 7, 9, 10');
  });

  test('a focus course says what it is', () => {
    const caps = summariseCapabilities([row('public-speaking', 'focus')]);
    assert.equal(capabilityDetail(caps[0]), 'focus course');
  });

  test('coding lists its levels', () => {
    const caps = summariseCapabilities([row('web', 'beginner'), row('web', 'advanced')]);
    assert.equal(capabilityDetail(caps[0]), 'beginner, advanced');
  });
});

describe('the strict question the scheduler asks', () => {
  const rows = [
    row('mathematics', 'grade-7', true),
    row('mathematics', 'grade-9', false),
  ];

  /* "Trained for Mathematics" is a summary for humans. A Grade 9 class needs
     the Grade 9 row signed off, and the summary must never decide that. */
  test('trained for one grade is not trained for another', () => {
    assert.equal(isTrainedFor(rows, 'mathematics', 'grade-7'), true);
    assert.equal(isTrainedFor(rows, 'mathematics', 'grade-9'), false);
  });

  test('eligible covers what trained does not', () => {
    assert.equal(isEligibleFor(rows, 'mathematics', 'grade-9'), true);
    assert.equal(isEligibleFor(rows, 'mathematics', 'grade-11'), false);
  });

  test('a subject they hold nothing for is neither', () => {
    assert.equal(isTrainedFor(rows, 'physics', 'grade-9'), false);
    assert.equal(isEligibleFor(rows, 'physics', 'grade-9'), false);
  });

  test('empty input never throws', () => {
    for (const v of [null, undefined, []]) {
      assert.equal(isTrainedFor(v, 'web', 'beginner'), false);
      assert.equal(isEligibleFor(v, 'web', 'beginner'), false);
      assert.deepEqual(summariseCapabilities(v), []);
      assert.equal(capabilityLine(v), '');
    }
  });
});

describe('rows that are not quite right', () => {
  test('the same course assigned twice is still one course', () => {
    const caps = summariseCapabilities([row('web', 'beginner'), row('web', 'beginner')]);
    assert.equal(caps.length, 1);
    assert.deepEqual(caps[0].levels, ['beginner']);
  });

  test('a row with no track is skipped rather than making a blank chip', () => {
    const caps = summariseCapabilities([
      { track: '', level: 'beginner' },
      { track: '   ', level: 'beginner' },
      row('web', 'beginner'),
    ]);
    assert.equal(caps.length, 1);
    assert.equal(caps[0].track, 'web');
  });

  /* A row stored with an empty level would otherwise report 0 of 0, and
     `0 >= 0` is true — so an untrained course would read as trained. */
  test('an empty level does not make an untrained course look trained', () => {
    const caps = summariseCapabilities([{ track: 'web', level: '', training_completed_at: null }]);
    assert.equal(caps[0].trained, false);
    assert.equal(capabilityDetail(caps[0]), 'training pending');
  });

  test('an unknown track keeps its slug rather than disappearing', () => {
    const caps = summariseCapabilities([row('some-new-course', 'beginner')]);
    assert.equal(caps[0].label, 'some-new-course');
  });
});

describe('the table-cell version', () => {
  const many = [
    row('mathematics', 'grade-7'), row('science', 'grade-7'),
    row('physics', 'grade-9'), row('web', 'beginner'),
    row('public-speaking', 'focus'),
  ];

  test('a limit truncates and says how many are hidden', () => {
    assert.equal(capabilityLine(many, 2), 'Mathematics, Physics +3 more');
    assert.match(capabilityLine(many, 4), /\+1 more$/);
  });

  test('a limit at or above the count does not truncate', () => {
    assert.doesNotMatch(capabilityLine(many, 5), /more/);
    assert.doesNotMatch(capabilityLine(many, 99), /more/);
  });

  test('no limit means everything', () => {
    assert.equal(capabilityLine(many).split(', ').length, 5);
  });
});
