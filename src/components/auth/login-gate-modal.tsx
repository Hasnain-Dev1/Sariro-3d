'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { X, GraduationCap, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';

interface LoginGateModalProps {
  open: boolean;
  onClose: () => void;
  nextPath: string;
  courseName?: string;
}

export function LoginGateModal({ open, onClose, nextPath, courseName }: LoginGateModalProps) {
  const signInHref = `/auth/sign-in?next=${encodeURIComponent(nextPath)}`;
  const signUpHref = `/auth/sign-up?next=${encodeURIComponent(nextPath)}`;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[75] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 20, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="relative p-6 text-white overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 50%, #0F172A 100%)' }}
            >
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="relative flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center">
                  <GraduationCap className="w-6 h-6" strokeWidth={2.2} />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70" style={{ fontFamily: 'var(--font-grotesk)' }}>
                    Almost there
                  </div>
                  <h2 className="text-xl font-extrabold" style={{ fontFamily: 'var(--font-jakarta)' }}>
                    Create your free account
                  </h2>
                </div>
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                You'll need an account to access your course after purchase — your enrollment, schedule, and Google Meet links all live in your dashboard.
              </p>
              {courseName && (
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 mb-4">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-0.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
                    Enrolling in
                  </div>
                  <div className="text-sm font-bold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
                    {courseName}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Link
                  href={signUpHref}
                  className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                  style={{ fontFamily: 'var(--font-grotesk)' }}
                >
                  <Sparkles className="w-4 h-4" />
                  Create free account
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href={signInHref}
                  className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                  style={{ fontFamily: 'var(--font-grotesk)' }}
                >
                  I already have an account
                </Link>
              </div>
              <div className="mt-4 flex items-center justify-center gap-3 text-[10px] text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Secure
                </span>
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Free · No credit card to sign up
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
