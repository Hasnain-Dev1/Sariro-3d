import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  bucketLeads, queueCounts, visibleQueues, emptyQueues, QUEUES,
  type QueueLead, type QueueKey,
} from './queues';
import type { ReminderRow } from './reminders';

/**
 * SARIRO — the queue tests
 * ============================================================================
 * The property that matters most is that a lead lands in exactly ONE queue.
 * Two lists claiming the same family means the seller rings once and one of
 * the two badges stays lit — which is how people learn to ignore badges.
 */

const NOW = Date.parse('2026-09-10T09:00:00Z'); // 14:30 IST

const lead = (id: string, over: Partial<QueueLead> = {}): QueueLead => ({
  id,
  student_name: `Child ${id}`,
  stage: 'seller_assigned',
  created_at: '2026-09-01T00:00:00Z',
  last_updated: '2026-09-01T00:00:00Z',
  ...over,
});

const reminder = (leadId: string, due: string, status: 'pending' | 'completed' | 'cancelled' = 'pending'): ReminderRow => ({
  id: `r-${leadId}-${due}`, lead_id: leadId, due_at: due, status,
});

describe('each queue catches what it should', () => {
  test('a family with no workable time goes to slot assistance', () => {
    const b = bucketLeads([lead('a', { trial_status: 'slot_assistance' })], [], NOW);
    assert.deepEqual(b.slot_assistance.map((l) => l.id), ['a']);
  });

  test('a no-show goes to missed trials', () => {
    const b = bucketLeads([lead('a', { stage: 'gathering_booked', trial_status: 'no_show' })], [], NOW);
    assert.deepEqual(b.missed_trial.map((l) => l.id), ['a']);
  });

  test('a finished trial goes to the final conversation', () => {
    const b = bucketLeads([lead('a', { stage: 'final', trial_status: 'attended' })], [], NOW);
    assert.deepEqual(b.final_conversation.map((l) => l.id), ['a']);
  });

  test('a reminder due today puts the lead in today', () => {
    const b = bucketLeads([lead('a')], [reminder('a', '2026-09-10T12:00:00Z')], NOW);
    assert.deepEqual(b.today_followup.map((l) => l.id), ['a']);
  });

  test('a reminder from yesterday puts the lead in overdue', () => {
    const b = bucketLeads([lead('a')], [reminder('a', '2026-09-08T10:00:00Z')], NOW);
    assert.deepEqual(b.overdue_followup.map((l) => l.id), ['a']);
  });

  test('an enrolled lead is converted', () => {
    const b = bucketLeads([lead('a', { stage: 'enrolled' })], [], NOW);
    assert.deepEqual(b.converted.map((l) => l.id), ['a']);
  });

  test('a lead with nothing to do appears in no queue at all', () => {
    const b = bucketLeads([lead('a', { stage: 'trial_booked', trial_status: 'booked' })], [], NOW);
    assert.deepEqual(queueCounts(b), {
      slot_assistance: 0, missed_trial: 0, final_conversation: 0,
      today_followup: 0, overdue_followup: 0, converted: 0,
    });
  });
});

describe('one lead, one queue', () => {
  test('a lead that qualifies for four queues is drawn in exactly one', () => {
    const l = lead('a', { stage: 'final', trial_status: 'no_show' });
    const b = bucketLeads([l], [reminder('a', '2026-09-08T10:00:00Z'), reminder('a', '2026-09-10T12:00:00Z')], NOW);
    const hits = (Object.keys(b) as QueueKey[]).filter((k) => b[k].length > 0);
    assert.deepEqual(hits, ['overdue_followup']);
  });

  test('several reminders on one lead still show the family once', () => {
    const b = bucketLeads(
      [lead('a')],
      [reminder('a', '2026-09-10T06:00:00Z'), reminder('a', '2026-09-10T12:00:00Z')],
      NOW
    );
    assert.equal(b.today_followup.length, 1);
  });

  /* The one that looks wrong and is not. A stale reminder on a family who has
     already paid must not put them back in the chase list. */
  test('a paid family is never chased, whatever reminder is left on them', () => {
    const b = bucketLeads(
      [lead('a', { stage: 'enrolled' })],
      [reminder('a', '2026-09-08T10:00:00Z')],
      NOW
    );
    assert.deepEqual(b.converted.map((l) => l.id), ['a']);
    assert.equal(b.overdue_followup.length, 0);
  });

  test('a completed reminder does not hold a lead in a queue', () => {
    const b = bucketLeads([lead('a')], [reminder('a', '2026-09-08T10:00:00Z', 'completed')], NOW);
    assert.equal(b.overdue_followup.length, 0);
    assert.equal(b.today_followup.length, 0);
  });

  test('across a mixed book, every lead is counted at most once', () => {
    const leads = [
      lead('a', { stage: 'enrolled' }),
      lead('b', { trial_status: 'no_show' }),
      lead('c', { trial_status: 'slot_assistance' }),
      lead('d', { stage: 'final' }),
      lead('e'),
      lead('f'),
      lead('g', { stage: 'trial_booked', trial_status: 'booked' }),
    ];
    const reminders = [reminder('e', '2026-09-10T12:00:00Z'), reminder('f', '2026-09-01T10:00:00Z')];
    const b = bucketLeads(leads, reminders, NOW);

    const seen = new Set<string>();
    for (const key of Object.keys(b) as QueueKey[]) {
      for (const l of b[key]) {
        assert.equal(seen.has(l.id), false, `${l.id} appeared in two queues`);
        seen.add(l.id);
      }
    }
    /* Six of the seven have something to do; 'g' is booked and waiting. */
    assert.equal(seen.size, 6);
    assert.equal(seen.has('g'), false);
  });
});

describe('ordering', () => {
  test('the family kept waiting longest is the next call', () => {
    const b = bucketLeads(
      [
        lead('newer', { trial_status: 'no_show', last_updated: '2026-09-09T00:00:00Z' }),
        lead('older', { trial_status: 'no_show', last_updated: '2026-09-02T00:00:00Z' }),
      ],
      [], NOW
    );
    assert.deepEqual(b.missed_trial.map((l) => l.id), ['older', 'newer']);
  });

  test('the converted list reads newest first, like a receipt', () => {
    const b = bucketLeads(
      [
        lead('old', { stage: 'enrolled', last_updated: '2026-09-02T00:00:00Z' }),
        lead('new', { stage: 'enrolled', last_updated: '2026-09-09T00:00:00Z' }),
      ],
      [], NOW
    );
    assert.deepEqual(b.converted.map((l) => l.id), ['new', 'old']);
  });

  test('a lead with no timestamps does not throw or vanish', () => {
    const b = bucketLeads(
      [{ id: 'a', stage: 'final' } as QueueLead],
      [], NOW
    );
    assert.equal(b.final_conversation.length, 1);
  });
});

describe('what gets drawn', () => {
  test('an empty overdue list disappears; an empty today does not', () => {
    const visible = visibleQueues(queueCounts(emptyQueues())).map((q) => q.key);
    assert.equal(visible.includes('overdue_followup'), false);
    assert.equal(visible.includes('today_followup'), true);
    assert.equal(visible.includes('final_conversation'), true);
    assert.equal(visible.includes('converted'), true);
  });

  test('a non-empty overdue list appears', () => {
    const counts = { ...queueCounts(emptyQueues()), overdue_followup: 2 };
    assert.equal(visibleQueues(counts).some((q) => q.key === 'overdue_followup'), true);
  });

  test('every queue has an action, not just a label', () => {
    for (const q of QUEUES) {
      assert.ok(q.action.length > 0, `${q.key} has no verb`);
    }
  });

  test('the counts and the lists are the same computation', () => {
    const b = bucketLeads(
      [lead('a', { trial_status: 'no_show' }), lead('b', { trial_status: 'no_show' })],
      [], NOW
    );
    assert.equal(queueCounts(b).missed_trial, b.missed_trial.length);
  });
});

describe('junk input', () => {
  test('a lead with no id is skipped rather than crashing the board', () => {
    const b = bucketLeads([{ id: '', stage: 'final' } as QueueLead], [], NOW);
    assert.equal(b.final_conversation.length, 0);
  });

  test('a reminder with no lead is ignored', () => {
    const b = bucketLeads(
      [lead('a')],
      [{ id: 'x', lead_id: '', due_at: '2026-09-01T00:00:00Z', status: 'pending' }],
      NOW
    );
    assert.equal(b.overdue_followup.length, 0);
  });

  test('an unknown stage puts the lead nowhere rather than everywhere', () => {
    const b = bucketLeads([lead('a', { stage: 'something_new' })], [], NOW);
    assert.equal(Object.values(b).flat().length, 0);
  });
});
