-- ════════════════════════════════════════════════════════════════
-- SARIRO — Notifications migration
--
-- Adds a single user-scoped notifications table. Backs the dashboard
-- notification bell + dropdown. Each notification is one row per user
-- (no fan-out — we just insert one row per recipient).
--
-- Idempotent — safe to re-run.
-- ════════════════════════════════════════════════════════════════

-- 1. Table ---------------------------------------------------------------------
create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  type        text not null default 'general',
  title       text not null,
  message     text,
  link        text,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

comment on table  public.notifications is 'User-scoped notification feed.';
comment on column public.notifications.type is 'Notification kind — e.g. enrollment_confirmed, cohort_activated, certificate_ready.';
comment on column public.notifications.link is 'Optional in-app link (relative path, e.g. /dashboard/student).';
comment on column public.notifications.read_at is 'When the user marked this as read. NULL = unread.';

-- 2. Indexes -------------------------------------------------------------------
create index if not exists idx_notifications_user_created
  on public.notifications(user_id, created_at desc);

create index if not exists idx_notifications_user_unread
  on public.notifications(user_id, read_at)
  where read_at is null;

-- 3. RLS policies --------------------------------------------------------------
alter table public.notifications enable row level security;

-- 3a. Users can READ + UPDATE only their own rows.
drop policy if exists "notifications_owner_select" on public.notifications;
create policy "notifications_owner_select"
  on public.notifications for select
  using (user_id = auth.uid());

drop policy if exists "notifications_owner_update" on public.notifications;
create policy "notifications_owner_update"
  on public.notifications for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 3b. Users can DELETE their own notifications (e.g. dismiss)
drop policy if exists "notifications_owner_delete" on public.notifications;
create policy "notifications_owner_delete"
  on public.notifications for delete
  using (user_id = auth.uid());

-- 3c. INSERT — allow the service role (webhooks) AND allow users to
--     insert notifications addressed to themselves (e.g. reminders).
--     Service-role inserts bypass RLS, so we only need the user policy here.
drop policy if exists "notifications_owner_insert" on public.notifications;
create policy "notifications_owner_insert"
  on public.notifications for insert
  with check (user_id = auth.uid());

-- 4. Optional: helpful view for unread counts ---------------------------------
create or replace view public.v_unread_notification_counts
with (security_invoker = true) as
  select user_id, count(*)::int as unread_count
  from public.notifications
  where read_at is null
  group by user_id;

comment on view public.v_unread_notification_counts is 'Per-user unread notification count. Uses security_invoker so RLS still applies.';

-- 5. Verification --------------------------------------------------------------
-- select count(*) as notifications from public.notifications;
-- select * from public.v_unread_notification_counts limit 5;
