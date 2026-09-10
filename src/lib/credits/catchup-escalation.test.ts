import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  levelFor, reminderDue, summariseCase, deadlineFor, readEscalationConfig,
  DEFAULT_ESCALATION, type CatchUpObligation,
} from './catchup-escalation';

/**
 * SARIRO — when the Super Admin is allowed to hear about it
 * ============================================================================
 * The founder's rule: the Super Admin is an exception layer, not a step. A
 * panel that lists every obligation the moment it exists is a panel nobody
 * reads by the second week — and then the one case that genuinely needed a
 * person is buried among forty that did not.
 *
 * So most of these tests are about staying silent.
 */

const NOW = Date.parse('2026-09-14T12:00:00Z');
const HOUR = 3_600_000;

const ob = (hoursAgo: number, over: Partial<CatchUpObligation> = {}): CatchUpObligation => ({
  id: `o${hoursAgo}`,
  lessonNumber: 16,
  createdAt: new Date(NOW - hoursAgo * HOUR).toISOString(),
  ...over,
});

describe('silence for the first three days', () => {
  for (const h of [0, 1, 24, 48, 71.9]) {
    test(`${h}h in, this is still only the teacher's problem`, () => {
      assert.equal(levelFor(ob(h), NOW), 'teacher');
    });
  }

  test('at exactly 72 hours the teacher’s admin is told', () => {
    assert.equal(levelFor(ob(72), NOW), 'admin');
  });

  test('at 120 hours HR is told as well', () => {
    assert.equal(levelFor(ob(120), NOW), 'hr');
  });

  test('scheduling it stops the clock, however late it was', () => {
    // How late it was scheduled is a performance question, not an exception
    // panel one. The job is done; the panel should be empty.
    const late = ob(200, { scheduledAt: new Date(NOW).toISOString() });
    assert.equal(levelFor(late, NOW), 'teacher');
  });

  test('a completed one never escalates either', () => {
    assert.equal(levelFor(ob(500, { completedAt: new Date(NOW).toISOString() }), NOW), 'teacher');
  });

  test('an unparseable creation date does not escalate', () => {
    // Escalating on a bad timestamp would put a case in front of the Super
    // Admin that nobody can act on.
    assert.equal(levelFor({ id: 'x', lessonNumber: 1, createdAt: 'not a date' }, NOW), 'teacher');
  });
});

describe('the teacher’s own reminders', () => {
  test('a reminder is only due when the stage actually changes', () => {
    // The scheduler runs every ten minutes; without this it would send the
    // same nudge 144 times a day.
    assert.equal(reminderDue(ob(2), NOW, 'created'), null);
    assert.equal(reminderDue(ob(30), NOW, 'day_1'), null);
  });

  test('the stages arrive in order as the deadline approaches', () => {
    assert.equal(reminderDue(ob(1), NOW, null), 'created');
    assert.equal(reminderDue(ob(25), NOW, 'created'), 'day_1');
    assert.equal(reminderDue(ob(40), NOW, 'day_1'), 'day_2');
    assert.equal(reminderDue(ob(50), NOW, 'day_2'), 'final');
    assert.equal(reminderDue(ob(80), NOW, 'final'), 'overdue');
  });

  test('a long gap jumps straight to the current stage rather than replaying', () => {
    // A server that was down for two days must not send four messages at once.
    assert.equal(reminderDue(ob(80), NOW, 'created'), 'overdue');
  });

  test('nothing is sent once it is scheduled', () => {
    assert.equal(reminderDue(ob(60, { scheduledAt: 'x' }), NOW, 'day_1'), null);
  });

  test('a shorter configured deadline still gets every reminder before it', () => {
    // Fixed 24/48/72 marks against a 12-hour deadline would produce a single
    // nudge that arrives after the thing has already expired.
    const cfg = { adminEscalationHours: 12, hrEscalationHours: 24 };
    assert.equal(reminderDue(ob(1), NOW, null, cfg), 'created');
    assert.equal(reminderDue(ob(5), NOW, 'created', cfg), 'day_1');
    assert.equal(reminderDue(ob(7), NOW, 'day_1', cfg), 'day_2');
    assert.equal(reminderDue(ob(9), NOW, 'day_2', cfg), 'final');
    assert.equal(reminderDue(ob(13), NOW, 'final', cfg), 'overdue');
  });
});

describe('partial scheduling does not buy more time', () => {
  test('the remaining lessons keep the deadline they were born with', () => {
    // Five created together; the teacher schedules two on day one. If the
    // clock restarted, an obligation could be deferred for ever, three days at
    // a time, by arranging one thing a week.
    const born = ob(80).createdAt;
    const five: CatchUpObligation[] = [16, 17, 18, 19, 20].map((n, i) => ({
      id: `l${n}`, lessonNumber: n, createdAt: born,
      scheduledAt: i < 2 ? new Date(NOW - 40 * HOUR).toISOString() : null,
    }));

    const c = summariseCase(five, NOW);
    assert.equal(c.total, 5);
    assert.equal(c.scheduled, 2);
    assert.equal(c.unscheduled, 3);
    assert.equal(c.escalated, true, 'still overdue on the original clock');
    assert.equal(c.level, 'admin');
  });

  test('the case closes itself when the last one is arranged', () => {
    // Nobody should have to remember to tidy a case away.
    const all: CatchUpObligation[] = [16, 17].map((n) => ({
      id: `l${n}`, lessonNumber: n, createdAt: ob(200).createdAt,
      scheduledAt: new Date(NOW).toISOString(),
    }));
    const c = summariseCase(all, NOW);
    assert.equal(c.unscheduled, 0);
    assert.equal(c.escalated, false);
    assert.equal(c.daysOverdue, 0);
    assert.equal(c.earliestDeadline, null);
  });

  test('days overdue counts from the OLDEST pending deadline', () => {
    const c = summariseCase([ob(72 + 48), ob(72 + 24)], NOW);
    assert.equal(c.daysOverdue, 2);
  });

  test('the worst pending level decides the case', () => {
    // Four merely late and one that has reached HR is an HR case.
    const c = summariseCase([ob(80), ob(80), ob(130)], NOW);
    assert.equal(c.level, 'hr');
  });

  test('pending comes back oldest first', () => {
    const c = summariseCase([ob(10), ob(90), ob(50)], NOW);
    const ages = c.pending.map((o) => Date.parse(o.createdAt));
    assert.deepEqual(ages, [...ages].sort((a, b) => a - b));
  });

  test('an empty set is not a case', () => {
    const c = summariseCase([], NOW);
    assert.equal(c.escalated, false);
    assert.equal(c.total, 0);
    assert.equal(c.level, 'teacher');
  });

  test('completed ones are counted but never pending', () => {
    const c = summariseCase(
      [ob(200, { completedAt: 'x', scheduledAt: 'y' }), ob(200)],
      NOW
    );
    assert.equal(c.completed, 1);
    assert.equal(c.unscheduled, 1);
    assert.equal(c.total, 2);
  });
});

describe('the settings, which must never fail open', () => {
  test('the defaults are the founder’s numbers', () => {
    assert.equal(DEFAULT_ESCALATION.adminEscalationHours, 72);
    assert.equal(DEFAULT_ESCALATION.hrEscalationHours, 120);
  });

  test('real settings are used', () => {
    const c = readEscalationConfig({
      catchup_admin_escalation_hours: '48',
      catchup_hr_escalation_hours: '96',
    });
    assert.deepEqual(c, { adminEscalationHours: 48, hrEscalationHours: 96 });
  });

  test('a missing or junk setting falls back rather than to zero', () => {
    // Zero would mean "escalate everything immediately" — precisely the noise
    // this whole design exists to prevent.
    for (const junk of [undefined, null, '', '  ', 'soon', '0', '-5']) {
      const c = readEscalationConfig({ catchup_admin_escalation_hours: junk });
      assert.equal(c.adminEscalationHours, 72, JSON.stringify(junk));
    }
  });

  test('HR can never be told before the teacher’s own admin', () => {
    const c = readEscalationConfig({
      catchup_admin_escalation_hours: '96',
      catchup_hr_escalation_hours: '24',
    });
    assert.equal(c.hrEscalationHours, 96);
  });

  test('an empty settings object is the defaults', () => {
    assert.deepEqual(readEscalationConfig({}), DEFAULT_ESCALATION);
  });
});

describe('deadlineFor', () => {
  test('is the creation time plus the configured window', () => {
    const created = '2026-09-10T09:00:00.000Z';
    assert.equal(
      new Date(deadlineFor(created, DEFAULT_ESCALATION)).toISOString(),
      '2026-09-13T09:00:00.000Z'
    );
  });
});
