'use client';

import { useEffect, useState } from 'react';
import { Mail, MessageCircle, Repeat } from 'lucide-react';
import { BRAND } from '@/lib/sariro-data';
import { inr } from '@/lib/pricing/economics';

/**
 * SARIRO — "you have an autopay", in Settings
 * ============================================================================
 * The founder, 17 Sep 2026: when an autopay link has been made for a family's
 * email (or phone), their dashboard tells them how to close or pause it — by
 * email to Sariro with the email and phone on their account, or on WhatsApp.
 * Nothing is cancelled from here: an admin ends it from the payment links list,
 * after hearing from the family.
 *
 * Renders nothing when there is no autopay, or when the check cannot be made.
 */

interface Autopay {
  id: string;
  status: string;
  amount: number;
  frequency: string | null;
  totalCount: number | null;
  paidCount: number;
  description: string;
}

const STATUS_WORDS: Record<string, string> = {
  created: 'waiting for your approval',
  authenticated: 'approved',
  active: 'active',
  resumed: 'active',
  pending: 'retrying a payment',
  halted: 'on hold — a payment did not go through',
  paused: 'paused',
};

export default function AutopayNotice() {
  const [data, setData] = useState<{ autopays: Autopay[]; email: string | null; phone: string | null } | null>(null);

  useEffect(() => {
    let live = true;
    fetch('/api/account/autopay', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => { if (live && j?.ok) setData({ autopays: (j.autopays ?? []) as Autopay[], email: j.email ?? null, phone: j.phone ?? null }); })
      .catch(() => { /* nothing to show */ });
    return () => { live = false; };
  }, []);

  if (!data || data.autopays.length === 0) return null;

  const identity = [data.email ? `Email: ${data.email}` : null, data.phone ? `Phone: ${data.phone}` : null].filter(Boolean).join('\n');
  const mailto = `mailto:${BRAND.email}?subject=${encodeURIComponent('Pause or cancel my Sariro autopay')}&body=${encodeURIComponent(
    `Hello Sariro,\n\nI would like to pause / cancel my autopay subscription.\n\n${identity}\n\nThank you.`
  )}`;
  const whatsapp = `https://wa.me/${BRAND.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
    `Hello Sariro, I would like to pause / cancel my autopay subscription. ${identity.replace(/\n/g, ', ')}`
  )}`;

  return (
    <div className="rounded-2xl border border-violet-200 bg-violet-50/60 p-4 sm:p-5">
      <p className="flex items-center gap-2 text-[13px] font-extrabold text-violet-900">
        <Repeat className="w-4 h-4" /> Autopay on your account
      </p>
      <ul className="mt-2 space-y-1">
        {data.autopays.map((a) => (
          <li key={a.id} className="text-[13px] text-slate-700">
            <span className="font-bold text-slate-900">{inr(a.amount)}</span>
            {a.frequency ? ` ${a.frequency.toLowerCase()}` : ''}
            {a.totalCount ? ` · ${a.paidCount} of ${a.totalCount} payments made` : ''}
            {' · '}{STATUS_WORDS[a.status] ?? a.status}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[13px] text-slate-700 leading-relaxed">
        To <strong>close or pause</strong> your subscription, drop a mail at{' '}
        <a href={mailto} className="font-bold text-violet-800 underline">{BRAND.email}</a> with the email and phone number you use on your
        Sariro dashboard{data.email || data.phone ? <> ({[data.email, data.phone].filter(Boolean).join(' · ')})</> : null}, or contact us on WhatsApp.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <a href={mailto} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-white border border-violet-200 text-[13px] font-bold text-violet-800">
          <Mail className="w-4 h-4" /> Email {BRAND.email}
        </a>
        <a href={whatsapp} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[#25D366] text-white text-[13px] font-bold">
          <MessageCircle className="w-4 h-4" /> WhatsApp us
        </a>
      </div>
    </div>
  );
}
