-- ════════════════════════════════════════════════════════════════
-- SARIRO — Backfill pre-existing enrollments
--
-- TEMPLATE — Edit the array literal at the top before running.
--
-- Use this when you have students who already paid (e.g. via a manual
-- Razorpay link or bank transfer) and need to insert enrollment rows
-- for them retroactively. Each row in the array becomes one enrollment.
--
-- The script will:
--   1. Find or create a gathering cohort matching (track, level, ratio)
--   2. Insert an enrollment row (status='active') for the student
--   3. Mark the matching purchase_intent as 'confirmed' if one exists
--
-- Run in Supabase SQL editor as an admin/super-admin role.
-- The service-role key also works (bypasses RLS).
--
-- ⚠️ REVIEW THE JSONB ARRAY AT THE TOP BEFORE RUNNING.
-- ════════════════════════════════════════════════════════════════

-- 1. EDIT THIS LIST — one entry per enrollment to backfill ---------------
--    Each entry must include: user_email, track, level, ratio
--    Optional: started_at (ISO timestamp), intent_id (if a PI exists)
--
--    Example:
--      '{"userEmail":"alice@example.com","track":"web","level":"beginner","ratio":"1:4"}'

do $$
declare
  records jsonb := $j$
    [
      -- {"userEmail": "alice@example.com", "track": "web",  "level": "beginner",     "ratio": "1:4"},
      -- {"userEmail": "bob@example.com",   "track": "app",  "level": "intermediate", "ratio": "1:1"},
      -- {"userEmail": "carol@example.com", "track": "saas", "level": "advanced",     "ratio": "1:4"}
    ]
  $j$;
  rec jsonb;
  user_id uuid;
  cohort_id uuid;
  enrollment_id uuid;
  started_ts timestamptz;
begin
  for rec in select * from jsonb_array_elements(records)
  loop
    -- 1a. Look up user_id by email
    select id into user_id
      from public.profiles
      where lower(email) = lower(rec->>'userEmail')
      limit 1;

    if user_id is null then
      raise notice 'Skipping % — no profile found with that email', rec->>'userEmail';
      continue;
    end if;

    -- 1b. Find or create a gathering cohort
    select id into cohort_id
      from public.cohorts
      where track = rec->>'track'
        and level = rec->>'level'
        and ratio = rec->>'ratio'
        and status = 'gathering'
      order by created_at asc
      limit 1;

    if cohort_id is null then
      insert into public.cohorts (track, level, ratio, max_capacity, status)
      values (
        rec->>'track',
        rec->>'level',
        rec->>'ratio',
        case when rec->>'ratio' = '1:1' then 1 else 4 end,
        'gathering'
      )
      returning id into cohort_id;
      raise notice 'Created new gathering cohort % for %/%/%', cohort_id, rec->>'track', rec->>'level', rec->>'ratio';
    end if;

    -- 1c. Resolve started_at (use provided value or now)
    started_ts := coalesce((rec->>'started_at')::timestamptz, now());

    -- 1d. Skip if enrollment already exists for this user + cohort + track + level
    if exists (
      select 1 from public.enrollments
        where user_id = user_id
          and cohort_id = cohort_id
          and track = rec->>'track'
          and level = rec->>'level'
    ) then
      raise notice 'Skipping % — enrollment already exists in cohort %', rec->>'userEmail', cohort_id;
      continue;
    end if;

    -- 1e. Insert the enrollment
    insert into public.enrollments (user_id, track, level, ratio, status, cohort_id, started_at)
    values (
      user_id,
      rec->>'track',
      rec->>'level',
      rec->>'ratio',
      'active',
      cohort_id,
      started_ts
    )
    returning id into enrollment_id;

    raise notice 'Backfilled enrollment % for % (cohort %)', enrollment_id, rec->>'userEmail', cohort_id;

    -- 1f. Mark matching purchase_intent as confirmed (if a PI exists)
    if rec ? 'intent_id' then
      update public.purchase_intents
        set status = 'confirmed', confirmed_at = now()
        where id = (rec->>'intent_id')::uuid
          and user_id = user_id;
    elsif exists (
      select 1 from public.purchase_intents
        where user_id = user_id
          and track = rec->>'track'
          and level = rec->>'level'
          and ratio = rec->>'ratio'
          and status = 'pending'
    ) then
      update public.purchase_intents
        set status = 'confirmed', confirmed_at = now()
        where id in (
          select id from public.purchase_intents
            where user_id = user_id
              and track = rec->>'track'
              and level = rec->>'level'
              and ratio = rec->>'ratio'
              and status = 'pending'
            order by created_at asc
            limit 1
        );
      raise notice 'Marked matching purchase_intent as confirmed for %', rec->>'userEmail';
    end if;

    -- 1g. Drop a welcome notification (best-effort)
    insert into public.notifications (user_id, type, title, message, link)
    values (
      user_id,
      'enrollment_confirmed',
      'You’re in! 🎉',
      'Your enrollment was confirmed. Check your dashboard for cohort details.',
      '/dashboard/student'
    );
  end loop;

  raise notice 'Backfill complete.';
end $$;

-- 2. Verification --------------------------------------------------------------
-- select u.email, e.track, e.level, e.ratio, e.status, c.status as cohort_status
--   from public.enrollments e
--   join public.profiles u on u.id = e.user_id
--   left join public.cohorts c on c.id = e.cohort_id
--   order by e.created_at desc
--   limit 20;
