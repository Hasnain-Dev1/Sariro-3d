/**
 * SARIRO — what is waiting on somebody
 * ============================================================================
 * Every dashboard holds panels that know whether they need somebody — three
 * classes with no decision, a trial nobody has written up, a follow-up call a
 * day late, a speaking quest not yet done — and not one of them could say so
 * from the top of the page. A super admin scrolled thirty panels to find out
 * whether anything was on fire; a teacher found out their pay was held by
 * scrolling past it.
 *
 * This is the one list of those things: what each is called, why it matters,
 * how urgent it is, who can act on it, and where they go to do it. The counts
 * come from the SAME fetchers the panels use (see components/ops/attention-
 * provider.tsx), so the queue at the top can never disagree with the panel it
 * points at.
 *
 * Pure — no fetching here — so the ranking is tested.
 */

import { actionHref, sectionHref } from './workspaces';

/** Every role with a Today queue. */
export type QueueRole = 'super_admin' | 'admin' | 'hr' | 'teacher' | 'seller' | 'student';

const SA = 'super_admin' as const;
const AD = 'admin' as const;
const TE = 'teacher' as const;
const SE = 'seller' as const;
const ST = 'student' as const;
const HRR = 'hr' as const;

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
  | 'unsettled_payouts'
  // teacher
  | 'registers_to_mark'
  | 'trial_writeups'
  | 'rooms_missing'
  | 'catchups_to_arrange'
  | 'projects_to_review'
  | 'trials_soon'
  // seller
  | 'followups_overdue'
  | 'trials_missed'
  | 'slots_needed'
  | 'final_calls'
  | 'followups_today'
  // student
  | 'classes_paused'
  | 'class_today'
  | 'speaking_missions'
  | 'plan_low';

/**
 * urgent  money, pay or a class already affected — act today
 * today   somebody is waiting on a person
 * watch   not broken yet, heading that way
 */
export type Severity = 'urgent' | 'today' | 'watch';

export type AttentionIcon =
  | 'calendar-x' | 'calendar-clock' | 'user-check' | 'users' | 'receipt'
  | 'coins' | 'wallet' | 'shield' | 'graduation' | 'battery' | 'plane' | 'award' | 'banknote'
  | 'clipboard' | 'pen' | 'link' | 'folder' | 'compass' | 'phone' | 'phone-missed' | 'handshake'
  | 'pause' | 'video' | 'mic';

export interface AttentionSpec {
  key: AttentionKey;
  /** "3 classes need a decision" — the count is part of the sentence. */
  title: (count: number) => string;
  /** One line: what goes wrong if nobody looks. */
  why: string;
  severity: Severity;
  icon: AttentionIcon;
  accent: string;
  /** Where each role goes to deal with it — a full address, so it works from any
      page. A role absent here never sees the item. */
  href: Partial<Record<QueueRole, string>>;
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
    href: { super_admin: sectionHref(SA, 'decisions'), admin: sectionHref(AD, 'decisions') },
    keywords: 'unresolved classes decision happened no show attendance',
  },
  catchup_overdue: {
    key: 'catchup_overdue',
    title: (n) => `${plural(n, 'catch-up is', 'catch-ups are')} overdue`,
    why: 'A student missed a class and the make-up session was never arranged in time.',
    severity: 'urgent',
    icon: 'calendar-clock',
    accent: '#EA580C',
    href: { super_admin: sectionHref(SA, 'catchup-overdue'), admin: sectionHref(AD, 'catchup-overdue'), hr: sectionHref(HRR, 'catchup-compliance') },
    keywords: 'catch up catchup overdue make up session teacher',
  },
  unrecorded_invoices: {
    key: 'unrecorded_invoices',
    title: (n) => `${plural(n, 'invoice is', 'invoices are')} not in the books`,
    why: 'Billed more than a day ago with no sale recorded — money nobody is counting.',
    severity: 'urgent',
    icon: 'receipt',
    accent: '#B45309',
    href: { super_admin: sectionHref(SA, 'unrecorded-invoices'), hr: sectionHref(HRR, 'unrecorded-invoices') },
    keywords: 'invoice unrecorded sale ledger books reconcile',
  },
  approvals: {
    key: 'approvals',
    title: (n) => `${plural(n, 'enrolment is', 'enrolments are')} waiting for approval`,
    why: 'A family has paid or asked to join and nothing starts until someone approves it.',
    severity: 'today',
    icon: 'user-check',
    accent: '#2563EB',
    href: { admin: sectionHref(AD, 'purchase-intents') },
    keywords: 'approve enrolment enrollment purchase intent pending',
  },
  unassigned_batches: {
    key: 'unassigned_batches',
    title: (n) => `${plural(n, 'batch has', 'batches have')} no teacher`,
    why: 'A batch with no teacher cannot run, and nothing else will flag it before class time.',
    severity: 'today',
    icon: 'users',
    accent: '#7C3AED',
    /* A batch with no teacher is a batch never scheduled — scheduling attaches
       the teacher — so this opens Schedule a batch rather than a list. */
    href: { admin: actionHref(AD, 'classes', 'schedule-batch') },
    keywords: 'batch cohort no teacher schedule assign',
  },
  credit_requests: {
    key: 'credit_requests',
    title: (n) => `${plural(n, 'credit request is', 'credit requests are')} waiting`,
    why: 'Credits do not move until somebody approves or rejects the request.',
    severity: 'today',
    icon: 'coins',
    accent: '#CA8A04',
    href: { super_admin: sectionHref(SA, 'credit-requests'), hr: sectionHref(HRR, 'credit-requests') },
    keywords: 'credit request approve reject top up',
  },
  expenses_pending: {
    key: 'expenses_pending',
    title: (n) => `${plural(n, 'expense needs', 'expenses need')} sign-off`,
    why: 'Recorded by HR and not yet approved, so the month’s spend is not final.',
    severity: 'today',
    icon: 'wallet',
    accent: '#0891B2',
    href: { super_admin: sectionHref(SA, 'expenses') },
    keywords: 'expense approve sign off spend',
  },
  policy_flags: {
    key: 'policy_flags',
    title: (n) => `${plural(n, 'chat flag', 'chat flags')} to review`,
    why: 'Someone tried to share contact details — the way students quietly leave with a teacher.',
    severity: 'today',
    icon: 'shield',
    accent: '#BE185D',
    href: { super_admin: sectionHref(SA, 'chat-policy'), admin: sectionHref(AD, 'chat-policy'), hr: sectionHref(HRR, 'chat-policy') },
    keywords: 'chat policy flag contact details phone review',
  },
  trial_grades: {
    key: 'trial_grades',
    title: (n) => `${plural(n, 'trial seat has', 'trial seats have')} no grade`,
    why: 'Without a grade the teacher match and the sales follow-up are both guesses.',
    severity: 'watch',
    icon: 'graduation',
    accent: '#4F46E5',
    href: { super_admin: sectionHref(SA, 'trial-grades') },
    keywords: 'trial grade seat missing',
  },
  low_credits: {
    key: 'low_credits',
    title: (n) => `${plural(n, 'student is', 'students are')} low on credits`,
    why: 'Running out is when families stop — the one churn moment the system can see coming.',
    severity: 'watch',
    icon: 'battery',
    accent: '#16A34A',
    /* A teacher sees the students in their own batches (the route scopes it),
       because they are the one placed to mention it in class. */
    href: { super_admin: sectionHref(SA, 'low-credits'), hr: sectionHref(HRR, 'low-credits'), teacher: sectionHref(TE, 'low-credits') },
    keywords: 'low credits running out renew churn top up',
  },
  leave_requests: {
    key: 'leave_requests',
    title: (n) => `${plural(n, 'leave request', 'leave requests')} to review`,
    why: 'A teacher is waiting to know whether their classes need covering.',
    severity: 'today',
    icon: 'plane',
    accent: '#0EA5E9',
    href: { hr: sectionHref(HRR, 'leave') },
    keywords: 'leave request teacher holiday absence cover',
  },
  incentive_requests: {
    key: 'incentive_requests',
    title: (n) => `${plural(n, 'incentive request', 'incentive requests')} to approve`,
    why: 'Earned and asked for — an unanswered incentive is the fastest way to lose a good teacher.',
    severity: 'today',
    icon: 'award',
    accent: '#9333EA',
    href: { hr: sectionHref(HRR, 'incentives') },
    keywords: 'incentive request approve bonus teacher',
  },
  unsettled_payouts: {
    key: 'unsettled_payouts',
    title: (n) => `${plural(n, 'teacher payout is', 'teacher payouts are')} unsettled`,
    why: 'Classes taught and not yet paid. Pay day is where trust with teachers is won or lost.',
    severity: 'watch',
    icon: 'banknote',
    accent: '#059669',
    href: { hr: sectionHref(HRR, 'settlements') },
    keywords: 'payout settle teacher earnings pay',
  },

  /* ── Teacher ──────────────────────────────────────────────────────────── */

  registers_to_mark: {
    key: 'registers_to_mark',
    title: (n) => `${plural(n, 'register is', 'registers are')} still open`,
    why: 'Until you mark who came, credits are not used, your pay is not created and the lesson does not move on.',
    severity: 'urgent',
    icon: 'clipboard',
    accent: '#D97706',
    href: { teacher: sectionHref(TE, 'registers') },
    keywords: 'attendance register mark present absent penalty deadline class',
  },
  trial_writeups: {
    key: 'trial_writeups',
    title: (n) => `${plural(n, 'trial needs', 'trials need')} a write-up`,
    why: 'Your pay for the trial is held until you rate it — and the sales team rings the family off what you write.',
    severity: 'urgent',
    icon: 'pen',
    accent: '#B45309',
    href: { teacher: sectionHref(TE, 'write-ups') },
    keywords: 'trial write up feedback rating pay held release',
  },
  rooms_missing: {
    key: 'rooms_missing',
    title: (n) => `${plural(n, 'class has', 'classes have')} no join link`,
    why: 'The children booked in with you have no button to press until your class room is saved.',
    severity: 'urgent',
    icon: 'link',
    accent: '#DC2626',
    href: { teacher: '/settings' },
    keywords: 'meet link room zoom join button settings',
  },
  catchups_to_arrange: {
    key: 'catchups_to_arrange',
    title: (n) => `${plural(n, 'catch-up lesson needs', 'catch-up lessons need')} a time`,
    why: 'Each missed lesson has its own deadline, and only you can put it in the diary.',
    severity: 'today',
    icon: 'calendar-clock',
    accent: '#2563EB',
    href: { teacher: sectionHref(TE, 'catchup') },
    keywords: 'catch up catchup make up missed lesson deadline schedule',
  },
  projects_to_review: {
    key: 'projects_to_review',
    title: (n) => `${plural(n, 'project is', 'projects are')} waiting for your review`,
    why: 'A child who hears back on their work in a day tries harder on the next one.',
    severity: 'today',
    icon: 'folder',
    accent: '#7C3AED',
    href: { teacher: sectionHref(TE, 'reviews') },
    keywords: 'project submission review feedback homework',
  },
  trials_soon: {
    key: 'trials_soon',
    title: (n) => `${plural(n, 'trial class is', 'trial classes are')} in the next 24 hours`,
    why: 'Open the playbook and read what the family told us — the half hour that decides whether they stay.',
    severity: 'today',
    icon: 'compass',
    accent: '#0891B2',
    href: { teacher: sectionHref(TE, 'trials') },
    keywords: 'trial playbook prepare family answers demo',
  },

  /* ── Seller ───────────────────────────────────────────────────────────── */

  followups_overdue: {
    key: 'followups_overdue',
    title: (n) => `${plural(n, 'follow-up is', 'follow-ups are')} overdue`,
    why: 'You promised a family a call and the day has passed. Every day late makes the yes less likely.',
    severity: 'urgent',
    icon: 'phone-missed',
    accent: '#DC2626',
    href: { seller: sectionHref(SE, 'queues') },
    keywords: 'overdue follow up reminder call late',
  },
  trials_missed: {
    key: 'trials_missed',
    title: (n) => `${plural(n, 'family missed', 'families missed')} their trial`,
    why: 'They booked and did not make it. Rebook while they still remember why they wanted it.',
    severity: 'urgent',
    icon: 'calendar-x',
    accent: '#E11D48',
    href: { seller: sectionHref(SE, 'queues') },
    keywords: 'missed trial rebook no show',
  },
  slots_needed: {
    key: 'slots_needed',
    title: (n) => `${plural(n, 'family needs', 'families need')} help finding a time`,
    why: 'They asked for a slot that suits them, and nothing happens until somebody rings.',
    severity: 'today',
    icon: 'calendar-clock',
    accent: '#D97706',
    href: { seller: sectionHref(SE, 'queues') },
    keywords: 'slot assistance time book trial help',
  },
  final_calls: {
    key: 'final_calls',
    title: (n) => `${plural(n, 'family is', 'families are')} ready for the final conversation`,
    why: 'The trial is done and the write-ups are in — this is the call that closes the sale.',
    severity: 'today',
    icon: 'handshake',
    accent: '#EA580C',
    href: { seller: sectionHref(SE, 'queues') },
    keywords: 'final conversation close sale trial done',
  },
  followups_today: {
    key: 'followups_today',
    title: (n) => `${plural(n, 'follow-up is', 'follow-ups are')} due today`,
    why: 'The calls you set a reminder for today.',
    severity: 'today',
    icon: 'phone',
    accent: '#0891B2',
    href: { seller: sectionHref(SE, 'queues') },
    keywords: 'follow up today reminder call',
  },

  /* ── Student ──────────────────────────────────────────────────────────── */

  classes_paused: {
    key: 'classes_paused',
    title: (n) => `${plural(n, 'course is', 'courses are')} paused`,
    why: 'Your credits ran out, so classes stopped. Add credits and they start again where they left off.',
    severity: 'urgent',
    icon: 'pause',
    accent: '#DC2626',
    href: { student: sectionHref(ST, 'balance') },
    keywords: 'paused credits run out top up renew',
  },
  class_today: {
    key: 'class_today',
    title: (n) => `${plural(n, 'class', 'classes')} today`,
    why: 'The join button opens 15 minutes before — be there when your teacher arrives.',
    severity: 'today',
    icon: 'video',
    accent: '#16A34A',
    href: { student: sectionHref(ST, 'next-class') },
    keywords: 'class today join time',
  },
  speaking_missions: {
    key: 'speaking_missions',
    title: (n) => `${plural(n, 'speaking mission is', 'speaking missions are')} waiting`,
    why: 'A few minutes a day turns one class a week into a habit — and keeps your streak going.',
    severity: 'today',
    icon: 'mic',
    accent: '#7C3AED',
    href: { student: '/dashboard/student/practice' },
    keywords: 'speaking practice quest homework mission streak',
  },
  plan_low: {
    key: 'plan_low',
    title: (n) => `${plural(n, 'class is', 'classes are')} left on your plan`,
    why: 'Top up before the last one so nothing pauses.',
    severity: 'watch',
    icon: 'battery',
    accent: '#16A34A',
    href: { student: sectionHref(ST, 'balance') },
    keywords: 'credits left low top up renew',
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
  registers_to_mark: 'registers',
  trial_writeups: 'trial write-ups',
  rooms_missing: 'join links',
  catchups_to_arrange: 'catch-ups',
  projects_to_review: 'projects',
  trials_soon: 'trials',
  followups_overdue: 'overdue follow-ups',
  trials_missed: 'missed trials',
  slots_needed: 'slot requests',
  final_calls: 'final conversations',
  followups_today: 'today’s follow-ups',
  classes_paused: 'your plan',
  class_today: 'today’s classes',
  speaking_missions: 'speaking practice',
  plan_low: 'your credits',
};

/**
 * How the queue speaks to each role. A staff member is told what "needs" them;
 * a seven-year-old is told what there is to do, and nothing on their screen is
 * labelled Urgent.
 */
export interface QueueCopy {
  checking: string;
  nothing: string;
  headline: (total: number) => string;
  allClear: string;
  severity: Record<Severity, string>;
  cta: string;
  /** The masthead: dark for work, bright for a learner. */
  tone: 'work' | 'learner';
}

const STAFF_SEVERITY: Record<Severity, string> = { urgent: 'Urgent', today: 'Today', watch: 'Watch' };
const needsYou = (n: number) => `${n} ${n === 1 ? 'thing needs' : 'things need'} you`;

export const QUEUE_COPY: Record<QueueRole, QueueCopy> = {
  super_admin: { checking: 'Checking what needs you…', nothing: 'Nothing is waiting on you.', headline: needsYou, allClear: 'Every queue is empty — classes decided, requests answered, invoices in the books.', severity: STAFF_SEVERITY, cta: 'Resolve', tone: 'work' },
  admin: { checking: 'Checking what needs you…', nothing: 'Nothing is waiting on you.', headline: needsYou, allClear: 'Every queue is empty — classes decided, enrolments approved, flags reviewed.', severity: STAFF_SEVERITY, cta: 'Resolve', tone: 'work' },
  hr: { checking: 'Checking what needs you…', nothing: 'Nothing is waiting on you.', headline: needsYou, allClear: 'Every queue is empty — requests answered, payouts settled, invoices in the books.', severity: STAFF_SEVERITY, cta: 'Resolve', tone: 'work' },
  teacher: { checking: 'Checking your classes…', nothing: 'Nothing is waiting on you.', headline: needsYou, allClear: 'Registers marked, trials written up, projects reviewed. Go and teach.', severity: STAFF_SEVERITY, cta: 'Open', tone: 'work' },
  seller: { checking: 'Checking your leads…', nothing: 'No call is late.', headline: (n) => `${n} ${n === 1 ? 'call' : 'calls'} to make`, allClear: 'Nobody is waiting on a call from you. A good day to ring the families in All leads.', severity: STAFF_SEVERITY, cta: 'Open', tone: 'work' },
  student: { checking: 'Getting your day ready…', nothing: 'You’re all set.', headline: (n) => `${n} ${n === 1 ? 'thing' : 'things'} to do today`, allClear: 'Nothing to do right now — see you in class!', severity: { urgent: 'Now', today: 'Today', watch: 'Soon' }, cta: 'Let’s go', tone: 'learner' },
};

const SEVERITY_RANK: Record<Severity, number> = { urgent: 0, today: 1, watch: 2 };

/** The sources a role is shown, in a stable order. */
export function sourcesFor(role: QueueRole): AttentionKey[] {
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
  role: QueueRole,
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
