import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  registersToMark, trialsAhead, catchupsToArrange, classesToday, planState, speakingWaiting, REGISTER_LOOKBACK_DAYS,
} from './queue-counts';

const NOW = Date.parse('2026-09-15T12:00:00Z');
const H = 3_600_000;
const at = (hours: number) => new Date(NOW + hours * H).toISOString();
const row = (id: string, startH: number, over: Partial<Parameters<typeof registersToMark>[0][number]> = {}) => ({
  id, status: 'scheduled', slot_start: at(startH), slot_end: at(startH + 1), is_trial: false, attendance_finalized_at: null, ...over,
});

describe('registers to mark', () => {
  test('over, went ahead, not closed, within the week — oldest first', () => {
    const rows = [
      row('later', -3),
      row('earlier', -30),
      row('running', -0.5),
      row('future', 5),
      row('closed', -4, { attendance_finalized_at: at(-2) }),
      row('trial', -5, { is_trial: true }),
      row('cancelled', -6, { status: 'cancelled' }),
      row('no-show', -6, { status: 'no_show' }),
      row('completed', -8, { status: 'completed' }),
      row('ancient', -(REGISTER_LOOKBACK_DAYS * 24 + 2)),
    ];
    assert.deepEqual(registersToMark(rows, NOW).map((r) => r.id), ['earlier', 'completed', 'later']);
  });

  test('a class ending exactly now is due', () => {
    assert.equal(registersToMark([row('edge', -1)], NOW).length, 1);
  });
});

test('trials ahead: scheduled trials not yet over, inside the window, soonest first', () => {
  const rows = [
    row('in-two-days', 48, { is_trial: true }),
    row('tomorrow', 20, { is_trial: true }),
    row('running', -0.5, { is_trial: true }),
    row('done', -3, { is_trial: true }),
    row('batch', 2),
    row('cancelled', 3, { is_trial: true, status: 'cancelled' }),
  ];
  assert.deepEqual(trialsAhead(rows, NOW).map((r) => r.id), ['running', 'tomorrow', 'in-two-days']);
  assert.deepEqual(trialsAhead(rows, NOW, 24).map((r) => r.id), ['running', 'tomorrow']);
});

test('catch-ups to arrange add up the unscheduled lessons', () => {
  assert.equal(catchupsToArrange([{ summary: { unscheduled: 2 } }, { summary: { unscheduled: 0 } }, { summary: { unscheduled: 1 } }]), 3);
  assert.equal(catchupsToArrange([]), 0);
});

test('classes today: the rest of the reader’s day, including one already running', () => {
  const now = new Date(2026, 8, 15, 10, 0);
  const local = (h: number, min = 0) => new Date(2026, 8, 15, h, min).toISOString();
  const slots = [
    { slot_start: local(9, 30), slot_end: local(10, 30), status: 'scheduled' }, // running
    { slot_start: local(17), slot_end: local(18), status: 'scheduled' },
    { slot_start: local(8), slot_end: local(9), status: 'scheduled' }, // over
    { slot_start: new Date(2026, 8, 16, 9).toISOString(), slot_end: new Date(2026, 8, 16, 10).toISOString(), status: 'scheduled' },
    { slot_start: local(19), slot_end: local(20), status: 'cancelled' },
  ];
  assert.equal(classesToday(slots, now), 2);
});

describe('plan state', () => {
  test('paused covers every active course, and hides the low warning', () => {
    assert.deepEqual(planState({ balance: 0, studentStatus: 'paused', activeCourses: 2 }), { paused: 2, low: 0 });
    assert.deepEqual(planState({ balance: 0, studentStatus: 'grace', activeCourses: 0 }), { paused: 1, low: 0 });
  });

  test('low only at one or two classes left', () => {
    assert.deepEqual(planState({ balance: 2, studentStatus: 'active', activeCourses: 1 }), { paused: 0, low: 2 });
    assert.deepEqual(planState({ balance: 1, studentStatus: null, activeCourses: 1 }), { paused: 0, low: 1 });
    assert.deepEqual(planState({ balance: 3, studentStatus: 'active', activeCourses: 1 }), { paused: 0, low: 0 });
    assert.deepEqual(planState({ balance: 0, studentStatus: 'active', activeCourses: 1 }), { paused: 0, low: 0 });
  });
});

describe('speaking missions waiting', () => {
  const m = (passed: boolean, tries: number) => ({ passed, tries });
  const level = (cleared: boolean, missions: { passed: boolean; tries: number }[]) => ({ status: { cleared, missions } });

  test('today’s quest plus what is left on the level part-way through', () => {
    const state = {
      daily: { passed: false },
      worlds: [
        { levels: [level(true, [m(true, 3)]), level(false, [m(true, 3), m(false, 1), m(false, 0)])] },
        { levels: [level(false, [m(false, 2)])] },
      ],
    };
    assert.equal(speakingWaiting(state), 3);
  });

  test('levels never started are not a to-do list', () => {
    assert.equal(speakingWaiting({ daily: { passed: true }, worlds: [{ levels: [level(false, [m(false, 0)])] }] }), 0);
    assert.equal(speakingWaiting({ daily: { passed: false }, worlds: [] }), 1);
  });
});
