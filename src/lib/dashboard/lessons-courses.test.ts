import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseSchoolCourseId, lessonCourseIdFor, lessonCourseExists,
  allLessonCourses, flattenCourseLessons,
} from './lessons-data';

/**
 * SARIRO — every course a child can be enrolled in has lessons
 * =========================================================
 * The lesson system used to know only the coding tracks. School subjects and
 * focus courses were invisible to it: no page could be authored, no student
 * could open one, and a teacher could not read the syllabus before class.
 *
 * Public Speaking is the case that made it obvious — priced on /pricing, sold
 * on the homepage, forty-six authored lesson titles in the codebase, and no way
 * to reach any of it.
 */

describe('reading a course id', () => {
  test('a focus course has no grade', () => {
    assert.deepEqual(parseSchoolCourseId('public-speaking-focus'), {
      subjectSlug: 'public-speaking', grade: 0,
    });
  });

  /**
   * The reason this parses from the END. Splitting on the first hyphen would
   * make Public Speaking a subject called "public", and Organic Chemistry a
   * subject called "organic".
   */
  test('subject slugs may contain hyphens of their own', () => {
    assert.deepEqual(parseSchoolCourseId('organic-chemistry-focus'), {
      subjectSlug: 'organic-chemistry', grade: 0,
    });
    assert.deepEqual(parseSchoolCourseId('algebra-1-focus'), {
      subjectSlug: 'algebra-1', grade: 0,
    });
  });

  test('a school subject carries its grade', () => {
    assert.deepEqual(parseSchoolCourseId('mathematics-grade-7'), {
      subjectSlug: 'mathematics', grade: 7,
    });
    assert.deepEqual(parseSchoolCourseId('mathematics-grade-12'), {
      subjectSlug: 'mathematics', grade: 12,
    });
  });

  test('a coding course is not a school course', () => {
    assert.equal(parseSchoolCourseId('web-101'), null);
    assert.equal(parseSchoolCourseId('python-elem'), null);
  });

  test('an invented subject is refused rather than half-parsed', () => {
    assert.equal(parseSchoolCourseId('astrology-focus'), null);
    assert.equal(parseSchoolCourseId('astrology-grade-7'), null);
  });
});

describe('an enrolment finds its course', () => {
  test('all three kinds resolve', () => {
    assert.equal(lessonCourseIdFor('web', 'beginner'), 'web-101');
    assert.equal(lessonCourseIdFor('public-speaking', 'focus'), 'public-speaking-focus');
    assert.equal(lessonCourseIdFor('mathematics', 'grade-7'), 'mathematics-grade-7');
  });

  test('level case does not matter — enrolments store it either way', () => {
    assert.equal(lessonCourseIdFor('web', 'Beginner'), 'web-101');
    assert.equal(lessonCourseIdFor('public-speaking', 'FOCUS'), 'public-speaking-focus');
  });

  test('a track that is not offered resolves to nothing, not to a broken id', () => {
    assert.equal(lessonCourseIdFor('astrology', 'focus'), null);
    assert.equal(lessonCourseIdFor('mathematics', 'grade-99'), null);
  });

  test('what it builds is what the parser reads back', () => {
    for (const [track, level] of [
      ['public-speaking', 'focus'], ['organic-chemistry', 'focus'],
      ['mathematics', 'grade-7'], ['english', 'grade-12'],
    ] as const) {
      const id = lessonCourseIdFor(track, level)!;
      assert.equal(parseSchoolCourseId(id)?.subjectSlug, track, id);
    }
  });
});

describe('Public Speaking, the course that could not be reached', () => {
  const lessons = flattenCourseLessons('public-speaking-focus');

  test('has its lessons', () => {
    assert.equal(lessons.length, 48);
  });

  test('with the titles somebody actually wrote, not "Lesson 1"', () => {
    assert.equal(lessons[0].lesson_name, 'Speaking well is learnable, not a gift');
    assert.equal(lessons[0].module_name, 'Finding Your Voice');
  });

  test('assessments are kept — they are real classes a teacher turns up to', () => {
    assert.ok(lessons.some((l) => /assessment/i.test(l.lesson_name)));
  });

  test('ordering is unbroken and starts at zero', () => {
    assert.deepEqual(lessons.map((l) => l.order), lessons.map((_, i) => i));
  });

  test('module keys are zero-padded, matching what lesson_progress stores', () => {
    assert.equal(lessons[0].module_str, '01');
  });
});

describe('the whole catalogue', () => {
  const all = allLessonCourses();

  test('covers coding, school and focus', () => {
    for (const family of ['coding', 'school', 'focus'] as const) {
      assert.ok(all.some((c) => c.family === family), `no ${family} courses`);
    }
  });

  test('every id in it actually has lessons', () => {
    for (const c of all) {
      assert.ok(flattenCourseLessons(c.id).length > 0, `${c.id} has no lessons`);
      assert.equal(lessonCourseExists(c.id), true, c.id);
    }
  });

  test('no duplicate ids — a duplicate would overwrite pages', () => {
    assert.equal(new Set(all.map((c) => c.id)).size, all.length);
  });

  test('every course has a title a person would recognise', () => {
    for (const c of all) {
      assert.ok(c.title.trim().length > 2, c.id);
      assert.ok(!/^[a-z-]+$/.test(c.title), `${c.id} shows a raw slug: ${c.title}`);
    }
  });
});
