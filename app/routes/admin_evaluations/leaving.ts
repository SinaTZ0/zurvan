import type { AdminEvaluation } from "~/orpc/evaluation/contract";
import type { AnswerKind } from "~/routes/admin_evaluations/schema";

/*===== Types =====*/
/**
 * A request the Admin just answered in «در انتظار», kept for a moment so it can be stamped and fold away before it
 * leaves the queue. The write has succeeded; `useAdminAction` then reloads the list, and the reloaded queue no longer
 * has it, so the page puts this copy back where it stood until its exit has played.
 *
 * It only lives in «در انتظار»: a filter change drops every kept row, so it can never show up as a ghost elsewhere.
 */
export type LeavingRow = {
  /** The request as it was on screen when he confirmed (still waiting). */
  evaluation: AdminEvaluation;
  kind: AnswerKind;
  /** The ids that stood before it in the queue, nearest first, to find its place again in the reloaded list. */
  before: string[];
  /**
   * Set when the dialog has closed and the exit starts (the stamp would otherwise land under the dialog's backdrop).
   * Rows that start together share a batch and are removed together when it ends.
   */
  batch?: number;
};

/*===== Merge =====*/
/**
 * The reloaded rows with the leaving ones put back in place: each after the nearest row that stood before it and is
 * still there (or first, if none is). A leaving row the reload hasn't dropped yet is already in the list and isn't
 * added twice.
 */
export function withLeavingRows({
  rows,
  leaving,
}: {
  rows: readonly AdminEvaluation[];
  leaving: readonly LeavingRow[];
}): AdminEvaluation[] {
  const merged = [...rows];

  for (const row of leaving) {
    if (merged.some((evaluation) => evaluation.id === row.evaluation.id)) continue;
    const anchor = row.before
      .map((id) => merged.findIndex((evaluation) => evaluation.id === id))
      .find((index) => index >= 0);
    merged.splice(anchor === undefined ? 0 : anchor + 1, 0, row.evaluation);
  }

  return merged;
}
