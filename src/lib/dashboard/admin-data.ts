/**
 * SARIRO — Admin Dashboard data layer
 * 
 * All Supabase queries for the admin dashboard.
 * RLS policies ensure only admin/super_admin can read these.
 * 
 * NOTE: supabase client is created INSIDE each function (not at module level)
 * to avoid SSR issues — createBrowserClient must run in the browser only.
 */

import { createClient } from '@/lib/supabase/client';

export interface AdminStats {
  totalUsers: number;
  totalEnrollments: number;
  pendingPurchaseIntents: number;
  activeCohorts: number;
  totalCohorts: number;
  revenue: number;
}

export interface PurchaseIntentRow {
  id: string;
  user_id: string;
  track: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  ratio: '1:1' | '1:4';
  razorpay_link: string | null;
  status: 'pending' | 'confirmed' | 'expired';
  created_at: string;
  confirmed_at: string | null;
  student_name: string | null;
  student_email: string | null;
}

export interface CohortRow {
  id: string;
  track: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  ratio: '1:1' | '1:4';
  status: 'gathering' | 'ready' | 'active' | 'completed';
  max_capacity: number;
  google_meet_url: string | null;
  created_at: string;
  activated_at: string | null;
  completed_at: string | null;
  student_count: number;
}

/* ───── Stats ───── */
export async function fetchAdminStats(): Promise<AdminStats> {
  const stats: AdminStats = {
    totalUsers: 0,
    totalEnrollments: 0,
    pendingPurchaseIntents: 0,
    activeCohorts: 0,
    totalCohorts: 0,
    revenue: 0,
  };

  try {
    const supabase = createClient();
    const [usersRes, enrollmentsRes, piRes, cohortsRes, activeCohortsRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('enrollments').select('id', { count: 'exact', head: true }),
      supabase.from('purchase_intents').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('cohorts').select('id', { count: 'exact', head: true }),
      supabase.from('cohorts').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    ]);

    stats.totalUsers = usersRes.count ?? 0;
    stats.totalEnrollments = enrollmentsRes.count ?? 0;
    stats.pendingPurchaseIntents = piRes.count ?? 0;
    stats.totalCohorts = cohortsRes.count ?? 0;
    stats.activeCohorts = activeCohortsRes.count ?? 0;
  } catch (err) {
    console.warn('[admin] stats fetch error:', err);
  }

  return stats;
}

/* ───── Pending purchase intents (enrollment approval queue) ───── */
export async function fetchPendingPurchaseIntents(): Promise<PurchaseIntentRow[]> {
  try {
    const supabase = createClient();
    const { data: intents, error } = await supabase
      .from('purchase_intents')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) throw error;
    if (!intents || intents.length === 0) return [];

    const userIds = [...new Set(intents.map(i => i.user_id))];
    const { data: profiles, error: profileErr } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds);

    if (profileErr) throw profileErr;

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    return intents.map(i => ({
      id: i.id,
      user_id: i.user_id,
      track: i.track,
      level: i.level,
      ratio: i.ratio,
      razorpay_link: i.razorpay_link,
      status: i.status,
      created_at: i.created_at,
      confirmed_at: i.confirmed_at,
      student_name: profileMap.get(i.user_id)?.full_name ?? null,
      student_email: profileMap.get(i.user_id)?.email ?? null,
    }));
  } catch (err) {
    console.warn('[admin] fetchPendingPurchaseIntents error:', err);
    return [];
  }
}

/* ───── Cohorts (with student count) ───── */
export async function fetchCohorts(statusFilter?: string): Promise<CohortRow[]> {
  try {
    const supabase = createClient();
    let query = supabase.from('cohorts').select('*').order('created_at', { ascending: false });
    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }
    const { data: cohorts, error } = await query;
    if (error) throw error;
    if (!cohorts || cohorts.length === 0) return [];

    const cohortIds = cohorts.map(c => c.id);
    const { data: enrollments, error: enrollErr } = await supabase
      .from('enrollments')
      .select('cohort_id')
      .in('cohort_id', cohortIds)
      .not('status', 'eq', 'dropped');

    if (enrollErr) throw enrollErr;

    const countMap = new Map<string, number>();
    (enrollments || []).forEach(e => {
      if (e.cohort_id) {
        countMap.set(e.cohort_id, (countMap.get(e.cohort_id) ?? 0) + 1);
      }
    });

    return cohorts.map(c => ({
      id: c.id,
      track: c.track,
      level: c.level,
      ratio: c.ratio,
      status: c.status,
      max_capacity: c.max_capacity,
      google_meet_url: c.google_meet_url,
      created_at: c.created_at,
      activated_at: c.activated_at,
      completed_at: c.completed_at,
      student_count: countMap.get(c.id) ?? 0,
    }));
  } catch (err) {
    console.warn('[admin] fetchCohorts error:', err);
    return [];
  }
}

/* ───── Find a matching gathering cohort for an intent ───── */
export async function findGatheringCohort(
  track: string,
  level: string,
  ratio: string
): Promise<string | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('cohorts')
      .select('id, max_capacity')
      .eq('track', track)
      .eq('level', level)
      .eq('ratio', ratio)
      .eq('status', 'gathering')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data?.id ?? null;
  } catch (err) {
    console.warn('[admin] findGatheringCohort error:', err);
    return null;
  }
}

/* ───── Create a new gathering cohort ───── */
export async function createCohort(params: {
  track: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  ratio: '1:1' | '1:4';
  max_capacity: number;
}): Promise<string | null> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('cohorts')
      .insert({
        track: params.track,
        level: params.level,
        ratio: params.ratio,
        max_capacity: params.max_capacity,
        status: 'gathering',
      })
      .select('id')
      .single();

    if (error) throw error;
    return data?.id ?? null;
  } catch (err) {
    console.warn('[admin] createCohort error:', err);
    return null;
  }
}

/* ───── Confirm a purchase intent → create enrollment ───── */
export async function confirmPurchaseIntent(intent: PurchaseIntentRow): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    // 1. Find or create a gathering cohort
    let cohortId = await findGatheringCohort(intent.track, intent.level, intent.ratio);
    if (!cohortId) {
      cohortId = await createCohort({
        track: intent.track,
        level: intent.level,
        ratio: intent.ratio,
        max_capacity: intent.ratio === '1:1' ? 1 : 4,
      });
    }
    if (!cohortId) {
      return { success: false, error: 'Failed to find or create cohort' };
    }

    // 2. Create the enrollment
    const { error: enrollErr } = await supabase
      .from('enrollments')
      .insert({
        user_id: intent.user_id,
        track: intent.track,
        level: intent.level,
        ratio: intent.ratio,
        status: 'active',
        cohort_id: cohortId,
        started_at: new Date().toISOString(),
      });

    if (enrollErr) throw enrollErr;

    // 3. Mark the purchase intent as confirmed
    const { error: piErr } = await supabase
      .from('purchase_intents')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
      })
      .eq('id', intent.id);

    if (piErr) throw piErr;

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.warn('[admin] confirmPurchaseIntent error:', err);
    return { success: false, error: msg };
  }
}

/* ───── Reject a purchase intent ───── */
export async function rejectPurchaseIntent(intentId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('purchase_intents')
      .update({ status: 'expired' })
      .eq('id', intentId);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}

/* ───── Cohort state machine transitions ───── */
export async function transitionCohortStatus(
  cohortId: string,
  newStatus: 'gathering' | 'ready' | 'active' | 'completed',
  googleMeetUrl?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const update: Record<string, string | null> = { status: newStatus };
    if (newStatus === 'active') {
      update.activated_at = new Date().toISOString();
      if (googleMeetUrl) update.google_meet_url = googleMeetUrl;
    }
    if (newStatus === 'completed') {
      update.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('cohorts')
      .update(update)
      .eq('id', cohortId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: msg };
  }
}
