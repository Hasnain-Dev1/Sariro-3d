'use client';

import DashboardLayout from '@/components/dashboard/dashboard-layout';
import { useAuth } from '@/components/auth/auth-provider';
import { SellerLeads } from '@/app/dashboard/admin/seller-leads';
import { Loader2, CalendarPlus, ListChecks, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import BookTrialModal from '@/components/dashboard/book-trial-modal';
import LeadSignalsPanel from '@/components/dashboard/lead-signals-panel';
import DashboardToast, { useDashboardToast } from '@/components/dashboard/dashboard-toast';
import TrialGradesPanel from '@/components/dashboard/trial-grades-panel';
import SellerQueues from '@/components/dashboard/seller-queues';
import SellerPayout from '@/components/dashboard/seller-payout';
import TeacherManagers from '@/components/dashboard/teacher-managers';

type Tab = 'leads' | 'payout';

export default function SellerDashboard() {
  const { profile, loading } = useAuth();

  // Above the loading guard, deliberately. It used to sit below it, which meant
  // this component called a different NUMBER of hooks before and after auth
  // resolved — and React counts hooks by position, so that threw on every load.
  // Was `console.log`. A seller updating a lead saw nothing at all happen —
  // every action looked like it might have failed.
  const { toast, showToast } = useDashboardToast();
  const [bookOpen, setBookOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('leads');

  /* A payout notification links to ?tab=payout. Read after mount, so the
     server render and the first client render agree about which tab is open. */
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('tab') === 'payout') setTab('payout');
  }, []);

  const pick = (next: Tab) => {
    setTab(next);
    /* Kept in the address bar so a refresh, or a link sent to a colleague,
       lands on the same tab. */
    const url = new URL(window.location.href);
    if (next === 'payout') url.searchParams.set('tab', 'payout');
    else url.searchParams.delete('tab');
    window.history.replaceState(null, '', url.toString());
  };

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
          <div className="mb-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1" style={{ fontFamily: 'var(--font-jakarta)' }}>
              Welcome, {profile?.full_name?.split(' ')[0] || 'Seller'} 👋
            </h1>
            <p className="text-sm text-slate-500">
              Your leads, your follow-ups, and what you are owed.
            </p>
          </div>

          {/* Who a seller reports to. Sellers now have a reporting Admin and HR
              the way teachers do — and the HR shown here is the person told
              when this seller settles a month or asks for an incentive. */}
          <TeacherManagers />

          {/* Two jobs, two tabs. The day's calls and the month's money are read
              at different times and in different moods, and one long page made
              the payout something you scrolled past on the way to a lead. */}
          <div className="mb-6 inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1" role="tablist">
            {([['leads', 'Leads', ListChecks], ['payout', 'Payout', Wallet]] as const).map(([key, label, Icon]) => (
              <button
                key={key}
                role="tab"
                aria-selected={tab === key}
                onClick={() => pick(key)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition ${
                  tab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>

          {tab === 'payout' ? (
            <SellerPayout />
          ) : (
            <>
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

              {/* The day's work, before anything else below it: six queues, each
                  with a verb, plus every lead — so any family can be found and
                  given a note and a reminder, not only the ones already in a
                  queue. Everything further down is reference material. */}
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
            </>
          )}

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
