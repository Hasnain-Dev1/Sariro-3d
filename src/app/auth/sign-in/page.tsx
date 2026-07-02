'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { GraduationCap, ArrowRight, LogIn, Zap } from 'lucide-react';
import SignInButtons from '@/components/auth/sign-in-buttons';
import { useAuth } from '@/components/auth/auth-provider';
import { BRAND } from '@/lib/sariro-data';

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const next = searchParams.get('next') || '/';

  useEffect(() => {
    if (!loading && user) {
      router.replace(next);
    }
  }, [loading, user, router, next]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)' }}>
      {/* Decorative orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-blue-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-violet-600/15 blur-[120px] pointer-events-none" />
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Brand */}
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <GraduationCap className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-extrabold text-xl text-white" style={{ fontFamily: 'var(--font-jakarta)' }}>
              {BRAND.name}
            </div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400 font-semibold" style={{ fontFamily: 'var(--font-grotesk)' }}>
              AI Education
            </div>
          </div>
        </Link>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
          {/* Header — distinct for sign-in */}
          <div className="mb-6 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-100 mb-4">
              <LogIn className="w-7 h-7 text-blue-600" strokeWidth={2.2} />
            </div>
            <h1
              className="text-2xl font-extrabold text-slate-900 mb-2"
              style={{ fontFamily: 'var(--font-jakarta)' }}
            >
              Welcome back.
            </h1>
            <p className="text-sm text-slate-500">
              Sign in to pick up where you left off.
            </p>
          </div>

          <SignInButtons mode="signin" redirectTo={next} />

          <div className="mt-6 text-center text-sm text-slate-500">
            New to Sariro?{' '}
            <Link
              href={`/auth/sign-up${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`}
              className="font-bold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              Create an account
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <p className="text-center text-[10px] text-slate-500 mt-6 leading-relaxed">
          By signing in you agree to our{' '}
          <Link href="/terms" className="underline hover:text-slate-300">Terms</Link> and{' '}
          <Link href="/privacy" className="underline hover:text-slate-300">Privacy Policy</Link>.
          We never sell your data.
        </p>
      </div>
    </div>
  );
}
