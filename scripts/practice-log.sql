-- ============================================================================
-- SARIRO — keeping what the practice room measures
-- ============================================================================
-- Run once in the Supabase SQL editor. Safe to re-run. Prints what it found.
--
-- The practice room measures every attempt already — pace, filler words,
-- recall, sentence variety — and then throws it away. A child can do forty
-- reps and there is nothing afterwards to show for it: not to them, not to
-- their teacher before the next class, and not to the parent deciding whether
-- to renew.
--
-- "Attended 8 classes" is a line every competitor can print. "Filler words 12 a
-- minute down to 3" is not, and it is already in memory the moment a recording
-- stops. This table is the only thing between those two sentences.
--
-- ── Why the metrics are jsonb and not columns ───────────────────────────────
-- Speaking, listening and writing measure different things, and the list is
-- still moving — pronunciation and voice modulation are not built yet and will
-- add their own. A column per metric means a migration every time a drill
-- learns to measure something new, and a table of mostly-null columns.
--
-- The keys are not free-form: lib/speaking/progress.ts declares every metric,
-- what it is called, and which direction is an improvement. That file is the
-- schema; this column is the storage.
--
-- ── Why score is a real column ──────────────────────────────────────────────
-- It is the one number every kind has, and the one a list is sorted and
-- charted by. Reaching into jsonb for it on every row is the kind of thing
-- that is fine at a thousand rows and not at a million.
-- ============================================================================

set search_path = public, extensions;

create table if not exists public.practice_attempts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  kind        text not null check (kind in ('speaking', 'listening', 'writing')),
  /* Which drill or passage, when there was one. Free practice has none. */
  drill_id    text,
  score       smallint not null check (score between 0 and 100),
  /* How long the attempt itself took, when the drill knows. */
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  metrics     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

-- The two questions asked of this table: one child's history, and one child's
-- history of one skill. Both are covered by the same index.
create index if not exists practice_attempts_user_idx
  on public.practice_attempts (user_id, kind, created_at desc);

comment on table public.practice_attempts is
  'One row per practice attempt. metrics keys are declared in lib/speaking/progress.ts, which also says which direction counts as improvement.';

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.practice_attempts enable row level security;

-- A learner owns their practice: they write it and they read it back.
drop policy if exists practice_own_all on public.practice_attempts;
create policy practice_own_all
  on public.practice_attempts
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Staff read it. A teacher opening a class blind to a week of practice is the
-- whole problem this table exists to solve.
--
-- Written WITHOUT a subquery on any table whose own policy could look back
-- here. Two policies pointing at each other is how bookings ended up throwing
-- 42P17 and taking every dashboard down with it — profiles does not reference
-- practice_attempts, so this cannot cycle.
drop policy if exists practice_staff_read on public.practice_attempts;
create policy practice_staff_read
  on public.practice_attempts
  for select
  using (
    exists (
      select 1 from public.profiles p
       where p.id = auth.uid()
         and (
           p.role in ('teacher', 'hr', 'admin', 'super_admin')
           or p.is_teacher = true or p.is_admin = true
           or p.is_super_admin = true or p.is_hr = true
         )
    )
  );

do $$
declare
  v_rows integer;
  r record;
begin
  select count(*) into v_rows from public.practice_attempts;

  raise notice '── practice-log ───────────────────────────────────────';
  raise notice 'attempts recorded so far: %', v_rows;

  if v_rows = 0 then
    raise notice '';
    raise notice 'Empty, as expected. From the next rebuild every attempt in the';
    raise notice 'practice room writes a row, and the curve starts accumulating.';
    raise notice 'Nothing before today can be recovered — it was never stored.';
  else
    raise notice '';
    for r in
      select kind, count(*) as n, round(avg(score)) as avg_score
        from public.practice_attempts group by kind order by kind
    loop
      raise notice '  %  %  attempts, average score %', rpad(r.kind, 12), lpad(r.n::text, 5), r.avg_score;
    end loop;
  end if;
end $$;
