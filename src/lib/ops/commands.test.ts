import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { staffCommands, searchCommands, targetOf } from './commands';
import { summariseAttention, sourcesFor } from './attention';

const nav = [
  { href: '/dashboard/hr', label: 'Home' },
  { href: '/dashboard/messages', label: 'Messages' },
  { href: '/dashboard/hr/doubt-sessions', label: 'Doubt Sessions' },
  { href: '/settings', label: 'Settings' },
];

const hrAttention = summariseAttention('hr', {
  ...Object.fromEntries(sourcesFor('hr').map((k) => [k, 0])),
  credit_requests: 3,
  unrecorded_invoices: 1,
}).items;

describe('staffCommands', () => {
  const commands = staffCommands('hr', hrAttention, nav);

  test('needs first, then jobs, then pages', () => {
    const groups = commands.map((c) => c.group);
    assert.equal(groups[0], 'Needs you');
    assert.ok(groups.indexOf('Do') > groups.lastIndexOf('Needs you'));
    assert.ok(groups.indexOf('Go to') > groups.lastIndexOf('Do'));
  });

  test('attention items carry their live counts', () => {
    const needs = commands.filter((c) => c.group === 'Needs you');
    assert.deepEqual(needs.map((c) => c.badge), [1, 3]);
  });

  test('a page already offered as a job is not offered twice', () => {
    const hrefs = commands.map((c) => c.href);
    assert.equal(hrefs.filter((h) => h === '/dashboard/hr/doubt-sessions').length, 1);
  });

  test('every command id is unique', () => {
    assert.equal(new Set(commands.map((c) => c.id)).size, commands.length);
  });

  test('every role can issue a certificate from the bar', () => {
    for (const role of ['super_admin', 'admin', 'hr'] as const) {
      assert.ok(staffCommands(role, [], []).some((c) => /certificate/i.test(c.label)), role);
    }
  });
});

describe('searchCommands', () => {
  const commands = staffCommands('hr', hrAttention, nav);

  test('empty query offers everything in order', () => {
    assert.equal(searchCommands(commands, '  ').length, commands.length);
  });

  test('a few letters find the job', () => {
    assert.equal(searchCommands(commands, 'cert')[0].label, 'Issue a certificate');
    assert.equal(searchCommands(commands, 'invoice')[0].group, 'Needs you', 'the waiting invoice outranks the tool');
  });

  test('every word must match, in label, hint or keywords', () => {
    assert.ok(searchCommands(commands, 'approve credit').every((c) => /credit/i.test(`${c.label} ${c.hint} ${c.keywords}`)));
    assert.deepEqual(searchCommands(commands, 'zebra certificate'), []);
  });

  test('a label that starts with the query ranks above one that merely contains it', () => {
    const r = searchCommands(commands, 'record');
    assert.equal(r[0].label, 'Record a sale');
  });
});

test('targetOf', () => {
  assert.deepEqual(targetOf('#decisions'), { kind: 'scroll', id: 'decisions' });
  assert.deepEqual(targetOf('?tab=credit_requests'), { kind: 'tab', tab: 'credit_requests' });
  assert.deepEqual(targetOf('/dashboard/hr/doubt-sessions'), { kind: 'navigate', href: '/dashboard/hr/doubt-sessions' });
});
