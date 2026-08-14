'use client';

/**
 * Teacher Tiers & Pay — /dashboard/super-admin/teacher-pay  (super-admin only)
 *
 * Edit the per-tier base rates (1:1 + group) + the group bonus — stored in
 * app_settings and read live by the earnings trigger — and set each teacher's
 * tier. Defaults mirror the original hardcoded rates.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Save, DollarSign, Search } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { fetchAllSettings, updateSettings } from '@/lib/dashboard/settings-data';

const RATE_DEFS = [
  { key: 'pay_tier1_1on1', label: 'Tier 1 · 1:1', def: 300 },
  { key: 'pay_tier2_1on1', label: 'Tier 2 · 1:1', def: 250 },
  { key: 'pay_tier3_1on1', label: 'Tier 3 · 1:1', def: 225 },
  { key: 'pay_tier1_group', label: 'Tier 1 · Group', def: 300 },
  { key: 'pay_tier2_group', label: 'Tier 2 · Group', def: 275 },
  { key: 'pay_tier3_group', label: 'Tier 3 · Group', def: 250 },
  { key: 'pay_group_bonus', label: 'Group bonus (4+ kids)', def: 25 },
] as const;

interface Teacher { id: string; full_name: string | null; email: string | null; teacher_tier: number | null }

export default function TeacherPayPage() {
  const supabase = createClient();
  const [rates, setRates] = useState<Record<string, string>>({});
  const [savingRates, setSavingRates] = useState(false);
  const [rateMsg, setRateMsg] = useState<string | null>(null);

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadTeachers = useCallback(async () => {
    const { data } = await supabase.from('profiles')
      .select('id, full_name, email, teacher_tier')
      .or('role.eq.teacher,is_teacher.eq.true').order('full_name');
    setTeachers((data ?? []) as Teacher[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const s = await fetchAllSettings();
      if (cancelled) return;
      const init: Record<string, string> = {};
      for (const r of RATE_DEFS) init[r.key] = s[r.key] ?? String(r.def);
      setRates(init);
      await loadTeachers();
    })();
    return () => { cancelled = true; };
  }, [loadTeachers]);

  const saveRates = async () => {
    setSavingRates(true); setRateMsg(null);
    const res = await updateSettings(rates);
    setSavingRates(false);
    setRateMsg(res.success ? 'Rates saved.' : (res.error || 'Save failed'));
  };

  const setTier = async (teacherId: string, tier: number) => {
    setBusyId(teacherId);
    try {
      const res = await fetch('/api/admin/teacher-tier', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId, tier }),
      });
      const j = await res.json();
      if (j.ok) setTeachers((prev) => prev.map((t) => t.id === teacherId ? { ...t, teacher_tier: tier } : t));
      else alert(j.message || j.error || 'Failed to set tier.');
    } finally { setBusyId(null); }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter((t) => (t.full_name ?? '').toLowerCase().includes(q) || (t.email ?? '').toLowerCase().includes(q));
  }, [teachers, search]);

  return (
    <div className="min-h-[100dvh] bg-slate-50 pb-20 lg:pb-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        <Link href="/dashboard/super-admin" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to dashboard
        </Link>
        <div className="flex items-center gap-2 mb-5">
          <DollarSign className="w-6 h-6 text-green-600" />
          <h1 className="text-2xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>Teacher Tiers &amp; Pay</h1>
        </div>

        {/* Rate editor */}
        <div className="card-3d p-5 mb-6">
          <h3 className="text-sm font-extrabold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>Per-tier rates (₹ / class)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {RATE_DEFS.map((r) => (
              <label key={r.key} className="block text-xs font-bold text-slate-600">
                {r.label}
                <input type="number" min={0} value={rates[r.key] ?? ''} onChange={(e) => setRates((p) => ({ ...p, [r.key]: e.target.value }))}
                  className="mt-1 w-full min-h-[40px] px-3 rounded-lg border border-slate-200 text-sm" />
              </label>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button onClick={saveRates} disabled={savingRates}
              className="inline-flex items-center gap-1.5 min-h-[40px] px-4 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-bold disabled:opacity-50">
              {savingRates ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save rates
            </button>
            {rateMsg && <span className="text-xs font-semibold text-slate-600">{rateMsg}</span>}
          </div>
        </div>

        {/* Teacher tier list */}
        <div className="card-3d p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <h3 className="text-sm font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>Teacher tiers</h3>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search…"
                className="min-h-[38px] pl-9 pr-3 rounded-lg border border-slate-200 text-sm" />
            </div>
          </div>
          {loading ? (
            <div className="flex justify-center py-8 text-slate-400"><Loader2 className="w-5 h-5 animate-spin" /></div>
          ) : (
            <div className="space-y-1">
              {filtered.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 px-2.5 py-2 rounded-lg hover:bg-slate-50">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-800 truncate">{t.full_name || 'Unnamed'}</div>
                    <div className="text-xs text-slate-500 truncate">{t.email || '—'}</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {[1, 2, 3].map((tier) => (
                      <button key={tier} onClick={() => setTier(t.id, tier)} disabled={busyId === t.id}
                        className={`w-9 h-9 rounded-lg text-xs font-bold border-2 transition-colors disabled:opacity-50 ${(t.teacher_tier ?? 3) === tier ? 'border-green-500 bg-green-50 text-green-700' : 'border-slate-200 text-slate-500 hover:border-green-300'}`}>
                        T{tier}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
