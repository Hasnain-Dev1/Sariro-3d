-- ============================================================================
-- SARIRO — a batch cannot take more students than it has seats
-- ============================================================================
-- Run once in the Supabase SQL editor. Safe to re-run.
--
-- V2 §7: "The system should enforce the maximum student capacity."
--
-- ── The bug ─────────────────────────────────────────────────────────────────
-- findGatheringCohort() selected max_capacity and then never used it. It
-- returned the oldest cohort matching track, level and ratio however full it
-- already was, and confirmPurchaseIntent() enrolled straight into it.
--
-- A 1:4 batch could therefore take a fifth, sixth and seventh student. Worse, a
-- 1:1 cohort could take a second — a parent pays the one-to-one premium and
-- their child shares the class. Nothing in the product would have said so; the
-- enrolment simply succeeds.
--
-- ── Why in the database and not only in the code ────────────────────────────
-- Enrolments are written from at least three places: the admin confirming a
-- purchase intent, the Razorpay webhook, and manual enrolment. A check in one
-- of them protects one of them. This binds all three, including whatever the
-- fourth turns out to be.
--
-- ── What counts as occupying a seat ─────────────────────────────────────────
-- Active enrolments only. A dropped student has left and their seat is free,
-- which is what makes a batch reusable after somebody leaves.
-- ============================================================================

create or replace function public.enforce_cohort_capacity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_capacity int;
  v_ratio    text;
  v_taken    int;
begin
  -- No cohort, no capacity to enforce.
  if new.cohort_id is null then return new; end if;

  -- A student who is dropped, or an update that does not move them into a
  -- cohort, takes no seat.
  if coalesce(new.status, '') = 'dropped' then return new; end if;

  if tg_op = 'UPDATE'
     and old.cohort_id is not distinct from new.cohort_id
     and old.status is not distinct from new.status then
    return new;
  end if;

  select c.max_capacity, c.ratio into v_capacity, v_ratio
    from public.cohorts c where c.id = new.cohort_id;
  if not found then return new; end if;

  -- Fall back to the ratio when max_capacity was never set, so an older cohort
  -- row created before the column was populated is still protected.
  if v_capacity is null or v_capacity <= 0 then
    v_capacity := case when coalesce(v_ratio, '1:1') = '1:1' then 1 else 4 end;
  end if;

  select count(*) into v_taken
    from public.enrollments e
   where e.cohort_id = new.cohort_id
     and e.status <> 'dropped'
     and e.id is distinct from new.id;

  if v_taken >= v_capacity then
    raise exception
      'This batch is full: % of % seats taken (ratio %). Put the student in another batch.',
      v_taken, v_capacity, coalesce(v_ratio, '1:1')
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_enforce_cohort_capacity on public.enrollments;
create trigger trg_enforce_cohort_capacity
  before insert or update of cohort_id, status on public.enrollments
  for each row execute function public.enforce_cohort_capacity();

-- ── Are any batches already over capacity? ──────────────────────────────────
-- Read-only. The trigger stops new breaches; it does not evict anybody, because
-- silently removing a child from a class they have been attending would be a
-- worse failure than the overfill. Run this to see whether any exist, then move
-- them deliberately.
--
-- select c.id, c.batch_code, c.ratio,
--        coalesce(c.max_capacity, case when c.ratio = '1:1' then 1 else 4 end) as seats,
--        count(e.id) filter (where e.status <> 'dropped') as taken
--   from public.cohorts c
--   left join public.enrollments e on e.cohort_id = c.id
--  group by c.id, c.batch_code, c.ratio, c.max_capacity
-- having count(e.id) filter (where e.status <> 'dropped')
--        > coalesce(c.max_capacity, case when c.ratio = '1:1' then 1 else 4 end);
