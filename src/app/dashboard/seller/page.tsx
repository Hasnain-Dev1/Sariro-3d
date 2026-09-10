'use client';

import DashboardLayout from '@/components/dashboard/dashboard-layout';
import { useAuth } from '@/components/auth/auth-provider';
import { SellerLeads } from '@/app/dashboard/admin/seller-leads';
import { Loader2, CalendarPlus } from 'lucide-react';
import { useState } from 'react';
import BookTrialModal from '@/components/dashboard/book-trial-modal';
import LeadSignalsPanel from '@/components/dashboard/lead-signals-panel';
import DashboardToast, { useDashboardToast } from '@/components/dashboard/dashboard-toast';
import TrialGradesPanel from '@/components/dashboard/trial-grades-panel';
import SellerQueues from '@/components/dashboard/seller-queues';

export default function SellerDashboard() {
  const { user, profile, loading } = useAuth();

  // Above the loading guard, deliberately. It used to sit below it, which meant
  // this component called a different NUMBER of hooks before and after auth
  // resolved — and React counts hooks by position, so that threw on every load.
  // Was `console.log`. A seller updating a lead saw nothing at all happen —
  // every action looked like it might have failed.
  const { toast, showToast } = useDashboardToast();
  const [bookOpen, setBookOpen] = useState(false);

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

          {/* §7. A seller books a trial from here, with no verification code.
              The public form makes a parent verify their mobile because it is
              open to the internet; this is staff booking for somebody they
              have usually just spoken to, and a code read down the phone buys
              nothing. The student's phone number is still required — an
              account nobody can ring is an account nobody can chase when the
              child does not appear. */}
          <div className="mb-6">
            <button
              onClick={() => setBookOpen(true)}
              className="btn-tactile btn-tactile-primary px-5 py-3 text-sm flex items-center gap-2"
            >
              <CalendarPlus className="w-4 h-4" />
              Book a trial class
            </button>
          </div>

          {/* Here as well as on the super-admin dashboard, because a seller is
              the one who books trials and therefore the one who notices a
              class refusing joiners. Each grade opens up to three seats. */}
          <div className="mb-6">
            <TrialGradesPanel />
          </div>

          {/* The day's work, before anything else on the page.
              ────────────────────────────────────────────────────────────────
              Six queues, each with a verb, bucketed on the server so a badge
              can never disagree with the list under it. Everything below this
              is reference material — this is the part that says what to do
              now, which is why it is first. */}
          <div className="mb-6">
            <SellerQueues />
          </div>

          {/* §9. What the two write-ups say, turned into an order to ring in.
              Above the raw lead list on purpose: the list is ordered by when a
              lead arrived, and this is ordered by how likely they are to say
              yes. */}
          <div className="mb-6">
            <LeadSignalsPanel />
          </div>

          {/* Seller Leads — same component as admin dashboard */}
          <SellerLeads onToast={showToast} />

          <BookTrialModal
            open={bookOpen}
            onClose={() => setBookOpen(false)}
            onBooked={(msg) => showToast(msg, 'success')}
          />
        </div>
      </section>

      <DashboardToast toast={toast} />
    </DashboardLayout>
  );
}