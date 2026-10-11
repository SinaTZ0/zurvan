import { DogTag } from "~/components/dog-tag";
import { Link } from "~/components/link";
import { buttonVariants } from "~/components/ui/button";
import { formatNumberFa } from "~/lib/digits";
import { formatSlotDay, formatSlotTime } from "~/lib/tehran-time";
import type { ScheduleSlot } from "~/orpc/assessment/contract";
import type { TrainerSession } from "~/orpc/enrollment/contract";
import type { SessionPosition } from "~/routes/trainer_schedule/session-positions";

type WaitingSlot = ScheduleSlot & { assessment: NonNullable<ScheduleSlot["assessment"]> };

/*===== Awaiting Outcome =====*/
/**
 * Everything whose time has passed and isn't recorded: booked assessments, and training sessions still `scheduled`.
 * The trainer's real to-do, so it comes before the week. Each row goes straight to the page where it is recorded, the
 * oldest first.
 */
export function AwaitingOutcome({
  slots,
  sessions,
  positions,
}: {
  slots: readonly WaitingSlot[];
  sessions: readonly TrainerSession[];
  positions: Record<string, SessionPosition>;
}) {
  const rows = [
    ...slots.map((slot) => ({ kind: "assessment" as const, key: slot.id, startsAt: slot.startsAt, slot })),
    ...sessions.map((session) => ({ kind: "session" as const, key: session.id, startsAt: session.startsAt, session })),
  ].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

  return (
    <section
      aria-labelledby="waiting-title"
      className="rounded-xl border border-s-4 border-s-primary bg-card px-4 py-4 shadow-xs lg:max-w-176 lg:px-5"
    >
      <h2 id="waiting-title" className="font-extrabold">
        منتظر نتیجه ({formatNumberFa(rows.length)})
      </h2>
      <ul className="mt-2 divide-y">
        {rows.map((row) => {
          const dogName = row.kind === "assessment" ? row.slot.assessment.dog.name : row.session.dog.name;
          const position = row.kind === "session" ? positions[row.session.id] : undefined;

          return (
            <li key={row.key} className="flex flex-wrap items-center gap-x-4 gap-y-3 py-3">
              <DogTag name={dogName} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{dogName}</p>
                <p className="text-sm text-muted-foreground">
                  {row.kind === "session" && (
                    <>
                      {row.session.courseTitle}
                      {position &&
                        `، جلسه‌ی ${formatNumberFa(position.position)} از ${formatNumberFa(position.planned)}`}
                      {"؛ "}
                    </>
                  )}
                  {formatSlotDay(row.startsAt)}، <span className="tabular-nums">{formatSlotTime(row.startsAt)}</span>
                </p>
              </div>
              {row.kind === "assessment" ? (
                <Link
                  to={`/trainer/assessments/${row.slot.assessment.id}`}
                  aria-label={`ثبت نتیجه‌ی ${dogName}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  نتیجه را ثبت کن
                </Link>
              ) : (
                <Link
                  to={`/trainer/enrollments/${row.session.enrollmentId}`}
                  aria-label={`ثبت جلسه‌ی ${dogName}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  جلسه را ثبت کن
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
