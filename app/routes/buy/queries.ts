import { orpc } from "~/orpc/client";

/*===== Queries =====*/
// The page's reads of the customer's dogs, shared by the loader (which fills the cache) and the page (which reads it),
// so the two never ask with different options. What a dog can take follows the Admin's answers (evaluated, a course
// marked done), so these are fresh for 30 seconds instead of the default 5 minutes
// (docs/tanstack-start/tanstack-start-migration-plan.md, decision 2).
const FRESH_FOR = 30_000;

export const dogsQuery = () => orpc.dog.list.queryOptions({ staleTime: FRESH_FOR });
export const dogCoursesQuery = (dogId: string) =>
  orpc.checkout.dogCourses.queryOptions({ input: { dogId }, staleTime: FRESH_FOR });
