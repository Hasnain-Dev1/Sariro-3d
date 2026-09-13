import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { isBlockedEmail, domainOf, BLOCKED_DOMAINS } from './disposable';

describe('addresses we will not open an account for', () => {
  test('every domain the founder named is refused', () => {
    for (const domain of [
      '94an.com', 'fusioninbox.com', 'fpklm.com', 'ooynib.com',
      'codingal.com', 'brightchamps.com', '98thpercentile.com',
    ]) {
      assert.equal(isBlockedEmail(`someone@${domain}`), true, domain);
    }
  });

  test('case is not a way round it', () => {
    // The founder wrote it as FusionInbox.com; addresses arrive in any case.
    assert.equal(isBlockedEmail('JAYETOB621@94AN.COM'), true);
    assert.equal(isBlockedEmail('Someone@FusionInbox.com'), true);
    assert.equal(isBlockedEmail('  staff@CodinGal.com  '), true);
  });

  test('the list is stored lower-case, or matching silently fails', () => {
    for (const d of BLOCKED_DOMAINS) assert.equal(d, d.toLowerCase(), d);
  });

  test('subdomains belong to the domain they hang off', () => {
    assert.equal(isBlockedEmail('x@mail.94an.com'), true);
    assert.equal(isBlockedEmail('x@team.codingal.com'), true);
    assert.equal(isBlockedEmail('x@not94an.com'), false, 'a different domain that merely ends the same way');
    assert.equal(isBlockedEmail('x@mycodingal.com'), false);
  });

  test('real families are not caught', () => {
    for (const e of ['aarav@gmail.com', 'head@school.edu.in', 'parent@sariro.com', 'a.b+trial@outlook.com']) {
      assert.equal(isBlockedEmail(e), false, e);
    }
  });

  test('nonsense is not treated as blocked', () => {
    /* Refusing it is the email validator's job, and answering "blocked" to
       something that is not an address would send a confusing message. */
    for (const e of [null, undefined, '', 'not-an-address', '@', 'a@']) {
      assert.equal(isBlockedEmail(e), false, String(e));
    }
  });

  test('the domain is read from the last @, not the first', () => {
    assert.equal(domainOf('weird"@"name@94an.com'), '94an.com');
  });
});
