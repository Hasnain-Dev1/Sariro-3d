'use client';

import { useEffect, useState } from 'react';
import {
  Play, Pause, RotateCcw, Sparkles, Compass, MessageCircleQuestion, CheckCircle2, Circle, Quote, LifeBuoy, Rocket,
  Trophy, ExternalLink, AudioLines, HeartHandshake, Ban, ChevronDown, Lightbulb, Target, Users, Clock,
} from 'lucide-react';
import { trialSubjects } from '@/lib/trial/subjects';
import { gradeTag } from '@/lib/grade/tag';
import {
  playbookFor, rankPaths, warmUpsFor, bandOf, startingLevel, BAND_LABEL, LEVEL_LABEL,
  type Level, type Path, type Step, type TrialIntake,
} from '@/lib/trial/playbooks';
import SoundLab from '@/components/speaking/sound-lab';
import HeroPicker from '@/components/trial/hero-picker';
import { FEELING } from '@/lib/trial/intake';

/**
 * SARIRO — the trial playbook, open in class
 * ============================================================================
 * The plan for one trial, for the teacher running it. Pick the subject and the
 * child's grade (a trial booking fills both in), say what you know about the
 * child, tap what you hear when you ask the diagnostic questions — and the
 * paths re-order themselves with the reasons written out. Nothing is hidden: a
 * teacher who reads the child differently picks another path in one click.
 *
 * The class clock runs the half hour: opening, the chosen path's steps, the
 * close — so the teacher always knows which step they should be on and never
 * finds out at minute 34 that the parent is still waiting.
 */

const LEVEL_SCORE: Record<Level, number> = { new: 0, some: 1, strong: 2 };
const SCORE_LEVEL: Level[] = ['new', 'some', 'strong'];
const GRADES = [...Array.from({ length: 12 }, (_, i) => i + 1), 13, 14];

interface Saved {
  experience?: Level;
  interests: string[];
  diag: Record<number, Level>;
  pathId: string | null;
  done: string[];
}

const EMPTY: Saved = { interests: [], diag: {}, pathId: null, done: [] };

function readSaved(key: string): Saved {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return EMPTY;
    const v = JSON.parse(raw) as Partial<Saved>;
    return { ...EMPTY, ...v, interests: Array.isArray(v.interests) ? v.interests : [], done: Array.isArray(v.done) ? v.done : [], diag: v.diag ?? {} };
  } catch {
    return EMPTY;
  }
}

function mmss(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export default function PlaybookView() {
  const [subject, setSubject] = useState('coding');
  const [grade, setGrade] = useState<number | null>(null);
  const [child, setChild] = useState<string | null>(null);
  const [booking, setBooking] = useState<string | null>(null);
  const [student, setStudent] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  /* What the family said on /my-class before the class (components/trial/trial-prep.tsx). */
  const [family, setFamily] = useState<{ state: 'none' | 'loading' | 'off' | 'empty' | 'ready'; intake: TrialIntake | null }>({ state: 'none', intake: null });

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const s = q.get('subject');
    if (s && playbookFor(s)) setSubject(playbookFor(s)!.subject);
    const g = Number(q.get('grade'));
    if (Number.isInteger(g) && g >= 1 && g <= 14) setGrade(g);
    setChild(q.get('child'));
    setBooking(q.get('booking'));
    setStudent(q.get('student'));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!booking || !student) return;
    let live = true;
    setFamily({ state: 'loading', intake: null });
    fetch(`/api/trial/intake?bookingId=${encodeURIComponent(booking)}&studentId=${encodeURIComponent(student)}`)
      .then((r) => r.json())
      .then((j) => {
        if (!live) return;
        if (!j?.ok) setFamily({ state: 'empty', intake: null });
        else if (j.configured === false) setFamily({ state: 'off', intake: null });
        else setFamily({ state: j.intake ? 'ready' : 'empty', intake: (j.intake as TrialIntake | null) ?? null });
      })
      .catch(() => { if (live) setFamily({ state: 'empty', intake: null }); });
    return () => { live = false; };
  }, [booking, student]);

  const playbook = playbookFor(subject)!;
  const storageKey = `sariro:playbook:${booking ?? 'practice'}:${subject}`;
  const [saved, setSaved] = useState<Saved>(EMPTY);
  useEffect(() => { if (ready) setSaved(readSaved(storageKey)); }, [ready, storageKey]);
  const update = (patch: Partial<Saved>) => {
    setSaved((prev) => {
      const next = { ...prev, ...patch };
      try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* storage blocked */ }
      return next;
    });
  };

  const diagLevels = Object.values(saved.diag);
  const diagLevel: Level | undefined = diagLevels.length
    ? SCORE_LEVEL[Math.round(diagLevels.reduce((n, l) => n + LEVEL_SCORE[l], 0) / diagLevels.length)]
    : undefined;
  /* What the teacher heard beats what they chose, which beats what the family
     said. Interests add up: the family's, plus any the teacher spotted. */
  const fam = family.intake;
  const intake: TrialIntake = {
    experience: diagLevel ?? saved.experience ?? fam?.experience,
    interests: [...new Set([...(fam?.interests ?? []), ...saved.interests])],
    warmUp: diagLevel || saved.experience ? undefined : fam?.warmUp,
  };
  /* The same starting level the path ranking uses — including the nudge a
     perfect (or empty) warm-up gives — so the note and the reasons agree. */
  const level: Level = startingLevel(intake);
  const nudged = !!intake.warmUp && level !== (intake.experience ?? 'some');

  const ranked = rankPaths(playbook, { grade, intake });
  const chosen: Path = playbook.paths.find((p) => p.id === saved.pathId) ?? ranked[0].path;
  const warmUps = warmUpsFor(playbook, grade);

  const [talkLevel, setTalkLevel] = useState<Level | null>(null);

  /* ── The class clock ── */
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [pausedAt, setPausedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (startedAt === null || pausedAt !== null) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [startedAt, pausedAt]);
  const elapsed = startedAt === null ? 0 : (pausedAt ?? now) - startedAt;
  const timeline: { label: string; minutes: number; phase: 'open' | 'core' | 'close' }[] = [
    { label: playbook.opening.title, minutes: playbook.opening.minutes, phase: 'open' },
    ...chosen.steps.map((s) => ({ label: s.title, minutes: s.minutes, phase: 'core' as const })),
    { label: playbook.close.title, minutes: playbook.close.minutes, phase: 'close' },
  ];
  const total = timeline.reduce((n, t) => n + t.minutes, 0);
  let acc = 0;
  let currentIdx = timeline.length - 1;
  for (let i = 0; i < timeline.length; i++) {
    if (elapsed < (acc + timeline[i].minutes) * 60_000) { currentIdx = i; break; }
    acc += timeline[i].minutes;
  }
  const over = elapsed > total * 60_000;

  const toggleClock = () => {
    if (startedAt === null) { setStartedAt(Date.now()); setNow(Date.now()); return; }
    if (pausedAt === null) { setPausedAt(Date.now()); return; }
    setStartedAt(startedAt + (Date.now() - pausedAt));
    setPausedAt(null);
  };

  const subjects = trialSubjects();
  const band = bandOf(grade);

  return (
    <div className="space-y-6">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-[1.4rem] text-white" style={{ background: 'radial-gradient(120% 140% at 0% 0%, #0F766E 0%, #0F172A 60%, #0B0F19 100%)' }}>
        <span aria-hidden className="pointer-events-none absolute -right-24 -top-24 w-80 h-80 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="relative p-5 sm:p-7">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/50" style={{ fontFamily: 'var(--font-grotesk)' }}>
            Trial playbook{child ? ` · ${child}` : ''}{booking ? ' · from your schedule' : ''}
          </p>
          <h1 className="mt-1 text-[2rem] sm:text-[2.4rem] font-extrabold leading-tight tracking-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>{playbook.title}</h1>
          <p className="mt-1.5 text-[15px] text-white/75 max-w-2xl">{playbook.promise}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <HeroPicker
              icon={Compass}
              label="Subject"
              value={subject}
              onChange={setSubject}
              options={subjects.map((s) => ({ value: s.value, label: s.label, group: s.group }))}
            />
            <HeroPicker
              icon={Users}
              label="Grade"
              value={grade === null ? '' : String(grade)}
              onChange={(v) => setGrade(v ? Number(v) : null)}
              searchable={false}
              options={[{ value: '', label: 'Grade not known' }, ...GRADES.map((g) => ({ value: String(g), label: gradeTag(g) }))]}
            />
            {band && <span className="rounded-full bg-white/10 px-3 py-1.5 text-[12px] font-semibold text-white/80">{BAND_LABEL[band]}</span>}
            <span className="rounded-full bg-white/10 px-3 py-1.5 text-[12px] font-semibold text-white/80">{playbook.paths.length} paths</span>
          </div>
        </div>
      </section>

      {/* ── Class clock ──────────────────────────────────────────────────── */}
      <section className="sticky top-16 z-20 rounded-2xl border border-slate-200 bg-white/95 backdrop-blur px-4 py-3 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.5)]">
        <div className="flex items-center gap-3">
          <button type="button" onClick={toggleClock} className={`shrink-0 inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl text-white text-[13px] font-bold ${startedAt !== null && pausedAt === null ? 'bg-slate-900' : 'bg-emerald-600'}`}>
            {startedAt !== null && pausedAt === null ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> {startedAt === null ? 'Start class' : 'Resume'}</>}
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[13px] font-bold text-slate-900 truncate">
                {startedAt === null ? `A ${total}-minute class` : over ? 'Time — finish now' : `Now: ${timeline[currentIdx].label}`}
              </p>
              <p className={`text-[15px] font-black tabular-nums ${over ? 'text-rose-600' : 'text-slate-900'}`}><Clock className="inline w-4 h-4 mr-1 text-slate-400" />{mmss(elapsed)} <span className="text-slate-400 font-bold">/ {total}:00</span></p>
            </div>
            <div className="mt-2 flex gap-1 h-2">
              {timeline.map((t, i) => {
                const start = timeline.slice(0, i).reduce((n, x) => n + x.minutes, 0) * 60_000;
                const fill = Math.max(0, Math.min(1, (elapsed - start) / (t.minutes * 60_000)));
                const color = t.phase === 'open' ? '#0EA5E9' : t.phase === 'close' ? '#8B5CF6' : '#10B981';
                return (
                  <div key={i} className="rounded-full bg-slate-100 overflow-hidden" style={{ flex: t.minutes }} title={`${t.label} · ${t.minutes} min`}>
                    <div className="h-full rounded-full" style={{ width: `${fill * 100}%`, background: color }} />
                  </div>
                );
              })}
            </div>
          </div>
          {startedAt !== null && (
            <button type="button" onClick={() => { setStartedAt(null); setPausedAt(null); }} className="shrink-0 w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center" aria-label="Reset the clock">
              <RotateCcw className="w-4 h-4 text-slate-600" />
            </button>
          )}
        </div>
      </section>

      {/* ── Who is this ──────────────────────────────────────────────────── */}
      <section className="grid gap-4 lg:grid-cols-2">
        <Card icon={<Sparkles className="w-4 h-4" />} title="What you know before class" tone="sky">
          {family.state !== 'none' && <FamilyAnswers state={family.state} intake={family.intake} playbook={playbook} child={child} />}
          <p className="text-[12.5px] font-bold uppercase tracking-wider text-slate-400 mb-2">Experience</p>
          <div className="flex flex-wrap gap-2">
            {playbook.intake.experience.map((e) => (
              <Chip key={e.id} on={saved.experience === e.id} onClick={() => update({ experience: saved.experience === e.id ? undefined : e.id })}>{e.label}</Chip>
            ))}
          </div>
          <p className="text-[12.5px] font-bold uppercase tracking-wider text-slate-400 mt-4 mb-2">Interested in</p>
          <div className="flex flex-wrap gap-2">
            {playbook.intake.interests.map((i) => {
              const on = saved.interests.includes(i.id);
              return (
                <Chip key={i.id} on={on} onClick={() => update({ interests: on ? saved.interests.filter((x) => x !== i.id) : [...saved.interests, i.id] })}>
                  <span aria-hidden>{i.emoji}</span> {i.label}
                </Chip>
              );
            })}
          </div>
          <p className="mt-4 text-[12.5px] text-slate-500">Saved on this device{booking ? ' for this booking' : ''}. The paths below re-order as you choose.</p>
        </Card>

        <Card icon={<Lightbulb className="w-4 h-4" />} title="Warm-up questions" tone="amber">
          <p className="text-[13px] text-slate-600 mb-3">Ask one while they settle — a quick read on where they are, and a first win.</p>
          <div className="space-y-2">
            {warmUps.map((w) => <WarmUpItem key={w.q} q={w.q} options={w.options} answer={w.answer} explain={w.explain} />)}
          </div>
        </Card>
      </section>

      {/* ── Opening and diagnosis ────────────────────────────────────────── */}
      <section className="grid gap-4 lg:grid-cols-2">
        <StepCard step={playbook.opening} label="Opening" color="#0EA5E9" active={startedAt !== null && timeline[currentIdx].phase === 'open'} />
        <Card icon={<MessageCircleQuestion className="w-4 h-4" />} title="Diagnose: tap what you hear" tone="emerald">
          <div className="space-y-4">
            {playbook.diagnose.map((d, qi) => (
              <div key={d.ask}>
                <p className="text-[14px] font-bold text-slate-900 leading-snug">{d.ask}</p>
                <div className="mt-2 grid gap-1.5">
                  {d.listenFor.map((l) => {
                    const on = saved.diag[qi] === l.means;
                    return (
                      <button
                        key={l.answer}
                        type="button"
                        onClick={() => { const diag = { ...saved.diag }; if (on) delete diag[qi]; else diag[qi] = l.means; update({ diag }); }}
                        className={`text-left rounded-xl border px-3 py-2 text-[13px] transition-colors ${on ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                      >
                        <span className="text-slate-700">{l.answer}</span>
                        <span className={`ml-2 text-[11px] font-bold ${on ? 'text-emerald-700' : 'text-slate-400'}`}>→ {LEVEL_LABEL[l.means]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-[13px] text-slate-700">
            <Target className="inline w-4 h-4 mr-1 text-emerald-600" />
            Pitch this class at: <strong>{LEVEL_LABEL[level]}</strong>
            {diagLevel ? ' (from what you heard)' : saved.experience ? ' (from what you know)' : fam?.experience ? ' (from what the family said)' : ' (nothing known yet)'}
            {nudged && intake.warmUp ? ` — moved by a ${intake.warmUp.correct}/${intake.warmUp.total} warm-up` : ''}
          </p>
        </Card>
      </section>

      {/* ── Paths ────────────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-[16px] font-extrabold text-slate-900 mb-3" style={{ fontFamily: 'var(--font-jakarta)' }}>Choose the path</h2>
        <div className="grid gap-2 md:grid-cols-2">
          {ranked.map((r, i) => {
            const on = r.path.id === chosen.id;
            return (
              <button
                key={r.path.id}
                type="button"
                onClick={() => update({ pathId: r.path.id, done: [] })}
                className={`text-left rounded-2xl border p-4 transition-all ${on ? 'border-emerald-500 bg-emerald-50/60 shadow-[0_16px_36px_-28px_rgba(16,185,129,0.8)]' : 'border-slate-200 bg-white hover:border-slate-300'} ${r.offBand ? 'opacity-70' : ''}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[15px] font-extrabold text-slate-900 leading-snug" style={{ fontFamily: 'var(--font-jakarta)' }}>{r.path.name}</p>
                  {i === 0 && !r.offBand && <span className="shrink-0 rounded-full bg-emerald-600 text-white px-2 py-0.5 text-[10.5px] font-bold">Best fit</span>}
                  {r.offBand && <span className="shrink-0 rounded-full bg-slate-200 text-slate-600 px-2 py-0.5 text-[10.5px] font-bold">Different grade</span>}
                </div>
                <p className="mt-1 text-[13px] text-slate-600">{r.path.forWho}</p>
                {r.reasons.length > 0 && <p className="mt-2 text-[12px] font-semibold text-emerald-700">{r.reasons.join(' · ')}</p>}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── The chosen path ──────────────────────────────────────────────── */}
      <section className="rounded-[1.4rem] border border-slate-200 bg-white overflow-hidden">
        <div className="px-5 sm:px-6 py-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-white/70">The path · {chosen.steps.reduce((n, s) => n + s.minutes, 0)} minutes</p>
          <p className="text-[1.5rem] font-extrabold leading-tight" style={{ fontFamily: 'var(--font-jakarta)' }}>{chosen.name}</p>
          <p className="mt-2 inline-flex items-start gap-2 rounded-xl bg-white/15 px-3 py-2 text-[14px]">
            <Trophy className="w-4 h-4 mt-0.5 shrink-0" /> <span><strong>The win they will say: </strong>“{chosen.win}”</span>
          </p>
        </div>

        {chosen.tools && chosen.tools.length > 0 && (
          <div className="px-5 sm:px-6 pt-5 space-y-3">
            {chosen.tools.map((t) => <ToolRow key={t.label} label={t.label} href={t.href} soundLab={t.soundLab} />)}
          </div>
        )}

        <div className="p-5 sm:p-6 space-y-3">
          {chosen.steps.map((s, i) => {
            const id = `${chosen.id}:${i}`;
            const done = saved.done.includes(id);
            const active = startedAt !== null && timeline[currentIdx].phase === 'core' && currentIdx - 1 === i;
            return (
              <div key={id} className={`rounded-2xl border p-4 transition-colors ${active ? 'border-emerald-400 bg-emerald-50/50' : done ? 'border-slate-200 bg-slate-50' : 'border-slate-200 bg-white'}`}>
                <div className="flex items-start gap-3">
                  <button type="button" onClick={() => update({ done: done ? saved.done.filter((x) => x !== id) : [...saved.done, id] })} className="mt-0.5 shrink-0" aria-label={done ? 'Mark not done' : 'Mark done'}>
                    {done ? <CheckCircle2 className="w-6 h-6 text-emerald-600" /> : <Circle className="w-6 h-6 text-slate-300" />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-[15px] font-extrabold ${done ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{i + 1}. {s.title}</p>
                      <span className="shrink-0 text-[12px] font-bold text-slate-400">{s.minutes} min</span>
                    </div>
                    <StepBody step={s} />
                  </div>
                </div>
              </div>
            );
          })}

          <div className="grid gap-3 md:grid-cols-2">
            <Callout icon={<LifeBuoy className="w-4 h-4" />} title="If they get stuck" items={chosen.ifStuck} tone="amber" />
            <Callout icon={<Rocket className="w-4 h-4" />} title="If they are flying" items={chosen.ifFlying} tone="violet" />
          </div>
          <p className="rounded-xl bg-slate-900 text-white px-4 py-3 text-[14px]"><strong>Show-off moment: </strong>{chosen.showOff}</p>
        </div>
      </section>

      {/* ── Close, parent talk, what to avoid ────────────────────────────── */}
      <section className="grid gap-4 lg:grid-cols-2">
        <StepCard step={playbook.close} label="Close" color="#8B5CF6" active={startedAt !== null && timeline[currentIdx].phase === 'close'} />
        <div className="space-y-4">
          <Card icon={<HeartHandshake className="w-4 h-4" />} title="The honest read for the parent" tone="violet">
            <div className="flex gap-1.5 mb-3">
              {SCORE_LEVEL.map((l) => (
                <Chip key={l} on={(talkLevel ?? level) === l} onClick={() => setTalkLevel(l)}>{LEVEL_LABEL[l]}</Chip>
              ))}
            </div>
            <p className="text-[14.5px] text-slate-800 leading-relaxed">“{playbook.parentTalk[talkLevel ?? level]}”</p>
            <p className="mt-2 text-[12px] text-slate-500">Say it in your own words, with one specific thing the child did today. Never quote prices.</p>
          </Card>
          <Card icon={<Ban className="w-4 h-4" />} title="What loses this trial" tone="rose">
            <ul className="space-y-1.5">
              {playbook.avoid.map((a) => <li key={a} className="flex gap-2 text-[13.5px] text-slate-700"><span className="text-rose-400">•</span>{a}</li>)}
            </ul>
          </Card>
        </div>
      </section>
    </div>
  );
}

/* ── Pieces ──────────────────────────────────────────────────────────────── */

function FamilyAnswers({
  state, intake, playbook, child,
}: {
  state: 'loading' | 'off' | 'empty' | 'ready';
  intake: TrialIntake | null;
  playbook: NonNullable<ReturnType<typeof playbookFor>>;
  child: string | null;
}) {
  const who = child ?? 'The family';
  if (state === 'loading') return <div className="mb-4 h-20 rounded-xl bg-slate-100 animate-pulse" />;
  if (state === 'off') return <p className="mb-4 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-[12.5px] text-slate-500">Family prep is not switched on yet — run scripts/trial-intake.sql.</p>;
  if (state === 'empty' || !intake) return <p className="mb-4 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-[12.5px] text-slate-500">{who} has not done the class prep yet. Ask the questions below in the first minutes.</p>;
  const exp = playbook.intake.experience.find((e) => e.id === intake.experience);
  const liked = playbook.intake.interests.filter((i) => intake.interests?.includes(i.id));
  const feel = intake.feeling ? FEELING[intake.feeling] : null;
  return (
    <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50/60 p-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-700">{who} told us before class</p>
      <div className="mt-2 grid gap-1.5 text-[13px] text-slate-800">
        {exp && <p><span className="text-slate-500">Experience: </span><strong>{exp.label}</strong></p>}
        {liked.length > 0 && <p><span className="text-slate-500">Likes: </span>{liked.map((i) => `${i.emoji} ${i.label}`).join(' · ')}</p>}
        {feel && <p><span className="text-slate-500">Feeling: </span>{feel.emoji} {feel.label}{intake.feeling! <= 2 ? ' — start gently' : ''}</p>}
        {intake.warmUp && <p><span className="text-slate-500">Warm-up: </span><strong>{intake.warmUp.correct}/{intake.warmUp.total}</strong></p>}
        <p><span className="text-slate-500">Microphone: </span>{intake.micOk ? '✓ tested and working' : 'not tested — check it first'}</p>
        {intake.question && <p className="rounded-lg bg-white border border-blue-100 px-2.5 py-1.5"><span className="text-slate-500">Their question: </span>“{intake.question}”</p>}
      </div>
    </div>
  );
}

const TONES = {
  sky: 'text-sky-700 bg-sky-50',
  amber: 'text-amber-700 bg-amber-50',
  emerald: 'text-emerald-700 bg-emerald-50',
  violet: 'text-violet-700 bg-violet-50',
  rose: 'text-rose-700 bg-rose-50',
} as const;

function Card({ icon, title, tone, children }: { icon: React.ReactNode; title: string; tone: keyof typeof TONES; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${TONES[tone]}`}>{icon} {title}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[13px] font-semibold transition-colors ${on ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}>
      {children}
    </button>
  );
}

function StepBody({ step }: { step: Step }) {
  return (
    <>
      <ul className="mt-2 space-y-1.5">
        {step.do.map((d) => <li key={d} className="flex gap-2 text-[14px] text-slate-700 leading-relaxed"><span className="text-slate-300 shrink-0">•</span><span>{d}</span></li>)}
      </ul>
      {step.say && (
        <p className="mt-2.5 flex gap-2 rounded-xl bg-sky-50 border border-sky-100 px-3 py-2 text-[13.5px] text-sky-950">
          <Quote className="w-4 h-4 shrink-0 text-sky-400 mt-0.5" /> <span><strong>Say: </strong>“{step.say}”</span>
        </p>
      )}
      {step.check && <p className="mt-2 text-[12.5px] font-semibold text-emerald-700"><CheckCircle2 className="inline w-3.5 h-3.5 mr-1" />Move on when: {step.check}</p>}
    </>
  );
}

function StepCard({ step, label, color, active }: { step: Step; label: string; color: string; active: boolean }) {
  return (
    <div className={`rounded-2xl border bg-white p-5 transition-colors ${active ? 'border-2' : 'border-slate-200'}`} style={active ? { borderColor: color } : undefined}>
      <div className="flex items-center justify-between gap-2">
        <p className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-white" style={{ background: color }}>{label} · {step.minutes} min</p>
        {active && <span className="text-[11.5px] font-bold" style={{ color }}>Now</span>}
      </div>
      <p className="mt-2 text-[16px] font-extrabold text-slate-900" style={{ fontFamily: 'var(--font-jakarta)' }}>{step.title}</p>
      <StepBody step={step} />
    </div>
  );
}

function Callout({ icon, title, items, tone }: { icon: React.ReactNode; title: string; items: string[]; tone: 'amber' | 'violet' }) {
  const cls = tone === 'amber' ? 'border-amber-200 bg-amber-50/70 text-amber-900' : 'border-violet-200 bg-violet-50/70 text-violet-900';
  return (
    <div className={`rounded-2xl border p-4 ${cls}`}>
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em]">{icon} {title}</p>
      <ul className="mt-2 space-y-1.5">
        {items.map((it) => <li key={it} className="text-[13.5px] leading-snug">• {it}</li>)}
      </ul>
    </div>
  );
}

function WarmUpItem({ q, options, answer, explain }: { q: string; options: string[]; answer: number; explain: string }) {
  const [shown, setShown] = useState(false);
  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <button type="button" onClick={() => setShown((s) => !s)} className="w-full text-left flex items-start justify-between gap-2">
        <span className="text-[13.5px] font-semibold text-slate-800">{q}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-slate-400 transition-transform ${shown ? 'rotate-180' : ''}`} />
      </button>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {options.map((o, i) => (
          <span key={o} className={`rounded-lg px-2 py-0.5 text-[12.5px] ${shown && i === answer ? 'bg-emerald-100 text-emerald-800 font-bold' : 'bg-slate-100 text-slate-600'}`}>{o}</span>
        ))}
      </div>
      {shown && <p className="mt-2 text-[12.5px] text-slate-600">{explain}</p>}
    </div>
  );
}

function ToolRow({ label, href, soundLab }: { label: string; href?: string; soundLab?: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13.5px] font-bold text-slate-800">{soundLab ? <AudioLines className="inline w-4 h-4 mr-1 text-pink-600" /> : <ExternalLink className="inline w-4 h-4 mr-1 text-slate-400" />}{label}</p>
        {href && (
          <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-slate-900 text-white text-[12.5px] font-bold">
            Open to screen-share <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
        {soundLab && (
          <button type="button" onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-pink-600 text-white text-[12.5px] font-bold">
            {open ? 'Hide' : 'Open here to screen-share'}
          </button>
        )}
      </div>
      {soundLab && open && (
        <div className="mt-3">
          {/* A teacher demonstrating: nothing is logged to their own practice record. */}
          <SoundLab patternIds={soundLab} practise={false} logAs={null} />
        </div>
      )}
    </div>
  );
}
