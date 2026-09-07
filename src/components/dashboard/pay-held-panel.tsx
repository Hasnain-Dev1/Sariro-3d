'use client';

import { useCallback, useEffect, useState } from 'react';
import { Coins, Loader2, ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import ClassFeedbackForm from '@/components/dashboard/class-feedback-form';
import { payGate, type ClassFeedback } from '@/lib/dashboard/class-feedback';

/**
 * SARIRO — the money a teacher has earned and not been given
 * ============================================================================
 * This is the piece that decides whether any of the rest of it works.
 *
 * We now hold a teacher's trial pay until they write the class up. That is the
 * right rule, and on its own it is a trap: a teacher finishes a class, goes
 * home, and nothing tells them anything is owed. A week later they are annoyed
 * about missing money, the seller has no feedback to ring anybody with, and
 * everyone concludes the software is broken.
 *
 * A rule that withholds money has to come with a screen that says so, in the
 * first place the person looks, with the form attached. Otherwise it is not a
 * rule, it is a silent penalty.
 *
 * ── Why the amount is on it ─────────────────────────────────────────────────
 * "Feedback pending" is a chore. "Rs 100 waiting" is a reason. The number is
 * the difference between a teacher who writes up three classes tonight and one
 * who gets round to it.
 *
 * ── Why the form is inline ──────────────────────────────────────────────────
 * Every navigation between noticing and doing loses people. The write-up opens
 * where it is read, and the panel updates as each one lands.
 */

interface HeldClass {
  bookingId: string;
  slotStart: string;
  /** Only the children still waiting on a write-up. */
  outstanding: { id: string; name: string }[];
  /** Everybody who was in the class, for the heading. */
  total: number;
  amount: number;
  message: string;
}

export default function PayHeldPanel({ onPaid }: { onPaid?: () => void }) {
  const { user } = useAuth();
  const [rows, setRows] = useState<HeldClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const sb = createClient();

      /* Completed trials of mine. A class that is not finished cannot be
         written up, so it is not money being held — it is money not earned. */
      const { data: trials } = await sb
        .from('bookings')
        .select('id, slot_start, trial_student_id')
        .eq('teacher_id', user.id)
        .eq('is_trial', true)
        .eq('status', 'completed')
        .order('slot_start', { ascending: false })
        .limit(40);

      if (!trials || trials.length === 0) { setRows([]); setLoading(false); return; }

      const ids = trials.map((t) => t.id as string);
      const studentIds = [...new Set(trials.map((t) => t.trial_student_id as string | null).filter((v): v is string => !!v))];

      /* The full roster comes from trial_participants — a trial can hold four
         children, and building it from trial_student_id alone would release
         the pay after the FIRST write-up on a class of three. */
      let participants: { booking_id: string; student_id: string }[] = [];
      try {
        const { data } = await sb.from('trial_participants').select('booking_id, student_id').in('booking_id', ids);
        participants = (data ?? []) as { booking_id: string; student_id: string }[];
      } catch { /* table not created yet — the single column is the fallback */ }

      const allStudentIds = [...new Set([...studentIds, ...participants.map((x) => x.student_id)])];

      const [fbRes, profRes, payRes, rateRes] = await Promise.all([
        sb.from('class_feedback').select('booking_id, author_role, subject_student_id, rating, remarks').in('booking_id', ids),
        allStudentIds.length ? sb.from('profiles').select('id, full_name, email').in('id', allStudentIds) : Promise.resolve({ data: [] }),
        sb.from('teacher_earnings').select('booking_id').in('booking_id', ids),
        sb.from('trial_pay_settings').select('amount').eq('id', true).maybeSingle(),
      ]);

      const rosterBy = new Map<string, string[]>();
      for (const x of participants) {
        const list = rosterBy.get(x.booking_id) ?? [];
        list.push(x.student_id);
        rosterBy.set(x.booking_id, list);
      }

      const amount = Number(rateRes.data?.amount ?? 100);
      const paid = new Set((payRes.data ?? []).map((e) => e.booking_id as string));
      const fbBy = new Map<string, ClassFeedback[]>();
      for (const f of (fbRes.data ?? []) as ClassFeedback[]) {
        const list = fbBy.get(f.booking_id) ?? [];
        list.push(f);
        fbBy.set(f.booking_id, list);
      }
      const names = new Map(
        ((profRes.data ?? []) as { id: string; full_name: string | null; email: string | null }[])
          .map((p) => [p.id, p.full_name || p.email || 'the student'])
      );

      const held: HeldClass[] = [];
      for (const t of trials) {
        const id = t.id as string;
        if (paid.has(id)) continue; // already released
        const sid = (t.trial_student_id as string) ?? null;
        const rosterIds = rosterBy.get(id) ?? (sid ? [sid] : []);
        const roster = rosterIds.map((rid) => ({ id: rid, name: names.get(rid) ?? 'the student' }));
        const gate = payGate(roster, fbBy.get(id) ?? []);
        if (gate.unlocked) continue; // nothing owed from the teacher
        const outstanding = roster.filter((r) => gate.missing.includes(r.name));
        held.push({
          bookingId: id,
          slotStart: t.slot_start as string,
          outstanding: outstanding.length ? outstanding : roster,
          total: roster.length,
          amount,
          message: gate.message,
        });
      }
      setRows(held);
    } catch {
      // The trial and feedback tables arrive with their SQL scripts. Until
      // then there is nothing held, which is the truthful answer.
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  if (loading || rows.length === 0) return null;

  const total = rows.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/60 p-5 mb-6">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
          <Coins className="w-5 h-5 text-amber-700" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-extrabold text-amber-900" style={{ fontFamily: 'var(--font-jakarta)' }}>
            ₹{total} waiting on your write-up
          </h2>
          <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
            {rows.length === 1 ? 'One trial class needs' : `${rows.length} trial classes need`} a rating and a
            few words before the pay is released. It takes about a minute each, and the sales team rings the
            parent off the back of what you write.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {rows.map((r) => {
          const open = openId === r.bookingId;
          return (
            <div key={r.bookingId} className="rounded-xl bg-white border border-amber-200 overflow-hidden">
              <button
                onClick={() => setOpenId(open ? null : r.bookingId)}
                className="w-full px-3.5 py-3 flex items-center justify-between gap-3 text-left hover:bg-amber-50/50"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate" style={{ fontFamily: 'var(--font-grotesk)' }}>
                    {r.outstanding.map((o) => o.name).join(', ')}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {new Date(r.slotStart).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                    {' · '}trial class
                    {r.total > 1 ? ` · ${r.outstanding.length} of ${r.total} still to write up` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-extrabold text-amber-700 tabular-nums" style={{ fontFamily: 'var(--font-jakarta)' }}>
                    ₹{r.amount}
                  </span>
                  {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                </div>
              </button>

              {open && (
                <div className="px-3.5 pb-3.5 pt-1 border-t border-amber-100 space-y-4">
                  {/* One form per child. "The class went well" is worthless to
                      a seller with three families to ring. */}
                  {r.outstanding.map((child, i) => (
                    <div key={child.id} className={i > 0 ? 'pt-4 border-t border-slate-100' : ''}>
                      <ClassFeedbackForm
                        bookingId={r.bookingId}
                        role="teacher"
                        subjectStudentId={child.id}
                        subjectName={child.name}
                        compact
                        onSaved={(res) => {
                          if (res.payReleased) {
                            // Straight off the list — the money is no longer held.
                            setRows((prev) => prev.filter((x) => x.bookingId !== r.bookingId));
                            onPaid?.();
                          } else {
                            void load();
                          }
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[11px] text-amber-700 flex items-center gap-1.5">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Released straight into your earnings as soon as each one is submitted.
      </p>
    </div>
  );
}
