import type { ReactNode } from 'react';
import DashboardLayout from '@/components/dashboard/dashboard-layout';

/**
 * One shell for the teacher's workspaces — Today, Classes, Students, Pay,
 * Growth. A route group, so it holds only these: Lesson Plans, Trial Playbooks
 * and the leaderboard keep the layouts they have. Moving between workspaces
 * keeps the sidebar, the Today counts and ⌘K mounted instead of rebuilding them.
 */
export default function TeacherWorkspaceLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
