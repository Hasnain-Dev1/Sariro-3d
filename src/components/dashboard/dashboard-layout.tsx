'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Menu, X, LayoutDashboard, BookOpen, Settings,
  LogOut, ChevronRight, Bell, Home as HomeIcon, GraduationCap,
  Users, ShieldCheck, DollarSign, ScrollText, ArrowLeft, Sparkles,
  Loader2, AlertTriangle, Trophy, LifeBuoy, HelpCircle, MessageSquare, Mic, Search, Command,
} from 'lucide-react';
import { useAuth, getRole, type UserRole } from '@/components/auth/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { dashboardAccess, TRIAL_HOME } from '@/lib/dashboard/trial-only';
import { BRAND } from '@/lib/sariro-data';
import { SariroMark } from '@/components/brand/sariro-logo';
import { useRealtime } from '@/lib/dashboard/use-realtime';
import { alertPermission, requestAlertPermission, showAlert, type AlertPermission } from '@/lib/dashboard/alerts';
import {
  fetchNotifications, fetchUnreadCount, markAsRead, markAllAsRead,
  formatRelativeTime, type NotificationRow,
} from '@/lib/dashboard/notifications-data';
import PriorityMessageAlert from '@/components/dashboard/priority-message-alert';
import RewardTheme from '@/components/dashboard/reward-theme';
import { AttentionProvider, useAttention } from '@/components/ops/attention-provider';
import CommandBar, { openCommandBar } from '@/components/ops/command-bar';
import { WORKSPACE_ICON } from '@/components/ops/workspace-chrome';
import {
  WORKSPACE_ORDER, placesFor, waitingAt, workspaceAt, workspaceHref, workspaceMeta, type WorkspaceKey, type WorkspaceRole,
} from '@/lib/ops/workspaces';

/* Every role has a Today queue and ⌘K; all but HR, whose dashboard is tabbed,
   also have workspaces. */
const isWorkspaceRole = (role: UserRole): role is WorkspaceRole => role !== 'hr';

/* ════════════════════════════════════════════════════════════════
   DashboardLayout
   - Used on /dashboard/* and /settings
   - Replaces BrandLayout for logged-in app pages
   - Mobile-first: sidebar collapses to bottom-nav on mobile
   - Topbar: logo (back to home), bell, avatar menu, logout
   - Sidebar (desktop ≥ lg): role-based nav items
   - BottomNav (mobile < lg): 4 most important items + "more"
   ════════════════════════════════════════════════════════════════ */

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** A heading drawn above the first item of each group in the sidebar. */
  group?: string;
}

/* One address for the in-house chat, in every role's sidebar. Declared once so
   the six lists below cannot drift apart on where Messages lives. */
const MESSAGES_NAV: NavItem = { href: '/dashboard/messages', label: 'Messages', icon: MessageSquare };


const HR_NAV: NavItem[] = [
  { href: '/dashboard/hr', label: 'Home', icon: LayoutDashboard },
  MESSAGES_NAV,
  { href: '/dashboard/hr/doubt-sessions', label: 'Doubt Sessions', icon: HelpCircle },
  { href: '/settings', label: 'Settings', icon: Settings },
];

/* Today and Messages, then the workspaces (lib/ops/workspaces.ts), then the
   pages that are not workspaces. The first five are also the phone's bottom
   bar — for an admin Today, Messages, Classes, People, Sales — and every
   workspace page carries a strip of all of them, so the rest are one tap away
   there too. */
function workspaceNav(role: WorkspaceRole): NavItem[] {
  return WORKSPACE_ORDER[role].map((key, i) => {
    const meta = workspaceMeta(role, key);
    const item: NavItem = { href: workspaceHref(role, key), label: meta.label, icon: WORKSPACE_ICON[meta.icon] };
    return i === 0 ? item : { ...item, group: 'Workspaces' };
  });
}

/* Today, Messages, Classes, Students, Pay on a phone. The pages a teacher opens
   from inside a class — lesson plans, playbooks — sit under Pages. */
const TEACHER_NAV: NavItem[] = (() => {
  const [today, ...workspaces] = workspaceNav('teacher');
  return [
    today,
    MESSAGES_NAV,
    ...workspaces,
    { href: '/dashboard/teacher/lessons', label: 'Lesson Plans', icon: BookOpen, group: 'Pages' },
    /* The plan for every kind of trial — the half hour that decides whether a
       family stays. Also opened straight from a trial on the schedule. */
    { href: '/dashboard/teacher/trial-playbook', label: 'Trial Playbooks', icon: Sparkles, group: 'Pages' },
    { href: '/dashboard/teacher/doubt-sessions', label: 'Doubt Sessions', icon: HelpCircle, group: 'Pages' },
    { href: '/dashboard/teacher/leaderboard', label: 'Leaderboard', icon: Trophy, group: 'Pages' },
    { href: '/settings', label: 'Settings', icon: Settings, group: 'Pages' },
  ];
})();

const SELLER_NAV: NavItem[] = (() => {
  const [today, ...workspaces] = workspaceNav('seller');
  return [
    today,
    MESSAGES_NAV,
    ...workspaces,
    { href: '/courses', label: 'Browse Courses', icon: BookOpen, group: 'Pages' },
    { href: '/settings', label: 'Settings', icon: Settings, group: 'Pages' },
  ];
})();

/* A child's sidebar groups by what they came to do. The first five — Today,
   Messages, Classes, Practice, Lessons — are the phone bar, so the practice
   room stays one tap away: it is the other six days of the week. */
const STUDENT_NAV: NavItem[] = (() => {
  const nav = workspaceNav('student');
  const ws = (key: WorkspaceKey) => nav.find((n) => n.href === workspaceHref('student', key))!;
  return [
    ws('today'),
    MESSAGES_NAV,
    { ...ws('classes'), group: 'Learn' },
    /* A live class happens once a week. This is the other six days — speaking,
       listening and writing, all running on the device with nothing to wait for
       and no cost per attempt. */
    { href: '/dashboard/student/practice', label: 'Practice Room', icon: Mic, group: 'Learn' },
    { href: '/dashboard/student/lessons', label: 'Lessons', icon: BookOpen, group: 'Learn' },
    { ...ws('progress'), group: 'You' },
    { ...ws('credits'), group: 'You' },
    { href: '/dashboard/student/leaderboard', label: 'Leaderboard', icon: Trophy, group: 'You' },
    /* A student who liked one course wants to try another — Explore holds the
       tracks and the free trial booking. */
    { ...ws('explore'), group: 'More' },
    { href: '/dashboard/student/support', label: 'Support', icon: LifeBuoy, group: 'More' },
    { href: '/settings', label: 'Settings', icon: Settings, group: 'More' },
  ];
})();

const ADMIN_NAV: NavItem[] = (() => {
  const [today, ...workspaces] = workspaceNav('admin');
  return [
    today,
    MESSAGES_NAV,
    ...workspaces,
    { href: '/dashboard/admin/lessons', label: 'Lesson Pages', icon: BookOpen, group: 'Pages' },
    { href: '/dashboard/admin/support', label: 'Support Inbox', icon: LifeBuoy, group: 'Pages' },
    { href: '/settings', label: 'Settings', icon: Settings, group: 'Pages' },
  ];
})();

const SUPER_ADMIN_NAV: NavItem[] = (() => {
  const [today, ...workspaces] = workspaceNav('super_admin');
  return [
    today,
    MESSAGES_NAV,
    ...workspaces,
    { href: '/dashboard/super-admin/parents', label: 'Parent Access', icon: Users, group: 'Pages' },
    { href: '/dashboard/super-admin/teacher-pay', label: 'Tiers & Pay', icon: DollarSign, group: 'Pages' },
    { href: '/settings', label: 'Settings', icon: Settings, group: 'Pages' },
  ];
})();

/** Every section of every workspace, for ⌘K. Built once. */
const PLACES: Record<WorkspaceRole, ReturnType<typeof placesFor>> = {
  super_admin: placesFor('super_admin'),
  admin: placesFor('admin'),
  teacher: placesFor('teacher'),
  seller: placesFor('seller'),
  student: placesFor('student'),
};

function getNavForRole(role: UserRole): NavItem[] {
  switch (role) {
    case 'super_admin': return SUPER_ADMIN_NAV;
    case 'admin': return ADMIN_NAV;
    case 'hr': return HR_NAV;
    case 'seller': return SELLER_NAV;
    case 'teacher': return TEACHER_NAV;
    default: return STUDENT_NAV;
  }
}

const ROLE_LABEL: Record<UserRole, string> = {
  student: 'Student',
  teacher: 'Teacher',
  seller: 'Seller',
  hr: 'HR',
  admin: 'Admin',
  super_admin: 'Super Admin',
};

const ROLE_BADGE_COLOR: Record<UserRole, string> = {
  student: '#2563EB',
  teacher: '#16A34A',
  seller: '#06B6D4',
  hr: '#7C3AED',
  admin: '#F59E0B',
  super_admin: '#DC2626',
};

/* ───── Avatar dropdown menu ───── */
function AvatarMenu() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const role = getRole(profile);

  useEffect(() => {
    if (!open) return;
    const onClick = () => setOpen(false);
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, [open]);

  if (!user) return null;
  const initial = (profile?.full_name || user.email || '?').charAt(0).toUpperCase();
  const displayName = profile?.full_name || user.email?.split('@')[0] || 'there';

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 p-1 pr-2 sm:pr-3 rounded-full hover:bg-slate-100 transition-colors min-h-[44px]"
        aria-label="Account menu"
      >
        <div
          className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md shrink-0"
          style={{ fontFamily: 'var(--font-jakarta)' }}
        >
          {initial}
        </div>
        <div className="hidden sm:block text-left">
          <div className="text-xs font-bold text-slate-900 leading-tight" style={{ fontFamily: 'var(--font-grotesk)' }}>
            {displayName.split(' ')[0]}
          </div>
          <div className="text-[10px] text-slate-500 leading-tight">{ROLE_LABEL[role]}</div>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-64 rounded-2xl shadow-xl border border-slate-200 bg-white p-2 z-50"
          >
            <div className="px-3 py-2 border-b border-slate-100 mb-1">
              <div className="text-xs text-slate-500">Signed in as</div>
              <div className="text-sm font-bold text-slate-900 truncate" style={{ fontFamily: 'var(--font-jakarta)' }}>
                {displayName}
              </div>
              {user.email && (
                <div className="text-[10px] text-slate-500 truncate mt-0.5">{user.email}</div>
              )}
              <div className="inline-block mt-2 px-2 py-0.5 rounded-md text-[10px] font-bold text-white" style={{ background: ROLE_BADGE_COLOR[role] }}>
                {ROLE_LABEL[role]}
              </div>
            </div>
            <Link href="/settings" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50">
              <Settings className="w-4 h-4" /> Account settings
            </Link>
            <button
              onClick={async () => { await signOut(); router.push('/'); }}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ───── Notification bell ───── */
function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  // Read inside the realtime callback so toggling the dropdown does not tear
  // down and rebuild the subscription.
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  /* Unread count: loaded once, then kept live by Realtime.
   *
   * This used to poll every 30 seconds. Two problems with that. A notification
   * could sit unseen for half a minute, which is the difference between a
   * product that feels alive and one that feels like it is catching up; and
   * every open tab spent a request every 30s forever, whether anything had
   * happened or not.
   *
   * `notifications` is already in the `supabase_realtime` publication and RLS
   * scopes events to rows this user can SELECT, so a client-side user filter is
   * unnecessary — a teacher is never woken by an admin's notification. */

  /* The traditional ding + system pop-up, for whoever has the dashboard open.
   *
   * Fires only when the unread count RISES, and never on the first load —
   * otherwise every page navigation would chime for notifications the user
   * read yesterday, and an alert that cries wolf gets muted within a day. */
  const seenCount = useRef<number | null>(null);

  const refreshBell = useCallback(async () => {
    const before = seenCount.current;
    const list = await fetchNotifications(false);
    const count = list.filter((n) => !n.read_at).length;

    setUnreadCount(count);
    // Only refetch into view if the user is actually looking at the dropdown.
    if (openRef.current) setNotifications(list);

    if (before !== null && count > before) {
      const newest = list.find((n) => !n.read_at);
      if (newest) {
        showAlert({
          title: newest.title,
          body: newest.message ?? undefined,
          url: newest.link ?? undefined,
          tag: newest.id,
        });
      }
    }
    seenCount.current = count;
  }, []);

  useEffect(() => {
    void refreshBell();
  }, [refreshBell]);

  useRealtime({ tables: ['notifications'], onRefresh: refreshBell });

  /* Whether the browser will actually show a pop-up. Offered as a control
     rather than prompted on load — see alerts.ts. */
  const [alertState, setAlertState] = useState<AlertPermission>('default');
  useEffect(() => {
    setAlertState(alertPermission());
  }, []);

  /* Fetch full list whenever the dropdown opens */
  useEffect(() => {
    if (!open) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      const list = await fetchNotifications(false);
      if (active) {
        setNotifications(list);
        setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [open]);

  /* Outside click closes the dropdown */
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      const root = document.getElementById('notification-bell-root');
      if (root && target && !root.contains(target)) setOpen(false);
    };
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, [open]);

  const handleMarkAllRead = async () => {
    if (markingAll) return;
    setMarkingAll(true);
    const res = await markAllAsRead();
    setMarkingAll(false);
    if (res.success) {
      setUnreadCount(0);
      const nowIso = new Date().toISOString();
      setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at || nowIso })));
    }
  };

  const handleClickNotification = async (n: NotificationRow) => {
    if (!n.read_at) {
      const res = await markAsRead(n.id);
      if (res.success) {
        const nowIso = new Date().toISOString();
        setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read_at: nowIso } : x));
        setUnreadCount(c => Math.max(0, c - 1));
      }
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  };

  const displayCount = unreadCount > 9 ? '9+' : String(unreadCount);

  return (
    <div id="notification-bell-root" className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen(!open)}
        className="relative w-11 h-11 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span
            className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            {displayCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl shadow-xl border border-slate-200 bg-white z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <div
                className="text-sm font-bold text-slate-900 flex items-center gap-2"
                style={{ fontFamily: 'var(--font-jakarta)' }}
              >
                Notifications
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-red-100 text-red-700">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={markingAll}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-700 disabled:opacity-50 flex items-center gap-1"
                  style={{ fontFamily: 'var(--font-grotesk)' }}
                >
                  {markingAll && <Loader2 className="w-3 h-3 animate-spin" />}
                  Mark all read
                </button>
              )}
            </div>

            {/* Desktop alerts — offered, never auto-prompted. A permission
                dialog that appears on page load gets denied, and a denial is
                effectively permanent: the browser will not ask again and almost
                nobody finds the setting to undo it. */}
            {alertState === 'default' && (
              <button
                onClick={async () => setAlertState(await requestAlertPermission())}
                className="w-full text-left px-4 py-2.5 border-b border-slate-100 bg-blue-50/60 hover:bg-blue-50 transition-colors"
              >
                <span className="flex items-center gap-2 text-[12px] font-bold text-blue-700">
                  <Bell className="w-3.5 h-3.5" />
                  Turn on desktop alerts
                </span>
                <span className="block text-[11px] text-blue-600/80 mt-0.5">
                  A sound and a pop-up the moment something needs you.
                </span>
              </button>
            )}
            {alertState === 'denied' && (
              <p className="px-4 py-2.5 border-b border-slate-100 text-[11px] text-slate-500">
                Desktop alerts are blocked for this site. You can re-enable them in your
                browser&apos;s site settings.
              </p>
            )}

            {/* List */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">You&apos;re all caught up</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">No notifications right now.</p>
                </div>
              ) : (
                notifications.map(n => {
                  const isUnread = !n.read_at;
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleClickNotification(n)}
                      className={`w-full text-left px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors flex gap-3 ${
                        isUnread ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <div className="pt-1.5 shrink-0">
                        {isUnread ? (
                          <span className="block w-2 h-2 rounded-full bg-red-500" />
                        ) : (
                          <span className="block w-2 h-2 rounded-full bg-transparent" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div
                          className="text-sm font-bold text-slate-900 truncate"
                          style={{ fontFamily: 'var(--font-jakarta)' }}
                        >
                          {n.title}
                        </div>
                        {n.message && (
                          <div className="text-xs text-slate-600 mt-0.5 line-clamp-2 break-words">
                            {n.message}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400 mt-1">
                          {formatRelativeTime(n.created_at)}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer (only shown when there are notifications) */}
            {notifications.length > 0 && (
              <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/60">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Click a notification to open it.</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ───── Command bar trigger ───── */
function CommandBarButton() {
  return (
    <button
      type="button"
      onClick={openCommandBar}
      className="inline-flex items-center gap-2 h-10 pl-2.5 pr-2 sm:pl-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 text-slate-500 transition-colors"
      aria-label="Search and jump (Ctrl+K)"
    >
      <Search className="w-4 h-4" />
      <span className="hidden md:inline text-[13px] font-semibold pr-6" style={{ fontFamily: 'var(--font-grotesk)' }}>Search or jump…</span>
      <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10.5px] font-bold text-slate-400">
        <Command className="w-3 h-3" />K
      </kbd>
    </button>
  );
}

/**
 * How many things are waiting, as a sidebar badge. Red when any are urgent.
 * On Today (`href` omitted) everything; on a workspace, only what is waiting
 * inside it.
 */
function AttentionBadge({ compact = false, href }: { compact?: boolean; href?: string }) {
  const attention = useAttention();
  if (!attention) return null;
  const { count, urgent } = href
    ? waitingAt(attention.items, href)
    : { count: attention.total, urgent: attention.bySeverity.urgent > 0 };
  if (count === 0) return null;
  return (
    <span
      className={`${compact ? 'absolute -top-1 right-[calc(50%-18px)]' : 'ml-auto'} min-w-[20px] h-5 px-1.5 rounded-full text-[10.5px] font-black text-white flex items-center justify-center tabular-nums`}
      style={{ background: urgent ? '#DC2626' : '#D97706' }}
      aria-label={`${count} waiting`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

/**
 * Active on its own page and the pages beneath it — except the role's home,
 * which is the parent of every workspace and would otherwise stay lit on all
 * of them.
 */
function navActive(href: string, pathname: string, isHome: boolean): boolean {
  const path = href.split('#')[0];
  if (pathname === path) return true;
  if (isHome || path === '/dashboard') return false;
  return pathname.startsWith(`${path}/`);
}

/** A workspace (not Today, not another page) for a role that has them. */
function isWorkspaceItem(role: UserRole, href: string): boolean {
  if (!isWorkspaceRole(role)) return false;
  const ws = workspaceAt(role, href);
  return ws !== null && ws !== 'today';
}

/* ───── Topbar ───── */
function DashboardTopbar({ onMenuClick }: { onMenuClick?: () => void }) {
  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-lg border-b border-slate-200">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        {/* Left: logo (back to home) + mobile menu toggle */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group" aria-label="Back to home">
            <SariroMark size={36} priority className="shadow-md group-hover:shadow-lg transition-shadow" />
            <span className="hidden sm:block text-lg font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
              {BRAND.name}
            </span>
          </Link>
        </div>

        {/* Right: back to the site, bell, avatar */}
        <div className="flex items-center gap-1 sm:gap-2">
          <CommandBarButton />
          {/* "Back to website" lived only in the desktop sidebar. On a phone the
              sidebar does not exist, so the only way out of the dashboard was
              the unlabelled logo — which nobody reads as "leave". Labelled, and
              on every viewport. */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 min-h-[38px] rounded-lg text-[13px] font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span className="hidden xs:inline sm:inline">Website</span>
          </Link>
          <NotificationBell />
          <AvatarMenu />
        </div>
      </div>
    </header>
  );
}

/* ───── Desktop sidebar ───── */
function DashboardSidebar({ role, pathname }: { role: UserRole; pathname: string }) {
  const items = getNavForRole(role);
  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-slate-200 bg-white h-[calc(100vh-4rem)] sticky top-16 p-4">
      <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden -mx-1 px-1">
        {items.map((item, i) => {
          const isHome = i === 0;
          const isActive = navActive(item.href, pathname, isHome);
          const Icon = item.icon;
          const heading = item.group && item.group !== items[i - 1]?.group ? item.group : null;
          /* What is waiting sits on Today, where the queue lists it, and on
             each workspace, counting its own share. */
          const badge = isHome
            ? <AttentionBadge />
            : isWorkspaceItem(role, item.href) ? <AttentionBadge href={item.href} /> : null;
          return (
            <div key={item.href}>
              {heading && (
                <p className="px-3 pt-4 pb-1.5 text-[10.5px] font-bold uppercase tracking-[0.16em] text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>
                  {heading}
                </p>
              )}
              <Link
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors min-h-[44px] ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="truncate">{item.label}</span>
                {badge ?? (isActive && <ChevronRight className="w-4 h-4 ml-auto" />)}
              </Link>
            </div>
          );
        })}
      </nav>

      {/* "Back to website" link at bottom */}
      <Link
        href="/"
        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors min-h-[44px]"
        style={{ fontFamily: 'var(--font-grotesk)' }}
      >
        <ArrowLeft className="w-5 h-5 shrink-0" />
        <span>Back to website</span>
      </Link>
    </aside>
  );
}

/* ───── Mobile bottom nav ───── */
function MobileBottomNav({ role, pathname }: { role: UserRole; pathname: string }) {
  /* Five, not four. There is no mobile drawer behind this bar — whatever is not
     here is unreachable on a phone — so adding Messages at position two must not
     be paid for by pushing Support or Leaderboard off the end. Five columns on a
     360px screen is still a 72px target. */
  const items = getNavForRole(role).slice(0, 5);
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)]">
      <div className={`grid h-16 ${items.length >= 5 ? 'grid-cols-5' : items.length === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
        {items.map((item, i) => {
          const isActive = navActive(item.href, pathname, i === 0);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-colors ${
                isActive ? 'text-blue-600' : 'text-slate-500'
              }`}
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              {i === 0 ? <AttentionBadge compact /> : isWorkspaceItem(role, item.href) && <AttentionBadge compact href={item.href} />}
              <Icon className="w-5 h-5" />
              <span className="truncate max-w-full px-1">{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/* ───── Loading gate ───── */
function LoadingGate() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-10 h-10 border-3 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-slate-500">Loading your dashboard...</p>
      </div>
    </div>
  );
}

/* ───── Auth gate (for /settings and direct dashboard access) ─────
   - Checks user is logged in
   - Checks user is on the RIGHT dashboard for their role
     (a student typing /dashboard/admin gets redirected to /dashboard/student)
*/
const ROLE_DASHBOARD_PATHS: Record<UserRole, string> = {
  student: '/dashboard/student',
  teacher: '/dashboard/teacher',
  seller: '/dashboard/seller',
  hr: '/dashboard/hr',
  admin: '/dashboard/admin',
  super_admin: '/dashboard/super-admin',
};

function getRoleFromPath(pathname: string): UserRole | null {
  /* Everything beneath these two, not only the home page: the workspaces
     (/dashboard/super-admin/finance) and the pages that were already there —
     Tiers & Pay, Parent Access, Lesson Pages — were one typed URL from any
     signed-in account. */
  if (pathname === '/dashboard/super-admin' || pathname.startsWith('/dashboard/super-admin/')) return 'super_admin';
  if (pathname === '/dashboard/admin' || pathname.startsWith('/dashboard/admin/')) return 'admin';
  /* Only the workspaces for these three: /dashboard/teacher/trial-playbook is
     opened by admins and HR too, and guards itself. */
  for (const r of ['student', 'teacher', 'seller'] as const) if (workspaceAt(r, pathname)) return r;
  if (pathname === '/dashboard/hr') return 'hr';
  return null;
}

function AuthGate({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  /* How many courses this person is enrolled in. null until we know.
     ────────────────────────────────────────────────────────────────────────
     A free trial creates a real account, and that account used to land here —
     inside the shell, with the sidebar: Practice Room, Leaderboard, My
     Lessons, Messages, Browse Courses. Anybody could see the whole product by
     giving us a phone number.

     The check lives in AuthGate rather than on the student dashboard page
     because a redirect on one page is not a fence: /dashboard/student/practice
     and /dashboard/student/leaderboard are one typed URL away. Everything
     under /dashboard goes through here. */
  const [enrolmentCount, setEnrolmentCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    let live = true;
    (async () => {
      const { count, error } = await createClient()
        .from('enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);
      // An error leaves it null, which holds the loading screen rather than
      // guessing. See dashboardAccess: both guesses are expensive.
      if (live && !error) setEnrolmentCount(count ?? 0);
    })();
    return () => { live = false; };
  }, [user]);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/auth/sign-in?next=/dashboard');
      return;
    }
    // Role-based route protection:
    // If user is on a dashboard path that doesn't match their role, redirect.
    const userRole = getRole(profile);
    const pathRole = getRoleFromPath(pathname);
    if (pathRole && pathRole !== userRole) {
      const correctPath = ROLE_DASHBOARD_PATHS[userRole];
      router.replace(correctPath);
      return;
    }
    if (dashboardAccess({ role: userRole, enrolmentCount, profileLoaded: !!profile }) === 'bounce') {
      router.replace(TRIAL_HOME);
    }
  }, [user, profile, loading, router, pathname, enrolmentCount]);

  if (loading || !user) return <LoadingGate />;

  const role = getRole(profile);
  // If user is on a wrong-role dashboard, show loading while redirect happens
  const pathRole = getRoleFromPath(pathname);
  if (pathRole && pathRole !== role) {
    return <LoadingGate />;
  }

  /* Nothing of the dashboard renders until this is settled. A single frame is
     enough to screenshot, so 'wait' and 'bounce' both hold the loading screen
     rather than painting the shell and taking it away. */
  if (dashboardAccess({ role, enrolmentCount, profileLoaded: !!profile }) !== 'allow') {
    return <LoadingGate />;
  }

  const shell = (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <DashboardTopbar />
      <div className="flex flex-1">
        <DashboardSidebar role={role} pathname={pathname} />
        <main className="flex-1 min-w-0 pb-20 lg:pb-0">
          {children}
        </main>
      </div>
      <MobileBottomNav role={role} pathname={pathname} />
      {/* A message from HR, an admin or the super-admin interrupts rather than
          waiting to be noticed. Inside AuthGate, so it never runs signed out. */}
      <PriorityMessageAlert />
      {/* §57 — puts an equipped cosmetic on the screen. Without this, spending
          points changed a balance and nothing else, which teaches a child the
          points are pretend. */}
      {role === 'student' && <RewardTheme />}
    </div>
  );

  /* What is waiting on this person is counted once for the whole page — the
     Today queue, the sidebar badges and the command bar all read the same
     numbers — and ⌘K reaches anything. */
  return (
    <AttentionProvider role={role}>
      {shell}
      <CommandBar role={role} nav={getNavForRole(role)} sections={isWorkspaceRole(role) ? PLACES[role] : undefined} />
    </AttentionProvider>
  );
}

/* ───── Exported layout ───── */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <AuthGate>{children}</AuthGate>;
}

export { useAuth, getRole };
