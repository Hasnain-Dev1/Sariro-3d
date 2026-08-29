'use client';

import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * SARIRO — Dashboard toast
 * =========================================================
 * Feedback that an action worked, extracted so every dashboard says so the same
 * way.
 *
 * It exists because the seller dashboard had none. Its toast handler was
 * literally `console.log`, so a seller could update a lead, close a deal, change
 * a status — and the screen would not acknowledge any of it. Every action felt
 * like it might have failed, which is the most corrosive thing an internal tool
 * can do to the person using it all day.
 *
 * Extracted rather than copied. The admin dashboard already had this markup, and
 * duplicating it into seller is how two toasts drift into two different shapes,
 * two different durations, and eventually two different ideas of what "error"
 * looks like.
 */

export interface ToastState {
  type: 'success' | 'error';
  message: string;
}

/** Auto-dismissing toast state, ready to hand to `<DashboardToast />`. */
export function useDashboardToast(dismissAfterMs = 3000) {
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), dismissAfterMs);
    return () => clearTimeout(t);
  }, [toast, dismissAfterMs]);

  /**
   * Matches the `(message, kind?) => void` signature the existing panels already
   * fire, so a component can be dropped into any dashboard without an adapter.
   */
  const showToast = useCallback((message: string, kind: 'success' | 'error' = 'success') => {
    setToast({ type: kind, message });
  }, []);

  return { toast, showToast, setToast };
}

export default function DashboardToast({ toast }: { toast: ToastState | null }) {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          // Announced to screen readers as well as shown: a confirmation nobody
          // can perceive is the same as no confirmation.
          role="status"
          aria-live="polite"
          className={`fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-[90] px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 ${
            toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
          }`}
          style={{ fontFamily: 'var(--font-grotesk)' }}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span className="text-sm font-bold">{toast.message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
