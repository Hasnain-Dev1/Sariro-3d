import type { AttentionItem, StaffRole } from './attention';

/**
 * SARIRO — the command bar (⌘K / Ctrl+K)
 * ============================================================================
 * Everything a member of staff can reach, typed rather than scrolled for. The
 * admin page is 2,300 lines; finding "Issue a certificate" on it meant knowing
 * it was below the chat policy panel. Here it is three letters.
 *
 * Three kinds of command, in the order they are offered:
 *
 *   Needs you   the live attention items, with their counts — the command bar
 *               is also the fastest way to see what is waiting
 *   Do          the jobs each role actually does
 *   Go to       every page in the sidebar
 *
 * Pure: the component supplies the attention items and the sidebar, and this
 * decides what is offered and in what order. Tested, including the search.
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

/** The jobs, per role. Links are sections on the role's home or its own pages. */
const ACTIONS: Record<StaffRole, Action[]> = {
  super_admin: [
    { label: 'Issue a certificate', hint: 'Find a student and issue or print a certificate', href: '#certificates', keywords: 'certificate issue print course complete' },
    { label: 'Decide past classes', hint: 'Mark whether classes happened', href: '#decisions', keywords: 'unresolved class happened no show attendance decide' },
    { label: 'Approve expenses', hint: 'Sign off what HR recorded', href: '#expenses', keywords: 'expense approve spend' },
    { label: 'Sales & refunds', hint: 'The ledger, filters and reports', href: '#sales', keywords: 'sales refunds ledger revenue report gst renewal' },
    { label: 'Trial management', hint: 'Every trial with teacher, seller and feedback', href: '#trials', keywords: 'trial free class funnel seller teacher feedback' },
    { label: 'Credits running low', hint: 'Top up students before they stop', href: '#low-credits', keywords: 'credits low top up renew churn' },
    { label: 'Payment links & pricing', hint: 'Razorpay links by tier', href: '#pricing', keywords: 'pricing razorpay payment links' },
    { label: 'Audit logs', hint: 'Who changed what', href: '#audit', keywords: 'audit log history changes' },
    { label: 'Parent access', hint: 'Link parents to children', href: '/dashboard/super-admin/parents', keywords: 'parent access link child' },
    { label: 'Teacher tiers & pay', hint: 'Rates and tier rules', href: '/dashboard/super-admin/teacher-pay', keywords: 'teacher pay tier rate salary' },
  ],
  admin: [
    { label: 'Issue a certificate', hint: 'Find a student and issue or print a certificate', href: '#certificates', keywords: 'certificate issue print course complete' },
    { label: 'Approve enrolments', hint: 'Families waiting to start', href: '#purchase-intents', keywords: 'approve enrolment enrollment pending purchase' },
    { label: 'Schedule or change a batch', hint: 'Batch tools and teacher assignment', href: '#batch-tools', keywords: 'batch schedule change teacher assign cohort' },
    { label: 'Decide past classes', hint: 'Mark whether classes happened', href: '#decisions', keywords: 'unresolved class happened no show attendance decide' },
    { label: 'Courses', hint: 'Every course and its status', href: '#cohorts', keywords: 'course cohort status meet link' },
    { label: 'Book a trial class', hint: 'Manual trial booking', href: '#manual-trial', keywords: 'book trial free class manual' },
    { label: 'Class monitoring', hint: 'Observe and score classes', href: '#monitoring', keywords: 'monitoring observe class quality' },
    { label: 'Lesson pages', hint: 'Write and edit lesson content', href: '/dashboard/admin/lessons', keywords: 'lesson pages content edit' },
    { label: 'Support inbox', hint: 'Help requests from families', href: '/dashboard/admin/support', keywords: 'support inbox help ticket' },
  ],
  hr: [
    { label: 'Generate an invoice', hint: 'Branded tax invoice', href: '?tab=invoices', keywords: 'invoice generate bill gst' },
    { label: 'Record a sale', hint: 'Punch a sale against its invoice', href: '?tab=sales', keywords: 'sale record punch refund ledger' },
    { label: 'Issue a certificate', hint: 'Find a student and issue or print a certificate', href: '?tab=certificates', keywords: 'certificate issue print course complete' },
    { label: 'Credit requests', hint: 'Approve or reject', href: '?tab=credit_requests', keywords: 'credit request approve reject' },
    { label: 'Teacher payments & leave', hint: 'Settle payouts, review leave', href: '?tab=payments', keywords: 'payout settle pay leave teacher' },
    { label: 'Incentives', hint: 'Approve incentive requests', href: '?tab=incentives', keywords: 'incentive bonus approve' },
    { label: 'Credits & tiers', hint: 'Adjust credits, set teacher tiers', href: '?tab=credits', keywords: 'credits adjust tier teacher rate' },
    { label: 'My teachers', hint: 'Roster and catch-up compliance', href: '?tab=my_teachers', keywords: 'teachers roster catch up compliance' },
    { label: 'Expenses', hint: 'Record what was spent', href: '?tab=expenses', keywords: 'expense spend record' },
    { label: 'Doubt sessions', hint: 'Extra help sessions', href: '/dashboard/hr/doubt-sessions', keywords: 'doubt session help' },
  ],
};

export function staffCommands(
  role: StaffRole,
  attention: readonly AttentionItem[],
  nav: readonly { href: string; label: string }[]
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

  const seen = new Set([...needs, ...actions].map((c) => c.href));
  const goTo: Command[] = nav
    .filter((n) => !seen.has(n.href))
    .map((n) => ({ id: `go:${n.href}`, group: 'Go to', label: n.label, href: n.href, keywords: n.label.toLowerCase() }));

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
 * Where a command goes, given where the reader already is.
 *   '#section'  scroll on this page
 *   '?tab=x'    switch tab on this page
 *   '/path'     navigate
 */
export type CommandTarget =
  | { kind: 'scroll'; id: string }
  | { kind: 'tab'; tab: string }
  | { kind: 'navigate'; href: string };

export function targetOf(href: string): CommandTarget {
  if (href.startsWith('#')) return { kind: 'scroll', id: href.slice(1) };
  const tab = /^\?tab=([a-z_]+)$/.exec(href);
  if (tab) return { kind: 'tab', tab: tab[1] };
  return { kind: 'navigate', href };
}
