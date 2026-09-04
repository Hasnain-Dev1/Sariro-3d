import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { visualTier, type DeviceSignals } from './use-heavy-visuals';

/**
 * SARIRO — who gets the WebGL
 * =========================================================
 * This decides what every visitor sees. Getting it wrong in one direction
 * means phones stutter through the homepage; in the other, the product called
 * sariro-3d shows a flat page to most of its Indian audience, who are on
 * phones.
 */

const desktop: DeviceSignals = {
  reducedMotion: false, smallViewport: false, touchPrimary: false,
  deviceMemory: 8, hardwareConcurrency: 8,
};
const phone: DeviceSignals = {
  reducedMotion: false, smallViewport: true, touchPrimary: true,
  deviceMemory: 4, hardwareConcurrency: 8,
};

describe('the visual tier', () => {
  test('a capable desktop gets everything', () => {
    assert.equal(visualTier(desktop), 'full');
  });

  test('a modern phone gets the hero, not a flat page', () => {
    assert.equal(visualTier(phone), 'lite');
  });

  test('a tablet gets the hero too', () => {
    assert.equal(visualTier({ ...phone, smallViewport: false }), 'lite');
  });

  test('reduced motion wins over everything, including a fast desktop', () => {
    assert.equal(visualTier({ ...desktop, reducedMotion: true }), 'off');
    assert.equal(visualTier({ ...phone, reducedMotion: true }), 'off');
  });

  test('a 2GB phone gets a page that scrolls', () => {
    assert.equal(visualTier({ ...phone, deviceMemory: 2 }), 'off');
  });

  test('a dual-core machine gets a page that scrolls, wide screen or not', () => {
    assert.equal(visualTier({ ...desktop, hardwareConcurrency: 2 }), 'off');
  });

  /**
   * Safari and Firefox expose neither hint. Refusing them the premium layer to
   * catch a few slow machines is the worse trade — so absent means capable.
   */
  test('a browser that reports no hardware hints is treated as capable', () => {
    assert.equal(visualTier({
      reducedMotion: false, smallViewport: false, touchPrimary: false,
    }), 'full');
  });

  /**
   * A touchscreen laptop reports a wide viewport AND a coarse pointer. One
   * canvas is the safe direction to be wrong in: it still looks like the
   * product, and it cannot stutter the way three always-running canvases can.
   */
  test('a touchscreen laptop drops to one canvas rather than three', () => {
    assert.equal(visualTier({ ...desktop, touchPrimary: true }), 'lite');
  });

  test('a phone held in landscape still gets the phone tier', () => {
    assert.equal(visualTier({ ...phone, smallViewport: false }), 'lite');
  });

  test('exactly at the hardware floor is capable, not below it', () => {
    assert.equal(visualTier({ ...desktop, deviceMemory: 4, hardwareConcurrency: 4 }), 'full');
    assert.equal(visualTier({ ...desktop, deviceMemory: 3.9 }), 'off');
  });
});
