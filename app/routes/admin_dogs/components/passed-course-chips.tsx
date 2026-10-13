import { formatNumberFa } from "~/lib/digits";
import type { AdminDog } from "~/orpc/dog/contract";

/*===== Passed Course Chips =====*/
/** Three titles at most: a dog with six passed courses would otherwise make its row as tall as a screen. */
const SHOWN_COURSES = 3;

export function PassedCourseChips({ courses }: { courses: AdminDog["passedCourses"] }) {
  if (courses.length === 0) {
    return <p className="text-xs text-muted-foreground">دوره‌ای نگذرانده</p>;
  }

  const shown = courses.slice(0, SHOWN_COURSES);
  const rest = courses.length - shown.length;

  return (
    <ul className="flex flex-wrap gap-1.5">
      {shown.map((course) => (
        <li
          key={course.slug}
          className="inline-flex h-6 max-w-full items-center truncate rounded-full border border-border px-2.5 text-xs"
        >
          <bdi>{course.title}</bdi>
        </li>
      ))}
      {rest > 0 && (
        <li className="inline-flex h-6 items-center rounded-full border border-border px-2.5 text-xs text-muted-foreground tabular-nums">
          <bdi dir="ltr">{`+${formatNumberFa(rest)}`}</bdi>
        </li>
      )}
    </ul>
  );
}
