import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { COURSES, PRICING_TIERS } from '@/lib/sariro-data';
import { codingPrice } from '@/lib/pricing/coding';
import {
  ladder, ladderRung, projectsAt, recommendLevel, LADDER, COURSE_LEVEL, AGE_BANDS, EXPERIENCE,
} from './coding-ladder';

describe('the ladder', () => {
  const group = ladder('1:4');
  const solo = ladder('1:1');

  test('four rungs, youngest first, including Elementary', () => {
    assert.deepEqual(group.map((r) => r.id), ['elementary', 'beginner', 'intermediate', 'expert']);
    assert.deepEqual(group.map((r) => r.step), [1, 2, 3, 4]);
  });

  test('prices are the ones checkout charges', () => {
    assert.equal(group[0].price, codingPrice('Elementary', '1:4'));
    assert.equal(solo[0].price, codingPrice('Elementary', '1:1'));
    for (const tier of PRICING_TIERS) {
      assert.equal(group.find((r) => r.id === tier.id)!.price, tier.price);
      assert.equal(solo.find((r) => r.id === tier.id)!.price, tier.oneOnOnePrice ?? tier.price);
    }
  });

  test('classes, weeks and course counts are read from the catalogue', () => {
    for (const r of group) {
      const courses = COURSES.filter((c) => String(c.level).toLowerCase() === COURSE_LEVEL[r.id].toLowerCase());
      assert.equal(r.courseCount, courses.length, r.id);
      assert.ok(courses.some((c) => Number(c.lessons) === r.classes), `${r.id}: ${r.classes} classes is not a real course length`);
      assert.ok(r.weeks && r.weeks > 0, `${r.id}: no duration`);
    }
    assert.equal(group.find((r) => r.id === 'beginner')!.classes, 30);
    assert.equal(group.find((r) => r.id === 'intermediate')!.classes, 42);
    assert.equal(group.find((r) => r.id === 'expert')!.classes, 96);
  });

  test('per class and per month are honest arithmetic on the one payment', () => {
    for (const r of [...group, ...solo]) {
      if (r.price === null || !r.classes || !r.weeks) continue;
      assert.equal(r.perClass, Math.round((r.price / r.classes) * 100) / 100);
      assert.equal(r.perMonth, Math.round((r.price / (r.weeks / (52 / 12))) * 100) / 100);
      assert.ok(r.perMonth! < r.price, `${r.id}: a monthly figure above the whole price`);
    }
  });

  test('every rung links to a level /courses filters by', () => {
    for (const r of group) {
      assert.ok(['Elementary', 'Beginner', 'Intermediate', 'Advanced'].includes(new URL(r.href, 'https://x').searchParams.get('level')!));
    }
  });

  test('no card repeats the enrolment line it is already the card for', () => {
    assert.ok(group.every((r) => r.features.every((f) => !/cohort enrollment/i.test(f.text))));
  });

  test('only one rung is marked most popular', () => {
    assert.equal(group.filter((r) => r.popular).length, 1);
  });
});

describe('what they will build', () => {
  test('real final projects from real courses, never repeated', () => {
    for (const id of LADDER) {
      const projects = projectsAt(id, 3);
      assert.ok(projects.length > 0, `${id} has no projects`);
      assert.equal(new Set(projects.map((p) => p.project)).size, projects.length);
      for (const p of projects) {
        // The same course name exists at every level, so the level has to match too.
        const course = COURSES.find(
          (c) => String(c.title).startsWith(p.course) && String(c.level).toLowerCase() === COURSE_LEVEL[id].toLowerCase()
        );
        assert.ok(course, `${p.course} is not a course`);
        const last = (course as { syllabus?: { project?: string }[] }).syllabus!.slice(-1)[0];
        assert.equal(last.project, p.project);
      }
    }
  });

  test('student courses come first on the homepage', () => {
    const first = projectsAt('beginner', 1)[0];
    const course = COURSES.find((c) => String(c.title).startsWith(first.course) && String(c.level) === 'Beginner');
    assert.equal(course?.audience, 'Students');
  });

  test('course names are shown without the level suffix', () => {
    assert.ok(projectsAt('intermediate', 3).every((p) => !/—/.test(p.course)));
  });
});

describe('recommendLevel', () => {
  test('every answer gets a level on the ladder and a reason', () => {
    for (const a of AGE_BANDS) {
      for (const e of EXPERIENCE) {
        const r = recommendLevel(a.value, e.value);
        assert.ok(LADDER.includes(r.id));
        assert.ok(r.reason.length > 20);
      }
    }
  });

  test('young children start at Elementary', () => {
    for (const e of EXPERIENCE) assert.equal(recommendLevel('7-10', e.value).id, 'elementary');
  });

  test('more experience never recommends a lower rung', () => {
    for (const a of AGE_BANDS) {
      const steps = EXPERIENCE.map((e) => LADDER.indexOf(recommendLevel(a.value, e.value).id));
      for (let i = 1; i < steps.length; i++) assert.ok(steps[i] >= steps[i - 1], `${a.value}: ${steps}`);
    }
  });

  test('cautious: nobody is sent straight to Expert', () => {
    for (const a of AGE_BANDS) for (const e of EXPERIENCE) assert.notEqual(recommendLevel(a.value, e.value).id, 'expert');
  });
});

test('Elementary one-to-one is priced', () => {
  assert.ok((ladderRung('elementary', '1:1').price ?? 0) > (ladderRung('elementary', '1:4').price ?? 0));
});
