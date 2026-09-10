import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { normalisePhone, normaliseEmail, matchLead, type LeadIdentity } from './identity';

/**
 * SARIRO — is this the same family?
 * ============================================================================
 * Two families merged into one lead means one of them is never rung and a sale
 * is credited to whoever holds the survivor. Two rows for one family means
 * somebody apologises for calling twice.
 *
 * Most of these tests are about the first mistake.
 */

describe('normalisePhone', () => {
  test('the same number in the three shapes this database stores it in', () => {
    // profiles keeps E.164, student_leads strips the country code, and a human
    // types spaces. As strings these three find nothing in common, which is
    // why one family currently produces several unrelated rows.
    const shapes = ['+919876543210', '9876543210', '+91 98765 43210', '09876543210'];
    const seen = new Set(shapes.map(normalisePhone));
    assert.equal(seen.size, 1);
    assert.equal([...seen][0], '9876543210');
  });

  test('too short to be a number is null, so two blanks never match', () => {
    for (const junk of ['', null, undefined, '  ', 'n/a', '12345']) {
      assert.equal(normalisePhone(junk), null, JSON.stringify(junk));
    }
  });

  test('different numbers stay different', () => {
    assert.notEqual(normalisePhone('+919876543210'), normalisePhone('+919876543211'));
  });
});

describe('normaliseEmail', () => {
  test('case and whitespace do not make two people', () => {
    assert.equal(normaliseEmail('  Aarav@Example.COM '), 'aarav@example.com');
  });

  test('dots are NOT stripped', () => {
    // True at Gmail, false almost everywhere else. Being clever here merges
    // two real families at some domain we have never heard of — and merging is
    // the mistake that loses a customer and pays the wrong seller.
    assert.notEqual(normaliseEmail('a.b@corp.com'), normaliseEmail('ab@corp.com'));
  });

  test('plus tags are NOT stripped either', () => {
    assert.notEqual(normaliseEmail('p+sariro@x.com'), normaliseEmail('p@x.com'));
  });

  test('something that is not an email is null', () => {
    for (const junk of ['', null, undefined, 'not-an-email', '   ']) {
      assert.equal(normaliseEmail(junk), null, JSON.stringify(junk));
    }
  });
});

const lead = (id: string, o: Partial<LeadIdentity> = {}): LeadIdentity => ({
  id, studentId: null, phone: null, email: null, ...o,
});

describe('matchLead', () => {
  test('the account id is a fact, and it wins', () => {
    const hit = matchLead(
      [lead('L1', { phone: '9000000000' }), lead('L2', { studentId: 'u-1' })],
      { studentId: 'u-1', phone: '9000000000' }
    );
    assert.deepEqual(hit, { id: 'L2', on: 'account' });
  });

  test('the phone matches across the shapes it is stored in', () => {
    const hit = matchLead([lead('L1', { phone: '9876543210' })], { phone: '+91 98765 43210' });
    assert.deepEqual(hit, { id: 'L1', on: 'phone' });
  });

  test('a weak signal never overturns a strong one', () => {
    // A mistyped email that happens to collide with another family must not
    // pull the booking off the lead the account id already settled.
    const hit = matchLead(
      [lead('WRONG', { email: 'shared@school.com' }), lead('RIGHT', { studentId: 'u-9' })],
      { studentId: 'u-9', email: 'shared@school.com' }
    );
    assert.equal(hit?.id, 'RIGHT');
  });

  test('an email cannot move a family onto a lead that has an account', () => {
    // Once a lead belongs to a real account, something typed into a form is
    // not enough to attach a different family to it.
    const hit = matchLead(
      [lead('L1', { studentId: 'someone-else', email: 'shared@school.com' })],
      { email: 'shared@school.com' }
    );
    assert.equal(hit, null);
  });

  test('an email alone still matches a lead that has no account yet', () => {
    // The ordinary case: an enquiry came in by email, and the same family now
    // books a trial before any account exists.
    const hit = matchLead([lead('L1', { email: 'aarav@x.com' })], { email: 'AARAV@X.COM' });
    assert.deepEqual(hit, { id: 'L1', on: 'email' });
  });

  test('nothing matching is null, not a guess', () => {
    assert.equal(
      matchLead([lead('L1', { phone: '9876543210' })], { phone: '9999999999' }),
      null
    );
  });

  test('an incoming with nothing to match on matches nothing', () => {
    // Otherwise every anonymous booking attaches to the first lead in the list.
    assert.equal(matchLead([lead('L1'), lead('L2')], {}), null);
    assert.equal(matchLead([lead('L1'), lead('L2')], { phone: '', email: '  ' }), null);
  });

  test('blank fields on a stored lead do not match a blank incoming', () => {
    const hit = matchLead([lead('L1', { phone: '', email: '' })], { phone: null, email: null });
    assert.equal(hit, null);
  });

  test('the oldest equal match wins, because it carries the history', () => {
    // Callers pass leads oldest-first. That row is the one a seller has been
    // working, with notes and reminders against it; attaching to the newest
    // would strand all of that.
    const hit = matchLead(
      [lead('OLD', { phone: '9876543210' }), lead('NEW', { phone: '9876543210' })],
      { phone: '9876543210' }
    );
    assert.equal(hit?.id, 'OLD');
  });

  test('an empty candidate list is null', () => {
    assert.equal(matchLead([], { studentId: 'u-1', phone: '9876543210' }), null);
  });
});
