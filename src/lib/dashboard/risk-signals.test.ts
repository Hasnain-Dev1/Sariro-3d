import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  studentChurnRisk, teacherRisk, batchHealth, LATE_JOIN_RISK_RATIO,
  type StudentSignals, type TeacherSignals, type BatchSignals,
} from './risk-signals';

/**
 * SARIRO — the scores that get someone called
 * =========================================================
 * These decide who an admin rings on a Monday. Both errors are expensive and
 * neither is visible from the number itself:
 *
 *   too eager  — every learner reads "high risk", the flag stops meaning
 *                anything, and the one child who really was leaving is lost in
 *                the list;
 *   too calm   — a learner with no credits, no attendance and nothing booked
 *                shows green, and nobody calls until they have gone.
 *
 * The tests that matter most are the ones asserting the honest answer where
 * there is no evidence, because that is the case a scoring function is most
 * tempted to fill with a confident-looking number.
 */

const student = (p: Partial<StudentSignals> = {}): StudentSignals => ({
  credits: 10,
  scheduledAhead: 6,
  classesHeld: 8,
  classesAttended: 8,
  daysSinceLastClass: 3,
  lessonsCompleted: 8,
  lessonsTotal: 40,
  ...p,
});

describe('§64 — a learner who may stop', () => {
  test('a new joiner is "not enough data", not "low risk"', () => {
    // The dangerous version of this returns a confident low score for somebody
    // nobody has any evidence about.
    const r = studentChurnRisk(student({ classesHeld: 1, classesAttended: 1 }));
    assert.equal(r.band, 'unknown');
    assert.equal(r.score, null, 'no number at all, rather than a misleading one');
  });

  test('an engaged learner reads low', () => {
    const r = studentChurnRisk(student());
    assert.equal(r.band, 'low');
  });

  test('out of credits, absent and nothing booked reads high', () => {
    const r = studentChurnRisk(student({
      credits: 0,
      scheduledAhead: 0,
      classesAttended: 2,
      classesHeld: 8,
      daysSinceLastClass: 30,
    }));
    assert.equal(r.band, 'high');
  });

  test('every score carries the reasons behind it', () => {
    // §93: "For every prediction — what data contributed to this prediction?"
    const r = studentChurnRisk(student({ credits: 1 }));
    assert.ok(r.factors.length >= 4, 'the factors are the explanation');
    const credits = r.factors.find((f) => f.label === 'Credits');
    assert.ok(credits && credits.weight > 0, 'and the one that mattered says so');
    assert.match(credits!.detail, /1 left/, 'in words, not codes');
  });

  test('factors are listed even when they contributed nothing', () => {
    // Seeing "Attendance: 100% — no contribution" is what lets somebody trust
    // the score. A list of only the bad news reads like a case being built.
    const r = studentChurnRisk(student());
    assert.ok(r.factors.some((f) => f.weight === 0));
  });

  test('the score never leaves 0-100', () => {
    const worst = studentChurnRisk(student({
      credits: 0, scheduledAhead: 0, classesHeld: 10, classesAttended: 0,
      daysSinceLastClass: 400, lessonsCompleted: 0, lessonsTotal: 40,
    }));
    assert.ok(worst.score !== null && worst.score <= 100 && worst.score >= 0);
  });

  test('a learner who never attended is flagged, not treated as perfect', () => {
    // daysSinceLastClass === null must not read as "attended recently".
    const r = studentChurnRisk(student({ classesAttended: 0, daysSinceLastClass: null }));
    assert.notEqual(r.band, 'low');
  });
});

describe('§25, §62 — a teacher whose delivery is slipping', () => {
  const teacher = (p: Partial<TeacherSignals> = {}): TeacherSignals => ({
    scheduled: 100, lateJoins: 2, noShows: 0,
    attendanceOutstanding: 0, monitoringScore: 8, ...p,
  });

  test('the threshold is the one the doc states', () => {
    assert.equal(LATE_JOIN_RISK_RATIO, 0.05, '§25: late joins > 5% of scheduled');
  });

  test('exactly 5% is not yet flagged; above it is', () => {
    const at = teacherRisk(teacher({ lateJoins: 5 }));
    const over = teacherRisk(teacher({ lateJoins: 7 }));
    const atLate = at.factors.find((f) => f.label === 'Late joins')!;
    const overLate = over.factors.find((f) => f.label === 'Late joins')!;
    assert.equal(atLate.weight, 0, '5% is inside the allowance');
    assert.ok(overLate.weight > 0, '7% is the doc\'s own example of a flag');
  });

  test('6% and 30% are not the same finding', () => {
    const mild = teacherRisk(teacher({ lateJoins: 6 }));
    const severe = teacherRisk(teacher({ lateJoins: 30 }));
    assert.ok(severe.score! > mild.score!, 'the score scales with how bad it is');
  });

  test('a no-show outweighs a late join', () => {
    const late = teacherRisk(teacher({ lateJoins: 10, noShows: 0 }));
    const noShow = teacherRisk(teacher({ lateJoins: 0, noShows: 2 }));
    assert.ok(noShow.score! >= late.score!, 'a class that never happened is worse');
  });

  test('being observed teaching well pulls the score down', () => {
    const good = teacherRisk(teacher({ lateJoins: 8, monitoringScore: 9 }));
    const unobserved = teacherRisk(teacher({ lateJoins: 8, monitoringScore: null }));
    assert.ok(good.score! < unobserved.score!, 'one bad week should not read as a bad teacher');
  });

  test('a teacher with nothing scheduled is unknown, not low risk', () => {
    assert.equal(teacherRisk(teacher({ scheduled: 0 })).band, 'unknown');
  });
});

describe('§67 — batch health', () => {
  const batch = (p: Partial<BatchSignals> = {}): BatchSignals => ({
    studentsEnrolled: 4, studentsActive: 4,
    classesHeld: 10, classesAttendedTotal: 38, attendancePossible: 40,
    studentsLowOnCredits: 0, teacherRiskScore: 10, classesFinalised: 10, ...p,
  });

  test('a batch with no classes has no score rather than zero', () => {
    // Zero would sort it below a genuinely failing batch and pull it to the top
    // of a worst-first list it does not belong in.
    const h = batchHealth(batch({ classesHeld: 0 }));
    assert.equal(h.score, null);
  });

  test('a healthy batch scores high', () => {
    const h = batchHealth(batch());
    assert.ok(h.score! >= 80, `expected a healthy batch to clear 80, got ${h.score}`);
  });

  test('the components add up to the score', () => {
    // §67: "Clicking it should show the components." They have to reconcile,
    // or the breakdown is decoration.
    const h = batchHealth(batch({ classesAttendedTotal: 25, studentsLowOnCredits: 2 }));
    const summed = h.components.reduce((s, c) => s + c.score, 0);
    assert.equal(summed, h.score);
  });

  test('no component can exceed its own maximum', () => {
    const h = batchHealth(batch());
    for (const c of h.components) {
      assert.ok(c.score <= c.outOf, `${c.label} scored ${c.score} out of ${c.outOf}`);
    }
  });

  test('empty seats and absent students both pull it down', () => {
    const healthy = batchHealth(batch()).score!;
    const leaking = batchHealth(batch({ studentsActive: 1, classesAttendedTotal: 12 })).score!;
    assert.ok(leaking < healthy - 20, 'a batch losing students must read clearly worse');
  });

  test('a batch everyone attends but nobody can pay for is not healthy', () => {
    const h = batchHealth(batch({ studentsLowOnCredits: 4 }));
    assert.ok(h.score! < 90, 'credits are part of health, not a footnote');
  });
});
