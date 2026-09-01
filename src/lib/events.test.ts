import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { EVENTS, upcomingEvents, discountActive, DISCOUNT_ENDS_ON, DISCOUNT_DEADLINE } from './sariro-data';

/**
 * SARIRO — an event list that cannot advertise the past
 * =========================================================
 * These exist because of something that was live. On 31 Aug 2026, under a
 * heading that read "Upcoming events", both the homepage and /events were
 * showing:
 *
 *   Prompt Jam: Live Workshop — "Jul 22, 2026 · 6pm PT"
 *
 * Forty days in the past, plus a cohort that had started three weeks earlier.
 * Nothing had broken. The dates were hardcoded display STRINGS, so no code
 * could tell that one of them had already happened — "upcoming" was a claim the
 * page had no mechanism to keep.
 *
 * Correcting those three rows would have fixed nothing: the next three would
 * rot the same way, silently, on a marketing page nobody re-reads. So the dates
 * became machine-readable and the filter became the only way in.
 *
 * What these tests protect, specifically:
 *   • an ended event is never returned, whatever its display string says;
 *   • an event survives through the whole of its final day;
 *   • every event carries dates a machine can actually compare — which is what
 *     stops someone adding a fourth event as prose and reintroducing the bug.
 */

/** Fixed instants, so these tests read the same in every timezone and year. */
const AUG_31 = new Date('2026-08-31T12:00:00Z');

describe('upcomingEvents', () => {
  test('drops an event whose last day has passed', () => {
    const ids = upcomingEvents(AUG_31).map((e) => e.id);
    assert.ok(
      !ids.includes('prompt-jam-webinar'),
      'the 22 Jul workshop was still being advertised as upcoming on 31 Aug',
    );
  });

  test('keeps a multi-day event through its final day, not just its first', () => {
    // The hackathon runs 20–22 Sep. On the 22nd it is still on, and dropping it
    // that morning would tell someone attending that day it was cancelled.
    const onLastDay = upcomingEvents(new Date('2026-09-22T23:59:00Z'));
    assert.ok(onLastDay.some((e) => e.id === 'ai-hackathon-fall'));

    const dayAfter = upcomingEvents(new Date('2026-09-23T00:01:00Z'));
    assert.ok(!dayAfter.some((e) => e.id === 'ai-hackathon-fall'));
  });

  test('separates what has started from what has not', () => {
    const byId = new Map(upcomingEvents(AUG_31).map((e) => [e.id, e.status]));
    // Began 12 Aug and runs to 4 Oct — real, but not "upcoming".
    assert.equal(byId.get('summer-cohort-2026'), 'in-progress');
    assert.equal(byId.get('ai-hackathon-fall'), 'upcoming');
  });

  test('returns soonest first', () => {
    const starts = upcomingEvents(AUG_31).map((e) => e.startsOn);
    assert.deepEqual(starts, [...starts].sort());
  });

  test('an empty calendar is a normal result, not a crash', () => {
    // Every current event has ended by 2030. The UI must handle this — it is
    // what /events falls back to when there is genuinely nothing on.
    assert.deepEqual(upcomingEvents(new Date('2030-01-01T00:00:00Z')), []);
  });

  test('every event is comparable by machine, not just readable by eye', () => {
    const ISO = /^\d{4}-\d{2}-\d{2}$/;
    for (const e of EVENTS) {
      assert.match(e.startsOn, ISO, `${e.id} has no machine-readable start`);
      assert.match(e.endsOn, ISO, `${e.id} has no machine-readable end`);
      assert.ok(e.endsOn >= e.startsOn, `${e.id} ends before it starts`);
      // The prose date is what a reader sees; it must at least name the year
      // the real dates fall in, or the two have drifted apart.
      const year = e.startsOn.slice(0, 4);
      assert.ok(
        e.date.includes(year),
        `${e.id}: display date "${e.date}" does not mention ${year}`,
      );
    }
  });
});


/**
 * The same bug, in the other place it was live.
 *
 * On 1 Sep 2026 the homepage pricing section ran a red "Limited-time pricing"
 * banner reading "locked in for every cohort starting before Aug 12, 2026" —
 * twenty days after that date. The discounted prices were still being charged,
 * so the site was running an expired offer AND shouting a broken deadline.
 *
 * Same root cause as the events list: a date held only as prose. These keep the
 * prose and the machine-readable date pointing at the same day, and keep the
 * banner honest about which side of it we are on.
 */
describe('launch discount', () => {
  test('stops claiming to be live once its deadline has passed', () => {
    // Derived from DISCOUNT_ENDS_ON, not hardcoded. The first version of this
    // pinned 12 Aug and failed the moment the offer was legitimately extended —
    // a test that breaks on a correct change tests the calendar, not the rule.
    // What matters is the boundary: live through the last day, over the next.
    const end = new Date(`${DISCOUNT_ENDS_ON}T00:00:00Z`);
    const lastMoment = new Date(end.getTime() + 23 * 60 * 60 * 1000);
    const dayAfter = new Date(end.getTime() + 25 * 60 * 60 * 1000);

    assert.equal(discountActive(lastMoment), true, 'still on, on the final day');
    assert.equal(discountActive(dayAfter), false, 'over, the day after');
  });

  test('the date shown to a reader is the date the code checks', () => {
    // DISCOUNT_DEADLINE is prose ("Aug 12, 2026"); DISCOUNT_ENDS_ON is the
    // comparable twin. If someone extends the offer by editing one, this fails.
    const [y, m, d] = DISCOUNT_ENDS_ON.split('-').map(Number);
    const iso = new Date(Date.UTC(y, m - 1, d));
    const monthShort = iso.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });

    assert.ok(
      DISCOUNT_DEADLINE.includes(String(y)),
      `"${DISCOUNT_DEADLINE}" does not mention ${y}`,
    );
    assert.ok(
      DISCOUNT_DEADLINE.includes(monthShort),
      `"${DISCOUNT_DEADLINE}" does not mention ${monthShort}`,
    );
    assert.ok(
      DISCOUNT_DEADLINE.includes(String(d)),
      `"${DISCOUNT_DEADLINE}" does not mention day ${d}`,
    );
  });
});
