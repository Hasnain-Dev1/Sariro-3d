import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { joinLine, joinStatus, registerSummary, suggestRegister, LATE_AFTER_MINUTES, type RegisterRow } from './register';

const START = '2026-09-19T13:30:00Z';
const at = (min: number) => new Date(Date.parse(START) + min * 60_000).toISOString();

describe('joining sets the register', () => {
  test('on time up to 10 minutes in, late after', () => {
    assert.equal(joinStatus(START, at(-5)), 'present');
    assert.equal(joinStatus(START, at(LATE_AFTER_MINUTES)), 'present');
    assert.equal(joinStatus(START, at(LATE_AFTER_MINUTES + 1)), 'late');
    assert.equal(joinStatus('nonsense', at(30)), 'present', 'an unreadable time never makes a child late');
  });
});

describe('the suggested register', () => {
  const rows: RegisterRow[] = [
    { studentId: 'a', status: 'present', source: 'join', joinedAt: at(2) },
    { studentId: 'b', status: 'present', source: 'join', joinedAt: at(18) },
    { studentId: 'c', status: null, source: null, joinedAt: null },
    { studentId: 'd', status: 'excused', source: 'teacher', joinedAt: null },
  ];
  test('joins become present or late, no join becomes absent, the teacher’s own marks stand', () => {
    assert.deepEqual(suggestRegister(rows, START), [
      { studentId: 'a', status: 'present', confirmed: false },
      { studentId: 'b', status: 'late', confirmed: false },
      { studentId: 'c', status: 'absent', confirmed: false },
      { studentId: 'd', status: 'excused', confirmed: true },
    ]);
  });
  test('the lines under each name say what happened', () => {
    assert.match(joinLine(rows[0], START, 'UTC'), /on time/);
    assert.match(joinLine(rows[1], START, 'UTC'), /18 min late/);
    assert.equal(joinLine(rows[2], START), 'Did not join through Sariro');
    assert.equal(joinLine(rows[3], START), 'Marked by you');
    assert.match(joinLine({ studentId: 'e', status: 'present', source: 'join', joinedAt: at(-3) }, START, 'UTC'), /before the start/);
  });
  test('the summary counts who came', () => {
    assert.equal(registerSummary(rows), '2 joined · 2 did not');
    assert.equal(registerSummary(rows.slice(0, 2)), 'All 2 joined');
  });
});
