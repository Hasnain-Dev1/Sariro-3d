'use client';

import { useCallback, useEffect, useState } from 'react';
import { X, Users, Loader2, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

/* ════════════════════════════════════════════════════════════════════════
   AssignTeacherModal — super-admin assigns each teacher one reporting Admin
   and one reporting HR. A student's scope follows their teacher (no separate
   assignment). Writes via POST /api/admin/assign-manager.
   ════════════════════════════════════════════════════════════════════════ */

interface Person { id: string; full_name: string | null }
interface Teacher extends Person { reporting_admin_id: string | null; reporting_hr_id: string | null }

export default function AssignTeacherModal({
  open, onClose, onToast,
}: { open: boolean; onClose: () => void; onToast?: (msg: string, kind?: 'success' | 'error') => void }) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [admins, setAdmins] = useState<Person[]>([]);
  const [hrs, setHrs] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const sb = createClient();
    const [tRes, aRes, hRes] = await Promise.all([
      sb.from('profiles').select('id, full_name, reporting_admin_id, reporting_hr_id').or('role.eq.teacher,is_teacher.eq.true').order('full_name'),
      sb.from('profiles').select('id, full_name').or('role.eq.admin,role.eq.super_admin,is_admin.eq.true,is_super_admin.eq.true').order('full_name'),
      sb.from('profiles').select('id, full_name').or('role.eq.hr,is_hr.eq.true').order('full_name'),
    ]);
    setTeachers((tRes.data ?? []) as Teacher[]);
    setAdmins((aRes.data ?? []) as Person[]);
    setHrs((hRes.data ?? []) as Person[]);
    setLoading(false);
  }, []);

  useEffect(() => { if (open) Promise.resolve().then(load); }, [open, load]);

  const assign = async (teacherId: string, field: 'admin' | 'hr', managerId: string | null) => {
    setBusyId(teacherId + field);
    try {
      const res = await fetch('/api/admin/assign-manager', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacherId, field, managerId }),
      });
      const json = await res.json();
      if (json.ok) { onToast?.(`Reporting ${field.toUpperCase()} updated`); await load(); }
      else onToast?.(json.error || 'Update failed', 'error');
    } catch { onToast?.('Network error', 'error'); }
    finally { setBusyId(null); }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>Assign Teacher</h3>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400" aria-label="Refresh"><RefreshCw className="w-4 h-4" /></button>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400" aria-label="Close"><X className="w-4 h-4" /></button>
          </div>
        </div>
        <p className="text-xs text-slate-500 mb-4">Give each teacher one reporting Admin (scheduling) and one reporting HR (payouts, leave). Students follow their teacher.</p>

        {loading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
        ) : teachers.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-10">No teachers found.</p>
        ) : (
          <div className="space-y-3">
            {teachers.map((t) => (
              <div key={t.id} className="rounded-xl border border-slate-200 p-3">
                <p className="font-bold text-slate-900 mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>{t.full_name || 'Unnamed'}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className="block">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>Reporting Admin</span>
                    <select
                      value={t.reporting_admin_id ?? ''} disabled={busyId === t.id + 'admin'}
                      onChange={(e) => assign(t.id, 'admin', e.target.value || null)}
                      className="mt-1 w-full min-h-[38px] px-2 rounded-lg border border-slate-200 text-sm bg-white">
                      <option value="">— Unassigned —</option>
                      {admins.map((a) => <option key={a.id} value={a.id}>{a.full_name || 'Unnamed'}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>Reporting HR</span>
                    <select
                      value={t.reporting_hr_id ?? ''} disabled={busyId === t.id + 'hr'}
                      onChange={(e) => assign(t.id, 'hr', e.target.value || null)}
                      className="mt-1 w-full min-h-[38px] px-2 rounded-lg border border-slate-200 text-sm bg-white">
                      <option value="">— Unassigned —</option>
                      {hrs.map((h) => <option key={h.id} value={h.id}>{h.full_name || 'Unnamed'}</option>)}
                    </select>
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
