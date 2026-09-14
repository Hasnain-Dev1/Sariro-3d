import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normaliseEmail, pickEmailOwner } from './email-identity';

test('normaliseEmail', () => {
  assert.equal(normaliseEmail('  Parent@Gmail.COM '), 'parent@gmail.com');
  assert.equal(normaliseEmail(null), '');
});

test('the account whose sign-in email matches owns the address', () => {
  assert.equal(pickEmailOwner([
    { id: 'staff', profileEmail: 'family@gmail.com', authEmail: 'staff@sariro.com' },
    { id: 'family', profileEmail: 'family@gmail.com', authEmail: 'Family@gmail.com' },
  ], 'family@gmail.com'), 'family');
});

test('a profile carrying somebody else’s address is never the owner', () => {
  // The live bug: a staff profile overwritten with a family's email, and no
  // family account yet. The family must get a new account, not the staff one.
  assert.equal(pickEmailOwner([
    { id: 'staff', profileEmail: 'family@gmail.com', authEmail: 'staff@sariro.com' },
  ], 'family@gmail.com'), null);
});

test('a phone-only account owns the address on its profile, unless a sign-in match exists', () => {
  assert.equal(pickEmailOwner([{ id: 'phone-only', profileEmail: 'kid@x.com', authEmail: null }], 'kid@x.com'), 'phone-only');
  assert.equal(pickEmailOwner([
    { id: 'phone-only', profileEmail: 'kid@x.com', authEmail: null },
    { id: 'real', profileEmail: 'kid@x.com', authEmail: 'kid@x.com' },
  ], 'KID@x.com'), 'real');
});

test('an account found by its sign-in email counts even if its profile copy drifted', () => {
  assert.equal(pickEmailOwner([{ id: 'a', profileEmail: 'other@x.com', authEmail: 'me@x.com' }], 'me@x.com'), 'a');
});

test('nothing for an empty address', () => {
  assert.equal(pickEmailOwner([{ id: 'a', profileEmail: '', authEmail: null }], ''), null);
});
