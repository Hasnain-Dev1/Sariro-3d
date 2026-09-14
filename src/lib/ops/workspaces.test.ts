import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import {
  SECTIONS, WORKSPACE_ORDER, ROLE_HOME, workspaceHref, workspaceAt, sectionHref, sectionsIn, placesFor,
  pathOf, waitingAt, type WorkspaceRole, type SectionSpec,
} from './workspaces';
import { ATTENTION, sourcesFor } from './attention';
import { staffCommands } from './commands';

const ROLES: WorkspaceRole[] = ['super_admin', 'admin'];

/* The page each role's workspaces render from. Read as text: the registry is
   only worth trusting if the page it describes really places every section and
   handles every ?do= it is sent. */
const PAGE_FILE: Record<WorkspaceRole, string> = {
  super_admin: 'src/app/dashboard/super-admin/super-admin-workspace.tsx',
  admin: 'src/app/dashboard/admin/admin-workspace.tsx',
};
const page = (role: WorkspaceRole) => readFileSync(PAGE_FILE[role], 'utf8');

const placedIds = (role: WorkspaceRole) => [...page(role).matchAll(/<OpsSection\s+id="([a-z-]+)"/g)].map((m) => m[1]);

const doActions = (role: WorkspaceRole) => {
  const block = /useOpsDo\(\{([\s\S]*?)\}\);/.exec(page(role));
  assert.ok(block, `${role} page has no useOpsDo`);
  return [...block[1].matchAll(/^\s*'?([a-z-]+)'?:/gm)].map((m) => m[1]);
};

/** Where an href lands, checked against the registry and the page. */
function assertLands(role: WorkspaceRole, href: string, label: string) {
  const path = pathOf(href);
  const ws = workspaceAt(role, path);
  if (ws === null) {
    // Not a workspace: it must be a real page of the app.
    const file = `src/app${path}/page.tsx`;
    assert.ok(existsSync(file), `${label}: ${href} is neither a workspace nor a page (${file})`);
    return;
  }
  const hash = href.split('#')[1];
  if (hash) {
    const inWs = sectionsIn(role, ws).map((s) => s.id);
    assert.ok(inWs.includes(hash), `${label}: #${hash} is not in ${role}'s ${ws} workspace`);
  }
  const action = new URLSearchParams(href.split('?')[1]?.split('#')[0] ?? '').get('do');
  if (action) assert.ok(doActions(role).includes(action), `${label}: ?do=${action} is not handled on the ${role} page`);
}

describe('the workspace registry', () => {
  for (const role of ROLES) {
    test(`${role}: section ids are unique and every workspace has something in it`, () => {
      const ids = (SECTIONS[role] as readonly SectionSpec[]).map((s) => s.id);
      assert.equal(new Set(ids).size, ids.length);
      for (const s of SECTIONS[role] as readonly SectionSpec[]) {
        assert.ok(WORKSPACE_ORDER[role].includes(s.workspace), `${s.id} is in ${s.workspace}, which ${role} does not have`);
      }
      for (const ws of WORKSPACE_ORDER[role]) {
        if (ws !== 'today') assert.ok(sectionsIn(role, ws).length > 0, `${role}'s ${ws} workspace is empty`);
      }
    });

    test(`${role}: every registered section is placed on the page exactly once, and nothing unregistered is`, () => {
      const placed = placedIds(role);
      const registered = (SECTIONS[role] as readonly SectionSpec[]).map((s) => s.id);
      for (const id of registered) assert.equal(placed.filter((p) => p === id).length, 1, `#${id} placed ${placed.filter((p) => p === id).length} times`);
      for (const id of placed) assert.ok(registered.includes(id), `#${id} is on the page but not in the registry, so it never renders`);
    });

    test(`${role}: every workspace is a route`, () => {
      for (const ws of WORKSPACE_ORDER[role]) {
        assert.ok(existsSync(`src/app${workspaceHref(role, ws)}/page.tsx`), `${workspaceHref(role, ws)} has no page`);
      }
    });

    test(`${role}: every Today-queue link lands on its section or dialog`, () => {
      for (const key of sourcesFor(role)) assertLands(role, ATTENTION[key].href[role]!, key);
    });

    test(`${role}: every ⌘K job lands`, () => {
      for (const c of staffCommands(role, [], [], placesFor(role))) assertLands(role, c.href, c.label);
    });
  }

  test('addresses', () => {
    assert.equal(workspaceHref('super_admin', 'today'), '/dashboard/super-admin');
    assert.equal(workspaceHref('admin', 'classes'), '/dashboard/admin/classes');
    assert.equal(sectionHref('super_admin', 'expenses'), '/dashboard/super-admin/finance#expenses');
    assert.equal(workspaceAt('super_admin', '/dashboard/super-admin/finance/'), 'finance');
    assert.equal(workspaceAt('super_admin', '/dashboard/super-admin'), 'today');
    assert.equal(workspaceAt('super_admin', '/dashboard/super-admin/teacher-pay'), null);
    assert.equal(workspaceAt('admin', '/dashboard/admin/finance'), null, 'admin has no finance workspace');
    assert.equal(pathOf('/dashboard/admin/classes?do=new-course#x'), '/dashboard/admin/classes');
    for (const role of ROLES) assert.ok(ROLE_HOME[role].startsWith('/dashboard/'));
  });

  test('places for ⌘K skip Today and name their workspace', () => {
    const places = placesFor('super_admin');
    assert.ok(places.every((p) => !p.href.startsWith('/dashboard/super-admin#')));
    assert.equal(places.find((p) => p.label === 'Expenses')?.hint, 'Finance');
  });

  test('waitingAt counts only the items on that page, and says if any is urgent', () => {
    const items = [
      { href: '/dashboard/super-admin/classes#decisions', count: 2, severity: 'urgent' },
      { href: '/dashboard/super-admin/classes#trial-grades', count: 5, severity: 'watch' },
      { href: '/dashboard/super-admin/finance#expenses', count: 1, severity: 'today' },
    ];
    assert.deepEqual(waitingAt(items, '/dashboard/super-admin/classes'), { count: 7, urgent: true });
    assert.deepEqual(waitingAt(items, '/dashboard/super-admin/finance'), { count: 1, urgent: false });
    assert.deepEqual(waitingAt(items, '/dashboard/super-admin/quality'), { count: 0, urgent: false });
  });
});
