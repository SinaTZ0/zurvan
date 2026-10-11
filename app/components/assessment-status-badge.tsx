import { cn } from "cn";

import { ASSESSMENT_STATUS_LABELS, type AssessmentStatus } from "~/orpc/assessment/constants";

/*===== Tones =====*/
// One look per status, shared by the customer's and the trainer's pages. Gold marks what is still to come, green what
// happened; the two endings that didn't happen stay quiet, since neither is an error the reader must act on.
const TONES: Record<AssessmentStatus, string> = {
  booked: "border-primary/50 text-primary",
  completed: "border-success/40 bg-success/10 text-success",
  "no-show": "border-border text-muted-foreground",
  cancelled: "border-transparent bg-muted text-muted-foreground",
};

/*===== Assessment Status Badge =====*/
/** An assessment's status as a small pill with its Persian label. */
export function AssessmentStatusBadge({ status, className }: { status: AssessmentStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center rounded-full border px-2.5 text-xs font-bold whitespace-nowrap",
        TONES[status],
        className,
      )}
    >
      {ASSESSMENT_STATUS_LABELS[status]}
    </span>
  );
}
