import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  trialSubjects, subjectLabel, isTrialSubject, teachersFor, teacherCanTake,
  tracksFor, CODING_TRIAL,
} from './subjects';

/**
 * SARIRO — what a family can ask for, and who can teach it
 * ============================================================================
 * The booking page never asked what the class was about, so a parent wanting
 * Mathematics could be seated with a Public Speaking teacher and find out
 * during the class, with their child watching.
 *
 * The tests that matter most are the two opposite failures: offering a slot
 * nobody can teach, and offering nothing when somebody can.
 */

describe('coding is one trial, not a syllabus', () => {
  test('the booking page offers exactly one coding choice', () => {
    const coding = trialSubjects().filter((s) => s.group === 'Coding & AI');
    assert.equal(coding.length, 1, 'a parent chooses "coding", not a track');
    assert.equal(coding[0].value, CODING_TRIAL);
  });

  test('it stands for every coding track in the catalogue', () => {
    const tracks = tracksFor(CODING_TRIAL);
    assert.ok(tracks.length > 1, 'the catalogue has several coding tracks');
    // A school subject stands only for itself.
    assert.deepEqual(tracksFor('mathematics'), ['mathematics']);
    assert.deepEqual(tracksFor(''), []);
  });

  test('approval for a SINGLE coding module is approval for the coding trial', () => {
    /* The founder's rule: somebody who teaches one coding module to a grade can
       take that grade's coding taster. Requiring a track called "coding" — which
       no teacher is ever assigned — made every coding trial unbookable. */
    const oneTrack = tracksFor(CODING_TRIAL)[0];
    const eligible = teachersFor(CODING_TRIAL, [{ teacher_id: 't1', track: oneTrack }], ['t1', 't2']);
    assert.deepEqual([...eligible], ['t1']);
  });

  test('a school teacher is still not eligible for the coding trial', () => {
    const eligible = teachersFor(CODING_TRIAL, [{ teacher_id: 't1', track: 'mathematics' }], ['t1']);
    assert.equal(eligible.size, 0, 'the loosening stops at the family boundary');
  });

  test('a trial booked before the change still reads as a real course', () => {
    const oneTrack = tracksFor(CODING_TRIAL)[0];
    assert.notEqual(subjectLabel(oneTrack), oneTrack, 'old bookings must not show a raw slug');
  });
});

describe('the catalogue', () => {
  test('offers school subjects, coding and focus courses', () => {
    const groups = new Set(trialSubjects().map((s) => s.group));
    assert.deepEqual([...groups].sort(), ['Coding & AI', 'Focus courses', 'School subjects']);
  });

  test('every entry has a slug and something readable', () => {
    for (const s of trialSubjects()) {
      assert.ok(s.value.length > 0, JSON.stringify(s));
      assert.ok(s.label.length > 0, JSON.stringify(s));
    }
  });

  test('slugs are unique — two entries writing to one column would be a silent merge', () => {
    const slugs = trialSubjects().map((s) => s.value);
    assert.equal(new Set(slugs).size, slugs.length);
  });

  test('public speaking is offered — it is what most trials are actually for', () => {
    assert.ok(isTrialSubject('public-speaking'));
  });

  test('an unknown slug is not a subject', () => {
    assert.equal(isTrialSubject('underwater-basket-weaving'), false);
    assert.equal(isTrialSubject(''), false);
    assert.equal(isTrialSubject(null), false);
  });

  test('a label falls back to the slug rather than going blank', () => {
    // A trial booked before the catalogue changed still has to render.
    assert.equal(subjectLabel('not-a-real-slug'), 'not-a-real-slug');
    assert.equal(subjectLabel(null), '');
  });
});

const rows = [
  { teacher_id: 'anita', track: 'mathematics', level: 'grade-7' },
  { teacher_id: 'anita', track: 'science', level: 'grade-7' },
  { teacher_id: 'bala', track: 'public-speaking', level: 'focus' },
  // Production really does hold capitalised levels alongside lowercase ones.
  { teacher_id: 'chen', track: 'web', level: 'Intermediate' },
];
const everyone = ['anita', 'bala', 'chen', 'dev'];

describe('who can teach it', () => {
  test('only the teachers approved for that subject', () => {
    assert.deepEqual([...teachersFor('mathematics', rows, everyone)], ['anita']);
  });

  test('a teacher approved for two subjects appears under both', () => {
    assert.ok(teachersFor('science', rows, everyone).has('anita'));
    assert.ok(teachersFor('mathematics', rows, everyone).has('anita'));
  });

  test('level is ignored, because production capitalises it inconsistently', () => {
    // 'Intermediate' vs 'intermediate' is a data accident from two screens
    // written months apart, not a statement about what Chen can teach.
    assert.ok(teachersFor('web', rows, everyone).has('chen'));
  });

  test('subject matching is case-insensitive too', () => {
    assert.ok(teachersFor('Mathematics', rows, everyone).has('anita'));
  });

  test('no subject chosen means everybody, so times still show', () => {
    // A family who has not picked yet should still see that slots exist.
    assert.deepEqual([...teachersFor('', rows, everyone)].sort(), [...everyone].sort());
    assert.deepEqual([...teachersFor(null, rows, everyone)].sort(), [...everyone].sort());
  });

  test('a subject NOBODY teaches is empty, never everybody', () => {
    // The dangerous direction. Falling back to all teachers would offer a
    // Mathematics slot with someone never approved for it, and the family and
    // the teacher would both find out at the same moment.
    assert.equal(teachersFor('astrophysics', rows, everyone).size, 0);
  });

  test('a teacher with no assignment rows at all is not eligible', () => {
    assert.equal(teachersFor('mathematics', rows, everyone).has('dev'), false);
  });
});

describe('grade eligibility', () => {
  const can = (o: Parameters<typeof teacherCanTake>[0]) => teacherCanTake(o);

  test('inside the range is fine', () => {
    assert.equal(can({ subjectOk: true, grade: 6, minGrade: 4, maxGrade: 8 }), true);
  });

  test('the ends of the range are inclusive', () => {
    assert.equal(can({ subjectOk: true, grade: 4, minGrade: 4, maxGrade: 8 }), true);
    assert.equal(can({ subjectOk: true, grade: 8, minGrade: 4, maxGrade: 8 }), true);
  });

  test('outside it is refused, in both directions', () => {
    assert.equal(can({ subjectOk: true, grade: 3, minGrade: 4, maxGrade: 8 }), false);
    assert.equal(can({ subjectOk: true, grade: 9, minGrade: 4, maxGrade: 8 }), false);
  });

  test('no range recorded means any grade', () => {
    // Nobody has filled these in yet. Defaulting the other way would make
    // every teacher ineligible for everything and show a parent an empty
    // booking page on the day this ships.
    assert.equal(can({ subjectOk: true, grade: 11, minGrade: null, maxGrade: null }), true);
    assert.equal(can({ subjectOk: true, grade: 11 }), true);
  });

  test('a half-open range still bounds the side it names', () => {
    assert.equal(can({ subjectOk: true, grade: 2, minGrade: 5, maxGrade: null }), false);
    assert.equal(can({ subjectOk: true, grade: 9, minGrade: 5, maxGrade: null }), true);
    assert.equal(can({ subjectOk: true, grade: 12, minGrade: null, maxGrade: 8 }), false);
  });

  test('no grade given passes — the grade step may not have happened yet', () => {
    assert.equal(can({ subjectOk: true, grade: null, minGrade: 4, maxGrade: 6 }), true);
  });

  test('the wrong subject fails however good the grade is', () => {
    // §9: BOTH conditions, never either.
    assert.equal(can({ subjectOk: false, grade: 5, minGrade: 1, maxGrade: 12 }), false);
  });
});
