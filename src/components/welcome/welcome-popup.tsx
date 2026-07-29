'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { X, Sparkles, ArrowRight, Rocket } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';

const LOCAL_DISMISS_KEY = 'sariro-welcome-dismissed';
const SESSION_CLOSE_KEY = 'sariro-welcome-session-closed';
const TRIGGER_DELAY_MS = 6000;

export default function WelcomePopup() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (user) return;

    try {
      if (localStorage.getItem(LOCAL_DISMISS_KEY)) return;
    } catch {}
    try {
      if (sessionStorage.getItem(SESSION_CLOSE_KEY)) return;
    } catch {}

    const timer = setTimeout(() => setOpen(true), TRIGGER_DELAY_MS);
    return () => clearTimeout(timer);
  }, [user, authLoading]);

  const handleYes = () => {
    try { localStorage.setItem(LOCAL_DISMISS_KEY, 'converted'); } catch {}
    setOpen(false);
    router.push('/welcome');
  };

  const handleMaybeLater = () => {
    try { localStorage.setItem(LOCAL_DISMISS_KEY, 'maybe-later'); } catch {}
    setOpen(false);
  };

  const handleClose = () => {
    try { sessionStorage.setItem(SESSION_CLOSE_KEY, '1'); } catch {}
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="welcome-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{
            paddingTop: 'env(safe-area-inset-top, 0px)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        >
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-md" onClick={handleClose} aria-hidden="true" />

          <motion.div
            key="welcome-card"
            initial={{ y: 60, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 220, damping: 24 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="welcome-popup-title"
            className="relative w-full sm:max-w-md bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-white/10"
          >
            <div
              className="absolute -top-20 left-1/2 -translate-x-1/2 w-[300px] h-[200px] rounded-full blur-[80px] opacity-40 pointer-events-none"
              style={{ background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 50%, #F59E0B 100%)' }}
            />

            <button
              onClick={handleClose}
              aria-label="Close (will show again on reload)"
              className="absolute top-3 right-3 z-10 w-12 h-12 sm:w-9 sm:h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all touch-manipulation"
              style={{ minHeight: '44px', minWidth: '44px' }}
            >
              <X className="w-5 h-5" strokeWidth={2.5} />
            </button>

            <div className="relative p-6 sm:p-8 text-center">
              <motion.div
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center mx-auto mb-4 shadow-lg"
              >
                <Rocket className="w-8 h-8 text-slate-900" strokeWidth={2.4} />
              </motion.div>

              <h2 id="welcome-popup-title" className="text-2xl font-extrabold text-white mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>
                Wanna Take a Demo Lesson?
              </h2>
              <p className="text-sm text-slate-300 mb-1">
                Try Sariro for free — meet your teacher, build something real, ask anything.
              </p>
              <p className="text-xs text-slate-400 mb-6">
                No credit card. No commitment. Just 30 minutes that could change everything.
              </p>

              <div className="space-y-2.5">
                <button
                  onClick={handleYes}
                  className="w-full min-h-[52px] rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-900 text-base font-extrabold flex items-center justify-center gap-2 shadow-lg transition-all touch-manipulation"
                  style={{ fontFamily: 'var(--font-grotesk)' }}
                >
                  <Sparkles className="w-5 h-5" />
                  Yes, take a demo
                  <ArrowRight className="w-5 h-5" />
                </button>

                <button
                  onClick={handleMaybeLater}
                  className="w-full min-h-[44px] rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white text-sm font-bold transition-all touch-manipulation"
                  style={{ fontFamily: 'var(--font-grotesk)' }}
                >
                  Maybe later
                </button>
              </div>

              <p className="text-[10px] text-slate-500 mt-4">
                Clicking X will show this again on your next visit
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}