import type { AdminUser } from "~/orpc/user/contract";

/*===== Types =====*/
/**
 * A person the Admin just blocked or opened again while a status pill («فعال» or «مسدود») was on, kept for a moment
 * so the change can be answered on the row before it leaves the view. The write has succeeded; `useAdminAction` then
 * reloads the list, and the reloaded view no longer has the person, so the page puts this copy back where it stood
 * until its exit has played. Under «همه» the row simply stays, so nothing is kept.
 *
 * A filter, search or page change drops every kept row, so one can never show up as a ghost elsewhere.
 */
export type LeavingRow = {
  /** The person as the API saved them (with the new status), so the row shows the change it is leaving for. */
  user: AdminUser;
  /** The ids that stood before it on the page, nearest first, to find its place again in the reloaded list. */
  before: string[];
  /**
   * Set when the dialog has closed and the exit starts (it would otherwise play under the dialog's backdrop). Rows
   * that start together share a batch and are removed together when it ends.
   */
  batch?: number;
};

/*===== Merge =====*/
/**
 * The page's rows with the leaving ones put back in place: each after the nearest row that stood before it and is
 * still there (or first, if none is). A leaving row the reload hasn't dropped yet is already in the list and isn't
 * added twice.
 */
export function withLeavingRows({
  rows,
  leaving,
}: {
  rows: readonly AdminUser[];
  leaving: readonly LeavingRow[];
}): AdminUser[] {
  const merged = [...rows];

  for (const row of leaving) {
    const present = merged.findIndex((user) => user.id === row.user.id);
    // Still in the list (the reload hasn't landed): show the saved copy, so the row answers with its new status.
    if (present >= 0) {
      merged[present] = row.user;
      continue;
    }
    const anchor = row.before.map((id) => merged.findIndex((user) => user.id === id)).find((index) => index >= 0);
    merged.splice(anchor === undefined ? 0 : anchor + 1, 0, row.user);
  }

  return merged;
}
