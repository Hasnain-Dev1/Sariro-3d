'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users } from 'lucide-react';
import BrandLayout from '@/components/brand/brand-layout';
import { useAuth } from '@/components/auth/auth-provider';

export default function TeacherDashboard() {
  const { user, profile, loading } = useAuth();
  if (loading || !user) return (<BrandLayout><div className="min-h-[60vh] flex items-center justify-center"><div className="animate-pulse text-slate-400">Loading...</div></div></BrandLayout>);
  const displayName = profile?.full_name || 'Teacher';
  return (
    <BrandLayout>
      <section className="relative pt-28 sm:pt-36 pb-16 overflow-hidden">
        <div className="absolute inset-0 mesh-bg opacity-40" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center gap-2 mb-2"><Calendar className="w-5 h-5 text-green-600" /><span className="text-xs font-bold uppercase tracking-[0.18em] text-green-600" style={{ fontFamily: 'var(--font-grotesk)' }}>Teacher Dashboard</span></div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>Welcome, {displayName}!</h1>
            <p className="text-slate-600 mt-2">Here's your teaching schedule.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="card-3d p-5"><div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center mb-3"><Calendar className="w-5 h-5 text-green-600" /></div><div className="text-2xl font-extrabold text-slate-900">0</div><div className="text-xs text-slate-500">Classes this week</div></div>
            <div className="card-3d p-5"><div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mb-3"><Users className="w-5 h-5 text-blue-600" /></div><div className="text-2xl font-extrabold text-slate-900">0</div><div className="text-xs text-slate-500">Active students</div></div>
            <div className="card-3d p-5"><div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center mb-3"><Clock className="w-5 h-5 text-amber-600" /></div><div className="text-2xl font-extrabold text-slate-900">0h</div><div className="text-xs text-slate-500">Hours taught</div></div>
          </div>
          <div className="mb-8">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}><Calendar className="w-5 h-5 text-green-600" />My Schedule</h2>
            <div className="card-3d p-8 text-center"><Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" /><h3 className="text-lg font-bold text-slate-900 mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>No classes assigned yet</h3><p className="text-sm text-slate-500 mb-4">When students enroll and are assigned to you, your class schedule will appear here.</p><p className="text-xs text-slate-400">Classes are scheduled 2 days per week.</p></div>
          </div>
          <div><h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}><Users className="w-5 h-5 text-green-600" />My Students</h2><div className="card-3d p-6 text-center"><Users className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="text-sm text-slate-500">No students assigned yet.</p></div></div>
        </div>
      </section>
    </BrandLayout>
  );
}
