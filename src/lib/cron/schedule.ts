/**
 * SARIRO — the jobs that have never once run
 * ============================================================================
 * Three scheduled routes exist in this codebase. Between them they send every
 * class reminder, close every class nobody marked, and settle every teacher's
 * month if a human forgets. Not one of them has ever executed in production,
 * because each needs a line in a hosting control panel and that line has never
 * been added. Zero reminders have been sent. Nine trials sat open.
 *
 * The instruction has been repeated across four sessions and the panel is not
 * somewhere code can reach. So the schedule moves into the application, where
 * a deploy is enough to start it.
 *
 * ── Why calling ourselves over HTTP ─────────────────────────────────────────
 * Each route already carries its own authorisation, rate limiting and claim
 * logic. Importing the handlers directly would mean reproducing the request
 * they expect, and any divergence between the timer's path and the manual one
 * is a bug that only shows up at 3am. A loopback request runs exactly the code
 * an external scheduler would.
 *
 * ── Why running twice is safe ───────────────────────────────────────────────
 * Every job was written to be called whenever: reminders CLAIM each booking by
 * stamping reminder_sent_at and only take rows where it is null; the stale
 * closer updates with `.eq('status','scheduled')` so a second run wins nothing;
 * settlement has a unique index per teacher per month. That was deliberate,
 * and it is what makes an in-process timer acceptable rather than reckless.
 *
 * ── What this does NOT replace ──────────────────────────────────────────────
 * A real external scheduler is still better: it survives a process restart
 * mid-job, and it runs whether or not anybody has hit the site. If Hostinger's
 * cron is ever configured, set SARIRO_INPROCESS_CRON=0 and this stands down
 * without a code change. Both paths hit the same URLs, so they cannot disagree.
 */

interface Job {
  name: string;
  path: string;
  everyMs: number;
  /** Delay before the first run, so a restart does not fire everything at once. */
  offsetMs: number;
}

const MINUTE = 60_000;

const JOBS: Job[] = [
  {
    /* Every ten minutes. The route looks for classes starting in roughly half
       an hour, so a wider gap means a learner gets "starts in 12 minutes",
       which is not a reminder — it is an apology. */
    name: 'class-reminders',
    path: '/api/cron/class-reminders',
    everyMs: 10 * MINUTE,
    offsetMs: 30_000,
  },
  {
    /* Hourly is plenty: it only acts on classes that ended more than six hours
       ago, and it deliberately refuses to decide anything about a class the
       teacher never started. */
    name: 'close-stale-classes',
    path: '/api/cron/close-stale-classes',
    everyMs: 60 * MINUTE,
    offsetMs: 90_000,
  },
  {
    /* The class the teacher never started. Every fifteen minutes, because the
       family sitting in an empty room is owed an answer the same morning — not
       tomorrow. The route only decides classes from the last two days, so a
       restart cannot suddenly charge a teacher for a fortnight of history. */
    name: 'finalise-no-shows',
    path: '/api/cron/finalise-no-shows',
    everyMs: 15 * MINUTE,
    offsetMs: 120_000,
  },
  {
    /* Settlement is due on the 5th at 10:00 IST and the route settles only
       what is due. Twice an hour costs nothing and means a process that was
       restarted at 09:58 still pays people on time. */
    name: 'auto-settle',
    path: '/api/cron/auto-settle',
    everyMs: 30 * MINUTE,
    offsetMs: 150_000,
  },
  {
    /* The catch-up reminder ladder and the seven-day grace expiry. Hourly:
       every threshold it watches is measured in days, and each obligation
       carries `last_reminder` so a sweep cannot send the same nudge twice
       however often it runs. */
    name: 'catchup-sweep',
    path: '/api/cron/catchup-sweep',
    everyMs: 60 * MINUTE,
    offsetMs: 210_000,
  },
];

/** Module-level, so a hot reload in development cannot stack a second set. */
let started = false;

/** Whether the in-process scheduler should run at all, and why not. */
export function schedulerVerdict(env: NodeJS.ProcessEnv): { run: boolean; reason: string } {
  if (env.SARIRO_INPROCESS_CRON === '0') {
    return { run: false, reason: 'disabled by SARIRO_INPROCESS_CRON=0' };
  }
  if (!env.CRON_SECRET) {
    /* The routes refuse without it and would return 401 every ten minutes for
       ever. Better to say so once, at boot, than to fill a log with refusals. */
    return { run: false, reason: 'CRON_SECRET is not set, so the jobs would be refused' };
  }
  if (env.NODE_ENV !== 'production' && env.SARIRO_INPROCESS_CRON !== '1') {
    /* A developer's machine sending real reminders to real learners is the
       kind of mistake that is only noticed by the people who receive them. */
    return { run: false, reason: 'not production (set SARIRO_INPROCESS_CRON=1 to force)' };
  }
  return { run: true, reason: '' };
}

/** Where this server can reach itself. */
export function selfOrigin(env: NodeJS.ProcessEnv): string {
  const explicit = (env.SARIRO_CRON_ORIGIN ?? '').trim();
  if (explicit) return explicit.replace(/\/+$/, '');
  const port = env.PORT || '3000';
  return `http://127.0.0.1:${port}`;
}

async function runJob(job: Job, origin: string, secret: string): Promise<void> {
  try {
    const res = await fetch(`${origin}${job.path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${secret}` },
      // A job that hangs must not hold a timer slot for ever.
      signal: AbortSignal.timeout(120_000),
    });
    const body = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    if (!res.ok || body?.ok !== true) {
      console.warn(`[cron] ${job.name} -> ${res.status}`, JSON.stringify(body)?.slice(0, 300));
      return;
    }
    /* Logged only when it actually did something. A job that reports "0 sent"
       every ten minutes trains everyone to ignore the log it is written to. */
    const did = Object.entries(body)
      .filter(([k, v]) => typeof v === 'number' && v > 0 && k !== 'staleAfterHours')
      .map(([k, v]) => `${k}=${v}`);
    if (did.length > 0) console.log(`[cron] ${job.name}: ${did.join(' ')}`);
  } catch (err) {
    // Never throw out of a timer: an unhandled rejection here would take the
    // whole server down over a missed reminder.
    console.warn(`[cron] ${job.name} failed:`, err instanceof Error ? err.message : err);
  }
}

/**
 * Start the timers. Safe to call more than once — only the first call arms
 * anything.
 */
export function startScheduler(env: NodeJS.ProcessEnv = process.env): boolean {
  if (started) return false;

  const verdict = schedulerVerdict(env);
  if (!verdict.run) {
    console.log(`[cron] in-process scheduler off: ${verdict.reason}`);
    return false;
  }

  started = true;
  const origin = selfOrigin(env);
  const secret = env.CRON_SECRET!;

  for (const job of JOBS) {
    setTimeout(() => {
      void runJob(job, origin, secret);
      const t = setInterval(() => void runJob(job, origin, secret), job.everyMs);
      // Do not hold the process open on this alone.
      t.unref?.();
    }, job.offsetMs).unref?.();
  }

  console.log(
    `[cron] in-process scheduler on (${origin}): ` +
    JOBS.map((j) => `${j.name} every ${Math.round(j.everyMs / MINUTE)}m`).join(', ')
  );
  return true;
}

/** Test seam: forget that we ever started. */
export function resetSchedulerForTests(): void {
  started = false;
}

export const SCHEDULED_JOBS = JOBS;
