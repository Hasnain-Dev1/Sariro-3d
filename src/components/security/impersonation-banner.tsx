'use client';

/**
 * SARIRO — ImpersonationBanner
 *
 * Shows a sticky banner at the top of the page when an admin is signed
 * in as another user. The banner:
 *   - Warns the admin they're impersonating
 *   - Shows the target user's name/email
 *   - Provides an "Exit impersonation" button that POSTs to
 *     /api/admin/exit-impersonation and redirects back to /dashboard
 *
 * The banner reads the impersonation state from the `sariro_impersonator`
 * cookie via a /api/admin/impersonate/status check on mount. We can't
 * read httpOnly cookies from the browser, so we hit a tiny status
 * endpoint that returns { impersonating: boolean, targetName?: string }.
 *
 * Once mounted, the banner stays visible until the admin exits
 * impersonation (which reloads the page).
 */

import { useEffect, useState } from 'react';
import { Shield, X, Loader2 } from 'lucide-react';

interface ImpersonationStatus {
  impersonating: boolean;
  adminEmail?: string;
  targetEmail?: string;
  targetName?: string;
  startedAt?: string;
}

export function ImpersonationBanner() {
  const [status, setStatus] = useState<ImpersonationStatus | null>(null);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    // Check impersonation status on mount
    fetch('/api/admin/impersonate', { method: 'GET' })
      .then((r) => r.json())
      .then((data) => {
        if (data.impersonating) {
          setStatus(data);
        }
      })
      .catch(() => {
        // Silent — endpoint might not exist yet, or user isn't impersonating
      });
  }, []);

  const handleExit = async () => {
    setExiting(true);
    try {
      const res = await fetch('/api/admin/exit-impersonation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.ok) {
        window.location.href = data.redirectTo || '/dashboard';
      } else {
        // Force a reload even if exit failed
        window.location.href = '/dashboard';
      }
    } catch {
      window.location.href = '/dashboard';
    } finally {
      setExiting(false);
    }
  };

  if (!status?.impersonating) return null;

  return (
    <div
      className="sticky top-0 z-[60] bg-violet-600 text-white px-4 py-2.5 flex items-center justify-between gap-3 shadow-lg"
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <Shield className="w-4 h-4 shrink-0" />
        <div className="min-w-0 text-sm">
          <span className="font-bold">Impersonating:</span>{' '}
          <span className="truncate">
            {status.targetName || status.targetEmail || 'another user'}
          </span>
          <span className="hidden sm:inline text-violet-200 ml-2">
            · Signed in as {status.adminEmail}
          </span>
        </div>
      </div>
      <button
        onClick={handleExit}
        disabled={exiting}
        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-violet-700 text-xs font-bold hover:bg-violet-50 transition-colors disabled:opacity-50 min-h-[36px]"
      >
        {exiting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <X className="w-3.5 h-3.5" />
        )}
        Exit impersonation
      </button>
    </div>
  );
}
