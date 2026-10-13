import { ArrowLeftIcon, CheckIcon } from "lucide-react";

import { EnrollmentStatusBadge } from "~/components/enrollment-status-badge";
import { Link } from "~/components/link";
import { formatNumberFa } from "~/lib/digits";
import { formatJalaliTimestamp } from "~/lib/jalali";
import type { Dog } from "~/orpc/dog/contract";
import type { Enrollment } from "~/orpc/enrollment/contract";

/*===== Constants =====*/
/** Passed courses shown as chips; the rest collapse into «+n». Dog Detail lists them all. */
const MAX_PASSED_CHIPS = 3;

/*===== Dog Card Courses =====*/
/**
 * The lower part of a dog's card: its active enrollments one line each, the courses it has passed as small chips, and
 * a quiet way to the dog's full history. The card holds no section of its own for these (F6): each dog carries its own.
 */
export function DogCardCourses({
  dogId,
  dogName,
  activeEnrollments,
  passedCourses,
}: {
  dogId: string;
  dogName: string;
  activeEnrollments: readonly Enrollment[];
  passedCourses: Dog["passedCourses"];
}) {
  const shownPassed = passedCourses.slice(0, MAX_PASSED_CHIPS);
  const hiddenPassed = passedCourses.length - shownPassed.length;

  return (
    <div className="mt-6 flex flex-col gap-4 border-t border-border pt-5">
      {/*------ Active Enrollments ------*/}
      {activeEnrollments.length > 0 && (
        <ul aria-label={`دوره‌های در حال آموزش ${dogName}`} className="divide-y divide-border rounded-2xl bg-sunken">
          {activeEnrollments.map((enrollment) => (
            <li
              key={enrollment.id}
              className="flex flex-col gap-1.5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-x-4"
            >
              <span className="font-bold">{enrollment.course.title}</span>
              <span className="flex items-center gap-3">
                <EnrollmentStatusBadge status={enrollment.status} />
                <span className="text-sm text-muted-foreground">از {formatJalaliTimestamp(enrollment.createdAt)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      {/*------ Passed Courses ------*/}
      {passedCourses.length > 0 && (
        <ul aria-label={`دوره‌های گذرانده‌ی ${dogName}`} className="flex flex-wrap items-center gap-2">
          {shownPassed.map((course) => (
            <li
              key={course.slug}
              className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-sunken ps-2.5 pe-3 text-sm"
            >
              <CheckIcon aria-hidden strokeWidth={2.5} className="size-4 text-primary" />
              {course.title}
            </li>
          ))}
          {hiddenPassed > 0 && (
            <li className="inline-flex h-8 items-center rounded-full border border-border bg-sunken px-3 text-sm text-muted-foreground">
              <span aria-hidden>+{formatNumberFa(hiddenPassed)}</span>
              <span className="sr-only">و {formatNumberFa(hiddenPassed)} دوره‌ی دیگر</span>
            </li>
          )}
        </ul>
      )}

      {/*------ History ------*/}
      <Link
        to={`/account/dogs/${dogId}`}
        className="group/history inline-flex w-fit items-center gap-1.5 rounded-sm text-sm font-bold text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
      >
        <span>
          همه‌ی سابقه‌ی <bdi>{dogName}</bdi>
        </span>
        <ArrowLeftIcon
          aria-hidden
          className="size-4 motion-safe:transition-transform motion-safe:group-hover/history:-translate-x-0.5"
        />
      </Link>
    </div>
  );
}
