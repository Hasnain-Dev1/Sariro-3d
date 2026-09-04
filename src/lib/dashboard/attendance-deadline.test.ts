import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { attendanceDeadline } from './attendance-deadline';

/**
 * SARIRO — the countdown on a pending class
 * =========================================================
 * §15 asks for time remaining before the late-attendance penalty. It is worth
 * testing because both errors are silent and both cost a teacher money:
 *
 *   counting from the wrong moment — a teacher who marks a 9pm class at
 *   breakfast is fined for being early enough;
 *
 *   showing time that has already gone — a card saying "3h left" on a class
 *   that passed its deadline yesterday, so the fine arrives unexplained.
 *
 * The clock starts when the class ENDS, not when it starts. A two-hour class
 * cannot eat two hours of its own deadline.
 */

const at = (h: number) => new Date(`2026-09-04T${String(h).padStart(2, '0')}:00:00.000Z`);
const END = '2026-09-04T10:00:00.000Z';

describe('before the class has finished', () => {
  test('no countdown is shown', () => {
    const d = attendanceDeadline(END, null, at(9));
    assert.equal(d.state, 'not_ended');
    assert.equal(d.label, '', 'nothing to count down to yet');
    assert.equal(d.penalised, false);
  });
});

describe('the window runs from the end of the class', () => {
  test('right after it ends there is a full day', () => {
    const d = attendanceDeadline(END, null, at(10));
    assert.equal(d.state, 'plenty');
    assert.equal(Math.round(d.hoursLeft), 24);
  });

  test('ten hours later there is still most of the day', () => {
    assert.equal(attendanceDeadline(END, null, at(20)).state, 'plenty');
  });

  test('with eight hours or less remaining it becomes soon', () => {
    // The class ended at 10:00, so 02:00 the next day is 16 hours gone and
    // 8 remaining — the edge of the "soon" band.
    assert.equal(attendanceDeadline(END, null, new Date('2026-09-05T02:00:00.000Z')).state, 'soon');
  });

  test('with under three hours it is urgent', () => {
    // 08:00 the next day — 22 hours after a 10:00 finish.
    assert.equal(attendanceDeadline(END, null, new Date('2026-09-05T08:00:00.000Z')).state, 'urgent');
  });

  test('past the deadline it says so and warns about the penalty', () => {
    const d = attendanceDeadline(END, null, new Date('2026-09-05T16:00:00.000Z'));
    assert.equal(d.state, 'missed');
    assert.equal(d.penalised, true);
    assert.match(d.label, /₹100/, 'the teacher is told what it costs before they click');
  });

  test('a long class does not eat its own deadline', () => {
    // Starting at 08:00 and ending at 10:00 must leave 24 hours from 10:00,
    // not from 08:00. Counting from the start would quietly shorten it.
    const d = attendanceDeadline(END, null, at(10));
    assert.equal(Math.round(d.hoursLeft), 24);
  });
});

describe('once it has been marked', () => {
  test('marked in time shows no penalty and no countdown', () => {
    const d = attendanceDeadline(END, '2026-09-04T12:00:00.000Z', at(20));
    assert.equal(d.penalised, false);
    assert.equal(d.label, 'Attendance closed');
  });

  test('marked late says how late, in the past tense', () => {
    // A countdown on something already done would be nonsense.
    const d = attendanceDeadline(END, '2026-09-07T10:00:00.000Z', new Date('2026-09-08T10:00:00.000Z'));
    assert.equal(d.state, 'missed');
    assert.equal(d.penalised, true);
    assert.match(d.label, /72h after/);
  });

  test('exactly on the deadline is not late', () => {
    // 24 hours precisely. The rule is "after the deadline", and a teacher who
    // makes it with seconds to spare made it.
    const d = attendanceDeadline(END, '2026-09-05T10:00:00.000Z', new Date('2026-09-05T11:00:00.000Z'));
    assert.equal(d.penalised, false);
  });
});

describe('bad input', () => {
  test('an unparseable end time produces no countdown rather than a wrong one', () => {
    const d = attendanceDeadline('nonsense', null, at(12));
    assert.equal(d.state, 'not_ended');
    assert.equal(d.penalised, false);
  });
});
