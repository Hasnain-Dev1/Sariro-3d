'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth, getRole } from '@/components/auth/auth-provider';

export default function DashboardRouter() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace('/auth/sign-in?next=/dashboard'); return; }
    const role = getRole(profile);
    switch (role) {
      case 'super_admin': router.replace('/dashboard/super-admin'); break;
      case 'admin': router.replace('/dashboard/admin'); break;
      case 'teacher': router.replace('/dashboard/teacher'); break;
      default: router.replace('/dashboard/student'); break;
    }
  }, [user, profile, loading, router]);
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-sm text-slate-500">Loading your dashboard...</p>
      </div>
    </div>
  );
}
