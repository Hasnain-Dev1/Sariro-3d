'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Save, Loader2, CheckCircle2, Globe, GraduationCap, MessageCircle, ShieldCheck, AlertCircle } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/dashboard-layout';
import { useAuth } from '@/components/auth/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { TRACKS } from '@/lib/sariro-data';
import AvailabilityEditor from '@/components/dashboard/availability-editor';
import TeacherRoomEditor from '@/components/dashboard/teacher-room-editor';
import AccountPhoneVerify from '@/components/auth/account-phone-verify';
import AutopayNotice from '@/components/account/autopay-notice';
import { formatE164 } from '@/lib/phone/countries';
import { changeDateLabel, nextChangeAt } from '@/lib/phone/account-phone';

/**
 * The account's WhatsApp number. Read-only here: it changes only by proving
 * the new number with a WhatsApp code, at most once a week — the rules live in
 * /api/account/phone, and the database refuses any other write
 * (scripts/phone-change-guard.sql).
 */
function PhoneSection() {
  const { profile, refreshProfile } = useAuth();
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  const phone = profile?.phone?.trim() || null;
  const verified = !!phone && profile?.phone_verified === true;
  const lockedUntil = verified ? nextChangeAt(profile?.phone_changed_at ?? null) : null;

  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
        WhatsApp number
      </label>
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 min-h-[44px] py-2">
        <MessageCircle className="w-4 h-4 text-slate-400 shrink-0" />
        <span className="text-sm font-semibold text-slate-800 tabular-nums" style={{ fontFamily: 'var(--font-inter)' }}>
          {phone ? formatE164(phone) : 'Not added yet'}
        </span>
        {phone && (verified ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10.5px] font-bold text-emerald-700">
            <ShieldCheck className="w-3 h-3" /> Verified
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10.5px] font-bold text-amber-800">
            <AlertCircle className="w-3 h-3" /> Not verified
          </span>
        ))}
        {!open && (
          <button
            type="button"
            onClick={() => { setOpen(true); setSaved(false); }}
            disabled={!!lockedUntil}
            className="ml-auto text-[12px] font-bold text-blue-600 hover:text-blue-700 disabled:text-slate-400 disabled:cursor-not-allowed"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            {!phone ? 'Add number' : verified ? 'Change number' : 'Verify number'}
          </button>
        )}
      </div>

      {lockedUntil && !open && (
        <p className="text-[11px] text-slate-500 mt-1.5">
          A number can be changed once a week. You can change yours again on {changeDateLabel(lockedUntil)}.
        </p>
      )}
      {saved && !open && (
        <p className="text-[11px] text-emerald-700 font-semibold mt-1.5">Your number is saved, and our team will use it from now on.</p>
      )}
      {!open && !lockedUntil && !saved && (
        <p className="text-[11px] text-slate-500 mt-1.5">
          Changing it needs a code on WhatsApp to the new number, and can be done once a week.
        </p>
      )}

      {open && (
        <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
          <AccountPhoneVerify
            initialPhone={verified ? null : phone}
            initialCountry={verified ? null : profile?.phone_country_code}
            onDone={async () => {
              await refreshProfile();
              setOpen(false);
              setSaved(true);
            }}
          />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="mt-3 text-[12px] font-bold text-slate-500 hover:text-slate-900"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

function SettingsInner() {
  const { user, profile, refreshProfile } = useAuth();
  const supabase = createClient();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [timezone, setTimezone] = useState(profile?.timezone || '');
  const [track, setTrack] = useState(profile?.track || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync local state when profile loads (first render may have null profile)
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setTimezone(profile.timezone || '');
      setTrack(profile.track || '');
    }
  }, [profile]);

  if (!user) return null;

  // An admin can lock a student's name so they can't change it themselves.
  const nameLocked = !!profile?.name_locked;

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      // Never send full_name when the name is admin-locked — it's also enforced
      // server-side by a DB trigger, but omitting it avoids a pointless error.
      /* Never the phone: it changes only through a WhatsApp code (PhoneSection). */
      const patch: Record<string, unknown> = {
        timezone: timezone || null,
        track: track || null,
      };
      if (!nameLocked) patch.full_name = fullName;

      const { error } = await supabase
        .from('profiles')
        .update(patch)
        .eq('id', user.id);
      if (error) throw error;
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: unknown) {
      console.error('Settings save error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to save';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  // Try to detect user's timezone via browser API on first load
  const detectTimezone = () => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) setTimezone(tz);
    } catch (err) {
      console.warn('Could not detect timezone', err);
    }
  };

  return (
    <section className="relative pt-6 sm:pt-10 pb-16 px-4 sm:px-6 lg:px-10">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
            Account Settings
          </h1>
          <p className="text-slate-600 mt-1.5 text-sm">
            Update your profile, timezone, and learning track.
          </p>
        </motion.div>

        <div className="card-3d p-6 sm:p-8 space-y-5">
          {/* Avatar + identity summary */}
          <div className="flex items-center gap-4 pb-5 border-b border-slate-100">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-16 h-16 rounded-2xl object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-extrabold text-xl" style={{ fontFamily: 'var(--font-jakarta)' }}>
                {(fullName || user.email || '?').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-900 truncate">{fullName || 'Your name'}</div>
              <div className="text-xs text-slate-500 truncate">{user.email}</div>
            </div>
          </div>

          {/* Full name */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
              Full name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                disabled={nameLocked}
                className={`w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${nameLocked ? 'bg-slate-50 text-slate-500 cursor-not-allowed' : ''}`}
                style={{ fontFamily: 'var(--font-inter)' }}
              />
            </div>
            {nameLocked && (
              <p className="mt-1.5 text-[11px] text-amber-600 font-medium">
                Your name is managed by your admin and can&apos;t be changed here. Contact them if it needs updating.
              </p>
            )}
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
              Email (read-only)
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="email"
                value={user.email || ''}
                disabled
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-sm bg-slate-50 text-slate-500"
                style={{ fontFamily: 'var(--font-inter)' }}
              />
            </div>
          </div>

          {/* WhatsApp number — proved, never typed straight in */}
          <PhoneSection />

          {/* An autopay made for this account's email or phone: how to close or pause it. */}
          <AutopayNotice />

          {/* Timezone */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
              Timezone
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="e.g. Asia/Kolkata, America/New_York"
                className="w-full h-11 pl-10 pr-24 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                style={{ fontFamily: 'var(--font-inter)' }}
              />
              <button
                type="button"
                onClick={detectTimezone}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-bold text-blue-600 hover:text-blue-700 px-2 py-1 rounded-md hover:bg-blue-50"
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                Detect
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              All session times on your dashboard will be shown in this timezone.
            </p>
          </div>

          {/* Track */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
              Primary track (optional)
            </label>
            <div className="relative">
              <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                value={track}
                onChange={(e) => setTrack(e.target.value)}
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                <option value="">— None selected —</option>
                {TRACKS.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Helps your mentor know what you're focusing on right now.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* §5. Teachers only — a student has no hours to offer, and showing
              an empty scheduling card to a parent is noise. */}
          {(profile?.role === 'teacher' || profile?.is_teacher) && (
            <>
              {/* Above the hours on purpose. Offering a slot nobody can walk
                  into is the more expensive of the two things to get wrong. */}
              <TeacherRoomEditor />
              <AvailabilityEditor />
            </>
          )}

          {/* Save button */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-tactile btn-tactile-primary px-6 py-3 text-sm flex items-center gap-2 disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save changes
            </button>
            {saved && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-1.5 text-sm text-green-600 font-bold"
              >
                <CheckCircle2 className="w-4 h-4" /> Saved!
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <SettingsInner />
    </DashboardLayout>
  );
}
