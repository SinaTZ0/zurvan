import { cn } from "cn";

import { formatNumberFa } from "~/lib/digits";
import type { AdminDog } from "~/orpc/dog/contract";

/*===== Constants =====*/
/** Three titles at most: a dog with six passed courses would otherwise make its row as tall as a screen. */
const SHOWN_COURSES = 3;

const CHIP = "inline-flex h-6 max-w-full items-center rounded-full border border-foreground/15 px-2.5 text-xs";

/*===== Passed Course Chips =====*/
/**
 * The courses a dog has passed, as ink-outlined chips (never gold: a passed course is done, nothing waits on it), with
 * «+۲» for the rest. A title too long for its column truncates instead of pushing the row wider.
 */
export function PassedCourseChips({ courses }: { courses: AdminDog["passedCourses"] }) {
  if (courses.length === 0) {
    // Only the register's own column says it; a phone's row is shorter without it, and no chip says the same.
    return <p className="hidden text-xs text-muted-foreground xl:block">دوره‌ای نگذرونده</p>;
  }

  const shown = courses.slice(0, SHOWN_COURSES);
  const rest = courses.length - shown.length;

  return (
    <ul aria-label="دوره‌های گذرونده" className="flex min-w-0 flex-wrap gap-1.5">
      {shown.map((course) => (
        <li key={course.slug} className={cn(CHIP, "text-foreground/85")}>
          <bdi className="truncate">{course.title}</bdi>
        </li>
      ))}
      {rest > 0 && (
        <li
          className={cn(CHIP, "text-muted-foreground tabular-nums")}
          aria-label={`و ${formatNumberFa(rest)} دوره‌ی دیگه`}
        >
          <bdi dir="ltr">{`+${formatNumberFa(rest)}`}</bdi>
        </li>
      )}
    </ul>
  );
}
