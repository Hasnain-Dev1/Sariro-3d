'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, AlertTriangle } from 'lucide-react';
import { useAuth, getRole } from '@/components/auth/auth-provider';

/**
 * /dashboard — role router
 * Middleware already ensures the user is logged in.
 *
 * SAFETY: If auth doesn't load within 8 seconds, shows a fallback UI
 * with "Refresh page" + "Sign out and go home" + "Back to website"
 * instead of leaving the user stuck on a spinner forever.
 */
const AUTH_TIMEOUT_MS = 8000;

export default function DashboardRouter() {
  const router = useRouter();
  const { user, profile, loading, signOut } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/auth/sign-in?next=/dashboard');
      return;
    }
    const role = getRole(profile);
    switch (role) {
      case 'super_admin': router.replace('/dashboard/super-admin'); break;
      case 'admin': router.replace('/dashboard/admin'); break;
      case 'teacher': router.replace('/dashboard/teacher'); break;
      default: router.replace('/dashboard/student'); break;
    }
  }, [user, profile, loading, router]);

  // Timeout fallback
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => setTimedOut(true), AUTH_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [loading]);

  if (timedOut) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>
            Taking too long to load
          </h1>
          <p className="text-sm text-slate-600 mb-6">
            We're having trouble loading your dashboard. Try refreshing, or sign in again.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full min-h-[44px] px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              Refresh page
            </button>
            <button
              onClick={async () => { await signOut(); router.push('/'); }}
              className="w-full min-h-[44px] px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              Sign out and go home
            </button>
            <Link
              href="/"
              className="w-full min-h-[44px] px-4 py-3 rounded-xl text-slate-500 text-xs font-bold hover:text-slate-700"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              Back to website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-4" />
        <p className="text-sm text-slate-500">Loading your dashboard...</p>
      </div>
    </div>
  );
}
