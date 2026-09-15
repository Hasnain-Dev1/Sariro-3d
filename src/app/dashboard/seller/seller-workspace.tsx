'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarPlus, ListChecks, Users, GraduationCap, BadgeIndianRupee } from 'lucide-react';
import SellerPriceList from '@/components/dashboard/seller-price-list';
import { SellerLeads } from '@/app/dashboard/admin/seller-leads';
import BookTrialModal from '@/components/dashboard/book-trial-modal';
import LeadSignalsPanel from '@/components/dashboard/lead-signals-panel';
import DashboardToast, { useDashboardToast } from '@/components/dashboard/dashboard-toast';
import TrialGradesPanel from '@/components/dashboard/trial-grades-panel';
import SellerQueues from '@/components/dashboard/seller-queues';
import SellerPayout from '@/components/dashboard/seller-payout';
import TeacherManagers from '@/components/dashboard/teacher-managers';
import TodayQueue from '@/components/ops/today-queue';
import { useAttention } from '@/components/ops/attention-provider';
import { WorkspaceProvider, OpsSection, useOpsDo } from '@/components/ops/workspace';
import { WorkspaceTabs, WorkspaceHeader, WorkspaceTiles, WorkspaceAction } from '@/components/ops/workspace-chrome';
import { sectionHref, workspaceHref, type WorkspaceKey } from '@/lib/ops/workspaces';

/**
 * SARIRO — the seller's dashboard, one workspace at a time
 * ============================================================================
 * Today (the calls that are late or due), Leads (the six queues, who to ring
 * first, every family), Trials (book one, see which grades have seats) and
 * Payout. It was two tabs on one page; the day's calls and the month's money
 * are read at different times and in different moods, and now each is its own
 * address that a notification can open directly.
 */

function SellerDashboardInner({ workspace }: { workspace: WorkspaceKey }) {
  const router = useRouter();
  const attention = useAttention();
  const { toast, showToast } = useDashboardToast();
  const [bookOpen, setBookOpen] = useState(false);

  /* Notifications sent before the split point at /dashboard/seller?tab=payout
     and /dashboard/seller?lead=… — they still land on the right page. */
  useEffect(() => {
    if (workspace !== 'today') return;
    const params = new URLSearchParams(window.location.search);
    const lead = params.get('lead');
    if (params.get('tab') === 'payout') router.replace(workspaceHref('seller', 'pay'));
    else if (lead && /^[0-9a-f-]{36}$/i.test(lead)) router.replace(`${workspaceHref('seller', 'leads')}?lead=${lead}`);
  }, [workspace, router]);

  useOpsDo({ 'book-trial': () => setBookOpen(true) });

  const bookButton = <WorkspaceAction icon={CalendarPlus} primary onClick={() => setBookOpen(true)}>Book a trial</WorkspaceAction>;
  const headerActions: Partial<Record<WorkspaceKey, ReactNode>> = {
    leads: bookButton,
    trials: bookButton,
  };

  return (
    <section className="relative pt-6 sm:pt-8 pb-16 px-4 sm:px-6 lg:px-10">
      <div className="max-w-6xl mx-auto">
        <WorkspaceTabs />

        {workspace === 'today' ? (
          <>
            <TodayQueue />
            <WorkspaceTiles />
          </>
        ) : (
          <WorkspaceHeader actions={headerActions[workspace]} />
        )}

        {/* ── Today ── Who a seller reports to: the HR shown here is the person
            told when this seller settles a month or asks for an incentive. */}
        <OpsSection id="managers" icon={Users}>
          <TeacherManagers />
        </OpsSection>

        {/* ── Leads ── The day's work, before anything else: six queues, each
            with a verb, plus every lead — so any family can be found and given a
            note and a reminder, not only the ones already in a queue. */}
        <OpsSection id="queues" icon={ListChecks}>
          <SellerQueues />
        </OpsSection>

        {/* §9. What the two write-ups say, turned into an order to ring in. */}
        <OpsSection id="signals" bare>
          <LeadSignalsPanel />
        </OpsSection>

        <OpsSection id="all-leads" bare>
          <SellerLeads onToast={showToast} />
        </OpsSection>

        {/* ── Trials ── A seller is the one who books trials and therefore the
            one who notices a class refusing joiners. Each grade opens up to
            three seats. */}
        <OpsSection id="trial-grades" icon={GraduationCap}>
          <TrialGradesPanel />
        </OpsSection>

        {/* ── Prices ── The ladder HR and the super admin keep in the pricing
            calculator: public price, two offers, the floor. */}
        <OpsSection id="price-list" icon={BadgeIndianRupee}>
          <SellerPriceList />
        </OpsSection>

        {/* ── Payout ── */}
        <OpsSection id="payout" bare>
          <SellerPayout />
        </OpsSection>

        {/* §7. A seller books a trial with no verification code: this is staff
            booking for somebody they have usually just spoken to, and a code
            read down the phone buys nothing. The student's phone number is
            still required — an account nobody can ring is an account nobody
            can chase when the child does not appear. */}
        <BookTrialModal
          open={bookOpen}
          onClose={() => setBookOpen(false)}
          onBooked={(msg) => {
            showToast(msg, 'success');
            attention?.refresh();
            if (workspace === 'today') router.push(sectionHref('seller', 'queues'));
          }}
        />
      </div>

      <DashboardToast toast={toast} />
    </section>
  );
}

export default function SellerWorkspace({ workspace }: { workspace: WorkspaceKey }) {
  return (
    <WorkspaceProvider role="seller" workspace={workspace}>
      <SellerDashboardInner workspace={workspace} />
    </WorkspaceProvider>
  );
}
