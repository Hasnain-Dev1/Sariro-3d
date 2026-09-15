'use client';

import { useCallback, useEffect, useState } from 'react';
import { Coins, Loader2, ChevronDown, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import ClassFeedbackForm from '@/components/dashboard/class-feedback-form';
import { fetchHeldTrialPay, type HeldClass } from '@/lib/dashboard/held-trial-pay';
import { useAttention } from '@/components/ops/attention-provider';

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

export default function PayHeldPanel({ onPaid, showEmpty = false }: { onPaid?: () => void; showEmpty?: boolean }) {
  const { user } = useAuth();
  const attention = useAttention();
  const [rows, setRows] = useState<HeldClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      setRows(await fetchHeldTrialPay(user.id));
    } catch {
      // The trial and feedback tables arrive with their SQL scripts. Until
      // then there is nothing held, which is the truthful answer.
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { void load(); }, [load]);

  if (loading) return null;
  if (rows.length === 0) {
    /* On the Classes workspace the section is always there, so it says it is
       clear rather than leaving a heading over nothing. */
    return showEmpty ? (
      <p className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-3 text-[13.5px] text-slate-600">
        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Every trial is written up — nothing of yours is held.
      </p>
    ) : null;
  }

  const total = rows.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/60 p-5">
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
                            attention?.refresh();
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
