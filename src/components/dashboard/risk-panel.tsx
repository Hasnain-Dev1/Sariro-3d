'use client';

import { useEffect, useState } from 'react';
import { Loader2, ChevronRight, TrendingDown, Users, GraduationCap, Info } from 'lucide-react';
import { RISK_TONE, type RiskAssessment, type BatchHealth } from '@/lib/dashboard/risk-signals';

/**
 * SARIRO — who needs attention
 * =========================================================
 * V2 §60-63, §64, §66, §67. Learners drifting away, teachers slipping, batches
 * in trouble — worst first, because that is the order somebody works a list in.
 *
 * ── Every score opens ───────────────────────────────────────────────────────
 * §67 says clicking a health score should show its components, and §93 asks of
 * every prediction: "what data contributed to this?" So nothing here is a bare
 * number. Each row expands into the factors that produced it, including the
 * ones that contributed nothing — a list of only the bad news reads like a case
 * being built rather than a measurement.
 *
 * ── These are labelled as judgements, not forecasts ─────────────────────────
 * §64 is explicit that predictions must be labelled as predictions. There is no
 * model here and the page says so: these are rules over facts the system holds,
 * which is a more honest thing to put in front of somebody about to ring a
 * parent.
 */

interface StudentRisk {
  student_id: string; student_name: string; batch_code: string | null;
  course: string | null; credits: number; risk: RiskAssessment;
}
interface TeacherRiskRow {
  teacher_id: string; teacher_name: string; scheduled: number; risk: RiskAssessment;
}
interface BatchHealthRow {
  cohort_id: string; batch_code: string | null; course: string;
  teacher_name: string | null; health: BatchHealth;
}

function Band({ risk }: { risk: RiskAssessment }) {
  const tone = RISK_TONE[risk.band];
  return (
    <span
      className="text-[10px] font-black tracking-wider px-1.5 py-0.5 rounded uppercase whitespace-nowrap"
      style={{ color: tone.fg, background: tone.bg }}
    >
      {tone.label}
      {risk.score !== null ? ` · ${risk.score}` : ''}
    </span>
  );
}

/** A row that opens to show what produced its score. */
function Expandable({
  title, subtitle, badge, factors, children,
}: {
  title: string;
  subtitle: string;
  badge: React.ReactNode;
  factors: { label: string; detail: string; weight: number }[];
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card card--compact">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-start gap-3 text-left"
      >
        <ChevronRight className={`w-4 h-4 shrink-0 mt-0.5 text-slate-400 transition-transform ${open ? 'rotate-90' : ''}`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-900 text-[14.5px]">{title}</span>
            {badge}
          </div>
          <p className="text-[12.5px] text-slate-500 mt-0.5">{subtitle}</p>
        </div>
      </button>

      {open && (
        <div className="pl-7 pt-2.5 space-y-1.5">
          {factors.map((f) => (
            <div key={f.label} className="flex items-baseline justify-between gap-3 text-[12.5px]">
              <span className="text-slate-600">
                {f.label}: <span className="text-slate-500">{f.detail}</span>
              </span>
              <span
                className="tabular-nums shrink-0 font-semibold"
                style={{ color: f.weight > 0 ? '#B91C1C' : f.weight < 0 ? '#15803D' : '#94A3B8' }}
              >
                {f.weight > 0 ? `+${f.weight}` : f.weight < 0 ? String(f.weight) : '—'}
              </span>
            </div>
          ))}
          {children}
        </div>
      )}
    </div>
  );
}

export default function RiskPanel() {
  const [data, setData] = useState<{
    students: StudentRisk[]; teachers: TeacherRiskRow[]; batches: BatchHealthRow[];
  } | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [tab, setTab] = useState<'students' | 'teachers' | 'batches'>('students');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/analytics/risk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        });
        const json = await res.json();
        if (cancelled) return;
        if (!json.ok) { setFailed(json.message ?? 'Could not load risk signals.'); return; }
        setData({ students: json.students, teachers: json.teachers, batches: json.batches });
      } catch {
        if (!cancelled) setFailed('Could not load risk signals.');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (failed) {
    return <div className="card card--compact"><p className="text-[13px] text-slate-600">{failed}</p></div>;
  }
  if (!data) {
    return (
      <div className="flex items-center justify-center py-10 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  const atRiskStudents = data.students.filter((s) => s.risk.band === 'high' || s.risk.band === 'medium');
  const atRiskTeachers = data.teachers.filter((t) => t.risk.band === 'high' || t.risk.band === 'medium');
  const weakBatches = data.batches.filter((b) => b.health.score !== null && b.health.score < 70);

  const TABS = [
    { key: 'students' as const, label: 'Learners', icon: Users, count: atRiskStudents.length },
    { key: 'teachers' as const, label: 'Teachers', icon: GraduationCap, count: atRiskTeachers.length },
    { key: 'batches' as const, label: 'Batches', icon: TrendingDown, count: weakBatches.length },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`inline-flex items-center gap-1.5 min-h-[44px] px-3.5 text-xs font-bold whitespace-nowrap transition-colors ${
                tab === t.key ? 'text-violet-700 border-b-2 border-violet-600' : 'text-slate-500 hover:text-slate-700'
              }`}
              style={{ fontFamily: 'var(--font-grotesk)' }}
            >
              <Icon className="w-3.5 h-3.5" />
              {t.label}
              {t.count > 0 && (
                <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tab === 'students' && (
        atRiskStudents.length === 0 ? (
          <div className="card card--feature text-center py-8">
            <p className="text-[14px] text-slate-600">
              No learner is showing risk signals right now.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {atRiskStudents.map((s) => (
              <Expandable
                key={s.student_id}
                title={s.student_name}
                subtitle={[s.course, s.batch_code, `${s.credits} credits`].filter(Boolean).join(' · ')}
                badge={<Band risk={s.risk} />}
                factors={s.risk.factors}
              >
                <p className="text-[12.5px] text-slate-500 pt-1">{s.risk.summary}</p>
              </Expandable>
            ))}
          </div>
        )
      )}

      {tab === 'teachers' && (
        atRiskTeachers.length === 0 ? (
          <div className="card card--feature text-center py-8">
            <p className="text-[14px] text-slate-600">Every teacher is delivering reliably.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {atRiskTeachers.map((t) => (
              <Expandable
                key={t.teacher_id}
                title={t.teacher_name}
                subtitle={`${t.scheduled} classes scheduled`}
                badge={<Band risk={t.risk} />}
                factors={t.risk.factors}
              >
                <p className="text-[12.5px] text-slate-500 pt-1">{t.risk.summary}</p>
              </Expandable>
            ))}
          </div>
        )
      )}

      {tab === 'batches' && (
        data.batches.length === 0 ? (
          <div className="card card--feature text-center py-8">
            <p className="text-[14px] text-slate-600">No batches yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.batches.map((b) => {
              const score = b.health.score;
              const tone = score === null ? '#64748B' : score >= 80 ? '#15803D' : score >= 60 ? '#B45309' : '#B91C1C';
              return (
                <Expandable
                  key={b.cohort_id}
                  title={b.batch_code ?? b.course ?? 'Batch'}
                  subtitle={[b.course, b.teacher_name].filter(Boolean).join(' · ')}
                  badge={
                    <span
                      className="text-[10px] font-black tracking-wider px-1.5 py-0.5 rounded uppercase"
                      style={{ color: tone, background: `${tone}14` }}
                    >
                      {score === null ? 'No classes yet' : `${score}/100`}
                    </span>
                  }
                  /* Health components are points earned, not risk added, so
                     they are rendered below as "8 / 10" rather than through the
                     +weight list the risk rows use. */
                  factors={[]}
                >
                  <div className="space-y-1">
                    {b.health.components.map((c) => (
                      <div key={c.label} className="flex items-baseline justify-between gap-3 text-[12.5px]">
                        <span className="text-slate-600">
                          {c.label}: <span className="text-slate-500">{c.detail}</span>
                        </span>
                        <span className="tabular-nums text-slate-700 font-semibold shrink-0">
                          {c.score} / {c.outOf}
                        </span>
                      </div>
                    ))}
                    <p className="text-[12.5px] text-slate-500 pt-1">{b.health.summary}</p>
                  </div>
                </Expandable>
              );
            })}
          </div>
        )
      )}

      <p className="text-[11.5px] text-slate-400 flex items-start gap-1.5 leading-[1.55]">
        <Info className="w-3.5 h-3.5 shrink-0 mt-[1px]" />
        <span>
          These are rules over data the system already holds, not forecasts from
          a model — there is not yet enough completed course history to train one
          honestly. Open any row to see exactly which facts produced its score.
        </span>
      </p>
    </div>
  );
}
