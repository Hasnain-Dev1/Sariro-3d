import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  reminderStatus, isToday, isOverdue,
  parseRelative, relativeMs, parseExact, describeDue,
} from './reminders';

/**
 * SARIRO — the reminder tests
 * ============================================================================
 * Fixed instants throughout, so these read the same in every timezone and in
 * every year. The business runs on Asia/Kolkata (UTC+5:30) and that offset is
 * the thing most likely to be got wrong, so the boundary cases are all written
 * in terms of it rather than in local time.
 *
 * 2026-09-10T09:00:00Z is 14:30 on the 10th in Kolkata — mid-afternoon, safely
 * away from both midnights, which is what makes "today" unambiguous below.
 */

const NOW = Date.parse('2026-09-10T09:00:00Z'); // 14:30 IST on the 10th
const IST_DAY_START = '2026-09-09T18:30:00Z';   // 00:00 IST on the 10th
const IST_DAY_END = '2026-09-10T18:30:00Z';     // 00:00 IST on the 11th

const pending = (due: string) => ({ due_at: due, status: 'pending' as const });

describe('the three derived statuses', () => {
  test('a reminder later today is upcoming', () => {
    assert.equal(reminderStatus(pending('2026-09-10T12:00:00Z'), NOW), 'upcoming');
  });

  test('a reminder whose moment has passed today is due', () => {
    assert.equal(reminderStatus(pending('2026-09-10T06:00:00Z'), NOW), 'due');
  });

  test('a reminder from yesterday is overdue', () => {
    assert.equal(reminderStatus(pending('2026-09-08T10:00:00Z'), NOW), 'overdue');
  });

  /* The rule is "the day it belonged to has ended", not "N hours have passed".
     A 4pm reminder read at 5pm is this afternoon's work, not a failure. */
  test('an hour late on the same day is still only due', () => {
    assert.equal(reminderStatus(pending('2026-09-10T08:00:00Z'), NOW), 'due');
  });

  test('the IST midnight boundary is where due becomes overdue', () => {
    assert.equal(reminderStatus(pending(IST_DAY_START), NOW), 'due');
    const aMomentBefore = new Date(Date.parse(IST_DAY_START) - 1000).toISOString();
    assert.equal(reminderStatus(pending(aMomentBefore), NOW), 'overdue');
  });

  test('a UTC-day boundary does NOT move anything — the office is in India', () => {
    /* 20:00 UTC on the 9th is 01:30 IST on the 10th: a different UTC day, the
       same Indian day. A naive UTC implementation calls this overdue. */
    assert.equal(reminderStatus(pending('2026-09-09T20:00:00Z'), NOW), 'due');
  });
});

describe('what a human did outranks the clock', () => {
  test('a completed reminder never becomes overdue', () => {
    assert.equal(
      reminderStatus({ due_at: '2026-01-01T00:00:00Z', status: 'completed' }, NOW),
      'completed'
    );
  });

  test('a cancelled reminder never becomes overdue', () => {
    assert.equal(
      reminderStatus({ due_at: '2026-01-01T00:00:00Z', status: 'cancelled' }, NOW),
      'cancelled'
    );
  });

  test('completed and cancelled are in neither queue', () => {
    const old = '2026-01-01T00:00:00Z';
    assert.equal(isOverdue({ due_at: old, status: 'completed' }, NOW), false);
    assert.equal(isToday({ due_at: '2026-09-10T12:00:00Z', status: 'cancelled' }, NOW), false);
  });
});

describe("today's queue", () => {
  test('includes both halves of the day — already due and still to come', () => {
    assert.equal(isToday(pending('2026-09-10T06:00:00Z'), NOW), true);
    assert.equal(isToday(pending('2026-09-10T12:00:00Z'), NOW), true);
  });

  test('starts and ends at Indian midnight', () => {
    assert.equal(isToday(pending(IST_DAY_START), NOW), true);
    assert.equal(isToday(pending(IST_DAY_END), NOW), false);
    assert.equal(isToday(pending(new Date(Date.parse(IST_DAY_END) - 1000).toISOString()), NOW), true);
  });

  /* The two queues must never both claim one reminder, or the seller rings
     once and one badge stays lit. */
  test('nothing is ever both today and overdue', () => {
    const probes = [
      IST_DAY_START, IST_DAY_END, '2026-09-10T06:00:00Z', '2026-09-10T12:00:00Z',
      '2026-09-09T18:29:59Z', '2026-09-08T10:00:00Z', '2026-09-11T10:00:00Z',
    ];
    for (const due of probes) {
      const both = isToday(pending(due), NOW) && isOverdue(pending(due), NOW);
      assert.equal(both, false, `${due} was in both queues`);
    }
  });
});

describe('saying when, the way a person says it', () => {
  test('the phrases the founder specified', () => {
    assert.equal(relativeMs('3 hours'), 3 * 3600_000);
    assert.equal(relativeMs('1 day'), 86_400_000);
    assert.equal(relativeMs('4 days'), 4 * 86_400_000);
  });

  test('short forms and "in" are the same request', () => {
    assert.equal(relativeMs('3h'), relativeMs('3 hours'));
    assert.equal(relativeMs('in 3 hours'), relativeMs('3 hours'));
    assert.equal(relativeMs('  3 HOURS  '), relativeMs('3 hours'));
    assert.equal(relativeMs('2w'), 14 * 86_400_000);
  });

  test('parseRelative returns a real instant', () => {
    assert.equal(parseRelative('3 hours', NOW), '2026-09-10T12:00:00.000Z');
  });

  /* Refused, not guessed. Nobody re-checks a reminder they believe they set. */
  test('nonsense is refused rather than interpreted', () => {
    for (const bad of ['', 'soon', 'next Tuesday', '0 days', '-2 days', 'day', '3 fortnights']) {
      assert.equal(relativeMs(bad), null, `"${bad}" was accepted`);
    }
  });

  test('an absurd distance is refused rather than overflowing', () => {
    assert.equal(relativeMs('9999 days'), null);
  });
});

describe('an exact date, typed into a browser field', () => {
  /* datetime-local hands back "2026-09-14T16:00" with no zone. Date.parse
     reads that as local time in a browser and as UTC in some server runtimes —
     five and a half hours apart in India, which is an afternoon call versus a
     call at half past nine at night. */
  test('4pm in Kolkata is 10:30 UTC, not 16:00 UTC', () => {
    assert.equal(parseExact('2026-09-14T16:00'), '2026-09-14T10:30:00.000Z');
  });

  test('a space instead of a T is accepted', () => {
    assert.equal(parseExact('2026-09-14 16:00'), '2026-09-14T10:30:00.000Z');
  });

  test('midnight maps to the start of the Indian day', () => {
    /* Compared as instants, not strings: toISOString() always writes the
       milliseconds and the constant above does not. */
    assert.equal(
      Date.parse(parseExact('2026-09-10T00:00') ?? ''),
      Date.parse(IST_DAY_START)
    );
  });

  test('garbage is refused', () => {
    assert.equal(parseExact('not a date'), null);
    assert.equal(parseExact(''), null);
  });
});

describe('describeDue', () => {
  test('reads forwards and backwards', () => {
    assert.equal(describeDue('2026-09-10T12:00:00Z', NOW), 'in 3 hr');
    assert.equal(describeDue('2026-09-10T06:00:00Z', NOW), '3 hr ago');
    assert.equal(describeDue('2026-09-12T09:00:00Z', NOW), 'in 2 days');
    assert.equal(describeDue('2026-09-11T09:00:00Z', NOW), 'in 1 day');
  });

  test('an unparseable date says nothing rather than "NaN ago"', () => {
    assert.equal(describeDue('rubbish', NOW), '');
  });
});
