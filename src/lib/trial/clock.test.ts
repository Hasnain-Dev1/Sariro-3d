import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { countdownParts, urgencyOf, twoDigits } from './countdown';
import { calendarStamp, googleCalendarUrl, escapeIcs, foldIcsLine, icsFile, type ClassEvent } from './calendar';

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe('the countdown', () => {
  test('splits time left into days, hours, minutes and seconds', () => {
    const p = countdownParts(2 * DAY + 11 * HOUR + 47 * MIN + 9_000);
    assert.deepEqual([p.days, p.hours, p.minutes, p.seconds], [2, 11, 47, 9]);
  });

  test('never goes negative after the start', () => {
    assert.deepEqual(countdownParts(-5000), { days: 0, hours: 0, minutes: 0, seconds: 0, msLeft: 0 });
  });

  test('a flip clock always shows two digits', () => {
    assert.deepEqual(twoDigits(7), ['0', '7']);
    assert.deepEqual(twoDigits(42), ['4', '2']);
    assert.deepEqual(twoDigits(0), ['0', '0']);
  });

  test('changes how it feels as the class gets close', () => {
    assert.equal(urgencyOf(3 * DAY), 'far');
    assert.equal(urgencyOf(5 * HOUR), 'today');
    assert.equal(urgencyOf(40 * MIN), 'soon');
    assert.equal(urgencyOf(8 * MIN), 'now', 'the join window opens ten minutes before');
    assert.equal(urgencyOf(0), 'over');
  });

  test('the boundaries fall the right way', () => {
    assert.equal(urgencyOf(10 * MIN), 'now');
    assert.equal(urgencyOf(10 * MIN + 1), 'soon');
    assert.equal(urgencyOf(HOUR), 'soon');
    assert.equal(urgencyOf(DAY), 'today');
  });
});

describe('adding the class to a calendar', () => {
  const event: ClassEvent = {
    uid: 'b1@sariro.com',
    title: 'Free Sariro class: Coding & AI',
    description: 'With Mimo Patra; bring a notebook, and questions.',
    startIso: '2026-09-15T12:30:00.000Z',
    endIso: '2026-09-15T13:00:00.000Z',
    url: 'https://sariro.com/my-class',
  };

  test('times are written in the UTC form calendars accept', () => {
    assert.equal(calendarStamp('2026-09-15T12:30:00.000Z'), '20260915T123000Z');
  });

  test('the Google link carries the title and the exact slot', () => {
    const url = new URL(googleCalendarUrl(event));
    assert.equal(url.hostname, 'calendar.google.com');
    assert.equal(url.searchParams.get('text'), event.title);
    assert.equal(url.searchParams.get('dates'), '20260915T123000Z/20260915T130000Z');
  });

  test('special characters are escaped, or the phone silently refuses the file', () => {
    assert.equal(escapeIcs('a,b;c\\d\ne'), 'a\\,b\\;c\\\\d\\ne');
  });

  test('long lines are folded under 75 bytes, even with non-English text', () => {
    const long = 'DESCRIPTION:' + 'नमस्ते '.repeat(20);
    const folded = foldIcsLine(long);
    for (const piece of folded.split('\r\n')) {
      assert.ok(new TextEncoder().encode(piece).length <= 75, `a folded line is ${new TextEncoder().encode(piece).length} bytes`);
    }
    // Unfolding gives back the original.
    assert.equal(folded.replace(/\r\n /g, ''), long);
  });

  test('the file is a complete event with a reminder, in CRLF', () => {
    const ics = icsFile(event, new Date('2026-09-13T10:00:00.000Z'));
    assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
    assert.match(ics, /END:VCALENDAR\r\n$/);
    assert.match(ics, /DTSTART:20260915T123000Z/);
    assert.match(ics, /UID:b1@sariro\.com/);
    assert.match(ics, /TRIGGER:-PT15M/);
    assert.match(ics, /SUMMARY:Free Sariro class: Coding & AI/);
    assert.doesNotMatch(ics.replace(/\r\n/g, ''), /\n/, 'no bare newlines anywhere');
  });
});
