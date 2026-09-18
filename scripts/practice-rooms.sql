-- ============================================================================
-- SARIRO — practice rooms for every course: widen practice_attempts (18 Sep 2026)
-- ============================================================================
-- The practice room was Public Speaking's alone, so practice_attempts only
-- allowed kinds 'speaking' | 'listening' | 'writing'. The new rooms (Maths,
-- Coding, then Physics, Chemistry…) record into the same table — one history,
-- one streak — with two new columns saying which room and which topic.
--
--   subject  'maths' | 'coding' | 'physics' | 'chemistry' | 'biology' |
--            'science' | 'english' — null for Public Speaking's existing rows
--   topic    'maths:fraction-add-sub', 'coding:fizzbuzz' …
--   kind     now also 'problem' (a set of questions), 'quiz' (the timed
--            end-of-lesson quiz) and 'code' (a kata run)
--
-- Nothing existing changes: every current row stays valid, the speaking room
-- keeps working, and row security is untouched (practice_own_all: a learner
-- writes and reads only their own rows).
--
-- Until this runs, the new rooms still work — they just cannot save, and say so.
-- Safe to run more than once. One transaction.
-- ============================================================================

begin;

alter table public.practice_attempts add column if not exists subject text;
alter table public.practice_attempts add column if not exists topic   text;

-- Replace the old kind check (named by Postgres when the column was created),
-- whatever it is called, with the wider one.
do $$
declare c text;
begin
  for c in
    select conname from pg_constraint
     where conrelid = 'public.practice_attempts'::regclass and contype = 'c'
       and pg_get_constraintdef(oid) ilike '%kind%'
  loop
    execute format('alter table public.practice_attempts drop constraint %I', c);
  end loop;
end $$;

alter table public.practice_attempts
  add constraint practice_attempts_kind_check
  check (kind in ('speaking', 'listening', 'writing', 'problem', 'quiz', 'code'));

alter table public.practice_attempts drop constraint if exists practice_attempts_subject_check;
alter table public.practice_attempts
  add constraint practice_attempts_subject_check
  check (subject is null or subject in ('maths', 'coding', 'physics', 'chemistry', 'biology', 'science', 'english'));

alter table public.practice_attempts drop constraint if exists practice_attempts_topic_len;
alter table public.practice_attempts
  add constraint practice_attempts_topic_len check (topic is null or length(topic) <= 80);

-- One room's history, newest first.
create index if not exists practice_attempts_user_subject_idx
  on public.practice_attempts (user_id, subject, created_at desc);

commit;

-- One result set. Expect: both columns true, the kind rule listing all six,
-- and existing_rows_still_valid equal to all_rows.
select
  exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'practice_attempts' and column_name = 'subject') as has_subject,
  exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'practice_attempts' and column_name = 'topic')   as has_topic,
  (select pg_get_constraintdef(oid) from pg_constraint where conname = 'practice_attempts_kind_check' and conrelid = 'public.practice_attempts'::regclass) as kind_rule,
  (select count(*) from public.practice_attempts where kind in ('speaking', 'listening', 'writing', 'problem', 'quiz', 'code')) as existing_rows_still_valid,
  (select count(*) from public.practice_attempts) as all_rows;
