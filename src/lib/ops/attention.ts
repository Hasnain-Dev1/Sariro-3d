/**
 * SARIRO — what is waiting on a member of staff
 * ============================================================================
 * The staff dashboards hold about thirty panels between them, stacked down
 * pages two thousand lines long. Each panel knows whether it needs somebody —
 * three classes with no decision, an invoice billed and not booked, a credit
 * request nobody has answered — and not one of them could say so from the top
 * of the page. A super admin had to scroll the whole thing to find out whether
 * anything was on fire.
 *
 * This is the one list of those things: what each is called, why it matters,
 * how urgent it is, who can act on it, and where they go to do it. The counts
 * come from the SAME fetchers the panels use (see components/ops/attention-
 * provider.tsx), so the queue at the top can never disagree with the panel it
 * points at.
 *
 * Pure — no fetching here — so the ranking is tested.
 */

export type StaffRole = 'super_admin' | 'admin' | 'hr';

export type AttentionKey =
  | 'unresolved_classes'
  | 'catchup_overdue'
  | 'approvals'
  | 'unassigned_batches'
  | 'unrecorded_invoices'
  | 'credit_requests'
  | 'expenses_pending'
  | 'policy_flags'
  | 'trial_grades'
  | 'low_credits'
  | 'leave_requests'
  | 'incentive_requests'
  | 'unsettled_payouts';

/**
 * urgent  money, pay or a class already affected — act today
 * today   somebody is waiting on a person
 * watch   not broken yet, heading that way
 */
export type Severity = 'urgent' | 'today' | 'watch';

export type AttentionIcon =
  | 'calendar-x' | 'calendar-clock' | 'user-check' | 'users' | 'receipt'
  | 'coins' | 'wallet' | 'shield' | 'graduation' | 'battery' | 'plane' | 'award' | 'banknote';

export interface AttentionSpec {
  key: AttentionKey;
  /** "3 classes need a decision" — the count is part of the sentence. */
  title: (count: number) => string;
  /** One line: what goes wrong if nobody looks. */
  why: string;
  severity: Severity;
  icon: AttentionIcon;
  accent: string;
  /** Where each role goes to deal with it. A role absent here never sees the item. */
  href: Partial<Record<StaffRole, string>>;
  /** Words the command bar matches on. */
  keywords: string;
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export const ATTENTION: Record<AttentionKey, AttentionSpec> = {
  unresolved_classes: {
    key: 'unresolved_classes',
    title: (n) => `${plural(n, 'class needs', 'classes need')} a decision`,
    why: 'Until someone says whether it happened, credits, teacher pay and attendance all stay wrong.',
    severity: 'urgent',
    icon: 'calendar-x',
    accent: '#DC2626',
    href: { super_admin: '#decisions', admin: '#decisions' },
    keywords: 'unresolved classes decision happened no show attendance',
  },
  catchup_overdue: {
    key: 'catchup_overdue',
    title: (n) => `${plural(n, 'catch-up is', 'catch-ups are')} overdue`,
    why: 'A student missed a class and the make-up session was never arranged in time.',
    severity: 'urgent',
    icon: 'calendar-clock',
    accent: '#EA580C',
    href: { super_admin: '#catchup-overdue', admin: '#catchup-overdue', hr: '?tab=my_teachers' },
    keywords: 'catch up catchup overdue make up session teacher',
  },
  unrecorded_invoices: {
    key: 'unrecorded_invoices',
    title: (n) => `${plural(n, 'invoice is', 'invoices are')} not in the books`,
    why: 'Billed more than a day ago with no sale recorded — money nobody is counting.',
    severity: 'urgent',
    icon: 'receipt',
    accent: '#B45309',
    href: { super_admin: '#unrecorded-invoices', hr: '?tab=sales' },
    keywords: 'invoice unrecorded sale ledger books reconcile',
  },
  approvals: {
    key: 'approvals',
    title: (n) => `${plural(n, 'enrolment is', 'enrolments are')} waiting for approval`,
    why: 'A family has paid or asked to join and nothing starts until someone approves it.',
    severity: 'today',
    icon: 'user-check',
    accent: '#2563EB',
    href: { admin: '#purchase-intents' },
    keywords: 'approve enrolment enrollment purchase intent pending',
  },
  unassigned_batches: {
    key: 'unassigned_batches',
    title: (n) => `${plural(n, 'batch has', 'batches have')} no teacher`,
    why: 'A batch with no teacher cannot run, and nothing else will flag it before class time.',
    severity: 'today',
    icon: 'users',
    accent: '#7C3AED',
    href: { admin: '#batch-tools' },
    keywords: 'batch cohort no teacher schedule assign',
  },
  credit_requests: {
    key: 'credit_requests',
    title: (n) => `${plural(n, 'credit request is', 'credit requests are')} waiting`,
    why: 'Credits do not move until somebody approves or rejects the request.',
    severity: 'today',
    icon: 'coins',
    accent: '#CA8A04',
    href: { super_admin: '#credit-requests', hr: '?tab=credit_requests' },
    keywords: 'credit request approve reject top up',
  },
  expenses_pending: {
    key: 'expenses_pending',
    title: (n) => `${plural(n, 'expense needs', 'expenses need')} sign-off`,
    why: 'Recorded by HR and not yet approved, so the month’s spend is not final.',
    severity: 'today',
    icon: 'wallet',
    accent: '#0891B2',
    href: { super_admin: '#expenses' },
    keywords: 'expense approve sign off spend',
  },
  policy_flags: {
    key: 'policy_flags',
    title: (n) => `${plural(n, 'chat flag', 'chat flags')} to review`,
    why: 'Someone tried to share contact details — the way students quietly leave with a teacher.',
    severity: 'today',
    icon: 'shield',
    accent: '#BE185D',
    href: { super_admin: '#chat-policy', admin: '#chat-policy', hr: '?tab=policy' },
    keywords: 'chat policy flag contact details phone review',
  },
  trial_grades: {
    key: 'trial_grades',
    title: (n) => `${plural(n, 'trial seat has', 'trial seats have')} no grade`,
    why: 'Without a grade the teacher match and the sales follow-up are both guesses.',
    severity: 'watch',
    icon: 'graduation',
    accent: '#4F46E5',
    href: { super_admin: '#trial-grades' },
    keywords: 'trial grade seat missing',
  },
  low_credits: {
    key: 'low_credits',
    title: (n) => `${plural(n, 'student is', 'students are')} low on credits`,
    why: 'Running out is when families stop — the one churn moment the system can see coming.',
    severity: 'watch',
    icon: 'battery',
    accent: '#16A34A',
    href: { super_admin: '#low-credits', hr: '?tab=credits' },
    keywords: 'low credits running out renew churn top up',
  },
  leave_requests: {
    key: 'leave_requests',
    title: (n) => `${plural(n, 'leave request', 'leave requests')} to review`,
    why: 'A teacher is waiting to know whether their classes need covering.',
    severity: 'today',
    icon: 'plane',
    accent: '#0EA5E9',
    href: { hr: '?tab=payments' },
    keywords: 'leave request teacher holiday absence cover',
  },
  incentive_requests: {
    key: 'incentive_requests',
    title: (n) => `${plural(n, 'incentive request', 'incentive requests')} to approve`,
    why: 'Earned and asked for — an unanswered incentive is the fastest way to lose a good teacher.',
    severity: 'today',
    icon: 'award',
    accent: '#9333EA',
    href: { hr: '?tab=incentives' },
    keywords: 'incentive request approve bonus teacher',
  },
  unsettled_payouts: {
    key: 'unsettled_payouts',
    title: (n) => `${plural(n, 'teacher payout is', 'teacher payouts are')} unsettled`,
    why: 'Classes taught and not yet paid. Pay day is where trust with teachers is won or lost.',
    severity: 'watch',
    icon: 'banknote',
    accent: '#059669',
    href: { hr: '?tab=payments' },
    keywords: 'payout settle teacher earnings pay',
  },
};

/** The short name of each queue, for sentences like "could not check X". */
export const ATTENTION_SHORT: Record<AttentionKey, string> = {
  unresolved_classes: 'class decisions',
  catchup_overdue: 'catch-ups',
  unrecorded_invoices: 'invoices',
  approvals: 'approvals',
  unassigned_batches: 'batches',
  credit_requests: 'credit requests',
  expenses_pending: 'expenses',
  policy_flags: 'chat flags',
  trial_grades: 'trial grades',
  low_credits: 'low credits',
  leave_requests: 'leave requests',
  incentive_requests: 'incentives',
  unsettled_payouts: 'payouts',
};

const SEVERITY_RANK: Record<Severity, number> = { urgent: 0, today: 1, watch: 2 };

/** The sources a role is shown, in a stable order. */
export function sourcesFor(role: StaffRole): AttentionKey[] {
  return (Object.keys(ATTENTION) as AttentionKey[]).filter((k) => ATTENTION[k].href[role] !== undefined);
}

export interface AttentionItem {
  key: AttentionKey;
  title: string;
  why: string;
  severity: Severity;
  icon: AttentionIcon;
  accent: string;
  href: string;
  count: number;
  keywords: string;
}

export interface AttentionSummary {
  /** Only what has something waiting, most urgent first. */
  items: AttentionItem[];
  total: number;
  bySeverity: Record<Severity, number>;
  /** Sources that could not be counted — shown, never silently treated as zero. */
  failed: AttentionKey[];
  /** Every source answered and none has anything waiting. */
  allClear: boolean;
  /** Some sources are still loading. */
  pending: boolean;
}

/**
 * `counts` holds a number for each source that answered, `null` for one that
 * failed, and nothing for one still loading.
 */
export function summariseAttention(
  role: StaffRole,
  counts: Partial<Record<AttentionKey, number | null>>
): AttentionSummary {
  const keys = sourcesFor(role);
  const items: AttentionItem[] = [];
  const failed: AttentionKey[] = [];
  let pending = false;

  for (const key of keys) {
    if (!(key in counts)) { pending = true; continue; }
    const count = counts[key];
    if (count === null || count === undefined) { failed.push(key); continue; }
    if (count <= 0) continue;
    const spec = ATTENTION[key];
    items.push({
      key,
      title: spec.title(count),
      why: spec.why,
      severity: spec.severity,
      icon: spec.icon,
      accent: spec.accent,
      href: spec.href[role]!,
      count,
      keywords: spec.keywords,
    });
  }

  items.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || b.count - a.count);

  const bySeverity: Record<Severity, number> = { urgent: 0, today: 0, watch: 0 };
  for (const i of items) bySeverity[i.severity] += i.count;

  return {
    items,
    total: items.reduce((n, i) => n + i.count, 0),
    bySeverity,
    failed,
    allClear: !pending && failed.length === 0 && items.length === 0,
    pending,
  };
}

/** "Good morning" in the reader's own day. */
export function greetingFor(hour: number): string {
  if (hour < 5) return 'Working late';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
