import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isSeller, SELLER_OR_FILTER } from './who-sells';

test('a seller is the seller role or the seller flag, and nobody else', () => {
  assert.equal(isSeller({ role: 'seller' }), true);
  assert.equal(isSeller({ role: 'student', is_seller: true }), true, 'the flag counts on its own');
  for (const role of ['admin', 'super_admin', 'hr', 'teacher', 'student']) {
    assert.equal(isSeller({ role }), false, `${role} is not a seller`);
  }
  assert.equal(isSeller(null), false);
});

test('the database filter asks for exactly the same two things', () => {
  /* The dropdowns use this string and the app-side check uses isSeller. If
     one grows a third condition the other does not, a dropdown offers a person
     the database then refuses — so the two are pinned together here. */
  assert.deepEqual(SELLER_OR_FILTER.split(',').sort(), ['is_seller.eq.true', 'role.eq.seller']);
  assert.doesNotMatch(SELLER_OR_FILTER, /admin|hr/);
});
