import type { AdminCommission } from "~/orpc/commission/contract";

/*===== Types =====*/
/**
 * A commission the Admin just marked paid on the pay sheet, kept for a moment so it can be stamped and fold away before
 * it leaves. The write has succeeded; `useAdminAction` then reloads the list, and the reloaded commission is paid, so
 * the page puts this copy (still unpaid) back in its place until its exit has played.
 *
 * It only lives in «پرداخت‌نشده»: a view change drops every kept line, so it can never show up as a ghost elsewhere.
 */
export type LeavingLine = {
  /** The commission as it was on screen when he confirmed (still unpaid). */
  commission: AdminCommission;
  /**
   * Set when the dialog has closed and the exit starts (the stamp would otherwise land under the dialog's backdrop).
   * Lines that start together share a batch and are removed together when it ends.
   */
  batch?: number;
};

/*===== Merge =====*/
/**
 * The reloaded commissions with each kept line's unpaid copy in place of its paid version. The pay sheet groups and
 * orders by partner and date, so the copy lands exactly where the line stood, its slip included. A kept line the
 * reload doesn't have any more (it can't happen today: commissions are never deleted) is simply gone.
 */
export function withLeavingLines({
  commissions,
  leaving,
}: {
  commissions: readonly AdminCommission[];
  leaving: readonly LeavingLine[];
}): AdminCommission[] {
  if (leaving.length === 0) return [...commissions];
  const copies = new Map(leaving.map((line) => [line.commission.id, line.commission]));
  return commissions.map((commission) => copies.get(commission.id) ?? commission);
}

/*===== Counting =====*/
/**
 * Whether a commission counts as waiting for the header, the pill and the slip's sum. A kept line still counts until its
 * exit starts, so the numbers change (and pop) as the stamp lands, not under the dialog while the list reloads.
 */
export function countsAsUnpaid({
  commission,
  waiting,
}: {
  commission: AdminCommission;
  /** Kept lines whose exit hasn't started. */
  waiting: ReadonlySet<string>;
}): boolean {
  return commission.paidAt === null || waiting.has(commission.id);
}
