import type { FinishKind } from "~/routes/admin_enrollments/components/finish-dialog";
import type { AdminEnrollment } from "~/orpc/enrollment/contract";
import type { EnrollmentFilter } from "~/routes/admin_enrollments/search-params";

/*===== Types =====*/
/**
 * A line the Admin just closed, kept for a moment so it can be stamped (or struck through) and fold away before it
 * leaves the list. The write has succeeded; `useAdminAction` then reloads the list, and the reloaded «در حال آموزش» list
 * no longer has it, so the page puts this copy back where it stood until its exit has played.
 *
 * It belongs to the view it was closed in (`filter`, `page`): a filter or page change drops it, so it can never show up
 * as a ghost in another view.
 */
export type LeavingLine = {
  /** The line as it was on screen when he confirmed (still active). */
  enrollment: AdminEnrollment;
  kind: FinishKind;
  filter: EnrollmentFilter;
  page: number;
  /** The ids that stood before it in the list, nearest first, to find its place again in the reloaded list. */
  before: string[];
  /**
   * Set when the dialog has closed and the exit starts (the stamp would otherwise land under the dialog's backdrop).
   * Lines that start together share a batch and are removed together when it ends.
   */
  batch?: number;
};

/*===== Merge =====*/
/**
 * The reloaded lines with the leaving ones put back in place: each after the nearest line that stood before it and is
 * still there (or first, if none is). A leaving line the reload hasn't dropped yet is already in the list and isn't
 * added twice.
 */
export function withLeavingLines({
  lines,
  leaving,
}: {
  lines: readonly AdminEnrollment[];
  leaving: readonly LeavingLine[];
}): AdminEnrollment[] {
  const merged = [...lines];

  for (const line of leaving) {
    if (merged.some((enrollment) => enrollment.id === line.enrollment.id)) continue;
    const anchor = line.before
      .map((id) => merged.findIndex((enrollment) => enrollment.id === id))
      .find((index) => index >= 0);
    merged.splice(anchor === undefined ? 0 : anchor + 1, 0, line.enrollment);
  }

  return merged;
}
