import type { AttentionItem, StaffRole } from './attention';
import { actionHref, sectionHref } from './workspaces';

/**
 * SARIRO — the command bar (⌘K / Ctrl+K)
 * ============================================================================
 * Everything a member of staff can reach, typed rather than scrolled for.
 * Finding "Issue a certificate" on the old admin page meant knowing it was
 * below the chat policy panel. Here it is three letters.
 *
 * Three kinds of command, in the order they are offered:
 *
 *   Needs you   the live attention items, with their counts — the command bar
 *               is also the fastest way to see what is waiting
 *   Do          the jobs each role actually does
 *   Go to       every page in the sidebar, then every section of every workspace
 *
 * Every link is a full address, so a command works from any page — Messages,
 * Settings, another workspace — not only from the page it points into.
 *
 * Pure: the component supplies the attention items, the sidebar and the
 * sections, and this decides what is offered and in what order. Tested,
 * including the search.
 */

export type CommandGroup = 'Needs you' | 'Do' | 'Go to';

export interface Command {
  id: string;
  group: CommandGroup;
  label: string;
  /** A short line under the label. */
  hint?: string;
  href: string;
  keywords: string;
  /** A live count, for "Needs you". */
  badge?: number;
  /** Accent for the icon chip. */
  accent?: string;
}

interface Action {
  label: string;
  hint: string;
  href: string;
  keywords: string;
}

const SA = 'super_admin' as const;
const AD = 'admin' as const;
const HR = '/dashboard/hr';

/** The jobs, per role. A dialog is `?do=`, a section is its workspace address. */
const ACTIONS: Record<StaffRole, Action[]> = {
  super_admin: [
    { label: 'Issue a certificate', hint: 'Find a student and issue or print a certificate', href: sectionHref(SA, 'certificates'), keywords: 'certificate issue print course complete' },
    { label: 'Decide past classes', hint: 'Mark whether classes happened', href: sectionHref(SA, 'decisions'), keywords: 'unresolved class happened no show attendance decide' },
    { label: 'Approve expenses', hint: 'Sign off what HR recorded', href: sectionHref(SA, 'expenses'), keywords: 'expense approve spend' },
    { label: 'Book a trial class', hint: 'Into a teacher’s open hours', href: actionHref(SA, 'classes', 'book-trial'), keywords: 'book trial free class demo' },
    { label: 'Change a batch schedule', hint: 'New days and times, a start date or a break', href: actionHref(SA, 'classes', 'change-schedule'), keywords: 'reschedule batch days times break holiday' },
    { label: 'Manage users & roles', hint: 'Change a role or sign in as someone', href: actionHref(SA, 'people', 'users'), keywords: 'users roles staff impersonate sign in as' },
    { label: 'Assign a teacher', hint: 'Reporting admin and HR for a teacher', href: actionHref(SA, 'people', 'assign-teacher'), keywords: 'assign teacher admin hr manager reporting' },
    { label: 'Assign a seller', hint: 'Reporting admin and HR for a seller', href: actionHref(SA, 'people', 'assign-seller'), keywords: 'assign seller admin hr manager reporting' },
    { label: 'Teachers & courses', hint: 'Put teachers on courses', href: actionHref(SA, 'classes', 'teachers'), keywords: 'teacher cohort course assign' },
    { label: 'Course eligibility', hint: 'Which tracks and levels each teacher may teach', href: actionHref(SA, 'classes', 'eligibility'), keywords: 'eligibility teacher track level training' },
    { label: 'Adjust a student’s credits', hint: 'Add or deduct, with a reason', href: sectionHref(SA, 'credit-adjust'), keywords: 'credits adjust add deduct balance' },
    { label: 'Earnings & sales report', hint: 'Teacher earnings and seller sales by month', href: actionHref(SA, 'finance', 'earnings'), keywords: 'earnings sales report month teacher seller' },
    { label: 'Trial playbooks', hint: 'The plan teachers follow for every kind of trial', href: '/dashboard/teacher/trial-playbook', keywords: 'trial playbook lesson plan demo class activity' },
    { label: 'Parent access', hint: 'Link parents to children', href: '/dashboard/super-admin/parents', keywords: 'parent access link child' },
    { label: 'Teacher tiers & pay', hint: 'Rates and tier rules', href: '/dashboard/super-admin/teacher-pay', keywords: 'teacher pay tier rate salary' },
  ],
  admin: [
    { label: 'Issue a certificate', hint: 'Find a student and issue or print a certificate', href: sectionHref(AD, 'certificates'), keywords: 'certificate issue print course complete' },
    { label: 'Approve enrolments', hint: 'Families waiting to start', href: sectionHref(AD, 'purchase-intents'), keywords: 'approve enrolment enrollment pending purchase' },
    { label: 'Create a course', hint: 'Coding, school subject or focus course', href: actionHref(AD, 'classes', 'new-course'), keywords: 'new course create cohort' },
    { label: 'Schedule a batch', hint: 'Teacher, days and times — classes are generated', href: actionHref(AD, 'classes', 'schedule-batch'), keywords: 'schedule batch teacher assign cohort timetable' },
    { label: 'Change a batch schedule', hint: 'New days and times, a start date or a break', href: actionHref(AD, 'classes', 'change-schedule'), keywords: 'reschedule batch days times break holiday' },
    { label: 'Manage batches', hint: 'Roster, teacher changes and removals', href: actionHref(AD, 'classes', 'manage-batches'), keywords: 'batch manage roster reassign remove teacher' },
    { label: 'Decide past classes', hint: 'Mark whether classes happened', href: sectionHref(AD, 'decisions'), keywords: 'unresolved class happened no show attendance decide' },
    { label: 'Book a trial class', hint: 'Into a teacher’s open hours', href: actionHref(AD, 'classes', 'book-trial'), keywords: 'book trial free class demo' },
    { label: 'Enrol a student by hand', hint: 'For a payment taken outside the site', href: actionHref(AD, 'people', 'manual-enroll'), keywords: 'manual enrol enroll student add' },
    { label: 'Manage users', hint: 'Find a user and change their role', href: actionHref(AD, 'people', 'users'), keywords: 'users roles' },
    { label: 'Teachers & courses', hint: 'Put teachers on courses', href: actionHref(AD, 'people', 'teachers'), keywords: 'teacher cohort course assign' },
    { label: 'Course eligibility', hint: 'Which tracks and levels each teacher may teach', href: actionHref(AD, 'people', 'eligibility'), keywords: 'eligibility teacher track level' },
    { label: 'Monitor a class', hint: 'Observe and score a teacher', href: sectionHref(AD, 'monitoring'), keywords: 'monitoring observe class quality score' },
    { label: 'Export data', hint: 'Users, enrolments and revenue as CSV', href: sectionHref(AD, 'revenue'), keywords: 'export csv download users enrolments revenue' },
    { label: 'Trial playbooks', hint: 'The plan teachers follow for every kind of trial', href: '/dashboard/teacher/trial-playbook', keywords: 'trial playbook lesson plan demo class activity' },
    { label: 'Lesson pages', hint: 'Write and edit lesson content', href: '/dashboard/admin/lessons', keywords: 'lesson pages content edit' },
    { label: 'Support inbox', hint: 'Help requests from families', href: '/dashboard/admin/support', keywords: 'support inbox help ticket' },
  ],
  hr: [
    { label: 'Generate an invoice', hint: 'Branded tax invoice', href: `${HR}?tab=invoices`, keywords: 'invoice generate bill gst' },
    { label: 'Record a sale', hint: 'Punch a sale against its invoice', href: `${HR}?tab=sales`, keywords: 'sale record punch refund ledger' },
    { label: 'Issue a certificate', hint: 'Find a student and issue or print a certificate', href: `${HR}?tab=certificates`, keywords: 'certificate issue print course complete' },
    { label: 'Credit requests', hint: 'Approve or reject', href: `${HR}?tab=credit_requests`, keywords: 'credit request approve reject' },
    { label: 'Teacher payments & leave', hint: 'Settle payouts, review leave', href: `${HR}?tab=payments`, keywords: 'payout settle pay leave teacher' },
    { label: 'Incentives', hint: 'Approve incentive requests', href: `${HR}?tab=incentives`, keywords: 'incentive bonus approve' },
    { label: 'Credits & tiers', hint: 'Adjust credits, set teacher tiers', href: `${HR}?tab=credits`, keywords: 'credits adjust tier teacher rate' },
    { label: 'My teachers', hint: 'Roster and catch-up compliance', href: `${HR}?tab=my_teachers`, keywords: 'teachers roster catch up compliance' },
    { label: 'Expenses', hint: 'Record what was spent', href: `${HR}?tab=expenses`, keywords: 'expense spend record' },
    { label: 'Doubt sessions', hint: 'Extra help sessions', href: '/dashboard/hr/doubt-sessions', keywords: 'doubt session help' },
    { label: 'Trial playbooks', hint: 'The plan teachers follow for every kind of trial', href: '/dashboard/teacher/trial-playbook', keywords: 'trial playbook lesson plan demo class activity' },
  ],
};

export interface Place {
  href: string;
  label: string;
  hint?: string;
  keywords?: string;
}

export function staffCommands(
  role: StaffRole,
  attention: readonly AttentionItem[],
  nav: readonly Place[],
  sections: readonly Place[] = []
): Command[] {
  const needs: Command[] = attention.map((a) => ({
    id: `needs:${a.key}`,
    group: 'Needs you',
    label: a.title,
    hint: a.why,
    href: a.href,
    keywords: a.keywords,
    badge: a.count,
    accent: a.accent,
  }));

  const actions: Command[] = ACTIONS[role].map((a) => ({
    id: `do:${a.label}`,
    group: 'Do',
    label: a.label,
    hint: a.hint,
    href: a.href,
    keywords: a.keywords,
  }));

  // The sidebar first (workspaces and pages), then every section inside them.
  const seen = new Set([...needs, ...actions].map((c) => c.href));
  const goTo: Command[] = [];
  for (const p of [...nav, ...sections]) {
    if (seen.has(p.href)) continue;
    seen.add(p.href);
    goTo.push({ id: `go:${p.href}`, group: 'Go to', label: p.label, hint: p.hint, href: p.href, keywords: p.keywords ?? p.label.toLowerCase() });
  }

  return [...needs, ...actions, ...goTo];
}

const GROUP_ORDER: Record<CommandGroup, number> = { 'Needs you': 0, Do: 1, 'Go to': 2 };

/**
 * Every word typed must appear somewhere in the label, hint or keywords.
 * Ranked: label starts with the query, then a word in the label does, then any
 * match — and within that, the group order, so "Needs you" stays on top.
 */
export function searchCommands(commands: readonly Command[], query: string): Command[] {
  const q = query.trim().toLowerCase();
  if (!q) return [...commands];
  const words = q.split(/\s+/);

  const scored = commands
    .map((c, index) => {
      const label = c.label.toLowerCase();
      const hay = `${label} ${(c.hint ?? '').toLowerCase()} ${c.keywords.toLowerCase()}`;
      if (!words.every((w) => hay.includes(w))) return null;
      const score = label.startsWith(q) ? 0 : label.split(/\s+/).some((w) => w.startsWith(words[0])) ? 1 : 2;
      return { c, score, index };
    })
    .filter((x): x is { c: Command; score: number; index: number } => x !== null);

  scored.sort((a, b) => a.score - b.score || GROUP_ORDER[a.c.group] - GROUP_ORDER[b.c.group] || a.index - b.index);
  return scored.map((s) => s.c);
}

/**
 * Where a command goes, given the page the reader is on.
 *   same page + '?tab=x'     switch tab
 *   same page + '?do=x'      open the dialog
 *   same page + '#section'   scroll to it
 *   anything else            navigate — the page finishes the job on arrival
 *
 * An href with no path ('#x', '?tab=x') is always this page.
 */
export type CommandTarget =
  | { kind: 'scroll'; id: string }
  | { kind: 'tab'; tab: string }
  | { kind: 'do'; action: string }
  | { kind: 'navigate'; href: string };

const trimPath = (p: string) => (p.length > 1 ? p.replace(/\/+$/, '') : p);

export function targetOf(href: string, here?: string): CommandTarget {
  const m = /^([^?#]*)(?:\?([^#]*))?(?:#(.*))?$/.exec(href);
  if (!m) return { kind: 'navigate', href };
  const [, path, query = '', hash = ''] = m;
  const samePage = path === '' || (here !== undefined && trimPath(path) === trimPath(here.split(/[?#]/)[0]));
  if (!samePage) return { kind: 'navigate', href };

  const params = new URLSearchParams(query);
  const tab = params.get('tab');
  if (tab && /^[a-z_]+$/.test(tab)) return { kind: 'tab', tab };
  const action = params.get('do');
  if (action && /^[a-z-]+$/.test(action)) return { kind: 'do', action };
  if (hash) return { kind: 'scroll', id: hash };
  return { kind: 'navigate', href };
}
