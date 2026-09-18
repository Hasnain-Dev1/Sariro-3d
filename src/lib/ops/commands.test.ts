import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { commandsFor, searchCommands, targetOf } from './commands';
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

describe('commandsFor', () => {
  const commands = commandsFor('hr', hrAttention, nav);

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

  test('every staff role can issue a certificate from the bar', () => {
    for (const role of ['super_admin', 'admin', 'hr'] as const) {
      assert.ok(commandsFor(role, [], []).some((c) => /certificate/i.test(c.label)), role);
    }
  });

  test('each role reaches its own everyday job in a word', () => {
    assert.equal(searchCommands(commandsFor('teacher', [], []), 'register')[0].label, 'Mark a register');
    assert.equal(searchCommands(commandsFor('teacher', [], []), 'playbook')[0].label, 'Open a trial playbook');
    assert.equal(searchCommands(commandsFor('seller', [], []), 'book')[0].label, 'Book a trial class');
    // Every course has a practice room now (18 Sep 2026); speaking is one of them.
    assert.equal(searchCommands(commandsFor('student', [], []), 'practice')[0].label, 'Practice rooms');
    assert.equal(searchCommands(commandsFor('student', [], []), 'speaking')[0].label, 'Practise speaking');
  });
});

describe('searchCommands', () => {
  const commands = commandsFor('hr', hrAttention, nav);

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

describe('sections in "Go to"', () => {
  const sections = [
    { href: '/dashboard/super-admin/finance#expenses', label: 'Expenses', hint: 'Finance', keywords: 'expense spend finance' },
    { href: '/dashboard/super-admin/quality#audit', label: 'Audit logs', hint: 'Quality', keywords: 'audit log quality' },
  ];
  const commands = commandsFor('super_admin', [], [{ href: '/dashboard/super-admin/finance', label: 'Finance' }], sections);

  test('come after the sidebar, carrying their workspace as the hint', () => {
    const go = commands.filter((c) => c.group === 'Go to');
    assert.equal(go[0].label, 'Finance');
    assert.equal(go.find((c) => c.label === 'Audit logs')?.hint, 'Quality');
  });

  test('a section already offered as a job is not offered twice', () => {
    // "Approve expenses" is a job pointing at the same section.
    assert.equal(commands.filter((c) => c.href === '/dashboard/super-admin/finance#expenses').length, 1);
  });

  test('are found by the words of their workspace', () => {
    assert.ok(searchCommands(commands, 'audit').some((c) => c.label === 'Audit logs'));
  });
});

describe('targetOf', () => {
  test('an href with no path is this page', () => {
    assert.deepEqual(targetOf('#decisions'), { kind: 'scroll', id: 'decisions' });
    assert.deepEqual(targetOf('?tab=credit_requests'), { kind: 'tab', tab: 'credit_requests' });
    assert.deepEqual(targetOf('?do=book-trial'), { kind: 'do', action: 'book-trial' });
  });

  test('on the page it points into, it acts in place', () => {
    const here = '/dashboard/super-admin/finance';
    assert.deepEqual(targetOf('/dashboard/super-admin/finance#expenses', here), { kind: 'scroll', id: 'expenses' });
    assert.deepEqual(targetOf('/dashboard/super-admin/finance?do=earnings', `${here}/`), { kind: 'do', action: 'earnings' });
    assert.deepEqual(targetOf('/dashboard/hr?tab=sales', '/dashboard/hr'), { kind: 'tab', tab: 'sales' });
  });

  test('from anywhere else, it navigates and the page finishes the job', () => {
    assert.deepEqual(targetOf('/dashboard/super-admin/finance#expenses', '/dashboard/messages'), { kind: 'navigate', href: '/dashboard/super-admin/finance#expenses' });
    assert.deepEqual(targetOf('/dashboard/hr?tab=sales', '/settings'), { kind: 'navigate', href: '/dashboard/hr?tab=sales' });
    assert.deepEqual(targetOf('/dashboard/hr/doubt-sessions'), { kind: 'navigate', href: '/dashboard/hr/doubt-sessions' });
  });

  test('a workspace does not count as its parent', () => {
    assert.deepEqual(targetOf('/dashboard/super-admin#x', '/dashboard/super-admin/finance'), { kind: 'navigate', href: '/dashboard/super-admin#x' });
  });
});
