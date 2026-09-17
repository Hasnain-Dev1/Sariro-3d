import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  AUTOPAY_FREQUENCIES, FREQUENCY_MONTHS, MAX_AUTOPAY_PAYMENTS, MAX_LINK_RUPEES, RAZORPAY_PERIOD,
  autopayDescription, autopaySummary, checkLinkRequest, linkDescription, referenceId, whatsappShareUrl,
} from './link-request';

const good = { ratio: '1:4', months: 3, amount: 7999, customerName: ' Priya  Sharma ', phone: '+91 98765 43210', email: 'priya@example.com' };

test('a proper request passes, tidied', () => {
  const r = checkLinkRequest(good);
  assert.ok(r.ok);
  if (r.ok) {
    assert.equal(r.value.customerName, 'Priya Sharma');
    assert.equal(r.value.phone, '+919876543210');
    assert.equal(r.value.months, 3);
    assert.equal(r.value.leadId, null);
  }
});

test('the things a slipped finger gets wrong are refused', () => {
  assert.equal(checkLinkRequest({ ...good, ratio: '1:2' }).ok, false);
  assert.equal(checkLinkRequest({ ...good, months: 2 }).ok, false);
  assert.equal(checkLinkRequest({ ...good, amount: 0 }).ok, false);
  assert.equal(checkLinkRequest({ ...good, amount: MAX_LINK_RUPEES + 1 }).ok, false);
  assert.equal(checkLinkRequest({ ...good, amount: 7999.555 }).ok, false);
  assert.equal(checkLinkRequest({ ...good, phone: '9876543210' }).ok, false, 'no country code');
  assert.equal(checkLinkRequest({ ...good, email: 'not-an-email' }).ok, false);
  assert.equal(checkLinkRequest({ ...good, customerName: 'A' }).ok, false);
  assert.equal(checkLinkRequest({ ...good, leadId: 'drop table' }).ok, false);
  assert.equal(checkLinkRequest(null).ok, false);
});

test('an email is optional', () => {
  const r = checkLinkRequest({ ...good, email: '' });
  assert.ok(r.ok && r.value.email === null);
});

test('a reference Razorpay will accept: short, unique-ish, plain', () => {
  const ref = referenceId(1_758_000_000_000, 'ab-c!12345xyz');
  assert.ok(ref.length <= 40);
  assert.match(ref, /^SR-[A-Z0-9]+-[A-Z0-9]{1,8}$/);
});

test('the family reads what they are paying for, and the WhatsApp message carries the link', () => {
  assert.equal(linkDescription('1:1', 12), 'Sariro — one to one (1:1) — 1 year');
  const wa = whatsappShareUrl('+91 98765 43210', 'Priya Sharma', 7999, 'https://rzp.io/i/abc', '1:4', 3);
  assert.match(wa, /^https:\/\/wa\.me\/919876543210\?text=/);
  assert.match(decodeURIComponent(wa), /Hi Priya.*₹7,999.*https:\/\/rzp\.io\/i\/abc/);
});

/* ── Autopay ──────────────────────────────────────────────────────────────── */

const autopay = { ...good, autopay: true, frequency: 'monthly', count: 12, amount: 3000, months: 36 };

test('an autopay request carries its terms, and its plan comes from how often it charges', () => {
  const r = checkLinkRequest(autopay);
  assert.ok(r.ok);
  if (r.ok) {
    assert.deepEqual(r.value.autopay, { frequency: 'monthly', count: 12 });
    assert.equal(r.value.months, 1, 'each monthly payment is one month’s plan, whatever months was sent');
  }
  const yearly = checkLinkRequest({ ...autopay, frequency: 'yearly', count: 3, amount: 20999 });
  assert.ok(yearly.ok && yearly.value.months === FREQUENCY_MONTHS.yearly);
  const once = checkLinkRequest(good);
  assert.ok(once.ok && once.value.autopay === null, 'a normal link has no autopay terms');
});

test('autopay refuses a missing frequency, too few or too many payments, and a total nobody sells', () => {
  assert.equal(checkLinkRequest({ ...autopay, frequency: 'weekly' }).ok, false);
  assert.equal(checkLinkRequest({ ...autopay, count: 1 }).ok, false);
  assert.equal(checkLinkRequest({ ...autopay, count: MAX_AUTOPAY_PAYMENTS + 1 }).ok, false);
  assert.equal(checkLinkRequest({ ...autopay, count: 2.5 }).ok, false);
  assert.equal(checkLinkRequest({ ...autopay, amount: 1_00_000, count: 12 }).ok, false);
  assert.equal(checkLinkRequest({ ...autopay, autopay: 'yes' }).ok, true, 'only a real true turns autopay on');
  const notOn = checkLinkRequest({ ...autopay, autopay: 'yes' });
  assert.ok(notOn.ok && notOn.value.autopay === null);
});

test('every frequency maps to a Razorpay plan period and to a plan the price book knows', () => {
  for (const f of AUTOPAY_FREQUENCIES) {
    assert.ok(RAZORPAY_PERIOD[f].interval >= 1);
    assert.ok([1, 3, 6, 12].includes(FREQUENCY_MONTHS[f]));
  }
  assert.deepEqual(RAZORPAY_PERIOD.quarterly, { period: 'monthly', interval: 3 });
});

test('the family reads the autopay terms, on Razorpay and on WhatsApp', () => {
  const terms = { frequency: 'monthly' as const, count: 12 };
  assert.equal(autopayDescription('1:4', terms), 'Sariro — small batch (1:4) — autopay, monthly, 12 payments');
  assert.equal(autopaySummary(3000, terms), '₹3,000 monthly × 12 payments (₹36,000 in all)');
  const wa = decodeURIComponent(whatsappShareUrl('+919876543210', 'Priya', 3000, 'https://rzp.io/i/sub', '1:4', 1, terms));
  assert.match(wa, /autopay link.*₹3,000 monthly × 12 payments.*https:\/\/rzp\.io\/i\/sub/);
});
