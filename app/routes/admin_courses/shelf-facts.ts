import { describeAge, describeSessions } from "~/lib/course-format";
import { FAMILY_TABS } from "~/lib/course-families";
import { COURSE_PLACE_LABELS } from "~/orpc/course/constants";
import type { AdminCourse } from "~/orpc/course/contract";

/*===== Shelf Facts =====*/
/**
 * A course's facts on one muted line: «پایه، از ۲ ماهگی، حدوداً ۵ جلسه، منزل/بیرون/پانسیون». The words are the
 * storefront's (`course-format.ts`), except two: the places are joined by slashes, so they read as one fact among the
 * commas, and where the sessions and the places are both left to the evaluation the shelf names both once instead of
 * saying «بعد از ارزیابی» twice in a row. The recommended place says so.
 */
export function describeShelfFacts(course: AdminCourse): string {
  const family = FAMILY_TABS.find((tab) => tab.family === course.family)?.label;
  const later =
    course.sessionCount === null && course.places.length === 0
      ? ["جلسه‌ها و جا بعد از ارزیابی"]
      : [
          course.sessionCount === null ? "جلسه‌ها بعد از ارزیابی" : describeSessions(course),
          course.places.length === 0
            ? "جا بعد از ارزیابی"
            : course.places
                .map(
                  (place) =>
                    `${COURSE_PLACE_LABELS[place]}${place === course.recommendedPlace ? "\u00a0(پیشنهادی)" : ""}`,
                )
                .join("/"),
        ];

  return [family, describeAge(course), ...later].filter(Boolean).join("، ");
}
