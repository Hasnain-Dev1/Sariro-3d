'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Phone, Mail, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import { createClient } from '@/lib/supabase/client';

/* ===============================================================
   ProfileCompletionModal
   - Auto-shows when user is logged in but profile_completed = false
   - Asks for missing fields based on provider:
     • Google:   email ✓, name ✓, phone ✗ → ask phone only
     • GitHub:   email ✓ (usually), name ⚠️ → ask name + phone (if missing)
     • Email:    email ✓, name ✗, phone ✗ → ask name + phone
   - Non-dismissable until filled (or "Skip for now" — sets a session flag)
   - On submit → UPDATE profiles SET ... profile_completed = true
=============================================================== */

const SKIP_KEY = 'sariro:profile-completion-skipped';

export default function ProfileCompletionModal() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const supabase = createClient();

  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [emailOverride, setEmailOverride] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  /* Determine which fields are missing */
  const missingName = !profile?.full_name;
  const missingPhone = !profile?.phone;
  const missingEmail = !profile?.email;
  const needsEmailOverride = missingEmail;

  /* Decide whether to show the modal */
  useEffect(() => {
    if (loading || !user || !profile) {
      setOpen(false);
      return;
    }
    if (profile.profile_completed) {
      setOpen(false);
      return;
    }
    // Check session skip flag
    try {
      const skipped = sessionStorage.getItem(SKIP_KEY);
      if (skipped === user.id) {
        setOpen(false);
        return;
      }
    } catch {
      // ignore
    }

    // Only show if there's actually something missing
    if (missingName || missingPhone || missingEmail) {
      // Pre-fill from profile / user metadata
      setFullName(profile.full_name || user.user_metadata?.full_name || user.user_metadata?.name || '');
      setPhone(profile.phone || user.user_metadata?.phone || '');
      setEmailOverride(profile.email || user.email || '');
      setOpen(true);
    }
  }, [loading, user, profile, missingName, missingPhone, missingEmail]);

  /* ---------- Body scroll lock (same as chat bubble + syllabus modal) ---------- */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (open) {
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      const o = {
        overflow: document.body.style.overflow,
        position: document.body.style.position,
        top: document.body.style.top,
        left: document.body.style.left,
        width: document.body.style.width,
      };
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = `-${scrollX}px`;
      document.body.style.width = '100%';
      document.documentElement.setAttribute('data-scroll-locked', 'true');
      window.dispatchEvent(new CustomEvent('sariro:scroll-lock', { detail: { locked: true } }));

      return () => {
        document.body.style.overflow = o.overflow;
        document.body.style.position = o.position;
        document.body.style.top = o.top;
        document.body.style.left = o.left;
        document.body.style.width = o.width;
        document.documentElement.removeAttribute('data-scroll-locked');
        window.dispatchEvent(new CustomEvent('sariro:scroll-lock', { detail: { locked: false } }));
        window.scrollTo(scrollX, scrollY);
      };
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required fields based on what's missing
    if (missingName && !fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (missingPhone && !phone.trim()) {
      setError('Please enter your phone number.');
      return;
    }
    if (needsEmailOverride && !emailOverride.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (needsEmailOverride && !emailOverride.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    setSubmitting(true);
    try {
      const updates: Record<string, string | boolean | null> = {
        profile_completed: true,
      };
      if (missingName) updates.full_name = fullName.trim();
      if (missingPhone) updates.phone = phone.trim();
      if (needsEmailOverride) updates.email = emailOverride.trim();

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user!.id);

      if (updateError) throw updateError;

      // Refresh profile in context
      await refreshProfile();

      setSuccess(true);
      // Auto-close after showing success state
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    if (!user) return;
    try {
      sessionStorage.setItem(SKIP_KEY, user.id);
    } catch {
      // ignore
    }
    setOpen(false);
  };

  const providerLabel = profile?.provider === 'google' ? 'Google' : profile?.provider === 'github' ? 'GitHub' : 'email';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="fixed inset-0 z-[70] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4"
          style={{ overflowY: 'auto', overscrollBehavior: 'contain' }}
          data-lenis-prevent
        >
          <motion.div
            initial={{ scale: 0.92, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, y: 30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 240, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden my-8"
          >
            {/* Header */}
            <div
              className="relative p-6 text-white overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 50%, #1A1611 100%)',
              }}
            >
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage:
                    'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              />
              <div className="relative flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center">
                  <Sparkles className="w-6 h-6" strokeWidth={2.2} />
                </div>
                <div>
                  <div
                    className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70"
                    style={{ fontFamily: 'var(--font-grotesk)' }}
                  >
                    Welcome to Sariro
                  </div>
                  <h2
                    className="text-xl font-extrabold"
                    style={{ fontFamily: 'var(--font-jakarta)' }}
                  >
                    {success ? 'Profile complete!' : 'One last thing…'}
                  </h2>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              {success ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="w-14 h-14 mx-auto text-green-500 mb-3" />
                  <p className="text-sm text-slate-700">
                    You're all set. Welcome to Sariro — let's build something.
                  </p>
                </div>
              ) : (
                <>
                  <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                    You signed in with <strong className="text-slate-900">{providerLabel}</strong>. We just need a couple of details to finish setting up your account.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Name — shown only if missing */}
                    {missingName && (
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
                          Full name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Ada Lovelace"
                            required
                            autoFocus
                            className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            style={{ fontFamily: 'var(--font-inter)' }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Email override — shown only if missing (rare; happens for some GitHub accounts) */}
                    {needsEmailOverride && (
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
                          Email <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="email"
                            value={emailOverride}
                            onChange={(e) => setEmailOverride(e.target.value)}
                            placeholder="you@example.com"
                            required
                            className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            style={{ fontFamily: 'var(--font-inter)' }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">
                          We couldn't fetch an email from {providerLabel} — please enter one so we can reach you.
                        </p>
                      </div>
                    )}

                    {/* Phone — shown only if missing */}
                    {missingPhone && (
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
                          Phone number <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+1 (415) 555-0142"
                            required
                            className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            style={{ fontFamily: 'var(--font-inter)' }}
                          />
                        </div>
                      </div>
                    )}

                    {error && (
                      <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
                        {error}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full h-12 rounded-xl btn-tactile btn-tactile-primary text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      Complete profile
                    </button>

                    <button
                      type="button"
                      onClick={handleSkip}
                      className="w-full text-center text-xs text-slate-400 hover:text-slate-600 transition-colors py-1"
                      style={{ fontFamily: 'var(--font-grotesk)' }}
                    >
                      Skip for now — I'll do this later
                    </button>
                  </form>

                  <p className="text-[10px] text-slate-400 text-center mt-4 leading-relaxed">
                    We use your name and phone only to personalize your cohort experience and notify you about enrollment. We never sell your data.
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
