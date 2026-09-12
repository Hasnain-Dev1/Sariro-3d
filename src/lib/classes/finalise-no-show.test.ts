import test from 'node:test';
import assert from 'node:assert/strict';
import { isNoShowDue, NO_SHOW_THRESHOLD_MIN, type NoShowBooking } from './finalise-no-show';

/* The whole verdict in one function, so the hourly sweep and a person clicking
   cannot reach different answers about the same class. */

const NOW = Date.parse('2026-09-12T10:00:00.000Z');

function booking(over: Partial<NoShowBooking> = {}): NoShowBooking {
  return {
    id: 'b1',
    cohort_id: null,
    teacher_id: 't1',
    schedule_id: null,
    slot_start: new Date(NOW - 30 * 60_000).toISOString(),
    status: 'scheduled',
    teacher_started_at: null,
    is_trial: true,
    trial_student_id: 's1',
    ...over,
  };
}

test('a class the teacher never started, well past its start, is a no-show', () => {
  assert.equal(isNoShowDue(booking(), NOW), true);
});

test('a class the teacher started is never a no-show, however late it ran', () => {
  assert.equal(
    isNoShowDue(booking({ teacher_started_at: new Date(NOW - 20 * 60_000).toISOString() }), NOW),
    false
  );
});

test('the ten-minute grace is respected to the minute', () => {
  const justUnder = booking({ slot_start: new Date(NOW - (NO_SHOW_THRESHOLD_MIN - 1) * 60_000).toISOString() });
  const exactly = booking({ slot_start: new Date(NOW - NO_SHOW_THRESHOLD_MIN * 60_000).toISOString() });
  assert.equal(isNoShowDue(justUnder, NOW), false, 'nine minutes late is a late teacher, not an absent one');
  assert.equal(isNoShowDue(exactly, NOW), true);
});

test('a class that has not started yet is left alone', () => {
  assert.equal(isNoShowDue(booking({ slot_start: new Date(NOW + 60 * 60_000).toISOString() }), NOW), false);
});

test('anything already decided is left alone', () => {
  for (const status of ['no_show', 'completed', 'cancelled']) {
    assert.equal(isNoShowDue(booking({ status }), NOW), false, `${status} must not be re-decided`);
  }
});

test('a trial is judged by the same rule as a cohort class', () => {
  /* The gap that started this: trials were the classes nobody ever finalised,
     and they are the ones where it matters most. */
  assert.equal(isNoShowDue(booking({ is_trial: true, cohort_id: null }), NOW), true);
  assert.equal(isNoShowDue(booking({ is_trial: false, cohort_id: 'c1' }), NOW), true);
});
