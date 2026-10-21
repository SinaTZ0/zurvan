import type { AdminEvaluation } from "~/orpc/evaluation/contract";
import { tehranDay } from "~/routes/admin_evaluations/dates";

/*===== Types =====*/
/** A run of requests that came in on the same Tehran day, in the list's own order. */
export type DayGroup = { day: string; rows: AdminEvaluation[] };

/*===== Group by Day =====*/
/**
 * Splits the queue into runs of the same request day, keeping the server's order (waiting first, then newest). A
 * single-status view is newest first, so each day is one run; «همه» lists the waiting ones first, so a day can show
 * up once among them and again among the answered ones, which is the order he reads them in.
 */
export function groupByDay(rows: readonly AdminEvaluation[]): DayGroup[] {
  const groups: DayGroup[] = [];

  for (const row of rows) {
    const day = tehranDay(row.createdAt);
    const last = groups.at(-1);
    if (last?.day === day) last.rows.push(row);
    else groups.push({ day, rows: [row] });
  }

  return groups;
}
