import { test } from 'node:test';
import assert from 'node:assert/strict';
import { safeNextPath } from './safe-redirect';

test('pages on this site pass through, query and hash kept', () => {
  assert.equal(safeNextPath('/dashboard'), '/dashboard');
  assert.equal(safeNextPath('/auth/reset-password'), '/auth/reset-password');
  assert.equal(safeNextPath('/checkout?plan=group#pay'), '/checkout?plan=group#pay');
});

test('anywhere else falls back', () => {
  for (const raw of [
    'https://evil.example.com/x',
    '//evil.example.com/x',
    '/\\evil.example.com',
    '/\t/evil.example.com',
    'javascript:alert(1)',
    'evil.example.com',
    ' //evil.example.com',
  ]) {
    assert.equal(safeNextPath(raw), '/dashboard', raw);
  }
});

test('empty uses the fallback given', () => {
  assert.equal(safeNextPath(null, '/'), '/');
  assert.equal(safeNextPath('', '/welcome'), '/welcome');
});
