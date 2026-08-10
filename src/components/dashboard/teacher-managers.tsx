'use client';

import { useEffect, useState } from 'react';
import { Shield, UserCog } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { createClient } from '@/lib/supabase/client';

/* ════════════════════════════════════════════════════════════════════════
   TeacherManagers — shows the teacher their reporting Admin + HR names.
   ════════════════════════════════════════════════════════════════════════ */
export default function TeacherManagers() {
  const { user } = useAuth();
  const [adminName, setAdminName] = useState<string | null>(null);
  const [hrName, setHrName] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const sb = createClient();
      const { data } = await sb
        .from('profiles')
        .select('admin:reporting_admin_id(full_name), hr:reporting_hr_id(full_name)')
        .eq('id', user.id)
        .maybeSingle();
      const admin = (data?.admin as { full_name?: string } | null) ?? null;
      const hr = (data?.hr as { full_name?: string } | null) ?? null;
      setAdminName(admin?.full_name ?? null);
      setHrName(hr?.full_name ?? null);
      setLoaded(true);
    })();
  }, [user]);

  if (!loaded) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-xs font-bold text-blue-700" style={{ fontFamily: 'var(--font-grotesk)' }}>
        <UserCog className="w-3.5 h-3.5" /> Admin: {adminName ?? 'Not assigned yet'}
      </span>
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 border border-violet-200 text-xs font-bold text-violet-700" style={{ fontFamily: 'var(--font-grotesk)' }}>
        <Shield className="w-3.5 h-3.5" /> HR: {hrName ?? 'Not assigned yet'}
      </span>
    </div>
  );
}
