'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Mail, Loader2, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { GithubIcon } from '@/components/icons/brand-icons';
import GoogleOneTap from './google-one-tap';
import { HoneypotField } from '@/components/security/honeypot';

/* ===============================================================
   SignInButtons — three sign-in options:
   1. Google (One Tap button)
   2. GitHub (OAuth redirect)
   3. Email + password (form)
   Use as <SignInButtons mode="signin" | "signup" />
=============================================================== */

interface SignInButtonsProps {
  mode?: 'signin' | 'signup';
  onSuccess?: () => void;
  redirectTo?: string;
}

export default function SignInButtons({
  mode = 'signin',
  onSuccess,
  redirectTo = '/',
}: SignInButtonsProps) {
  const supabase = createClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleGitHub = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      });
      if (error) throw error;
      // OAuth redirect happens automatically
    } catch (err) {
      setError(err instanceof Error ? err.message : 'GitHub sign-in failed');
      setSubmitting(false);
    }
  };

  const handleEmail = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    // ── Honeypot check — if the hidden `website` field has any value,
    //    this is a bot auto-filling the form. Silently fake success so
    //    the bot doesn't know it was caught, but don't actually sign in.
    const fd = new FormData(e.currentTarget);
    const honeypot = (fd.get('website') as string | null)?.trim();
    if (honeypot) {
      // Fake delay so it feels real to the bot
      setSubmitting(true);
      await new Promise((r) => setTimeout(r, 800));
      setSubmitting(false);
      // Show "success" message but don't actually authenticate
      if (mode === 'signup') {
        setInfo('Check your email — we sent you a confirmation link. Click it to verify your account.');
      } else {
        onSuccess?.();
      }
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
            data: { provider: 'email' },
          },
        });
        if (error) throw error;
        if (data.user && !data.session) {
          setInfo('Check your email — we sent you a confirmation link. Click it to verify your account.');
        } else if (data.session) {
          onSuccess?.();
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.session) {
          onSuccess?.();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Google One Tap button */}
      <div className="flex justify-center">
        <GoogleOneTap
          showButton
          buttonText={mode === 'signup' ? 'signup_with' : 'signin_with'}
          onSuccess={onSuccess}
          onError={(err) => setError(err)}
        />
      </div>

      {/* GitHub button — outlined so the primary (dark) action stays the
          email submit at the bottom, instead of two competing dark buttons. */}
      <button
        onClick={handleGitHub}
        disabled={submitting}
        className="w-full h-12 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-800 font-bold text-sm flex items-center justify-center gap-2.5 transition-colors disabled:opacity-50"
        style={{ fontFamily: 'var(--font-grotesk)' }}
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <GithubIcon className="w-[18px] h-[18px]" />}
        {mode === 'signup' ? 'Sign up with GitHub' : 'Continue with GitHub'}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>
          or with email
        </span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* Email form */}
      <form onSubmit={handleEmail} className="space-y-3.5">
        <HoneypotField name="website" />
        <div>
          <label htmlFor="auth-email" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50/60 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5"
              style={{ fontFamily: 'var(--font-inter)' }}
            />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="auth-password" className="block text-[11px] font-bold uppercase tracking-wider text-slate-600" style={{ fontFamily: 'var(--font-grotesk)' }}>
              Password
            </label>
            {mode === 'signin' && (
              <Link href="/contact" className="text-[11px] font-bold text-slate-400 hover:text-slate-700 transition-colors" style={{ fontFamily: 'var(--font-grotesk)' }}>
                Forgot?
              </Link>
            )}
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              id="auth-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={mode === 'signup' ? 'At least 6 characters' : '••••••••'}
              required
              minLength={6}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              className="w-full h-12 pl-10 pr-11 rounded-xl border border-slate-200 bg-slate-50/60 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:bg-white focus:border-slate-900 focus:ring-4 focus:ring-slate-900/5"
              style={{ fontFamily: 'var(--font-inter)' }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
            <span>{error}</span>
          </div>
        )}
        {info && (
          <div className="flex items-start gap-2 rounded-xl bg-green-50 border border-green-200 px-3.5 py-2.5 text-xs text-green-700">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-px" />
            <span>{info}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="group w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ fontFamily: 'var(--font-grotesk)' }}
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              {mode === 'signup' ? 'Create account' : 'Sign in'}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
