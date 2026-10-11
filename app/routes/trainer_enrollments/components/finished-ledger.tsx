import { ChevronLeftIcon } from "lucide-react";

import { EnrollmentStatusBadge } from "~/components/enrollment-status-badge";
import { Link } from "~/components/link";
import { SessionCard } from "~/components/session-card";
import { formatJalaliDate } from "~/lib/jalali";
import { utcToTehranParts } from "~/lib/tehran-time";
import type { TrainerEnrollment } from "~/orpc/enrollment/contract";
import { DogMark } from "~/routes/trainer_enrollments/components/dog-mark";

/*===== Finished Ledger =====*/
/** Passed, failed and cancelled courses, newest first: the date it ended, the dog, the course and how it ended. */
export function FinishedLedger({ enrollments }: { enrollments: readonly TrainerEnrollment[] }) {
  return (
    <section aria-labelledby="finished-title">
      <h2 id="finished-title" className="mb-3 text-lg font-extrabold">
        تمام‌شده
      </h2>
      <ul className="divide-y border-y">
        {enrollments.map((enrollment) => {
          const endedAt = enrollment.completedAt ?? enrollment.cancelledAt;
          return (
            <li key={enrollment.id}>
              <Link
                to={`/trainer/enrollments/${enrollment.id}`}
                className="flex items-center gap-x-4 gap-y-2 px-1 py-3 transition-colors outline-none hover:bg-primary/5 focus-visible:bg-primary/5 focus-visible:ring-3 focus-visible:ring-ring/50 max-sm:flex-wrap sm:px-3"
              >
                <span className="w-28 shrink-0 text-sm font-bold text-muted-foreground max-sm:w-full sm:w-32">
                  {endedAt ? formatJalaliDate(utcToTehranParts(endedAt).date) : "—"}
                </span>
                <span className="flex min-w-0 flex-1 items-center gap-3">
                  <DogMark name={enrollment.dog.name} photo={enrollment.dog.photo} />
                  <span className="min-w-0">
                    <span className="block truncate font-bold">{enrollment.dog.name}</span>
                    <span className="block truncate text-sm text-muted-foreground">{enrollment.course.title}</span>
                  </span>
                </span>
                <SessionCard
                  plannedSessions={enrollment.plannedSessions}
                  sessions={enrollment.sessions}
                  size="strip"
                  className="hidden lg:block lg:max-w-60"
                />
                <EnrollmentStatusBadge status={enrollment.status} />
                <ChevronLeftIcon aria-hidden className="hidden size-5 text-muted-foreground sm:block" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
