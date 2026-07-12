'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Globe, LogOut } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';

/**
 * Dashboard error boundary — catches errors inside /dashboard/* only.
 * Offers three recovery paths:
 *   - Try again (re-render)
 *   - Back to website (public site)
 *   - Sign out and re-login (clears stale session state)
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const { signOut } = useAuth();

  useEffect(() => {
    console.error('[dashboard error boundary]', error);
  }, [error]);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.warn('[dashboard error] signOut failed:', err);
    } finally {
      router.push('/auth/sign-in');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <main className="flex-1 flex items-center justify-center px-5 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative max-w-lg w-full text-center bg-white rounded-2xl border border-slate-200 shadow-xl p-8 sm:p-10"
        >
          <motion.div
            initial={{ scale: 0.8, rotate: -8 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
            className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-amber-500/30"
          >
            <AlertTriangle className="w-8 h-8 text-white" strokeWidth={2.5} />
          </motion.div>

          <h1
            className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2"
            style={{ fontFamily: 'var(--font-jakarta)' }}
          >
            Something went wrong
          </h1>
          <p className="text-sm text-slate-600 mb-2 max-w-md mx-auto">
            The dashboard hit an unexpected error. Your data is safe. Try again, head back to the public website, or sign out and back in to refresh your session.
          </p>
          {error?.digest && (
            <p className="text-xs text-slate-400 mt-1 mb-6 font-mono">
              Error ID: {error.digest}
            </p>
          )}

          <div className="flex flex-col gap-3 justify-center mt-6">
            <button
              onClick={reset}
              className="btn-tactile btn-tactile-primary px-6 py-3.5 text-sm inline-flex items-center justify-center gap-2 min-h-[44px]"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href="/"
                className="btn-tactile btn-tactile-light px-6 py-3.5 text-sm inline-flex items-center justify-center gap-2 min-h-[44px]"
              >
                <Globe className="w-4 h-4" />
                Back to website
              </Link>
              <button
                onClick={handleSignOut}
                className="btn-tactile btn-tactile-light px-6 py-3.5 text-sm inline-flex items-center justify-center gap-2 text-red-600 min-h-[44px]"
              >
                <LogOut className="w-4 h-4" />
                Sign out and re-login
              </button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
