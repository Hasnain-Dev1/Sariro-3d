'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldAlert, X } from 'lucide-react';
import { showAlert } from '@/lib/dashboard/alerts';
import {
  fetchConversations, DESIGNATION_LABEL, DESIGNATION_TONE,
  type ConversationSummary, type Designation,
} from '@/lib/dashboard/messaging';

/**
 * SARIRO — a message from the office does not wait to be noticed
 * =========================================================
 * A teacher gets a lot of things in a day. A message from HR, an admin or the
 * super-admin is usually not one of them — it is a settlement query, a schedule
 * change, a policy matter — so it interrupts rather than sits in a list.
 *
 * ── Why an in-app dialog and not only the browser pop-up ────────────────────
 * The system notification is the nicer of the two, and it is the one that
 * reaches a background tab. But it needs a permission most people never grant,
 * and it is silently dropped when they have not. A rule that only works for
 * users who clicked Allow is not a rule. So the dialog is the guarantee and the
 * system pop-up is the enhancement, fired together.
 *
 * ── Announced once, ever ────────────────────────────────────────────────────
 * Keyed on the message's timestamp and remembered in localStorage, so opening
 * a second dashboard tab does not re-announce what you have already been shown.
 * If storage is unavailable the alert still works — it just may repeat, which
 * is the right way round for something that carries a schedule change.
 */

const POLL_MS = 20_000;
const STORAGE_KEY = 'sariro.priority-messages.seen';
/** Older than this and the unread badge can carry it — a dialog for a
 *  three-week-old message is an ambush, not an alert. */
const MAX_AGE_DAYS = 7;

const PRIORITY: Designation[] = ['hr', 'admin', 'super_admin'];

function readSeen(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function writeSeen(seen: Set<string>): void {
  try {
    // Keep the tail only — this list is a dedupe key, not a history.
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...seen].slice(-200)));
  } catch {
    /* private mode, blocked storage — the alert still works, it may repeat */
  }
}

export default function PriorityMessageAlert() {
  const pathname = usePathname();
  const [queue, setQueue] = useState<ConversationSummary[]>([]);

  const check = useCallback(async () => {
    let rows: ConversationSummary[];
    try {
      ({ conversations: rows } = await fetchConversations());
    } catch {
      // Chat may not be migrated yet, or the network is down. Neither is worth
      // shouting about from a component that lives on every dashboard page.
      return;
    }

    const cutoff = Date.now() - MAX_AGE_DAYS * 86_400_000;
    const seen = readSeen();
    const fresh: ConversationSummary[] = [];

    for (const c of rows) {
      if (!c.unread || !c.other || !PRIORITY.includes(c.other.designation)) continue;
      const at = Date.parse(c.lastMessageAt);
      if (!Number.isFinite(at) || at < cutoff) continue;

      const key = `${c.id}:${c.lastMessageAt}`;
      if (seen.has(key)) continue;
      seen.add(key);
      fresh.push(c);

      showAlert({
        title: `${c.other.name} · ${DESIGNATION_LABEL[c.other.designation]}`,
        body: c.lastMessage ?? 'New message',
        url: '/dashboard/messages',
        tag: c.id,
      });
    }

    if (fresh.length) {
      writeSeen(seen);
      setQueue((prev) => [...prev, ...fresh]);
    }
  }, []);

  useEffect(() => {
    // Not on the messages page — you are already looking at it there.
    if (pathname === '/dashboard/messages') return;
    void check();
    const t = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') void check();
    }, POLL_MS);
    return () => clearInterval(t);
  }, [check, pathname]);

  const current = queue[0];
  if (!current || !current.other) return null;

  const tone = DESIGNATION_TONE[current.other.designation];
  const dismiss = () => setQueue((prev) => prev.slice(1));

  return (
    <div className="fixed inset-0 z-[60] bg-slate-900/40 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="priority-msg-title"
        className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="px-4 py-3 flex items-center gap-2.5 border-b border-slate-100">
          <ShieldAlert className="w-[18px] h-[18px]" style={{ color: tone.fg }} />
          <p id="priority-msg-title" className="font-extrabold text-slate-900 flex-1" style={{ fontFamily: 'var(--font-grotesk)' }}>
            Message from {DESIGNATION_LABEL[current.other.designation]}
          </p>
          <button type="button" onClick={dismiss} aria-label="Dismiss" className="w-9 h-9 -mr-1.5 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-4">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="font-bold text-slate-900 text-[15px]">{current.other.name}</span>
            <span
              className="text-[10px] font-black tracking-wider px-1.5 py-0.5 rounded uppercase"
              style={{ color: tone.fg, background: tone.bg }}
            >
              {DESIGNATION_LABEL[current.other.designation]}
            </span>
          </div>
          <p className="text-[14px] text-slate-700 leading-[1.6] whitespace-pre-wrap break-words line-clamp-6">
            {current.lastMessage ?? 'You have a new message.'}
          </p>
          {queue.length > 1 && (
            <p className="text-[12px] text-slate-400 mt-2">
              {queue.length - 1} more waiting.
            </p>
          )}
        </div>

        <div className="px-4 pb-4 flex gap-2">
          <Link
            href="/dashboard/messages"
            onClick={dismiss}
            className="flex-1 inline-flex items-center justify-center min-h-[44px] px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold"
            style={{ fontFamily: 'var(--font-grotesk)' }}
          >
            Open message
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className="px-4 min-h-[44px] rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
