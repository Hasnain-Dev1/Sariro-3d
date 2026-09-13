import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CSP_DIRECTIVES } from './csp';

/**
 * SARIRO — the header that switched the microphone off
 * ============================================================================
 * `Permissions-Policy: microphone=()` disables the microphone for EVERY
 * origin, our own included. The browser then refuses getUserMedia without
 * showing a permission box at all — so the record button in the practice room
 * did nothing, no prompt ever appeared, and nothing in the JavaScript could
 * tell you why. Production had recorded zero practice attempts.
 *
 * The header was written before the practice room existed, with the comment
 * "disables camera/mic/geolocation we don't use". Then we built a microphone
 * feature and never came back to it.
 *
 * This reads next.config.ts as text on purpose. Importing it drags in the
 * whole Next config for a question about one string, and the string is what
 * ships. If the header moves, this test fails loudly rather than passing
 * against something that is no longer sent.
 */

const config = readFileSync('next.config.ts', 'utf8');

const policy = (() => {
  const m = config.match(/'Permissions-Policy',\s*value:\s*'([^']+)'/);
  return m ? m[1] : null;
})();

describe('Permissions-Policy', () => {
  test('the header is still declared where this test can find it', () => {
    assert.ok(policy, 'Permissions-Policy not found in next.config.ts — has it moved?');
  });

  test('the microphone is allowed to this origin', () => {
    // The bug, in one assertion.
    assert.match(policy!, /microphone=\(self\)/);
  });

  test('the microphone is NOT switched off outright', () => {
    assert.doesNotMatch(policy!, /microphone=\(\)/, 'microphone=() blocks our own practice room');
  });

  test('the microphone is not opened to everybody', () => {
    // (self) and nothing else. A wildcard would let anything embedded in the
    // page reach a child's microphone.
    assert.doesNotMatch(policy!, /microphone=\*/);
  });

  test('camera, geolocation and usb stay off — those we really do not use', () => {
    assert.match(policy!, /camera=\(\)/);
    assert.match(policy!, /geolocation=\(\)/);
    assert.match(policy!, /usb=\(\)/);
  });

  test('payment stays scoped to this origin for Razorpay', () => {
    assert.match(policy!, /payment=\(self\)/);
  });
});

/**
 * The same shape of bug, one directive over. Voice Check plays a recording back
 * from a blob: URL, and with no media-src the policy fell back to
 * default-src 'self' — which does not match blob:. The replay button spun, and
 * the only trace was "Media load rejected by URL safety check" in the console.
 */
describe('Content-Security-Policy: media', () => {
  const media = CSP_DIRECTIVES.find((d) => d.startsWith('media-src'));

  test('media-src is declared, so audio does not fall back to default-src', () => {
    assert.ok(media, "no media-src — blob: playback falls back to default-src 'self' and is refused");
  });

  test('a recording made in the page can be played back', () => {
    assert.match(media!, /(^|\s)blob:(\s|$)/);
  });

  test('media is not opened to any host', () => {
    assert.doesNotMatch(media!, /\*|https:(\s|$)/);
  });
});

describe('the other headers are still there', () => {
  test('clickjacking, sniffing and HSTS', () => {
    assert.match(config, /'X-Frame-Options',\s*value:\s*'DENY'/);
    assert.match(config, /'X-Content-Type-Options',\s*value:\s*'nosniff'/);
    assert.match(config, /Strict-Transport-Security/);
  });
});
