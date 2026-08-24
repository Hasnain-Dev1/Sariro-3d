'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Save, Loader2, CheckCircle2, Globe, GraduationCap } from 'lucide-react';
import DashboardLayout from '@/components/dashboard/dashboard-layout';
import { useAuth } from '@/components/auth/auth-provider';
import { createClient } from '@/lib/supabase/client';
import { TRACKS } from '@/lib/sariro-data';

function SettingsInner() {
  const { user, profile, refreshProfile } = useAuth();
  const supabase = createClient();

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [timezone, setTimezone] = useState(profile?.timezone || '');
  const [track, setTrack] = useState(profile?.track || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync local state when profile loads (first render may have null profile)
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
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
      const patch: Record<string, unknown> = {
        phone,
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

          {/* Phone */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>
              Phone
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (415) 555-0142"
                className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                style={{ fontFamily: 'var(--font-inter)' }}
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Used by your mentor and the admin team to schedule classes. No automated SMS — we'll reach out personally.
            </p>
          </div>

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
