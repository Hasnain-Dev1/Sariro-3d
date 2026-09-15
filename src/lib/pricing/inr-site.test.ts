import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { LESSONS_PER_GRADE, LESSONS_PER_GROUP } from '@/lib/school/curriculum';
import { DEFAULT_LADDER } from './economics';
import {
  DEFAULT_INR_PRICES, formatInr, inrCadencePlans, inrPricesFromLadder, isIndianPhone, isIndianTimeZone, preferredCurrency,
} from './inr-site';

describe('who sees rupees', () => {
  test('a device on Indian time, under either name', () => {
    assert.equal(preferredCurrency(null, 'Asia/Kolkata'), 'INR');
    assert.equal(preferredCurrency(null, 'Asia/Calcutta'), 'INR');
    assert.equal(preferredCurrency(null, 'America/New_York'), 'USD');
    assert.equal(preferredCurrency(null, null), 'USD');
    assert.equal(isIndianTimeZone('Asia/Dubai'), false);
  });

  test('a currency somebody picked wins over the clock', () => {
    assert.equal(preferredCurrency('USD', 'Asia/Kolkata'), 'USD');
    assert.equal(preferredCurrency('INR', 'Europe/London'), 'INR');
    assert.equal(preferredCurrency('EUR', 'Europe/London'), 'USD', 'nonsense in storage is ignored');
  });
});

describe('who may pay in rupees', () => {
  test('an Indian number, however it was stored', () => {
    assert.equal(isIndianPhone('+919876543210'), true);
    assert.equal(isIndianPhone('+91 98765 43210'), true);
    assert.equal(isIndianPhone('+1 415 555 0100'), false);
    assert.equal(isIndianPhone('9876543210'), false, 'no country code is not proof of India');
    assert.equal(isIndianPhone(null), false);
  });
});

describe('rupee plans come from the price list HR sets', () => {
  test('the defaults are the founder’s public prices', () => {
    assert.equal(DEFAULT_INR_PRICES['1:4'][1], 3_000);
    assert.equal(DEFAULT_INR_PRICES['1:1'][36], 89_999);
  });

  test('a grade year: monthly, each quarter, and the 1-year price', () => {
    const [m, q, f] = inrCadencePlans(LESSONS_PER_GRADE, '1:4', DEFAULT_INR_PRICES);
    assert.equal(m.perPayment, 3_000);
    assert.equal(m.payments, 12);
    assert.equal(m.lifetimeTotal, 36_000);
    assert.equal(q.perPayment, 7_999);
    assert.equal(q.payments, 4);
    assert.equal(f.perPayment, 26_999);
    assert.equal(f.savingLabel, 'Save ₹9,001');
  });

  test('a whole grade group is the 3-year price', () => {
    const plans = inrCadencePlans(LESSONS_PER_GROUP, '1:1', DEFAULT_INR_PRICES);
    assert.equal(plans.find((p) => p.cadence === 'full')!.perPayment, 89_999);
    assert.equal(plans.find((p) => p.cadence === 'monthly')!.payments, 36);
  });

  test('a changed price list changes the website', () => {
    const ladder = structuredClone(DEFAULT_LADDER);
    ladder['1:4'][1].publicPrice = 3_499;
    assert.equal(inrCadencePlans(LESSONS_PER_GRADE, '1:4', inrPricesFromLadder(ladder))[0].perPayment, 3_499);
  });

  test('a plan the price list cannot price is not offered in rupees at all', () => {
    const ladder = structuredClone(DEFAULT_LADDER);
    ladder['1:4'][12].publicPrice = null;
    assert.deepEqual(inrCadencePlans(LESSONS_PER_GRADE, '1:4', inrPricesFromLadder(ladder)), []);
  });

  test('money reads the Indian way', () => {
    assert.equal(formatInr(64999), '₹64,999');
    assert.equal(formatInr(127885), '₹1,27,885');
  });
});
