/**
 * SARIRO — who counts as a seller
 *
 * One rule, used everywhere a person is picked to own a lead or be credited
 * with a sale: the `seller` role, or the `is_seller` flag.
 *
 * ── Why it is written down once ─────────────────────────────────────────────
 * Three places answered this question and two answered it wrong. The sales
 * ledger's "Record a sale" offered every seller, HR, admin and super-admin;
 * the lead pipeline's "Assign" offered admins and super-admins too. So leads
 * were handed to the CEO's and the dev account's profiles — accounts no seller
 * can see — and thirteen of eighteen leads sat where nobody would ever ring
 * them. Sales could be credited to people who do not earn a seller's
 * incentive, which moves money in the wrong direction.
 *
 * Only lead auto-assignment had it right. This is that rule, shared.
 * scripts/seller-only-attribution.sql enforces the same rule in the database,
 * so a request that skips these dropdowns is refused too.
 */

/** PostgREST `.or()` filter selecting exactly the people who may sell. */
export const SELLER_OR_FILTER = 'role.eq.seller,is_seller.eq.true';

/** The same rule, for a profile already in hand. */
export function isSeller(p: { role?: string | null; is_seller?: boolean | null } | null | undefined): boolean {
  return !!p && (p.role === 'seller' || p.is_seller === true);
}
