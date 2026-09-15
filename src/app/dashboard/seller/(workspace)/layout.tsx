import type { ReactNode } from 'react';
import DashboardLayout from '@/components/dashboard/dashboard-layout';

/** One shell for the seller's workspaces, kept mounted while moving between them. */
export default function SellerWorkspaceLayout({ children }: { children: ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
