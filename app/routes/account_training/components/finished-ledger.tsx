import { EnrollmentStatusBadge } from "~/components/enrollment-status-badge";
import { Link } from "~/components/link";
import { enrollmentTitle } from "~/lib/enrollment-format";
import { formatJalaliDate } from "~/lib/jalali";
import { utcToTehranParts } from "~/lib/tehran-time";
import type { CustomerEnrollment } from "~/orpc/enrollment/contract";
import { AssessmentDogMark } from "~/routes/account_assessments/components/assessment-dog";

/** When it ended: the result's date, or the cancellation's. */
function endedAt(enrollment: CustomerEnrollment): Date {
  return enrollment.completedAt ?? enrollment.cancelledAt ?? enrollment.createdAt;
}

/*===== Finished Ledger =====*/
/** Everything that ended, newest first, as a ruled ledger: date, dog, course and how it ended. Each row opens it. */
export function FinishedLedger({ enrollments }: { enrollments: CustomerEnrollment[] }) {
  // oxlint-disable-next-line unicorn/no-array-sort -- `[...]` is a fresh array; `toSorted` needs ES2023 types.
  const rows = [...enrollments].sort((a, b) => endedAt(b).getTime() - endedAt(a).getTime());

  return (
    <ul className="divide-y border-y">
      {rows.map((enrollment) => (
        <li key={enrollment.id} className="group relative transition-colors hover:bg-primary/5">
          <div className="flex items-center gap-4 px-1 py-3 max-sm:flex-wrap max-sm:gap-x-3 max-sm:gap-y-1 sm:px-3">
            <span className="w-32 shrink-0 text-sm font-bold text-muted-foreground max-sm:w-full">
              {formatJalaliDate(utcToTehranParts(endedAt(enrollment)).date)}
            </span>
            <span className="flex min-w-0 flex-1 items-center gap-3">
              <AssessmentDogMark dog={enrollment.dog} />
              <span className="min-w-0">
                <span className="block truncate text-sm text-muted-foreground">{enrollment.dog.name}</span>
                <Link
                  to={`/account/training/${enrollment.id}`}
                  className="block font-bold text-pretty outline-none after:absolute after:inset-0 focus-visible:after:ring-3 focus-visible:after:ring-ring/50 focus-visible:after:ring-inset"
                >
                  {enrollmentTitle(enrollment)}
                </Link>
              </span>
            </span>
            <EnrollmentStatusBadge status={enrollment.status} />
          </div>
        </li>
      ))}
    </ul>
  );
}
