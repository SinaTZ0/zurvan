import { cn } from "cn";
import { useId } from "react";

import { ADMIN_HAIRLINE, ADMIN_PLATE } from "~/lib/admin-plate";
import type { AdminEnrollment } from "~/orpc/enrollment/contract";
import { CallCard } from "~/routes/admin_enrollments/components/call-card";
import { EnrollmentLine, type LineExit } from "~/routes/admin_enrollments/components/enrollment-line";
import type { FinishKind } from "~/routes/admin_enrollments/components/finish-dialog";
import type { CustomerBlockData } from "~/routes/admin_enrollments/group-by-customer";

/*===== Types =====*/
/** Where each closed line of the view stands in its exit, by enrollment id. */
export type LineMotion = {
  /** Kept for their exit; inert at once. */
  leaving: ReadonlyMap<string, FinishKind>;
  /** Their exit has started (the dialog has closed). */
  playing: ReadonlySet<string>;
};

/*===== Customer Block =====*/
/**
 * One person to call and everything of theirs the view lists, on one plate: the call card as its stub, torn from the
 * lines by the slip's dashed tear. From `xl` the card is the start column (4/12) beside the lines (8/12); below that it
 * is a band on top.
 *
 * When every line of the block is leaving, the whole block folds (and its lines only stamp, so the two folds don't
 * fight). `rise` is the block's place in a list that just arrived under a new filter or page (`null` when it didn't).
 */
export function CustomerBlock({
  block,
  showBadge,
  motion,
  stamped,
  rise,
  onFinish,
}: {
  block: CustomerBlockData;
  showBadge: boolean;
  motion: LineMotion;
  /** Closed lines whose new chip is pressed in («همه»). */
  stamped: ReadonlySet<string>;
  rise: number | null;
  onFinish: (args: { enrollment: AdminEnrollment; kind: FinishKind }) => void;
}) {
  const { customer, lines } = block;
  const headingId = useId();

  const allLeaving = lines.every((line) => motion.leaving.has(line.id));
  const folding = allLeaving && lines.every((line) => motion.playing.has(line.id));
  const dogCount = new Set(lines.map((line) => line.dog.id)).size;

  return (
    <li
      inert={allLeaving}
      // A grid of one row, so the fold can collapse it; the gap between blocks is padding inside it, so it folds too.
      className={cn("grid grid-rows-[1fr]", folding && "ae-leaving ae-fold")}
    >
      <div className={cn("min-h-0 pb-4", folding && "overflow-hidden")}>
        <article
          aria-labelledby={headingId}
          className={cn(ADMIN_PLATE, "relative overflow-hidden xl:grid xl:grid-cols-12", rise !== null && "answer-in")}
          style={rise !== null ? ({ "--answer-delay": `${rise}s` } as React.CSSProperties) : undefined}
        >
          {/*===== Who to Call =====*/}
          <div className="xl:col-span-4">
            <CallCard customer={customer} lineCount={lines.length} dogCount={dogCount} headingId={headingId} />
          </div>

          {/*===== Their Enrollments =====*/}
          <ul
            className={cn(
              "divide-y px-4 pt-1 pb-1 sm:px-5 xl:col-span-8 xl:self-center xl:px-6 xl:py-2",
              ADMIN_HAIRLINE,
            )}
          >
            {lines.map((enrollment) => {
              const kind = motion.leaving.get(enrollment.id);
              const exit: LineExit | null = kind && motion.playing.has(enrollment.id) ? { kind, fold: !folding } : null;
              return (
                <EnrollmentLine
                  key={enrollment.id}
                  enrollment={enrollment}
                  showBadge={showBadge}
                  leaving={kind !== undefined}
                  exit={exit}
                  stamped={stamped.has(enrollment.id)}
                  onFinish={onFinish}
                />
              );
            })}
          </ul>
        </article>
      </div>
    </li>
  );
}
