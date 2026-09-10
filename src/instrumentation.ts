/**
 * SARIRO — what happens when the server starts
 * ============================================================================
 * Next.js calls register() once per server process, before the first request.
 * It is the only place in this app that can start something on a clock.
 *
 * The scheduled routes — reminders, the stale-class closer, settlement — have
 * never run in production, because each needs a line in a hosting control
 * panel that code cannot reach. This starts them from the deploy instead. See
 * lib/cron/schedule.ts for why running them twice is safe, and for the switch
 * that turns this off if a real external scheduler is ever configured.
 */
export async function register(): Promise<void> {
  /* Only the Node.js server. This file is also evaluated for the edge runtime,
     where setInterval has no process to keep and fetch has no localhost to
     call. */
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const { startScheduler } = await import('@/lib/cron/schedule');
  startScheduler();
}
