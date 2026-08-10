'use client';

import { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '@/components/dashboard/dashboard-layout';
import { useAuth } from '@/components/auth/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { useRealtime } from '@/lib/dashboard/use-realtime';
import {
  Loader2, DollarSign, TrendingUp, Users, CheckCircle2, Clock, X,
  Award, Coins, GraduationCap, ArrowRight,
} from 'lucide-react';
import { TRACKS } from '@/lib/sariro-data';
import SalesEarningsReport from '@/components/dashboard/sales-earnings-report';
import MyTeachers from '@/components/dashboard/my-teachers';

export default function HRDashboard() {
  const { user, loading } = useAuth();
  const [earnings, setEarnings] = useState<TeacherEarning[]>([]);
  const [settlements, setSettlements] = useState<TeacherSettlement[]>([]);
  const [incentives, setIncentives] = useState<TeacherIncentive[]>([]);
  const [leaves, setLeaves] = useState<TeacherLeave[]>([]);
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'my_teachers' | 'incentives' | 'payments' | 'credits' | 'tiers'>('overview');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showSales, setShowSales] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const loadAll = useCallback(async () => {
    try {
      const supabase = createClient();
      const [earningsRes, settlementsRes, incentivesRes, leavesRes, teachersRes, studentsRes] = await Promise.all([
        supabase.from('teacher_earnings').select('*, teacher:profiles!teacher_id(full_name, email, teacher_tier)').order('created_at', { ascending: false }).limit(100),
        supabase.from('teacher_settlements').select('*, teacher:profiles!teacher_id(full_name, email)').order('created_at', { ascending: false }).limit(50),
        supabase.from('teacher_incentives').select('*, teacher:profiles!teacher_id(full_name, email)').order('created_at', { ascending: false }).limit(50),
        supabase.from('teacher_leaves').select('*, teacher:profiles!teacher_id(full_name, email)').order('created_at', { ascending: false }).limit(50),
        supabase.from('profiles').select('id, full_name, email, teacher_tier').or('role.eq.teacher,is_teacher.eq.true').order('full_name', { ascending: true }),
        supabase.from('profiles').select('id, full_name, email, student_tier').or('role.eq.student,is_student.eq.true').order('full_name', { ascending: true }).limit(100),
      ]);

      setEarnings((earningsRes.data ?? []) as unknown as TeacherEarning[]);
      setSettlements((settlementsRes.data ?? []) as unknown as TeacherSettlement[]);
      setIncentives((incentivesRes.data ?? []) as unknown as TeacherIncentive[]);
      setLeaves((leavesRes.data ?? []) as unknown as TeacherLeave[]);
      setTeachers((teachersRes.data ?? []) as unknown as TeacherProfile[]);
      setStudents((studentsRes.data ?? []) as unknown as StudentProfile[]);
    } catch (err) {
      console.warn('[hr] load error:', err);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useRealtime({
    tables: ['teacher_earnings', 'teacher_settlements', 'teacher_incentives', 'teacher_leaves'],
    onRefresh: () => loadAll(),
  });

  // API call helper
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
    loadAll();
    return json;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-violet-600" />
      </div>
    );
  }

  // Analytics
  const pendingEarnings = earnings.filter(e => e.status === 'pending');
  const totalPending = pendingEarnings.reduce((sum, e) => sum + Number(e.net_amount || e.amount), 0);
  const totalSettled = earnings.filter(e => e.status === 'settled').reduce((sum, e) => sum + Number(e.net_amount || e.amount), 0);
  const pendingIncentives = incentives.filter(i => i.status === 'requested');
  const pendingLeaves = leaves.filter(l => l.status === 'pending');

  return (
    <DashboardLayout>
      <section className="relative pt-6 sm:pt-10 pb-16 px-4 sm:px-6 lg:px-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1" style={{ fontFamily: 'var(--font-jakarta)' }}>
                HR Dashboard
              </h1>
              <p className="text-sm text-slate-500">
                Teacher earnings, incentives, settlements, credits, and tiers.
              </p>
            </div>
            <button
              onClick={() => setShowSales(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-bold min-h-[44px]"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              <TrendingUp className="w-4 h-4" /> Earnings &amp; Sales
            </button>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatCard icon={<DollarSign className="w-5 h-5" />} color="amber" value={`₹${totalPending.toFixed(0)}`} label="Pending Payout" />
            <StatCard icon={<CheckCircle2 className="w-5 h-5" />} color="green" value={`₹${totalSettled.toFixed(0)}`} label="Settled" />
            <StatCard icon={<Clock className="w-5 h-5" />} color="blue" value={pendingIncentives.length} label="Incentive Requests" />
            <StatCard icon={<Award className="w-5 h-5" />} color="violet" value={pendingLeaves.length} label="Leave Requests" />
          </div>

          {/* Tab bar */}
          <div className="flex border-b border-slate-200 mb-4 overflow-x-auto">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'my_teachers', label: 'My Teachers' },
              { key: 'incentives', label: 'Incentives' },
              { key: 'payments', label: 'Payments' },
              { key: 'credits', label: 'Credits & Tiers' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as 'overview' | 'my_teachers' | 'incentives' | 'payments' | 'credits')}
                className={`min-h-[44px] px-4 text-xs font-bold transition-colors touch-manipulation whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'text-violet-700 border-b-2 border-violet-600'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loadingData ? (
            <div className="card-3d p-8 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
            </div>
          ) : (
            <>
              {/* ─── MY TEACHERS TAB ─── */}
              {activeTab === 'my_teachers' && <MyTeachers field="hr" />}

              {/* ─── OVERVIEW TAB ─── */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Leave approvals */}
                  {pendingLeaves.length > 0 && (
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>
                        Leave Approvals ({pendingLeaves.length})
                      </h2>
                      <div className="space-y-2">
                        {pendingLeaves.map((l) => {
                          const tname = (l as { teacher?: { full_name: string | null } }).teacher?.full_name ?? 'Unknown';
                          return (
                            <div key={l.id} className="card-3d p-4 flex items-center justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>{tname}</p>
                                <p className="text-xs text-slate-500">
                                  {new Date(l.leave_date).toLocaleDateString()} · {l.reason}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  onClick={async () => {
                                    const res = await fetch('/api/admin/leaves', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ action: 'approve', leave_id: l.id }),
                                    });
                                    const json = await res.json();
                                    if (json.ok) { showToast('Leave approved', 'success'); loadAll(); }
                                    else { showToast(json.error || 'Failed', 'error'); }
                                  }}
                                  className="min-h-[40px] px-3 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold touch-manipulation"
                                >Approve</button>
                                <button
                                  onClick={async () => {
                                    const res = await fetch('/api/admin/leaves', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ action: 'reject', leave_id: l.id }),
                                    });
                                    const json = await res.json();
                                    if (json.ok) { showToast('Leave rejected', 'success'); loadAll(); }
                                    else { showToast(json.error || 'Failed', 'error'); }
                                  }}
                                  className="min-h-[40px] px-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold touch-manipulation"
                                >Reject</button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Recent earnings */}
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>
                      Recent Earnings
                    </h2>
                    {earnings.length === 0 ? (
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
                                    {Number(e.penalty_amount) !== 0 ? (
                                      <span className="text-red-600 font-bold">₹{Number(e.penalty_amount).toFixed(0)}</span>
                                    ) : '—'}
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
                  </div>
                </div>
              )}

              {/* ─── INCENTIVES TAB ─── */}
              {activeTab === 'incentives' && (
                <div className="space-y-3">
                  <h2 className="text-lg font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
                    Incentive Management ({incentives.length})
                  </h2>
                  {incentives.length === 0 ? (
                    <div className="card-3d p-8 text-center">
                      <Award className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">No incentive requests yet.</p>
                    </div>
                  ) : (
                    incentives.map((inc) => {
                      const tname = (inc as { teacher?: { full_name: string | null } }).teacher?.full_name ?? 'Unknown';
                      return (
                        <div key={inc.id} className="card-3d p-4 flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>{tname}</p>
                            <p className="text-xs text-slate-500">
                              ₹{Number(inc.amount).toFixed(0)} · {inc.reason}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Requested {new Date(inc.requested_at).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {inc.status === 'requested' && (
                              <>
                                <button onClick={() => callHR({ action: 'approve_incentive', incentive_id: inc.id })} className="min-h-[40px] px-3 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold touch-manipulation">Approve</button>
                                <button onClick={() => callHR({ action: 'reject_incentive', incentive_id: inc.id, reason: 'Rejected by HR' })} className="min-h-[40px] px-3 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold touch-manipulation">Reject</button>
                                <button onClick={() => { const amt = prompt('New amount:', String(inc.amount)); const rsn = prompt('New reason:', inc.reason); if (amt && rsn) callHR({ action: 'edit_incentive', incentive_id: inc.id, amount: Number(amt), reason: rsn }); }} className="min-h-[40px] px-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold touch-manipulation">Edit</button>
                                <button onClick={() => callHR({ action: 'delete_incentive', incentive_id: inc.id })} className="min-h-[40px] px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold touch-manipulation">Delete</button>
                              </>
                            )}
                            {inc.status !== 'requested' && (
                              <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${inc.status === 'approved' ? 'bg-green-100 text-green-700' : inc.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-500'}`} style={{ fontFamily: 'var(--font-grotesk)' }}>{inc.status}</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* ─── PAYMENTS TAB ─── */}
              {activeTab === 'payments' && (
                <div className="space-y-3">
                  <h2 className="text-lg font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
                    Payment Pipeline
                  </h2>
                  {settlements.length === 0 ? (
                    <div className="card-3d p-8 text-center">
                      <DollarSign className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">No settlements yet.</p>
                    </div>
                  ) : (
                    settlements.map((s) => {
                      const tname = (s as { teacher?: { full_name: string | null } }).teacher?.full_name ?? 'Unknown';
                      const paymentStatus = s.payment_status || 'not_settled';
                      const pipeline = ['not_settled', 'teacher_settled', 'admin_settled', 'processing', 'paid'];
                      const currentIdx = pipeline.indexOf(paymentStatus);
                      return (
                        <div key={s.id} className="card-3d p-4">
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>{tname}</p>
                              <p className="text-xs text-slate-500">
                                {s.total_classes} classes · ₹{Number(s.total_amount).toFixed(0)}
                              </p>
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
                          {/* Pipeline visual */}
                          <div className="flex items-center gap-1 mb-3">
                            {pipeline.map((stage, idx) => (
                              <div key={stage} className="flex items-center flex-1">
                                <div className={`w-full h-1.5 rounded-full ${idx <= currentIdx ? 'bg-violet-500' : 'bg-slate-200'}`} />
                                {idx < pipeline.length - 1 && <ArrowRight className="w-3 h-3 text-slate-300 shrink-0 mx-0.5" />}
                              </div>
                            ))}
                          </div>
                          {/* Advance button */}
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
                    })
                  )}
                </div>
              )}

              {/* ─── CREDITS & TIERS TAB ─── */}
              {activeTab === 'credits' && (
                <div className="space-y-6">
                  {/* Credit adjustment */}
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>
                      Credit Management
                    </h2>
                    <CreditManager students={students} callHR={callHR} />
                  </div>

                  {/* Teacher tier management */}
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>
                      Teacher Tiers
                    </h2>
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
                              <td className="py-2 px-2 font-bold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>{t.full_name ?? 'Unknown'}</td>
                              <td className="text-center py-2 px-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${t.teacher_tier === 1 ? 'bg-amber-100 text-amber-700' : t.teacher_tier === 2 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`} style={{ fontFamily: 'var(--font-grotesk)' }}>
                                  Tier {t.teacher_tier ?? 3}
                                </span>
                              </td>
                              <td className="text-center py-2 px-2 text-slate-600">
                                ₹{t.teacher_tier === 1 ? 300 : t.teacher_tier === 2 ? 250 : 225}
                              </td>
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
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Toast */}
        {toast && (
          <div className={`fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-[90] px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 ${toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`} style={{ fontFamily: 'var(--font-grotesk)' }}>
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
            <span className="text-sm font-bold">{toast.message}</span>
          </div>
        )}

        <SalesEarningsReport
          open={showSales}
          onClose={() => setShowSales(false)}
          onToast={(msg, kind) => setToast({ type: kind || 'success', message: msg })}
        />
      </section>
    </DashboardLayout>
  );
}

/* ───── Credit Manager Component ───── */
function CreditManager({ students, callHR }: { students: StudentProfile[]; callHR: (body: Record<string, unknown>) => Promise<unknown> }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<StudentProfile | null>(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const filtered = students.filter(s =>
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
            <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 min-h-[44px] min-w-[44px] flex items-center justify-center">
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
function StatCard({ icon, color, value, label }: { icon: React.ReactNode; color: 'amber' | 'green' | 'blue' | 'violet'; value: string | number; label: string }) {
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