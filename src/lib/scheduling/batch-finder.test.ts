import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { batchLessonAt, daysLabel, fitFor, freeSeats, matchesFilters, rankForStudent, seatCapacity, type BatchSummary } from './batch-finder';

const batch = (over: Partial<BatchSummary> = {}): BatchSummary => ({
  cohortId: 'c', batchCode: 'PS-F-01', courseTitle: 'Public Speaking · Grades 1–3', track: 'public-speaking', level: 'band-foundation',
  ratio: '1:4', status: 'active', country: null, capacity: 4, enrolled: 2, studentNames: ['A', 'B'], scheduleId: 's',
  teacher: { id: 't1', name: 'Mimo' }, days: [{ day: 0, time: '17:00:00' }], timezone: 'Asia/Kolkata',
  lessonsDone: 11, nextLesson: { number: 12, name: 'Show and tell day' }, totalLessons: 48,
  nextClassAt: '2026-09-20T11:30:00Z', remaining: 37, ...over,
});

describe('seats', () => {
  test('a batch holds its own limit, or what its ratio allows', () => {
    assert.equal(seatCapacity('1:4', null), 4);
    assert.equal(seatCapacity('1:1', undefined), 1);
    assert.equal(seatCapacity('1:4', 3), 3);
    assert.equal(freeSeats(batch({ enrolled: 4 })), 0);
    assert.equal(freeSeats(batch({ enrolled: 5 })), 0, 'never negative');
  });
});

describe('filters', () => {
  test('a scheduler’s question: this course, a seat free, around lesson 12, on a Sunday', () => {
    const f = { courseTitle: 'Public Speaking · Grades 1–3', freeSeatsOnly: true, lessonFrom: 10, lessonTo: 14, day: 0 };
    assert.equal(matchesFilters(batch(), f), true);
    assert.equal(matchesFilters(batch({ enrolled: 4 }), f), false, 'full');
    assert.equal(matchesFilters(batch({ nextLesson: { number: 20, name: 'x' } }), f), false, 'too far on');
    assert.equal(matchesFilters(batch({ days: [{ day: 3, time: '17:00' }] }), f), false, 'not a Sunday');
    assert.equal(matchesFilters(batch({ courseTitle: 'Mathematics · Grade 7' }), f), false, 'another course');
    assert.equal(matchesFilters(batch(), { teacherId: 't2' }), false, 'another teacher');
  });

  test('a batch with nothing scheduled is at the lesson after the last one taught', () => {
    assert.equal(batchLessonAt(batch({ nextLesson: null, lessonsDone: 7 })), 8);
  });
});

describe('fitting one child', () => {
  test('the batch at their lesson, with a seat and no clash, comes first', () => {
    const ranked = rankForStudent([
      batch({ cohortId: 'ahead', nextLesson: { number: 15, name: 'x' } }),
      batch({ cohortId: 'clash', clashAt: '2026-09-20T11:30:00Z' }),
      batch({ cohortId: 'perfect', nextLesson: { number: 12, name: 'x' } }),
      batch({ cohortId: 'behind', nextLesson: { number: 9, name: 'x' } }),
      batch({ cohortId: 'full', enrolled: 4 }),
    ], { lessonsDone: 11 });
    assert.deepEqual(ranked.map((r) => r.batch.cohortId), ['perfect', 'behind', 'ahead', 'full', 'clash']);
  });

  test('the note says what joining would mean', () => {
    assert.equal(fitFor(batch(), { lessonsDone: 11 }).note, 'At the lesson they are up to');
    assert.match(fitFor(batch({ nextLesson: { number: 14, name: 'x' } }), { lessonsDone: 11 }).note, /miss 2/);
    assert.match(fitFor(batch({ nextLesson: { number: 11, name: 'x' } }), { lessonsDone: 11 }).note, /repeat one/);
  });
});

test('days read the way a timetable does', () => {
  assert.equal(daysLabel([{ day: 3, time: '18:30:00' }, { day: 0, time: '17:00:00' }]), 'Sun 17:00, Wed 18:30');
  assert.equal(daysLabel([]), 'No days set');
});
