'use client';

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, PlayCircle, LineChart, Users } from 'lucide-react';
import SignInButtons from '@/components/auth/sign-in-buttons';
import AuthShell from '@/components/auth/auth-shell';
import { useAuth } from '@/components/auth/auth-provider';

/**
 * Where a person lands after signing in.
 *
 * This was '/' — the marketing homepage — so signing in returned you to the
 * page you had just signed in FROM, with nothing to show it had worked. The
 * dashboard was then reachable only through an avatar menu behind a hamburger.
 *
 * An explicit ?next= still wins: somebody sent here from a checkout or from a
 * gated page is returned to what they were doing. Only the default changes.
 */
const AFTER_SIGN_IN = '/dashboard';

function SignInPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading } = useAuth();
  const next = searchParams.get('next') || AFTER_SIGN_IN;

  useEffect(() => {
    if (!loading && user) {
      router.replace(next);
    }
  }, [loading, user, router, next]);

  return (
    <AuthShell
      accent={{
        from: '#14100C',
        to: '#1E3A8A',
        glow: '#2563EB',
        chipBg: 'rgba(37, 99, 235, 0.18)',
        chipText: '#93C5FD',
      }}
      eyebrow="Welcome back"
      panelTitle={<>Your next class is<br />waiting for you.</>}
      panelSubtitle="Pick up exactly where you left off — your schedule, your lessons, and your projects are all right where you left them."
      highlights={[
        { icon: PlayCircle, title: 'Jump straight into class', body: 'Join your next live session in one click.' },
        { icon: LineChart, title: 'Track your progress', body: 'See completed lessons, credits and feedback.' },
        { icon: Users, title: 'Stay with your cohort', body: 'Your batch, your mentor, your classmates.' },
      ]}
      formTitle="Sign in"
      formSubtitle="Welcome back. Let's get you building."
      footer={
        <>
          New to Sariro?{' '}
          <Link
            href={`/auth/sign-up${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`}
            className="font-bold text-slate-900 hover:text-blue-600 inline-flex items-center gap-1 transition-colors"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            Create an account
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </>
      }
      legalAction="signing in"
    >
      <SignInButtons mode="signin" redirectTo={next} />
    </AuthShell>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInPageInner />
    </Suspense>
  );
}
