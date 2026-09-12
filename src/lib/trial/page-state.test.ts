import test from 'node:test';
import assert from 'node:assert/strict';
import { mapRpcState, type RpcShape } from './page-state';

/* Both routes to the page's data — the one query and the old three — end in
   mapRpcState, so this is where they are held to the same shape. */

const TRIAL: NonNullable<RpcShape['trial']> = {
  id: 'b1',
  slot_start: '2026-09-12T16:05:00.000Z',
  slot_end: '2026-09-12T16:35:00.000Z',
  status: 'scheduled',
  google_meet_url: null,
  trial_subject: 'python',
  seat_grade: 7,
  teacher_name: 'Mimo Patra',
  teacher_meet_url: 'https://meet.example/teacher-room',
};

test('a booked class becomes what the countdown renders', () => {
  const s = mapRpcState({ profile: { full_name: 'Aarav Sharma', email: 'a@example.com', timezone: 'Asia/Kolkata' }, enrolled: 0, trial: TRIAL });
  assert.equal(s.trial?.id, 'b1');
  assert.equal(s.trial?.teacher_name, 'Mimo Patra');
  assert.equal(s.trial?.subject, 'python');
  assert.equal(s.trial?.grade, 7);
  assert.equal(s.profile?.timezone, 'Asia/Kolkata');
});

test("a class with no room of its own borrows the teacher's", () => {
  const s = mapRpcState({ profile: null, enrolled: 0, trial: TRIAL });
  assert.equal(s.trial?.google_meet_url, 'https://meet.example/teacher-room');
});

test('a class with its own room keeps it', () => {
  const s = mapRpcState({ profile: null, enrolled: 0, trial: { ...TRIAL, google_meet_url: 'https://meet.example/class' } });
  assert.equal(s.trial?.google_meet_url, 'https://meet.example/class');
});

test('no class is null, not a half-built one', () => {
  const s = mapRpcState({ profile: null, enrolled: 0, trial: null });
  assert.equal(s.trial, null);
});

test('the enrolment count survives coming back as a string', () => {
  /* Postgres count() arrives as a string over PostgREST often enough that
     `enrolled > 0` on the raw value would send a paying student to the trial
     page — or a trial student to a dashboard they cannot use. */
  assert.equal(mapRpcState({ profile: null, enrolled: '3', trial: null }).enrolled, 3);
  assert.equal(mapRpcState({ profile: null, enrolled: '0', trial: null }).enrolled, 0);
  assert.equal(mapRpcState({ profile: null, enrolled: null, trial: null }).enrolled, 0);
});

test('a grade the seat never recorded is null rather than a guess', () => {
  const s = mapRpcState({ profile: null, enrolled: 0, trial: { ...TRIAL, seat_grade: null } });
  assert.equal(s.trial?.grade, null);
});
