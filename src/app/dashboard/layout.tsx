import type { ReactNode } from 'react';
import PhoneGate from '@/components/auth/phone-gate';

/**
 * SARIRO — every page under /dashboard
 * ============================================================================
 * The once-only phone check (lib/phone/gate.ts) sits here rather than only in
 * DashboardLayout, because not every dashboard page uses that shell — the
 * leaderboard, lessons, support and doubt-session pages render on their own —
 * and "no dashboard without a proved phone" has to mean all of them.
 */
export default function DashboardRootLayout({ children }: { children: ReactNode }) {
  return (
    <PhoneGate
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="text-center">
            <div className="w-10 h-10 border-3 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-slate-500">Loading your dashboard...</p>
          </div>
        </div>
      }
    >
      {children}
    </PhoneGate>
  );
}
