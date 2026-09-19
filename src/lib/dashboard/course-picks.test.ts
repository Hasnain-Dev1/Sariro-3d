import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { courseGrid, describeCourses, MAX_COURSES, pickKey, readCourses } from './course-picks';
import { checkCourse } from './course-options';

describe('the grid', () => {
  test('every chip is a course the API will accept', () => {
    for (const family of ['coding', 'school', 'focus'] as const) {
      for (const row of courseGrid(family)) {
        assert.ok(row.levels.length > 0, `${row.track} has levels`);
        for (const l of row.levels) assert.ok(checkCourse(row.track, l.level).ok, `${row.track} ${l.level}`);
      }
    }
  });
  test('school chips are just the grade, and follow the subject', () => {
    const physics = courseGrid('school').find((r) => r.track === 'physics')!;
    assert.deepEqual(physics.levels.map((l) => l.label), ['7', '8', '9', '10', '11', '12']);
    assert.equal(physics.levels[0].level, 'grade-7');
  });
  test('Public Speaking is five band courses; other focus courses have one', () => {
    const focus = courseGrid('focus');
    assert.equal(focus.find((r) => r.track === 'public-speaking')!.levels.length, 5);
    assert.deepEqual(focus.find((r) => r.track === 'calculus')!.levels.map((l) => l.level), ['focus']);
  });
});

describe('reading a course list', () => {
  test('checked, deduplicated, case-blind for duplicates', () => {
    const r = readCourses([
      { track: 'mathematics', level: 'grade-3' },
      { track: 'mathematics', level: 'grade-3' },
      { track: 'python', level: 'Beginner' },
      { track: 'python', level: 'beginner' },
    ]);
    assert.ok(r.ok);
    assert.deepEqual(r.courses, [{ track: 'mathematics', level: 'grade-3' }, { track: 'python', level: 'Beginner' }]);
  });
  test('one bad course refuses the whole list, and says which', () => {
    const r = readCourses([{ track: 'mathematics', level: 'grade-3' }, { track: 'chemistry', level: 'grade-2' }]);
    assert.ok(!r.ok);
    assert.match(r.message, /^chemistry · grade-2:/);
  });
  test('the old single-course body still works; empty and oversized lists do not', () => {
    const one = readCourses(undefined, { track: 'web', level: 'advanced' });
    assert.ok(one.ok);
    assert.deepEqual(one.courses, [{ track: 'web', level: 'advanced' }]);
    assert.equal(readCourses([]).ok, false);
    assert.equal(readCourses(undefined, {}).ok, false);
    const tooMany = Array.from({ length: MAX_COURSES + 1 }, () => ({ track: 'web', level: 'advanced' }));
    assert.equal(readCourses(tooMany).ok, false);
    assert.equal(readCourses([null, 7]).ok, false);
  });
  test('the key ignores level case', () => {
    assert.equal(pickKey({ track: 'python', level: 'Beginner' }), pickKey({ track: 'python', level: 'beginner' }));
  });
});

describe('saying many courses briefly', () => {
  test('runs of grades are joined, one line per subject', () => {
    const grades = [1, 2, 3, 4, 5, 6, 9].map((g) => ({ track: 'mathematics', level: `grade-${g}` }));
    assert.deepEqual(describeCourses([...grades, { track: 'physics', level: 'grade-11' }]), ['Mathematics · Grades 1–6, 9', 'Physics · Grade 11']);
  });
  test('levels and bands are listed', () => {
    const [line] = describeCourses([{ track: 'python', level: 'beginner' }, { track: 'python', level: 'advanced' }]);
    assert.equal(line, 'Python Basics · Beginner, Advanced');
  });
});
