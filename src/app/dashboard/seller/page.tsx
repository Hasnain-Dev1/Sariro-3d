'use client';

import DashboardLayout from '@/components/dashboard/dashboard-layout';
import { useAuth } from '@/components/auth/auth-provider';
import { SellerLeads } from '@/app/dashboard/admin/seller-leads';
import { Loader2 } from 'lucide-react';
import DashboardToast, { useDashboardToast } from '@/components/dashboard/dashboard-toast';

export default function SellerDashboard() {
  const { user, profile, loading } = useAuth();

  // Above the loading guard, deliberately. It used to sit below it, which meant
  // this component called a different NUMBER of hooks before and after auth
  // resolved — and React counts hooks by position, so that threw on every load.
  // Was `console.log`. A seller updating a lead saw nothing at all happen —
  // every action looked like it might have failed.
  const { toast, showToast } = useDashboardToast();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <section className="relative pt-6 sm:pt-10 pb-16 px-4 sm:px-6 lg:px-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1" style={{ fontFamily: 'var(--font-jakarta)' }}>
              Welcome, {profile?.full_name?.split(' ')[0] || 'Seller'} 👋
            </h1>
            <p className="text-sm text-slate-500">
              Manage your assigned leads and track your sales pipeline.
            </p>
          </div>

          {/* Seller Leads — same component as admin dashboard */}
          <SellerLeads onToast={showToast} />
        </div>
      </section>

      <DashboardToast toast={toast} />
    </DashboardLayout>
  );
}