import type { CourseFamily } from "~/orpc/course/constants";
import type { Course } from "~/orpc/course/contract";
import { m } from "~/paraglide/messages";

/*===== Families =====*/
// The filter tabs, in the order a dog meets them. Behavior modification is dropped (app-spec), so it never gets a tab
// and its course is left out of the grid. The labels are messages read through getters, in the page's language.
export const FAMILY_TABS: readonly { family: CourseFamily; readonly label: string }[] = [
  {
    family: "basics",
    get label() {
      return m.shared_family_basics();
    },
  },
  {
    family: "six-month",
    get label() {
      return m.shared_family_six_month();
    },
  },
  {
    family: "obedience",
    get label() {
      return m.shared_family_obedience();
    },
  },
  {
    family: "companion",
    get label() {
      return m.shared_family_companion();
    },
  },
  {
    family: "working",
    get label() {
      return m.shared_family_working();
    },
  },
  {
    family: "sport",
    get label() {
      return m.shared_family_sport();
    },
  },
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
