import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseTime, formatTime, formatTime12, checkWindow, mergeWindows, subtractBusy,
  freeSlots, slotIsFree, describeWindows, weeklyHours, byWeekday,
  MINUTES_IN_DAY, MIN_WINDOW_MINUTES, localWeekdayMinutes,
} from './availability';

/**
 * SARIRO — the arithmetic that decides whether two people meet
 * ============================================================================
 * A teacher says "Monday 5-6 and 8-10". A seller then books a trial into it.
 * If this is wrong, a child and a teacher are told different things and one of
 * them sits alone in an empty room.
 *
 * The case that matters most is the boundary: a class ending at 18:00 and one
 * starting at 18:00 do not overlap. Getting that wrong double-books a teacher
 * on the hour, every hour, and it is the kind of bug that looks fine in a demo.
 */

const h = (hours: number, minutes = 0) => hours * 60 + minutes;

describe('reading a time a teacher typed', () => {
  const cases: [string, number | null][] = [
    ['17:00', h(17)], ['17:30', h(17, 30)], ['5pm', h(17)], ['5 PM', h(17)],
    ['5:30pm', h(17, 30)], ['9am', h(9)], ['9:05 am', h(9, 5)],
    ['00:00', 0], ['12am', 0], ['12pm', h(12)], ['12:30am', h(0, 30)],
    ['1700', h(17)], ['8', h(8)], ['23:59', h(23, 59)],
    ['24:00', MINUTES_IN_DAY],
    ['', null], ['   ', null], ['abc', null], ['25:00', null],
    ['17:70', null], ['13pm', null], ['0pm', null], ['24:30', null],
  ];
  for (const [input, expected] of cases) {
    test(`${JSON.stringify(input)} → ${expected}`, () => {
      assert.equal(parseTime(input), expected);
    });
  }

  test('null and undefined do not throw', () => {
    assert.equal(parseTime(null), null);
    assert.equal(parseTime(undefined), null);
  });
});

describe('writing a time back out', () => {
  test('the stored form is unambiguous', () => {
    assert.equal(formatTime(h(17)), '17:00');
    assert.equal(formatTime(h(9, 5)), '09:05');
    assert.equal(formatTime(0), '00:00');
    assert.equal(formatTime(MINUTES_IN_DAY), '24:00');
  });

  test('the readable form is what a teacher recognises', () => {
    assert.equal(formatTime12(h(17)), '5:00 PM');
    assert.equal(formatTime12(h(9, 5)), '9:05 AM');
    assert.equal(formatTime12(0), '12:00 AM');
    assert.equal(formatTime12(h(12)), '12:00 PM');
    assert.equal(formatTime12(h(12, 30)), '12:30 PM');
  });

  test('every parseable time round-trips', () => {
    for (let m = 0; m < MINUTES_IN_DAY; m += 7) {
      assert.equal(parseTime(formatTime(m)), m, `failed at ${m}`);
    }
  });
});

describe('a window a teacher tried to save', () => {
  test('a sensible one is accepted', () => {
    assert.equal(checkWindow(h(17), h(18)).ok, true);
  });

  /* The single most common entry mistake: "8-10" typed as 8pm to 10am. */
  test('an end before the start is refused, and says so', () => {
    const r = checkWindow(h(20), h(10));
    assert.equal(r.ok, false);
    assert.match(r.ok === false ? r.reason : '', /after the start/i);
  });

  test('a zero-length window is refused', () => {
    assert.equal(checkWindow(h(17), h(17)).ok, false);
  });

  test('shorter than the minimum is refused with the number in it', () => {
    const r = checkWindow(h(17), h(17, 15));
    assert.equal(r.ok, false);
    assert.match(r.ok === false ? r.reason : '', new RegExp(String(MIN_WINDOW_MINUTES)));
  });

  test('exactly the minimum is fine', () => {
    assert.equal(checkWindow(h(17), h(17) + MIN_WINDOW_MINUTES).ok, true);
  });

  test('outside the day is refused', () => {
    assert.equal(checkWindow(-60, h(2)).ok, false);
    assert.equal(checkWindow(h(23), MINUTES_IN_DAY + 60).ok, false);
  });

  test('midnight to midnight is a legal whole day', () => {
    assert.equal(checkWindow(0, MINUTES_IN_DAY).ok, true);
  });
});

describe('merging one day’s windows', () => {
  test('overlapping windows become one', () => {
    assert.deepEqual(
      mergeWindows([{ start: h(17), end: h(19) }, { start: h(18), end: h(20) }]),
      [{ start: h(17), end: h(20) }]
    );
  });

  /* 5-6 and 6-7 is 5-7. Leaving them apart puts a seam in every later
     calculation that then has to be handled everywhere. */
  test('touching windows become one', () => {
    assert.deepEqual(
      mergeWindows([{ start: h(17), end: h(18) }, { start: h(18), end: h(19) }]),
      [{ start: h(17), end: h(19) }]
    );
  });

  test('separate windows stay separate — the founder’s 5-6 and 8-10', () => {
    assert.deepEqual(
      mergeWindows([{ start: h(20), end: h(22) }, { start: h(17), end: h(18) }]),
      [{ start: h(17), end: h(18) }, { start: h(20), end: h(22) }]
    );
  });

  test('a window swallowed by a bigger one disappears', () => {
    assert.deepEqual(
      mergeWindows([{ start: h(17), end: h(22) }, { start: h(18), end: h(19) }]),
      [{ start: h(17), end: h(22) }]
    );
  });

  test('nonsense rows are dropped rather than corrupting the result', () => {
    assert.deepEqual(
      mergeWindows([{ start: h(19), end: h(17) }, { start: h(17), end: h(18) }]),
      [{ start: h(17), end: h(18) }]
    );
    assert.deepEqual(mergeWindows([]), []);
  });
});

describe('taking the booked classes out', () => {
  const day = [{ start: h(17), end: h(22) }];

  test('a class in the middle splits the window', () => {
    assert.deepEqual(
      subtractBusy(day, [{ start: h(19), end: h(20) }]),
      [{ start: h(17), end: h(19) }, { start: h(20), end: h(22) }]
    );
  });

  test('a class at the start trims it', () => {
    assert.deepEqual(subtractBusy(day, [{ start: h(17), end: h(18) }]), [{ start: h(18), end: h(22) }]);
  });

  test('a class covering everything leaves nothing', () => {
    assert.deepEqual(subtractBusy(day, [{ start: h(16), end: h(23) }]), []);
  });

  test('a class entirely outside changes nothing', () => {
    assert.deepEqual(subtractBusy(day, [{ start: h(9), end: h(10) }]), day);
  });

  /* Half-open intervals: a class ending exactly when the window starts does
     not eat into it. */
  test('a class that ends exactly at the window start does not touch it', () => {
    assert.deepEqual(subtractBusy(day, [{ start: h(16), end: h(17) }]), day);
  });

  test('overlapping classes are handled as one blocked run', () => {
    assert.deepEqual(
      subtractBusy(day, [{ start: h(18), end: h(20) }, { start: h(19), end: h(21) }]),
      [{ start: h(17), end: h(18) }, { start: h(21), end: h(22) }]
    );
  });

  test('two separate windows are each trimmed', () => {
    assert.deepEqual(
      subtractBusy(
        [{ start: h(17), end: h(18) }, { start: h(20), end: h(22) }],
        [{ start: h(20, 30), end: h(21) }]
      ),
      [{ start: h(17), end: h(18) }, { start: h(20), end: h(20, 30) }, { start: h(21), end: h(22) }]
    );
  });
});

describe('the slots a booker is offered', () => {
  test('the founder’s Monday, nothing booked, one-hour trial', () => {
    const slots = freeSlots({
      windows: [{ start: h(17), end: h(18) }, { start: h(20), end: h(22) }],
      busy: [],
      slotMinutes: 60,
      stepMinutes: 30,
    });
    assert.deepEqual(slots.map(formatTime), ['17:00', '20:00', '20:30', '21:00']);
  });

  test('a booked class removes the slots it covers', () => {
    const slots = freeSlots({
      windows: [{ start: h(17), end: h(20) }],
      busy: [{ start: h(18), end: h(19) }],
      slotMinutes: 60,
      stepMinutes: 60,
    });
    assert.deepEqual(slots.map(formatTime), ['17:00', '19:00']);
  });

  test('a class longer than the gap is not offered at all', () => {
    assert.deepEqual(freeSlots({ windows: [{ start: h(17), end: h(18) }], busy: [], slotMinutes: 90 }), []);
  });

  /* Starts align to the step from midnight, so every teacher's slots sit on
     the same grid and two teachers can be compared at a glance. */
  test('a ragged window still offers aligned starts', () => {
    const slots = freeSlots({
      windows: [{ start: h(17, 10), end: h(19) }],
      busy: [], slotMinutes: 60, stepMinutes: 30,
    });
    assert.deepEqual(slots.map(formatTime), ['17:30', '18:00']);
  });

  /* Without a floor, "book a trial" cheerfully offers a slot this morning. */
  test('today’s past slots are not offered', () => {
    const slots = freeSlots({
      windows: [{ start: h(9), end: h(18) }],
      busy: [], slotMinutes: 60, stepMinutes: 60,
      earliestStart: h(15),
    });
    assert.deepEqual(slots.map(formatTime), ['15:00', '16:00', '17:00']);
  });

  test('no windows means no slots, not a crash', () => {
    assert.deepEqual(freeSlots({ windows: [], busy: [], slotMinutes: 60 }), []);
  });
});

describe('checking one specific slot before writing it down', () => {
  const windows = [{ start: h(17), end: h(19) }];

  test('a slot inside the free time is allowed', () => {
    assert.equal(slotIsFree({ windows, busy: [], slotMinutes: 60, start: h(17) }), true);
  });

  test('a slot that runs past the end is not', () => {
    assert.equal(slotIsFree({ windows, busy: [], slotMinutes: 60, start: h(18, 30) }), false);
  });

  test('a slot overlapping a booked class is not', () => {
    assert.equal(
      slotIsFree({ windows, busy: [{ start: h(18), end: h(19) }], slotMinutes: 60, start: h(17, 30) }),
      false
    );
  });

  /* The boundary that double-books teachers when it is wrong. */
  test('a slot starting exactly when a class ends IS allowed', () => {
    assert.equal(
      slotIsFree({ windows, busy: [{ start: h(17), end: h(18) }], slotMinutes: 60, start: h(18) }),
      true
    );
  });

  test('a slot in the past is refused', () => {
    assert.equal(
      slotIsFree({ windows, busy: [], slotMinutes: 60, start: h(17), earliestStart: h(18) }),
      false
    );
  });
});

describe('reading a week back', () => {
  const week = [
    { weekday: 1, start: h(17), end: h(18) },
    { weekday: 1, start: h(20), end: h(22) },
    { weekday: 3, start: h(9), end: h(10, 30) },
  ];

  test('a day reads the way it was said', () => {
    assert.equal(
      describeWindows([{ start: h(17), end: h(18) }, { start: h(20), end: h(22) }]),
      '5:00 PM – 6:00 PM, 8:00 PM – 10:00 PM'
    );
  });

  test('an empty day says so rather than showing nothing', () => {
    assert.equal(describeWindows([]), 'Not available');
  });

  test('weekly hours add up', () => {
    assert.equal(weeklyHours(week), 4.5);
  });

  test('overlapping windows are not counted twice', () => {
    assert.equal(
      weeklyHours([{ weekday: 1, start: h(17), end: h(19) }, { weekday: 1, start: h(18), end: h(20) }]),
      3
    );
  });

  test('grouping puts each window on its own day', () => {
    const days = byWeekday(week);
    assert.equal(days.length, 7);
    assert.equal(days[1].length, 2);
    assert.equal(days[3].length, 1);
    assert.equal(days[0].length, 0);
  });

  test('a row with an impossible weekday is ignored, not crashed on', () => {
    const days = byWeekday([{ weekday: 9, start: h(17), end: h(18) }]);
    assert.equal(days.flat().length, 0);
  });
});

describe('a UTC instant, in the teacher’s own week', () => {
  /* A window means 5pm WHERE THE TEACHER IS. Comparing a slot to it needs the
     instant expressed in their weekday and minute, not the server's. */
  test('the same instant is a different day and hour in two zones', () => {
    const iso = '2026-09-07T18:30:00Z'; // Monday evening UTC
    const kolkata = localWeekdayMinutes(iso, 'Asia/Kolkata');
    const newYork = localWeekdayMinutes(iso, 'America/New_York');
    assert.deepEqual(kolkata, { weekday: 2, minutes: 0 });   // Tuesday 00:00 IST
    assert.deepEqual(newYork, { weekday: 1, minutes: 14 * 60 + 30 }); // Monday 14:30 EDT
  });

  test('daylight saving is handled by the zone, not by a stored offset', () => {
    const winter = localWeekdayMinutes('2026-01-12T12:00:00Z', 'Europe/London');
    const summer = localWeekdayMinutes('2026-07-13T12:00:00Z', 'Europe/London');
    assert.equal(winter?.minutes, 12 * 60);      // GMT
    assert.equal(summer?.minutes, 13 * 60);      // BST
  });

  test('midnight is minute zero, not 1440', () => {
    const r = localWeekdayMinutes('2026-09-07T18:30:00Z', 'Asia/Kolkata');
    assert.equal(r?.minutes, 0);
  });

  test('anything unusable returns null rather than a plausible wrong answer', () => {
    assert.equal(localWeekdayMinutes('not-a-date', 'Asia/Kolkata'), null);
    assert.equal(localWeekdayMinutes('2026-09-07T18:30:00Z', 'Mars/Olympus'), null);
    assert.equal(localWeekdayMinutes('2026-09-07T18:30:00Z', ''), null);
    assert.equal(localWeekdayMinutes(null, 'Asia/Kolkata'), null);
  });
});
