'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import {
  GraduationCap,
  Twitter,
  Youtube,
  Github,
  Linkedin,
  Mail,
  LifeBuoy,
  Briefcase,
  Handshake,
  Sparkles,
  MapPin,
} from 'lucide-react';
import { BRAND, FOOTER_LINKS, NAV_LINKS, EMAILS } from '@/lib/sariro-data';

/* Map the icon name string from EMAILS data to a real icon component. */
const EMAIL_ICONS: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number; style?: React.CSSProperties }>> = {
  Mail,
  LifeBuoy,
  School: GraduationCap,
  Handshake,
  Briefcase,
  Sparkles,
};

export default function Footer3D() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end end'],
  });
  const glowY = useTransform(scrollYProgress, [0, 1], [-40, 0]);
  const glowScale = useTransform(scrollYProgress, [0, 1], [0.8, 1]);
  const contentY = useTransform(scrollYProgress, [0, 1], [40, 0]);

  return (
    <footer ref={ref} data-chapter="footer" data-chapter-label="Contact" className="relative bg-slate-950/95 text-slate-300 pt-20 pb-8 overflow-hidden">
      {/* Parallax glow */}
      <motion.div
        style={{ y: glowY, scale: glowScale }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] rounded-full bg-blue-600/20 blur-[120px] pointer-events-none"
      />
      {/* Secondary glow */}
      <motion.div
        style={{ y: useTransform(scrollYProgress, [0, 1], [60, 0]) }}
        className="absolute bottom-0 right-1/4 w-[500px] h-[200px] rounded-full bg-violet-600/15 blur-[100px] pointer-events-none"
      />

      <motion.div style={{ y: contentY }} className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand column */}
          <div className="lg:col-span-2 max-w-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex items-center gap-2.5 mb-5"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <GraduationCap className="w-5 h-5 text-white" strokeWidth={2.5} />
              </div>
              <div>
                <div className="font-extrabold text-xl text-white" style={{ fontFamily: 'var(--font-jakarta)' }}>
                  {BRAND.name}
                </div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-semibold" style={{ fontFamily: 'var(--font-grotesk)' }}>
                  AI Education
                </div>
              </div>
            </motion.div>

            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              {BRAND.tagline} Cohort-based AI education for students, schools, and professionals — by educator {BRAND.founder}.
            </p>

            {/* Connect — full email directory */}
            <div className="space-y-3 text-sm">
              <h5
                className="text-[10px] uppercase tracking-[0.18em] text-slate-500 font-bold mb-2"
                style={{ fontFamily: 'var(--font-grotesk)' }}
              >
                Connect
              </h5>
              <div className="space-y-1.5">
                {EMAILS.map((email) => {
                  const Icon = EMAIL_ICONS[email.icon] ?? Mail;
                  return (
                    <a
                      key={email.id}
                      href={`mailto:${email.address}`}
                      className="flex items-center gap-2.5 text-slate-400 hover:text-white transition-colors group"
                    >
                      <Icon
                        className="w-3.5 h-3.5 shrink-0 group-hover:scale-110 transition-transform"
                        style={{ color: email.accent }}
                        strokeWidth={2.2}
                      />
                      <span className="truncate">{email.address}</span>
                    </a>
                  );
                })}
              </div>
              <div className="flex items-center gap-2.5 text-slate-400 pt-2 border-t border-white/5">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-xs">{BRAND.location}</span>
              </div>
            </div>

            {/* Socials */}
            <div className="flex items-center gap-2 mt-6">
              {[
                { Icon: Youtube, label: 'YouTube' },
                { Icon: Twitter, label: 'Twitter' },
                { Icon: Linkedin, label: 'LinkedIn' },
                { Icon: Github, label: 'GitHub' },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <motion.div
              key={heading}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4" style={{ fontFamily: 'var(--font-grotesk)' }}>
                {heading}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-slate-400 hover:text-white hover:translate-x-1 inline-block transition-all"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Newsletter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-dark rounded-2xl p-6 sm:p-8 mb-10 grid grid-cols-1 md:grid-cols-2 gap-6 items-center"
        >
          <div>
            <h4 className="text-xl font-extrabold text-white mb-1" style={{ fontFamily: 'var(--font-jakarta)' }}>
              The Sunday AI Brief
            </h4>
            <p className="text-sm text-slate-400">
              One email. Every Sunday. 5 AI things worth knowing, explained in plain English. 12k+ readers.
            </p>
          </div>
          <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              required
              placeholder="you@example.com"
              className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{ fontFamily: 'var(--font-inter)' }}
            />
            <button
              type="submit"
              className="btn-tactile btn-tactile-primary px-5 py-3 text-sm whitespace-nowrap"
            >
              Subscribe
            </button>
          </form>
        </motion.div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between text-xs text-slate-500">
          <p>
            © {new Date().getFullYear()} {BRAND.name}. Built with care by educators, for builders.
          </p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-300 transition-colors">Privacy</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Terms</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Cookies</a>
            <a href="#" className="hover:text-slate-300 transition-colors">Refunds</a>
          </div>
        </div>
      </motion.div>
    </footer>
  );
}
