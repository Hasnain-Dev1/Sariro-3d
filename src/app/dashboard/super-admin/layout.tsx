import type { ReactNode } from 'react';
import DashboardLayout from '@/components/dashboard/dashboard-layout';

/**
 * One shell for everything under /dashboard/super-admin — Today, the
 * workspaces, Parent Access, Tiers & Pay. Held here rather than in each page so
 * moving between workspaces keeps the sidebar, the Today counts and ⌘K mounted
 * instead of rebuilding them (and re-counting everything) on every click.
 */
export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
