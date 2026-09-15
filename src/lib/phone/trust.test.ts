import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { decidePhoneTrust, phoneKey, samePhone, phoneSpellings, loadPhoneTrust, type TrustFacts } from './trust';

const PHONE = '+919709123454';
const none: TrustFacts = { freshCode: false, emailProved: false, accountPhones: [], verifiedBefore: false };

describe('decidePhoneTrust — the founder’s rule', () => {
  test('a new email with a new number is sent a code', () => {
    assert.deepEqual(decidePhoneTrust(PHONE, { ...none, emailProved: true }), { trusted: false });
  });

  test('a proved email whose account already has this number needs no code', () => {
    assert.deepEqual(
      decidePhoneTrust(PHONE, { ...none, emailProved: true, accountPhones: ['9709123454'] }),
      { trusted: true, why: 'account_number' }
    );
  });

  test('the account number counts in any spelling once it is verified', () => {
    assert.equal(decidePhoneTrust(PHONE, { ...none, emailProved: true, accountPhones: ['+91 9709123454'] }).trusted, true);
  });

  test('a new email with a number verified before needs no code', () => {
    assert.deepEqual(
      decidePhoneTrust(PHONE, { ...none, emailProved: true, verifiedBefore: true }),
      { trusted: true, why: 'verified_before' }
    );
  });

  test('without a proved email, a known number is NOT enough', () => {
    assert.deepEqual(decidePhoneTrust(PHONE, { ...none, verifiedBefore: true, accountPhones: [PHONE] }), { trusted: false });
  });

  test('a code verified within the hour always counts', () => {
    assert.deepEqual(decidePhoneTrust(PHONE, { ...none, freshCode: true }), { trusted: true, why: 'fresh_code' });
  });

  test('a different number on the account does not vouch for this one', () => {
    assert.equal(decidePhoneTrust(PHONE, { ...none, emailProved: true, accountPhones: ['+919999900000', null] }).trusted, false);
  });
});

describe('phoneKey / samePhone', () => {
  test('one Indian number, every way it is stored', () => {
    for (const s of ['9709123454', '+919709123454', '+91 9709123454', '919709123454', '09709123454', '+91 97091 23454']) {
      assert.equal(phoneKey(s), '9709123454', s);
    }
  });

  test('different numbers, and empties, are not the same', () => {
    assert.equal(samePhone('+919709123454', '+919709123455'), false);
    assert.equal(samePhone('', ''), false);
    assert.equal(samePhone(null, '+919709123454'), false);
  });

  test('spellings to look an Indian number up by', () => {
    const s = phoneSpellings('+919709123454');
    assert.ok(s.includes('+919709123454') && s.includes('9709123454') && s.includes('+91 9709123454'));
    assert.deepEqual(phoneSpellings('+447700900123'), ['+447700900123']);
  });
});

/* A stand-in for the service client: just enough of PostgREST's builder to
   answer the four questions loadPhoneTrust asks. */
function fakeAdmin(db: {
  freshCode?: boolean | 'error';
  emailProved?: boolean;
  accountPhones?: string[];
  /** On the account, but never verified — older accounts, typed and not proved. */
  unverifiedAccountPhones?: string[];
  verifiedCodes?: string[];
  verifiedProfiles?: string[];
}) {
  const calls: string[] = [];
  const builder = (table: string) => {
    const filters: Record<string, unknown> = {};
    const b = {
      select: () => b,
      eq: (col: string, v: unknown) => { filters[col] = v; return b; },
      ilike: (col: string, v: unknown) => { filters[col] = v; return b; },
      in: (col: string, v: unknown) => { filters[col] = v; return b; },
      not: () => b,
      limit: async () => {
        calls.push(table);
        // The account that owns the email (lib/account/email-identity.ts), then its phone.
        const onAccount = (db.accountPhones?.length ?? 0) + (db.unverifiedAccountPhones?.length ?? 0) > 0;
        if (table === 'profiles' && 'email' in filters) return { data: onAccount ? [{ id: 'acct', email: 'parent@example.com' }] : [], error: null };
        if (table === 'profiles' && 'id' in filters) {
          return {
            data: [
              ...(db.accountPhones ?? []).map((phone) => ({ phone, phone_verified: true })),
              ...(db.unverifiedAccountPhones ?? []).map((phone) => ({ phone, phone_verified: false })),
            ],
            error: null,
          };
        }
        if (table === 'profiles') {
          const hit = (filters.phone as string[]).some((p) => (db.verifiedProfiles ?? []).includes(p));
          return { data: hit ? [{ id: 'x' }] : [], error: null };
        }
        const hit = (db.verifiedCodes ?? []).includes(filters.phone as string);
        return { data: hit ? [{ phone: filters.phone }] : [], error: null };
      },
    };
    return b;
  };
  return {
    calls,
    client: {
      rpc: async (fn: string) => {
        calls.push(fn);
        if (fn === 'phone_is_verified') {
          return db.freshCode === 'error' ? { data: null, error: new Error('down') } : { data: db.freshCode === true, error: null };
        }
        return { data: db.emailProved === true, error: null };
      },
      from: builder,
      auth: { admin: { getUserById: async () => ({ data: { user: { email: 'parent@example.com' } }, error: null }) } },
    } as never,
  };
}

describe('loadPhoneTrust', () => {
  const input = { phone: PHONE, email: 'Parent@Example.com' };

  test('new email, new number: a code', async () => {
    const { client } = fakeAdmin({ emailProved: true });
    assert.deepEqual(await loadPhoneTrust(client, input), { trusted: false });
  });

  test('the number already on the proved account', async () => {
    const { client } = fakeAdmin({ emailProved: true, accountPhones: ['9709123454'] });
    assert.deepEqual(await loadPhoneTrust(client, input), { trusted: true, why: 'account_number' });
  });

  test('a number typed on the account but never proved needs its one code', async () => {
    // The founder's rule: every account proves its phone at least once.
    const { client } = fakeAdmin({ emailProved: true, unverifiedAccountPhones: ['9709123454'] });
    assert.deepEqual(await loadPhoneTrust(client, input), { trusted: false });
  });

  test('a number a code was verified for before', async () => {
    const { client } = fakeAdmin({ emailProved: true, verifiedCodes: [PHONE] });
    assert.deepEqual(await loadPhoneTrust(client, input), { trusted: true, why: 'verified_before' });
  });

  test('a number verified on somebody’s profile, stored the old way', async () => {
    const { client } = fakeAdmin({ emailProved: true, verifiedProfiles: ['+91 9709123454'] });
    assert.deepEqual(await loadPhoneTrust(client, input), { trusted: true, why: 'verified_before' });
  });

  test('an unproved email never reaches the lookups', async () => {
    const { client, calls } = fakeAdmin({ emailProved: false, verifiedCodes: [PHONE] });
    assert.deepEqual(await loadPhoneTrust(client, input), { trusted: false });
    assert.deepEqual(calls, ['phone_is_verified', 'email_is_verified']);
  });

  test('a caller that already proved the email is not asked again', async () => {
    const { client, calls } = fakeAdmin({ emailProved: false, verifiedCodes: [PHONE] });
    assert.equal((await loadPhoneTrust(client, { ...input, emailProved: true })).trusted, true);
    assert.ok(!calls.includes('email_is_verified'));
  });

  test('a fresh code short-circuits everything', async () => {
    const { client, calls } = fakeAdmin({ freshCode: true });
    assert.deepEqual(await loadPhoneTrust(client, input), { trusted: true, why: 'fresh_code' });
    assert.deepEqual(calls, ['phone_is_verified']);
  });

  test('when the verification check itself is down, it throws rather than guessing', async () => {
    const { client } = fakeAdmin({ freshCode: 'error' });
    await assert.rejects(() => loadPhoneTrust(client, input));
  });
});
