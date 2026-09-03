'use client';

/**
 * Messages — /dashboard/messages
 *
 * One address for the whole organisation rather than a chat tab bolted onto
 * each dashboard: a student writing to their teacher, a teacher writing to HR,
 * an admin writing to a teacher all end up on the same screen with the same
 * rules. Every role reaches it from the same place in the sidebar.
 */

import DashboardLayout from '@/components/dashboard/dashboard-layout';
import MessagesPanel from '@/components/dashboard/messages-panel';

export default function MessagesPage() {
  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        <MessagesPanel />
      </div>
    </DashboardLayout>
  );
}
