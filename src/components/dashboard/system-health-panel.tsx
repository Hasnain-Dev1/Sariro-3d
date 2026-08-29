'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { fetchSystemHealth, type HealthCheck } from '@/lib/dashboard/system-health';

/**
 * SARIRO — System health panel
 * =========================================================
 * The first thing a super-admin should see: what is quietly broken.
 *
 * Renders nothing reassuring by default and everything alarming by exception.
 * A healthy system gets one calm line; an unhealthy one gets a list ordered by
 * how much it hurts.
 */

export default function SystemHealthPanel() {
  const [checks, setChecks] = useState<HealthCheck[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await fetchSystemHealth();
      if (!cancelled) setChecks(result);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Nothing at all while loading. A skeleton here would flash "problems" shaped
  // boxes at someone whose system may be perfectly fine.
  if (checks === null) return null;

  if (checks.length === 0) {
    return (
      <div className="card card--feature mb-8" style={{ ['--accent' as string]: '#16A34A' }}>
        <p className="flex items-center gap-2.5 font-semibold text-slate-900">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          Nothing needs attention right now.
        </p>
        <p className="text-[14px] text-slate-600 mt-1">
          Every batch has a teacher, every past class is marked, and nobody is waiting on approval.
        </p>
      </div>
    );
  }

  const critical = checks.filter((c) => c.severity === 'critical').length;

  return (
    <div
      className="card card--feature mb-8"
      style={{ ['--accent' as string]: critical > 0 ? '#DC2626' : '#D97706' }}
    >
      <div className="flex items-center gap-2.5 mb-4">
        <ShieldAlert className={`w-5 h-5 ${critical > 0 ? 'text-red-600' : 'text-amber-600'}`} />
        <span
          className={`text-xs font-bold uppercase tracking-[0.18em] ${critical > 0 ? 'text-red-600' : 'text-amber-600'}`}
        >
          System health
        </span>
      </div>

      <ul className="space-y-2.5">
        {checks.map((check) => (
          <li
            key={check.key}
            className="flex items-start gap-3 rounded-xl border p-4"
            style={
              check.severity === 'critical'
                ? { borderColor: '#fecaca', background: '#fef2f2' }
                : { borderColor: '#fde68a', background: '#fffbeb' }
            }
          >
            <AlertTriangle
              className={`w-4 h-4 shrink-0 mt-0.5 ${check.severity === 'critical' ? 'text-red-600' : 'text-amber-600'}`}
            />
            <div className="min-w-0">
              <p
                className={`font-bold text-[15px] ${check.severity === 'critical' ? 'text-red-900' : 'text-amber-900'}`}
              >
                {check.label}
              </p>
              <p
                className={`text-[13.5px] leading-[1.6] mt-0.5 ${check.severity === 'critical' ? 'text-red-800/80' : 'text-amber-800/80'}`}
              >
                {check.detail}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
