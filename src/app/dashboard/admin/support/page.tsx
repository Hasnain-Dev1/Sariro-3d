'use client';

import Link from 'next/link';
import { ArrowLeft, LifeBuoy } from 'lucide-react';
import { SupportPanel } from '@/components/dashboard/support-panel';

/** Admin support inbox — /dashboard/admin/support. Shows queries routed to this
 *  admin (their teachers' students). */
export default function AdminSupportPage() {
  return (
    <div className="min-h-[100dvh] bg-slate-50 pb-20 lg:pb-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        <Link href="/dashboard/admin" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </Link>
        <div className="flex items-center gap-2 mb-5">
          <LifeBuoy className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>Support Inbox</h1>
        </div>
        <SupportPanel mode="admin" />
      </div>
    </div>
  );
}
