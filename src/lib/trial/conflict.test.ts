import test from 'node:test';
import assert from 'node:assert/strict';
import { pickConflict, whenIn, type TrialRow } from './conflict';

/* The rule: one LIVE trial per course AND grade. These cover which of a
   family's existing bookings for that pair is the one they must decide about.
   Rows arrive newest first, and cancelled ones are filtered out upstream —
   both assumptions are exercised here. */

const NOW = Date.parse('2026-09-12T12:00:00.000Z');
const inHours = (h: number) => new Date(NOW + h * 3_600_000).toISOString();

const row = (over: Partial<TrialRow> = {}): TrialRow => ({
  id: 'b1',
  slot_start: inHours(24),
  status: 'scheduled',
  ...over,
});

test('an upcoming trial is an active clash', () => {
  const picked = pickConflict([row()], NOW);
  assert.equal(picked?.kind, 'active');
  assert.equal(picked?.row.id, 'b1');
});

test('a trial they have already sat is a retry, not a clash', () => {
  const picked = pickConflict([row({ status: 'completed', slot_start: inHours(-48) })], NOW);
  assert.equal(picked?.kind, 'completed');
});

test('a class whose time has passed but was never closed still counts as taken', () => {
  /* Nine of these were sitting in the live database: scheduled, in the past,
     nobody ever marked them. They must not read as an upcoming clash. */
  const picked = pickConflict([row({ slot_start: inHours(-2) })], NOW);
  assert.equal(picked?.kind, 'completed');
});

test('the upcoming one wins even when an older one was already sat', () => {
  const picked = pickConflict(
    [row({ id: 'new', slot_start: inHours(48) }), row({ id: 'old', status: 'completed', slot_start: inHours(-72) })],
    NOW
  );
  assert.equal(picked?.kind, 'active');
  assert.equal(picked?.row.id, 'new');
});

test('nothing booked is no conflict at all', () => {
  assert.equal(pickConflict([], NOW), null);
});

test('a cancelled booking never blocks a rebooking', () => {
  /* Cancelling is how a family frees themselves to book again, so a cancelled
     row must be no obstacle — even if one reaches this function. */
  assert.equal(pickConflict([row({ status: 'cancelled' })], NOW), null);
  const picked = pickConflict([row({ id: 'x', status: 'cancelled' }), row({ id: 'sat', status: 'completed', slot_start: inHours(-24) })], NOW);
  assert.equal(picked?.row.id, 'sat');
});

test('a missed class counts as taken, so the retry is offered', () => {
  const picked = pickConflict([row({ status: 'no_show', slot_start: inHours(-5) })], NOW);
  assert.equal(picked?.kind, 'completed');
});

test('the time is said in the family’s own zone', () => {
  const when = whenIn('2026-09-12T16:05:00.000Z', 'Asia/Kolkata');
  assert.match(when, /21:35/, 'IST is UTC+5:30');
  assert.match(when, /Kolkata/);
});

test('an unusable zone still produces a readable time rather than throwing', () => {
  const when = whenIn('2026-09-12T16:05:00.000Z', 'Not/AZone');
  assert.ok(when.length > 0);
});
