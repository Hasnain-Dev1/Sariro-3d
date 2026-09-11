import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidTimeZone, canonicalTimeZone, offsetMinutes, utcOffsetLabel,
  cityOf, timeZoneLabel, timeZoneOptions, COMMON_TIME_ZONES,
} from './timezones';

/**
 * SARIRO — the time-zone tests
 * ============================================================================
 * Fixed instants, so these read the same on every machine and in every year.
 * January and July are both used because half the zones a family might pick
 * change their clocks between them, and an offset that is right in winter and
 * an hour wrong in summer is exactly the bug a picker ships with.
 */

const JAN = Date.parse('2026-01-15T12:00:00Z');
const JUL = Date.parse('2026-07-15T12:00:00Z');

describe('is this a real zone', () => {
  test('real zones pass, including the old name browsers still report', () => {
    assert.equal(isValidTimeZone('Asia/Kolkata'), true);
    assert.equal(isValidTimeZone('Asia/Calcutta'), true);
    assert.equal(isValidTimeZone('America/New_York'), true);
  });

  test('anything else is refused rather than guessed at', () => {
    for (const bad of ['', 'Mars/Olympus', 'Asia/Kolkata; drop table', 'not a zone', '../../etc']) {
      assert.equal(isValidTimeZone(bad), false, `"${bad}" was accepted`);
    }
    assert.equal(isValidTimeZone(null), false);
    assert.equal(isValidTimeZone(undefined), false);
    assert.equal(isValidTimeZone(330), false);
  });
});

describe('the name a person would recognise', () => {
  test('Calcutta is stored and shown as Kolkata', () => {
    assert.equal(canonicalTimeZone('Asia/Calcutta'), 'Asia/Kolkata');
    assert.equal(cityOf('Asia/Calcutta'), 'Kolkata');
  });

  test('a current name is left alone', () => {
    assert.equal(canonicalTimeZone('Asia/Dubai'), 'Asia/Dubai');
  });

  test('underscores become spaces', () => {
    assert.equal(cityOf('America/New_York'), 'New York');
    assert.equal(cityOf('America/Argentina/Buenos_Aires'), 'Buenos Aires');
  });
});

describe('offsets, at a moment', () => {
  test('India is five and a half hours ahead, all year', () => {
    assert.equal(offsetMinutes('Asia/Kolkata', JAN), 330);
    assert.equal(utcOffsetLabel('Asia/Kolkata', JAN), 'UTC+5:30');
    assert.equal(utcOffsetLabel('Asia/Kolkata', JUL), 'UTC+5:30');
  });

  test('Nepal is the famous quarter hour', () => {
    assert.equal(utcOffsetLabel('Asia/Kathmandu', JAN), 'UTC+5:45');
  });

  /* The one that matters. A picker showing one fixed offset is wrong for half
     the year everywhere that changes its clocks. */
  test('New York moves with daylight saving', () => {
    assert.equal(utcOffsetLabel('America/New_York', JAN), 'UTC−5');
    assert.equal(utcOffsetLabel('America/New_York', JUL), 'UTC−4');
  });

  test('London is plain UTC in winter and an hour ahead in summer', () => {
    assert.equal(utcOffsetLabel('Europe/London', JAN), 'UTC');
    assert.equal(utcOffsetLabel('Europe/London', JUL), 'UTC+1');
  });

  test('the label combines city and offset', () => {
    assert.equal(timeZoneLabel('Asia/Dubai', JAN), 'Dubai (UTC+4)');
  });
});

describe('what the picker offers', () => {
  test('every common zone is real', () => {
    for (const tz of COMMON_TIME_ZONES) assert.equal(isValidTimeZone(tz), true, tz);
  });

  test('the full list is sorted west to east', () => {
    const { all } = timeZoneOptions(null, JAN);
    assert.ok(all.length > 50, 'expected the runtime to know many zones');
    assert.ok(offsetMinutes(all[0], JAN) <= offsetMinutes(all[all.length - 1], JAN));
  });

  test('India appears once, by its current name', () => {
    const { all } = timeZoneOptions('Asia/Calcutta', JAN);
    assert.equal(all.filter((z) => z === 'Asia/Kolkata').length, 1);
    assert.equal(all.includes('Asia/Calcutta'), false);
  });

  test('a garbage detected value adds nothing', () => {
    const before = timeZoneOptions(null, JAN).all.length;
    assert.equal(timeZoneOptions('Mars/Olympus', JAN).all.length, before);
  });
});
