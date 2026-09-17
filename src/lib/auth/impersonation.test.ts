import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openImpersonation, sealImpersonation, type ImpersonationPayload } from './impersonation';

const SECRET = 'a'.repeat(64);
const NOW = new Date('2026-09-17T12:00:00Z');
const payload: ImpersonationPayload = {
  adminUserId: 'admin-1',
  targetUserId: 'student-1',
  startedAt: '2026-09-17T11:30:00Z',
  adminEmail: 'admin@example.com',
  targetName: 'Aarav',
};

test('a cookie the server sealed opens to the same payload', () => {
  const opened = openImpersonation(sealImpersonation(payload, SECRET), SECRET, NOW);
  assert.equal(opened?.adminUserId, 'admin-1');
  assert.equal(opened?.targetUserId, 'student-1');
  assert.equal(opened?.targetName, 'Aarav');
});

test('the old unsigned JSON cookie — the takeover — is not read', () => {
  const forged = JSON.stringify({ adminUserId: 'admin-1', adminEmail: 'boss@example.com', targetUserId: 'student-1', startedAt: '2026-09-17T11:30:00Z' });
  assert.equal(openImpersonation(forged, SECRET, NOW), null);
});

test('an edited payload fails the seal', () => {
  const [v, , sig] = sealImpersonation(payload, SECRET).split('.');
  const body = Buffer.from(JSON.stringify({ ...payload, adminUserId: 'someone-else' })).toString('base64url');
  assert.equal(openImpersonation(`${v}.${body}.${sig}`, SECRET, NOW), null);
});

test('a cookie sealed with another key is not read', () => {
  assert.equal(openImpersonation(sealImpersonation(payload, 'b'.repeat(64)), SECRET, NOW), null);
});

test('no key on the server means nothing is sealed or read', () => {
  assert.throws(() => sealImpersonation(payload, ''));
  assert.equal(openImpersonation(sealImpersonation(payload, SECRET), '', NOW), null);
});

test('it lives for an hour, and not from the future', () => {
  const sealed = sealImpersonation(payload, SECRET);
  assert.ok(openImpersonation(sealed, SECRET, new Date('2026-09-17T12:29:00Z')));
  assert.equal(openImpersonation(sealed, SECRET, new Date('2026-09-17T12:31:00Z')), null);
  const future = sealImpersonation({ ...payload, startedAt: '2026-09-17T12:05:00Z' }, SECRET);
  assert.equal(openImpersonation(future, SECRET, NOW), null);
});

test('garbage is refused, not thrown', () => {
  for (const raw of ['', 'v1', 'v1..', 'v2.a.b', 'v1.!!!.???', undefined, null]) {
    assert.equal(openImpersonation(raw, SECRET, NOW), null);
  }
});
