import { normalizeForSearch } from "~/lib/search";
import type { Course } from "~/orpc/course/contract";

/*===== Matching =====*/
/**
 * Whether a course answers a query. The title, the Latin name and the summary are each searched on their own, so a
 * query never matches across the seam between two of them. An empty query matches everything.
 */
export function matchesQuery({
  course,
  query,
}: {
  course: Pick<Course, "title" | "latinName" | "summary">;
  query: string;
}): boolean {
  const needle = normalizeForSearch(query);
  if (needle === "") return true;
  return [course.title, course.latinName, course.summary].some((field) => normalizeForSearch(field).includes(needle));
}
