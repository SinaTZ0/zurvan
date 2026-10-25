import { cn } from "cn";

import { DogThumb } from "~/components/dog-thumb";
import { EnrollmentStatusBadge } from "~/components/enrollment-status-badge";
import { Link } from "~/components/link";
import { PlaceChip } from "~/components/place-chip";
import { Button } from "~/components/ui/button";
import { formatToman } from "~/lib/course-format";
import { formatJalaliTimestamp } from "~/lib/jalali";
import type { AdminEnrollment } from "~/orpc/enrollment/contract";
import type { FinishKind } from "~/routes/admin_enrollments/components/finish-dialog";

/*===== Types =====*/
/** How a closed line is leaving, once its exit has started. */
export type LineExit = { kind: FinishKind; fold: boolean };

/*===== Enrollment Line =====*/
/**
 * One dog taking one course, inside its customer's block: the dog (its page is a link away), the course, the price and
 * the purchase date, then the two endings. A closed line shows its chip and the day it ended instead of the buttons.
 * `showBadge` is for «همه», where lines of every status share the list: an active line's chip then sits after the dog's
 * name, so the buttons keep the same column in every view. The place the customer picked follows it, boarding in gold.
 *
 * Layout: phones stack it (the dog and the course, the price and the date, then the two buttons side by side, 44px);
 * from `md` it is one row in fixed columns, so the prices and the buttons line up from line to line and block to block.
 *
 * Leaving (page-motion.tsx): `leaving` marks a line he just closed, kept for its exit. It is inert at once (its buttons
 * can't be pressed twice); once `exit` is set the «تمام شد» stamp lands where the buttons were, or the line dims and
 * the course is struck through, and with `exit.fold` the row folds away. `stamped` presses in a closed line's new chip
 * in «همه», where the line stays.
 */
export function EnrollmentLine({
  enrollment,
  showBadge,
  leaving,
  exit,
  stamped,
  onFinish,
}: {
  enrollment: AdminEnrollment;
  showBadge: boolean;
  leaving: boolean;
  exit: LineExit | null;
  stamped: boolean;
  onFinish: (args: { enrollment: AdminEnrollment; kind: FinishKind }) => void;
}) {
  const { dog, course, status } = enrollment;
  const isActive = status === "active";
  const cancelling = exit?.kind === "cancel";

  return (
    <li
      inert={leaving}
      data-enrollment={enrollment.id}
      className={cn(
        // A grid of one row, so the fold can collapse it from `1fr` to `0fr`.
        "grid grid-rows-[1fr]",
        exit && ["ae-leaving", exit.fold && "ae-fold"],
      )}
    >
      <div className={cn("min-h-0", exit && "overflow-hidden")}>
        <div className="flex flex-col gap-3 py-4 md:grid md:grid-cols-[minmax(0,1fr)_8.5rem_11rem] md:items-center md:gap-5">
          {/*------ Dog and Course ------*/}
          <div className={cn("flex min-w-0 items-center gap-3", cancelling && "ae-dim")}>
            <DogThumb name={dog.name} photo={dog.photo} className="size-11 text-base md:size-12" />
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                {/* The dog's name opens its page (F2); the buttons stay the way to end the enrollment. */}
                <Link
                  to="/admin/dogs/$dogId"
                  params={{ dogId: dog.id }}
                  className="truncate rounded-sm text-sm font-bold underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <bdi>{dog.name}</bdi>
                </Link>
                {showBadge && isActive && <EnrollmentStatusBadge status={status} quiet />}
                {/* Where the customer asked for it; boarding (gold) means a call about its extra cost. */}
                {enrollment.place && <PlaceChip place={enrollment.place} />}
              </p>
              <p className="relative mt-0.5 w-fit max-w-full text-sm text-pretty text-foreground/85">
                {course.title}{" "}
                <bdi dir="ltr" className="text-xs text-muted-foreground">
                  {course.latinName}
                </bdi>
                {/*------ Strike ------*/}
                {cancelling && (
                  <span
                    aria-hidden
                    className="ae-strike pointer-events-none absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-foreground/80"
                  />
                )}
              </p>
            </div>
          </div>

          {/*------ Price and Date ------*/}
          <div
            className={cn(
              "flex items-baseline justify-between gap-4 ps-14 md:flex-col md:items-end md:gap-0.5 md:ps-0",
              cancelling && "ae-dim",
            )}
          >
            <p className="text-sm font-bold whitespace-nowrap tabular-nums">{formatToman(enrollment.price)}</p>
            <p className="text-xs whitespace-nowrap text-muted-foreground">
              خرید {formatJalaliTimestamp(enrollment.createdAt)}
            </p>
          </div>

          {/*------ Endings or Outcome ------*/}
          {isActive ? (
            <div className="relative">
              <div className={cn("grid grid-cols-2 gap-2 md:flex md:justify-end", exit && "ae-buttons-out")}>
                <Button
                  type="button"
                  variant="solid"
                  size="sm"
                  className="h-11 md:h-10 md:px-4"
                  onClick={() => onFinish({ enrollment, kind: "complete" })}
                >
                  تمام شد
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-11 border-foreground/15 bg-transparent text-destructive md:h-10 md:px-4 dark:bg-transparent"
                  onClick={() => onFinish({ enrollment, kind: "cancel" })}
                >
                  لغو
                </Button>
              </div>

              {/*------ Stamp ------*/}
              {/* Pressed where the buttons were: the ending he chose, said in the stamp's ink. */}
              {exit?.kind === "complete" && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 grid place-items-center md:justify-end"
                >
                  <span className="ae-stamp inline-flex items-center rounded-lg border-[3px] border-double border-success px-3 py-0.5 font-display text-lg font-black text-success md:me-6">
                    تمام شد
                  </span>
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 md:justify-end">
              <EnrollmentStatusBadge status={status} quiet className={cn(stamped && "ae-chip-stamp")} />
              <EndedOn enrollment={enrollment} />
            </div>
          )}
        </div>
      </div>
    </li>
  );
}

/*===== Ended On =====*/
/** The day a closed line ended, beside its chip (which already says how). An API row always has the matching date. */
function EndedOn({ enrollment }: { enrollment: AdminEnrollment }) {
  const when = enrollment.status === "completed" ? enrollment.completedAt : enrollment.cancelledAt;
  if (!when) return null;

  return <span className="text-xs whitespace-nowrap text-muted-foreground">{formatJalaliTimestamp(when)}</span>;
}
