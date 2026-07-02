'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Save, Loader2, CheckCircle2 } from 'lucide-react';
import BrandLayout from '@/components/brand/brand-layout';
import { useAuth } from '@/components/auth/auth-provider';
import { createClient } from '@/lib/supabase/client';

export default function SettingsPage() {
  const { user, profile, refreshProfile } = useAuth();
  const supabase = createClient();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  if (!user) return (<BrandLayout><div className="min-h-[60vh] flex items-center justify-center"><p className="text-slate-500">Please sign in.</p></div></BrandLayout>);
  const handleSave = async () => {
    setSaving(true); setSaved(false);
    try {
      const { error } = await supabase.from('profiles').update({ full_name: fullName, phone }).eq('id', user.id);
      if (error) throw error;
      await refreshProfile(); setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) { console.error('Settings save error:', err); }
    finally { setSaving(false); }
  };
  return (
    <BrandLayout>
      <section className="relative pt-28 sm:pt-36 pb-16 overflow-hidden">
        <div className="absolute inset-0 mesh-bg opacity-40" />
        <div className="relative max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>Account Settings</h1>
            <p className="text-slate-600 mt-2">Update your profile information.</p>
          </motion.div>
          <div className="card-3d p-6 sm:p-8 space-y-5">
            <div className="flex items-center gap-4 mb-4">
              {profile?.avatar_url ? <img src={profile.avatar_url} alt="Avatar" className="w-16 h-16 rounded-2xl object-cover" /> : <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center text-white font-extrabold text-xl">{(fullName || user.email || '?').charAt(0).toUpperCase()}</div>}
              <div><div className="text-sm font-bold text-slate-900">{fullName || 'Your name'}</div><div className="text-xs text-slate-500">{user.email}</div></div>
            </div>
            <div><label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>Full name</label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" style={{ fontFamily: 'var(--font-inter)' }} /></div></div>
            <div><label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>Email (read-only)</label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="email" value={user.email || ''} disabled className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-sm bg-slate-50 text-slate-500" style={{ fontFamily: 'var(--font-inter)' }} /></div></div>
            <div><label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5" style={{ fontFamily: 'var(--font-grotesk)' }}>Phone</label><div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (415) 555-0142" className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50" style={{ fontFamily: 'var(--font-inter)' }} /></div></div>
            <div className="flex items-center gap-3 pt-2">
              <button onClick={handleSave} disabled={saving} className="btn-tactile btn-tactile-primary px-6 py-3 text-sm flex items-center gap-2">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}Save changes</button>
              {saved && <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-1.5 text-sm text-green-600 font-bold"><CheckCircle2 className="w-4 h-4" />Saved!</motion.div>}
            </div>
          </div>
        </div>
      </section>
    </BrandLayout>
  );
}
