import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { acceptPhone, verificationRequired } from './accept';

/**
 * SARIRO — the phone-acceptance tests
 * ============================================================================
 * This module is a security boundary, not a formatter. `canVerify` decides
 * whether /api/trial/self-book will hand back a session on a phone match —
 * so a bug that returns `true` for a number no code can reach is an
 * account-takeover machine, and a bug that returns `false` for an Indian
 * mobile silently drops every Indian booking.
 *
 * Both directions are asserted.
 */

const ok = (r: ReturnType<typeof acceptPhone>) => {
  assert.equal(r.ok, true, r.ok ? '' : `rejected: ${r.problem}`);
  return r as Extract<typeof r, { ok: true }>;
};

describe('Indian numbers', () => {
  test('a plain ten-digit mobile', () => {
    const r = ok(acceptPhone('9876543210', 'IN'));
    assert.equal(r.e164, '+919876543210');
    assert.equal(r.countryCode, 'IN');
    assert.equal(r.canVerify, true);
  });

  test('spaces and dashes are not part of the number', () => {
    assert.equal(ok(acceptPhone('98765 43210', 'IN')).e164, '+919876543210');
    assert.equal(ok(acceptPhone('98765-43210', 'IN')).e164, '+919876543210');
  });

  /* The habit that rings nothing: +91 09876543210. */
  test('a trunk zero is stripped', () => {
    assert.equal(ok(acceptPhone('09876543210', 'IN')).e164, '+919876543210');
  });

  /* And the mirror of it: a number pasted WITH its dial code must not be
     given a second one. */
  test('a pasted +91 is not doubled', () => {
    assert.equal(ok(acceptPhone('+919876543210', 'IN')).e164, '+919876543210');
    assert.equal(ok(acceptPhone('+91 98765 43210', 'IN')).e164, '+919876543210');
  });

  test('a landline is refused — SMS to one delivers nothing', () => {
    const r = acceptPhone('2212345678', 'IN');
    assert.equal(r.ok, false);
  });

  test('too short and too long are both refused', () => {
    assert.equal(acceptPhone('98765', 'IN').ok, false);
    assert.equal(acceptPhone('98765432101234', 'IN').ok, false);
  });
});

describe('numbers from everywhere else', () => {
  test('a UK number is ACCEPTED — it used to be refused outright', () => {
    const r = ok(acceptPhone('7700900123', 'GB'));
    assert.equal(r.countryCode, 'GB');
    assert.equal(r.e164.startsWith('+44'), true);
  });

  test('but it is never treated as verified', () => {
    assert.equal(ok(acceptPhone('7700900123', 'GB')).canVerify, false);
    assert.equal(ok(acceptPhone('501234567', 'AE')).canVerify, false);
    assert.equal(ok(acceptPhone('81234567', 'SG')).canVerify, false);
  });

  test('only India can be sent a code', () => {
    assert.equal(verificationRequired(ok(acceptPhone('9876543210', 'IN'))), true);
    assert.equal(verificationRequired(ok(acceptPhone('7700900123', 'GB'))), false);
  });

  test('a UK trunk zero comes off too', () => {
    const withZero = ok(acceptPhone('07700900123', 'GB')).e164;
    const without = ok(acceptPhone('7700900123', 'GB')).e164;
    assert.equal(withZero, without);
  });

  test('obvious rubbish is still refused, wherever it is from', () => {
    assert.equal(acceptPhone('12', 'GB').ok, false);
    assert.equal(acceptPhone('', 'GB').ok, false);
    assert.equal(acceptPhone('not a number', 'GB').ok, false);
  });
});

describe('the country', () => {
  test('defaults to India when none is given', () => {
    assert.equal(ok(acceptPhone('9876543210', null)).countryCode, 'IN');
    assert.equal(ok(acceptPhone('9876543210', '')).countryCode, 'IN');
  });

  test('is case-insensitive', () => {
    assert.equal(ok(acceptPhone('7700900123', 'gb')).countryCode, 'GB');
  });

  test('an unknown country is refused rather than guessed at', () => {
    const r = acceptPhone('9876543210', 'ZZ');
    assert.equal(r.ok, false);
  });
});

describe('the property that matters', () => {
  /* canVerify true means "self-book will sign somebody in on this". It must
     be true for exactly one country, and never as a side effect of the number
     itself looking Indian. */
  test('a ten-digit Indian-looking number under a foreign country is NOT verifiable', () => {
    /* Nepal, because it also takes ten digits — so the number is byte-for-byte
       something that would be a valid Indian mobile, and only the chosen
       country separates them. That is exactly the case that must not leak a
       session. */
    const r = ok(acceptPhone('9876543210', 'NP'));
    assert.equal(r.canVerify, false);
    assert.equal(r.e164, '+9779876543210');
  });

  test('every accepted number produces a well-formed E.164', () => {
    const probes: [string, string][] = [
      ['9876543210', 'IN'], ['7700900123', 'GB'], ['501234567', 'AE'], ['81234567', 'SG'],
    ];
    for (const [n, c] of probes) {
      const r = ok(acceptPhone(n, c));
      assert.match(r.e164, /^\+\d{7,17}$/, `${c} ${n} produced ${r.e164}`);
    }
  });
});
