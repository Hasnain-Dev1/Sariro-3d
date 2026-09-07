'use client';

import { useMemo } from 'react';
import { Phone } from 'lucide-react';
import {
  COUNTRY_LIST, countryByCode, checkNational, stripTrunkPrefix, toE164,
  smsReachable, DEFAULT_COUNTRY,
} from '@/lib/phone/countries';

/**
 * SARIRO — one phone field, country picked rather than guessed
 * ============================================================================
 * Every place that asks for a number should ask the same way, because the last
 * time they differed we stored the same ten digits under two country codes and
 * nearly sent a family's class reminders to a stranger.
 *
 * The country is CHOSEN here, not derived. A timezone can seed the initial
 * value — see guessCountry, which exists only for that — but what gets stored
 * is what the person picked. That is the whole point of the split: the dialling
 * code says which network to ring, and nothing about where anybody lives.
 *
 * ── What the caller owns ────────────────────────────────────────────────────
 * Both halves, as separate state. This component does no storing and no
 * submitting; it renders two controls and reports what they say. `e164` is
 * offered as a convenience so a caller never has to remember to strip the
 * trunk prefix before gluing the dial code on — the single most common way to
 * store a number that rings nothing.
 */

export interface PhoneFieldValue {
  /** ISO country code — the thing to store alongside the number. */
  country: string;
  /** What the person typed, digits and all their punctuation. */
  national: string;
}

export interface PhoneFieldProps {
  value: PhoneFieldValue;
  onChange: (next: PhoneFieldValue) => void;
  /** Shown under the field once the person has left it. */
  showProblem?: boolean;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  id?: string;
  /** Explain that a code can only be texted to Indian numbers. */
  noteSmsReach?: boolean;
}

/**
 * The trunk prefix comes off BEFORE the number is checked, not after.
 *
 * People type the 0 they have dialled their whole lives — `09876543210` in
 * India, the same in the UK and most of Europe. Checking first meant an eleven
 * digit string, and the person was told "an Indian mobile is 10 digits" about
 * a number that is exactly ten digits with a habit in front of it. They then
 * stare at a field where every digit is right.
 *
 * So both helpers work on the same normalised value the field will store, and
 * the message can never disagree with what is saved.
 */
const normalised = (v: PhoneFieldValue) => stripTrunkPrefix(v.national);

/** The canonical value, or null while it is still incomplete. */
export function phoneFieldE164(v: PhoneFieldValue): string | null {
  const n = normalised(v);
  if (!checkNational(v.country, n).ok) return null;
  return toE164(v.country, n);
}

export function phoneFieldProblem(v: PhoneFieldValue): string {
  return checkNational(v.country, normalised(v)).problem;
}

export default function PhoneField({
  value,
  onChange,
  showProblem = false,
  disabled = false,
  required = false,
  label = 'Phone number',
  id = 'phone-field',
  noteSmsReach = false,
}: PhoneFieldProps) {
  const country = countryByCode(value.country) ?? countryByCode(DEFAULT_COUNTRY)!;
  const problem = useMemo(() => phoneFieldProblem(value), [value]);
  const touchedAndWrong = showProblem && !!problem && value.national.trim().length > 0;

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5"
        style={{ fontFamily: 'var(--font-grotesk)' }}
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="flex gap-2">
        {/* A native <select>, deliberately. It is the control every phone
            already knows how to render as a scrollable wheel, it is reachable
            by keyboard and screen reader for free, and a custom dropdown here
            would be a worse version of something that already works. */}
        <div className="relative shrink-0">
          <select
            aria-label="Country"
            value={country.code}
            disabled={disabled}
            onChange={(e) => onChange({ ...value, country: e.target.value })}
            className="h-11 w-[8.5rem] pl-3 pr-7 rounded-xl border border-slate-200 bg-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-60"
            style={{ fontFamily: 'var(--font-inter)' }}
          >
            {COUNTRY_LIST.map((c) => (
              <option key={c.code} value={c.code}>
                {/* Flag AND ISO code, not flag alone. Windows has no glyphs for
                    regional-indicator pairs, so a flag renders there as the two
                    letters — which means the code is what people actually read
                    on the most common desktop. Showing both makes that the
                    design rather than an accident, and it is the only way to
                    tell +1 United States from +1 Canada in a list. */}
                {c.flag} {c.code} +{c.dial}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
            ▼
          </span>
        </div>

        <div className="relative flex-1 min-w-0">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            id={id}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            required={required}
            disabled={disabled}
            value={value.national}
            onChange={(e) => onChange({ ...value, national: e.target.value })}
            placeholder={country.code === 'IN' ? '98765 43210' : 'Phone number'}
            className="w-full h-11 pl-10 pr-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-60"
            style={{ fontFamily: 'var(--font-inter)' }}
          />
        </div>
      </div>

      {touchedAndWrong && <p className="mt-1.5 text-xs text-red-600">{problem}</p>}

      {/* Said before they wait for a code that is never coming. */}
      {noteSmsReach && !smsReachable(country.code) && !touchedAndWrong && (
        <p className="mt-1.5 text-xs text-slate-500">
          We can only text a verification code to Indian numbers at the moment — for {country.name} we
          will confirm by email instead.
        </p>
      )}

      <p className="mt-1.5 text-[11px] text-slate-400">
        We store your country separately from your number — a number from {country.name} does not have
        to mean you live there.
      </p>
    </div>
  );
}
