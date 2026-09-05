import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeIndianMobile, isIndianMobile, maskIndianMobile } from './india';

/**
 * SARIRO — the number a parent types
 * =========================================================
 * Every one of these forms is the same phone. Stored as typed they are seven
 * different rows, and "has this number verified?" then answers no for six of
 * them — the parent verifies, and the booking still refuses.
 */

const SAME_NUMBER = [
  '9876543210',
  '09876543210',
  '+919876543210',
  '919876543210',
  '+91 98765 43210',
  '+91-98765-43210',
  '0091 98765 43210',
  '  98765 43210  ',
];

describe('one number, however it is typed', () => {
  for (const form of SAME_NUMBER) {
    test(`"${form}" is +919876543210`, () => {
      const r = normalizeIndianMobile(form);
      assert.equal(r.ok, true);
      if (r.ok) {
        assert.equal(r.e164, '+919876543210');
        assert.equal(r.national, '9876543210');
        assert.equal(r.wire, '919876543210');
      }
    });
  }

  test('every form collapses to exactly one canonical value', () => {
    const canonical = new Set(
      SAME_NUMBER.map((f) => {
        const r = normalizeIndianMobile(f);
        return r.ok ? r.e164 : `bad:${f}`;
      })
    );
    assert.equal(canonical.size, 1);
  });
});

describe('numbers that must be refused', () => {
  test('a landline trunk code is not a mobile — SMS to it is never delivered', () => {
    for (const first of ['2', '3', '4', '5']) {
      const r = normalizeIndianMobile(`${first}876543210`);
      assert.equal(r.ok, false);
      if (!r.ok) assert.match(r.reason, /start with 6, 7, 8 or 9/);
    }
  });

  test('too short says so, because the fix is to type more', () => {
    const r = normalizeIndianMobile('98765');
    assert.equal(r.ok, false);
    if (!r.ok) assert.match(r.reason, /too short/);
  });

  test('a foreign number says what is actually wrong', () => {
    // A US number. Rejecting it as "invalid" would be a lie — it is a real
    // number we cannot text yet.
    const r = normalizeIndianMobile('+1 415 555 0132');
    assert.equal(r.ok, false);
    if (!r.ok) assert.match(r.reason, /outside India/);
  });

  test('empty asks rather than accuses', () => {
    const r = normalizeIndianMobile('   ');
    assert.equal(r.ok, false);
    if (!r.ok) assert.match(r.reason, /Enter your mobile number/);
  });

  test('letters do not sneak through as digits', () => {
    assert.equal(isIndianMobile('nine eight seven'), false);
  });
});

describe('the 91 ambiguity', () => {
  /**
   * 9198765432 is TEN digits and begins 91. It is a valid mobile starting 9,
   * not a country code plus eight digits. Stripping the 91 would turn a real
   * number into a broken one — and the person would never know why their code
   * did not arrive.
   */
  test('a ten-digit number beginning 91 keeps its 91', () => {
    const r = normalizeIndianMobile('9198765432');
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.e164, '+919198765432');
  });

  test('a twelve-digit number beginning 91 is a country code', () => {
    const r = normalizeIndianMobile('919198765432');
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.e164, '+919198765432');
  });

  test('both spellings of that number agree', () => {
    const a = normalizeIndianMobile('9198765432');
    const b = normalizeIndianMobile('+91 91987 65432');
    assert.equal(a.ok && b.ok && a.e164 === b.e164, true);
  });
});

describe('what we show back to them', () => {
  test('enough to recognise, not enough to reuse', () => {
    assert.equal(maskIndianMobile('+919876543210'), '+91 98765 4••••');
  });

  test('an unusable number masks to nothing rather than leaking a fragment', () => {
    assert.equal(maskIndianMobile('+14155550132'), '');
  });
});
