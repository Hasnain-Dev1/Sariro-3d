-- ============================================================================
-- SARIRO — the spine: lead ↔ student ↔ booking ↔ sale
-- ============================================================================
-- Run once in the Supabase SQL editor. Safe to re-run. Ends with ONE table.
--
-- Booking a trial currently inserts a student_leads row carrying a name and a
-- phone number as TEXT, and nothing else. It does not know which account it
-- belongs to, which booking produced it, or what the family asked to learn.
--
-- So the three things the back half of the workflow needs to walk between —
-- the trial, the account, and the sale — are three islands joined by string
-- matching. "Credit the sale to the seller who was holding the lead" cannot be
-- answered at all, and today it is answered by somebody typing a name into a
-- box.
--
-- ── What this adds to student_leads ─────────────────────────────────────────
--   student_id     the account. The only identity here that is a fact.
--   booking_id     the trial that produced the lead.
--   subject        what they asked to learn — a Maths enquiry and a Public
--                  Speaking enquiry are currently the same record.
--   grade          the year they are in, denormalised so the pipeline can be
--                  filtered without joining out to profiles.
--   source         where it came from: self_book | staff | demo_request.
--   trial_status   where the trial itself stands, which is NOT the same
--                  question as which stage the seller has it at. A trial can
--                  be a no-show while the lead is still being worked.
--
-- ── Why denormalise subject and grade onto the lead ─────────────────────────
-- The same reason trial_participants.grade exists: these record what was true
-- WHEN the lead was created. A child moves up a year every September and a
-- family can book a second trial in a different subject. Reading either off
-- the profile would silently rewrite history on both counts.
--
-- ── Nothing here is NOT NULL ────────────────────────────────────────────────
-- Thirteen leads already exist and none of them can be given a student_id
-- without somebody deciding who they are. A migration that refuses to install
-- until the old data is perfect is a migration that does not install.
-- ============================================================================

set search_path = public, extensions;

alter table public.student_leads
  add column if not exists student_id   uuid references public.profiles(id) on delete set null,
  add column if not exists booking_id   uuid references public.bookings(id) on delete set null,
  add column if not exists subject      text,
  add column if not exists grade        smallint,
  add column if not exists source       text,
  add column if not exists trial_status text;

-- ── The stage nobody could write ────────────────────────────────────────────
-- student_leads_stage_check does not allow 'trial_booked' — and that is
-- exactly the value /api/trial/self-book has been writing since the day it
-- shipped. The insert sat inside a .then(ok, ignore), so the rejection was
-- swallowed, the route returned success, and the class was booked.
--
-- The consequence is not "an odd-looking lead". It is NO LEAD AT ALL. Every
-- family who booked their own free class from the advert has been completely
-- invisible to the sales side: no row, no seller, no follow-up, nothing to
-- credit a sale to later. Found by running the real code against this database
-- rather than by reading it — the constraint is not in any migration file in
-- the repository.
--
-- Rebuilt with the full list, so the database and lib/dashboard/leads-data.ts
-- agree about what a stage is. 'sale_done' is deliberately NOT added: this
-- codebase has always called that 'enrolled', and two names for one stage is
-- how a pipeline ends up double-counting.
alter table public.student_leads
  drop constraint if exists student_leads_stage_check;
alter table public.student_leads
  add constraint student_leads_stage_check
  check (stage in (
    'new',
    'seller_assigned',
    'connected',
    'gathering_booked',
    'trial_booked',
    'final',
    'deferred',
    'enrolled'
  ));

-- Same bounds as profiles.grade and trial_participants.grade. Three places
-- that must agree, so all three carry the constraint rather than trusting the
-- application to be the only writer.
alter table public.student_leads
  drop constraint if exists student_leads_grade_range;
alter table public.student_leads
  add constraint student_leads_grade_range
  check (grade is null or (grade between 1 and 12));

comment on column public.student_leads.student_id is
  'The Sariro account this lead belongs to. NULL for leads that predate the link, or an enquiry with no account yet.';
comment on column public.student_leads.booking_id is
  'The trial booking that produced this lead.';
comment on column public.student_leads.subject is
  'Course/track slug the family asked about. Matches cohorts.track and purchase_intents.';
comment on column public.student_leads.grade is
  'The grade they were in WHEN the lead was created — not what profiles.grade says today.';
comment on column public.student_leads.source is
  'self_book | staff | demo_request | manual.';
comment on column public.student_leads.trial_status is
  'booked | attended | no_show | slot_assistance. Where the CLASS stands, which is not the same question as the seller stage.';

-- The three lookups the booking routes do on every request: has this family
-- been here before (by account, by phone), and how much is each seller
-- carrying this month.
create index if not exists student_leads_student_id_idx  on public.student_leads(student_id);
create index if not exists student_leads_booking_id_idx  on public.student_leads(booking_id);
create index if not exists student_leads_phone_idx       on public.student_leads(phone);
create index if not exists student_leads_seller_month_idx
  on public.student_leads(assigned_seller, created_at);

-- ── Backfill what can be worked out without guessing ────────────────────────
-- Only where the phone matches EXACTLY one account. A phone shared by two
-- accounts, or matching none, is left alone: attaching a lead to the wrong
-- family means one of them is never rung and a future sale is credited to
-- whoever holds the survivor. Better an unlinked row than a wrong link.
--
-- student_leads stores the number without its country code and profiles keeps
-- E.164, so the join is on the last ten digits — the subscriber number, which
-- is what actually identifies an Indian line. Mirrors normalisePhone() in
-- lib/leads/identity.ts.
with candidate as (
  select l.id as lead_id,
         min(p.id::text)::uuid as student_id,
         count(*) as matches
    from public.student_leads l
    join public.profiles p
      on right(regexp_replace(coalesce(p.phone, ''), '\D', '', 'g'), 10)
       = right(regexp_replace(coalesce(l.phone, ''), '\D', '', 'g'), 10)
   where l.student_id is null
     and length(regexp_replace(coalesce(l.phone, ''), '\D', '', 'g')) >= 10
     and (p.is_student = true or p.role = 'student')
   group by l.id
)
update public.student_leads l
   set student_id = c.student_id
  from candidate c
 where l.id = c.lead_id
   and c.matches = 1;

-- Leads that came in through the website form already know their origin.
update public.student_leads
   set source = 'demo_request'
 where source is null and demo_request_id is not null;

update public.student_leads
   set source = 'manual'
 where source is null;

-- ── One table. What the spine can now see. ─────────────────────────────────
select 'leads linked to an account' as fact,
       count(*) filter (where student_id is not null)::text || ' of ' || count(*)::text as value
  from public.student_leads
union all
select 'leads with no seller',
       count(*) filter (where assigned_seller is null)::text || ' of ' || count(*)::text
  from public.student_leads
union all
select 'active seller accounts',
       count(*)::text
  from public.profiles
 where is_seller = true or role = 'seller'
union all
select 'leads held by someone who is not a seller',
       count(distinct l.assigned_seller)::text
  from public.student_leads l
  join public.profiles p on p.id = l.assigned_seller
 where coalesce(p.is_seller, false) = false and coalesce(p.role, '') <> 'seller'
union all
select 'trial bookings with no lead at all',
       count(*)::text
  from public.bookings b
 where b.is_trial = true
   and not exists (select 1 from public.student_leads l where l.booking_id = b.id)
union all
-- Proof the constraint now accepts the stage the booking route writes. If this
-- says no, the self-booking funnel is still dropping every lead on the floor.
select 'stage trial_booked is now writable',
       case when exists (
         select 1 from pg_constraint
          where conname = 'student_leads_stage_check'
            and pg_get_constraintdef(oid) like '%trial_booked%'
       ) then 'yes' else 'NO — SELF-BOOKED LEADS STILL FAIL' end;
