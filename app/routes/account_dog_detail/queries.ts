import { orpc } from "~/orpc/client";

/*===== Queries =====*/
/**
 * The page's reads for one dog, shared by the loader (which fills the cache) and the page (which reads it), so the two
 * never ask with different options. The dog, its evaluations and its enrollments make its status, which is the Admin's
 * answer: those are fresh for 30 seconds instead of the default 5 minutes (docs/tanstack-start/
 * tanstack-start-migration-plan.md, decision 2). The customer's own changes invalidate them anyway.
 */
export function dogDetailQueries(dogId: string) {
  const statusOptions = { staleTime: 30_000 };
  return {
    dog: orpc.dog.get.queryOptions({ input: { id: dogId }, ...statusOptions }),
    evaluations: orpc.evaluation.listMine.queryOptions({ input: { dogId }, ...statusOptions }),
    enrollments: orpc.enrollment.listMine.queryOptions({ input: { dogId }, ...statusOptions }),
    logbook: orpc.logbook.list.queryOptions({ input: { dogId } }),
    certificates: orpc.certificate.listMine.queryOptions({ input: { dogId } }),
    publicStatus: orpc.logbook.publicStatus.queryOptions({ input: { dogId } }),
  };
}
