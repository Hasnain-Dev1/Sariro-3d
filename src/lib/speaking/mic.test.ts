import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { diagnoseMic, micMessage, micErrorMessage } from './mic';

/**
 * SARIRO — the bug these exist for
 * ============================================================================
 * "It doesn't show a popup to enable the microphone." It never could: the page
 * was on http://, where the browser removes navigator.mediaDevices outright.
 * The old check asked `!!navigator.mediaDevices` and reported "your browser
 * cannot listen", sending somebody off to install Chrome they already had.
 */

const secure = { isSecureContext: true, SpeechRecognition: function () {} };
const media = { mediaDevices: { getUserMedia: () => {} } };

describe('diagnoseMic', () => {
  test('a secure page with recognition has nothing in the way', () => {
    assert.equal(diagnoseMic(secure, media), '');
  });

  test('an http page is insecure, not an unsupported browser', () => {
    // The whole point. Chrome on http:// is a perfectly capable browser being
    // told, correctly, that the address is the problem.
    assert.equal(diagnoseMic({ ...secure, isSecureContext: false }, media), 'insecure');
  });

  test('a missing mediaDevices reads as insecure too', () => {
    // Because that is what removes it. Reporting "no microphone support"
    // sends people to fix the wrong thing.
    assert.equal(diagnoseMic(secure, {}), 'insecure');
  });

  test('mediaDevices present but getUserMedia missing still counts', () => {
    assert.equal(diagnoseMic(secure, { mediaDevices: {} }), 'insecure');
  });

  test('secure and capable, but no speech recognition', () => {
    assert.equal(diagnoseMic({ isSecureContext: true }, media), 'no-recognition');
  });

  test('the webkit-prefixed constructor counts', () => {
    assert.equal(diagnoseMic({ isSecureContext: true, webkitSpeechRecognition: function () {} }, media), '');
  });

  test('server-side rendering does not throw', () => {
    assert.equal(diagnoseMic(undefined, undefined), 'insecure');
  });

  test('insecure is decided before recognition', () => {
    // Order matters: on http:// the recognition check is true but useless.
    assert.equal(diagnoseMic({ isSecureContext: false }, {}), 'insecure');
  });
});

describe('micMessage', () => {
  test('the insecure message names https, not a browser', () => {
    const m = micMessage('insecure');
    assert.match(m.body, /https/);
    assert.doesNotMatch(m.title, /browser/i);
  });

  test('the recognition message names the browsers that work', () => {
    assert.match(micMessage('no-recognition').body, /Chrome/);
  });
});

describe('micErrorMessage', () => {
  test('a refused permission is told where the padlock is', () => {
    assert.match(micErrorMessage({ name: 'NotAllowedError' }), /padlock/);
  });

  test('no hardware is not a permission problem', () => {
    const m = micErrorMessage({ name: 'NotFoundError' });
    assert.match(m, /No microphone found/);
    assert.doesNotMatch(m, /permission/i);
  });

  test('anything else blames the other tab, which is usually right', () => {
    assert.match(micErrorMessage({ name: 'NotReadableError' }), /Close any other call/);
  });

  test('a non-error does not crash', () => {
    assert.equal(typeof micErrorMessage(null), 'string');
    assert.equal(typeof micErrorMessage(undefined), 'string');
  });
});
