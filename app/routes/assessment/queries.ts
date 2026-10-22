import { orpc } from "~/orpc/client";

/*===== Queries =====*/
// The page's reads, shared by the loader (which fills the cache) and the page (which reads it), so the two never ask
// with different options. Whether a dog can ask depends on the Admin's answers (evaluated, rejected), so these are fresh
// for 30 seconds instead of the default 5 minutes (docs/tanstack-start/tanstack-start-migration-plan.md, decision 2);
// the customer's own request invalidates them anyway.
const FRESH_FOR = 30_000;

export const dogsQuery = () => orpc.dog.list.queryOptions({ staleTime: FRESH_FOR });
export const evaluationsQuery = () => orpc.evaluation.listMine.queryOptions({ input: {}, staleTime: FRESH_FOR });
