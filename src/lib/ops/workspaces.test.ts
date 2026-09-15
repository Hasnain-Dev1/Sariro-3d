import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import {
  SECTIONS, WORKSPACE_ORDER, ROLE_HOME, HR_LEGACY_TABS, workspaceHref, workspaceAt, workspaceMeta, sectionHref, sectionsIn, placesFor,
  pathOf, waitingAt, type WorkspaceRole, type SectionSpec,
} from './workspaces';
import { ATTENTION, sourcesFor } from './attention';
import { commandsFor } from './commands';

const ROLES: WorkspaceRole[] = ['super_admin', 'admin', 'hr', 'teacher', 'seller', 'student'];

/* The page each role's workspaces render from. Read as text: the registry is
   only worth trusting if the page it describes really places every section and
   handles every ?do= it is sent. */
const PAGE_FILE: Record<WorkspaceRole, string> = {
  super_admin: 'src/app/dashboard/super-admin/super-admin-workspace.tsx',
  admin: 'src/app/dashboard/admin/admin-workspace.tsx',
  hr: 'src/app/dashboard/hr/hr-workspace.tsx',
  teacher: 'src/app/dashboard/teacher/teacher-workspace.tsx',
  seller: 'src/app/dashboard/seller/seller-workspace.tsx',
  student: 'src/app/dashboard/student/student-workspace.tsx',
};

/**
 * The page file for a URL path, allowing for route groups: /dashboard/teacher
 * is served from src/app/dashboard/teacher/(workspace)/page.tsx.
 */
function routeFile(urlPath: string): string | null {
  const walk = (dir: string, segments: string[]): string | null => {
    if (segments.length === 0) {
      const direct = `${dir}/page.tsx`;
      if (existsSync(direct)) return direct;
    } else if (existsSync(`${dir}/${segments[0]}`)) {
      const hit = walk(`${dir}/${segments[0]}`, segments.slice(1));
      if (hit) return hit;
    }
    if (!existsSync(dir)) return null;
    for (const entry of readdirSync(dir)) {
      if (/^\(.+\)$/.test(entry)) {
        const hit = walk(`${dir}/${entry}`, segments);
        if (hit) return hit;
      }
    }
    return null;
  };
  return walk('src/app', urlPath.split('/').filter(Boolean));
}
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
    assert.ok(routeFile(path), `${label}: ${href} is neither a workspace nor a page`);
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

    test(`${role}: every workspace is a route, rendering this role's page for that workspace`, () => {
      for (const ws of WORKSPACE_ORDER[role]) {
        const file = routeFile(workspaceHref(role, ws));
        assert.ok(file, `${workspaceHref(role, ws)} has no page`);
        assert.match(readFileSync(file, 'utf8'), new RegExp(`workspace="${ws}"`), `${file} does not render the ${ws} workspace`);
      }
    });

    test(`${role}: every workspace has a name and a line saying what it is for`, () => {
      for (const ws of WORKSPACE_ORDER[role]) {
        const m = workspaceMeta(role, ws);
        assert.equal(m.key, ws);
        assert.ok(m.label && m.blurb.length > 10, `${role} ${ws}`);
      }
    });

    test(`${role}: every Today-queue link lands on its section or dialog`, () => {
      for (const key of sourcesFor(role)) assertLands(role, ATTENTION[key].href[role]!, key);
    });

    test(`${role}: every ⌘K job lands`, () => {
      for (const c of commandsFor(role, [], [], placesFor(role))) assertLands(role, c.href, c.label);
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
    assert.equal(sectionHref('teacher', 'write-ups'), '/dashboard/teacher/classes#write-ups');
    assert.equal(sectionHref('student', 'next-class'), '/dashboard/student#next-class');
    assert.equal(workspaceAt('teacher', '/dashboard/teacher/trial-playbook'), null, 'the playbooks are a page, not a workspace');
    assert.equal(workspaceAt('seller', '/dashboard/seller/pay'), 'pay');
    assert.equal(workspaceMeta('seller', 'pay').label, 'Payout', 'the same key is named for its role');
    assert.throws(() => workspaceMeta('student', 'finance'));
    assert.equal(sectionHref('hr', 'credit-requests'), '/dashboard/hr/students#credit-requests');
    assert.equal(workspaceAt('hr', '/dashboard/hr/doubt-sessions'), null, 'doubt sessions stay a page of their own');
    assert.equal(workspaceAt('hr', '/dashboard/hr/sales'), 'sales');
    for (const role of ROLES) assert.ok(ROLE_HOME[role].startsWith('/dashboard/'));
  });

  test('every old HR tab link lands on a real section', () => {
    for (const [tab, href] of Object.entries(HR_LEGACY_TABS)) assertLands('hr', href, `?tab=${tab}`);
    // The tabs the old page had, every one of them.
    for (const tab of ['overview', 'my_teachers', 'incentives', 'payments', 'credits', 'tiers', 'enquiries', 'expenses', 'policy', 'credit_requests', 'invoices', 'sales', 'certificates', 'pricing']) {
      assert.ok(HR_LEGACY_TABS[tab], `?tab=${tab} has nowhere to go`);
    }
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
