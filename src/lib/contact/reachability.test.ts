import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  phoneReachability,
  isReachable,
  contactIdentity,
  canAssignCourse,
  groupBySharedPhone,
  UNKNOWN_LABEL,
} from './reachability';

/**
 * SARIRO — the rule that stops a teacher's hour being spent on nobody
 * ============================================================================
 * This gate refuses an action a member of staff has decided to take, which is
 * the kind of code that has to be right in both directions. A false negative
 * blocks a real family from being enrolled and the founder finds out from an
 * angry parent; a false positive lets the exact account the rule exists for
 * straight through.
 *
 * So the numbers below are not invented. Every shape in the first block is one
 * that is actually sitting in the production profiles table today.
 */

describe('a real number is reachable, however it was typed', () => {
  /* Every one of these is on the live database right now, in exactly this
     form. They belong to people who have paid us. */
  const live = [
    '+977 9709123454',   // Nepal, with a space
    '9709123454',        // the same digits, bare — a different account
    '8296110149',        // bare Indian mobile
    '+91 6296914378',    // Indian, spaced
    '+916296914378',     // Indian, no space
    '+923314565218',     // Pakistan
    '9619614390',        // bare Indian mobile
    '+243 898904440',    // DR Congo
    '+91 9832326657',
  ];

  for (const n of live) {
    test(`${n} is reachable`, () => {
      assert.equal(isReachable(n), true, `${n} was rejected but is a live customer number`);
    });
  }

  test('an Indian number reduces to one canonical form however it is typed', () => {
    const forms = ['9876543211', '09876543211', '+91 98765 43211', '919876543211', '0091 9876543211'];
    const canonical = forms.map((f) => {
      const r = phoneReachability(f);
      assert.equal(r.ok, true, `${f} should be reachable`);
      return r.ok ? r.e164 : '';
    });
    assert.deepEqual(new Set(canonical), new Set(['+919876543211']));
  });

  test('an Indian number is flagged as Indian; a foreign one is not', () => {
    const ind = phoneReachability('+91 6296914378');
    const npl = phoneReachability('+977 9709123454');
    assert.equal(ind.ok && ind.indian, true);
    assert.equal(npl.ok && npl.indian, false);
  });
});

describe('missing is missing', () => {
  for (const empty of [null, undefined, '', '   ', '\t']) {
    test(`${JSON.stringify(empty)} is missing, not implausible`, () => {
      const r = phoneReachability(empty);
      assert.equal(r.ok, false);
      assert.equal(r.ok === false && r.kind, 'missing');
    });
  }

  test('the reason for a blank field says the field is blank', () => {
    const r = phoneReachability(null);
    assert.match(r.ok === false ? r.reason : '', /no phone number/i);
  });
});

describe('a fake number is caught, because it is worse than a blank one', () => {
  const junk: [string, string][] = [
    ['0000000000', 'all zeroes'],
    ['9999999999', 'all nines'],
    ['1111111111', 'all ones'],
    ['1234567890', 'ascending run'],
    ['9876543210', 'descending run — a valid-looking Indian mobile'],
    ['+919876543210', 'the same run behind a country code'],
    ['+91 98765 43210', 'the same run, spaced'],
    ['123456', 'too short'],
    ['12345678901234567890', 'too long'],
  ];

  for (const [n, why] of junk) {
    test(`${n} is refused (${why})`, () => {
      assert.equal(isReachable(n), false, `${n} slipped through`);
    });
  }

  test('junk is reported as implausible, not as missing — the fix differs', () => {
    const r = phoneReachability('0000000000');
    assert.equal(r.ok === false && r.kind, 'implausible');
  });

  /* The trap this guards: `9876543210` is ten digits starting with 9, so it
     passes every structural rule about Indian mobiles. Prefixing +91 makes the
     RAW digit string `919876543210`, which is not a descending run at all — so
     a naive check on the whole string lets it in. */
  test('a country code does not launder a keyboard run', () => {
    assert.equal(isReachable('9876543210'), false);
    assert.equal(isReachable('+919876543210'), false);
    assert.equal(isReachable('0091 9876543210'), false);
  });
});

describe('a bare number that is not a valid Indian mobile is a typo, not Nepal', () => {
  /* 2-5 are Indian landline trunk codes. A landline accepts an SMS request and
     delivers nothing, which is the failure mode this whole module exists for. */
  test('a bare Indian landline is refused', () => {
    assert.equal(isReachable('2296914378'), false);
    assert.equal(isReachable('4412345678'), false);
  });

  test('a foreign number is accepted only when it says where it is', () => {
    assert.equal(isReachable('898904440'), false, 'bare — could be anything');
    assert.equal(isReachable('+243 898904440'), true);
    assert.equal(isReachable('00243898904440'), true);
  });

  test('the refusal tells the person what to add', () => {
    const r = phoneReachability('898904440');
    assert.match(r.ok === false ? r.reason : '', /country code/i);
  });
});

describe('identity — the name moves, it is not deleted', () => {
  test('a reachable account shows its own name', () => {
    const id = contactIdentity({ full_name: 'Mehul Rakhecha', email: 'm@example.com', phone: '9709123454' });
    assert.equal(id.label, 'Mehul Rakhecha');
    assert.equal(id.unknown, false);
    assert.equal(id.reason, '');
  });

  test('a reachable account with no name falls back to its email', () => {
    const id = contactIdentity({ full_name: null, email: 'harsh@example.com', phone: '9709123454' });
    assert.equal(id.label, 'harsh@example.com');
    assert.equal(id.unknown, false);
  });

  test('no phone means Unknown, whatever name it gave itself', () => {
    const id = contactIdentity({ full_name: 'Harsh Sha', email: 'harsh.kr0310892@gmail.com', phone: null });
    assert.equal(id.label, UNKNOWN_LABEL);
    assert.equal(id.unknown, true);
  });

  /* HR has to be able to find the row and talk about it on a call. Blanking
     the name would have made an Unknown account unsearchable, which is a
     different bug from the one being fixed. */
  test('the claimed name survives on the detail line, marked as claimed', () => {
    const id = contactIdentity({ full_name: 'Harsh Sha', email: 'harsh@example.com', phone: '' });
    assert.equal(id.claimedName, 'Harsh Sha');
    assert.match(id.detail, /Harsh Sha/);
    assert.match(id.detail, /claims/i);
    assert.match(id.detail, /harsh@example\.com/);
  });

  test('an account with nothing at all is Unknown with a reason, not a blank row', () => {
    const id = contactIdentity({ full_name: null, email: null, phone: null });
    assert.equal(id.label, UNKNOWN_LABEL);
    assert.equal(id.detail, '');
    assert.match(id.reason, /no phone number/i);
  });

  test('a junk number is Unknown too, and says why it is not just missing', () => {
    const id = contactIdentity({ full_name: 'Test', email: 't@e.com', phone: '0000000000' });
    assert.equal(id.unknown, true);
    assert.match(id.reason, /same digit/i);
  });
});

describe('the gate on assigning a course', () => {
  test('a reachable student can be assigned', () => {
    const v = canAssignCourse({ full_name: 'Mehul', phone: '9709123454' });
    assert.equal(v.ok, true);
    assert.equal(v.code, 'ok');
  });

  test('no phone blocks the assignment', () => {
    const v = canAssignCourse({ full_name: 'Harsh Sha', phone: null });
    assert.equal(v.ok, false);
    assert.equal(v.code, 'no_phone');
  });

  test('the refusal names the person and says what to do about it', () => {
    const v = canAssignCourse({ full_name: 'Harsh Sha', email: 'h@e.com', phone: null });
    assert.match(v.message, /Harsh Sha/);
    assert.match(v.message, /cannot contact/i);
    assert.match(v.message, /until one is added/i);
  });

  test('an account with no name at all is still named by its email in the refusal', () => {
    const v = canAssignCourse({ full_name: null, email: 'jayetob621@94an.com', phone: null });
    assert.match(v.message, /jayetob621@94an\.com/);
  });

  test('a nameless, emailless account gets a sentence that still reads', () => {
    const v = canAssignCourse({ phone: null });
    assert.match(v.message, /^This account has no phone number/);
  });

  test('a junk number is refused with the reason folded in, not the missing-field wording', () => {
    const v = canAssignCourse({ full_name: 'Test', phone: '1234567890' });
    assert.equal(v.ok, false);
    assert.match(v.message, /consecutive digits/i);
    assert.match(v.message, /until it is corrected/i);
    assert.doesNotMatch(v.message, /no phone number on file/i);
  });
});

describe('one number on several accounts', () => {
  /* Not wrong by itself — siblings share a parent's phone. Worth seeing,
     because on the live data one number is on three accounts. */
  test('the same number typed three ways is recognised as one number', () => {
    const groups = groupBySharedPhone([
      { full_name: 'A', phone: '9709123454' },
      { full_name: 'B', phone: '+91 97091 23454' },
      { full_name: 'C', phone: '919709123454' },
      { full_name: 'D', phone: '8296110149' },
    ]);
    assert.equal(groups.size, 1);
    assert.deepEqual(groups.get('+919709123454')?.map((r) => r.full_name), ['A', 'B', 'C']);
  });

  test('a number on exactly one account is not a group', () => {
    const groups = groupBySharedPhone([
      { phone: '8296110149' },
      { phone: '9619614390' },
    ]);
    assert.equal(groups.size, 0);
  });

  test('unreachable accounts are not grouped together as if they shared a number', () => {
    const groups = groupBySharedPhone([
      { full_name: 'A', phone: null },
      { full_name: 'B', phone: '' },
      { full_name: 'C', phone: '0000000000' },
    ]);
    assert.equal(groups.size, 0);
  });

  /* +977 9709123454 and the bare 9709123454 are on the live database as
     separate accounts. They are NOT the same number — one is Nepal, one is
     India — and collapsing them would be a worse error than missing them. */
  test('the same digits under different country codes stay separate', () => {
    const groups = groupBySharedPhone([
      { full_name: 'Nepal', phone: '+977 9709123454' },
      { full_name: 'India', phone: '9709123454' },
    ]);
    assert.equal(groups.size, 0);
  });
});
