import { z } from "zod";

import type { EvaluationStatus } from "~/orpc/evaluation/constants";

/*===== Constants =====*/
/** The status pills, in the order they show: «همه» last. */
export const EVALUATION_FILTERS = [
  "requested",
  "evaluated",
  "rejected",
  "withdrawn",
  "all",
] as const satisfies readonly (EvaluationStatus | "all")[];

export type EvaluationFilter = (typeof EVALUATION_FILTERS)[number];

/** The filter an absent `?status=` means; links leave it out of the URL. */
export const DEFAULT_EVALUATION_FILTER = "requested" satisfies EvaluationFilter;

/*===== Search Schema =====*/
// Neither is in the loader's deps: the loader fetches the whole list once and the page filters it, so a change never
// needs a loader run. `evaluation` (the open drawer) is pushed as a history entry, so Back closes the drawer; absent
// means closed. A hand-typed bad value is dropped (`.catch`) instead of failing the page.
export const adminEvaluationsSearchSchema = z.object({
  status: z.enum(EVALUATION_FILTERS).optional().catch(undefined),
  evaluation: z.string().optional().catch(undefined),
});

export type AdminEvaluationsSearch = z.infer<typeof adminEvaluationsSearchSchema>;
