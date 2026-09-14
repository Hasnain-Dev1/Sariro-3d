import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { ATTENTION, sourcesFor, summariseAttention, greetingFor, type AttentionKey, type StaffRole } from './attention';

const ROLES: StaffRole[] = ['super_admin', 'admin', 'hr'];

describe('the attention registry', () => {
  test('every role has something to watch, and every source belongs to someone', () => {
    for (const role of ROLES) assert.ok(sourcesFor(role).length >= 3, role);
    for (const key of Object.keys(ATTENTION) as AttentionKey[]) {
      assert.ok(ROLES.some((r) => ATTENTION[key].href[r]), `${key} is shown to nobody`);
    }
  });

  test('titles read as sentences in the singular and the plural', () => {
    for (const spec of Object.values(ATTENTION)) {
      assert.match(spec.title(1), /^1 /);
      assert.match(spec.title(3), /^3 /);
      assert.notEqual(spec.title(1).replace(/^1 /, ''), spec.title(3).replace(/^3 /, ''), `${spec.key} does not change for one`);
    }
  });

  test('links are full addresses, so the queue works from any page', () => {
    for (const spec of Object.values(ATTENTION)) {
      for (const href of Object.values(spec.href)) assert.match(href!, /^\/dashboard\/[a-z/-]+(\?(tab|do)=[a-z_-]+)?(#[a-z-]+)?$/, spec.key);
    }
  });

  test('HR is sent to its tabs; admin and super admin into their own workspaces', () => {
    for (const key of sourcesFor('hr')) assert.match(ATTENTION[key].href.hr!, /^\/dashboard\/hr\?tab=/);
    for (const key of sourcesFor('super_admin')) assert.match(ATTENTION[key].href.super_admin!, /^\/dashboard\/super-admin\/[a-z]+[#?]/);
    for (const key of sourcesFor('admin')) assert.match(ATTENTION[key].href.admin!, /^\/dashboard\/admin\/[a-z]+[#?]/);
  });
});

describe('summariseAttention', () => {
  const all = (role: StaffRole, n: number) => Object.fromEntries(sourcesFor(role).map((k) => [k, n])) as Record<AttentionKey, number>;

  test('only what has something waiting, most urgent first, then the biggest', () => {
    const s = summariseAttention('super_admin', {
      ...all('super_admin', 0),
      low_credits: 9,
      credit_requests: 2,
      policy_flags: 5,
      unresolved_classes: 1,
      catchup_overdue: 3,
    });
    assert.deepEqual(s.items.map((i) => i.key), ['catchup_overdue', 'unresolved_classes', 'policy_flags', 'credit_requests', 'low_credits']);
    assert.equal(s.total, 20);
    assert.deepEqual(s.bySeverity, { urgent: 4, today: 7, watch: 9 });
    assert.equal(s.allClear, false);
  });

  test('all clear only when every source answered with nothing', () => {
    assert.equal(summariseAttention('hr', all('hr', 0)).allClear, true);
    const partial = summariseAttention('hr', { credit_requests: 0 });
    assert.equal(partial.allClear, false);
    assert.equal(partial.pending, true);
  });

  test('a source that failed is reported, never counted as zero', () => {
    const s = summariseAttention('admin', { ...all('admin', 0), approvals: null });
    assert.deepEqual(s.failed, ['approvals']);
    assert.equal(s.allClear, false);
  });

  test('sources a role cannot act on are ignored even if counted', () => {
    const s = summariseAttention('hr', { ...all('hr', 0), unresolved_classes: 7 });
    assert.equal(s.items.length, 0);
  });

  test('each item carries the link for this role', () => {
    const s = summariseAttention('hr', { ...all('hr', 0), credit_requests: 4 });
    assert.equal(s.items[0].href, '/dashboard/hr?tab=credit_requests');
    assert.equal(s.items[0].title, '4 credit requests are waiting');
  });
});

test('greetingFor', () => {
  assert.equal(greetingFor(8), 'Good morning');
  assert.equal(greetingFor(14), 'Good afternoon');
  assert.equal(greetingFor(20), 'Good evening');
  assert.equal(greetingFor(2), 'Working late');
});
