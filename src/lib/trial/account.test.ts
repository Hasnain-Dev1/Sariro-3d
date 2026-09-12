import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { generatePassword, escapeHtml } from './account';
import { checkPassword } from '@/lib/auth/password';

/**
 * SARIRO — the pure half of the trial-account helper
 * ============================================================================
 * The database half (who is this person) is exercised against the live
 * project; these pin the two things that must be right in isolation: the
 * password a family is emailed, and that nothing they typed can become HTML
 * in that email.
 */

describe('the generated password', () => {
  test('is three groups of four, joined by hyphens', () => {
    assert.match(generatePassword(), /^[A-Za-z2-9]{4}-[A-Za-z2-9]{4}-[A-Za-z2-9]{4}$/);
  });

  /* Read off a phone, typed into a laptop. 0/O and 1/l/I are the characters
     people get wrong, so they are never used. */
  test('never uses a character that looks like another', () => {
    for (let i = 0; i < 200; i++) {
      assert.doesNotMatch(generatePassword(), /[0O1lI]/);
    }
  });

  test('passes the site’s own password rules', () => {
    for (let i = 0; i < 50; i++) {
      const p = generatePassword();
      assert.equal(checkPassword(p).ok, true, `${p} was refused by checkPassword`);
    }
  });

  test('is not the same twice', () => {
    const seen = new Set(Array.from({ length: 500 }, () => generatePassword()));
    assert.equal(seen.size, 500);
  });
});

describe('escaping what a family typed', () => {
  test('a name cannot become markup in the email', () => {
    assert.equal(escapeHtml('<img src=x onerror=alert(1)>'), '&lt;img src=x onerror=alert(1)&gt;');
    assert.equal(escapeHtml(`O'Brien & "Sons"`), 'O&#39;Brien &amp; &quot;Sons&quot;');
  });

  test('an ordinary name is unchanged', () => {
    assert.equal(escapeHtml('Ananya Sharma'), 'Ananya Sharma');
  });
});
