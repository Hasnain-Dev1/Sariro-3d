'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  DollarSign, TrendingUp, CheckCircle2, Clock, X, Award, Coins, ArrowRight, Plane, Layers, ShieldAlert,
  Receipt, ScrollText, Banknote, Calculator, FileText, Inbox, BatteryLow, ClipboardList, CalendarClock, Landmark,
} from 'lucide-react';
import DashboardToast, { useDashboardToast } from '@/components/dashboard/dashboard-toast';
import { createClient } from '@/lib/supabase/client';
import { useRealtime } from '@/lib/dashboard/use-realtime';
import SalesEarningsReport from '@/components/dashboard/sales-earnings-report';
import MyTeachers from '@/components/dashboard/my-teachers';
import CatchUpCompliancePanel from '@/components/dashboard/catchup-compliance-panel';
import CapabilityChips from '@/components/dashboard/capability-chips';
import type { TeacherAssignmentRow } from '@/lib/dashboard/teacher-capability';
import PaymentRequestsPanel from '@/components/dashboard/payment-requests-panel';
import ExpensesPanel from '@/components/dashboard/expenses-panel';
import PolicyFlagsPanel from '@/components/dashboard/policy-flags-panel';
import CreditRequestsPanel from '@/components/dashboard/credit-requests-panel';
import InvoiceWorkspace from '@/components/dashboard/invoice-workspace';
import SalesLedgerPanel from '@/components/dashboard/sales-ledger-panel';
import UnrecordedInvoicesPanel from '@/components/dashboard/unrecorded-invoices-panel';
import HrSalesPanel from '@/components/dashboard/hr-sales-panel';
import LowCreditPanel from '@/components/dashboard/low-credit-panel';
import CertificatesPanel from '@/components/dashboard/certificates-panel';
import PricingWorkbench from '@/components/dashboard/pricing/pricing-workbench';
import PaymentLinksSection from '@/components/dashboard/payment-link-panel';
import BankAccountsPanel from '@/components/dashboard/bank-accounts-panel';
import GstSummaryPanel from '@/components/dashboard/gst-summary-panel';
import TodayQueue from '@/components/ops/today-queue';
import { useAttention } from '@/components/ops/attention-provider';
import { WorkspaceProvider, OpsSection, useShows, useOpsDo } from '@/components/ops/workspace';
import { WorkspaceTabs, WorkspaceHeader, WorkspaceTiles, WorkspaceAction } from '@/components/ops/workspace-chrome';
import { HR_LEGACY_TABS, type WorkspaceKey } from '@/lib/ops/workspaces';

/**
 * SARIRO — HR's dashboard, one workspace at a time
 * ============================================================================
 * It was one page of fourteen tabs, and the thing HR opened it for was usually
 * three tabs away from the thing they had open. Now: Today (the queue and the
 * month in four numbers), Teachers, Pay, Students and Sales — each its own
 * address, the same shape as every other dashboard, with ⌘K reaching any
 * section and the Today queue linking straight to the one that needs HR.
 *
 * The page lists every section once; lib/ops/workspaces.ts decides where each
 * appears. Tables are only read for the workspace on screen.
 */

function HrDashboardInner({ workspace }: { workspace: WorkspaceKey }) {
  const router = useRouter();
  const attention = useAttention();
  const { toast, showToast } = useDashboardToast();
  const [showSales, setShowSales] = useState(false);

  const [earnings, setEarnings] = useState<TeacherEarning[]>([]);
  const [settlements, setSettlements] = useState<TeacherSettlement[]>([]);
  const [incentives, setIncentives] = useState<TeacherIncentive[]>([]);
  const [leaves, setLeaves] = useState<TeacherLeave[]>([]);
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  /* §4. HR's table listed a tier and nothing about what the teacher can
     actually teach — the one thing you need when deciding who covers a class.
     Fetched separately rather than joined, so a missing table cannot take the
     whole HR dashboard down with it. */
  const [assignments, setAssignments] = useState<Map<string, TeacherAssignmentRow[]>>(new Map());
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  /* Old tab links — notifications, bookmarks — land on the section that holds
     what the tab used to show. */
  useEffect(() => {
    if (workspace !== 'today') return;
    const tab = new URLSearchParams(window.location.search).get('tab');
    const to = tab ? HR_LEGACY_TABS[tab] : undefined;
    if (to && to !== '/dashboard/hr') router.replace(to);
  }, [workspace, router]);

  useOpsDo({ 'earnings-report': () => setShowSales(true) });

  /* Every hook called every render — a `||` in front of one would skip it. */
  const showsSummary = useShows('summary');
  const showsEarnings = useShows('earnings');
  const showsIncentives = useShows('incentives');
  const showsLeave = useShows('leave');
  const needEarnings = showsSummary || showsEarnings;
  const needIncentives = showsSummary || showsIncentives;
  const needLeaves = showsSummary || showsLeave;
  const needSettlements = useShows('settlements');
  const needTeachers = useShows('tiers');
  const needStudents = useShows('credit-adjust');

  const loadAll = useCallback(async () => {
    const supabase = createClient();
    const tasks: Promise<void>[] = [];
    const run = (fn: () => Promise<void>) => tasks.push(fn().catch((err) => console.warn('[hr] load error:', err)));

    if (needEarnings) run(async () => {
      const { data } = await supabase.from('teacher_earnings').select('*, teacher:profiles!teacher_id(full_name, email, teacher_tier)').order('created_at', { ascending: false }).limit(100);
      setEarnings((data ?? []) as unknown as TeacherEarning[]);
    });
    if (needSettlements) run(async () => {
      const { data } = await supabase.from('teacher_settlements').select('*, teacher:profiles!teacher_id(full_name, email)').order('created_at', { ascending: false }).limit(50);
      setSettlements((data ?? []) as unknown as TeacherSettlement[]);
    });
    if (needIncentives) run(async () => {
      const { data } = await supabase.from('teacher_incentives').select('*, teacher:profiles!teacher_id(full_name, email)').order('created_at', { ascending: false }).limit(50);
      setIncentives((data ?? []) as unknown as TeacherIncentive[]);
    });
    if (needLeaves) run(async () => {
      const { data } = await supabase.from('teacher_leaves').select('*, teacher:profiles!teacher_id(full_name, email)').order('created_at', { ascending: false }).limit(50);
      setLeaves((data ?? []) as unknown as TeacherLeave[]);
    });
    if (needTeachers) run(async () => {
      const { data } = await supabase.from('profiles').select('id, full_name, email, teacher_tier').or('role.eq.teacher,is_teacher.eq.true').order('full_name', { ascending: true });
      setTeachers((data ?? []) as unknown as TeacherProfile[]);
      try {
        const { data: rows } = await supabase.from('teacher_course_assignments').select('teacher_id, track, level, training_completed_at');
        const map = new Map<string, TeacherAssignmentRow[]>();
        for (const r of rows ?? []) {
          const list = map.get(r.teacher_id as string) ?? [];
          list.push({ track: r.track as string, level: r.level as string, training_completed_at: (r.training_completed_at as string | null) ?? null });
          map.set(r.teacher_id as string, list);
        }
        setAssignments(map);
      } catch { /* chips simply do not render */ }
    });
    if (needStudents) run(async () => {
      const { data } = await supabase.from('profiles').select('id, full_name, email, student_tier').or('role.eq.student,is_student.eq.true').order('full_name', { ascending: true }).limit(100);
      setStudents((data ?? []) as unknown as StudentProfile[]);
    });

    await Promise.all(tasks);
    setLoadingData(false);
  }, [needEarnings, needSettlements, needIncentives, needLeaves, needTeachers, needStudents]);

  useEffect(() => { void loadAll(); }, [loadAll]);

  useRealtime({
    tables: ['teacher_earnings', 'teacher_settlements', 'teacher_incentives', 'teacher_leaves'],
    onRefresh: () => loadAll(),
  });

  const afterChange = () => { void loadAll(); attention?.refresh(); };

  const callHR = async (body: Record<string, unknown>) => {
    const res = await fetch('/api/hr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      showToast(json.error || json.message || 'Action failed', 'error');
      return null;
    }
    showToast('Done', 'success');
    afterChange();
    return json;
  };

  const decideLeave = async (id: string, action: 'approve' | 'reject') => {
    const res = await fetch('/api/admin/leaves', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, leave_id: id }),
    });
    const json = await res.json();
    if (json.ok) { showToast(action === 'approve' ? 'Leave approved' : 'Leave rejected', 'success'); afterChange(); }
    else showToast(json.error || 'Failed', 'error');
  };

  const pendingEarnings = earnings.filter((e) => e.status === 'pending');
  const totalPending = pendingEarnings.reduce((sum, e) => sum + Number(e.net_amount || e.amount), 0);
  const totalSettled = earnings.filter((e) => e.status === 'settled').reduce((sum, e) => sum + Number(e.net_amount || e.amount), 0);
  const pendingIncentives = incentives.filter((i) => i.status === 'requested');
  const pendingLeaves = leaves.filter((l) => l.status === 'pending');

  const reportButton = <WorkspaceAction icon={TrendingUp} primary onClick={() => setShowSales(true)}>Earnings &amp; sales report</WorkspaceAction>;
  const headerActions: Partial<Record<WorkspaceKey, ReactNode>> = { pay: reportButton, sales: reportButton };

  const loadingCard = (
    <div className="card-3d p-6 flex items-center justify-center text-sm text-slate-400">Loading…</div>
  );

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

        {/* ── Today ── */}
        <OpsSection id="summary" icon={DollarSign}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={<DollarSign className="w-5 h-5" />} color="amber" value={loadingData ? '…' : `₹${totalPending.toFixed(0)}`} label="Pending payout" />
            <StatCard icon={<CheckCircle2 className="w-5 h-5" />} color="green" value={loadingData ? '…' : `₹${totalSettled.toFixed(0)}`} label="Settled" />
            <StatCard icon={<Clock className="w-5 h-5" />} color="blue" value={loadingData ? '…' : pendingIncentives.length} label="Incentive requests" />
            <StatCard icon={<Award className="w-5 h-5" />} color="violet" value={loadingData ? '…' : pendingLeaves.length} label="Leave requests" />
          </div>
          <button
            onClick={() => setShowSales(true)}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-bold min-h-[44px]"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            <TrendingUp className="w-4 h-4" /> Earnings &amp; sales report
          </button>
        </OpsSection>

        {/* ── Teachers ── */}
        <OpsSection id="leave" icon={Plane}>
          {loadingData ? loadingCard : pendingLeaves.length === 0 ? (
            <p className="card-3d p-5 text-sm text-slate-500">No leave is waiting on you.</p>
          ) : (
            <div className="space-y-2">
              {pendingLeaves.map((l) => {
                const tname = (l as { teacher?: { full_name: string | null } }).teacher?.full_name ?? 'Unknown';
                return (
                  <div key={l.id} className="card-3d p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>{tname}</p>
                      <p className="text-xs text-slate-500">{new Date(l.leave_date).toLocaleDateString()} · {l.reason}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => void decideLeave(l.id, 'approve')} className="min-h-[40px] px-3 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold touch-manipulation">Approve</button>
                      <button onClick={() => void decideLeave(l.id, 'reject')} className="min-h-[40px] px-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold touch-manipulation">Reject</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </OpsSection>

        {/* §49 — "who reports to me", then "did they do what they were asked".
            Teacher-side only: no student names, no balances. */}
        <OpsSection id="my-teachers" bare>
          <MyTeachers field="hr" />
        </OpsSection>

        <OpsSection id="catchup-compliance" icon={CalendarClock}>
          <CatchUpCompliancePanel />
        </OpsSection>

        <OpsSection id="tiers" icon={Layers}>
          {loadingData ? loadingCard : (
            <div className="card-3d p-2 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-2 font-bold text-slate-500">Teacher</th>
                    <th className="text-center py-2 px-2 font-bold text-slate-500">Tier</th>
                    <th className="text-center py-2 px-2 font-bold text-slate-500">1:1 Rate</th>
                    <th className="text-center py-2 px-2 font-bold text-slate-500">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.map((t) => (
                    <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-2 px-2 font-bold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
                        {t.full_name ?? 'Unknown'}
                        <div className="mt-1 font-normal">
                          <CapabilityChips assignments={assignments.get(t.id)} size="sm" max={3} emptyText="no courses" />
                        </div>
                      </td>
                      <td className="text-center py-2 px-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${t.teacher_tier === 1 ? 'bg-amber-100 text-amber-700' : t.teacher_tier === 2 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`} style={{ fontFamily: 'var(--font-grotesk)' }}>
                          Tier {t.teacher_tier ?? 3}
                        </span>
                      </td>
                      <td className="text-center py-2 px-2 text-slate-600">₹{t.teacher_tier === 1 ? 300 : t.teacher_tier === 2 ? 250 : 225}</td>
                      <td className="text-center py-2 px-2">
                        <select
                          value={t.teacher_tier ?? 3}
                          onChange={(e) => callHR({ action: 'set_teacher_tier', teacher_id: t.id, tier: Number(e.target.value) })}
                          className="text-[10px] rounded-lg border border-slate-200 px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-violet-400 min-h-[32px]"
                          style={{ fontFamily: 'var(--font-grotesk)' }}
                        >
                          <option value={1}>Tier 1 (₹300)</option>
                          <option value={2}>Tier 2 (₹250)</option>
                          <option value={3}>Tier 3 (₹225)</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </OpsSection>

        {/* Attempts to move a learner's conversation off the platform. HR owns
            the conversation that follows a repeat. */}
        <OpsSection id="chat-policy" icon={ShieldAlert}>
          <PolicyFlagsPanel />
        </OpsSection>

        {/* ── Pay ── */}
        <OpsSection id="settlements" icon={Banknote}>
          {loadingData ? loadingCard : settlements.length === 0 ? (
            <div className="card-3d p-8 text-center">
              <DollarSign className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No settlements yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {settlements.map((s) => {
                const tname = (s as { teacher?: { full_name: string | null } }).teacher?.full_name ?? 'Unknown';
                const paymentStatus = s.payment_status || 'not_settled';
                const pipeline = ['not_settled', 'teacher_settled', 'admin_settled', 'processing', 'paid'];
                const currentIdx = pipeline.indexOf(paymentStatus);
                return (
                  <div key={s.id} className="card-3d p-4">
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>{tname}</p>
                        <p className="text-xs text-slate-500">{s.total_classes} classes · ₹{Number(s.total_amount).toFixed(0)}</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${
                        paymentStatus === 'paid' ? 'bg-green-100 text-green-700' :
                        paymentStatus === 'processing' ? 'bg-blue-100 text-blue-700' :
                        paymentStatus === 'admin_settled' ? 'bg-violet-100 text-violet-700' :
                        paymentStatus === 'teacher_settled' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-500'
                      }`} style={{ fontFamily: 'var(--font-grotesk)' }}>
                        {paymentStatus.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 mb-3">
                      {pipeline.map((stage, idx) => (
                        <div key={stage} className="flex items-center flex-1">
                          <div className={`w-full h-1.5 rounded-full ${idx <= currentIdx ? 'bg-violet-500' : 'bg-slate-200'}`} />
                          {idx < pipeline.length - 1 && <ArrowRight className="w-3 h-3 text-slate-300 shrink-0 mx-0.5" />}
                        </div>
                      ))}
                    </div>
                    {currentIdx < pipeline.length - 1 && (
                      <button
                        onClick={() => callHR({ action: 'update_payment_status', settlement_id: s.id, payment_status: pipeline[currentIdx + 1] })}
                        className="w-full min-h-[40px] rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold touch-manipulation"
                        style={{ fontFamily: 'var(--font-grotesk)' }}
                      >
                        Advance to: {pipeline[currentIdx + 1].replace(/_/g, ' ')}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </OpsSection>

        <OpsSection id="incentives" icon={Award}>
          {loadingData ? loadingCard : incentives.length === 0 ? (
            <div className="card-3d p-8 text-center">
              <Award className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No incentive requests yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {incentives.map((inc) => {
                const tname = (inc as { teacher?: { full_name: string | null } }).teacher?.full_name ?? 'Unknown';
                return (
                  <div key={inc.id} className="card-3d p-4 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>{tname}</p>
                      <p className="text-xs text-slate-500">₹{Number(inc.amount).toFixed(0)} · {inc.reason}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Requested {new Date(inc.requested_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {inc.status === 'requested' ? (
                        <>
                          <button onClick={() => callHR({ action: 'approve_incentive', incentive_id: inc.id })} className="min-h-[40px] px-3 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold touch-manipulation">Approve</button>
                          <button onClick={() => callHR({ action: 'reject_incentive', incentive_id: inc.id, reason: 'Rejected by HR' })} className="min-h-[40px] px-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold touch-manipulation">Reject</button>
                          <button onClick={() => { const amt = prompt('New amount:', String(inc.amount)); const rsn = prompt('New reason:', inc.reason); if (amt && rsn) callHR({ action: 'edit_incentive', incentive_id: inc.id, amount: Number(amt), reason: rsn }); }} className="min-h-[40px] px-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold touch-manipulation">Edit</button>
                          <button onClick={() => callHR({ action: 'delete_incentive', incentive_id: inc.id })} className="min-h-[40px] px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold touch-manipulation">Delete</button>
                        </>
                      ) : (
                        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${inc.status === 'approved' ? 'bg-green-100 text-green-700' : inc.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`} style={{ fontFamily: 'var(--font-grotesk)' }}>{inc.status}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </OpsSection>

        <OpsSection id="earnings" icon={ClipboardList}>
          {loadingData ? loadingCard : earnings.length === 0 ? (
            <div className="card-3d p-8 text-center">
              <DollarSign className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No earnings yet.</p>
            </div>
          ) : (
            <div className="card-3d p-2 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-2 font-bold text-slate-500">Teacher</th>
                    <th className="text-left py-2 px-2 font-bold text-slate-500 hidden sm:table-cell">Lesson</th>
                    <th className="text-center py-2 px-2 font-bold text-slate-500 hidden md:table-cell">Ratio</th>
                    <th className="text-right py-2 px-2 font-bold text-slate-500 hidden sm:table-cell">Base</th>
                    <th className="text-right py-2 px-2 font-bold text-slate-500 hidden md:table-cell">Penalty</th>
                    <th className="text-right py-2 px-2 font-bold text-slate-500">Net</th>
                    <th className="text-center py-2 px-2 font-bold text-slate-500">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {earnings.slice(0, 20).map((e) => {
                    const tname = (e as { teacher?: { full_name: string | null } }).teacher?.full_name ?? 'Unknown';
                    return (
                      <tr key={e.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-2 px-2 font-bold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>{tname}</td>
                        <td className="py-2 px-2 text-slate-600 hidden sm:table-cell truncate max-w-[120px]">{e.lesson_name ?? '—'}</td>
                        <td className="text-center py-2 px-2 text-slate-500 hidden md:table-cell">{e.ratio ?? '—'}</td>
                        <td className="text-right py-2 px-2 text-slate-600 hidden sm:table-cell">₹{Number(e.base_amount || e.amount).toFixed(0)}</td>
                        <td className="text-right py-2 px-2 hidden md:table-cell">
                          {Number(e.penalty_amount) !== 0 ? <span className="text-red-600 font-bold">₹{Number(e.penalty_amount).toFixed(0)}</span> : '—'}
                        </td>
                        <td className="text-right py-2 px-2 font-bold text-slate-900">₹{Number(e.net_amount || e.amount).toFixed(0)}</td>
                        <td className="text-center py-2 px-2">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${e.status === 'settled' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`} style={{ fontFamily: 'var(--font-grotesk)' }}>{e.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </OpsSection>

        {/* HR records what was spent; signing it off is super_admin's, so no
            approve buttons here. V2 §53. */}
        <OpsSection id="expenses" icon={Receipt}>
          <ExpensesPanel />
        </OpsSection>

        {/* ── Students ── */}
        {/* §50-52. Credits do not move until a decision is made here, and the
            decision writes the transaction that moves them. */}
        <OpsSection id="credit-requests" icon={Coins}>
          <CreditRequestsPanel />
        </OpsSection>

        <OpsSection id="low-credits" icon={BatteryLow}>
          <LowCreditPanel />
        </OpsSection>

        <OpsSection id="credit-adjust" icon={Coins}>
          {loadingData ? loadingCard : <CreditManager students={students} callHR={callHR} />}
        </OpsSection>

        {/* Issue a course certificate when a course is finished, and open any
            certificate to print for a family who asks. */}
        <OpsSection id="certificates" bare>
          <CertificatesPanel />
        </OpsSection>

        {/* Contact messages and bank-transfer requests. Before this they were
            discarded by the form that collected them. */}
        <OpsSection id="enquiries" icon={Inbox}>
          <PaymentRequestsPanel />
        </OpsSection>

        {/* ── Sales ── */}
        {/* First, because it has a deadline: a family has agreed to buy and is
            waiting to be invoiced. Punching the sale is what locks the seller's
            attribution and counts it towards their month. */}
        <OpsSection id="hr-sales" icon={TrendingUp}>
          <HrSalesPanel />
        </OpsSection>

        {/* A branded tax invoice, GST inclusive or exclusive. Stored as text,
            never as a PDF — the document is redrawn from the record. */}
        <OpsSection id="invoices" icon={FileText}>
          <InvoiceWorkspace />
        </OpsSection>

        {/* The gap the ledger cannot close on its own: a sale needs an invoice,
            but an invoice does not need a sale. */}
        <OpsSection id="unrecorded-invoices" title="Invoices not yet in the books" icon={ShieldAlert}>
          <UnrecordedInvoicesPanel />
        </OpsSection>

        <OpsSection id="ledger" icon={ScrollText}>
          <SalesLedgerPanel />
        </OpsSection>

        {/* Output GST on the invoices HR raises, input GST on the expenses HR
            records, and what is left to pay — for filing. */}
        <OpsSection id="gst" icon={Receipt}>
          <GstSummaryPanel />
        </OpsSection>

        {/* A rupee link for a family in India to pay by UPI. HR may go below the
            floor as an exception; the link is flagged when it does. */}
        <OpsSection id="payment-links" icon={Banknote}>
          <PaymentLinksSection staff />
        </OpsSection>

        {/* The accounts checkout's bank-transfer page lists, by country. */}
        <OpsSection id="bank-accounts" icon={Landmark}>
          <BankAccountsPanel />
        </OpsSection>

        {/* Minimum prices, the seller price ladder, and the website's own prices. */}
        <OpsSection id="pricing" icon={Calculator}>
          <PricingWorkbench />
        </OpsSection>
      </div>

      <DashboardToast toast={toast} />
      <SalesEarningsReport open={showSales} onClose={() => setShowSales(false)} onToast={showToast} />
    </section>
  );
}

/**
 * HR's dashboard, one space at a time: Today, Teachers, Pay, Students, Sales.
 * The shell is held by (workspace)/layout.tsx.
 */
export default function HrWorkspace({ workspace }: { workspace: WorkspaceKey }) {
  return (
    <WorkspaceProvider role="hr" workspace={workspace}>
      <HrDashboardInner workspace={workspace} />
    </WorkspaceProvider>
  );
}

/* ───── Credit Manager ───── */
function CreditManager({ students, callHR }: { students: StudentProfile[]; callHR: (body: Record<string, unknown>) => Promise<unknown> }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<StudentProfile | null>(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const filtered = students.filter((s) =>
    !search || (s.full_name?.toLowerCase().includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase()))
  ).slice(0, 10);

  return (
    <div className="card-3d p-4">
      {!selected ? (
        <>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student by name or email..."
            className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
            style={{ fontFamily: 'var(--font-inter)' }}
          />
          <div className="mt-2 space-y-1">
            {filtered.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelected(s)}
                className="block w-full text-left p-2.5 rounded-lg bg-slate-50 hover:bg-violet-50 min-h-[44px] touch-manipulation"
              >
                <p className="text-sm font-bold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>{s.full_name ?? 'Unknown'}</p>
                <p className="text-xs text-slate-500">{s.email}</p>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-bold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>{selected.full_name}</p>
              <p className="text-xs text-slate-500">{selected.email}</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Choose another student">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount (+ to add, - to reduce)"
              className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              style={{ fontFamily: 'var(--font-inter)' }}
            />
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason (required)"
              className="w-full min-h-[44px] rounded-xl border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              style={{ fontFamily: 'var(--font-inter)' }}
            />
            <button
              onClick={async () => {
                if (!amount || !reason.trim()) return;
                await callHR({ action: 'adjust_credits', student_id: selected.id, amount: Number(amount), reason: reason.trim() });
                setAmount(''); setReason(''); setSelected(null);
              }}
              disabled={!amount || !reason.trim()}
              className="w-full min-h-[44px] rounded-xl bg-violet-600 hover:bg-violet-700 disabled:bg-slate-300 text-white text-sm font-bold touch-manipulation"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              Apply Credit Adjustment
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───── Stat Card ───── */
function StatCard({ icon, color, value, label }: { icon: ReactNode; color: 'amber' | 'green' | 'blue' | 'violet'; value: string | number; label: string }) {
  const colors = {
    amber: 'bg-amber-100 text-amber-600',
    green: 'bg-green-100 text-green-600',
    blue: 'bg-blue-100 text-blue-600',
    violet: 'bg-violet-100 text-violet-600',
  };
  return (
    <div className="card-3d p-4">
      <div className={`w-10 h-10 rounded-xl ${colors[color]} flex items-center justify-center mb-2`}>{icon}</div>
      <p className="text-xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>{label}</p>
    </div>
  );
}

/* ───── Types ───── */
interface TeacherEarning {
  id: string; teacher_id: string; booking_id: string | null; class_date: string;
  lesson_name: string | null; track: string | null; level: string | null;
  ratio: string | null; student_count: number | null;
  base_amount: number | string; bonus_amount: number | string;
  penalty_amount: number | string; penalty_reason: string | null;
  net_amount: number | string; amount: number | string;
  status: 'pending' | 'settled'; created_at: string;
}
interface TeacherSettlement {
  id: string; teacher_id: string; total_classes: number;
  total_amount: number | string; status: string; payment_status: string;
  requested_at: string; paid_at: string | null;
}
interface TeacherIncentive {
  id: string; teacher_id: string; amount: number | string; reason: string;
  status: 'requested' | 'approved' | 'rejected' | 'deleted';
  requested_at: string;
}
interface TeacherLeave {
  id: string; teacher_id: string; leave_date: string; reason: string;
  status: 'pending' | 'approved' | 'rejected'; is_free: boolean;
  penalty_amount: number | string;
}
interface TeacherProfile {
  id: string; full_name: string | null; email: string | null; teacher_tier: number | null;
}
interface StudentProfile {
  id: string; full_name: string | null; email: string | null; student_tier: string | null;
}
