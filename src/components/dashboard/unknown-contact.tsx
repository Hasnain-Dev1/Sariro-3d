'use client';

import { PhoneOff } from 'lucide-react';
import { contactIdentity, type ContactLike } from '@/lib/contact/reachability';

/**
 * SARIRO — the chip that says we do not know who this is
 * ============================================================================
 * One component, so the answer is the same on every screen. Three tables list
 * accounts (admin Users, super-admin Users, the user-management modal) and a
 * rule that reads differently in each is a rule nobody trusts.
 *
 * It is amber, not red. Nothing has gone wrong and nobody has done anything
 * suspicious — a phone number is missing, which is fixable in about a minute,
 * and red would have HR treating a family who signed in with Google as a
 * fraud case.
 */
export function UnknownBadge({ contact, className = '' }: { contact: ContactLike; className?: string }) {
  const id = contactIdentity(contact);
  if (!id.unknown) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold uppercase tracking-wide ${className}`}
      style={{ fontFamily: 'var(--font-grotesk)' }}
      title={`${id.reason} We cannot contact this account, so no course can be assigned to it.`}
    >
      <PhoneOff className="w-3 h-3" aria-hidden="true" />
      Unknown
    </span>
  );
}
