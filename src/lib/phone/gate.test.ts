import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { phoneGate, gateNeedsStatus, phoneCountry, type PhoneGateInput } from './gate';

const base: PhoneGateInput = {
  profileLoaded: true,
  phone: null,
  phoneVerified: false,
  countryCode: null,
  status: { impersonating: false, smsAvailable: true },
};

describe('the dashboard asks for a proved phone, once', () => {
  test('a verified number goes straight in, without asking the server anything', () => {
    const i = { ...base, phone: '+919709123454', phoneVerified: true, status: null };
    assert.equal(phoneGate(i), 'allow');
    assert.equal(gateNeedsStatus(i), false);
  });

  test('no number at all: verify', () => {
    assert.equal(phoneGate(base), 'verify');
  });

  test('an Indian number that was only typed: verify — every account proves it once', () => {
    assert.equal(phoneGate({ ...base, phone: '+919709123454', countryCode: 'IN' }), 'verify');
  });

  test('an old bare ten-digit Indian number is still Indian', () => {
    assert.equal(phoneCountry('9709123454', null), 'IN');
    assert.equal(phoneGate({ ...base, phone: '9709123454' }), 'verify');
  });

  test('a number abroad is verified too — the code goes on WhatsApp', () => {
    assert.equal(phoneGate({ ...base, phone: '+9779801234567', countryCode: 'NP' }), 'verify');
    assert.equal(phoneGate({ ...base, phone: '+447700900123', countryCode: 'GB', phoneVerified: true, status: null }), 'allow');
  });

  test('a number nothing places in a country is asked for again', () => {
    assert.equal(phoneGate({ ...base, phone: '12345' }), 'verify');
  });

  test('codes switched off on the server: a number on file is enough, none on file is not', () => {
    const off = { impersonating: false, smsAvailable: false };
    assert.equal(phoneGate({ ...base, phone: '+919709123454', countryCode: 'IN', status: off }), 'allow');
    assert.equal(phoneGate({ ...base, status: off }), 'verify');
  });

  test('an admin viewing as the user is not asked to prove the user’s phone', () => {
    assert.equal(phoneGate({ ...base, status: { impersonating: true, smsAvailable: true } }), 'allow');
  });

  test('nothing is decided before the profile, or the status it needs, has loaded', () => {
    assert.equal(phoneGate({ ...base, profileLoaded: false }), 'wait');
    assert.equal(phoneGate({ ...base, status: null }), 'wait');
  });
});
