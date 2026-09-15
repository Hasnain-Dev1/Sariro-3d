import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_LINK_RUPEES, checkLinkRequest, linkDescription, referenceId, whatsappShareUrl } from './link-request';

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
