import { ChevronLeftIcon } from "lucide-react";

import { Link } from "~/components/link";
import { SessionCard } from "~/components/session-card";
import { formatNumberFa } from "~/lib/digits";
import { formatSlotDay, formatSlotTime } from "~/lib/tehran-time";
import type { TrainerEnrollmentSummary } from "~/orpc/enrollment/contract";
import { DogMark } from "~/routes/trainer_enrollments/components/dog-mark";

const COLUMNS = "lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,1.5fr)_minmax(0,1fr)_1.5rem]";

/*===== Live Ledger =====*/
/**
 * Every dog in training as one ruled row: the dog, the course, its session strip, and what comes next. A session whose
 * time has passed without being recorded is said in the last column, since it is what the trainer must do first.
 *
 * @param now Passed from the loader so the server and the browser agree on what is overdue.
 */
export function LiveLedger({ enrollments, now }: { enrollments: readonly TrainerEnrollmentSummary[]; now: Date }) {
  return (
    <section aria-labelledby="live-title">
      <h2 id="live-title" className="mb-3 text-lg font-extrabold">
        در جریان
      </h2>

      {/*------ Column Heads ------*/}
      <div aria-hidden className={`hidden gap-x-5 border-b px-3 pb-2 text-sm text-muted-foreground lg:grid ${COLUMNS}`}>
        <span>سگ</span>
        <span>دوره</span>
        <span>جلسه‌ها</span>
        <span>جلسه‌ی بعد</span>
        <span />
      </div>

      <ul className="divide-y border-b max-lg:border-t">
        {enrollments.map((enrollment) => (
          <li key={enrollment.id}>
            <Link
              to={`/trainer/enrollments/${enrollment.id}`}
              className={`grid items-center gap-x-5 gap-y-3 px-1 py-4 transition-colors outline-none hover:bg-primary/5 focus-visible:bg-primary/5 focus-visible:ring-3 focus-visible:ring-ring/50 sm:px-3 ${COLUMNS}`}
            >
              <span className="flex min-w-0 items-center gap-3">
                <DogMark name={enrollment.dog.name} photo={enrollment.dog.photo} />
                <span className="min-w-0">
                  <span className="block truncate font-bold">{enrollment.dog.name}</span>
                  <span className="block truncate text-sm text-muted-foreground">{enrollment.customerName}</span>
                </span>
              </span>
              <span className="min-w-0 text-pretty">{enrollment.course.title}</span>
              <SessionCard plannedSessions={enrollment.plannedSessions} sessions={enrollment.sessions} size="strip" />
              <NextSession enrollment={enrollment} now={now} />
              <ChevronLeftIcon aria-hidden className="hidden size-5 text-muted-foreground lg:block" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/*===== Next Session =====*/
function NextSession({ enrollment, now }: { enrollment: TrainerEnrollmentSummary; now: Date }) {
  const overdue = enrollment.sessions.filter(
    (session) => session.status === "scheduled" && session.startsAt.getTime() <= now.getTime(),
  ).length;
  const { nextSession } = enrollment;

  return (
    <span className="flex flex-col gap-0.5 text-sm">
      {overdue > 0 && <span className="font-bold text-primary">{formatNumberFa(overdue)} جلسه منتظر ثبت است</span>}
      {nextSession ? (
        <span>
          <span className="lg:sr-only">جلسه‌ی بعد: </span>
          {formatSlotDay(nextSession.startsAt)}،{" "}
          <span className="font-bold tabular-nums">{formatSlotTime(nextSession.startsAt)}</span>
        </span>
      ) : (
        <span className="text-muted-foreground">جلسه‌ی بعدی گذاشته نشده</span>
      )}
    </span>
  );
}
