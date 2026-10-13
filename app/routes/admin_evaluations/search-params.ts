import { createSerializer, parseAsString, parseAsStringLiteral } from "nuqs/server";

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

/** The page's own path, which the row links are built on. */
export const ADMIN_EVALUATIONS_PATH = "/admin/evaluations";

/*===== Parsers =====*/
// Both are shallow: the loader fetches the whole list once and the page filters it, so a change never needs a loader
// run. `evaluation` (the open drawer) pushes a history entry, so Back closes the drawer; it has no default because
// "absent" means closed.
export const adminEvaluationsSearchParams = {
  status: parseAsStringLiteral(EVALUATION_FILTERS).withDefault("requested").withOptions({ shallow: true }),
  evaluation: parseAsString.withOptions({ shallow: true, history: "push" }),
};

/*===== Links =====*/
export const serializeAdminEvaluationsSearchParams = createSerializer(adminEvaluationsSearchParams);
