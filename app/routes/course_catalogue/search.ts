import { FAMILY_TABS } from "~/lib/course-families";
import { normalizeForSearch } from "~/lib/search";
import type { Course } from "~/orpc/course/contract";

/*===== Matching =====*/
/**
 * Whether a course answers a query. Each searchable field is compared on its own, so a query never matches across the
 * seam between two of them. The fields are the title, the Latin name, the summary, the family's tab label (the course's
 * kind: «فرمان‌پذیری»، «سگ همدم»…), the results it promises (`highlights`) and the lines of its curriculum (`commands`,
 * which hold a sport course's branches such as BH or IGP). An empty query matches everything.
 */
export function matchesQuery({
  course,
  query,
}: {
  course: Pick<Course, "title" | "latinName" | "summary" | "family" | "highlights" | "commands">;
  query: string;
}): boolean {
  const needle = normalizeForSearch(query);
  if (needle === "") return true;

  const familyLabel = FAMILY_TABS.find((tab) => tab.family === course.family)?.label ?? "";
  return [course.title, course.latinName, course.summary, familyLabel, ...course.highlights, ...course.commands].some(
    (field) => normalizeForSearch(field).includes(needle),
  );
}
