import type { ReactNode } from 'react';
import DashboardLayout from '@/components/dashboard/dashboard-layout';

/**
 * One shell for the student's spaces — Today, Classes, Progress, Credits,
 * Explore — kept mounted while moving between them. A route group, so the
 * practice room, lessons and support keep the layouts they have.
 */
export default function StudentWorkspaceLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
