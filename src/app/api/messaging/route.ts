import { NextRequest, NextResponse } from 'next/server';
import { createServerClientHelper, createServiceClient } from '@/lib/supabase/server';
import { rateLimit, getClientIp, isIpBlocked } from '@/lib/rate-limit';
import { assertSameOrigin } from '@/lib/security/origin-check';
import { evaluateMessage } from '@/lib/messaging/contact-policy';

/**
 * SARIRO — POST /api/messaging
 * =========================================================
 * The in-house chat: one system for teacher↔student and for anyone in the
 * organisation reaching anyone else — a teacher asking HR about a settlement,
 * an admin telling a teacher their class moved.
 *
 * Body: { action, ... }
 *
 * ── Why this is a server route and not a browser query ──────────────────────
 * Two reasons, and the second is the important one.
 *
 * 1. `profiles` RLS is configured live in Supabase, not in this repo. A browser
 *    client asking for other people's rows may get nothing back, which would
 *    make the directory silently empty for exactly the people who need it.
 *
 * 2. The child-safety rule below has to be enforced somewhere that a crafted
 *    request cannot walk around. It is in RLS *and* here.
 *
 * ── The rule ────────────────────────────────────────────────────────────────
 * STUDENTS CANNOT MESSAGE OTHER STUDENTS. Most learners here are children, and
 * a school that gives every child a private line to every other child has built
 * somewhere bullying happens out of sight. At least one side of every
 * conversation is staff. Students are not even shown other students.
 *
 * A student is also not shown staff email addresses — a chat directory is not a
 * reason to hand a child's browser everyone's contact details.
 */

export const runtime = 'nodejs';

type Designation = 'super_admin' | 'admin' | 'hr' | 'teacher' | 'seller' | 'student';

interface Body {
  action?: 'directory' | 'conversations' | 'messages' | 'open' | 'send' | 'read' | 'flags' | 'review_flag';
  q?: string;
  conversationId?: string;
  personId?: string;
  body?: string;
  flagId?: string;
  note?: string;
  website?: string;
}

interface ProfileRow {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  is_teacher: boolean | null;
  is_admin: boolean | null;
  is_super_admin: boolean | null;
  teacher_tier: number | null;
}

const PROFILE_COLS = 'id, full_name, email, role, is_teacher, is_admin, is_super_admin, teacher_tier';

/** Same derivation as /api/hr: the role column first, legacy flags as fallback. */
function designationOf(p: Partial<ProfileRow> | null | undefined): Designation {
  const r = p?.role ?? '';
  if (r === 'super_admin' || r === 'admin' || r === 'hr' || r === 'seller' || r === 'teacher') {
    return r as Designation;
  }
  if (p?.is_super_admin) return 'super_admin';
  if (p?.is_admin) return 'admin';
  if (p?.is_teacher) return 'teacher';
  return 'student';
}

const isStaff = (d: Designation) => d !== 'student';

/** What one person looks like to the caller. Email is staff-only, on purpose. */
function shape(p: ProfileRow, callerIsStaff: boolean) {
  const designation = designationOf(p);
  return {
    id: p.id,
    name: (p.full_name || (callerIsStaff ? p.email : null) || 'Someone').trim(),
    email: callerIsStaff ? p.email : null,
    designation,
    tier: designation === 'teacher' ? (p.teacher_tier ?? 3) : null,
  };
}

export async function POST(req: NextRequest) {
  const csrfFail = assertSameOrigin(req);
  if (csrfFail) return csrfFail;

  const ip = getClientIp(req);
  if (isIpBlocked(ip)) return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  // Chat is chattier than the admin endpoints — polling a thread and typing
  // both land here — so the window is wider than the /api/hr 30.
  const rl = rateLimit({ key: `messaging:${ip}`, limit: 240, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 });

  let body: Body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 }); }
  if (body.website) return NextResponse.json({ ok: true });
  if (!body.action) return NextResponse.json({ ok: false, error: 'missing_action' }, { status: 400 });

  let supabase;
  try { supabase = await createServerClientHelper(); } catch { return NextResponse.json({ ok: false, error: 'supabase_not_configured' }, { status: 503 }); }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: 'unauthenticated' }, { status: 401 });

  let admin;
  try { admin = createServiceClient(); } catch { return NextResponse.json({ ok: false, error: 'service_role_unavailable' }, { status: 503 }); }

  const { data: meRow } = await admin.from('profiles').select(PROFILE_COLS).eq('id', user.id).maybeSingle();
  const me = designationOf(meRow as ProfileRow | null);
  const meIsStaff = isStaff(me);

  /** The conversations this user belongs to. Everything else is scoped by it. */
  const myConversationIds = async (): Promise<string[]> => {
    const { data } = await admin.from('conversation_members').select('conversation_id').eq('user_id', user.id);
    return (data ?? []).map((r) => r.conversation_id as string);
  };

  try {
    switch (body.action) {
      /* ── Who you may write to ───────────────────────────────────────────── */
      case 'directory': {
        let q = admin.from('profiles').select(PROFILE_COLS).neq('id', user.id).limit(300);

        if (!meIsStaff) {
          /* A learner is offered TEACHERS ONLY — not the wider staff list.
             The first version offered every member of staff, which put HR, the
             admins and the sales team in a child's contact picker. §28 gives a
             student a "Message Teacher" button and nothing wider, and support
             questions already have their own channel that routes and records
             them. A directory is also a disclosure: there is no reason a child
             should learn who the company's admins are. */
          q = q.or('role.eq.teacher,is_teacher.eq.true');
        }
        const term = (body.q ?? '').trim().slice(0, 80);
        if (term) {
          // Commas and parens would break out of the PostgREST or() grammar.
          const safe = term.replace(/[,()]/g, ' ');
          q = meIsStaff
            ? q.or(`full_name.ilike.%${safe}%,email.ilike.%${safe}%`)
            : q.ilike('full_name', `%${safe}%`);
        }

        const { data, error } = await q.order('full_name', { ascending: true, nullsFirst: false });
        if (error) throw error;

        let people = ((data ?? []) as ProfileRow[]).map((p) => shape(p, meIsStaff));
        // Belt and braces, whatever the query did: a learner sees teachers only.
        if (!meIsStaff) people = people.filter((p) => p.designation === 'teacher');

        return NextResponse.json({ ok: true, people });
      }

      /* ── The list down the left ─────────────────────────────────────────── */
      case 'conversations': {
        const { data: mine } = await admin
          .from('conversation_members')
          .select('conversation_id, last_read_at')
          .eq('user_id', user.id);

        const ids = (mine ?? []).map((r) => r.conversation_id as string);
        // The caller's own designation travels with the list: the composer has
        // to know whether a learner is in the room before it says the rule.
        if (ids.length === 0) return NextResponse.json({ ok: true, conversations: [], me });

        const readAt = new Map((mine ?? []).map((r) => [r.conversation_id as string, (r.last_read_at as string) ?? null]));

        const [{ data: convs }, { data: members }, { data: msgs }] = await Promise.all([
          admin.from('conversations').select('id, last_message_at').in('id', ids),
          admin.from('conversation_members').select('conversation_id, user_id').in('conversation_id', ids),
          admin.from('messages').select('conversation_id, body, created_at, sender_id')
            .in('conversation_id', ids).order('created_at', { ascending: false }).limit(2000),
        ]);

        const otherId = new Map<string, string>();
        for (const m of members ?? []) {
          if ((m.user_id as string) !== user.id) otherId.set(m.conversation_id as string, m.user_id as string);
        }

        const peopleIds = [...new Set(otherId.values())];
        const { data: profiles } = peopleIds.length
          ? await admin.from('profiles').select(PROFILE_COLS).in('id', peopleIds)
          : { data: [] as ProfileRow[] };
        const byId = new Map(((profiles ?? []) as ProfileRow[]).map((p) => [p.id, shape(p, meIsStaff)]));

        const latest = new Map<string, { body: string; at: string; mine: boolean }>();
        const unread = new Map<string, number>();
        for (const m of msgs ?? []) {
          const cid = m.conversation_id as string;
          const mine_ = (m.sender_id as string) === user.id;
          if (!latest.has(cid)) latest.set(cid, { body: m.body as string, at: m.created_at as string, mine: mine_ });
          const seen = readAt.get(cid);
          if (!mine_ && (!seen || (m.created_at as string) > seen)) unread.set(cid, (unread.get(cid) ?? 0) + 1);
        }

        const conversations = ((convs ?? []) as { id: string; last_message_at: string }[])
          .map((c) => {
            const last = latest.get(c.id);
            return {
              id: c.id,
              other: byId.get(otherId.get(c.id) ?? '') ?? null,
              lastMessage: last?.body ?? null,
              lastMessageMine: last?.mine ?? false,
              lastMessageAt: c.last_message_at ?? last?.at ?? '',
              unread: unread.get(c.id) ?? 0,
            };
          })
          .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));

        return NextResponse.json({ ok: true, conversations, me });
      }

      /* ── One thread ─────────────────────────────────────────────────────── */
      case 'messages': {
        if (!body.conversationId) return NextResponse.json({ ok: false, error: 'missing_conversation' }, { status: 400 });
        const ids = await myConversationIds();
        if (!ids.includes(body.conversationId)) {
          return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
        }

        const { data, error } = await admin
          .from('messages')
          .select('id, conversation_id, sender_id, body, created_at')
          .eq('conversation_id', body.conversationId)
          .order('created_at', { ascending: true })
          .limit(500);
        if (error) throw error;

        return NextResponse.json({ ok: true, messages: data ?? [], meId: user.id });
      }

      /* ── Start one, or reopen the one that already exists ───────────────── */
      case 'open': {
        if (!body.personId) return NextResponse.json({ ok: false, error: 'missing_person' }, { status: 400 });
        if (body.personId === user.id) return NextResponse.json({ ok: false, error: 'cannot_message_yourself' }, { status: 400 });

        const { data: themRow } = await admin.from('profiles').select(PROFILE_COLS).eq('id', body.personId).maybeSingle();
        if (!themRow) return NextResponse.json({ ok: false, error: 'no_such_person' }, { status: 404 });

        /* The rule, enforced where a hand-written request cannot skip it.
           A learner may open a conversation with a teacher and with nobody
           else — not another student, and not HR, admin or sales. Removing
           them from the directory only hides them; this is what makes it
           true. */
        if (!meIsStaff && designationOf(themRow as ProfileRow) !== 'teacher') {
          return NextResponse.json(
            { ok: false, error: 'forbidden', message: 'You can message your teachers here. For anything else, use Support.' },
            { status: 403 }
          );
        }

        const mineIds = await myConversationIds();
        if (mineIds.length) {
          const { data: shared } = await admin
            .from('conversation_members')
            .select('conversation_id')
            .eq('user_id', body.personId)
            .in('conversation_id', mineIds)
            .limit(1);
          const existing = (shared ?? [])[0]?.conversation_id as string | undefined;
          // Reusing rather than creating is what stops a second directory click
          // producing an empty thread beside the one holding the history.
          if (existing) return NextResponse.json({ ok: true, id: existing, existed: true });
        }

        const { data: conv, error: convErr } = await admin
          .from('conversations').insert({ created_by: user.id }).select('id').single();
        if (convErr || !conv) throw convErr ?? new Error('insert failed');

        const { error: memErr } = await admin.from('conversation_members').insert([
          { conversation_id: conv.id, user_id: user.id },
          { conversation_id: conv.id, user_id: body.personId },
        ]);
        if (memErr) {
          // Don't leave a conversation nobody belongs to sitting in the table.
          await admin.from('conversations').delete().eq('id', conv.id);
          throw memErr;
        }

        return NextResponse.json({ ok: true, id: conv.id as string, existed: false });
      }

      /* ── Say something ──────────────────────────────────────────────────── */
      case 'send': {
        if (!body.conversationId) return NextResponse.json({ ok: false, error: 'missing_conversation' }, { status: 400 });
        const text = (body.body ?? '').trim();
        if (!text) return NextResponse.json({ ok: false, error: 'empty_message' }, { status: 400 });
        if (text.length > 4000) return NextResponse.json({ ok: false, error: 'too_long' }, { status: 400 });

        const ids = await myConversationIds();
        if (!ids.includes(body.conversationId)) {
          return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
        }

        /* ── the contact-details rule ──────────────────────────────────────
           Everything a learner is part of stays on the platform. See
           lib/messaging/contact-policy.ts for why this exists at all. */
        const { data: others } = await admin
          .from('conversation_members')
          .select('user_id')
          .eq('conversation_id', body.conversationId)
          .neq('user_id', user.id);
        const otherIdSend = (others ?? [])[0]?.user_id as string | undefined;

        let otherDesignation: Designation = 'student';
        if (otherIdSend) {
          const { data: otherRow } = await admin.from('profiles').select(PROFILE_COLS).eq('id', otherIdSend).maybeSingle();
          otherDesignation = designationOf(otherRow as ProfileRow | null);
        }
        const involvesStudent = !meIsStaff || !isStaff(otherDesignation);

        const policy = evaluateMessage(text, { involvesStudent });

        if (policy.verdict !== 'allow') {
          // Recorded either way. The record is the half of this that changes
          // behaviour — a refusal alone just teaches people to try elsewhere.
          await admin.from('messaging_policy_flags').insert({
            conversation_id: body.conversationId,
            sender_id: user.id,
            recipient_id: otherIdSend ?? null,
            body: text,
            reasons: policy.reasons,
            blocked: policy.verdict === 'block',
          });
        }

        if (policy.verdict === 'block') {
          return NextResponse.json(
            { ok: false, error: 'policy_blocked', message: policy.message },
            { status: 422 }
          );
        }

        const { data, error } = await admin
          .from('messages')
          .insert({ conversation_id: body.conversationId, sender_id: user.id, body: text })
          .select('id, conversation_id, sender_id, body, created_at')
          .single();
        if (error) throw error;

        // Sending is reading: otherwise your own reply leaves the thread unread.
        await admin.from('conversation_members')
          .update({ last_read_at: new Date().toISOString() })
          .eq('conversation_id', body.conversationId).eq('user_id', user.id);

        return NextResponse.json({ ok: true, message: data, warning: policy.message });
      }

      /* ── Mark it seen ───────────────────────────────────────────────────── */
      case 'read': {
        if (!body.conversationId) return NextResponse.json({ ok: false, error: 'missing_conversation' }, { status: 400 });
        const { error } = await admin.from('conversation_members')
          .update({ last_read_at: new Date().toISOString() })
          .eq('conversation_id', body.conversationId).eq('user_id', user.id);
        if (error) throw error;
        return NextResponse.json({ ok: true });
      }

      /* ── Oversight ──────────────────────────────────────────────────────
         Management only. A teacher cannot read their own flags: knowing
         exactly what tripped the rule is a map around it. */
      case 'flags':
      case 'review_flag': {
        if (!['hr', 'admin', 'super_admin'].includes(me)) {
          return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
        }

        if (body.action === 'review_flag') {
          if (!body.flagId) return NextResponse.json({ ok: false, error: 'missing_flag' }, { status: 400 });
          const { error } = await admin.from('messaging_policy_flags').update({
            reviewed_at: new Date().toISOString(),
            reviewed_by: user.id,
            review_note: (body.note ?? '').trim().slice(0, 500) || null,
          }).eq('id', body.flagId);
          if (error) throw error;
          return NextResponse.json({ ok: true });
        }

        const { data: flags, error } = await admin
          .from('messaging_policy_flags')
          .select('id, conversation_id, sender_id, recipient_id, body, reasons, blocked, created_at, reviewed_at, review_note')
          .order('created_at', { ascending: false })
          .limit(200);
        if (error) throw error;

        const rows = (flags ?? []) as Record<string, unknown>[];
        const ids = [...new Set(rows.flatMap((f) => [f.sender_id, f.recipient_id]).filter(Boolean) as string[])];
        const { data: profiles } = ids.length
          ? await admin.from('profiles').select(PROFILE_COLS).in('id', ids)
          : { data: [] as ProfileRow[] };
        const byId = new Map(((profiles ?? []) as ProfileRow[]).map((p) => [p.id, shape(p, true)]));

        return NextResponse.json({
          ok: true,
          flags: rows.map((f) => ({
            ...f,
            sender: byId.get(f.sender_id as string) ?? null,
            recipient: byId.get(f.recipient_id as string) ?? null,
          })),
        });
      }

      default:
        return NextResponse.json({ ok: false, error: 'unknown_action' }, { status: 400 });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'unknown_error';
    // A missing table is the one failure with an obvious fix, so name it.
    const needsMigration = /relation .* does not exist|schema cache/i.test(message);
    return NextResponse.json(
      { ok: false, error: needsMigration ? 'migration_missing' : 'server_error', message },
      { status: needsMigration ? 503 : 500 }
    );
  }
}
