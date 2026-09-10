'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Loader2, RefreshCw, PhoneCall, Star, Clock, AlertTriangle, CheckCircle2,
  CalendarClock, MessageSquarePlus, X, Send, BadgeCheck, ChevronRight,
} from 'lucide-react';
import {
  QUEUES, visibleQueues, type QueueKey, type QueueBuckets,
} from '@/lib/seller/queues';
import {
  reminderStatus, describeDue, QUICK_REMINDERS, type ReminderRow,
} from '@/lib/seller/reminders';
import { pct, type MetricWindows } from '@/lib/seller/metrics';
import { inr, type IncentiveBreakdown } from '@/lib/seller/incentives';

/**
 * SARIRO — the seller's morning, on one screen
 * ============================================================================
 * A seller used to open their dashboard to every lead assigned to them,
 * ordered by when it arrived — the one ordering that does not matter. Working
 * out which four of the forty needed ringing was a job they did by reading,
 * every morning, from scratch, and differently each time.
 *
 * Six queues, each with a verb. Every one of these answers was already in the
 * database and none of them was on a screen.
 *
 * ── Why the whole thing is one fetch ────────────────────────────────────────
 * The counts and the lists come from the same bucketing on the server, so a
 * badge can never say 3 above a list showing 2. That mismatch is the specific
 * thing that teaches people to stop trusting a number.
 *
 * ── The logbook is here, not a page away ────────────────────────────────────
 * A seller on a call has one window. Making them navigate to write down what
 * was said means it gets written down after the call, or not at all — and
 * "not at all" is where `student_leads.notes` came from: one column, silently
 * overwritten by whoever typed last.
 */

interface Trial {
  id: string;
  slot_start: string | null;
  slot_end: string | null;
  status: string | null;
  subject: string | null;
  teacher_name: string | null;
  join_url: string | null;
}

interface Lead {
  id: string;
  student_name: string | null;
  parent_name: string | null;
  phone: string | null;
  phone_country_code: string | null;
  email: string | null;
  stage: string;
  trial_status: string | null;
  subject: string | null;
  grade: number | null;
  sale_value: number | null;
  sale_stage?: string | null;
  created_at?: string;
  last_updated?: string;
  trial: Trial | null;
  teacher_rating: number | null;
  teacher_remarks: string | null;
  interest_level: string | null;
  student_rating: number | null;
  student_remarks: string | null;
}

interface Payload {
  ok: boolean;
  sellerName: string | null;
  queues: QueueBuckets;
  counts: Record<QueueKey, number>;
  metrics: MetricWindows;
  incentive: IncentiveBreakdown;
  pay: { base: number; incentive: number; total: number };
  reminders: ReminderRow[];
  leads: Lead[];
}

const ICONS: Record<QueueKey, typeof PhoneCall> = {
  slot_assistance: CalendarClock,
  missed_trial: AlertTriangle,
  final_conversation: PhoneCall,
  today_followup: Clock,
  overdue_followup: AlertTriangle,
  converted: CheckCircle2,
};

type Window = 'month' | 'last30' | 'lifetime';

export default function SellerQueues({ sellerId }: { sellerId?: string }) {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<QueueKey | null>(null);
  const [openLead, setOpenLead] = useState<string | null>(null);
  const [window_, setWindow] = useState<Window>('month');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = sellerId ? `/api/seller/dashboard?sellerId=${sellerId}` : '/api/seller/dashboard';
      const res = await fetch(url);
      const json = await res.json();
      if (!json?.ok) throw new Error(json?.message || 'Could not load your leads.');
      setData(json as Payload);
      /* Land on the queue with work in it rather than an empty default. The
         first thing a seller should see is the thing that is late. */
      setActive((current) => {
        if (current) return current;
        const counts = json.counts as Record<QueueKey, number>;
        return (
          (['overdue_followup', 'missed_trial', 'slot_assistance', 'final_conversation', 'today_followup'] as QueueKey[])
            .find((k) => counts[k] > 0) ?? 'today_followup'
        );
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load your leads.');
    } finally {
      setLoading(false);
    }
  }, [sellerId]);

  useEffect(() => { void load(); }, [load]);

  /* A reminder deep-link from a notification: /dashboard/seller?lead=… */
  useEffect(() => {
    if (typeof globalThis === 'undefined' || !('location' in globalThis)) return;
    const wanted = new URLSearchParams(globalThis.location.search).get('lead');
    if (wanted) setOpenLead(wanted);
  }, []);

  const remindersByLead = useMemo(() => {
    const map = new Map<string, ReminderRow[]>();
    for (const r of data?.reminders ?? []) {
      const list = map.get(r.lead_id);
      if (list) list.push(r);
      else map.set(r.lead_id, [r]);
    }
    return map;
  }, [data]);

  if (loading && !data) {
    return (
      <div className="card card-md flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card card-md">
        <p className="text-sm text-rose-700">{error}</p>
        <button onClick={() => void load()} className="mt-3 text-xs font-bold text-blue-700 hover:underline">
          Try again
        </button>
      </div>
    );
  }

  if (!data) return null;

  const shown = visibleQueues(data.counts);
  const list = active ? data.queues[active] : [];
  const leadById = new Map(data.leads.map((l) => [l.id, l]));
  const detail = openLead ? leadById.get(openLead) ?? null : null;
  const m = data.metrics[window_];

  return (
    <div className="space-y-5">
      {/* ── How the month is going ───────────────────────────────────────── */}
      <section className="card card-md">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700" style={{ fontFamily: 'var(--font-grotesk)' }}>
            Your numbers
          </h2>
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5">
            {([['month', 'This month'], ['last30', 'Last 30 days'], ['lifetime', 'All time']] as [Window, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setWindow(key)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition ${
                  window_ === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Stat label="Leads" value={String(m.leadsReceived)} />
          <Stat label="Trials booked" value={String(m.trialsBooked)} />
          <Stat label="Trials done" value={String(m.trialsCompleted)} />
          <Stat label="Sales" value={String(m.sales)} />
          <Stat label="Completion" value={pct(m.trialCompletionRate)} />
          <Stat label="Conversion" value={pct(m.conversionRate)} tone="text-blue-700" />
        </div>

        {/* ── What that is worth ─────────────────────────────────────────── */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
          <span className="text-slate-500">
            Base <strong className="text-slate-800">{inr(data.pay.base)}</strong>
          </span>
          <span className="text-slate-500">
            Incentive this month <strong className="text-slate-800">{inr(data.incentive.total)}</strong>
          </span>
          {data.incentive.nextTier && (
            <span className="text-amber-700 font-semibold">
              {data.incentive.nextTier.salesNeeded} more{' '}
              {data.incentive.nextTier.salesNeeded === 1 ? 'sale' : 'sales'} → {inr(data.incentive.nextTier.amount)}
            </span>
          )}
          <span className="ml-auto text-[11px] text-slate-400">
            Incentives count sales HR has punched, and need HR approval before payroll.
          </span>
        </div>
      </section>

      {/* ── The six queues ───────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-700" style={{ fontFamily: 'var(--font-grotesk)' }}>
            Today
          </h2>
          <button
            onClick={() => void load()}
            className="text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5">
          {shown.map((q) => {
            const Icon = ICONS[q.key];
            const count = data.counts[q.key];
            const on = active === q.key;
            return (
              <button
                key={q.key}
                onClick={() => { setActive(q.key); setOpenLead(null); }}
                className={`text-left rounded-xl border p-3 transition ${
                  on ? `bg-white border-slate-300 ring-2 ${q.tone.ring} shadow-sm` : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${q.tone.chip}`}>
                    {count}
                  </span>
                </div>
                <p className="mt-2 text-[12px] font-bold text-slate-800 leading-tight">{q.label}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{q.action}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── The list ─────────────────────────────────────────────────────── */}
      {active && (
        <section className="card card-md">
          <h3 className="text-sm font-extrabold text-slate-800 mb-3">
            {QUEUES.find((q) => q.key === active)?.label}
            <span className="ml-2 text-xs font-normal text-slate-400">{list.length}</span>
          </h3>

          {list.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">
              {active === 'today_followup'
                ? 'Nothing planned for today. Set a reminder on a lead and it will show up here.'
                : 'Nothing here — which is the good version.'}
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {list.map((row) => {
                const lead = leadById.get(row.id);
                if (!lead) return null;
                const reminders = remindersByLead.get(lead.id) ?? [];
                const next = reminders
                  .filter((r) => r.status === 'pending')
                  .sort((a, b) => Date.parse(a.due_at) - Date.parse(b.due_at))[0];
                return (
                  <li key={lead.id}>
                    <button
                      onClick={() => setOpenLead(openLead === lead.id ? null : lead.id)}
                      className="w-full text-left py-3 flex items-start gap-3 hover:bg-slate-50/60 -mx-2 px-2 rounded-lg transition"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-slate-900 truncate">
                          {lead.student_name || 'Unnamed'}
                          {lead.grade != null && <span className="ml-1.5 text-[11px] font-semibold text-slate-500">G{lead.grade}</span>}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                          {lead.subject || lead.trial?.subject || 'No subject recorded'}
                          {lead.phone && <> · {lead.phone_country_code === 'IN' || !lead.phone_country_code ? '' : '+'}{lead.phone}</>}
                        </p>
                        {next && (
                          <p className="text-[11px] mt-1 font-semibold text-blue-700">
                            Follow-up {describeDue(next.due_at)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {lead.teacher_rating != null && (
                          <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-amber-700">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />{lead.teacher_rating}
                          </span>
                        )}
                        <ChevronRight className={`w-4 h-4 text-slate-300 transition ${openLead === lead.id ? 'rotate-90' : ''}`} />
                      </div>
                    </button>

                    {openLead === lead.id && detail && (
                      <LeadDetail lead={detail} reminders={reminders} onChanged={() => void load()} />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}

function Stat({ label, value, tone = 'text-slate-900' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2.5">
      <p className={`text-lg font-extrabold leading-none ${tone}`} style={{ fontFamily: 'var(--font-jakarta)' }}>{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">{label}</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   One family, everything about them
   ══════════════════════════════════════════════════════════════════════════ */

interface NoteRow {
  id: string;
  note: string;
  priority: string;
  category: string | null;
  created_at: string;
  author?: { full_name?: string | null } | null;
}

function LeadDetail({
  lead, reminders, onChanged,
}: {
  lead: Lead;
  reminders: ReminderRow[];
  onChanged: () => void;
}) {
  const [notes, setNotes] = useState<NoteRow[] | null>(null);
  const [text, setText] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'normal'>('normal');
  const [remindIn, setRemindIn] = useState('');
  const [exact, setExact] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    try {
      const res = await fetch(`/api/seller/notes?leadId=${lead.id}`);
      const json = await res.json();
      setNotes(json?.ok ? (json.notes as NoteRow[]) : []);
    } catch { setNotes([]); }
  }, [lead.id]);

  useEffect(() => { void loadNotes(); }, [loadNotes]);

  const addNote = async () => {
    if (!text.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/seller/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          note: text.trim(),
          priority,
          ...(exact ? { remindAtExact: exact } : remindIn ? { remindIn } : {}),
        }),
      });
      const json = await res.json();
      if (!json?.ok) { setMsg(json?.message ?? 'That did not save.'); return; }
      setText('');
      setRemindIn('');
      setExact('');
      setPriority('normal');
      setMsg(json.warning ?? 'Saved.');
      await loadNotes();
      onChanged();
    } catch {
      setMsg('That did not save.');
    } finally {
      setBusy(false);
    }
  };

  const closeReminder = async (id: string, action: 'complete' | 'cancel') => {
    await fetch('/api/seller/reminders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, reminderId: id }),
    });
    onChanged();
  };

  const confirmSale = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/seller/confirm-sale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id }),
      });
      const json = await res.json();
      setMsg(json?.ok ? 'Sent to HR to invoice.' : (json?.message ?? 'That did not work.'));
      if (json?.ok) onChanged();
    } finally {
      setBusy(false);
    }
  };

  const pending = reminders.filter((r) => r.status === 'pending');

  return (
    <div className="mb-3 rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-4">
      {/* What the trial said — both opinions, side by side, never averaged */}
      {lead.trial && (
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="rounded-lg bg-white border border-slate-200 p-3">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">The teacher said</p>
            {lead.teacher_rating != null ? (
              <>
                <p className="text-sm font-bold text-slate-900 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {lead.teacher_rating}/5
                  {lead.interest_level && (
                    <span className="ml-1 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {lead.interest_level}
                    </span>
                  )}
                </p>
                {lead.teacher_remarks && <p className="text-[12px] text-slate-600 mt-1.5 leading-snug">{lead.teacher_remarks}</p>}
              </>
            ) : (
              <p className="text-[12px] text-slate-500">Not written up yet.</p>
            )}
          </div>

          <div className="rounded-lg bg-white border border-slate-200 p-3">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">The family said</p>
            {lead.student_rating != null ? (
              <>
                <p className="text-sm font-bold text-slate-900 flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-blue-400 text-blue-400" />
                  {lead.student_rating}/5
                </p>
                {lead.student_remarks && <p className="text-[12px] text-slate-600 mt-1.5 leading-snug">{lead.student_remarks}</p>}
              </>
            ) : (
              <p className="text-[12px] text-slate-500">They have not rated it.</p>
            )}
          </div>
        </div>
      )}

      {/* Outstanding reminders */}
      {pending.length > 0 && (
        <div className="space-y-1.5">
          {pending.map((r) => {
            const status = reminderStatus(r);
            const tone =
              status === 'overdue' ? 'bg-red-50 text-red-800 border-red-200'
              : status === 'due' ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-blue-50 text-blue-800 border-blue-200';
            return (
              <div key={r.id} className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] ${tone}`}>
                <Clock className="w-3 h-3 shrink-0" />
                <span className="font-bold uppercase tracking-wide">{status}</span>
                <span className="truncate">{r.body || 'Follow up'} · {describeDue(r.due_at)}</span>
                <div className="ml-auto flex items-center gap-1 shrink-0">
                  <button onClick={() => void closeReminder(r.id, 'complete')} className="font-bold hover:underline">Done</button>
                  <span aria-hidden>·</span>
                  <button onClick={() => void closeReminder(r.id, 'cancel')} className="font-bold hover:underline opacity-70">Cancel</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Write it down */}
      <div className="rounded-lg bg-white border border-slate-200 p-3">
        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
          What happened on the call
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder="Father asked us to ring after 7pm…"
          className="w-full text-sm rounded-lg border border-slate-200 px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-y"
        />

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-0.5">
            {(['normal', 'medium', 'high'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className={`px-2 py-1 text-[10px] font-bold rounded-md capitalize transition ${
                  priority === p ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Remind me</span>
          {QUICK_REMINDERS.map((q) => (
            <button
              key={q.value}
              onClick={() => { setRemindIn(remindIn === q.value ? '' : q.value); setExact(''); }}
              className={`px-2 py-1 text-[10px] font-bold rounded-md border transition ${
                remindIn === q.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {q.label}
            </button>
          ))}
          <input
            type="datetime-local"
            value={exact}
            onChange={(e) => { setExact(e.target.value); setRemindIn(''); }}
            className="text-[11px] rounded-md border border-slate-200 px-1.5 py-1"
          />
        </div>

        <div className="mt-2.5 flex items-center gap-2">
          <button
            onClick={() => void addNote()}
            disabled={busy || !text.trim()}
            className="btn-tactile btn-tactile-primary px-3 py-1.5 text-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <MessageSquarePlus className="w-3 h-3" />}
            Save note
          </button>

          {lead.stage !== 'enrolled' && lead.sale_stage !== 'ready_for_hr' && lead.sale_stage !== 'punched' && (
            <button
              onClick={() => void confirmSale()}
              disabled={busy}
              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-green-300 bg-green-50 text-green-800 hover:bg-green-100 flex items-center gap-1.5 disabled:opacity-50"
            >
              <BadgeCheck className="w-3 h-3" /> Sale confirmed — send to HR
            </button>
          )}
          {lead.sale_stage === 'ready_for_hr' && (
            <span className="text-[11px] font-bold text-green-700 flex items-center gap-1">
              <Send className="w-3 h-3" /> With HR to invoice
            </span>
          )}

          {msg && <span className="text-[11px] text-slate-600">{msg}</span>}
        </div>
      </div>

      {/* The logbook — never overwritten */}
      <div>
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-2">Logbook</p>
        {notes === null ? (
          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
        ) : notes.length === 0 ? (
          <p className="text-[12px] text-slate-500">Nothing written down yet.</p>
        ) : (
          <ul className="space-y-2">
            {notes.map((n) => (
              <li key={n.id} className="rounded-lg bg-white border border-slate-200 px-3 py-2">
                <div className="flex items-center gap-2 mb-1">
                  {n.priority !== 'normal' && (
                    <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                      n.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {n.priority}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400">
                    {n.author?.full_name || 'System'} · {new Date(n.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-[12px] text-slate-700 whitespace-pre-wrap leading-snug">{n.note}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
