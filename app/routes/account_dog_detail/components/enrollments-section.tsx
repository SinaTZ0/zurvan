import { EnrollmentStatusBadge } from "~/components/enrollment-status-badge";
import { Link } from "~/components/link";
import { formatJalaliTimestamp } from "~/lib/jalali";
import type { Enrollment } from "~/orpc/enrollment/contract";

/*===== Date Line =====*/
// Each status says the date that belongs to it; an ended enrollment's own date is always set, but falls back to the
// purchase date rather than showing nothing.
function describeDates(enrollment: Enrollment): string {
  if (enrollment.status === "completed" && enrollment.completedAt) {
    return `تمام شد ${formatJalaliTimestamp(enrollment.completedAt)}`;
  }
  if (enrollment.status === "cancelled" && enrollment.cancelledAt) {
    return `لغو شد ${formatJalaliTimestamp(enrollment.cancelledAt)}`;
  }
  return `از ${formatJalaliTimestamp(enrollment.createdAt)}`;
}

/*===== Enrollments Section =====*/
/**
 * F6 on the dog's page: the courses it bought, active ones first (the API orders them). No prices; those are on
 * Purchases.
 */
export function EnrollmentsSection({ enrollments, isEvaluated }: { enrollments: Enrollment[]; isEvaluated: boolean }) {
  return (
    <section aria-labelledby="enrollments-title">
      <h2 id="enrollments-title" className="font-sans text-xl font-extrabold">
        دوره‌ها
      </h2>

      {enrollments.length === 0 ? (
        <div className="mt-4 rounded-3xl border bg-card p-5 sm:p-6">
          <p className="font-bold">هنوز دوره‌ای نخریدم</p>
          {isEvaluated && (
            <Link
              to="/#courses"
              className="mt-2 inline-block rounded-sm text-sm font-bold text-primary underline-offset-4 hover:underline"
            >
              دوره‌ها را ببین
            </Link>
          )}
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {enrollments.map((enrollment) => (
            <li
              key={enrollment.id}
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-3xl border bg-card p-5"
            >
              <div className="min-w-0">
                <h3 className="font-sans font-bold text-pretty">{enrollment.course.title}</h3>
                <p dir="ltr" className="mt-0.5 text-start text-sm text-muted-foreground">
                  {enrollment.course.latinName}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <EnrollmentStatusBadge status={enrollment.status} />
                <p className="text-sm text-muted-foreground">{describeDates(enrollment)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
