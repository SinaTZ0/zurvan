import { describeAge, describePlace, describeSessions } from "~/lib/course-format";
import { FAMILY_TABS } from "~/lib/course-families";
import type { AdminCourse } from "~/orpc/course/contract";

/*===== Shelf Facts =====*/
/**
 * A course's facts on one muted line: «پایه، از ۲ ماهگی، حدوداً ۵ جلسه، منزل». The words are the storefront's
 * (`course-format.ts`), except where the sessions and the place are both left to the evaluation: the shared helpers
 * would say «بعد از ارزیابی» twice in a row, so the shelf names both once.
 */
export function describeShelfFacts(course: AdminCourse): string {
  const family = FAMILY_TABS.find((tab) => tab.family === course.family)?.label;
  const later =
    course.sessionCount === null && course.place === null
      ? ["جلسه‌ها و جا بعد از ارزیابی"]
      : [
          course.sessionCount === null ? "جلسه‌ها بعد از ارزیابی" : describeSessions(course),
          course.place === null ? "جا بعد از ارزیابی" : describePlace(course),
        ];

  return [family, describeAge(course), ...later].filter(Boolean).join("، ");
}
