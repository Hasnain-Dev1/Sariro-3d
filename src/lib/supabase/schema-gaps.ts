/**
 * SARIRO — telling "the table is not there" from "the table is empty"
 * ============================================================================
 * The seller's notes stopped working and nothing said why. The routes were
 * fine; `lead_notes` simply did not exist yet, because the migration that
 * creates it had not been run. Every save was refused by the database and the
 * seller was shown the raw PostgREST sentence — or, on the read side, an empty
 * logbook that looked exactly like a lead nobody had written about.
 *
 * An empty list and a missing table are two different facts and they need two
 * different sentences. This is the one place that tells them apart, so every
 * route can say "waiting on a database update" instead of "nothing here".
 */

type PgError = { code?: string | null; message?: string | null } | null | undefined;

/**
 * True when the error means a table or column this code expects is not in
 * the database yet — as opposed to a real failure worth a 500.
 *
 *   PGRST205  table not in PostgREST's schema cache
 *   PGRST204  column not in the schema cache (inserts)
 *   42P01     undefined table
 *   42703     undefined column
 */
export function isMissingRelation(e: PgError): boolean {
  if (!e) return false;
  if (e.code === 'PGRST205' || e.code === 'PGRST204' || e.code === '42P01' || e.code === '42703') return true;
  return /could not find the (table|column)|schema cache/i.test(e.message ?? '');
}

/** What a person is told. Names the file, because that is the whole fix. */
export const SELLER_SETUP_MESSAGE =
  'Notes, reminders and seller payouts are waiting on a database update — ' +
  'scripts/seller-pipeline-and-sale.sql has not been run in Supabase yet.';
