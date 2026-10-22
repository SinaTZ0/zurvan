import { FAMILY_TABS } from "~/lib/course-families";
import type { CourseFamily } from "~/orpc/course/constants";
import type { Course } from "~/orpc/course/contract";
import { m } from "~/paraglide/messages";

/*===== Family Lines =====*/
// One plain line under each family's name: page copy, not the dog speaking. No counts, because the Admin can add
// courses and a number here would go stale. A family without a line (a new one nobody wrote for) gets just its name.
// Functions, not strings: a message is read while rendering, in the page's language.
const FAMILY_LINES: Partial<Record<CourseFamily, () => string>> = {
  basics: () => m.course_catalogue_family_line_basics(),
  "six-month": () => m.course_catalogue_family_line_six_month(),
  obedience: () => m.course_catalogue_family_line_obedience(),
  companion: () => m.course_catalogue_family_line_companion(),
  working: () => m.course_catalogue_family_line_working(),
  sport: () => m.course_catalogue_family_line_sport(),
};

export type FamilyGroup = {
  family: CourseFamily;
  label: string;
  /** `null` when the family has no line. */
  line: string | null;
  courses: Course[];
};

/*===== Grouping =====*/
/**
 * Splits one page of courses by family, in the order a dog meets them (`FAMILY_TABS`). Families with no course on this
 * page are left out, so a family split across two pages simply repeats its header on each. The courses keep the order
 * they came in within a group.
 */
export function groupByFamily({ courses }: { courses: Course[] }): FamilyGroup[] {
  return FAMILY_TABS.flatMap(({ family, label }) => {
    const inFamily = courses.filter((course) => course.family === family);
    return inFamily.length === 0 ? [] : [{ family, label, line: FAMILY_LINES[family]?.() ?? null, courses: inFamily }];
  });
}
