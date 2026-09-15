import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { decidePhoneWrite, nextChangeAt, leadPhone, applyAccountPhone, type CurrentPhone } from './account-phone';

const NOW = new Date('2026-09-15T12:00:00Z');
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000).toISOString();
const NEW = { phone: '+919876543210', countryCode: 'IN', verified: true };
const verified: CurrentPhone = { phone: '+919709123454', verified: true, changedAt: null };

describe('an account’s phone — proved once, changed at most weekly', () => {
  test('the first number is saved, and is not a change', () => {
    const d = decidePhoneWrite({ phone: null, verified: false, changedAt: null }, NEW, NOW);
    assert.equal(d.kind, 'write');
    assert.equal(d.kind === 'write' && d.isChange, false);
    assert.equal(d.kind === 'write' && d.patch.phone_changed_at, undefined);
  });

  test('proving the number already on the account upgrades the flag and stores it canonically', () => {
    const d = decidePhoneWrite({ phone: '98765 43210', verified: false, changedAt: null }, NEW, NOW);
    assert.deepEqual(d, { kind: 'write', isChange: false, patch: { phone: '+919876543210', phone_country_code: 'IN', phone_verified: true } });
  });

  test('the same verified number again changes nothing', () => {
    assert.deepEqual(decidePhoneWrite({ ...verified, phone: '+919876543210' }, NEW, NOW), { kind: 'noop' });
  });

  test('a typed-only number replaced by a proved one is the first proof, not a change', () => {
    const d = decidePhoneWrite({ phone: '+919709123454', verified: false, changedAt: daysAgo(1) }, NEW, NOW);
    assert.equal(d.kind === 'write' && d.isChange, false);
  });

  test('a verified number replaced by another proved number is a change, and is stamped', () => {
    const d = decidePhoneWrite(verified, NEW, NOW);
    assert.equal(d.kind, 'write');
    assert.equal(d.kind === 'write' && d.isChange, true);
    assert.equal(d.kind === 'write' && d.patch.phone_changed_at, NOW.toISOString());
  });

  test('a second change inside the week is refused, with the day it opens again', () => {
    const d = decidePhoneWrite({ ...verified, changedAt: daysAgo(3) }, NEW, NOW);
    assert.equal(d.kind, 'too_soon');
    assert.equal(d.kind === 'too_soon' && d.nextChangeAt, new Date(Date.parse(daysAgo(3)) + 7 * 86_400_000).toISOString());
  });

  test('after seven days it is allowed again', () => {
    assert.equal(decidePhoneWrite({ ...verified, changedAt: daysAgo(7) }, NEW, NOW).kind, 'write');
    assert.equal(nextChangeAt(daysAgo(8), NOW), null);
  });

  test('a proved number is never swapped for one nobody proved', () => {
    assert.deepEqual(decidePhoneWrite(verified, { phone: '+9779801234567', countryCode: 'NP', verified: false }, NOW), { kind: 'needs_proof' });
  });

  test('numbers no code can reach still change at most weekly', () => {
    const abroad = { phone: '+9779801234567', verified: false, changedAt: daysAgo(2) };
    assert.equal(decidePhoneWrite(abroad, { phone: '+9779800000000', countryCode: 'NP', verified: false }, NOW).kind, 'too_soon');
  });

  test('leads keep Indian numbers the way that table always has', () => {
    assert.equal(leadPhone('+919876543210', 'IN'), '9876543210');
    assert.equal(leadPhone('+9779801234567', 'NP'), '+9779801234567');
  });
});

/* Just enough PostgREST to watch what applyAccountPhone reads and writes. */
function fakeAdmin(profile: Record<string, unknown> | null, opts: { noChangedColumn?: boolean } = {}) {
  const writes: { table: string; patch: Record<string, unknown>; filters: Record<string, unknown> }[] = [];
  const from = (table: string) => {
    const filters: Record<string, unknown> = {};
    let patch: Record<string, unknown> | null = null;
    let columns = '';
    const b = {
      select: (c: string) => { columns = c; return b; },
      update: (p: Record<string, unknown>) => { patch = p; return b; },
      eq: (c: string, v: unknown) => { filters[c] = v; return b; },
      neq: (c: string, v: unknown) => { filters[`not ${c}`] = v; return b; },
      is: (c: string, v: unknown) => { filters[c] = v; return b; },
      maybeSingle: async () => {
        if (opts.noChangedColumn && columns.includes('phone_changed_at')) return { data: null, error: { code: '42703', message: 'no column' } };
        return { data: profile, error: null };
      },
      then: (resolve: (v: unknown) => void) => {
        if (patch) writes.push({ table, patch, filters });
        resolve({ error: null });
      },
    };
    return b;
  };
  return { writes, client: { from } as never };
}

describe('applyAccountPhone', () => {
  test('a proved change saves the profile and brings every sales record along', async () => {
    const { client, writes } = fakeAdmin({ phone: '+919709123454', phone_verified: true, phone_changed_at: null, email: 'Parent@Example.com' });
    const r = await applyAccountPhone(client, 'u1', NEW, NOW);
    assert.deepEqual(r, { ok: true, changed: true, phone: '+919876543210', verified: true });
    assert.deepEqual(writes.map((w) => w.table).sort(), ['demo_class_requests', 'payment_requests', 'profiles', 'student_leads', 'student_leads']);
    const lead = writes.find((w) => w.table === 'student_leads' && w.filters.student_id === 'u1');
    assert.equal(lead?.patch.phone, '9876543210');
    assert.equal(writes.find((w) => w.table === 'demo_class_requests')?.filters.email, 'parent@example.com');
  });

  test('too soon: nothing is written anywhere', async () => {
    const { client, writes } = fakeAdmin({ phone: '+919709123454', phone_verified: true, phone_changed_at: daysAgo(1), email: null });
    const r = await applyAccountPhone(client, 'u1', NEW, NOW);
    assert.equal(r.ok, false);
    assert.equal(!r.ok && r.error, 'too_soon');
    assert.equal(writes.length, 0);
  });

  test('before the migration, a first proof saves but a change is refused rather than unlimited', async () => {
    const first = fakeAdmin({ phone: null, phone_verified: false, email: null }, { noChangedColumn: true });
    assert.equal((await applyAccountPhone(first.client, 'u1', NEW, NOW)).ok, true);

    const change = fakeAdmin({ phone: '+919709123454', phone_verified: true, email: null }, { noChangedColumn: true });
    const r = await applyAccountPhone(change.client, 'u1', NEW, NOW);
    assert.equal(!r.ok && r.error, 'not_ready');
    assert.equal(change.writes.length, 0);
  });
});
