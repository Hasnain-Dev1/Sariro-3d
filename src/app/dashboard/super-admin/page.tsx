'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, BookOpen, DollarSign, Crown, ArrowRight, Edit3, CreditCard } from 'lucide-react';
import BrandLayout from '@/components/brand/brand-layout';
import { useAuth } from '@/components/auth/auth-provider';
import { COURSES, PRICING_TIERS, RAZORPAY_LINKS } from '@/lib/sariro-data';

export default function SuperAdminDashboard() {
  const { user, profile, loading } = useAuth();
  if (loading || !user) return (<BrandLayout><div className="min-h-[60vh] flex items-center justify-center"><div className="animate-pulse text-slate-400">Loading...</div></div></BrandLayout>);
  const displayName = profile?.full_name || 'Super Admin';
  return (
    <BrandLayout>
      <section className="relative pt-28 sm:pt-36 pb-16 overflow-hidden">
        <div className="absolute inset-0 mesh-bg opacity-40" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center gap-2 mb-2"><Crown className="w-5 h-5 text-violet-600" /><span className="text-xs font-bold uppercase tracking-[0.18em] text-violet-600" style={{ fontFamily: 'var(--font-grotesk)' }}>Super Admin</span></div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>Super Admin Dashboard</h1>
            <p className="text-slate-600 mt-2">Full access, {displayName}. You control everything.</p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="card-3d p-5"><div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mb-3"><Users className="w-5 h-5 text-blue-600" /></div><div className="text-2xl font-extrabold text-slate-900">—</div><div className="text-xs text-slate-500">Total users</div></div>
            <div className="card-3d p-5"><div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center mb-3"><BookOpen className="w-5 h-5 text-green-600" /></div><div className="text-2xl font-extrabold text-slate-900">{COURSES.length}</div><div className="text-xs text-slate-500">Active courses</div></div>
            <div className="card-3d p-5"><div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center mb-3"><DollarSign className="w-5 h-5 text-amber-600" /></div><div className="text-2xl font-extrabold text-slate-900">—</div><div className="text-xs text-slate-500">Revenue</div></div>
            <div className="card-3d p-5"><div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center mb-3"><CreditCard className="w-5 h-5 text-violet-600" /></div><div className="text-2xl font-extrabold text-slate-900">{Object.keys(RAZORPAY_LINKS).length}</div><div className="text-xs text-slate-500">Payment links</div></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/courses" className="card-3d p-6 hover:shadow-lg transition-shadow"><div className="flex items-center gap-3 mb-2"><Edit3 className="w-5 h-5 text-violet-600" /><h3 className="font-bold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>Edit Courses</h3></div><p className="text-xs text-slate-500">Full course management.</p><div className="mt-3 text-xs font-bold text-violet-600">Manage <ArrowRight className="w-3 h-3 inline" /></div></Link>
            <Link href="/pricing" className="card-3d p-6 hover:shadow-lg transition-shadow"><div className="flex items-center gap-3 mb-2"><DollarSign className="w-5 h-5 text-amber-600" /><h3 className="font-bold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>Edit Pricing</h3></div><p className="text-xs text-slate-500">Change tier prices + payment links.</p><div className="mt-3 text-xs font-bold text-amber-600">Manage <ArrowRight className="w-3 h-3 inline" /></div></Link>
            <Link href="/settings" className="card-3d p-6 hover:shadow-lg transition-shadow"><div className="flex items-center gap-3 mb-2"><Users className="w-5 h-5 text-blue-600" /><h3 className="font-bold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>Role Management</h3></div><p className="text-xs text-slate-500">Promote/demote users.</p><div className="mt-3 text-xs font-bold text-blue-600">Manage <ArrowRight className="w-3 h-3 inline" /></div></Link>
          </div>
        </div>
      </section>
    </BrandLayout>
  );
}
