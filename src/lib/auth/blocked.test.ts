import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BLOCKED_MESSAGE, authErrorText, isBlockedAuthError, isBlockedUser } from './blocked';

test('only a user the service marked blocked is blocked', () => {
  assert.equal(isBlockedUser({ app_metadata: { blocked: true } }), true);
  assert.equal(isBlockedUser({ app_metadata: { blocked: false } }), false);
  assert.equal(isBlockedUser({ app_metadata: { blocked: 'true' } }), false, 'a string is not a block');
  assert.equal(isBlockedUser({ app_metadata: {} }), false);
  assert.equal(isBlockedUser(null), false);
});

test('Supabase’s banned refusal is recognised however it is shaped', () => {
  assert.equal(isBlockedAuthError({ code: 'user_banned', message: 'x' }), true);
  assert.equal(isBlockedAuthError(new Error('User is banned')), true);
  assert.equal(isBlockedAuthError('User is banned'), true);
  assert.equal(isBlockedAuthError(new Error('Invalid login credentials')), false);
  assert.equal(isBlockedAuthError(null), false);
});

test('a blocked person is told to check with support, never shown the raw error', () => {
  assert.equal(authErrorText(new Error('User is banned'), 'x'), BLOCKED_MESSAGE);
  assert.match(BLOCKED_MESSAGE, /check with support/i);
  assert.equal(authErrorText(new Error('Invalid login credentials'), 'x'), 'Invalid login credentials');
  assert.equal(authErrorText(undefined, 'Sign-in failed'), 'Sign-in failed');
});
