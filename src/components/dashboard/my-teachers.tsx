'use client';

import { useCallback, useEffect, useState } from 'react';
import { Users, Loader2, Mail } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { createClient } from '@/lib/supabase/client';

/* ════════════════════════════════════════════════════════════════════════
   MyTeachers — the teachers reporting to the signed-in Admin or HR.
   `field='admin'` filters by reporting_admin_id; `field='hr'` by reporting_hr_id.
   ════════════════════════════════════════════════════════════════════════ */
interface Teacher { id: string; full_name: string | null; email: string | null; teacher_tier: number | null }

export default function MyTeachers({ field }: { field: 'admin' | 'hr' }) {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const sb = createClient();
    const col = field === 'admin' ? 'reporting_admin_id' : 'reporting_hr_id';
    const { data } = await sb
      .from('profiles')
      .select('id, full_name, email, teacher_tier')
      .eq(col, user.id)
      .order('full_name', { ascending: true });
    setTeachers((data ?? []) as Teacher[]);
    setLoading(false);
  }, [user, field]);

  useEffect(() => { Promise.resolve().then(load); }, [load]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
          My Teachers <span className="text-sm font-semibold text-slate-400">({teachers.length})</span>
        </h2>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-slate-300" /></div>
      ) : teachers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center">
          <p className="text-sm text-slate-500">No teachers assigned to you yet. A super-admin assigns teachers via “Assign Teacher”.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {teachers.map((t) => (
            <div key={t.id} className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-slate-900 truncate" style={{ fontFamily: 'var(--font-jakarta)' }}>{t.full_name || 'Unnamed'}</p>
                {t.email && <p className="text-xs text-slate-400 truncate flex items-center gap-1"><Mail className="w-3 h-3" /> {t.email}</p>}
              </div>
              <span className="shrink-0 text-[10px] font-bold px-2 py-1 rounded uppercase bg-slate-100 text-slate-600" style={{ fontFamily: 'var(--font-grotesk)' }}>
                Tier {t.teacher_tier ?? 3}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
