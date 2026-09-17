import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { generateOtp, isOtpShaped, OTP_CHANNEL, OTP_LENGTH, providerAccepted, providerQuery, sendOtpWhatsApp } from './otp';

/**
 * SARIRO — the code
 * =========================================================
 * A predictable code is not verification, and a code that loses its leading
 * zero is a code one person in ten cannot type back.
 */

describe('generating a code', () => {
  test('always six digits, including when it starts with zeros', () => {
    // 10,000 draws: at p(leading zero) = 0.1 this sees roughly a thousand of
    // them, so a padding bug cannot hide behind a lucky run.
    for (let i = 0; i < 10_000; i++) {
      const otp = generateOtp();
      assert.equal(otp.length, OTP_LENGTH, `got "${otp}"`);
      assert.match(otp, /^\d{6}$/);
    }
  });

  test('leading-zero codes actually occur — padding is exercised, not assumed', () => {
    let sawLeadingZero = false;
    for (let i = 0; i < 10_000 && !sawLeadingZero; i++) {
      if (generateOtp().startsWith('0')) sawLeadingZero = true;
    }
    assert.equal(sawLeadingZero, true);
  });

  test('the whole range is reachable at both ends', () => {
    let min = 999_999;
    let max = 0;
    for (let i = 0; i < 20_000; i++) {
      const n = Number(generateOtp());
      if (n < min) min = n;
      if (n > max) max = n;
    }
    // Not exhaustive by design; this catches an off-by-one that lops off a
    // whole decade at either end.
    assert.ok(min < 20_000, `lowest seen was ${min}`);
    assert.ok(max > 979_999, `highest seen was ${max}`);
  });

  test('consecutive codes are not the same code', () => {
    const seen = new Set<string>();
    for (let i = 0; i < 500; i++) seen.add(generateOtp());
    // 500 draws from a million; a handful of collisions is expected, a
    // generator stuck on one value is not.
    assert.ok(seen.size > 480, `only ${seen.size} distinct in 500`);
  });
});

describe('what a person is allowed to submit', () => {
  test('six digits', () => {
    assert.equal(isOtpShaped('042318'), true);
    assert.equal(isOtpShaped('999999'), true);
  });

  test('not five, not seven', () => {
    assert.equal(isOtpShaped('04231'), false);
    assert.equal(isOtpShaped('0423188'), false);
  });

  test('surrounding space is forgiven — it comes from pasting', () => {
    assert.equal(isOtpShaped('  042318 '), true);
  });

  test('anything that is not digits is refused before it costs an attempt', () => {
    assert.equal(isOtpShaped('04 23 18'), false);
    assert.equal(isOtpShaped('abcdef'), false);
    assert.equal(isOtpShaped(''), false);
  });
});

describe('the delivery channel', () => {
  test('every code goes on WhatsApp — the founder’s rule, not a setting', () => {
    assert.equal(OTP_CHANNEL, 'whatsapp');
  });
});

/* ── apitxt: what is sent, and what counts as sent (17 Sep 2026) ─────────── */

describe('the provider request', () => {
  test('carries the dialling code as country — apitxt refuses a WhatsApp code without it', () => {
    const q = providerQuery('916296914378', '042318', '91', 'k');
    assert.equal(q.get('mobile'), '916296914378');
    assert.equal(q.get('country'), '91', 'the dialling code, not the ISO code: IN is refused');
    assert.equal(q.get('channel'), 'whatsapp');
    assert.equal(q.get('otp'), '042318');
    assert.equal(providerQuery('+977 980-1234567', '1', '+977', 'k').get('country'), '977');
    assert.equal(providerQuery('+977 980-1234567', '1', '+977', 'k').get('mobile'), '9779801234567');
  });

  test('only a "success" reply counts as sent — an error with HTTP 200 does not', () => {
    assert.equal(providerAccepted(true, '{"status":"success","message":"Whatsapp OTP Sent Successfully"}'), true);
    assert.equal(providerAccepted(true, '{"status":"error","message":"Missing mobile"}'), false);
    assert.equal(providerAccepted(false, '{"status":"error","message":"Missing parameter: country"}'), false);
    assert.equal(providerAccepted(true, 'OK'), true, 'a non-JSON 2xx is judged by its status, as before');
    assert.equal(providerAccepted(false, 'Bad gateway'), false);
  });

  test('a code is never sent without a dialling code', async () => {
    const before = process.env.APITXT_AUTHKEY;
    process.env.APITXT_AUTHKEY = 'test-key';
    try {
      const r = await sendOtpWhatsApp('916296914378', '123456', '');
      assert.equal(r.sent, false);
      assert.equal(r.reason, 'failed');
    } finally {
      if (before === undefined) delete process.env.APITXT_AUTHKEY; else process.env.APITXT_AUTHKEY = before;
    }
  });
});
