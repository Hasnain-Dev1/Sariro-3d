import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { resolveCheckoutItem } from './resolve';
import { codingPrice, normalizeCodingLevel } from '@/lib/pricing/coding';
import { COURSES } from '@/lib/sariro-data';
import { SPECIALISATIONS, SCHOOL_SUBJECTS, LESSONS_PER_GRADE, LESSONS_PER_GROUP } from '@/lib/school/curriculum';

/**
 * SARIRO — one checkout, every product
 * =========================================================
 * These exist because of a bug that was live: `/course-path` displayed the
 * Advanced 1:1 price as `699 + 100 = $799`, while the server's own table
 * charged **$899**. A hundred dollars apart on the flagship product, because
 * the number a customer read and the number the server used came from two
 * different places.
 *
 * The fix was one price table. These tests are what stop a second one
 * appearing: every price a buyer is shown must come from `codingPrice`, and
 * every product must resolve to something chargeable.
 */

const base = { ratio: '1:4' as const, cadence: 'monthly' as const };

describe('every coding course resolves and is priced from the one table', () => {
  test('no course is unbuyable', () => {
    for (const course of COURSES) {
      for (const ratio of ['1:4', '1:1'] as const) {
        const item = resolveCheckoutItem({ ...base, ratio, course: course.id });
        assert.ok(item, `${course.id} @ ${ratio} did not resolve`);
        assert.equal(item!.kind, 'course');
        assert.ok(item!.perPayment > 0, `${course.id} @ ${ratio}: non-positive price`);
      }
    }
  });

  test('the displayed price IS the table price — no second source', () => {
    // The exact assertion that would have caught the $799/$899 split.
    for (const course of COURSES) {
      for (const ratio of ['1:4', '1:1'] as const) {
        const item = resolveCheckoutItem({ ...base, ratio, course: course.id })!;
        assert.equal(
          item.perPayment,
          codingPrice(course.level, ratio),
          `${course.id} @ ${ratio}: checkout shows ${item.perPayment}, table says ${codingPrice(course.level, ratio)}`
        );
      }
    }
  });

  test('1:1 always costs more than 1:4', () => {
    for (const course of COURSES) {
      const group = resolveCheckoutItem({ ...base, ratio: '1:4', course: course.id })!;
      const solo = resolveCheckoutItem({ ...base, ratio: '1:1', course: course.id })!;
      assert.ok(solo.perPayment > group.perPayment, `${course.id}: 1:1 is not dearer than 1:4`);
    }
  });

  test('coding is a single payment — no invented instalments', () => {
    const item = resolveCheckoutItem({ ...base, course: COURSES[0].id })!;
    assert.equal(item.offersCadence, false);
    assert.equal(item.payments, 1);
    assert.equal(item.lifetimeTotal, item.perPayment);
  });

  test('every course level is one the price table knows', () => {
    for (const course of COURSES) {
      assert.ok(
        normalizeCodingLevel(course.level),
        `${course.id} has level "${course.level}", which has no price`
      );
    }
  });
});

describe('school subjects and focus courses resolve', () => {
  test('every subject resolves for a grade it is offered in', () => {
    for (const subject of SCHOOL_SUBJECTS) {
      const item = resolveCheckoutItem({ ...base, subject: subject.slug, grade: '8', scope: 'grade' });
      // Not every subject is offered at grade 8; when it is not, the resolver
      // still prices it (the scope label just reads oddly) — what must never
      // happen is a null, because that is a dead end at the point of payment.
      assert.ok(item, `${subject.slug} did not resolve`);
      assert.equal(item!.kind, 'school');
      assert.equal(item!.classes, LESSONS_PER_GRADE);
    }
  });

  test('every focus course resolves', () => {
    for (const spec of SPECIALISATIONS) {
      const item = resolveCheckoutItem({ ...base, focus: spec.slug });
      assert.ok(item, `${spec.slug} did not resolve`);
      assert.equal(item!.scopeLabel, 'Focus course');
      assert.equal(item!.classes, LESSONS_PER_GRADE);
    }
  });

  test('a whole grade group is three grades of classes', () => {
    const item = resolveCheckoutItem({ ...base, subject: 'mathematics', grade: '8', scope: 'group' })!;
    assert.equal(item.classes, LESSONS_PER_GROUP);
  });

  test('school offers cadences and coding does not', () => {
    const school = resolveCheckoutItem({ ...base, subject: 'mathematics', grade: '8', scope: 'grade' })!;
    const coding = resolveCheckoutItem({ ...base, course: COURSES[0].id })!;
    assert.equal(school.offersCadence, true);
    assert.equal(coding.offersCadence, false);
  });

  test('paying in full is never dearer than paying monthly', () => {
    const monthly = resolveCheckoutItem({ ...base, cadence: 'monthly', subject: 'physics', grade: '11', scope: 'grade' })!;
    const full = resolveCheckoutItem({ ...base, cadence: 'full', subject: 'physics', grade: '11', scope: 'grade' })!;
    assert.ok(full.lifetimeTotal <= monthly.lifetimeTotal);
  });
});

describe('the order body always says what the server needs', () => {
  test('school orders carry kind, subject, scope and cadence', () => {
    const item = resolveCheckoutItem({ ...base, subject: 'chemistry', grade: '10', scope: 'grade' })!;
    assert.deepEqual(item.orderBody, {
      kind: 'school',
      subject: 'chemistry',
      grade: 10,
      scope: 'grade',
      cadence: 'monthly',
      ratio: '1:4',
    });
  });

  test('coding orders carry track, level and ratio — and never an amount', () => {
    const item = resolveCheckoutItem({ ...base, ratio: '1:1', course: COURSES[0].id })!;
    assert.equal(item.orderBody.ratio, '1:1');
    assert.ok(item.orderBody.track);
    assert.ok(item.orderBody.level);
    // The client must never be able to state a price.
    for (const key of ['amount', 'price', 'total', 'displayPrice']) {
      assert.ok(!(key in item.orderBody), `orderBody leaks "${key}" — the client could set the charge`);
    }
  });

  test('school order bodies never carry an amount either', () => {
    const item = resolveCheckoutItem({ ...base, subject: 'biology', grade: '12', scope: 'group' })!;
    for (const key of ['amount', 'price', 'total', 'displayPrice']) {
      assert.ok(!(key in item.orderBody), `orderBody leaks "${key}"`);
    }
  });
});

describe('bad input fails safely', () => {
  test('nothing at all resolves to nothing, not a default purchase', () => {
    assert.equal(resolveCheckoutItem({ ...base }), null);
  });

  test('an unknown product resolves to nothing', () => {
    assert.equal(resolveCheckoutItem({ ...base, course: 'not-a-course' }), null);
    assert.equal(resolveCheckoutItem({ ...base, subject: 'astrology' }), null);
    assert.equal(resolveCheckoutItem({ ...base, focus: 'time-travel' }), null);
  });
});
