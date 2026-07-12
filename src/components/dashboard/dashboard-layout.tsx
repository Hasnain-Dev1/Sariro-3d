'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import {
  Menu, X, LayoutDashboard, BookOpen, Calendar, Settings,
  LogOut, ChevronRight, Bell, Home as HomeIcon, GraduationCap,
  Users, ShieldCheck, DollarSign, ScrollText, ArrowLeft,
  Loader2, AlertTriangle,
} from 'lucide-react';
import { useAuth, getRole, type UserRole } from '@/components/auth/auth-provider';
import { BRAND } from '@/lib/sariro-data';
import {
  fetchNotifications, fetchUnreadCount, markAsRead, markAllAsRead,
  formatRelativeTime, type NotificationRow,
} from '@/lib/dashboard/notifications-data';

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
}

const STUDENT_NAV: NavItem[] = [
  { href: '/dashboard/student', label: 'Home', icon: LayoutDashboard },
  { href: '/courses', label: 'Browse Courses', icon: BookOpen },
  { href: '/dashboard/student#schedule', label: 'My Schedule', icon: Calendar },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const TEACHER_NAV: NavItem[] = [
  { href: '/dashboard/teacher', label: 'Home', icon: LayoutDashboard },
  { href: '/dashboard/teacher#schedule', label: 'My Schedule', icon: Calendar },
  { href: '/dashboard/teacher#students', label: 'Students', icon: Users },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const ADMIN_NAV: NavItem[] = [
  { href: '/dashboard/admin', label: 'Home', icon: LayoutDashboard },
  { href: '/dashboard/admin#cohorts', label: 'Courses', icon: GraduationCap },
  { href: '/dashboard/admin#enrollments', label: 'Enrollments', icon: BookOpen },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const SUPER_ADMIN_NAV: NavItem[] = [
  { href: '/dashboard/super-admin', label: 'Home', icon: LayoutDashboard },
  { href: '/dashboard/super-admin#cohorts', label: 'Courses', icon: GraduationCap },
  { href: '/dashboard/super-admin#pricing', label: 'Pricing', icon: DollarSign },
  { href: '/dashboard/super-admin#audit', label: 'Audit Logs', icon: ScrollText },
  { href: '/settings', label: 'Settings', icon: Settings },
];

function getNavForRole(role: UserRole): NavItem[] {
  switch (role) {
    case 'super_admin': return SUPER_ADMIN_NAV;
    case 'admin': return ADMIN_NAV;
    case 'teacher': return TEACHER_NAV;
    default: return STUDENT_NAV;
  }
}

const ROLE_LABEL: Record<UserRole, string> = {
  student: 'Student',
  teacher: 'Teacher',
  admin: 'Admin',
  super_admin: 'Super Admin',
};

const ROLE_BADGE_COLOR: Record<UserRole, string> = {
  student: '#2563EB',
  teacher: '#16A34A',
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

  /* Fetch unread count on mount + every 30s */
  useEffect(() => {
    let active = true;
    const loadCount = async () => {
      const c = await fetchUnreadCount();
      if (active) setUnreadCount(c);
    };
    loadCount();
    const interval = setInterval(loadCount, 30000);
    return () => { active = false; clearInterval(interval); };
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

/* ───── Topbar ───── */
function DashboardTopbar({ onMenuClick }: { onMenuClick?: () => void }) {
  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-lg border-b border-slate-200">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        {/* Left: logo (back to home) + mobile menu toggle */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group" aria-label="Back to home">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center text-white font-extrabold shadow-md group-hover:shadow-lg transition-shadow" style={{ fontFamily: 'var(--font-jakarta)' }}>
              S
            </div>
            <span className="hidden sm:block text-lg font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
              {BRAND.name}
            </span>
          </Link>
        </div>

        {/* Right: bell + avatar */}
        <div className="flex items-center gap-1 sm:gap-2">
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
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href.split('#')[0]) && item.href.split('#')[0] !== '/dashboard');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors min-h-[44px] ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="truncate">{item.label}</span>
              {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
            </Link>
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
  const items = getNavForRole(role).slice(0, 4); // max 4 items on mobile
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 pb-[env(safe-area-inset-bottom)]">
      <div className="grid grid-cols-4 h-16">
        {items.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href.split('#')[0]) && item.href.split('#')[0] !== '/dashboard');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-colors ${
                isActive ? 'text-blue-600' : 'text-slate-500'
              }`}
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
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
  admin: '/dashboard/admin',
  super_admin: '/dashboard/super-admin',
};

function getRoleFromPath(pathname: string): UserRole | null {
  if (pathname === '/dashboard/student') return 'student';
  if (pathname === '/dashboard/teacher') return 'teacher';
  if (pathname === '/dashboard/admin') return 'admin';
  if (pathname === '/dashboard/super-admin') return 'super_admin';
  return null;
}

function AuthGate({ children }: { children: ReactNode }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

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
  }, [user, profile, loading, router, pathname]);

  if (loading || !user) return <LoadingGate />;

  const role = getRole(profile);
  // If user is on a wrong-role dashboard, show loading while redirect happens
  const pathRole = getRoleFromPath(pathname);
  if (pathRole && pathRole !== role) {
    return <LoadingGate />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <DashboardTopbar />
      <div className="flex flex-1">
        <DashboardSidebar role={role} pathname={pathname} />
        <main className="flex-1 min-w-0 pb-20 lg:pb-0">
          {children}
        </main>
      </div>
      <MobileBottomNav role={role} pathname={pathname} />
    </div>
  );
}

/* ───── Exported layout ───── */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <AuthGate>{children}</AuthGate>;
}

export { useAuth, getRole };
