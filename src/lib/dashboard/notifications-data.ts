/**
 * SARIRO — Notifications data layer
 *
 * Backs the dashboard notification bell + dropdown. Each notification is a
 * lightweight row addressed to a single user (user-scoped, RLS-protected).
 *
 * supabase client is created INSIDE each function (not at module level)
 * to avoid SSR issues — createBrowserClient must run in the browser only.
 */

import { createClient } from '@/lib/supabase/client';

/* ─────────────────────── Types ─────────────────────── */

export type NotificationType =
  | 'enrollment_confirmed'
  | 'enrollment_rejected'
  | 'cohort_activated'
  | 'cohort_completed'
  | 'session_reminder'
  | 'session_cancelled'
  | 'material_posted'
  | 'certificate_ready'
  | 'system'
  | 'general';

export interface NotificationRow {
  id: string;
  user_id: string;
  type: NotificationType | string;
  title: string;
  message: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType | string;
  title: string;
  message?: string | null;
  link?: string | null;
}

/* ─────────────────────── fetchNotifications ───────────────────────
   Lists notifications for the current user. Newest first.
   Pass `unreadOnly=true` to filter to only unread rows. */
export async function fetchNotifications(unreadOnly = false): Promise<NotificationRow[]> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    let query = supabase
      .from('notifications')
      .select('id, user_id, type, title, message, link, read_at, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (unreadOnly) {
      query = query.is('read_at', null);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as NotificationRow[];
  } catch (err) {
    console.warn('[notifications] fetchNotifications error:', err);
    return [];
  }
}

/* ─────────────────────── fetchUnreadCount ───────────────────────
   Returns the count of unread notifications for the current user. */
export async function fetchUnreadCount(): Promise<number> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return 0;

    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('read_at', null);

    if (error) throw error;
    return count ?? 0;
  } catch (err) {
    console.warn('[notifications] fetchUnreadCount error:', err);
    return 0;
  }
}

/* ─────────────────────── markAsRead ───────────────────────
   Marks a single notification as read (sets read_at to now). */
export async function markAsRead(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  if (!notificationId) return { success: false, error: 'Missing notification id' };
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.warn('[notifications] markAsRead error:', err);
    return { success: false, error: msg };
  }
}

/* ─────────────────────── markAllAsRead ───────────────────────
   Marks every unread notification for the current user as read. */
export async function markAllAsRead(): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No user session' };

    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('read_at', null);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.warn('[notifications] markAllAsRead error:', err);
    return { success: false, error: msg };
  }
}

/* ─────────────────────── createNotification ───────────────────────
   Inserts a new notification row addressed to `userId`.
   Usually called from server contexts (e.g. when a cohort activates),
   but also safe to call from the browser — RLS allows users to insert
   rows addressed to themselves (e.g. a personal reminder). */
export async function createNotification(
  input: CreateNotificationInput
): Promise<{ success: boolean; error?: string }> {
  if (!input.userId || !input.title) {
    return { success: false, error: 'Missing required fields' };
  }
  try {
    const supabase = createClient();
    const { error } = await supabase.from('notifications').insert({
      user_id: input.userId,
      type: input.type ?? 'general',
      title: input.title,
      message: input.message ?? null,
      link: input.link ?? null,
    });

    if (error) throw error;
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.warn('[notifications] createNotification error:', err);
    return { success: false, error: msg };
  }
}

/* ─────────────────────── formatRelativeTime ───────────────────────
   Pure helper — formats an ISO timestamp into a human-friendly relative
   string ("just now", "5m ago", "3h ago", "2d ago", or a date). */
export function formatRelativeTime(iso: string | null | undefined): string {
  if (!iso) return '';
  try {
    const now = Date.now();
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return '';
    const diffSec = Math.max(0, Math.floor((now - then) / 1000));

    if (diffSec < 60) return 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;

    // Beyond a week → readable date
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: diffDay > 365 ? 'numeric' : undefined,
    });
  } catch {
    return '';
  }
}
