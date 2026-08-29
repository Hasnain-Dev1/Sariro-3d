'use client';

import DashboardLayout from '@/components/dashboard/dashboard-layout';
import { useAuth } from '@/components/auth/auth-provider';
import { SellerLeads } from '@/app/dashboard/admin/seller-leads';
import { Loader2 } from 'lucide-react';

export default function SellerDashboard() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  const handleToast = (msg: string, kind?: 'success' | 'error') => {
    // Simple toast — can be enhanced later
    console.log(`[seller toast] ${kind}: ${msg}`);
  };

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
          <SellerLeads onToast={handleToast} />
        </div>
      </section>
    </DashboardLayout>
  );
}