import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  recordAttempt, readAttempt, clearAttempt, recoveryMessage,
  watchdogShouldFire, ATTEMPT_KEY, ATTEMPT_TTL_MS, WATCHDOG_MS,
  type AttemptStore,
} from './card-attempt';

/**
 * SARIRO — the note left behind before handing control to Razorpay
 * ============================================================================
 * This decides whether a returning buyer is told their payment did not go
 * through. Both directions are expensive: staying silent leaves somebody
 * staring at a checkout with no idea what happened, and crying wolf tells a
 * person who has just paid that they have not.
 *
 * So the rule is: warn only about an attempt we can actually vouch for.
 */

const store = (initial: Record<string, string> = {}): AttemptStore & { data: Record<string, string> } => {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = v; },
    removeItem: (k) => { delete data[k]; },
  };
};

const ATTEMPT = { track: 'web', level: 'Beginner', ratio: '1:4', courseName: 'Web Builder Pro' };
const NOW = Date.parse('2026-09-07T12:00:00Z');

describe('writing the note down', () => {
  test('an attempt round-trips', () => {
    const s = store();
    recordAttempt(s, ATTEMPT, NOW);
    const back = readAttempt(s, NOW);
    assert.equal(back?.courseName, 'Web Builder Pro');
    assert.equal(back?.track, 'web');
    assert.equal(back?.at, NOW);
  });

  test('clearing removes it', () => {
    const s = store();
    recordAttempt(s, ATTEMPT, NOW);
    clearAttempt(s);
    assert.equal(readAttempt(s, NOW), null);
  });

  /* Private mode, disabled storage and quota errors all throw on write. The
     recovery notice is a courtesy — failing to leave it must never be what
     breaks a checkout. */
  test('a storage that throws does not throw back', () => {
    const broken: AttemptStore = {
      getItem() { throw new Error('SecurityError'); },
      setItem() { throw new Error('QuotaExceeded'); },
      removeItem() { throw new Error('SecurityError'); },
    };
    assert.doesNotThrow(() => recordAttempt(broken, ATTEMPT, NOW));
    assert.doesNotThrow(() => clearAttempt(broken));
    assert.equal(readAttempt(broken, NOW), null);
  });

  test('no storage at all is handled', () => {
    assert.doesNotThrow(() => recordAttempt(null, ATTEMPT, NOW));
    assert.doesNotThrow(() => clearAttempt(undefined));
    assert.equal(readAttempt(null, NOW), null);
    assert.equal(readAttempt(undefined, NOW), null);
  });
});

describe('only an attempt we can vouch for produces a warning', () => {
  test('nothing stored', () => {
    assert.equal(readAttempt(store(), NOW), null);
  });

  test('unparseable JSON', () => {
    assert.equal(readAttempt(store({ [ATTEMPT_KEY]: 'not json{' }), NOW), null);
  });

  test('valid JSON that is not an object', () => {
    for (const raw of ['null', '42', '"hello"', '[1,2]']) {
      assert.equal(readAttempt(store({ [ATTEMPT_KEY]: raw }), NOW), null, raw);
    }
  });

  test('an object with no usable timestamp', () => {
    for (const raw of ['{}', '{"at":"soon"}', '{"at":null}']) {
      assert.equal(readAttempt(store({ [ATTEMPT_KEY]: raw }), NOW), null, raw);
    }
  });

  test('NaN and Infinity are not timestamps', () => {
    // JSON has no NaN literal, so these arrive as strings or nulls in practice —
    // but the guard is on Number.isFinite either way.
    assert.equal(readAttempt(store({ [ATTEMPT_KEY]: '{"at":1e999}' }), NOW), null);
  });

  test('expired', () => {
    const s = store();
    recordAttempt(s, ATTEMPT, NOW - ATTEMPT_TTL_MS - 1);
    assert.equal(readAttempt(s, NOW), null);
  });

  test('exactly at the edge of the window still counts', () => {
    const s = store();
    recordAttempt(s, ATTEMPT, NOW - ATTEMPT_TTL_MS);
    assert.notEqual(readAttempt(s, NOW), null);
  });

  /* A clock moved backwards would otherwise make a note look days old, or a
     note look like it came from the future. Neither is an attempt. */
  test('a timestamp in the future is a wrong clock, not a recent attempt', () => {
    const s = store();
    recordAttempt(s, ATTEMPT, NOW + 60_000);
    assert.equal(readAttempt(s, NOW), null);
  });

  test('missing string fields default rather than blowing up', () => {
    const s = store({ [ATTEMPT_KEY]: JSON.stringify({ at: NOW }) });
    const back = readAttempt(s, NOW);
    assert.equal(back?.courseName, '');
    assert.equal(back?.track, '');
  });
});

describe('what the buyer reads', () => {
  test('it names the course when we know it', () => {
    assert.match(recoveryMessage('Public Speaking'), /for Public Speaking/);
  });

  test('it still reads without one', () => {
    const m = recoveryMessage();
    assert.match(m, /for this course/);
    assert.doesNotMatch(m, /undefined/);
  });

  /* We did not observe a failed payment. We observed a window that did not
     open. Saying more than we know is how somebody gets told their money is
     gone when it never left. */
  test('it does not claim the payment failed', () => {
    const m = recoveryMessage('Web Builder Pro');
    assert.doesNotMatch(m, /payment failed/i);
    assert.doesNotMatch(m, /declined/i);
    assert.match(m, /didn't finish/i);
  });

  test('it gives both ways out, mobile data first', () => {
    const m = recoveryMessage();
    assert.match(m, /mobile data/i);
    assert.match(m, /bank transfer/i);
    assert.ok(m.indexOf('mobile data') < m.indexOf('bank transfer'));
  });

  test('it does not blame the card', () => {
    assert.match(recoveryMessage(), /network rather than the card/i);
  });
});

describe('the watchdog, for the modal that hangs instead of leaving', () => {
  const base = { awaitingModal: true, containerPresent: false, elapsedMs: WATCHDOG_MS, pageVisible: true };

  test('fires when nothing has mounted and the time is up', () => {
    assert.equal(watchdogShouldFire(base), true);
  });

  test('does not fire before the threshold', () => {
    assert.equal(watchdogShouldFire({ ...base, elapsedMs: WATCHDOG_MS - 1 }), false);
  });

  test('does not fire once something has reported back', () => {
    assert.equal(watchdogShouldFire({ ...base, awaitingModal: false }), false);
  });

  /* The most important negative: the modal is open and the buyer is typing a
     card number. Firing here would replace a working payment form with an
     error message. */
  test('does not fire when the modal actually mounted', () => {
    assert.equal(watchdogShouldFire({ ...base, containerPresent: true, elapsedMs: 60_000 }), false);
  });

  test('does not fire on a backgrounded tab', () => {
    assert.equal(watchdogShouldFire({ ...base, pageVisible: false }), false);
  });

  test('a custom threshold is respected', () => {
    assert.equal(watchdogShouldFire({ ...base, elapsedMs: 3_000 }, 2_000), true);
    assert.equal(watchdogShouldFire({ ...base, elapsedMs: 1_000 }, 2_000), false);
  });
});
