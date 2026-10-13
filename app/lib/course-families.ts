import type { CourseFamily } from "~/orpc/course/constants";
import type { Course } from "~/orpc/course/contract";

/*===== Families =====*/
// The filter tabs, in the order a dog meets them. Behavior modification is dropped (app-spec), so it never gets a tab
// and its course is left out of the grid.
export const FAMILY_TABS: readonly { family: CourseFamily; label: string }[] = [
  { family: "basics", label: "پایه" },
  { family: "six-month", label: "شش‌ماهه‌ها" },
  { family: "obedience", label: "فرمان‌پذیری" },
  { family: "companion", label: "سگ همدم" },
  { family: "working", label: "سگ‌های کار" },
  { family: "sport", label: "ورزشی" },
];

const SHOWN_FAMILIES = new Set<CourseFamily>(FAMILY_TABS.map((tab) => tab.family));

/** Whether a course of this family appears in the catalogue at all. */
export function isShownFamily(family: CourseFamily): boolean {
  return SHOWN_FAMILIES.has(family);
}

/** The filter tabs for the families that have at least one course, so a tab never filters down to nothing. */
export function familiesWithCourses(courses: Course[]): { family: CourseFamily; label: string }[] {
  const present = new Set(courses.filter((course) => isShownFamily(course.family)).map((course) => course.family));
  return FAMILY_TABS.filter((tab) => present.has(tab.family));
}
