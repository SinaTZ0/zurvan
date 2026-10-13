import { toLatinDigits } from "~/lib/digits";
import type { Course } from "~/orpc/course/contract";

/*===== Normalization =====*/
/**
 * Folds a piece of text so that the ways Persian gets typed all compare equal: Arabic ي/ك become ی/ک, diacritics, the
 * tatweel, ZWNJ and spaces disappear («سگ همدم» and «سگ‌همدم» and «سگهمدم» are one word), Persian and Arabic-Indic digits
 * become Latin, and Latin letters lose their case.
 */
export function normalizeForSearch(text: string): string {
  return toLatinDigits(text)
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[ً-ٟـ‌‍\s]+/g, "")
    .toLowerCase();
}

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
