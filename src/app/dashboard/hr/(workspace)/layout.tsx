import type { ReactNode } from 'react';
import DashboardLayout from '@/components/dashboard/dashboard-layout';

/**
 * One shell for HR's workspaces — Today, Teachers, Pay, Students, Sales. A
 * route group, so Doubt Sessions keeps its own page. Moving between workspaces
 * keeps the sidebar, the Today counts and ⌘K mounted instead of rebuilding them.
 */
export default function HrWorkspaceLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
