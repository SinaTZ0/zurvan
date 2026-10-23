import { formatNumber } from "~/lib/locale-format";
import { m } from "~/paraglide/messages";

/*===== Counted Words =====*/
// "1 course", "3 courses" in English; Persian says «۱ دوره» and «۳ دوره» alike, so both keys hold the same text there.
// Read while rendering, never at module level.

/** «۳ دوره» / "3 courses". */
export function countCourses(count: number): string {
  const params = { count: formatNumber(count) };
  return count === 1 ? m.account_cart_courses_one(params) : m.account_cart_courses_other(params);
}

/** «۲ سگ» / "2 dogs". */
export function countDogs(count: number): string {
  const params = { count: formatNumber(count) };
  return count === 1 ? m.account_cart_dogs_one(params) : m.account_cart_dogs_other(params);
}
