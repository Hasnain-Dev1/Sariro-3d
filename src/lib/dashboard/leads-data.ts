/**
 * SARIRO — Lead Pipeline data layer
 * =========================================================
 * Centralized student/lead pipeline for the Super Admin dashboard.
 *
 * Stages: new → seller_assigned → connected → gathering_booked → final → enrolled
 *         (deferred available at any point)
 *
 * RLS:
 *   - Super admin: sees all leads + history
 *   - Admin/seller: sees only leads assigned to them
 *   - Teachers: no access to leads
 */

import { createClient } from '@/lib/supabase/client';

/* ════════════════════════════════════════════════════════════════════════
   Types
   ════════════════════════════════════════════════════════════════════════ */

export type LeadStage =
  | 'new'
  | 'seller_assigned'
  | 'connected'
  | 'gathering_booked'
  | 'final'
  | 'deferred'
  | 'enrolled';

export interface StudentLead {
  id: string;
  student_name: string;
  parent_name: string | null;
  email: string | null;
  phone: string;
  phone_country_code: string | null;
  country: string | null;
  education: string | null;
  lead_type: 'student' | 'professional';
  area_of_interest: string | null;
  booking_date: string;
  demo_request_id: string | null;
  assigned_seller: string | null;
  stage: LeadStage;
  timezone: string | null;
  notes: string | null;
  last_updated: string;
  created_at: string;
  // Joined fields
  seller_name?: string | null;
  seller_email?: string | null;
}

export interface LeadHistoryRow {
  id: string;
  lead_id: string;
  action: 'created' | 'stage_changed' | 'seller_assigned' | 'seller_changed' | 'note_added';
  old_value: string | null;
  new_value: string | null;
  performed_by: string | null;
  performed_by_role: string | null;
  notes: string | null;
  created_at: string;
  // Joined
  performer_name?: string | null;
}

export interface StageSummary {
  new: number;
  seller_assigned: number;
  connected: number;
  gathering_booked: number;
  final: number;
  deferred: number;
  enrolled: number;
  total: number;
}

export interface SellerWorkload {
  seller_id: string;
  seller_name: string;
  seller_email: string;
  new: number;
  seller_assigned: number;
  connected: number;
  gathering_booked: number;
  final: number;
  deferred: number;
  enrolled: number;
  total: number;
}

/* ════════════════════════════════════════════════════════════════════════
   Stage helpers
   ════════════════════════════════════════════════════════════════════════ */

export const STAGE_ORDER: LeadStage[] = [
  'new',
  'seller_assigned',
  'connected',
  'gathering_booked',
  'final',
  'enrolled',
];

export const STAGE_LABELS: Record<LeadStage, string> = {
  new: 'New',
  seller_assigned: 'Seller Assigned',
  connected: 'Connected',
  gathering_booked: 'Gathering Booked',
  final: 'Final',
  deferred: 'Deferred',
  enrolled: 'Enrolled',
};

export const STAGE_COLORS: Record<LeadStage, { bg: string; text: string; chip: string }> = {
  new: { bg: 'bg-amber-50', text: 'text-amber-700', chip: 'bg-amber-100 text-amber-700' },
  seller_assigned: { bg: 'bg-blue-50', text: 'text-blue-700', chip: 'bg-blue-100 text-blue-700' },
  connected: { bg: 'bg-violet-50', text: 'text-violet-700', chip: 'bg-violet-100 text-violet-700' },
  gathering_booked: { bg: 'bg-cyan-50', text: 'text-cyan-700', chip: 'bg-cyan-100 text-cyan-700' },
  final: { bg: 'bg-orange-50', text: 'text-orange-700', chip: 'bg-orange-100 text-orange-700' },
  deferred: { bg: 'bg-slate-50', text: 'text-slate-600', chip: 'bg-slate-100 text-slate-600' },
  enrolled: { bg: 'bg-green-50', text: 'text-green-700', chip: 'bg-green-100 text-green-700' },
};

/* ════════════════════════════════════════════════════════════════════════
   Reads
   ════════════════════════════════════════════════════════════════════════ */

/**
 * Fetch all leads with optional filters.
 * Super admin sees all; sellers see only assigned.
 */
export async function fetchLeads(filters?: {
  stage?: LeadStage | 'all';
  sellerId?: string | 'all' | 'unassigned';
  country?: string | 'all';
  leadType?: 'student' | 'professional' | 'all';
  areaOfInterest?: string | 'all';
  search?: string;
  limit?: number;
}): Promise<StudentLead[]> {
  try {
    const supabase = createClient();
    // Correct join: assigned_seller is the FK column referencing profiles(id)
    let query = supabase.from('student_leads').select(`
      *,
      seller:profiles!assigned_seller(full_name, email)
    `);

    if (filters?.stage && filters.stage !== 'all') {
      query = query.eq('stage', filters.stage);
    }
    if (filters?.sellerId && filters.sellerId !== 'all') {
      if (filters.sellerId === 'unassigned') {
        query = query.is('assigned_seller', null);
      } else {
        query = query.eq('assigned_seller', filters.sellerId);
      }
    }
    if (filters?.country && filters.country !== 'all') {
      query = query.eq('country', filters.country);
    }
    if (filters?.leadType && filters.leadType !== 'all') {
      query = query.eq('lead_type', filters.leadType);
    }
    if (filters?.areaOfInterest && filters.areaOfInterest !== 'all') {
      query = query.eq('area_of_interest', filters.areaOfInterest);
    }
    if (filters?.search) {
      query = query.or(
        `student_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%`
      );
    }

    query = query.order('last_updated', { ascending: false }).limit(filters?.limit ?? 200);
    const { data, error } = await query;
    if (error) throw error;

    return (data ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      const seller = r.seller as { full_name: string | null; email: string | null } | null;
      return {
        ...(r as Omit<StudentLead, 'seller_name' | 'seller_email'>),
        seller_name: seller?.full_name ?? null,
        seller_email: seller?.email ?? null,
      } as StudentLead;
    });
  } catch (err) {
    console.warn('[leads] fetchLeads error:', err);
    return [];
  }
}

/**
 * Fetch stage summary counts.
 */
export async function fetchStageSummary(): Promise<StageSummary> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.from('student_leads').select('stage');
    if (error) throw error;

    const summary: StageSummary = {
      new: 0,
      seller_assigned: 0,
      connected: 0,
      gathering_booked: 0,
      final: 0,
      deferred: 0,
      enrolled: 0,
      total: 0,
    };

    for (const row of data ?? []) {
      summary[row.stage as LeadStage]++;
      summary.total++;
    }

    return summary;
  } catch (err) {
    console.warn('[leads] fetchStageSummary error:', err);
    return {
      new: 0, seller_assigned: 0, connected: 0, gathering_booked: 0,
      final: 0, deferred: 0, enrolled: 0, total: 0,
    };
  }
}

/**
 * Fetch seller workload — how many leads each seller has in each stage.
 */
export async function fetchSellerWorkload(): Promise<SellerWorkload[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('student_leads')
      .select('assigned_seller, stage, seller:profiles!assigned_seller(full_name, email)')
      .not('assigned_seller', 'is', null);

    if (error) throw error;

    const sellerMap = new Map<string, SellerWorkload>();
    for (const row of data ?? []) {
      const r = row as Record<string, unknown>;
      const sellerId = r.assigned_seller as string;
      if (!sellerMap.has(sellerId)) {
        const seller = r.seller as { full_name: string | null; email: string | null } | null;
        sellerMap.set(sellerId, {
          seller_id: sellerId,
          seller_name: seller?.full_name ?? 'Unknown',
          seller_email: seller?.email ?? '',
          new: 0, seller_assigned: 0, connected: 0, gathering_booked: 0,
          final: 0, deferred: 0, enrolled: 0, total: 0,
        });
      }
      const wl = sellerMap.get(sellerId)!;
      wl[r.stage as LeadStage]++;
      wl.total++;
    }

    return Array.from(sellerMap.values()).sort((a, b) => b.total - a.total);
  } catch (err) {
    console.warn('[leads] fetchSellerWorkload error:', err);
    return [];
  }
}

/**
 * Fetch lead history (audit trail) for a specific lead.
 */
export async function fetchLeadHistory(leadId: string): Promise<LeadHistoryRow[]> {
  if (!leadId) return [];
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('lead_history')
      .select(`
        *,
        performer:performed_by(full_name)
      `)
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data ?? []).map((row) => ({
      ...row,
      performer_name: (row as { performer?: { full_name: string | null } }).performer?.full_name ?? null,
    })) as LeadHistoryRow[];
  } catch (err) {
    console.warn('[leads] fetchLeadHistory error:', err);
    return [];
  }
}

/**
 * Fetch all sellers (admins) for the assignment dropdown.
 */
export async function fetchSellers(): Promise<Array<{ id: string; full_name: string | null; email: string | null }>> {
  try {
    const supabase = createClient();
    // Fetch ALL admins + super_admins (both can be sellers)
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .or('role.eq.admin,role.eq.super_admin,is_admin.eq.true,is_super_admin.eq.true')
      .order('full_name', { ascending: true });

    if (error) throw error;
    return (data ?? []) as Array<{ id: string; full_name: string | null; email: string | null }>;
  } catch (err) {
    console.warn('[leads] fetchSellers error:', err);
    return [];
  }
}

/* ════════════════════════════════════════════════════════════════════════
   Writes (via API route — CSRF + honeypot + rate-limit)
   ════════════════════════════════════════════════════════════════════════ */

/**
 * Assign a seller to a lead. Changes stage from 'new' to 'seller_assigned'
 * automatically if the lead is currently 'new'.
 */
export async function assignSeller(
  leadId: string,
  sellerId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/admin/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'assign_seller',
        lead_id: leadId,
        seller_id: sellerId,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      return { success: false, error: json.error || 'Assignment failed' };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}

/**
 * Update a lead's stage. Inserts a history row.
 */
export async function updateLeadStage(
  leadId: string,
  newStage: LeadStage,
  note?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/admin/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_stage',
        lead_id: leadId,
        new_stage: newStage,
        note,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.ok) {
      return { success: false, error: json.error || 'Stage update failed' };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}
