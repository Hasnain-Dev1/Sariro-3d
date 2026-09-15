import { createClient } from '@/lib/supabase/client';
import { payGate, type ClassFeedback } from '@/lib/dashboard/class-feedback';

/**
 * SARIRO — a teacher's trial pay held for a write-up
 * ============================================================================
 * One loader for the write-up panel (components/dashboard/pay-held-panel.tsx)
 * and the teacher's Today queue, so the "2 trials need a write-up" at the top
 * of the dashboard is the same two the panel lists.
 */

export interface HeldClass {
  bookingId: string;
  slotStart: string;
  /** Only the children still waiting on a write-up. */
  outstanding: { id: string; name: string }[];
  /** Everybody who was in the class, for the heading. */
  total: number;
  amount: number;
  message: string;
}

export async function fetchHeldTrialPay(teacherId: string): Promise<HeldClass[]> {
  const sb = createClient();

  /* Completed trials of mine. A class that is not finished cannot be
     written up, so it is not money being held — it is money not earned. */
  const { data: trials, error } = await sb
    .from('bookings')
    .select('id, slot_start, trial_student_id')
    .eq('teacher_id', teacherId)
    .eq('is_trial', true)
    .eq('status', 'completed')
    .order('slot_start', { ascending: false })
    .limit(40);
  if (error) throw error;
  if (!trials || trials.length === 0) return [];

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
  return held;
}
