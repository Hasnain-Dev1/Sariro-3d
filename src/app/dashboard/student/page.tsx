'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, Clock, Calendar, ArrowRight, Sparkles, Rocket, TrendingUp } from 'lucide-react';
import BrandLayout from '@/components/brand/brand-layout';
import { useAuth } from '@/components/auth/auth-provider';
import { COURSES, TRACKS } from '@/lib/sariro-data';

export default function StudentDashboard() {
  const { user, profile, loading } = useAuth();
  if (loading) return (<BrandLayout><div className="min-h-[60vh] flex items-center justify-center"><div className="animate-pulse text-slate-400">Loading...</div></div></BrandLayout>);
  if (!user) return (<BrandLayout><div className="min-h-[60vh] flex items-center justify-center"><div className="text-center"><p className="text-slate-600 mb-4">Please sign in.</p><Link href="/auth/sign-in" className="btn-tactile btn-tactile-primary px-6 py-3 text-sm">Sign in</Link></div></div></BrandLayout>);
  const displayName = profile?.full_name || user.email?.split('@')[0] || 'there';
  const beginnerCourses = COURSES.filter((c) => c.level === 'Beginner');
  const suggestedCourse = beginnerCourses[Math.floor(Math.random() * Math.min(3, beginnerCourses.length))];
  return (
    <BrandLayout>
      <section className="relative pt-28 sm:pt-36 pb-16 overflow-hidden">
        <div className="absolute inset-0 mesh-bg opacity-40" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center gap-2 mb-2"><Sparkles className="w-5 h-5 text-blue-600" /><span className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600" style={{ fontFamily: 'var(--font-grotesk)' }}>Student Dashboard</span></div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>Hey {displayName}! 👋</h1>
            <p className="text-slate-600 mt-2">Welcome back. Here's your learning journey.</p>
          </motion.div>
          {suggestedCourse && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden mb-8" style={{ background: 'linear-gradient(135deg, #2563EB 0%, #7C3AED 50%, #0F172A 100%)' }}>
              <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
              <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center shrink-0"><Rocket className="w-7 h-7" /></div>
                <div className="flex-1"><h3 className="text-xl font-extrabold mb-1" style={{ fontFamily: 'var(--font-jakarta)' }}>Start with {suggestedCourse.title}!</h3><p className="text-sm text-white/90">{suggestedCourse.tagline}</p></div>
                <Link href={`/course-path/${suggestedCourse.trackId}`} className="shrink-0 px-5 py-3 rounded-xl bg-white text-slate-900 text-sm font-bold hover:bg-white/90 transition-colors" style={{ fontFamily: 'var(--font-grotesk)' }}>Enroll now <ArrowRight className="w-4 h-4 inline ml-1" /></Link>
              </div>
            </motion.div>
          )}
          <div className="mb-8">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}><BookOpen className="w-5 h-5 text-blue-600" />My Courses</h2>
            <div className="card-3d p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-4"><BookOpen className="w-8 h-8 text-blue-600" /></div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-2" style={{ fontFamily: 'var(--font-jakarta)' }}>No courses yet</h3>
              <p className="text-sm text-slate-500 mb-6">Buy your first course to start your journey.</p>
              <Link href="/courses" className="btn-tactile btn-tactile-primary px-6 py-3 text-sm"><Sparkles className="w-4 h-4" />Browse courses</Link>
            </div>
          </div>
          <div className="mb-8">
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}><Calendar className="w-5 h-5 text-blue-600" />Upcoming Classes</h2>
            <div className="card-3d p-6 text-center"><Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" /><p className="text-sm text-slate-500">No classes scheduled yet.</p></div>
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 mb-4" style={{ fontFamily: 'var(--font-jakarta)' }}><TrendingUp className="w-5 h-5 text-blue-600" />Your Learning Path</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TRACKS.slice(0, 6).map((track) => (
                <Link key={track.id} href={`/course-path/${track.id}`} className="card-3d p-5 hover:shadow-lg transition-shadow">
                  <h4 className="font-bold text-slate-900 mb-1" style={{ fontFamily: 'var(--font-jakarta)' }}>{track.name}</h4>
                  <p className="text-xs text-slate-500">{track.tagline}</p>
                  <div className="mt-3 flex items-center gap-1 text-xs font-bold text-blue-600">Beginner → Intermediate → Advanced <ArrowRight className="w-3 h-3" /></div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </BrandLayout>
  );
}
