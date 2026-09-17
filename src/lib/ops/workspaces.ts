/**
 * SARIRO — workspaces
 * ============================================================================
 * Every dashboard was one page: thirty panels, two thousand lines, read top to
 * bottom. A super admin looking for last month's expenses scrolled past trial
 * grades, chat flags and lesson plans to reach them; a teacher looking for a
 * project to mark scrolled past their pay, their calendar and their monitoring
 * scores. And every panel on the page fetched its data on every visit.
 *
 * Now each role has workspaces — a teacher's Today, Classes, Students, Pay and
 * Growth; a student's Today, Classes, Progress, Credits and Explore; HR's
 * Today, Teachers, Pay, Students and Sales — and each
 * is its own address. This file is the one list of which section lives in
 * which workspace. Everything that points at a section reads it: the Today
 * queue's buttons, the sidebar, ⌘K, and the section component itself, which
 * renders only in the workspace named here. So a link can never point at a
 * section that is not on the page it opens — the bug the old "Needs you today"
 * box shipped with.
 *
 * Pure, and tested (workspaces.test.ts), including a check that every section
 * here is actually placed on its role's page.
 */

export type WorkspaceRole = 'super_admin' | 'admin' | 'hr' | 'teacher' | 'seller' | 'student';

export type WorkspaceKey =
  | 'today'
  // staff
  | 'classes' | 'people' | 'sales' | 'finance' | 'quality'
  // teacher
  | 'students' | 'pay' | 'growth'
  // hr
  | 'teachers'
  // seller
  | 'leads' | 'trials' | 'prices'
  // student
  | 'progress' | 'credits' | 'explore';

export type WorkspaceIcon =
  | 'today' | 'classes' | 'people' | 'sales' | 'finance' | 'quality'
  | 'wallet' | 'growth' | 'trials' | 'progress' | 'explore' | 'prices' | 'teachers';

export interface WorkspaceMeta {
  key: WorkspaceKey;
  label: string;
  /** One line under the title: what this workspace is for. */
  blurb: string;
  icon: WorkspaceIcon;
  accent: string;
}

const meta = (key: WorkspaceKey, label: string, icon: WorkspaceIcon, accent: string, blurb: string): WorkspaceMeta =>
  ({ key, label, icon, accent, blurb });

const STAFF_META: Partial<Record<WorkspaceKey, WorkspaceMeta>> = {
  today: meta('today', 'Today', 'today', '#0F172A', 'What is waiting on you, and how the system is doing.'),
  classes: meta('classes', 'Classes', 'classes', '#7C3AED', 'Classes, batches, trials and courses — everything that runs on the timetable.'),
  people: meta('people', 'People', 'people', '#2563EB', 'Students, families and teachers: enrolments, credits and certificates.'),
  sales: meta('sales', 'Sales', 'sales', '#0891B2', 'The funnel from first enquiry to paid seat.'),
  finance: meta('finance', 'Finance', 'finance', '#059669', 'Money in and out: invoices, the ledger, expenses and next month.'),
  quality: meta('quality', 'Quality', 'quality', '#BE185D', 'Keeping classes good and conversations on Sariro.'),
};

/* The same word means different work to different people — "Classes" to an
   admin is every batch on the timetable, to a teacher it is their own week —
   so each role names and describes its own workspaces. */
export const WORKSPACE_META: Record<WorkspaceRole, Partial<Record<WorkspaceKey, WorkspaceMeta>>> = {
  super_admin: STAFF_META,
  admin: STAFF_META,
  hr: {
    today: meta('today', 'Today', 'today', '#0F172A', 'What is waiting on you, and this month in four numbers.'),
    teachers: meta('teachers', 'Teachers', 'teachers', '#7C3AED', 'The teachers who report to you: leave, catch-ups, tiers and chat flags.'),
    pay: meta('pay', 'Pay', 'wallet', '#059669', 'Teacher payouts, incentives and earnings — and what was spent.'),
    students: meta('students', 'Students', 'people', '#2563EB', 'Credits, credit requests, certificates and what families have asked.'),
    sales: meta('sales', 'Sales', 'sales', '#0891B2', 'Sales to invoice, the invoices themselves, the books and the prices.'),
  },
  teacher: {
    today: meta('today', 'Today', 'today', '#0F172A', 'Your next class, and what is waiting on you.'),
    classes: meta('classes', 'Classes', 'classes', '#16A34A', 'Your timetable, the trials coming up, write-ups and the catch-ups you owe.'),
    students: meta('students', 'Students', 'people', '#2563EB', 'The children you teach: projects to review and who is running low on credits.'),
    pay: meta('pay', 'Pay', 'wallet', '#059669', 'What you have earned, what is on its way, and how to ask for leave or an incentive.'),
    growth: meta('growth', 'Growth', 'growth', '#9333EA', 'Your rating, the courses you are cleared for, and how your classes are observed.'),
  },
  seller: {
    today: meta('today', 'Today', 'today', '#0F172A', 'The calls that matter today.'),
    leads: meta('leads', 'Leads', 'sales', '#0891B2', 'Every family you are working with, in the order to ring them.'),
    trials: meta('trials', 'Trials', 'trials', '#7C3AED', 'Book a trial class and see which grades still have seats.'),
    prices: meta('prices', 'Prices', 'prices', '#B45309', 'What to quote for every plan, the offers you may make, and the lowest you can go.'),
    pay: meta('pay', 'Payout', 'wallet', '#059669', 'Your sales, your incentive and what you are owed this month.'),
  },
  student: {
    today: meta('today', 'Today', 'today', '#1D4ED8', 'Your next class and what to do today.'),
    classes: meta('classes', 'Classes', 'classes', '#2563EB', 'Your courses, your free classes, and notes from every class so far.'),
    progress: meta('progress', 'Progress', 'progress', '#7C3AED', 'Practice, points and rewards — and the people in your class.'),
    credits: meta('credits', 'Credits', 'wallet', '#059669', 'Classes left on your plan, and every credit in and out.'),
    explore: meta('explore', 'Explore', 'explore', '#EA580C', 'What to learn next.'),
  },
};

export function workspaceMeta(role: WorkspaceRole, key: WorkspaceKey): WorkspaceMeta {
  const m = WORKSPACE_META[role][key];
  if (!m) throw new Error(`${role} has no ${key} workspace`);
  return m;
}

export const ROLE_HOME: Record<WorkspaceRole, string> = {
  super_admin: '/dashboard/super-admin',
  admin: '/dashboard/admin',
  hr: '/dashboard/hr',
  teacher: '/dashboard/teacher',
  seller: '/dashboard/seller',
  student: '/dashboard/student',
};

/** The words around the workspaces, which are not the same for a child. */
export const ROLE_COPY: Record<WorkspaceRole, { eyebrow: string; tilesTitle: string; tilesBlurb: string }> = {
  super_admin: { eyebrow: 'Super Admin · Workspace', tilesTitle: 'Workspaces', tilesBlurb: 'Everything else, one focused page each.' },
  admin: { eyebrow: 'Admin · Workspace', tilesTitle: 'Workspaces', tilesBlurb: 'Everything else, one focused page each.' },
  hr: { eyebrow: 'HR · Workspace', tilesTitle: 'Workspaces', tilesBlurb: 'Teachers, pay, students and sales — one page each.' },
  teacher: { eyebrow: 'Teacher · Workspace', tilesTitle: 'Your workspaces', tilesBlurb: 'Everything else about your teaching, one page each.' },
  seller: { eyebrow: 'Seller · Workspace', tilesTitle: 'Your workspaces', tilesBlurb: 'Leads, trials, prices and pay, one page each.' },
  student: { eyebrow: 'My Sariro', tilesTitle: 'Your spaces', tilesBlurb: 'Everything else, one tap each.' },
};

/** Which workspaces each role has, in sidebar order. Admin has no Finance. */
export const WORKSPACE_ORDER: Record<WorkspaceRole, readonly WorkspaceKey[]> = {
  super_admin: ['today', 'classes', 'people', 'sales', 'finance', 'quality'],
  admin: ['today', 'classes', 'people', 'sales', 'quality'],
  hr: ['today', 'teachers', 'pay', 'students', 'sales'],
  teacher: ['today', 'classes', 'students', 'pay', 'growth'],
  seller: ['today', 'leads', 'trials', 'prices', 'pay'],
  student: ['today', 'classes', 'progress', 'credits', 'explore'],
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
    { id: 'batch-finder', workspace: 'classes', label: 'Batch finder', keywords: 'batch finder place student seat free full capacity lesson teacher trained waiting paused add kid filter find' },
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
    { id: 'gst', workspace: 'finance', label: 'GST summary', keywords: 'gst tax output input credit itc filing return cgst sgst igst payable' },
    { id: 'profitability', workspace: 'finance', label: 'Pricing & profitability', keywords: 'pricing price calculator profit profitability margin minimum floor seller offer gst cac website dollar plan mix' },
    { id: 'payment-links', workspace: 'finance', label: 'Rupee payment links', keywords: 'payment link razorpay upi rupee inr india whatsapp send pay autopay subscription recurring' },
    { id: 'bank-accounts', workspace: 'finance', label: 'Bank accounts', keywords: 'bank account transfer ifsc swift iban upi country checkout wire' },
    { id: 'pricing', workspace: 'finance', label: 'Coding course payment pages', keywords: 'pricing razorpay payment pages tier coding static' },

    { id: 'risk', workspace: 'quality', label: 'Students & batches at risk', keywords: 'risk drifting slipping batch trouble attention' },
    { id: 'chat-policy', workspace: 'quality', label: 'Chat policy', keywords: 'chat policy flag contact details phone' },
    { id: 'audit', workspace: 'quality', label: 'Audit logs', keywords: 'audit log history who changed' },
  ],
  admin: [
    { id: 'totals', workspace: 'today', label: 'Totals', keywords: 'stats numbers users enrolments' },

    { id: 'decisions', workspace: 'classes', label: 'Classes needing a decision', keywords: 'unresolved class happened no show attendance decide' },
    { id: 'catchup-overdue', workspace: 'classes', label: 'Overdue catch-ups', keywords: 'catch up catchup make up session overdue' },
    { id: 'batch-finder', workspace: 'classes', label: 'Batch finder', keywords: 'batch finder place student seat free full capacity lesson teacher trained waiting paused add kid filter find' },
    { id: 'cohorts', workspace: 'classes', label: 'Courses', keywords: 'course cohort batch status meet link roster' },
    { id: 'catalog', workspace: 'classes', label: 'Catalog', keywords: 'catalog tracks levels' },

    { id: 'purchase-intents', workspace: 'people', label: 'Pending enrolments', keywords: 'approve enrolment enrollment purchase intent' },
    { id: 'my-teachers', workspace: 'people', label: 'My teachers', keywords: 'teachers roster reporting' },
    { id: 'certificates', workspace: 'people', label: 'Certificates', keywords: 'certificate issue print withdraw course complete' },

    { id: 'leads', workspace: 'sales', label: 'My leads', keywords: 'leads pipeline stage' },
    { id: 'demo-requests', workspace: 'sales', label: 'Demo class requests', keywords: 'demo request enquiry referral manual trial' },
    { id: 'revenue', workspace: 'sales', label: 'Revenue & exports', keywords: 'revenue payments export csv download' },
    { id: 'payment-links', workspace: 'sales', label: 'Payment links & autopay', keywords: 'payment link razorpay upi rupee inr india whatsapp autopay subscription cancel recurring' },

    { id: 'monitoring', workspace: 'quality', label: 'Monitor a class', keywords: 'monitoring observe class score teacher' },
    { id: 'chat-policy', workspace: 'quality', label: 'Chat policy', keywords: 'chat policy flag contact details phone' },
  ],
  hr: [
    { id: 'summary', workspace: 'today', label: 'This month', keywords: 'stats pending payout settled incentives leave' },

    { id: 'leave', workspace: 'teachers', label: 'Leave requests', keywords: 'leave request holiday absence approve reject cover' },
    { id: 'my-teachers', workspace: 'teachers', label: 'My teachers', keywords: 'teachers roster reporting courses' },
    { id: 'catchup-compliance', workspace: 'teachers', label: 'Catch-up compliance', keywords: 'catch up catchup overdue make up compliance' },
    { id: 'tiers', workspace: 'teachers', label: 'Teacher tiers', keywords: 'tier rate teacher pay level' },
    { id: 'chat-policy', workspace: 'teachers', label: 'Chat policy', keywords: 'chat policy flag contact details phone' },

    { id: 'settlements', workspace: 'pay', label: 'Teacher payouts', keywords: 'payout settle settlement pipeline paid processing' },
    { id: 'incentives', workspace: 'pay', label: 'Incentives', keywords: 'incentive bonus approve reject request' },
    { id: 'earnings', workspace: 'pay', label: 'Recent earnings', keywords: 'earnings classes net penalty teacher pay' },
    { id: 'expenses', workspace: 'pay', label: 'Expenses', keywords: 'expense spend record receipt' },

    { id: 'credit-requests', workspace: 'students', label: 'Credit requests', keywords: 'credit request approve reject top up' },
    { id: 'low-credits', workspace: 'students', label: 'Credits running low', keywords: 'low credits running out renew churn' },
    { id: 'credit-adjust', workspace: 'students', label: 'Credit management', keywords: 'credits adjust add deduct balance student' },
    { id: 'certificates', workspace: 'students', label: 'Certificates', keywords: 'certificate issue print course complete' },
    { id: 'enquiries', workspace: 'students', label: 'Enquiries', keywords: 'enquiry contact bank transfer payment request message' },

    { id: 'hr-sales', workspace: 'sales', label: 'Sales to invoice', keywords: 'sale confirmed punch seller invoice waiting' },
    { id: 'invoices', workspace: 'sales', label: 'Generate an invoice', keywords: 'invoice generate bill gst tax' },
    { id: 'unrecorded-invoices', workspace: 'sales', label: 'Invoices not in the books', keywords: 'invoice unrecorded reconcile ledger' },
    { id: 'ledger', workspace: 'sales', label: 'Sales & refunds', keywords: 'sales refunds ledger revenue renewal' },
    { id: 'gst', workspace: 'sales', label: 'GST summary', keywords: 'gst tax output input credit itc filing return cgst sgst igst payable' },
    { id: 'payment-links', workspace: 'sales', label: 'Rupee payment links', keywords: 'payment link razorpay upi rupee inr india whatsapp send pay autopay subscription recurring' },
    { id: 'bank-accounts', workspace: 'sales', label: 'Bank accounts', keywords: 'bank account transfer ifsc swift iban upi country checkout wire' },
    { id: 'pricing', workspace: 'sales', label: 'Pricing & profitability', keywords: 'pricing price calculator profit margin floor seller website' },
  ],
  teacher: [
    { id: 'next-class', workspace: 'today', label: 'Next class', keywords: 'next class join now upcoming' },
    { id: 'totals', workspace: 'today', label: 'This week', keywords: 'stats classes hours students week' },

    { id: 'registers', workspace: 'classes', label: 'Registers to mark', keywords: 'attendance register mark present absent penalty deadline' },
    { id: 'schedule', workspace: 'classes', label: 'Schedule', keywords:'calendar timetable join mark attendance register reschedule cancel add session change schedule' },
    { id: 'trials', workspace: 'classes', label: 'Trials coming up', keywords: 'trial playbook family answers prep demo free class plan' },
    { id: 'write-ups', workspace: 'classes', label: 'Trial write-ups', keywords: 'trial write up feedback rating pay held release' },
    { id: 'catchup', workspace: 'classes', label: 'Catch-up sessions', keywords: 'catch up catchup make up missed lesson deadline owe' },

    { id: 'reviews', workspace: 'students', label: 'Projects to review', keywords: 'project submission review feedback capstone homework' },
    { id: 'roster', workspace: 'students', label: 'My students', keywords: 'students roster children enrolments progress' },
    { id: 'low-credits', workspace: 'students', label: 'Credits running low', keywords: 'low credits running out renew' },

    { id: 'earnings', workspace: 'pay', label: 'Earnings & payouts', keywords: 'earnings payout pay salary incentive leave month bank' },

    { id: 'standing', workspace: 'growth', label: 'Courses & rating', keywords: 'rating stars courses cleared training eligibility subjects' },
    { id: 'monitoring', workspace: 'growth', label: 'Monitoring', keywords: 'monitoring observed score quality review' },
    { id: 'managers', workspace: 'growth', label: 'Who you report to', keywords: 'manager admin hr reporting contact help' },
    { id: 'tips', workspace: 'growth', label: 'Teaching tips', keywords: 'tips advice timezone room link' },
  ],
  seller: [
    { id: 'managers', workspace: 'today', label: 'Who you report to', keywords: 'manager admin hr reporting contact' },

    { id: 'queues', workspace: 'leads', label: 'Today’s calls', keywords: 'queue follow up overdue missed trial slot final conversation call ring reminder' },
    { id: 'signals', workspace: 'leads', label: 'Who to ring first', keywords: 'trial write ups signals likely yes teacher opinion' },
    { id: 'all-leads', workspace: 'leads', label: 'All my leads', keywords: 'leads pipeline stage family search' },

    { id: 'trial-grades', workspace: 'trials', label: 'Open trial seats', keywords: 'trial grade seats class full band' },

    { id: 'price-list', workspace: 'prices', label: 'Price list', keywords: 'price prices fee plan quote offer discount floor lowest month year' },
    { id: 'payment-links', workspace: 'prices', label: 'Payment links', keywords: 'payment link razorpay upi rupee inr india whatsapp send pay autopay subscription recurring' },

    { id: 'payout', workspace: 'pay', label: 'Payout', keywords: 'payout incentive sales commission month settle earned' },
  ],
  student: [
    { id: 'next-class', workspace: 'today', label: 'Next class', keywords: 'next class join time when schedule' },

    { id: 'courses', workspace: 'classes', label: 'My courses', keywords: 'courses enrolled progress lessons batch' },
    { id: 'trials', workspace: 'classes', label: 'Free trial classes', keywords: 'trial free class' },
    { id: 'notes', workspace: 'classes', label: 'Class notes & projects', keywords: 'notes project submit homework past classes recording' },

    { id: 'practice', workspace: 'progress', label: 'Speaking practice', keywords: 'practice speaking report voice quest parent' },
    { id: 'rewards', workspace: 'progress', label: 'Points & rewards', keywords: 'points rewards shop badges theme' },
    { id: 'classmates', workspace: 'progress', label: 'Classmates', keywords: 'classmates friends batch group' },

    { id: 'balance', workspace: 'credits', label: 'Classes left', keywords: 'credits balance paused catch up top up' },
    { id: 'history', workspace: 'credits', label: 'Credit history', keywords: 'credit history transactions used added' },

    { id: 'recommended', workspace: 'explore', label: 'Recommended next', keywords: 'next course recommended level up' },
    { id: 'tracks', workspace: 'explore', label: 'Explore tracks', keywords: 'tracks courses browse try another trial' },
  ],
} as const satisfies Record<WorkspaceRole, readonly SectionSpec[]>;

export type SectionId<R extends WorkspaceRole> = (typeof SECTIONS)[R][number]['id'];
export type AnySectionId = { [R in WorkspaceRole]: SectionId<R> }[WorkspaceRole];

export function workspaceHref(role: WorkspaceRole, workspace: WorkspaceKey): string {
  return workspace === 'today' ? ROLE_HOME[role] : `${ROLE_HOME[role]}/${workspace}`;
}

export function sectionSpec(role: WorkspaceRole, id: string): SectionSpec | undefined {
  return (SECTIONS[role] as readonly SectionSpec[]).find((s) => s.id === id);
}

/**
 * HR's dashboard was tabs until 15 Sep 2026, and notifications, bookmarks and
 * old ⌘K habits still say /dashboard/hr?tab=sales. Each old tab lands on the
 * section that holds what it used to show.
 */
export const HR_LEGACY_TABS: Record<string, string> = {
  overview: '/dashboard/hr',
  my_teachers: '/dashboard/hr/teachers#my-teachers',
  incentives: '/dashboard/hr/pay#incentives',
  payments: '/dashboard/hr/pay#settlements',
  credits: '/dashboard/hr/students#credit-adjust',
  tiers: '/dashboard/hr/teachers#tiers',
  enquiries: '/dashboard/hr/students#enquiries',
  expenses: '/dashboard/hr/pay#expenses',
  policy: '/dashboard/hr/teachers#chat-policy',
  credit_requests: '/dashboard/hr/students#credit-requests',
  invoices: '/dashboard/hr/sales#invoices',
  sales: '/dashboard/hr/sales#hr-sales',
  certificates: '/dashboard/hr/students#certificates',
  pricing: '/dashboard/hr/sales#pricing',
};

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

/** Everything a person can scroll to, for ⌘K's "Go to". */
export function placesFor(role: WorkspaceRole): { href: string; label: string; hint: string; keywords: string }[] {
  return (SECTIONS[role] as readonly SectionSpec[])
    .filter((s) => s.workspace !== 'today')
    .map((s) => {
      const ws = workspaceMeta(role, s.workspace);
      return {
        href: `${workspaceHref(role, s.workspace)}#${s.id}`,
        label: s.label,
        hint: ws.label,
        keywords: `${s.keywords} ${ws.label.toLowerCase()}`,
      };
    });
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
