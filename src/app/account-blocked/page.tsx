'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Lock, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { SariroMark } from '@/components/brand/sariro-logo';
import { BLOCKED_MESSAGE, BLOCKED_TITLE, SUPPORT_EMAIL } from '@/lib/auth/blocked';

/**
 * /account-blocked — where a blocked account lands.
 *
 * Signs the browser out on arrival, so nothing behind the dashboard can be
 * reached from this tab, and says the one thing the person can do about it.
 */
export default function AccountBlockedPage() {
  useEffect(() => {
    void createClient().auth.signOut().catch(() => {});
  }, []);

  return (
    <main className="min-h-[100dvh] flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 sm:p-8 text-center shadow-sm">
        <div className="flex justify-center"><SariroMark size={44} label="Sariro" /></div>
        <div className="mt-6 mx-auto w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center">
          <Lock className="w-6 h-6 text-rose-600" />
        </div>
        <h1 className="mt-4 text-2xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
          {BLOCKED_TITLE}
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-slate-600">{BLOCKED_MESSAGE}</p>
        <a
          href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('My Sariro account is blocked')}`}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 h-12 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800"
        >
          <Mail className="w-4 h-4" /> Email support
        </a>
        <Link href="/" className="mt-3 inline-block text-sm font-bold text-slate-500 hover:text-slate-800">
          Back to the website
        </Link>
      </div>
    </main>
  );
}
