'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { LogOut, MessageCircle, PhoneCall, ShieldCheck, UserCheck } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import AccountPhoneVerify from '@/components/auth/account-phone-verify';
import { SariroLogo } from '@/components/brand/sariro-logo';
import { gateNeedsStatus, phoneGate, type PhoneGateStatus } from '@/lib/phone/gate';

/**
 * SARIRO — the once-only phone check in front of every dashboard
 * ============================================================================
 * The rule is lib/phone/gate.ts. An account with a verified number never sees
 * this and never waits for it: nothing is fetched. Anybody else proves their
 * number here, once, and is let straight in — the profile and every sales
 * record carry it from then on (lib/phone/account-phone.ts).
 *
 * The status fetch is the one network call, made only for an unverified
 * account. If it fails the check is shown rather than skipped — the code route
 * itself says clearly when verification is unavailable, and saves the number
 * without one.
 */

const FAILED_STATUS: PhoneGateStatus = { impersonating: false, smsAvailable: true };

export default function PhoneGate({ children, fallback }: { children: ReactNode; fallback: ReactNode }) {
  const { user, profile, loading, refreshProfile, signOut } = useAuth();
  const [status, setStatus] = useState<{ userId: string; value: PhoneGateStatus } | null>(null);
  const [finishing, setFinishing] = useState(false);

  const facts = {
    profileLoaded: !!profile,
    phone: profile?.phone,
    phoneVerified: profile?.phone_verified,
    countryCode: profile?.phone_country_code,
  };
  const needsStatus = !!user && gateNeedsStatus(facts);
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!needsStatus || !userId) return;
    let live = true;
    fetch('/api/account/phone', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => {
        if (!live) return;
        setStatus({
          userId,
          value: j?.ok ? { impersonating: j.impersonating === true, smsAvailable: j.smsAvailable !== false } : FAILED_STATUS,
        });
      })
      .catch(() => { if (live) setStatus({ userId, value: FAILED_STATUS }); });
    return () => { live = false; };
  }, [needsStatus, userId]);

  /* Signed out: not this check's business. The page's own sign-in redirect
     has to be allowed to run, or it would wait here for ever. */
  if (!loading && !user) return <>{children}</>;

  const decision = phoneGate({ ...facts, status: status && status.userId === userId ? status.value : null });
  if (decision === 'allow') return <>{children}</>;
  if (decision === 'wait' || finishing) return <>{fallback}</>;

  return (
    <PhoneGateScreen
      firstName={profile?.full_name?.split(' ')[0] ?? null}
      phone={facts.phone}
      countryCode={facts.countryCode}
      onSignOut={async () => { await signOut(); window.location.assign('/'); }}
      onDone={async () => {
        setFinishing(true);
        await refreshProfile();
        setFinishing(false);
      }}
    />
  );
}

/** The screen itself, apart from the decision — so it can be looked at on its own. */
export function PhoneGateScreen({
  firstName, phone, countryCode, onSignOut, onDone,
}: {
  firstName: string | null;
  phone: string | null | undefined;
  countryCode: string | null | undefined;
  onSignOut: () => void;
  onDone: () => void;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="h-16 px-4 sm:px-6 flex items-center justify-between max-w-5xl w-full mx-auto">
        <SariroLogo size={32} priority />
        <button
          type="button"
          onClick={onSignOut}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900"
          style={{ fontFamily: 'var(--font-grotesk)' }}
        >
          <LogOut className="w-3.5 h-3.5" /> Sign out
        </button>
      </header>

      <main className="flex-1 flex items-start sm:items-center justify-center px-4 pb-16 pt-4">
        <div className="w-full max-w-md">
          <div className="card-3d p-6 sm:p-8">
            <span className="inline-flex w-12 h-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-5">
              <ShieldCheck className="w-6 h-6" />
            </span>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>
              Confirm your WhatsApp number
            </h1>
            <p className="mt-2 text-[14.5px] text-slate-600 leading-relaxed">
              {firstName ? `Hi ${firstName} — one` : 'One'} quick check before your dashboard.
              You only do this once.
            </p>

            <div className="mt-6">
              <AccountPhoneVerify
                initialPhone={phone}
                initialCountry={countryCode}
                submitLabel="Send code on WhatsApp"
                onDone={onDone}
              />
            </div>
          </div>

          <ul className="mt-5 grid gap-2.5 text-[13px] text-slate-600">
            <li className="flex items-start gap-2.5">
              <UserCheck className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
              Every Sariro account belongs to a real, reachable person — that keeps classes safe for children.
            </li>
            <li className="flex items-start gap-2.5">
              <PhoneCall className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
              Our team uses it for class updates and to keep your account secure.
            </li>
            <li className="flex items-start gap-2.5">
              <MessageCircle className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
              Your code arrives on WhatsApp, wherever you are in the world.
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
}
