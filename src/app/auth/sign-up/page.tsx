'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { GraduationCap, ArrowRight, UserPlus, CheckCircle2, Sparkles } from 'lucide-react';
import SignInButtons from '@/components/auth/sign-in-buttons';
import { useAuth } from '@/components/auth/auth-provider';
import { BRAND } from '@/lib/sariro-data';

export default function SignUpPage() {
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #0F172A 100%)' }}>
      {/* Decorative orbs — violet/amber for sign-up (distinct from sign-in's blue) */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-violet-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />
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
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-6">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-amber-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
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
          {/* Header — distinct for sign-up: marketing-focused */}
          <div className="mb-5 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-violet-100 mb-4">
              <UserPlus className="w-7 h-7 text-violet-600" strokeWidth={2.2} />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider mb-3" style={{ fontFamily: 'var(--font-grotesk)' }}>
              <Sparkles className="w-3 h-3" />
              Summer 2026 cohorts open
            </div>
            <h1
              className="text-2xl font-extrabold text-slate-900 mb-2"
              style={{ fontFamily: 'var(--font-jakarta)' }}
            >
              Become a Sariro builder.
            </h1>
            <p className="text-sm text-slate-500">
              Free account. No credit card. Start building on day one.
            </p>
          </div>

          {/* Benefits — only on sign-up (makes it visually distinct) */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            {[
              { icon: '🎓', label: 'Live cohorts' },
              { icon: '🚀', label: 'Ship projects' },
              { icon: '🤝', label: 'Lifetime community' },
            ].map((b) => (
              <div key={b.label} className="rounded-xl bg-slate-50 border border-slate-100 p-2.5 text-center">
                <div className="text-lg mb-0.5">{b.icon}</div>
                <div className="text-[10px] font-bold text-slate-600" style={{ fontFamily: 'var(--font-grotesk)' }}>
                  {b.label}
                </div>
              </div>
            ))}
          </div>

          <SignInButtons mode="signup" redirectTo={next} />

          <div className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link
              href={`/auth/sign-in${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`}
              className="font-bold text-violet-600 hover:text-violet-700 inline-flex items-center gap-1"
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              Sign in
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <p className="text-center text-[10px] text-slate-500 mt-6 leading-relaxed">
          By creating an account you agree to our{' '}
          <Link href="/terms" className="underline hover:text-slate-300">Terms</Link> and{' '}
          <Link href="/privacy" className="underline hover:text-slate-300">Privacy Policy</Link>.
          We never sell your data.
        </p>
      </div>
    </div>
  );
}
