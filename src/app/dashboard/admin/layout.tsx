import type { ReactNode } from 'react';
import DashboardLayout from '@/components/dashboard/dashboard-layout';

/**
 * One shell for everything under /dashboard/admin — Today, the workspaces,
 * Lesson Pages, the Support Inbox. Held here rather than in each page so moving
 * between workspaces keeps the sidebar, the Today counts and ⌘K mounted instead
 * of rebuilding them on every click.
 */
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
