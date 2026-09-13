import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  certificateEligibility, lateByMinutes, certificateNumber, ON_TIME_GRACE_MIN,
} from './certificate';

/* The class page promises a certificate to learners who join on time. These
   hold that promise to exactly what the page says — no stricter, no looser. */

const START = '2026-09-15T12:30:00.000Z';
const at = (minutesAfter: number) => Date.parse(START) + minutesAfter * 60_000;

describe('how late somebody joined', () => {
  test('early is on time, never negative', () => {
    assert.equal(lateByMinutes(START, at(-8)), 0);
  });

  test('counts whole minutes after the start', () => {
    assert.equal(lateByMinutes(START, at(0)), 0);
    assert.equal(lateByMinutes(START, at(4.9)), 4);
    assert.equal(lateByMinutes(START, at(12)), 12);
  });
});

describe('who earns the certificate', () => {
  const over = { classOver: true };

  test('joined within the grace period — earned', () => {
    const v = certificateEligibility({ ...over, attendance: { status: 'present', join_delay_minutes: ON_TIME_GRACE_MIN } });
    assert.deepEqual(v, { eligible: true });
  });

  test('joined a minute past the grace period — not earned, and said why', () => {
    const v = certificateEligibility({ ...over, attendance: { status: 'late', join_delay_minutes: ON_TIME_GRACE_MIN + 1 } });
    assert.deepEqual(v, { eligible: false, reason: 'joined_late' });
  });

  test('never before the class has finished', () => {
    const v = certificateEligibility({ classOver: false, attendance: { status: 'present', join_delay_minutes: 0 } });
    assert.deepEqual(v, { eligible: false, reason: 'not_finished' });
  });

  test('absent, excused or unrecorded — not earned', () => {
    for (const attendance of [null, { status: 'absent', join_delay_minutes: null }, { status: 'excused', join_delay_minutes: null }]) {
      assert.deepEqual(certificateEligibility({ ...over, attendance }), { eligible: false, reason: 'not_attended' });
    }
  });

  test('teacher confirmed them present but nobody recorded a join time — earned', () => {
    /* A parent who opened the meeting from the email rather than our button
       still sat in the class, and the teacher said so. Refusing the certificate
       over which link was clicked would punish them for our instrumentation. */
    const v = certificateEligibility({ ...over, attendance: { status: 'present', join_delay_minutes: null } });
    assert.deepEqual(v, { eligible: true });
  });

  test('a teacher correcting "late" to "present" does not erase the recorded lateness', () => {
    // The feedback route upserts status only; join_delay_minutes survives it.
    const v = certificateEligibility({ ...over, attendance: { status: 'present', join_delay_minutes: 20 } });
    assert.deepEqual(v, { eligible: false, reason: 'joined_late' });
  });
});

describe('the certificate number', () => {
  const booking = 'a2a23dc8-2d8c-4888-8ac0-c68851d42a53';

  test('is the same every time for the same child and class', () => {
    assert.equal(certificateNumber(booking, 'bf5d8fc0-c2bd', START), certificateNumber(booking, 'bf5d8fc0-c2bd', START));
  });

  test('differs between two children in the same class', () => {
    assert.notEqual(certificateNumber(booking, 'bf5d8fc0-c2bd', START), certificateNumber(booking, '36e54cd0-e006', START));
  });

  test('carries the year of the class', () => {
    assert.match(certificateNumber(booking, 'bf5d8fc0-c2bd', START), /^SARIRO-T-2026-/);
  });
});
