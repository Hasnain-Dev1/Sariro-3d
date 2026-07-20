'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Github, Mail, Loader2 } from 'lucide-react';
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

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400" style={{ fontFamily: 'var(--font-grotesk)' }}>
          or continue with
        </span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* GitHub button */}
      <button
        onClick={handleGitHub}
        disabled={submitting}
        className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm flex items-center justify-center gap-2.5 transition-colors disabled:opacity-50"
        style={{ fontFamily: 'var(--font-grotesk)' }}
      >
        {submitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Github className="w-5 h-5" />
        )}
        {mode === 'signup' ? 'Sign up with GitHub' : 'Continue with GitHub'}
      </button>

      {/* Email form */}
      <form onSubmit={handleEmail} className="space-y-3">
        <HoneypotField name="website" />
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            style={{ fontFamily: 'var(--font-inter)' }}
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            className="w-full h-11 px-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            style={{ fontFamily: 'var(--font-inter)' }}
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">
            {error}
          </div>
        )}
        {info && (
          <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-700">
            {info}
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
            <Mail className="w-4 h-4" />
          )}
          {mode === 'signup' ? 'Create account' : 'Sign in with email'}
        </button>
      </form>
    </div>
  );
}
