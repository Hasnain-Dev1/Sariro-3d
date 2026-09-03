-- ============================================================================
-- SARIRO — one chat system, for everyone
-- ============================================================================
-- Run once in the Supabase SQL editor. Safe to re-run.
--
-- V2 §27-28, widened: not only teacher-to-student, but anyone in the
-- organisation to anyone they are allowed to reach — a teacher asking HR about
-- a settlement, an admin telling a teacher their class moved.
--
-- ── The one rule that is not negotiable ─────────────────────────────────────
-- STUDENTS CANNOT MESSAGE OTHER STUDENTS.
--
-- Most of the learners here are children. A school that hands every child a
-- private line to every other child has built a place where bullying and
-- grooming happen out of sight, and it has done so by accident because the
-- feature was described as "chat for everyone". Staff can reach anyone; a
-- student can reach staff; student-to-student is refused in the database, not
-- merely hidden in the UI.
--
-- If a genuine need for peer chat appears later it should be a separate,
-- moderated, deliberately-designed thing — not a side effect of this table.
--
-- ── Shape ───────────────────────────────────────────────────────────────────
-- Two-person conversations only. Group chat is a different product with
-- different moderation questions, and shipping 1:1 first is what lets this be
-- correct rather than merely present.
-- ============================================================================

create table if not exists public.conversations (
  id              uuid primary key default gen_random_uuid(),
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  -- Denormalised so the conversation list can sort without touching messages.
  last_message_at timestamptz not null default now()
);

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  -- Everything before this the member has seen. Null means they never opened it.
  last_read_at    timestamptz,
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null references auth.users(id) on delete cascade,
  body            text not null check (length(trim(body)) > 0 and length(body) <= 4000),
  created_at      timestamptz not null default now()
);

create index if not exists conversation_members_user_idx
  on public.conversation_members (user_id);
create index if not exists messages_conversation_idx
  on public.messages (conversation_id, created_at desc);
create index if not exists conversations_recent_idx
  on public.conversations (last_message_at desc);

-- ── Keep the conversation list sorted without a second write from the app ───
create or replace function public.touch_conversation_on_message()
returns trigger
language plpgsql
as $$
begin
  update public.conversations
     set last_message_at = new.created_at
   where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_touch_conversation on public.messages;
create trigger messages_touch_conversation
  after insert on public.messages
  for each row execute function public.touch_conversation_on_message();

-- ── Who may talk to whom ────────────────────────────────────────────────────
-- Used by the RLS policy below and by the API. Staff is everyone who is not a
-- learner; a conversation is permitted unless BOTH sides are students.
create or replace function public.is_staff(uid uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles p
     where p.id = uid
       and (p.role in ('teacher', 'hr', 'admin', 'super_admin') or p.is_teacher = true)
  );
$$;

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.conversations        enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages             enable row level security;

-- You see a conversation only if you are in it. No role overrides this: an
-- admin reading a teacher's private messages to a parent should be a
-- deliberate, audited act, not a side effect of having a role.
drop policy if exists conversations_member_read on public.conversations;
create policy conversations_member_read
  on public.conversations for select
  using (
    exists (
      select 1 from public.conversation_members m
       where m.conversation_id = conversations.id and m.user_id = auth.uid()
    )
  );

drop policy if exists conversations_create on public.conversations;
create policy conversations_create
  on public.conversations for insert
  with check (auth.uid() = created_by);

drop policy if exists conversations_member_touch on public.conversations;
create policy conversations_member_touch
  on public.conversations for update
  using (
    exists (
      select 1 from public.conversation_members m
       where m.conversation_id = conversations.id and m.user_id = auth.uid()
    )
  );

drop policy if exists conv_members_read on public.conversation_members;
create policy conv_members_read
  on public.conversation_members for select
  using (
    exists (
      select 1 from public.conversation_members me
       where me.conversation_id = conversation_members.conversation_id
         and me.user_id = auth.uid()
    )
  );

-- Adding a member is where the child-safety rule is enforced: at least one
-- side of every conversation must be staff.
drop policy if exists conv_members_add on public.conversation_members;
create policy conv_members_add
  on public.conversation_members for insert
  with check (
    public.is_staff(auth.uid()) or public.is_staff(conversation_members.user_id)
  );

drop policy if exists conv_members_mark_read on public.conversation_members;
create policy conv_members_mark_read
  on public.conversation_members for update
  using (user_id = auth.uid());

drop policy if exists messages_member_read on public.messages;
create policy messages_member_read
  on public.messages for select
  using (
    exists (
      select 1 from public.conversation_members m
       where m.conversation_id = messages.conversation_id and m.user_id = auth.uid()
    )
  );

-- Send only as yourself, and only into a conversation you belong to.
drop policy if exists messages_member_send on public.messages;
create policy messages_member_send
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.conversation_members m
       where m.conversation_id = messages.conversation_id and m.user_id = auth.uid()
    )
  );

-- ============================================================================
-- POLICY FLAGS — the record of attempts to move a learner off the platform
-- ============================================================================
-- At Codingal, teachers and students swapped numbers, the relationship moved to
-- WhatsApp, and when a teacher left the students went with them. The company
-- found out afterwards, from the churn, because the conversation that mattered
-- had never been visible.
--
-- Refusing the message is only half the answer. The half that changes behaviour
-- is that the attempt is written down and somebody can see it. A teacher who
-- knows an attempt is logged does not make a second one; a pattern across weeks
-- is a conversation HR needs to have.
--
-- ── The body is stored on purpose ───────────────────────────────────────────
-- A flag without its text is unreviewable — there would be no way to tell a
-- genuine violation from a maths teacher sending a long number. So the attempt
-- is kept, and reading it is restricted to admin, super_admin and HR.
-- ============================================================================

create table if not exists public.messaging_policy_flags (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete set null,
  sender_id       uuid references auth.users(id) on delete set null,
  -- Who the message was aimed at. Kept denormalised: the point of review is to
  -- see which learner was approached, and members can change.
  recipient_id    uuid references auth.users(id) on delete set null,

  body            text not null,
  reasons         text[] not null default '{}',
  -- true  = refused, never delivered
  -- false = delivered, but worth a look
  blocked         boolean not null default true,

  created_at      timestamptz not null default now(),
  reviewed_at     timestamptz,
  reviewed_by     uuid references auth.users(id) on delete set null,
  review_note     text
);

create index if not exists policy_flags_recent_idx
  on public.messaging_policy_flags (created_at desc);
-- The review queue: what nobody has looked at yet.
create index if not exists policy_flags_unreviewed_idx
  on public.messaging_policy_flags (reviewed_at) where reviewed_at is null;
-- "Has this teacher done this before?" — the question that matters most.
create index if not exists policy_flags_sender_idx
  on public.messaging_policy_flags (sender_id, created_at desc);

alter table public.messaging_policy_flags enable row level security;

-- Oversight is a management right, not a general one. A teacher cannot see
-- their own flags: knowing exactly what tripped the rule is a map around it.
drop policy if exists policy_flags_read on public.messaging_policy_flags;
create policy policy_flags_read
  on public.messaging_policy_flags for select
  using (
    exists (
      select 1 from public.profiles p
       where p.id = auth.uid() and p.role in ('hr', 'admin', 'super_admin')
    )
  );

drop policy if exists policy_flags_review on public.messaging_policy_flags;
create policy policy_flags_review
  on public.messaging_policy_flags for update
  using (
    exists (
      select 1 from public.profiles p
       where p.id = auth.uid() and p.role in ('hr', 'admin', 'super_admin')
    )
  );
