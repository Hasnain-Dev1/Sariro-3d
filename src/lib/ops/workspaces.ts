/**
 * SARIRO — staff workspaces
 * ============================================================================
 * The admin and super-admin dashboards were each one page: thirty panels,
 * two thousand lines, read top to bottom. A super admin looking for last
 * month's expenses scrolled past trial grades, chat flags and lesson plans to
 * reach them, and every panel on the page fetched its data on every visit.
 *
 * Now each role has workspaces — Today, Classes, People, Sales, Finance,
 * Quality — and each is its own address. This file is the one list of which
 * section lives in which workspace. Everything that points at a section reads
 * it: the Today queue's Resolve buttons, the sidebar, ⌘K, and the section
 * component itself, which renders only in the workspace named here. So a link
 * can never point at a section that is not on the page it opens — the bug the
 * old "Needs you today" box shipped with.
 *
 * Pure, and tested (workspaces.test.ts), including a check that every section
 * here is actually placed on its role's page.
 */

export type WorkspaceRole = 'super_admin' | 'admin';

export type WorkspaceKey = 'today' | 'classes' | 'people' | 'sales' | 'finance' | 'quality';

export type WorkspaceIcon = 'today' | 'classes' | 'people' | 'sales' | 'finance' | 'quality';

export interface WorkspaceMeta {
  key: WorkspaceKey;
  label: string;
  /** One line under the title: what this workspace is for. */
  blurb: string;
  icon: WorkspaceIcon;
  accent: string;
}

export const WORKSPACE_META: Record<WorkspaceKey, WorkspaceMeta> = {
  today: { key: 'today', label: 'Today', blurb: 'What is waiting on you, and how the system is doing.', icon: 'today', accent: '#0F172A' },
  classes: { key: 'classes', label: 'Classes', blurb: 'Classes, batches, trials and courses — everything that runs on the timetable.', icon: 'classes', accent: '#7C3AED' },
  people: { key: 'people', label: 'People', blurb: 'Students, families and teachers: enrolments, credits and certificates.', icon: 'people', accent: '#2563EB' },
  sales: { key: 'sales', label: 'Sales', blurb: 'The funnel from first enquiry to paid seat.', icon: 'sales', accent: '#0891B2' },
  finance: { key: 'finance', label: 'Finance', blurb: 'Money in and out: invoices, the ledger, expenses and next month.', icon: 'finance', accent: '#059669' },
  quality: { key: 'quality', label: 'Quality', blurb: 'Keeping classes good and conversations on Sariro.', icon: 'quality', accent: '#BE185D' },
};

export const ROLE_HOME: Record<WorkspaceRole, string> = {
  super_admin: '/dashboard/super-admin',
  admin: '/dashboard/admin',
};

export const ROLE_LABEL: Record<WorkspaceRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
};

/** Which workspaces each role has, in sidebar order. Admin has no Finance. */
export const WORKSPACE_ORDER: Record<WorkspaceRole, readonly WorkspaceKey[]> = {
  super_admin: ['today', 'classes', 'people', 'sales', 'finance', 'quality'],
  admin: ['today', 'classes', 'people', 'sales', 'quality'],
};

export interface SectionSpec {
  id: string;
  workspace: WorkspaceKey;
  label: string;
  /** Words ⌘K matches on, beyond the label. */
  keywords: string;
}

/* Order within a workspace is the order on the page. */
export const SECTIONS = {
  super_admin: [
    { id: 'health', workspace: 'today', label: 'System health', keywords: 'health status jobs cron errors broken' },
    { id: 'totals', workspace: 'today', label: 'Totals', keywords: 'stats numbers users enrolments' },

    { id: 'decisions', workspace: 'classes', label: 'Classes needing a decision', keywords: 'unresolved class happened no show attendance decide' },
    { id: 'catchup-overdue', workspace: 'classes', label: 'Overdue catch-ups', keywords: 'catch up catchup make up session overdue' },
    { id: 'trial-grades', workspace: 'classes', label: 'Trial seats with no grade', keywords: 'trial grade seat band' },
    { id: 'trials', workspace: 'classes', label: 'Trial management', keywords: 'trial free class funnel seller teacher feedback' },
    { id: 'cohorts', workspace: 'classes', label: 'Courses', keywords: 'course cohort batch status meet link' },
    { id: 'schedule', workspace: 'classes', label: 'Change a batch schedule', keywords: 'reschedule batch days times break' },
    { id: 'lesson-plans', workspace: 'classes', label: 'Lesson plans', keywords: 'syllabus lessons modules curriculum' },
    { id: 'catalog', workspace: 'classes', label: 'Catalog', keywords: 'catalog tracks levels' },

    { id: 'enrollments', workspace: 'people', label: 'Pending enrolments', keywords: 'approve enrolment enrollment purchase intent' },
    { id: 'low-credits', workspace: 'people', label: 'Credits running low', keywords: 'low credits top up renew churn' },
    { id: 'credit-requests', workspace: 'people', label: 'Credit requests', keywords: 'credit request approve reject history' },
    { id: 'credit-adjust', workspace: 'people', label: 'Credit management', keywords: 'adjust add deduct credits student balance' },
    { id: 'certificates', workspace: 'people', label: 'Certificates', keywords: 'certificate issue print withdraw course complete' },

    { id: 'funnel', workspace: 'sales', label: 'Funnel & analytics', keywords: 'analytics funnel conversion visitors bookings' },
    { id: 'demand', workspace: 'sales', label: 'Who is asking', keywords: 'demand subjects grades countries' },
    { id: 'leads', workspace: 'sales', label: 'Lead pipeline', keywords: 'leads pipeline stage seller workload' },
    { id: 'lead-signals', workspace: 'sales', label: 'Trial write-ups', keywords: 'trial feedback signals seller teacher opinion' },
    { id: 'demo-requests', workspace: 'sales', label: 'Demo class requests', keywords: 'demo request enquiry referral manual trial' },

    { id: 'expenses', workspace: 'finance', label: 'Expenses', keywords: 'expense approve spend sign off' },
    { id: 'unrecorded-invoices', workspace: 'finance', label: 'Invoices not in the books', keywords: 'invoice unrecorded reconcile' },
    { id: 'ledger', workspace: 'finance', label: 'Sales & refunds', keywords: 'sales refunds ledger revenue report gst renewal' },
    { id: 'forecast', workspace: 'finance', label: 'Next month', keywords: 'forecast committed cost expected revenue' },
    { id: 'pricing', workspace: 'finance', label: 'Payment links', keywords: 'pricing razorpay payment links tier' },

    { id: 'risk', workspace: 'quality', label: 'Students & batches at risk', keywords: 'risk drifting slipping batch trouble attention' },
    { id: 'chat-policy', workspace: 'quality', label: 'Chat policy', keywords: 'chat policy flag contact details phone' },
    { id: 'audit', workspace: 'quality', label: 'Audit logs', keywords: 'audit log history who changed' },
  ],
  admin: [
    { id: 'totals', workspace: 'today', label: 'Totals', keywords: 'stats numbers users enrolments' },

    { id: 'decisions', workspace: 'classes', label: 'Classes needing a decision', keywords: 'unresolved class happened no show attendance decide' },
    { id: 'catchup-overdue', workspace: 'classes', label: 'Overdue catch-ups', keywords: 'catch up catchup make up session overdue' },
    { id: 'cohorts', workspace: 'classes', label: 'Courses', keywords: 'course cohort batch status meet link roster' },
    { id: 'catalog', workspace: 'classes', label: 'Catalog', keywords: 'catalog tracks levels' },

    { id: 'purchase-intents', workspace: 'people', label: 'Pending enrolments', keywords: 'approve enrolment enrollment purchase intent' },
    { id: 'my-teachers', workspace: 'people', label: 'My teachers', keywords: 'teachers roster reporting' },
    { id: 'certificates', workspace: 'people', label: 'Certificates', keywords: 'certificate issue print withdraw course complete' },

    { id: 'leads', workspace: 'sales', label: 'My leads', keywords: 'leads pipeline stage' },
    { id: 'demo-requests', workspace: 'sales', label: 'Demo class requests', keywords: 'demo request enquiry referral manual trial' },
    { id: 'revenue', workspace: 'sales', label: 'Revenue & exports', keywords: 'revenue payments export csv download' },

    { id: 'monitoring', workspace: 'quality', label: 'Monitor a class', keywords: 'monitoring observe class score teacher' },
    { id: 'chat-policy', workspace: 'quality', label: 'Chat policy', keywords: 'chat policy flag contact details phone' },
  ],
} as const satisfies Record<WorkspaceRole, readonly SectionSpec[]>;

export type SectionId<R extends WorkspaceRole> = (typeof SECTIONS)[R][number]['id'];
export type AnySectionId = SectionId<'super_admin'> | SectionId<'admin'>;

export function workspaceHref(role: WorkspaceRole, workspace: WorkspaceKey): string {
  return workspace === 'today' ? ROLE_HOME[role] : `${ROLE_HOME[role]}/${workspace}`;
}

export function sectionSpec(role: WorkspaceRole, id: string): SectionSpec | undefined {
  return (SECTIONS[role] as readonly SectionSpec[]).find((s) => s.id === id);
}

/** The address of a section: its workspace page, scrolled to it. */
export function sectionHref<R extends WorkspaceRole>(role: R, id: SectionId<R>): string {
  const spec = sectionSpec(role, id);
  if (!spec) throw new Error(`No section "${id}" for ${role}`);
  return `${workspaceHref(role, spec.workspace)}#${id}`;
}

/** A job that opens a dialog, on the workspace it belongs to. See useOpsDo. */
export function actionHref(role: WorkspaceRole, workspace: WorkspaceKey, action: string): string {
  return `${workspaceHref(role, workspace)}?do=${action}`;
}

export function sectionsIn(role: WorkspaceRole, workspace: WorkspaceKey): SectionSpec[] {
  return (SECTIONS[role] as readonly SectionSpec[]).filter((s) => s.workspace === workspace);
}

/** The path part of an href, without a trailing slash. */
export function pathOf(href: string): string {
  const path = href.split(/[?#]/)[0];
  return path.length > 1 ? path.replace(/\/+$/, '') : path;
}

/** Which of a role's workspaces a path is, or null for any other page. */
export function workspaceAt(role: WorkspaceRole, pathname: string): WorkspaceKey | null {
  const path = pathOf(pathname);
  return WORKSPACE_ORDER[role].find((w) => workspaceHref(role, w) === path) ?? null;
}

/** Everything a staff member can scroll to, for ⌘K's "Go to". */
export function placesFor(role: WorkspaceRole): { href: string; label: string; hint: string; keywords: string }[] {
  return (SECTIONS[role] as readonly SectionSpec[])
    .filter((s) => s.workspace !== 'today')
    .map((s) => ({
      href: `${workspaceHref(role, s.workspace)}#${s.id}`,
      label: s.label,
      hint: WORKSPACE_META[s.workspace].label,
      keywords: `${s.keywords} ${WORKSPACE_META[s.workspace].label.toLowerCase()}`,
    }));
}

/** How much is waiting on one page — for the sidebar badge and workspace tabs. */
export function waitingAt<T extends { href: string; count: number; severity: string }>(
  items: readonly T[],
  href: string
): { count: number; urgent: boolean } {
  const path = pathOf(href);
  let count = 0;
  let urgent = false;
  for (const i of items) {
    if (pathOf(i.href) !== path) continue;
    count += i.count;
    if (i.severity === 'urgent') urgent = true;
  }
  return { count, urgent };
}
