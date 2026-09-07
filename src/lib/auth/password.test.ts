import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  checkPassword,
  passwordsMatch,
  resetErrorMessage,
  resetRequestedMessage,
  MIN_LENGTH,
  MAX_LENGTH,
} from './password';

/**
 * SARIRO — the rules on the one screen a locked-out person reaches
 * ============================================================================
 * Somebody arrives here already frustrated: they could not get in, they found
 * a button the FAQ promised and the product did not have, and now they are
 * being told their password is not good enough. Every rejection has to be
 * true, and every message has to say what to do next.
 *
 * So both halves are tested — whether a password is accepted, and what is
 * said when it is not.
 */

describe('length is the rule that actually matters', () => {
  test('a short password is refused, and told how much short', () => {
    const r = checkPassword('abc');
    assert.equal(r.ok, false);
    assert.match(r.problem, /5 more characters/);
  });

  test('one character short says "character", not "characters"', () => {
    const r = checkPassword('a'.repeat(MIN_LENGTH - 1));
    assert.match(r.problem, /1 more character\b/);
    assert.doesNotMatch(r.problem, /1 more characters/);
  });

  test('exactly the minimum is accepted', () => {
    assert.equal(checkPassword('a'.repeat(MIN_LENGTH)).ok, true);
  });

  test('an empty password asks for one rather than complaining about length', () => {
    const r = checkPassword('');
    assert.equal(r.ok, false);
    assert.match(r.problem, /choose a password/i);
  });

  test('a pasted document is refused as a paste, not as a password', () => {
    const r = checkPassword('x'.repeat(MAX_LENGTH + 1));
    assert.equal(r.ok, false);
    assert.match(r.problem, /paste/i);
  });

  test('only-spaces is caught, however long', () => {
    const r = checkPassword('          ');
    assert.equal(r.ok, false);
    assert.match(r.problem, /only spaces/i);
  });
});

describe('the passwords everybody tries first', () => {
  for (const pw of ['password', 'Password123', '12345678', 'qwerty123', 'sariro123', 'letmein1']) {
    test(`${pw} is refused`, () => {
      const r = checkPassword(pw);
      assert.equal(r.ok, false, `${pw} was accepted`);
      assert.match(r.problem, /first passwords anybody tries/i);
    });
  }

  test('the check is case-insensitive — PASSWORD is the same password', () => {
    assert.equal(checkPassword('PASSWORD').ok, false);
  });

  /* Long enough, mixed case, a digit — it would sail through any rule about
     character classes. The list is what catches it. */
  test('a common password that passes every structural rule is still refused', () => {
    assert.equal(checkPassword('Passw0rd').ok, false);
  });
});

describe('a password may not be the email address', () => {
  test('exactly the email is refused', () => {
    const r = checkPassword('parent@example.com', 'parent@example.com');
    assert.equal(r.ok, false);
    assert.match(r.problem, /cannot be your email/i);
  });

  test('the same address in different case is still the address', () => {
    const r = checkPassword('Parent@Example.COM', 'parent@example.com');
    assert.equal(r.ok, false);
  });

  test('starting with the local part is refused', () => {
    const r = checkPassword('mehulrakhecha2026', 'mehulrakhecha@gmail.com');
    assert.equal(r.ok, false);
    assert.match(r.problem, /should not start with your email/i);
  });

  /* The bug this guards: a one- or two-letter local part would otherwise
     reject every password beginning with that letter. */
  test('a tiny local part does not blacklist a whole letter', () => {
    assert.equal(checkPassword('appleorchard', 'a@x.com').ok, true);
    assert.equal(checkPassword('abcdefghij', 'ab@x.com').ok, true);
  });

  test('with no email to compare against, only the other rules apply', () => {
    assert.equal(checkPassword('mehulrakhecha2026').ok, true);
    assert.equal(checkPassword('mehulrakhecha2026', null).ok, true);
  });
});

describe('the strength meter is advice, never a gate', () => {
  test('a merely-acceptable password still saves', () => {
    const r = checkPassword('treehouse');
    assert.equal(r.ok, true);
    assert.equal(r.problem, '');
  });

  test('longer scores higher', () => {
    const short = checkPassword('treehouse');
    const long = checkPassword('treehouse in the garden');
    assert.ok(long.score > short.score, `${long.score} should beat ${short.score}`);
  });

  test('a long passphrase with no symbols still reaches the top', () => {
    const r = checkPassword('correct horse battery staple');
    assert.equal(r.strength, 'strong');
    assert.equal(r.ok, true);
  });

  test('score never leaves 0-4 and the label always agrees with it', () => {
    for (const pw of ['treehouse', 'Tr33house!', 'a'.repeat(8), 'a'.repeat(60), 'Zx9!qQ2#mmm']) {
      const r = checkPassword(pw);
      assert.ok(r.score >= 0 && r.score <= 4, `${pw} scored ${r.score}`);
      const expected = r.score >= 4 ? 'strong' : r.score === 3 ? 'good' : r.score === 2 ? 'fair' : 'weak';
      assert.equal(r.strength, expected, `${pw}: ${r.strength} vs score ${r.score}`);
    }
  });
});

describe('both boxes have to agree', () => {
  test('matching', () => assert.equal(passwordsMatch('treehouse', 'treehouse'), true));
  test('not matching', () => assert.equal(passwordsMatch('treehouse', 'treehous'), false));
  test('two empties do not count as agreeing', () => assert.equal(passwordsMatch('', ''), false));
  test('trailing space is a difference — it is a different password', () => {
    assert.equal(passwordsMatch('treehouse', 'treehouse '), false);
  });
});

describe('Supabase errors, translated for the person reading them', () => {
  test('an expired link says to ask for a new one', () => {
    const m = resetErrorMessage('AuthApiError: Email link is invalid or has expired');
    assert.match(m, /ask for a new one/i);
    assert.doesNotMatch(m, /AuthApiError/);
  });

  test('reusing the old password says exactly that', () => {
    assert.match(resetErrorMessage('New password should be different from the old password.'), /already have/i);
  });

  test('a rate limit says to wait, not that something is broken', () => {
    assert.match(resetErrorMessage('For security purposes, you can only request this after 51 seconds'), /wait a minute/i);
  });

  test('a lost session sends them back to the inbox', () => {
    assert.match(resetErrorMessage('Auth session missing!'), /open the link from your inbox/i);
  });

  test('a network failure is not blamed on the password', () => {
    assert.match(resetErrorMessage('TypeError: Failed to fetch'), /connection/i);
  });

  test('an unrecognised error still gives somewhere to go', () => {
    assert.match(resetErrorMessage('kaboom'), /support@sariro\.com/);
  });

  test('no error at all does not produce an empty message', () => {
    for (const v of [null, undefined, '']) {
      assert.ok(resetErrorMessage(v).length > 0);
    }
  });

  test('no message ever leaks the class name of the error', () => {
    for (const raw of ['AuthApiError: expired', 'AuthRetryableFetchError: fetch failed', 'AuthWeakPasswordError: at least 6']) {
      assert.doesNotMatch(resetErrorMessage(raw), /Error:/);
    }
  });
});

describe('asking for a link never reveals who has an account', () => {
  /* The reason: a form that answers "no account with that email" is a way to
     test a list of addresses for which ones are Sariro customers — which is
     worth knowing to somebody writing a phishing email to parents. */
  test('the wording is identical whether or not the account exists', () => {
    const a = resetRequestedMessage('real@example.com');
    const b = resetRequestedMessage('nobody@example.com');
    assert.equal(a.replace('real@example.com', 'X'), b.replace('nobody@example.com', 'X'));
  });

  test('it says how long the link lasts and warns about spam', () => {
    const m = resetRequestedMessage('parent@example.com');
    assert.match(m, /one hour/i);
    assert.match(m, /spam/i);
  });

  test('it never claims the account exists', () => {
    const m = resetRequestedMessage('parent@example.com');
    assert.match(m, /\bif\b/i);
  });

  test('the address is trimmed before it is shown back', () => {
    assert.match(resetRequestedMessage('  parent@example.com  '), /If parent@example\.com has/);
  });
});
