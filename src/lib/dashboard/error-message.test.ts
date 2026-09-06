import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { errorMessage } from './error-message';

/**
 * SARIRO — "Unknown error" hid a real bug for weeks
 * =========================================================
 * Confirming a Public Speaking enrolment failed on a CHECK constraint and the
 * admin screen said "Unknown error", because a Supabase error is a plain object
 * and the code only read `Error.message`. The course had 46 authored lessons
 * and zero enrolments, and the message on screen pointed nowhere.
 */

describe('a Supabase error keeps its message', () => {
  /** The exact shape that produced "Unknown error". */
  test('the check-constraint violation that broke enrolment', () => {
    const err = {
      code: '23514',
      message: 'new row for relation "enrollments" violates check constraint "chk_enr_level"',
      details: 'Failing row contains (…, focus, 1:4, active, …).',
      hint: null,
    };
    const msg = errorMessage(err);
    assert.ok(msg.includes('chk_enr_level'), msg);
    assert.ok(msg.includes('23514'), msg);
    assert.ok(!msg.includes('Unknown'), msg);
  });

  test('message, details and hint are all kept when present', () => {
    const msg = errorMessage({ message: 'a', details: 'b', hint: 'c', code: 'X1' });
    assert.equal(msg, 'a — b — c (X1)');
  });

  test('a message with no code is not decorated with an empty bracket', () => {
    assert.equal(errorMessage({ message: 'plain failure' }), 'plain failure');
  });

  test('null details and hint are dropped rather than printed', () => {
    assert.equal(errorMessage({ message: 'a', details: null, hint: null }), 'a');
  });
});

describe('everything else a catch can receive', () => {
  test('a real Error', () => {
    assert.equal(errorMessage(new Error('boom')), 'boom');
  });

  test('a thrown string', () => {
    assert.equal(errorMessage('just a string'), 'just a string');
  });

  test('nothing useful falls back to something readable, never "Unknown error"', () => {
    for (const v of [null, undefined, {}, 42, [], new Error('')]) {
      const msg = errorMessage(v);
      assert.equal(msg, 'Something went wrong.', String(v));
    }
  });

  test('the caller can say what the fallback should be', () => {
    assert.equal(errorMessage(null, 'Could not save the batch.'), 'Could not save the batch.');
  });

  test('an empty or whitespace message is not passed through as blank', () => {
    assert.equal(errorMessage({ message: '   ' }), 'Something went wrong.');
    assert.equal(errorMessage('  '), 'Something went wrong.');
  });
});
