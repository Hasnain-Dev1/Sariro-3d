'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Rocket, GraduationCap, Sparkles } from 'lucide-react';
import SignInButtons from '@/components/auth/sign-in-buttons';
import AuthShell from '@/components/auth/auth-shell';
import { useAuth } from '@/components/auth/auth-provider';

function SignUpPageInner() {
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
    <AuthShell
      accent={{
        from: '#12082E',
        to: '#4C1D95',
        glow: '#8B5CF6',
        chipBg: 'rgba(245, 158, 11, 0.18)',
        chipText: '#FCD34D',
      }}
      eyebrow="Summer 2026 cohorts open"
      panelTitle={<>Become a builder,<br />not just a user.</>}
      panelSubtitle="Join 5,000+ students learning to think, reason and build with AI — in live cohorts led by real mentors."
      highlights={[
        { icon: GraduationCap, title: 'Live cohort classes', body: 'Small batches with a dedicated mentor.' },
        { icon: Rocket, title: 'Ship real projects', body: 'Every module ends with something you built.' },
        { icon: Sparkles, title: 'Start free', body: 'No credit card. Book a free demo class first.' },
      ]}
      formTitle="Create your account"
      formSubtitle="Free to start. Build something on day one."
      footer={
        <>
          Already have an account?{' '}
          <Link
            href={`/auth/sign-in${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`}
            className="font-bold text-slate-900 hover:text-violet-600 inline-flex items-center gap-1 transition-colors"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            Sign in
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </>
      }
      legalAction="creating an account"
    >
      <SignInButtons mode="signup" redirectTo={next} />
    </AuthShell>
  );
}

export default function SignUpPage() {
  return (
    <Suspense>
      <SignUpPageInner />
    </Suspense>
  );
}
