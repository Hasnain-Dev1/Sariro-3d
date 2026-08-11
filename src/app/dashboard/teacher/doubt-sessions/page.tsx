'use client';

import Link from 'next/link';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { DoubtSessionsPanel } from '@/components/dashboard/doubt-sessions-panel';

/** Teacher doubt sessions — /dashboard/teacher/doubt-sessions.
 *  Mark HR-approved sessions conducted (with a recording) to reclaim the
 *  withheld half-pay from a 1:1 no-show. */
export default function TeacherDoubtSessionsPage() {
  return (
    <div className="min-h-[100dvh] bg-slate-50 pb-20 lg:pb-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6">
        <Link href="/dashboard/teacher" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </Link>
        <div className="flex items-center gap-2 mb-2">
          <HelpCircle className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>Doubt Sessions</h1>
        </div>
        <p className="text-sm text-slate-500 mb-5">Request a doubt session from a completed class in your calendar. Once HR approves it, add the recording link here to reclaim the withheld half-pay.</p>
        <DoubtSessionsPanel mode="teacher" />
      </div>
    </div>
  );
}
