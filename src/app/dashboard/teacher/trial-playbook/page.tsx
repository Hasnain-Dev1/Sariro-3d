'use client';

import Link from 'next/link';
import { ArrowLeft, Lock } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/dashboard-layout';
import { useAuth, getRole } from '@/components/auth/auth-provider';
import PlaybookView from '@/components/trial/playbook-view';

/**
 * Trial playbooks — /dashboard/teacher/trial-playbook
 *
 * Opened from a trial on the teacher's schedule (?subject=&grade=&child=&booking=)
 * or browsed on its own to prepare. For the people who teach or oversee trials
 * only: the plans are how Sariro runs a trial, and a learner account has no
 * business reading them.
 */
const ALLOWED = new Set(['teacher', 'admin', 'super_admin', 'hr']);

export default function TrialPlaybookPage() {
  const { profile, loading } = useAuth();
  const role = getRole(profile);
  const allowed = ALLOWED.has(role) || profile?.is_teacher === true;

  return (
    <DashboardLayout>
      <section className="relative pt-6 sm:pt-8 pb-16 px-4 sm:px-6 lg:px-10">
        <div className="max-w-5xl mx-auto">
          <Link href="/dashboard/teacher" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-700 mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to dashboard
          </Link>
          {loading ? null : allowed ? (
            <PlaybookView />
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <Lock className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="mt-3 text-[15px] font-bold text-slate-900">Trial playbooks are for Sariro teachers.</p>
            </div>
          )}
        </div>
      </section>
    </DashboardLayout>
  );
}
