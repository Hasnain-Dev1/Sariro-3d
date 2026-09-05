import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { remainingCooldownMs, cooldownSeconds, SEND_COOLDOWN_MS } from './send-cooldown';

/**
 * SARIRO — the gate in front of the mailbox
 * =========================================================
 * Every confirmation email comes out of one Hostinger mailbox with a daily
 * quota. Drain it and nobody's link arrives — including the parents who paid.
 * The arithmetic below is what decides whether an address may ask again.
 */

const NOW = 1_800_000_000_000;

describe('how long an address must wait', () => {
  test('an address that has never been sent to may send now', () => {
    assert.equal(remainingCooldownMs(null, NOW), 0);
  });

  test('immediately after a send, the full window is left', () => {
    assert.equal(remainingCooldownMs(NOW, NOW), SEND_COOLDOWN_MS);
  });

  test('half way through, half the window is left', () => {
    assert.equal(remainingCooldownMs(NOW - 15_000, NOW), 15_000);
  });

  test('exactly at the window, it is free — not one tick short', () => {
    assert.equal(remainingCooldownMs(NOW - SEND_COOLDOWN_MS, NOW), 0);
  });

  test('long past the window it stays free rather than going negative', () => {
    assert.equal(remainingCooldownMs(NOW - 60 * 60 * 1000, NOW), 0);
  });

  /**
   * A clock moved backwards, or a stale value written by a different machine.
   * Treating a future timestamp as "wait" would lock the address out for
   * however long the clock is wrong by — which could be hours.
   */
  test('a timestamp in the future does not lock the address out', () => {
    assert.equal(remainingCooldownMs(NOW + 10 * 60 * 1000, NOW), 0);
  });

  test('a corrupted stored value is ignored rather than trusted', () => {
    assert.equal(remainingCooldownMs(NaN, NOW), 0);
    assert.equal(remainingCooldownMs(Infinity, NOW), 0);
  });
});

describe('what the button says', () => {
  test('the full window reads as 30s', () => {
    assert.equal(cooldownSeconds(SEND_COOLDOWN_MS), 30);
  });

  /** 0.4s left is still a wait, and "0s" beside a disabled button reads as broken. */
  test('a fraction of a second rounds up to 1s, never down to 0s', () => {
    assert.equal(cooldownSeconds(400), 1);
    assert.equal(cooldownSeconds(1), 1);
  });

  test('no wait reads as 0s', () => {
    assert.equal(cooldownSeconds(0), 0);
  });

  test('the countdown never skips a number on the way down', () => {
    const seen = new Set<number>();
    for (let left = SEND_COOLDOWN_MS; left > 0; left -= 500) seen.add(cooldownSeconds(left));
    assert.deepEqual([...seen].sort((a, b) => a - b), Array.from({ length: 30 }, (_, i) => i + 1));
  });
});
