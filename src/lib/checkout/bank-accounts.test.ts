import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  sanitizeBankAccounts, parseStoredBankAccounts, accountsForCountry, bankAccountRows, legacyBankAccount,
  type BankAccount,
} from './bank-accounts';

/* Test fixtures only — not real accounts. */
const india = { label: 'India — rupees', countries: ['IN'], currency: 'inr', accountName: 'Test Holder', accountNumber: '000111', ifsc: 'TEST0000001', upi: 'test@upi' };
const uk = { label: 'United Kingdom', countries: 'gb, ie', currency: 'GBP', accountName: 'Test Holder', accountNumber: '12345678', sortCode: '00-00-00' };
const world = { label: 'International', countries: ['*'], currency: 'USD', accountName: 'Test Holder', iban: 'XX00TEST', swift: 'TESTXX00' };

const ok = (raw: unknown): BankAccount[] => {
  const r = sanitizeBankAccounts(raw);
  assert.equal(r.ok, true, r.ok ? '' : r.error);
  return (r as { accounts: BankAccount[] }).accounts;
};

describe('what counts as an account a family can pay into', () => {
  test('countries and currency are normalised, however they were typed', () => {
    const [a, b] = ok([india, uk]);
    assert.equal(a.currency, 'INR');
    assert.deepEqual(b.countries, ['GB', 'IE']);
  });

  test('no holder name, no account', () => {
    const r = sanitizeBankAccounts([{ ...india, accountName: ' ' }]);
    assert.equal(r.ok, false);
  });

  test('something to pay into is required — an account number, an IBAN or a UPI ID', () => {
    assert.equal(sanitizeBankAccounts([{ ...india, accountNumber: '', upi: '' }]).ok, false);
    assert.equal(sanitizeBankAccounts([{ ...india, accountNumber: '', upi: 'test@upi' }]).ok, true);
  });

  test('a country that is not a two-letter code is refused, with the reason', () => {
    const r = sanitizeBankAccounts([{ ...uk, countries: 'England' }]);
    assert.equal(r.ok, false);
    assert.match(!r.ok ? r.error : '', /two-letter/);
  });

  test('two accounts with the same name still get different ids', () => {
    const [a, b] = ok([india, india]);
    assert.notEqual(a.id, b.id);
  });

  test('a broken stored row is dropped rather than shown half-right', () => {
    const stored = JSON.stringify([india, { label: 'broken' }, world]);
    assert.deepEqual(parseStoredBankAccounts(stored).map((a) => a.label), ['India — rupees', 'International']);
    assert.deepEqual(parseStoredBankAccounts('not json'), []);
    assert.deepEqual(parseStoredBankAccounts(null), []);
  });
});

describe('the account for the buyer’s country comes first', () => {
  const accounts = ok([india, uk, world]);

  test('an account naming the country', () => {
    const r = accountsForCountry(accounts, 'gb');
    assert.deepEqual(r.recommended.map((a) => a.currency), ['GBP']);
    assert.equal(r.others.length, 2);
  });

  test('anywhere else gets the every-other-country account', () => {
    assert.deepEqual(accountsForCountry(accounts, 'NP').recommended.map((a) => a.currency), ['USD']);
  });

  test('no country known: nothing is recommended and everything is listed', () => {
    const r = accountsForCountry(accounts, null);
    assert.equal(r.recommended.length, 0);
    assert.equal(r.others.length, 3);
  });
});

describe('the rows a family copies', () => {
  test('only the details the account has, in the order a bank app asks', () => {
    const [a] = ok([india]);
    assert.deepEqual(bankAccountRows(a).map((r) => r.label), ['Account name', 'Account number', 'IFSC', 'UPI ID']);
  });

  test('the older single account still works when nothing was entered in the dashboard', () => {
    assert.equal(legacyBankAccount({}), null);
    assert.equal(legacyBankAccount({ name: 'Test Holder', number: '000111', ifsc: 'TEST0000001' })?.currency, 'INR');
  });
});
