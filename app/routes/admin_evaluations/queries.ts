import { orpc } from "~/orpc/client";

/*===== Queries =====*/
/**
 * The whole evaluation request list, for the loader and the page alike (one place, so the two can't drift). Customers
 * add to it, so it goes stale after 30 seconds rather than the default 5 minutes: a focus or a visit after that shows
 * the new requests (docs/tanstack-start/tanstack-start-migration-plan.md, decision 2).
 */
export function adminEvaluationsQueryOptions() {
  return orpc.evaluation.admin.list.queryOptions({ input: {}, staleTime: 30_000 });
}
