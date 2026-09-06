'use client';

import { useState } from 'react';
import { Loader2, Plus, X, UserPlus } from 'lucide-react';
import { subjectGroups, focusGroupsFor } from '@/lib/demo/learner-choice';

/**
 * SARIRO — a trial booking entered by staff
 * =========================================================
 * Somebody rings the office, or a parent passes on a friend's number. Until now
 * the only way in was the public form, which requires an SMS code sent to a
 * person who is not expecting one, for a booking they did not make.
 *
 * This is the referral path: a member of staff enters it and is recorded as
 * having done so. See /api/admin/demo-class for why that is a replacement for
 * the phone check rather than a way around it.
 */

interface Props {
  onCreated: () => void;
  onToast: (msg: string, kind?: 'success' | 'error') => void;
}

export default function ManualTrialBooking({ onCreated, onToast }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const [studentName, setStudentName] = useState('');
  const [parentName, setParentName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [focus, setFocus] = useState('');
  const [referral, setReferral] = useState('');
  const [notes, setNotes] = useState('');
  const [when, setWhen] = useState('');

  const focusConfig = focusGroupsFor(subject);
  const ready = studentName.trim().length >= 2 && phone.replace(/\D/g, '').length >= 7 && !!when;

  const reset = () => {
    setStudentName(''); setParentName(''); setPhone(''); setEmail('');
    setSubject(''); setFocus(''); setReferral(''); setNotes(''); setWhen('');
  };

  const submit = async () => {
    if (!ready || busy) return;
    setBusy(true);
    try {
      const res = await fetch('/api/admin/demo-class', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_name: studentName,
          parent_name: parentName || undefined,
          phone,
          email: email || undefined,
          subject: subject || undefined,
          focus: focus || undefined,
          referral: referral || undefined,
          notes: notes || undefined,
          // A datetime-local value is wall-clock in the browser's zone, which
          // is the zone the person entering it is thinking in.
          preferred_slot: new Date(when).toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      const json = await res.json();
      if (!json.ok) {
        onToast(json.message ?? 'Could not add the booking', 'error');
        return;
      }
      onToast('Trial booking added', 'success');
      reset();
      setOpen(false);
      onCreated();
    } catch {
      onToast('Network error', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 min-h-[38px] px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[13px] font-bold"
        style={{ fontFamily: 'var(--font-grotesk)' }}
      >
        <Plus className="w-4 h-4 text-slate-400" /> Add a booking
      </button>
    );
  }

  return (
    <div className="card card--feature space-y-3 w-full">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-slate-400" />
          <p className="text-[13px] font-bold text-slate-800" style={{ fontFamily: 'var(--font-grotesk)' }}>
            Add a trial booking
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setOpen(false); reset(); }}
          className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-[12.5px] text-slate-500 leading-[1.55]">
        For a referral or a phone enquiry. No SMS code is sent — you are recorded
        as having entered it.
      </p>

      <div className="grid gap-2.5 sm:grid-cols-2">
        <Field label="Student name" required>
          <input value={studentName} onChange={(e) => setStudentName(e.target.value)}
            disabled={busy} placeholder="Anaya Sharma" className={input} style={inputStyle} />
        </Field>
        <Field label="Parent name">
          <input value={parentName} onChange={(e) => setParentName(e.target.value)}
            disabled={busy} placeholder="Optional" className={input} style={inputStyle} />
        </Field>
        <Field label="Phone" required>
          <input value={phone} onChange={(e) => setPhone(e.target.value)}
            disabled={busy} placeholder="98765 43210" className={input} style={inputStyle} />
        </Field>
        <Field label="Email">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            disabled={busy} placeholder="Optional" className={input} style={inputStyle} />
        </Field>
        <Field label="Subject">
          <select value={subject} onChange={(e) => { setSubject(e.target.value); setFocus(''); }}
            disabled={busy} className={input} style={inputStyle}>
            <option value="">No preference</option>
            {subjectGroups().map((g) => (
              <optgroup key={g.label} label={g.label}>
                {g.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </optgroup>
            ))}
          </select>
        </Field>
        {focusConfig && (
          <Field label={focusConfig.label}>
            <select value={focus} onChange={(e) => setFocus(e.target.value)}
              disabled={busy} className={input} style={inputStyle}>
              <option value="">No preference</option>
              {focusConfig.groups.map((g) => (
                <optgroup key={g.label} label={g.label}>
                  {g.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </optgroup>
              ))}
            </select>
          </Field>
        )}
        <Field label="Preferred time" required>
          <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)}
            disabled={busy} className={input} style={inputStyle} />
        </Field>
        <Field label="Referred by" hint="Who sent them. Shows on the request.">
          <input value={referral} onChange={(e) => setReferral(e.target.value)}
            disabled={busy} placeholder="Mehul Rakhecha" className={input} style={inputStyle} />
        </Field>
      </div>

      <Field label="Notes">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
          disabled={busy} placeholder="Anything the seller should know before calling"
          className={`${input} py-2`} style={inputStyle} />
      </Field>

      <div className="flex gap-2">
        <button type="button" onClick={() => { setOpen(false); reset(); }} disabled={busy}
          className="flex-1 min-h-[42px] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[13px] font-bold disabled:opacity-50">
          Cancel
        </button>
        <button type="button" onClick={submit} disabled={!ready || busy}
          className="flex-1 min-h-[42px] rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold inline-flex items-center justify-center gap-2 disabled:bg-slate-300">
          {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding…</> : 'Add booking'}
        </button>
      </div>
    </div>
  );
}

const input =
  'w-full min-h-[40px] rounded-lg border border-slate-300 px-3 text-[13.5px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 disabled:opacity-50';
const inputStyle = { fontSize: '16px' } as const;

function Field({
  label, required, hint, children,
}: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}
